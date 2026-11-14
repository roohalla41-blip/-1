import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, ArrowLeftRight, Wallet, Landmark, Send, BookOpen,
  FileBarChart, Settings, Bell, ShieldCheck, Store, ShoppingBag, CircleDollarSign,
  Search, Plus, Save, Printer, Download, RefreshCw, Check, X, Menu, Eye,
  Smartphone, Monitor, LockKeyhole, CreditCard, Globe, MessageCircle, UserRound,
  ChevronDown, Filter, CalendarDays, Paperclip, ArrowDownUp
} from 'lucide-react';

const iconItems = [
  ['داشبورد', LayoutDashboard, 'نمای کلی عملیات و شاخص‌ها', 'عمومی'],
  ['مشتریان', Users, 'پرونده و گردش حساب مشتری', 'مدیریت'],
  ['معاملات ارز', ArrowLeftRight, 'خرید، فروش و تبدیل ارز', 'عملیات مالی'],
  ['صندوق', Wallet, 'موجودی و گردش صندوق‌ها', 'خزانه‌داری'],
  ['بانک', Landmark, 'حساب‌های بانکی و مغایرت', 'خزانه‌داری'],
  ['حواله', Send, 'ثبت و پیگیری حواله‌ها', 'عملیات مالی'],
  ['دفتر روزنامه', BookOpen, 'اسناد و ثبت‌های حسابداری', 'حسابداری'],
  ['گزارش‌ها', FileBarChart, 'گزارش‌های مالی و مدیریتی', 'تحلیل'],
  ['تنظیمات', Settings, 'پیکربندی محیط کاری', 'سیستم'],
  ['اعلان‌ها', Bell, 'پیام‌ها و هشدارها', 'ارتباطات'],
  ['امنیت', ShieldCheck, 'نقش‌ها و مجوزها', 'سیستم'],
  ['فروشندگان', Store, 'مدیریت فروشندگان', 'خدمات'],
  ['محصولات', ShoppingBag, 'خدمات و محصولات آنلاین', 'خدمات'],
  ['پرداخت', CircleDollarSign, 'دریافت و پرداخت', 'عملیات مالی'],
  ['کیف پول', CreditCard, 'موجودی و گردش کیف پول', 'مشتری'],
  ['زبان و منطقه', Globe, 'زبان، تاریخ و جهت نمایش', 'سیستم'],
  ['گفت‌وگو', MessageCircle, 'ارتباطات و پشتیبانی', 'ارتباطات'],
  ['پروفایل', UserRound, 'اطلاعات حساب کاربری', 'حساب کاربری'],
];
const navItems = [
  ['عمومی', [['داشبورد','نمای کلی'],['اعلان‌ها','مرکز پیام']]],
  ['مدیریت', [['مشتریان','پرونده مشتری'],['صرافی‌ها و شعب','مدیریت سازمان'],['کاربران و نقش‌ها','دسترسی‌ها']]],
  ['عملیات مالی', [['خرید و فروش ارز','ثبت معامله'],['دریافت و پرداخت','عملیات نقدی'],['حواله‌ها','ارسال و دریافت'],['تبدیل ارز','محاسبه تبدیل']]],
  ['خزانه‌داری', [['صندوق‌ها','موجودی صندوق'],['بانک‌ها','حساب بانکی'],['انتقال بین صندوق','جابجایی داخلی']]],
  ['حسابداری', [['دفتر روزنامه','ثبت سند'],['دفتر کل','گردش حساب'],['تراز آزمایشی','کنترل تراز'],['صورت‌های مالی','گزارش مالی']]],
  ['خدمات', [['محصولات آنلاین','کاتالوگ خدمات'],['سفارش‌ها','پیگیری سفارش'],['فروشندگان','تأمین‌کنندگان']]],
  ['گزارش و کنترل', [['گزارش‌ها','گزارش‌های مدیریتی'],['مغایرت‌گیری','تطبیق مانده‌ها'],['سوابق فعالیت','ردپای حسابرسی']]],
  ['تنظیمات', [['تنظیمات عمومی','پیکربندی'],['زبان و تاریخ','قالب منطقه‌ای'],['امنیت','نشست و مجوز']]],
];
const buttonItems = [
  ['ایجاد جدید', Plus, 'بازکردن فرم ایجاد رکورد آزمایشی', 'Primary'],
  ['ذخیره', Save, 'ثبت محلی تغییرات فرم', 'Primary'],
  ['جست‌وجو', Search, 'جست‌وجوی رکوردها و صفحات', 'Secondary'],
  ['فیلتر', Filter, 'محدودکردن نتایج جدول', 'Secondary'],
  ['دریافت گزارش', Download, 'خروجی گرفتن از گزارش نمونه', 'Secondary'],
  ['چاپ', Printer, 'نمایش نسخه چاپی نمونه', 'Secondary'],
  ['به‌روزرسانی', RefreshCw, 'بارگذاری مجدد نمای آزمایشی', 'Secondary'],
  ['مشاهده جزئیات', Eye, 'بازکردن جزئیات رکورد نمونه', 'Ghost'],
  ['انتخاب تاریخ', CalendarDays, 'انتخاب بازه زمانی', 'Input'],
  ['پیوست فایل', Paperclip, 'نمایش ورودی پیوست آزمایشی', 'Input'],
  ['بازکردن منو', Menu, 'نمایش منوی کناری در موبایل', 'Navigation'],
  ['تغییر ترتیب', ArrowDownUp, 'مرتب‌سازی جدول', 'Table'],
];
const fields = [
  ['نام مشتری','متن','مثال: مشتری نمونه','اطلاعات پایه'],
  ['شماره تماس','تلفن','09xxxxxxxxx','اطلاعات پایه'],
  ['مبلغ','عدد','0.00','مالی'],
  ['ارز','انتخابی','USD / EUR / AFN','مالی'],
  ['تاریخ معامله','تاریخ','1405/08/09','مالی'],
  ['نوع عملیات','انتخابی','دریافت / پرداخت','مالی'],
  ['صندوق مقصد','انتخابی','صندوق اصلی','خزانه‌داری'],
  ['توضیحات','متن چندخطی','شرح عملیات...','تکمیلی'],
];
function Tile({children}) { return <div className="rounded-xl border border-slate-200 bg-white p-3">{children}</div>; }

