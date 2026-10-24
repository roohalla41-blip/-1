// Preview-only configuration on branch preview/restore-ui.
// Never point this preview at the real Supabase project.
window.__SUPABASE_CONFIG__ = {
  url: "https://preview-only.invalid.supabase.co",
  key: "preview-only-not-a-real-anon-key"
};

(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') !== '1') return;

  window.__PREVIEW_MODE__ = true;
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
})();