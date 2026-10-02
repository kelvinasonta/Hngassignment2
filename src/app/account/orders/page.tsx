'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ExternalLink, Calendar, Truck, CheckCircle2, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        const ords = data.data?.orders || data.orders || [];
        setOrders(ords);
      })
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
      }}
    >
      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
          Order History & Tracking
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Inspect past hardware purchases, courier tracking, and printable receipts.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading your order history...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <Package size={40} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No orders found</h3>
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>You haven't placed any hardware orders yet.</p>
          <Link href="/#products" className="btn-primary" style={{ display: 'inline-flex' }}>
            <span>Explore Hardware Store</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginRight: '12px' }}>
                    #{order.order_number}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(52, 211, 153, 0.1)',
                      color: '#34d399',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {order.order_status || order.status || 'Confirmed'}
                  </span>

                  <Link
                    href={`/order-confirmation?orderId=${order.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--primary)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <span>View Receipt</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

              {/* Items row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {(order.items || order.order_items || []).map((it: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>
                      {it.name || it.product_name} <span style={{ color: 'var(--text-dim)' }}>× {it.quantity}</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(Number(it.price || it.unit_price) * Number(it.quantity))}</span>
                  </div>
                ))}
              </div>

              {/* Tracking & Total info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  fontSize: '13px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Truck size={15} color="var(--primary)" />
                  <span>
                    Carrier: <strong>{order.tracking_carrier || 'FedEx Express'}</strong> • {order.tracking_number || 'Awaiting dispatch scan'}
                  </span>
                </div>

                <div style={{ fontSize: '15px' }}>
                  Total: <strong style={{ color: 'var(--primary)' }}>{formatPrice(Number(order.total))}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
