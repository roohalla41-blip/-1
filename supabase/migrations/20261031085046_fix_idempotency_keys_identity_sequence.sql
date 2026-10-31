-- The identity sequence was behind existing idempotency rows.
-- Align it with the current maximum ID; this does not update or delete rows.
SELECT setval(
  'public.idempotency_keys_id_seq'::regclass,
  GREATEST(COALESCE((SELECT MAX(id) FROM public.idempotency_keys), 0), 1),
  true
);
