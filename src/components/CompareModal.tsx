'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import {
  X,
  Trash2,
  ShoppingBag,
  Check,
  Star,
  Cpu,
  Layers,
  BatteryCharging,
  Weight,
  Radio,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function CompareModal() {
  const { compareItems, removeFromCompare, clearCompare, isCompareModalOpen, setIsCompareModalOpen } = useCompare();
  const { addToCart, isInCart, getItemQuantity, setIsCartOpen } = useCart();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [highlightDiffs, setHighlightDiffs] = useState(false);

  if (!isCompareModalOpen) return null;

  const handleAdd = (product: any) => {
    addToCart(product, 1);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const specKeys = [
    { key: 'categoryLabel', label: 'Hardware Class', icon: Cpu },
    { key: 'price', label: 'Reference Price', icon: Sparkles, format: (val: any) => formatPrice(val) },
    { key: 'rating', label: 'Precision Rating', icon: Star, format: (val: any) => `${Number(val).toFixed(1)} / 5.0` },
    { key: 'materials', label: 'Chassis Metallurgy', icon: Layers },
    { key: 'battery', label: 'Battery / Power', icon: BatteryCharging, getter: (p: any) => p.specs?.['Battery Endurance'] || p.specs?.['Battery Life'] || 'Mains AC Powered' },
    { key: 'transducers', label: 'Drivers / Silicon', icon: Cpu, getter: (p: any) => p.specs?.['Transducers'] || p.specs?.['Display'] || p.features?.[0] || 'Precision Architecture' },
    { key: 'weight', label: 'Dry Weight', icon: Weight, getter: (p: any) => p.specs?.['Weight'] || 'Varies by configuration' },
    { key: 'connectivity', label: 'Connectivity', icon: Radio, getter: (p: any) => p.specs?.['Connectivity'] || 'Bluetooth 5.3 LE / Wi-Fi 6E' },
    { key: 'warranty', label: 'Concierge Warranty', icon: ShieldCheck, getter: (p: any) => p.warranty || '2-Year Global Factory Defect Coverage' },
  ];

  return (
    <div
      className="modal-overlay"
      onClick={() => setIsCompareModalOpen(false)}
      style={{
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1240px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(10, 14, 23, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Side-by-Side Matrix
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Precision Hardware Comparison
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Direct technical audit of acoustic, thermal, and engineering specifications.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {compareItems.length > 1 && (
              <button
                onClick={() => setHighlightDiffs(!highlightDiffs)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: highlightDiffs ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: highlightDiffs ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  color: highlightDiffs ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {highlightDiffs ? '✓ Diffs Highlighted' : 'Highlight Differences'}
              </button>
            )}

            {compareItems.length > 0 && (
              <button
                onClick={clearCompare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Clear Matrix</span>
              </button>
            )}

            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="btn-icon"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {compareItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <Cpu size={48} style={{ margin: '0 auto 16px', color: 'var(--text-dim)' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '8px' }}>
                No hardware selected for comparison
              </h3>
              <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px' }}>
                Click the <strong>Compare</strong> button on any hardware unit in our catalog to inspect side-by-side technical telemetry.
              </p>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="btn-primary"
                style={{ display: 'inline-flex' }}
              >
                <span>Browse Hardware Catalog</span>
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `220px repeat(${compareItems.length}, minmax(260px, 1fr))`,
                  gap: '16px',
                  minWidth: `${220 + compareItems.length * 280}px`,
                }}
              >
                {/* Column Headers (Products) */}
                <div style={{ padding: '16px 0', display: 'flex', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)' }}>
                    Engineering Metric
                  </span>
                </div>

                {compareItems.map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => removeFromCompare(prod.id)}
                      title="Remove from comparison"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>

                    <div
                      style={{
                        width: '100%',
                        height: '140px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        background: '#07090e',
                        marginBottom: '16px',
                      }}
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {prod.categoryLabel}
                    </div>

                    <Link
                      href={`/products/${prod.id}`}
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: '6px',
                        lineHeight: 1.3,
                      }}
                    >
                      {prod.name}
                    </Link>

                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
                      {formatPrice(prod.price)}
                    </div>

                    {isInCart(prod.id) ? (
                      <button
                        key="compare-in-bag-btn"
                        onClick={() => {
                          setIsCompareModalOpen(false);
                          setIsCartOpen(true);
                        }}
                        style={{
                          marginTop: 'auto',
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(56, 189, 248, 0.15)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: 'rgba(56, 189, 248, 0.4)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'var(--transition-fast)',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={16} />
                        <span>In Bag ({getItemQuantity(prod.id)})</span>
                      </button>
                    ) : (
                      <button
                        key="compare-add-cart-btn"
                        onClick={() => handleAdd(prod)}
                        style={{
                          marginTop: 'auto',
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: addedMap[prod.id] ? '#34d399' : 'transparent',
                          background: addedMap[prod.id] ? '#34d399' : 'var(--primary)',
                          color: '#07090e',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'var(--transition-fast)',
                          cursor: 'pointer',
                        }}
                      >
                        {addedMap[prod.id] ? <Check size={16} /> : <ShoppingBag size={16} />}
                        <span>{addedMap[prod.id] ? 'Added to Bag' : 'Add to Bag'}</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* Spec Rows */}
                {specKeys.map((spec) => {
                  const Icon = spec.icon;
                  const values = compareItems.map((prod) => {
                    if (spec.getter) return spec.getter(prod);
                    const raw = (prod as any)[spec.key];
                    return spec.format ? spec.format(raw) : raw;
                  });

                  const isDifferent = new Set(values).size > 1;

                  return (
                    <React.Fragment key={spec.key}>
                      <div
                        style={{
                          padding: '16px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-dim)',
                          background: highlightDiffs && isDifferent ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                        }}
                      >
                        <Icon size={16} color="var(--primary)" />
                        <span>{spec.label}</span>
                      </div>

                      {compareItems.map((prod, idx) => {
                        const val = values[idx];
                        return (
                          <div
                            key={prod.id}
                            style={{
                              padding: '16px 20px',
                              borderTop: '1px solid var(--border-subtle)',
                              fontSize: '13px',
                              color: 'var(--text-main)',
                              lineHeight: 1.5,
                              background: highlightDiffs && isDifferent ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                              borderLeft: highlightDiffs && isDifferent ? '2px solid rgba(56, 189, 248, 0.4)' : undefined,
                            }}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
