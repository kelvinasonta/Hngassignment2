import crypto from 'crypto';

export interface PaystackInitParams {
  email: string;
  amount: number; // in base units (e.g. $10.00 -> 1000 cents/kobo)
  reference: string;
  callbackUrl: string;
  currency?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface PaystackInitResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  message?: string;
  simulated?: boolean;
}

export interface PaystackVerifyResponse {
  success: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  channel?: string;
  paidAt?: string;
  customerEmail?: string;
  message?: string;
  simulated?: boolean;
}

export const isPaystackConfigured = (): boolean => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(secret && secret.startsWith('sk_') && secret !== 'sk_test_your_paystack_secret_key');
};

/**
 * Initializes a live Paystack transaction on the server.
 */
export async function initializePaystackTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const currency = params.currency || process.env.PAYSTACK_CURRENCY || process.env.NEXT_PUBLIC_STORE_CURRENCY || 'NGN';

  if (!isPaystackConfigured()) {
    console.log('[Paystack Simulation] Secret key not configured. Generating simulated authorization session.');
    return {
      success: true,
      simulated: true,
      authorizationUrl: `${params.callbackUrl}&simulated=true&ref=${params.reference}`,
      accessCode: `sim_access_${Date.now()}`,
      reference: params.reference,
      message: 'Paystack simulated checkout initialized (add PAYSTACK_SECRET_KEY to .env.local for live payments).',
    };
  }

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amount * 100), // convert Naira/currency to kobo/cents
        currency,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata || {},
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      console.error('[Paystack Init Error]', data);
      return {
        success: false,
        message: data.message || 'Failed to initialize Paystack transaction.',
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
      message: 'Paystack authorization session created successfully.',
    };
  } catch (err: any) {
    console.error('[Paystack Init Exception]', err);
    return {
      success: false,
      message: err.message || 'Unexpected Paystack communication failure.',
    };
  }
}

/**
 * Verifies a transaction reference directly against Paystack REST API.
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const defaultCurrency = process.env.PAYSTACK_CURRENCY || process.env.NEXT_PUBLIC_STORE_CURRENCY || 'NGN';

  if (!isPaystackConfigured()) {
    return {
      success: true,
      simulated: true,
      status: 'success',
      amount: 0,
      currency: defaultCurrency,
      transactionId: `sim_txn_${Date.now()}`,
      channel: 'card',
      paidAt: new Date().toISOString(),
      message: 'Simulated Paystack verification succeeded.',
    };
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        status: data?.data?.status || 'failed',
        amount: data?.data?.amount ? data.data.amount / 100 : 0,
        currency: data?.data?.currency || defaultCurrency,
        transactionId: data?.data?.id ? String(data.data.id) : undefined,
        channel: data?.data?.channel,
        customerEmail: data?.data?.customer?.email,
        message: data?.data?.gateway_response || data?.message || 'Unable to verify Paystack reference.',
      };
    }

    const txn = data.data;
    const isPaid = txn.status === 'success';

    return {
      success: isPaid,
      status: txn.status, // 'success' | 'failed' | 'abandoned' | 'pending' | 'ongoing'
      amount: txn.amount ? txn.amount / 100 : 0,
      currency: txn.currency || defaultCurrency,
      transactionId: String(txn.id),
      channel: txn.channel,
      paidAt: txn.paid_at,
      customerEmail: txn.customer?.email,
      message: txn.gateway_response || (isPaid ? 'Transaction verified and approved' : 'Transaction pending or unconfirmed'),
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      message: err.message || 'Paystack verification exception.',
    };
  }
}

/**
 * Verifies incoming Paystack webhook HMAC-SHA512 signature.
 */
export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !signature) return false;

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}
