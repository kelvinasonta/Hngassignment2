'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: 'customer' | 'staff' | 'admin';
  provider: 'google' | 'email' | 'mock';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithCredentials: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  signInDemoUser: () => void;
  signInAdminUser: () => void;
  signOut: () => Promise<void>;
  isSupabaseLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to record activity logs on client
async function recordUserActivity(action: string, metadata: Record<string, any> = {}, userId?: string) {
  try {
    fetch('/api/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        userId,
        entityType: 'user',
        metadata,
      }),
    }).catch(() => {});
  } catch (e) {
    // non-blocking
  }
}

// Helper to trigger automated welcome email via Resend
async function triggerWelcomeEmail(
  email: string,
  name?: string,
  userId?: string,
  method: 'google' | 'credentials' | 'oauth' = 'credentials'
) {
  if (!email || !email.includes('@')) return;
  try {
    fetch('/api/auth/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        userId,
        method,
      }),
    }).catch((err) => console.warn('[Welcome Email Client Trigger Error]', err));
  } catch (e) {
    // non-blocking
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseLive = isSupabaseConfigured();

  useEffect(() => {
    // Check local storage for mock/demo user
    const savedDemo = localStorage.getItem('aether_demo_user');
    if (savedDemo) {
      setUser(JSON.parse(savedDemo));
      setLoading(false);
      return;
    }

    if (supabase) {
      // Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider === 'google' ? 'google' : 'email',
          };
          setUser(u);
        }
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider === 'google' ? 'google' : 'email',
          };
          setUser(u);

          // Automated welcome email trigger for new signups / Google OAuth (with server deduplication)
          if (event === 'SIGNED_IN') {
            const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0;
            const isRecent = Date.now() - createdAt < 300000;
            if (isRecent || session.user.app_metadata?.provider === 'google') {
              triggerWelcomeEmail(
                u.email,
                u.name,
                u.id,
                session.user.app_metadata?.provider === 'google' ? 'google' : 'oauth'
              );
            }
          }
        } else if (!localStorage.getItem('aether_demo_user')) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return {
        success: false,
        error: 'Authentication service is currently offline or credentials are being configured.',
      };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      recordUserActivity('auth.oauth.google.initiated');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signInWithCredentials = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      // Mock credentials fallback for instant evaluation
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        provider: 'email',
      };
      setUser(mockUser);
      localStorage.setItem('aether_demo_user', JSON.stringify(mockUser));
      recordUserActivity('auth.login.credentials', { email, simulated: true }, mockUser.id);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const u: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          provider: 'email',
        };
        setUser(u);
        recordUserActivity('auth.login.credentials', { email }, u.id);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signUpWithCredentials = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }> => {
    if (!supabase) {
      // Mock credentials fallback
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        name: fullName || email.split('@')[0],
        provider: 'email',
      };
      setUser(mockUser);
      localStorage.setItem('aether_demo_user', JSON.stringify(mockUser));
      recordUserActivity('auth.signup.credentials', { email, fullName, simulated: true }, mockUser.id);
      triggerWelcomeEmail(email, fullName, mockUser.id, 'credentials');
      return { success: true, confirmationRequired: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Traditional signup succeeded — dispatch welcome email
      triggerWelcomeEmail(email, fullName, data.user?.id, 'credentials');

      const confirmationRequired = Boolean(data.user && !data.session);

      if (data.user && data.session) {
        const u: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: fullName || data.user.email?.split('@')[0] || 'Customer',
          provider: 'email',
        };
        setUser(u);
        recordUserActivity('auth.signup.credentials', { email, fullName }, u.id);
      }

      return { success: true, confirmationRequired };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signInDemoUser = () => {
    const demoUser: User = {
      id: 'demo-google-user-101',
      email: 'alex.vance@gmail.com',
      name: 'Alex Vance',
      role: 'customer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      provider: 'google',
    };
    setUser(demoUser);
    localStorage.setItem('aether_demo_user', JSON.stringify(demoUser));
    recordUserActivity('auth.login.demo', { user: 'alex.vance@gmail.com' }, demoUser.id);
    triggerWelcomeEmail('alex.vance@gmail.com', 'Alex Vance', demoUser.id, 'google');
  };

  const signInAdminUser = () => {
    const adminUser: User = {
      id: 'demo-admin-user-001',
      email: 'admin@aether-store.com',
      name: 'Aether Chief Ops',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      provider: 'mock',
    };
    setUser(adminUser);
    localStorage.setItem('aether_demo_user', JSON.stringify(adminUser));
    recordUserActivity('auth.login.admin_demo', { user: 'admin@aether-store.com' }, adminUser.id);
  };

  const signOut = async () => {
    const currentId = user?.id;
    localStorage.removeItem('aether_demo_user');
    setUser(null);
    recordUserActivity('auth.logout', {}, currentId);
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithCredentials,
        signUpWithCredentials,
        signInDemoUser,
        signInAdminUser,
        signOut,
        isSupabaseLive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