export default function CoreStructureCatalog() {
  const [tab,setTab] = useState('icons');
  const [device,setDevice] = useState('desktop');
  const [query,setQuery] = useState('');
  const [notice,setNotice] = useState('این صفحه کاتالوگ رابط است؛ همه اطلاعات نمایشی و ساختگی‌اند.');
  const [demoName,setDemoName] = useState('');
  const [demoAmount,setDemoAmount] = useState('250');
  const [demoCurrency,setDemoCurrency] = useState('USD');
  const [demoDate,setDemoDate] = useState('1405/08/09');
  const [demoToggle,setDemoToggle] = useState(true);
  const filteredIcons = useMemo(()=>iconItems.filter(x=>x[0].includes(query)||x[2].includes(query)||x[3].includes(query)),[query]);
  const filteredButtons = useMemo(()=>buttonItems.filter(x=>x[0].includes(query)||x[2].includes(query)),[query]);
  const previewClass = device==='mobile'?'mx-auto max-w-[390px]':'w-full';
  const tabs=[['icons','کتابخانه آیکون‌ها'],['buttons','کتابخانه دکمه‌ها'],['navigation','منو و زیرمنو'],['forms','فرم‌ها و ورودی‌ها'],['screen','نمای کلی صفحه']];
  return <div dir="rtl" className="space-y-4">
    <div className="rounded-2xl bg-slate-900 p-4 text-white sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs text-indigo-200">کتابخانه رابط کاربری</div><h3 className="mt-1 text-lg font-extrabold">نمایش ساختار هسته برنامه</h3><p className="mt-1 text-xs text-slate-300">آیکون‌ها، دکمه‌ها، منوها و اجزای فرم به‌صورت جداگانه</p></div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200"><LockKeyhole className="h-4 w-4"/>نمایش امن و بدون اتصال زنده</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={'rounded-xl px-3 py-2 text-xs font-semibold '+(tab===id?'bg-white text-slate-900':'bg-white/10 text-slate-200 hover:bg-white/20')}>{label}</button>)}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3">
      <label className="flex min-w-[210px] flex-1 items-center gap-2 rounded-lg border px-3 py-2"><Search className="h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجو در اجزا..." className="w-full text-sm outline-none"/></label>
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"><button onClick={()=>setDevice('desktop')} className={'flex items-center gap-1 rounded-md px-3 py-2 text-xs '+(device==='desktop'?'bg-white shadow':'text-slate-500')}><Monitor className="h-4 w-4"/>دسکتاپ</button><button onClick={()=>setDevice('mobile')} className={'flex items-center gap-1 rounded-md px-3 py-2 text-xs '+(device==='mobile'?'bg-white shadow':'text-slate-500')}><Smartphone className="h-4 w-4"/>موبایل</button></div>
    </div>
    <div className={previewClass+' space-y-4 transition-all'}>
      {tab==='icons'&&<section className="rounded-2xl border bg-white p-4"><div className="mb-3 flex items-center justify-between"><h4 className="font-bold">آیکون‌ها به‌صورت مستقل</h4><span className="text-xs text-slate-500">{filteredIcons.length} مورد</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{filteredIcons.map(([name,Icon,desc,group])=><Tile key={name}><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon className="h-6 w-6"/></div><div className="min-w-0"><div className="text-sm font-bold">{name}</div><div className="text-[11px] text-slate-500">{group}</div></div></div><p className="mt-2 text-xs text-slate-600">{desc}</p></Tile>)}</div></section>}
      {tab==='buttons'&&<section className="rounded-2xl border bg-white p-4"><div className="mb-3 flex items-center justify-between"><h4 className="font-bold">دکمه‌ها و رفتار نمایشی</h4><span className="text-xs text-slate-500">{filteredButtons.length} مورد</span></div><div className="grid gap-3 sm:grid-cols-2">{filteredButtons.map(([name,Icon,desc,kind])=><Tile key={name}><div className="flex flex-wrap items-center justify-between gap-2"><button onClick={()=>setNotice('نمونه «'+name+'» انتخاب شد؛ این عمل فقط نمایشی است.')} className={'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold '+(kind==='Primary'?'bg-indigo-600 text-white':kind==='Secondary'?'border border-slate-300 text-slate-700':'bg-slate-100 text-slate-700')}><Icon className="h-4 w-4"/>{name}</button><span className="text-[10px] text-slate-400">{kind}</span></div><p className="mt-2 text-xs text-slate-600">{desc}</p></Tile>)}</div></section>}
      {tab==='navigation'&&<section className="rounded-2xl border bg-white p-4"><h4 className="mb-3 font-bold">درخت منو و زیرمنوها</h4><div className="grid gap-3 sm:grid-cols-2">{navItems.filter(g=>g[0].includes(query)||g[1].some(x=>x[0].includes(query)||x[1].includes(query))).map(([group,items])=><Tile key={group}><div className="mb-2 flex items-center gap-2 font-bold"><ChevronDown className="h-4 w-4 text-indigo-600"/>{group}</div><div className="space-y-1">{items.map(([label,desc])=><div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"><span>{label}</span><span className="text-slate-500">{desc}</span></div>)}</div></Tile>)}</div></section>}
      {tab==='forms'&&<section className="rounded-2xl border bg-white p-4"><h4 className="mb-3 font-bold">نمونه فرم ثبت عملیات</h4><div className="grid gap-3 sm:grid-cols-2">{fields.filter(x=>x[0].includes(query)||x[1].includes(query)||x[3].includes(query)).map(([label,type,placeholder,group])=><label key={label} className="block"><span className="mb-1 block text-xs font-medium text-slate-600">{label} <span className="text-[10px] text-slate-400">· {type} · {group}</span></span>{label==='ارز'?<select value={demoCurrency} onChange={e=>setDemoCurrency(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option>USD</option><option>EUR</option><option>AFN</option></select>:label==='تاریخ معامله'?<input value={demoDate} onChange={e=>setDemoDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>:label==='مبلغ'?<input type="number" value={demoAmount} onChange={e=>setDemoAmount(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>:label==='توضیحات'?<textarea placeholder={placeholder} className="w-full rounded-lg border px-3 py-2 text-sm"/>:label==='نوع عملیات'||label==='صندوق مقصد'?<select className="w-full rounded-lg border px-3 py-2 text-sm"><option>{label==='نوع عملیات'?'دریافت':'صندوق اصلی'}</option><option>{label==='نوع عملیات'?'پرداخت':'صندوق دوم'}</option></select>:<input value={demoName} onChange={e=>setDemoName(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border px-3 py-2 text-sm"/>}</label>)}</div><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={()=>setNotice('فرم نمونه برای '+(demoName||'مشتری آزمایشی')+' با مبلغ '+demoAmount+' '+demoCurrency+' بررسی شد؛ هیچ سندی در سیستم واقعی ثبت نشد.')} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"><Check className="ml-1 inline h-4 w-4"/>بررسی فرم نمونه</button><button onClick={()=>{setDemoName('');setDemoAmount('250');setDemoCurrency('USD');setDemoDate('1405/08/09');setNotice('فرم نمونه بازنشانی شد.');}} className="rounded-lg border px-4 py-2 text-xs">پاک‌کردن فرم</button></div></section>}
      {tab==='screen'&&<section className="overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between bg-slate-900 p-3 text-white"><div className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5"/><b className="text-sm">حساب صراف</b></div><div className="flex items-center gap-2 text-xs"><Bell className="h-4 w-4"/><UserRound className="h-4 w-4"/></div></div><div className="grid grid-cols-1 sm:grid-cols-[170px_1fr]"><aside className="hidden space-y-1 bg-slate-800 p-3 text-xs text-slate-200 sm:block">{navItems.slice(0,5).map(([g,items])=><div key={g} className="rounded-lg bg-white/5 p-2"><b>{g}</b><div className="mt-1 text-[10px] text-slate-400">{items.map(x=>x[0]).join('، ')}</div></div>)}</aside><main className="space-y-3 bg-slate-50 p-3"><div className="flex items-center justify-between"><b className="text-sm">داشبورد مدیریتی</b><span className="text-[10px] text-slate-500">نمایش ساختاری</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['مشتریان','۱۲۸'],['معاملات امروز','۴۶'],['صندوق‌ها','۰۸'],['حواله‌های باز','۱۲']].map(x=><div key={x[0]} className="rounded-xl border bg-white p-3"><div className="text-[10px] text-slate-500">{x[0]}</div><b className="mt-1 block text-lg">{x[1]}</b></div>)}</div><div className="rounded-xl border bg-white p-3"><b className="text-xs">عملیات سریع</b><div className="mt-2 flex flex-wrap gap-2">{['مشتری جدید','ثبت معامله','دریافت وجه','ارسال حواله'].map(x=><button key={x} onClick={()=>setNotice('عملیات سریع «'+x+'» فقط در پیش‌نمایش انتخاب شد.')} className="rounded-lg border px-3 py-2 text-[11px]">{x}</button>)}</div></div><div className="rounded-xl border bg-white p-3"><b className="text-xs">گردش‌های اخیر</b><div className="mt-2 space-y-2 text-xs text-slate-500"><div className="flex justify-between"><span>ثبت معامله نمونه</span><span>امروز</span></div><div className="flex justify-between"><span>دریافت از مشتری نمونه</span><span>امروز</span></div></div></div></main></div></section>}
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><LockKeyhole className="ml-1 inline h-4 w-4"/>وضعیت: {notice} این کاتالوگ، فهرست پیشنهادی و قابل بازبینی است؛ به‌تنهایی اثبات نمی‌کند که همه اجزای متناظر در نسخه زنده عملیاتی هستند.</div>
  </div>;
}
