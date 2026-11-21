// src/core/reports/revenueForm.js — پیش‌نمایش فرم عواید نسخهٔ ۲۲
// این تابع فقط دادهٔ گزارش را اعتبارسنجی و آماده می‌کند؛ سند مالی را ثبت یا صندوق را تغییر نمی‌دهد.

export const REVENUE_POLICY = Object.freeze({
  scope: 'دامنهٔ عواید (فقط کمیشن یا همهٔ درآمدها)',
  document: 'شکل سند (مستقل یا داخل سند عملیات)',
  cash: 'اثر دریافت نقدی بر صندوق/بانک',
});

const COMMISSION_KINDS = new Set(['commission', 'exchange', 'transfer', 'fee', 'کمیشن', 'معامله', 'حواله']);
const blocked = (missing, errors = []) => ({ status: 'blocked', rows: [], totals: null, missing, errors });

function validISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildRevenueForm(entries = [], policy = null) {
  const missing = !policy
    ? Object.keys(REVENUE_POLICY)
    : Object.keys(REVENUE_POLICY).filter((key) => !policy[key]);
  if (missing.length) return blocked(missing.map((key) => REVENUE_POLICY[key]));
  if (!['all', 'commission'].includes(policy.scope)) return blocked(['سیاست دامنهٔ عواید معتبر'], ['REVENUE_SCOPE_INVALID']);
  if (!['separate', 'line'].includes(policy.document)) return blocked(['سیاست شکل سند معتبر'], ['REVENUE_DOCUMENT_INVALID']);
  if (!['yes', 'no'].includes(policy.cash)) return blocked(['سیاست دریافت نقدی معتبر'], ['REVENUE_CASH_INVALID']);
  if (!Array.isArray(entries) || entries.length === 0) return blocked(['عواید ثبت‌شده']);

  const selected = policy.scope === 'commission'
    ? entries.filter((entry) => COMMISSION_KINDS.has(String(entry?.kind || '').trim().toLowerCase()))
    : entries;
  if (selected.length === 0) return blocked(['عواید کمیشن ثبت‌شده']);

  const errors = [];
  const rows = selected.map((entry, index) => {
    const amount = Number(entry?.amount);
    const date = String(entry?.date || '');
    const currency = String(entry?.currency || policy.baseCurrency || 'AFN').trim().toUpperCase();
    const account = String(entry?.account || '4000').trim();
    const parentNumber = String(entry?.parentNumber || entry?.number || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) errors.push('مبلغ ردیف ' + (index + 1) + ' باید عدد مثبت و معتبر باشد');
    if (!validISODate(date)) errors.push('تاریخ ردیف ' + (index + 1) + ' معتبر نیست');
    if (!/^[A-Z]{3}$/.test(currency)) errors.push('کد ارز ردیف ' + (index + 1) + ' معتبر نیست');
    if (!/^\d{3,}$/.test(account)) errors.push('کد حساب عواید ردیف ' + (index + 1) + ' معتبر نیست');
    if (policy.document === 'line' && !parentNumber) errors.push('شمارهٔ سند عملیات ردیف ' + (index + 1) + ' موجود نیست');
    if (policy.cash === 'yes' && !String(entry?.cashAccount || '').trim()) errors.push('حساب صندوق یا بانک ردیف ' + (index + 1) + ' مشخص نشده است');

    return {
      date,
      kind: String(entry?.kind || ''),
      amount: Number.isFinite(amount) ? round2(amount) : 0,
      currency,
      account,
      cashAccount: String(entry?.cashAccount || ''),
      parentNumber,
      // شماره فقط برای پیش‌نمایش همین خروجی است و شمارهٔ سند ثبت‌شده محسوب نمی‌شود.
      docNumber: policy.document === 'separate' ? 'RV-' + String(index + 1).padStart(3, '0') : parentNumber,
      documentStatus: 'preview-only',
    };
  });

  if (errors.length) return blocked([], errors);

  const byCurrency = Object.entries(rows.reduce((totals, row) => {
    totals[row.currency] = (totals[row.currency] || 0) + row.amount;
    return totals;
  }, {})).map(([currency, amount]) => ({ currency, amount: round2(amount) }));

  return {
    status: 'ready',
    rows,
    // جمع کل فقط وقتی یک ارز وجود دارد نمایش داده می‌شود؛ ارزهای متفاوت هرگز با هم جمع نمی‌شوند.
    totals: {
      amount: byCurrency.length === 1 ? byCurrency[0].amount : null,
      byCurrency,
      count: rows.length,
    },
    policy,
    postingStatus: 'not-posted',
  };
}
