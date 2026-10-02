import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';

// Fallback in-memory logs for development
const localActivityLogs: any[] = [
  {
    id: 'log-seed-1',
    action: 'auth.login_success',
    entity_type: 'user',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-seed-2',
    action: 'order.checkout_completed',
    entity_type: 'order',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  }
];

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);

      if (!authResult.isAdmin && !authResult.isStaff) {
        query = query.eq('user_id', authResult.user.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        return apiSuccess({ logs: data }, 'Activity logs retrieved');
      }
    }

    return apiSuccess({ logs: localActivityLogs }, 'Activity logs retrieved (local)');
  } catch (error: any) {
    return apiError('Failed to fetch activity logs', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;

    const result = await logActivity({
      ...body,
      ipAddress: body.ipAddress || ipAddress,
      userAgent: body.userAgent || userAgent,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
