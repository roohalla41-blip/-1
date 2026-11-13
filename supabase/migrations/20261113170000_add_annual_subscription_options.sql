-- Convert the legacy monthly pricing rows into named annual subscription options.
-- Prices are derived from the existing monthly AFN prices; admins can edit them in the builder.
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS plan_key text;

UPDATE public.pricing_plans
SET plan_key = CASE
  WHEN name = 'پایه' THEN 'basic'
  WHEN name = 'حرفه‌ای' THEN 'pro'
  WHEN name = 'ویژه' THEN 'special'
  ELSE 'custom_' || id::text
END
WHERE plan_key IS NULL OR btrim(plan_key) = '';

ALTER TABLE public.pricing_plans
  ALTER COLUMN plan_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pricing_plans_plan_key_uidx
  ON public.pricing_plans (plan_key);

WITH base AS (
  SELECT id, plan_key, name, description, price, currency, features
  FROM public.pricing_plans
  WHERE plan_key IN ('pro', 'special')
),
durations(suffix, label, days, months, sort_order) AS (
  VALUES
    ('1y', '۱ ساله', 365, 12, 1),
    ('2y', '۲ ساله', 730, 24, 2),
    ('3y', '۳ ساله', 1095, 36, 3),
    ('5y', '۵ ساله', 1825, 60, 4)
)
INSERT INTO public.pricing_plans
  (plan_key, name, description, price, currency, duration_days, features, active, display_order)
SELECT
  base.plan_key || '_' || durations.suffix,
  base.name || ' · ' || durations.label,
  COALESCE(base.description, '') || ' · اشتراک ' || durations.label,
  base.price * durations.months,
  COALESCE(base.currency, 'AFN'),
  durations.days,
  base.features,
  true,
  base.id * 10 + durations.sort_order
FROM base
CROSS JOIN durations
ON CONFLICT (plan_key) DO NOTHING;

-- Keep old 30-day choices in the database for historical reference, but hide them from new purchases.
UPDATE public.pricing_plans
SET active = false, updated_at = now()
WHERE plan_key IN ('basic', 'pro', 'special')
  AND duration_days <= 31;
