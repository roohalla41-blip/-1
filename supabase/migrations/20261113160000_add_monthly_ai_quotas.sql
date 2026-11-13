-- Monthly AI quotas for customer and exchange assistants.
-- No chat text, transcripts, prompts, or audio files are stored.
CREATE TABLE IF NOT EXISTS public.ai_plan_limits (
  role text NOT NULL,
  entitlement_level smallint NOT NULL DEFAULT 1,
  monthly_messages integer NOT NULL,
  monthly_voice_seconds integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, entitlement_level),
  CONSTRAINT ai_plan_limits_role_check CHECK (role IN ('customer', 'sarraaf')),
  CONSTRAINT ai_plan_limits_tier_check CHECK (entitlement_level BETWEEN 1 AND 3),
  CONSTRAINT ai_plan_limits_messages_check CHECK (monthly_messages >= 0),
  CONSTRAINT ai_plan_limits_voice_check CHECK (monthly_voice_seconds >= 0)
);

INSERT INTO public.ai_plan_limits
  (role, entitlement_level, monthly_messages, monthly_voice_seconds, active)
VALUES
  ('customer', 1, 10, 120, true),
  ('sarraaf', 1, 20, 120, true),
  ('sarraaf', 2, 200, 900, true),
  ('sarraaf', 3, 1000, 3600, true)
ON CONFLICT (role, entitlement_level) DO NOTHING;

ALTER TABLE public.ai_plan_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_plan_limits_public_read ON public.ai_plan_limits;
CREATE POLICY ai_plan_limits_public_read
  ON public.ai_plan_limits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS ai_plan_limits_admin_write ON public.ai_plan_limits;
CREATE POLICY ai_plan_limits_admin_write
  ON public.ai_plan_limits FOR ALL TO anon, authenticated
  USING (public.app_is_admin())
  WITH CHECK (public.app_is_admin());

GRANT SELECT ON public.ai_plan_limits TO anon, authenticated, service_role;
-- The table's RLS policy calls app_is_admin(), which validates the signed
-- x-app-token and permits only creator/admin claims for writes.
GRANT INSERT, UPDATE, DELETE ON public.ai_plan_limits TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.ai_monthly_usage (
  user_id bigint NOT NULL,
  month_start date NOT NULL,
  messages_used integer NOT NULL DEFAULT 0,
  voice_seconds_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month_start),
  CONSTRAINT ai_monthly_usage_messages_check CHECK (messages_used >= 0),
  CONSTRAINT ai_monthly_usage_voice_check CHECK (voice_seconds_used >= 0)
);

ALTER TABLE public.ai_monthly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_monthly_usage FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_monthly_usage TO service_role;

CREATE OR REPLACE FUNCTION public.consume_ai_monthly_usage(
  p_user_id bigint,
  p_month_start date,
  p_message_limit integer,
  p_voice_seconds_limit integer,
  p_voice_seconds integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  v_usage public.ai_monthly_usage;
BEGIN
  IF p_user_id IS NULL OR p_month_start IS NULL
     OR p_message_limit IS NULL OR p_message_limit < 0
     OR p_voice_seconds_limit IS NULL OR p_voice_seconds_limit < 0
     OR p_voice_seconds IS NULL OR p_voice_seconds < 0 THEN
    RAISE EXCEPTION 'Invalid AI quota request';
  END IF;

  IF p_message_limit = 0 OR p_voice_seconds > p_voice_seconds_limit THEN
    SELECT * INTO v_usage FROM public.ai_monthly_usage
      WHERE user_id = p_user_id AND month_start = p_month_start;
    RETURN jsonb_build_object(
      'allowed', false,
      'messages_used', COALESCE(v_usage.messages_used, 0),
      'voice_seconds_used', COALESCE(v_usage.voice_seconds_used, 0)
    );
  END IF;

  INSERT INTO public.ai_monthly_usage AS usage
    (user_id, month_start, messages_used, voice_seconds_used, updated_at)
  VALUES
    (p_user_id, p_month_start, 1, p_voice_seconds, now())
  ON CONFLICT (user_id, month_start) DO UPDATE
    SET messages_used = usage.messages_used + 1,
        voice_seconds_used = usage.voice_seconds_used + EXCLUDED.voice_seconds_used,
        updated_at = now()
    WHERE usage.messages_used < p_message_limit
      AND usage.voice_seconds_used + EXCLUDED.voice_seconds_used <= p_voice_seconds_limit
  RETURNING * INTO v_usage;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'messages_used', v_usage.messages_used,
      'voice_seconds_used', v_usage.voice_seconds_used
    );
  END IF;

  SELECT * INTO v_usage FROM public.ai_monthly_usage
    WHERE user_id = p_user_id AND month_start = p_month_start;
  RETURN jsonb_build_object(
    'allowed', false,
    'messages_used', COALESCE(v_usage.messages_used, 0),
    'voice_seconds_used', COALESCE(v_usage.voice_seconds_used, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_monthly_usage(
  p_user_id bigint,
  p_month_start date,
  p_voice_seconds integer DEFAULT 0
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  UPDATE public.ai_monthly_usage
  SET messages_used = GREATEST(0, messages_used - 1),
      voice_seconds_used = GREATEST(0, voice_seconds_used - GREATEST(COALESCE(p_voice_seconds, 0), 0)),
      updated_at = now()
  WHERE user_id = p_user_id AND month_start = p_month_start;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_monthly_usage(bigint, date, integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_ai_monthly_usage(bigint, date, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_monthly_usage(bigint, date, integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_ai_monthly_usage(bigint, date, integer) TO service_role;
