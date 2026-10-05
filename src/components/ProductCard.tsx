'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { formatPrice } from '@/lib/currency';
import { Star, Plus, Eye, Check, Heart, Scale, Zap } from 'lucide-react';
import ExpressCheckoutModal from './ExpressCheckoutModal';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart, isInCart, getItemQuantity, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();

  const [justAdded, setJustAdded] = useState(false);
  const [isExpressOpen, setIsExpressOpen] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const alreadyInCart = isInCart(product.id);
  const itemQty = getItemQuantity(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist(product);
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCompare(product);
  };

  const handleExpressBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpressOpen(true);
  };

  return (
    <>
      <article className="product-card">
        <Link
          href={`/products/${product.id}`}
          className="card-media-wrap"
          style={{ cursor: 'pointer', position: 'relative', display: 'block' }}
        >
          <img src={product.image} alt={product.name} loading="lazy" />
          {product.badge && <span className="product-badge">{product.badge}</span>}

          {/* Floating Actions on Media */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
            {/* Wishlist Heart */}
            <button
              onClick={handleWishlistToggle}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isWishlisted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(10, 14, 23, 0.75)',
                backdropFilter: 'blur(8px)',
                border: isWishlisted ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isWishlisted ? '#f43f5e' : 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              aria-label="Wishlist item"
            >
              <Heart size={16} fill={isWishlisted ? '#f43f5e' : 'none'} />
            </button>

            {/* Compare Matrix Toggle */}
            <button
              onClick={handleCompareToggle}
              title={isCompared ? 'Remove from Compare Matrix' : 'Add to Hardware Compare Matrix'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isCompared ? 'rgba(56, 189, 248, 0.25)' : 'rgba(10, 14, 23, 0.75)',
                backdropFilter: 'blur(8px)',
                border: isCompared ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isCompared ? 'var(--primary)' : 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              aria-label="Compare hardware"
            >
              <Scale size={15} />
            </button>
          </div>

          <button
            className="quick-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickView(product);
            }}
            aria-label={`Quick view for ${product.name}`}
          >
            <Eye size={14} />
            <span>Telemetry Preview</span>
          </button>
        </Link>

        <div className="card-body">
          <div className="card-category">{product.categoryLabel}</div>
          <Link
            href={`/products/${product.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3 className="card-title" style={{ cursor: 'pointer' }}>
              {product.name}
            </h3>
          </Link>
          <p className="card-tagline">{product.tagline}</p>

          <div className="card-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span>{product.rating.toFixed(1)}</span>
            <span style={{ color: 'var(--text-dim)' }}>({product.reviewsCount} reviews)</span>
          </div>

          <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="card-price">{formatPrice(product.price)}</div>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>● In Stock</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
              {alreadyInCart ? (
                <button
                  key="product-in-bag-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCartOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--primary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                  title="Item already in cart — click to view bag"
                  aria-label={`${product.name} is already in bag`}
                >
                  <Check size={14} />
                  <span>In Bag ({itemQty})</span>
                </button>
              ) : (
                <button
                  key="product-add-cart-btn"
                  onClick={handleAdd}
                  className="add-cart-btn"
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    fontSize: '12px',
                    background: justAdded ? '#34d399' : undefined,
                    color: justAdded ? '#07090e' : undefined,
                    borderColor: justAdded ? '#34d399' : undefined,
                  }}
                  aria-label={`Add ${product.name} to cart`}
                >
                  {justAdded ? (
                    <>
                      <Check size={14} />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleExpressBuy}
                title="Instant 1-Click Checkout"
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.2))',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Zap size={13} fill="#fbbf24" />
                <span>Express Buy</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* 1-Click Express Checkout Modal */}
      <ExpressCheckoutModal
        product={product}
        quantity={1}
        isOpen={isExpressOpen}
        onClose={() => setIsExpressOpen(false)}
      />
    </>
  );
}
