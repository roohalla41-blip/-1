// aiChat.js — client transport for the A1 assistant.
// The Groq API key is kept only in the server's environment, never in this file.
// Conversation text is held in component memory and is not saved to localStorage or the app database.

import { getSupabaseConfig } from './supabaseConfig';

export const MODEL_STATUS = {
  NOT_CONFIGURED: 'not_configured',
  ERROR: 'error',
  OK: 'ok',
};

export const ERROR_KIND = {
  NETWORK: 'network',
  AUTH: 'auth',
  SERVER: 'server',
  MODEL: 'model',
  UNKNOWN: 'unknown',
};

const FUNCTION_PATH = '/functions/v1/ai-assistant';
const DEV = import.meta.env?.DEV;

function devLog(label, info) {
  if (DEV && console) console.log('[aiChat]', label, info);
}

function readAuthToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
}

export async function sendAssistantMessage(userMessage, { signal, context = [] } = {}) {
  const message = String(userMessage || '').trim();
  if (!message) {
    return { status: MODEL_STATUS.ERROR, error: 'پیام خالی است.', kind: ERROR_KIND.UNKNOWN };
  }
  if (message.length > 2000) {
    return { status: MODEL_STATUS.ERROR, error: 'پیام بیش از حد طولانی است.', kind: ERROR_KIND.UNKNOWN };
  }

  const token = readAuthToken();
  if (!token) {
    return {
      status: MODEL_STATUS.ERROR,
      error: 'نشست احراز هویت یافت نشد. لطفاً وارد شوید.',
      kind: ERROR_KIND.AUTH,
    };
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch {
    return {
      status: MODEL_STATUS.ERROR,
      error: 'تنظیمات اتصال سرور در دسترس نیست.',
      kind: ERROR_KIND.SERVER,
    };
  }

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
  if (config.key) {
    headers.apikey = config.key;
    headers.Authorization = 'Bearer ' + config.key;
  }

  let response;
  try {
    response = await fetch(config.url.replace(/\/+$/, '') + FUNCTION_PATH, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, context: safeContext }),
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { status: MODEL_STATUS.ERROR, error: 'درخواست لغو شد.', kind: ERROR_KIND.NETWORK };
    }
    devLog('network-error', { name: err && err.name });
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
      error: 'پاسخ سرور نامعتبر است (کد ' + response.status + ').',
      kind: ERROR_KIND.SERVER,
    };
  }

  if (!response.ok) {
    const kind = response.status === 401 || response.status === 403 ? ERROR_KIND.AUTH : ERROR_KIND.SERVER;
    devLog('http-error', { status: response.status, kind });
    return {
      status: MODEL_STATUS.ERROR,
      error: data && data.error || 'خطای سرور (کد ' + response.status + ').',
      kind,
    };
  }

  if (data && data.status === MODEL_STATUS.NOT_CONFIGURED) {
    return {
      status: MODEL_STATUS.NOT_CONFIGURED,
      reply: data.reply || 'دستیار هنوز پیکربندی نشده است.',
      error: null,
      kind: ERROR_KIND.MODEL,
    };
  }
  if (data && data.status === MODEL_STATUS.ERROR) {
    return {
      status: MODEL_STATUS.ERROR,
      error: data.error || 'خطای ناشناخته از سمت سرور.',
      kind: ERROR_KIND.SERVER,
    };
  }

  return {
    status: data && data.status || MODEL_STATUS.OK,
    reply: data && data.reply || '',
    error: data && data.error || null,
    kind: null,
  };
}
