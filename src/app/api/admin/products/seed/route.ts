import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { INITIAL_PRODUCTS } from '@/lib/products-data';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Administrator credentials required to seed database', ApiErrorCode.FORBIDDEN, 403);
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return apiError('Supabase is not configured in .env.local', ApiErrorCode.INTERNAL_ERROR, 500);
    }

    const rows = INITIAL_PRODUCTS.map((p) => ({
      id: p.id,
      sku: `AETH-${p.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: p.name,
      slug: p.id,
      tagline: p.tagline,
      category_id: p.category,
      category_label: p.categoryLabel,
      price: p.price,
      stock: p.stock ?? 50,
      image: p.image,
      badge: p.badge || null,
      description: p.description,
      features: p.features || [],
      rating: p.rating || 5.0,
      reviews_count: p.reviewsCount || 40,
      is_active: true,
      is_featured: true,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (error) {
      return apiError(`Failed to seed Supabase database: ${error.message}. (Ensure supabase/schema.sql has been executed)`, ApiErrorCode.INTERNAL_ERROR, 500);
    }

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.database_seeded',
      entityType: 'catalog',
      metadata: { count: rows.length },
    });

    return apiSuccess({ count: data?.length || rows.length }, 'Supabase products table populated successfully');
  } catch (error: any) {
    return apiError('Failed to seed database: ' + error.message, ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
