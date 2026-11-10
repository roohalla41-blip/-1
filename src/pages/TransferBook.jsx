import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransfers, useExecuteTransfer, useBankAccounts } from '@/lib/useSarraaf';
import { PageHeader, EmptyState, LoadingState, StatusBadge } from '@/components/sarraaf/Pieces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { buildTransferExecute } from '@/lib/ledger';
import { formatDate, formatNumber, TRANSFER_STATUS_LABELS } from '@/lib/sarraaf';
import { toast } from '@/components/ui/use-toast';
import { BookOpen, Search, CheckCircle, FileSpreadsheet } from 'lucide-react';
import DesktopTransferTable from '@/components/sarraaf/DesktopTransferTable';

const exportExcel = (transfers) => {
  if (!transfers || transfers.length === 0) return;
  const rows = transfers.map(t => ({
    'شماره حواله': t.transfer_no || '', 'نوع': t.direction === 'send' ? 'ارسال' : 'دریافت',
    'فرستنده': t.sender_name || '', 'گیرنده': t.receiver_name || '', 'موبایل گیرنده': t.receiver_phone || '',
    'مقصد': t.destination || '', 'ارز': t.currency, 'مبلغ': t.amount, 'کارمزد': t.fee || 0,
    'وضعیت': TRANSFER_STATUS_LABELS[t.status] || t.status, 'تاریخ': formatDate(t.created_date),
  }));
  const csv = '\uFEFF' + Object.keys(rows[0]).join(',') + '\n' + rows.map(r => Object.values(r).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'transfer-book.csv'; a.click();
  URL.revokeObjectURL(url);
};

export default function TransferBook() {
  const { data: transfers, isLoading } = useTransfers();
  const { data: bankAccounts = [] } = useBankAccounts();
  const execMut = useExecuteTransfer();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [execDialog, setExecDialog] = useState(null);
  const [payCounter, setPayCounter] = useState('cash');
  const [payAccountId, setPayAccountId] = useState('');

  const filtered = (transfers || []).filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.transfer_no || '').toLowerCase().includes(s) ||
        (t.sender_name || '').toLowerCase().includes(s) ||
        (t.receiver_name || '').toLowerCase().includes(s);
    }
    return true;
  });

  const handleExecute = async () => {
    if (!execDialog) return;
    const selectedBank = bankAccounts.find(account => String(account.id) === String(payAccountId));
    if (payCounter === 'bank' && !selectedBank) {
      toast({ title: 'خطا', description: 'حساب بانکی را انتخاب کنید', variant: 'destructive' });
      return;
    }
    if (payCounter === 'bank' && selectedBank.currency !== execDialog.currency) {
      toast({ title: 'خطا', description: 'ارز حساب بانکی باید با ارز حواله یکسان باشد', variant: 'destructive' });
      return;
    }

    try {
      const lines = buildTransferExecute(
        execDialog,
        payCounter,
        payAccountId,
        selectedBank?.bank_name || selectedBank?.holder || 'بانک'
      );
      await execMut.mutateAsync({ transfer: execDialog, lines, payCounter });
      toast({ title: 'اجرای حواله', description: 'سند پرداخت ثبت و حواله اجرا شد' });
      setExecDialog(null);
      setPayAccountId('');
    } catch (err) {
      toast({ title: 'خطا', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <PageHeader title="دفتر حواله" icon={BookOpen}
        actions={<Button size="sm" variant="outline" onClick={() => exportExcel(filtered)} title="خروجی Excel"><FileSpreadsheet className="w-4 h-4" /><span className="hidden md:inline">خروجی Excel</span></Button>}
      />
      <div className="flex gap-2 mb-3 md:rounded-xl md:border md:border-border md:bg-card md:p-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="pr-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="registered">ثبت‌شده</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="paid">پرداخت‌شده</SelectItem>
            <SelectItem value="cancelled">لغو‌شده</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <LoadingState /> : filtered.length === 0 ? <EmptyState icon={BookOpen} title="حواله‌ای نیست" /> : (
        <>
        <DesktopTransferTable transfers={filtered} onExecute={transfer => { setExecDialog(transfer); setPayCounter('cash'); setPayAccountId(''); }} />
        <div className="md:hidden space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="p-3 rounded-xl border bg-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">{t.transfer_no}</span>
                <StatusBadge status={t.status} labels={TRANSFER_STATUS_LABELS} />
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>گیرنده: {t.receiver_name} — {t.receiver_phone}</p>
                <p>مبلغ: {formatNumber(t.amount)} {t.currency} — {t.direction === 'send' ? 'ارسال' : 'دریافت'}</p>
                <p>تاریخ: {formatDate(t.created_date)}</p>
              </div>
              <div className="flex gap-1 mt-2">
                {t.status !== 'paid' && t.status !== 'cancelled' && (
                  <Button size="sm" onClick={() => { setExecDialog(t); setPayCounter('cash'); setPayAccountId(''); }}>
                    <CheckCircle className="w-3.5 h-3.5" /> اجرای حواله
                  </Button>
                )}
                <Link to={`/receipt?type=transfer&id=${t.id}`}>
                  <Button size="sm" variant="outline">رسید</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <Dialog open={!!execDialog} onOpenChange={() => setExecDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>اجرای حواله {execDialog?.transfer_no}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">مبلغ قابل پرداخت</p>
              <p className="text-lg font-bold tabular-nums">{formatNumber(execDialog?.amount)} {execDialog?.currency}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">تا زمان تکمیل حسابداری تسعیر، پرداخت باید دقیقاً با همان ارز و مبلغ حواله ثبت شود.</p>
            </div>
            <div>
              <label className="text-xs">حساب پرداخت</label>
              <Select value={payCounter} onValueChange={value => { setPayCounter(value); setPayAccountId(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">صندوق</SelectItem><SelectItem value="bank">بانک</SelectItem></SelectContent>
              </Select>
            </div>
            {payCounter === 'bank' && (
              <div>
                <label className="text-xs">حساب بانکی پرداخت</label>
                <Select value={payAccountId} onValueChange={setPayAccountId}>
                  <SelectTrigger><SelectValue placeholder="انتخاب حساب بانکی" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.filter(account => account.currency === execDialog?.currency).map(account => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.bank_name || 'بانک'} — {account.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bankAccounts.filter(account => account.currency === execDialog?.currency).length === 0 && (
                  <p className="mt-1 text-xs text-destructive">برای این ارز حساب بانکی ثبت نشده است.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecDialog(null)}>انصراف</Button>
            <Button onClick={handleExecute} disabled={execMut.isPending}>اجرا</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}