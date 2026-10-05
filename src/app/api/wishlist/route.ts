import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { Product } from '@/lib/products-data';

// Memory fallback store to guarantee seamless syncing even when offline/sandboxed
const globalWishlistStore: Map<string, Product[]> =
  (global as any).__AETHER_WISHLIST_STORE__ || new Map();
(global as any).__AETHER_WISHLIST_STORE__ = globalWishlistStore;

function resolveUserId(authResultUser: any, explicitUserId?: string | null, email?: string | null): string | null {
  if (authResultUser?.id) return authResultUser.id;
  if (explicitUserId && explicitUserId.trim()) return explicitUserId.trim();
  if (email && email.trim()) return email.trim().toLowerCase();
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const emailParam = searchParams.get('email');
    const targetUserId = resolveUserId(authResult.user, userIdParam, emailParam);

    if (!targetUserId) {
      return apiSuccess({ wishlist: [] }, 'No authenticated user session, guest wishlist empty');
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('product_id, product_data')
          .eq('user_id', targetUserId);

        if (!error && data) {
          const items: Product[] = data.map((row: any) => ({
            id: row.product_id,
            name: row.product_data?.name || 'AETHER Device',
            tagline: row.product_data?.tagline || 'AETHER Reference Edition',
            price: Number(row.product_data?.price || 0),
            image: row.product_data?.image || '/assets/images/hero_gadgets.jpg',
            category: row.product_data?.category || 'watch',
            categoryLabel: row.product_data?.categoryLabel || 'Hardware',
            badge: row.product_data?.badge,
            description: row.product_data?.description || '',
            rating: row.product_data?.rating || 5,
            reviewsCount: row.product_data?.reviewsCount || 0,
            features: row.product_data?.features || [],
            specs: row.product_data?.specs || {},
            stock: row.product_data?.stock ?? 100,
          }));

          globalWishlistStore.set(targetUserId, items);
          return apiSuccess({ wishlist: items }, 'User wishlist retrieved from database');
        }
      } catch (err: any) {
        console.warn('[Wishlist API] Supabase query failed, falling back to memory store:', err.message);
      }
    }

    const memoryWishlist = globalWishlistStore.get(targetUserId) || [];
    return apiSuccess({ wishlist: memoryWishlist }, 'User wishlist retrieved from persistent store');
  } catch (error: any) {
    return apiError('Failed to fetch user wishlist', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => null);

    if (!body || !body.productId) {
      return apiError('Product ID is required', ApiErrorCode.BAD_REQUEST, 400);
    }

    const { productId, productData = {}, action = 'add', userId, email } = body;
    const targetUserId = resolveUserId(authResult.user, userId, email);

    if (!targetUserId) {
      return apiError('User ID or active login session required to persist wishlist', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const currentList = globalWishlistStore.get(targetUserId) || [];
    const exists = currentList.some((p) => p.id === productId);
    let updatedList = [...currentList];

    const supabase = getSupabaseServerClient();

    if (action === 'remove' || (action === 'toggle' && exists)) {
      // Remove item
      updatedList = updatedList.filter((p) => p.id !== productId);
      globalWishlistStore.set(targetUserId, updatedList);

      if (supabase) {
        try {
          await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', targetUserId)
            .eq('product_id', productId);
        } catch (err: any) {
          console.warn('[Wishlist API] Supabase delete error:', err.message);
        }
      }

      return apiSuccess({ wishlist: updatedList, inWishlist: false }, 'Product removed from database wishlist');
    } else {
      // Add item (with deduplication)
      if (!exists) {
        const fullProduct: Product = {
          id: productId,
          name: productData.name || body.name || 'AETHER Device',
          tagline: productData.tagline || body.tagline || 'AETHER Reference Edition',
          price: Number(productData.price || body.price || 0),
          image: productData.image || body.image || '/assets/images/hero_gadgets.jpg',
          category: productData.category || body.category || 'watch',
          categoryLabel: productData.categoryLabel || body.categoryLabel || 'Hardware',
          badge: productData.badge,
          description: productData.description || '',
          rating: productData.rating || 5,
          reviewsCount: productData.reviewsCount || 0,
          features: productData.features || [],
          specs: productData.specs || {},
          stock: productData.stock ?? 100,
        };
        updatedList.push(fullProduct);
        globalWishlistStore.set(targetUserId, updatedList);

        if (supabase) {
          try {
            await supabase.from('wishlist_items').upsert(
              {
                user_id: targetUserId,
                product_id: productId,
                product_data: fullProduct,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,product_id' }
            );
          } catch (err: any) {
            console.warn('[Wishlist API] Supabase upsert error:', err.message);
          }
        }
      }

      return apiSuccess({ wishlist: updatedList, inWishlist: true }, 'Product added to database wishlist');
    }
  } catch (error: any) {
    return apiError('Failed to update wishlist in database', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PUT: Bulk merge guest wishlist items into user account upon login without duplicates
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => null);

    if (!body) {
      return apiError('Invalid request body', ApiErrorCode.BAD_REQUEST, 400);
    }

    const { localWishlist = [], userId, email } = body;
    const targetUserId = resolveUserId(authResult.user, userId, email);

    if (!targetUserId) {
      return apiError('User ID or active login session required for wishlist sync', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const supabase = getSupabaseServerClient();
    const wishlistMap = new Map<string, Product>();

    // 1. Fetch existing DB items
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('product_id, product_data')
          .eq('user_id', targetUserId);

        if (!error && data) {
          data.forEach((row: any) => {
            wishlistMap.set(row.product_id, {
              id: row.product_id,
              name: row.product_data?.name || 'AETHER Device',
              tagline: row.product_data?.tagline || 'AETHER Reference Edition',
              price: Number(row.product_data?.price || 0),
              image: row.product_data?.image || '/assets/images/hero_gadgets.jpg',
              category: row.product_data?.category || 'watch',
              categoryLabel: row.product_data?.categoryLabel || 'Hardware',
              badge: row.product_data?.badge,
              description: row.product_data?.description || '',
              rating: row.product_data?.rating || 5,
              reviewsCount: row.product_data?.reviewsCount || 0,
              features: row.product_data?.features || [],
              specs: row.product_data?.specs || {},
              stock: row.product_data?.stock ?? 100,
            });
          });
        }
      } catch (err: any) {
        console.warn('[Wishlist API] Failed to fetch current DB wishlist for merge:', err.message);
      }
    }

    // Also populate from memory store if DB had nothing
    if (wishlistMap.size === 0) {
      const mem = globalWishlistStore.get(targetUserId) || [];
      mem.forEach((p) => wishlistMap.set(p.id, { ...p }));
    }

    // 2. Merge local guest items WITHOUT duplicates
    for (const localProduct of localWishlist as Product[]) {
      if (!localProduct || !localProduct.id) continue;
      if (!wishlistMap.has(localProduct.id)) {
        wishlistMap.set(localProduct.id, { ...localProduct });
      }
    }

    const mergedList = Array.from(wishlistMap.values());
    globalWishlistStore.set(targetUserId, mergedList);

    // 3. Persist all merged items to Supabase
    if (supabase && mergedList.length > 0) {
      try {
        const rowsToUpsert = mergedList.map((product) => ({
          user_id: targetUserId,
          product_id: product.id,
          product_data: product,
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('wishlist_items').upsert(rowsToUpsert, { onConflict: 'user_id,product_id' });
      } catch (err: any) {
        console.warn('[Wishlist API] Supabase bulk upsert failed:', err.message);
      }
    }

    return apiSuccess({ wishlist: mergedList }, 'Wishlist successfully merged and synchronized with database');
  } catch (error: any) {
    return apiError('Failed to merge wishlist', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clearAll = searchParams.get('all') === 'true';
    const userIdParam = searchParams.get('userId');
    const emailParam = searchParams.get('email');
    const targetUserId = resolveUserId(authResult.user, userIdParam, emailParam);

    if (!targetUserId) {
      return apiError('User ID or active login session required', ApiErrorCode.UNAUTHORIZED, 401);
    }

    // 1. Memory update
    if (clearAll) {
      globalWishlistStore.set(targetUserId, []);
    } else if (productId) {
      const current = globalWishlistStore.get(targetUserId) || [];
      globalWishlistStore.set(targetUserId, current.filter((p) => p.id !== productId));
    }

    // 2. Supabase delete
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        if (clearAll) {
          await supabase.from('wishlist_items').delete().eq('user_id', targetUserId);
        } else if (productId) {
          await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', targetUserId)
            .eq('product_id', productId);
        }
      } catch (err: any) {
        console.warn('[Wishlist API] Supabase delete error:', err.message);
      }
    }

    const updated = globalWishlistStore.get(targetUserId) || [];
    return apiSuccess({ wishlist: updated }, clearAll ? 'Wishlist cleared in database' : 'Item removed from database wishlist');
  } catch (error: any) {
    return apiError('Failed to delete wishlist item', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
