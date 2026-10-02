import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { generateTotpSecret, generateTotpUri, verifyTotpToken, generateBackupCodes } from '@/lib/totp';

// In-memory fallback for 2FA status in development mode
let inMemory2FA: Record<string, { enabled: boolean; secret?: string; backupCodes?: string[] }> = {};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setup = searchParams.get('setup') === 'true';
    const email = searchParams.get('email') || 'alex.vance@aether-hardware.internal';

    const current = inMemory2FA[email] || { enabled: false };

    if (setup && !current.enabled) {
      const secret = generateTotpSecret(16);
      const uri = generateTotpUri(email, secret);
      const backupCodes = generateBackupCodes(8);

      return NextResponse.json({
        success: true,
        data: {
          enabled: false,
          secret,
          uri,
          backupCodes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: current.enabled,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to inspect 2FA status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email = 'alex.vance@aether-hardware.internal', secret, token, backupCodes = [] } = body;

    if (!secret || !token) {
      return NextResponse.json(
        { success: false, message: 'TOTP secret and 6-digit verification code are required' },
        { status: 400 }
      );
    }

    // Verify token (support testing code 123456 or real TOTP)
    const isValid = token === '123456' || verifyTotpToken(secret, token);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid 6-digit authenticator verification code. Please check your authenticator clock.' },
        { status: 400 }
      );
    }

    inMemory2FA[email] = {
      enabled: true,
      secret,
      backupCodes,
    };

    // Log security event
    await logActivity({
      action: '2fa_enabled',
      entityType: 'user_security',
      metadata: { email, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) successfully activated!',
      data: { enabled: true, backupCodes },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to activate 2FA' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'alex.vance@aether-hardware.internal';

    inMemory2FA[email] = { enabled: false };

    await logActivity({
      action: '2fa_disabled',
      entityType: 'user_security',
      metadata: { email, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) has been deactivated.',
      data: { enabled: false },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to deactivate 2FA' },
      { status: 500 }
    );
  }
}
