// src/adapters/a1/a1EngineGateway.js — آداپتر درگاه داده برای موتور محلی نسخهٔ ۲۱
// رابط کاربری دیگر مستقیماً به موتور داده وصل نیست؛ این آداپتر همان قرارداد درگاه را پیاده می‌کند.
// رفتار، payload و خروجی‌ها عیناً همان توابع قبلی است (بدون تغییر منطق مالی یا scoping صرافی).
import { loadVersion21Database } from '@/a1/lib/v21Data';
import { currentUser, getRemoteSnapshot, setRemoteSnapshot } from '@/a1/lib/v21Session';
import { SANDBOX_TOKEN_KEY, sandboxRead } from '@/a1/lib/sandboxAuth';
import { ensureDemoTransactions } from '@/a1/lib/seed';
import {
  saveVersion21Record, editVersion21Record, deleteVersion21Record, deactivateVersion21MasterRecord,
  captureVersion21Error, seedVersion21BaseAccounts, reverseVersion21Record, loadVersion21RecordForEdit,
  saveFiscalPeriod, closeFiscalPeriod,
} from '@/a1/lib/v21Write';

export const a1EngineGateway = {
  kind: 'a1-engine',

  // پیش از هر خواندن، بخش‌های عملیاتی تا ۱۰ رکورد آزمایشی تکمیل می‌شوند؛
  // عملیات تکرارپذیر است و در اجراهای بعدی چیزی اضافه نمی‌کند.
  load: async ({ forceRefresh = false } = {}) => {
    const user = currentUser();
    if (user?.is_v22_remote_session) {
      const cached = getRemoteSnapshot();
      if (forceRefresh || !cached?.success) {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem(SANDBOX_TOKEN_KEY) : null;
        if (!token) throw new Error('نشست صراف معتبر نیست؛ دوباره وارد شوید.');
        const snapshot = await sandboxRead(token);
        setRemoteSnapshot(snapshot);
      }
    } else {
      try { await ensureDemoTransactions(10); } catch { /* نمایش با دادهٔ موجود ادامه می‌یابد */ }
    }
    return loadVersion21Database();
  },
  save: (module, draft) => saveVersion21Record(module, draft),
  edit: (module, draft) => editVersion21Record(module, draft),
  remove: (module, record) => deleteVersion21Record(module, record),
  deactivate: (module, record) => deactivateVersion21MasterRecord(module, record),
  reverse: (module, record, reason) => reverseVersion21Record(module, record, reason),
  loadForEdit: (module, record) => loadVersion21RecordForEdit(module, record),
  savePeriod: (draft) => saveFiscalPeriod(draft),
  closePeriod: (id, reason) => closeFiscalPeriod(id, reason),
  seedBaseAccounts: () => seedVersion21BaseAccounts(),
  captureError: (error, area) => captureVersion21Error(error, area),
};