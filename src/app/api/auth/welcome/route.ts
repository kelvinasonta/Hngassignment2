import { NextResponse } from 'next/server';
import { sendWelcomeEmail, isResendConfigured } from '@/lib/resend';
import { getSupabaseServerClient } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';

// In-memory cache to prevent duplicate welcome emails in dev/serverless instances
const sentWelcomeEmails = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const userId = body.userId || null;
    const method = body.method || 'credentials'; // 'google' | 'credentials' | 'oauth'

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    // 1. Check in-memory deduplication set
    if (sentWelcomeEmails.has(email)) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        message: 'Welcome email was already dispatched to this address.',
      });
    }

    const supabase = getSupabaseServerClient();

    // 2. Check Supabase database if connected to verify if welcome email was already recorded
    if (supabase) {
      try {
        const { data: existingLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('recipient_email', email)
          .eq('template_type', 'welcome')
          .limit(1)
          .maybeSingle();

        if (existingLog) {
          sentWelcomeEmails.add(email);
          return NextResponse.json({
            success: true,
            alreadySent: true,
            message: 'Welcome email was previously recorded in database.',
          });
        }
      } catch (dbErr) {
        console.warn('[Welcome Email DB Check Warning]', dbErr);
      }
    }

    // Mark as sent immediately to prevent concurrent duplicate dispatch
    sentWelcomeEmails.add(email);

    // 3. Dispatch the welcome email via Resend
    const result = await sendWelcomeEmail({
      customerEmail: email,
      customerName: name || email.split('@')[0],
      loginMethod: method,
    });

    // 4. Log to database if Supabase is connected
    if (supabase) {
      try {
        await supabase.from('email_logs').insert({
          recipient_email: email,
          template_type: 'welcome',
          subject: 'Welcome to AETHER — Your Journey in Precision Hardware Begins',
          mailgun_message_id: result.id || `resend-${Date.now()}`,
          status: result.success ? (result.simulated ? 'simulated' : 'sent') : 'failed',
          error_message: result.error || null,
        });

        await logActivity({
          userId: userId || undefined,
          action: 'auth.welcome_email.sent',
          entityType: 'user',
          metadata: {
            email,
            name,
            method,
            provider: 'resend',
            simulated: result.simulated ?? false,
          },
        });
      } catch (logErr) {
        console.warn('[Welcome Email Log Warning]', logErr);
      }
    }

    return NextResponse.json({
      success: result.success,
      simulated: result.simulated ?? false,
      messageId: result.id,
      message: result.message || 'Welcome email dispatched successfully',
      isConfigured: isResendConfigured(),
    });
  } catch (error: any) {
    console.error('[Welcome Email Exception]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch welcome email' },
      { status: 500 }
    );
  }
}
