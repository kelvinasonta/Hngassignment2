import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';

/**
 * Mailgun Webhook Signature Verification
 */
function verifyMailgunSignature(token: string, timestamp: string, signature: string): boolean {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey || apiKey === 'mock-mailgun-key') {
    return true; // Allow simulated webhook delivery in development
  }

  try {
    const encodedToken = crypto
      .createHmac('sha256', apiKey)
      .update(timestamp + token)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(encodedToken), Buffer.from(signature));
  } catch (err) {
    console.warn('[Mailgun Webhook Signature Error]', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signatureData = body.signature;
    const eventData = body['event-data'];

    if (!signatureData || !eventData) {
      return NextResponse.json(
        { success: false, message: 'Invalid Mailgun webhook payload structure' },
        { status: 400 }
      );
    }

    const { token, timestamp, signature } = signatureData;
    const isValid = verifyMailgunSignature(token, timestamp, signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid Mailgun cryptographic signature' },
        { status: 401 }
      );
    }

    const eventType = eventData.event; // e.g. delivered, opened, clicked, failed, permanent_fail
    const recipient = eventData.recipient;
    const messageId = eventData.message?.headers?.['message-id'] || eventData.message?.headers?.['Message-Id'];
    const deliveryStatus = eventData['delivery-status'] || {};

    console.log(`[Mailgun Webhook] Event: ${eventType} | Recipient: ${recipient} | MsgID: ${messageId}`);

    // Update email_logs table in Supabase if live
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('email_logs').insert({
          recipient: recipient,
          template: 'webhook_event',
          subject: `Mailgun Webhook: ${eventType}`,
          status: eventType === 'delivered' ? 'delivered' : eventType === 'opened' ? 'opened' : 'failed',
          message_id: messageId || null,
          metadata: {
            event: eventType,
            timestamp: eventData.timestamp,
            deliveryStatus,
            clientInfo: eventData['client-info'] || {},
          },
        });
      } catch (dbErr: any) {
        console.warn('[Mailgun Webhook DB Log Warning]', dbErr.message);
      }
    }

    // Record audit activity
    await logActivity({
      action: `email_${eventType}`,
      entityType: 'email',
      entityId: messageId,
      metadata: {
        recipient,
        event: eventType,
        timestamp: eventData.timestamp,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Mailgun event '${eventType}' processed successfully`,
      data: { event: eventType, recipient },
    });
  } catch (err: any) {
    console.error('[Mailgun Webhook Handler Exception]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}
