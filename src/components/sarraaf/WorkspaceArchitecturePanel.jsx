import React from 'react';
import { Boxes, Layers3, ShieldCheck, Database, Workflow, Building2, Users, Landmark, BookOpen, BarChart3, ClipboardList } from 'lucide-react';

const panels = [
  { title: 'ورود و دسترسی عمومی', detail: 'ورود، ثبت‌نام، بازیابی حساب و راهنمای شروع', preview: 'صفحه ورود برنامه؛ انتخاب ورود مشتری یا صراف', icon: Users },
  { title: 'پنل صرافی', detail: 'مشتریان، معاملات، صندوق، خزانه‌داری، حواله و حسابداری', preview: 'پس از ورود صراف؛ منوی اصلی سمت راست و داشبورد صراف', icon: Landmark },
  { title: 'پنل مشتری', detail: 'حساب شخصی، مانده، گردش حساب، کیف پول، سفارش‌ها و پشتیبانی', preview: 'پس از ورود مشتری؛ صفحه حساب و منوی مشتری', icon: Users },
  { title: 'خدمات و فروشندگی', detail: 'کاتالوگ خدمات، درخواست، پذیرش سفارش، انجام و تسویه', preview: 'پنل صراف ← خدمات و پشتیبانی؛ بخش خدمات آنلاین و فروشندگان', icon: Boxes },
  { title: 'پنل کارکنان', detail: 'وظایف محدود به نقش، شعبه، صندوق و سطح اختیار', preview: 'پنل صراف ← سازمان و دسترسی؛ بخش کارکنان و نقش‌ها', icon: ClipboardList },
  { title: 'پنل سازنده سامانه', detail: 'مدیریت ماژول‌ها، نقش‌ها، سطوح، سیاست‌ها و سلامت سامانه', preview: 'پنل سازنده ← تب «اسکلت سامانه» و تب‌های مدیریتی', icon: ShieldCheck },
];

const domains = [
  ['نمای کلی و داشبورد', 'شاخص‌های عملیاتی و مالی', 'پنل صراف ← نمای کلی و داشبورد'],
  ['مشتریان و طرف‌های حساب', 'مشتری، بدهکار، بستانکار و نماینده', 'پنل صراف ← مشتریان و طرف‌های حساب'],
  ['عملیات صرافی', 'خرید، فروش، تبدیل، دادوگرفت و حواله', 'پنل صراف ← عملیات صرافی'],
  ['صندوق، بانک و خزانه‌داری', 'صندوق‌ها، دریافت، پرداخت، انتقال و مغایرت‌گیری', 'پنل صراف ← صندوق، بانک و خزانه‌داری'],
  ['حسابداری و دفاتر', 'کدینگ، روزنامه، کل، معین، تفصیلی و تراز', 'پنل صراف ← حسابداری و دفاتر'],
  ['گزارش‌ها و تحلیل', 'سود و زیان، ترازنامه، جریان نقد و گزارش ارزی', 'پنل صراف ← گزارش‌ها و تحلیل'],
  ['سازمان و دسترسی', 'صرافی، شعب، کارکنان، نقش‌ها و مجوزها', 'پنل صراف و پنل سازنده ← سازمان و دسترسی'],
  ['ریسک، انطباق و حسابرسی', 'کنترل داخلی، رویدادها، KYC و AML', 'پنل سازنده ← مدیریت و ممیزی؛ بخشی از موارد در حال تکمیل'],
  ['اسناد و گردش تأیید', 'رسید، درخواست، پیوست و تأیید چندمرحله‌ای', 'پنل صراف ← اسناد و گردش تأیید'],
  ['خدمات و پشتیبانی', 'محصولات آنلاین، فروشندگان، پشتیبانی و دستیار', 'پنل صراف/مشتری ← خدمات و پشتیبانی'],
];

const tiers = [
  { name: 'Basic', fa: 'معمولی', detail: 'عملیات پایه صرافی، مشتریان، صندوق اصلی و گزارش‌های پایه', preview: 'پنل سازنده ← اسکلت سامانه ← سه سطح محصول' },
  { name: 'Professional', fa: 'متوسط', detail: 'چندکاربره، چندصندوقی، بانک، دفاتر مالی و گزارش‌های تحلیلی', preview: 'پنل سازنده ← اسکلت سامانه ← سه سطح محصول' },
  { name: 'Enterprise', fa: 'حرفه‌ای', detail: 'چندشعبه‌ای، کنترل سازمانی، تأیید چندمرحله‌ای و گزارش‌های تجمیعی', preview: 'پنل سازنده ← اسکلت سامانه ← سه سطح محصول' },
];

