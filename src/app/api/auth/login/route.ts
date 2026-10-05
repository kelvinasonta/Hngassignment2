import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.password) {
      return apiError('Email and password are required', ApiErrorCode.VALIDATION_ERROR, 400);
    }

    const email = body.email.toLowerCase().trim();
    const password = body.password;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return apiError(error.message, ApiErrorCode.UNAUTHORIZED, 401);
      }

      const user = data.user;
      const customerData = {
        id: user.id,
        email: user.email || email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url || null,
        membershipTier: 'Concierge Verified Client',
        vaultStatus: 'Active Security Clearance',
        token: data.session?.access_token || null,
      };

      await logActivity({
        userId: user.id,
        action: 'customer.auth.login',
        entityType: 'user',
        metadata: { email, channel: 'mobile_api' },
      });

      return apiSuccess({ user: customerData }, 'Customer signed in successfully');
    }

    // Fallback if Supabase is offline/development
    const fallbackUser = {
      id: `usr_${Date.now()}`,
      email,
      name: email.split('@')[0].toUpperCase(),
      membershipTier: 'Concierge Member',
      vaultStatus: 'Verified Email Identity',
      token: `demo-token-${Date.now()}`,
    };

    return apiSuccess({ user: fallbackUser }, 'Customer signed in successfully (local mode)');
  } catch (err: any) {
    console.error('[Auth Login API Error]', err);
    return apiError('Internal server error during authentication', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
