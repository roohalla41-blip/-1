// a1/lib/v21Data.js — بارگذاری دادهٔ میز کار نسخهٔ مستقل ۲۲
// نگاشت‌ها و محاسبات نسخهٔ ۲۱ حفظ شده‌اند؛ نشست صراف واقعی از snapshot تأییدشدهٔ سرور می‌خواند
// و پیش‌نمایش محلی همچنان از IndexedDB استفاده می‌کند.
import { all } from '@/a1/lib/db';
import { isChartAccountLedgerLine } from './v21Rules';
import { currentUser, DEMO_EXCHANGE_CODE, getRemoteSnapshot } from './v21Session';
import { computeTradeProfit } from '@/core/domain/tradeProfit';

const num = value => Number(value ?? 0) || 0;
const dateOnly = value => (value ? String(value).slice(0, 10) : '');
// ترتیب منطقی فهرست‌ها: جدیدترین تاریخ بالا؛ ردیف‌های هم‌تاریخ بر اساس شمارهٔ سند از بزرگ به کوچک.
// شمارهٔ سند عددی خوانده می‌شود تا EX-00021 بالاتر از EX-0009 بنشیند.
const documentNumberValue = row => Number(String(row.number || '').replace(/^\D+/, '')) || 0;
const byDateThenNumber = (a, b) => {
  const byDate = String(b.date || '').localeCompare(String(a.date || ''));
  if (byDate) return byDate;
  return documentNumberValue(b) - documentNumberValue(a);
};
const activeLabel = value => (value === false || value === 'inactive' ? 'غیرفعال' : 'فعال');
const documentTypeLabel = (value, description = '') => {
  const detail = String(description || '');
  if (detail.includes('پرداخت')) return 'پرداخت';
  if (detail.includes('دریافت')) return 'دریافت';
  return ({
    dadogereft: 'دریافت',
    pardakht: 'پرداخت',
    transfer: 'حواله',
    expense: 'مصرف',
    exchange: 'معامله اسعار',
    convert: 'تبدیل ارز',
    cash: 'گردش صندوق',
    cash_in: 'دخل صندوق',
    cash_out: 'خرج صندوق',
    trade: 'معامله اسعار',
    deposit: 'واریز بانکی',
    income: 'عواید',
    journal: 'سند روزنامچه',
    settlement: 'انتقال بین حساب‌ها',
    transfer_fee: 'کمیشن حواله',
    exchange_fee: 'کمیشن معامله',
    reversal: 'سند معکوس',
  }[String(value || '').toLowerCase()] || String(value || 'سند'));
};

async function readTable(table, remoteTables, remoteMode) {
  if (remoteMode) {
    const rows = remoteTables?.[table];
    if (!Array.isArray(rows)) throw new Error('دادهٔ ' + table + ' از پایگاه داده بارگذاری نشده است.');
    return rows;
  }
  return all(table);
}

async function readTenantTable(table, exchangeCode, remoteTables, remoteMode) {
  const rows = await readTable(table, remoteTables, remoteMode);
  if (remoteMode) return rows.filter(row => String(row.exchange_code || '') === String(exchangeCode));
  return rows.filter(row => !row.exchange_code || row.exchange_code === exchangeCode);
}

