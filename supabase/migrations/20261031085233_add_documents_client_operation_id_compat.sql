-- Compatibility field for older clients that still send this optional column.
-- New clients use idempotency_keys through the atomic financial RPCs.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS client_operation_id text;

CREATE INDEX IF NOT EXISTS documents_exchange_operation_idx
  ON public.documents (exchange_code, client_operation_id)
  WHERE client_operation_id IS NOT NULL;
