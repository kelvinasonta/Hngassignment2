import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logActivity } from '@/lib/activity-logger';
import { sendSecurityAlertEmail } from '@/lib/mailgun';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`pwd-change:${clientIp}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many password change attempts. Please try again in 15 minutes.', ApiErrorCode.RATE_LIMITED, 429);
    }

    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to change password', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json().catch(() => null);
    const newPassword = String(body?.newPassword || '');

    if (!newPassword || newPassword.length < 8) {
      return apiError('Password must be at least 8 characters long', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.admin.updateUserById(authResult.user.id, {
        password: newPassword,
      });

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }
    }

    // Record audit log
    await logActivity({
      userId: authResult.user.id,
      action: 'auth.password_changed',
      entityType: 'user',
      entityId: authResult.user.id,
      ipAddress: clientIp,
    });

    // Send security notification email to customer
    if (authResult.user.email) {
      sendSecurityAlertEmail({
        to: authResult.user.email,
        customerName: authResult.user.name,
        event: 'Account Password Successfully Updated',
        ipAddress: clientIp,
      }).catch((e) => console.warn('[Security Email]', e.message));
    }

    return apiSuccess({ changed: true }, 'Password updated successfully');
  } catch (error: any) {
    return apiError('Failed to change password', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
