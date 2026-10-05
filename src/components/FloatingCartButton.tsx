'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

export default function FloatingCartButton() {
  const { itemCount, subtotal, setIsCartOpen, cartAnimationKey, lastAddedQuantity } = useCart();

  const [isHovered, setIsHovered] = useState(false);
  const [isBumping, setIsBumping] = useState(false);

  // Trigger animation when items are added to cart
  useEffect(() => {
    if (cartAnimationKey > 0) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 950);
      return () => clearTimeout(timer);
    }
  }, [cartAnimationKey]);

  const handleOpenCart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCartOpen(true);
  };

  return (
    <div
      onClick={handleOpenCart}
      onTouchEnd={handleOpenCart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsCartOpen(true);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="floating-cart-fab"
      aria-label={`View Shopping Bag (${itemCount} items)`}
      role="button"
      tabIndex={0}
      style={{
        position: 'fixed',
        zIndex: 95,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      {/* Floating Button Inner Container */}
      <div
        style={{
          position: 'relative',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(14, 24, 42, 0.98), rgba(7, 10, 18, 0.98))'
            : 'linear-gradient(135deg, rgba(14, 19, 31, 0.95), rgba(7, 9, 14, 0.95))',
          backdropFilter: 'blur(16px)',
          border: isHovered
            ? '1.5px solid rgba(56, 189, 248, 0.75)'
            : '1.5px solid rgba(56, 189, 248, 0.4)',
          boxShadow: isHovered
            ? '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 24px rgba(56, 189, 248, 0.4)'
            : '0 10px 28px rgba(0, 0, 0, 0.65), 0 0 16px rgba(56, 189, 248, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
        }}
      >
        {/* Shockwave ripple when item enters */}
        {isBumping && <span className="cart-shockwave-ring" key={`fab-wave-${cartAnimationKey}`} />}

        {/* Dropping particle into bag */}
        {isBumping && <span className="cart-particle-drop" key={`fab-drop-${cartAnimationKey}`} />}

        {/* Floating +1 / +qty tag */}
        {isBumping && (
          <span className="cart-floating-plus" key={`fab-plus-${cartAnimationKey}`}>
            +{lastAddedQuantity}
          </span>
        )}

        {/* Shopping Bag Icon with squeeze animation */}
        <span
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          className={isBumping ? 'cart-bumping-icon' : ''}
        >
          <ShoppingBag size={24} color="var(--primary)" />
        </span>

        {/* Live Count Pill Badge */}
        {itemCount > 0 && (
          <span
            className={`cart-count-badge ${isBumping ? 'cart-bumping-badge' : ''}`}
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              minWidth: '22px',
              height: '22px',
              padding: '0 6px',
              fontSize: '11px',
              fontWeight: 900,
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary)',
              color: '#07090e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.85)',
              border: '2px solid #07090e',
            }}
          >
            {itemCount}
          </span>
        )}
      </div>

      {/* Expanded Quick Total Capsule on Hover (Desktop) */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '68px',
            transform: 'translateY(-50%)',
            background: 'rgba(10, 14, 23, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            fontSize: '12px',
            color: 'var(--text-main)',
          }}
        >
          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
            {itemCount > 0 ? formatPrice(subtotal) : 'Bag Empty'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>• Click to open</span>
        </div>
      )}
    </div>
  );
}
