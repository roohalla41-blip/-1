// aiChat.js — لایه ارتباطی مستقل دستیار هوشمند (بدون وابستگی به Base44)
//
// درخواست به تابع Supabase Edge Function واقعی ارسال می‌شود. هیچ کلید پولی
// یا Service Role Key استفاده نمی‌شود. فقط anon key عمومی و توکن نشست کاربر
// (x-app-token) ارسال می‌شود. خطاها تفکیک می‌شوند: شبکه، HTTP، احراز هویت،
// و پیکربندی مدل. هیچ توکن یا کلیدی ثبت نمی‌شود.

import { getSupabaseConfig } from './supabaseConfig';

const STORAGE_KEY = 'ai_assistant_history_v1';
const MAX_HISTORY = 100;
const FUNCTION_PATH = '/functions/v1/ai-assistant';
const BUILDER_FUNCTION_PATH = '/functions/v1/builder-ai-assistant';
const BUILDER_HISTORY_KEY = 'a1_builder_ai_history_v1';

export const MODEL_STATUS = {
  NOT_CONFIGURED: 'not_configured',
  ERROR: 'error',
  OK: 'ok',
};

// مرحلهٔ خطا برای نمایش تفکیک‌شده در رابط کاربری
export const ERROR_KIND = {
  NETWORK: 'network',
  AUTH: 'auth',
  SERVER: 'server',
  MODEL: 'model',
  UNKNOWN: 'unknown',
};

const DEV = import.meta.env?.DEV;

function devLog(label, info) {
  if (DEV && console) {
    // فقط اطلاعات غیرحساس: برچسب، کد وضعیت، نوع خطا
    console.log('[aiChat]', label, info);
  }
}

function resolveFunctionUrl() {
  const { url } = getSupabaseConfig();
  return `${url}${FUNCTION_PATH}`;
}

function resolveAnonKey() {
  const { key } = getSupabaseConfig();
  return key || '';
}

/**
 * ارسال پیام به Edge Function واقعی ai-assistant در Supabase.
 */
export async function sendAssistantMessage(userMessage, { signal, context = [], functionPath = FUNCTION_PATH, projectSnapshot = null, requestSnapshot = null } = {}) {
  if (!userMessage || !userMessage.trim()) {
    return { status: MODEL_STATUS.ERROR, error: 'پیام خالی است.', kind: ERROR_KIND.UNKNOWN };
  }

  const token = readAuthToken();
  if (!token) {
    return {
      status: MODEL_STATUS.ERROR,
      error: 'نشست احراز هویت یافت نشد. لطفاً وارد شوید.',
      kind: ERROR_KIND.AUTH,
    };
  }

  const endpoint = `${getSupabaseConfig().url}${functionPath}`;
  const anonKey = resolveAnonKey();

  const safeContext = Array.isArray(context)
    ? context.slice(-8).map((item) => ({
        role: item && item.role === 'assistant' ? 'assistant' : 'user',
        text: String(item && item.text || '').slice(0, 600),
      })).filter((item) => item.text.trim())
    : [];

  const headers = {
    'Content-Type': 'application/json',
    'x-app-token': token,
  };
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: userMessage.trim(), context: safeContext, projectSnapshot, requestSnapshot }),
      signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { status: MODEL_STATUS.ERROR, error: 'درخواست لغو شد.', kind: ERROR_KIND.NETWORK };
    }
    devLog('network-error', { name: err?.name });
    return {
      status: MODEL_STATUS.ERROR,
      error: 'خطای شبکه یا قطعی اینترنت. اتصال به سرور برقرار نشد.',
      kind: ERROR_KIND.NETWORK,
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    devLog('invalid-json', { status: response.status });
    return {
      status: MODEL_STATUS.ERROR,
      error: `پاسخ سرور نامعتبر است (کد ${response.status}).`,
      kind: ERROR_KIND.SERVER,
    };
  }

  if (!response.ok) {
    const kind = response.status === 401 || response.status === 403 ? ERROR_KIND.AUTH : ERROR_KIND.SERVER;
    devLog('http-error', { status: response.status, kind });
    return {
      status: MODEL_STATUS.ERROR,
      error: data?.error || `خطای سرور (کد ${response.status}).`,
      kind,
    };
  }

  // وضعیت پیکربندی‌نشدن مدل — به‌عنوان پاسخ واقعی مدل جا زده نمی‌شود.
  if (data.status === MODEL_STATUS.NOT_CONFIGURED) {
    devLog('model-not-configured', {});
    return {
      status: MODEL_STATUS.NOT_CONFIGURED,
      reply: data.reply || 'مدل هوش مصنوعی هنوز پیکربندی نشده است.',
      error: null,
      kind: ERROR_KIND.MODEL,
    };
  }

  if (data.status === MODEL_STATUS.ERROR) {
    return {
      status: MODEL_STATUS.ERROR,
      error: data.error || 'خطای ناشناخته از سمت سرور.',
      kind: ERROR_KIND.SERVER,
    };
  }

  return {
    status: data.status || MODEL_STATUS.OK,
    reply: data.reply || '',
    error: data.error || null,
    kind: null,
  };
}

// ── مدیریت تاریخچه محلی ──

export function loadHistory(storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history, storageKey = STORAGE_KEY) {
  try {
    const trimmed = (history || []).slice(-MAX_HISTORY);
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch {
    // فضای ذخیره‌سازی پر یا غیرفعال — نادیده می‌گیریم.
  }
}

export function clearHistory(storageKey = STORAGE_KEY) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // نادیده.
  }
}

// ── کمکی: خواندن توکن نشست ──
function readAuthToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
}
// Builder assistant uses a dedicated endpoint and isolated local history.
export const BUILDER_ASSISTANT_HISTORY_KEY = BUILDER_HISTORY_KEY;
export function sendBuilderAssistantMessage(userMessage, options = {}) {
  return sendAssistantMessage(userMessage, { ...options, functionPath: BUILDER_FUNCTION_PATH });
}
