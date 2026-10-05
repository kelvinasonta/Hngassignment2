'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Product, INITIAL_PRODUCTS } from '@/lib/products-data';
import ProductCard from '@/components/ProductCard';
import ProductQuickView from '@/components/ProductQuickView';
import HomeImageBanner from '@/components/HomeImageBanner';
import { formatPrice } from '@/lib/currency';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Search,
  Tag,
  Zap,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Layers,
  Check
} from 'lucide-react';

function HomePageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Advanced Faceting & Sorting state
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Sync category param from URL if present
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Fetch products from API endpoint
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const url = new URL('/api/products', window.location.origin);
        if (selectedCategory !== 'all') {
          url.searchParams.set('category', selectedCategory);
        }
        if (searchQuery) {
          url.searchParams.set('q', searchQuery);
        }
        const res = await fetch(url.toString());
        const data = await res.json();
        const prods = data.data?.products || data.products;
        if (data.success && prods) {
          setProducts(prods);
        }
      } catch (err) {
        console.warn('Using local product catalog cache:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Collections' },
    { id: 'smart-home', label: 'Smart Home' },
    { id: 'living', label: 'Studio Living' },
    { id: 'smartphone', label: 'Smartphones' },
    { id: 'laptops', label: 'Computing' },
    { id: 'headphone', label: 'Audiophile' },
    { id: 'watch', label: 'Wearables' },
    { id: 'speaker', label: 'Acoustics' },
  ];

  const materials = [
    { id: 'all', label: 'All Materials' },
    { id: 'brass', label: 'Champagne Brass' },
    { id: 'ceramic', label: 'Sandstone Ceramic' },
    { id: 'aluminum', label: 'Aerospace Aluminum' },
    { id: 'titanium', label: 'Titanium' },
    { id: 'beryllium', label: 'Pure Beryllium' },
  ];

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.price > maxPrice) return false;
        if (inStockOnly && p.stock <= 0) return false;
        if (selectedMaterial !== 'all') {
          const haystack = `${p.materials || ''} ${p.description || ''} ${p.tagline || ''}`.toLowerCase();
          if (!haystack.includes(selectedMaterial.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        return 0; // featured default order
      });
  }, [products, maxPrice, selectedMaterial, inStockOnly, sortBy]);

  const activeFiltersCount =
    (maxPrice < 2500 ? 1 : 0) +
    (selectedMaterial !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const handleResetFilters = () => {
    setMaxPrice(2500);
    setSelectedMaterial('all');
    setInStockOnly(false);
    setSortBy('featured');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0369a1, #0284c7)',
          color: '#ffffff',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <Tag size={14} />
        <span>Limited Launch Offer: Use promo code <strong>WELCOME10</strong> for 10% off or <strong>TECH20</strong> for 20% off at checkout!</span>
      </div>

      {/* Hero Showcase Banner with Rotating Image Carousel */}
      <HomeImageBanner />

      {/* Main Catalog Section */}
      <section id="products" style={{ padding: '40px 0 80px' }}>
        <div className="container">
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', marginBottom: '8px' }}>
              <Zap size={14} /> Curated Hardware
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
              Precision Devices & Acoustic Gear
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Every item is tested to laboratory tolerances and delivered in temperature-controlled protective casing.
            </p>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="filter-tabs-wrapper">
            <div className="category-tabs" role="tablist">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  role="tab"
                  aria-selected={selectedCategory === cat.id}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="search-box">
              <Search size={16} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Search models, specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search hardware products"
              />
            </div>
          </div>

          {/* Sub-bar with Facets Toggle & Sorting */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 18px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  background: isFilterOpen ? 'rgba(56, 189, 248, 0.12)' : undefined,
                  borderColor: isFilterOpen ? 'var(--primary)' : undefined,
                  color: isFilterOpen ? 'var(--primary)' : undefined,
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Filters & Facets</span>
                {activeFiltersCount > 0 && (
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#000',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                Showing <strong>{filteredProducts.length}</strong> of {products.length} models
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={14} color="var(--text-dim)" />
              <label htmlFor="sort-select" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  padding: '6px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="featured" style={{ background: '#0a0e17' }}>Featured</option>
                <option value="price-asc" style={{ background: '#0a0e17' }}>Price: Low to High</option>
                <option value="price-desc" style={{ background: '#0a0e17' }}>Price: High to Low</option>
                <option value="rating" style={{ background: '#0a0e17' }}>Customer Rating</option>
                <option value="newest" style={{ background: '#0a0e17' }}>Popularity / Newest</option>
              </select>
            </div>
          </div>

          {/* Expandable Facet Tray */}
          {isFilterOpen && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginBottom: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {/* Price Range Filter Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <span>Max Price Filter</span>
                  <span style={{ color: 'var(--primary)' }}>{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2500}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  <span>{formatPrice(100)}</span>
                  <span>{formatPrice(2500)}+</span>
                </div>
              </div>

              {/* Material Facet */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="var(--primary)" /> Material & Alloy
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {materials.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterial(m.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: selectedMaterial === m.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                        color: selectedMaterial === m.id ? '#000' : 'var(--text-muted)',
                        border: selectedMaterial === m.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        fontWeight: selectedMaterial === m.id ? 700 : 500,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability & Quick Reset */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Warehouse Availability
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <span>Show in-stock items only</span>
                </label>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#f87171',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <X size={14} /> Reset all filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="product-grid">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '420px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Search size={24} color="var(--text-dim)" />
              </div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No devices matched your query or filters</h3>
              <p style={{ fontSize: '14px', marginBottom: '16px' }}>Try adjusting your search terms, price slider, or category filter.</p>
              <button
                onClick={handleResetFilters}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}

          {/* Guarantee Highlights Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 19, 31, 0.9), rgba(26, 35, 56, 0.6))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px',
              marginTop: '60px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Truck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Insured Worldwide Shipping</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Complimentary tracked express courier delivery on all orders over {formatPrice(150)}.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>30-Day Risk-Free Trial</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Experience our acoustics at home. If not completely delighted, return for 100% refund.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>2-Year Factory Warranty</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Full coverage against component faults, battery degradation, and manufacturing defects.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(129, 140, 248, 0.1)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Headphones size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>24/7 Priority Audio Support</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Connect directly with audio engineers and hardware technicians whenever you need advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading hardware catalog...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
