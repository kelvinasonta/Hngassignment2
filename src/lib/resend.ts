import { formatPrice } from '@/lib/currency';

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export interface ShippingEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: string;
}

export interface StatusEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  notes?: string;
}

export interface SecurityEmailData {
  to: string;
  customerName: string;
  event: string;
  ipAddress?: string;
}

export interface WelcomeEmailData {
  customerName: string;
  customerEmail: string;
  loginMethod?: 'google' | 'credentials' | 'oauth';
}

export const isResendConfigured = (): boolean => {
  const apiKey = process.env.RESEND_API_KEY || '';
  return Boolean(apiKey && apiKey.trim() !== '' && apiKey.startsWith('re_'));
};

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  sandboxRerouted?: boolean;
  id?: string;
  messageId?: string;
  deliveredTo?: string;
  intendedRecipient?: string;
  message?: string;
  error?: string;
  warning?: string;
}

/**
 * Universal Resend API dispatcher using fetch
 */
async function sendViaResend({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.RESEND_FROM_EMAIL || 'AETHER Store <onboarding@resend.dev>';
  const fromEmail = from || defaultFrom;
  const recipients = Array.isArray(to) ? to : [to];

  if (!isResendConfigured()) {
    console.log('[Resend Simulation] RESEND_API_KEY not configured. Simulating dispatch:');
    console.log(`To: ${recipients.join(', ')} | Subject: ${subject}`);
    return {
      success: true,
      simulated: true,
      id: `simulated-resend-${Date.now()}`,
      message: 'Simulated email dispatch successful. Add RESEND_API_KEY (re_...) to .env.local to send live emails.',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject,
        html,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.warn('[Resend API Warning]', responseData);

      // Check for Resend testing domain restriction (Free tier limitation where emails can only go to account owner)
      const errorMsg = String(responseData.message || responseData.name || '');
      const isRestrictedToOwner =
        errorMsg.includes('You can only send testing emails to your own email address') ||
        errorMsg.includes('Invalid `to` field') ||
        errorMsg.includes('domain is not verified') ||
        res.status === 403 ||
        res.status === 422;

      if (isRestrictedToOwner) {
        // Extract owner email from Resend message if present, or fallback to registered owner
        const match = errorMsg.match(/\(([^)]+@[^)]+)\)/);
        const ownerEmail = match ? match[1] : 'keviloq@gmail.com';

        // Prepend informative sandbox notice to the HTML email
        const sandboxHtml = `
          <div style="background-color: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="color: #38bdf8; font-weight: 700; font-size: 14px; margin-bottom: 6px;">
              ⚡ AETHER Resend Testing Sandbox Notice
            </div>
            <div style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
              This notification was generated for customer: <strong style="color: #f1f5f9;">${recipients.join(', ')}</strong>.<br/>
              Delivered directly to your verified testing inbox (<strong>${ownerEmail}</strong>) in Resend Sandbox Mode.
            </div>
          </div>
          ${html}
        `;

        try {
          const retryRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'AETHER Store <onboarding@resend.dev>',
              to: [ownerEmail],
              subject: `[AETHER Sandbox • ${recipients.join(', ')}] ${subject}`,
              html: sandboxHtml,
            }),
          });

          const retryData = await retryRes.json();
          if (retryRes.ok && retryData.id) {
            console.log(`[Resend Sandbox] Successfully rerouted to verified owner (${ownerEmail}). ID: ${retryData.id}`);
            return {
              success: true,
              simulated: false,
              sandboxRerouted: true,
              id: retryData.id,
              deliveredTo: ownerEmail,
              intendedRecipient: recipients.join(', '),
              message: `Delivered to verified Resend account (${ownerEmail}) in testing sandbox mode.`,
            };
          }
        } catch (retryErr) {
          console.warn('[Resend Retry Error]', retryErr);
        }
      }

      // If live delivery still failed, gracefully simulate rather than breaking checkout or auth
      return {
        success: true,
        simulated: true,
        id: `resend-sim-${Date.now()}`,
        warning: responseData.message || 'Resend domain unverified, simulated dispatch',
        message: 'Notification simulated successfully.',
      };
    }

    return {
      success: true,
      simulated: false,
      id: responseData.id,
      message: 'Email delivered successfully via Resend',
    };
  } catch (err: any) {
    console.error('[Resend Network Exception]', err);
    // Graceful simulation fallback on network failure
    return {
      success: true,
      simulated: true,
      id: `simulated-fallback-${Date.now()}`,
      message: `Simulated dispatch: ${err.message}`,
    };
  }
}

