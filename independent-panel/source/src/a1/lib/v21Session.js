// نشست نسخهٔ مستقل ۲۲؛ جدا از نشست نسخهٔ ۲۱
// نشست راه‌دور فقط با توکن تأییدشده و snapshot همان صراف فعال می‌شود.
export const DEMO_EXCHANGE_CODE = 'DEMO-EX';
const SESSION_KEY = 'hisab_sarraf_v22_session';
let activeRemoteSnapshot = null;

export function setRemoteSnapshot(snapshot) {
  activeRemoteSnapshot = snapshot?.success === true && snapshot?.tables ? snapshot : null;
}

export function getRemoteSnapshot() {
  return activeRemoteSnapshot;
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') || null;
  } catch {
    return null;
  }
}

export function sessionContext() {
  const user = currentUser();
  if (!user?.id) throw new Error('نشست معتبر صراف پیدا نشد. دوباره وارد حساب شوید.');
  const exchangeCode = String(user.exchange_code || '').trim();
  if (!exchangeCode) throw new Error('شناسهٔ صرافی در نشست ثبت نشده است؛ دسترسی به داده‌ها متوقف شد.');
  return {
    exchangeCode,
    userId: String(user.id),
    role: String(user.role || '').toLowerCase(),
    userName: user.full_name || user.name || user.username || 'کاربر',
    userType: user.role || 'admin',
  };
}