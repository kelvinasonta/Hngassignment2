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

    const targetUserId = authResult.user?.id || null;
    const targetEmail = (filterEmail || authResult.user?.email || '').trim().toLowerCase();

    // Require either a verified session or an email filter
    if (!authResult.isAuthenticated && !targetEmail) {
      return apiError(
        'Authentication or email required to view order history. Please sign in.',
        ApiErrorCode.UNAUTHORIZED,
        401
      );
    }

    const supabase = getSupabaseServerClient();
    let orders: any[] = [];
    let totalCount = 0;

    if (supabase) {
      let query = supabase.from('orders').select('*, order_items(*)', { count: 'exact' });

      // Admin or staff can see everything unless filtering by email
      if (authResult.isAdmin || authResult.isStaff) {
        if (targetEmail) {
          query = query.ilike('customer_email', targetEmail);
        }
        if (filterStatus) {
          query = query.eq('order_status', filterStatus);
        }
      } else {
        // Customer can only see their own orders (by user ID or email)
        if (targetUserId && targetEmail) {
          query = query.or(`user_id.eq.${targetUserId},customer_email.ilike.${targetEmail}`);
        } else if (targetUserId) {
          query = query.eq('user_id', targetUserId);
        } else if (targetEmail) {
          query = query.ilike('customer_email', targetEmail);
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
        if (authResult.isAdmin || authResult.isStaff) return true;
        if (targetUserId && order.user_id === targetUserId) return true;
        if (targetEmail && order.customer_email?.toLowerCase() === targetEmail) return true;
        return false;
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
