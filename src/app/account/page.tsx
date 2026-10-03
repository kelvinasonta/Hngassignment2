'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  MapPin,
  ShieldCheck,
  Star,
  ArrowRight,
  Truck,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [stats, setStats] = useState({
    ordersCount: 0,
    addressesCount: 0,
    reviewsCount: 0,
  });

  useEffect(() => {
    const email = user?.email || '';
    const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';

    // Fetch orders count & recent order
    fetch(`/api/orders${emailParam}`)
      .then((res) => res.json())
      .then((data) => {
        let orders = (data.data?.orders || data.orders || []) as any[];

        // Merge with local storage orders
        if (typeof window !== 'undefined') {
          const localUserOrders = email ? JSON.parse(localStorage.getItem(`aether_customer_orders_${email.toLowerCase()}`) || '[]') : [];
          const allLocalOrders = JSON.parse(localStorage.getItem('aether_all_placed_orders') || '[]');
          const combined = [...localUserOrders, ...allLocalOrders];
          combined.forEach((loc) => {
            if (loc && !orders.some((o) => o.id === loc.id || o.order_number === loc.order_number)) {
              orders.unshift(loc);
            }
          });
        }

        setStats((prev) => ({ ...prev, ordersCount: orders.length }));
        if (orders.length > 0) {
          setRecentOrder(orders[0]);
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          const localUserOrders = email ? JSON.parse(localStorage.getItem(`aether_customer_orders_${email.toLowerCase()}`) || '[]') : [];
          const allLocalOrders = JSON.parse(localStorage.getItem('aether_all_placed_orders') || '[]');
          const combined = [...localUserOrders, ...allLocalOrders];
          setStats((prev) => ({ ...prev, ordersCount: combined.length }));
          if (combined.length > 0) setRecentOrder(combined[0]);
        }
      });

    // Fetch addresses count
    fetch(`/api/account/addresses${emailParam}`)
      .then((res) => res.json())
      .then((data) => {
        let addrs = data.data?.addresses || [];
        if (typeof window !== 'undefined') {
          const localKey = `aether_saved_addresses_${email.toLowerCase()}`;
          const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
          const latest = JSON.parse(localStorage.getItem('aether_latest_shipping_address') || 'null');
          const allStored = [...stored, ...(latest ? [latest] : [])];
          if (allStored.length > addrs.length) {
            addrs = allStored;
          }
        }
        setStats((prev) => ({ ...prev, addressesCount: addrs.length }));
      })
      .catch(() => {});

    // Fetch reviews count
    fetch('/api/account/reviews')
      .then((res) => res.json())
      .then((data) => {
        const revs = data.data?.reviews || [];
        setStats((prev) => ({ ...prev, reviewsCount: revs.length }));
      })
      .catch(() => {});
  }, [user]);

  return (
    <div>
      {/* Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 19, 31, 0.95), rgba(26, 35, 56, 0.8))',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--primary)',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={14} /> Welcome Back
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
            {user?.name || 'Valued Customer'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Account linked with <strong>{user?.email || 'Guest Mode'}</strong> • Member of AETHER Hardware Club
          </p>
        </div>

        <Link href="/account/profile" className="btn-secondary" style={{ padding: '10px 18px', fontSize: '13px' }}>
          <span>Edit Profile</span>
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '12px' }}>
            <Package size={20} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Orders</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>{stats.ordersCount}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '12px' }}>
            <MapPin size={20} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Saved Addresses</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>{stats.addressesCount}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24', marginBottom: '12px' }}>
            <Star size={20} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Submitted Reviews</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>{stats.reviewsCount}</div>
        </div>
      </div>

      {/* Most Recent Order */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Latest Transaction</h2>
          <Link href="/account/orders" style={{ fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrder ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                  #{recentOrder.order_number}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '12px' }}>
                  {new Date(recentOrder.created_at).toLocaleDateString()}
                </span>
              </div>

              <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
                {recentOrder.order_status || 'Confirmed'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Total Paid: <strong>{formatPrice(Number(recentOrder.total))}</strong>
              </div>
              <Link
                href={`/order-confirmation?orderId=${recentOrder.id}`}
                style={{ fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Order Receipt</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            No orders logged yet. Visit the catalog to make your first purchase!
          </div>
        )}
      </div>
    </div>
  );
}
