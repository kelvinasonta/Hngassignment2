import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/resend';
import { getSupabaseServerClient } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user?.email) {
        const user = data.user;
        const email = user.email.toLowerCase().trim();
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0] ||
          'Valued Member';

        // Check if user was created within the last 5 minutes (indicating a new OAuth signup)
        const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
        const isRecentSignup = Date.now() - createdAt < 300000;

        // Verify with database logs to ensure they receive the welcome email only once
        const serverDb = getSupabaseServerClient();
        let alreadySent = false;

        if (serverDb) {
          try {
            const { data: existingLog } = await serverDb
              .from('email_logs')
              .select('id')
              .eq('recipient_email', email)
              .eq('template_type', 'welcome')
              .limit(1)
              .maybeSingle();

            if (existingLog) {
              alreadySent = true;
            }
          } catch (e) {
            console.warn('[OAuth Callback Email Check Warning]', e);
          }
        }

        if (isRecentSignup && !alreadySent) {
          try {
            const result = await sendWelcomeEmail({
              customerEmail: email,
              customerName: name,
              loginMethod: 'google',
            });

            if (serverDb) {
              await serverDb.from('email_logs').insert({
                recipient_email: email,
                template_type: 'welcome',
                subject: 'Welcome to AETHER — Your Journey in Precision Hardware Begins',
                mailgun_message_id: result.id || `resend-oauth-${Date.now()}`,
                status: result.success ? (result.simulated ? 'simulated' : 'sent') : 'failed',
                error_message: result.error || null,
              });

              await logActivity({
                userId: user.id,
                action: 'auth.oauth.welcome_email.sent',
                entityType: 'user',
                metadata: { email, name, provider: 'resend', oauthProvider: 'google' },
              });
            }
          } catch (emailErr) {
            console.error('[OAuth Welcome Email Dispatch Error]', emailErr);
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
