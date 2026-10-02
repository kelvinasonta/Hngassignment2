import { getSupabaseServerClient } from '@/lib/supabase';
import { globalOrdersStore } from '@/lib/orders-store';
import { initializePaystackTransaction } from '@/lib/paystack';
import { getStoreCurrency } from '@/lib/currency';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { generateGuestOrderToken } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, orderNumber } = body;

    if (!orderId && !orderNumber) {
      return apiError('Missing order identifier', ApiErrorCode.BAD_REQUEST, 400);
    }

    const supabase = getSupabaseServerClient();
    let order: any = null;

    if (supabase) {
      const query = supabase.from('orders').select('*, order_items(*)');
      const { data } = orderId
        ? await query.eq('id', orderId).single()
        : await query.eq('order_number', orderNumber).single();
      order = data;
    }

    if (!order) {
      order = globalOrdersStore.get(orderId) || globalOrdersStore.get(orderNumber);
    }

    if (!order) {
      return apiError('Order not found', ApiErrorCode.NOT_FOUND, 404);
    }

    if (order.payment_status === 'paid') {
      return apiError('Order has already been paid and settled', ApiErrorCode.BAD_REQUEST, 400);
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const guestAccessToken = generateGuestOrderToken(order.order_number, order.customer_email);
    const retryRef = `${order.order_number}-R${Date.now().toString().slice(-6)}`;
    const callbackUrl = `${origin}/order-confirmation?orderId=${order.id}&token=${encodeURIComponent(guestAccessToken)}&reference=${retryRef}&payment=paystack`;
    const cancelAction = `${origin}/checkout?cancelled=true&orderId=${order.id}&reference=${retryRef}`;

    const paystackSession = await initializePaystackTransaction({
      email: order.customer_email,
      amount: Number(order.total),
      currency: getStoreCurrency(),
      reference: retryRef,
      callbackUrl,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        cancel_action: cancelAction,
      },
    });

    if (!paystackSession.success && !paystackSession.simulated) {
      return apiError(
        paystackSession.message || 'Unable to initialize Paystack session',
        ApiErrorCode.BAD_REQUEST,
        400
      );
    }

    return apiSuccess({
      authorizationUrl: paystackSession.authorizationUrl,
      accessCode: paystackSession.accessCode,
      reference: order.order_number,
      orderId: order.id,
    }, 'Paystack session re-initialized successfully');
  } catch (error: any) {
    console.error('[Paystack Initialize Exception]', error);
    return apiError('Failed to initialize Paystack session', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
