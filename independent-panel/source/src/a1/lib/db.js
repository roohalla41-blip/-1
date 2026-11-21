// a1/lib/db.js — مرز ذخیره‌سازی آزمایشی A1
// نام و فهرست جدول‌ها مستقیماً از snapshot ساختار A1 گرفته شده است
// (reference/A1-extracted-source-temp/src/data/project-transfer-schema.json → 62 جدول).
// این ماژول تنها نقطهٔ تماس با IndexedDB است؛ لایهٔ صفحه و دامنه مستقیماً به آن دست نمی‌زند.
// تحریر سند، ابطال و جایگزینی سطرها در v21Posting انجام می‌شود تا میز کار و بقیهٔ صفحات یک موتور داشته باشند.
import { postDocumentInTx, reverseDocumentInTx } from './v21Posting';
import { seriesPrefix, seriesNumber } from './documentSeries';
import { currentUser, getRemoteSnapshot } from './v21Session';

export const A1_TABLES = [
  'support_tickets', 'support_messages', 'error_reports', 'user_feedback', 'safes',
  'users', 'exchanges', 'customers', 'documents', 'transfers', 'conversions',
  'treasury_transactions', 'bank_accounts', 'bank_transactions', 'journal_entries',
  'ledger_entries', 'rates', 'employees', 'origins', 'rules', 'feature_settings',
  'app_settings', 'audit_logs', 'wallet_transactions', 'charge_orders', 'online_requests',
  'idempotency_keys', 'wallets', 'customer_notifications', 'customer_transfer_requests',
  'customer_links', 'online_products', 'sellers', 'packages', 'pricing_plans',
  'chat_groups', 'chat_group_members', 'chat_messages', 'message_reports', 'email_otps',
  'bank_gateways', 'payment_transactions', 'referrals', 'wallet_withdrawal_requests',
  'languages', 'email_verification_requests', 'user_permissions', 'plan_quotas',
  'builder_access', 'manual_verification_requests', 'app_auth_secret', 'agency_links',
  'user_notifications', 'payment_records', 'wallet_topup_requests', 'backup_records',
  'recharge_orders', 'chart_of_accounts', 'fiscal_periods', 'cost_centers',
  'demo_preview_records', 'layout_hex_references',
];

// پایگاه محلی مستقل نسخهٔ ۲۲؛ دیتابیس محلی نسخهٔ ۲۱ با نام قبلی دست‌نخورده باقی می‌ماند.
const DB_NAME = 'hisab_sarraf_v22_local';
const DB_VERSION = 1;

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      A1_TABLES.forEach((table) => {
        if (!db.objectStoreNames.contains(table)) {
          const store = db.createObjectStore(table, { keyPath: 'id', autoIncrement: true });
          store.createIndex('exchange_code', 'exchange_code', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      });
    };
    request.onsuccess = () => {
      const db = request.result;
      // شمارهٔ اسناد قدیمی یک‌بار با سری هر نوع سند هم‌تراز می‌شود تا فهرست بخش‌ها شکاف نداشته باشد.
      repairDocumentSeries(db)
        .then(() => repairSafeOpeningValues(db))
        .finally(() => resolve(db));
    };
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

// نسخهٔ ۳: سری «سند تجاری» از سری معاملات اسعار جدا شد؛ دادهٔ موجود یک‌بار دوباره شماره می‌گیرد.
const SERIES_FLAG = 'hisab_sarraf_v22-doc-series-v3';
const SAFE_VALUE_FLAG = 'hisab_sarraf_v22-safe-opening-value-v2';

// شمارهٔ سند و سطرهای دفتر آن با هم بازنویسی می‌شوند تا ارجاع‌ها یک عدد بدهند.
async function repairDocumentSeries(db) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(SERIES_FLAG)) return;
    const tx = db.transaction(['documents', 'ledger_entries'], 'readwrite');
    const done = txComplete(tx);
    const docsStore = tx.objectStore('documents');
    const entriesStore = tx.objectStore('ledger_entries');
    const documents = await promisify(docsStore.getAll());
    documents.sort((a, b) => Number(a.id) - Number(b.id));
    const counters = new Map();
    const numbers = new Map();
    const byOldNumber = new Map();
    documents.forEach((doc) => {
      const prefix = seriesPrefix(doc.doc_type);
      const sequence = (counters.get(prefix) || 0) + 1;
      counters.set(prefix, sequence);
      const value = seriesNumber(prefix, sequence);
      numbers.set(Number(doc.id), value);
      const oldNumber = String(doc.doc_number || '');
      if (oldNumber && oldNumber !== value) byOldNumber.set(oldNumber, value);
      if (oldNumber !== value) docsStore.put({ ...doc, doc_number: value });
    });
    // ارجاع «سند معکوس» هم با شمارهٔ تازه هم‌تراز می‌شود تا دو عدد ناهمخوان نمانند.
    documents.forEach((doc) => {
      const oldReversal = String(doc.reversed_of || '');
      const value = byOldNumber.get(oldReversal);
      if (value) docsStore.put({ ...doc, doc_number: numbers.get(Number(doc.id)), reversed_of: value });
    });
    const entries = await promisify(entriesStore.getAll());
    entries.forEach((entry) => {
      const value = numbers.get(Number(entry.document_id));
      if (value && String(entry.doc_number || '') !== value) entriesStore.put({ ...entry, doc_number: value });
    });
    await done;
    if (typeof localStorage !== 'undefined') localStorage.setItem(SERIES_FLAG, '1');
  } catch {
    // اگر ترمیم ممکن نبود، شماره‌های موجود دست‌نخورده می‌مانند و برنامه ادامه می‌دهد.
  }
}

