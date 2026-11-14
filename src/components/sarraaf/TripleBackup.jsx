import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Loader2, FileText, FileArchive, Database, CheckCircle, AlertTriangle, Smartphone, FileLock } from 'lucide-react';
import { generateTripleBackupPdf } from '@/lib/tripleBackupPdf';
import { generateTripleBackupZip } from '@/lib/tripleBackupZip';
import { generateTripleBackupSupabase } from '@/lib/tripleBackupSupabase';

const APK_BUILD_URL = 'https://github.com/roohalla41-blip/B2/actions/runs/40814336494';

export default function TripleBackup() {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState('');
  const [zipResult, setZipResult] = useState('');
  const [supabaseResult, setSupabaseResult] = useState('');
  const [error, setError] = useState('');
  const now = new Date().toLocaleString('fa-IR');

  const handlePdf = async () => {
    setPdfLoading(true); setError(''); setPdfResult('');
    try { setPdfResult(generateTripleBackupPdf()); }
    catch (e) { setError('PDF: ' + (e.message || 'خطا')); }
    finally { setPdfLoading(false); }
  };

  const handleZip = async () => {
    setZipLoading(true); setError(''); setZipResult('');
    try { setZipResult(await generateTripleBackupZip()); }
    catch (e) { setError('ZIP: ' + (e.message || 'خطا')); }
    finally { setZipLoading(false); }
  };

  const handleSupabase = async () => {
    setSupabaseLoading(true); setError(''); setSupabaseResult('');
    try { setSupabaseResult(await generateTripleBackupSupabase()); }
    catch (e) { setError('Supabase: ' + (e.message || 'خطا')); }
    finally { setSupabaseLoading(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">پشتیبان‌گیری اضطراری</h2>
        <p className="text-xs text-muted-foreground">تاریخ: {now}</p>
        <p className="text-xs text-amber-700">این بخش در شاخهٔ آزمایشی اصلاح شده؛ هنوز روی نسخهٔ زنده منتشر نشده است.</p>
      </div>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-red-600" /><h3 className="text-sm font-semibold">۱. PDF معماری پروژه</h3></div>
        <p className="text-xs text-muted-foreground leading-relaxed">گزارش معماری بر اساس اطلاعات موجود در مخزن؛ با هشدارهای روشن دربارهٔ مواردی که از دیتابیس زنده تأیید نشده‌اند.</p>
        <Button onClick={handlePdf} disabled={pdfLoading} className="w-full gap-2" size="lg">
          {pdfLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال تولید PDF...</> : <><Download className="w-4 h-4" /> دانلود PDF معماری</>}
        </Button>
        {pdfResult && <div className="flex items-center gap-2 text-xs text-green-600"><CheckCircle className="w-4 h-4" />{pdfResult}</div>}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2"><FileArchive className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">۲. ZIP سورس پروژه</h3></div>
        <p className="text-xs text-muted-foreground leading-relaxed">آرشیو سورس شاخهٔ release/restore-build در GitHub. این خروجی داده‌های زندهٔ Supabase و کلیدهای خصوصی را شامل نمی‌شود.</p>
        <Button onClick={handleZip} disabled={zipLoading} className="w-full gap-2" size="lg">
          {zipLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال آماده‌سازی...</> : <><Download className="w-4 h-4" /> دریافت ZIP سورس</>}
        </Button>
        {zipResult && <div className="flex items-center gap-2 text-xs text-green-600"><CheckCircle className="w-4 h-4" />{zipResult}</div>}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2"><Database className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">۳. ساختار و اسکریپت‌های Supabase</h3></div>
        <p className="text-xs text-muted-foreground leading-relaxed">خروجی مستندات و SQLهای محلی؛ این فایل به‌تنهایی بکاپ دیتابیس زنده نیست و شامل داده‌های واقعی کاربران نمی‌شود.</p>
        <Button onClick={handleSupabase} disabled={supabaseLoading} className="w-full gap-2" size="lg">
          {supabaseLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال تولید...</> : <><Download className="w-4 h-4" /> دانلود ساختار Supabase</>}
        </Button>
        {supabaseResult && <div className="flex items-center gap-2 text-xs text-green-600"><CheckCircle className="w-4 h-4" />{supabaseResult}</div>}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-violet-600" /><h3 className="text-sm font-semibold">۴. APK امضاشده</h3></div>
        <p className="text-xs text-muted-foreground leading-relaxed">برای ساخت APK از کپی A1 در B2، این اجرای GitHub Actions را باز کنید. اجرای بررسی‌شده شکست خورده و هنوز APK معتبر از آن ساخته نشده؛ این دکمه فایل APK جعلی یا قدیمی را به‌جای آن معرفی نمی‌کند.</p>
        <Button asChild className="w-full gap-2" size="lg" onClick={() => window.open(APK_BUILD_URL, '_blank', 'noopener,noreferrer')}>
          <span><Smartphone className="w-4 h-4 inline mr-2" />مشاهدهٔ وضعیت ساخت APK</span>
        </Button>
        <p className="text-xs text-muted-foreground">کلید خصوصی امضا باید جدا و امن بماند؛ هرگز آن را در ZIP یا PDF قرار ندهید.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2"><FileLock className="w-5 h-5 text-amber-600" /><h3 className="text-sm font-semibold">گزارش PDF محرمانهٔ هر کاربر</h3></div>
        <p className="text-xs text-muted-foreground leading-relaxed">بخش گزارش باید از مسیر امن سمت سرور داده‌های مجاز همان حساب را بگیرد و نقش مشتری/صراف را جدا کند. در حال حاضر تا زمانی که اکشن امن سمت سرور و فیلتر مالکیت داده‌ها تأیید نشود، تولید و ارسال گزارش واقعی فعال نمی‌شود؛ این کار از افشای اطلاعات مالی کاربران جلوگیری می‌کند.</p>
        <Button disabled className="w-full gap-2" size="lg"><FileLock className="w-4 h-4" /> گزارش اختصاصی — در انتظار تکمیل بک‌اند امن</Button>
      </CardContent></Card>

      {error && <Alert variant="destructive"><AlertTriangle className="w-4 h-4" /><AlertTitle>خطا</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <p className="text-center text-[10px] text-muted-foreground">این اصلاحات فقط در شاخهٔ آزمایشی قرار می‌گیرند؛ هیچ تغییر مستقیمی در A1 زنده یا Supabase انجام نمی‌شود.</p>
    </div>
  );
}
