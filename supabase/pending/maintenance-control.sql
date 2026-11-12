-- PENDING MIGRATION — review and convert to a timestamped Supabase migration
-- before applying. This file is NOT deployed to the live database.
--
-- A1 preservation: no financial/user/customer/transaction rows are deleted or
-- rewritten. Only the global_maintenance app_settings key is inserted/updated.
-- Initial state is intentionally ON indefinitely to preserve the current
-- production lockout until the creator explicitly disables or schedules it.

insert into public.app_settings
  (setting_key, setting_value, setting_type, description, category, exchange_code)
values
  (
    'global_maintenance',
    jsonb_build_object(
      'enabled', true,
      'until', null,
      'duration_minutes', null,
      'message', 'برای بهبود خدمات و ارتقای سیستم، دسترسی عمومی موقتاً متوقف شده است.'
    )::text,
    'json',
    'Global maintenance mode and automatic expiry',
    'system',
    null
  )
on conflict (setting_key) do nothing;

create or replace function public.app_maintenance_state()
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
  select setting_value::jsonb
    into v_value
  from public.app_settings
  where setting_key = 'global_maintenance'
    and exchange_code is null
  limit 1;

  if not found or v_value is null then
    return jsonb_build_object(
      'enabled', false,
      'until', null,
      'duration_minutes', null,
      'message', 'برای بهبود خدمات و ارتقای سیستم، دسترسی عمومی موقتاً متوقف شده است.',
      'server_now', v_now
    );
  end if;

  v_until := nullif(v_value ->> 'until', '')::timestamptz;
  v_enabled := coalesce((v_value ->> 'enabled')::boolean, true)
    and (v_until is null or v_until > v_now);

  return jsonb_build_object(
    'enabled', v_enabled,
    'until', v_until,
    'duration_minutes', nullif(v_value ->> 'duration_minutes', '')::integer,
    'message', coalesce(nullif(v_value ->> 'message', ''), 'برای بهبود خدمات و ارتقای سیستم، دسترسی عمومی موقتاً متوقف شده است.'),
    'server_now', v_now
  );
exception when others then
  -- Fail closed if the global control record is malformed.
  return jsonb_build_object(
    'enabled', true,
    'until', null,
    'duration_minutes', null,
    'message', 'سامانه موقتاً در حال بررسی و نگهداری است. لطفاً بعداً دوباره تلاش کنید.',
    'server_now', now()
  );
end;
$$;

create or replace function public.app_maintenance_active()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce((public.app_maintenance_state() ->> 'enabled')::boolean, true);
$$;

create or replace function public.get_app_maintenance()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select public.app_maintenance_state();
$$;

create or replace function public.set_app_maintenance(
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
  v_message text;
  v_payload jsonb;
begin
  v_claims := public.app_claims();
  if v_claims is null then
    raise exception 'creator_session_required' using errcode = '42501';
  end if;

  v_uid := nullif(v_claims ->> 'uid', '')::bigint;
  select role into v_role
  from public.users
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

  v_message := coalesce(nullif(btrim(p_message), ''), 'برای بهبود خدمات و ارتقای سیستم، دسترسی عمومی موقتاً متوقف شده است.');
  v_payload := jsonb_build_object(
    'enabled', coalesce(p_enabled, false),
    'until', v_until,
    'duration_minutes', case when p_enabled then p_duration_minutes else null end,
    'message', left(v_message, 300)
  );

  insert into public.app_settings
    (setting_key, setting_value, setting_type, description, category, exchange_code, updated_by_name)
  values
    ('global_maintenance', v_payload::text, 'json', 'Global maintenance mode and automatic expiry', 'system', null,
      (select full_name from public.users where id = v_uid))
  on conflict (setting_key) do update
    set setting_value = excluded.setting_value,
        setting_type = excluded.setting_type,
        description = excluded.description,
        category = excluded.category,
        exchange_code = null,
        updated_by_name = excluded.updated_by_name,
        updated_at = now();

  return public.app_maintenance_state();
end;
$$;

-- app_claims is the common authorization primitive used by the custom-token
-- RLS policies. Returning NULL blocks already-issued non-creator sessions too.
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
  if coalesce(v_role, '') <> 'creator' and public.app_maintenance_active() then
    return null;
  end if;
  return payload;
exception when others then
  return null;
end;
$$;

create or replace function public.legacy_login(p_identifier text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  idn text := public.app_norm_ident(p_identifier);
  v_id bigint;
  u public.users;
  prof jsonb;
  fails int;
  token text;
  maintenance jsonb;
begin
  if idn = '' or coalesce(p_password, '') = '' then
    return jsonb_build_object('success', false, 'error', 'missing_fields');
  end if;

  select count(*) into fails
  from public.audit_logs
  where action = 'login_failed'
    and user_name = idn
    and created_at > now() - interval '15 minutes';

  if fails >= 5 then
    return jsonb_build_object('success', false, 'error', 'too_many_attempts');
  end if;

  v_id := public.app_find_user_id(idn);
  if v_id is null then
    perform public.app_audit(null, idn, null, 'login_failed', 'user not found', 'failed');
    return jsonb_build_object('success', false, 'error', 'user_not_found');
  end if;

  select * into u from public.users where id = v_id;
  if not public.app_verify_password(p_password, u.password) then
    perform public.app_audit(u.id, idn, u.role, 'login_failed', 'wrong password', 'failed');
    return jsonb_build_object('success', false, 'error', 'wrong_password');
  end if;

  if coalesce(u.status, 'active') <> 'active' then
    perform public.app_audit(u.id, idn, u.role, 'login_failed', 'user inactive', 'failed');
    return jsonb_build_object('success', false, 'error', 'user_inactive');
  end if;

  prof := public.app_profile(u.id);
  maintenance := public.app_maintenance_state();

  if coalesce(prof -> 'user' ->> 'role', '') <> 'creator'
     and coalesce((maintenance ->> 'enabled')::boolean, true) then
    return jsonb_build_object(
      'success', false,
      'error', 'maintenance_mode',
      'maintenance_until', maintenance -> 'until',
      'maintenance_message', maintenance ->> 'message'
    );
  end if;

  update public.users set last_login = now() where id = u.id;

  token := public.app_sign(jsonb_build_object(
    'uid', u.id::text,
    'r', prof -> 'user' ->> 'role',
    'ec', coalesce(prof -> 'user' ->> 'exchange_code', ''),
    'exp', (extract(epoch from now()) * 1000)::bigint + 43200000
  ));

  perform public.app_audit(u.id, u.full_name, u.role, 'login', 'User logged in (token auth)');
  return jsonb_build_object('success', true, 'user', prof -> 'user', 'exchange', prof -> 'exchange', 'token', token);
end;
$$;

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

  maintenance := public.app_maintenance_state();
  if coalesce(prof -> 'user' ->> 'role', '') <> 'creator'
     and coalesce((maintenance ->> 'enabled')::boolean, true) then
    return jsonb_build_object(
      'success', false,
      'error', 'maintenance_mode',
      'maintenance_until', maintenance -> 'until',
      'maintenance_message', maintenance ->> 'message'
    );
  end if;

  return jsonb_build_object('success', true, 'user', prof -> 'user', 'exchange', prof -> 'exchange');
end;
$$;

revoke all on function public.app_maintenance_state() from public, anon, authenticated;
revoke all on function public.app_maintenance_active() from public, anon, authenticated;
grant execute on function public.get_app_maintenance() to anon, authenticated;
grant execute on function public.set_app_maintenance(boolean, integer, text) to anon, authenticated;
