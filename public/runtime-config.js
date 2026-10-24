// PREVIEW-ONLY configuration. This branch must never use the real Supabase project.
// Demo mode is enabled for every visit so the preview URL works without query parameters.
window.__PREVIEW_MODE__ = true;
window.__SUPABASE_CONFIG__ = {
  url: "https://preview-only.invalid.supabase.co",
  key: "preview-only-not-a-real-anon-key"
};

try {
  localStorage.setItem('local_test_mode', 'true');
  localStorage.setItem('auth_token', 'local_token_preview_only');
  localStorage.setItem('auth_user', JSON.stringify({
    id: 'preview-user',
    name: 'کاربر نمایشی',
    full_name: 'کاربر نمایشی',
    role: 'sarraaf',
    status: 'active',
    exchange_code: 'PREVIEW',
    exchange_name: 'حساب صراف — پیش‌نمایش'
  }));
} catch (_) {
  // Storage may be unavailable in private browsing.
}
