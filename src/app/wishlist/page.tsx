'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { Heart, ShoppingBag, ArrowLeft, Trash2, Star, Sparkles } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleMoveAllToCart = () => {
    wishlist.forEach((product) => {
      addToCart(product, 1);
    });
    setIsCartOpen(true);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  return (
    <div style={{ padding: '40px 0 100px', minHeight: '80vh' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--text-muted)',
              transition: 'var(--transition-fast)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Store</span>
          </Link>

          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={14} />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '40px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '24px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}
            >
              <Heart size={14} fill="var(--primary)" />
              <span>Saved Collection</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-heading)', margin: 0 }}>
              Hardware Wishlist
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>
              {wishlist.length === 1
                ? '1 precision hardware item saved in your collection.'
                : `${wishlist.length} precision hardware items saved in your collection.`}
            </p>
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ShoppingBag size={16} />
              <span>Move All to Bag ({wishlist.length})</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'var(--primary)',
              }}
            >
              <Heart size={32} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Your Wishlist is Empty</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '440px', margin: '0 auto 28px' }}>
              Explore our precision acoustic soundboxes, planar audiophile headphones, and flagship hardware to curate your personal collection.
            </p>
            <Link href="/#products" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} />
              <span>Explore Hardware Catalog</span>
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {wishlist.map((product) => (
              <div
                key={product.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition-fast)',
                }}
              >
                {/* Product Image & Badges */}
                <div style={{ position: 'relative', height: '220px', background: '#0a0e17' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    title="Remove from wishlist"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(10, 14, 23, 0.8)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f43f5e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>

                  <span
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: 'rgba(14, 19, 31, 0.85)',
                      backdropFilter: 'blur(6px)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {product.category}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <Star size={13} fill="#fbbf24" color="#fbbf24" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {product.rating || '4.9'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      ({product.reviewsCount || 128})
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      marginBottom: '8px',
                      color: 'var(--text-main)',
                      lineHeight: 1.3,
                    }}
                  >
                    {product.name}
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {product.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '16px',
                      marginTop: 'auto',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Price</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                        {formatPrice(product.price)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn-primary"
                      style={{
                        padding: '10px 16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ShoppingBag size={15} />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
