'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import {
  ShoppingBag,
  User as UserIcon,
  Heart,
  LogOut,
  Package,
  Cpu,
  MapPin,
  Bell,
  Scale,
  Menu,
  X,
  Globe,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Search,
} from 'lucide-react';
import AuthModal from './AuthModal';
import NotificationCenter from './NotificationCenter';
import CompareModal from './CompareModal';
import { CURRENCY_SYMBOLS, getStoreCurrency } from '@/lib/currency';

export default function Header() {
  const { itemCount, setIsCartOpen, cartAnimationKey, lastAddedQuantity } = useCart();
  const { wishlistCount } = useWishlist();
  const { compareItems, setIsCompareModalOpen } = useCompare();
  const { user, signOut, openAuthModal } = useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [activeCurrency, setActiveCurrency] = useState('USD');
  const [isCartBumping, setIsCartBumping] = useState(false);

  useEffect(() => {
    if (cartAnimationKey > 0) {
      setIsCartBumping(true);
      const timer = setTimeout(() => setIsCartBumping(false), 950);
      return () => clearTimeout(timer);
    }
  }, [cartAnimationKey]);

  useEffect(() => {
    setActiveCurrency(getStoreCurrency());
  }, []);

  const handleCurrencyChange = (curr: string) => {
    setActiveCurrency(curr);
    localStorage.setItem('aether_currency', curr);
    window.dispatchEvent(new Event('storage'));
    window.location.reload();
  };

  const categories = [
    { label: 'All Collections', href: '/#products' },
    { label: 'Smart Home', href: '/?category=smart-home#products' },
    { label: 'Studio Living', href: '/?category=living#products' },
    { label: 'Smartphones', href: '/?category=smartphone#products' },
    { label: 'Computing', href: '/?category=laptops#products' },
    { label: 'Audiophile', href: '/?category=headphone#products' },
    { label: 'Wearables', href: '/?category=watch#products' },
    { label: 'Acoustics', href: '/?category=speaker#products' },
  ];

  return (
    <>
      <header className="header-wrapper">
        <div className="container">
          <div className="header-inner">
            {/* Logo */}
            <Link href="/" className="brand-link">
              <div className="brand-icon">
                <Cpu size={22} strokeWidth={2.4} />
              </div>
              <span className="brand-name">AETHER</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="nav-links">
              {categories.map((c) => (
                <Link key={c.label} href={c.href} className="nav-item">
                  {c.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Compare Matrix Trigger */}
              <button
                className="btn-icon"
                onClick={() => setIsCompareModalOpen(true)}
                aria-label="View Hardware Comparison"
                title="Hardware Comparison Matrix"
                style={{ position: 'relative' }}
              >
                <Scale size={19} />
                {compareItems.length > 0 && (
                  <span className="cart-count-badge" style={{ background: '#38bdf8', color: '#07090e' }}>
                    {compareItems.length}
                  </span>
                )}
              </button>

              {/* Wishlist Trigger */}
              <Link
                href="/wishlist"
                className="btn-icon"
                aria-label="View Wishlist"
                title="Saved Hardware Wishlist"
                style={{ position: 'relative' }}
              >
                <Heart size={19} />
                {wishlistCount > 0 && (
                  <span className="cart-count-badge" style={{ background: '#f43f5e', color: '#fff' }}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notification Center Trigger */}
              <button
                className="btn-icon"
                onClick={() => setIsNotifOpen(true)}
                aria-label="Notifications"
                title="Hardware Telemetry & Dispatch Alerts"
                style={{ position: 'relative' }}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      boxShadow: '0 0 8px var(--primary)',
                    }}
                  />
                )}
              </button>

              {/* Shopping Bag Trigger with "Item Entered" Animation */}
              <button
                className="btn-icon"
                onClick={() => setIsCartOpen(true)}
                aria-label="View Shopping Cart"
                title="Shopping Bag"
                style={{ position: 'relative', overflow: 'visible' }}
              >
                {/* Shockwave ripple effect when item enters */}
                {isCartBumping && (
                  <span className="cart-shockwave-ring" key={`wave-${cartAnimationKey}`} />
                )}

                {/* Particle entering the bag */}
                {isCartBumping && (
                  <span className="cart-particle-drop" key={`drop-${cartAnimationKey}`} />
                )}

                {/* Floating +1 / +qty tag */}
                {isCartBumping && (
                  <span className="cart-floating-plus" key={`plus-${cartAnimationKey}`}>
                    +{lastAddedQuantity}
                  </span>
                )}

                {/* Animated Bag Icon */}
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  className={isCartBumping ? 'cart-bumping-icon' : ''}
                >
                  <ShoppingBag size={19} />
                </span>

                {/* Animated Count Badge */}
                {itemCount > 0 && (
                  <span className={`cart-count-badge ${isCartBumping ? 'cart-bumping-badge' : ''}`}>
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Account / Profile */}
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                      />
                    ) : (
                      <UserIcon size={15} />
                    )}
                    <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {userDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '220px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-elevated)',
                        padding: '8px',
                        zIndex: 60,
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </div>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <UserIcon size={15} />
                        Account Overview
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setUserDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <Package size={15} />
                        Orders & Tracking
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setUserDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <MapPin size={15} />
                        Address Book
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setUserDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <Heart size={15} color="#f43f5e" />
                        Saved Wishlist
                      </Link>
                      {Boolean(user?.role === 'admin' || user?.role === 'staff') && (
                        <>
                          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                          <Link
                            href="/admin/profile"
                            onClick={() => setUserDropdown(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              color: '#38bdf8',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(56, 189, 248, 0.08)',
                            }}
                          >
                            <ShieldAlert size={15} />
                            Admin Control Center
                          </Link>
                        </>
                      )}
                      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                      <button
                        onClick={() => {
                          signOut();
                          setUserDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: '#f87171',
                          borderRadius: 'var(--radius-sm)',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('signin')}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '13px' }}
                >
                  <UserIcon size={15} />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Menu Hamburger Toggle */}
              <button
                className="mobile-hamburger-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                style={{
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 90,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '320px',
              maxWidth: '85vw',
              height: '100%',
              background: 'rgba(10, 14, 23, 0.98)',
              borderLeft: '1px solid var(--border-subtle)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-elevated)',
              overflowY: 'auto',
            }}
          >
            {/* Top Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="var(--primary)" />
                <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px', fontFamily: 'var(--font-heading)' }}>
                  AETHER
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Hardware Categories */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Hardware Lineup
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {categories.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                    }}
                  >
                    <span>{c.label}</span>
                    <ChevronRight size={14} color="var(--text-dim)" />
                  </Link>
                ))}
              </div>
            </div>

            {/* User Quick Controls */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Hardware Management
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsCompareModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Scale size={16} color="var(--primary)" />
                  <span>Compare Matrix ({compareItems.length})</span>
                </button>

                <Link
                  href="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                  }}
                >
                  <Package size={16} color="var(--primary)" />
                  <span>Live Order Tracking</span>
                </Link>

                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                  }}
                >
                  <Heart size={16} color="#f43f5e" />
                  <span>Saved Wishlist ({wishlistCount})</span>
                </Link>
              </div>
            </div>

            {/* Currency Selector */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Globe size={13} />
                <span>Storefront Currency</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => handleCurrencyChange(curr)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-sm)',
                      background: activeCurrency === curr ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: activeCurrency === curr ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      color: activeCurrency === curr ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {curr} ({CURRENCY_SYMBOLS[curr]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
      <CompareModal />
    </>
  );
}
