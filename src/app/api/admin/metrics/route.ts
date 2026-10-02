import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { INITIAL_PRODUCTS } from '@/lib/products-data';

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      // Query orders aggregate
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, total, status, payment_status, created_at')
        .order('created_at', { ascending: false });

      // Query products for inventory stats
      const { data: products } = await supabase
        .from('products')
        .select('id, name, stock_quantity, price, category_label, is_active');

      if (!ordersErr && orders) {
        const totalGmv = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;
        const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

        const prodList = products || [];
        const lowStockProducts = prodList.filter((p) => (p.stock_quantity ?? 0) <= 5);

        return apiSuccess({
          metrics: {
            totalGmv,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            averageOrderValue: totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0,
            lowStockCount: lowStockProducts.length,
          },
          recentOrders: orders.slice(0, 6),
          lowStockProducts: lowStockProducts.slice(0, 5),
        }, 'Admin metrics calculated from database');
      }
    }

    // High-fidelity fallback metrics for development / demo mode
    const fallbackOrders = [
      {
        id: 'ord-seed-01',
        order_number: 'AETH-948210',
        customer_name: 'Alex Vance',
        customer_email: 'alex.vance@gmail.com',
        total: 1249,
        status: 'processing',
        payment_status: 'paid',
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'ord-seed-02',
        order_number: 'AETH-837192',
        customer_name: 'Elena Rostova',
        customer_email: 'elena.rostova@acoustics.io',
        total: 899,
        status: 'shipped',
        payment_status: 'paid',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: 'ord-seed-03',
        order_number: 'AETH-716490',
        customer_name: 'Marcus Sterling',
        customer_email: 'm.sterling@capital.com',
        total: 2499,
        status: 'delivered',
        payment_status: 'paid',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: 'ord-seed-04',
        order_number: 'AETH-609124',
        customer_name: 'Dr. Hiroshi Tanaka',
        customer_email: 'tanaka@lab-tokyo.ac.jp',
        total: 1499,
        status: 'confirmed',
        payment_status: 'paid',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      },
    ];

    const lowStockFallback = INITIAL_PRODUCTS.filter((p) => p.stock <= 5).map((p) => ({
      id: p.id,
      name: p.name,
      stock_quantity: p.stock,
      price: p.price,
      category_label: p.categoryLabel || p.category,
      is_active: true,
    }));

    const totalGmv = fallbackOrders.reduce((sum, o) => sum + o.total, 0) + 18450;
    const totalOrders = fallbackOrders.length + 18;

    return apiSuccess({
      metrics: {
        totalGmv,
        totalOrders,
        pendingOrders: 3,
        deliveredOrders: 16,
        averageOrderValue: Math.round(totalGmv / totalOrders),
        lowStockCount: lowStockFallback.length,
      },
      recentOrders: fallbackOrders,
      lowStockProducts: lowStockFallback,
    }, 'Admin metrics calculated (simulated fallback)');
  } catch (error: any) {
    return apiError('Failed to fetch admin metrics', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
