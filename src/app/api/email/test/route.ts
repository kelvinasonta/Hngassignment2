import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, isResendConfigured } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recipientEmail = body.email || 'customer@example.com';

    const testData = {
      orderNumber: `AETH-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: body.name || 'Valued Customer',
      customerEmail: recipientEmail,
      items: [
        {
          name: 'Quantum 16 Pro Flagship Smartphone',
          quantity: 1,
          price: 185000,
          image: '/assets/images/phone_crystal.jpg',
        },
      ],
      subtotal: 185000,
      tax: 0,
      shipping: 2500,
      discount: 0,
      total: 187500,
      currency: 'NGN',
      shippingAddress: {
        fullName: body.name || 'Valued Customer',
        street: '15 Admiralty Way',
        city: 'Lekki Phase 1',
        state: 'Lagos',
        postalCode: '105102',
        country: 'Nigeria',
      },
    };

    const result = await sendOrderConfirmationEmail(testData);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      provider: 'Resend',
      isConfigured: isResendConfigured(),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'AETHER Store <onboarding@resend.dev>',
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Test email failed' },
      { status: 500 }
    );
  }
}
