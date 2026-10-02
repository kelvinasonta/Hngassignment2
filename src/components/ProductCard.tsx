'use client';

import React from 'react';
import { Product } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/currency';
import { Star, Plus, Eye, Check, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = React.useState(false);
  const isWishlisted = isInWishlist(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article className="product-card">
      <div
        className="card-media-wrap"
        onClick={() => onQuickView(product)}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="product-badge">{product.badge}</span>}

        {/* Floating Wishlist Heart */}
        <button
          onClick={handleWishlistToggle}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
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
            zIndex: 10,
          }}
          aria-label="Wishlist item"
        >
          <Heart size={16} fill={isWishlisted ? '#f43f5e' : 'none'} />
        </button>

        <button
          className="quick-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          aria-label={`Quick view for ${product.name}`}
        >
          <Eye size={14} />
          <span>Quick View</span>
        </button>
      </div>

      <div className="card-body">
        <div className="card-category">{product.categoryLabel}</div>
        <h3
          className="card-title"
          onClick={() => onQuickView(product)}
          style={{ cursor: 'pointer' }}
        >
          {product.name}
        </h3>
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

        <div className="card-footer">
          <div className="card-price">{formatPrice(product.price)}</div>
          <button
            onClick={handleAdd}
            className="add-cart-btn"
            style={{
              background: justAdded ? '#34d399' : undefined,
              color: justAdded ? '#07090e' : undefined,
              borderColor: justAdded ? '#34d399' : undefined,
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            {justAdded ? (
              <>
                <Check size={16} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
