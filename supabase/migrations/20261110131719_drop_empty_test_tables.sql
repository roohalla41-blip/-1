-- RECORD ONLY: ALREADY APPLIED on production (tcivyztftnoodobsdxev) on 2026-11-10.
-- Version 20261110131719 exists in supabase_migrations.schema_migrations; it will not re-run.
-- Statements copied verbatim from that table so the repository matches the database.
-- NOTE for reviewers: this was a DROP on production. It used RESTRICT and targeted two
-- test tables (test123, safe_test_2). The audit found no remaining references to them.

DROP TABLE IF EXISTS public.test123 RESTRICT;
DROP TABLE IF EXISTS public.safe_test_2 RESTRICT;
