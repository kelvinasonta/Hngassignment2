import { getSupabaseServerClient } from './supabase';
import crypto from 'crypto';

export type UserRole = 'customer' | 'staff' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  isDemo?: boolean;
}

export interface AuthContextResult {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  isAdmin: boolean;
  isStaff: boolean;
  error?: string;
}

const SERVER_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'aether-internal-secret-token-key-2026';

/**
 * Generates an HMAC-SHA256 guest token for a placed order,
 * allowing guest customers to securely view their specific receipt without IDOR risk.
 */
export function generateGuestOrderToken(orderNumber: string, customerEmail: string): string {
  return crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(`${orderNumber}:${customerEmail.toLowerCase().trim()}`)
    .digest('hex');
}

/**
 * Verifies a guest order token against the order number and customer email.
 */
export function verifyGuestOrderToken(orderNumber: string, customerEmail: string, token: string): boolean {
  if (!token) return false;
  const expectedToken = generateGuestOrderToken(orderNumber, customerEmail);
  return crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(token));
}

/**
 * Inspects incoming request headers / cookies to verify Supabase session and user role.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthContextResult> {
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Also check cookie for Supabase auth token
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );

    // Common Supabase auth cookie naming conventions
    token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || null;
  }

  const supabase = getSupabaseServerClient();

  if (supabase && token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        // Fetch role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        const role: UserRole = (profile?.role as UserRole) || 'customer';

        return {
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email || '',
            name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
            role,
            avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
          },
          isAdmin: role === 'admin',
          isStaff: role === 'staff' || role === 'admin',
        };
      }
    } catch (err: any) {
      console.warn('[Server Auth] Token validation error:', err.message);
    }
  }

  // Development Fallback: Check for simulated header in development mode
  if (process.env.NODE_ENV !== 'production') {
    const demoHeader = request.headers.get('x-demo-user');
    if (demoHeader === 'alex-vance') {
      return {
        isAuthenticated: true,
        user: {
          id: 'demo-google-user-101',
          email: 'alex.vance@gmail.com',
          name: 'Alex Vance',
          role: 'customer',
          isDemo: true,
        },
        isAdmin: false,
        isStaff: false,
      };
    } else if (demoHeader === 'admin') {
      return {
        isAuthenticated: true,
        user: {
          id: 'demo-admin-user-001',
          email: 'admin@aether-store.com',
          name: 'Aether Admin',
          role: 'admin',
          isDemo: true,
        },
        isAdmin: true,
        isStaff: true,
      };
    }
  }

  return {
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    isStaff: false,
  };
}
