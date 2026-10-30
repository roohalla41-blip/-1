import React, { useState } from 'react';
import {
  Activity, ArrowLeftRight, Banknote, BarChart3, CheckCircle2, Clock3,
  FileText, FlaskConical, LockKeyhole, Monitor, RefreshCw, Send,
  ShieldCheck, Smartphone, Store, Users, Wallet, Plus, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MODULES = [
  { id: 'overview', label: 'نمای کلی', icon: BarChart3 },
  { id: 'customers', label: 'مشتریان', icon: Users },
  { id: 'trades', label: 'معاملات ارز', icon: ArrowLeftRight },
  { id: 'cash', label: 'صندوق و بانک', icon: Wallet },
  { id: 'remittance', label: 'حواله‌ها', icon: Send },
  { id: 'services', label: 'خدمات آنلاین', icon: Store },
  { id: 'reports', label: 'گزارش‌ها', icon: FileText },
  { id: 'security', label: 'امنیت و دسترسی', icon: ShieldCheck },
  { id: 'sync', label: 'کار آفلاین و همگام‌سازی', icon: RefreshCw },
];

const INITIAL_OPERATIONS = [
  { id: 'DEMO-2041', title: 'تبدیل یورو به دلار', detail: 'مشتری نمونه · صندوق مرکزی', amount: '€ 1,250', status: 'ثبت آزمایشی' },
  { id: 'DEMO-2040', title: 'دریافت وجه', detail: 'مشتری نمونه · صندوق شماره ۱', amount: '۳۵۰٫۰۰۰ تومان', status: 'تأیید آزمایشی' },
  { id: 'DEMO-2039', title: 'حواله خروجی', detail: 'مقصد نمونه · کارمند نمونه', amount: '۱٬۲۰۰ دلار', status: 'در انتظار بررسی' },
];

const SAMPLE_CUSTOMERS = [
  { name: 'مشتری نمونه الف', code: 'C-1001', balance: '۲٬۴۵۰ دلار', state: 'فعال' },
  { name: 'مشتری نمونه ب', code: 'C-1002', balance: '۸۵۰ یورو', state: 'فعال' },
  { name: 'مشتری نمونه ج', code: 'C-1003', balance: '۳۵۰٫۰۰۰ تومان', state: 'نیازمند بررسی' },
];

function Metric({ label, value, hint, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="text-[11px] sm:text-xs">{label}</span>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <div className="mt-2 text-lg sm:text-xl font-bold tabular-nums">{value}</div>
        <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function SectionContent({ section, operations, onAddOperation, testResult }) {
  if (section === 'overview') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <Metric label="موجودی صندوق نمونه" value="۱۲۵٬۰۰۰" hint="واحد نمایشی" icon={Wallet} />
          <Metric label="معاملات امروز" value="۲۴" hint="همه ساختگی" icon={ArrowLeftRight} />
          <Metric label="مشتریان نمونه" value="۱۲۸" hint="داده نمایشی" icon={Users} />
          <Metric label="حواله‌های در انتظار" value="۳" hint="برای نمایش گردش کار" icon={Clock3} />
        </div>
        <Card><CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm">آخرین عملیات آزمایشی</h3>
            <span className="text-[10px] text-muted-foreground">موقت و غیرواقعی</span>
          </div>
          <OperationList operations={operations.slice(0, 4)} />
          <Button size="sm" onClick={onAddOperation} className="w-full sm:w-auto"><Plus className="h-4 w-4 ml-1" />ثبت عملیات نمونه</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (section === 'customers') {
    return (
      <Card><CardContent className="p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">دفتر مشتریان نمونه</h3><Button size="sm" onClick={onAddOperation}><Plus className="h-4 w-4 ml-1" />عملیات تست</Button></div>
        <div className="space-y-2">
          {SAMPLE_CUSTOMERS.map(customer => <div key={customer.code} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
            <div><div className="text-sm font-medium">{customer.name}</div><div className="text-[10px] text-muted-foreground">{customer.code}</div></div>
            <div className="text-left"><div className="text-sm font-semibold">{customer.balance}</div><div className="text-[10px] text-muted-foreground">{customer.state}</div></div>
          </div>)}
        </div>
        <p className="text-[10px] text-muted-foreground">ثبت هویت، تاریخچه حساب، اسناد و گردش مشتری در نسخه پیشنهادی قابل ارزیابی است.</p>
      </CardContent></Card>
    );
  }

  if (section === 'trades') {
    return (
      <div className="grid md:grid-cols-2 gap-3">
        <Card><CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">فرم معامله ارز — نمایشی</h3>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-muted p-3"><div className="text-muted-foreground">ارز پرداختی</div><strong className="block mt-1">EUR · یورو</strong></div><div className="rounded-lg bg-muted p-3"><div className="text-muted-foreground">ارز دریافتی</div><strong className="block mt-1">USD · دلار</strong></div></div>
          <div className="rounded-lg border p-3 text-xs flex justify-between"><span>نرخ نمونه</span><strong>۱٫۰۸۵</strong></div>
          <Button className="w-full" onClick={onAddOperation}>شبیه‌سازی ثبت معامله</Button>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-2"><h3 className="font-semibold text-sm">کنترل‌های حسابداری</h3><p className="text-xs text-muted-foreground">در نسخه نهایی، ثبت معامله باید سند و ثبت‌های بدهکار/بستانکار را اتمیک ایجاد کند.</p><div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-4 w-4 text-emerald-600" />بررسی توازن سند</div><div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-4 w-4 text-emerald-600" />شناسه یکتای عملیات</div><div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-4 w-4 text-emerald-600" />ردیابی اصلاح و برگشت</div></CardContent></Card>
      </div>
    );
  }

  if (section === 'cash') {
    return (
      <Card><CardContent className="p-3 sm:p-4 space-y-3">
        <h3 className="font-semibold text-sm">صندوق‌ها و حساب‌های بانکی نمونه</h3>
        {[['صندوق اصلی','۱۲۵٬۰۰۰ واحد'],['صندوق شعبه نمونه','۴۸٬۵۰۰ واحد'],['حساب بانکی نمونه','۲۱۰٬۰۰۰ واحد']].map(row => <div key={row[0]} className="flex justify-between rounded-lg border p-3 text-sm"><span>{row[0]}</span><strong>{row[1]}</strong></div>)}
        <Button size="sm" onClick={onAddOperation}><Plus className="h-4 w-4 ml-1" />شبیه‌سازی انتقال بین صندوق و مشتری</Button>
      </CardContent></Card>
    );
  }

  if (section === 'remittance') {
    return (
      <Card><CardContent className="p-3 sm:p-4 space-y-3">
        <h3 className="font-semibold text-sm">چرخه حواله نمونه</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[['۱','ثبت درخواست'],['۲','بررسی و تأیید'],['۳','تسویه'],['۴','رسید و بایگانی']].map(x => <div key={x[0]} className="rounded-lg border p-3 text-center"><div className="mx-auto mb-2 h-6 w-6 rounded-full bg-muted text-xs leading-6">{x[0]}</div><span className="text-[11px]">{x[1]}</span></div>)}</div>
        <p className="text-xs text-muted-foreground">مبالغ، اشخاص و مقصدها در این صفحه ساختگی‌اند. هیچ حواله واقعی ثبت یا ارسال نمی‌شود.</p>
        <Button size="sm" onClick={onAddOperation}>اجرای سناریوی حواله</Button>
      </CardContent></Card>
    );
  }

  if (section === 'services') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {['شارژ موبایل','بسته اینترنت','خدمات دیجیتال','سفارش خدمات'].map((name, index) => <Card key={name}><CardContent className="p-4 flex items-center justify-between gap-2"><div><div className="text-sm font-semibold">{name}</div><div className="text-[10px] text-muted-foreground">محصول نمایشی {index + 1}</div></div><Button size="sm" variant="outline" onClick={onAddOperation}>آزمایش</Button></CardContent></Card>)}
      </div>
    );
  }

  if (section === 'reports') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <Metric label="جمع عملیات نمونه" value="۲۴" hint="امروز" icon={Activity} />
        <Metric label="حجم معاملات نمونه" value="۸٬۴۵۰" hint="واحد نمایشی" icon={BarChart3} />
        <Metric label="وضعیت مغایرت" value="۰" hint="در داده‌های ساختگی" icon={CheckCircle2} />
        <Metric label="گزارش‌های قابل بررسی" value="۶" hint="روزانه، ارزی، صندوق و مشتری" icon={FileText} />
      </div>
    );
  }

  if (section === 'security') {
    return (
      <Card><CardContent className="p-3 sm:p-4 space-y-3">
        <h3 className="font-semibold text-sm">نمونه نقش‌ها و سطح دسترسی</h3>
        {['سازنده سیستم — مدیریت تنظیمات و تأیید انتشار','مدیر شعبه — مدیریت عملیات شعبه','حسابدار — اسناد و گزارش‌های مالی','صندوق‌دار — دریافت و پرداخت مجاز','بازرس — مشاهده گزارش و سوابق'].map(role => <div key={role} className="flex items-center gap-2 rounded-lg border p-3 text-xs"><LockKeyhole className="h-4 w-4 shrink-0 text-muted-foreground" />{role}</div>)}
        <p className="text-[10px] text-muted-foreground">این فهرست صرفاً الگوی طراحی است و هیچ مجوز واقعی را تغییر نمی‌دهد.</p>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">پیش‌نمایش کار آفلاین و همگام‌سازی</h3>
      <div className="rounded-lg border p-3 flex items-center justify-between"><span className="text-xs">وضعیت این محیط</span><strong className="text-xs text-emerald-700">کاملاً مستقل از سرور زنده</strong></div>
      <div className="rounded-lg border p-3 flex items-center justify-between"><span className="text-xs">صف عملیات ساختگی</span><strong className="text-xs">{operations.length} مورد</strong></div>
      <div className="rounded-lg border p-3 flex items-center justify-between"><span className="text-xs">ارسال به Supabase زنده</span><strong className="text-xs">غیرفعال</strong></div>
      <p className="text-[10px] text-muted-foreground">در محصول نهایی، پیش‌نویس آفلاین پس از کنترل تعارض و تأیید سرور همگام می‌شود؛ این پیش‌نمایش هیچ همگام‌سازی واقعی انجام نمی‌دهد.</p>
    </CardContent></Card>
  );
}

