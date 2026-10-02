'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Globe,
  Laptop,
  Terminal,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/activity-log', {
        headers: { 'x-demo-user': 'admin' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data?.logs || []);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ip_address && log.ip_address.includes(searchQuery)) ||
      (log.user_id && log.user_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Controls */}
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
              System Audit & Compliance Telemetry
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Immutable audit trail capturing administrative modifications, authentication attempts, and checkout events.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <RefreshCw size={13} /> Refresh Feed
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'admin', 'auth', 'order', 'checkout', 'review'].map((f) => (
              <button
                key={f}
                onClick={() => setActionFilter(f)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: actionFilter === f ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: actionFilter === f ? 'var(--primary)' : 'transparent',
                  color: actionFilter === f ? '#000' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {f}
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
              placeholder="Search action or IP..."
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '12px', height: '36px' }}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
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
            Streaming audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={40} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>No audit logs found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Perform an operation or place an order to generate events.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 16px' }}>Event Action</th>
                  <th style={{ padding: '14px 16px' }}>Entity Type</th>
                  <th style={{ padding: '14px 16px' }}>Network IP</th>
                  <th style={{ padding: '14px 16px' }}>Metadata / Details</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-subtle)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#fff',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {log.entity_type || 'system'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={13} color="var(--text-dim)" />
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-dim)', fontSize: '12px' }}>
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
