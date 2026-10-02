import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { INITIAL_PRODUCTS, Product } from '@/lib/products-data';
import { logActivity } from '@/lib/activity-logger';

// In-memory fallback product overrides
const productOverrides = new Map<string, Partial<Product>>();

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && dbProducts && dbProducts.length > 0) {
        return apiSuccess({ products: dbProducts }, 'Products retrieved from database');
      }
    }

    // Fallback store merging static INITIAL_PRODUCTS with in-memory overrides
    const products = INITIAL_PRODUCTS.map((p) => {
      const override = productOverrides.get(p.id);
      return {
        ...p,
        ...override,
        stock_quantity: override?.stock ?? p.stock,
        is_active: true,
      };
    });

    return apiSuccess({ products }, 'Products retrieved (store)');
  } catch (error: any) {
    return apiError('Failed to fetch admin products', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return apiError('Product ID is required', ApiErrorCode.BAD_REQUEST, 400);
    }

    const productId = String(body.id);
    const newStock = body.stock !== undefined ? Number(body.stock) : undefined;
    const newPrice = body.price !== undefined ? Number(body.price) : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : undefined;
    const reason = body.reason || 'Manual inventory adjustment';

    if (newStock !== undefined && (isNaN(newStock) || newStock < 0)) {
      return apiError('Stock quantity must be a non-negative number', ApiErrorCode.VALIDATION_ERROR, 422);
    }
    if (newPrice !== undefined && (isNaN(newPrice) || newPrice <= 0)) {
      return apiError('Price must be greater than zero', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (newStock !== undefined) updateData.stock_quantity = newStock;
      if (newPrice !== undefined) updateData.price = newPrice;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data: updated, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }

      // Record in inventory ledger if stock changed
      if (newStock !== undefined) {
        await supabase.from('inventory_ledger').insert({
          product_id: productId,
          change_type: 'adjustment',
          quantity_delta: 0, // absolute set
          notes: `${reason} by ${authResult.user.name} (New Level: ${newStock})`,
        });
      }

      await logActivity({
        userId: authResult.user.id,
        action: 'admin.product_updated',
        entityType: 'product',
        entityId: productId,
        metadata: { newStock, newPrice, isActive },
      });

      return apiSuccess({ product: updated }, 'Product updated successfully');
    }

    // In-memory fallback
    const existing = productOverrides.get(productId) || {};
    const updatedOverride = {
      ...existing,
      ...(newStock !== undefined ? { stock: newStock } : {}),
      ...(newPrice !== undefined ? { price: newPrice } : {}),
    };
    productOverrides.set(productId, updatedOverride);

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.product_updated_simulated',
      entityType: 'product',
      entityId: productId,
      metadata: { newStock, newPrice, reason },
    });

    const original = INITIAL_PRODUCTS.find((p) => p.id === productId);
    const merged = {
      ...original,
      ...updatedOverride,
      stock_quantity: updatedOverride.stock ?? original?.stock,
    };

    return apiSuccess({ product: merged }, 'Product updated successfully (store)');
  } catch (error: any) {
    return apiError('Failed to update product', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
