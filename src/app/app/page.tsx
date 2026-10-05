'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Layers,
  ShoppingBag,
  User,
  Search,
  Sparkles,
  Check,
  ArrowLeft,
  ChevronRight,
  Package,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/lib/products-data';

type MobileTab = 'discover' | 'catalog' | 'cart' | 'account';

export default function MobileAppLayoutPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, subtotal, itemCount, clearCart, isInCart } = useCart();
  const { user, signInWithGoogle, signInWithCredentials, signUpWithCredentials, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<MobileTab>('discover');
  const [frameMode, setFrameMode] = useState<'iphone' | 'fullscreen'>('iphone');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Detail view state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'specs' | 'materials'>('overview');

  // Checkout flow state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'success'>('details');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'armored' | 'express'>('armored');
  const [recipientName, setRecipientName] = useState(user?.name || 'Marcus Vance');
  const [recipientAddress, setRecipientAddress] = useState('14 Berkeley Square, Mayfair, London');

  // Customer Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);

  const WELCOME_PAGES = [
    {
      step: '01 / 03',
      badge: 'FLAGSHIP HARDWARE',
      symbol: '▲',
      headline: 'PIONEERING ACOUSTICS & HARDWARE',
      subheadline: 'PRECISION FORGED FOR ENTHUSIASTS',
      description:
        'Explore flagship smartphones, studio planar monitors, and biometric wearables crafted without aesthetic compromise or mass-market excess.',
      imageUrl:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      tagline: 'TITANIUM TACTILE CHASSIS',
      telemetry: '120Hz LTPO • PLANAR ACOUSTIC',
    },
    {
      step: '02 / 03',
      badge: 'AEROSPACE METALLURGY',
      symbol: '◆',
      headline: 'BESPOKE MATERIALS & DRIVERS',
      subheadline: 'GRADE-5 TITANIUM & CERAMICS',
      description:
        'Machined from aerospace billet alloys, matte carbon ceramics, and custom neodymium drivers calibrated for transparent frequency response.',
      imageUrl:
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      tagline: 'NEODYMIUM PLANAR DRIVER',
      telemetry: '96kHz / 24-BIT STUDIO RESOLUTION',
    },
    {
      step: '03 / 03',
      badge: 'CONCIERGE LOGISTICS',
      symbol: '★',
      headline: 'ARMORED DISPATCH & WARRANTY',
      subheadline: 'DIRECT VAULT-TO-DOOR TRANSIT',
      description:
        'Direct allocations dispatched with GPS-tracked armored logistics telemetry, fully backed by an unconditional 2-Year worldwide concierge warranty.',
      imageUrl:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      tagline: 'WHITE-GLOVE COURIER',
      telemetry: 'GPS ARMORED AIR TRANSIT • 2-YR WARRANTY',
    },
  ];

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.data?.products || data.products || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setIsAuthModalOpen(false);
      } else {
        setAuthError(res.error || 'Google authentication failed.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please enter email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        const res = await signUpWithCredentials(authEmail, authPassword, authFullName || 'Client');
        if (res.success) {
          setIsAuthModalOpen(false);
        } else {
          setAuthError(res.error || 'Failed to register account.');
        }
      } else {
        const res = await signInWithCredentials(authEmail, authPassword);
        if (res.success) {
          setIsAuthModalOpen(false);
        } else {
          setAuthError(res.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tagline && p.tagline.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const tax = Math.round(subtotal * 0.08);
  const totalDue = subtotal + tax + (shippingMethod === 'armored' ? 0 : 45);

  const handleCommitOrder = () => {
    const orderId = `AETH-APP-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmedOrderId(orderId);
    setCheckoutStep('success');
    clearCart();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030508', padding: frameMode === 'iphone' ? '24px 16px' : '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Top Device Bar & Controls */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: frameMode === 'iphone' ? '12px' : '0', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>
            AETHER MOBILE
          </span>
          <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            CLIENT APP
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFrameMode(frameMode === 'iphone' ? 'fullscreen' : 'iphone')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {frameMode === 'iphone' ? <Laptop size={12} /> : <Smartphone size={12} />}
            {frameMode === 'iphone' ? 'Fullscreen' : 'Phone Frame'}
          </button>

          <Link
            href="/"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Web Store <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Main App Container */}
      <div
        style={{
          width: frameMode === 'iphone' ? '390px' : '100%',
          maxWidth: frameMode === 'iphone' ? '390px' : '480px',
          height: frameMode === 'iphone' ? '844px' : '100vh',
          backgroundColor: '#07090e',
          borderRadius: frameMode === 'iphone' ? '48px' : '0',
          border: frameMode === 'iphone' ? '8px solid #1a2230' : 'none',
          boxShadow: frameMode === 'iphone' ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)' : 'none',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Dynamic Island Notch */}
        {frameMode === 'iphone' && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '28px', backgroundColor: '#000000', borderRadius: '14px', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#090d14' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.6)' }} />
          </div>
        )}

        {/* Status Bar */}
        <div style={{ height: frameMode === 'iphone' ? '44px' : '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', paddingTop: frameMode === 'iphone' ? '8px' : '4px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* 3-Page Interactive Welcome Screen */}
        {showWelcome ? (
          <div style={{ flex: 1, backgroundColor: '#07090e', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Top Bar with Brand & Skip */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc', letterSpacing: '2px' }}>A E T H E R</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  CLIENT v2.6
                </span>
              </div>
              {welcomeStep < 2 && (
                <button
                  onClick={() => setShowWelcome(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', cursor: 'pointer' }}
                >
                  SKIP
                </button>
              )}
            </div>

            {/* Slide Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center' }}>
              {/* Alive Hardware Showcase Image Card */}
              <div
                style={{
                  width: '100%',
                  height: '210px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  backgroundColor: '#0b101b',
                  position: 'relative',
                  marginBottom: '14px',
                  boxShadow: '0 8px 30px rgba(56, 189, 248, 0.15)',
                }}
              >
                <img
                  src={WELCOME_PAGES[welcomeStep].imageUrl}
                  alt={WELCOME_PAGES[welcomeStep].headline}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Subtle dark vignettes */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(to bottom, rgba(7, 9, 14, 0.5), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(to top, rgba(7, 9, 14, 0.8), transparent)' }} />

                {/* Floating Tag */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(7, 9, 14, 0.8)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '4px 8px',
                    borderRadius: '99px',
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#38bdf8' }} />
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.8px' }}>
                    {WELCOME_PAGES[welcomeStep].tagline}
                  </span>
                </div>

                {/* Floating Spec Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(11, 16, 27, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    letterSpacing: '0.8px',
                  }}
                >
                  {WELCOME_PAGES[welcomeStep].telemetry}
                </div>
              </div>

              {/* Step Pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '4px 12px', borderRadius: '99px', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{WELCOME_PAGES[welcomeStep].step}</span>
                <span style={{ color: '#475569', fontSize: '10px' }}>•</span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px' }}>{WELCOME_PAGES[welcomeStep].badge}</span>
              </div>

              <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.5px', lineHeight: 1.3, marginBottom: '4px' }}>
                {WELCOME_PAGES[welcomeStep].headline}
              </h2>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1.5px', marginBottom: '8px' }}>
                {WELCOME_PAGES[welcomeStep].subheadline}
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.55, maxWidth: '300px', margin: 0 }}>
                {WELCOME_PAGES[welcomeStep].description}
              </p>
            </div>

            {/* Bottom Controls */}
            <div style={{ padding: '0 28px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Pagination Dots */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {WELCOME_PAGES.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setWelcomeStep(idx)}
                    style={{
                      height: '4px',
                      width: idx === welcomeStep ? '24px' : '8px',
                      borderRadius: '2px',
                      backgroundColor: idx === welcomeStep ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
              </div>

              {/* Action Button: Next vs Get Started */}
              <button
                onClick={() => {
                  if (welcomeStep < 2) {
                    setWelcomeStep(welcomeStep + 1);
                  } else {
                    setShowWelcome(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: welcomeStep === 2 ? 'none' : '1px solid rgba(56, 189, 248, 0.35)',
                  backgroundColor: welcomeStep === 2 ? '#38bdf8' : 'rgba(56, 189, 248, 0.12)',
                  color: welcomeStep === 2 ? '#07090e' : '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 900,
                  letterSpacing: '1.2px',
                  cursor: 'pointer',
                  boxShadow: welcomeStep === 2 ? '0 4px 16px rgba(56, 189, 248, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {welcomeStep === 2 ? 'GET STARTED' : 'NEXT →'}
              </button>

              <div style={{ fontSize: '9px', fontWeight: 600, color: '#475569', letterSpacing: '1px', marginTop: '14px' }}>
                CONCIERGE HARDWARE REGISTRY • 256-BIT CLIENT PRIVACY
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile App Header */}
            <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#07090e' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-main)' }}>
                  AETHER
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em' }}>
                  LUXURY HARDWARE
                </div>
              </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Customer Auth Button */}
            {user ? (
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsCheckingOut(false);
                  setActiveTab('account');
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: 'var(--text-main)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '99px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>
                  {user.name.charAt(0)}
                </div>
                <span>{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                  setIsAuthModalOpen(true);
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                SIGN IN
              </button>
            )}

            {/* Cart Icon */}
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsCheckingOut(false);
                setActiveTab('cart');
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <ShoppingBag size={14} />
              {itemCount > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--primary)', color: '#07090e', fontSize: '9px', fontWeight: 900, width: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {itemCount}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
          
          {/* SCREEN: PRODUCT DETAIL VIEW */}
          {selectedProduct ? (
            <div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedProduct.name}
                </div>
              </div>

              {/* Product Hero Image */}
              <div style={{ width: '100%', height: '220px', position: 'relative', backgroundColor: '#000' }}>
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {selectedProduct.badge && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--primary)', color: '#07090e', fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px' }}>
                    {selectedProduct.badge}
                  </div>
                )}
              </div>

              {/* Price & Stock */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 900 }}>{selectedProduct.name}</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedProduct.tagline}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900 }}>${selectedProduct.price.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>{selectedProduct.stock} available</div>
                  </div>
                </div>

                {/* Purchase Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      if (!isInCart(selectedProduct.id)) {
                        addToCart(selectedProduct, 1);
                      }
                    }}
                    disabled={isInCart(selectedProduct.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: isInCart(selectedProduct.id) ? 'rgba(56, 189, 248, 0.1)' : 'var(--primary)',
                      border: `1px solid ${isInCart(selectedProduct.id) ? 'rgba(56, 189, 248, 0.3)' : 'var(--primary)'}`,
                      color: isInCart(selectedProduct.id) ? 'var(--primary)' : '#07090e',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: isInCart(selectedProduct.id) ? 'default' : 'pointer',
                    }}
                  >
                    {isInCart(selectedProduct.id) ? '✓ IN CART' : '+ ADD TO CART'}
                  </button>

                  <button
                    onClick={() => {
                      if (!isInCart(selectedProduct.id)) addToCart(selectedProduct, 1);
                      setSelectedProduct(null);
                      setIsCheckingOut(true);
                      setCheckoutStep('details');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    EXPRESS BUY
                  </button>
                </div>
              </div>

              {/* THREE DOSSIER TABS */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                {(['overview', 'specs', 'materials'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      background: 'none',
                      border: 'none',
                      borderBottom: detailTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                      color: detailTab === tab ? 'var(--primary)' : 'var(--text-dim)',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {detailTab === 'overview' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    ENGINEERING OVERVIEW
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {selectedProduct.overview || selectedProduct.description}
                  </p>
                  <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)' }}>AEROSPACE ARCHITECTURE</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Milled tolerances within ±0.005mm for optimum acoustic resonance and thermal dissipation.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TECH SPECS MATRIX */}
              {detailTab === 'specs' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    TECHNICAL SPECIFICATIONS MATRIX
                  </div>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                    {Object.entries(selectedProduct.specs || (selectedProduct as any).specifications || {}).filter(([k]) => !['overview', 'materials', 'warranty'].includes(k.toLowerCase())).map(([k, v], idx) => (
                      <div key={idx} style={{ display: 'flex', padding: '8px 12px', background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '11px' }}>
                        <div style={{ width: '42%', fontWeight: 700, color: 'var(--text-muted)' }}>{k}</div>
                        <div style={{ width: '58%', color: 'var(--text-main)' }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MATERIALS & FINISH */}
              {detailTab === 'materials' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#34d399', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    MATERIALS & CRAFTSMANSHIP
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {selectedProduct.materials || 'Machined Grade 5 Aerospace Titanium with Sandstone Ceramic Backing and 2.5D Sapphire Crystal Lens.'}
                  </p>
                  <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399' }}>CONCIERGE WARRANTY</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {selectedProduct.warranty || '2-Year Worldwide Concierge Warranty with full replacement coverage.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isCheckingOut ? (
            /* SCREEN: CONCIERGE CHECKOUT */
            <div style={{ padding: '16px' }}>
              {checkoutStep === 'details' ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em' }}>CONCIERGE DISPATCH</div>
                    <button onClick={() => setIsCheckingOut(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)' }}>1. DESTINATION ADDRESS</div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Recipient Name</label>
                      <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="form-input" style={{ width: '100%', fontSize: '12px', marginTop: '2px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Delivery Vault Address</label>
                      <input type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="form-input" style={{ width: '100%', fontSize: '12px', marginTop: '2px' }} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)' }}>2. LOGISTICS PROTOCOL</div>
                    <div onClick={() => setShippingMethod('armored')} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${shippingMethod === 'armored' ? 'var(--primary)' : 'var(--border-subtle)'}`, background: shippingMethod === 'armored' ? 'rgba(56, 189, 248, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800 }}>Armored Concierge Agent</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Hand delivery • GPS tracked</div>
                      </div>
                      <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 800 }}>FREE</span>
                    </div>

                    <div onClick={() => setShippingMethod('express')} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${shippingMethod === 'express' ? 'var(--primary)' : 'var(--border-subtle)'}`, background: shippingMethod === 'express' ? 'rgba(56, 189, 248, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800 }}>Priority Air Express</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Next flight departure</div>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 800 }}>+$45</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Subtotal</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Taxes (8%)</span>
                      <span>${tax.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900 }}>
                      <span>Total Due</span>
                      <span style={{ color: 'var(--primary)' }}>${totalDue.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCommitOrder}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '12px' }}
                  >
                    AUTHORIZE DISPATCH & SECURE
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={28} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>DISPATCH ORDER SECURED</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginTop: '4px' }}>{confirmedOrderId}</div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', lineHeight: '1.5' }}>
                    Your hardware system has been allocated. Armored logistics is preparing dispatch to {recipientAddress}.
                  </p>
                  <button
                    onClick={() => {
                      setIsCheckingOut(false);
                      setActiveTab('account');
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '24px', padding: '12px', justifyContent: 'center', fontSize: '12px' }}
                  >
                    VIEW IN ACCOUNT DOSSIER
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'discover' ? (
            /* TAB: DISCOVER */
            <div style={{ padding: '14px' }}>
              {products[0] && (
                <div
                  onClick={() => setSelectedProduct(products[0])}
                  style={{
                    height: '260px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    marginBottom: '16px',
                  }}
                >
                  <img src={products[0].image} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px', background: 'linear-gradient(to top, rgba(7, 9, 14, 0.95), transparent)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em' }}>FLAGSHIP EDITION</div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{products[0].name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>${products[0].price.toLocaleString()} • Explore Specs →</div>
                  </div>
                </div>
              )}

              {/* Collections Horizontal Pills */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
                {['smartphones', 'watch', 'headphone', 'laptops', 'smart-home'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveTab('catalog');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '99px',
                      padding: '6px 12px',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Featured Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
                  ARCHITECTURAL HARDWARE
                </div>
                {products.slice(1, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    style={{
                      background: 'var(--bg-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      padding: '10px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={p.image} alt={p.name} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{p.tagline || p.category}</div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>${p.price.toLocaleString()}</div>
                    </div>
                    <ChevronRight size={16} color="var(--text-dim)" />
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'catalog' ? (
            /* TAB: CATALOG */
            <div style={{ padding: '14px' }}>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search titanium, beryllium, display..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '34px', fontSize: '12px' }}
                />
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                {['all', 'smartphones', 'watch', 'headphone', 'laptops', 'smart-home'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Products List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    style={{
                      background: 'var(--bg-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: '100%', height: '140px', position: 'relative', backgroundColor: '#000' }}>
                      <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {prod.badge && (
                        <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--primary)', color: '#07090e', fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                          {prod.badge}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{prod.name}</div>
                        <div style={{ fontSize: '13px', fontWeight: 900 }}>${prod.price.toLocaleString()}</div>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{prod.tagline}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>● {prod.stock} units</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isInCart(prod.id)) addToCart(prod, 1);
                          }}
                          disabled={isInCart(prod.id)}
                          style={{
                            background: isInCart(prod.id) ? 'rgba(56, 189, 248, 0.1)' : 'var(--primary)',
                            border: 'none',
                            color: isInCart(prod.id) ? 'var(--primary)' : '#07090e',
                            fontSize: '9px',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: isInCart(prod.id) ? 'default' : 'pointer',
                          }}
                        >
                          {isInCart(prod.id) ? 'IN CART' : '+ ADD'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'cart' ? (
            /* TAB: CART */
            <div style={{ padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '12px' }}>
                DISPATCH CART ({itemCount})
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 16px' }}>
                  <ShoppingBag size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>Your Dispatch Cart is Empty</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Browse architectural hardware in the catalog.</div>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="btn btn-primary"
                    style={{ marginTop: '16px', fontSize: '11px', padding: '8px 16px' }}
                  >
                    EXPLORE CATALOG
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        padding: '10px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, marginTop: '2px' }}>${(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '2px 6px' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>−</button>
                        <span style={{ fontSize: '11px', fontWeight: 800 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', padding: '4px' }}>✕</button>
                    </div>
                  ))}

                  <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-subtle)', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Subtotal</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Armored Shipping</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>FREE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--primary)' }}>${(subtotal + tax).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCheckingOut(true);
                      setCheckoutStep('details');
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '12px', marginTop: '8px' }}
                  >
                    PROCEED TO CONCIERGE CHECKOUT →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB: ACCOUNT (CUSTOMER ONLY) */
            <div style={{ padding: '14px' }}>
              {user ? (
                <div>
                  <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: 'var(--primary)' }}>
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900 }}>{user.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.email}</div>
                      <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
                        🛡️ Black Onyx Concierge Client
                      </div>
                    </div>
                  </div>

                  {/* Orders History */}
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    RECENT DISPATCH ALLOCATIONS
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { id: confirmedOrderId || 'AETH-APP-894210', item: 'AETHER Phone (1)', total: '$1,294', status: 'In Armored Transit' },
                      { id: 'AETH-APP-771923', item: 'AETHER Studio Planar', total: '$862', status: 'Delivered to Vault' },
                    ].map((ord) => (
                      <div key={ord.id} style={{ background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                          <span>{ord.id}</span>
                          <span style={{ color: 'var(--primary)' }}>{ord.total}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{ord.item}</div>
                        <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>● {ord.status}</div>
                      </div>
                    ))}
                  </div>

                  {/* Concierge Coverage */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '14px', marginBottom: '16px', gap: '8px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary)' }}>MEMBERSHIP PRIVILEGES</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• 2-Year Full Hardware Replacement Guarantee</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• Priority Armored Flight Logistics</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• Direct Silicon Allocation Clearance</div>
                  </div>

                  <button
                    onClick={() => signOut()}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '11px', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}
                  >
                    SIGN OUT OF CLIENT ACCOUNT
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <User size={24} color="var(--primary)" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900 }}>CONCIERGE CLIENT IDENTITY</div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: '1.6', maxWidth: '280px', margin: '6px auto 16px' }}>
                    Sign in to track your armored dispatches, access 2-Year Concierge Warranty telemetry, and unlock member allocations.
                  </p>

                  {/* Google Sign In Button */}
                  <button
                    onClick={handleGoogleAuth}
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      color: '#07090e',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: '#4285F4', color: '#fff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>G</div>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                      setIsAuthModalOpen(true);
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '12px' }}
                  >
                    Sign In with Email
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FLOATING CART BUTTON */}
        {!isCheckingOut && !selectedProduct && activeTab !== 'cart' && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '20px',
              width: '50px',
              height: '50px',
              borderRadius: '25px',
              backgroundColor: '#0f141d',
              border: '2px solid var(--primary)',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 900,
            }}
            onClick={() => setActiveTab('cart')}
          >
            <ShoppingBag size={20} color="var(--primary)" />
            {itemCount > 0 && (
              <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--primary)', color: '#07090e', fontSize: '9px', fontWeight: 900, width: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemCount}
              </div>
            )}
          </div>
        )}

        {/* BOTTOM NAVIGATION DOCK (STRICTLY CUSTOMER) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '64px',
            backgroundColor: 'rgba(7, 9, 14, 0.96)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: frameMode === 'iphone' ? '12px' : '0',
            zIndex: 950,
          }}
        >
          {[
            { key: 'discover' as MobileTab, label: 'Discover', icon: Sparkles },
            { key: 'catalog' as MobileTab, label: 'Hardware', icon: Package },
            { key: 'cart' as MobileTab, label: 'Cart', icon: ShoppingBag, badge: itemCount },
            { key: 'account' as MobileTab, label: 'Account', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setSelectedProduct(null);
                  setIsCheckingOut(false);
                  setActiveTab(item.key);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text-dim)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '6px 14px',
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: '9px', fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <div style={{ position: 'absolute', top: '2px', right: '10px', background: 'var(--primary)', color: '#07090e', fontSize: '8px', fontWeight: 900, width: '14px', height: '14px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.badge}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
        </>
      )}

        {/* CUSTOMER AUTHENTICATION MODAL */}
        {isAuthModalOpen && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.88)', zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.1em' }}>CONCIERGE CLIENT IDENTITY</div>
                <div style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 700 }}>AETHER CLIENT LOGIN & REGISTER</div>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tab Switcher: Sign In vs Register */}
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: authMode === 'signin' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: authMode === 'signin' ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: authMode === 'signup' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: authMode === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  REGISTER
                </button>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: '#07090e',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: '#4285F4', color: '#fff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>G</div>
                <span>Continue with Google</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', margin: '0 10px' }}>or with email</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
              </div>

              {authError && (
                <div style={{ padding: '8px 12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '11px', textAlign: 'center' }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleCredentialsAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {authMode === 'signup' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '10px' }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Marcus Vance"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontSize: '10px' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="client@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px' }}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '12px', marginTop: '6px' }}
                >
                  {authLoading ? 'Authenticating...' : authMode === 'signup' ? 'Create Client Account' : 'Sign In to Vault'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
