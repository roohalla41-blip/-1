-- Tenant-scope idempotency records without changing or deleting existing rows.
ALTER TABLE public.idempotency_keys
  ADD COLUMN IF NOT EXISTS exchange_code text;

CREATE INDEX IF NOT EXISTS idempotency_keys_exchange_code_idx
  ON public.idempotency_keys (exchange_code);

-- Preserve retry protection for existing operations by deriving tenant scope
-- from the already-linked document/transfer result rows.
UPDATE public.idempotency_keys ik
SET exchange_code = d.exchange_code
FROM public.documents d
WHERE ik.exchange_code IS NULL
  AND ik.table_name = 'documents'
  AND ik.result_id = d.id;

UPDATE public.idempotency_keys ik
SET exchange_code = t.exchange_code
FROM public.transfers t
WHERE ik.exchange_code IS NULL
  AND ik.table_name = 'transfers'
  AND ik.result_id = t.id;

DROP POLICY IF EXISTS app_tenant_all ON public.idempotency_keys;
CREATE POLICY app_tenant_all
  ON public.idempotency_keys
  FOR ALL
  USING (exchange_code IS NOT NULL AND exchange_code = (SELECT public.app_ec()))
  WITH CHECK (exchange_code = (SELECT public.app_ec()));

-- Keep the existing RPC signature so already-installed clients remain compatible.
CREATE OR REPLACE FUNCTION public.post_document_transaction(
  p_exchange_code text,
  p_doc_type text,
  p_currency text,
  p_amount numeric,
  p_fee numeric,
  p_related_type text,
  p_related_id bigint,
  p_related_name text,
  p_description text,
  p_registered_by text,
  p_lines jsonb,
  p_transfer_id bigint DEFAULT NULL,
  p_user_id bigint DEFAULT NULL,
  p_client_operation_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_doc_id bigint;
  v_doc_number text;
  v_line record;
  v_line_id bigint;
  v_existing_result_id bigint;
BEGIN
  IF p_exchange_code IS NULL OR
     (NOT public.app_is_admin() AND p_exchange_code IS DISTINCT FROM public.app_ec()) THEN
    RAISE EXCEPTION 'invalid_exchange_scope';
  END IF;

  IF p_client_operation_id IS NOT NULL THEN
    SELECT result_id INTO v_existing_result_id
    FROM public.idempotency_keys
    WHERE client_operation_id = p_client_operation_id
      AND exchange_code = p_exchange_code
    LIMIT 1;

    IF v_existing_result_id IS NOT NULL AND v_existing_result_id > 0 THEN
      RETURN json_build_object('document_id', v_existing_result_id, 'idempotent', true);
    END IF;
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'no_lines_provided';
  END IF;

  v_doc_number := public.get_next_doc_number(p_exchange_code);

  INSERT INTO public.documents (
    doc_number, exchange_code, doc_type, amount, currency, fee,
    related_type, related_id, related_name, description,
    registered_by, registered_by_user_id
  ) VALUES (
    v_doc_number, p_exchange_code, p_doc_type, p_amount, p_currency, p_fee,
    COALESCE(p_related_type, 'none'), p_related_id, p_related_name, p_description,
    p_registered_by, p_user_id
  )
  RETURNING id INTO v_doc_id;

  FOR v_line IN
    SELECT
      row->>'account_type' AS account_type,
      row->>'account_id' AS account_id,
      row->>'account_name' AS account_name,
      row->>'currency' AS currency,
      (row->>'debit')::numeric AS debit,
      (row->>'credit')::numeric AS credit,
      (row->>'rate')::numeric AS rate,
      (row->>'pair_entry_id')::bigint AS pair_entry_id,
      row->>'description' AS description,
      (row->>'line_no')::integer AS line_no
    FROM jsonb_array_elements(p_lines) AS t(row)
  LOOP
    INSERT INTO public.ledger_entries (
      exchange_code, document_id, transfer_id,
      account_type, account_id, account_name,
      currency, debit, credit, rate, pair_entry_id,
      description, doc_line_no, registered_by, registered_by_user_id
    ) VALUES (
      p_exchange_code, v_doc_id, p_transfer_id,
      v_line.account_type, v_line.account_id, v_line.account_name,
      v_line.currency, COALESCE(v_line.debit, 0), COALESCE(v_line.credit, 0),
      v_line.rate, v_line.pair_entry_id, v_line.description, v_line.line_no,
      p_registered_by, p_user_id
    );
  END LOOP;

  IF p_transfer_id IS NOT NULL THEN
    UPDATE public.transfers
    SET status = CASE WHEN p_doc_type = 'transfer' THEN 'done' ELSE status END,
        updated_at = NOW()
    WHERE id = p_transfer_id AND exchange_code = p_exchange_code;
  END IF;

  IF p_client_operation_id IS NOT NULL THEN
    INSERT INTO public.idempotency_keys (
      client_operation_id, table_name, result_id, exchange_code
    ) VALUES (
      p_client_operation_id, 'documents', v_doc_id, p_exchange_code
    )
    ON CONFLICT (client_operation_id) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'document_id', v_doc_id,
    'doc_number', v_doc_number,
    'idempotent', false
  );
END;
$function$;

