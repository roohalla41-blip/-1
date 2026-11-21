// src/core/gateway/memoryGateway.js — پیاده‌سازی حافظه‌ای درگاه داده (فقط برای دمو)
// هیچ ذخیره‌سازی پایدار (localStorage/IndexedDB/فایل) ندارد؛ با بارگذاری مجدد، دادهٔ اولیه برمی‌گردد.
// همین فایل نقطهٔ تعویض است: نسخهٔ واقعی فقط باید همین قرارداد را پیاده کند.
// دفتر کل، گزارش عملیات و مفاد و زیان مشتق هستند و از خود اسناد ساخته می‌شوند (core/domain/ledger).
import { GatewayError, createId, matchesQuery } from './contract.js';
import { isReversed, isCounterDocument, buildReversal } from '../domain/reversal.js';
import {
  POSTING_COLLECTIONS, MASTER_COLLECTIONS, COLLECTION_LABELS,
  deriveState, nextNumber,
} from '../domain/ledger.js';
import { todayISO } from '../domain/dates.js';

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

const LOGGED_COLLECTIONS = [...POSTING_COLLECTIONS, ...MASTER_COLLECTIONS];
const POSTING = new Set(POSTING_COLLECTIONS);
// دفتر کل، گزارش عملیات و مفاد و زیان مشتق‌اند؛ فقط خواندنی و همیشه از اسناد بازساخته می‌شوند
const DERIVED_COLLECTIONS = new Set(['ledger', 'reports', 'profitRows']);
const READ_ONLY_MESSAGE = 'دفتر کل، گزارش عملیات و مفاد و زیان از خود اسناد ساخته می‌شوند و مستقیم ویرایش نمی‌شوند.';

function assertWritable(collection) {
  if (DERIVED_COLLECTIONS.has(collection)) throw new GatewayError('READ_ONLY', READ_ONLY_MESSAGE);
}

function toState(source) {
  const state = {};
  Object.entries(source || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) state[key] = [...value];
    else if (value && typeof value === 'object') state[key] = { ...value };
    else state[key] = value;
  });
  return state;
}

const targetLabel = (collection, record) => record?.number || record?.name || record?.title || record?.code || record?.id;

