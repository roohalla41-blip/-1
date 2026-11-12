-- A1: timed restriction for exchanger/customer sign-in.
-- Separate additive migration: does not alter the existing global maintenance control
-- and does not modify user, customer, account, balance, or transaction rows.

create or replace function public.user_login_restriction_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_value jsonb;
  v_until timestamptz;
  v_enabled boolean;
  v_now timestamptz := now();
begin
  select setting_value::jsonb into v_value
  from public.app_settings
  where setting_key = 'user_login_restriction'
    and exchange_code is null
  limit 1;

  if not found or v_value is null then
    return jsonb_build_object('enabled', false, 'until', null,
      'duration_minutes', null,
      'message', 'ورود کاربران صراف و مشتری موقتاً محدود شده است.',
      'server_now', v_now);
  end if;

  v_until := nullif(v_value ->> 'until', '')::timestamptz;
  v_enabled := coalesce((v_value ->> 'enabled')::boolean, false)
    and (v_until is null or v_until > v_now);

  return jsonb_build_object(
    'enabled', v_enabled, 'until', v_until,
    'duration_minutes', nullif(v_value ->> 'duration_minutes', '')::integer,
    'message', coalesce(nullif(v_value ->> 'message', ''),
      'ورود کاربران صراف و مشتری موقتاً محدود شده است.'),
    'server_now', v_now
  );
exception when others then
  -- Fail closed for ordinary users if the control record is malformed.
  return jsonb_build_object('enabled', true, 'until', null,
    'duration_minutes', null,
    'message', 'ورود کاربران فعلاً امکان‌پذیر نیست. لطفاً بعداً دوباره تلاش کنید.',
    'server_now', now());
end;
$$;

create or replace function public.get_user_login_restriction()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$ select public.user_login_restriction_state(); $$;

create or replace function public.set_user_login_restriction(
  p_enabled boolean,
  p_duration_minutes integer,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_claims jsonb;
  v_uid bigint;
  v_role text;
  v_until timestamptz;
  v_payload jsonb;
begin
  v_claims := public.app_claims();
  if v_claims is null then
    raise exception 'creator_session_required' using errcode = '42501';
  end if;
  v_uid := nullif(v_claims ->> 'uid', '')::bigint;
  select role into v_role from public.users
    where id = v_uid and coalesce(status, 'active') = 'active';
  if coalesce(v_role, '') <> 'creator' then
    raise exception 'creator_only' using errcode = '42501';
  end if;

  if coalesce(p_enabled, false) then
    if p_duration_minutes is null or p_duration_minutes < 1 or p_duration_minutes > 10080 then
      raise exception 'duration_must_be_between_1_and_10080_minutes' using errcode = '22023';
    end if;
    v_until := now() + make_interval(mins => p_duration_minutes);
  else
    v_until := null;
  end if;

  v_payload := jsonb_build_object(
    'enabled', coalesce(p_enabled, false),
    'until', v_until,
    'duration_minutes', case when p_enabled then p_duration_minutes else null end,
    'message', left(coalesce(nullif(btrim(p_message), ''),
      'ورود کاربران صراف و مشتری موقتاً محدود شده است.'), 300)
  );

  insert into public.app_settings
    (setting_key, setting_value, setting_type, description, category,
     exchange_code, updated_by_name)
  values ('user_login_restriction', v_payload::text, 'json',
    'Timed restriction for exchanger and customer login; creator exempt',
    'system', null, (select full_name from public.users where id = v_uid))
  on conflict (setting_key) do update
    set setting_value = excluded.setting_value,
        setting_type = excluded.setting_type,
        description = excluded.description,
        category = excluded.category,
        exchange_code = null,
        updated_by_name = excluded.updated_by_name,
        updated_at = now();

  return public.user_login_restriction_state();
end;
$$;

-- Apply the second switch to existing custom-token sessions as well as new sign-ins.
-- The creator role is exempt. Existing global maintenance remains an independent,
-- higher-priority control and is not modified here.
create or replace function public.app_claims()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  h text;
  payload jsonb;
  v_role text;
begin
  h := current_setting('request.headers', true);
  if h is null or h = '' then return null; end if;
  payload := public.app_verify((h::json) ->> 'x-app-token');
  if payload is null then return null; end if;

  select role into v_role
  from public.users
  where id = (payload ->> 'uid')::bigint
    and coalesce(status, 'active') = 'active';

  if not found then return null; end if;

  if coalesce(v_role, '') <> 'creator' then
    if public.app_maintenance_active()
       or coalesce((public.user_login_restriction_state() ->> 'enabled')::boolean, true) then
      return null;
    end if;
  end if;
  return payload;
exception when others then
  return null;
end;
$$;

revoke all on function public.user_login_restriction_state() from public, anon, authenticated;
revoke all on function public.get_user_login_restriction() from public;
revoke all on function public.set_user_login_restriction(boolean, integer, text) from public;
grant execute on function public.get_user_login_restriction() to anon, authenticated;
grant execute on function public.set_user_login_restriction(boolean, integer, text) to anon, authenticated;

notify pgrst, 'reload schema';


-- Return an explicit restriction result during session verification so the
-- login screen can show the administrator's message after credentials are checked.
create or replace function public.legacy_verify(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  payload jsonb;
  prof jsonb;
  maintenance jsonb;
  restriction jsonb;
begin
  payload := public.app_verify(p_token);
  if payload is null then
    return jsonb_build_object('success', false, 'error', 'invalid_or_expired_token');
  end if;

  prof := public.app_profile((payload ->> 'uid')::bigint);
  if prof is null then
    return jsonb_build_object('success', false, 'error', 'user_not_found');
  end if;
  if coalesce(prof ->> 'status', 'active') <> 'active' then
    return jsonb_build_object('success', false, 'error', 'user_inactive');
  end if;

  if coalesce(prof -> 'user' ->> 'role', '') <> 'creator' then
    maintenance := public.app_maintenance_state();
    if coalesce((maintenance ->> 'enabled')::boolean, true) then
      return jsonb_build_object(
        'success', false, 'error', 'maintenance_mode',
        'maintenance_until', maintenance -> 'until',
        'maintenance_message', maintenance ->> 'message',
        'server_now', maintenance -> 'server_now'
      );
    end if;

    restriction := public.user_login_restriction_state();
    if coalesce((restriction ->> 'enabled')::boolean, false) then
      return jsonb_build_object(
        'success', false, 'error', 'user_login_restricted',
        'restriction_until', restriction -> 'until',
        'restriction_message', restriction ->> 'message',
        'server_now', restriction -> 'server_now'
      );
    end if;
  end if;

  return jsonb_build_object('success', true, 'user', prof -> 'user', 'exchange', prof -> 'exchange');
end;
$$;