-- Keep the existing transfer RPC signature compatible with older clients.
CREATE OR REPLACE FUNCTION public.post_transfer_transaction(
  p_exchange_code text,
  p_direction text,
  p_sender_name text,
  p_sender_phone text,
  p_receiver_name text,
  p_receiver_phone text,
  p_destination text,
  p_origin text,
  p_amount numeric,
  p_currency text,
  p_rate numeric DEFAULT NULL,
  p_fee numeric DEFAULT 0,
  p_fee_currency text DEFAULT NULL,
  p_description text DEFAULT '',
  p_registered_by text DEFAULT '',
  p_doc_type text DEFAULT 'transfer',
  p_user_id bigint DEFAULT NULL,
  p_client_operation_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_transfer_id bigint;
  v_transfer_number text;
  v_doc_id bigint;
  v_doc_number text;
  v_existing_result_id bigint;
  v_lines jsonb;
BEGIN
  IF p_exchange_code IS NULL OR
     (NOT public.app_is_admin() AND p_exchange_code IS DISTINCT FROM public.app_ec()) THEN
    RAISE EXCEPTION 'invalid_exchange_scope';
  END IF;

  IF p_client_operation_id IS NOT NULL THEN
    SELECT result_id INTO v_existing_result_id
    FROM public.idempotency_keys
    WHERE client_operation_id = p_client_operation_id
      AND exchange_code = p_exchange_code
    LIMIT 1;

    IF v_existing_result_id IS NOT NULL AND v_existing_result_id > 0 THEN
      RETURN json_build_object('transfer_id', v_existing_result_id, 'idempotent', true);
    END IF;
  END IF;

  v_transfer_number := public.get_next_transfer_number(p_exchange_code);

  INSERT INTO public.transfers (
    exchange_code, transfer_number, sender_name, sender_phone, sender_country,
    receiver_name, receiver_phone, receiver_country, account_owner,
    amount, currency, origin, direction, destination, status,
    registered_by, registered_by_user_id
  ) VALUES (
    p_exchange_code, v_transfer_number, p_sender_name, p_sender_phone, NULL,
    p_receiver_name, p_receiver_phone, p_destination, NULL,
    p_amount, p_currency, p_origin, p_direction, p_destination, 'done',
    p_registered_by, p_user_id
  )
  RETURNING id INTO v_transfer_id;

  v_doc_number := public.get_next_doc_number(p_exchange_code);

  INSERT INTO public.documents (
    doc_number, exchange_code, doc_type, amount, currency, fee,
    related_type, related_id, related_name, description,
    registered_by, registered_by_user_id, transfer_id
  ) VALUES (
    v_doc_number, p_exchange_code, p_doc_type, p_amount, p_currency, p_fee,
    'transfer', v_transfer_id, p_sender_name || ' -> ' || p_receiver_name,
    p_description, p_registered_by, p_user_id, v_transfer_id
  )
  RETURNING id INTO v_doc_id;

  IF p_direction = 'send' THEN
    v_lines := jsonb_build_array(
      jsonb_build_object('account_type','customer','account_id','','account_name',p_sender_name,'currency',p_currency,'debit',p_amount,'credit',0,'description','sender debit','line_no',1),
      jsonb_build_object('account_type','suspense','account_id',v_transfer_id::text,'account_name','transfer in transit','currency',p_currency,'debit',0,'credit',p_amount,'description','transit credit','line_no',2)
    );
  ELSE
    v_lines := jsonb_build_array(
      jsonb_build_object('account_type','suspense','account_id',v_transfer_id::text,'account_name','transfer in transit','currency',p_currency,'debit',p_amount,'credit',0,'description','exit transit','line_no',1),
      jsonb_build_object('account_type','customer','account_id','','account_name',p_receiver_name,'currency',p_currency,'debit',0,'credit',p_amount,'description','receiver credit','line_no',2)
    );
  END IF;

  INSERT INTO public.ledger_entries (
    exchange_code, document_id, transfer_id, account_type, account_id,
    account_name, currency, debit, credit, description, doc_line_no,
    registered_by, registered_by_user_id
  )
  SELECT
    p_exchange_code, v_doc_id, v_transfer_id,
    row->>'account_type', row->>'account_id', row->>'account_name',
    row->>'currency', (row->>'debit')::numeric, (row->>'credit')::numeric,
    row->>'description', (row->>'line_no')::integer,
    p_registered_by, p_user_id
  FROM jsonb_array_elements(v_lines) AS t(row);

  IF p_fee > 0 THEN
    INSERT INTO public.ledger_entries (
      exchange_code, document_id, transfer_id, account_type, account_id,
      account_name, currency, debit, credit, description, doc_line_no,
      registered_by, registered_by_user_id
    ) VALUES (
      p_exchange_code, v_doc_id, v_transfer_id, 'fee', '', 'transfer fee',
      COALESCE(p_fee_currency, p_currency), p_fee, 0, 'transfer fee', 3,
      p_registered_by, p_user_id
    );
  END IF;

  IF p_client_operation_id IS NOT NULL THEN
    INSERT INTO public.idempotency_keys (
      client_operation_id, table_name, result_id, exchange_code
    ) VALUES (
      p_client_operation_id, 'transfers', v_transfer_id, p_exchange_code
    )
    ON CONFLICT (client_operation_id) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'transfer_id', v_transfer_id,
    'transfer_number', v_transfer_number,
    'document_id', v_doc_id,
    'doc_number', v_doc_number,
    'idempotent', false
  );
END;
$function$;
