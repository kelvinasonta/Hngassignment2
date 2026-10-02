import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to view reviews', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const supabase = getSupabaseServerClient();
    let reviews: any[] = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(name, image, category_label)')
        .eq('user_id', authResult.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        reviews = data;
      }
    }

    return apiSuccess({ reviews }, 'Customer reviews retrieved successfully');
  } catch (error: any) {
    return apiError('Failed to fetch reviews', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`review-submit:${clientIp}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many review submissions. Please wait a minute.', ApiErrorCode.RATE_LIMITED, 429);
    }

    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to submit review', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json().catch(() => null);
    const productId = String(body?.productId || '');
    const rating = Number(body?.rating);
    const title = String(body?.title || '').trim();
    const comment = String(body?.comment || '').trim();

    if (!productId) {
      return apiError('Product ID is required', ApiErrorCode.VALIDATION_ERROR, 422);
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiError('Rating must be an integer between 1 and 5', ApiErrorCode.VALIDATION_ERROR, 422);
    }
    if (!comment || comment.length < 5) {
      return apiError('Review comment must be at least 5 characters long', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const supabase = getSupabaseServerClient();
    const reviewRecord = {
      id: crypto.randomUUID(),
      product_id: productId,
      user_id: authResult.user.id,
      author_name: authResult.user.name,
      author_email: authResult.user.email,
      rating,
      title: title || 'Verified Customer Review',
      comment,
      is_verified_buyer: true,
      is_approved: true,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert(reviewRecord)
        .select()
        .single();

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }

      await logActivity({
        userId: authResult.user.id,
        action: 'review.submitted',
        entityType: 'product',
        entityId: productId,
        metadata: { rating },
        ipAddress: clientIp,
      });

      return apiSuccess({ review: data }, 'Review submitted successfully', 201);
    }

    return apiSuccess({ review: reviewRecord }, 'Review submitted successfully (local simulation)', 201);
  } catch (error: any) {
    return apiError('Failed to submit review', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
