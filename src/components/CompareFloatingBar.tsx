'use client';

import React from 'react';
import { useCompare } from '@/context/CompareContext';
import { Cpu, ArrowRight, X, Sparkles } from 'lucide-react';

export default function CompareFloatingBar() {
  const { compareItems, removeFromCompare, clearCompare, isCompareModalOpen, setIsCompareModalOpen } = useCompare();

  if (compareItems.length === 0 || isCompareModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 20px',
        background: 'rgba(14, 19, 31, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 'var(--radius-full)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.2)',
        maxWidth: '92vw',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Cpu size={15} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
          Compare <span style={{ color: 'var(--primary)' }}>({compareItems.length}/4)</span>
        </span>
      </div>

      {/* Thumbnails */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
        {compareItems.map((prod) => (
          <div
            key={prod.id}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              background: '#07090e',
              flexShrink: 0,
            }}
          >
            <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromCompare(prod.id);
              }}
              style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '14px',
                height: '14px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setIsCompareModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary)',
            color: '#07090e',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
          }}
        >
          <span>Launch Matrix</span>
          <ArrowRight size={14} />
        </button>

        <button
          onClick={clearCompare}
          title="Clear list"
          style={{
            color: 'var(--text-dim)',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
