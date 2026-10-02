import { getSupabaseServerClient } from '@/lib/supabase';
import { globalOrdersStore } from '@/lib/orders-store';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { verifyPaystackTransaction } from '@/lib/paystack';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return apiError('Missing transaction reference', ApiErrorCode.BAD_REQUEST, 400);
    }

    // 1. Verify transaction with Paystack
    const verifyResult = await verifyPaystackTransaction(reference);
    const supabase = getSupabaseServerClient();
    let updatedOrder: any = null;

    // 2. Locate Order in Supabase or fallback store
    const baseOrderNumber = reference.includes('-R') ? reference.split('-R')[0] : reference;
    let existingOrder: any = null;
    if (supabase) {
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`order_number.eq.${baseOrderNumber},order_number.eq.${reference},id.eq.${reference}`)
        .single();
      existingOrder = order;
    }
    if (!existingOrder) {
      existingOrder = globalOrdersStore.get(baseOrderNumber) || globalOrdersStore.get(reference);
    }

    // 3. Process based on Paystack Status
    const status = verifyResult.status || (verifyResult.success ? 'success' : 'failed');

    if (verifyResult.success && status === 'success') {
      // Payment Approved
      if (supabase && existingOrder) {
        if (existingOrder.payment_status !== 'paid') {
          const { data: saved } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingOrder.id)
            .select('*, order_items(*)')
            .single();

          if (saved) {
            updatedOrder = saved;

            await supabase.from('order_timeline').insert({
              order_id: existingOrder.id,
              status: 'processing',
              title: 'Paystack Payment Confirmed',
              description: `Transaction verified via Paystack. Channel: ${verifyResult.channel || 'Card'}, Txn ID: #${verifyResult.transactionId || reference}.`,
              actor: 'Paystack Automated Gateway',
            });

            // Dispatch customer confirmation email on successful live payment
            sendOrderConfirmationEmail({
              orderNumber: existingOrder.order_number,
              customerName: existingOrder.customer_name,
              customerEmail: existingOrder.customer_email,
              items: (existingOrder.order_items || []).map((i: any) => ({
                name: i.product_name,
                quantity: i.quantity,
                price: Number(i.unit_price),
                image: i.image,
              })),
              subtotal: Number(existingOrder.subtotal),
              tax: Number(existingOrder.tax),
              shipping: Number(existingOrder.shipping),
              discount: Number(existingOrder.discount),
              total: Number(existingOrder.total),
              shippingAddress: {
                fullName: existingOrder.customer_name,
                street: existingOrder.shipping_address?.street || existingOrder.shipping_address?.street1 || '',
                city: existingOrder.shipping_address?.city || '',
                state: existingOrder.shipping_address?.state,
                postalCode: existingOrder.shipping_address?.postalCode || existingOrder.shipping_address?.postal_code || '',
                country: existingOrder.shipping_address?.country || 'US',
              },
            }).catch((e) => console.warn('[Paystack Confirmation Email Error]', e.message));

            await logActivity({
              userId: existingOrder.user_id,
              action: 'payment.paystack.success',
              entityType: 'order',
              entityId: existingOrder.id,
              metadata: {
                reference,
                amount: verifyResult.amount,
                channel: verifyResult.channel,
              },
            });
          }
        } else {
          updatedOrder = existingOrder;
        }
      }

      if (!updatedOrder && existingOrder) {
        existingOrder.payment_status = 'paid';
        existingOrder.status = 'processing';
        globalOrdersStore.set(existingOrder.id, existingOrder);
        globalOrdersStore.set(existingOrder.order_number, existingOrder);
        updatedOrder = existingOrder;
      }
    } else if (status === 'failed') {
      // Payment Failed / Declined
      if (supabase && existingOrder) {
        const { data: saved } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingOrder.id)
          .select('*, order_items(*)')
          .single();

        if (saved) {
          updatedOrder = saved;
          await supabase.from('order_timeline').insert({
            order_id: existingOrder.id,
            status: 'cancelled',
            title: 'Paystack Payment Failed',
            description: `Payment attempt was declined or failed: ${verifyResult.message || 'Card / Gateway declined'}.`,
            actor: 'Paystack Automated Gateway',
          });
        }
      }
      if (!updatedOrder && existingOrder) {
        existingOrder.payment_status = 'failed';
        existingOrder.status = 'cancelled';
        globalOrdersStore.set(existingOrder.id, existingOrder);
        globalOrdersStore.set(existingOrder.order_number, existingOrder);
        updatedOrder = existingOrder;
      }
    } else if (status === 'abandoned') {
      // Payment Cancelled / Abandoned
      if (supabase && existingOrder && existingOrder.payment_status === 'pending') {
        const { data: saved } = await supabase
          .from('orders')
          .update({
            payment_status: 'abandoned',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingOrder.id)
          .select('*, order_items(*)')
          .single();
        updatedOrder = saved || existingOrder;
      } else {
        updatedOrder = existingOrder;
      }
    } else {
      // Pending or other state
      updatedOrder = existingOrder;
    }

    return apiSuccess({
      verified: verifyResult.success,
      status,
      gatewayResponse: verifyResult.message || 'Transaction processed',
      reference,
      transactionId: verifyResult.transactionId,
      amount: verifyResult.amount,
      currency: verifyResult.currency,
      channel: verifyResult.channel,
      order: updatedOrder,
    }, verifyResult.message || 'Paystack verification processed');
  } catch (error: any) {
    console.error('[Paystack Verify API Exception]', error);
    return apiError('Server error verifying Paystack transaction', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
