'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/currency';
import { X, Check, Star, ShoppingBag, ShieldCheck, Truck, RotateCcw, Heart, ExternalLink } from 'lucide-react';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const isWishlisted = product ? isInWishlist(product.id) : false;

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '820px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Media Wrap */}
          <div style={{ position: 'relative', background: '#090d14', minHeight: '360px' }}>
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {product.badge && (
              <span
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'rgba(14, 19, 31, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Details */}
          <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', fontWeight: 700, marginBottom: '6px' }}>
              {product.categoryLabel}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              {product.name}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {product.tagline}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{product.rating.toFixed(1)}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>({product.reviewsCount} customer ratings)</span>
            </div>

            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px' }}>
              {formatPrice(product.price)}
            </div>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '20px' }}>
              {product.description}
            </p>

            {/* Features Bullet List */}
            {product.features && product.features.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Key Hardware Specifications:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {product.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Check size={14} color="#38bdf8" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div className="qty-control" style={{ padding: '4px' }}>
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ padding: '6px 12px' }}
                  >
                    -
                  </button>
                  <span className="qty-display" style={{ padding: '6px 12px' }}>{quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ padding: '6px 12px' }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    background: added ? '#34d399' : undefined,
                    color: added ? '#07090e' : undefined,
                  }}
                >
                  {added ? (
                    <>
                      <Check size={18} />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Add to Bag ({formatPrice(product.price * quantity)})</span>
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isWishlisted ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isWishlisted ? '#f43f5e' : 'var(--border-subtle)'}`,
                    color: isWishlisted ? '#f43f5e' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-fast)',
                  }}
                  aria-label="Wishlist toggle"
                >
                  <Heart size={18} fill={isWishlisted ? '#f43f5e' : 'none'} />
                </button>
              </div>

                {/* Link to Dedicated Details Page */}
                <Link
                  href={`/products/${product.id}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    marginTop: '16px',
                    marginBottom: '18px',
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <span>Open Dedicated Hardware Page</span>
                  <ExternalLink size={14} />
                </Link>

                {/* Guarantees */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <Truck size={14} />
                  <span>Insured Express</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <RotateCcw size={14} />
                  <span>30-Day Returns</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} />
                  <span>2-Yr Warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
