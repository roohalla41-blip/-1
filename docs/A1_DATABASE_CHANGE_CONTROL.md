# A1 database change-control baseline

Date: 2026-11-11  
Repository branch: `preview/restore-ui`  
Supabase project: A1 production project `tcivyztftnoodobsdxev`

## Safety boundary

- This document records metadata only; no customer names, balances, transaction details, credentials, or secrets are included.
- The A1 database was inspected read-only. No schema, row, policy, function, or authentication changes were applied.
- The preview branch currently ships `public/runtime-config.js` with a deliberately invalid Supabase URL and preview-only local user. Keep this isolation until a separately reviewed read-only integration is explicitly configured.
- Never run financial mutations from the preview against A1.
- Production code, production branch, and public deployment remain outside this work.

## Current schema inventory (public schema)

The read-only table inventory reports RLS enabled on every listed table. Important existing accounting tables include:

- `customers` (56 rows), `documents` (42), `ledger_entries` (88), `transfers` (8)
- `exchanges` (39), `users` (58)
- `safes` (9), `bank_accounts` (2), `bank_transactions` (0), `treasury_transactions` (0)
- `journal_entries` (0), `conversions` (0)
- `audit_logs` (735), `idempotency_keys` (33)
- Existing customer/wallet/service tables include `wallets`, `wallet_transactions`, `customer_links`, `customer_notifications`, `customer_transfer_requests`, `online_products`, `charge_orders`, and `recharge_orders`.

The complete table names and structural metadata were retrieved from Supabase in read-only mode. Row counts are a point-in-time inventory, not a reconciliation or proof of financial correctness.

## Recorded migration history

- `20261026180856` secure_config_policies_and_financial_views
- `20261031085012` add_post_transfer_transaction_v2
- `20261031085036` add_idempotency_keys_updated_at
- `20261031085044` scope_idempotency_and_secure_financial_rpcs
- `20261031085046` fix_idempotency_keys_identity_sequence
- `20261031085233` add_documents_client_operation_id_compat
- `20261031085648` create_missing_active_application_entities
- `20261031085652` tighten_missing_entity_tenant_policies
- `20261031085905` consolidate_new_entity_rls_policies
- `20261110131719` drop_empty_test_tables

## Required process for every future A1 migration

1. Map the requested feature to current tables, columns, foreign keys, RPCs, indexes, triggers, and RLS policies.
2. Prefer additive, backward-compatible changes. Do not drop, rename, truncate, rewrite, or repurpose existing financial data.
3. Check existing rows and constraints before adding NOT NULL, UNIQUE, or foreign-key constraints. Backfill only with a documented, deterministic, reviewed rule.
4. Prepare a migration file and a separate verification query set. Review transactionality, lock duration, index strategy, tenant isolation, and idempotency.
5. Confirm a current recoverable backup and a tested restore route before production execution.
6. Obtain explicit approval for the exact migration and its expected effects before applying it to A1.
7. After execution, verify schema, RLS, record counts, foreign-key integrity, journal balance invariants, and key financial aggregates without exposing personal records.
8. Keep a rollback/forward-fix plan. A schema rollback must never delete or overwrite user transactions.

## Current status

This is an audit baseline and change-control record only. It does not authorize or execute any production database migration.
