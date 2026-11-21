import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};
const enc = new TextEncoder();
const TOKEN_SCOPE = "hisab-sarraf-v22";
const TOKEN_TTL_SECONDS = 12 * 60 * 60;
const PAGE_SIZE = 1000;
const MAX_ROWS_PER_TABLE = 10000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

const TENANT_TABLES: Record<string, string> = {
  customers: "*",
  safes: "*",
  origins: "*",
  bank_accounts: "*",
  bank_transactions: "*",
  rates: "*",
  chart_of_accounts: "*",
  fiscal_periods: "*",
  cost_centers: "*",
  documents: "*",
  ledger_entries: "*",
  transfers: "*",
  conversions: "*",
  treasury_transactions: "*",
  journal_entries: "*",
  employees: "*",
  sellers: "*",
  rules: "*",
  charge_orders: "*",
  customer_links: "*",
  customer_notifications: "*",
  customer_transfer_requests: "*",
  online_requests: "*",
  recharge_orders: "*",
  wallets: "*",
  wallet_transactions: "*",
  wallet_topup_requests: "*",
  packages: "*",
  support_tickets: "*",
  user_feedback: "*",
  error_reports: "id,user_id,exchange_code,error_type,error_message,device,app_version,status,created_at",
  audit_logs: "id,user_id,registered_by_user_id,user_name,user_type,action,entity_type,entity_id,description,status,created_at,exchange_code,target_name,reason",
  feature_settings: "id,feature_key,feature_name,category,status,message,icon_name,sort_order,exchange_code,enabled,description,is_primary,free_enabled,paid_enabled,level_1_enabled,level_2_enabled,level_3_enabled",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function normalizeUsername(value: unknown) {
  const digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
  return String(value ?? "").trim().replace(/[۰-۹٠-٩]/g, (c) => {
    const index = digits.indexOf(c);
    return String(index >= 10 ? index - 10 : index);
  });
}
function b64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decodeB64url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
async function signingKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function signToken(payload: Record<string, unknown>, secret: string) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const key = await signingKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return body + "." + b64url(signature);
}
async function verifyToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const key = await signingKey(secret);
    if (!await crypto.subtle.verify("HMAC", key, decodeB64url(parts[1]), enc.encode(parts[0]))) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeB64url(parts[0])));
    const now = Math.floor(Date.now() / 1000);
    if (payload?.scope !== TOKEN_SCOPE || !payload.uid || !payload.exchange_code ||
        !payload.exchange_id || Number(payload.exp) <= now || Number(payload.iat) > now + 60) return null;
    return payload;
  } catch {
    return null;
  }
}
async function audit(db: ReturnType<typeof createClient>, uid: number | null, username: string, action: string, description: string, status: string) {
  try {
    await db.rpc("app_audit", {
      p_user_id: uid,
      p_name: username,
      p_type: "exchange",
      p_action: action,
      p_desc: description,
      p_status: status,
    });
  } catch {
    // Authentication outcome must not depend on audit-log availability.
  }
}
async function verifiedProfile(db: ReturnType<typeof createClient>, uid: number, expectedCode?: string, expectedExchangeId?: number) {
  const { data: profile, error } = await db.rpc("app_profile", { p_uid: uid });
  if (error || !profile?.user || !profile?.exchange) return null;
  const user = profile.user;
  const exchange = profile.exchange;
  if (String(user.id) !== String(uid) || user.role !== "sarraaf" || user.status !== "active") return null;
  if (String(exchange.owner_user_id) !== String(uid) || exchange.status !== "active" || !exchange.exchange_code) return null;
  if (expectedCode && exchange.exchange_code !== expectedCode) return null;
  if (expectedExchangeId && Number(exchange.id) !== expectedExchangeId) return null;

  // Require exactly one owned exchange. Never guess when ownership is ambiguous.
  const { data: owned, error: ownerError } = await db.from("exchanges")
    .select("id,exchange_code,owner_user_id,status")
    .eq("owner_user_id", uid)
    .limit(2);
  if (ownerError || !owned || owned.length !== 1) return null;
  if (Number(owned[0].id) !== Number(exchange.id) || owned[0].exchange_code !== exchange.exchange_code) return null;
  return profile;
}
async function readTenantRows(db: ReturnType<typeof createClient>, table: string, columns: string, exchangeCode: string) {
  const rows: unknown[] = [];
  for (let offset = 0; offset < MAX_ROWS_PER_TABLE; offset += PAGE_SIZE) {
    const { data, error } = await db.from(table).select(columns)
      .eq("exchange_code", exchangeCode)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error("tenant_read_failed:" + table);
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}
async function readSnapshot(db: ReturnType<typeof createClient>, profile: any) {
  const exchangeCode = String(profile.exchange.exchange_code);
  const entries = Object.entries(TENANT_TABLES);
  const tables: Record<string, unknown[]> = {};
  const truncated: string[] = [];

  // Small batches keep the hosted database from receiving a burst of 30+ parallel queries.
  for (let start = 0; start < entries.length; start += 5) {
    const batch = entries.slice(start, start + 5);
    const results = await Promise.all(batch.map(([table, columns]) => readTenantRows(db, table, columns, exchangeCode)));
    batch.forEach(([table], index) => {
      tables[table] = results[index].rows;
      if (results[index].truncated) truncated.push(table);
    });
  }

  const uid = String(profile.user.id);
  const [permissionsResult, paymentResult] = await Promise.all([
    db.from("user_permissions")
      .select("id,user_id,user_name,role,section,can_view,can_create,can_edit,can_delete,can_print,can_report,can_settings,created_at,updated_at")
      .eq("user_id", uid),
    db.from("payment_records")
      .select("id,user_id,user_name,sarraaf_profile_id,plan,payment_status,purchase_date,start_date,end_date,is_active,confirmed_by_name,created_at,updated_at")
      .eq("sarraaf_profile_id", Number(profile.exchange.id)),
  ]);
  if (permissionsResult.error) throw new Error("tenant_read_failed:user_permissions");
  if (paymentResult.error) throw new Error("tenant_read_failed:payment_records");
  tables.user_permissions = permissionsResult.data || [];
  tables.payment_records = paymentResult.data || [];

  // Support messages have no tenant key; read only messages belonging to this tenant's ticket IDs.
  const tickets = tables.support_tickets || [];
  const ticketIds = tickets.map((ticket: any) => ticket.id).filter((id) => id !== null && id !== undefined);
  tables.support_messages = [];
  if (ticketIds.length) {
    const { data, error } = await db.from("support_messages")
      .select("id,ticket_id,sender_id,sender_name,message,attachment_url,created_at")
      .in("ticket_id", ticketIds.slice(0, 5000))
      .order("created_at", { ascending: true });
    if (error) throw new Error("tenant_read_failed:support_messages");
    tables.support_messages = data || [];
  }

  return {
    tables,
    truncated_tables: truncated,
    loaded_at: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { success: false, error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return reply(503, { success: false, error: "service_unavailable" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { success: false, error: "invalid_request" });
  }
  const action = String(body.action || "");
  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    if (action === "login") {
      const username = normalizeUsername(body.username);
      const password = typeof body.password === "string" ? body.password : "";
      if (!username || username.length > 128 || !password || password.length > 1024) {
        return reply(400, { success: false, error: "missing_or_invalid_credentials" });
      }

      const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
      const { count, error: rateError } = await db.from("audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("action", "v22_login_failed")
        .eq("user_name", username)
        .gt("created_at", since);
      if (rateError) return reply(503, { success: false, error: "authentication_unavailable" });
      if ((count || 0) >= MAX_LOGIN_ATTEMPTS) return reply(429, { success: false, error: "too_many_attempts" });

      const { data: user, error: userError } = await db.from("users")
        .select("id,username,role,status,password")
        .eq("username", username)
        .maybeSingle();
      if (userError) return reply(503, { success: false, error: "authentication_unavailable" });
      if (!user || user.role !== "exchange" || user.status !== "active") {
        await audit(db, user?.id ?? null, username, "v22_login_failed", "Invalid credentials or unsupported role", "failed");
        return reply(401, { success: false, error: "invalid_credentials" });
      }

      const { data: passwordValid, error: passwordError } = await db.rpc("app_verify_password", {
        p_password: password,
        p_stored: user.password,
      });
      if (passwordError) return reply(503, { success: false, error: "authentication_unavailable" });
      if (passwordValid !== true) {
        await audit(db, user.id, username, "v22_login_failed", "Invalid credentials", "failed");
        return reply(401, { success: false, error: "invalid_credentials" });
      }

      const profile = await verifiedProfile(db, Number(user.id));
      if (!profile) {
        await audit(db, user.id, username, "v22_login_failed", "Exchange ownership verification failed", "failed");
        return reply(403, { success: false, error: "exchange_profile_unavailable" });
      }

      const now = Math.floor(Date.now() / 1000);
      const token = await signToken({
        scope: TOKEN_SCOPE,
        uid: String(profile.user.id),
        username: profile.user.username,
        role: "sarraaf",
        exchange_id: Number(profile.exchange.id),
        exchange_code: profile.exchange.exchange_code,
        iat: now,
        exp: now + TOKEN_TTL_SECONDS,
      }, serviceRoleKey);
      await audit(db, user.id, username, "v22_login_success", "Secure version 22 session created", "success");
      return reply(200, {
        success: true,
        token,
        expires_in: TOKEN_TTL_SECONDS,
        user: profile.user,
        exchange: profile.exchange,
        access: "read_only_until_transaction_rpc_is_enabled",
      });
    }

    if (action === "verify" || action === "snapshot") {
      const token = typeof body.token === "string" ? body.token : "";
      const payload = await verifyToken(token, serviceRoleKey);
      if (!payload || payload.role !== "sarraaf") return reply(401, { success: false, error: "invalid_or_expired_token" });

      const profile = await verifiedProfile(
        db,
        Number(payload.uid),
        String(payload.exchange_code),
        Number(payload.exchange_id),
      );
      if (!profile) return reply(403, { success: false, error: "exchange_access_revoked" });

      if (action === "verify") {
        return reply(200, { success: true, user: profile.user, exchange: profile.exchange, access: "read_only_until_transaction_rpc_is_enabled" });
      }
      const snapshot = await readSnapshot(db, profile);
      return reply(200, {
        success: true,
        access: "read_only_until_transaction_rpc_is_enabled",
        user: profile.user,
        exchange: profile.exchange,
        ...snapshot,
      });
    }

    if (action === "write") return reply(403, { success: false, error: "transaction_gateway_not_enabled" });
    return reply(400, { success: false, error: "unknown_action" });
  } catch (error) {
    console.error("v22 sarraf bridge error", error);
    return reply(503, { success: false, error: "data_service_unavailable" });
  }
});
