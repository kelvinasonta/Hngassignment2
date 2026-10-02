import { getSupabaseServerClient } from '@/lib/supabase';
import { INITIAL_PRODUCTS, Product } from '@/lib/products-data';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q')?.toLowerCase();

    const supabase = getSupabaseServerClient();

    let products: Product[] = [];

    if (supabase) {
      let dbQuery = supabase.from('products').select('*');
      if (category && category !== 'all') {
        dbQuery = dbQuery.eq('category_id', category);
      }
      const { data, error } = await dbQuery;
      if (!error && data && data.length > 0) {
        products = data.map((item) => ({
          id: item.id,
          name: item.name,
          tagline: item.tagline || '',
          category: item.category_id || item.category,
          categoryLabel: item.category_label,
          price: Number(item.price),
          rating: Number(item.rating || 5),
          reviewsCount: Number(item.reviews_count || 0),
          image: item.image,
          badge: item.badge,
          description: item.description,
          features: Array.isArray(item.features) ? item.features : [],
          stock: item.stock ?? 50,
        }));
      } else {
        products = INITIAL_PRODUCTS;
      }
    } else {
      products = INITIAL_PRODUCTS;
    }

    // Filter in-memory if needed
    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }
    if (query) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.categoryLabel.toLowerCase().includes(query)
      );
    }

    return apiSuccess(
      {
        products,
        count: products.length,
        source: supabase ? 'database' : 'catalog_cache',
      },
      'Products catalog retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return apiError('Failed to fetch products catalog', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