export function createMemoryGateway({ seed = {}, idPrefix = 'm-' } = {}) {
  const initial = deriveState(toState(clone(seed)));
  let state = deriveState(toState(clone(seed)));
  let revision = 0;
  const listeners = new Set();

  const emit = () => {
    revision += 1;
    listeners.forEach((listener) => listener(state, revision));
  };

  const records = (collection) => (Array.isArray(state[collection]) ? state[collection] : []);

  const requireRecord = (collection, id) => {
    const found = records(collection).find((row) => row.id === id);
    if (!found) throw new GatewayError('NOT_FOUND', `رکورد ${id} در ${collection} پیدا نشد.`);
    return found;
  };

  const logEntry = (action, collection, record, extra = '') => ({
    id: createId(idPrefix),
    date: todayISO(),
    action,
    entity: COLLECTION_LABELS[collection] || collection,
    description: [
      action === 'create' ? 'ثبت' : action === 'update' ? 'ویرایش' : action === 'deactivate' ? 'غیرفعال‌سازی' : action === 'delete' ? 'حذف' : 'عملیات',
      COLLECTION_LABELS[collection] || collection,
      targetLabel(collection, record),
      extra,
    ].filter(Boolean).join(' '),
    status: 'موفق',
  });

  const commit = (nextState, log) => {
    const withLog = log
      ? { ...nextState, activity: [log, ...(Array.isArray(nextState.activity) ? nextState.activity : [])] }
      : nextState;
    state = deriveState(withLog);
    emit();
  };

  const gateway = {
    kind: 'memory',

    snapshot() { return state; },
    revision() { return revision; },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async list(collection, query = {}) {
      return records(collection).filter((row) => matchesQuery(row, query));
    },

    async get(collection, id) {
      return records(collection).find((row) => row.id === id) || null;
    },

    async count(collection, query = {}) {
      return (await gateway.list(collection, query)).length;
    },

    async create(collection, record) {
      assertWritable(collection);
      const docs = records(collection);
      const item = { ...record, id: record?.id || createId(idPrefix) };
      // سند مالی: شمارهٔ یکتا و وضعیت قطعی؛ دفتر کل و گزارش از همین سند ساخته می‌شود
      if (POSTING.has(collection)) {
        item.number = item.number || nextNumber(collection, docs);
        item.status = item.status || 'قطعی';
      }
      const nextState = { ...state, [collection]: [item, ...docs] };
      commit(nextState, LOGGED_COLLECTIONS.includes(collection) ? logEntry('create', collection, item) : null);
      return state[collection].find((row) => row.id === item.id) || item;
    },

    async update(collection, id, patch) {
      assertWritable(collection);
      const current = requireRecord(collection, id);
      // سند ابطال‌شده و سند معکوس قفل‌اند؛ اصلاح فقط با سند جدید ممکن است
      if (isReversed(current) || isCounterDocument(current)) {
        throw new GatewayError('LOCKED', 'سند ابطال‌شده یا سند معکوس قابل ویرایش نیست.');
      }
      const next = records(collection).map((row) => (row.id === id ? { ...row, ...patch, id } : row));
      const updated = next.find((row) => row.id === id);
      commit(
        { ...state, [collection]: next },
        LOGGED_COLLECTIONS.includes(collection) ? logEntry('update', collection, updated) : null
      );
      return state[collection].find((row) => row.id === id);
    },

    // غیرفعال‌سازی به‌جای حذف فیزیکی؛ سابقه و روابط حفظ می‌شود
    async deactivate(collection, id, patch) {
      const defaults = collection === 'currencies' ? { active: 'غیرفعال' } : { status: 'غیرفعال' };
      const next = await gateway.update(collection, id, { ...defaults, ...(patch || {}) });
      return next;
    },

    async remove(collection, id) {
      assertWritable(collection);
      if (POSTING.has(collection)) {
        throw new GatewayError('REVERSAL_REQUIRED', 'حذف فیزیکی سند مالی مجاز نیست؛ برای اصلاح یا لغو، سند معکوس با دلیل ثبت کنید.');
      }
      const current = requireRecord(collection, id);
      commit(
        { ...state, [collection]: records(collection).filter((row) => row.id !== id) },
        LOGGED_COLLECTIONS.includes(collection) ? logEntry('delete', collection, current) : null
      );
      return true;
    },

    // ابطال با سند معکوس: سند اصلی قفل، سند معکوس ثبت و سابقهٔ فعالیت به‌روز می‌شود
    async reverse(collection, id, reason) {
      const record = requireRecord(collection, id);
      const { counter, originalPatch } = buildReversal(collection, record, reason);
      const counterRecord = { ...counter, id: createId(idPrefix), number: counter.number || ('RV-' + (record.number || record.id)) };
      const next = records(collection).map((row) => (row.id === id ? { ...row, ...originalPatch } : row));
      const log = {
        id: createId(idPrefix),
        date: counterRecord.reversalDate || todayISO(),
        action: 'reverse',
        entity: COLLECTION_LABELS[collection] || collection,
        description: `${record.number || record.id} — ${counterRecord.reversalReason}`,
        status: 'موفق',
      };
      state = deriveState({
        ...state,
        [collection]: [counterRecord, ...next],
        activity: [log, ...(Array.isArray(state.activity) ? state.activity : [])],
      });
      emit();
      return { original: { ...record, ...originalPatch }, counter: counterRecord };
    },

    // جایگزینی کامل یک مجموعه (تنظیمات، گفت‌وگو، فهرست‌های مشتق)
    async replaceAll(collection, value) {
      assertWritable(collection);
      if (POSTING.has(collection)) {
        throw new GatewayError('REVERSAL_REQUIRED', 'جایگزینی گروهی اسناد مالی مجاز نیست؛ هر سند باید جداگانه و با ردپای حسابرسی اصلاح یا معکوس شود.');
      }
      state = deriveState({ ...state, [collection]: value });
      emit();
      return value;
    },

    async clearExcept(keep = []) {
      const next = {};
      Object.entries(state).forEach(([key, value]) => {
        next[key] = Array.isArray(value) && !keep.includes(key) ? [] : value;
      });
      state = deriveState(next);
      emit();
      return state;
    },

    async reset() {
      state = deriveState(toState(clone(initial)));
      emit();
      return state;
    },
  };

  return gateway;
}