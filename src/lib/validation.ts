export interface ValidatedCheckoutInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    variantId?: string;
    quantity: number;
  }>;
  paymentMethod: 'paystack' | 'seerbit' | 'opay' | 'credit_card' | 'apple_pay' | 'bank_transfer';
  promoCode?: string;
}

export function validateCheckoutPayload(body: any): {
  isValid: boolean;
  errors: Record<string, string>;
  data?: ValidatedCheckoutInput;
} {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: { request: 'Invalid request body' } };
  }

  // 1. Customer Name
  const customerName = String(body.customerName || '').trim();
  if (!customerName || customerName.length < 2) {
    errors.customerName = 'Customer full name must be at least 2 characters';
  }

  // 2. Email
  const customerEmail = String(body.customerEmail || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!customerEmail || !emailRegex.test(customerEmail)) {
    errors.customerEmail = 'A valid email address is required';
  }

  // 3. Shipping Address
  const addr = body.shippingAddress;
  if (!addr || typeof addr !== 'object') {
    errors.shippingAddress = 'Shipping address is required';
  } else {
    const street = String(addr.street || addr.address1 || '').trim();
    const city = String(addr.city || '').trim();
    const postalCode = String(addr.postalCode || addr.zip || '').trim();
    const country = String(addr.country || 'United States').trim();

    if (!street) errors['shippingAddress.street'] = 'Street address is required';
    if (!city) errors['shippingAddress.city'] = 'City is required';
    if (!postalCode) errors['shippingAddress.postalCode'] = 'Postal / Zip code is required';
  }

  // 4. Items array
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'Cart must contain at least one item';
  } else {
    for (let i = 0; i < body.items.length; i++) {
      const it = body.items[i];
      if (!it || !it.id) {
        errors[`items[${i}]`] = 'Product ID is missing';
      }
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 50) {
        errors[`items[${i}].quantity`] = 'Quantity must be a positive integer between 1 and 50';
      }
    }
  }

  // 5. Payment Method
  let paymentMethod: 'paystack' | 'seerbit' | 'opay' | 'credit_card' | 'apple_pay' | 'bank_transfer' = 'seerbit';
  if (body.paymentMethod === 'paystack') {
    paymentMethod = 'paystack';
  } else if (body.paymentMethod === 'opay') {
    paymentMethod = 'opay';
  } else if (body.paymentMethod === 'credit_card') {
    paymentMethod = 'credit_card';
  } else if (body.paymentMethod === 'apple_pay') {
    paymentMethod = 'apple_pay';
  } else if (body.paymentMethod === 'bank_transfer' || body.paymentMethod === 'cod') {
    paymentMethod = 'bank_transfer';
  } else {
    paymentMethod = 'seerbit';
  }

  // 6. Promo Code
  const promoCode = body.promoCode ? String(body.promoCode).trim().toUpperCase() : undefined;

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    data: {
      customerName,
      customerEmail,
      customerPhone: body.customerPhone ? String(body.customerPhone).trim() : undefined,
      shippingAddress: {
        fullName: body.shippingAddress.fullName || customerName,
        street: String(body.shippingAddress.street || body.shippingAddress.address1).trim(),
        city: String(body.shippingAddress.city).trim(),
        state: body.shippingAddress.state ? String(body.shippingAddress.state).trim() : undefined,
        postalCode: String(body.shippingAddress.postalCode || body.shippingAddress.zip).trim(),
        country: String(body.shippingAddress.country || 'United States').trim(),
      },
      items: body.items.map((it: any) => ({
        id: String(it.id),
        variantId: it.variantId ? String(it.variantId) : undefined,
        quantity: Math.max(1, Math.min(50, Math.floor(Number(it.quantity)))),
      })),
      paymentMethod,
      promoCode,
    },
  };
}
