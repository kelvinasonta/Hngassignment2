'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  Search,
  Calendar,
  ExternalLink,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export default function OrdersPage() {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email);
      fetchOrders(user.email);
    } else {
      fetchOrders('');
    }
  }, [user]);

  const fetchOrders = async (targetEmail: string) => {
    setLoading(true);
    try {
      const url = targetEmail
        ? `/api/orders?email=${encodeURIComponent(targetEmail)}`
        : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      const fetchedOrders = data.data?.orders || data.orders;
      if (data.success && fetchedOrders) {
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(emailInput);
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
            Customer Orders & Receipts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            All orders stored securely in Supabase PostgreSQL database. Filter by your customer email to retrieve past transactions.
          </p>
        </div>

        {/* Search by Email Filter */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="email"
                placeholder="Search orders by customer email (e.g. alex.vance@gmail.com)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px 12px 44px',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>
              <span>Search Orders</span>
            </button>
            {emailInput && (
              <button
                type="button"
                onClick={() => {
                  setEmailInput('');
                  fetchOrders('');
                }}
                className="btn-secondary"
                style={{ padding: '12px 16px' }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading orders from Supabase...
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--text-dim)',
              }}
            >
              <Package size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              {searched && emailInput ? `No orders found for "${emailInput}"` : 'No orders logged yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Place a test order from the checkout page to see it instantly reflected here and in Supabase!
            </p>
            <Link href="/checkout" className="btn-primary" style={{ display: 'inline-flex' }}>
              <span>Test Checkout Flow</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  transition: 'var(--transition-fast)',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      #{order.order_number}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#34d399',
                        background: 'rgba(52, 211, 153, 0.1)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={12} />
                      {order.status || 'Confirmed'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <Link
                      href={`/order-confirmation?orderId=${order.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      <span>View Receipt</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>

                {/* Customer and Total Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.customer_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{order.customer_email}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Amount</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatPrice(Number(order.total))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
