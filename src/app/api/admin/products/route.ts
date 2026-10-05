import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { Product } from '@/lib/products-data';
import { logActivity } from '@/lib/activity-logger';
import { addCustomProduct, updateCustomProduct, getAllMergedProducts } from '@/lib/products-store';

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
        // Also combine with any custom memory products not in db
        const dbIds = new Set(dbProducts.map((p) => p.id));
        const memoryMerged = getAllMergedProducts().filter((p) => !dbIds.has(p.id));
        return apiSuccess({ products: [...dbProducts, ...memoryMerged] }, 'Products retrieved from database');
      }
    }

    const products = getAllMergedProducts().map((p) => ({
      ...p,
      stock_quantity: p.stock,
      is_active: true,
    }));

    return apiSuccess({ products }, 'Products retrieved (catalog store)');
  } catch (error: any) {
    return apiError('Failed to fetch admin products', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.name || body.price === undefined) {
      return apiError('Product name and valid price are required', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const name = String(body.name).trim();
    const price = Number(body.price);
    const stock = Number(body.stock ?? 50);
    const category = String(body.category || 'smartphones');
    const categoryLabel = String(body.categoryLabel || category.charAt(0).toUpperCase() + category.slice(1));
    const image = String(body.image || '/assets/images/hero_gadgets.jpg');
    const description = String(body.description || `${name} — Engineered with uncompromised precision.`);
    const tagline = String(body.tagline || '');
    const badge = body.badge ? String(body.badge).trim() : undefined;
    const features = Array.isArray(body.features)
      ? body.features
      : typeof body.features === 'string'
      ? body.features.split(',').map((f: string) => f.trim()).filter(Boolean)
      : ['Precision Aerospace Architecture', '2-Year Concierge Warranty'];
    
    const sku = String(body.sku || `AETH-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    const id = body.id || `prod-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const specsObj: Record<string, string> = {};
    if (Array.isArray(body.specs)) {
      body.specs.forEach((s: any) => {
        if (s && s.key && s.value) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });
    } else if (body.specs && typeof body.specs === 'object') {
      Object.assign(specsObj, body.specs);
    }

    if (!specsObj['SKU']) specsObj['SKU'] = sku;

    const overview = String(body.overview || body.description || `${name} — An uncompromised exercise in architectural hardware.`);
    const materials = String(body.materials || 'Aerospace Grade 5 Titanium, Sandstone Ceramic & Sapphire Crystal.');
    const warranty = String(body.warranty || '2-Year Worldwide Concierge Warranty with full replacement coverage.');

    const newProduct: Product = {
      id,
      name,
      tagline,
      category: category as any,
      categoryLabel,
      price,
      stock,
      image,
      badge,
      description,
      features,
      rating: 5.0,
      reviewsCount: 0,
      overview,
      materials,
      warranty,
      specs: specsObj,
    };

    // 1. Insert into Supabase if connected
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const dbPayload = {
        id,
        sku,
        name,
        slug: id,
        tagline,
        category_id: category,
        category_label: categoryLabel,
        price,
        stock,
        image,
        badge,
        description,
        features,
        specifications: {
          ...specsObj,
          overview,
          materials,
          warranty,
        },
        rating: 5.0,
        reviews_count: 0,
        is_active: true,
        is_featured: Boolean(body.isFeatured),
      };

      const { data, error } = await supabase.from('products').insert(dbPayload).select().single();
      if (!error) {
        // Record in inventory ledger
        await supabase.from('inventory_ledger').insert({
          product_id: id,
          change_type: 'initial_stock',
          quantity_delta: stock,
          notes: `Initial stock registration: ${stock} units allocated for ${name} by ${authResult.user.name}`,
        });
      }
    }

    // 2. Always persist into shared customProducts store
    addCustomProduct(newProduct);

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.product_created',
      entityType: 'product',
      entityId: id,
      metadata: { name, price, stock, sku, image },
    });

    return apiSuccess({ product: newProduct }, 'New hardware stock registered and published to catalog');
  } catch (error: any) {
    console.error('Error creating product:', error);
    return apiError('Failed to create hardware product: ' + error.message, ApiErrorCode.INTERNAL_ERROR, 500);
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
    const image = body.image ? String(body.image) : undefined;
    const name = body.name ? String(body.name).trim() : undefined;
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
      if (newStock !== undefined) updateData.stock = newStock;
      if (newPrice !== undefined) updateData.price = newPrice;
      if (isActive !== undefined) updateData.is_active = isActive;
      if (image !== undefined) updateData.image = image;
      if (name !== undefined) updateData.name = name;

      const { data: updated, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (!error && updated) {
        // Record in inventory ledger
        if (newStock !== undefined) {
          await supabase.from('inventory_ledger').insert({
            product_id: productId,
            change_type: 'adjustment',
            quantity_delta: 0,
            notes: `${reason} by ${authResult.user.name} (Level: ${newStock})`,
          });
        }

        await logActivity({
          userId: authResult.user.id,
          action: 'admin.product_updated',
          entityType: 'product',
          entityId: productId,
          metadata: { newStock, newPrice, isActive },
        });

        // Sync with memory
        updateCustomProduct(productId, {
          ...(newStock !== undefined ? { stock: newStock } : {}),
          ...(newPrice !== undefined ? { price: newPrice } : {}),
          ...(image !== undefined ? { image } : {}),
          ...(name !== undefined ? { name } : {}),
        });

        return apiSuccess({ product: updated }, 'Product updated successfully in database');
      }
    }

    // In-memory fallback
    const updated = updateCustomProduct(productId, {
      ...(newStock !== undefined ? { stock: newStock } : {}),
      ...(newPrice !== undefined ? { price: newPrice } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(name !== undefined ? { name } : {}),
    });

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.product_updated_simulated',
      entityType: 'product',
      entityId: productId,
      metadata: { newStock, newPrice, reason },
    });

    return apiSuccess({ product: updated }, 'Product updated successfully in catalog');
  } catch (error: any) {
    return apiError('Failed to update product: ' + error.message, ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return apiError('Administrator credentials required to delete hardware', ApiErrorCode.FORBIDDEN, 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiError('Product ID is required', ApiErrorCode.BAD_REQUEST, 400);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    }

    // Also remove from customProducts if present or set stock to 0
    updateCustomProduct(id, { stock: 0 });

    await logActivity({
      userId: authResult.user.id,
      action: 'admin.product_deleted',
      entityType: 'product',
      entityId: id,
    });

    return apiSuccess({ id }, 'Hardware product deallocated from active catalog');
  } catch (error: any) {
    return apiError('Failed to delete product: ' + error.message, ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
