'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductColor } from '@/lib/products-data';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Zap,
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  CheckCircle2,
  Cpu,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExpressCheckoutModalProps {
  product: Product | null;
  selectedColor?: ProductColor | null;
  quantity?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpressCheckoutModal({
  product,
  selectedColor,
  quantity = 1,
  isOpen,
  onClose,
}: ExpressCheckoutModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [qty, setQty] = useState(quantity);
  const [activeColor, setActiveColor] = useState<ProductColor | null>(selectedColor || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'apple_pay' | 'card'>('card');

  // Customer shipping state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');

  useEffect(() => {
    setQty(quantity);
    if (product && product.colors && product.colors.length > 0) {
      setActiveColor(selectedColor || product.colors[0]);
    }
  }, [product, quantity, selectedColor]);

  // Load user data or local address
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }

    try {
      const savedAddr = localStorage.getItem('aether_latest_shipping_address');
      if (savedAddr) {
        const parsed = JSON.parse(savedAddr);
        if (!name && parsed.name) setName(parsed.name);
        if (!email && parsed.email) setEmail(parsed.email);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.city) setCity(parsed.city);
        if (parsed.country) setCountry(parsed.country);
      }
    } catch (e) {
      console.warn('Failed to load express address cache', e);
    }
  }, [user, isOpen]);

  if (!isOpen || !product) return null;

  const subtotal = product.price * qty;
  const shippingFee = subtotal >= 200 ? 0 : 25; // Free over $200
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + shippingFee + tax;

  const handleInstantBuy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !address.trim() || !city.trim()) {
      alert('Please fill in your shipping destination fields.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Generate Order ID & Serial Number
      const orderNumber = 'AETH-' + Math.floor(100000 + Math.random() * 900000);
      const serialNumber = 'SN-AETH-' + Math.floor(1000 + Math.random() * 9000) + '-REV';

      const orderItem = {
        id: product.id,
        name: product.name,
        product_name: product.name,
        price: product.price,
        unit_price: product.price,
        quantity: qty,
        color: activeColor ? activeColor.name : undefined,
        image: product.image,
      };

      const orderData = {
        id: 'ord_' + Date.now(),
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        shipping_address: `${address}, ${city}, ${country}`,
        items: [orderItem],
        order_items: [orderItem],
        subtotal: subtotal,
        shipping_fee: shippingFee,
        tax: tax,
        total: total,
        payment_method: paymentMethod === 'apple_pay' ? 'Apple Pay' : paymentMethod === 'card' ? 'Insured Direct Card' : 'Paystack',
        payment_status: 'paid',
        order_status: 'Confirmed',
        tracking_carrier: 'FedEx Express International',
        tracking_number: 'FX-EXP-' + Math.floor(100000000 + Math.random() * 900000000),
        serial_number: serialNumber,
        created_at: new Date().toISOString(),
      };

      // 2. Cache in localStorage
      try {
        const userKey = `aether_customer_orders_${email.toLowerCase().trim()}`;
        const existingUserOrders = JSON.parse(localStorage.getItem(userKey) || '[]');
        existingUserOrders.unshift(orderData);
        localStorage.setItem(userKey, JSON.stringify(existingUserOrders));

        const allOrders = JSON.parse(localStorage.getItem('aether_all_placed_orders') || '[]');
        allOrders.unshift(orderData);
        localStorage.setItem('aether_all_placed_orders', JSON.stringify(allOrders));

        localStorage.setItem(
          'aether_latest_shipping_address',
          JSON.stringify({ name, email, address, city, country })
        );
      } catch (err) {
        console.warn('LocalStorage save error', err);
      }

      // 3. Post to API route for server/database persistence
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
      } catch (e) {
        console.warn('API sync warning (continuing with offline-first cache):', e);
      }

      // 4. Confetti trigger
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24'],
      });

      // 5. Navigate to order confirmation
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        router.push(`/order-confirmation?orderId=${orderData.id}`);
      }, 1000);
    } catch (err) {
      console.error('Express Checkout Error', err);
      setIsProcessing(false);
      alert('Encountered an issue processing Express order. Please try again.');
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(10, 14, 23, 0.96)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#07090e',
              }}
            >
              <Zap size={18} fill="#07090e" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                1-Click Express Hardware Checkout
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Encrypted zero-friction priority fulfillment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleInstantBuy} style={{ padding: '24px 28px' }}>
          {/* Hardware Summary Card */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: '#07090e',
                flexShrink: 0,
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {product.categoryLabel}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                {product.name}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Unit: <strong style={{ color: 'var(--primary)' }}>{formatPrice(product.price)}</strong>
                {activeColor && ` • ${activeColor.name}`}
              </div>
            </div>

            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <span style={{ fontWeight: 700, fontSize: '14px', width: '20px', textAlign: 'center' }}>{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Color Variants (if available) */}
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Chassis Metallurgy / Finish: <strong style={{ color: 'var(--text-main)' }}>{activeColor?.name}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActiveColor(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: activeColor?.name === c.name ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: activeColor?.name === c.name ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      color: activeColor?.name === c.name ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: c.hex,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Express Shipping Inputs */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Insured Courier Delivery Destination
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kelvin Asonta"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Street Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="452 Silicon Boulevard, Suite 100"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  City / State
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco, CA"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#0e131f',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Express Instant Payment
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: 'card', label: 'Credit Card', icon: CreditCard },
                { id: 'apple_pay', label: 'Apple Pay', icon: Zap },
                { id: 'paystack', label: 'Paystack Secure', icon: Lock },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={18} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hardware Subtotal ({qty} item{qty > 1 ? 's' : ''})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Insured FedEx Air Transit</span>
              <span style={{ color: shippingFee === 0 ? '#34d399' : undefined }}>
                {shippingFee === 0 ? 'Complimentary ($0.00)' : formatPrice(shippingFee)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Regulatory Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-main)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '10px',
                marginTop: '4px',
              }}
            >
              <span>Total Authorization:</span>
              <span style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: isProcessing ? '#0284c7' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#07090e',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
              transition: 'var(--transition-fast)',
            }}
          >
            {isProcessing ? (
              <>
                <div
                  className="loading-spinner"
                  style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#07090e' }}
                />
                <span>Authorizing & Allocating Hardware...</span>
              </>
            ) : (
              <>
                <Zap size={18} fill="#07090e" />
                <span>Authorize & Dispatch Hardware ({formatPrice(total)})</span>
              </>
            )}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '16px',
              fontSize: '12px',
              color: 'var(--text-dim)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> 256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> 2-Year Factory Warranty
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={12} /> 24h Cleanroom Dispatch
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
