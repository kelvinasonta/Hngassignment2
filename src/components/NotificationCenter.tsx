'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  Cpu,
  Truck,
  ShieldCheck,
  Sparkles,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

export interface HardwareNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'firmware' | 'restock' | 'warranty';
  unread: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: HardwareNotification[] = [
  {
    id: 'notif-1',
    title: 'FedEx Priority Air Dispatch',
    message: 'Your hardware order has departed Tokyo Narita Air Cargo terminal with 24-48h insured transit.',
    time: '12m ago',
    type: 'order',
    unread: true,
    link: '/account/orders',
  },
  {
    id: 'notif-2',
    title: 'Firmware Calibration v2.4 Available',
    message: 'OTA acoustic telemetry update for Horizon Smart Watch and Studio Planars with low-latency DSP.',
    time: '2h ago',
    type: 'firmware',
    unread: true,
    link: '/products/prod-watch-cream',
  },
  {
    id: 'notif-3',
    title: 'Cleanroom Batch Allocation: Titanium Obsidian',
    message: 'New batch of CNC 6063 Aluminum and Titanium hardware monitors released to store catalog.',
    time: '1d ago',
    type: 'restock',
    unread: false,
    link: '/#products',
  },
  {
    id: 'notif-4',
    title: 'AETHER Concierge 2-Year Warranty Active',
    message: 'Your registered hardware devices are backed by zero-deductible worldwide concierge replacement.',
    time: '3d ago',
    type: 'warranty',
    unread: false,
    link: '/account',
  },
];

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationCenter({ isOpen, onClose, onUnreadCountChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<HardwareNotification[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aether_hardware_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(INITIAL_NOTIFICATIONS);
      }
    } catch (e) {
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  }, [isOpen]);

  useEffect(() => {
    const unreadCount = notifications.filter((n) => n.unread).length;
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [notifications, onUnreadCountChange]);

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
    try {
      localStorage.setItem('aether_hardware_notifications', JSON.stringify(updated));
    } catch (e) {}
  };

  const markItemRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, unread: false } : n));
    setNotifications(updated);
    try {
      localStorage.setItem('aether_hardware_notifications', JSON.stringify(updated));
    } catch (e) {}
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Truck size={16} color="#38bdf8" />;
      case 'firmware':
        return <Cpu size={16} color="#fbbf24" />;
      case 'warranty':
        return <ShieldCheck size={16} color="#34d399" />;
      default:
        return <Sparkles size={16} color="#818cf8" />;
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 105,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '80px 24px 20px',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(10, 14, 23, 0.96)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(14, 19, 31, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Hardware Telemetry Alerts
            </h3>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--primary)',
                  color: '#07090e',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark all as read"
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCheck size={14} />
                <span>Mark read</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <Bell size={32} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
              <p style={{ fontSize: '13px' }}>No active telemetry notifications</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markItemRead(notif.id)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    background: notif.unread ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: notif.unread ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-subtle)',
                    transition: 'var(--transition-fast)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {getIcon(notif.type)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                          {notif.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', flexShrink: 0, marginLeft: '8px' }}>
                          {notif.time}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '6px' }}>
                        {notif.message}
                      </p>

                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={onClose}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Inspect details</span>
                          <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