const principles = [
  'سطح اشتراک مشخص می‌کند کدام قابلیت‌ها در دسترس باشند؛ نقش کاربر مشخص می‌کند چه عملیاتی مجاز است.',
  'کنترل صحت مالی، امنیت و ثبت رویداد حسابرسی در هر سه سطح الزامی است.',
  'خاموش‌کردن ماژول نباید تاریخچه، مانده یا اسناد قبلی را حذف کند.',
  'هر قابلیت باید عملیاتی و آزموده باشد یا با وضعیت «در حال تکمیل» مشخص شود.',
  'ثبت قطعی مالی باید قابل ردیابی باشد؛ اصلاح سوابق از مسیر سند اصلاحی/معکوس انجام می‌شود.',
  'شماره نهایی سند باید از مرجع مرکزی صادر شود؛ صف آفلاین فقط وضعیت موقت دارد.',
];

function Section({ title, icon: Icon, children }) {
  return <section className="rounded-2xl border bg-card p-4 sm:p-5">
    <div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-bold">{title}</h2></div>
    {children}
  </section>;
}

export default function WorkspaceArchitecturePanel() {
  return <div dir="rtl" className="space-y-4">
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-bold">نقشه اسکلت هدف حساب صراف</p>
      <p className="mt-1 text-xs leading-6 text-muted-foreground">این نقشه ساختار یکپارچه محصول را نشان می‌دهد. نمایش یک ماژول به معنی آماده بودن عملیات مالی آن نیست؛ وضعیت عملیاتی هر بخش باید جداگانه آزموده شود.</p>
    </div>
    <Section title="پنل‌ها و سطوح دسترسی" icon={Layers3}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {panels.map(({title,detail,preview,icon:Icon}) => <article key={title} className="rounded-xl border p-3">
          <Icon className="mb-2 h-5 w-5 text-primary" /><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">{detail}</p><p className="mt-2 border-t pt-2 text-[11px] leading-5 text-primary">محل مشاهده در پیش‌نمایش: {preview}</p>
        </article>)}
      </div>
    </Section>
    <Section title="سه سطح محصول" icon={Building2}>
      <div className="grid gap-3 md:grid-cols-3">
        {tiers.map(tier => <article key={tier.name} className="rounded-xl border p-3">
          <p className="text-sm font-bold">{tier.name} — {tier.fa}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{tier.detail}</p><p className="mt-2 border-t pt-2 text-[11px] leading-5 text-primary">محل مشاهده در پیش‌نمایش: {tier.preview}</p>
        </article>)}
      </div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">سطح اشتراک و نقش کاربر دو مفهوم مستقل‌اند. انتخاب سطح به‌تنهایی مجوز مالی یا مدیریتی ایجاد نمی‌کند.</p>
    </Section>
    <Section title="دامنه‌های اصلی سامانه" icon={Boxes}>
      <div className="grid gap-2 sm:grid-cols-2">
        {domains.map(([title,detail,preview],i) => <article key={title} className="flex gap-3 rounded-xl border p-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums">{i+1}</span>
          <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p><p className="mt-2 border-t pt-2 text-[11px] leading-5 text-primary">محل مشاهده در پیش‌نمایش: {preview}</p></div>
        </article>)}
      </div>
    </Section>
    <Section title="قواعد یکپارچگی و حفاظت" icon={ShieldCheck}>
      <ul className="space-y-2">{principles.map(item => <li key={item} className="flex gap-2 text-xs leading-6"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{item}</span></li>)}</ul>
    </Section>
    <div className="rounded-xl border p-3 text-xs leading-6 text-muted-foreground">
      <Database className="mb-2 h-5 w-5 text-primary" />
      <p className="font-semibold text-foreground">اصل حفظ موجودیت‌ها</p>
      <p>این مرحله فقط نقشه و لایه رابط ساختاری را اضافه می‌کند. هیچ جدول، شناسه، مشتری، کاربر، سند یا تراکنش موجودی حذف، بازسازی یا جابه‌جا نمی‌شود.</p>
      <p className="mt-2">ترتیب تکمیل: تثبیت اسکلت ← ماتریس نقش/مسیر/سطح ← تکمیل گردش‌کارهای مالی ← آزمون امنیت و بازیابی.</p>
    </div>
  </div>;
}
