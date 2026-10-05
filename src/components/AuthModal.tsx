'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Sparkles, CheckCircle2, ShieldCheck, AlertCircle, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps = {}) {
  const {
    signInWithGoogle,
    signInWithCredentials,
    signUpWithCredentials,
    signInDemoUser,
    signInAdminUser,
    isSupabaseLive,
    isAuthModalOpen: contextIsOpen,
    closeAuthModal: contextOnClose,
    authModalMode: contextMode,
  } = useAuth();

  const modalIsOpen = isOpen !== undefined ? isOpen : contextIsOpen;
  const handleClose = onClose !== undefined ? onClose : contextOnClose;

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode || contextMode || 'signin');

  useEffect(() => {
    if (contextMode) {
      setAuthMode(contextMode);
    }
  }, [contextMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!modalIsOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const result = await signInWithGoogle();
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setErrorMsg(result.error);
    } else {
      handleClose();
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    if (authMode === 'signin') {
      const res = await signInWithCredentials(email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
      } else {
        handleClose();
      }
    } else {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }
      const res = await signUpWithCredentials(email, password, fullName);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      } else {
        if (res.confirmationRequired) {
          setSuccessMsg('Account created! Please check your email to confirm your account, or sign in.');
        } else {
          handleClose();
        }
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                {authMode === 'signin' ? 'Sign In to AETHER' : 'Create Customer Account'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OAuth 2.0 & Secure Database Credentials</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Mode Switch Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px',
              marginBottom: '20px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                color: authMode === 'signin' ? '#07090e' : 'var(--text-muted)',
                background: authMode === 'signin' ? 'var(--primary)' : 'transparent',
                transition: 'var(--transition-fast)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                color: authMode === 'signup' ? '#07090e' : 'var(--text-muted)',
                background: authMode === 'signup' ? 'var(--primary)' : 'transparent',
                transition: 'var(--transition-fast)',
              }}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                color: '#fca5a5',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                color: '#34d399',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Official Google OAuth Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.12)',
              transition: 'var(--transition-fast)',
              marginBottom: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 10.03 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '16px 0',
              color: 'var(--text-dim)',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>or with email & password</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleCredentialsSubmit}>
            {authMode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon
                    size={16}
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                  />
                  <input
                    type="text"
                    id="auth-name"
                    required
                    className="form-input"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    placeholder="e.g. Alex Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                />
                <input
                  type="email"
                  id="auth-email"
                  autoComplete="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '100%' }}
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                />
                <input
                  type="password"
                  id="auth-password"
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '100%' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            >
              <span>{isSubmitting ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
