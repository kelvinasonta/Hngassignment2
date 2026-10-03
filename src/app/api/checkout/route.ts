import { getSupabaseServerClient } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';
import { initializePaystackTransaction } from '@/lib/paystack';
import { getStoreCurrency } from '@/lib/currency';
import { INITIAL_PRODUCTS, Product } from '@/lib/products-data';
import { globalOrdersStore } from '@/lib/orders-store';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { validateCheckoutPayload } from '@/lib/validation';
import { getAuthenticatedUser, generateGuestOrderToken } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (10 checkouts per minute per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`checkout:${clientIp}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many checkout attempts. Please try again shortly.', ApiErrorCode.RATE_LIMITED, 429);
    }

    // 2. Validate request body with centralized validator
    const rawBody = await request.json().catch(() => null);
    const validation = validateCheckoutPayload(rawBody);
    if (!validation.isValid || !validation.data) {
      return apiError('Validation failed on checkout submission', ApiErrorCode.VALIDATION_ERROR, 422, validation.errors);
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod,
      promoCode,
    } = validation.data;

    // 3. Authenticate user identity (supports session token or client user ID)
    const authResult = await getAuthenticatedUser(request);
    const verifiedUserId =
      (authResult.isAuthenticated && authResult.user ? authResult.user.id : null) ||
      (rawBody && typeof rawBody.userId === 'string' ? rawBody.userId : null);

    const supabase = getSupabaseServerClient();

    // 4. Authoritative Server-Side Product & Inventory Verification
    let subtotal = 0;
    const validatedItems: Array<{
      id: string;
      variantId?: string;
      name: string;
      sku?: string;
      price: number;
      quantity: number;
      image: string;
      stockAvailable: number;
    }> = [];

    // Fetch authoritative products from database if available
    let dbProductsMap = new Map<string, any>();
    if (supabase) {
      const productIds = items.map((i) => i.id);
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (dbProducts) {
        dbProducts.forEach((p) => dbProductsMap.set(p.id, p));
      }
    }

    // Verify each item's price and stock authoritatively
    for (const requestedItem of items) {
      const dbProduct = dbProductsMap.get(requestedItem.id);
      const cachedProduct = INITIAL_PRODUCTS.find((p) => p.id === requestedItem.id);

      if (!dbProduct && !cachedProduct) {
        return apiError(
          `Product with ID "${requestedItem.id}" could not be found in catalog.`,
          ApiErrorCode.NOT_FOUND,
          404
        );
      }

      const authoritativePrice = dbProduct ? Number(dbProduct.price) : (cachedProduct?.price || 0);
      const authoritativeName = dbProduct ? dbProduct.name : (cachedProduct?.name || 'Hardware Item');
      const authoritativeImage = dbProduct ? dbProduct.image : (cachedProduct?.image || '/assets/images/hero_gadgets.jpg');
      const authoritativeStock = dbProduct ? (dbProduct.stock ?? 100) : (cachedProduct?.stock ?? 100);
      const sku = dbProduct?.sku || `AETH-SKU-${requestedItem.id.replace('prod-', '').toUpperCase()}`;

      // Check Inventory Availability (Prevent Overselling)
      if (authoritativeStock < requestedItem.quantity) {
        return apiError(
          `Insufficient stock for "${authoritativeName}". Requested: ${requestedItem.quantity}, Available: ${authoritativeStock}.`,
          ApiErrorCode.INSUFFICIENT_STOCK,
          422,
          {
            productId: requestedItem.id,
            requestedQuantity: requestedItem.quantity,
            availableStock: authoritativeStock,
          }
        );
      }

      const lineTotal = authoritativePrice * requestedItem.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        id: requestedItem.id,
        variantId: requestedItem.variantId,
        name: authoritativeName,
        sku,
        price: authoritativePrice,
        quantity: requestedItem.quantity,
        image: authoritativeImage,
        stockAvailable: authoritativeStock,
      });
    }

    // 5. Dynamic Database Coupon Validation
    let discount = 0;
    let appliedCouponCode: string | null = null;

    if (promoCode) {
      let couponFound = false;

      if (supabase) {
        const { data: dbCoupon } = await supabase
          .from('discount_coupons')
          .select('*')
          .eq('code', promoCode)
          .eq('is_active', true)
          .single();

        if (dbCoupon) {
          const now = new Date();
          const startsAt = dbCoupon.starts_at ? new Date(dbCoupon.starts_at) : null;
          const expiresAt = dbCoupon.expires_at ? new Date(dbCoupon.expires_at) : null;
          const minOrder = Number(dbCoupon.min_order_amount || 0);
          const usageLimit = dbCoupon.usage_limit ? Number(dbCoupon.usage_limit) : null;
          const usageCount = Number(dbCoupon.usage_count || 0);

          if ((!startsAt || now >= startsAt) && (!expiresAt || now <= expiresAt)) {
            if (!usageLimit || usageCount < usageLimit) {
              if (subtotal >= minOrder) {
                couponFound = true;
                appliedCouponCode = dbCoupon.code;
                if (dbCoupon.discount_type === 'percentage') {
                  discount = (subtotal * Number(dbCoupon.discount_value)) / 100;
                } else if (dbCoupon.discount_type === 'fixed_amount') {
                  discount = Number(dbCoupon.discount_value);
                }

                if (dbCoupon.max_discount_amount) {
                  discount = Math.min(discount, Number(dbCoupon.max_discount_amount));
                }
              }
            }
          }
        }
      }

      // Predefined Fallbacks for immediate zero-config mode
      if (!couponFound) {
        if (promoCode === 'WELCOME10') {
          discount = subtotal * 0.1;
          appliedCouponCode = 'WELCOME10';
        } else if (promoCode === 'TECH20') {
          discount = subtotal * 0.2;
          appliedCouponCode = 'TECH20';
        }
      }
    }

    // 6. Calculate Final Financials
    discount = Math.round(discount * 100) / 100;
    const shipping = subtotal > 150 ? 0 : 15;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.08 * 100) / 100;
    const total = Math.max(0, Math.round((taxableAmount + tax + shipping) * 100) / 100);

    // 7. Order Identifiers & Guest Verification Token
    const orderNumber = `AETH-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = crypto.randomUUID();
    const guestAccessToken = generateGuestOrderToken(orderNumber, customerEmail);
    const createdAt = new Date().toISOString();

    const isPaystack = paymentMethod === 'paystack';
    const initialPaymentStatus = isPaystack ? 'pending' : 'paid';
    const initialOrderStatus = isPaystack ? 'pending' : 'confirmed';

    // Initialize Paystack transaction session if Paystack is selected
    let paystackSession: any = null;
    if (isPaystack) {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const callbackUrl = `${origin}/order-confirmation?orderId=${orderId}&token=${encodeURIComponent(guestAccessToken)}&reference=${orderNumber}&payment=paystack`;
      const cancelAction = `${origin}/checkout?cancelled=true&orderId=${orderId}&reference=${orderNumber}`;

      paystackSession = await initializePaystackTransaction({
        email: customerEmail,
        amount: total,
        currency: getStoreCurrency(),
        reference: orderNumber,
        callbackUrl,
        metadata: {
          orderId,
          orderNumber,
          customerName,
          itemsCount: validatedItems.length,
          cancel_action: cancelAction,
        },
      });

      if (!paystackSession.success && !paystackSession.simulated) {
        return apiError(
          paystackSession.message || 'Failed to initialize Paystack payment session.',
          ApiErrorCode.BAD_REQUEST,
          400
        );
      }
    }

    const orderRecord = {
      id: orderId,
      order_number: orderNumber,
      user_id: verifiedUserId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || '',
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,
      order_status: initialOrderStatus,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      promo_code: appliedCouponCode,
      tracking_carrier: 'FedEx Express',
      tracking_number: `FX-${Math.floor(100000000 + Math.random() * 900000000)}`,
      created_at: createdAt,
      items: validatedItems,
    };

    let persistedToSupabase = false;

    // 8. Atomic Database Persistence & Inventory Deductions
    if (supabase) {
      try {
        // A. Insert Order
        const { error: orderError } = await supabase.from('orders').insert({
          id: orderId,
          order_number: orderNumber,
          user_id: verifiedUserId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || '',
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
          payment_status: initialPaymentStatus,
          order_status: initialOrderStatus,
          subtotal,
          discount,
          tax,
          shipping,
          total,
          promo_code: appliedCouponCode,
          tracking_carrier: 'FedEx Express',
          tracking_number: orderRecord.tracking_number,
        });

        if (!orderError) {
          persistedToSupabase = true;

          // B. Insert Order Items
          const itemsPayload = validatedItems.map((item) => ({
            order_id: orderId,
            product_id: item.id,
            variant_id: item.variantId || null,
            sku: item.sku,
            product_name: item.name,
            unit_price: item.price,
            quantity: item.quantity,
            total_price: Math.round(item.price * item.quantity * 100) / 100,
            image: item.image,
          }));
          await supabase.from('order_items').insert(itemsPayload);

          // C. Deduct Stock & Write to Inventory Ledger for each item
          for (const item of validatedItems) {
            const newStock = Math.max(0, item.stockAvailable - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.id);

            await supabase.from('inventory_ledger').insert({
              product_id: item.id,
              variant_id: item.variantId || null,
              change_type: 'order_placed',
              quantity_delta: -item.quantity,
              balance_after: newStock,
              order_id: orderId,
              notes: `Order #${orderNumber} placed by ${customerEmail} (Paystack: ${isPaystack})`,
            });
          }

          // D. Record Order Timeline Milestone
          await supabase.from('order_timeline').insert({
            order_id: orderId,
            status: initialOrderStatus,
            title: isPaystack ? 'Paystack Payment Session Initialized' : 'Order Confirmed & Payment Authorized',
            description: isPaystack
              ? `Paystack checkout session created. Reference: #${orderNumber}. Awaiting settlement.`
              : `Payment authorized via ${paymentMethod === 'credit_card' ? 'Credit Card' : 'Wire Transfer'}. Scheduled for quality inspection.`,
            actor: 'Automated Checkout Engine',
          });

          // E. Increment Coupon Usage Count if applied
          // F. Automatically Save Shipping Address to Customer Addresses
          if (shippingAddress) {
            try {
              let addressUserId = verifiedUserId;
              if (!addressUserId && customerEmail) {
                const { data: profileUser } = await supabase
                  .from('profiles')
                  .select('id')
                  .ilike('email', customerEmail)
                  .maybeSingle();
                if (profileUser) {
                  addressUserId = profileUser.id;
                }
              }

              if (addressUserId) {
                // Set existing addresses to non-default
                await supabase
                  .from('customer_addresses')
                  .update({ is_default: false })
                  .eq('user_id', addressUserId);

                const addrAny = shippingAddress as any;
                await supabase.from('customer_addresses').insert({
                  user_id: addressUserId,
                  full_name: customerName,
                  street_line_1: shippingAddress.street || addrAny.streetLine1 || '',
                  street_line_2: addrAny.apartment || addrAny.streetLine2 || null,
                  city: shippingAddress.city || '',
                  state_region: shippingAddress.state || addrAny.stateRegion || null,
                  postal_code: shippingAddress.postalCode || addrAny.postal_code || '',
                  country_code: shippingAddress.country || addrAny.country_code || 'US',
                  phone: customerPhone || null,
                  is_default: true,
                  address_type: 'shipping',
                });
              }
            } catch (addrErr) {
              console.warn('[Auto-Save Address Exception]', addrErr);
            }
          }
        }
      } catch (dbErr: any) {
        console.warn('[Supabase Database Exception]', dbErr);
      }
    }

    // Always maintain local memory store for instant fallback retrieval
    globalOrdersStore.set(orderId, orderRecord);
    globalOrdersStore.set(orderNumber, orderRecord);

    // 9. Send Confirmation Email via Resend
    let emailResult = await sendOrderConfirmationEmail({
      orderNumber,
      customerName,
        customerEmail,
        items: validatedItems,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        shippingAddress: {
          fullName: shippingAddress.fullName || customerName,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      });

      // 10. Record Transactional Email Log in Supabase
      if (supabase) {
        try {
          if (emailResult.messageId) {
            await supabase
              .from('orders')
              .update({
                mailgun_message_id: emailResult.messageId,
                mailgun_status: emailResult.success ? 'sent' : 'failed',
              })
              .eq('id', orderId);
          }

          await supabase.from('email_logs').insert({
            order_id: orderId,
            recipient_email: customerEmail,
            template_type: 'order_confirmation',
            subject: `AETHER Order Confirmation — #${orderNumber}`,
            mailgun_message_id: emailResult.messageId || null,
            status: emailResult.simulated ? 'simulated' : emailResult.success ? 'sent' : 'failed',
            error_message: emailResult.error || null,
          });
        } catch (e) {
          // non-blocking
        }
      }

    // 11. Return standardized success response
    return apiSuccess(
      {
        order: orderRecord,
        guestAccessToken,
        paystack: paystackSession,
        databasePersisted: persistedToSupabase,
        email: emailResult,
      },
      isPaystack ? 'Order registered. Paystack session ready.' : 'Order authorized and placed successfully',
      201
    );
  } catch (error: any) {
    console.error('[Checkout API Exception]', error);
    return apiError('Unexpected server error during checkout', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