/**
 * Sends order confirmation receipt email via Resend
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const currency = data.currency || process.env.NEXT_PUBLIC_STORE_CURRENCY || 'NGN';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0e131f; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; }
    .header { padding: 32px; background: linear-gradient(135deg, #131b2a, #07090e); border-bottom: 1px solid #1f293d; text-align: center; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: 3px; color: #38bdf8; text-transform: uppercase; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; }
    .content { padding: 32px; }
    .success-badge { display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .order-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
    .order-meta { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #243048; }
    .items-table td { padding: 14px 0; border-bottom: 1px solid #1e293b; color: #e2e8f0; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #94a3b8; }
    .grand-total { font-size: 18px; font-weight: 700; color: #38bdf8; border-top: 1px solid #243048; padding-top: 12px; margin-top: 8px; }
    .address-card { background: #07090e; border-radius: 10px; padding: 16px; margin: 24px 0; border: 1px solid #1e293d; font-size: 14px; line-height: 1.5; color: #cbd5e1; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand">AETHER</h1>
      <p class="subtitle">Luxury Electronics & Precision Acoustic Hardware</p>
    </div>
    <div class="content">
      <div class="success-badge">✓ Order Confirmed</div>
      <h2 class="order-title">Thank you for your order, ${data.customerName}!</h2>
      <p class="order-meta">Order ID: <strong>#${data.orderNumber}</strong> • Insured Dispatch</p>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item) => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">${formatPrice(item.price * item.quantity, currency)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div style="margin-top: 16px;">
        <div class="total-row"><span>Subtotal:</span><span>${formatPrice(data.subtotal, currency)}</span></div>
        <div class="total-row"><span>Estimated Tax:</span><span>${formatPrice(data.tax, currency)}</span></div>
        <div class="total-row"><span>Delivery / Fees:</span><span>${data.shipping === 0 ? 'FREE' : formatPrice(data.shipping, currency)}</span></div>
        ${data.discount > 0 ? `<div class="total-row" style="color: #4ade80;"><span>Discount:</span><span>-${formatPrice(data.discount, currency)}</span></div>` : ''}
        <div class="total-row grand-total"><span>Total Paid:</span><span>${formatPrice(data.total, currency)}</span></div>
      </div>

      <div class="address-card">
        <strong style="color:#ffffff;">Shipping Destination:</strong><br>
        ${data.shippingAddress.fullName}<br>
        ${data.shippingAddress.street}<br>
        ${data.shippingAddress.city}${data.shippingAddress.state ? `, ${data.shippingAddress.state}` : ''} ${data.shippingAddress.postalCode}<br>
        ${data.shippingAddress.country}
      </div>

      <p style="font-size: 13px; color: #94a3b8;">
        Your order is being prepared in our climate-controlled fulfillment hub. You will receive a tracking notification once the package departs.
      </p>
    </div>
    <div class="footer">
      Questions regarding your order? Contact support@aether-store.com<br>
      © 2026 AETHER Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  return sendViaResend({
    to: data.customerEmail,
    subject: `AETHER Order Confirmation — #${data.orderNumber}`,
    html: htmlContent,
  });
}

/**
 * Sends shipping / tracking update email via Resend
 */
export async function sendShippingUpdateEmail(data: ShippingEmailData) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #07090e; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0e131f; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; padding: 32px; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #38bdf8; text-transform: uppercase; margin-bottom: 24px; }
    .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    .details { background: #07090e; border: 1px solid #1e293d; border-radius: 10px; padding: 18px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">AETHER</div>
    <div class="badge">DISPATCHED</div>
    <h1 style="font-size: 22px; margin-bottom: 10px; color: #fff;">Your hardware is en route</h1>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Hello ${data.customerName}, order <strong>#${data.orderNumber}</strong> has been inspected, packaged in anti-static protective housing, and transferred to our logistics courier.
    </p>
    <div class="details">
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Courier Service</div>
      <div style="font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 10px;">${data.carrier}</div>
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Tracking Reference</div>
      <div style="font-size: 15px; font-weight: 700; color: #38bdf8; font-family: monospace;">${data.trackingNumber}</div>
    </div>
    <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
      © 2026 AETHER Inc. Precision Hardware & Acoustic Engineering.
    </p>
  </div>
</body>
</html>
  `;

  return sendViaResend({
    to: data.to,
    subject: `AETHER Dispatch Notification — Order #${data.orderNumber}`,
    html: htmlContent,
  });
}

/**
 * Sends order fulfillment status update email via Resend
 */
export async function sendStatusUpdateEmail(data: StatusEmailData) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #07090e; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0e131f; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; padding: 32px; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #38bdf8; text-transform: uppercase; margin-bottom: 24px; }
    .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">AETHER</div>
    <div class="badge">${data.status}</div>
    <h1 style="font-size: 22px; margin-bottom: 10px; color: #fff;">Order #${data.orderNumber} Status Update</h1>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Hello ${data.customerName}, the fulfillment status of your order <strong>#${data.orderNumber}</strong> has been updated to: <strong>${data.status.toUpperCase()}</strong>.
    </p>
    ${data.notes ? `<p style="color: #cbd5e1; font-size: 13px; background: #07090e; padding: 12px; border-radius: 8px; border: 1px solid #1e293d;">${data.notes}</p>` : ''}
    <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
      © 2026 AETHER Inc. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return sendViaResend({
    to: data.to,
    subject: `AETHER Order #${data.orderNumber} Update — ${data.status.toUpperCase()}`,
    html: htmlContent,
  });
}

