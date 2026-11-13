-- Close legacy email-verification RPCs that can mark an email as verified
-- without proving possession of the Supabase Auth OTP.
-- Current registration flow uses Supabase Auth OTP directly; these legacy
-- SECURITY DEFINER RPCs are not used by the active frontend.
REVOKE EXECUTE ON FUNCTION public.request_email_verification(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_email_verified(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_email_verification(text) FROM PUBLIC, anon, authenticated;

-- Retain server-only execution for controlled maintenance/compatibility.
GRANT EXECUTE ON FUNCTION public.request_email_verification(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_verified(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_email_verification(text) TO service_role;

-- Pin search_path on both SECURITY DEFINER functions.
ALTER FUNCTION public.request_email_verification(text, text, text)
  SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION public.mark_email_verified(text)
  SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION public.confirm_email_verification(text)
  SET search_path = pg_catalog, pg_temp;
