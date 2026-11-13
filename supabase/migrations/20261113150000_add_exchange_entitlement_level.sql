-- Add an explicit exchange entitlement level without changing existing financial data.
-- Existing rows receive Level 1 through the column default. Customers are not affected.
ALTER TABLE public.exchanges
  ADD COLUMN IF NOT EXISTS entitlement_level smallint NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.exchanges'::regclass
      AND conname = 'exchanges_entitlement_level_check'
  ) THEN
    ALTER TABLE public.exchanges
      ADD CONSTRAINT exchanges_entitlement_level_check
      CHECK (entitlement_level BETWEEN 1 AND 3);
  END IF;
END
$$;

-- Prevent exchange owners from self-upgrading by editing their own profile.
-- Only the existing application admin/creator authorization can grant Level 2 or 3.
CREATE OR REPLACE FUNCTION public.guard_exchange_entitlement_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF COALESCE(public.app_is_admin(), false) THEN
    IF NEW.entitlement_level IS NULL OR NEW.entitlement_level NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'Invalid entitlement level';
    END IF;
  ELSE
    IF TG_OP = 'INSERT' THEN
      NEW.entitlement_level := 1;
    ELSE
      NEW.entitlement_level := OLD.entitlement_level;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_exchange_entitlement_level ON public.exchanges;
CREATE TRIGGER trg_guard_exchange_entitlement_level
BEFORE INSERT OR UPDATE OF entitlement_level ON public.exchanges
FOR EACH ROW
EXECUTE FUNCTION public.guard_exchange_entitlement_level();

COMMENT ON COLUMN public.exchanges.entitlement_level IS
  'Subscription entitlement tier: 1=free, 2=professional, 3=enterprise. Existing accounts default to 1.';
