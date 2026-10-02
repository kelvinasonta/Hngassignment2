import { getSupabaseServerClient } from '@/lib/supabase';
import { globalOrdersStore } from '@/lib/orders-store';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { logActivity } from '@/lib/activity-logger';
import { sendShippingUpdateEmail, sendStatusUpdateEmail } from '@/lib/mailgun';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const { id } = await params;
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_items(*), order_timeline(*)')
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (!error && order) {
        return apiSuccess({ order }, 'Order details retrieved');
      }
    }

    const fallbackOrder = globalOrdersStore.get(id);
    if (fallbackOrder) {
      return apiSuccess({ order: fallbackOrder }, 'Order details retrieved (store)');
    }

    return apiError('Order not found', ApiErrorCode.NOT_FOUND, 404);
  } catch (error: any) {
    return apiError('Failed to fetch order', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Invalid request payload', ApiErrorCode.BAD_REQUEST, 400);
    }

    const newStatus = body.status ? String(body.status).toLowerCase().trim() : undefined;
    const carrier = body.shippingCarrier ? String(body.shippingCarrier).trim() : undefined;
    const trackingNumber = body.trackingNumber ? String(body.trackingNumber).trim() : undefined;
    const notes = body.notes ? String(body.notes).trim() : undefined;

    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (newStatus && !validStatuses.includes(newStatus)) {
      return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const supabase = getSupabaseServerClient();
    const timelineEntry = {
      id: crypto.randomUUID(),
      title: newStatus ? `Status Updated to ${newStatus.toUpperCase()}` : 'Fulfillment Details Updated',
      description: notes || (carrier && trackingNumber ? `Dispatched via ${carrier} (Tracking: ${trackingNumber})` : `Order status adjusted by ${authResult.user.name}.`),
      status: newStatus || 'processing',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (newStatus) updateData.status = newStatus;
      if (carrier) updateData.shipping_carrier = carrier;
      if (trackingNumber) updateData.tracking_number = trackingNumber;

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updateData)
        .or(`id.eq.${id},order_number.eq.${id}`)
        .select('*, order_items(*), order_timeline(*)')
        .single();

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }

      // Add timeline entry
      await supabase.from('order_timeline').insert({
        order_id: updatedOrder.id,
        status: timelineEntry.status,
        title: timelineEntry.title,
        description: timelineEntry.description,
      });

      // Audit log
      await logActivity({
        userId: authResult.user.id,
        action: 'admin.order_updated',
        entityType: 'order',
        entityId: updatedOrder.id,
        metadata: { newStatus, carrier, trackingNumber },
      });

      // Send customer notification email
      if (updatedOrder.customer_email) {
        if (newStatus === 'shipped') {
          sendShippingUpdateEmail({
            to: updatedOrder.customer_email,
            customerName: updatedOrder.customer_name,
            orderNumber: updatedOrder.order_number,
            trackingNumber: trackingNumber || updatedOrder.tracking_number || 'TRK-AETHER-EXPRESS',
            carrier: carrier || updatedOrder.shipping_carrier || 'AETHER Express Logistics',
            estimatedDelivery: '2-3 Business Days',
          }).catch((e) => console.warn('[Shipping Email]', e.message));
        } else if (newStatus) {
          sendStatusUpdateEmail({
            to: updatedOrder.customer_email,
            customerName: updatedOrder.customer_name,
            orderNumber: updatedOrder.order_number,
            status: newStatus,
            notes: notes || `Order status updated to ${newStatus.toUpperCase()}`,
          }).catch((e) => console.warn('[Status Email]', e.message));
        }
      }

      return apiSuccess({ order: updatedOrder }, 'Order updated successfully');
    }

    // In-memory fallback
    const targetOrder = globalOrdersStore.get(id);
    if (!targetOrder) {
      return apiError('Order not found', ApiErrorCode.NOT_FOUND, 404);
    }

    if (newStatus) targetOrder.status = newStatus;
    if (carrier) targetOrder.shipping_carrier = carrier;
    if (trackingNumber) targetOrder.tracking_number = trackingNumber;
    targetOrder.updated_at = new Date().toISOString();

    if (!targetOrder.order_timeline) targetOrder.order_timeline = [];
    targetOrder.order_timeline.unshift(timelineEntry);

    globalOrdersStore.set(targetOrder.id, targetOrder);
    globalOrdersStore.set(targetOrder.order_number, targetOrder);

    // Audit log
    await logActivity({
      userId: authResult.user.id,
      action: 'admin.order_updated_simulated',
      entityType: 'order',
      entityId: targetOrder.id,
      metadata: { newStatus, carrier, trackingNumber },
    });

    return apiSuccess({ order: targetOrder }, 'Order updated successfully (store)');
  } catch (error: any) {
    return apiError('Failed to update order', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