// ارزش پایهٔ موجودی آغازین صندوق‌های ارزی: یک‌بار اصلاح می‌شود.
// در دادهٔ نمایشی قدیمی، ارزش صندوق‌های غیر از افغانی با همان تعداد واحد نوشته شده بود
// (یک واحد ارز = یک افغانی) و همین عدد، بهای تمام‌شده و سود معاملات را خراب می‌کرد.
async function repairSafeOpeningValues(db) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(SAFE_VALUE_FLAG)) return;
    const tx = db.transaction(['safes', 'rates'], 'readwrite');
    const done = txComplete(tx);
    const safes = await promisify(tx.objectStore('safes').getAll());
    const rates = await promisify(tx.objectStore('rates').getAll());
    const rateOf = (currency) => {
      const row = rates.find((item) => String(item.currency || '').toUpperCase() === String(currency || '').toUpperCase());
      const rate = Number(row?.daily_rate || row?.sell_rate || row?.buy_rate || 0);
      return Number.isFinite(rate) && rate > 0 ? rate : null;
    };
    safes.forEach((safe) => {
      const currency = String(safe.currency || 'AFN').toUpperCase();
      const balance = Number(safe.opening_balance || 0);
      if (currency === 'AFN' || !balance) return;
      const rate = rateOf(currency);
      if (rate === null) return;
      const value = Number(safe.opening_value || 0);
      // فقط همان مقدار یک‌به‌یک (یا خالی) اصلاح می‌شود؛ ارزشی که کاربر خودش ثبت کرده دست‌نخورده می‌ماند.
      if (value && Math.abs(value - balance) > 0.0001) return;
      tx.objectStore('safes').put({ ...safe, opening_value: Math.round(balance * rate * 100) / 100 });
    });
    await done;
    if (typeof localStorage !== 'undefined') localStorage.setItem(SAFE_VALUE_FLAG, '1');
  } catch {
    // اگر اصلاح انجام نشد، همان مقدار موجود می‌ماند و برنامه ادامه می‌دهد.
  }
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// تکمیل تراکنش باید پیش از اجرای عملیات شنیده شود؛ در غیر این صورت ممکن است
// تراکنش پیش از اتصال شنونده بسته شود و وعده هرگز حل نشود.
function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('تراکنش پایگاه دادهٔ آزمایشی لغو شد.'));
  });
}

function remoteRowsFor(table) {
  const user = currentUser();
  if (!user?.is_v22_remote_session) return null;
  if (table === 'users') return [user];
  const snapshot = getRemoteSnapshot();
  if (!snapshot?.success || !snapshot?.tables) {
    throw new Error('نشست صراف فعال است، اما دادهٔ امن سرور در دسترس نیست.');
  }
  if (snapshot.truncated_tables?.includes(table)) {
    throw new Error('داده‌های جدول ' + table + ' کامل دریافت نشده است؛ نمایش ناقص متوقف شد.');
  }
  const rows = snapshot.tables[table];
  return Array.isArray(rows) ? rows : [];
}

function assertRemoteWriteUnavailable() {
  if (currentUser()?.is_v22_remote_session) {
    const error = new Error('درگاه ثبت امن سرور هنوز برای این عملیات فعال نشده است؛ هیچ تغییری به‌صورت محلی ذخیره نشد.');
    error.code = 'REMOTE_WRITE_NOT_READY';
    throw error;
  }
}

export async function all(table) {
  const remoteRows = remoteRowsFor(table);
  if (remoteRows !== null) return remoteRows;
  const db = await openDB();
  return promisify(db.transaction(table, 'readonly').objectStore(table).getAll());
}

export async function count(table) {
  const remoteRows = remoteRowsFor(table);
  if (remoteRows !== null) return remoteRows.length;
  const db = await openDB();
  return promisify(db.transaction(table, 'readonly').objectStore(table).count());
}

export async function get(table, id) {
  const remoteRows = remoteRowsFor(table);
  if (remoteRows !== null) return remoteRows.find(row => String(row.id) === String(id));
  const db = await openDB();
  return promisify(db.transaction(table, 'readonly').objectStore(table).get(id));
}

