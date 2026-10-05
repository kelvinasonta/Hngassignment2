'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Boxes,
  Package,
  Key,
  Server,
  Database,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut,
  Plus,
  Terminal,
  Cpu,
  Layers,
  FileText,
} from 'lucide-react';

export default function AdminProfilePage() {
  const { user, signOut, isSupabaseLive } = useAuth();
  const [stats, setStats] = useState({
    productsCount: 0,
    ordersCount: 0,
    totalStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch('/api/admin/products', { headers: { 'x-demo-user': 'admin' } }),
          fetch('/api/orders?email=admin@aether-store.com'),
        ]);

        const prodData = await prodRes.json();
        const orderData = await orderRes.json();

        const prods = prodData.data?.products || [];
        const totalUnits = prods.reduce((acc: number, p: any) => acc + (p.stock_quantity ?? p.stock ?? 0), 0);

        setStats({
          productsCount: prods.length,
          totalStock: totalUnits,
          ordersCount: (orderData.orders || []).length || 14,
        });
      } catch (err) {
        console.warn('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Banner / Hero Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 9, 14, 0.98))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#07090e',
                boxShadow: '0 0 35px rgba(56, 189, 248, 0.35)',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={40} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  Root Administrator
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ● Active Session
                </span>
              </div>

              <h1 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#f8fafc', marginBottom: '4px' }}>
                {user?.name || 'AETHER Operations Lead'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {user?.email || 'admin@aether-store.com'} • System Node: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>US-EAST-OPS-01</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/products"
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <Plus size={16} /> Add New Stock
            </Link>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <ExternalLink size={15} /> Storefront
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Active Hardware SKUs</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              {loading ? '—' : stats.productsCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Total Warehouse Stock</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
              {loading ? '—' : `${stats.totalStock.toLocaleString()} units`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Orders Processed</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
              {loading ? '—' : stats.ordersCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Database State</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: isSupabaseLive ? '#34d399' : '#fbbf24', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={15} /> {isSupabaseLive ? 'Supabase PostgreSQL' : 'Local High-Speed Ledger'}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Module 1: Hardware & Stock Control */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Boxes size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Hardware Catalog & Stock</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inventory ledger, new device registration</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Register new hardware products with image upload or direct link, replenish stock levels, adjust unit pricing, and maintain SKU allocations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/admin/products"
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '13px', justifyContent: 'center' }}
            >
              <Plus size={15} /> Add New Stock
            </Link>
          </div>
        </div>

        {/* Module 2: Orders & Fulfillment */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Package size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Orders & Fulfillment</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FedEx dispatch telemetry & tracking</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Monitor incoming client orders, update fulfillment milestones, generate tracking codes, and issue itemized commercial invoices.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="btn btn-secondary"
            style={{ fontSize: '13px', justifyContent: 'center' }}
          >
            Open Orders Ledger <ArrowRight size={15} />
          </Link>
        </div>

        {/* Module 3: Security & Ledger Logs */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Security & Audit Logs</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cryptographic activity journal</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Review real-time authentication logs, administrative price modifications, inventory deltas, and automated Resend email triggers.
            </p>
          </div>

          <Link
            href="/admin/logs"
            className="btn btn-secondary"
            style={{ fontSize: '13px', justifyContent: 'center' }}
          >
            Audit System Logs <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Clearances & Session Information Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} color="var(--primary)" />
          <span>Assigned Clearances & Administrative Privileges</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {[
            { scope: 'hardware.catalog.write', desc: 'Add new hardware devices, upload images, adjust buffer stocks' },
            { scope: 'pricing.ledger.mutate', desc: 'Direct override authority for retail and wholesale prices' },
            { scope: 'orders.fulfillment.dispatch', desc: 'Generate FedEx tracking air waybills and mark shipments' },
            { scope: 'promotions.coupon.issue', desc: 'Generate and revoke high-value VIP discount codes' },
            { scope: 'audit.logs.read_all', desc: 'Inspect unredacted client and system activity telemetry' },
            { scope: 'database.schema.sync', desc: 'Bi-directional sync between Supabase and local cache' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                <CheckCircle2 size={13} color="#34d399" />
                <span>{item.scope}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Session authenticated via <strong>{user?.provider === 'google' ? 'Google OAuth 2.0' : 'AETHER Master Auth Protocol'}</strong>.
          </div>
          <button
            onClick={() => signOut()}
            className="btn btn-secondary"
            style={{ fontSize: '12px', color: '#f87171', padding: '6px 14px' }}
          >
            <LogOut size={14} /> Relinquish Admin Session
          </button>
        </div>
      </div>
    </div>
  );
}
