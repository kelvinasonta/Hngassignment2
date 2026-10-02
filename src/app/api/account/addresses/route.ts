import { getSupabaseServerClient } from '@/lib/supabase';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// In-memory fallback addresses store for local dev
const fallbackAddressesStore = new Map<string, any[]>();

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to view addresses', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: addresses, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', authResult.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && addresses) {
        return apiSuccess({ addresses }, 'Addresses retrieved successfully');
      }
    }

    const userAddresses = fallbackAddressesStore.get(authResult.user.id) || [];
    return apiSuccess({ addresses: userAddresses }, 'Addresses retrieved from cache');
  } catch (error: any) {
    return apiError('Failed to fetch addresses', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`address-add:${clientIp}`, { maxRequests: 15, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return apiError('Too many address submissions. Please slow down.', ApiErrorCode.RATE_LIMITED, 429);
    }

    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required to add address', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Invalid request body', ApiErrorCode.BAD_REQUEST, 400);
    }

    const fullName = String(body.fullName || '').trim();
    const streetLine1 = String(body.streetLine1 || body.street_line_1 || '').trim();
    const streetLine2 = String(body.streetLine2 || body.street_line_2 || '').trim();
    const city = String(body.city || '').trim();
    const stateRegion = String(body.stateRegion || body.state_region || '').trim();
    const postalCode = String(body.postalCode || body.postal_code || '').trim();
    const countryCode = String(body.countryCode || body.country_code || 'US').trim();
    const phone = String(body.phone || '').trim();
    const isDefault = Boolean(body.isDefault || body.is_default);
    const addressType = body.addressType === 'billing' ? 'billing' : body.addressType === 'shipping' ? 'shipping' : 'both';

    if (!fullName || !streetLine1 || !city || !postalCode) {
      return apiError('Please provide full name, street, city, and postal code.', ApiErrorCode.VALIDATION_ERROR, 422);
    }

    const addressRecord = {
      id: crypto.randomUUID(),
      user_id: authResult.user.id,
      full_name: fullName,
      street_line_1: streetLine1,
      street_line_2: streetLine2 || null,
      city,
      state_region: stateRegion || null,
      postal_code: postalCode,
      country_code: countryCode,
      phone: phone || null,
      is_default: isDefault,
      address_type: addressType,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      if (isDefault) {
        // Demote other defaults
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', authResult.user.id);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert(addressRecord)
        .select()
        .single();

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }

      return apiSuccess({ address: data }, 'Address saved successfully', 201);
    }

    // Fallback store
    const existing = fallbackAddressesStore.get(authResult.user.id) || [];
    if (isDefault) {
      existing.forEach((a) => (a.is_default = false));
    }
    existing.unshift(addressRecord);
    fallbackAddressesStore.set(authResult.user.id, existing);

    return apiSuccess({ address: addressRecord }, 'Address saved successfully', 201);
  } catch (error: any) {
    return apiError('Failed to save address', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return apiError('Authentication required', ApiErrorCode.UNAUTHORIZED, 401);
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');
    if (!addressId) {
      return apiError('Address ID is required', ApiErrorCode.BAD_REQUEST, 400);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', authResult.user.id); // Secure ownership constraint

      if (error) {
        return apiError(error.message, ApiErrorCode.INTERNAL_ERROR, 500);
      }
    } else {
      const existing = fallbackAddressesStore.get(authResult.user.id) || [];
      const updated = existing.filter((a) => a.id !== addressId);
      fallbackAddressesStore.set(authResult.user.id, updated);
    }

    return apiSuccess({ deletedId: addressId }, 'Address removed successfully');
  } catch (error: any) {
    return apiError('Failed to remove address', ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
