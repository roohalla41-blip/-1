import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Power, RefreshCw, ShieldCheck } from 'lucide-react';
import { getMaintenanceStatus, setMaintenanceMode } from '@/lib/maintenance';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_MESSAGE = 'برای بهبود خدمات و ارتقای سیستم، دسترسی عمومی موقتاً متوقف شده است.';

function remainingLabel(until, offsetMs = 0, now = Date.now()) {
  if (!until) return 'بدون زمان پایان؛ تا خاموش‌کردن دستی فعال می‌ماند';
  const ms = Date.parse(until) - (now + offsetMs);
  if (!Number.isFinite(ms) || ms <= 0) return 'زمان تعیین‌شده پایان یافته است';
  const minutes = Math.ceil(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days ? `${days} روز` : '', hours ? `${hours} ساعت` : '', mins ? `${mins} دقیقه` : ''].filter(Boolean).join(' و ');
}

export default function MaintenanceControl() {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [duration, setDuration] = useState('20');
  const [customMinutes, setCustomMinutes] = useState('90');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getMaintenanceStatus();
        if (!active) return;
        setStatus(result);
        setServerOffset(result.server_now ? Date.parse(result.server_now) - Date.now() : 0);
        setMessage(result.message || DEFAULT_MESSAGE);
        setLoadError('');
      } catch (error) {
        if (active) setLoadError(error.message || 'دریافت وضعیت تعمیرات ناموفق بود');
      }
    };
    load();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      clearInterval(clock);
    };
  }, []);

  const isActive = Boolean(status?.enabled);
  const until = status?.until || null;
  const remaining = remainingLabel(until, serverOffset, now);

  const refresh = async () => {
    setBusy(true);
    try {
      const result = await getMaintenanceStatus();
      setStatus(result);
      setServerOffset(result.server_now ? Date.parse(result.server_now) - Date.now() : 0);
      setMessage(result.message || DEFAULT_MESSAGE);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'دریافت وضعیت تعمیرات ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const save = async (enabled) => {
    const minutes = duration === 'custom' ? Number(customMinutes) : Number(duration);
    if (enabled && (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080)) {
      toast({ title: 'مدت نامعتبر است', description: 'مدت سفارشی باید بین ۱ تا ۱۰٬۰۸۰ دقیقه باشد.', variant: 'destructive' });
      return;
    }
    const prompt = enabled
      ? 'حالت تعمیرات برای همه کاربران عادی فعال شود؟'
      : 'حالت تعمیرات خاموش و دسترسی کاربران عادی دوباره باز شود؟';
    if (!window.confirm(prompt)) return;

    setBusy(true);
    try {
      const result = await setMaintenanceMode({
        enabled,
        durationMinutes: enabled ? minutes : null,
        message: message.trim() || DEFAULT_MESSAGE,
      });
      setStatus(result);
      setServerOffset(result.server_now ? Date.parse(result.server_now) - Date.now() : 0);
      setMessage(result.message || DEFAULT_MESSAGE);
      setLoadError('');
      toast({
        title: enabled ? 'حالت تعمیرات فعال شد' : 'حالت تعمیرات خاموش شد',
        description: enabled ? 'زمان پایان توسط ساعت سرور محاسبه می‌شود.' : 'دسترسی کاربران عادی دوباره باز شد.',
      });
    } catch (error) {
      toast({ title: 'عملیات انجام نشد', description: error.message || 'خطا در ذخیره تنظیمات تعمیرات', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold">مدیریت هوشمند تعمیرات و دسترسی کاربران</h3>
            <p className="text-xs text-muted-foreground mt-1">کنترل سراسری ورود و نشست کاربران؛ مستقل از ساعت دستگاه‌ها</p>
          </div>
        </div>

        {loadError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{loadError}. تا زمان اتصال امن به سرور، وضعیت را تغییر ندهید.</span>
          </div>
        )}

        {!status && !loadError && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" /> در حال دریافت وضعیت از سرور…</div>
        )}

        {status && (
          <div className={`rounded-lg border p-3 ${isActive ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
            <div className="flex items-center gap-2">
              {isActive ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span className="text-sm font-semibold">{isActive ? 'تعمیرات فعال است؛ کاربران عادی مسدود هستند' : 'تعمیرات خاموش است؛ ورود کاربران عادی مجاز است'}</span>
            </div>
            {isActive && <p className="mt-2 text-xs text-muted-foreground">زمان باقی‌مانده: {remaining}</p>}
            {until && <p className="mt-1 text-[11px] text-muted-foreground">پایان برنامه‌ریزی‌شده: {new Date(until).toLocaleString('fa-IR')}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-medium" htmlFor="maintenance-duration">مدت تعمیرات</label>
          <select id="maintenance-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="10">۱۰ دقیقه</option>
            <option value="20">۲۰ دقیقه</option>
            <option value="60">۱ ساعت</option>
            <option value="1440">۱ روز</option>
            <option value="custom">مدت سفارشی</option>
          </select>
          {duration === 'custom' && (
            <div className="flex items-center gap-2">
              <input id="maintenance-custom-minutes" type="number" min="1" max="10080" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">دقیقه (حداکثر ۷ روز)</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium" htmlFor="maintenance-message">پیام نمایش به کاربران</label>
          <textarea id="maintenance-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} className="w-full rounded-md border bg-background p-3 text-sm leading-6" />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" disabled={busy || !status || Boolean(loadError)} onClick={() => save(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Power className="h-4 w-4" /> فعال‌سازی / تمدید تعمیرات
          </button>
          <button type="button" disabled={busy || !status || Boolean(loadError) || !isActive} onClick={() => save(false)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
            <Power className="h-4 w-4" /> خاموش‌کردن تعمیرات
          </button>
          <button type="button" disabled={busy} onClick={refresh} className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> تازه‌سازی
          </button>
        </div>

        <div className="flex items-start gap-2 border-t pt-3 text-[11px] leading-5 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <p>این کنترل فقط برای سازنده اصلی است. پایان زمان با ساعت سرور اعمال می‌شود؛ خاموش‌کردن دستی نیز فوراً وضعیت را تغییر می‌دهد. اطلاعات مالی و سوابق کاربران در این عملیات تغییر نمی‌کنند.</p>
        </div>
      </section>
    </div>
  );
}
