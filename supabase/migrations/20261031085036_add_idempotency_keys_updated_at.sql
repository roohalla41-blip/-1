-- The existing BEFORE UPDATE trigger writes NEW.updated_at.
-- Add the missing field without removing or rewriting existing idempotency rows.
ALTER TABLE public.idempotency_keys
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
