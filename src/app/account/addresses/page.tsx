'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle, Home, Building2, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Address {
  id: string;
  full_name: string;
  street_line_1: string;
  street_line_2?: string | null;
  city: string;
  state_region?: string | null;
  postal_code: string;
  country_code: string;
  phone?: string | null;
  is_default: boolean;
  address_type: 'shipping' | 'billing' | 'both';
  created_at?: string;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // New address form state
  const [fullName, setFullName] = useState('');
  const [streetLine1, setStreetLine1] = useState('');
  const [streetLine2, setStreetLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressType, setAddressType] = useState<'shipping' | 'billing' | 'both'>('both');

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const email = user?.email || '';
      const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`/api/account/addresses${emailParam}`);
      const data = await res.json();
      let list: Address[] = (res.ok && data.success && data.data?.addresses) ? [...data.data.addresses] : [];

      // Merge with cached addresses used during checkout
      if (typeof window !== 'undefined') {
        const localKey = `aether_saved_addresses_${email.toLowerCase()}`;
        const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
        const defaultStored = JSON.parse(localStorage.getItem('aether_saved_addresses_default') || '[]');
        const latest = JSON.parse(localStorage.getItem('aether_latest_shipping_address') || 'null');
        const allLocal = [...stored, ...defaultStored, ...(latest ? [latest] : [])];

        allLocal.forEach((loc: any) => {
          if (!loc || (!loc.streetLine1 && !loc.street_line_1)) return;
          const street = loc.streetLine1 || loc.street_line_1 || '';
          const cty = loc.city || '';
          const formatted: Address = {
            id: loc.id || `loc-${Math.random()}`,
            full_name: loc.fullName || loc.full_name || 'Customer',
            street_line_1: street,
            street_line_2: loc.streetLine2 || loc.street_line_2 || null,
            city: cty,
            state_region: loc.stateRegion || loc.state_region || null,
            postal_code: loc.postalCode || loc.postal_code || '',
            country_code: loc.countryCode || loc.country_code || 'US',
            phone: loc.phone || null,
            is_default: Boolean(loc.isDefault || loc.is_default),
            address_type: loc.addressType || loc.address_type || 'shipping',
          };
          if (!list.some((a) => a.street_line_1 === street && a.city === cty)) {
            list.unshift(formatted);
          }
        });
      }

      setAddresses(list);
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          streetLine1,
          streetLine2,
          city,
          stateRegion,
          postalCode,
          countryCode,
          phone,
          isDefault,
          addressType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save address');
      }

      setMessage({ text: 'Address added successfully!', isError: false });
      setShowAddForm(false);
      // Reset form
      setFullName('');
      setStreetLine1('');
      setStreetLine2('');
      setCity('');
      setStateRegion('');
      setPostalCode('');
      setPhone('');
      setIsDefault(false);
      fetchAddresses();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error saving address', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        setMessage({ text: 'Address deleted successfully', isError: false });
      } else {
        throw new Error(data.message || 'Failed to delete address');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error deleting address', isError: true });
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
            Saved Addresses
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Manage delivery locations for accelerated checkout and courier routing.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setMessage(null);
          }}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          {showAddForm ? 'Cancel' : (
            <>
              <Plus size={16} /> Add Address
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
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

      {/* Add Address Form Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleAddAddress}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--primary)" /> New Delivery Destination
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-name">Full Recipient Name *</label>
              <input
                id="new-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kelvin Thorne"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-phone">Contact Phone</label>
              <input
                id="new-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2831"
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="new-street1">Street Address Line 1 *</label>
              <input
                id="new-street1"
                type="text"
                required
                value={streetLine1}
                onChange={(e) => setStreetLine1(e.target.value)}
                placeholder="742 Evergreen Terrace, Suite 400"
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="new-street2">Apartment, Suite, Unit (Optional)</label>
              <input
                id="new-street2"
                type="text"
                value={streetLine2}
                onChange={(e) => setStreetLine2(e.target.value)}
                placeholder="Building B, Floor 4"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-city">City *</label>
              <input
                id="new-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-state">State / Region</label>
              <input
                id="new-state"
                type="text"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                placeholder="CA"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-postal">Postal Code *</label>
              <input
                id="new-postal"
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="94107"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-country">Country</label>
              <select
                id="new-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="form-input"
              >
                <option value="US">United States (US)</option>
                <option value="CA">Canada (CA)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="DE">Germany (DE)</option>
                <option value="JP">Japan (JP)</option>
                <option value="AU">Australia (AU)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="is-default-addr"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="is-default-addr" style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)' }}>
              Set as primary shipping address
            </label>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving Address...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address Cards List */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <Building2 size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No Saved Addresses Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '360px', margin: '0 auto 20px' }}>
            Add your shipping and billing locations for faster checkout on upcoming audio and computing hardware releases.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 18px' }}
          >
            <Plus size={16} /> Add First Address
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                background: 'var(--bg-elevated)',
                border: addr.is_default ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: addr.is_default ? '0 0 15px rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Home size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{addr.full_name}</span>
                  </div>

                  {addr.is_default && (
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Star size={11} fill="#fff" /> PRIMARY
                    </span>
                  )}
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
                  <div>{addr.street_line_1}</div>
                  {addr.street_line_2 && <div>{addr.street_line_2}</div>}
                  <div>
                    {addr.city}, {addr.state_region || ''} {addr.postal_code}
                  </div>
                  <div>{addr.country_code}</div>
                  {addr.phone && <div style={{ marginTop: '6px', color: 'var(--text-dim)' }}>Phone: {addr.phone}</div>}
                </div>
              </div>

              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  title="Remove address"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
