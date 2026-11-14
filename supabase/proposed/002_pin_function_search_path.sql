-- PROPOSED — NOT APPLIED. Needs owner approval; test on a Supabase branch first.
--
-- Evidence: Supabase security advisor "function_search_path_mutable" lists 28 public functions
-- without a fixed search_path (count: 28 on 2026-11-14). The newer app_* RPCs already use
-- SET search_path TO 'public', 'extensions'; these older ones do not.
--
-- This changes only a function-level setting. It does not alter function bodies, tables or data.
-- It matches the search_path already used by the hardened functions, so pgcrypto helpers in the
-- `extensions` schema keep resolving.
--
-- Precondition: apply on a branch and smoke-test document create/edit/reverse, transfer numbering,
-- ledger balance validation, wallet touch trigger and email-verification request flows.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'app_norm_ident','app_uid','get_next_doc_number','get_next_transfer_number',
        'update_updated_at','reverse_document_transaction','edit_document_transaction',
        'get_account_balance','request_email_verification','mark_email_verified',
        'confirm_email_verification','auto_doc_number','auto_transfer_number',
        'auto_exchange_code','auto_order_number','auto_ticket_number',
        'validate_ledger_balance','enrich_audit_log','validate_idempotency_key',
        'update_group_member_count','touch_wallet_on_transaction','app_ec',
        'set_updated_at','app_is_admin','app_b64url','app_unb64url',
        'app_guard_users','app_guard_exchanges'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', r.sig);
  END LOOP;
END $$;

-- Rollback (per function): ALTER FUNCTION <signature> RESET search_path;
