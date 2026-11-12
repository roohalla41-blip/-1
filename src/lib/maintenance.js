import { supabase } from './supabaseClient';

// Maintenance state is authoritative on the server. The browser only displays it.
export async function getMaintenanceStatus() {
  const { data, error } = await supabase.rpc('get_app_maintenance');
  if (error) throw error;
  return data || { enabled: false, until: null, message: '', server_now: null };
}

export async function setMaintenanceMode({ enabled, durationMinutes = null, message = '' }) {
  const { data, error } = await supabase.rpc('set_app_maintenance', {
    p_enabled: Boolean(enabled),
    p_duration_minutes: enabled ? Number(durationMinutes) : null,
    p_message: message,
  });
  if (error) throw error;
  if (!data || data.success === false) {
    throw new Error(data?.error || 'maintenance_update_failed');
  }
  return data;
}
