// builderAccess.js — مدیریت دسترسی کمک‌سازنده‌ها از Supabase
import { createSupabaseEntity } from './supabaseApi';

const sbBuilderAccess = createSupabaseEntity('BuilderAccess');

const STORAGE_KEY = 'builder_access_cache';
const SESSION_KEY = 'builder_session_start';
const TIMEOUT_MS = 30 * 60 * 1000;

// دریافت مجوزها باید از سرور موفق شود؛ کش قدیمی مبنای اعطای دسترسی نیست.
export async function fetchAndCacheBuilderAccess() {
  try {
    const list = await sbBuilderAccess.list();
    const simplified = (list || []).map(a => ({
      email: (a.email || '').toLowerCase().trim(),
      phone: (a.phone || '').replace(/\s/g, ''),
      name: a.name,
      allowed_tabs: Array.isArray(a.allowed_tabs) ? a.allowed_tabs : [],
      status: a.status || 'active',
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simplified));
    } catch {
      // عدم دسترسی به storage نباید نتیجه دریافت سرور را تغییر دهد.
    }
    return simplified;
  } catch (error) {
    // خطای شبکه/سرور: کش قدیمی پاک می‌شود تا مجوز لغوشده باقی نماند.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    throw error;
  }
}

// این تابع فقط برای نمایش و مسیریابی رابط کاربری است؛
 // مجوز عملیات حساس باید در backend/RLS نیز بررسی شود.
export function checkBuilderAccess(user) {
  if (!user) return null;
  if (user.role === 'creator') return { role: 'creator', allowed_tabs: 'all' };

  const email = (user.email || '').toLowerCase().trim();
  const phone = (user.phone || user.mobile || '').replace(/\s/g, '');

  let accessList = [];
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    accessList = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(accessList)) accessList = [];
  } catch {
    accessList = [];
  }

  const match = accessList.find(a =>
    a.status === 'active' && (
      (a.email && a.email === email) ||
      (a.phone && a.phone === phone)
    )
  );

  if (match) {
    return { role: 'co_creator', allowed_tabs: match.allowed_tabs || [], name: match.name };
  }
  return null;
}

// نشست پنل سازنده پس از ۳۰ دقیقه بی‌فعالیتی پایان می‌یابد.
export function startBuilderSession(onTimeout) {
  const now = Date.now();
  localStorage.setItem(SESSION_KEY, String(now));
  localStorage.setItem('builder_last_activity', String(now));

  let timeoutId = null;

  const resetTimer = () => {
    localStorage.setItem('builder_last_activity', String(Date.now()));
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      clearBuilderSession();
      if (onTimeout) onTimeout();
    }, TIMEOUT_MS);
  };

  const intervalId = setInterval(() => {
    const lastActivity = parseInt(localStorage.getItem('builder_last_activity') || '0', 10);
    if (Date.now() - lastActivity > TIMEOUT_MS) {
      clearBuilderSession();
      clearInterval(intervalId);
      if (onTimeout) onTimeout();
    }
  }, 60 * 1000);

  const events = ['mousedown', 'keydown', 'touchstart', 'click'];
  events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
  resetTimer();

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    clearInterval(intervalId);
    events.forEach(e => document.removeEventListener(e, resetTimer));
  };
}

export function clearBuilderSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('builder_last_activity');
  } catch {
    // ignore
  }
}

export function isBuilderSessionActive() {
  try {
    return !!localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}
