import { getSupabaseServerClient } from '@/lib/supabase';
import { globalOrdersStore } from '@/lib/orders-store';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`orders-list:${clientIp}`, { maxRequests: 30, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many requests. Please slow down.', ApiErrorCode.RATE_LIMITED, 429);
    }

    // 2. Authentication check
    const authResult = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const filterEmail = searchParams.get('email');
    const filterStatus = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

    // If caller is completely unauthenticated and not in development mode
    if (!authResult.isAuthenticated || !authResult.user) {
      // In development fallback, allow email query if matching development demo user
      if (process.env.NODE_ENV !== 'production' && filterEmail) {
        // Fallback for development testing
      } else {
        return apiError(
          'Authentication required to view order history. Please sign in.',
          ApiErrorCode.UNAUTHORIZED,
          401
        );
      }
    }

    const supabase = getSupabaseServerClient();
    let orders: any[] = [];
    let totalCount = 0;

    if (supabase) {
      let query = supabase.from('orders').select('*, order_items(*)', { count: 'exact' });

      // Non-admin / non-staff users can ONLY ever see their own orders
      if (!authResult.isAdmin && !authResult.isStaff && authResult.user) {
        query = query.or(`user_id.eq.${authResult.user.id},customer_email.eq.${authResult.user.email}`);
      } else {
        // Admin or staff can filter arbitrarily
        if (filterEmail) {
          query = query.eq('customer_email', filterEmail);
        }
        if (filterStatus) {
          query = query.eq('order_status', filterStatus);
        }
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (!error && data) {
        orders = data;
        totalCount = count || data.length;
      }
    }

    // In-memory fallback
    if (orders.length === 0) {
      const allOrders = Array.from(globalOrdersStore.values());
      const uniqueOrders = Array.from(new Set(allOrders.map((o) => o.id)))
        .map((id) => allOrders.find((o) => o.id === id))
        .filter(Boolean);

      const filtered = uniqueOrders.filter((order) => {
        if (!authResult.isAdmin && !authResult.isStaff && authResult.user) {
          const userMatches = order.user_id === authResult.user.id;
          const emailMatches = order.customer_email.toLowerCase() === authResult.user.email.toLowerCase();
          return userMatches || emailMatches;
        }
        if (filterEmail && order.customer_email.toLowerCase() !== filterEmail.toLowerCase()) {
          return false;
        }
        if (filterStatus && order.status !== filterStatus) {
          return false;
        }
        return true;
      });

      totalCount = filtered.length;
      orders = filtered.slice(offset, offset + limit);
    }

    return apiSuccess(
      {
        orders,
        count: orders.length,
        total: totalCount,
        pagination: { limit, offset },
      },
      'Orders retrieved successfully'
    );
  } catch (error: any) {
    console.error('[Orders API Error]', error);
    return apiError('Internal server error retrieving orders', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
