// supabaseClient.js — Direct Supabase client (no Base44 dependency)
//
// این کلاینت مستقیماً به Supabase متصل می‌شود و هیچ وابستگی به Base44 ندارد.
// در پیش‌نمایش ایزوله، درخواست‌های تغییردهنده به API دیتابیس مسدود می‌شوند.

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabaseConfig';

// ── Custom fetch: preview write barrier + session header ──
function createAppFetch() {
  return async (url, options = {}) => {
    const requestUrl = typeof url === 'string' ? url : url?.url || '';
    const requestMethod = String(
      options.method || (typeof Request !== 'undefined' && url instanceof Request ? url.method : 'GET')
    ).toUpperCase();
    const isSupabaseApi = /\/(rest|storage|auth)\/v1\//.test(requestUrl);
    const isPreview = typeof window !== 'undefined' && window.__PREVIEW_MODE__ === true;

    // Fail closed: even if preview config is accidentally pointed at production,
    // no non-read request may mutate database, storage, or auth state.
    if (isPreview && isSupabaseApi && !['GET', 'HEAD', 'OPTIONS'].includes(requestMethod)) {
      return new Response(
        JSON.stringify({ message: 'Preview safety barrier: write operations are disabled.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const headers = new Headers(options.headers || {});
        headers.set('x-app-token', token);
        options = { ...options, headers };
      }
    } catch { /* ignore */ }
    return fetch(url, options);
  };
}

// Lazy-initialize using centralized config (window.__SUPABASE_CONFIG__ + env fallback)
let _client = null;
let _configError = null;

function resolveConfig() {
  try {
    return getSupabaseConfig();
  } catch (e) {
    _configError = e;
    return null;
  }
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_client) {
        const cfg = resolveConfig();
        if (!cfg) {
          throw _configError || new Error('Supabase client not configured.');
        }
        _client = createClient(cfg.url, cfg.key, {
          auth: {
            persistSession: true,
            storageKey: 'supabase_auth_session',
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
          global: {
            fetch: createAppFetch(),
          },
        });
      }
      return _client[prop];
    },
  }
);

export function getSupabaseClient() {
  if (!_client) {
    const cfg = resolveConfig();
    if (!cfg) return null;
    _client = createClient(cfg.url, cfg.key, {
      auth: {
        persistSession: true,
        storageKey: 'supabase_auth_session',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: createAppFetch(),
      },
    });
  }
  return _client;
}

// نقشه‌ی نگاشت نام موجودیت Base44 → نام جدول Supabase
// این نقشه برای مهاجرت تدریجی استفاده می‌شود.
export const ENTITY_TABLE_MAP = {
  Customer: 'customers',
  Transfer: 'transfers',
  Agent: 'origins',
  Currency: 'rates',
  BankAccount: 'bank_accounts',
  RateSetting: 'app_settings',
  FeatureSetting: 'feature_settings',
  SarraafProfile: 'exchanges',
  Safe: 'safes',
  AuditLog: 'audit_logs',
  AppSetting: 'app_settings',
  WalletTransaction: 'wallet_transactions',
  LedgerEntry: 'ledger_entries',
  OnlineOrder: 'charge_orders',
  Transaction: 'documents',
  Announcement: 'rules',
  AgencyLink: 'agency_links',
  ChatGroup: 'chat_groups',
  GroupMember: 'chat_group_members',
  GroupMessage: 'chat_messages',
  MessageReport: 'message_reports',
  UserNotification: 'user_notifications',
  UserPermission: 'user_permissions',
  PlanQuota: 'plan_quotas',
  PaymentRecord: 'payment_records',
  Wallet: 'wallets',
  WalletTopupRequest: 'wallet_topup_requests',
  WalletBan: 'wallet_bans',
  OnlineProduct: 'online_products',
  Seller: 'sellers',
  Package: 'packages',
  CustomerNotification: 'customer_notifications',
  CustomerTransferRequest: 'customer_transfer_requests',
  CustomerLink: 'customer_links',
  QuotaChangeLog: 'quota_change_logs',
  PricingPlan: 'pricing_plans',
  TextLabel: 'text_labels',
  BackupRecord: 'backup_records',
  SupportTicket: 'support_tickets',
  SupportMessage: 'support_messages',
  ErrorReport: 'error_reports',
  UserFeedback: 'user_feedback',
  BankGateway: 'bank_gateways',
  PaymentTransaction: 'payment_transactions',
  WalletWithdrawalRequest: 'wallet_withdrawal_requests',
  Referral: 'referrals',
  RechargeOrder: 'recharge_orders',
};

export default supabase;
