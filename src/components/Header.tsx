'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { ShoppingBag, User as UserIcon, Heart, LogOut, Package, Cpu, MapPin } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

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

            {/* Authentic E-Commerce Navigation */}
            <nav className="nav-links" style={{ display: 'flex', gap: '24px' }}>
              <Link href="/#products" className="nav-item">
                All Hardware
              </Link>
              <Link href="/?category=smartphone#products" className="nav-item">
                Smartphones
              </Link>
              <Link href="/?category=laptops#products" className="nav-item">
                Computing
              </Link>
              <Link href="/?category=headphone#products" className="nav-item">
                Audiophile
              </Link>
              <Link href="/?category=watch#products" className="nav-item">
                Wearables
              </Link>
              <Link href="/?category=speaker#products" className="nav-item">
                Acoustics
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Wishlist Trigger */}
              <Link
                href="/wishlist"
                className="btn-icon"
                aria-label="View Wishlist"
                title="Saved Hardware Wishlist"
                style={{ position: 'relative' }}
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="cart-count-badge" style={{ background: '#f43f5e', color: '#fff' }}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag Trigger */}
              <button
                className="btn-icon"
                onClick={() => setIsCartOpen(true)}
                aria-label="View Shopping Cart"
                title="Shopping Bag"
                style={{ position: 'relative' }}
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && <span className="cart-count-badge">{itemCount}</span>}
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
                      padding: '6px 14px',
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
                      <UserIcon size={16} />
                    )}
                    <span>{user.name.split(' ')[0]}</span>
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
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <UserIcon size={15} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
