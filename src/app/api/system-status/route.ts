import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseServerClient } from '@/lib/supabase';
import { isMailgunConfigured } from '@/lib/mailgun';
import { globalOrdersStore } from '@/lib/orders-store';

export async function GET() {
  const supabaseSet = isSupabaseConfigured();
  const mailgunSet = isMailgunConfigured();
  const googleSet = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.includes('googleusercontent.com'));

  let dbConnection = 'disconnected';
  let productsCount = 6;
  let ordersCount = globalOrdersStore.size;

  if (supabaseSet) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (!error) {
          dbConnection = 'connected';
          if (count !== null) productsCount = count;
        } else {
          dbConnection = 'error';
        }
      } catch (e) {
        dbConnection = 'error';
      }
    }
  }

  return NextResponse.json({
    supabase: {
      configured: supabaseSet,
      connection: dbConnection,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    },
    email: {
      provider: 'Resend',
      configured: mailgunSet,
      apiKey: process.env.RESEND_API_KEY ? 'Configured' : 'Missing',
      from: process.env.RESEND_FROM_EMAIL || 'AETHER Store <onboarding@resend.dev>',
    },
    mailgun: {
      configured: mailgunSet,
      domain: process.env.MAILGUN_DOMAIN ? process.env.MAILGUN_DOMAIN : 'Resend Active',
    },
    googleAuth: {
      configured: googleSet,
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Missing',
      redirectUri: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://<project>.supabase.co'}/auth/v1/callback`,
    },
    stats: {
      productsCount,
      ordersCount,
    },
  });
}
