// a1/pages/A1Workspace.jsx — میز کار واقعی نسخهٔ ۲۱
// انتقال مستقیم از reference/A1-extracted-source-temp/src/components/sarraaf/Version21Workspace.jsx
// چیدمان، نوار عنوان، منوها، نوار ابزار آیکونی، جدول‌ها، فرم‌ها و مودال‌ها حفظ شده‌اند.
// تنها تغییر: منبع داده و نوشتن از Supabase به لایهٔ محلی IndexedDB منتقل شده است.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home, Users, Wallet, BookOpen, BookText, Search, Printer, Plus, Pencil, Trash2,
  RefreshCw, Receipt, Landmark, Building2, Send, BarChart3, X, Check, ArrowLeftRight,
  ScrollText, MoreHorizontal, ChevronDown, Save, ClipboardList, FileSpreadsheet,
  Calculator, Download, Upload, Filter, Coins, Banknote, FileText, CalendarDays, MessageSquare, Bot,
  CircleDollarSign, Eye, FilePlus2, ArrowDownCircle, ArrowUpCircle, Scale, Settings2,
  Archive, RotateCcw, ListChecks, CreditCard, CircleHelp, PrinterCheck,
  Languages, ShoppingBag, Smartphone, Wifi, Gamepad2, MessagesSquare, Headphones,
  Settings, Vault, ArrowDown, ArrowUp, Info, User, Globe, ShoppingCart, LifeBuoy,
  ArrowRight, TrendingUp,
} from 'lucide-react';
import { getDesktopGateway } from '@/app/container';
import { CURRENCIES, SCHEMAS, POSTING_FORMS } from '@/core/registry/schemas';

// تنها راه دسترسی میزکار به داده: درگاه (آداپتر موتور محلی) — نه موتور به‌صورت مستقیم.
// نام‌های قبلی حفظ شده‌اند تا منطق صفحه و امضای فراخوانی‌ها بدون تغییر بماند.
const {
  load: loadVersion21Database,
  save: saveVersion21Record,
  edit: editVersion21Record,
  remove: deleteVersion21Record,
  deactivate: deactivateVersion21MasterRecord,
  reverse: reverseVersion21Record,
  loadForEdit: loadVersion21RecordForEdit,
  seedBaseAccounts: seedVersion21BaseAccounts,
  savePeriod: saveVersion21FiscalPeriod,
  closePeriod: closeVersion21FiscalPeriod,
  captureError: captureVersion21Error,
} = getDesktopGateway();
import { loadVersion21LocalState, saveVersion21LocalState } from '@/a1/lib/v21LocalStore';
import { saveDemoPreviewRecord, deleteDemoPreviewRecord } from '@/a1/lib/v21Demo';
import { hasPermission } from '@/a1/lib/permissions';
import { toPersianDigits, currencyLabel } from '@/a1/lib/format';
import SarraafLogo from '@/a1/components/SarraafLogo';
import LanguageSettings from '@/a1/components/LanguageSettings';
import { useAuth } from '@/a1/lib/demoAuth';
import { sumCashLedgerMovement, sumCashLedgerSide, sumBankLedgerMovement } from '@/a1/lib/v21Rules';
// موجودی صندوق از یک منبع واحد خوانده می‌شود تا این صفحه و دفتر کل و بانک یک عدد بدهند.
import { cashBalance, ledgerWithOpenings } from '@/core/domain/balances';
// منطق خالص گردش حساب طرفین؛ همان توابعی که دفتر حساب موبایل هم از آن‌ها استفاده می‌کند.
import { customerStatement, branchStatement, accountStatement } from '@/core/domain/statement';
// قرارداد پیوند حساب‌ها: از هر سطر و هر سند به حساب واقعی همان طرف می‌رسیم
import { lineAccountLink, documentAccountLinks, documentSource, ACCOUNT_KIND_LABELS } from '@/core/navigation/chain';
// سود معاملات اسعار — یک منبع برای داشبورد و گزارش مفاد
import { computeTradeProfit, buildRateMap } from '@/core/domain/tradeProfit';
import { Field, DataTable, Tile, formatTableDate } from '@/a1/components/v21/DataTable';
import HomeCenter from '@/a1/components/v21/HomeCenter';
import DailyRates from '@/a1/components/v21/DailyRates';
import LaptopHome from '@/a1/components/v21/LaptopHome';
import LedgerSummaryDock from '@/a1/components/v21/LedgerSummaryDock';
import LaptopTopChrome from '@/a1/components/v21/LaptopTopChrome';
import ExchangeBrandBar from '@/a1/components/v21/ExchangeBrandBar';
import { LAPTOP_SHORTCUTS } from '@/a1/components/v21/laptopHomeConfig';
import { useContactSettings, visibleContacts } from '@/a1/lib/contactSettings';
import ContactSettingsPanel from '@/a1/components/v21/ContactSettingsPanel';
import UsersAccessPanel from '@/a1/components/v21/access/UsersAccessPanel';
import RemittanceForm from '@/a1/components/v21/forms/RemittanceForm';
import ExpenseForm from '@/a1/components/v21/forms/ExpenseForm';
import ExchangeForm from '@/a1/components/v21/forms/ExchangeForm';
import JournalForm from '@/a1/components/v21/forms/JournalForm';
import SettlementForm from '@/a1/components/v21/forms/SettlementForm';
import ReversalDialog from '@/a1/components/v21/forms/ReversalDialog';
import RecordView from '@/a1/components/v21/RecordView';
import BankLedgerPanel from '@/a1/components/v21/BankLedgerPanel';
import { CORE_MODULES, CENTERS, NAV_GROUP_TITLES, moduleSection, modulePath } from '@/core/registry/modules';
import { moduleIcon } from '@/a1/components/v21/moduleIcons';
import BranchMobileBoard from '@/a1/components/v21/BranchMobileBoard';
import JalaliDateInput from '@/a1/components/v21/JalaliDateInput';
import PanelAuditPanel from '@/components/audit/PanelAuditPanel';
import LinkChainPanel from '@/components/audit/LinkChainPanel';
import FiscalPeriodsPanel from '@/a1/components/v21/FiscalPeriodsPanel';
// نوار یکپارچهٔ هر بخش: مدل مشترک با موبایل و یک نمای واحد برای همهٔ ۲۵ بخش
import SectionPage from '@/components/sections/SectionPage';
import TradeProfitSection from '@/components/sections/TradeProfitSection';
import BalanceSheetPanel from '@/components/sections/BalanceSheetPanel';
import { buildSectionPage } from '@/core/sections/sectionPage';
import MobileActionBar from '@/a1/components/v21/MobileActionBar';
import AdaptiveLayoutPanel from '@/a1/components/v21/AdaptiveLayoutPanel';
import useAdaptiveLayout from '@/a1/hooks/useAdaptiveLayout';
import { runVersion21DomainChecks } from '@/a1/lib/v21DomainTests';
import '@/a1/components/v21/legacy-responsive-layout.css';
import '@/a1/components/v21/legacy-laptop-reference.css';
// آخرین شیت: چیدمان لپ‌تاپ صفحات داخلی میز کار
import '@/a1/components/v21/laptop-chrome.css';
// آخرین شیت: تنها منبع تصمیم چیدمان (متغیرها و data-a1-* از موتور مرکزی)
import '@/a1/components/v21/adaptive-layout.css';

// فهرست بخش‌های میزکار فقط از رجیستری مرکزی ساخته می‌شود:
// شناسه، نام فارسی، گروه، ترتیب و آیکون یک منبع دارند و با موبایل و محیط آزمون یکی است.
const LINKED_CHILDREN = {
  sarraafGroups: ['گروه صرافان', 'ایجاد گروه', 'گفت‌وگوی گروهی', 'گفت‌وگوی خصوصی'],
  products: ['شارژ موبایل', 'بسته‌های اینترنت', 'UC پابجی موبایل'],
  language: ['فارسی', 'دری', 'English', 'العربية'],
};

const MODULES = CORE_MODULES.map((module) => ({
  ...module,
  icon: moduleIcon(module.id),
  linkedModule: module.kind === 'linked',
  ...(LINKED_CHILDREN[module.id] ? { children: LINKED_CHILDREN[module.id] } : {}),
}));

// مرکزهای مکمل (مرکز معاملات) — صفحه‌های مستقل و بیرون از شماره‌گذاری ۱ تا ۲۵
const CENTER_MODULES = CENTERS.map((center) => ({ ...center, icon: moduleIcon(center.id) }));

// (تعریف SCHEMAS به رجیستری مرکزی منتقل شد: src/core/registry/schemas.js)

// فرم‌ها و فیلدها از رجیستری مرکزی خوانده می‌شوند (src/core/registry).

const firstSafeName = (list, currency) => (list.find(item => item.currency === currency && item.status !== 'غیرفعال') || {}).name || '';