/**
 * Sends security alert email via Resend
 */
export async function sendSecurityAlertEmail(data: SecurityEmailData) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #07090e; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0e131f; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; padding: 32px; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #38bdf8; text-transform: uppercase; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">AETHER // SECURITY</div>
    <h1 style="font-size: 20px; margin-bottom: 10px; color: #fff;">Account Security Notification</h1>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Hello ${data.customerName}, an important security change was performed on your AETHER customer account:
    </p>
    <div style="background: #07090e; padding: 14px; border-radius: 8px; border: 1px solid #1e293d; margin: 16px 0;">
      <div style="color: #34d399; font-weight: 700; font-size: 14px;">${data.event}</div>
      <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Network IP: ${data.ipAddress || 'Authorized session'}</div>
      <div style="color: #64748b; font-size: 12px;">Timestamp: ${new Date().toUTCString()}</div>
    </div>
    <p style="color: #94a3b8; font-size: 13px;">
      If you did not authorize this action, please contact security@aether-store.com immediately.
    </p>
  </div>
</body>
</html>
  `;

  return sendViaResend({
    to: data.to,
    subject: `Security Alert: ${data.event} for AETHER Account`,
    html: htmlContent,
  });
}

/**
 * Sends luxury welcome onboarding email to new customers via Resend
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const name = data.customerName || data.customerEmail.split('@')[0] || 'Valued Member';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0e131f; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { padding: 36px 32px; background: linear-gradient(135deg, #131b2a, #07090e); border-bottom: 1px solid #1f293d; text-align: center; }
    .brand { font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #38bdf8; text-transform: uppercase; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.28); padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
    .title { font-size: 22px; font-weight: 800; margin-bottom: 14px; color: #ffffff; line-height: 1.3; }
    .lead { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
    .perk-box { background: linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(15, 23, 42, 0.6)); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .code-pill { display: inline-block; background: #38bdf8; color: #07090e; font-weight: 800; font-family: monospace; font-size: 16px; letter-spacing: 2px; padding: 6px 16px; border-radius: 6px; margin-top: 10px; }
    .features-list { list-style: none; padding: 0; margin: 24px 0; }
    .features-list li { padding: 10px 0; border-bottom: 1px solid #1a2234; display: flex; align-items: center; gap: 10px; font-size: 14px; color: #94a3b8; }
    .features-list li strong { color: #ffffff; }
    .btn { display: inline-block; background: #38bdf8; color: #07090e; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; text-align: center; margin-top: 12px; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #1a2234; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand">AETHER</h1>
      <p class="subtitle">Luxury Electronics & Precision Acoustic Hardware</p>
    </div>
    <div class="content">
      <div class="badge">Member Access Granted</div>
      <h2 class="title">Welcome to AETHER, ${name}!</h2>
      <p class="lead">
        Your member profile has been successfully initialized. You now have privileged access to our flagship acoustic monitors, minimalist smart watches, and precision engineered mobile devices.
      </p>

      <div class="perk-box">
        <div style="font-size: 12px; text-transform: uppercase; color: #38bdf8; font-weight: 700; letter-spacing: 1px;">Exclusive Welcome Privileges</div>
        <div style="font-size: 15px; color: #ffffff; font-weight: 600; margin-top: 4px;">10% Off Your Inaugural Hardware Acquisition</div>
        <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Apply this promo code during checkout on your first order:</div>
        <div>
          <span class="code-pill">WELCOME10</span>
        </div>
      </div>

      <ul class="features-list">
        <li><span>⚡</span> <span><strong>Express Checkout:</strong> Store your shipping addresses for rapid one-click fulfillment.</span></li>
        <li><span>📦</span> <span><strong>Real-Time Tracking:</strong> Follow your hardware from quality inspection to doorstep delivery.</span></li>
        <li><span>✨</span> <span><strong>Priority Allocations:</strong> Early access to limited edition drops and acoustic engineering releases.</span></li>
      </ul>

      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${siteUrl}" class="btn">Explore Hardware Catalog →</a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
        If you did not initiate this account registration, please notify <a href="mailto:security@aether-store.com" style="color: #38bdf8; text-decoration: none;">security@aether-store.com</a>.
      </p>
    </div>
    <div class="footer">
      AETHER Hardware Inc. • Authentic Craftsmanship & Acoustic Innovation<br>
      © 2026 AETHER Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  return sendViaResend({
    to: data.customerEmail,
    subject: `Welcome to AETHER — Your Journey in Precision Hardware Begins`,
    html: htmlContent,
  });
}