export async function insert(table, row) {
  assertRemoteWriteUnavailable();
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const done = txComplete(tx);
  const request = tx.objectStore(table).add({ ...row, is_demo: true, created_at: row.created_at || new Date().toISOString() });
  const id = await promisify(request);
  await done;
  return { ...row, id };
}

export async function update(table, id, patch) {
  assertRemoteWriteUnavailable();
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const done = txComplete(tx);
  const store = tx.objectStore(table);
  const existing = await promisify(store.get(id));
  if (!existing) throw new Error('رکورد در پایگاه دادهٔ آزمایشی پیدا نشد.');
  store.put({ ...existing, ...patch, updated_at: new Date().toISOString() });
  await done;
  return { ...existing, ...patch, id };
}

export async function remove(table, id) {
  assertRemoteWriteUnavailable();
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const done = txComplete(tx);
  tx.objectStore(table).delete(id);
  await done;
}

// ── تراکنش چندجدولی (اتمیک) ──
// نوشتن سند و ردیف‌های دفتر فقط در یک تراکنش read-write انجام می‌شود؛
// اگر هر مرحله شکست بخورد، هیچ ردیفی باقی نمی‌ماند.
export async function writeTx(tables, task) {
  assertRemoteWriteUnavailable();
  const db = await openDB();
  const tx = db.transaction(tables, 'readwrite');
  const done = txComplete(tx);
  const handles = {};
  tables.forEach((table) => {
    const store = tx.objectStore(table);
    handles[table] = {
      add: (row) => promisify(store.add({ ...row, is_demo: true, created_at: row.created_at || new Date().toISOString() })),
      put: (row) => promisify(store.put(row)),
      get: (id) => promisify(store.get(id)),
      getAll: () => promisify(store.getAll()),
      delete: (id) => promisify(store.delete(id)),
      count: () => promisify(store.count()),
    };
  });
  let result;
  try {
    result = await task(handles);
  } catch (error) {
    try { tx.abort(); } catch { /* already aborted */ }
    throw error;
  }
  await done;
  return result;
}

export async function wipeDemoData() {
  assertRemoteWriteUnavailable();
  const db = await openDB();
  const tx = db.transaction(A1_TABLES, 'readwrite');
  const done = txComplete(tx);
  A1_TABLES.forEach((table) => tx.objectStore(table).clear());
  await done;
}

// ── شماره‌گذاری اسناد، منطبق با الگوی A1 (nextDocumentNo) ──
export async function nextDocumentNo(prefix = 'DV') {
  const rows = await all('documents');
  const numbers = rows
    .map((row) => String(row.doc_number || ''))
    .filter((value) => value.startsWith(prefix + '-'))
    .map((value) => Number(value.slice(prefix.length + 1)) || 0);
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${String(next).padStart(5, '0')}`;
}

// ── ثبت سند دوطرفه (منطق A1: توازن اتمیک) ──
// تحریر واقعی در v21Posting انجام می‌شود تا میز کار و صفحات دیگر یک موتور مشترک داشته باشند.
export async function postDocument(payload) {
  return writeTx(['documents', 'ledger_entries', 'audit_logs'], (handles) => postDocumentInTx(handles, payload));
}

// ── ابطال سند: سند معکوس، بدون حذف ردیف‌های اصلی (رفتار A1) ──
export async function reverseDocument(documentId, reason = '', registered_by = '') {
  return writeTx(['documents', 'ledger_entries', 'audit_logs'], (handles) => reverseDocumentInTx(handles, documentId, {
    reason: reason || 'ابطال سند',
    registeredBy: registered_by,
  }));
}

// ── محاسبهٔ مانده‌ها از ردیف‌های دفتر (بدون جدول ماندهٔ جدا) ──
export async function ledgerEntries({ includeDeleted = false } = {}) {
  const rows = await all('ledger_entries');
  return includeDeleted ? rows : rows.filter((row) => !row.deleted);
}

export async function balanceByAccountType(accountType) {
  const rows = await ledgerEntries();
  const map = new Map();
  rows
    .filter((row) => row.account_type === accountType)
    .forEach((row) => {
      const key = row.account_id || row.account_name;
      const current = map.get(key) || {
        account_id: row.account_id,
        account_name: row.account_name,
        currency: row.currency,
        debit: 0,
        credit: 0,
      };
      current.debit += Number(row.debit) || 0;
      current.credit += Number(row.credit) || 0;
      current.balance = current.debit - current.credit;
      map.set(key, current);
    });
  return Array.from(map.values());
}

export async function currencyBalances() {
  const rows = await ledgerEntries();
  const map = new Map();
  rows.forEach((row) => {
    const current = map.get(row.currency) || { currency: row.currency, debit: 0, credit: 0, balance: 0 };
    current.debit += Number(row.debit) || 0;
    current.credit += Number(row.credit) || 0;
    current.balance = current.debit - current.credit;
    map.set(row.currency, current);
  });
  return Array.from(map.values());
}