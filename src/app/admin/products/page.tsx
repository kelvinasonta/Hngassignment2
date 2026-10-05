'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Check,
  Database,
  Wrench,
  FileText,
  Layers,
  Cpu,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  category_label?: string;
  categoryLabel?: string;
  price: number;
  stock: number;
  stock_quantity?: number;
  image: string;
  badge?: string;
  tagline?: string;
  description?: string;
  features?: string[];
  rating?: number;
  is_active?: boolean;
}

const SPECS_TEMPLATES: Record<string, Array<{ key: string; value: string }>> = {
  smartphone: [
    { key: 'Chassis Material', value: 'Grade 5 Aerospace Titanium with Sandstone Ceramic Back' },
    { key: 'Display', value: '6.7-inch Ultra-LTPO OLED (1-120Hz, 2600 nits peak, 2.5D Sapphire)' },
    { key: 'Processor', value: 'Custom Neural Silicon with Dedicated Hardware Secure Enclave' },
    { key: 'Camera Matrix', value: '50MP 1-inch Main Sensor + 48MP Periscope Optical Zoom' },
    { key: 'Battery & Charging', value: '5,000 mAh, 65W Fast Wireless Magnetic Qi2 Charging' },
    { key: 'Water Ingress', value: 'IP68 Submersion Tested (6 meters for 30 minutes)' },
  ],
  smartphones: [
    { key: 'Chassis Material', value: 'Grade 5 Aerospace Titanium with Sandstone Ceramic Back' },
    { key: 'Display', value: '6.7-inch Ultra-LTPO OLED (1-120Hz, 2600 nits peak, 2.5D Sapphire)' },
    { key: 'Processor', value: 'Custom Neural Silicon with Dedicated Hardware Secure Enclave' },
    { key: 'Camera Matrix', value: '50MP 1-inch Main Sensor + 48MP Periscope Optical Zoom' },
    { key: 'Battery & Charging', value: '5,000 mAh, 65W Fast Wireless Magnetic Qi2 Charging' },
    { key: 'Water Ingress', value: 'IP68 Submersion Tested (6 meters for 30 minutes)' },
  ],
  watch: [
    { key: 'Case Diameter', value: '42mm Sandstone Ceramic Unibody with Sapphire Crystal' },
    { key: 'Display', value: '1.43-inch Monochrome AMOLED (466x466, 326 ppi)' },
    { key: 'Water Resistance', value: '5 ATM (50 meters ISO standard)' },
    { key: 'Battery Endurance', value: '72 hours continuous biometric telemetry, 14 days standby' },
    { key: 'Sensors', value: 'Optical PPG ECG, Dual-wavelength SpO2, Skin Temperature, 3-Axis Gyro' },
  ],
  headphone: [
    { key: 'Transducer Architecture', value: '45mm Planar Magnetic with Ultra-Thin Beryllium Substrate' },
    { key: 'Frequency Response', value: '10 Hz - 48,000 Hz (Hi-Res Audio Certified)' },
    { key: 'Noise Attenuation', value: 'Hybrid Adaptive ANC with 4-Mic Array (-42dB attenuation)' },
    { key: 'Wireless Codecs', value: 'LDAC, Qualcomm aptX Adaptive, AAC, Lossless USB-C 32-bit' },
    { key: 'Battery Endurance', value: '40 hours continuous playback with ANC active' },
    { key: 'Weight', value: '285g (balanced acoustic clamping force)' },
  ],
  speaker: [
    { key: 'Acoustic Architecture', value: 'Dual 2.5-inch Neodymium Drivers + Dual Opposed Passive Radiators' },
    { key: 'Power Output', value: '60W Peak Dynamic Class-D DSP Amplification' },
    { key: 'Wireless Telemetry', value: 'Bluetooth 5.3 LE, Auracast Multi-Speaker Broadcast' },
    { key: 'Battery Endurance', value: '24 hours continuous playback at 70dB SPL' },
    { key: 'Ingress Protection', value: 'IP67 Dust and Water Splash Proof' },
  ],
  laptops: [
    { key: 'Display Matrix', value: '15.3-inch 3.2K Liquid Retina XDR (120Hz ProMotion, 1000 nits)' },
    { key: 'Processor', value: '12-Core Architectural Silicon with 18-Core Neural Engine' },
    { key: 'Memory & Storage', value: '32GB Unified Memory, 1TB PCIe 4.0 NVMe SSD' },
    { key: 'Chassis Finish', value: '100% Recycled CNC Aerospace Aluminum with Bead-Blasted Satin Finish' },
    { key: 'Thermal Acoustic Level', value: 'Near-Silent Dual Vapor Chamber (<18 dB at max load)' },
  ],
  'smart-home': [
    { key: 'Optics & Spectrum', value: 'Full-Spectrum Circadian LED Engine (98+ CRI, 1800K - 6500K)' },
    { key: 'Wireless Protocols', value: 'Thread, Matter Native, Wi-Fi 6, Apple Home & Google Home' },
    { key: 'Sensors', value: 'Ambient Lux Telemetry, Time-of-Flight Radar Proximity' },
    { key: 'Chassis Finish', value: 'Solid Machined Brass with Sandstone Ceramic Base' },
  ],
  living: [
    { key: 'Filtration Standard', value: 'Medical-Grade True HEPA H13 (99.97% capture down to 0.1μm)' },
    { key: 'Room Air Exchange', value: '850 sq. ft. room cleansed twice per hour (CADR 320 m³/h)' },
    { key: 'Acoustic Noise Floor', value: 'Whisper-Quiet 17 dB(A) Night Mode' },
    { key: 'Sensors', value: 'Laser Optical PM2.5, Semiconductor Gas VOC, Temperature, Humidity' },
  ],
};

