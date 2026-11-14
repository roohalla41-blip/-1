import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Loader2, FileText, FileArchive, Database, CheckCircle, AlertTriangle } from 'lucide-react';
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
        <h2 className="text-xl font-bold">مستندات اضطراری پروژه — PDF و فایل SQL مرجع</h2>
        <p className="text-xs text-muted-foreground">تاریخ: {now}</p>
      </div>

      {/* PDF Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-semibold">📄 دانلود سند فنی ثابت (نه بکاپ داده)</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            این PDF نقشه و مستندات ثابت داخل کد است؛ به‌صورت خودکار وضعیت زنده پروژه یا اطلاعات دیتابیس را استخراج نمی‌کند.
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
            <h3 className="text-sm font-semibold">📦 ZIP سورس‌کد — فعلاً غیرفعال</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ساخت ZIP کامل سورس در نسخه فعلی پیاده‌سازی نشده است. برای جلوگیری از تحویل فایل ناقص، این گزینه غیرفعال است.
          </p>
          <Button disabled className="w-full gap-2" size="lg">
            {zipLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> ZIP در حال بازسازی — غیرفعال</>
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
            <h3 className="text-sm font-semibold">🗄️ دانلود SQL مستندات محلی (نه بکاپ زنده)</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            این فایل فقط اسکریپت‌ها و مستندات SQL موجود در پوشه public را جمع‌آوری می‌کند؛ خروجی زنده Supabase، رکوردهای کاربران، فایل‌های Storage یا بکاپ قابل‌بازیابی کامل نیست.
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
        این خروجی‌ها مستندات هستند و جایگزین بکاپ واقعی و آزمایش‌شده از دیتابیس، Auth و Storage نیستند.
      </p>
    </div>
  );
}