'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  Package,
  MapPin,
  ShieldCheck,
  Star,
  LogOut,
  ChevronRight,
  Layers,
  Heart,
} from 'lucide-react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut, openAuthModal } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
      openAuthModal('signin');
    }
  }, [loading, user, router, openAuthModal]);

  const navItems = [
    { label: 'Overview', href: '/account', icon: Layers },
    { label: 'Profile Information', href: '/account/profile', icon: UserIcon },
    { label: 'Order History', href: '/account/orders', icon: Package },
    { label: 'Saved Wishlist', href: '/wishlist', icon: Heart },
    { label: 'Saved Addresses', href: '/account/addresses', icon: MapPin },
    { label: 'Security & Password', href: '/account/security', icon: ShieldCheck },
    { label: 'My Reviews', href: '/account/reviews', icon: Star },
  ];

  // 1. Loading / Redirecting Guard
  if (loading || !user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="loading-spinner"
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {!user ? 'Redirecting to sign-in...' : 'Loading account portal...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Breadcrumb Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Store</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary)' }}>Customer Portal</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Sidebar */}
          <aside
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              position: 'sticky',
              top: '90px',
            }}
          >
            {/* User Mini Card */}
            <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{user?.name || 'Customer'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                    {user?.email || 'Guest Mode'}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#07090e' : 'var(--text-muted)',
                      background: isActive ? 'var(--primary)' : 'transparent',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 0' }} />

              <button
                onClick={() => signOut()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  color: '#f87171',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)',
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Main Account Content Area */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
