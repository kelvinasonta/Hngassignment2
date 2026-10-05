'use client';

import React from 'react';
import { formatPrice } from '@/lib/currency';
import { X, Printer, ShieldCheck, Cpu, Download, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const items = order.items || order.order_items || [];
  const serialNumber = order.serial_number || 'SN-AETH-' + (order.order_number?.replace(/\D/g, '') || '9241') + '-REV';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="modal-card print-invoice-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          background: '#07090e',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          overflowY: 'auto',
          color: '#f8fafc',
        }}
      >
        {/* Print Controls Header (Hidden during actual print) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(14, 19, 31, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>
              OFFICIAL HARDWARE CERTIFICATE & INVOICE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: '#07090e',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div style={{ padding: '40px 48px', fontFamily: 'var(--font-body)' }}>
          {/* Top Brand Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '24px',
              marginBottom: '28px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Cpu size={16} />
                </div>
                <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '2px', fontFamily: 'var(--font-heading)' }}>
                  AETHER
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Precision Electronics & Acoustic Hardware
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Tokyo Engineering Lab • 540 Minato-ku, Tokyo / San Francisco, CA
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                TAX INVOICE
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Invoice #: <strong>INV-{order.order_number || order.id}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Date: {orderDate}
              </div>
            </div>
          </div>

          {/* Meta & Destination Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px',
              fontSize: '13px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px' }}>
                Billed & Dispatched To:
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', marginBottom: '2px' }}>
                {order.customer_name || 'Valued AETHER Client'}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>{order.customer_email}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px', maxWidth: '280px', lineHeight: 1.5 }}>
                {order.shipping_address || 'Courier Priority Logistics'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px' }}>
                Hardware Telemetry:
              </div>
              <div>Payment: <strong style={{ color: 'var(--text-main)' }}>{order.payment_method || 'Insured Direct Authorization'}</strong></div>
              <div>Status: <span style={{ color: '#34d399', fontWeight: 600 }}>● {order.order_status || order.status || 'Confirmed & Insured'}</span></div>
              <div>Carrier: <strong>{order.tracking_carrier || 'FedEx Express International'}</strong></div>
              <div>Tracking #: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{order.tracking_number || 'FX-EXP-8849204'}</span></div>
              <div style={{ marginTop: '4px' }}>Master Serial: <span style={{ fontFamily: 'monospace', color: '#fbbf24', fontSize: '12px' }}>{serialNumber}</span></div>
            </div>
          </div>

          {/* Hardware Table */}
          <div style={{ marginBottom: '28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
                    Hardware Unit
                  </th>
                  <th style={{ padding: '10px 0', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
                    Qty
                  </th>
                  <th style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
                    Unit Price
                  </th>
                  <th style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any, idx: number) => {
                  const price = Number(it.price || it.unit_price || 0);
                  const qty = Number(it.quantity || 1);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '14px 0' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {it.name || it.product_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Serial: {serialNumber}-0{idx + 1} • Factory Inspected
                          {it.color && ` • Finish: ${it.color}`}
                        </div>
                      </td>
                      <td style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {qty}
                      </td>
                      <td style={{ padding: '14px 0', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatPrice(price)}
                      </td>
                      <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatPrice(price * qty)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>{formatPrice(Number(order.subtotal || order.total * 0.9))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Insured Air Courier:</span>
                <span style={{ color: Number(order.shipping_fee) === 0 ? '#34d399' : undefined }}>
                  {Number(order.shipping_fee) === 0 ? 'Complimentary ($0.00)' : formatPrice(Number(order.shipping_fee || 0))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Tax (VAT 8%):</span>
                <span>{formatPrice(Number(order.tax || order.total * 0.08))}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '10px',
                  fontWeight: 800,
                  fontSize: '17px',
                  color: 'var(--primary)',
                }}
              >
                <span>Total Amount:</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Certificate of Authenticity Seal */}
          <div
            style={{
              borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
              paddingTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid rgba(56, 189, 248, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                  AETHER 2-YEAR CONCIERGE WARRANTY REGISTERED
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Hardware calibrated to reference acoustic & thermal standards. Authorized cryptographic seal.
                </div>
              </div>
            </div>

            {/* Simulated Cryptographic QR Verification */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  background: '#fff',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" width="38" height="38" fill="#000">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h2v2h-2v-2zm-4 0h2v4h-2v-4zm6 4h2v2h-2v-2zm-2 2h2v2h-2v-2zm-4-2h2v4h-2v-4z" />
                </svg>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                Scan to verify
                <br />
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>authenticity.aether.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
