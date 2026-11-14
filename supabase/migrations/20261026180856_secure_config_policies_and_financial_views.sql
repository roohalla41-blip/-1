-- RECORD ONLY: this migration is ALREADY APPLIED on production (tcivyztftnoodobsdxev).
-- Version 20261026180856 exists in supabase_migrations.schema_migrations; it will not re-run.
-- Statements below are copied verbatim from that table so the repository matches the database.

BEGIN;

-- Replace globally permissive write policies with administrator or tenant-scoped access.
DROP POLICY IF EXISTS app_settings_write_all ON public.app_settings;
CREATE POLICY app_settings_admin_write
  ON public.app_settings
  FOR ALL TO anon, authenticated
  USING (public.app_is_admin())
  WITH CHECK (public.app_is_admin());
CREATE POLICY app_settings_tenant_write
  ON public.app_settings
  FOR ALL TO anon, authenticated
  USING (exchange_code IS NOT NULL AND exchange_code = public.app_ec())
  WITH CHECK (exchange_code IS NOT NULL AND exchange_code = public.app_ec());

DROP POLICY IF EXISTS feature_settings_write_all ON public.feature_settings;
CREATE POLICY feature_settings_admin_write
  ON public.feature_settings
  FOR ALL TO anon, authenticated
  USING (public.app_is_admin())
  WITH CHECK (public.app_is_admin());
CREATE POLICY feature_settings_tenant_write
  ON public.feature_settings
  FOR ALL TO anon, authenticated
  USING (exchange_code IS NOT NULL AND exchange_code = public.app_ec())
  WITH CHECK (exchange_code IS NOT NULL AND exchange_code = public.app_ec());

-- These older Supabase-auth-only policies allowed any authenticated role to mutate language rows.
-- The app's token-based admin policy remains the authoritative write path.
DROP POLICY IF EXISTS admin_delete_languages ON public.languages;
DROP POLICY IF EXISTS admin_insert_languages ON public.languages;
DROP POLICY IF EXISTS admin_update_languages ON public.languages;

-- Make financial/transaction views respect base-table RLS for the caller.
ALTER VIEW public.v_customer_balances SET (security_invoker = true);
ALTER VIEW public.v_treasury_balances SET (security_invoker = true);
ALTER VIEW public.v_bank_balances SET (security_invoker = true);
ALTER VIEW public.v_wallet_balances SET (security_invoker = true);
ALTER VIEW public.v_agent_balances SET (security_invoker = true);
ALTER VIEW public.v_profit_loss SET (security_invoker = true);
ALTER VIEW public.v_exchange_summary SET (security_invoker = true);
ALTER VIEW public.v_currency_balances SET (security_invoker = true);
ALTER VIEW public.v_transactions SET (security_invoker = true);

-- Views are reporting surfaces; clients should not receive mutation grants on them.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.v_customer_balances, public.v_treasury_balances, public.v_bank_balances,
            public.v_wallet_balances, public.v_agent_balances, public.v_profit_loss,
            public.v_exchange_summary, public.v_currency_balances, public.v_transactions
  FROM anon, authenticated;
GRANT SELECT
  ON TABLE public.v_customer_balances, public.v_treasury_balances, public.v_bank_balances,
            public.v_wallet_balances, public.v_agent_balances, public.v_profit_loss,
            public.v_exchange_summary, public.v_currency_balances, public.v_transactions
  TO anon, authenticated;

COMMIT;
