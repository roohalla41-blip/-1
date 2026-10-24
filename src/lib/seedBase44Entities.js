// Seeds default currencies directly via Supabase in normal app builds.
// In the isolated UI preview, never make backend requests or write any data.

import { supabase } from './supabaseClient';
import { DEFAULT_CURRENCIES } from './defaultCurrencies';

const SEED_KEY = 'supabase_currencies_seeded_v1';

export async function seedBase44Entities() {
  if (typeof window !== 'undefined' && window.__PREVIEW_MODE__) return;
  if (localStorage.getItem(SEED_KEY)) return;

  const token = localStorage.getItem('auth_token');
  if (!token) return;

  try {
    const { data, error } = await supabase
      .from('rates')
      .select('id')
      .limit(1);

    if (error) return;

    if (data && data.length > 0) {
      localStorage.setItem(SEED_KEY, '1');
      return;
    }

    const { error: insertError } = await supabase
      .from('rates')
      .insert(DEFAULT_CURRENCIES);

    if (!insertError) {
      localStorage.setItem(SEED_KEY, '1');
    }
  } catch {
    // ignore — will retry on next load
  }
}