'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  INITIAL_PRODUCTS,
  Product,
  ProductColor,
} from '@/lib/products-data';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/currency';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Heart,
  Share2,
  ArrowLeft,
  ShoppingBag,
  Zap,
  Layers,
  Cpu,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DedicatedProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'materials' | 'reviews'>('overview');
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    // 1. Try finding in hardcoded catalog first for immediate render
    let found = INITIAL_PRODUCTS.find((p) => p.id === productId);

    if (found) {
      setProduct(found);
      setSelectedImage(found.image);
      if (found.colors && found.colors.length > 0) {
        setSelectedColor(found.colors[0]);
      }
      setLoading(false);
    }

    // 2. Fetch latest data from database API to support dynamic updates
    fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const dbProduct = data?.data?.product || data?.product;
        if (dbProduct) {
          const merged: Product = {
            ...(found || {}),
            ...dbProduct,
            categoryLabel: dbProduct.category_label || dbProduct.categoryLabel || found?.categoryLabel || 'Hardware',
            reviewsCount: dbProduct.reviews_count || dbProduct.reviewsCount || found?.reviewsCount || 42,
            rating: Number(dbProduct.rating || found?.rating || 4.9),
            features: dbProduct.features || found?.features || [],
            gallery: dbProduct.gallery || found?.gallery || [dbProduct.image],
            specs: dbProduct.specs || dbProduct.specifications || found?.specs || {},
            colors: dbProduct.colors || found?.colors || [],
          };
          setProduct(merged);
          if (!selectedImage) setSelectedImage(merged.image);
          if (!selectedColor && merged.colors && merged.colors.length > 0) {
            setSelectedColor(merged.colors[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p>Loading precision hardware specifications...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '120px 20px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '540px' }}>
            <Cpu size={48} style={{ margin: '0 auto 16px', color: 'var(--text-dim)' }} />
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Device Not Found</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
              The hardware unit you are looking for is either discontinued, out of stock, or has been re-indexed.
            </p>
            <Link href="/#products" className="btn-primary" style={{ display: 'inline-flex' }}>
              <ArrowLeft size={16} />
              <span>Browse Catalog</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const galleryImages = Array.from(new Set([product.image, ...(product.gallery || [])]));
  const relatedProducts = INITIAL_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '32px 0 100px' }}>
        <div className="container">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-dim)',
              marginBottom: '28px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }}>
              Store
            </Link>
            <ChevronRight size={14} />
            <Link href="/#products" style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }}>
              {product.categoryLabel}
            </Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
          </nav>

          {/* Main Product Presentation Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '48px',
              marginBottom: '64px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Multi-Angle Interactive Gallery */}
            <div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: 'var(--radius-lg)',
                  background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(10, 14, 23, 0.95) 100%)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                }}
              >
                {product.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      zIndex: 2,
                    }}
                  >
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={() => toggleWishlist(product)}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isWishlisted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(10, 14, 23, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: isWishlisted ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isWishlisted ? '#f43f5e' : 'rgba(255, 255, 255, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'var(--transition-fast)',
                  }}
                  aria-label="Wishlist"
                >
                  <Heart size={18} fill={isWishlisted ? '#f43f5e' : 'none'} />
                </button>

                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: selectedImage === img ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition-fast)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={img}
                        alt={`${product.name} preview angle ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Specifications, Price, Variants & Actions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: 'var(--primary)',
                  }}
                >
                  {product.categoryLabel}
                </span>

                <button
                  onClick={handleShare}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedLink ? '#34d399' : 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    transition: 'var(--transition-fast)',
                  }}
                  title="Share device link"
                >
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>

              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  lineHeight: 1.2,
                  marginBottom: '10px',
                }}
              >
                {product.name}
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '18px' }}>
                {product.tagline}
              </p>

              {/* Rating and Reviews */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{product.rating.toFixed(1)}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                  • {product.reviewsCount} Verified Hardware Audits
                </span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }} />
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#34d399',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#34d399',
                      display: 'inline-block',
                      boxShadow: '0 0 8px #34d399',
                    }}
                  />
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Backorder Available'}
                </span>
              </div>

              {/* Price Display */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  marginBottom: '28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Authoritative Price
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                    {formatPrice(product.price)}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-dim)' }}>
                  <div>VAT & Duties Included</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    Free Insured Express Delivery over {formatPrice(150)}
                  </div>
                </div>
              </div>

              {/* Color Swatch Picker */}
              {product.colors && product.colors.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>Alloy Finish / Color</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {selectedColor?.name || product.colors[0].name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {product.colors.map((c, i) => {
                      const isSelected = selectedColor?.name === c.name;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedColor(c)}
                          title={c.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-full)',
                            background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                            color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            transition: 'var(--transition-fast)',
                          }}
                        >
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: c.hex,
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              display: 'inline-block',
                            }}
                          />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & CTA Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Quantity Counter */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '4px',
                    }}
                  >
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span
                      style={{
                        width: '40px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '15px',
                      }}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Add to Bag Button */}
                  <button
                    onClick={handleAddToCart}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      background: justAdded ? '#34d399' : undefined,
                      borderColor: justAdded ? '#34d399' : undefined,
                      color: justAdded ? '#07090e' : undefined,
                    }}
                  >
                    {justAdded ? <Check size={18} /> : <ShoppingBag size={18} />}
                    <span>{justAdded ? 'Added to Bag' : 'Add to Bag'}</span>
                  </button>
                </div>

                {/* Direct Buy Now Button */}
                <button
                  onClick={handleBuyNow}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: 'rgba(56, 189, 248, 0.08)',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                  }}
                >
                  <Zap size={18} />
                  <span>Express Direct Checkout</span>
                </button>
              </div>

              {/* Trust & Guarantee Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '24px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Truck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Courier Dispatch</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>24-48 hour insured transit with FedEx</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>2-Year Warranty</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Factory hardware defect coverage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Technical Details Section */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px',
              marginBottom: '64px',
            }}
          >
            {/* Tabs Selector */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '16px',
                marginBottom: '28px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { id: 'overview', label: 'Engineering Overview' },
                { id: 'specs', label: 'Technical Specifications' },
                { id: 'materials', label: 'Materials & Finish' },
                { id: 'reviews', label: `Verified Reviews (${product.reviewsCount})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: activeTab === t.id ? 700 : 500,
                    background: activeTab === t.id ? 'var(--primary)' : 'transparent',
                    color: activeTab === t.id ? '#07090e' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                  Acoustic Philosophy & Design Logic
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, marginBottom: '24px' }}>
                  {product.overview || product.description}
                </p>

                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Key Capabilities</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {product.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}
                    >
                      <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Comprehensive Hardware Telemetry
                </h3>
                {product.specs && Object.keys(product.specs).length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {Object.entries(product.specs).map(([k, v], idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '14px',
                        }}
                      >
                        <span style={{ color: 'var(--text-dim)' }}>{k}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Specifications pending laboratory calibration update.</p>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                  Alloy Chemistry & Precision Finishes
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, marginBottom: '20px' }}>
                  {product.materials || 'Precision CNC machined from aerospace-grade 6000-series aluminum with ceramic micro-bead blasting and satin anodized coating.'}
                </p>

                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <Layers size={28} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                      2-Year Hardware Coverage Guarantee
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {product.warranty || 'Comprehensive zero-deductible factory warranty with complimentary express courier replacement.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      Customer Hardware Audits
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      Overall rating of <strong>{product.rating.toFixed(1)} / 5.0</strong> based on {product.reviewsCount} verified purchase evaluations.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    {
                      author: 'Marcus Vance, Principal Audio Architect',
                      rating: 5,
                      date: '2 weeks ago',
                      comment: 'Uncompromising build quality. The tactile resistance of the dial and thermal dissipation of the unibody chassis exceed studio benchmark standards.',
                    },
                    {
                      author: 'Elena Rostova, Industrial Hardware Evaluator',
                      rating: 5,
                      date: '1 month ago',
                      comment: 'The acoustic tuning is surgical. No synthetic bass elevation — just razor-sharp transients and expansive spatial imaging.',
                    },
                  ].map((rev, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{rev.author}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{rev.date}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '10px' }}>
                        {[...Array(rev.rating)].map((_, s) => (
                          <Star key={s} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Hardware Lineup */}
          {relatedProducts.length > 0 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: 'var(--primary)',
                  }}
                >
                  Synergistic Ecosystem
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Companion Hardware
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                }}
              >
                {relatedProducts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/products/${rel.id}`}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={rel.image}
                        alt={rel.name}
                        style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {rel.categoryLabel}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{rel.name}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                        {formatPrice(rel.price)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
