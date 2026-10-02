import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to view profile', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authResult.user.id)
        .single();

      if (!error && profile) {
        return apiSuccess({ profile }, 'Profile retrieved successfully');
      }
    }

    // Fallback to session user data
    return apiSuccess(
      {
        profile: {
          id: authResult.user.id,
          email: authResult.user.email,
          full_name: authResult.user.name,
          role: authResult.user.role,
          avatar_url: authResult.user.avatarUrl,
        },
      },
      'Profile retrieved from session'
    );
  } catch (error: any) {
    return apiError('Failed to retrieve profile', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`profile-update:${clientIp}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many updates. Please wait a minute.', ApiErrorCode.RATE_LIMITED, 429);
    }

    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to update profile', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Invalid request body', ApiErrorCode.BAD_REQUEST, 400);
    }

    const fullName = String(body.fullName || body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    const avatarUrl = body.avatarUrl || body.avatar_url ? String(body.avatarUrl || body.avatar_url).trim() : null;

    if (fullName && fullName.length < 2) {
      return apiError('Full name must be at least 2 characters', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          avatar_url: avatarUrl,
        })
        .eq('id', authResult.user.id)
        .select()
        .single();

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }

      return apiSuccess({ profile: data }, 'Profile updated successfully');
    }

    // Mock response for zero-config local development
    return apiSuccess(
      {
        profile: {
          id: authResult.user.id,
          email: authResult.user.email,
          full_name: fullName || authResult.user.name,
          phone,
          avatar_url: avatarUrl || authResult.user.avatarUrl,
        },
      },
      'Profile updated successfully (local simulation)'
    );
  } catch (error: any) {
    return apiError('Failed to update profile', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
