import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, CheckCircle2, Clock3, LockKeyhole, Power, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_MESSAGE = 'ورود کاربران صراف و مشتری موقتاً محدود شده است. لطفاً بعداً دوباره تلاش کنید.';

async function getStatus() {
  const { data, error } = await supabase.rpc('get_user_login_restriction');
  if (error) throw error;
  return data || { enabled: false, until: null, message: DEFAULT_MESSAGE, server_now: null };
}

export default function UserLoginRestrictionControl() {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [duration, setDuration] = useState('1440');
  const [customMinutes, setCustomMinutes] = useState('60');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);

  const refresh = async () => {
    try {
      const s = await getStatus();
      setStatus(s);
      setMessage(s.message || DEFAULT_MESSAGE);
      setOffset(s.server_now ? Date.parse(s.server_now) - Date.now() : 0);
      setError('');
    } catch (e) {
      setError(e.message || 'دریافت وضعیت محدودیت ورود ناموفق بود');
    }
  };

  useEffect(() => {
    refresh();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(refresh, 15000);
    return () => { clearInterval(clock); clearInterval(poll); };
  }, []);

  const enabled = Boolean(status?.enabled);
  const remaining = status?.until ? Math.max(0, Date.parse(status.until) - (now + offset)) : null;
  const remainingText = remaining === null ? 'تا خاموش‌کردن دستی فعال می‌ماند' : remaining <= 0 ? 'زمان پایان رسیده؛ در انتظار تأیید سرور' : (() => {
    const mins = Math.ceil(remaining / 60000);
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    const rest = mins % 60;
    return [days && days + ' روز', hours && hours + ' ساعت', rest && rest + ' دقیقه'].filter(Boolean).join(' و ');
  })();

  const save = async (nextEnabled) => {
    const minutes = duration === 'custom' ? Number(customMinutes) : Number(duration);
    if (nextEnabled && (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080)) {
      toast({ title: 'مدت نامعتبر است', description: 'مدت باید بین ۱ تا ۱۰٬۰۸۰ دقیقه باشد.', variant: 'destructive' });
      return;
    }
    if (!window.confirm(nextEnabled
      ? 'ورود صرافان و مشتریان محدود شود؟ حساب سازنده مستثنا می‌ماند.'
      : 'محدودیت ورود صرافان و مشتریان خاموش شود؟')) return;
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('set_user_login_restriction', {
        p_enabled: nextEnabled,
        p_duration_minutes: nextEnabled ? minutes : null,
        p_message: message.trim() || DEFAULT_MESSAGE,
      });
      if (rpcError) throw rpcError;
      if (!data || data.success === false) throw new Error(data?.error || 'restriction_update_failed');
      setStatus(data);
      setOffset(data.server_now ? Date.parse(data.server_now) - Date.now() : 0);
      toast({ title: nextEnabled ? 'محدودیت ورود فعال شد' : 'محدودیت ورود خاموش شد', description: nextEnabled ? 'سازنده همچنان امکان ورود دارد.' : 'ورود صرافان و مشتریان مجاز شد.' });
      setError('');
    } catch (e) {
      toast({ title: 'عملیات انجام نشد', description: e.message || 'خطا در ذخیره تنظیمات', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return <section dir="rtl" className="rounded-xl border bg-card p-4 space-y-4">
    <div className="flex items-center gap-2">
      <LockKeyhole className="h-5 w-5 text-primary" />
      <div><h3 className="text-sm font-bold">محدودیت زمان‌دار ورود کاربران</h3>
      <p className="text-xs text-muted-foreground mt-1">صفحه ورود نمایش داده می‌شود؛ صراف و مشتری مسدود می‌شوند و سازنده مستثنا است.</p></div>
    </div>
    {error && <div className="rounded-lg border border-destructive/40 p-3 text-xs text-destructive flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{error}<span> تا رفع خطا وضعیت را تغییر ندهید.</span></div>}
    {status && <div className={`rounded-lg border p-3 ${enabled ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
      <div className="flex items-center gap-2">{enabled ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        <span className="text-sm font-semibold">{enabled ? 'محدودیت ورود فعال است' : 'ورود همه کاربران مجاز است'}</span></div>
      {enabled && <p className="mt-2 text-xs text-muted-foreground">زمان باقی‌مانده: {remainingText}</p>}
    </div>}
    <div className="space-y-2">
      <label className="text-xs font-medium">مدت محدودیت</label>
      <select value={duration} onChange={e => setDuration(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        <option value="10">۱۰ دقیقه</option><option value="20">۲۰ دقیقه</option><option value="60">۱ ساعت</option><option value="1440">۱ روز</option><option value="custom">مدت دلخواه</option>
      </select>
      {duration === 'custom' && <input type="number" min="1" max="10080" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />}
    </div>
    <div className="space-y-2"><label className="text-xs font-medium">پیام هنگام تلاش برای ورود</label>
      <textarea rows={2} maxLength={300} value={message} onChange={e => setMessage(e.target.value)} className="w-full rounded-md border bg-background p-3 text-sm" /></div>
    <div className="flex flex-col sm:flex-row gap-2">
      <button disabled={busy || !status || Boolean(error)} onClick={() => save(true)} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Power className="h-4 w-4" />فعال‌سازی محدودیت</button>
      <button disabled={busy || !enabled || Boolean(error)} onClick={() => save(false)} className="flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Power className="h-4 w-4" />آزادکردن ورود</button>
      <button disabled={busy} onClick={refresh} className="flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm"><RefreshCw className="h-4 w-4" />تازه‌سازی</button>
    </div>
    <div className="flex items-start gap-2 border-t pt-3 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" /><p>پایان محدودیت با ساعت سرور محاسبه می‌شود. این کنترل نباید هیچ داده مالی یا سابقه کاربری را تغییر دهد.</p></div>
  </section>;
}
