-- PROPOSED — NOT APPLIED. Needs owner approval.
--
-- Evidence (read-only audit, 2026-11-14):
--   * public.mark_email_verified(p_email text) is SECURITY DEFINER, has no search_path, and
--     performs no authentication: any caller using only the public anon key can mark the newest
--     pending email_verification_requests row for ANY email as verified.
--   * public.confirm_email_verification(p_email text) is likewise callable by anon.
--   * src/ on release/restore-build contains no call to either function.
--
-- Precondition: confirm no live caller. In Supabase Logs (API Gateway) search for
--   /rest/v1/rpc/mark_email_verified and /rest/v1/rpc/confirm_email_verification over the last 30 days.
--   If registration (register_exchange / register_customer) calls them internally, that is
--   unaffected: SECURITY DEFINER functions run with the owner's rights, not the caller's EXECUTE.
--
-- Effect: closes the anonymous email-verification bypass. No table, row or column is touched.

BEGIN;
REVOKE EXECUTE ON FUNCTION public.mark_email_verified(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_email_verification(text) FROM PUBLIC, anon, authenticated;
COMMIT;

-- Rollback:
--   GRANT EXECUTE ON FUNCTION public.mark_email_verified(text) TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION public.confirm_email_verification(text) TO anon, authenticated;
