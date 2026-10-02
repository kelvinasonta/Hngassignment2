'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, Mail, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/account/profile')
      .then((res) => res.json())
      .then((data) => {
        const p = data.data?.profile;
        if (p) {
          if (p.full_name) setFullName(p.full_name);
          if (p.phone) setPhone(p.phone);
          if (p.avatar_url) setAvatarUrl(p.avatar_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }
      setMessage({ text: 'Profile updated successfully!', isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating profile', isError: true });
    } finally {
      setIsSaving(false);
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
      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
          Profile Information
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Manage your personal customer details and contact preferences.
        </p>
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

      <form onSubmit={handleSaveProfile}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address (Primary Identifier)
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="email"
              id="email"
              disabled
              value={user?.email || 'customer@example.com'}
              className="form-input"
              style={{ paddingLeft: '40px', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-dim)', cursor: 'not-allowed' }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            To change your primary email, contact customer support for identity verification.
          </span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Legal Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="text"
                id="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Alex Vance"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Mobile Phone (for Delivery SMS)
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
                size={16}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="avatar">
            Avatar Image URL
          </label>
          <input
            type="url"
            id="avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="form-input"
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary"
          style={{ marginTop: '12px', padding: '12px 24px' }}
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
}
