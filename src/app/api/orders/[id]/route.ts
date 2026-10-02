import { getSupabaseServerClient } from '@/lib/supabase';
import { globalOrdersStore } from '@/lib/orders-store';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser, verifyGuestOrderToken } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`orders-detail:${clientIp}`, { maxRequests: 40, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many requests. Please slow down.', ApiErrorCode.RATE_LIMITED, 429);
    }

    const { id } = await params;
    if (!id) {
      return apiError('Order identifier is required', ApiErrorCode.BAD_REQUEST, 400);
    }

    // 2. Fetch order from Supabase or fallback store
    const supabase = getSupabaseServerClient();
    let order: any = null;

    if (supabase) {
      const isUuid = id.includes('-');
      const query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      const { data, error } = await query;
      if (!error && data) {
        order = {
          ...data,
          items: data.order_items || [],
        };
      }
    }

    if (!order) {
      order = globalOrdersStore.get(id);
    }

    if (!order) {
      return apiError('Order not found', ApiErrorCode.NOT_FOUND, 404);
    }

    // 3. Authorization & IDOR Protection:
    // Check if the requester is authenticated
    const authResult = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const guestToken = searchParams.get('token') || request.headers.get('x-guest-token');

    let isAuthorized = false;

    // A: Admin / Staff access
    if (authResult.isAdmin || authResult.isStaff) {
      isAuthorized = true;
    }
    // B: Authenticated owner access
    else if (authResult.isAuthenticated && authResult.user && order.user_id === authResult.user.id) {
      isAuthorized = true;
    }
    // C: Customer email match if authenticated
    else if (authResult.isAuthenticated && authResult.user && order.customer_email.toLowerCase() === authResult.user.email.toLowerCase()) {
      isAuthorized = true;
    }
    // D: Valid Guest Token verification (secure HMAC-SHA256 signature generated during checkout)
    else if (guestToken && verifyGuestOrderToken(order.order_number, order.customer_email, guestToken)) {
      isAuthorized = true;
    }
    // E: Development local demo bypass if running demo user
    else if (process.env.NODE_ENV !== 'production' && authResult.user?.isDemo) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return apiError(
        'Access denied: You are not authorized to view this order record.',
        ApiErrorCode.FORBIDDEN,
        403
      );
    }

    return apiSuccess({ order }, 'Order retrieved successfully');
  } catch (error: any) {
    console.error('[Order Detail API Exception]', error);
    return apiError('Internal server error retrieving order', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
