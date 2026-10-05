'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  Cpu,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ShipmentTrackerProps {
  order: any;
  onUpdateStatus?: (newStatus: string) => void;
}

export default function ShipmentTracker({ order, onUpdateStatus }: ShipmentTrackerProps) {
  const serialNumber = order.serial_number || 'SN-AETH-' + (order.order_number?.replace(/\D/g, '') || '8412') + '-REV';
  const trackingNumber = order.tracking_number || 'FX-EXP-88941294';

  // Read saved tracking stage or determine from order status
  const getInitialStep = () => {
    try {
      const stored = localStorage.getItem(`aether_order_step_${order.id || order.order_number}`);
      if (stored) return parseInt(stored, 10);
    } catch (e) {}

    const status = (order.order_status || order.status || '').toLowerCase();
    if (status.includes('deliver')) return 4;
    if (status.includes('transit') || status.includes('shipped') || status.includes('dispatch')) return 3;
    if (status.includes('calibrat') || status.includes('assembl') || status.includes('process')) return 2;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<number>(getInitialStep());
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`aether_order_step_${order.id || order.order_number}`, currentStep.toString());
    } catch (e) {}
  }, [currentStep, order.id, order.order_number]);

  const steps = [
    {
      num: 1,
      title: 'Order Verified & Authorized',
      location: 'AETHER Tokyo Cleanroom Logistics',
      time: 'Completed • Zero-Trust Token Auth',
      description: 'Payment verified, inventory allocated from cleanroom storage facility.',
    },
    {
      num: 2,
      title: 'Hardware Calibration & Serial Assignment',
      location: 'Laboratory Diagnostics Bay 04',
      time: currentStep >= 2 ? 'Completed • Multi-Point Acoustic Telemetry' : 'Estimated: 4-6 Hours',
      description: 'Transducer frequency burn-in, titanium surface inspection, laser engraving master serial.',
    },
    {
      num: 3,
      title: 'Carrier Flight in Transit',
      location: 'FedEx Priority Air Hub (Narita -> Anchorage -> Memphis)',
      time: currentStep >= 3 ? 'In Flight • GPS Active' : 'Scheduled: Next Flight Manifest',
      description: 'Hermetically sealed shockproof flight case handed to courier international air cargo.',
    },
    {
      num: 4,
      title: 'Out for Courier Handover',
      location: 'Local Metropolitan White-Glove Facility',
      time: currentStep >= 4 ? 'Dispatched • Arriving Today' : 'Awaiting Hub Arrival',
      description: 'Courier van dispatched for insured contactless biometric delivery.',
    },
  ];

  const handleAdvanceStep = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const next = currentStep >= 4 ? 1 : currentStep + 1;
      setCurrentStep(next);
      setIsSimulating(false);
      const statusLabels = ['Confirmed', 'Calibrating', 'In Transit', 'Delivered'];
      if (onUpdateStatus) {
        onUpdateStatus(statusLabels[next - 1]);
      }
    }, 600);
  };

  const copySerial = () => {
    navigator.clipboard.writeText(serialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: 'rgba(14, 19, 31, 0.65)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginTop: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
        }}
      />

      {/* Top Telemetry Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Truck size={15} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Live Telemetry & Tracking
            </span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              FedEx Priority Air Cargo •{' '}
              <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{trackingNumber}</span>
            </div>
          </div>
        </div>

        {/* Serial Badge & Simulation Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={copySerial}
            title="Click to copy hardware serial number"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              fontSize: '11px',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            <Cpu size={12} />
            <span>{serialNumber}</span>
            {copied ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
          </div>

          <button
            onClick={handleAdvanceStep}
            disabled={isSimulating}
            title="Simulate the next milestone in hardware assembly and courier transit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <RefreshCw size={11} className={isSimulating ? 'animate-spin' : ''} />
            <span>Simulate Checkpoint</span>
          </button>
        </div>
      </div>

      {/* 4-Step Interactive Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', position: 'relative' }}>
        {steps.map((st) => {
          const isDone = currentStep > st.num;
          const isCurrent = currentStep === st.num;

          return (
            <div
              key={st.num}
              style={{
                position: 'relative',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: isCurrent
                  ? 'rgba(56, 189, 248, 0.08)'
                  : isDone
                  ? 'rgba(52, 211, 153, 0.04)'
                  : 'rgba(255, 255, 255, 0.01)',
                border: isCurrent
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : isDone
                  ? '1px solid rgba(52, 211, 153, 0.2)'
                  : '1px solid var(--border-subtle)',
                transition: 'var(--transition-fast)',
              }}
            >
              {/* Node Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isDone ? '#34d399' : isCurrent ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: isDone || isCurrent ? '#07090e' : 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    boxShadow: isCurrent ? '0 0 12px rgba(56, 189, 248, 0.6)' : undefined,
                  }}
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : st.num}
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isDone ? '#34d399' : isCurrent ? 'var(--primary)' : 'var(--text-dim)',
                    textTransform: 'uppercase',
                  }}
                >
                  {isDone ? 'Cleared' : isCurrent ? 'Active Phase' : 'Upcoming'}
                </span>
              </div>

              {/* Step Title & Details */}
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                {st.title}
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} color="var(--primary)" />
                <span>{st.location}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {st.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
