// PREVIEW-ONLY configuration. Never point this branch at the production database.
window.__PREVIEW_MODE__ = true;
window.__SUPABASE_CONFIG__ = {
  url: "https://preview-only.invalid.supabase.co",
  key: "preview-only-not-a-real-anon-key"
};

// Do not impersonate the creator or manufacture an authenticated session.
// The preview intentionally opens the real application's login route.
try {
  localStorage.setItem('local_test_mode', 'false');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('supabase_auth_session');
} catch (_) {
  // Storage may be unavailable in private browsing.
}
