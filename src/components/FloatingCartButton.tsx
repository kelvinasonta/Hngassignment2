'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, Move } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

export default function FloatingCartButton() {
  const { itemCount, subtotal, setIsCartOpen, cartAnimationKey, lastAddedQuantity } = useCart();

  // Position state (in pixels from top-left)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isBumping, setIsBumping] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    hasMoved: false,
  });

  const buttonRef = useRef<HTMLDivElement | null>(null);

  // Initialize position on client mount (persisted in localStorage or default to bottom-right)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const defaultMarginX = 85;
    const defaultMarginY = 100;
    const defaultX = Math.max(20, window.innerWidth - defaultMarginX);
    const defaultY = Math.max(20, window.innerHeight - defaultMarginY);

    try {
      const savedPos = localStorage.getItem('aether_floating_cart_pos');
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        const clampedX = Math.min(Math.max(12, parsed.x), window.innerWidth - 75);
        const clampedY = Math.min(Math.max(12, parsed.y), window.innerHeight - 75);
        setPosition({ x: clampedX, y: clampedY });
        return;
      }
    } catch (e) {
      // ignore parsing error
    }

    setPosition({ x: defaultX, y: defaultY });
  }, []);

  // Handle window resize to keep floating button in view
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const clampedX = Math.min(Math.max(12, prev.x), window.innerWidth - 75);
        const clampedY = Math.min(Math.max(12, prev.y), window.innerHeight - 75);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger animation when items are added to cart
  useEffect(() => {
    if (cartAnimationKey > 0) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 950);
      return () => clearTimeout(timer);
    }
  }, [cartAnimationKey]);

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag on primary pointer button
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position?.x || 0,
      initialPosY: position?.y || 0,
      hasMoved: false,
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Movement threshold to distinguish click vs drag (4px)
    if (!dragRef.current.hasMoved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      dragRef.current.hasMoved = true;
    }

    if (dragRef.current.hasMoved && typeof window !== 'undefined') {
      const newX = dragRef.current.initialPosX + deltaX;
      const newY = dragRef.current.initialPosY + deltaY;

      // Clamp inside screen bounds
      const clampedX = Math.min(Math.max(12, newX), window.innerWidth - 72);
      const clampedY = Math.min(Math.max(12, newY), window.innerHeight - 72);

      setPosition({ x: clampedX, y: clampedY });
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // pointer capture might have already been released
    }

    setIsDragging(false);

    // If dragged, save final position to localStorage
    if (dragRef.current.hasMoved) {
      if (position) {
        try {
          localStorage.setItem('aether_floating_cart_pos', JSON.stringify(position));
        } catch (err) {
          // ignore write errors
        }
      }
    } else {
      // Was a pure click/tap -> open the cart drawer!
      setIsCartOpen(true);
    }
  };

  if (!position) return null;

  return (
    <div
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setIsDragging(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 85,
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.25s ease, transform 0.2s ease',
        transform: isDragging ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1)',
      }}
      aria-label="Draggable Floating Cart Button"
      role="button"
      tabIndex={0}
    >
      {/* Floating Button Inner Container */}
      <div
        style={{
          position: 'relative',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(14, 22, 38, 0.95), rgba(7, 10, 18, 0.95))'
            : 'linear-gradient(135deg, rgba(14, 19, 31, 0.9), rgba(7, 9, 14, 0.9))',
          backdropFilter: 'blur(16px)',
          border: isHovered
            ? '1.5px solid rgba(56, 189, 248, 0.7)'
            : '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: isDragging
            ? '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 28px rgba(56, 189, 248, 0.45)'
            : isHovered
            ? '0 16px 36px rgba(0, 0, 0, 0.7), 0 0 22px rgba(56, 189, 248, 0.35)'
            : '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.18)',
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
          <ShoppingBag size={23} color="var(--primary)" />
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
              fontWeight: 800,
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary)',
              color: '#07090e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.8)',
              border: '2px solid #07090e',
            }}
          >
            {itemCount}
          </span>
        )}

        {/* Tiny subtle move grip icon indicating draggable capability */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            opacity: isHovered || isDragging ? 0.7 : 0.25,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        >
          <Move size={9} color="#94a3b8" />
        </div>
      </div>

      {/* Expanded Quick Total Capsule on Hover (Shows subtotal and drag hint) */}
      {isHovered && !isDragging && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: position.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) ? '68px' : 'auto',
            left: position.x <= (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) ? '68px' : 'auto',
            transform: 'translateY(-50%)',
            background: 'rgba(10, 14, 23, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            fontSize: '12px',
            color: 'var(--text-main)',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
            {itemCount > 0 ? formatPrice(subtotal) : 'Bag Empty'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>• Drag to move</span>
        </div>
      )}
    </div>
  );
}
