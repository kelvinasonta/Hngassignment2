import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { logActivity } from '@/lib/activity-logger';

// Seed coupons fallback
const fallbackCoupons = [
  {
    id: 'coup-1',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 100,
    current_uses: 28,
    max_uses: 500,
    is_active: true,
    expires_at: '2026-12-31T23:59:59Z',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'coup-2',
    code: 'TECH20',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_amount: 500,
    current_uses: 14,
    max_uses: 100,
    is_active: true,
    expires_at: '2026-12-31T23:59:59Z',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'coup-3',
    code: 'VIP50',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_amount: 300,
    current_uses: 5,
    max_uses: 50,
    is_active: false,
    expires_at: '2026-06-30T23:59:59Z',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: coupons, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && coupons && coupons.length > 0) {
        return apiSuccess({ coupons }, 'Coupons retrieved from database');
      }
    }

    return apiSuccess({ coupons: fallbackCoupons }, 'Coupons retrieved (fallback)');
  } catch (error: any) {
    return apiError('Failed to fetch coupons', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Invalid request payload', ApiErrorCode.BAD_REQUEST, 400);
    }

    const code = String(body.code || '').toUpperCase().trim();
    const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage';
    const discountValue = Number(body.discountValue);
    const minOrderAmount = Number(body.minOrderAmount) || 0;
    const maxUses = body.maxUses ? Number(body.maxUses) : null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;

    if (!code || code.length < 3) {
      return apiError('Coupon code must be at least 3 characters', ApiErrorCode.VALIDATION_ERROR, 422);
    }
    if (isNaN(discountValue) || discountValue <= 0) {
      return apiError('Discount value must be a positive number', ApiErrorCode.VALIDATION_ERROR, 422);
    }
    if (discountType === 'percentage' && discountValue > 100) {
      return apiError('Percentage discount cannot exceed 100%', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const newCoupon = {
      id: crypto.randomUUID(),
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_amount: minOrderAmount,
      current_uses: 0,
      max_uses: maxUses,
      is_active: true,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('discount_coupons')
        .insert(newCoupon)
        .select()
        .single();

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }

      await logActivity({
        userId: authResult.user.id,
        action: 'admin.coupon_created',
        entityType: 'coupon',
        entityId: data.id,
        metadata: { code, discountType, discountValue },
      });

      return apiSuccess({ coupon: data }, 'Coupon created successfully', 201);
    }

    fallbackCoupons.unshift(newCoupon);

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.coupon_created_simulated',
      entityType: 'coupon',
      entityId: newCoupon.id,
      metadata: { code, discountType, discountValue },
    });

    return apiSuccess({ coupon: newCoupon }, 'Coupon created successfully (store)', 201);
  } catch (error: any) {
    return apiError('Failed to create coupon', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');
    if (!couponId) {
      return apiError('Coupon ID is required', ApiErrorCode.BAD_REQUEST, 400);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ is_active: false })
        .eq('id', couponId);

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }
    } else {
      const target = fallbackCoupons.find((c) => c.id === couponId);
      if (target) target.is_active = false;
    }

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.coupon_deactivated',
      entityType: 'coupon',
      entityId: couponId,
    });

    return apiSuccess({ deactivatedId: couponId }, 'Coupon deactivated successfully');
  } catch (error: any) {
    return apiError('Failed to deactivate coupon', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
