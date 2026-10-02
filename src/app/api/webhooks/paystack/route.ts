import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { globalOrdersStore } from '@/lib/orders-store';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // 1. Verify HMAC-SHA512 Webhook Signature
    const isValidSignature = verifyPaystackWebhookSignature(rawBody, signature);
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      console.warn('[Paystack Webhook] Invalid webhook signature rejected.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`[Paystack Webhook] Received event: ${event}`);

    // 2. Handle successful charge
    if (event === 'charge.success' && data) {
      const reference = data.reference;
      const amountPaid = data.amount ? data.amount / 100 : 0;
      const channel = data.channel || 'card';
      const orderNumber = data.metadata?.order_number || reference;

      const supabase = getSupabaseServerClient();
      let matchedOrder: any = null;

      if (supabase) {
        // Query order by order_number or id
        const { data: order } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
          .single();

        if (order) {
          matchedOrder = order;

          // Idempotency check: only process if not yet marked paid
          if (order.payment_status !== 'paid') {
            await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                status: 'processing',
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            // Record timeline event
            await supabase.from('order_timeline').insert({
              order_id: order.id,
              status: 'processing',
              title: 'Paystack Payment Settled (Webhook)',
              description: `Confirmed via Paystack webhook. Channel: ${channel}. Reference: ${reference}.`,
            });

            // Dispatch customer confirmation email
            sendOrderConfirmationEmail({
              orderNumber: order.order_number,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              items: (order.order_items || []).map((i: any) => ({
                name: i.product_name,
                quantity: i.quantity,
                price: Number(i.unit_price),
                image: i.image,
              })),
              subtotal: Number(order.subtotal),
              tax: Number(order.tax),
              shipping: Number(order.shipping),
              discount: Number(order.discount),
              total: Number(order.total),
              shippingAddress: {
                fullName: order.customer_name,
                street: order.shipping_address?.street || order.shipping_address?.street1 || '',
                city: order.shipping_address?.city || '',
                state: order.shipping_address?.state,
                postalCode: order.shipping_address?.postalCode || '',
                country: order.shipping_address?.country || 'US',
              },
            }).catch((e) => console.warn('[Paystack Webhook Mailgun Error]', e.message));

            // Record audit log
            await logActivity({
              userId: order.user_id,
              action: 'payment.webhook.paystack_success',
              entityType: 'order',
              entityId: order.id,
              metadata: { reference, amount: amountPaid, channel },
            });
          }
        }
      }

      // Update in-memory fallback
      if (!matchedOrder) {
        const stored = globalOrdersStore.get(orderNumber) || globalOrdersStore.get(reference);
        if (stored) {
          stored.payment_status = 'paid';
          stored.status = 'processing';
          globalOrdersStore.set(stored.id, stored);
          globalOrdersStore.set(stored.order_number, stored);
        }
      }
    } else if (event === 'charge.failed' && data) {
      const reference = data.reference;
      const orderNumber = data.metadata?.order_number || reference;
      const failureReason = data.gateway_response || data.message || 'Payment attempt failed';

      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, payment_status, user_id')
          .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
          .single();

        if (order && order.payment_status !== 'paid') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          await supabase.from('order_timeline').insert({
            order_id: order.id,
            status: 'cancelled',
            title: 'Paystack Payment Failed',
            description: `Payment failure reported via webhook: ${failureReason}.`,
            actor: 'Paystack Automated Gateway',
          });

          await logActivity({
            userId: order.user_id,
            action: 'payment.webhook.paystack_failed',
            entityType: 'order',
            entityId: order.id,
            metadata: { reference, reason: failureReason },
          });
        }
      }

      const stored = globalOrdersStore.get(orderNumber) || globalOrdersStore.get(reference);
      if (stored && stored.payment_status !== 'paid') {
        stored.payment_status = 'failed';
        globalOrdersStore.set(stored.id, stored);
        globalOrdersStore.set(stored.order_number, stored);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Paystack Webhook Exception]', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
