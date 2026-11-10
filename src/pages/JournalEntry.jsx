import React, { useState } from 'react';
import { useCustomers, useBankAccounts, useAgents, usePostDocument } from '@/lib/useSarraaf';
import { PageHeader } from '@/components/sarraaf/Pieces';
import { AmountInput } from '@/components/sarraaf/Fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { BookCopy, Plus, Trash2, Loader2 } from 'lucide-react';

export default function JournalEntry() {
  const { data: customers } = useCustomers();
  const { data: bankAccounts } = useBankAccounts();
  const { data: agents } = useAgents();
  const postMut = usePostDocument();

  const [lines, setLines] = useState([
    { account_type: 'cash', counter_id: '', currency: 'AFN', amount: 0, side: 'debit', description: '' },
    { account_type: 'cash', counter_id: '', currency: 'AFN', amount: 0, side: 'credit', description: '' },
  ]);

  const updateLine = (i, field, value) => {
    setLines(current => current.map((line, index) => index === i ? { ...line, [field]: value } : line));
  };

  const addLine = () => setLines([...lines, { account_type: 'cash', counter_id: '', currency: 'AFN', amount: 0, side: 'debit', description: '' }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const balances = {};
  lines.forEach(line => {
    const currency = line.currency || 'AFN';
    if (!balances[currency]) balances[currency] = { debit: 0, credit: 0 };
    const amount = Number(line.amount) || 0;
    if (line.side === 'debit') balances[currency].debit += amount;
    else balances[currency].credit += amount;
  });
  const hasPositiveAmount = lines.some(line => Number(line.amount) > 0);
  const isBalanced = hasPositiveAmount && Object.values(balances).every(balance =>
    Math.abs(balance.debit - balance.credit) <= 0.01
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length < 2) { toast({ title: 'خطا', description: 'حداقل ۲ خط لازم است', variant: 'destructive' }); return; }
    if (!isBalanced) { toast({ title: 'خطا', description: 'سند در هر ارز باید جداگانه تراز باشد', variant: 'destructive' }); return; }

    const builtLines = [];
    for (const [index, line] of lines.entries()) {
      const account = line.account_type === 'bank'
        ? (bankAccounts || []).find(item => String(item.id) === String(line.counter_id))
        : line.account_type === 'customer'
          ? (customers || []).find(item => String(item.id) === String(line.counter_id))
          : line.account_type === 'agent'
            ? (agents || []).find(item => String(item.id) === String(line.counter_id))
            : null;
      const accountId = line.account_type === 'cash' ? line.currency : line.counter_id;
      if (!accountId) {
        toast({ title: 'خطا', description: `حساب خط ${index + 1} را انتخاب کنید`, variant: 'destructive' });
        return;
      }
      const amount = Number(line.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast({ title: 'خطا', description: `مبلغ خط ${index + 1} معتبر نیست`, variant: 'destructive' });
        return;
      }
      builtLines.push({
        account_type: line.account_type,
        account_id: String(accountId),
        account_name: line.account_type === 'cash' ? 'صندوق'
          : account?.bank_name || account?.name || account?.exchange_name || 'حساب',
        currency: line.currency,
        debit: line.side === 'debit' ? amount : 0,
        credit: line.side === 'credit' ? amount : 0,
        description: line.description || 'سند دستی',
        line_no: index + 1,
      });
    }

    const headerCurrency = lines[0].currency || 'AFN';
    const headerAmount = builtLines
      .filter(line => line.currency === headerCurrency)
      .reduce((sum, line) => sum + line.debit, 0);
    try {
      await postMut.mutateAsync({
        doc_type: 'manual',
        currency: headerCurrency,
        amount: headerAmount,
        fee: 0,
        description: 'سند دستی',
        lines: builtLines,
      });
      toast({ title: 'ثبت شد' });
    } catch (err) {
      toast({ title: 'خطا', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <PageHeader title="سند دستی" icon={BookCopy} />
      <form onSubmit={handleSubmit} className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="p-3 rounded-xl border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">خط {i + 1}</span>
              {lines.length > 2 && <Button type="button" size="icon" variant="ghost" onClick={() => removeLine(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={line.account_type} onValueChange={v => { updateLine(i, 'account_type', v); updateLine(i, 'counter_id', ''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">صندوق</SelectItem>
                  <SelectItem value="bank">بانک</SelectItem>
                  <SelectItem value="agent">نماینده</SelectItem>
                  <SelectItem value="customer">مشتری</SelectItem>
                </SelectContent>
              </Select>
              <Select value={line.currency} onValueChange={v => updateLine(i, 'currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="AFN">AFN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="IRT">IRT</SelectItem></SelectContent>
              </Select>
            </div>
            {line.account_type !== 'cash' && (
              <Select value={line.counter_id} onValueChange={v => updateLine(i, 'counter_id', v)}>
                <SelectTrigger><SelectValue placeholder={line.account_type === 'bank' ? 'انتخاب حساب بانکی' : line.account_type === 'customer' ? 'انتخاب مشتری' : 'انتخاب نماینده'} /></SelectTrigger>
                <SelectContent>
                  {line.account_type === 'bank' && (bankAccounts || []).filter(account => account.currency === line.currency).map(account => (
                    <SelectItem key={account.id} value={String(account.id)}>{account.bank_name || 'بانک'} — {account.currency}</SelectItem>
                  ))}
                  {line.account_type === 'customer' && (customers || []).map(account => (
                    <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                  ))}
                  {line.account_type === 'agent' && (agents || []).map(account => (
                    <SelectItem key={account.id} value={String(account.id)}>{account.name || account.exchange_name || 'نماینده'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Select value={line.side} onValueChange={v => updateLine(i, 'side', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="debit">بدهکار</SelectItem><SelectItem value="credit">بستانکار</SelectItem></SelectContent>
              </Select>
              <AmountInput value={line.amount} onChange={v => updateLine(i, 'amount', v)} />
            </div>
            <Input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="توضیحات" />
          </div>
        ))}
        <Button type="button" variant="outline" className="w-full" onClick={addLine}><Plus className="w-4 h-4" /> افزودن خط</Button>
        <div className={`text-sm text-center font-medium ${isBalanced ? 'text-success' : 'text-destructive'}`}>
          {isBalanced ? '✓ سند تراز است' : '✗ سند ناتراز است'}
        </div>
        <Button type="submit" className="w-full" disabled={postMut.isPending || !isBalanced}>
          {postMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ثبت سند'}
        </Button>
      </form>
    </>
  );
}