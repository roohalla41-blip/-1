-- Additive compatibility RPC for transfer forms.
-- Existing post_transfer_transaction remains unchanged for older clients.
CREATE OR REPLACE FUNCTION public.post_transfer_transaction_v2(
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
  p_client_operation_id text DEFAULT NULL,
  p_customer_id bigint DEFAULT NULL,
  p_agent_id bigint DEFAULT NULL
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
  -- Enforce tenant scope inside the RPC, independently of client-side checks.
  IF p_exchange_code IS NULL OR
     (NOT COALESCE(public.app_is_admin(), false) AND p_exchange_code IS DISTINCT FROM public.app_ec()) THEN
    RAISE EXCEPTION 'invalid_exchange_scope';
  END IF;

  IF p_direction NOT IN ('send', 'receive') THEN
    RAISE EXCEPTION 'invalid_transfer_direction';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR COALESCE(p_fee, 0) < 0 THEN
    RAISE EXCEPTION 'invalid_transfer_amount_or_fee';
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = p_customer_id AND c.exchange_code = p_exchange_code
  ) THEN
    RAISE EXCEPTION 'customer_not_found_or_outside_exchange';
  END IF;

  IF p_agent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.origins a
    WHERE a.id = p_agent_id AND a.exchange_code = p_exchange_code
  ) THEN
    RAISE EXCEPTION 'agent_not_found_or_outside_exchange';
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
    amount, currency, rate, fee, fee_currency, origin, direction, destination, status,
    registered_by, registered_by_user_id, customer_id, agent_id
  ) VALUES (
    p_exchange_code, v_transfer_number, p_sender_name, p_sender_phone, NULL,
    p_receiver_name, p_receiver_phone, p_destination, NULL,
    p_amount, p_currency, p_rate, COALESCE(p_fee, 0),
    COALESCE(p_fee_currency, p_currency), p_origin, p_direction, p_destination, 'done',
    p_registered_by, p_user_id, p_customer_id, p_agent_id
  )
  RETURNING id INTO v_transfer_id;

  v_doc_number := public.get_next_doc_number(p_exchange_code);

  INSERT INTO public.documents (
    doc_number, exchange_code, doc_type, amount, currency, fee, fee_currency, rate,
    related_type, related_id, related_name, description,
    registered_by, registered_by_user_id, transfer_id
  ) VALUES (
    v_doc_number, p_exchange_code, p_doc_type, p_amount, p_currency, p_fee,
    COALESCE(p_fee_currency, p_currency), p_rate,
    'transfer', v_transfer_id, p_sender_name || ' -> ' || p_receiver_name,
    p_description, p_registered_by, p_user_id, v_transfer_id
  )
  RETURNING id INTO v_doc_id;

  IF p_direction = 'send' THEN
    v_lines := jsonb_build_array(
      jsonb_build_object('account_type','customer','account_id',COALESCE(p_customer_id::text,''),'account_name',p_sender_name,'currency',p_currency,'debit',p_amount,'credit',0,'description','sender debit','line_no',1),
      jsonb_build_object('account_type','suspense','account_id',v_transfer_id::text,'account_name','transfer in transit','currency',p_currency,'debit',0,'credit',p_amount,'description','transit credit','line_no',2)
    );
  ELSE
    v_lines := jsonb_build_array(
      jsonb_build_object('account_type','suspense','account_id',v_transfer_id::text,'account_name','transfer in transit','currency',p_currency,'debit',p_amount,'credit',0,'description','exit transit','line_no',1),
      jsonb_build_object('account_type','customer','account_id',COALESCE(p_customer_id::text,''),'account_name',p_receiver_name,'currency',p_currency,'debit',0,'credit',p_amount,'description','receiver credit','line_no',2)
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
    INSERT INTO public.idempotency_keys (client_operation_id, table_name, result_id, exchange_code)
    VALUES (p_client_operation_id, 'transfers', v_transfer_id, p_exchange_code)
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

GRANT EXECUTE ON FUNCTION public.post_transfer_transaction_v2(
  text, text, text, text, text, text, text, text, numeric, text,
  numeric, numeric, text, text, text, text, bigint, text, bigint, bigint
) TO anon, authenticated;
