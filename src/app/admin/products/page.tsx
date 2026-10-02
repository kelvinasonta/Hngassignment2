'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Boxes,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  TrendingDown,
  RefreshCw,
  Plus,
  Save,
  X,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  category_label?: string;
  price: number;
  stock: number;
  stock_quantity?: number;
  image: string;
  rating?: number;
  is_active?: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editReason, setEditReason] = useState('Restock shipment received');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/products', {
        headers: { 'x-demo-user': 'admin' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.data?.products || []);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditStock(p.stock_quantity ?? p.stock);
    setEditPrice(p.price);
    setEditReason('Replenishment from manufacturing facility');
    setMessage(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': 'admin',
        },
        body: JSON.stringify({
          id: editingProduct.id,
          stock: editStock,
          price: editPrice,
          reason: editReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update product');
      }

      setMessage({ text: 'Inventory and pricing updated! Ledger record logged.', isError: false });
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating product', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category_label || p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const cat = p.category_label || p.category;
    const matchesCategory = categoryFilter === 'all' || cat === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter and Actions */}
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
              Hardware Catalog & Inventory Ledger
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Control real-time availability, unit prices, and replenishment buffer stocks.
            </p>
          </div>

          <button
            onClick={fetchProducts}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <RefreshCw size={13} /> Sync Catalog
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              background: message.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
              border: `1px solid ${message.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
              color: message.isError ? '#fca5a5' : '#34d399',
            }}
          >
            {message.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: categoryFilter === cat ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: categoryFilter === cat ? 'var(--primary)' : 'transparent',
                  color: categoryFilter === cat ? '#000' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hardware SKU..."
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '12px', height: '36px' }}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
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
            Loading catalog inventory...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 16px' }}>Hardware Item</th>
                  <th style={{ padding: '14px 16px' }}>Category</th>
                  <th style={{ padding: '14px 16px' }}>Unit Price</th>
                  <th style={{ padding: '14px 16px' }}>Stock Level</th>
                  <th style={{ padding: '14px 16px' }}>Inventory Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const stockCount = p.stock_quantity ?? p.stock;
                  const isLow = stockCount <= 5;
                  const isOut = stockCount === 0;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              position: 'relative',
                              background: '#000',
                            }}
                          >
                            <Image src={p.image} alt={p.name} fill style={{ objectFit: 'cover' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              SKU: {p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {p.category_label || p.category}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff' }}>
                        ${p.price.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {stockCount} units
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {isOut ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px' }}>
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px' }}>
                            LOW BUFFER ({stockCount})
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px' }}>
                            IN STOCK
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          <Edit2 size={13} /> Adjust
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

      {/* Adjust Product Modal */}
      {editingProduct && (
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
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setEditingProduct(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Adjust Hardware Parameters</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{editingProduct.name}</div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="adj-stock">Available Warehouse Inventory (Units)</label>
                <input
                  id="adj-stock"
                  type="number"
                  min="0"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adj-price">MSRP Price ($ USD)</label>
                <input
                  id="adj-price"
                  type="number"
                  min="1"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adj-reason">Reason for Inventory Ledger Record</label>
                <input
                  id="adj-reason"
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Shipment received from assembly factory"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isSaving ? 'Updating...' : 'Commit Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
