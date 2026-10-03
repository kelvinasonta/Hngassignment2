'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Mail,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  RefreshCw
} from 'lucide-react';

export default function SetupDashboardPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('keviloq@gmail.com');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system-status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.warn('Status fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, name: 'Test Customer' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestSending(false);
    }
  };

  const copySqlSchema = () => {
    const sql = `-- Supabase Schema for AETHER Store
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image TEXT NOT NULL,
    badge TEXT,
    description TEXT NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    stock INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'paid',
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'confirmed',
    mailgun_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;
    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', marginBottom: '8px' }}>
              <ShieldCheck size={14} /> Diagnostic Health Center
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              API & Cloud Integrations Status
            </h1>
          </div>

          <button
            onClick={fetchStatus}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Health Check</span>
          </button>
        </div>

        {/* 3 Infrastructure Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {/* Card 1: Supabase / Neon */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={20} />
              </div>

              {status?.supabase?.configured ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <CheckCircle2 size={12} /> Connected
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <AlertTriangle size={12} /> Ready for Keys
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Supabase / Postgres</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Persists products, order records, and order line items. Falls back to local memory store when credentials are not yet supplied.
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-dim)' }}>
              <div>URL: <strong>{status?.supabase?.url || 'Checking...'}</strong></div>
              <div>Connection: <strong>{status?.supabase?.connection || 'Checking...'}</strong></div>
            </div>
          </div>

          {/* Card 2: Mailgun */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={20} />
              </div>

              {status?.mailgun?.configured ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <CheckCircle2 size={12} /> Configured
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <AlertTriangle size={12} /> Simulation Mode
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Resend Email API</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Sends responsive HTML order confirmation receipts with accurate Nigerian Naira pricing. In simulation mode, dispatches are logged to the console safely without errors.
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-dim)' }}>
              <div>Provider: <strong>Resend</strong></div>
              <div>Mode: <strong>{status?.mailgun?.configured || status?.email?.configured ? 'Live Resend API' : 'Simulated (Safe)'}</strong></div>
            </div>
          </div>

          {/* Card 3: Google Auth */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: '#facc15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={20} />
              </div>

              {status?.googleAuth?.configured ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <CheckCircle2 size={12} /> Ready
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <AlertTriangle size={12} /> Ready for Client ID
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Google Cloud Auth</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              OAuth 2.0 Web Client authentication. Includes 1-Click Instant Demo Login for immediate preview in development.
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-dim)' }}>
              <div>Client ID: <strong>{status?.googleAuth?.clientId || 'Checking...'}</strong></div>
              <div>Demo Mode: <strong>Enabled</strong></div>
            </div>
          </div>
        </div>

        {/* Mailgun Interactive Test Tool */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Mail size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Test Resend Email Dispatch</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Enter your email below to send a live test order confirmation receipt via Resend to test your configuration.
          </p>

          <form onSubmit={handleSendTestEmail} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="recipient@yourdomain.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
              className="form-input"
              style={{ flex: 1, minWidth: '260px' }}
            />
            <button
              type="submit"
              disabled={testSending || !testEmail}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              <Send size={15} />
              <span>{testSending ? 'Sending Test...' : 'Send Test Receipt'}</span>
            </button>
          </form>

          {testResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: testResult.success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${testResult.success ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: testResult.success ? '#34d399' : '#f87171',
                fontSize: '13px',
              }}
            >
              {testResult.success ? (
                <div>
                  <strong>✓ Dispatch Successful!</strong> {testResult.result?.message || 'Check your inbox or server logs.'}
                  {testResult.result?.simulated && (
                    <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                      (Simulated dispatch mode: paste your RESEND_API_KEY in .env.local to send to real mailboxes)
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <strong>✗ Dispatch Failed:</strong>{' '}
                  {testResult.error || testResult.result?.error || 'Failed to dispatch email via Resend.'}
                  {testResult.result?.data?.message && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#fca5a5', lineHeight: 1.4 }}>
                      {testResult.result.data.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Database Migration SQL Box */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Supabase / Postgres Schema Migration</h3>
            </div>
            <button
              onClick={copySqlSchema}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {sqlCopied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy Schema SQL'}</span>
            </button>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Open your Supabase Project Dashboard → <strong>SQL Editor</strong> → Paste and Run to create the <code>products</code>, <code>orders</code>, and <code>order_items</code> tables with Row-Level Security.
          </p>

          <pre
            style={{
              background: '#07090e',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '12px',
              color: '#38bdf8',
              overflowX: 'auto',
              maxHeight: '260px',
              fontFamily: 'monospace',
            }}
          >
{`-- Products, Orders & Order Items Tables
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    stock INT DEFAULT 100
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now()
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
