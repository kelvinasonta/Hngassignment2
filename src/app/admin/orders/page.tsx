'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  Send,
  MapPin,
  User,
  RefreshCw,
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: any;
  status: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shipping_carrier?: string;
  tracking_number?: string;
  created_at: string;
  order_items?: OrderItem[];
  order_timeline?: TimelineEntry[];
}

const CARRIERS = [
  'FedEx Priority Overnight',
  'DHL Express Worldwide',
  'UPS Worldwide Saver',
  'AETHER Courier Express',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fulfillment update drawer state
  const [updateStatus, setUpdateStatus] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/admin/orders', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString(), {
        headers: { 'x-demo-user': 'admin' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.data?.orders || []);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const openOrderDrawer = (order: Order) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setCarrier(order.shipping_carrier || CARRIERS[0]);
    setTrackingNumber(order.tracking_number || '');
    setFulfillmentNotes('');
    setUpdateMessage(null);
  };

  const handleSaveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': 'admin',
        },
        body: JSON.stringify({
          status: updateStatus,
          shippingCarrier: carrier,
          trackingNumber,
          notes: fulfillmentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setUpdateMessage({ text: 'Fulfillment record saved and customer notified!', isError: false });
      setSelectedOrder(data.data.order);
      // Refresh background orders list
      fetchOrders();
    } catch (err: any) {
      setUpdateMessage({ text: err.message || 'Error updating fulfillment', isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'CONFIRMED', bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' };
      case 'processing':
        return { label: 'PROCESSING', bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' };
      case 'shipped':
        return { label: 'SHIPPED', bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' };
      case 'delivered':
        return { label: 'DELIVERED', bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399' };
      case 'cancelled':
        return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171' };
      default:
        return { label: status.toUpperCase(), bg: 'rgba(255, 255, 255, 0.08)', color: '#fff' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Hardware Fulfillment & Order Routing
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Real-time verification, carrier tracking assignment, and customer transit dispatch.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <RefreshCw size={13} /> Refresh Orders
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === tab ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: statusFilter === tab ? 'var(--primary)' : 'transparent',
                  color: statusFilter === tab ? '#000' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, customer, email..."
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '12px', height: '36px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0 12px', height: '36px', fontSize: '12px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Orders Table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            Loading orders pipeline...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>No orders found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try switching the status filter or clearing your search term.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 16px' }}>Order Reference</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Destination</th>
                  <th style={{ padding: '14px 16px' }}>Total</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Carrier / Tracking</th>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  const addr = ord.shipping_address;
                  const cityCountry = addr ? `${addr.city || ''}, ${addr.country || addr.country_code || 'US'}` : '—';

                  return (
                    <tr
                      key={ord.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                      onClick={() => openOrderDrawer(ord)}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
                        {ord.order_number}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{ord.customer_email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {cityCountry}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff' }}>
                        ${Number(ord.total).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {ord.tracking_number ? (
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{ord.shipping_carrier || 'Express'}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)' }}>
                              {ord.tracking_number}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-dim)', fontSize: '12px' }}>
                        {new Date(ord.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderDrawer(ord);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Inspect <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Fulfillment Drawer Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-subtle)',
              height: '100%',
              overflowY: 'auto',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fulfillment Dossier
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', marginTop: '2px' }}>
                  {selectedOrder.order_number}
                </h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {updateMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  background: updateMessage.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                  border: `1px solid ${updateMessage.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                  color: updateMessage.isError ? '#fca5a5' : '#34d399',
                }}
              >
                {updateMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{updateMessage.text}</span>
              </div>
            )}

            {/* Line items */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
                Ordered Hardware
              </h3>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        Quantity: {item.quantity} × ${item.unit_price}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      ${item.subtotal || item.quantity * item.unit_price}
                    </div>
                  </div>
                )) || <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No line items parsed</div>}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span>Total Settled</span>
                  <span>${Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
                Customer & Shipping Destination
              </h3>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="var(--primary)" /> {selectedOrder.customer_name}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{selectedOrder.customer_email}</div>
                {selectedOrder.customer_phone && <div style={{ color: 'var(--text-dim)' }}>{selectedOrder.customer_phone}</div>}

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    <MapPin size={14} color="var(--primary)" /> Delivery Address
                  </div>
                  <div>{selectedOrder.shipping_address?.street1 || selectedOrder.shipping_address?.street || selectedOrder.shipping_address?.street_line_1}</div>
                  <div>
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state || selectedOrder.shipping_address?.state_region} {selectedOrder.shipping_address?.postalCode || selectedOrder.shipping_address?.postal_code}
                  </div>
                  <div>{selectedOrder.shipping_address?.country || selectedOrder.shipping_address?.country_code || 'US'}</div>
                </div>
              </div>
            </div>

            {/* Fulfillment Status & Dispatch Form */}
            <form
              onSubmit={handleSaveFulfillment}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={16} color="var(--primary)" /> Update Fulfillment & Logistics
              </h3>

              <div className="form-group">
                <label className="form-label">Workflow Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="confirmed">Confirmed (Payment Received)</option>
                  <option value="processing">Processing (In Packing & QC)</option>
                  <option value="shipped">Shipped (Dispatched to Courier)</option>
                  <option value="delivered">Delivered (Handed to Customer)</option>
                  <option value="cancelled">Cancelled (Refunded)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Logistics Courier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="form-input"
                >
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. FX-992019482-US"
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Internal Operations Note</label>
                <input
                  type="text"
                  value={fulfillmentNotes}
                  onChange={(e) => setFulfillmentNotes(e.target.value)}
                  placeholder="e.g. Inspected acoustic drivers; signature delivery required."
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-primary"
                style={{ marginTop: '8px', justifyContent: 'center' }}
              >
                {isUpdating ? 'Saving & Transmitting...' : 'Save & Notify Customer'}
              </button>
            </form>

            {/* Audit Timeline */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
                Fulfillment Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedOrder.order_timeline?.map((event, idx) => (
                  <div key={event.id || idx} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />
                      {idx !== (selectedOrder.order_timeline?.length ?? 1) - 1 && (
                        <div style={{ width: '2px', flex: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{event.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{event.description}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '2px' }}>
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )) || <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No timeline entries</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