const POSTING_DEFAULTS = {
  remittance: data => ({
    settlement: 'suspense', settleType: 'cash',
    cash: firstSafeName(data.cash, 'AFN'), bank: '', direction: 'ارسالی',
  }),
  expenses: data => ({ payerType: 'cash', cash: firstSafeName(data.cash, 'AFN'), bank: '' }),
  exchange: data => ({
    kind: 'convert', foreignCurrency: 'USD', baseCurrency: 'AFN',
    foreignCash: firstSafeName(data.cash, 'USD'), baseCash: firstSafeName(data.cash, 'AFN'), fee: '',
  }),
  journal: data => ({
    journalMode: 'simple',
    rows: [{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }],
  }),
  settlement: data => {
    const safe = (data.cash || []).find(item => item.status !== 'غیرفعال' && item.currency === 'AFN')
      || (data.cash || []).find(item => item.status !== 'غیرفعال') || null;
    const bank = (data.banks || []).find(item => item.status !== 'غیرفعال' && item.currency === (safe?.currency || 'AFN')) || null;
    return {
      fromKind: 'cash', fromAccount: safe?.name || '',
      // مقصد پیش‌فرض حساب دیگری است تا دو طرف از ابتدا یکی نباشند.
      toKind: bank ? 'bank' : 'cash',
      toAccount: bank ? String(bank.id) : ((data.cash || []).find(item => item.status !== 'غیرفعال' && item.name !== safe?.name) || {}).name || '',
      settlementId: '', note: '',
    };
  },
};
const emptyInitial = () => ({ role: '', permissions: [], customers: [], branches: [], cash: [], banks: [], currencies: [], accounts: [], expenses: [], remittance: [], exchange: [], journal: [], ledger: [], transactions: [], reports: [], activity: [], errors: [], fiscalPeriods: [], profitByCurrency: [], profitAccounts: [], profitEntries: [], unclassifiedProfitLines: [] });
const today = () => new Date().toLocaleDateString('en-CA');
const n = v => Number(String(v ?? 0).replaceAll(',', '')) || 0;
const fmt = v => toPersianDigits(new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(n(v)));
// نرخ‌های کوچک (مثل تومان) با اعشار بیشتر نمایش داده می‌شوند تا صفر نشوند
const fmtRate = v => {
  const value = n(v);
  const abs = Math.abs(value);
  const digits = value === 0 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return toPersianDigits(new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(value));
};
// مبلغ بدهکار/بستانکار: علامت همیشه سمت چپ عدد با فاصلهٔ کم؛ سمتی که مبلغ ندارد خالی می‌ماند
const signedAmount = (value, side) => {
  const amount = n(value);
  if (!amount) return '';
  return (
    <span dir="ltr" className="inline-flex items-baseline gap-1">
      <span aria-hidden="true">{side === 'debit' ? '+' : '−'}</span>
      <span>{fmt(Math.abs(amount))}</span>
    </span>
  );
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fieldValue = (obj, key) => obj?.[key] ?? '';

// سند اصلی هر سطر دفتر کل/گزارش (بر اساس شمارهٔ سند) — برای ویرایش از مسیر سند اصلی
const LEDGER_SOURCES = ['journal', 'remittance', 'exchange', 'expenses', 'transactions'];
const findLedgerSource = (data, row) => {
  const number = row?.number;
  if (!number) return null;
  for (const module of LEDGER_SOURCES) {
    const record = (data[module] || []).find((item) => item.number === number);
    if (record) return { module, record };
  }
  return null;
};
// نگاشت سطرهای گردش حساب صندوق/بانک به شکل نمایشی جدول؛ همان شکل دفاتر مشتریان و نمایندگی‌ها
const statementRowsFor = (list) => list.map((row) => ({
  ...row.record,
  date: row.date, type: row.type, number: row.number, description: row.description,
  currency: row.currency, debit: row.debit, credit: row.credit,
  runningBalance: Math.abs(row.balance),
  runningSide: row.balance > 0 ? 'بدهکار' : row.balance < 0 ? 'بستانکار' : 'تسویه',
}));

const NAV_MENUS = [
  { label: 'فایل', items: [['پشتیبان‌گیری', 'backup'], ['بازیابی پشتیبان', 'restore'], ['چاپ صفحه', 'print'], ['پاک‌سازی نمای محلی', 'reset']] },
  { label: 'تعریف', items: [['مشتریان', 'customers'], ['نمایندگی‌ها', 'branches'], ['صندوق‌ها', 'cash'], ['بانک و چک', 'banks'], ['اسعار', 'currencies'], ['کدینگ حساب‌ها', 'accounts'], ['دوره‌های مالی', 'fiscalPeriods']] },
  { label: 'عملیات', items: [['دوره‌های مالی', 'fiscalPeriods'], ['انتقال بین حساب‌ها', 'settlement'], ['دخل صندوق', 'cashIn'], ['خرج صندوق', 'cashOut'], ['خرید و فروش اسعار', 'exchange'], ['نرخ روز', 'rates'], ['ثبت حواله', 'remittance'], ['ثبت مصرف', 'expenses'], ['مرکز معاملات', 'transactions']] },
  { label: 'حسابات', items: [['روزنامچه', 'journal'], ['دفتر کل', 'ledger'], ['حساب مشتریان', 'customerLedger'], ['حساب نمایندگی‌ها', 'branchLedger'], ['بدهکاران و بستانکاران', 'debtors']] },
  { label: 'گزارشات', items: [['گزارش عملیات روز', 'reports'], ['مفاد و زیان', 'profit'], ['بیلانس عمومی', 'balance'], ['سوابق فعالیت', 'activity'], ['گزارش خطاها', 'errors']] },
  { label: 'تنظیمات', items: [['تنظیمات محلی', 'settings'], ['انتخاب زبان', 'language'], ['پشتیبانی', 'support'], ['راهنما', 'help']] },
  { label: 'امکانات تکمیلی', items: [['گروه و چت', 'sarraafGroups'], ['محصولات آنلاین', 'products'], ['هوش مصنوعی', 'assistant']] },
];
const LAPTOP_NAV_MENUS = NAV_MENUS.map(menu => (menu.label === 'فایل' ? { ...menu, items: menu.items.filter(([, action]) => action !== 'print') } : menu));
// فهرست میان‌برهای لپ‌تاپ فقط یک منبع دارد (laptopHomeConfig) تا فهرست‌های تکراری از هم جدا نشوند.
const LAPTOP_TOOLBAR = LAPTOP_SHORTCUTS;
// میان‌برهای ردیف آیکونی نمای موبایل و تبلت
const MOBILE_ICON_IDS = ['home', 'language', 'products', 'assistant', 'sarraafGroups', 'journal', 'expenses', 'exchange', 'cash', 'remittance', 'banks', 'branchLedger', 'customers', 'branches', 'customerLedger'];
// صفحهٔ دوره‌های مالی بیرون از شماره‌گذاری ۱ تا ۲۵ است اما مثل بقیهٔ بخش‌ها نشانی و صفحهٔ مستقل دارد.
const FISCAL_SECTION = { id: 'fiscalPeriods', label: 'دوره‌های مالی', icon: CalendarDays };
const isKnownSection = id => id === FISCAL_SECTION.id || MODULES.some(module => module.id === id);

export default function A1Workspace() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { space: layoutSpace, layout } = useAdaptiveLayout();
  const desktopChrome = layout.chrome === 'desktop';
  const [contactSettings] = useContactSettings();
  const contacts = visibleContacts(contactSettings);
  const [data, setData] = useState(emptyInitial);
  const [localReady, setLocalReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState('loading');
  const [dbError, setDbError] = useState('');
  const [localPreview, setLocalPreview] = useState(false);
  const [exchangeProfile, setExchangeProfile] = useState(null);
  const [lastLoaded, setLastLoaded] = useState(null);
  const readOnly = Boolean(authUser?.is_v22_remote_session);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedModule = searchParams.get('module');
  const [active, setActive] = useState(() => (isKnownSection(requestedModule) ? requestedModule : 'home'));
  // آخرین بخش باز‌شده، برای مقایسه با نشانی صفحه بدون افزودن به وابستگی افکت‌ها
  const activeRef = useRef(active);
  activeRef.current = active;
  // انتخاب ردیف هر بخش جداگانه نگه داشته می‌شود تا با جابه‌جایی میان تب‌ها از دست نرود
  const [selectedByModule, setSelectedByModule] = useState({});
  const [menu, setMenu] = useState('');
  const [modal, setModal] = useState('');
  // تب داخل پنجرهٔ تنظیمات لپ‌تاپ: تنظیمات صرافی یا مدیریت کاربران و دسترسی‌ها
  const [settingsTab, setSettingsTab] = useState('exchange');
  const [draft, setDraft] = useState({});
  // جستجوی هر بخش هم مستقل ذخیره می‌شود؛ بازگشت به هر بخش، متن جستجو را برمی‌گرداند
  const [queryByModule, setQueryByModule] = useState({});
  const query = queryByModule[active] || '';
  const selected = selectedByModule[active] || null;
  const setQuery = value => setQueryByModule(prev => ({ ...prev, [active]: value }));
  const setSelected = value => setSelectedByModule(prev => ({
    ...prev,
    [active]: typeof value === 'function' ? value(prev[active] || null) : value,
  }));
  const [notice, setNotice] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('همه');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [restoreText, setRestoreText] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [branchDetail, setBranchDetail] = useState(null);
  const [bankDetail, setBankDetail] = useState(null);
  const [cashDetail, setCashDetail] = useState(null);
  const [reversal, setReversal] = useState(null);
  const [reversalSaving, setReversalSaving] = useState(false);
  const [domainReport, setDomainReport] = useState(null);
  const [viewing, setViewing] = useState(null);
  // فیلتر حساب کدینگ در دفتر کل: از کدینگ حساب‌ها و مفاد معاملات به سطرهای همان حساب می‌رسیم
  const [ledgerAccount, setLedgerAccount] = useState(null);
  const moduleHistory = useRef([]);
  const previousModule = useRef(active);
  // حساب مقصد وقتی از یک سند یا سطر دفتر کل باز می‌شود؛ تا افکت تغییر بخش آن را پاک نکند
  const pendingAccount = useRef(null);
  // بخشی که کاربر از آن به حساب رسیده است؛ دکمهٔ بازگشت، همان‌جا برمی‌گردد نه به فهرست حساب‌ها
  const accountOrigin = useRef(null);
  // نشانهٔ بخش مبدأ فقط برای همان بارِ باز کردن حساب معتبر است؛ با هر رفتن دیگری پاک می‌شود
  const accountOriginPending = useRef(false);

  useEffect(() => {
    if (previousModule.current === active) return;
    moduleHistory.current.push(previousModule.current);
    if (moduleHistory.current.length > 20) moduleHistory.current.shift();
    previousModule.current = active;
  }, [active]);

  useEffect(() => {
    const target = isKnownSection(requestedModule) ? requestedModule : 'home';
    // نشانی صفحه و بخش باز‌شده با هم نوشته می‌شوند؛ اگر هر دو یکی باشند کاری لازم نیست
    // تا رفتن به حساب یک طرف از درون یک صفحه، همان صفحه را از نو باز نکند.
    if (target === activeRef.current) return;
    setActive(target);
    // نشانی صفحه یک گام دیرتر از کلیک نوشته می‌شود؛ اگر همین حالا حساب همان مشتری/نمایندگی
    // از یک سند یا سطر دفتر کل باز شده باشد، نباید با این هم‌گام‌سازی پاک شود.
    setCustomerDetail(current => (target === 'customerLedger' ? current : null));
    setBranchDetail(current => (target === 'branchLedger' ? current : null));
  }, [requestedModule]);

  // بخش باز‌شده در نشانی هم نوشته می‌شود تا نشانهٔ منو، تازه‌سازی صفحه و بازگشت مرورگر
  // همیشه همان بخشی را نشان دهند که روی صفحه دیده می‌شود.
  useEffect(() => {
    const current = searchParams.get('module') || '';
    const next = active === 'home' ? '' : active;
    if (current === next) return;
    const params = new URLSearchParams(searchParams);
    if (next) params.set('module', next); else params.delete('module');
    setSearchParams(params, { replace: true });
  }, [active]);

  // با تغییر بخش، صفحهٔ اختصاصی حساب بسته می‌شود تا فهرست تازه باز شود؛
  // مگر اینکه همین تغییر برای باز کردن همان حساب از یک سند یا سطر دفتر کل باشد.
  // حساب مقصد همین‌جا دوباره نشانده می‌شود تا هیچ افکت دیگری آن را پاک نکند.
  useEffect(() => {
    const pending = pendingAccount.current;
    pendingAccount.current = null;
    // تغییر بخش از راه منو یا هر مسیر دیگری، نشانهٔ بخش مبدأ حساب قبلی را باطل می‌کند
    // تا دکمهٔ بازگشت کاربر را به بخشی بی‌ربط نبرد.
    if (!accountOriginPending.current) accountOrigin.current = null;
    accountOriginPending.current = false;
    if (pending?.kind === 'customer') { setBranchDetail(null); setCustomerDetail(pending.record); return; }
    if (pending?.kind === 'branch') { setCustomerDetail(null); setBranchDetail(pending.record); return; }
    setBankDetail(pending?.kind === 'bank' ? pending.record : null);
    setCashDetail(pending?.kind === 'cash' ? pending.record : null);
  }, [active]);

  // باز کردن گردش حساب واقعی از هر جای برنامه (دفتر کل، جزئیات سند، طرف مقابل معامله)
  const openAccountTarget = (kind, record) => {
    if (!kind || !record) return;
    const targetModule = kind === 'customer' ? 'customerLedger' : kind === 'branch' ? 'branchLedger' : kind === 'cash' ? 'cash' : kind === 'chart' ? 'ledger' : 'banks';
    // مبدأ بازگشت، همان مرحله‌ای است که کاربر از آن آمده: بخش، حسابِ بازِ آن بخش
    // و پنجرهٔ جزئیاتی که باز بود؛ بازگشت این سه را با هم برمی‌گرداند، نه فقط نام بخش را.
    const origin = active && active !== targetModule
      ? {
        module: active,
        account: customerDetail ? { kind: 'customer', record: customerDetail }
          : branchDetail ? { kind: 'branch', record: branchDetail }
            : cashDetail ? { kind: 'cash', record: cashDetail }
              : bankDetail ? { kind: 'bank', record: bankDetail } : null,
        viewing: viewing || null,
      }
      : null;
    accountOrigin.current = origin;
    accountOriginPending.current = Boolean(origin);
    setViewing(null);
    setSelected(null);
    // حساب مقصد فقط وقتی «در انتظار» می‌ماند که بخش هم عوض شود؛ وگرنه همان لحظه نشانده می‌شود
    // تا انتخاب کهنه در رفتن بعدی به دفتر حساب دوباره اعمال نشود.
    if (kind === 'customer') { pendingAccount.current = active === 'customerLedger' ? null : { kind, record }; setBranchDetail(null); setCustomerDetail(record); setActive('customerLedger'); return; }
    if (kind === 'branch') { pendingAccount.current = active === 'branchLedger' ? null : { kind, record }; setCustomerDetail(null); setBranchDetail(record); setActive('branchLedger'); return; }
    if (kind === 'cash') { pendingAccount.current = { kind, record }; setActive('cash'); return; }
    if (kind === 'bank') { pendingAccount.current = { kind, record }; setActive('banks'); }
    // حساب کدینگ: سطرهای همان حساب در دفتر کل فیلتر می‌شوند و دکمهٔ بازگشت همان بخش قبلی را برمی‌گرداند
    if (kind === 'chart') { setLedgerAccount(record); setActive('ledger'); }
  };

  // بازگشت یک‌مرحله‌ای: حساب بازشده از سند یا دفتر کل، کاربر را به همان صفحه و همان پنجرهٔ جزئیات برمی‌گرداند
  const backFromAccount = () => {
    const origin = accountOrigin.current;
    accountOrigin.current = null;
    setLedgerAccount(null);
    setBankDetail(null);
    setCashDetail(null);
    setCustomerDetail(null);
    setBranchDetail(null);
    setSelected(null);
    if (!origin) return;
    // نشانهٔ قدیمی فقط نام بخش را داشت؛ هر دو شکل پشتیبانی می‌شوند.
    const originModule = typeof origin === 'string' ? origin : origin.module;
    previousModule.current = originModule;
    if (moduleHistory.current[moduleHistory.current.length - 1] === originModule) moduleHistory.current.pop();
    // حسابِ بازِ همان بخش و پنجرهٔ جزئیاتی که کاربر از آن آمده بود، دوباره نشانده می‌شوند
    pendingAccount.current = (typeof origin === 'object' && origin.account) || null;
    setActive(originModule);
    if (typeof origin === 'object' && origin.viewing) setViewing(origin.viewing);
  };

  // پیوندهای حساب یک رکورد: حساب خودش و طرف مقابل همان سند
  const accountLinksOf = (record, exclude) => {
    if (!record) return [];
    const links = [];
    // رکورد یک طرف حساب/صندوق/بانک: پیوند به گردش حساب خودش، نه به یک حساب کدینگ دیگر.
    const ownerKind = { customers: 'customer', origins: 'branch', safes: 'cash', bank_accounts: 'bank' }[record._sourceTable];
    if (ownerKind) {
      links.push({
        key: 'owner::' + ownerKind + '::' + record.id,
        kind: ownerKind,
        recordId: record.id,
        label: (ACCOUNT_KIND_LABELS[ownerKind] || 'حساب') + ' · ' + (record.name || record.bank_name || record.code || ''),
        meta: 'گردش حساب',
        onClick: () => openAccountTarget(ownerKind, record),
      });
    }
    // حساب کدینگ (حساب‌های درآمد/مصرف/دارایی و سطرهای مفاد): پیوند مستقیم به سطرهای دفتر کل همان حساب.
    // فقط سطر واقعی دفتر همان حساب‌ها این پیوند را می‌گیرد؛ وجود «کد» در هر رکوردی ملاک نیست
    // وگرنه رکورد مشتری با شناسهٔ عددی‌اش به حساب ۱۰۰۰ (دارایی‌ها) وصل می‌شد.
    const chartLine = ['suspense', 'revenue', 'expense', 'asset', 'liability', 'equity'].includes(String(record.accountType || '').toLowerCase());
    const chartRow = !record.documentId && chartLine
      ? (data.accounts || []).find(account => record.accountId && String(account.id) === String(record.accountId))
        || (data.accounts || []).find(account => String(account.code) === String(record.code))
      : null;
    if (chartRow) {
      links.push({
        key: 'chart::' + chartRow.id,
        kind: 'chart',
        recordId: chartRow.id,
        label: 'حساب کدینگ · ' + [chartRow.code, chartRow.name].filter(Boolean).join(' '),
        meta: 'گردش حساب',
        onClick: () => openAccountTarget('chart', chartRow),
      });
    }
    const own = lineAccountLink(data, record);
    const others = documentAccountLinks(data, record.documentId)
      .filter(item => !own || item.kind !== own.kind || String(item.record.id) !== String(own.record.id))
      .filter(item => !exclude || item.kind !== exclude.kind || String(item.record.id) !== String(exclude.record.id));
    const push = (item, meta) => links.push({
      key: item.kind + '::' + item.record.id + '::' + meta,
      kind: item.kind,
      recordId: item.record.id,
      label: (ACCOUNT_KIND_LABELS[item.kind] || 'حساب') + ' · ' + item.label,
      meta,
      onClick: () => openAccountTarget(item.kind, item.record),
    });
    if (own) push(own, 'گردش حساب');
    others.slice(0, 3).forEach(item => push(item, 'طرف مقابل'));
    return links;
  };

  // رکورد مبدأ: از سطر دفتر کل یا هر رکورد سنددار به حواله/معامله/مصرف/روزنامچهٔ سازندهٔ همان سند
  const sourceLinksOf = (record, moduleId) => {
    const source = documentSource(data, record?.documentId, record?.number);
    if (!source) return [];
    const viewModule = source.moduleId === 'reports' ? 'transactions' : source.moduleId;
    // اگر همین حالا خودِ رکورد مبدأ باز است، پیوند تکراری به خودش ساخته نمی‌شود.
    const sameView = moduleId === viewModule || (viewModule === 'transactions' && moduleId === 'reports');
    if (sameView && String(source.record.id) === String(record?.id)) return [];
    return [{
      key: 'source::' + viewModule + '::' + source.record.id,
      label: 'منبع سند · ' + [source.label, source.number].filter(Boolean).join(' '),
      meta: 'رکورد مبدأ',
      onClick: () => setViewing({ module: viewModule, record: source.record }),
    }];
  };

  // سطرهای نوار بخش: هر سطر به سند یا حساب واقعی خودش می‌رسد.
  // پیش‌تر این سطرها فقط نمایشی بودند و کلیک روی شمارهٔ سند هیچ جزئیاتی باز نمی‌کرد.
  const openSectionRow = row => {
    if (!row) return;
    if (row.documentId || row.number) {
      const source = documentSource(data, row.documentId, row.number);
      if (source) {
        setViewing({ module: source.moduleId === 'reports' ? 'transactions' : source.moduleId, record: source.record });
        return;
      }
      const line = (data.ledger || []).find(item => String(item.id) === String(row.id));
      if (line) { setViewing({ module: 'ledger', record: line }); return; }
    }
    const owner = [
      ['customer', data.customers],
      ['branch', data.branches],
      ['cash', data.cash],
      ['bank', data.banks],
    ].map(([kind, list]) => ({ kind, record: (list || []).find(item => String(item.id) === String(row.id)) }))
      .find(item => item.record);
    if (owner) openAccountTarget(owner.kind, owner.record);
  };

  useEffect(() => {
    if (!modal) return;
    const closeOnEscape = event => {
      if (event.key === 'Escape' && !saving) { setModal(''); setDraft({}); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [modal, saving]);

  useEffect(() => {
    let alive = true;
    loadVersion21LocalState().then(saved => {
      if (!alive) return;
      // میز کار همیشه باز است؛ فقط انتخاب کاربر (آیکون یا منو) بخش را تغییر می‌دهد
      if (saved.filterCurrency) setFilterCurrency(saved.filterCurrency);
      if (saved.dateFrom) setDateFrom(saved.dateFrom);
      if (saved.dateTo) setDateTo(saved.dateTo);
      setLocalReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!localReady) return;
    saveVersion21LocalState({ filterCurrency, dateFrom, dateTo });
  }, [localReady, filterCurrency, dateFrom, dateTo]);

  // بخش مجوز هر ماژول از رجیستری مرکزی خوانده می‌شود؛ همان قاعده‌ای که موبایل هم استفاده می‌کند.
  const isEmployee = data.role === 'employee';
  const canViewModule = id => !isEmployee || hasPermission(data.permissions, moduleSection(id), 'view');
  // انتقال بین حساب‌ها از مجوز همان بخش صندوق و بانک پیروی می‌کند.
  const canModuleAction = (id, action) => !isEmployee || hasPermission(data.permissions, moduleSection(id === 'settlement' ? 'cash' : id), action);

  useEffect(() => {
    if (dbStatus === 'connected' && isEmployee && !canViewModule(active)) {
      const fallback = MODULES.find(m => canViewModule(m.id));
      setActive(fallback?.id || 'home');
      setSelected(null);
    }
  }, [dbStatus, isEmployee, data.permissions, active]);

  const notify = s => {
    const message = String(s ?? '');
    const tone = /انجام نشد|ناموفق|خطا|معتبر نیست|فعال نیست|مجوز کافی ندارید|عملیات متوقف شد|پیدا نشد/.test(message) ? 'error'
      : /هشدار|ناقص|پیگیری|بررسی کنید/.test(message) ? 'warning'
        : /ثبت شد|ایجاد شد|آماده شد|بارگذاری شد|غیرفعال شد|حذف شد|ابطال شد|پاک شد|عملیات انجام شد/.test(message) ? 'success' : 'info';
    setNotice({ message, tone });
    setTimeout(() => setNotice(current => (current?.message === message ? '' : current)), 4500);
  };

  const refreshDatabase = async () => {
    setDbStatus('loading'); setDbError('');
    try {
      const result = await loadVersion21Database({ forceRefresh: true });
      setData(result.data); setExchangeProfile(result.exchange); setLastLoaded(result.loadedAt);
      setDbStatus('connected'); setLocalPreview(false);
      setSelected(null); setCustomerDetail(null); setBranchDetail(null);
      notify('اطلاعات واقعی دیتابیس دوباره بارگذاری شد.');
    } catch (error) {
      setDbStatus('error');
      setDbError(error?.message || 'اتصال به دیتابیس ناموفق بود.');
      captureVersion21Error(error, 'loadDatabase');
    }
  };

  useEffect(() => {
    let activeRequest = true;
    (async () => {
      try {
        const result = await loadVersion21Database();
        if (!activeRequest) return;
        setData(result.data); setExchangeProfile(result.exchange); setLastLoaded(result.loadedAt);
        setDbStatus('connected'); setLocalPreview(false);
      } catch (error) {
        if (!activeRequest) return;
        setDbStatus('error');
        setDbError(error?.message || 'اتصال به دیتابیس ناموفق بود.');
      }
    })();
    return () => { activeRequest = false; };
  }, []);

  const page = (active === FISCAL_SECTION.id ? FISCAL_SECTION : MODULES.find(x => x.id === active)) || MODULES[0];
  const schema = SCHEMAS[active];
  // مدل یکپارچهٔ همین بخش: شاخص‌ها و بلوک‌های مرتبط، از همان دادهٔ محلی
  const sectionModel = useMemo(
    () => buildSectionPage(active, data, { fmt, currencyLabel }),
    [active, data],
  );

  const rows = useMemo(() => {
    let source = data[active] || [];
    // دفتر حساب مشتری: سطرهای دفتر کلِ پیوندخورده با شناسهٔ همین مشتری (مرجع مشترک با موبایل)
    if (active === 'customerLedger') source = customerDetail
      ? customerStatement(data, customerDetail).rows.map(row => ({
        ...row.record,
        date: row.date, type: row.type, number: row.number, description: row.description,
        currency: row.currency, debit: row.debit, credit: row.credit,
        runningBalance: Math.abs(row.balance),
        runningSide: row.balance > 0 ? 'بدهکار' : row.balance < 0 ? 'بستانکار' : 'تسویه',
      }))
      : data.customers;
    // دفتر حساب نمایندگی: همان سطرهای دفتر کلِ پیوندخورده با شناسهٔ نمایندگی (مرجع مشترک با موبایل)
    if (active === 'branchLedger') source = branchDetail
      ? branchStatement(data, branchDetail).rows.map(row => ({
        ...row.record,
        date: row.date, type: row.type, number: row.number, description: row.description,
        currency: row.currency, debit: row.debit, credit: row.credit,
        runningBalance: Math.abs(row.balance),
        runningSide: row.balance > 0 ? 'بدهکار' : row.balance < 0 ? 'بستانکار' : 'تسویه',
      }))
      : data.branches;
    // گردش حساب صندوق و بانک: ردیف فهرست، صفحهٔ اختصاصی همان حساب را باز می‌کند
    if (active === 'banks') source = bankDetail ? statementRowsFor(accountStatement(data, bankDetail, 'bank').rows) : data.banks;
    if (active === 'cash') source = cashDetail ? statementRowsFor(accountStatement(data, cashDetail, 'cash').rows) : data.cash;
    // دفتر کل: حرکت اسناد به‌همراه سطر «ماندهٔ افتتاحیه» هر صندوق و بانک،
    // وگرنه جمع دفتر کل از موجودی صندوق به اندازهٔ ماندهٔ افتتاحیه عقب می‌ماند.
    if (active === 'ledger') {
      // سطرهای ماندهٔ افتتاحیه از همان منبع مشترک اضافه می‌شوند تا جمع دفتر کل با موجودی صندوق‌ها یکی بماند.
      source = ledgerWithOpenings(data);
      // فیلتر حساب کدینگ: فقط سطرهای همان حساب، برای رسیدن از حساب به گردش خودش و بازگشت
      if (ledgerAccount) {
        source = source.filter(row => String(row.accountId || '') === String(ledgerAccount.id)
          || String(row.account || '') === String(ledgerAccount.name || ''));
      }
    }
    if (active === 'reports') source = data.reports || [];
    const demoModule = active === 'customerLedger' ? (customerDetail ? 'transactions' : 'customers') : active === 'branchLedger' ? (branchDetail ? 'transactions' : 'branches') : active;
    const demoRows = (data.demoPreviewRecords || []).filter(r => {
      if (r.module_key !== demoModule) return false;
      if (active === 'customerLedger' && customerDetail) return r.payload?.party === customerDetail.name;
      if (active === 'branchLedger' && branchDetail) return r.payload?.party === branchDetail.name;
      if (active === 'banks' && bankDetail) return false;
      if (active === 'cash' && cashDetail) return false;
      return true;
    }).map(r => ({
      ...(r.payload || {}), id: 'demo-' + r.id, _demoRecordId: r.id, _demoModule: r.module_key,
      _demoPreview: true, _demoFixed: r.record_kind === 'sample',
    }));
    source = [...source, ...demoRows];
    const q = query.trim().toLowerCase();
    // ترتیب همان قاعدهٔ سایر فهرست‌ها: جدیدترین تاریخ بالا و هم‌تاریخ‌ها بر پایهٔ شمارهٔ سند؛
    // رکورد نمایشی تازه هم با همین قاعده جای خودش را پیدا می‌کند، نه ته فهرست.
    const docNo = row => Number(String(row.number || '').replace(/^\D+/, '')) || 0;
    return source
      .filter(r => (!q || Object.values(r).join(' ').toLowerCase().includes(q)) && (filterCurrency === 'همه' || !r.currency || r.currency === filterCurrency) && (!dateFrom || !r.date || r.date >= dateFrom) && (!dateTo || !r.date || r.date <= dateTo))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || docNo(b) - docNo(a));
  }, [data, active, customerDetail, branchDetail, bankDetail, cashDetail, query, filterCurrency, dateFrom, dateTo, ledgerAccount]);

  const profitReport = useMemo(() => {
    const totals = new Map(), accounts = new Map();
    (data.profitEntries || []).filter(x => (!dateFrom || !x.date || x.date >= dateFrom) && (!dateTo || !x.date || x.date <= dateTo) && (filterCurrency === 'همه' || x.currency === filterCurrency)).forEach(x => {
      const currency = x.currency || 'AFN';
      const t = totals.get(currency) || { currency, revenue: 0, expense: 0, net: 0, lineCount: 0 };
      if (x.accountType === 'revenue') t.revenue += n(x.amount); else if (x.accountType === 'expense') t.expense += n(x.amount);
      t.net = t.revenue - t.expense; t.lineCount += 1; totals.set(currency, t);
      const key = x.accountId + '::' + currency;
      const row = accounts.get(key) || { accountId: x.accountId, code: x.code, account: x.account, accountType: x.accountType, currency, amount: 0, lineCount: 0 };
      row.amount += n(x.amount); row.lineCount += 1; accounts.set(key, row);
    });
    const byCurrency = [...totals.values()].sort((x, y) => x.currency.localeCompare(y.currency));
    // جمع کل فقط به ارز پایه معنا دارد: جمع عددی چند ارز مختلف در یک سلول، عدد بی‌معنا می‌داد.
    const rateInfo = buildRateMap(data.currencies, 'AFN');
    const base = { currency: rateInfo.base, revenue: 0, expense: 0, net: 0 };
    const baseMissing = [];
    byCurrency.forEach(row => {
      const rate = rateInfo.rates.get(String(row.currency).toUpperCase());
      if (!rate) { baseMissing.push(row.currency); return; }
      base.revenue += n(row.revenue) * rate;
      base.expense += n(row.expense) * rate;
    });
    base.net = base.revenue - base.expense;
    return {
      byCurrency,
      base,
      baseMissing,
      accounts: [...accounts.values()].sort((x, y) => x.accountType.localeCompare(y.accountType) || x.account.localeCompare(y.account)),
    };
  }, [data.profitEntries, data.currencies, dateFrom, dateTo, filterCurrency]);
  const profitUnclassified = (data.unclassifiedProfitLines || []).filter(x => (!dateFrom || !x.date || x.date >= dateFrom) && (!dateTo || !x.date || x.date <= dateTo) && (filterCurrency === 'همه' || x.currency === filterCurrency));
  // جدول بخش مفاد همان تفکیک حساب‌های درآمد و مصرف است تا پیام «موردی برای نمایش نیست»
  // با داده‌های پایین همان صفحه در تناقض نباشد.
  const tableRows = active === 'profit'
    ? profitReport.accounts.map(row => ({ ...row, id: row.accountId + '::' + row.currency }))
    : rows;

  // جمع سود معاملات اسعار از همان ماژول محاسباتی؛ کارت داشبورد همین عدد را نشان می‌دهد.
  // موجودی آغازین صندوق‌های ارزی هم وارد بهای تمام‌شده می‌شود.
  const tradeProfit = useMemo(
    () => computeTradeProfit({
      trades: data.exchange || [],
      currencies: data.currencies || [],
      remittances: data.remittance || [],
      openings: (data.cash || []).map(row => ({
        currency: row.currency || 'AFN',
        amount: n(row.opening),
        value: n(row.openingValue ?? row.opening_value),
      })),
    }).totals,
    [data.exchange, data.currencies, data.remittance, data.cash],
  );

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v, ...(k === 'accountType' && !d.id ? { nature: ['revenue', 'liability', 'equity'].includes(v) ? 'بستانکار' : 'بدهکار' } : {}) }));

  const defaultDraft = module => {
    const sc = SCHEMAS[module];
    const base = Object.fromEntries((sc?.fields || []).map(([k, , type, opts]) => [k, type === 'date' ? today() : type === 'select' ? (typeof opts?.[0] === 'object' ? (opts[0].value ?? '') : (opts?.[0] ?? '')) : '']));
    return { ...base, date: today(), currency: 'AFN', ...(POSTING_DEFAULTS[module] ? POSTING_DEFAULTS[module](data) : {}) };
  };

  // ورود یکسان به فرم روزنامچه: هم دکمهٔ «ثبت» پایین صفحه و هم دکمهٔ داخل فهرست روزنامچه
  // از همین مسیر باز می‌شوند تا هیچ‌کدام بی‌اثر نماند.
  const openJournalForm = () => {
    if (readOnly) { notify('ثبت اطلاعات در این حساب فعال نیست.'); return; }
    if (!canModuleAction('journal', 'create')) { notify('مجوز ثبت سند روزنامچه برای حساب شما فعال نیست.'); return; }
    setDraft(defaultDraft('journal'));
    setSelected(null);
    setModal('journal');
  };

  const openNew = (module = active, extra = {}) => {
    if (module === 'journal' && !Object.keys(extra).length) { openJournalForm(); return; }
    if (readOnly) { notify('ثبت اطلاعات در این حساب فعال نیست.'); return; }
    if (!canModuleAction(module, 'create')) { notify('مجوز ثبت اطلاعات در این بخش برای حساب شما فعال نیست.'); return; }
    setActive(module);
    setDraft({ ...defaultDraft(module), ...extra });
    setSelected(null);
    setModal(module);
  };

  // overrides: مقادیری که فرم در همان لحظهٔ ثبت می‌فرستد (مثل سطرهای روزنامچه) تا ثبت هرگز پیش‌نویس قدیمی نگیرد
  const saveRecord = async (keepOpen = false, overrides = null) => {
    if (readOnly) { notify('ثبت اطلاعات در این حساب فعال نیست.'); return; }
    const mod = modal;
    if (!SCHEMAS[mod] || saving) return;
    if (!canModuleAction(mod, draft?.id ? 'edit' : 'create')) { notify('برای این عملیات مجوز کافی ندارید.'); return; }
    if (dbStatus !== 'connected' || localPreview) { notify('برای جلوگیری از ثبت روی داده اشتباه، ابتدا اطلاعات واقعی همین صراف را تازه‌سازی کنید.'); return; }
    setSaving(true);
    const merged = overrides && typeof overrides === 'object' ? { ...draft, ...overrides } : draft;
    const payload = { ...merged, clientOperationId: merged.clientOperationId || (globalThis.crypto?.randomUUID?.() || ('v21-' + Date.now() + '-' + Math.random().toString(36).slice(2))) };
    setDraft(payload);
    try {
      const result = data.isDemoAccount
        ? await saveDemoPreviewRecord(mod, payload, payload._demoRecordId || null)
        : (payload.id ? await editVersion21Record(mod, payload) : await saveVersion21Record(mod, payload));
      if (keepOpen) {
        setDraft(defaultDraft(mod));
      } else {
        setModal(''); setDraft({});
      }
      await refreshDatabase();
      setSelected(null);
      notify(result?.warning || result?.auditWarning
        ? (data.isDemoAccount ? 'عملیات آزمایشی انجام شد؛ ' : 'عملیات در دیتابیس ثبت شد؛ ') + (result.warning || result.auditWarning)
        : data.isDemoAccount ? 'رکورد موقت در فضای آزمایشی همین حساب ذخیره شد.' : 'اطلاعات در دیتابیس همین صراف ثبت شد.');
    } catch (error) {
      await captureVersion21Error(error, 'save:' + mod);
      setDbError(error?.message || 'ثبت اطلاعات ناموفق بود.');
      notify('ثبت انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  const addTransaction = tx => setData(d => ({ ...d, transactions: [{ id: uid(), date: today(), ...tx }, ...d.transactions] }));

  const removeSelected = async () => {
    if (readOnly) { notify('حذف اطلاعات در این حساب فعال نیست.'); return; }
    if (!canModuleAction(active, 'delete')) { notify('مجوز ابطال یا حذف این بخش برای حساب شما فعال نیست.'); return; }
    if (dbStatus !== 'connected' || localPreview) { notify('در پیش‌نمایش محلی عملیات مالی و ابطال غیرفعال است؛ ابتدا اطلاعات واقعی را تازه‌سازی کنید.'); return; }
    if (!selected) { notify('ابتدا یک ردیف را انتخاب کنید.'); return; }
    // سطر ماندهٔ افتتاحیه سند نیست؛ فقط از تعریف خود حساب تغییر می‌کند.
    if (selected.opening) { notify('ماندهٔ افتتاحیه سند نیست و قابل ابطال نیست؛ برای تغییر آن، تعریف حساب را ویرایش کنید.'); return; }
    if (selected.status === 'ابطال شده') { notify('این سند قبلاً ابطال شده و قابل ابطال دوباره نیست.'); return; }
    if (selected.reversalOf || selected.reversed_of) { notify('سند معکوس خودش قابل ابطال نیست.'); return; }
    if (active === 'customerLedger' && !customerDetail) { notify('برای غیرفعال‌سازی مشتری از بخش «مشتریان» استفاده کنید؛ اینجا فقط گردش حساب قابل ابطال است.'); return; }
    if (active === 'branchLedger' && !branchDetail) { notify('برای غیرفعال‌سازی نمایندگی از بخش «نمایندگی‌ها» استفاده کنید؛ اینجا فقط گردش حساب قابل ابطال است.'); return; }
    const targetModule = ['customerLedger', 'branchLedger'].includes(active) ? 'transactions' : active;
    if (active === 'ledger' && !selected.documentId) { notify('شناسهٔ سند اصلی برای این سطر موجود نیست؛ برای جلوگیری از ابطال سند اشتباه، عملیات متوقف شد.'); return; }
    const target = selected;
    const masterDataModules = ['customers', 'branches', 'cash', 'banks', 'currencies', 'accounts'];
    const isMasterData = masterDataModules.includes(targetModule);

    if (data.isDemoAccount && !target._demoPreview) { notify('در این حساب فقط رکوردهای موقت قابل حذف هستند؛ اطلاعات اصلی حساب دست‌نخورده می‌ماند.'); return; }
    if (target._demoPreview) {
      if (target._demoFixed) { notify('این رکورد ثابت است و امکان حذف آن وجود ندارد.'); return; }
      await deleteDemoPreviewRecord(target._demoRecordId);
      await refreshDatabase();
      notify('رکورد موقت حذف شد.');
      return;
    }

    if (isMasterData) {
      if (!window.confirm('این رکورد حذف فیزیکی نمی‌شود و فقط غیرفعال خواهد شد؛ سوابق مالی و ارتباطات آن حفظ می‌شود. ادامه می‌دهید؟')) return;
      try {
        const result = await deactivateVersion21MasterRecord(targetModule, target);
        await refreshDatabase();
        notify(['رکورد غیرفعال شد؛ اطلاعات و سوابق آن حفظ شده است.', result?.auditWarning].filter(Boolean).join(' '));
      } catch (error) {
        await captureVersion21Error(error, 'deactivate:' + active);
        notify('غیرفعال‌سازی انجام نشد: ' + (error?.message || 'خطای نامشخص'));
      }
      return;
    }

    setReversal({ module: targetModule, record: target, label: page.label });
  };

  // غیرفعال‌سازی همان حسابِ باز، از داخل صفحهٔ اختصاصی حساب (همان دکمهٔ نوار ابزار)
  const deactivateAccount = async (record, module) => {
    if (readOnly) { notify('حذف اطلاعات در این حساب فعال نیست.'); return; }
    if (!canModuleAction(module, 'delete')) { notify('مجوز ابطال یا حذف این بخش برای حساب شما فعال نیست.'); return; }
    if (dbStatus !== 'connected' || localPreview) { notify('در پیش‌نمایش محلی عملیات مالی و ابطال غیرفعال است؛ ابتدا اطلاعات واقعی را تازه‌سازی کنید.'); return; }
    if (!record) { notify('حسابی برای غیرفعال‌سازی باز نیست.'); return; }
    if (data.isDemoAccount && !record._demoPreview) { notify('در این حساب فقط رکوردهای موقت قابل حذف هستند؛ اطلاعات اصلی حساب دست‌نخورده می‌ماند.'); return; }
    if (!window.confirm('این رکورد حذف فیزیکی نمی‌شود و فقط غیرفعال خواهد شد؛ سوابق مالی و ارتباطات آن حفظ می‌شود. ادامه می‌دهید؟')) return;
    try {
      const result = await deactivateVersion21MasterRecord(module, record);
      await refreshDatabase();
      if (module === 'banks') setBankDetail(null);
      else if (module === 'cash') setCashDetail(null);
      else if (module === 'customers') setCustomerDetail(null);
      else setBranchDetail(null);
      setSelected(null);
      notify(['رکورد غیرفعال شد؛ اطلاعات و سوابق آن حفظ شده است.', result?.auditWarning].filter(Boolean).join(' '));
    } catch (error) {
      await captureVersion21Error(error, 'deactivate:' + module);
      notify('غیرفعال‌سازی انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    }
  };

  const confirmReversal = async reason => {
    if (!reversal || reversalSaving) return;
    setReversalSaving(true);
    try {
      const result = await reverseVersion21Record(reversal.module, reversal.record, reason);
      setReversal(null);
      await refreshDatabase();
      notify(`ابطال انجام شد؛ ${fmt(result.reversedCount)} سند معکوس ثبت شد و سوابق اصلی حفظ شد.`);
    } catch (error) {
      await captureVersion21Error(error, 'reverse:' + reversal.module);
      notify('ابطال انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally {
      setReversalSaving(false);
    }
  };

  const editSelected = async (record = selected) => {
    if (readOnly) { notify('ویرایش اطلاعات در این حساب فعال نیست.'); return; }
    if (!canModuleAction(active, 'edit')) { notify('مجوز ویرایش این بخش برای حساب شما فعال نیست.'); return; }
    if (dbStatus !== 'connected' || localPreview) { notify('در پیش‌نمایش محلی ویرایش غیرفعال است؛ ابتدا اطلاعات واقعی را تازه‌سازی کنید.'); return; }
    if (!record) { notify('ابتدا یک ردیف را انتخاب کنید.'); return; }
    // ماندهٔ افتتاحیه سند نیست؛ از تعریف مشتری/نمایندگی/صندوق ویرایش می‌شود.
    if (record.opening) { notify('ماندهٔ افتتاحیه فقط از تعریف حساب قابل تغییر است.'); return; }
    if (record.status === 'ابطال شده' || record.reversalOf || record.reversed_of) { notify('این سند ابطال شده است و قابل ویرایش نیست؛ برای اصلاح، سند جدید ثبت کنید.'); return; }
    if (data.isDemoAccount && !record._demoPreview) { notify('در این حساب فقط رکوردهای موقت قابل ویرایش هستند؛ اطلاعات اصلی حساب دست‌نخورده می‌ماند.'); return; }
    if (record._demoPreview) {
      if (record._demoFixed) { notify('این رکورد ثابت است و امکان ویرایش آن وجود ندارد.'); return; }
      const demoEditModule = record._demoModule;
      if (!SCHEMAS[demoEditModule]) { notify('ویرایش این نوع رکورد از این بخش پشتیبانی نمی‌شود.'); return; }
      setDraft({ ...record }); setModal(demoEditModule);
      return;
    }
    if (POSTING_FORMS.includes(active)) {
      try {
        const editDraft = await loadVersion21RecordForEdit(active, record);
        setDraft(editDraft);
        setModal(active);
      } catch (error) {
        notify('ویرایش انجام نشد: ' + (error?.message || 'خطای نامشخص'));
      }
      return;
    }
    // سطر گردش حساب صندوق/بانک هم سند مستقل نیست و فقط از سند اصلی ویرایش می‌شود
    const isAccountLedgerLine = (active === 'banks' || active === 'cash') && (bankDetail || cashDetail) && record._sourceTable === 'ledger_entries';
    if (active === 'ledger' || isAccountLedgerLine) {
      // سطر دفتر کل سند مستقل نیست؛ ویرایش فقط از طریق سند اصلی انجام می‌شود
      const source = findLedgerSource(data, record);
      if (!source) { notify('سند اصلی این سطر پیدا نشد؛ سطر دفتر کل فقط از سند اصلی قابل ویرایش است.'); return; }
      if (source.record.status === 'ابطال شده') { notify('سند اصلی این سطر ابطال شده و قابل ویرایش نیست.'); return; }
      try {
        const sourceDraft = POSTING_FORMS.includes(source.module)
          ? await loadVersion21RecordForEdit(source.module, source.record)
          : { ...source.record };
        setActive(source.module);
        setDraft(sourceDraft);
        setModal(source.module);
      } catch (error) {
        notify('سند اصلی باز نشد: ' + (error?.message || 'خطای نامشخص'));
      }
      return;
    }
    // در صفحهٔ اختصاصی حساب، «ویرایش حساب» تعریف خود مشتری/نمایندگی را باز می‌کند
    if (active === 'customerLedger' && customerDetail && !record.documentId) { setDraft({ ...record }); setModal('customers'); return; }
    if (active === 'branchLedger' && branchDetail && !record.documentId) { setDraft({ ...record }); setModal('branches'); return; }
    if (['customerLedger', 'branchLedger'].includes(active) && record.documentId) { setDraft({ ...record }); setModal('transactions'); return; }
    const mod = active;
    if (!SCHEMAS[mod]) { notify('ویرایش مستقیم این گزارش ممکن نیست؛ رکورد اصلی را از بخش مربوط باز کنید.'); return; }
    setDraft({ ...record });
    setModal(mod);
  };

  // preset: صندوق و ارز همان صفحهٔ اختصاصی حساب تا ثبت از داخل همان حساب انجام شود
  const cashAction = (kind, preset = null) => {
    if (readOnly) { notify('ثبت گردش صندوق در این حساب فعال نیست.'); return; }
    if (!canModuleAction('cash', 'create')) { notify('مجوز ثبت گردش صندوق برای حساب شما فعال نیست.'); return; }
    const wanted = preset?.currency || 'AFN';
    const first = data.cash.find(x => x.currency === wanted) || data.cash.find(x => x.currency === 'AFN') || data.cash[0];
    setDraft({
      date: today(), kind, amount: '',
      currency: preset?.currency || first?.currency || 'AFN',
      cash: preset?.cash || first?.name || '',
      party: preset?.party || '', partyType: preset?.partyType || 'customer', description: '',
    });
    setModal('cashAction');
  };

  // انتقال بین حساب‌ها: بخش جاری تغییر نمی‌کند تا بعد از ثبت، همان فهرست صندوق یا بانک باز بماند.
  const openSettlement = (extra = {}) => {
    if (readOnly) { notify('ثبت انتقال در این حساب فعال نیست.'); return; }
    if (!canModuleAction('settlement', 'create')) { notify('مجوز ثبت انتقال بین حساب‌ها برای حساب شما فعال نیست.'); return; }
    const next = { ...defaultDraft('settlement'), ...extra };
    // اگر مبدأ از پیش انتخاب شده باشد (صفحهٔ همان حساب)، مقصد خودکار حساب دیگری می‌شود
    // تا فرم از ابتدا با خطای «مبدأ و مقصد یکی است» باز نشود.
    if (next.fromKind === next.toKind && String(next.fromAccount) === String(next.toAccount)) {
      if (next.fromKind === 'bank') {
        const safe = (data.cash || []).find(x => x.status !== 'غیرفعال' && x.currency === next.currency);
        if (safe) { next.toKind = 'cash'; next.toAccount = safe.name; }
      } else {
        const bank = (data.banks || []).find(x => x.status !== 'غیرفعال' && x.currency === next.currency);
        if (bank) { next.toKind = 'bank'; next.toAccount = String(bank.id); }
      }
    }
    setDraft(next);
    setSelected(null);
    setModal('settlement');
  };

  // ثبت سند بانکی از داخل صفحهٔ اختصاصی حساب، بدون ترک همان صفحه
  const openBankJournal = (extra) => {
    if (readOnly) { notify('ثبت اطلاعات در این حساب فعال نیست.'); return; }
    if (!canModuleAction('journal', 'create')) { notify('مجوز ثبت سند روزنامچه برای حساب شما فعال نیست.'); return; }
    setDraft({ ...defaultDraft('journal'), ...extra });
    setSelected(null);
    setModal('journal');
  };

  const saveCashAction = async () => {
    if (readOnly) { notify('ثبت گردش صندوق در این حساب فعال نیست.'); return; }
    if (saving) return;
    if (!canModuleAction('cash', 'create')) { notify('مجوز ثبت گردش صندوق برای حساب شما فعال نیست.'); return; }
    if (dbStatus !== 'connected' || localPreview) { notify('برای جلوگیری از ثبت روی داده اشتباه، ابتدا اطلاعات واقعی همین صراف را تازه‌سازی کنید.'); return; }
    setSaving(true);
    const payload = { ...draft, clientOperationId: draft.clientOperationId || (globalThis.crypto?.randomUUID?.() || ('v21-' + Date.now() + '-' + Math.random().toString(36).slice(2))) };
    setDraft(payload);
    try {
      const result = data.isDemoAccount
        ? await saveDemoPreviewRecord('transactions', {
          date: payload.date, type: payload.kind, partyType: payload.partyType, party: payload.party,
          currency: payload.currency, amount: (payload.kind === 'خرج' ? -1 : 1) * Number(payload.amount || 0),
          cash: payload.cash, description: payload.description, status: 'موقت',
        })
        : await saveVersion21Record('cashAction', payload);
      setModal(''); setDraft({});
      await refreshDatabase();
      notify(result?.warning || result?.auditWarning ? 'گردش صندوق ثبت شد؛ ' + (result.warning || result.auditWarning) : 'گردش صندوق و سند حسابداری در دیتابیس ثبت شد.');
    } catch (error) {
      await captureVersion21Error(error, 'cashAction');
      setDbError(error?.message || 'ثبت گردش صندوق ناموفق بود.');
      notify('گردش صندوق ثبت نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  // دوره‌های مالی: ثبت تعریف و بستن دوره از همان درگاه دادهٔ میزکار
  const savePeriodRecord = async draft => {
    if (saving) return { ok: false, message: 'ثبت در جریان است.' };
    setSaving(true);
    try {
      await saveVersion21FiscalPeriod(draft);
      await refreshDatabase();
      return { ok: true };
    } catch (error) {
      await captureVersion21Error(error, 'save:fiscalPeriods');
      return { ok: false, message: error?.message || 'ثبت دورهٔ مالی انجام نشد.' };
    } finally { setSaving(false); }
  };

  const closePeriodRecord = async row => {
    if (saving) return { ok: false, message: 'عملیات در جریان است.' };
    setSaving(true);
    try {
      await closeVersion21FiscalPeriod(row.id, '');
      await refreshDatabase();
      return { ok: true };
    } catch (error) {
      await captureVersion21Error(error, 'close:fiscalPeriods');
      return { ok: false, message: error?.message || 'بستن دورهٔ مالی انجام نشد.' };
    } finally { setSaving(false); }
  };

  const backup = () => {
    const blob = new Blob([JSON.stringify({ version: 2, createdAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hisab-sarraf-backup.json'; a.click(); URL.revokeObjectURL(a.href);
    notify('فایل پشتیبان محلی آماده شد.');
  };
  const restore = () => {
    try {
      const parsed = JSON.parse(restoreText);
      const restored = parsed.data || parsed;
      if (!restored || !Array.isArray(restored.customers) || !Array.isArray(restored.transactions)) throw new Error();
      setData({ ...emptyInitial(), ...restored });
      setLocalPreview(true); setModal(''); setRestoreText(''); setSelected(null);
      notify('پشتیبان فقط به‌صورت پیش‌نمایش محلی باز شد؛ برای هر عملیات واقعی، ابتدا تازه‌سازی دیتابیس لازم است.');
    } catch { notify('فایل پشتیبان معتبر نیست یا ساختار آن پشتیبانی نمی‌شود.'); }
  };
  const printPage = () => window.print();
  const reset = () => {
    if (window.confirm('فقط نمای محلی این صفحه پاک شود؟ هیچ رکوردی از دیتابیس حذف نمی‌شود.')) {
      setData(emptyInitial()); setLocalPreview(true); setSelected(null);
      notify('نمای محلی پاک شد؛ برای بارگذاری اطلاعات واقعی، تازه‌سازی را بزنید.');
    }
  };

  // ماندهٔ صندوق فقط از گردش حساب همان صندوق محاسبه می‌شود (همان تابعی که دفتر حساب و بانک می‌خوانند).
  const balanceFor = (currency, cashName) => data.cash
    .filter(x => x.currency === currency && (!cashName || x.name === cashName))
    .reduce((sum, x) => sum + cashBalance(data, x), 0);
  const totalByCurrency = currency => sumCashLedgerMovement(data.transactions, currency);

  // ماندهٔ هر مشتری هم از همان سطرهای دفتر کل پیوندخورده با شناسهٔ او خوانده می‌شود
  const customerSummary = customer => {
    const { totals } = customerStatement(data, customer);
    if (totals.length) {
      return totals.map(t => ({ currency: t.currency, debit: t.debit, credit: t.credit, net: t.balance, status: t.status }));
    }
    const opening = n(customer.opening);
    const currency = customer.currency || 'AFN';
    return [{ currency, debit: Math.max(opening, 0), credit: Math.max(-opening, 0), net: opening, status: opening > 0 ? 'بدهکار' : opening < 0 ? 'بستانکار' : 'تسویه' }];
  };

  // فهرست مشتریان فقط ماندهٔ خالص هر حساب را نشان می‌دهد؛ جمع پایین صفحه هم از همان مانده ساخته می‌شود
  // تا عدد نوار جمع‌بندی با ردیف‌های روی صفحه یکی باشد.
  const customerListTotals = () => {
    const totals = {};
    data.customers.forEach(customer => customerSummary(customer).forEach(x => {
      totals[x.currency] ??= { debit: 0, credit: 0 };
      if (x.net > 0) totals[x.currency].debit += x.net;
      else if (x.net < 0) totals[x.currency].credit += -x.net;
    }));
    return Object.entries(totals).map(([currency, x]) => ({ currency, ...x, net: x.debit - x.credit }));
  };

  const customerDetailTotals = () => {
    if (!customerDetail) return [];
    return customerStatement(data, customerDetail).totals.map(t => ({
      currency: t.currency, debit: t.debit, credit: t.credit, net: t.balance,
    }));
  };

  // ماندهٔ هر نمایندگی هم از همان سطرهای دفتر کلِ پیوندخورده با شناسهٔ آن خوانده می‌شود
  const branchSummary = branch => {
    const { totals } = branchStatement(data, branch);
    if (totals.length) {
      return totals.map(t => ({ currency: t.currency, debit: t.debit, credit: t.credit, net: t.balance, status: t.status }));
    }
    const opening = n(branch.opening);
    const currency = branch.currency || 'AFN';
    return [{ currency, debit: Math.max(opening, 0), credit: Math.max(-opening, 0), net: opening }];
  };

  const branchListTotals = () => {
    const totals = {};
    data.branches.forEach(branch => branchSummary(branch).forEach(x => {
      totals[x.currency] ??= { debit: 0, credit: 0 };
      totals[x.currency].debit += x.debit; totals[x.currency].credit += x.credit;
    }));
    return Object.entries(totals).map(([currency, x]) => ({ currency, ...x, net: x.debit - x.credit }));
  };
  const branchDetailTotals = () => (branchDetail ? branchSummary(branchDetail) : []);

  // جمع‌بندی دفتر از همان سطری ساخته می‌شود که در جدول دیده می‌شود؛
  // این‌طور جمع بالای صفحه هرگز با فهرست زیرش ناهماهنگ نمی‌ماند.
  const totalsFromRows = list => {
    const totals = {};
    list.forEach(row => {
      const currency = row.currency || 'AFN';
      totals[currency] ??= { debit: 0, credit: 0 };
      totals[currency].debit += n(row.debit);
      totals[currency].credit += n(row.credit);
    });
    return Object.entries(totals).map(([currency, x]) => ({ currency, ...x, net: x.debit - x.credit }));
  };

  const accountBookTotals = () => {
    const allRows = active === 'cash' ? data.cash : active === 'banks' ? data.banks : active === 'journal' ? data.journal : rows;
    const selectedRows = selected ? [selected] : allRows;
    if (active === 'customerLedger') return customerDetail ? totalsFromRows(rows) : customerListTotals().map(x => ({ ...x, net: x.debit - x.credit }));
    if (active === 'branchLedger') return branchDetail ? totalsFromRows(rows) : branchListTotals();
    if (active === 'banks' && bankDetail) return accountStatement(data, bankDetail, 'bank').totals.map(t => ({ currency: t.currency, debit: t.debit, credit: t.credit, net: t.balance }));
    if (active === 'cash' && cashDetail) return accountStatement(data, cashDetail, 'cash').totals.map(t => ({ currency: t.currency, debit: t.debit, credit: t.credit, net: t.balance }));
    if (active === 'customers') return customerListTotals().map(x => ({ ...x, net: x.debit - x.credit }));
    if (active === 'branches') return branchListTotals();
    const totals = {};
    if (active === 'cash') {
      selectedRows.forEach(account => {
        const currency = account.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0 };
        totals[currency].debit += Math.max(n(account.opening), 0) + sumCashLedgerSide(data.transactions, account.id, currency, 'debit');
        totals[currency].credit += Math.max(-n(account.opening), 0) + sumCashLedgerSide(data.transactions, account.id, currency, 'credit');
      });
    } else if (active === 'banks') {
      for (const account of selectedRows) {
        const currency = account.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0 };
        totals[currency].debit += Math.max(n(account.opening), 0);
        totals[currency].credit += Math.max(-n(account.opening), 0);
        totals[currency].debit += sumBankLedgerMovement(data.transactions, account.id, currency, 'debit');
        totals[currency].credit += sumBankLedgerMovement(data.transactions, account.id, currency, 'credit');
      }
    } else if (active === 'journal') {
      selectedRows.filter(x => x.status === 'قطعی' || !x.status).forEach(row => {
        const currency = row.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0 };
        totals[currency].debit += n(row.debitTotal); totals[currency].credit += n(row.creditTotal);
      });
    } else if (active === 'ledger') {
      selectedRows.filter(row => !row._demoPreview).forEach(row => {
        const currency = row.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0 };
        totals[currency].debit += n(row.debit); totals[currency].credit += n(row.credit);
      });
    } else if (active === 'remittance') {
      // حوالهٔ دریافتی: صندوق/بانک بدهکار — حوالهٔ ارسالی: صندوق/بانک بستانکار
      rows.forEach(row => {
        const currency = row.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0, fee: 0, count: 0 };
        if (row.direction === 'دریافتی') totals[currency].debit += n(row.amount);
        else totals[currency].credit += n(row.amount);
        totals[currency].fee += n(row.fee);
        totals[currency].count += 1;
      });
    } else if (active === 'accounts') {
      (data.ledger || []).forEach(row => {
        const currency = row.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0 };
        totals[currency].debit += n(row.debit); totals[currency].credit += n(row.credit);
      });
    } else if (active === 'reports') {
      rows.forEach(row => {
        const currency = row.currency || 'AFN';
        totals[currency] ??= { debit: 0, credit: 0 };
        totals[currency].debit += n(row.debit); totals[currency].credit += n(row.credit);
      });
    }
    return Object.entries(totals).map(([currency, x]) => ({ currency, ...x, net: x.debit - x.credit }));
  };
  const showBookSummary = ['customers', 'branches', 'customerLedger', 'branchLedger', 'cash', 'banks', 'journal', 'ledger', 'remittance', 'accounts', 'reports'].includes(active);
  const bookTotals = showBookSummary ? accountBookTotals() : [];
  const bookDebitLabel = active === 'remittance' ? 'دریافتی (بدهکار)'
    : ['customers', 'customerLedger'].includes(active) ? 'طلب (بدهکار)'
      : active === 'branches' ? 'نمایندگی بدهکار'
        : 'جمع بدهکار';
  const bookCreditLabel = active === 'remittance' ? 'ارسالی (بستانکار)'
    : ['customers', 'customerLedger'].includes(active) ? 'بدهی (بستانکار)'
      : active === 'branches' ? 'نمایندگی بستانکار'
        : 'جمع بستانکار';

  const columnsFor = (mod, arr, listOnly = false) => {
    if (mod === 'activity') return [{ key: 'date', label: 'تاریخ' }, { key: 'action', label: 'عملیات' }, { key: 'entity', label: 'بخش' }, { key: 'entityId', label: 'شناسه' }, { key: 'description', label: 'شرح' }, { key: 'status', label: 'وضعیت' }];
    if (mod === 'errors') return [{ key: 'date', label: 'تاریخ' }, { key: 'error_type', label: 'بخش / فیلد' }, { key: 'error_message', label: 'شرح خطا' }, { key: 'device', label: 'دستگاه' }, { key: 'app_version', label: 'نسخه' }, { key: 'status', label: 'وضعیت' }];
    if (mod === 'customerLedger' && (!customerDetail || listOnly)) return [
      { key: 'code', label: 'کد مشتری' }, { key: 'name', label: 'نام مشتری' }, { key: 'currency', label: 'ارز اصلی' },
      { key: 'balance', label: 'وضعیت و مانده حساب', render: r => <div className="flex flex-wrap gap-1">{customerSummary(r).map(x => <span key={x.currency} className={'rounded px-2 py-1 text-[10px] font-bold ' + (x.status === 'بدهکار' ? 'bg-rose-100 text-rose-800' : x.status === 'بستانکار' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')}>{fmt(Math.abs(x.net))} {currencyLabel(x.currency)} · {x.status}</span>)}</div> },
      { key: 'phone', label: 'شماره تماس' }, { key: 'status', label: 'وضعیت مشتری' },
    ];
    if (mod === 'customerLedger' && customerDetail) return [
      { key: 'date', label: 'تاریخ' },
      // شمارهٔ سند خودش قابل کلیک است؛ جزئیات سند و منبع اصلی آن از همین‌جا باز می‌شود.
      { key: 'number', label: 'شماره سند', render: r => (r.number
        ? <button type="button" title="باز کردن جزئیات این سند" onClick={e => { e.stopPropagation(); setViewing({ module: 'customerLedger', record: r }); }} className="border-b border-dashed border-[#315e80] font-bold text-[#17466c] hover:bg-blue-50">{r.number}</button>
        : '—') },
      { key: 'type', label: 'نوع عملیات' }, { key: 'description', label: 'شرح' },
      { key: 'debit', label: 'بدهکار', render: r => <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-700">{signedAmount(r.debit, 'debit')}</span> },
      { key: 'credit', label: 'بستانکار', render: r => <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">{signedAmount(r.credit, 'credit')}</span> },
      { key: 'runningBalance', label: 'مانده پس از گردش', render: r => (r.runningBalance == null
        ? <span className="inline-flex min-w-[110px] justify-center rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">سند نمایشی</span>
        : <span className="inline-flex min-w-[110px] justify-center rounded-lg bg-blue-50 px-2 py-1 font-bold text-blue-800">{fmt(r.runningBalance)} · {r.runningSide}</span>) },
      { key: 'currency', label: 'ارز' }, { key: 'status', label: 'وضعیت سند' },
    ];
    if (mod === 'branchLedger' && (!branchDetail || listOnly)) return [
      { key: 'code', label: 'کد نمایندگی' }, { key: 'name', label: 'نام نمایندگی' }, { key: 'city', label: 'موقعیت' }, { key: 'currency', label: 'ارز اصلی' },
      { key: 'opening', label: 'مانده افتتاحیه', render: r => fmt(r.opening) }, { key: 'status', label: 'وضعیت' },
    ];
    if (mod === 'branchLedger' && branchDetail) return [
      { key: 'date', label: 'تاریخ' },
      { key: 'number', label: 'شماره سند', render: r => (r.number
        ? <button type="button" title="باز کردن جزئیات این سند" onClick={e => { e.stopPropagation(); setViewing({ module: 'branchLedger', record: r }); }} className="border-b border-dashed border-[#315e80] font-bold text-[#17466c] hover:bg-blue-50">{r.number}</button>
        : '—') },
      { key: 'type', label: 'نوع عملیات' }, { key: 'description', label: 'شرح' },
      { key: 'debit', label: 'بدهکار', render: r => <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-700">{signedAmount(r.debit, 'debit')}</span> },
      { key: 'credit', label: 'بستانکار', render: r => <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">{signedAmount(r.credit, 'credit')}</span> },
      { key: 'runningBalance', label: 'مانده پس از گردش', render: r => <span className="inline-flex min-w-[110px] justify-center rounded-lg bg-blue-50 px-2 py-1 font-bold text-blue-800">{fmt(r.runningBalance)} · {r.runningSide}</span> },
      { key: 'currency', label: 'ارز' }, { key: 'status', label: 'وضعیت سند' },
    ];
    // فهرست تعریف مشتریان: ارز حساب از همان گردش حساب خوانده می‌شود، نه از ارز پیش‌فرض رکورد؛
    // وگرنه همهٔ مشتری‌ها با ارز یکسان (افغانی) دیده می‌شدند حتی وقتی حسابشان دلاری است.
    if (mod === 'customers') return [
      { key: 'code', label: 'کد مشتری' },
      { key: 'name', label: 'نام مشتری' },
      { key: 'kind', label: 'نوع حساب' },
      {
        key: 'currency',
        label: 'ارز حساب',
        sortValue: r => customerSummary(r).map(x => x.currency).join(' '),
        render: r => (
          <div className="flex flex-wrap gap-1">
            {customerSummary(r).map(x => (
              <span key={x.currency} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{currencyLabel(x.currency)}</span>
            ))}
          </div>
        ),
      },
      { key: 'phone', label: 'شماره تماس' },
      { key: 'opening', label: 'مانده افتتاحیه', render: r => fmt(r.opening) },
      { key: 'status', label: 'وضعیت' },
    ];
    const fields = SCHEMAS[mod]?.fields || [];
    if (mod === 'accounts') return [
      { key: 'code', label: 'کد حساب' },
      { key: 'name', label: 'نام حساب' },
      { key: 'accountType', label: 'نوع حساب', render: r => ({ asset: 'دارایی', liability: 'بدهی', equity: 'سرمایه', revenue: 'درآمد', expense: 'مصرف' }[r.accountType] || r.accountType) },
      { key: 'level', label: 'سطح' },
      { key: 'parentId', label: 'حساب مادر', render: r => data.accounts.find(a => String(a.id) === String(r.parentId))?.code || '—' },
      { key: 'balance', label: 'مانده دفتر کل', render: r => <div className="flex flex-wrap gap-1">{(r.balanceByCurrency || []).map(x => <span key={x.currency} className="rounded bg-slate-100 px-2 py-1 text-[10px]">{fmt(Math.abs(x.balance))} {currencyLabel(x.currency)} · {(r.nature === 'بستانکار' ? x.balance >= 0 : x.balance < 0) ? 'بستانکار' : 'بدهکار'}</span>)}</div> },
      { key: 'nature', label: 'ماهیت' },
      { key: 'status', label: 'وضعیت' },
    ];
    if (mod === 'remittance') return [{ key: 'date', label: 'تاریخ' }, { key: 'number', label: 'شماره حواله' }, { key: 'direction', label: 'نوع حواله' }, { key: 'sender', label: 'فرستنده' }, { key: 'receiver', label: 'گیرنده' }, { key: 'settlement', label: 'تسویه' }, { key: 'settleAccount', label: 'حساب تسویه' }, { key: 'amount', label: 'مبلغ', render: r => fmt(r.amount) }, { key: 'fee', label: 'کمیشن', render: r => fmt(r.fee) }, { key: 'total', label: 'جمع کل', render: r => fmt(r.total) }, { key: 'currency', label: 'ارز' }, { key: 'accountingStatus', label: 'وضعیت سند' }];
    // جفت ارز و مبلغ هر طرف از فیلدهای مبدأ/مقصد ساخته می‌شود؛ کد ارز جدا از عدد و راست‌به‌چپ‌نشده نمایش داده می‌شود
    if (mod === 'exchange') return [{ key: 'date', label: 'تاریخ' }, { key: 'number', label: 'شماره سند' }, { key: 'kind', label: 'نوع' }, { key: 'party', label: 'طرف حساب' },
      { key: 'pair', label: 'جفت ارز', render: r => <span dir="ltr" className="inline-flex items-center gap-1 font-bold">{r.fromCurrency || '—'} <span aria-hidden="true">→</span> {r.toCurrency || '—'}</span> },
      { key: 'fromAmount', label: 'مبلغ داده‌شده', render: r => <span dir="ltr" className="num inline-block">{fmt(r.fromAmount)} {r.fromCurrency || ''}</span> },
      { key: 'toAmount', label: 'مبلغ گرفته‌شده', render: r => <span dir="ltr" className="num inline-block">{fmt(r.toAmount)} {r.toCurrency || ''}</span> },
      { key: 'cashFrom', label: 'صندوق ارز اول' }, { key: 'cashTo', label: 'صندوق ارز دوم' }, { key: 'fee', label: 'کمیشن', render: r => fmt(r.fee) }, { key: 'accountingStatus', label: 'وضعیت سند' }];
    if (mod === 'expenses') return [{ key: 'date', label: 'تاریخ' }, { key: 'number', label: 'شماره سند' }, { key: 'title', label: 'شرح مصرف' }, { key: 'expenseAccount', label: 'حساب مصرف' }, { key: 'cash', label: 'پرداخت از صندوق/بانک' }, { key: 'amount', label: 'مبلغ', render: r => fmt(r.amount) }, { key: 'currency', label: 'ارز' }, { key: 'status', label: 'وضعیت سند' }];
    // مفاد و زیان: فهرست همان تفکیک حساب‌های درآمد و مصرف است که پایین صفحه نمایش داده می‌شود
    if (mod === 'profit') return [
      { key: 'code', label: 'کد حساب' },
      { key: 'account', label: 'نام حساب' },
      { key: 'accountType', label: 'نوع', render: r => (r.accountType === 'revenue' ? 'درآمد' : r.accountType === 'expense' ? 'مصرف' : r.accountType || '—') },
      { key: 'currency', label: 'ارز' },
      { key: 'amount', label: 'مبلغ خالص', render: r => fmt(r.amount) },
      { key: 'lineCount', label: 'ردیف‌های سند', render: r => fmt(r.lineCount) },
    ];
    // صفحهٔ اختصاصی حساب صندوق/بانک: همان ستون‌های گردش دفاتر مشتریان و نمایندگی‌ها
    if (((mod === 'banks' && bankDetail) || (mod === 'cash' && cashDetail)) && !listOnly) return [
      { key: 'date', label: 'تاریخ' }, { key: 'type', label: 'نوع عملیات' }, { key: 'description', label: 'شرح' },
      { key: 'settlementId', label: 'شناسهٔ تسویه', render: r => r.settlementId ? <span dir="ltr" className="num text-[10px] font-bold">{r.settlementId}</span> : '—' },
      { key: 'debit', label: 'بدهکار', render: r => <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-700">{signedAmount(r.debit, 'debit')}</span> },
      { key: 'credit', label: 'بستانکار', render: r => <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">{signedAmount(r.credit, 'credit')}</span> },
      { key: 'runningBalance', label: 'مانده پس از گردش', render: r => <span className="inline-flex min-w-[110px] justify-center rounded-lg bg-blue-50 px-2 py-1 font-bold text-blue-800">{fmt(r.runningBalance)} · {r.runningSide}</span> },
      { key: 'currency', label: 'ارز' }, { key: 'status', label: 'وضعیت سند' },
    ];
    if (mod === 'cash') return [{ key: 'code', label: 'کد صندوق' }, { key: 'name', label: 'نام صندوق' }, { key: 'currency', label: 'ارز' }, { key: 'opening', label: 'مانده افتتاحیه', render: r => fmt(r.opening) }, { key: 'balance', label: 'موجودی فعلی', render: r => fmt(balanceFor(r.currency, r.name)) }, { key: 'status', label: 'وضعیت' }, { key: 'description', label: 'توضیحات' }];
    if (mod === 'journal') return [{ key: 'date', label: 'تاریخ' }, { key: 'number', label: 'شماره سند' }, { key: 'description', label: 'شرح' }, { key: 'debitAccount', label: 'حساب بدهکار' }, { key: 'creditAccount', label: 'حساب بستانکار' }, { key: 'debitTotal', label: 'جمع بدهکار', render: r => signedAmount(r.debitTotal, 'debit') }, { key: 'creditTotal', label: 'جمع بستانکار', render: r => signedAmount(r.creditTotal, 'credit') }, { key: 'currency', label: 'ارز' }];
    if (mod === 'ledger') return [{ key: 'date', label: 'تاریخ' }, { key: 'number', label: 'شماره سند' }, {
      key: 'account', label: 'حساب', render: r => {
        const link = lineAccountLink(data, r);
        if (!link) return r.account;
        return (
          <button
            type="button"
            title={'باز کردن ' + (ACCOUNT_KIND_LABELS[link.kind] || 'حساب') + ' ' + link.label}
            onClick={e => { e.stopPropagation(); openAccountTarget(link.kind, link.record); }}
            className="border-b border-dashed border-[#315e80] font-bold text-[#17466c] hover:bg-blue-50"
          >
            {r.account}
          </button>
        );
      },
    }, { key: 'description', label: 'شرح' }, { key: 'debit', label: 'بدهکار', render: r => signedAmount(r.debit, 'debit') }, { key: 'credit', label: 'بستانکار', render: r => signedAmount(r.credit, 'credit') }, { key: 'currency', label: 'ارز' }];
    if (mod === 'transactions' || active === 'customerLedger' || active === 'branchLedger' || active === 'reports') return [{ key: 'date', label: 'تاریخ' }, { key: 'number', label: 'شماره سند' }, { key: 'type', label: 'نوع عملیات' }, { key: 'party', label: 'طرف حساب' }, { key: 'description', label: 'شرح' }, { key: 'account', label: 'حساب' }, { key: 'debit', label: 'بدهکار', render: r => signedAmount(r.debit, 'debit') }, { key: 'credit', label: 'بستانکار', render: r => signedAmount(r.credit, 'credit') }, { key: 'currency', label: 'ارز', render: r => currencyLabel(r.currency) }, { key: 'cash', label: 'صندوق' }, { key: 'debitAccount', label: 'حساب بدهکار' }, { key: 'creditAccount', label: 'حساب بستانکار' }];
    // فقط ستون‌های مبلغی قالب‌بند دارند؛ ستون‌های متنی نباید render برگردانند
    // چون DataTable هر ستون دارای render را با همان تابع رسم می‌کند.
    return fields.map(([key, label]) => (key === 'rate'
      ? { key, label, render: r => fmtRate(r[key]) }
      : key === 'amount' || key === 'opening' || key === 'profit'
        ? { key, label, render: r => fmt(r[key]) }
        : { key, label }));
  };

  // ستون‌های پنجرهٔ جزئیات: ردیف گردش با ستون‌های گردش همان حساب، و خودِ حسابِ باز
  // (صندوق/بانک) با ستون‌های فهرست نمایش داده می‌شود تا پنجره خالی و بی‌فیلد نماند.
  const viewingColumns = (mod, record) => {
    const target = mod === 'reports' ? 'transactions' : (mod || active);
    const account = target === 'cash' ? cashDetail : target === 'banks' ? bankDetail : null;
    const isAccount = Boolean(record && account && String(record.id) === String(account.id));
    return columnsFor(target, undefined, isAccount);
  };

  // پیوندهای پنجرهٔ جزئیات: منبع سند به‌همراه حساب‌های همان سند.
  // در صفحهٔ اختصاصی حساب فقط پیوند تکراری به همان حسابِ باز پنهان می‌شود؛
  // در پنجرهٔ سند مبدأ، پیوند هر دو طرف سند می‌ماند تا راه بازگشت به حساب مشتری/صندوق قطع نشود.
  const detailLinks = () => {
    if (!viewing) return [];
    const links = [...sourceLinksOf(viewing.record, viewing.module), ...accountLinksOf(viewing.record)];
    const openAccount = bankDetail ? { kind: 'bank', record: bankDetail }
      : cashDetail ? { kind: 'cash', record: cashDetail }
        : customerDetail ? { kind: 'customer', record: customerDetail }
          : branchDetail ? { kind: 'branch', record: branchDetail } : null;
    if (!openAccount || viewing.module !== active) return links;
    return links.filter(item => !(item.kind === openAccount.kind && String(item.recordId) === String(openAccount.record.id)));
  };

  const menuAction = action => {
    setMenu('');
    if (MODULES.some(m => m.id === action) && !canViewModule(action)) { notify('مجوز مشاهده این بخش برای حساب شما فعال نیست.'); return; }
    // مرکز معاملات و بدهکاران صفحهٔ مستقل دارند؛ مسیرشان یک منبع دارد
    if (['debtors', 'transactions'].includes(action)) { navigate(modulePath(action)); return; }
    if (action === 'settlement') return openSettlement();
    if (action === FISCAL_SECTION.id) { setActive(FISCAL_SECTION.id); return; }
    if (SCHEMAS[action]) { setActive(action); return; }
    if (action === 'cashIn') return cashAction('دخل');
    if (action === 'cashOut') return cashAction('خرج');
    if (action === 'backup') return backup();
    if (action === 'restore') return setModal('restore');
    if (action === 'print') return printPage();
    if (action === 'reset') return reset();
    if (action === 'settings' || action === 'help' || action === 'support') return setModal(action);
    if (!MODULES.some(m => m.id === action)) {
      notify('این گزینه در نسخهٔ ۲۱ پیاده نشده است و برای همین غیرفعال است.');
      return;
    }
    setActive(action);
  };

  const exportCsv = () => {
    const cols = active === 'profit' ? [{ key: 'code', label: 'کد حساب' }, { key: 'account', label: 'حساب' }, { key: 'accountType', label: 'نوع' }, { key: 'currency', label: 'ارز' }, { key: 'amount', label: 'مبلغ خالص' }] : columnsFor(active);
    if (!cols.length) { notify('خروجی CSV برای این بخش ستون‌بندی‌شده نیست.'); return; }
    const source = active === 'profit' ? profitReport.accounts : rows;
    const csv = [cols.map(c => c.label).join(','), ...source.map(r => cols.map(c => '"' + String(r[c.key] ?? '').replaceAll('"', '""') + '"').join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = active + '-report.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  // «عملیات امروز» = سندهای امروز، نه سطرهای دفتر؛ هر سند چند سطر دارد و
  // شمردن سطرها عددی می‌داد که با فهرست عملیات هم‌خوان نبود.
  const dailyTransactions = (() => {
    const seen = new Set();
    return data.transactions.filter(t => {
      if (t.date !== today()) return false;
      const key = String(t.documentId ?? t.number ?? t.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();
  const profit = data.exchange.reduce((s, x) => s + n(x.profit), 0);
  const currencies = [...new Set([...data.cash.map(x => x.currency), ...data.transactions.map(x => x.currency), 'AFN'])];
  const ltDateParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(new Date()).reduce((a, x) => { a[x.type] = x.value; return a; }, {});
  const ltDate = (ltDateParts.weekday || '') + '، ' + (ltDateParts.day || '') + ' ' + (ltDateParts.month || '') + ' ' + (ltDateParts.year || '');
  const ltUserName = authUser?.full_name || authUser?.username || exchangeProfile?.name || 'کاربر';
  const goModule = id => {
    if (['debtors', 'transactions'].includes(id)) { navigate(modulePath(id)); return; }
    if (!MODULES.some(m => m.id === id)) { notify('این بخش در نسخهٔ ۲۱ وجود ندارد.'); return; }
    if (!canViewModule(id)) { notify('مجوز مشاهده این بخش برای حساب شما فعال نیست.'); return; }
    setActive(id); setCustomerDetail(null); setBranchDetail(null);
  };

  const goBack = () => {
    setViewing(null);
    if ((active === 'customerLedger' && customerDetail) || (active === 'branchLedger' && branchDetail)
      || (active === 'banks' && bankDetail) || (active === 'cash' && cashDetail)) {
      backFromAccount();
      return;
    }
    const previous = moduleHistory.current.pop();
    const next = previous && MODULES.some(m => m.id === previous) ? previous : 'home';
    // بازگشت از یک بخش، نشانهٔ «بخش مبدأ حساب» را هم پاک می‌کند؛ وگرنه حساب بعدی
    // که از فهرست همین بخش باز شود، با یک نشانهٔ کهنه به بخشی بی‌ربط برمی‌گردد.
    accountOrigin.current = null;
    previousModule.current = next;
    setActive(next); setCustomerDetail(null); setBranchDetail(null);
  };

  const viewSelected = record => {
    const target = record || selected;
    if (!target) { notify('ابتدا یک ردیف را انتخاب کنید.'); return; }
    setViewing({ module: active, record: target });
  };
  const ltDeletable = ['customers', 'branches', 'cash', 'banks', 'currencies', 'accounts', 'transactions', 'cashAction', 'expenses', 'journal', 'ledger', 'remittance', 'exchange'].includes(active);
  // حسابِ بازِ صفحهٔ اختصاصی؛ دکمه‌های ویرایش/غیرفعال از نوار ابزار به همین صفحه منتقل می‌شوند
  const accountDetail = (active === 'banks' && bankDetail) || (active === 'cash' && cashDetail) || (active === 'customerLedger' && customerDetail) || (active === 'branchLedger' && branchDetail) || null;
  const accountDetailModule = active === 'banks' ? 'banks' : active === 'cash' ? 'cash' : active === 'customerLedger' ? 'customers' : 'branches';
  // گردش بانکی صفحهٔ بانک‌ها؛ با انتخاب یک حساب، فقط گردش همان حساب نشان داده می‌شود
  const bankLedgerRows = (data.transactions || []).filter(t => String(t.accountType || '').toLowerCase() === 'bank'
    && (!selected || selected._sourceTable !== 'bank_accounts' || String(t.accountId) === String(selected.id))
    && (!dateFrom || !t.date || t.date >= dateFrom) && (!dateTo || !t.date || t.date <= dateTo));

  // منویی که بخش جاری از آن باز شده است؛ صفحه‌های بدون آیکون در نوار (مثل «مفاد و زیان»)
  // بی این نشانه، جای کاربر در منو معلوم نمی‌شد.
  const menuHasActive = m => m.items.some(([, act]) => (act === 'agents' ? 'branches' : act) === active);

  // بخش باز‌شده همیشه در ردیف آیکون‌ها هم حاضر است؛ اگر جزو میان‌برهای ثابت نباشد،
  // همان بخش به ردیف اضافه می‌شود تا نشانهٔ صفحه با صفحهٔ نمایش‌داده‌شده یکی بماند.
  const desktopToolbar = useMemo(() => {
    if (LAPTOP_TOOLBAR.some(item => item.id === active)) return LAPTOP_TOOLBAR;
    const currentModule = MODULES.find(item => item.id === active);
    return currentModule ? [...LAPTOP_TOOLBAR, { id: currentModule.id, label: currentModule.label, icon: currentModule.icon }] : LAPTOP_TOOLBAR;
  }, [active]);
  const mobileIconIds = useMemo(() => (
    MOBILE_ICON_IDS.includes(active) ? MOBILE_ICON_IDS : [...MOBILE_ICON_IDS, active]
  ), [active]);

  const renderMenus = (menus, disabledAware) => (
    <nav className={disabledAware ? 'v21-laptop-menu-bar hidden lg:flex' : 'v21-laptop-menu-bar lg:hidden'} aria-label={disabledAware ? 'منوی اصلی دسکتاپ' : 'منوی اصلی موبایل'}>
      {menus.map(m => (
        <div key={m.label} className="relative">
          <button
            type="button"
            aria-expanded={menu === m.label}
            aria-current={menuHasActive(m) ? 'true' : undefined}
            onClick={() => setMenu(menu === m.label ? '' : m.label)}
            className={'v21-laptop-menu-trigger ' + (menu === m.label ? 'is-open ' : '') + (menuHasActive(m) ? 'is-current' : '')}
          >
            {m.label}<ChevronDown className="mr-1 inline h-3 w-3" />
          </button>
          {menu === m.label && (
            <div className="v21-laptop-menu-popover absolute right-0 top-full z-40 min-w-48 border border-slate-300 bg-white py-1 shadow-xl" role="menu" aria-label={`گزینه‌های منوی ${menu}`}>
              {m.items.map(([label, act]) => {
                const action = act === 'agents' ? 'branches' : act;
                const moduleAction = MODULES.some(item => item.id === action);
                const disabled = !act || (moduleAction && !canViewModule(action)) || (['cashIn', 'cashOut'].includes(act) && !canModuleAction('cash', 'create'));
                return (
                  <button
                    type="button" role="menuitem" key={act || label}
                    disabled={disabledAware ? disabled : false}
                    aria-disabled={disabledAware ? disabled : false}
                    onClick={() => { if (!disabledAware || !disabled) menuAction(action); }}
                    className={'block w-full px-3 py-2 text-right text-[11px] text-slate-800 hover:bg-blue-50 ' + (disabledAware ? 'disabled:cursor-not-allowed disabled:opacity-40' : '')}
                  >
                    {label}{disabledAware && disabled ? ' — غیرفعال' : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <div dir="rtl" className="v21-workspace-root space-y-2 text-[#253746]">
      {active === 'home' && desktopChrome && (
        <LaptopHome
          data={data}
          fmt={fmt}
          ltDate={ltDate}
          ltUserName={ltUserName}
          dbStatus={dbStatus}
          profit={profit}
          tradeProfit={tradeProfit}
          canViewModule={canViewModule}
          canModuleAction={canModuleAction}
          goModule={goModule}
          openNew={openNew}
          cashAction={cashAction}
          menuAction={menuAction}
          printPage={printPage}
          exchangeName={exchangeProfile?.name}
          exchangeCode={exchangeProfile?.code}
        />
      )}

      {active !== 'home' && (
        <>
          {/* ردیف شناسهٔ مستقل حذف شد؛ تاریخ روز در نوار عنوان آبی نمایش داده می‌شود */}
          <LaptopTopChrome
            ltDate={ltDate}
            exchangeName={exchangeProfile?.name}
            exchangeCode={exchangeProfile?.code}
            dbStatus={dbStatus}
            canViewModule={canViewModule}
            canModuleAction={canModuleAction}
            goModule={goModule}
            menuAction={menuAction}
            activeModule={active}
          />
        </>
      )}

      <section className={'v21-workspace-shell flex max-h-[78vh] min-h-[640px] md:max-h-none flex-col overflow-hidden border border-[#65798b] bg-[#eef4fb] shadow-md' + (showBookSummary ? ' has-summary-dock' : '') + (active === 'home' && desktopChrome ? ' a1-lap-hide' : '')}>
        {dbStatus === 'error' && <div className="mx-3 mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 lg:hidden">{dbError}</div>}
        {localPreview && <div className="mx-3 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 lg:hidden">پیش‌نمایش محلی پشتیبان/نمای پاک‌شده فعال است؛ ثبت، ویرایش و ابطال تا تازه‌سازی اطلاعات واقعی غیرفعال می‌ماند.</div>}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={'v21-laptop-toolbar' + (active === 'branches' && !desktopChrome ? ' hidden' : '')}>
            {/* پنجرهٔ شناسهٔ صرافی در چیدمان کوچک: بالاتر از میان‌برها */}
            <div className="a1-mobile-identity">
              <ExchangeBrandBar
                exchangeName={exchangeProfile?.name}
                exchangeCode={exchangeProfile?.code}
                dbStatus={dbStatus}
              />
            </div>
            {renderMenus(LAPTOP_NAV_MENUS, true)}
            {renderMenus(NAV_MENUS, false)}
            <aside aria-label="نوار ابزار آیکونی" className="v21-module-icon-row hidden shrink-0 w-full lg:flex">
              {desktopToolbar.map(item => {
                const m = MODULES.find(x => x.id === item.id);
                if (!m) return null;
                const I = item.icon;
                const allowed = canViewModule(item.id);
                return (
                  <button
                    key={item.id} type="button" disabled={!allowed} aria-disabled={!allowed}
                    title={allowed ? item.label : 'مجوز مشاهده این بخش برای حساب شما فعال نیست'}
                    aria-current={active === item.id ? 'page' : undefined}
                    onClick={() => { if (allowed) goModule(item.id); }}
                    className={'v21-desktop-module-button ' + (active === item.id ? 'is-active ' : '') + (!allowed ? 'cursor-not-allowed opacity-40' : '')}
                  >
                    <I /><span>{item.label}</span>
                  </button>
                );
              })}
            </aside>
            <aside aria-label="آیکون‌های اصلی موبایل" className="v21-module-icon-row-mobile grid w-full grid-cols-3 gap-1 border-b border-slate-400 bg-[#e1e8ed] p-2 lg:hidden">
              {mobileIconIds.filter(canViewModule).map(id => {
                const m = MODULES.find(x => x.id === id);
                if (!m) return null;
                const I = m.icon;
                return (
                  <button
                    key={m.id} type="button" title={m.label}
                    onClick={event => { event.currentTarget.blur(); setActive(m.id); setCustomerDetail(null); setBranchDetail(null); }}
                    className={'v21-desktop-module-button flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center ' + (active === m.id ? 'is-active border-blue-300 bg-[#d2e3f1] font-bold text-blue-900' : 'border-transparent text-[#29465e] hover:border-slate-300 hover:bg-white')}
                  >
                    <I className="h-5 w-5" /><span className="w-full whitespace-normal text-[10px] leading-tight">{m.label === 'مرکز عملیات' ? 'میزکار' : m.label}</span>
                  </button>
                );
              })}
            </aside>
            <nav className="v21-reference-mobile-shortcuts" aria-label="دسترسی سریع موبایل">
              {['assistant', 'language', 'products', 'home'].filter(canViewModule).map(id => {
                const m = MODULES.find(x => x.id === id);
                if (!m) return null;
                const I = m.icon;
                return (
                  <button
                    key={id} type="button"
                    onClick={event => { event.currentTarget.blur(); setActive(id); setCustomerDetail(null); setBranchDetail(null); }}
                    className={'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center ' + (active === id ? 'border-blue-300 bg-blue-50 font-bold text-blue-900 shadow-sm' : 'border-transparent text-[#29465e] hover:border-blue-200 hover:bg-white')}
                  >
                    <I className="h-5 w-5" /><span>{m.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <main className="print-area min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f9fafb] p-3">
            {/* نوار یکپارچهٔ بخش: در همهٔ بخش‌ها با یک الگو (شاخص‌ها + محتوای مرتبط همان بخش) */}
            {active === 'profit' ? <TradeProfitSection data={data} fmt={fmt} currencyLabel={currencyLabel} /> : null}
            {active !== 'home' && active !== 'profit' && active !== FISCAL_SECTION.id ? <SectionPage model={sectionModel} icon={page.icon} onOpenRow={openSectionRow} /> : null}
            {active === 'branches' && !desktopChrome ? (
              <BranchMobileBoard
                rows={rows}
                query={query}
                onQuery={setQuery}
                selected={selected}
                onOpen={record => { setSelected(record); setViewing({ module: 'branches', record }); }}
                onBack={goBack}
                onNew={() => openNew('branches')}
                canCreate={canModuleAction('branches', 'create')}
                fmt={fmt}
                currencyLabel={currencyLabel}
              />
            ) : active === 'home' ? (
              <HomeCenter
                data={data} modules={MODULES} canViewModule={canViewModule} canModuleAction={canModuleAction}
                tradeProfit={tradeProfit}
                dbStatus={dbStatus} dailyTransactions={dailyTransactions} ltDate={ltDate} todayStr={today()}
                goModule={goModule} cashAction={cashAction} openNew={openNew} navigate={navigate} menuAction={menuAction} fmt={fmt}
                onOpenAll={() => setShowWorkspace(true)}
              />
            ) : active === 'rates' ? (
              <DailyRates onBack={goBack} />
            ) : active === FISCAL_SECTION.id ? (
              <FiscalPeriodsPanel
                rows={data.fiscalPeriods || []}
                canCreate={canModuleAction('accounts', 'create')}
                canClose={canModuleAction('accounts', 'edit')}
                saving={saving}
                onCreate={savePeriodRecord}
                onClose={closePeriodRecord}
              />
            ) : page.linkedModule ? (
              <section className="min-h-[360px] border border-[#9aabb9] bg-white p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#b6c4cf] bg-[#edf3f7]"><page.icon className="h-6 w-6 text-[#315e80]" /></div>
                  <div>
                    <h2 className="text-base font-bold text-[#24496d]">{page.label}</h2>
                    <p className="mt-1 text-[10px] text-slate-500">ورود به ماژول عملیاتی موجود در حساب صراف</p>
                  </div>
                </div>
                {page.id === 'language' ? <LanguageSettings /> : (
                  <>
                    <p className="mb-4 text-xs leading-6 text-slate-600">برای استفاده از این امکان، ماژول مرتبط برنامه را باز کنید. دسترسی و محدودیت اشتراک در همان ماژول اعمال می‌شود.</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(page.id === 'sarraafGroups'
                        ? [['گروه‌ها و گفت‌وگوی گروهی', '/chat'], ['گفت‌وگوی مستقیم صرافان', '/sarraaf-chat'], ['بازار نرخ صرافان', '/sarraaf-market']]
                        : page.id === 'assistant'
                          ? [['دستیار هوش مصنوعی', '/assistant']]
                          : [['مدیریت محصولات آنلاین', '/online-products'], ['شارژ و بسته اینترنت', '/online-products/recharge'], ['بازی‌ها و خدمات دیجیتال', '/online-products/games']]).map(([label, path]) => (
                        <button key={path} onClick={() => navigate(path)} className="min-h-12 border border-[#b6c4cf] bg-[#f2f6f9] px-3 py-3 text-right text-xs font-bold text-[#294d69] hover:border-[#47799d] hover:bg-blue-50">{label}</button>
                      ))}
                    </div>
                  </>
                )}
              </section>
            ) : (
              <>
                {/* ردیف عنوان صفحه: همهٔ دکمه‌ها و خانه‌ها در یک ردیف و با ارتفاع یکسان */}
                <div className="v21-page-head mb-3 flex flex-nowrap items-center gap-1.5 border-b-2 border-[#315e80] pb-2 text-[10px] leading-none">
                  <button
                    type="button"
                    onClick={goBack}
                    title="بازگشت به بخش قبلی"
                    className="flex h-7 shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-2 font-bold text-[#24496d] hover:border-[#47799d] hover:bg-blue-50"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />بازگشت
                  </button>
                  <page.icon className="h-4 w-4 shrink-0 text-[#315e80]" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[9px] text-slate-500">سیستم حسابداری / {page.label}</div>
                    <h2 className="truncate text-xs font-bold text-[#24496d]">
                      {page.label}
                      {bankDetail ? ' · ' + bankDetail.name : cashDetail ? ' · ' + cashDetail.name : customerDetail ? ' · ' + customerDetail.name : branchDetail ? ' · ' + branchDetail.name : ''}
                    </h2>
                  </div>
                  {active === 'customerLedger' && customerDetail && <button onClick={() => { setCustomerDetail(null); setSelected(null); }} className="flex h-7 shrink-0 items-center rounded border border-slate-300 bg-white px-2 font-bold text-[#24496d]">فهرست مشتریان</button>}
                  {active === 'branchLedger' && branchDetail && <button onClick={() => { setBranchDetail(null); setSelected(null); }} className="flex h-7 shrink-0 items-center rounded border border-slate-300 bg-white px-2 font-bold text-[#24496d]">فهرست نمایندگی‌ها</button>}
                  {active === 'banks' && bankDetail && <button onClick={() => { setBankDetail(null); setSelected(null); }} className="flex h-7 shrink-0 items-center rounded border border-slate-300 bg-white px-2 font-bold text-[#24496d]">فهرست بانک‌ها</button>}
                  {active === 'cash' && cashDetail && <button onClick={() => { setCashDetail(null); setSelected(null); }} className="flex h-7 shrink-0 items-center rounded border border-slate-300 bg-white px-2 font-bold text-[#24496d]">فهرست صندوق‌ها</button>}
                  <label className="flex h-7 shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-1.5">
                    از
                    <JalaliDateInput value={dateFrom} onChange={setDateFrom} ariaLabel="از تاریخ" className="h-full w-[96px] border-0 bg-transparent p-0 text-[10px]" />
                  </label>
                  <label className="flex h-7 shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-1.5">
                    تا
                    <JalaliDateInput value={dateTo} onChange={setDateTo} ariaLabel="تا تاریخ" className="h-full w-[96px] border-0 bg-transparent p-0 text-[10px]" />
                  </label>
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="flex h-7 shrink-0 items-center rounded border border-slate-300 bg-white px-2 text-[#24496d]">پاک‌سازی تاریخ</button>
                </div>

                {active === 'ledger' && ledgerAccount ? (
                  <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-2 py-1.5 text-[10px] text-blue-900">
                    <span>فیلتر حساب کدینگ: <b>{[ledgerAccount.code, ledgerAccount.name].filter(Boolean).join(' — ')}</b></span>
                    <span className="text-[9px] text-blue-800">فقط سطرهای همین حساب نمایش داده می‌شود.</span>
                    <button type="button" onClick={goBack} className="rounded border border-blue-300 bg-white px-2 py-0.5 font-bold">بازگشت به بخش قبلی</button>
                    <button type="button" onClick={() => setLedgerAccount(null)} className="rounded border border-blue-300 bg-white px-2 py-0.5 font-bold">نمایش همهٔ سطرها</button>
                  </div>
                ) : null}

                <div className="mb-1 text-[10px] text-slate-500 lg:hidden">
                  {selected ? 'یک مورد انتخاب شده' : 'موردی انتخاب نشده'}
                </div>
                {/* دفتر حساب: این فهرست فقط برای انتخاب طرف حساب است؛ با انتخاب هر ردیف، گردش همان حساب باز می‌شود */}
                {((active === 'customerLedger' && !customerDetail) || (active === 'branchLedger' && !branchDetail)) && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2">
                    <div>
                      <b className="text-[11px] text-[#24496d]">
                        {active === 'customerLedger' ? 'انتخاب مشتری برای دیدن دفتر حساب' : 'انتخاب نمایندگی برای دیدن دفتر حساب'}
                      </b>
                      <div className="mt-1 text-[10px] text-slate-600">
                        این فهرست فقط برای انتخاب طرف حساب است؛ با انتخاب هر ردیف، گردش حساب و ماندهٔ همان طرف حساب در همین صفحه باز می‌شود.
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600">تعداد: <b>{fmt(rows.length)}</b></span>
                  </div>
                )}

                {active === 'cash' && !cashDetail && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2">
                    <div>
                      <b className="text-[11px] text-[#24496d]">فهرست صندوق‌ها</b>
                      <div className="mt-1 text-[10px] text-slate-600">هر صندوق در یک ردیف؛ برای دیدن جزئیات، ردیف را انتخاب کنید.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] sm:gap-3">
                      <span>تعداد صندوق‌ها: <b>{fmt(data.cash.length)}</b></span>
                      <button
                        onClick={() => openSettlement()}
                        disabled={!canModuleAction('settlement', 'create') || data.cash.length + data.banks.length < 2}
                        title={data.cash.length + data.banks.length < 2 ? 'برای انتقال، دست‌کم دو حساب صندوق یا بانک لازم است' : 'انتقال بین صندوق‌ها و حساب‌های بانکی با شناسهٔ تسویهٔ مشترک'}
                        className="border border-emerald-300 bg-emerald-50 px-3 py-2 font-bold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeftRight className="ml-1 inline h-3 w-3" />انتقال بین حساب‌ها
                      </button>
                      <button onClick={() => openNew('cash')} className="border border-blue-300 bg-white px-3 py-2 font-bold text-blue-900"><Plus className="ml-1 inline h-3 w-3" />صندوق جدید</button>
                    </div>
                  </div>
                )}

                {active === 'profit' && (
                  <section className="mb-3 space-y-3">
                    <div className="border border-blue-300 bg-blue-50 px-3 py-2 text-[10px] leading-5 text-blue-900">سود و زیان معاملات اسعار در ماژول «مفاد معاملات» بالای همین صفحه، با روش میانگین موزون و بر پایهٔ نرخ‌های تعریف اسعار محاسبه می‌شود. جدول زیر فقط درآمد و مصرفِ ثبت‌شده در دفتر کل را نشان می‌دهد.</div>
                    {data.exchange.some(x => (!dateFrom || !x.date || x.date >= dateFrom) && (!dateTo || !x.date || x.date <= dateTo) && (filterCurrency === 'همه' || x.fromCurrency === filterCurrency || x.toCurrency === filterCurrency)) && <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">برای نشستن سود محاسبه‌شده در گزارش رسمی، باید سطر سود معاملات اسعار به یک حساب درآمد در کدینگ حساب‌ها وصل شود؛ تا آن زمان این ماژول سود را فقط محاسبه و نمایش می‌دهد و سند تازه‌ای نمی‌سازد.</div>}
                    {profitReport.byCurrency.length === 0 && <div className="border border-amber-300 bg-amber-50 px-3 py-3 text-[11px] leading-6 text-amber-900">{data.accounts.some(account => ['revenue', 'expense'].includes(account.accountType)) ? 'در بازهٔ انتخاب‌شده سطر ثبت‌شده‌ای به حساب درآمد یا مصرف وصل نیست؛ پس از ثبت اسناد به کدینگ مربوط، گزارش محاسبه می‌شود.' : 'سود معاملات اسعار در کارت «مفاد معاملات» بالای همین صفحه محاسبه شده است؛ این جدول فقط درآمد/مصرف دفتر کل را نشان می‌دهد. برای گزارش رسمی، اسناد را به حساب‌های درآمد و مصرف در «کدینگ حساب‌ها» وصل کنید.'}</div>}
                    {profitReport.byCurrency.length > 0 && <div className="overflow-auto border bg-white"><table className="w-full text-xs"><thead className="bg-slate-200"><tr><th className="p-2 text-right">ارز</th><th>درآمد</th><th>مصارف</th><th>سود / زیان خالص</th></tr></thead><tbody>{profitReport.byCurrency.map(x => <tr key={x.currency} className="border-t"><td className="p-2 font-bold">{currencyLabel(x.currency)}</td><td className="text-center">{fmt(Math.abs(x.revenue))}</td><td className="text-center">{fmt(Math.abs(x.expense))}</td><td className={'text-center font-bold ' + (x.net < 0 ? 'text-rose-700' : 'text-emerald-700')}>{fmt(Math.abs(x.net))} {x.net < 0 ? 'زیان' : 'سود'}</td></tr>)}</tbody><tfoot className="bg-slate-100 font-bold"><tr><td className="p-2 text-right">جمع کل به {currencyLabel(profitReport.base.currency)}</td><td className="text-center">{fmt(profitReport.base.revenue)}</td><td className="text-center">{fmt(profitReport.base.expense)}</td><td className={'text-center ' + (profitReport.base.net < 0 ? 'text-rose-700' : 'text-emerald-700')}>{fmt(Math.abs(profitReport.base.net))} {profitReport.base.net < 0 ? 'زیان' : 'سود'}</td></tr></tfoot></table>{profitReport.baseMissing.length ? <div className="border-t border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] text-amber-900">ارزهای بدون نرخ تعریف‌شده در این جمع نیامده‌اند: {profitReport.baseMissing.map(code => currencyLabel(code)).join('، ')}</div> : null}</div>}
                    {profitReport.accounts.length > 0 && <div className="overflow-auto border bg-white"><div className="border-b bg-[#edf3f7] px-3 py-2 text-[11px] font-bold">تفکیک بر اساس حساب</div><table className="w-full text-xs"><thead className="bg-slate-100"><tr><th className="p-2 text-right">کد حساب</th><th>نام حساب</th><th>نوع</th><th>ارز</th><th>مبلغ خالص</th></tr></thead><tbody>{profitReport.accounts.map((x, i) => <tr key={x.accountId + '-' + x.currency + '-' + i} className="border-t"><td className="p-2">{x.code}</td><td>{x.account}</td><td>{x.accountType === 'revenue' ? 'درآمد' : 'مصرف'}</td><td>{currencyLabel(x.currency)}</td><td className="text-center">{fmt(Math.abs(x.amount))}</td></tr>)}</tbody></table></div>}
                    {profitUnclassified.length > 0 && <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">تعداد {fmt(profitUnclassified.length)} سطر مالی با عنوان درآمد/مصرف هنوز به حساب کدینگ وصل نیست؛ این سطرها عمداً در سود و زیان محاسبه نشده‌اند تا عدد غیرواقعی نمایش داده نشود.</div>}
                  </section>
                )}

                {!readOnly && !data.isDemoAccount && active === 'accounts' && ['1000', '1010', '1020', '1030', '2000', '2010', '3000', '4000', '4010', '4020', '5000', '5010', '5020'].some(code => !data.accounts.some(account => account.code === code)) && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-amber-300 bg-amber-50 px-3 py-3 text-[11px] leading-5 text-amber-900">
                    <span>کدینگ پایه نسخهٔ ۲۱ کامل نیست. می‌توانید فقط حساب‌های پایهٔ غایب را برای همین صراف ایجاد کنید؛ حساب‌های موجود و سوابق قبلی تغییر نمی‌کنند.</span>
                    <button
                      onClick={async () => {
                        if (dbStatus !== 'connected' || localPreview) { notify('ابتدا اطلاعات واقعی دیتابیس را تازه‌سازی کنید.'); return; }
                        if (!canModuleAction('accounts', 'create')) { notify('مجوز ایجاد کدینگ برای این حساب فعال نیست.'); return; }
                        if (!window.confirm('کدینگ پایه فقط برای همین کد صرافی ایجاد شود؟ حساب‌ها و اسناد موجود حذف یا بازنویسی نمی‌شوند.')) return;
                        setSaving(true);
                        try {
                          const result = await seedVersion21BaseAccounts();
                          await refreshDatabase();
                          notify('کدینگ پایه ایجاد شد. تعداد حساب‌های پایه: ' + fmt(result.created) + (result.auditWarning ? '؛ هشدار ثبت سوابق: ' + result.auditWarning : ''));
                        } catch (error) {
                          await captureVersion21Error(error, 'seedChartOfAccounts');
                          notify('ایجاد کدینگ انجام نشد: ' + (error?.message || 'خطای نامشخص'));
                        } finally { setSaving(false); }
                      }}
                      disabled={saving || dbStatus !== 'connected'}
                      className="shrink-0 border border-blue-300 bg-white px-3 py-2 font-bold text-blue-900 disabled:opacity-50"
                    >
                      {saving ? 'در حال ایجاد...' : 'ایجاد کدینگ پایه'}
                    </button>
                  </div>
                )}

                {active === 'errors' && (
                  <section className="mb-3 border border-[#b6c4cf] bg-[#edf3f7] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b className="text-[11px] text-[#24496d]">بررسی سلامت محاسبات پنج بخش هسته</b>
                        <p className="mt-1 text-[10px] leading-5 text-slate-600">سناریوهای توازن، جداسازی ارز، آینهٔ ابطال و رد ورودی نامعتبر روی توابع خالص اجرا می‌شود؛ هیچ داده‌ای تغییر نمی‌کند.</p>
                      </div>
                      <button
                        onClick={() => {
                          const report = runVersion21DomainChecks();
                          setDomainReport(report);
                          notify(report.failed
                            ? `${fmt(report.failed)} سناریو ناموفق بود؛ فهرست زیر را بررسی کنید.`
                            : `همهٔ ${fmt(report.passed)} سناریوی کنترل مالی موفق بود.`);
                        }}
                        className="border border-blue-300 bg-white px-3 py-2 text-[10px] font-bold text-blue-900"
                      >
                        اجرای بررسی
                      </button>
                    </div>
                    {domainReport ? (
                      <div className="mt-2 space-y-1 border border-slate-200 bg-white p-2 text-[10px]">
                        <div className="font-bold text-slate-700">موفق: {fmt(domainReport.passed)} از {fmt(domainReport.total)}</div>
                        {domainReport.results.map(item => (
                          <div key={item.name} className={item.ok ? 'text-emerald-700' : 'text-rose-700'}>
                            {item.ok ? '✓' : '✗'} {item.name}{item.ok ? '' : ' — ' + item.message}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2">
                      <PanelAuditPanel />
                    </div>
                    <div className="mt-2">
                      <LinkChainPanel data={data} />
                    </div>
                  </section>
                )}

                {active === 'balance' && (
                  <>
                    <BalanceSheetPanel data={data} />
                    <div className="mb-2 border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">این خلاصه فقط موجودی صندوق‌ها و گردش نقدی را نشان می‌دهد و جایگزین بیلانس آزمایشی یا ترازنامه بدهکار/بستانکار نیست.</div>
                    <div className="mb-3 overflow-auto border bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-200"><tr><th className="p-2 text-right">ارز</th><th>مانده صندوق</th><th>گردش خالص</th></tr></thead>
                        <tbody>{currencies.map(c => <tr key={c} className="border-t"><td className="p-2">{currencyLabel(c)}</td><td className="text-center">{fmt(data.cash.filter(x => x.currency === c).reduce((s, x) => s + balanceFor(c, x.name), 0))}</td><td className="text-center">{fmt(totalByCurrency(c))}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </>
                )}

                {active === 'exchange' && (
                  <div className="mb-2 flex gap-2">
                    <button onClick={() => openNew('exchange', { kind: 'buy' })} className="border bg-white px-3 py-2 text-[10px]">خرید اسعار</button>
                    <button onClick={() => openNew('exchange', { kind: 'sell' })} className="border bg-white px-3 py-2 text-[10px]">فروش اسعار</button>
                    <button onClick={() => openNew('exchange', { kind: 'convert' })} className="border bg-white px-3 py-2 text-[10px]">تبدیل ارز</button>
                  </div>
                )}

                {active === 'remittance' && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button onClick={() => openNew('remittance', { direction: 'ارسالی' })} className="border bg-white px-3 py-2 text-[10px]">حواله ارسالی</button>
                    <button onClick={() => openNew('remittance', { direction: 'دریافتی' })} className="border bg-white px-3 py-2 text-[10px]">حواله دریافتی</button>
                    <button onClick={() => openNew('remittance', { direction: 'ارسالی', settlement: 'instant' })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-900">ارسالی با تسویهٔ فوری</button>
                    <button onClick={() => openNew('remittance', { direction: 'دریافتی', settlement: 'instant' })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-900">دریافتی با تسویهٔ فوری</button>
                    <button onClick={() => openSettlement()} className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-900"><ArrowLeftRight className="ml-1 inline h-3 w-3" />انتقال بین صندوق و بانک</button>
                  </div>
                )}

                {active === 'journal' && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={openJournalForm} className="border border-blue-300 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-900"><Plus className="ml-1 inline h-3 w-3" />ثبت سند روزنامچه جدید</button>
                    <span className="text-[10px] leading-6 text-slate-600">سند ناتراز ثبت نمی‌شود؛ پیام مغایرت همان‌جا نشان داده می‌شود.</span>
                  </div>
                )}

                {/* عنوان فهرست، جستجو و ابزارها در یک ردیف: بدون ردیف جدا و بدون فضای خالی میان ابزارها */}
                <div className="v21-record-utilities mb-2 flex flex-wrap items-center gap-1 border border-slate-300 bg-white p-1.5 text-[10px] leading-none">
                  <b className="shrink-0 truncate">فهرست {page.label}</b>
                  <span className="shrink-0 text-slate-500">تعداد: {fmt(tableRows.length)}</span>
                  {/* جستجو و فیلتر در یک گروه با حداقل عرض می‌مانند تا در عرض‌های میانی به هم فشرده نشوند */}
                  <div className="flex min-w-[210px] flex-1 flex-wrap items-center gap-1">
                    <input id="lab-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو..." className="h-6 min-w-[130px] flex-1 border bg-white px-1.5 text-[10px] leading-none" />
                    <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)} className="h-6 min-w-[92px] shrink-0 border bg-white px-1 text-[10px] leading-none">
                      <option>همه</option>
                      {CURRENCIES.map(c => <option key={c} value={c}>{currencyLabel(c)}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={printPage} className="flex h-6 shrink-0 items-center gap-0.5 whitespace-nowrap border border-slate-300 bg-white px-1.5 text-[10px] font-bold leading-none text-[#24496d]"><Printer className="h-3 w-3" />چاپ</button>
                  <button onClick={() => { setQuery(''); setFilterCurrency('همه'); }} className="flex h-6 shrink-0 items-center gap-0.5 whitespace-nowrap border bg-white px-1.5 text-[10px] leading-none"><Filter className="h-3 w-3" /> پاک</button>
                  {[[RefreshCw, 'تازه‌سازی', refreshDatabase], [Search, 'تمرکز جستجو', () => document.getElementById('lab-search')?.focus()], [Download, 'خروجی CSV', exportCsv], [Archive, 'پشتیبان', backup]].map(([I, label, fn]) => (
                    <button key={label} onClick={fn} className="flex shrink-0 items-center gap-1 border border-slate-200 bg-[#f8fafc] px-2 py-1.5 hover:bg-blue-50"><I className="h-3.5 w-3.5" />{label}</button>
                  ))}
                  {!accountDetail && (<>
                  <button onClick={() => viewSelected()} aria-disabled={!selected} title={selected ? 'نمایش جزئیات ردیف انتخاب‌شده' : 'ابتدا یک ردیف را انتخاب کنید'} className={'v21-inline-record-view flex items-center gap-1 border border-slate-300 bg-white px-2 py-1.5 text-slate-800 ' + (selected ? '' : 'opacity-60')}><Eye className="h-3.5 w-3.5" />مشاهدهٔ انتخاب‌شده</button>
                  <button onClick={() => editSelected()} disabled={!selected || !canModuleAction(active, 'edit')} className="v21-inline-record-edit flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-3.5 w-3.5" />ویرایش انتخاب‌شده</button>
                  <button onClick={removeSelected} disabled={!selected || !canModuleAction(active, 'delete') || !ltDeletable} className="v21-inline-record-delete flex items-center gap-1 border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-800 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" />
                    {['customers', 'branches', 'cash', 'banks', 'currencies', 'accounts'].includes(active) ? 'غیرفعال‌سازی انتخاب‌شده' : ['transactions', 'cashAction', 'expenses', 'journal', 'ledger', 'remittance', 'exchange'].includes(active) ? 'ابطال سند انتخاب‌شده' : 'عملیات در این بخش موجود نیست'}
                  </button>
                  </>)}
                </div>

                {/* همان سه دکمهٔ نوار ابزار، این‌بار روی خودِ حسابِ بازِ همین صفحه */}
                {accountDetail && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button onClick={() => viewSelected(accountDetail)} className="flex items-center gap-1 border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"><Eye className="h-4 w-4" />مشاهده</button>
                    <button onClick={() => editSelected(accountDetail)} disabled={!canModuleAction(accountDetailModule, 'edit')} className="flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-4 w-4" />ویرایش</button>
                    <button onClick={() => deactivateAccount(accountDetail, accountDetailModule)} disabled={!canModuleAction(accountDetailModule, 'delete')} className="flex items-center gap-1 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" />غیرفعال</button>
                  </div>
                )}

                <DataTable
                  columns={(active === 'reports' ? columnsFor('transactions') : columnsFor(active)).filter(column => !(['exchange', 'sarraaf'].includes(data.role) && ['status', 'active', 'accountingStatus'].includes(column.key)))}
                  rows={tableRows}
                  selected={selected}
                  onSelect={r => {
                    // باز کردن حساب از فهرست خودِ همین بخش؛ مبدأ بازگشت ندارد تا دکمهٔ بازگشت
                    // به فهرست همان بخش برگردد و نشانهٔ کهنهٔ بخش قبلی او را جای دیگری نبرد.
                    accountOrigin.current = null;
                    if (active === 'customerLedger' && !customerDetail) { setCustomerDetail(r); setSelected(null); }
                    else if (active === 'branchLedger' && !branchDetail) { setBranchDetail(r); setSelected(null); }
                    // صندوق و بانک: ردیف فهرست، صفحهٔ اختصاصی همان حساب را باز می‌کند (مانند دفتر مشتریان)
                    else if (active === 'banks' && !bankDetail) { setBankDetail(r); setSelected(r); }
                    else if (active === 'cash' && !cashDetail) { setCashDetail(r); setSelected(r); }
                    // در صفحهٔ اختصاصی حساب، ردیف گردش برای دیدن جزئیات سند باز می‌شود
                    else if ((active === 'banks' && bankDetail) || (active === 'cash' && cashDetail)
                      || (active === 'customerLedger' && customerDetail) || (active === 'branchLedger' && branchDetail)) { setSelected(r); setViewing({ module: active, record: r }); }
                    // کلیک دوباره روی همان ردیف، انتخاب را لغو می‌کند و دکمه‌های ویرایش/حذف غیرفعال می‌شوند
                    else setSelected(current => (current?.id === r.id ? null : r));
                  }}
                  onOpen={r => {
                    if (['customerLedger', 'branchLedger'].includes(active) && ((active === 'customerLedger' && !customerDetail) || (active === 'branchLedger' && !branchDetail))) return;
                    if ((active === 'banks' && !bankDetail) || (active === 'cash' && !cashDetail)) return;
                    setSelected(r);
                    setViewing({ module: active, record: r });
                  }}
                />

                {active === 'banks' && !bankDetail && (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2">
                    <div>
                      <b className="text-[11px] text-[#24496d]">انتقال بین حساب‌ها</b>
                      <div className="mt-1 text-[10px] text-slate-600">انتقال بین صندوق‌ها و حساب‌های بانکی با شناسهٔ تسویهٔ مشترک؛ هر دو حساب بلافاصله به‌روز می‌شوند.</div>
                    </div>
                    <button
                      onClick={() => openSettlement()}
                      disabled={!canModuleAction('settlement', 'create') || data.cash.length + data.banks.length < 2}
                      className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeftRight className="ml-1 inline h-3 w-3" />ثبت انتقال
                    </button>
                  </div>
                )}

                {active === 'banks' && !bankDetail && (
                  <BankLedgerPanel
                    rows={bankLedgerRows}
                    fmt={fmt}
                    canPost={canModuleAction('journal', 'create')}
                    onDeposit={() => openNew('journal', selected ? { currency: selected.currency || 'AFN', debitAccount: 'بانک: ' + selected.id } : {})}
                    onWithdraw={() => openNew('journal', selected ? { currency: selected.currency || 'AFN', creditAccount: 'بانک: ' + selected.id } : {})}
                  />
                )}

                {/* در صفحهٔ اختصاصی حساب، ثبت و ویرایش همان حساب همراه با مسیر باز می‌شود */}
                {bankDetail ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => openBankJournal({ currency: bankDetail.currency || 'AFN', debitAccount: 'بانک: ' + bankDetail.id, description: 'واریز به ' + bankDetail.name })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت واریز</button>
                    <button onClick={() => openBankJournal({ currency: bankDetail.currency || 'AFN', creditAccount: 'بانک: ' + bankDetail.id, description: 'برداشت از ' + bankDetail.name })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت برداشت</button>
                    <button onClick={() => openSettlement({ fromKind: 'bank', fromAccount: String(bankDetail.id), currency: bankDetail.currency || 'AFN' })} className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><ArrowLeftRight className="ml-1 inline h-4 w-4" />انتقال از این حساب</button>
                  </div>
                ) : cashDetail ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => cashAction('دخل', { cash: cashDetail.name, currency: cashDetail.currency })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت دخل</button>
                    <button onClick={() => cashAction('خرج', { cash: cashDetail.name, currency: cashDetail.currency })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت خرج</button>
                    <button onClick={() => openSettlement({ fromKind: 'cash', fromAccount: cashDetail.name, currency: cashDetail.currency || 'AFN' })} className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><ArrowLeftRight className="ml-1 inline h-4 w-4" />انتقال از این صندوق</button>
                  </div>
                ) : (active === 'customerLedger' && customerDetail) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => cashAction('دخل', { party: customerDetail.name, partyType: 'customer', currency: customerDetail.currency || 'AFN' })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت دریافت</button>
                    <button onClick={() => cashAction('خرج', { party: customerDetail.name, partyType: 'customer', currency: customerDetail.currency || 'AFN' })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت پرداخت</button>
                  </div>
                ) : (active === 'branchLedger' && branchDetail) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => cashAction('دخل', { party: branchDetail.name, partyType: 'branch', currency: branchDetail.currency || 'AFN' })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت دریافت</button>
                    <button onClick={() => cashAction('خرج', { party: branchDetail.name, partyType: 'branch', currency: branchDetail.currency || 'AFN' })} className="border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت پرداخت</button>
                  </div>
                ) : (!readOnly && active !== 'journal' && SCHEMAS[active] && canModuleAction(active, 'create') && (
                  <button onClick={() => openNew()} className="mt-2 border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4" />ثبت {SCHEMAS[active].title} جدید</button>
                ))}

              </>
            )}
          </main>
        </div>

        <LedgerSummaryDock
          open={showBookSummary}
          totals={bookTotals}
          debitLabel={bookDebitLabel}
          creditLabel={bookCreditLabel}
          showRemittance={active === 'remittance'}
          fmt={fmt}
        />

        <div className="v21-mobile-print-row shrink-0 flex items-center justify-end gap-2 border-t border-slate-400 bg-[#dfe5ea] px-3 py-2 lg:hidden">
          <button onClick={printPage} className="flex items-center gap-1 border border-slate-400 bg-white px-3 py-2 text-[10px]"><Printer className="h-4 w-4 text-[#315d7d]" />چاپ</button>
        </div>

        <style>{`@media (min-width: 768px) { .v21-workspace-shell .v21-mobile-bottom { display: none !important; } .v21-workspace-root { padding-bottom: 0 !important; } }`}</style>

        <nav className="v21-mobile-bottom" aria-label="دسترسی سریع موبایل">
          {[
            { id: 'home', label: 'مرکز', icon: Home },
            { id: 'customers', label: 'مشتریان', icon: Users },
            { id: 'cash', label: 'صندوق', icon: Wallet },
          ].map(item => {
            const Icon = item.icon;
            const allowed = canViewModule(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={active === item.id ? 'is-current' : ''}
                disabled={!allowed}
                aria-disabled={!allowed}
                title={allowed ? item.label : 'مجوز مشاهده این بخش برای حساب شما فعال نیست'}
                aria-label={item.label}
                onClick={() => { setActive(item.id); setCustomerDetail(null); setBranchDetail(null); }}
              >
                <Icon className="h-5 w-5" /><span>{item.label}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setShowWorkspace(true)} aria-label="همه امکانات"><MoreHorizontal className="h-5 w-5" /><span>همه امکانات</span></button>
        </nav>

        <div className="v21-lt-status shrink-0">
          <div className="v21-lt-status-actions">
            <button type="button" onClick={() => openNew()} disabled={!SCHEMAS[active] || !canModuleAction(active, 'create')}><Check className="h-5 w-5 text-emerald-600" />ثبت</button>
            <button type="button" onClick={editSelected} disabled={!selected || !canModuleAction(active, 'edit')}><Pencil className="h-5 w-5 text-blue-600" />ویرایش</button>
            <button type="button" onClick={removeSelected} disabled={!selected || !canModuleAction(active, 'delete') || !ltDeletable}><X className="h-5 w-5 text-rose-600" />حذف</button>
            <button type="button" onClick={printPage}><Printer className="h-5 w-5 text-slate-700" />چاپ</button>
          </div>
          <div className="v21-lt-status-info">
            {contacts.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <i aria-hidden="true" />}
                {item.href
                  ? <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
                  : <span>{item.label}</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-400 bg-[#dfe5ea] px-3 py-2 text-center text-[9px] text-slate-600 lg:hidden">حساب صراف</footer>
      </section>

      {showWorkspace && (
        <div className="v21-mobile-feature-overlay fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-3" role="presentation" onClick={() => setShowWorkspace(false)}>
          <section className="v21-mobile-feature-sheet relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f9fc] shadow-2xl" role="dialog" aria-modal="true" aria-label="همه امکانات حساب صراف" onClick={event => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
              <div>
                <b className="block text-sm text-[#183d5c]">همه امکانات</b>
                <span className="mt-1 block text-[10px] text-slate-500">بخش مورد نظر را انتخاب کنید</span>
              </div>
              <button type="button" aria-label="بستن فهرست امکانات" onClick={() => setShowWorkspace(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"><X className="h-5 w-5" /></button>
            </header>
            <div className="v21-mobile-feature-list flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
              {[
                ...NAV_GROUP_TITLES.map(group => ({
                  key: group.key,
                  title: group.title,
                  items: MODULES.filter(m => m.group === group.key && m.id !== 'home' && canViewModule(m.id)),
                })),
                { key: 'centers', title: 'مرکزهای مکمل', items: CENTER_MODULES.filter(center => canViewModule(center.id)) },
              ].map(group => {
                const items = group.items;
                if (!items.length) return null;
                return (
                  <section key={group.key} className="v21-mobile-feature-group overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <h3 className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-xs font-extrabold text-[#315f80]">{group.title}</h3>
                    <div className="divide-y divide-slate-100">
                      {items.map(m => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id} type="button"
                            onClick={() => {
                              setShowWorkspace(false);
                              // مرکزهای مکمل و بدهکاران صفحهٔ مستقل دارند
                              if (m.path) { navigate(m.path); return; }
                              setActive(m.id); setCustomerDetail(null); setBranchDetail(null);
                            }}
                            className="flex min-h-[62px] w-full items-center gap-3 px-3 py-2.5 text-right transition hover:bg-blue-50 active:bg-blue-100"
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4fa] text-[#245a82]"><Icon className="h-5 w-5" /></span>
                            <span className="min-w-0 flex-1">
                              <b className="block text-xs font-bold text-slate-800">{m.label}</b>
                              <small className="mt-1 block text-[10px] text-slate-500">{m.linkedModule ? 'امکانات تکمیلی و متصل' : 'ورود به بخش و مشاهده سوابق'}</small>
                            </span>
                            <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {active !== 'home' && active !== 'rates' && active !== FISCAL_SECTION.id && !page.linkedModule && !desktopChrome && !modal && !viewing && !showWorkspace && (
        <MobileActionBar
          canCreate={Boolean(SCHEMAS[active]) && canModuleAction(active, 'create')}
          canEdit={canModuleAction(active, 'edit')}
          canDelete={canModuleAction(active, 'delete') && ltDeletable}
          hasSelection={Boolean(selected)}
          onCreate={() => openNew()}
          onEdit={() => editSelected()}
          onDelete={removeSelected}
        />
      )}

      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} aria-live={notice.tone === 'error' ? 'assertive' : 'polite'} className={'v21-lt-toast v21-lt-notice-fixed flex items-center gap-2 border p-3 text-[11px] ' + (notice.tone === 'error' ? 'border-rose-300 bg-rose-50 text-rose-900' : notice.tone === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-900' : notice.tone === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-slate-50 text-slate-800')}>
          {notice.tone === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <Info className="h-4 w-4 shrink-0" />}
          <span>{notice.message}</span>
          <button onClick={() => setNotice('')} className="mr-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <RecordView
        open={Boolean(viewing)}
        title={viewing ? `جزئیات رکورد — ${(MODULES.find(m => m.id === viewing.module) || MODULES[0]).label}` : 'جزئیات رکورد'}
        columns={(viewing ? viewingColumns(viewing.module, viewing.record) : columnsFor(active)).filter(column => !(['exchange', 'sarraaf'].includes(data.role) && ['status', 'active', 'accountingStatus'].includes(column.key)))}
        record={viewing?.record}
        links={detailLinks()}
        canEdit={canModuleAction(viewing?.module || active, 'edit')}
        onEdit={() => {
          const target = viewing?.record;
          setViewing(null);
          if (target) { setSelected(target); editSelected(target); }
        }}
        onPrint={() => {
          setViewing(null);
          setTimeout(() => window.print(), 60);
        }}
        onClose={() => setViewing(null)}
      />

      <ReversalDialog
        open={Boolean(reversal)}
        title={reversal ? `ابطال ${reversal.label}` : 'ابطال سند'}
        detail={reversal?.record
          ? `سند/رکورد انتخاب‌شده: ${reversal.record.number || reversal.record.id} · مبلغ: ${fmt(reversal.record.amount)} ${reversal.record.currency || ''}`
          : ''}
        saving={reversalSaving}
        onCancel={() => { if (!reversalSaving) setReversal(null); }}
        onConfirm={confirmReversal}
      />

      <AdaptiveLayoutPanel space={layoutSpace} layout={layout} />

      <p className="text-[10px] leading-5 text-slate-500 lg:hidden">اطلاعات مالی پس از ثبت در دیتابیس همان صراف ذخیره می‌شود. پیش‌نویس فرم‌ها و تنظیمات نمایش، جداگانه در حافظه محلی همین مرورگر و برای همین کاربر نگهداری می‌شود.</p>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white">
              <b className="text-xs">{SCHEMAS[modal] ? ((draft.id ? 'ویرایش ' : 'ثبت ') + SCHEMAS[modal].title) : modal === 'cashAction' ? 'ثبت گردش صندوق' : modal === 'restore' ? 'بازیابی پشتیبان' : modal === 'settings' ? 'تنظیمات محلی' : 'راهنمای حساب صراف'}</b>
              <button onClick={() => setModal('')}><X className="h-4 w-4" /></button>
            </div>

            {modal === 'remittance' && (
              <RemittanceForm draft={draft} setField={setField} data={data} saving={saving} onSave={saveRecord} onCancel={() => { setModal(''); setDraft({}); }} />
            )}
            {modal === 'expenses' && (
              <ExpenseForm draft={draft} setField={setField} data={data} saving={saving} onSave={saveRecord} onCancel={() => { setModal(''); setDraft({}); }} />
            )}
            {modal === 'exchange' && (
              <ExchangeForm draft={draft} setField={setField} data={data} saving={saving} onSave={saveRecord} onCancel={() => { setModal(''); setDraft({}); }} />
            )}
            {modal === 'journal' && (
              <JournalForm draft={draft} setField={setField} data={data} saving={saving} onSave={saveRecord} onCancel={() => { setModal(''); setDraft({}); }} />
            )}
            {modal === 'settlement' && (
              <SettlementForm draft={draft} setField={setField} data={data} saving={saving} onSave={saveRecord} onCancel={() => { setModal(''); setDraft({}); }} />
            )}

            {SCHEMAS[modal] && !POSTING_FORMS.includes(modal) && (
              <>
                <div className="a1-adaptive-form-grid p-4">
                  {SCHEMAS[modal].fields.filter(f => !(['exchange', 'sarraaf'].includes(data.role) && ['status', 'active'].includes(f[0]))).map(f => (
                    <Field
                      key={f[0]} field={f} value={fieldValue(draft, f[0])} onChange={setField}
                      choices={{
                        ...(modal === 'transactions' ? { partyType: [{ value: 'customer', label: 'مشتری' }, { value: 'branch', label: 'نمایندگی' }, { value: 'other', label: 'سایر' }] } : {}),
                        ...(modal === 'journal' ? {
                          debitAccount: [{ value: '', label: 'انتخاب حساب بدهکار' }, ...data.accounts.map(a => ({ value: a.code + ' — ' + a.name, label: a.code + ' — ' + a.name })), ...data.cash.filter(x => x.currency === draft.currency).map(x => ({ value: 'صندوق: ' + x.name, label: 'صندوق: ' + x.name + ' (' + x.currency + ')' })), ...data.banks.filter(x => x.status !== 'غیرفعال' && x.currency === draft.currency).map(x => ({ value: 'بانک: ' + x.id, label: 'بانک: ' + x.name + ' (' + x.currency + ')' }))],
                          creditAccount: [{ value: '', label: 'انتخاب حساب بستانکار' }, ...data.accounts.map(a => ({ value: a.code + ' — ' + a.name, label: a.code + ' — ' + a.name })), ...data.cash.filter(x => x.currency === draft.currency).map(x => ({ value: 'صندوق: ' + x.name, label: 'صندوق: ' + x.name + ' (' + x.currency + ')' })), ...data.banks.filter(x => x.status !== 'غیرفعال' && x.currency === draft.currency).map(x => ({ value: 'بانک: ' + x.id, label: 'بانک: ' + x.name + ' (' + x.currency + ')' }))],
                        } : {}),
                        ...(modal === 'accounts' ? { parentId: [{ value: '', label: 'بدون حساب مادر' }, ...data.accounts.filter(a => a.status !== 'غیرفعال' && !a.parentId && String(a.id) !== String(draft.id || '')).map(a => ({ value: String(a.id), label: a.code + ' — ' + a.name }))] } : {}),
                        ...(modal === 'expenses' ? {
                          expenseAccount: [{ value: '', label: 'انتخاب حساب مصرف' }, ...data.accounts.filter(a => a.accountType === 'expense' && a.status !== 'غیرفعال').map(a => ({ value: a.code + ' — ' + a.name, label: a.code + ' — ' + a.name }))],
                          cash: [{ value: '', label: 'انتخاب صندوق پرداخت' }, ...data.cash.filter(x => x.currency === draft.currency).map(x => ({ value: x.name, label: x.name + ' (' + x.currency + ')' }))],
                        } : {}),
                        ...(modal === 'exchange' ? {
                          cashFrom: [{ value: '', label: 'انتخاب صندوق ارز مبدا' }, ...data.cash.filter(x => x.currency === draft.fromCurrency).map(x => ({ value: x.name, label: x.name + ' (' + x.currency + ')' }))],
                          cashTo: [{ value: '', label: 'انتخاب صندوق ارز مقصد' }, ...data.cash.filter(x => x.currency === draft.toCurrency).map(x => ({ value: x.name, label: x.name + ' (' + x.currency + ')' }))],
                        } : {}),
                        ...(modal === 'remittance' ? {
                          cash: [{ value: '', label: 'انتخاب صندوق مرتبط' }, ...data.cash.filter(x => x.currency === draft.currency).map(x => ({ value: x.name, label: x.name + ' (' + x.currency + ')' }))],
                          branch: [{ value: '', label: 'انتخاب نمایندگی' }, ...data.branches.map(x => ({ value: x.name, label: x.name }))],
                        } : {}),
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2 border-t bg-slate-100 p-3">
                  <button onClick={() => saveRecord(false)} disabled={saving} className="flex items-center gap-1 border bg-white px-4 py-2 text-xs disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'در حال ثبت...' : 'ثبت'}</button>
                  <button onClick={() => saveRecord(true)} disabled={saving} className="flex items-center gap-1 border border-blue-300 bg-blue-50 px-4 py-2 text-xs text-blue-900 disabled:opacity-50"><Plus className="h-4 w-4" />{saving ? 'در حال ثبت...' : 'ثبت و جدید'}</button>
                  <button onClick={() => setDraft(defaultDraft(modal))} disabled={saving} className="flex items-center gap-1 border bg-white px-4 py-2 text-xs disabled:opacity-50"><RotateCcw className="h-4 w-4" />پاک‌کردن فرم</button>
                  <button onClick={() => setModal('')} className="border bg-white px-4 py-2 text-xs">انصراف</button>
                </div>
              </>
            )}

            {modal === 'cashAction' && (
              <>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  {[['تاریخ', 'date'], ['نوع عملیات', 'kind'], ['نوع طرف حساب', 'partyType'], ['طرف حساب', 'party'], ['ارز', 'currency'], ['مبلغ', 'amount'], ['صندوق', 'cash'], ['شرح', 'description']].map(([label, key]) => (
                    <label key={key} className="space-y-1 text-[11px]">
                      <span>{label}</span>
                      {key === 'kind' ? (
                        <select value={draft.kind} onChange={e => setField(key, e.target.value)} className="h-9 w-full border bg-white px-2"><option>دخل</option><option>خرج</option></select>
                      ) : key === 'partyType' ? (
                        <select value={draft.partyType || 'customer'} onChange={e => setDraft(d => ({ ...d, partyType: e.target.value, party: '' }))} className="h-9 w-full border bg-white px-2"><option value="customer">مشتری</option><option value="branch">نمایندگی</option><option value="other">سایر</option></select>
                      ) : key === 'party' && draft.partyType === 'customer' ? (
                        <select value={draft.party || ''} onChange={e => setField(key, e.target.value)} className="h-9 w-full border bg-white px-2"><option value="">انتخاب مشتری</option>{data.customers.filter(c => c.status !== 'غیرفعال').map(c => <option key={c.id} value={c.name}>{c.code ? c.code + ' · ' : ''}{c.name}</option>)}</select>
                      ) : key === 'party' && draft.partyType === 'branch' ? (
                        <select value={draft.party || ''} onChange={e => setField(key, e.target.value)} className="h-9 w-full border bg-white px-2"><option value="">انتخاب نمایندگی</option>{data.branches.filter(b => b.status !== 'غیرفعال').map(b => <option key={b.id} value={b.name}>{b.code ? b.code + ' · ' : ''}{b.name}</option>)}</select>
                      ) : key === 'currency' ? (
                        <select
                          value={draft.currency}
                          onChange={e => {
                            const currency = e.target.value;
                            const first = data.cash.find(x => x.currency === currency);
                            setDraft(d => ({ ...d, currency, cash: first?.name || '' }));
                          }}
                          className="h-9 w-full border bg-white px-2"
                        >
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      ) : key === 'cash' ? (
                        <select value={draft.cash || ''} onChange={e => setField(key, e.target.value)} className="h-9 w-full border bg-white px-2"><option value="">انتخاب صندوق</option>{data.cash.filter(c => c.currency === draft.currency).map(c => <option key={c.id} value={c.name}>{c.name} · {c.currency}</option>)}</select>
                      ) : (
                        <input type={key === 'amount' ? 'number' : key === 'date' ? 'date' : 'text'} value={draft[key] || ''} onChange={e => setField(key, e.target.value)} className="h-9 w-full border bg-white px-2" />
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end border-t bg-slate-100 p-3">
                  <button onClick={saveCashAction} disabled={saving} className="border bg-white px-4 py-2 text-xs disabled:opacity-50">{saving ? 'در حال ثبت...' : 'ثبت گردش صندوق'}</button>
                </div>
              </>
            )}

            {modal === 'restore' && (
              <div className="space-y-3 p-4">
                <p className="text-xs">محتوای فایل پشتیبان JSON را وارد کنید. این بازیابی فقط نمای محلی مرورگر را تغییر می‌دهد و هیچ رکوردی در دیتابیس A1 ایجاد، جایگزین یا حذف نمی‌کند.</p>
                <textarea value={restoreText} onChange={e => setRestoreText(e.target.value)} rows={9} className="w-full border bg-white p-2 text-xs" placeholder="محتوای JSON..." />
                <button onClick={restore} className="border bg-white px-4 py-2 text-xs">بازیابی در مرورگر</button>
              </div>
            )}

            {modal === 'settings' && (
              <div className="space-y-3 p-4 text-xs">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="تب‌های تنظیمات">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={settingsTab === 'exchange'}
                    onClick={() => setSettingsTab('exchange')}
                    className={'rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ' + (settingsTab === 'exchange' ? 'border-[#1e4776] bg-[#1e4776] text-white' : 'border-[#c9d7e3] bg-white text-[#2a5477]')}
                  >
                    تنظیمات صرافی
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={settingsTab === 'users'}
                    onClick={() => setSettingsTab('users')}
                    className={'rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ' + (settingsTab === 'users' ? 'border-[#1e4776] bg-[#1e4776] text-white' : 'border-[#c9d7e3] bg-white text-[#2a5477]')}
                  >
                    مدیریت کاربران و دسترسی‌ها
                  </button>
                </div>

                {settingsTab === 'users' ? <UsersAccessPanel /> : (
                  <div className="space-y-3">
                    <p>تنظیمات برنامه</p>
                    <ContactSettingsPanel />
                    <button onClick={refreshDatabase} className="border bg-white px-3 py-2">بارگذاری دوباره اطلاعات</button>
                  </div>
                )}
              </div>
            )}

            {modal === 'support' && (
              <div className="space-y-3 p-4 text-xs leading-6">
                <b>پشتیبانی حساب صراف</b>
                <p>برای مشاهده راه‌های پشتیبانی و ثبت درخواست، صفحه پشتیبانی برنامه را باز کنید.</p>
                <button onClick={() => { setModal(''); navigate('/support'); }} className="border border-blue-300 bg-blue-50 px-4 py-2 font-bold text-blue-900">ورود به مرکز پشتیبانی</button>
              </div>
            )}

            {modal === 'help' && (
              <div className="space-y-2 p-4 text-xs leading-6">
                <p>۱. از فهرست سمت راست بخش مورد نظر را باز کنید.</p>
                <p>۲. اطلاعات صراف از دیتابیس دریافت می‌شود و ثبت‌های جدید در همان حساب ذخیره می‌گردد.</p>
                <p>۳. برای تازه‌سازی، از دکمه «تازه‌سازی» استفاده کنید.</p>
                <p>۴. ثبت و ویرایش در جدول‌های موجود انجام می‌شود؛ عملیات مالی با سند حسابداری و سوابق قابل‌ردیابی ثبت می‌گردد.</p>
                <p>دسترسی اطلاعات به نشست و کد صرافی واردشده محدود است.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@media print{
        body *{visibility:hidden!important}
        .print-area,.print-area *{visibility:visible!important}
        .print-area{position:absolute!important;top:0;right:0;width:100%;height:auto!important;overflow:visible!important}
        .a1-lap{position:static!important;height:auto!important;overflow:visible!important}
        .a1-lap-chrome,.a1-lap__status,.v21-lt-status,.v21-mobile-bottom,.v21-mobile-record-actions,.v21-mobile-print-row{display:none!important}
      }`}</style>

      {/* نمایش اعلان‌ها در دسکتاپ: فقط استایل موضعی پیش‌نمایش؛ CSS مرجع A1 تغییر نمی‌کند. */}
      <style>{`@media (min-width:768px){html body .v21-workspace-root .v21-lt-toast.v21-lt-notice-fixed{position:fixed !important;bottom:calc(var(--a1-status-h) + 12px) !important;left:50% !important;transform:translateX(-50%) !important;z-index:95 !important;display:flex !important;width:auto !important;max-width:min(92vw,34rem) !important;border-radius:10px !important;box-shadow:0 12px 30px rgba(16,42,67,.22) !important;}}`}</style>
      <style>{`@media (min-width:768px){html body .v21-workspace-root:has(.v21-summary-dock) .v21-lt-toast.v21-lt-notice-fixed{bottom:calc(var(--a1-status-h) + var(--a1-summary-h) + 12px) !important;}}`}</style>
    </div>
  );
}