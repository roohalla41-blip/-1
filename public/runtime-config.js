// PREVIEW-ONLY configuration. The public anon key is used only to invoke the
// creator-login Edge Function. Direct database, auth, and storage APIs are blocked
// by the preview fetch barrier; never point this branch at live data APIs.
window.__PREVIEW_MODE__ = true;
window.__SUPABASE_CONFIG__ = {
  url: "https://tcivyztftnoodobsdxev.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaXZ5enRmdG5vb2RvYnNkeGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjIxMzgsImV4cCI6MjEwMTQzODEzOH0.eRpGnZpXil0IwyO8R7g9Dzu7aJp6AN5yKaOU-5gV34s"
};

// Clear stale browser state once per preview origin, not on every page load.
try {
  if (localStorage.getItem('preview_initialized') !== '1') {
    localStorage.setItem('local_test_mode', 'false');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('supabase_auth_session');
    localStorage.setItem('preview_initialized', '1');
  }
} catch (_) {
  // Storage may be unavailable in private browsing.
}
