import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { sendWelcomeEmail } from '@/lib/resend';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.password) {
      return apiError('Email and password are required', ApiErrorCode.VALIDATION_ERROR, 400);
    }

    const email = body.email.toLowerCase().trim();
    const password = body.password;
    const name = (body.name || email.split('@')[0]).trim();

    if (password.length < 6) {
      return apiError('Password must be at least 6 characters', ApiErrorCode.VALIDATION_ERROR, 400);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      // First try admin.createUser with email_confirm: true for instant seamless access
      let user: any = null;
      let sessionToken: string | null = null;

      const adminCreate = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: 'customer',
        },
      });

      if (!adminCreate.error && adminCreate.data?.user) {
        user = adminCreate.data.user;
      } else {
        // Fallback to standard signUp if admin API has restrictions
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: 'customer',
            },
          },
        });

        if (error) {
          return apiError(error.message, ApiErrorCode.BAD_REQUEST, 400);
        }
        user = data.user;
        sessionToken = data.session?.access_token || null;
      }
      const customerData = {
        id: user?.id || `usr_${Date.now()}`,
        email,
        name,
        avatarUrl: null,
        membershipTier: 'New Concierge Client',
        vaultStatus: 'Registered Account',
        confirmationRequired: !sessionToken && !adminCreate?.data?.user,
        token: sessionToken,
      };

      // Send luxury welcome email
      try {
        await sendWelcomeEmail({
          customerEmail: email,
          customerName: name,
          loginMethod: 'credentials',
        });
      } catch (emailErr) {
        console.warn('[Welcome Email Non-blocking Warning]', emailErr);
      }

      await logActivity({
        userId: user?.id,
        action: 'customer.auth.register',
        entityType: 'user',
        metadata: { email, name, channel: 'mobile_api' },
      });

      return apiSuccess({ user: customerData }, 'Customer account created successfully');
    }

    // Fallback if Supabase is offline/development
    const fallbackUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      membershipTier: 'New Concierge Client',
      vaultStatus: 'Registered Account',
      confirmationRequired: false,
      token: `demo-token-${Date.now()}`,
    };

    return apiSuccess({ user: fallbackUser }, 'Customer account registered successfully (local mode)');
  } catch (err: any) {
    console.error('[Auth Register API Error]', err);
    return apiError('Internal server error during registration', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
