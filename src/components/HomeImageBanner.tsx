'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Zap, ShieldCheck, RotateCcw, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export interface BannerSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  price: number;
  image: string;
  link: string;
  category: string;
  accentColor: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    tag: 'Architectural Workspace',
    title: 'Studio Vision 32 Pro Display',
    subtitle: '6K Retinal OLED Panel with Zero-Gravity Counterbalanced Arm & 140W Thunderbolt 4 link.',
    price: 1899,
    image: '/assets/images/smart_workspace_display.jpg',
    link: '/products/prod-workspace-display-32',
    category: 'Studio Living',
    accentColor: '#38bdf8',
  },
  {
    id: 'slide-2',
    tag: 'Circadian Illumination',
    title: 'Aura Ambient Smart Lantern',
    subtitle: 'Solid Champagne Brass with fluted smoked glass, stepless dimmer & Matter/Thread smart sync.',
    price: 245,
    image: '/assets/images/smart_light_ambient.jpg',
    link: '/products/prod-smart-light-ambient',
    category: 'Smart Home',
    accentColor: '#fbbf24',
  },
  {
    id: 'slide-3',
    tag: 'Studio Acoustic Reference',
    title: 'Prism Studio Planar Headphones',
    subtitle: '45mm pure vapor-deposited beryllium diaphragms in low-resonance polygonal acoustic chambers.',
    price: 349,
    image: '/assets/images/headphones_geometric.jpg',
    link: '/products/prod-headphones-geometric',
    category: 'Audiophile',
    accentColor: '#818cf8',
  },
  {
    id: 'slide-4',
    tag: 'Cleanroom Air Sanitation',
    title: 'Aura Smart Acoustic Purifier',
    subtitle: 'Sandstone ceramic cowl with medical True HEPA H13 filtration operating at a near-silent 17dB.',
    price: 380,
    image: '/assets/images/acoustic_air_purifier.jpg',
    link: '/products/prod-acoustic-air-purifier',
    category: 'Smart Home',
    accentColor: '#34d399',
  },
  {
    id: 'slide-5',
    tag: 'Computational Handheld Flagship',
    title: 'Quantum 16 Pro Smartphone',
    subtitle: 'Aerospace Grade 5 Titanium chassis housing an A18 Pro 3nm Bionic neural processing engine.',
    price: 999,
    image: '/assets/images/phone_crystal.jpg',
    link: '/products/prod-phone-crystal',
    category: 'Smartphones',
    accentColor: '#a855f7',
  },
];

export default function HomeImageBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  // Automatic slideshow interval (4.8 seconds per slide)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 4800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  const activeSlide = BANNER_SLIDES[currentIndex];

  return (
    <section
      aria-label="Featured Collections Carousel"
      style={{
        position: 'relative',
        margin: '24px 0 48px',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="container">
        <div
          style={{
            position: 'relative',
            height: '520px',
            minHeight: '480px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.12)',
            background: '#07090e',
          }}
        >
          {/* Background Slides with Cross-Fade */}
          {BANNER_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scale(1)' : 'scale(1.04)',
                  transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.68) contrast(1.12)',
                  }}
                />

                {/* Layered Gradient Vignette */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, rgba(7, 9, 14, 0.95) 0%, rgba(7, 9, 14, 0.75) 45%, rgba(7, 9, 14, 0.35) 100%), linear-gradient(0deg, rgba(7, 9, 14, 0.88) 0%, transparent 60%)',
                  }}
                />
              </div>
            );
          })}

          {/* Slide Text Content & Call to Actions */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 clamp(24px, 5vw, 64px)',
              maxWidth: '720px',
              zIndex: 10,
            }}
          >
            {/* Tag Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(14, 19, 31, 0.85)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${activeSlide.accentColor}55`,
                color: activeSlide.accentColor,
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                marginBottom: '16px',
                width: 'fit-content',
                boxShadow: `0 0 20px ${activeSlide.accentColor}25`,
              }}
            >
              <Sparkles size={13} />
              <span>{activeSlide.tag}</span>
              <span>•</span>
              <span style={{ color: 'var(--text-main)' }}>{activeSlide.category}</span>
            </div>

            {/* Slide Title / H1 */}
            <h1
              style={{
                fontSize: 'clamp(28px, 4.5vw, 44px)',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.15,
                color: '#f8fafc',
                marginBottom: '14px',
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.7)',
                letterSpacing: '-0.5px',
              }}
            >
              {activeSlide.title}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.6,
                marginBottom: '26px',
                maxWidth: '560px',
                textShadow: '0 1px 6px rgba(0, 0, 0, 0.6)',
              }}
            >
              {activeSlide.subtitle}
            </p>

            {/* Price Tag & Action CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Reference Edition
                </span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(activeSlide.price)}
                </span>
              </div>

              <div style={{ height: '36px', width: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />

              <a
                href="#products"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <span>Explore Catalog</span>
                <ArrowRight size={15} />
              </a>

              <Link
                href={activeSlide.link}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                }}
              >
                <span>Inspect Architecture</span>
              </Link>

              <Link
                href="/checkout"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  padding: '4px 8px',
                }}
              >
                Direct Checkout
              </Link>
            </div>
          </div>

          {/* Left / Right Arrow Controls */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(10, 14, 23, 0.75)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 15,
              transition: 'var(--transition-fast)',
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(10, 14, 23, 0.75)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 15,
              transition: 'var(--transition-fast)',
            }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Bottom Indicators & Progress Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 15,
              background: 'rgba(10, 14, 23, 0.65)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {BANNER_SLIDES.map((s, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{
                    height: '6px',
                    width: isActive ? '32px' : '8px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 10px var(--primary)' : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Integrated Trust Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            padding: '16px 24px',
            background: 'rgba(14, 19, 31, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>100% Authentic Gear</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Laboratory tested & certified</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RotateCcw size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>2-Year Global Warranty</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Comprehensive hardware guarantee</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>24h Insured Dispatch</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FedEx priority air delivery</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
