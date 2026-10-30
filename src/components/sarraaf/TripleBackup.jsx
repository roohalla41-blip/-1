import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Loader2, FileText, FileArchive, Database, CheckCircle, AlertTriangle, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import { generateTripleBackupPdf } from '@/lib/tripleBackupPdf';
import { generateTripleBackupZip } from '@/lib/tripleBackupZip';
import { generateTripleBackupSupabase } from '@/lib/tripleBackupSupabase';

export default function TripleBackup() {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState('');
  const [zipResult, setZipResult] = useState('');
  const [supabaseResult, setSupabaseResult] = useState('');
  const [error, setError] = useState('');
  const [showTransferInfo, setShowTransferInfo] = useState(false);

  const now = new Date().toLocaleString('fa-IR');

  const handlePdf = async () => {
    setPdfLoading(true);
    setError('');
    setPdfResult('');
    try {
      const name = generateTripleBackupPdf();
      setPdfResult(name);
    } catch (e) {
      setError('PDF: ' + (e.message || 'خطا'));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleZip = async () => {
    setZipLoading(true);
    setError('');
    setZipResult('');
    try {
      const name = await generateTripleBackupZip();
      setZipResult(name);
    } catch (e) {
      setError('ZIP: ' + (e.message || 'خطا'));
    } finally {
      setZipLoading(false);
    }
  };

  const handleSupabase = async () => {
    setSupabaseLoading(true);
    setError('');
    setSupabaseResult('');
    try {
      const name = await generateTripleBackupSupabase();
      setSupabaseResult(name);
    } catch (e) {
      setError('Supabase: ' + (e.message || 'خطا'));
    } finally {
      setSupabaseLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">پشتیبان‌گیری اضطراری — سه خروجی مستقل</h2>
        <p className="text-xs text-muted-foreground">تاریخ: {now}</p>
      </div>

      {/* A1 to B2 transfer entry — separate from existing backups */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold">انتقال اطلاعات A1 به B2</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            مسیر مستقل برای بررسی سازگاری و آماده‌سازی انتقال حساب‌ها، سوابق و فایل‌ها به پروژه آزمایشی B2.
            بکاپ‌های قبلی در این بخش بدون تغییر باقی می‌مانند.
          </p>
          <Button type="button" variant="outline" onClick={() => setShowTransferInfo(value => !value)} className="w-full gap-2">
            <ShieldCheck className="w-4 h-4" />
            {showTransferInfo ? 'بستن جزئیات انتقال' : 'مشاهده وضعیت و مراحل انتقال'}
          </Button>
          {showTransferInfo && (
            <Alert>
              <AlertTitle>آماده‌سازی انتقال — هنوز اجرا نشده</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 text-xs leading-relaxed">
                  <p>۱. بررسی تطابق ساختار دیتابیس A1 و B2.</p>
                  <p>۲. تهیه خروجی امن و قابل اعتبارسنجی از داده‌ها و فایل‌ها.</p>
                  <p>۳. بررسی جداگانه روش انتقال حساب‌های ورود و امکان حفظ رمزهای قبلی.</p>
                  <p>۴. آزمایش واردسازی در B2 و تطبیق تعداد رکوردها و مانده‌های مالی.</p>
                  <p className="font-semibold">در این نسخه فقط ورودی این مسیر اضافه شده است. هیچ داده‌ای خوانده یا منتقل نمی‌شود و هیچ تغییری در A1 یا B2 ایجاد نمی‌شود. تا تکمیل بررسی امنیتی، دکمهٔ انتقال واقعی فعال نیست.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PDF Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-semibold">📄 دانلود PDF اضطراری</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            نقشه و مستندات کامل پروژه — شامل ۱۲ نقشه معماری، Frontend، Backend،
            Database، RLS، امنیت، منطق مالی، وابستگی‌های Base44 و Supabase.
          </p>
          <Button onClick={handlePdf} disabled={pdfLoading} className="w-full gap-2" size="lg">
            {pdfLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> در حال تولید PDF...</>
            ) : (
              <><Download className="w-4 h-4" /> دانلود PDF اضطراری</>
            )}
          </Button>
          {pdfResult && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="w-4 h-4" /> {pdfResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ZIP Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold">📦 دانلود ZIP پروژه</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Emergency Project Backup — شامل تمام سورس‌کد، صفحات، کامپوننت‌ها،
            توابع بک‌اند، فایل‌های پیکربندی، SQLها و مستندات.
            هیچ Secret یا Credential در ZIP قرار نمی‌گیرد.
          </p>
          <Button onClick={handleZip} disabled={zipLoading} className="w-full gap-2" size="lg">
            {zipLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> در حال تولید ZIP...</>
            ) : (
              <><Download className="w-4 h-4" /> دانلود ZIP پروژه</>
            )}
          </Button>
          {zipResult && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="w-4 h-4" /> {zipResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supabase Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold">🗄️ دانلود Backup Supabase</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Supabase Emergency Backup — شامل Tables، Columns، Views، RLS Policies،
            Indexes، Auth Structure، Storage و SQL اضطراری برای بازسازی.
          </p>
          <Button onClick={handleSupabase} disabled={supabaseLoading} className="w-full gap-2" size="lg">
            {supabaseLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> در حال تولید Backup...</>
            ) : (
              <><Download className="w-4 h-4" /> دانلود Backup Supabase</>
            )}
          </Button>
          {supabaseResult && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="w-4 h-4" /> {supabaseResult}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>خطا</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        هر سه خروجی مستقل هستند و می‌توانید هر کدام را جداگانه دانلود کنید.
        هیچ تغییری در ساختار پروژه ایجاد نمی‌شود.
      </p>
    </div>
  );
}