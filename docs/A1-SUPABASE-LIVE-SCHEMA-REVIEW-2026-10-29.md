# A1 Supabase live schema metadata review — 2026-10-29

**Scope:** Read-only metadata inspection of the A1 Supabase project `tcivyztftnoodobsdxev` (region `eu-west-1`). No row contents were queried, exported, or changed. No SQL, migrations, or RLS policies were applied.

## Confirmed public tables and RLS status

The connected Supabase metadata tool returned 53 public tables. RLS is enabled on 51 tables. RLS is disabled on the following two empty test-named tables:

- `public.test123` — RLS disabled; reported row count 0.
- `public.safe_test_2` — RLS disabled; reported row count 0.

The tool classifies disabled RLS on public tables as critical because anon/authenticated client roles may be able to access rows. Although these two tables currently report zero rows, do not assume they are harmless or auto-enable RLS without checking intended access and policies.

Suggested SQL for an authorized operator to review — **not executed**:

```sql
ALTER TABLE public.test123 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_test_2 ENABLE ROW LEVEL SECURITY;
```

Enabling RLS without suitable policies can block legitimate access. Review whether these test tables are needed, then define appropriate policies or remove them only through an approved change process.

## Table inventory

`test123`, `support_tickets`, `support_messages`, `error_reports`, `user_feedback`, `safe_test_2`, `safes`, `users`, `exchanges`, `customers`, `documents`, `transfers`, `conversions`, `treasury_transactions`, `bank_accounts`, `bank_transactions`, `journal_entries`, `ledger_entries`, `rates`, `employees`, `origins`, `rules`, `feature_settings`, `app_settings`, `audit_logs`, `wallet_transactions`, `charge_orders`, `online_requests`, `idempotency_keys`, `wallets`, `customer_notifications`, `customer_transfer_requests`, `customer_links`, `online_products`, `sellers`, `packages`, `pricing_plans`, `chat_groups`, `chat_group_members`, `chat_messages`, `message_reports`, `email_otps`, `bank_gateways`, `payment_transactions`, `referrals`, `wallet_withdrawal_requests`, `languages`, `email_verification_requests`, `user_permissions`, `plan_quotas`, `builder_access`, `manual_verification_requests`, `app_auth_secret`.

## Sensitive-schema items requiring a separate security review

- `public.users` and `public.exchanges` have columns named `password`. This inspection did not read their values; verify that credentials are never stored or returned in plaintext and that legacy authentication does not expose them.
- `public.app_auth_secret` has a `secret` column. Its value was not read or exported. Restrict access tightly and never include it in a backup ZIP, PDF, browser response, or user report.
- The schema includes financial and ledger-related tables. A user-specific PDF must use a trusted server-side action with verified identity, role checks, strict account ownership/tenant scope, and a read-only query path. Client-side filtering is not sufficient.

## Important limitation

This is a live **schema metadata inventory**, not a complete restorable database backup. It does not include table data, function definitions, triggers, grants, storage objects, auth users, or a complete RLS-policy export. Do not treat it as sufficient for disaster recovery.