function OperationList({ operations }) {
  return (
    <div className="space-y-2">
      {operations.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
        <div><div className="text-xs font-semibold">{item.title}</div><div className="text-[10px] text-muted-foreground mt-1">{item.id} · {item.detail}</div></div>
        <div className="text-left"><div className="text-xs font-bold">{item.amount}</div><div className="text-[10px] text-muted-foreground mt-1">{item.status}</div></div>
      </div>)}
    </div>
  );
}

export default function CreatorPreviewLab() {
  const [device, setDevice] = useState('desktop');
  const [section, setSection] = useState('overview');
  const [operations, setOperations] = useState(INITIAL_OPERATIONS);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [testResult, setTestResult] = useState('');

  const currentModule = MODULES.find(item => item.id === section) || MODULES[0];

  const addOperation = () => {
    const next = {
      id: 'DEMO-' + Date.now().toString().slice(-6),
      title: 'عملیات آزمایشی جدید',
      detail: 'ایجادشده فقط در حافظه همین صفحه',
      amount: 'مبلغ نمونه',
      status: 'صرفاً نمایشی',
    };
    setOperations(previous => [next, ...previous]);
    setTestResult('عملیات نمونه با موفقیت در همین پیش‌نمایش ساخته شد؛ هیچ داده‌ای به سرور ارسال نشد.');
    setSection('overview');
  };

  const resetPreview = () => {
    setOperations(INITIAL_OPERATIONS);
    setTestResult('داده‌های موقت پیش‌نمایش به حالت اولیه برگشت.');
  };

  const runCheck = () => {
    setTestResult('کنترل نمایشی انجام شد: داده‌ها ساختگی‌اند، اتصال زنده وجود ندارد و عملیات فقط در حافظه صفحه انجام می‌شود.');
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="border-emerald-300 dark:border-emerald-900">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950 p-2"><FlaskConical className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /></div>
              <div><h2 className="font-bold text-sm sm:text-base">آزمایشگاه توسعه حساب صراف</h2><p className="text-[10px] sm:text-xs text-muted-foreground mt-1">پیش‌نمایش نسخه پیشنهادی، جدا از برنامه زنده</p></div>
            </div>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">داده ساختگی · بدون اتصال زنده</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground">نوع نمایش را انتخاب کن:</div>
            <div className="flex gap-2">
              <Button size="sm" variant={device === 'desktop' ? 'default' : 'outline'} onClick={() => setDevice('desktop')}><Monitor className="h-4 w-4 ml-1" />لپ‌تاپ / دسکتاپ</Button>
              <Button size="sm" variant={device === 'mobile' ? 'default' : 'outline'} onClick={() => setDevice('mobile')}><Smartphone className="h-4 w-4 ml-1" />موبایل</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={runCheck}><ShieldCheck className="h-4 w-4 ml-1" />بررسی ایمنی محیط</Button>
        <Button size="sm" variant="outline" onClick={() => setComparisonOpen(value => !value)}><ArrowLeftRight className="h-4 w-4 ml-1" />مقایسه نسخه فعلی و پیشنهادی</Button>
        <Button size="sm" variant="outline" onClick={resetPreview}><RotateCcw className="h-4 w-4 ml-1" />بازنشانی داده نمونه</Button>
      </div>

      {comparisonOpen && <Card><CardContent className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm mb-3">مقایسه ساختاری</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3"><div className="font-semibold text-xs mb-2">برنامه فعلی</div><p className="text-[11px] text-muted-foreground">مبنای مقایسه؛ بدون تغییر در داده‌ها یا امکانات زنده.</p></div>
          <div className="rounded-lg border p-3"><div className="font-semibold text-xs mb-2">نسخه پیشنهادی</div><p className="text-[11px] text-muted-foreground">ماژول‌های یکپارچه، کنترل حسابداری، گزارش‌های دقیق‌تر، امنیت نقش‌محور و گردش آفلاین کنترل‌شده.</p></div>
        </div>
      </CardContent></Card>}

      <div className={device === 'mobile' ? 'mx-auto w-full max-w-[390px] rounded-[28px] border-[5px] border-slate-700 bg-background p-2 shadow-xl' : 'w-full rounded-xl border bg-background p-2 sm:p-3'}>
        <div className="flex items-center justify-between gap-2 border-b px-2 py-3">
          <div><div className="font-bold text-sm">حساب صراف</div><div className="text-[10px] text-muted-foreground">نسخه پیشنهادی · شعبه نمونه</div></div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-1 text-[9px] text-emerald-800 dark:text-emerald-300">آزمایشی</span><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Users className="h-4 w-4" /></div></div>
        </div>

        <div className={device === 'mobile' ? 'pt-2' : 'flex gap-3 pt-3'}>
          {device === 'desktop' && <aside className="w-48 shrink-0 space-y-1 border-l pl-3">
            {MODULES.map(item => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setSection(item.id)} className={'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-right text-xs transition ' + (section === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                <Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
              </button>;
            })}
          </aside>}
          <main className="min-w-0 flex-1 space-y-3 px-1 pb-2">
            {device === 'mobile' && <div className="flex gap-1 overflow-x-auto pb-2">
              {MODULES.map(item => {
                const Icon = item.icon;
                return <button key={item.id} onClick={() => setSection(item.id)} className={'shrink-0 rounded-lg border px-2 py-2 text-[10px] ' + (section === item.id ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                  <Icon className="h-4 w-4 mx-auto mb-1" />{item.label}
                </button>;
              })}
            </div>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-bold text-sm">{currentModule.label}</h3><p className="text-[10px] text-muted-foreground mt-1">پنل نمایشی با اطلاعات غیرواقعی</p></div>
              <span className="text-[9px] text-muted-foreground">کاربر: مدیر نمونه</span>
            </div>
            <SectionContent section={section} operations={operations} onAddOperation={addOperation} testResult={testResult} />
            {section === 'overview' && <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs font-semibold mb-2"><Activity className="h-4 w-4" />رویدادهای آزمایش</div><OperationList operations={operations} /></CardContent></Card>}
            {testResult && <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-3 text-[10px] text-emerald-900 dark:text-emerald-200">{testResult}</div>}
          </main>
        </div>
        {device === 'mobile' && <div className="mt-2 border-t py-2 text-center text-[9px] text-muted-foreground">پیش‌نمایش موبایل · منوها و عملیات صرفاً آزمایشی</div>}
      </div>

      <Card className="border-amber-300 dark:border-amber-900">
        <CardContent className="p-3 flex items-start gap-2">
          <LockKeyhole className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
          <div><div className="text-xs font-semibold">حفاظت از اطلاعات واقعی</div><p className="text-[10px] text-muted-foreground mt-1">این نمونه فقط از داده‌های ثابت و وضعیت موقت داخل حافظه همین صفحه استفاده می‌کند. به مشتریان، تراکنش‌ها، صندوق‌ها، حساب‌های بانکی، توکن ورود یا پایگاه داده زنده دسترسی ندارد و دکمه انتشار به نسخه اصلی هم ندارد.</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
