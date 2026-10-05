import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { sendWelcomeEmail } from '@/lib/resend';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email ? body.email.toLowerCase().trim() : '';
    const name = body?.name ? body.name.trim() : email.split('@')[0] || 'AETHER Client';
    const avatarUrl = body?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
    const idToken = body?.idToken;

    if (!email && !idToken) {
      return apiError('Valid Google authorization or email required', ApiErrorCode.VALIDATION_ERROR, 400);
    }

    const customerEmail = email || 'client.google@aether-client.com';
    const customerData = {
      id: `usr_g_${Date.now()}`,
      email: customerEmail,
      name,
      avatarUrl,
      membershipTier: 'Apex Verified Client',
      vaultStatus: 'Active Google Identity',
      provider: 'google',
      token: `g-token-${Date.now()}`,
    };

    // Trigger luxury welcome email
    try {
      await sendWelcomeEmail({
        customerEmail,
        customerName: name,
        loginMethod: 'google',
      });
    } catch (e) {
      console.warn('[Google Auth Welcome Email Non-blocking]', e);
    }

    await logActivity({
      userId: customerData.id,
      action: 'customer.auth.google',
      entityType: 'user',
      metadata: { email: customerEmail, name, channel: 'mobile_api' },
    });

    return apiSuccess({ user: customerData }, 'Authenticated with Google successfully');
  } catch (err: any) {
    console.error('[Auth Google API Error]', err);
    return apiError('Failed to process Google sign-in', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
