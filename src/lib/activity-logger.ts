import { getSupabaseServerClient } from './supabase';

export interface ActivityLogInput {
  userId?: string | null;
  sessionId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Records an audit/activity event into the Supabase activity_logs table.
 * Fails gracefully if database is not yet connected.
 */
export async function logActivity(input: ActivityLogInput) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.log(`[Activity Log (Local)] ${input.action}:`, input);
      return { success: true, simulated: true };
    }

    const { error } = await supabase.from('activity_logs').insert({
      user_id: input.userId || null,
      session_id: input.sessionId || null,
      action: input.action,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      metadata: input.metadata || {},
    });

    if (error) {
      console.warn('[Activity Log Insert Warning]', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Activity Log Exception]', err.message);
    return { success: false, error: err.message };
  }
}
