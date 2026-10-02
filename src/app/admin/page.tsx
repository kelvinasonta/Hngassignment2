'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Boxes,
  Database,
  Mail,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface AdminMetrics {
  totalGmv: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  averageOrderValue: number;
  lowStockCount: number;
}

interface OrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  category_label?: string;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metrics', {
      headers: { 'x-demo-user': 'admin' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetrics(data.data.metrics);
          setRecentOrders(data.data.recentOrders || []);
          setLowStockProducts(data.data.lowStockProducts || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'CONFIRMED', bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' };
      case 'processing':
        return { label: 'PROCESSING', bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' };
      case 'shipped':
        return { label: 'SHIPPED', bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' };
      case 'delivered':
        return { label: 'DELIVERED', bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399' };
      default:
        return { label: status.toUpperCase(), bg: 'rgba(255, 255, 255, 0.08)', color: '#fff' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Metrics Banner */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          Calculating live metrics across stores...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total GMV</span>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)' }}>
                  <DollarSign size={18} color="#34d399" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                ${metrics?.totalGmv.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: '12px', color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={13} /> High-ticket acoustics & hardware
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)' }}>
                  <ShoppingBag size={18} color="#38bdf8" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {metrics?.totalOrders || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                Avg Ticket: ${metrics?.averageOrderValue || 0}
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Fulfillment</span>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)' }}>
                  <Clock size={18} color="#fbbf24" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fbbf24' }}>
                {metrics?.pendingOrders || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                Needs packaging & dispatch
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Low Stock Alert</span>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)' }}>
                  <AlertTriangle size={18} color="#ef4444" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: (metrics?.lowStockCount || 0) > 0 ? '#ef4444' : '#fff' }}>
                {metrics?.lowStockCount || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                Items below 5 units
              </div>
            </div>
          </div>

          {/* Quick Fulfillment Orders Queue */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  Recent Orders & Queue
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  Orders requiring verification, label printing, and courier transfer.
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                View All Orders <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px' }}>Order Number</th>
                    <th style={{ padding: '10px 12px' }}>Customer</th>
                    <th style={{ padding: '10px 12px' }}>Amount</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => {
                    const badge = getStatusBadge(ord.status);
                    return (
                      <tr
                        key={ord.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {ord.order_number}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{ord.customer_email}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>
                          ${Number(ord.total).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '12px',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(ord.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Link
                            href={`/admin/orders?highlight=${ord.order_number}`}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock & System Telemetry Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Low Inventory Warnings */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Boxes size={18} color="var(--primary)" /> Inventory Replenishment Watch
                </h3>
                <Link href="/admin/products" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
                  Catalog
                </Link>
              </div>

              {lowStockProducts.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '13px', padding: '16px 0' }}>
                  All hardware SKUs maintain healthy inventory buffers.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>${p.price}</div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                          {p.stock_quantity} remaining
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cloud Services Telemetry */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                Infrastructure & Telemetry
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>PostgreSQL / Supabase</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>19 Normalized Tables & RLS</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>OPERATIONAL</span>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Mailgun Transactional Mail</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Order & Dispatch Triggers</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>STANDBY READY</span>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <KeyRound size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Google Cloud OAuth 2.0</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cross-Platform Identity</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
