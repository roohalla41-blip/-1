import React, { useMemo, useState } from 'react';
import { useCustomers, useBankAccounts, useAgents, usePostDocument } from '@/lib/useSarraaf';
import { PageHeader } from '@/components/sarraaf/Pieces';
import { AmountInput } from '@/components/sarraaf/Fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { BookCopy, Plus, Trash2, Loader2 } from 'lucide-react';

const newLine = (side = 'debit') => ({
  account_type: 'cash',
  counter_id: '',
  currency: 'AFN',
  amount: 0,
  side,
  description: '',
});

export default function JournalEntry() {
  const { data: customers } = useCustomers();
  const { data: bankAccounts } = useBankAccounts();
  const { data: agents } = useAgents();
  const postMut = usePostDocument();
  const [lines, setLines] = useState([newLine('debit'), newLine('credit')]);

  const updateLine = (index, field, value) => {
    setLines(current => current.map((line, i) => i === index
      ? { ...line, [field]: value, ...(field === 'account_type' ? { counter_id: '' } : {}) }
      : line));
  };

  const addLine = () => setLines(current => [...current, newLine('debit')]);
  const removeLine = index => setLines(current => current.filter((_, i) => i !== index));

  const currencySet = useMemo(() => new Set(lines.map(line => line.currency)), [lines]);
  const oneCurrencyOnly = currencySet.size === 1;
  const validAccounts = lines.every(line => line.account_type === 'cash' || !!line.counter_id);
  const validAmounts = lines.every(line => Number.isFinite(Number(line.amount)) && Number(line.amount) > 0);

  const totals = useMemo(() => lines.reduce((acc, line) => {
    const key = line.currency;
    if (!acc[key]) acc[key] = { debit: 0, credit: 0 };
    acc[key][line.side] += Number(line.amount) || 0;
    return acc;
  }, {}), [lines]);

  const isBalanced = oneCurrencyOnly && Object.values(totals).every(
    value => Math.abs(value.debit - value.credit) < 0.01
  );
  const canSubmit = lines.length >= 2 && isBalanced && validAccounts && validAmounts;

  const getAccountName = line => {
    if (line.account_type === 'cash') return 'صندوق';
    const list = line.account_type === 'bank' ? bankAccounts : line.account_type === 'agent' ? agents : customers;
    const item = (list || []).find(row => String(row.id) === String(line.counter_id));
    return item?.bank_name || item?.name || item?.full_name || 'حساب انتخاب‌شده';
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (lines.length < 2) {
      toast({ title: 'خطا', description: 'حداقل دو ردیف برای سند لازم است', variant: 'destructive' });
      return;
    }
    if (!oneCurrencyOnly) {
      toast({ title: 'نیاز به اصلاح', description: 'در این نسخه، همه ردیف‌های سند دستی باید یک ارز داشته باشند.', variant: 'destructive' });
      return;
    }
    if (!validAccounts || !validAmounts || !isBalanced) {
      toast({ title: 'خطا', description: 'حساب هر ردیف، مبلغ مثبت و تراز بدهکار/بستانکار را بررسی کنید.', variant: 'destructive' });
      return;
    }

    const currency = lines[0].currency;
    const ledgerLines = lines.map((line, index) => ({
      account_type: line.account_type,
      account_id: line.account_type === 'cash' ? currency : String(line.counter_id),
      account_name: getAccountName(line),
      currency: line.currency,
      debit: line.side === 'debit' ? Number(line.amount) : 0,
      credit: line.side === 'credit' ? Number(line.amount) : 0,
      description: line.description || 'سند دستی',
      line_no: index + 1,
    }));
    const documentAmount = ledgerLines.reduce((sum, line) => sum + line.debit, 0);

    try {
      await postMut.mutateAsync({
        doc_type: 'manual',
        currency,
        amount: documentAmount,
        fee: 0,
        related_type: 'manual',
        related_name: 'سند دستی',
        description: 'سند دستی',
        lines: ledgerLines,
      });
      toast({ title: 'درخواست ثبت شد', description: 'ثبت سند از مسیر یکپارچه ارسال شد.' });
    } catch (error) {
      toast({ title: 'خطا در ثبت سند', description: error?.message || 'خطای نامشخص', variant: 'destructive' });
    }
  };

  return (
    <>
      <PageHeader title="سند دستی" icon={BookCopy} />
      <form onSubmit={handleSubmit} className="space-y-3">
        {lines.map((line, index) => {
          const accountOptions = line.account_type === 'bank'
            ? (bankAccounts || []).map(item => ({ id: item.id, label: item.bank_name }))
            : line.account_type === 'agent'
              ? (agents || []).map(item => ({ id: item.id, label: item.name }))
              : line.account_type === 'customer'
                ? (customers || []).map(item => ({ id: item.id, label: item.name }))
                : [];

          return (
            <div key={index} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">ردیف {index + 1}</span>
                {lines.length > 2 && (
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeLine(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={line.account_type} onValueChange={value => updateLine(index, 'account_type', value)}>
                  <SelectTrigger><SelectValue placeholder="نوع حساب" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">صندوق</SelectItem>
                    <SelectItem value="bank">بانک</SelectItem>
                    <SelectItem value="agent">نماینده</SelectItem>
                    <SelectItem value="customer">مشتری</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={line.currency} onValueChange={value => updateLine(index, 'currency', value)}>
                  <SelectTrigger><SelectValue placeholder="ارز" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AFN">AFN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="IRT">IRT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {line.account_type !== 'cash' && (
                <Select value={line.counter_id ? String(line.counter_id) : ''} onValueChange={value => updateLine(index, 'counter_id', value)}>
                  <SelectTrigger><SelectValue placeholder="انتخاب حساب" /></SelectTrigger>
                  <SelectContent>
                    {accountOptions.map(option => (
                      <SelectItem key={option.id} value={String(option.id)}>{option.label || 'بدون نام'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Select value={line.side} onValueChange={value => updateLine(index, 'side', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">بدهکار</SelectItem>
                    <SelectItem value="credit">بستانکار</SelectItem>
                  </SelectContent>
                </Select>
                <AmountInput value={line.amount} onChange={value => updateLine(index, 'amount', value)} />
              </div>
              <Input value={line.description} onChange={event => updateLine(index, 'description', event.target.value)} placeholder="توضیحات ردیف" />
            </div>
          );
        })}

        <Button type="button" variant="outline" className="w-full" onClick={addLine}>
          <Plus className="w-4 h-4" /> افزودن ردیف
        </Button>

        <div className={`rounded-lg border p-3 text-sm text-center font-medium ${isBalanced ? 'text-success' : 'text-destructive'}`}>
          {isBalanced ? '✓ سند از نظر مبلغ و ارز متوازن است' : '✗ سند ناتراز است یا ارز ردیف‌ها یکسان نیست'}
        </div>
        {!validAccounts && <p className="text-xs text-destructive">برای هر ردیف، حساب مقصد را انتخاب کنید.</p>}
        {!validAmounts && <p className="text-xs text-destructive">مبلغ همه ردیف‌ها باید بیشتر از صفر باشد.</p>}

        <Button type="submit" className="w-full" disabled={postMut.isPending || !canSubmit}>
          {postMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ثبت سند'}
        </Button>
      </form>
    </>
  );
}
