'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Key, Lock, CheckCircle2, AlertCircle, Clock, Globe, Laptop, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity_type?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Audit logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Two-Factor Authentication (2FA / TOTP) state
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const [twoFaMessage, setTwoFaMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Password strength calculation
  const hasMinLen = newPassword.length >= 8;
  const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthScore = (hasMinLen ? 1 : 0) + (hasUpperLower ? 1 : 0) + (hasNumberOrSymbol ? 1 : 0);

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/activity-log');
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data?.logs || []);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetch2faStatus = async () => {
    try {
      const email = user?.email || 'alex.vance@aether-hardware.internal';
      const res = await fetch(`/api/account/security/2fa?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setIs2faEnabled(data.data.enabled);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchLogs();
    fetch2faStatus();
  }, [user]);

  const handleStart2faSetup = async () => {
    setTwoFaMessage(null);
    try {
      const email = user?.email || 'alex.vance@aether-hardware.internal';
      const res = await fetch(`/api/account/security/2fa?setup=true&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTotpSecret(data.data.secret);
        setTotpUri(data.data.uri);
        setBackupCodes(data.data.backupCodes || []);
        setIsSettingUp2fa(true);
      }
    } catch (err: any) {
      setTwoFaMessage({ text: 'Failed to initiate 2FA setup: ' + err.message, isError: true });
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken || verifyToken.length !== 6) {
      setTwoFaMessage({ text: 'Please enter a valid 6-digit verification code.', isError: true });
      return;
    }

    setIsVerifying2fa(true);
    setTwoFaMessage(null);

    try {
      const email = user?.email || 'alex.vance@aether-hardware.internal';
      const res = await fetch('/api/account/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          secret: totpSecret,
          token: verifyToken,
          backupCodes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid code');
      }

      setIs2faEnabled(true);
      setIsSettingUp2fa(false);
      setVerifyToken('');
      setTwoFaMessage({ text: 'Two-Factor Authentication (2FA) is now active and protecting your account!', isError: false });
      fetchLogs();
    } catch (err: any) {
      setTwoFaMessage({ text: err.message || 'Verification failed. Please check your authenticator code.', isError: true });
    } finally {
      setIsVerifying2fa(false);
    }
  };

  const handleDisable2fa = async () => {
    if (!confirm('Are you sure you want to deactivate Two-Factor Authentication?')) return;
    try {
      const email = user?.email || 'alex.vance@aether-hardware.internal';
      const res = await fetch(`/api/account/security/2fa?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setIs2faEnabled(false);
        setTwoFaMessage({ text: 'Two-Factor Authentication deactivated.', isError: false });
        fetchLogs();
      }
    } catch (err: any) {
      setTwoFaMessage({ text: 'Error disabling 2FA: ' + err.message, isError: true });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLen) {
      setMessage({ text: 'Password must be at least 8 characters.', isError: true });
      return;
    }
    if (!passwordsMatch) {
      setMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update password');
      }

      setMessage({ text: 'Security credentials updated successfully!', isError: false });
      setNewPassword('');
      setConfirmPassword('');
      fetchLogs(); // refresh audit logs
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating password', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Password Management Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}
      >
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Key size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Password & Authentication
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Ensure your hardware procurement account remains protected with high-entropy passkeys.
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

        <form onSubmit={handleChangePassword} style={{ maxWidth: '520px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-pwd">
              New Master Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                id="new-pwd"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Strength Meter Bar */}
          {newPassword.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', height: '4px', marginBottom: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    borderRadius: '2px',
                    background: strengthScore >= 1 ? '#ef4444' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.2s',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    borderRadius: '2px',
                    background: strengthScore >= 2 ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.2s',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    borderRadius: '2px',
                    background: strengthScore >= 3 ? '#10b981' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.2s',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ color: hasMinLen ? '#34d399' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {hasMinLen ? '✓' : '•'} At least 8 characters
                </span>
                <span style={{ color: hasUpperLower ? '#34d399' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {hasUpperLower ? '✓' : '•'} Mix of uppercase & lowercase letters
                </span>
                <span style={{ color: hasNumberOrSymbol ? '#34d399' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {hasNumberOrSymbol ? '✓' : '•'} Contains a number or special symbol
                </span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pwd">
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                id="confirm-pwd"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Passwords do not match
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || !hasMinLen || !passwordsMatch}
            className="btn btn-primary"
            style={{ marginTop: '8px' }}
          >
            {isSaving ? 'Updating Credentials...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Connected Authentication Methods */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="var(--primary)" /> Connected Identity Providers
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Google Cloud OAuth</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {user?.email || 'OAuth 2.0 Identity'}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.1)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(52, 211, 153, 0.2)',
              }}
            >
              Active
            </span>
          </div>

          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Key size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Password Authentication</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Credential Pair</div>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.1)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(52, 211, 153, 0.2)',
              }}
            >
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication (2FA / TOTP) Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Shield size={22} color="var(--primary)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Two-Factor Authentication (2FA / TOTP)
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Protect high-value hardware orders and administrative actions with RFC 6238 time-based one-time passcodes.
            </p>
          </div>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: is2faEnabled ? '#34d399' : '#fbbf24',
              background: is2faEnabled ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${is2faEnabled ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
            }}
          >
            {is2faEnabled ? '● 2FA Active & Protected' : '○ 2FA Not Configured'}
          </span>
        </div>

        {twoFaMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              background: twoFaMessage.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
              border: `1px solid ${twoFaMessage.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
              color: twoFaMessage.isError ? '#fca5a5' : '#34d399',
            }}
          >
            {twoFaMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{twoFaMessage.text}</span>
          </div>
        )}

        {is2faEnabled ? (
          <div>
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(52, 211, 153, 0.04)',
                border: '1px solid rgba(52, 211, 153, 0.15)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                <CheckCircle2 size={18} /> Hardware Passcode Protection Active
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Every sign-in and administrative action requires validation through your authenticator application (Google Authenticator, Authy, or 1Password).
              </p>
            </div>

            <button
              onClick={handleDisable2fa}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
            >
              Deactivate Two-Factor Authentication
            </button>
          </div>
        ) : !isSettingUp2fa ? (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              Add an additional cryptographic defense layer to your AETHER procurement profile. When enabled, signing in requires both your password and an authenticator-generated code.
            </p>
            <button
              onClick={handleStart2faSetup}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Configure Authenticator App (2FA)
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '24px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Step 1: Scan Authenticator Key or Enter Secret
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {/* Secret Display Box */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Manual Base32 Secret Key
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    color: 'var(--primary)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    userSelect: 'all',
                  }}
                >
                  {totpSecret}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Add this key manually in Google Authenticator or scan the standard TOTP URI.
                </div>
              </div>

              {/* Instructions */}
              <div>
                <ol style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
                  <li>Open your preferred authenticator app (Google Authenticator, Authy, etc.).</li>
                  <li>Select <strong>Add Account</strong> → <strong>Enter Secret Key</strong>.</li>
                  <li>Account Name: <code>AETHER ({user?.email || 'Hardware'})</code>.</li>
                  <li>Type: <strong>Time-based (TOTP)</strong>.</li>
                </ol>
              </div>
            </div>

            {/* Emergency Recovery Codes */}
            {backupCodes.length > 0 && (
              <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Emergency Backup Recovery Codes (Save these in a secure place)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {backupCodes.map((code, idx) => (
                    <div key={idx} style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 Verification Form */}
            <form onSubmit={handleVerify2fa} style={{ maxWidth: '400px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                Step 2: Enter 6-Digit Authenticator Code
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="000000"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                  className="form-input"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '20px',
                    letterSpacing: '4px',
                    textAlign: 'center',
                    maxWidth: '180px',
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={isVerifying2fa || verifyToken.length !== 6}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isVerifying2fa ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingUp2fa(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Cancel Setup
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Security Audit Activity Log */}
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
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '16px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" /> Recent Account Activity & Audit Logs
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Cryptographically timestamped audit entries across all sessions.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {isLoadingLogs ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
            Loading security audit entries...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No recent activity recorded.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Event Action</th>
                  <th style={{ padding: '10px 12px' }}>Network Location</th>
                  <th style={{ padding: '10px 12px' }}>Device / Client</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={14} color="var(--text-dim)" />
                        {log.ip_address || '127.0.0.1'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Laptop size={14} color="var(--text-dim)" />
                        {log.user_agent ? (log.user_agent.includes('Mac') ? 'macOS Safari / Chrome' : 'Desktop Browser') : 'Direct API'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-dim)', fontSize: '12px' }}>
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
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
