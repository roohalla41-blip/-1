-- RECORD ONLY: ALREADY APPLIED on production (tcivyztftnoodobsdxev) on 2026-11-13.
-- Version 20261113131648 exists in supabase_migrations.schema_migrations; it will not re-run.
-- Statements copied verbatim from that table so the repository matches the database.
-- Additive and data-safe: new columns default to true, so existing access is preserved.

alter table public.feature_settings
  add column if not exists level_1_enabled boolean not null default true,
  add column if not exists level_2_enabled boolean not null default true,
  add column if not exists level_3_enabled boolean not null default true;

comment on column public.feature_settings.level_1_enabled is
  'Controls visibility/access for Level 1 (free/basic) plan. Defaults true to preserve existing access.';
comment on column public.feature_settings.level_2_enabled is
  'Controls visibility/access for Level 2 (professional) plan. Defaults true to preserve existing access.';
comment on column public.feature_settings.level_3_enabled is
  'Controls visibility/access for Level 3 (enterprise) plan. Defaults true to preserve existing access.';
