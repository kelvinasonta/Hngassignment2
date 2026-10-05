import { getSupabaseServerClient } from '@/lib/supabase';
import { INITIAL_PRODUCTS, Product } from '@/lib/products-data';
import { getAllMergedProducts } from '@/lib/products-store';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    let product: Product | null = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (!error && data) {
        const initialMatch = INITIAL_PRODUCTS.find((p) => p.id === data.id || p.id === id);
        product = {
          id: data.id,
          name: data.name,
          tagline: data.tagline || initialMatch?.tagline || '',
          category: data.category_id || data.category || initialMatch?.category || 'hardware',
          categoryLabel: data.category_label || initialMatch?.categoryLabel || 'Hardware',
          price: Number(data.price),
          rating: Number(data.rating || initialMatch?.rating || 5),
          reviewsCount: Number(data.reviews_count || initialMatch?.reviewsCount || 100),
          image: data.image || initialMatch?.image || '/assets/images/hero_gadgets.jpg',
          gallery: initialMatch?.gallery || [data.image || '/assets/images/hero_gadgets.jpg'],
          badge: data.badge || initialMatch?.badge,
          description: data.description || initialMatch?.description || '',
          overview: initialMatch?.overview,
          materials: initialMatch?.materials,
          warranty: initialMatch?.warranty,
          features: Array.isArray(data.features) && data.features.length > 0 ? data.features : (initialMatch?.features || []),
          specs: initialMatch?.specs,
          colors: initialMatch?.colors,
          stock: data.stock ?? initialMatch?.stock ?? 25,
        };
      }
    }

    if (!product) {
      product = getAllMergedProducts().find((p) => p.id === id) || null;
    }

    if (!product) {
      return apiError(`Product with identifier "${id}" not found`, ApiErrorCode.NOT_FOUND, 404);
    }

    // Related products (same category or high rated)
    const relatedProducts = INITIAL_PRODUCTS.filter((p) => p.id !== product!.id).slice(0, 3);

    return apiSuccess(
      {
        product,
        relatedProducts,
      },
      'Product details retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching product detail:', error);
    return apiError('Server error retrieving product', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
