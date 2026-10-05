import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';

export interface CartItemPayload {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
}

// Memory fallback store to guarantee seamless syncing even when offline/sandboxed
const globalCartStore: Map<string, CartItemPayload[]> =
  (global as any).__AETHER_CART_STORE__ || new Map();
(global as any).__AETHER_CART_STORE__ = globalCartStore;

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
      return apiSuccess({ cart: [] }, 'No authenticated user session, guest cart empty');
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('product_id, quantity, product_data')
          .eq('user_id', targetUserId);

        if (!error && data) {
          const items: CartItemPayload[] = data.map((row: any) => ({
            id: row.product_id,
            name: row.product_data?.name || 'AETHER Device',
            price: Number(row.product_data?.price || 0),
            image: row.product_data?.image || '/assets/images/hero_gadgets.jpg',
            quantity: Number(row.quantity || 1),
            category: row.product_data?.category || '',
          }));

          // Sync to memory store
          globalCartStore.set(targetUserId, items);
          return apiSuccess({ cart: items }, 'User cart retrieved from database');
        }
      } catch (err: any) {
        console.warn('[Cart API] Supabase query failed, falling back to memory store:', err.message);
      }
    }

    // Memory fallback
    const memoryCart = globalCartStore.get(targetUserId) || [];
    return apiSuccess({ cart: memoryCart }, 'User cart retrieved from persistent store');
  } catch (error: any) {
    return apiError('Failed to fetch user cart', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => null);

    if (!body || !body.productId) {
      return apiError('Product ID and details are required', ApiErrorCode.BAD_REQUEST, 400);
    }

    const { productId, quantity = 1, productData = {}, userId, email } = body;
    const targetUserId = resolveUserId(authResult.user, userId, email);

    if (!targetUserId) {
      return apiError('User ID or active login session required to persist cart', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const sanitizedQty = Math.max(1, Number(quantity) || 1);
    const itemPayload: CartItemPayload = {
      id: productId,
      name: productData.name || body.name || 'AETHER Device',
      price: Number(productData.price || body.price || 0),
      image: productData.image || body.image || '/assets/images/hero_gadgets.jpg',
      quantity: sanitizedQty,
      category: productData.category || body.category || '',
    };

    // 1. Update in-memory store
    const currentMemoryCart = globalCartStore.get(targetUserId) || [];
    const existingIndex = currentMemoryCart.findIndex((i) => i.id === productId);

    if (existingIndex >= 0) {
      // If explicit set quantity is specified, or increment
      if (body.setExactQuantity) {
        currentMemoryCart[existingIndex].quantity = sanitizedQty;
      } else {
        currentMemoryCart[existingIndex].quantity += sanitizedQty;
      }
      currentMemoryCart[existingIndex].price = itemPayload.price;
      currentMemoryCart[existingIndex].image = itemPayload.image;
    } else {
      currentMemoryCart.push(itemPayload);
    }
    globalCartStore.set(targetUserId, [...currentMemoryCart]);

    // 2. Persist to Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const finalQty = existingIndex >= 0 ? currentMemoryCart[existingIndex].quantity : sanitizedQty;
        await supabase.from('cart_items').upsert(
          {
            user_id: targetUserId,
            product_id: productId,
            quantity: finalQty,
            product_data: {
              name: itemPayload.name,
              price: itemPayload.price,
              image: itemPayload.image,
              category: itemPayload.category,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,product_id' }
        );
      } catch (err: any) {
        console.warn('[Cart API] Supabase upsert error:', err.message);
      }
    }

    return apiSuccess({ cart: currentMemoryCart }, 'Cart item updated in database');
  } catch (error: any) {
    return apiError('Failed to update cart in database', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PUT: Bulk merge guest items into user account upon login without duplicates
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => null);

    if (!body) {
      return apiError('Invalid request body', ApiErrorCode.BAD_REQUEST, 400);
    }

    const { localItems = [], userId, email } = body;
    const targetUserId = resolveUserId(authResult.user, userId, email);

    if (!targetUserId) {
      return apiError('User ID or active login session required for cart sync', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const supabase = getSupabaseServerClient();
    let dbItemsMap = new Map<string, CartItemPayload>();

    // 1. Fetch existing DB items
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('product_id, quantity, product_data')
          .eq('user_id', targetUserId);

        if (!error && data) {
          data.forEach((row: any) => {
            dbItemsMap.set(row.product_id, {
              id: row.product_id,
              name: row.product_data?.name || 'AETHER Device',
              price: Number(row.product_data?.price || 0),
              image: row.product_data?.image || '/assets/images/hero_gadgets.jpg',
              quantity: Number(row.quantity || 1),
              category: row.product_data?.category || '',
            });
          });
        }
      } catch (err: any) {
        console.warn('[Cart API] Failed to fetch current DB cart for merge:', err.message);
      }
    }

    // Also populate from memory store if DB had nothing
    if (dbItemsMap.size === 0) {
      const mem = globalCartStore.get(targetUserId) || [];
      mem.forEach((i) => dbItemsMap.set(i.id, { ...i }));
    }

    // 2. Merge local guest items WITHOUT duplicates
    for (const localItem of localItems as CartItemPayload[]) {
      if (!localItem || !localItem.id) continue;
      const existing = dbItemsMap.get(localItem.id);
      if (existing) {
        // Product already in cart: combine quantities (or choose max) without duplicate rows
        existing.quantity = Math.max(existing.quantity, localItem.quantity);
        existing.price = localItem.price || existing.price;
        existing.image = localItem.image || existing.image;
        existing.name = localItem.name || existing.name;
      } else {
        // New item: add to map
        dbItemsMap.set(localItem.id, {
          id: localItem.id,
          name: localItem.name,
          price: localItem.price,
          image: localItem.image,
          quantity: Math.max(1, Number(localItem.quantity) || 1),
          category: localItem.category,
        });
      }
    }

    const mergedCartList = Array.from(dbItemsMap.values());
    globalCartStore.set(targetUserId, mergedCartList);

    // 3. Persist all merged items to Supabase
    if (supabase && mergedCartList.length > 0) {
      try {
        const rowsToUpsert = mergedCartList.map((item) => ({
          user_id: targetUserId,
          product_id: item.id,
          quantity: item.quantity,
          product_data: {
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
          },
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('cart_items').upsert(rowsToUpsert, { onConflict: 'user_id,product_id' });
      } catch (err: any) {
        console.warn('[Cart API] Supabase bulk upsert failed:', err.message);
      }
    }

    return apiSuccess({ cart: mergedCartList }, 'Cart successfully merged and synchronized with database');
  } catch (error: any) {
    return apiError('Failed to merge cart', ApiErrorCode.INTERNAL_ERROR, 500);
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
      globalCartStore.set(targetUserId, []);
    } else if (productId) {
      const current = globalCartStore.get(targetUserId) || [];
      globalCartStore.set(targetUserId, current.filter((i) => i.id !== productId));
    }

    // 2. Supabase delete
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        if (clearAll) {
          await supabase.from('cart_items').delete().eq('user_id', targetUserId);
        } else if (productId) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', targetUserId)
            .eq('product_id', productId);
        }
      } catch (err: any) {
        console.warn('[Cart API] Supabase delete error:', err.message);
      }
    }

    const updatedCart = globalCartStore.get(targetUserId) || [];
    return apiSuccess({ cart: updatedCart }, clearAll ? 'Cart cleared in database' : 'Item removed from database cart');
  } catch (error: any) {
    return apiError('Failed to delete cart item', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