export async function loadVersion21Database() {
  const user = currentUser();
  if (!user?.id) throw new Error('برای مشاهده اطلاعات، با حساب معتبر وارد شوید.');
  const exchangeCode = user.exchange_code || DEMO_EXCHANGE_CODE;
  const remoteMode = Boolean(user.is_v22_remote_session);
  const remoteSnapshot = remoteMode ? getRemoteSnapshot() : null;
  if (remoteMode && (!remoteSnapshot?.success || !remoteSnapshot?.tables)) {
    throw new Error('داده‌های صرافی از سرور دریافت نشده است؛ برای جلوگیری از نمایش دادهٔ محلی، بارگذاری متوقف شد.');
  }
  if (remoteMode && remoteSnapshot.truncated_tables?.length) {
    throw new Error('بارگذاری کامل داده‌ها ممکن نشد؛ جداول دارای دادهٔ بیشتر از سقف صفحه‌بندی: ' + remoteSnapshot.truncated_tables.join('، '));
  }
  const remoteTables = remoteSnapshot?.tables || null;

  const [
    exchanges, customers, safes, origins, bankAccounts, rates, chartAccounts,
    documents, ledgerEntries, transfers, conversions, userPermissions, auditLogs, errorReports,
    fiscalPeriods,
  ] = await Promise.all([
    readTenantTable('exchanges', exchangeCode, remoteTables, remoteMode),
    readTenantTable('customers', exchangeCode, remoteTables, remoteMode),
    readTenantTable('safes', exchangeCode, remoteTables, remoteMode),
    readTenantTable('origins', exchangeCode, remoteTables, remoteMode),
    readTenantTable('bank_accounts', exchangeCode, remoteTables, remoteMode),
    readTenantTable('rates', exchangeCode, remoteTables, remoteMode),
    readTenantTable('chart_of_accounts', exchangeCode, remoteTables, remoteMode),
    readTenantTable('documents', exchangeCode, remoteTables, remoteMode),
    readTenantTable('ledger_entries', exchangeCode, remoteTables, remoteMode),
    readTenantTable('transfers', exchangeCode, remoteTables, remoteMode),
    readTenantTable('conversions', exchangeCode, remoteTables, remoteMode),
    (await readTable('user_permissions', remoteTables, remoteMode)).filter(row => String(row.user_id || '') === String(user.id)),
    (await readTable('audit_logs', remoteTables, remoteMode)).filter(row => remoteMode || !row.exchange_code || row.exchange_code === exchangeCode),
    (await readTable('error_reports', remoteTables, remoteMode)).filter(row => remoteMode || !row.exchange_code || row.exchange_code === exchangeCode),
    readTenantTable('fiscal_periods', exchangeCode, remoteTables, remoteMode),
  ]);

  const exchange = exchanges[0] || null;
  const documentsById = new Map(documents.map(row => [String(row.id), row]));
  const safeById = new Map(safes.map(row => [String(row.id), row]));
  const bankById = new Map(bankAccounts.map(row => [String(row.id), row]));
  const chartAccountById = new Map(chartAccounts.map(row => [String(row.id), row]));
  const activeLedgerEntries = ledgerEntries.filter(row => !row.deleted);
  const documentBalanceCache = new Map();

  const isDocumentBalanced = documentId => {
    if (!documentId) return false;
    const key = String(documentId);
    if (documentBalanceCache.has(key)) return documentBalanceCache.get(key);
    const lines = activeLedgerEntries.filter(row => String(row.document_id || '') === key);
    if (!lines.length) { documentBalanceCache.set(key, false); return false; }
    const totals = new Map();
    for (const line of lines) {
      const currency = String(line.currency || 'AFN');
      const debit = line.debit === null || line.debit === undefined || line.debit === '' ? 0 : Number(line.debit);
      const credit = line.credit === null || line.credit === undefined || line.credit === '' ? 0 : Number(line.credit);
      if (!Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        documentBalanceCache.set(key, false); return false;
      }
      const total = totals.get(currency) || { debit: 0, credit: 0 };
      total.debit += debit; total.credit += credit; totals.set(currency, total);
    }
    const balanced = [...totals.values()].every(total => Math.abs(total.debit - total.credit) < 0.005);
    documentBalanceCache.set(key, balanced);
    return balanced;
  };

  const mappedCustomers = customers.map(row => ({
    ...row,
    id: String(row.id),
    // کد مشتری همیشه نمایش داده می‌شود؛ رکوردهای بدون کد، کد پایدار از شناسه می‌گیرند.
    code: row.code || `C-${String(row.id).padStart(4, '0')}`,
    kind: row.customer_type === 'misc' || row.customer_type === 'temporary' ? 'موقتی' : 'دائمی',
    phone: row.mobile || row.phone || '',
    currency: row.balance_currency || 'AFN',
    opening: num(row.opening_balance),
    status: activeLabel(row.status),
    _sourceTable: 'customers',
  }));

  const mappedBranches = origins.map(row => ({
    ...row,
    id: String(row.id),
    code: row.code || `A-${String(row.id).padStart(4, '0')}`,
    name: row.name || '',
    city: row.city || '',
    phone: row.phone || '',
    currency: 'AFN',
    opening: 0,
    status: activeLabel(row.is_active),
    description: row.notes || '',
    _sourceTable: 'origins',
  }));

  const mappedCash = safes.map(row => ({
    ...row,
    id: String(row.id),
    code: String(row.id),
    opening: num(row.opening_balance),
    // ارزش پایهٔ موجودی آغازین؛ اگر صندوق آن را داشته باشد، بهای تمام‌شدهٔ همین ارز از آن ساخته می‌شود.
    openingValue: num(row.opening_value),
    status: activeLabel(row.active),
    description: '',
    _sourceTable: 'safes',
  }));

  const mappedBanks = bankAccounts.map(row => ({
    ...row,
    id: String(row.id),
    name: row.bank_name || row.holder || 'حساب بانکی',
    account: row.account_number || row.card_number || row.sheba || '',
    opening: num(row.balance),
    status: activeLabel(row.active),
    description: row.notes || '',
    _sourceTable: 'bank_accounts',
  }));

  const mappedCurrencies = rates.map(row => ({
    ...row,
    id: String(row.id),
    code: row.currency || '',
    name: row.description || row.currency || '',
    symbol: row.symbol || row.currency || '',
    rate: num(row.sell_rate || row.buy_rate),
    active: activeLabel(row.is_active),
    _sourceTable: 'rates',
  }));

  const mappedAccounts = chartAccounts.map(row => {
    const accountLines = activeLedgerEntries.filter(line =>
      isChartAccountLedgerLine(line, row) && !documentsById.get(String(line.document_id || ''))?.deleted
    );
    const balanceMap = new Map();
    const addAccountBalance = (currencyValue, debitValue, creditValue, lineCount = 1) => {
      const currency = String(currencyValue || row.currency || 'AFN');
      const total = balanceMap.get(currency) || { currency, debit: 0, credit: 0, balance: 0, lineCount: 0 };
      total.debit += num(debitValue);
      total.credit += num(creditValue);
      total.balance = row.normal_balance === 'credit' ? total.credit - total.debit : total.debit - total.credit;
      total.lineCount += lineCount;
      balanceMap.set(currency, total);
    };
    accountLines.forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    // Roll up the existing cash, bank and customer subledgers into their control accounts.
    if (row.account_code === '1010') {
      safes.forEach(safe => addAccountBalance(safe.currency, Math.max(0, num(safe.opening_balance)), Math.max(0, -num(safe.opening_balance)), 0));
      activeLedgerEntries.filter(line => line.account_type === 'cash' && safeById.has(String(line.account_id || '')))
        .forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    } else if (row.account_code === '1020') {
      bankAccounts.forEach(bank => addAccountBalance(bank.currency, Math.max(0, num(bank.balance)), Math.max(0, -num(bank.balance)), 0));
      activeLedgerEntries.filter(line => line.account_type === 'bank' && bankById.has(String(line.account_id || '')))
        .forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    } else if (row.account_code === '1030') {
      customers.forEach(customer => addAccountBalance(customer.balance_currency || 'AFN', Math.max(0, num(customer.opening_balance)), Math.max(0, -num(customer.opening_balance)), 0));
      activeLedgerEntries.filter(line => line.account_type === 'customer')
        .forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    }
    return {
      ...row,
      id: String(row.id),
      code: row.account_code || '',
      name: row.account_name || '',
      level: row.parent_id ? 'معین' : 'کل',
      parentId: row.parent_id ? String(row.parent_id) : '',
      accountType: row.account_type || '',
      nature: row.normal_balance === 'credit' ? 'بستانکار' : 'بدهکار',
      status: row.is_active === false ? 'غیرفعال' : 'فعال',
      balanceByCurrency: [...balanceMap.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
      description: row.description || '',
      _sourceTable: 'chart_of_accounts',
    };
  });

  mappedAccounts.filter(account => !account.parentId).forEach(parent => {
    const totals = new Map((parent.balanceByCurrency || []).map(row => [row.currency, { ...row }]));
    mappedAccounts.filter(child => String(child.parentId || '') === String(parent.id)).forEach(child => {
      (child.balanceByCurrency || []).forEach(balance => {
        const total = totals.get(balance.currency) || { currency: balance.currency, debit: 0, credit: 0, balance: 0, lineCount: 0 };
        total.debit += num(balance.debit);
        total.credit += num(balance.credit);
        total.lineCount += num(balance.lineCount);
        total.balance = parent.nature === 'بستانکار' ? total.credit - total.debit : total.debit - total.credit;
        totals.set(balance.currency, total);
      });
    });
    parent.balanceByCurrency = [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  });

  const mappedTransfers = transfers.map(row => {
    const mainDocument = documents.find(item => Number(item.transfer_id) === Number(row.id) && item.doc_type === 'transfer');
    const feeDocuments = documents.filter(item => item.doc_type === 'transfer_fee' && item.related_type === 'transfer' && Number(item.related_id) === Number(row.id) && !item.deleted);
    const activeFee = feeDocuments.find(item => !item.reversed);
    const accountingStatus = (() => {
      if (!mainDocument) return 'سند ندارد';
      if (mainDocument.reversed) {
        return num(row.fee) > 0 && (!feeDocuments.length || feeDocuments.some(item => !item.reversed)) ? 'ابطال ناقص' : 'ابطال شده';
      }
      if (!isDocumentBalanced(mainDocument.id)) return 'نیازمند بررسی';
      if (num(row.fee) > 0 && !activeFee) return 'سند کمیشن ندارد';
      if (activeFee && !isDocumentBalanced(activeFee.id)) return 'نیازمند بررسی';
      return 'متوازن';
    })();
    return {
      ...row,
      id: String(row.id),
      date: dateOnly(row.created_at),
      number: row.transfer_number || '',
      direction: row.direction === 'receive' ? 'دریافتی' : row.direction === 'send' ? 'ارسالی' : 'نامعلوم',
      sender: row.sender_name || '',
      receiver: row.receiver_name || '',
      origin: row.origin || '',
      destination: row.destination || '',
      branch: row.origin || row.destination || '',
      currency: row.currency || 'AFN',
      amount: num(row.amount),
      fee: activeFee ? num(activeFee.amount) : num(row.fee),
      total: Number.isFinite(num(row.total)) && num(row.total) > 0 ? num(row.total) : num(row.amount) + num(row.fee),
      cash: row.settlement_mode === 'instant' && row.settle_type !== 'bank' ? (row.settle_account_name || '') : '',
      bank: row.settlement_mode === 'instant' && row.settle_type === 'bank' ? (row.settle_account_name || '') : '',
      settlement: row.settlement_mode === 'instant' ? 'فوری' : 'واسط',
      settleType: row.settle_type === 'bank' ? 'بانک' : 'صندوق',
      settleAccount: row.settle_account_name || 'حواله در جریان',
      status: ['paid', 'done', 'completed'].includes(String(row.status || '').toLowerCase()) ? 'اجرا شده' : (row.status === 'reversed' ? 'ابطال شده' : row.status === 'pending' ? 'در انتظار' : row.status),
      accountingStatus,
      documentId: mainDocument?.id || null,
      feeDocumentId: activeFee?.id || null,
      note: row.destination || row.agent_route || '',
      _sourceTable: 'transfers',
    };
  }).sort(byDateThenNumber);

  // سند حواله‌ای که ردیف متناظر در جدول حواله‌ها ندارد از خود سند خوانده می‌شود تا دفتر حواله‌ها
  // با وجود سند و گردش ثبت‌شده خالی نماند. ردیف تازه‌ای ساخته و ردیف تکراری اضافه نمی‌شود.
  const transferRowIds = new Set(transfers.map(row => String(row.id)));
  documents
    .filter(doc => String(doc.doc_type || '') === 'transfer' && !doc.deleted && !transferRowIds.has(String(doc.transfer_id ?? '')))
    .forEach(doc => {
      const customerName = doc.related_name || '';
      mappedTransfers.push({
        ...doc,
        id: 'doc-' + doc.id,
        date: dateOnly(doc.created_at),
        number: doc.doc_number || '',
        direction: 'نامعلوم',
        sender: '',
        receiver: '',
        origin: '',
        destination: '',
        branch: '',
        currency: doc.currency || 'AFN',
        amount: num(doc.amount),
        fee: 0,
        feeDocumentId: null,
        total: num(doc.amount),
        cash: '',
        bank: '',
        settlement: '—',
        settleType: '',
        settleAccount: customerName || 'حواله بدون ردیف حواله‌ها',
        status: doc.reversed ? 'ابطال شده' : 'اجرا شده',
        accountingStatus: isDocumentBalanced(doc.id) ? 'متوازن' : 'نیازمند بررسی',
        documentId: doc.id,
        note: doc.description || '',
        customer_name: customerName,
        _sourceTable: 'documents',
      });
    });

  const mappedConversions = conversions.map(row => {
    const linkedDocument = documents.find(item => item.related_type === 'conversion' && Number(item.related_id) === Number(row.id) && item.doc_type !== 'exchange_fee');
    const feeDocument = documents.find(item => item.doc_type === 'exchange_fee' && item.related_type === 'conversion' && Number(item.related_id) === Number(row.id) && !item.deleted);
    const documentLines = linkedDocument
      ? activeLedgerEntries.filter(line => String(line.document_id || '') === String(linkedDocument.id))
      : [];
    const conversionKind = row.kind || 'convert';
    return {
      ...row,
      id: String(row.id),
      date: dateOnly(row.created_at),
      number: linkedDocument?.doc_number || '',
      kind: conversionKind === 'buy' ? 'خرید' : conversionKind === 'sell' ? 'فروش' : 'تبدیل',
      documentId: linkedDocument?.id || null,
      feeDocumentId: feeDocument && !feeDocument.reversed ? feeDocument.id : null,
      // شمارهٔ سند کمیشن: برای رسیدن از سطر معامله به سطرهای دفتر همان کمیشن
      feeNumber: feeDocument && !feeDocument.reversed ? (feeDocument.doc_number || '') : '',
      // اگر صندوق‌ها روی خود معامله ذخیره نشده باشند، از سطرهای نقدی سند همان معامله خوانده می‌شوند.
      cashFrom: row.cash_from || documentLines
        .filter(line => num(line.credit) > 0 && String(line.account_type || '').toLowerCase() === 'cash' && String(line.currency || '') === String(row.from_currency || ''))
        .map(line => line.account_name).filter(Boolean).join(' / '),
      cashTo: row.cash_to || documentLines
        .filter(line => num(line.debit) > 0 && String(line.account_type || '').toLowerCase() === 'cash' && String(line.currency || '') === String(row.to_currency || ''))
        .map(line => line.account_name).filter(Boolean).join(' / '),
      fee: feeDocument && !feeDocument.reversed ? num(feeDocument.amount) : 0,
      fromCurrency: row.from_currency || '',
      fromAmount: num(row.from_amount),
      toCurrency: row.to_currency || '',
      toAmount: num(row.to_amount),
      rate: num(row.rate),
      profit: null,
      debitAccount: [...new Set(documentLines.filter(line => num(line.debit) > 0).map(line => line.account_name).filter(Boolean))].join(' / '),
      creditAccount: [...new Set(documentLines.filter(line => num(line.credit) > 0).map(line => line.account_name).filter(Boolean))].join(' / '),
      accountingStatus: !linkedDocument ? 'سند ندارد' : (linkedDocument.reversed ? 'ابطال شده' : isDocumentBalanced(linkedDocument.id) ? 'متوازن' : 'نیازمند بررسی'),
      party: row.customer_name || '',
      note: row.description || '',
      _sourceTable: 'conversions',
    };
  }).sort(byDateThenNumber);

  // سود و بهای تمام‌شدهٔ هر معامله از همان ماژول محاسباتی «مفاد معاملات» خوانده می‌شود
  // تا ستون سود و پنجرهٔ جزئیات همان معامله، عدد محاسبه‌شده را نشان دهد و خالی نماند.
  const tradeProfitResult = computeTradeProfit({
    trades: mappedConversions,
    currencies: mappedCurrencies,
    // موجودی آغازین صندوق‌های ارزی، بهای تمام‌شدهٔ فروش‌هایی را که از همین موجودی برمی‌آیند کامل می‌کند.
    openings: mappedCash.map(row => ({
      currency: row.currency || 'AFN',
      amount: num(row.opening),
      value: num(row.openingValue),
    })),
    policy: { baseCurrency: 'AFN' },
  });
  const tradeProfitRows = tradeProfitResult.rows;
  const tradeProfitBase = tradeProfitResult.baseCurrency || 'AFN';
  const tradeProfitById = new Map(tradeProfitRows.map(row => [row.id, row]));
  mappedConversions.forEach(row => {
    const computed = tradeProfitById.get(row.id);
    row.profit = computed ? computed.profit : null;
    row.costBase = computed ? computed.costBase : null;
    // روش بهای تمام‌شده و نرخ مبنای همان سطر، کنار عدد می‌آید تا معلوم باشد از کجا آمده است.
    row.basis = computed ? computed.basis : '';
    row.avgCost = computed ? computed.avgCost : null;
    row.profitCurrency = tradeProfitBase;
  });

  const mappedTransactions = activeLedgerEntries.map(row => {
    const linkedDocument = row.document_id ? documentsById.get(String(row.document_id)) : null;
    const accountType = String(row.account_type || '').toLowerCase();
    const isCustomer = accountType === 'customer';
    const isCash = accountType === 'cash';
    const isBranch = !isCash && (linkedDocument?.related_type === 'branch' || accountType === 'origin' || accountType === 'branch');
    const currency = row.currency || linkedDocument?.currency || 'AFN';
    const debit = num(row.debit);
    const credit = num(row.credit);
    const amount = (isCustomer || isBranch) ? credit - debit : debit - credit;
    const safe = isCash ? safeById.get(String(row.account_id || '')) : null;
    const documentLines = linkedDocument
      ? activeLedgerEntries.filter(line => String(line.document_id || '') === String(linkedDocument.id))
      : [row];
    const debitAccount = [...new Set(documentLines.filter(line => num(line.debit) > 0).map(line => line.account_name).filter(Boolean))].join(' / ');
    const creditAccount = [...new Set(documentLines.filter(line => num(line.credit) > 0).map(line => line.account_name).filter(Boolean))].join(' / ');
    return {
      id: String(row.id),
      date: dateOnly(row.created_at),
      created_at: row.created_at,
      type: documentTypeLabel(linkedDocument?.doc_type || row.type || accountType, linkedDocument?.description || row.description),
      party: (linkedDocument?.related_name && linkedDocument.related_type === 'branch' ? linkedDocument.related_name : row.account_name) || linkedDocument?.related_name || '',
      partyType: isCustomer ? 'customer' : (linkedDocument?.related_type === 'branch' || accountType === 'origin' || accountType === 'branch' ? 'branch' : 'other'),
      currency,
      amount,
      cash: isCash ? (safe?.name || row.account_name || 'صندوق') : '',
      description: row.description || linkedDocument?.description || '',
      number: linkedDocument?.doc_number || '',
      settlementId: row.settlement_id || linkedDocument?.settlement_id || '',
      account: row.account_name || '',
      debitAccount,
      creditAccount,
      debit,
      credit,
      accountType,
      accountId: row.account_id || '',
      documentId: row.document_id || null,
      status: linkedDocument?.reversed ? 'ابطال شده' : (row.document_id && isDocumentBalanced(row.document_id) ? 'قطعی' : 'نیازمند بررسی'),
      deleted: !!row.deleted,
      _sourceTable: 'ledger_entries',
    };
  }).sort(byDateThenNumber);

  const journalGroups = new Map();
  activeLedgerEntries.forEach(row => {
    const linkedDocument = row.document_id ? documentsById.get(String(row.document_id)) : null;
    if (String(linkedDocument?.doc_type || '').toLowerCase() !== 'journal') return;
    const documentKey = String(row.document_id);
    const currency = row.currency || linkedDocument?.currency || 'AFN';
    const key = `${documentKey}::${currency}`;
    if (!journalGroups.has(key)) journalGroups.set(key, []);
    journalGroups.get(key).push(row);
  });
  const mappedJournal = [...journalGroups.entries()].map(([key, lines]) => {
    const first = lines[0] || {};
    const documentKey = String(first.document_id);
    const linkedDocument = documentsById.get(documentKey);
    const currency = first.currency || linkedDocument?.currency || 'AFN';
    const debitTotal = lines.reduce((sum, row) => sum + num(row.debit), 0);
    const creditTotal = lines.reduce((sum, row) => sum + num(row.credit), 0);
    const debitNames = [...new Set(lines.filter(row => num(row.debit) > 0).map(row => row.account_name).filter(Boolean))];
    const creditNames = [...new Set(lines.filter(row => num(row.credit) > 0).map(row => row.account_name).filter(Boolean))];
    return {
      id: key,
      documentId: documentKey,
      date: dateOnly(first.created_at),
      number: linkedDocument?.doc_number || `JE-${first.id}`,
      description: linkedDocument?.description || first.description || '',
      debitAccount: debitNames.join(' / '),
      creditAccount: creditNames.join(' / '),
      currency,
      amount: debitTotal,
      debitTotal,
      creditTotal,
      status: linkedDocument?.reversed ? 'ابطال شده' : (Math.abs(debitTotal - creditTotal) < 0.005 ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'documents',
    };
  }).sort(byDateThenNumber);

  const mappedLedger = activeLedgerEntries.map(row => {
    const doc = row.document_id ? documentsById.get(String(row.document_id)) : null;
    return {
      id: String(row.id),
      documentId: row.document_id ? String(row.document_id) : null,
      date: dateOnly(row.created_at),
      number: doc?.doc_number || `LE-${row.id}`,
      description: row.description || doc?.description || '',
      account: row.account_name || '',
      accountType: row.account_type || '',
      debit: num(row.debit),
      credit: num(row.credit),
      amount: num(row.debit) || num(row.credit),
      currency: row.currency || doc?.currency || 'AFN',
      status: doc?.reversed ? 'ابطال شده' : (doc?.id && isDocumentBalanced(doc.id) ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'ledger_entries',
    };
  }).sort(byDateThenNumber);

  const mappedReports = documents.filter(row => !row.deleted).map(row => {
    const lines = activeLedgerEntries.filter(line => String(line.document_id || '') === String(row.id));
    const cashLine = lines.find(line => line.account_type === 'cash');
    const cash = cashLine ? (safeById.get(String(cashLine.account_id || ''))?.name || cashLine.account_name || '') : '';
    // جمع بدهکار/بستانکار هر سند فقط در ارز خود سند محاسبه می‌شود؛
    // جمع سطرهای چندارزی، مبلغی می‌ساخت که با مبلغ همان سند در بخش اسعار نمی‌خواند.
    const docCurrency = row.currency || 'AFN';
    const debitLines = lines.filter(line => num(line.debit) > 0 && String(line.currency || docCurrency) === String(docCurrency));
    const creditLines = lines.filter(line => num(line.credit) > 0 && String(line.currency || docCurrency) === String(docCurrency));
    return {
      id: String(row.id), documentId: String(row.id),
      date: dateOnly(row.created_at),
      type: documentTypeLabel(row.doc_type, row.description),
      party: row.related_name || '',
      partyType: row.related_type === 'customer' ? 'customer' : (row.related_type === 'branch' ? 'branch' : 'other'),
      currency: row.currency || 'AFN',
      amount: num(row.amount),
      debit: debitLines.reduce((sum, line) => sum + num(line.debit), 0),
      credit: creditLines.reduce((sum, line) => sum + num(line.credit), 0),
      debitAccount: [...new Set(debitLines.map(line => line.account_name).filter(Boolean))].join(' / '),
      creditAccount: [...new Set(creditLines.map(line => line.account_name).filter(Boolean))].join(' / '),
      account: [...new Set(lines.map(line => line.account_name).filter(Boolean))].join(' / '),
      cash,
      description: row.description || '',
      number: row.doc_number || '',
      status: row.doc_type === 'reversal' ? 'سند معکوس' : row.reversed ? 'ابطال شده' : (isDocumentBalanced(row.id) ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'documents',
    };
  }).sort(byDateThenNumber);

  const mappedExpenses = documents
    .filter(row => !row.deleted && String(row.doc_type || '') === 'expense')
    .map(row => {
      const documentLines = activeLedgerEntries.filter(line => String(line.document_id || '') === String(row.id));
      const cashLine = documentLines.find(line => ['cash', 'bank'].includes(line.account_type));
      const expenseLine = documentLines.find(line => line.account_type === 'suspense' && line.account_id && chartAccountById.has(String(line.account_id)));
      const expenseChartAccount = expenseLine ? chartAccountById.get(String(expenseLine.account_id)) : null;
      return {
        id: String(row.id), documentId: String(row.id),
        date: dateOnly(row.created_at),
        title: row.description || documentTypeLabel(row.doc_type),
        expenseAccount: expenseChartAccount ? expenseChartAccount.account_code + ' — ' + expenseChartAccount.account_name : '',
        currency: row.currency || 'AFN',
        amount: num(row.amount),
        cash: cashLine
          ? (cashLine.account_type === 'bank'
            ? (bankById.get(String(cashLine.account_id || ''))?.bank_name || cashLine.account_name || 'بانک')
            : (safeById.get(String(cashLine.account_id || ''))?.name || cashLine.account_name || ''))
          : '',
        payerType: cashLine?.account_type === 'bank' ? 'bank' : 'cash',
        number: row.doc_number || '',
        note: row.doc_number || '',
        status: row.reversed ? 'ابطال شده' : (isDocumentBalanced(row.id) ? 'قطعی' : 'نیازمند بررسی'),
        _sourceTable: 'documents',
      };
    })
    .sort(byDateThenNumber);

  // Profit & loss is calculated from posted double-entry ledger lines and the chart of accounts.
  const profitTotals = new Map();
  const profitAccountTotals = new Map();
  const profitEntries = [];
  const unclassifiedProfitLines = [];
  for (const line of activeLedgerEntries) {
    const linkedDocument = line.document_id ? documentsById.get(String(line.document_id)) : null;
    if (linkedDocument?.deleted) continue;
    // نوع حساب فقط از سطرهای کدینگ خوانده می‌شود؛ شناسهٔ مشتری، صندوق یا حواله
    // نباید با شناسهٔ هم‌شمارهٔ یک حساب کدینگ اشتباه گرفته شود و مصرف/درآمد جعلی بسازد.
    // نام حساب هم باید بخواند تا سطر واسط (که شناسهٔ حواله را دارد) اشتباه دسته‌بندی نشود.
    const lineType = String(line.account_type || '').toLowerCase();
    const linkedChartAccount = lineType === 'suspense' && line.account_id ? chartAccountById.get(String(line.account_id)) : null;
    const account = linkedChartAccount
      && String(linkedChartAccount.account_name || '').trim() === String(line.account_name || '').trim()
      ? linkedChartAccount
      : null;
    const accountType = String(account?.account_type || lineType).toLowerCase();
    if (!['revenue', 'expense'].includes(accountType)) {
      const label = String(line.account_name || '');
      if (!account && line.account_type === 'suspense' && /(درآمد|کمیشن|مصارف|هزینه|سود|زیان|income|expense|profit|loss)/i.test(label)) {
        unclassifiedProfitLines.push({
          id: String(line.id), date: dateOnly(line.created_at), account: label,
          currency: line.currency || linkedDocument?.currency || 'AFN',
          debit: num(line.debit), credit: num(line.credit),
          documentId: line.document_id || null,
        });
      }
      continue;
    }
    const currency = String(line.currency || linkedDocument?.currency || account?.currency || 'AFN');
    const debit = num(line.debit);
    const credit = num(line.credit);
    // ماهیت هر حساب از نوع خودش خوانده می‌شود: درآمد بستانکار و مصرف بدهکار.
    // این‌گونه یک «ماهیت» نادرست در کدینگ، علامت مصرف را منفی نمی‌کند.
    const signedAmount = accountType === 'revenue' ? credit - debit : debit - credit;
    profitEntries.push({
      id: String(line.id), date: dateOnly(line.created_at),
      documentId: line.document_id || null,
      accountId: String(account?.id || line.account_id || ''),
      code: account?.account_code || '',
      account: account?.account_name || line.account_name || 'حساب نامشخص',
      accountType, currency, amount: signedAmount,
      debit, credit,
    });
    const totals = profitTotals.get(currency) || { currency, revenue: 0, expense: 0, net: 0, lineCount: 0 };
    if (accountType === 'revenue') totals.revenue += signedAmount;
    else totals.expense += signedAmount;
    totals.lineCount += 1;
    totals.net = totals.revenue - totals.expense;
    profitTotals.set(currency, totals);

    const accountId = String(account?.id || line.account_id || line.account_name || 'unmapped');
    const accountKey = accountId + '::' + currency;
    const accountTotals = profitAccountTotals.get(accountKey) || {
      accountId, code: account?.account_code || '', account: account?.account_name || line.account_name || 'حساب نامشخص',
      accountType, currency, amount: 0, lineCount: 0,
    };
    accountTotals.amount += signedAmount;
    accountTotals.lineCount += 1;
    profitAccountTotals.set(accountKey, accountTotals);
  }
  // سود تحقق‌یافتهٔ معاملات اسعار در کدینگ حساب درآمد، سند جداگانه ندارد (از تفاوت نرخ و بهای تمام‌شده
  // ساخته می‌شود)؛ پس در گزارش مفاد به‌عنوان یک ردیف «محاسبه‌شده» به همان ارز پایه اضافه می‌شود
  // تا جمع سود/زیان آن را جا نیندازد و عدد گزارش با ماژول مفاد معاملات یکی بماند.
  const exchangeProfit = tradeProfitRows.reduce((total, row) => (
    row.profit === null || row.profit === undefined ? total : total + num(row.profit)
  ), 0);
  if (Math.round(exchangeProfit * 100) !== 0) {
    const currency = tradeProfitBase;
    const totals = profitTotals.get(currency) || { currency, revenue: 0, expense: 0, net: 0, lineCount: 0 };
    if (exchangeProfit > 0) totals.revenue += exchangeProfit;
    else totals.expense += -exchangeProfit;
    totals.lineCount += 1;
    totals.net = totals.revenue - totals.expense;
    profitTotals.set(currency, totals);
    profitEntries.push({
      id: 'exchange-profit',
      date: '',
      documentId: null,
      accountId: 'exchange-profit',
      code: '',
      account: 'سود معاملات اسعار (محاسبه‌شده)',
      accountType: 'revenue',
      currency,
      amount: exchangeProfit,
      debit: exchangeProfit < 0 ? -exchangeProfit : 0,
      credit: exchangeProfit > 0 ? exchangeProfit : 0,
    });
    profitAccountTotals.set('exchange-profit::' + currency, {
      accountId: 'exchange-profit',
      code: '',
      account: 'سود معاملات اسعار (محاسبه‌شده)',
      accountType: 'revenue',
      currency,
      amount: exchangeProfit,
      lineCount: 1,
    });
  }

  const profitByCurrency = [...profitTotals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  const profitAccounts = [...profitAccountTotals.values()].sort((a, b) =>
    a.accountType.localeCompare(b.accountType) || a.account.localeCompare(b.account)
  );

  const mappedErrors = errorReports.map(row => ({
    id: String(row.id), date: dateOnly(row.created_at), error_type: row.error_type || '',
    error_message: row.error_message || '', device: row.device || '',
    app_version: row.app_version || '', status: row.status || 'new',
    _sourceTable: 'error_reports',
  }));

  const mappedActivity = auditLogs.map(row => ({
    id: String(row.id),
    date: dateOnly(row.created_at),
    action: row.action || '',
    entity: row.entity_type || '',
    entityId: row.entity_id || '',
    description: row.description || row.reason || row.target_name || '',
    status: row.status || '',
    _sourceTable: 'audit_logs',
  })).sort(byDateThenNumber);

  return {
    exchange: exchange ? {
      id: String(exchange.id),
      name: exchange.exchange_name || exchange.name || '',
      code: exchange.exchange_code || exchangeCode,
      ownerUserId: String(exchange.owner_user_id || user.id),
    } : { id: '', name: 'صرافی نمایشی', code: exchangeCode, ownerUserId: String(user.id) },
    permissions: userPermissions,
    data: {
      isDemoAccount: false,
      demoPreviewRecords: [],
      role: String(user.role || '').toLowerCase(),
      permissions: userPermissions,
      customers: mappedCustomers,
      branches: mappedBranches,
      cash: mappedCash,
      banks: mappedBanks,
      currencies: mappedCurrencies,
      accounts: mappedAccounts,
      expenses: mappedExpenses,
      remittance: mappedTransfers,
      exchange: mappedConversions,
      journal: mappedJournal,
      ledger: mappedLedger,
      transactions: mappedTransactions,
      reports: mappedReports,
      activity: mappedActivity,
      errors: mappedErrors,
      fiscalPeriods: (fiscalPeriods || [])
        .map(row => ({
          ...row,
          id: String(row.id),
          period_code: row.period_code || '',
          period_name: row.period_name || '',
          start_date: dateOnly(row.start_date),
          end_date: dateOnly(row.end_date),
          description: row.description || '',
        }))
        .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date))),
      profitByCurrency,
      profitAccounts,
      profitEntries,
      unclassifiedProfitLines,
    },
    loadedAt: new Date().toISOString(),
  };
}