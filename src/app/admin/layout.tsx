'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tag,
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Terminal,
} from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Executive Metrics', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders & Fulfillment', href: '/admin/orders', icon: Package },
  { label: 'Hardware & Stock', href: '/admin/products', icon: Boxes },
  { label: 'Promotions & Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Audit & Security Logs', href: '/admin/logs', icon: ShieldAlert },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, signInAdminUser } = useAuth();

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // Access check guard
  if (!isAdminOrStaff) {
    return (
      <div style={{ maxWidth: '640px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ShieldAlert size={32} color="#ef4444" />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
            Elevated Access Required
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
            The AETHER Control Terminal is restricted to authorized operations staff and system administrators.
            Your current session is authenticated as {user ? <strong>{user.email} (Customer)</strong> : 'an anonymous guest'}.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '340px', margin: '0 auto' }}>
            <button
              onClick={signInAdminUser}
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
            >
              <UserCheck size={16} /> Enter as Demo Administrator
            </button>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ justifyContent: 'center' }}
            >
              <ArrowLeft size={16} /> Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Admin Top Header Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, #090e17 0%, #111a2e 100%)',
          border: '1px solid var(--border-focus)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Terminal size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'var(--font-heading)' }}>
                AETHER // CONTROL TERMINAL
              </span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                STAFF SECURE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Precision Operations • Hardware Fulfillment • Telemetry
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name || 'Administrator'}</div>
            <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <ShieldCheck size={12} /> {user?.role?.toUpperCase() || 'ADMIN'}
            </div>
          </div>

          <Link
            href="/"
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <ArrowLeft size={14} /> Storefront
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <aside
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            position: 'sticky',
            top: '90px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', padding: '8px 12px', textTransform: 'uppercase' }}>
            Operations Modules
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-dim)'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main>{children}</main>
      </div>
    </div>
  );
}
