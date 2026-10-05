'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ExternalLink,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Printer,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/context/AuthContext';
import ShipmentTracker from '@/components/ShipmentTracker';
import InvoiceModal from '@/components/InvoiceModal';

export default function AccountOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any>(null);
  const [expandedTrackerId, setExpandedTrackerId] = useState<string | null>(null);

  useEffect(() => {
    const email = user?.email || '';
    const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';

    fetch(`/api/orders${emailParam}`)
      .then((res) => res.json())
      .then((data) => {
        let ords = ((data.data?.orders || data.orders || []) as any[]);

        // Merge with client-side cached orders
        if (typeof window !== 'undefined') {
          const localUserOrders = email ? JSON.parse(localStorage.getItem(`aether_customer_orders_${email.toLowerCase()}`) || '[]') : [];
          const allLocalOrders = JSON.parse(localStorage.getItem('aether_all_placed_orders') || '[]');
          const combinedLocal = [...localUserOrders, ...allLocalOrders];

          combinedLocal.forEach((loc) => {
            if (loc && !ords.some((o) => o.id === loc.id || o.order_number === loc.order_number)) {
              ords.unshift(loc);
            }
          });
        }

        setOrders(ords);
        if (ords.length > 0) {
          setExpandedTrackerId(ords[0].id || ords[0].order_number);
        }
      })
      .catch((e) => {
        console.warn(e);
        if (typeof window !== 'undefined') {
          const localUserOrders = email ? JSON.parse(localStorage.getItem(`aether_customer_orders_${email.toLowerCase()}`) || '[]') : [];
          const allLocalOrders = JSON.parse(localStorage.getItem('aether_all_placed_orders') || '[]');
          const combined = [...localUserOrders, ...allLocalOrders];
          setOrders(combined);
          if (combined.length > 0) {
            setExpandedTrackerId(combined[0].id || combined[0].order_number);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, order_status: newStatus } : o))
    );
  };

  return (
    <>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}
      >
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
            Hardware Order History & Live Telemetry
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Inspect laboratory calibration milestones, courier transit telemetry, and download official tax invoices.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p>Loading your hardware order history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No orders found</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>You haven't placed any precision hardware orders yet.</p>
            <Link href="/#products" className="btn-primary" style={{ display: 'inline-flex' }}>
              <span>Explore Hardware Catalog</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {orders.map((order) => {
              const oId = order.id || order.order_number;
              const isTrackerExpanded = expandedTrackerId === oId;

              return (
                <div
                  key={oId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {/* Top order bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginRight: '12px' }}>
                        #{order.order_number}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent Order'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(52, 211, 153, 0.1)',
                          color: '#34d399',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {order.order_status || order.status || 'Confirmed'}
                      </span>

                      {/* Print / Tax Invoice Button */}
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Printer size={13} />
                        <span>Tax Invoice</span>
                      </button>

                      <Link
                        href={`/order-confirmation?orderId=${order.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--text-muted)',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        <span>Receipt</span>
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {(order.items || order.order_items || []).map((it: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{it.name || it.product_name}</span>{' '}
                          <span style={{ color: 'var(--text-dim)' }}>× {it.quantity}</span>
                          {it.color && (
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '8px' }}>
                              ({it.color})
                            </span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {formatPrice(Number(it.price || it.unit_price) * Number(it.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Toggle Tracker */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                      fontSize: '13px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <button
                      onClick={() => setExpandedTrackerId(isTrackerExpanded ? null : oId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(56, 189, 248, 0.05)',
                      }}
                    >
                      <Truck size={15} />
                      <span>{isTrackerExpanded ? 'Hide Live Telemetry' : 'Inspect Live Telemetry & Tracking'}</span>
                      {isTrackerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <div style={{ fontSize: '15px' }}>
                      Total:{' '}
                      <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>
                        {formatPrice(Number(order.total))}
                      </strong>
                    </div>
                  </div>

                  {/* Interactive Live Shipment Tracker */}
                  {isTrackerExpanded && (
                    <ShipmentTracker
                      order={order}
                      onUpdateStatus={(st) => handleUpdateStatus(oId, st)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Tax Invoice & Hardware Certificate Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </>
  );
}
