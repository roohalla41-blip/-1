// passwordAlert.js — منطق هشدار «رمز عبور پیش‌فرض».
//
// حساب‌هایی که هنوز رمز پیش‌فرض را دارند باید پس از ورود هشدار ببینند. رمز پیش‌فرض
// هرگز در رابط کاربری نمایش داده نمی‌شود و هیچ داده‌ای در سرور تغییر نمی‌کند؛ فقط یک
// پرچم محلی (localStorage) برای نمایش یادآوری نگه داشته می‌شود.

export const DEFAULT_PASSWORD_ALERT_KEY = 'default_password_alert';
export const DEFAULT_PASSWORD_ALERT_EVENT = 'default-password-alert-changed';

const DEFAULT_PASSWORD = '12345678';
// creator و admin عمداً خارج از این فهرست‌اند؛ هشدار فقط برای صراف و مشتری است.
const ALERT_ROLES = ['exchange', 'sarraaf', 'customer'];

export function isDefaultPasswordAccount(password, role, serverFlag = false) {
  return (serverFlag === true || password === DEFAULT_PASSWORD) && ALERT_ROLES.includes(role);
}

function notifyChange() {
  try {
    window.dispatchEvent(new Event(DEFAULT_PASSWORD_ALERT_EVENT));
  } catch { /* non-browser environment */ }
}

// پس از ورود: پرچم را بر اساس رمز واردشده و نقش تنظیم یا پاک می‌کند.
export function syncDefaultPasswordAlert(password, role, serverFlag = false) {
  try {
    if (isDefaultPasswordAccount(password, role, serverFlag)) {
      localStorage.setItem(DEFAULT_PASSWORD_ALERT_KEY, '1');
    } else {
      localStorage.removeItem(DEFAULT_PASSWORD_ALERT_KEY);
    }
  } catch { /* storage unavailable */ }
  notifyChange();
}

// پس از تغییر موفق رمز: هشدار دیگر نمایش داده نشود.
export function clearDefaultPasswordAlert() {
  try {
    localStorage.removeItem(DEFAULT_PASSWORD_ALERT_KEY);
  } catch { /* storage unavailable */ }
  notifyChange();
}

// تابع خالص و قابل آزمون: فقط از storage خوانده و { role } یا null برمی‌گرداند.
export function readDefaultPasswordAlert(storage) {
  try {
    if (!storage || storage.getItem(DEFAULT_PASSWORD_ALERT_KEY) !== '1') return null;
    const user = JSON.parse(storage.getItem('auth_user') || '{}');
    return ALERT_ROLES.includes(user?.role) ? { role: user.role } : null;
  } catch {
    return null;
  }
}
