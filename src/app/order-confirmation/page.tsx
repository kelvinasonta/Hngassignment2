'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  Truck,
  Package,
  ShieldCheck,
  ArrowRight,
  Printer,
  Copy,
  Check,
  CreditCard,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useCart } from '@/context/CartContext';
import { getSupabaseBrowserClient } from '@/lib/supabase';

type PaymentOutcome = 'verifying' | 'approved' | 'failed' | 'cancelled' | 'pending';

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const token = searchParams.get('token');
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const isPaystackPayment = searchParams.get('payment') === 'paystack' || Boolean(reference);
  const wasCancelledParam = searchParams.get('cancelled') === 'true';

  const { clearCart } = useCart();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paymentOutcome, setPaymentOutcome] = useState<PaymentOutcome>('verifying');
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [gatewayMessage, setGatewayMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Poll counter for pending transactions
  const [pollCount, setPollCount] = useState(0);

  const verifyTransaction = async (ref: string) => {
    try {
      const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(ref)}`);
      const data = await res.json();

      if (data.success && data.data) {
        const result = data.data;
        setVerificationDetails(result);
        if (result.order) {
          setOrder(result.order);
        }

        const status = result.status;
        if (status === 'success' || result.verified) {
          setPaymentOutcome('approved');
          // Clear shopping bag now that payment is confirmed
          clearCart();
          // Fire celebratory confetti
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#38bdf8', '#818cf8', '#34d399', '#f59e0b'],
            });
          } catch (e) {
            // ignore
          }
        } else if (status === 'failed') {
          setPaymentOutcome('failed');
          setGatewayMessage(result.gatewayResponse || 'The payment was declined by the card issuer or banking rail.');
        } else if (status === 'abandoned') {
          setPaymentOutcome('cancelled');
          setGatewayMessage('The Paystack checkout session was cancelled or left unfinished.');
        } else if (status === 'pending' || status === 'ongoing') {
          setPaymentOutcome('pending');
          setGatewayMessage('Awaiting settlement confirmation from your bank or card rail.');
        } else {
          setPaymentOutcome('pending');
        }
      } else {
        setPaymentOutcome('failed');
        setGatewayMessage(data.message || 'Unable to confirm transaction status.');
      }
    } catch (err: any) {
      console.warn('Paystack verify network error:', err);
      setPaymentOutcome('failed');
      setGatewayMessage('Temporary communication delay with payment gateway.');
    }
  };

  useEffect(() => {
    if (wasCancelledParam) {
      setPaymentOutcome('cancelled');
      setGatewayMessage('Checkout session was cancelled before completing payment.');
    }

    if (reference) {
      verifyTransaction(reference);
    } else if (!isPaystackPayment) {
      // Non-Paystack payment (e.g. Wire transfer / direct order)
      setPaymentOutcome('approved');
      clearCart();
    } else {
      setPaymentOutcome('pending');
    }

    // Load order data from database
    if (orderId) {
      const url = token
        ? `/api/orders/${orderId}?token=${encodeURIComponent(token)}`
        : `/api/orders/${orderId}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const loadedOrder = data.data?.order || data.order;
          if (data.success && loadedOrder) {
            setOrder(loadedOrder);

            // If order payment status is already paid
            if (loadedOrder.payment_status === 'paid') {
              setPaymentOutcome('approved');
              clearCart();
            } else if (loadedOrder.payment_status === 'failed') {
              setPaymentOutcome('failed');
            }
          }
        })
        .catch((err) => console.warn('Order fetch error:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, token, reference, wasCancelledParam]);

  // Supabase Realtime order status subscription & live sync
  useEffect(() => {
    if (!orderId) return;

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const channel = supabase
          .channel(`order-live-${orderId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${orderId}`,
            },
            (payload) => {
              if (payload.new) {
                console.log('[Supabase Realtime Order Update]', payload.new);
                setOrder((prev) => (prev ? { ...prev, ...payload.new } : (payload.new as any)));
                if (payload.new.payment_status === 'paid') {
                  setPaymentOutcome('approved');
                  clearCart();
                }
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } catch (err) {
      console.warn('Realtime subscription not available:', err);
    }
  }, [orderId, clearCart]);

  // Auto-poll for pending bank transfer settlements
  useEffect(() => {
    if (paymentOutcome === 'pending' && reference && pollCount < 6) {
      const timer = setTimeout(() => {
        setPollCount((prev) => prev + 1);
        verifyTransaction(reference);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentOutcome, reference, pollCount]);

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1-Click Paystack Retry Handler
  const handleRetryPaystack = async () => {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id || orderId,
          orderNumber: order?.order_number || reference,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        throw new Error(data.message || 'Could not re-initialize Paystack session.');
      }
    } catch (err: any) {
      setRetryError(err.message || 'Payment service is busy. Please try again.');
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '120px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', marginBottom: '16px' }}>
          <RefreshCw size={28} className="animate-spin" color="var(--primary)" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
          Retrieving Order & Payment Details...
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Connecting to secure server registry
        </p>
      </div>
    );
  }

  if (!order && !reference) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Order Details Ready</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Your transaction has been processed. If your order details did not load automatically, you can view your order in the Orders Dashboard.
          </p>
          <Link href="/orders" className="btn-primary">
            <span>View All Orders</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* ========================================================
            OUTCOME 1: PAYMENT APPROVED & VERIFIED
        ======================================================== */}
        {paymentOutcome === 'approved' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 19, 31, 0.95), rgba(26, 35, 56, 0.8))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '2px solid rgba(52, 211, 153, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#34d399',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(52, 211, 153, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
              }}
            >
              Payment Confirmed & Verified
            </span>

            <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Thank You For Your Order!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '560px', margin: '0 auto 24px' }}>
              We've confirmed your payment and registered your order in our fulfillment queue. An itemized receipt has been dispatched to <strong>{order?.customer_email}</strong>.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '8px 20px',
                fontSize: '14px',
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>Order Reference:</span>
              <strong style={{ color: 'var(--primary)', letterSpacing: '1px' }}>
                #{order?.order_number || reference}
              </strong>
              <button
                onClick={copyOrderNumber}
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                title="Copy Order Number"
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            OUTCOME 2: PAYMENT FAILED / DECLINED
        ======================================================== */}
        {paymentOutcome === 'failed' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(20, 24, 38, 0.95))',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#f87171',
              }}
            >
              <XCircle size={36} />
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
              }}
            >
              Payment Declined
            </span>

            <h1 style={{ fontSize: '30px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Your Payment Could Not Be Completed
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '560px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              {gatewayMessage ? (
                <>Paystack reported: <strong>"{gatewayMessage}"</strong>. No funds have been deducted from your account.</>
              ) : (
                'The banking rail or card provider was unable to authorize this transaction. No funds were debited.'
              )}
            </p>

            {retryError && (
              <div style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                {retryError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button
                onClick={handleRetryPaystack}
                disabled={isRetrying}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Connecting to Paystack...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Retry Payment with Paystack</span>
                  </>
                )}
              </button>

              <Link
                href="/checkout"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <ShoppingBag size={16} />
                <span>Return to Checkout</span>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================
            OUTCOME 3: PAYMENT CANCELLED / UNFINISHED
        ======================================================== */}
        {paymentOutcome === 'cancelled' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(20, 24, 38, 0.95))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#fbbf24',
              }}
            >
              <Clock size={36} />
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
              }}
            >
              Payment Unfinished / Cancelled
            </span>

            <h1 style={{ fontSize: '30px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Payment Session Was Closed
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '560px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              You left or cancelled the checkout session on Paystack before completing authorization. Your order details (#{order?.order_number || reference}) are preserved, and no charges were made.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button
                onClick={handleRetryPaystack}
                disabled={isRetrying}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Re-opening Paystack...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Complete Payment on Paystack</span>
                  </>
                )}
              </button>

              <Link
                href="/checkout"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <ShoppingBag size={16} />
                <span>Return to Shopping Bag</span>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================
            OUTCOME 4: PAYMENT PENDING / AWAITING SETTLEMENT
        ======================================================== */}
        {paymentOutcome === 'pending' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(20, 24, 38, 0.95))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--primary)',
              }}
            >
              <RefreshCw size={32} className="animate-spin" />
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
              }}
            >
              Awaiting Bank Settlement
            </span>

            <h1 style={{ fontSize: '30px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Payment is Currently Processing
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '560px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              Paystack is awaiting final clearance from your bank or card issuer. Direct bank transfers and USSD payments typically settle within 1 to 5 minutes.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button
                onClick={() => reference && verifyTransaction(reference)}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <RefreshCw size={16} />
                <span>Check Settlement Status</span>
              </button>

              <Link
                href="/orders"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <span>View in Orders Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* Live Paystack Verification Status Banner */}
        {reference && verificationDetails && (
          <div
            style={{
              background: paymentOutcome === 'approved' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${paymentOutcome === 'approved' ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={22} color={paymentOutcome === 'approved' ? '#34d399' : 'var(--primary)'} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {paymentOutcome === 'approved'
                    ? 'Paystack Live Payment Verified & Settled'
                    : `Paystack Gateway Status: ${paymentOutcome.toUpperCase()}`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ref: <span style={{ fontFamily: 'monospace' }}>{reference}</span>
                  {verificationDetails?.channel && ` • Rail: ${verificationDetails.channel.toUpperCase()}`}
                  {verificationDetails?.transactionId && ` • Gateway ID: #${verificationDetails.transactionId}`}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: paymentOutcome === 'approved' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                color: paymentOutcome === 'approved' ? '#34d399' : 'var(--text-dim)',
              }}
            >
              {paymentOutcome === 'approved' ? 'Verified & Settled' : paymentOutcome.toUpperCase()}
            </span>
          </div>
        )}

        {/* Clean Dispatched Confirmation Notice Card (No Technical Badges) */}
        {paymentOutcome === 'approved' && order?.customer_email && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Order Confirmation & Itemized Receipt
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Notification dispatched to <strong>{order.customer_email}</strong> with full order manifest.
                </div>
              </div>
            </div>

            <span
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              Dispatched to Inbox
            </span>
          </div>
        )}

        {/* Fulfillment Pipeline Tracker */}
        {order && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              marginBottom: '32px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Shipment Fulfillment Pipeline
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: paymentOutcome === 'approved' ? '#34d399' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={16} /> Step 1: Confirmed
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  {paymentOutcome === 'approved' ? 'Payment settled & order logged' : 'Awaiting confirmation'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: paymentOutcome === 'approved' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>
                  <Package size={16} /> Step 2: Quality Inspection
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Laboratory acoustic check</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                  <ShieldCheck size={16} /> Step 3: Packing
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Static-proof thermal packaging</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                  <Truck size={16} /> Step 4: Dispatch
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Priority courier assigned</div>
              </div>
            </div>
          </div>
        )}

        {/* Itemized Order Receipt */}
        {order && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Order Items</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Placed on {new Date(order.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} />
                <span>Print Receipt</span>
              </button>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {(order.items || []).map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name || item.product_name}
                        style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{item.name || item.product_name}</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Quantity: {item.quantity}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {formatPrice(Number(item.price) * Number(item.quantity))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal || 0))}</span>
              </div>
              {Number(order.discount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                  <span>Discount Applied</span>
                  <span>-{formatPrice(Number(order.discount))}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sales Tax (8%)</span>
                <span>{formatPrice(Number(order.tax || 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Insured Express Shipping</span>
                <span>{Number(order.shipping || 0) === 0 ? 'FREE' : formatPrice(Number(order.shipping))}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  marginTop: '6px',
                }}
              >
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(Number(order.total || 0))}</span>
              </div>
            </div>

            {/* Shipping Address Summary */}
            {order.shipping_address && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                }}
              >
                <strong style={{ color: 'var(--text-main)' }}>Delivery Address:</strong><br />
                {order.shipping_address.fullName}<br />
                {order.shipping_address.street}<br />
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}<br />
                {order.shipping_address.country}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-secondary">
            <span>Continue Shopping</span>
          </Link>
          <Link href="/orders" className="btn-primary">
            <span>View All My Orders</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center' }}>Loading confirmation...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