const IMAGE_PRESETS = [
  { label: 'Titanium Ceramic Watch', url: '/assets/images/watch_cream.jpg' },
  { label: 'Workspace Studio Display', url: '/assets/images/smart_workspace_display.jpg' },
  { label: 'Acoustic Cleanroom Purifier', url: '/assets/images/acoustic_air_purifier.jpg' },
  { label: 'Planar Beryllium Headphones', url: '/assets/images/headphones_geometric.jpg' },
  { label: 'Crystal Flagship Phone', url: '/assets/images/phone_crystal.jpg' },
  { label: 'Nordic Sound Column', url: '/assets/images/speaker_nordic.jpg' },
  { label: 'Circadian Luminaire Lamp', url: '/assets/images/smart_light_ambient.jpg' },
  { label: 'Aero Minimalist Laptop', url: '/assets/images/laptop_air.jpg' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit stock/price modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editReason, setEditReason] = useState('Restock shipment received');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Add new product modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('smartphones');
  const [newCategoryLabel, setNewCategoryLabel] = useState('Smartphones');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('50');
  const [newSku, setNewSku] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBadge, setNewBadge] = useState('NEW RELEASE');
  const [newFeatures, setNewFeatures] = useState('Aerospace Grade 5 Titanium Chassis, 2-Year Concierge Warranty');

  // Engineering Overview, Materials & Specs
  const [newOverview, setNewOverview] = useState('');
  const [newMaterials, setNewMaterials] = useState('Grade 5 Aerospace Titanium with Sandstone Ceramic and PVD coating.');
  const [newWarranty, setNewWarranty] = useState('2-Year Global Concierge Warranty & Replacement Guarantee');
  const [newSpecs, setNewSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Chassis Material', value: 'Grade 5 Aerospace Titanium with Sandstone Ceramic Back' },
    { key: 'Display', value: '6.7-inch Ultra-LTPO OLED (1-120Hz, 2600 nits peak, 2.5D Sapphire)' },
    { key: 'Processor', value: 'Custom Neural Silicon with Dedicated Hardware Secure Enclave' },
    { key: 'Camera Matrix', value: '50MP 1-inch Main Sensor + 48MP Periscope Optical Zoom' },
    { key: 'Battery & Charging', value: '5,000 mAh, 65W Fast Wireless Magnetic Qi2 Charging' },
    { key: 'Water Ingress', value: 'IP68 Submersion Tested (6 meters for 30 minutes)' },
  ]);

  const handleAddSpecRow = () => {
    setNewSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setNewSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setNewSpecs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const loadSpecsTemplate = (categoryKey: string) => {
    const list = SPECS_TEMPLATES[categoryKey] || SPECS_TEMPLATES['smartphone'] || [];
    setNewSpecs(list.map((item) => ({ ...item })));
  };
  
  // Image handling in Add modal
  const [imageMode, setImageMode] = useState<'upload' | 'link' | 'preset'>('upload');
  const [newImage, setNewImage] = useState('/assets/images/hero_gadgets.jpg');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSeeding, setIsSeeding] = useState(false);

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

  const handleSeedDb = async () => {
    setIsSeeding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/products/seed', {
        method: 'POST',
        headers: { 'x-demo-user': 'admin' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Seeding failed');
      }
      setMessage({ text: `Successfully synced ${data.data?.count || 12} hardware products into Supabase database!`, isError: false });
      fetchProducts();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error seeding database', isError: true });
    } finally {
      setIsSeeding(false);
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

      setMessage({ text: 'Inventory level and pricing committed to ledger.', isError: false });
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating product', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const generateAutoSku = (name: string) => {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'DEV';
    return `AETH-${clean}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-demo-user': 'admin' },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed');
      }

      setNewImage(data.data.url);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading image file');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      setMessage({ text: 'Product name and price are required.', isError: true });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': 'admin',
        },
        body: JSON.stringify({
          name: newName,
          price: Number(newPrice),
          stock: Number(newStock || 50),
          category: newCategory,
          categoryLabel: newCategoryLabel,
          image: newImage || '/assets/images/hero_gadgets.jpg',
          tagline: newTagline,
          description: newDescription || `${newName} engineered with aerospace titanium and acoustic precision.`,
          badge: newBadge || undefined,
          sku: newSku || generateAutoSku(newName),
          features: newFeatures.split(',').map((f) => f.trim()).filter(Boolean),
          overview: newOverview || newDescription || `${newName} engineered with aerospace titanium and acoustic precision.`,
          materials: newMaterials || 'Grade 5 Aerospace Titanium with Sandstone Ceramic and PVD coating.',
          warranty: newWarranty || '2-Year Global Concierge Warranty & Replacement Guarantee',
          specs: newSpecs.filter((s) => s.key.trim() && s.value.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to register product');
      }

      setMessage({ text: `Hardware stock "${newName}" successfully registered with ${newStock} initial units!`, isError: false });
      setIsAddModalOpen(false);
      resetAddForm();
      fetchProducts();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error registering hardware product', isError: true });
    } finally {
      setIsCreating(false);
    }
  };

  const resetAddForm = () => {
    setNewName('');
    setNewCategory('smartphones');
    setNewCategoryLabel('Smartphones');
    setNewPrice('');
    setNewStock('50');
    setNewSku('');
    setNewTagline('');
    setNewDescription('');
    setNewBadge('NEW RELEASE');
    setNewFeatures('Aerospace Grade 5 Titanium Chassis, 2-Year Concierge Warranty');
    setNewOverview('');
    setNewMaterials('Grade 5 Aerospace Titanium with Sandstone Ceramic and PVD coating.');
    setNewWarranty('2-Year Global Concierge Warranty & Replacement Guarantee');
    loadSpecsTemplate('smartphones');
    setNewImage('/assets/images/hero_gadgets.jpg');
    setUploadError(null);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deallocate "${name}" from the active catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-demo-user': 'admin' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: `Hardware "${name}" has been deallocated.`, isError: false });
        fetchProducts();
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error deallocating hardware', isError: true });
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category_label || p.categoryLabel || p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const cat = p.category_label || p.categoryLabel || p.category;
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
              Control real-time availability, register new hardware stock, upload images, and commit replenishment orders.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                resetAddForm();
                setIsAddModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 18px', gap: '8px' }}
            >
              <Plus size={16} /> Add New Stock
            </button>

            <button
              onClick={handleSeedDb}
              disabled={isSeeding}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
              title="Populate/update all baseline products directly into Supabase database table"
            >
              <Database size={13} color="var(--primary)" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Catalog to DB'}</span>
            </button>

            <button
              onClick={fetchProducts}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <RefreshCw size={13} /> Sync Catalog
            </button>
          </div>
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

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search hardware name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-dim)" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px', padding: '8px 12px', minWidth: '150px' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Hardware Component</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Buffer Stock</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Stock Health</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                    <div style={{ color: 'var(--text-muted)' }}>Retrieving live inventory ledger...</div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching hardware components found. Click "+ Add New Stock" to register devices.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const qty = p.stock_quantity ?? p.stock ?? 0;
                  const isLow = qty <= 10;
                  const isOut = qty === 0;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      {/* Product Name & Thumbnail */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              background: '#131b2e',
                              overflow: 'hidden',
                              position: 'relative',
                              flexShrink: 0,
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <img
                              src={p.image || '/assets/images/hero_gadgets.jpg'}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              ID: {p.id.slice(0, 18)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {p.category_label || p.categoryLabel || p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--primary)' }}>
                        ${p.price.toLocaleString()}
                      </td>

                      {/* Stock Quantity */}
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                        {qty} units
                      </td>

                      {/* Stock Status Badge */}
                      <td style={{ padding: '14px 20px' }}>
                        {isOut ? (
                          <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ● Depleted
                          </span>
                        ) : isLow ? (
                          <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ● Low ({qty} left)
                          </span>
                        ) : (
                          <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ● In Reserve
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="Adjust inventory level or MSRP"
                          >
                            <Edit2 size={13} /> Stock / Price
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', color: '#f87171' }}
                            title="Deallocate hardware"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: REGISTER NEW HARDWARE STOCK                      */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Register New Hardware Stock</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Publish device to catalog, allocate initial warehouse units</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '24px' }}>
              {/* Product Name & SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-name">Hardware Device Name *</label>
                  <input
                    id="new-name"
                    type="text"
                    required
                    placeholder="e.g. AETHER Horizon Ultra 65"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newSku) setNewSku(generateAutoSku(e.target.value));
                    }}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="new-sku">SKU Code</label>
                    <button
                      type="button"
                      onClick={() => setNewSku(generateAutoSku(newName))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    id="new-sku"
                    type="text"
                    placeholder="AETH-HOR-8821"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Category & Badge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-category">Hardware Category</label>
                  <select
                    id="new-category"
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setNewCategory(cat);
                      const map: Record<string, string> = {
                        smartphone: 'Smartphones',
                        smartphones: 'Smartphones',
                        watch: 'Wearables',
                        headphone: 'Studio Acoustics',
                        speaker: 'Acoustic Hardware',
                        laptops: 'Minimalist Computing',
                        'smart-home': 'Smart Living',
                        living: 'Architectural Hardware',
                      };
                      setNewCategoryLabel(map[cat] || 'Hardware');
                      loadSpecsTemplate(cat);
                    }}
                    className="form-input"
                  >
                    <option value="smartphone">Smartphones (Crystal & Titanium)</option>
                    <option value="watch">Wearables (Ceramic Smartwatches)</option>
                    <option value="headphone">Studio Acoustics (Planar Headphones)</option>
                    <option value="speaker">Acoustic Hardware (Sound Columns)</option>
                    <option value="laptops">Minimalist Computing (Aero Laptops)</option>
                    <option value="smart-home">Smart Living (Ambient & Workspace)</option>
                    <option value="living">Architectural Air Purifiers</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-badge">Catalog Badge</label>
                  <select
                    id="new-badge"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="form-input"
                  >
                    <option value="NEW RELEASE">NEW RELEASE</option>
                    <option value="FLAGSHIP">FLAGSHIP</option>
                    <option value="LIMITED RUN">LIMITED RUN</option>
                    <option value="BEST SELLER">BEST SELLER</option>
                    <option value="STUDIO GRADE">STUDIO GRADE</option>
                    <option value="">None</option>
                  </select>
                </div>
              </div>

              {/* Price ($) & Initial Stock Units */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-price">Retail Price ($ USD) *</label>
                  <input
                    id="new-price"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="e.g. 890"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-stock">Initial Warehouse Reserve (Units) *</label>
                  <input
                    id="new-stock"
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 50"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* IMAGE SELECTION & UPLOAD SECTION */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Product Image (File Upload or Direct Link)
                  </label>

                  {/* Mode Tabs */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '2px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: imageMode === 'upload' ? 'var(--primary)' : 'transparent',
                        color: imageMode === 'upload' ? '#07090e' : 'var(--text-muted)',
                      }}
                    >
                      <Upload size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('link')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: imageMode === 'link' ? 'var(--primary)' : 'transparent',
                        color: imageMode === 'link' ? '#07090e' : 'var(--text-muted)',
                      }}
                    >
                      <LinkIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Direct Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('preset')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: imageMode === 'preset' ? 'var(--primary)' : 'transparent',
                        color: imageMode === 'preset' ? '#07090e' : 'var(--text-muted)',
                      }}
                    >
                      <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Presets
                    </button>
                  </div>
                </div>

                {/* Sub-view: File Upload */}
                {imageMode === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png, image/jpeg, image/webp, image/gif, image/avif"
                      style={{ display: 'none' }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.01)',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                        {uploadingImage ? 'Uploading & Optimizing...' : 'Click to select image file or drag here'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        JPEG, PNG, WEBP, AVIF up to 10MB
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-view: Direct Image Link */}
                {imageMode === 'link' && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or /assets/images/..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', fontSize: '13px' }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                      Paste a public image URL or local static asset path.
                    </div>
                  </div>
                )}

                {/* Sub-view: Curated Presets */}
                {imageMode === 'preset' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {IMAGE_PRESETS.map((p) => {
                      const isSelected = newImage === p.url;
                      return (
                        <div
                          key={p.url}
                          onClick={() => setNewImage(p.url)}
                          style={{
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ width: '100%', height: '56px', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                            <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {uploadError && (
                  <div style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>
                    {uploadError}
                  </div>
                )}

                {/* Selected Image Preview Pill */}
                {newImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                      <img src={newImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Active Image Assigned
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {newImage}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tagline */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-tagline">Tagline / Subhead</label>
                <input
                  id="new-tagline"
                  type="text"
                  placeholder="e.g. Aerospace Titanium Unibody • Hi-Res Wireless DAC"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-desc">Product Overview & Engineering Details</label>
                <textarea
                  id="new-desc"
                  rows={3}
                  placeholder="Describe the architectural craft, acoustic fidelity, or minimalist computing specs..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Features (comma separated) */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-features">Key Hardware Highlights (Comma-separated)</label>
                <input
                  id="new-features"
                  type="text"
                  placeholder="Aerospace Titanium Chassis, 72h Biometric Telemetry, Sapphire Glass"
                  value={newFeatures}
                  onChange={(e) => setNewFeatures(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* SECTION: ENGINEERING OVERVIEW & ARCHITECTURE */}
              <div
                style={{
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  background: 'rgba(56, 189, 248, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--primary)" />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.02em' }}>
                      Engineering Overview & Architectural Narrative
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                      Detailed technical synopsis rendered in the primary &quot;Overview&quot; dossier tab of the product page.
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Engineered as an uncompromising exercise in minimalist acoustics. Features a bespoke 45mm planar transducer suspended within an aerospace-grade titanium chamber..."
                  value={newOverview}
                  onChange={(e) => setNewOverview(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical', fontSize: '12px', lineHeight: '1.6' }}
                />
              </div>

              {/* SECTION: MATERIALS & FINISH */}
              <div
                style={{
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  background: 'rgba(52, 211, 153, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#34d399" />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.02em' }}>
                      Materials, Substrates & Craftsmanship Finish
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                      Specification of alloys, ceramic composite, sapphire glass, PVD coating, and warranty tiers.
                    </p>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Materials & Finishes Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Machined Grade 5 Aerospace Titanium with Sandstone Ceramic Backing and 2.5D Sapphire Crystal Lens."
                    value={newMaterials}
                    onChange={(e) => setNewMaterials(e.target.value)}
                    className="form-input"
                    style={{ resize: 'vertical', fontSize: '12px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Concierge Warranty & Protection Plan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2-Year Global Concierge Warranty & Replacement Guarantee"
                    value={newWarranty}
                    onChange={(e) => setNewWarranty(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* SECTION: TECHNICAL SPECIFICATIONS MATRIX */}
              <div
                style={{
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  background: 'rgba(245, 158, 11, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} color="#f59e0b" />
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.02em' }}>
                        Technical Specifications Matrix ({newSpecs.length} parameters)
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                        Key-value telemetry displayed in the interactive grid on the product page.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => loadSpecsTemplate(newCategory)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '5px 10px', gap: '5px' }}
                      title="Reset specs to the recommended category baseline"
                    >
                      <RefreshCw size={11} /> Load {newCategoryLabel} Template
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSpecRow}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '5px 10px', gap: '5px', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    >
                      <Plus size={11} /> Add Parameter
                    </button>
                  </div>
                </div>

                {/* Specs rows table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {newSpecs.map((spec, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.6fr 36px',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Display)"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        className="form-input"
                        style={{ fontSize: '11px', padding: '6px 10px' }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 6.7-inch Ultra-LTPO OLED)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="form-input"
                        style={{ fontSize: '11px', padding: '6px 10px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          height: '32px',
                          width: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-fast)',
                        }}
                        title="Delete parameter"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {newSpecs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '12px' }}>
                      No specifications defined. Click &ldquo;Load Template&rdquo; or &ldquo;Add Parameter&rdquo; above.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={isCreating || uploadingImage}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  {isCreating ? 'Allocating & Registering...' : 'Register Hardware Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADJUST INVENTORY / EDIT STOCK MODAL              */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Adjust Hardware Inventory</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{editingProduct.name}</div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
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
