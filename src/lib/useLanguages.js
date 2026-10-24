// useLanguages.js — Load languages directly from Supabase (no Base44)
// In isolated preview mode, use the built-in language list and never call Supabase.

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LANGUAGES } from '@/lib/i18n';

const CODE_TO_LANG_KEY = {
  fa: 'farsi',
  ps: 'pashto',
  uz: 'uzbek',
  en: 'english',
  ar: 'arabic',
  tr: 'turkish',
  dari: 'dari',
};

export function useLanguages() {
  const [languages, setLanguages] = useState(LANGUAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // The preview is intentionally isolated from the production Supabase project.
    // The language selector must work offline in this mode.
    if (typeof window !== 'undefined' && window.__PREVIEW_MODE__) {
      setLanguages(LANGUAGES);
      setLoading(false);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('code, name, native_name, direction, sort_order, is_active, flag_emoji')
          .eq('is_active', true)
          .order('sort_order')
          .limit(50);
        if (cancelled || error || !data || data.length === 0) return;
        const mapped = data.map((r) => ({
          code: CODE_TO_LANG_KEY[r.code] || r.code,
          name: r.native_name || r.name,
          flag: r.flag_emoji || '🌐',
          direction: r.direction || 'rtl',
        }));
        if (!cancelled && mapped.length > 0) setLanguages(mapped);
      } catch {
        // Fall back to the built-in language list.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { languages, loading };
}