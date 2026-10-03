'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCancelled = searchParams.get('cancelled') === 'true';

  const { cart, subtotal, tax, shipping, total, promoCode, promoDiscount, clearCart } = useCart();
  const { user, signInWithGoogle } = useAuth();

  // Billing Details State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [customerPhone, setCustomerPhone] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [birthday, setBirthday] = useState('');

  // Delivery & Shipping Method
  const [deliveryMethod, setDeliveryMethod] = useState<'door' | 'store' | 'locker'>('door');
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Payment State (Paystack, OPay)
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'opay'>('paystack');

  // Terms & Marketing Checkboxes
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [receiveUpdates, setReceiveUpdates] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill from signed-in user and saved addresses if available
  useEffect(() => {
    if (user) {
      const parts = (user.name || '').trim().split(' ');
      if (!firstName && parts[0]) setFirstName(parts[0]);
      if (!lastName && parts.slice(1).join(' ')) setLastName(parts.slice(1).join(' '));
      if (!customerEmail) setCustomerEmail(user.email);
    }

    if (typeof window !== 'undefined') {
      const email = user?.email || '';
      const savedAddrRaw =
        localStorage.getItem(`aether_saved_addresses_${email.toLowerCase()}`) ||
        localStorage.getItem('aether_latest_shipping_address');
      if (savedAddrRaw) {
        try {
          const parsed = JSON.parse(savedAddrRaw);
          const addr = Array.isArray(parsed) ? parsed[0] : parsed;
          if (addr) {
            if (!streetAddress && addr.streetLine1) setStreetAddress(addr.streetLine1);
            if (!city && addr.city) setCity(addr.city);
            if (!stateRegion && addr.stateRegion) setStateRegion(addr.stateRegion);
            if (!customerPhone && addr.phone) setCustomerPhone(addr.phone);
          }
        } catch {}
      }
    }
  }, [user]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to checkout.');
      return;
    }

    if (!firstName || !lastName || !customerEmail || !streetAddress || !city || !stateRegion) {
      setErrorMessage('Please fill in all required billing details (*).');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Please accept the website terms and conditions to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const orderPayload = {
        customerName: fullName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          fullName,
          street: streetAddress,
          city,
          state: stateRegion,
          postalCode: '100001',
          country,
        },
        items: cart,
        paymentMethod,
        promoCode,
        userId: user?.id || null,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to place order.');
      }

      // Order placed successfully!
      const order = data.data?.order || data.order;
      const guestAccessToken = data.data?.guestAccessToken || '';
      const emailSent = data.data?.email?.success ?? data.email?.success ?? false;
      const paystack = data.data?.paystack;

      // 1. Immediately cache order and address in customer local storage
      try {
        const orderToStore = {
          ...order,
          items: cart,
          order_items: cart,
          shipping_address: orderPayload.shippingAddress,
          customer_name: fullName,
          customer_email: customerEmail,
          created_at: new Date().toISOString(),
        };

        const orderEmail = (customerEmail || user?.email || '').toLowerCase().trim();
        if (orderEmail) {
          const userOrderKey = `aether_customer_orders_${orderEmail}`;
          const currentOrders = JSON.parse(localStorage.getItem(userOrderKey) || '[]');
          localStorage.setItem(userOrderKey, JSON.stringify([orderToStore, ...currentOrders.filter((o: any) => o.id !== order.id)]));
        }

        const allOrders = JSON.parse(localStorage.getItem('aether_all_placed_orders') || '[]');
        localStorage.setItem('aether_all_placed_orders', JSON.stringify([orderToStore, ...allOrders.filter((o: any) => o.id !== order.id)]));

        // 2. Automatically save shipping address for this customer
        const savedAddressObj = {
          id: `addr-${Date.now()}`,
          fullName,
          streetLine1: streetAddress,
          streetLine2: '',
          city,
          stateRegion,
          postalCode: '100001',
          countryCode: country === 'Nigeria' ? 'NG' : 'US',
          phone: customerPhone,
          isDefault: true,
          addressType: 'shipping',
          createdAt: new Date().toISOString(),
        };

        const addressKey = `aether_saved_addresses_${orderEmail || 'default'}`;
        const existingAddresses = JSON.parse(localStorage.getItem(addressKey) || '[]');
        localStorage.setItem(
          addressKey,
          JSON.stringify([savedAddressObj, ...existingAddresses.filter((a: any) => a.streetLine1 !== streetAddress)])
        );
        localStorage.setItem('aether_latest_shipping_address', JSON.stringify(savedAddressObj));

        // Persist to server address endpoint
        fetch('/api/account/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedAddressObj),
        }).catch(() => {});
      } catch (cacheErr) {
        console.warn('Failed to cache order and address locally', cacheErr);
      }

      // If Paystack authorization URL is returned, redirect directly to Paystack payment gateway
      if (paystack?.authorizationUrl) {
        window.location.href = paystack.authorizationUrl;
        return;
      }

      clearCart();
      router.push(
        `/order-confirmation?orderId=${order.id}&token=${encodeURIComponent(guestAccessToken)}&emailStatus=${emailSent ? 'sent' : 'failed'}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--text-muted)',
              transition: 'var(--transition-fast)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Store</span>
          </Link>
        </div>

        {isCancelled && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Payment Session Cancelled</strong>
              <span style={{ fontSize: '13px' }}>
                Your payment session was cancelled. No charges were made. Your items are preserved below.
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} id="checkout-form">
          <div className="checkout-grid">
            {/* LEFT COLUMN: Billing details, Delivery Method, Shipping Details */}
            <div>
              {/* Billing details Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Billing details
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Enter your billing details
                </p>

                {/* First Name & Last Name */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="first-name">
                      First Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      name="given-name"
                      autoComplete="given-name"
                      required
                      className="form-input"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="last-name">
                      Last Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      name="family-name"
                      autoComplete="family-name"
                      required
                      className="form-input"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address & Country/Region */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      required
                      className="form-input"
                      placeholder="Enter email address"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="country">
                      Country/Region <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        id="country"
                        name="country"
                        autoComplete="country-name"
                        className="form-input"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{ appearance: 'none', background: '#0e131f', width: '100%', paddingRight: '36px' }}
                      >
                        <option value="Nigeria">Nigeria</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Kenya">Kenya</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Germany">Germany</option>
                      </select>
                      <ChevronDown
                        size={16}
                        color="var(--text-dim)"
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & State */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                      Phone <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      className="form-input"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="state">
                      State <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        id="state"
                        name="state"
                        autoComplete="address-level1"
                        required
                        className="form-input"
                        value={stateRegion}
                        onChange={(e) => setStateRegion(e.target.value)}
                        style={{ appearance: 'none', background: '#0e131f', width: '100%', paddingRight: '36px' }}
                      >
                        <option value="">Select an option...</option>
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja (FCT)">Abuja (FCT)</option>
                        <option value="Rivers">Rivers</option>
                        <option value="Oyo">Oyo</option>
                        <option value="Kano">Kano</option>
                        <option value="Delta">Delta</option>
                        <option value="Ogun">Ogun</option>
                        <option value="Enugu">Enugu</option>
                        <option value="California">California</option>
                        <option value="London">London</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown
                        size={16}
                        color="var(--text-dim)"
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Company Name (optional) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="company">
                    Company Name <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="organization"
                    autoComplete="organization"
                    className="form-input"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label" htmlFor="city">
                    City <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      required
                      className="form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ appearance: 'none', background: '#0e131f', width: '100%', paddingRight: '36px' }}
                    >
                      <option value="">Select an option...</option>
                      <option value="Ikeja">Ikeja</option>
                      <option value="Lekki">Lekki</option>
                      <option value="Victoria Island">Victoria Island</option>
                      <option value="Yaba">Yaba</option>
                      <option value="Surulere">Surulere</option>
                      <option value="Abuja Central">Abuja Central</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                      <option value="Ibadan">Ibadan</option>
                      <option value="San Francisco">San Francisco</option>
                      <option value="New York">New York</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown
                      size={16}
                      color="var(--text-dim)"
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                  </div>
                </div>

                {/* Street address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="street">
                    Street address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street-address"
                    autoComplete="street-address"
                    required
                    className="form-input"
                    placeholder="House number and street name"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                  />
                </div>

                {/* Birthday (optional) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="birthday">
                    Birthday <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      id="birthday"
                      name="bday"
                      autoComplete="bday"
                      className="form-input"
                      placeholder="mm/dd/yyyy"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      style={{ width: '100%', colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px 32px',
                  marginBottom: '24px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
                  Delivery Method
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  {/* Door Delivery */}
                  <div
                    onClick={() => setDeliveryMethod('door')}
                    style={{
                      border: deliveryMethod === 'door' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 22px',
                      background: deliveryMethod === 'door' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--text-main)',
                      boxShadow: deliveryMethod === 'door' ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    Door Delivery
                  </div>

                  {/* Store Pickup */}
                  <div
                    onClick={() => setDeliveryMethod('store')}
                    style={{
                      border: deliveryMethod === 'store' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px 22px',
                      background: deliveryMethod === 'store' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      boxShadow: deliveryMethod === 'store' ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>
                      Store Pickup
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                      Ready within 48 hours. We will email you when it is ready.
                    </div>
                  </div>
                </div>

                {/* Locker Pickup */}
                <div
                  onClick={() => setDeliveryMethod('locker')}
                  style={{
                    border: deliveryMethod === 'locker' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 22px',
                    background: deliveryMethod === 'locker' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    boxShadow: deliveryMethod === 'locker' ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>
                    Locker Pickup
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    Ready within 48 hours. We will email you when it is ready.
                  </div>
                </div>
              </div>

              {/* Shipping Details Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 32px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Shipping Details
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Enter your shipping details
                </p>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  />
                  <span>Same as billing address</span>
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN: Summary + Payment Gateways + Agreements + Place Order */}
            <aside>
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                {/* Summary Title */}
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>
                  Summary
                </h2>

                {/* Items List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '18px' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Your shopping cart is currently empty.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          paddingBottom: '14px',
                          marginBottom: '14px',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <span>Subtotal</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  <span>Transaction fees</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {shipping === 0 ? '₦0.00' : formatPrice(shipping)}
                  </span>
                </div>

                <div
                  style={{
                    height: '1px',
                    background: 'var(--border-subtle)',
                    margin: '12px 0 16px',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Total</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    {formatPrice(total)}
                  </span>
                </div>

                {/* PAYMENT METHODS SELECTOR (STACKED RADIO CARDS) */}
                <div style={{ marginBottom: '24px' }}>
                  {/* Option 1: Paystack Payments Card */}
                  <div
                    onClick={() => setPaymentMethod('paystack')}
                    style={{
                      border: paymentMethod === 'paystack' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 18px',
                      background: paymentMethod === 'paystack' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      boxShadow: paymentMethod === 'paystack' ? '0 0 15px rgba(56, 189, 248, 0.12)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: paymentMethod === 'paystack' ? '2px solid var(--primary)' : '2px solid var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {paymentMethod === 'paystack' && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
                        Paystack Payments - Pay with Debit/Credit Cards / Bank Transfer / USSD
                      </span>
                    </div>

                    <div style={{ marginLeft: '28px', marginTop: '12px' }}>
                      <div
                        style={{
                          background: '#ffffff',
                          borderRadius: '6px',
                          padding: '7px 14px',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#64748b',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            letterSpacing: '0.2px',
                          }}
                        >
                          <span style={{ height: '1px', width: '10px', background: '#cbd5e1' }} />
                          <span>Secured by <strong style={{ color: '#09101d', fontWeight: 700 }}>paystack</strong></span>
                          <span style={{ height: '1px', width: '10px', background: '#cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Paystack Bars Icon */}
                          <svg width="18" height="14" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect y="0" width="24" height="3" rx="1.5" fill="#00C3F7" />
                            <rect y="5" width="16" height="3" rx="1.5" fill="#00C3F7" />
                            <rect y="10" width="24" height="3" rx="1.5" fill="#00C3F7" />
                            <rect y="15" width="10" height="3" rx="1.5" fill="#00C3F7" />
                          </svg>

                          {/* Mastercard Official Overlapping Circles */}
                          <svg width="28" height="18" viewBox="0 0 36 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="11" r="10" fill="#EB001B" />
                            <circle cx="24" cy="11" r="10" fill="#F79E1B" fillOpacity="0.94" />
                            <path
                              d="M18 4.2A9.95 9.95 0 0 0 14.15 11c0 2.84 1.2 5.4 3.85 7.15A9.95 9.95 0 0 0 21.85 11 9.95 9.95 0 0 0 18 4.2Z"
                              fill="#FF5F00"
                            />
                          </svg>

                          {/* VISA Official Wordmark */}
                          <svg width="34" height="15" viewBox="0 0 54 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M21.5 1.5L14.1 17H9.2L5.6 3.3C5.4 2.4 5.2 2.1 4.5 1.7 3.5 1.1 1.7 0.6 0 0.2L0.1 1.5H8C9 1.5 9.9 2.2 10.1 3.4L12 13.6 16.7 1.5H21.5ZM40.4 12.7C40.4 7.9 33.7 7.6 33.8 5.5 33.8 4.8 34.4 4.1 35.8 4C36.4 3.9 38.3 3.8 40.3 4.8L41.1 1C40 0.6 38.5 0.2 36.7 0.2 32.2 0.2 29 2.6 29 6C29 8.5 31.3 9.9 33 10.8 34.8 11.6 35.4 12.2 35.4 13 35.4 14.2 34 14.7 32.7 14.7 30.4 14.7 29.1 14 28 13.5L27.2 17.4C28.3 17.9 30.3 18.3 32.4 18.3 37.2 18.3 40.4 15.9 40.4 12.7ZM52.3 17H56.5L52.9 1.5H49.1C48.2 1.5 47.5 2 47.1 2.8L40.3 17H45.1L46.1 14.4H51.9L52.3 17ZM47.4 10.7L49.8 4.1 51.2 10.7H47.4ZM28.2 1.5L24.4 17H19.9L23.7 1.5H28.2Z"
                              fill="#1434CB"
                            />
                          </svg>

                          {/* Verve Official Logo */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#E11938',
                              borderRadius: '4px',
                              padding: '2px 7px',
                              height: '16px',
                            }}
                          >
                            <span
                              style={{
                                color: '#FFFFFF',
                                fontWeight: 900,
                                fontStyle: 'italic',
                                fontSize: '10px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                letterSpacing: '-0.3px',
                              }}
                            >
                              verve
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: OPay Payment Gateway Card */}
                  <div
                    onClick={() => setPaymentMethod('opay')}
                    style={{
                      border: paymentMethod === 'opay' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 18px',
                      background: paymentMethod === 'opay' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      boxShadow: paymentMethod === 'opay' ? '0 0 15px rgba(56, 189, 248, 0.12)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: paymentMethod === 'opay' ? '2px solid var(--primary)' : '2px solid var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {paymentMethod === 'opay' && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        OPay Payment Gateway
                      </span>
                    </div>

                    <div style={{ margin: '10px 0 4px 28px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '4px solid #10b981',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ fontWeight: 800, fontSize: '20px', color: '#10b981', letterSpacing: '-0.5px' }}>
                        Pay
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Checkboxes */}
                <div style={{ marginBottom: '22px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      marginBottom: '10px',
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', marginTop: '2px', cursor: 'pointer' }}
                      required
                    />
                    <span>
                      I have read and agree to the website{' '}
                      <Link href="/terms" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>
                        terms and conditions
                      </Link>{' '}
                      <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={receiveUpdates}
                      onChange={(e) => setReceiveUpdates(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', marginTop: '2px', cursor: 'pointer' }}
                    />
                    <span>I want to receive updates about products and promotions.</span>
                  </label>
                </div>

                {/* Big Place Order Button (Matching Reference Image) */}
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: isSubmitting || cart.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#38bdf8' }} />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <span>Place order</span>
                  )}
                </button>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
