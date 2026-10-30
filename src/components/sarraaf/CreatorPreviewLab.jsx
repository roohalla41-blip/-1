import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeftRight, BarChart3, Bell, BookOpen, Boxes, BriefcaseBusiness,
  Building2, CheckCircle2, ChevronDown, ClipboardList, Download, FileText,
  FlaskConical, Headphones, LockKeyhole, Menu, Plus, RefreshCw, RotateCcw,
  Search, Settings, ShieldCheck, ShoppingBag, Store, Trash2, Upload, Users,
  Wallet, X, UserRound, Landmark, Send, CircleDollarSign
} from 'lucide-react';

const STORE_KEY = 'a1_preview_workspace_v2';
const MODULES = [
  {id:'overview',label:'داشبورد',icon:BarChart3,group:'عمومی'},
  {id:'customers',label:'مشتریان',icon:Users,group:'مدیریت'},
  {id:'exchangers',label:'صراف‌ها و شعب',icon:Building2,group:'مدیریت'},
  {id:'sellers',label:'فروشندگان',icon:Store,group:'مدیریت'},
  {id:'cash',label:'صندوق‌ها و بانک',icon:Wallet,group:'عملیات مالی'},
  {id:'transactions',label:'دریافت و پرداخت',icon:CircleDollarSign,group:'عملیات مالی'},
  {id:'trades',label:'خرید و فروش ارز',icon:ArrowLeftRight,group:'عملیات مالی'},
  {id:'transfers',label:'حواله و انتقال',icon:Send,group:'عملیات مالی'},
  {id:'currencies',label:'ارزها و نرخ‌ها',icon:Activity,group:'عملیات مالی'},
  {id:'ledger',label:'اسناد و دفاتر',icon:BookOpen,group:'حسابداری'},
  {id:'reports',label:'گزارش‌ها و مغایرت',icon:ClipboardList,group:'حسابداری'},
  {id:'services',label:'محصولات و خدمات آنلاین',icon:ShoppingBag,group:'خدمات'},
  {id:'orders',label:'سفارش‌ها',icon:Boxes,group:'خدمات'},
  {id:'roles',label:'نقش‌ها و دسترسی‌ها',icon:ShieldCheck,group:'مدیریت سیستم'},
  {id:'settings',label:'تنظیمات و کارمزدها',icon:Settings,group:'مدیریت سیستم'},
  {id:'notifications',label:'اعلان‌ها و پیام‌ها',icon:Bell,group:'ارتباطات'},
  {id:'support',label:'پشتیبانی',icon:Headphones,group:'ارتباطات'},
];
const initialData = () => ({
  customers:[
    {id:'C-1001',name:'مشتری نمونه الف',phone:'09120000001',balance:2450,currency:'USD',status:'فعال'},
    {id:'C-1002',name:'مشتری نمونه ب',phone:'09120000002',balance:850,currency:'EUR',status:'فعال'}
  ],
  exchangers:[{id:'E-001',name:'صرافی نمونه مرکزی',phone:'09121111111',city:'تهران',status:'فعال'}],
  sellers:[{id:'S-001',name:'فروشنده نمونه شارژ',phone:'09122222222',service:'شارژ موبایل',status:'فعال'}],
  cashboxes:[{id:'K-001',name:'صندوق اصلی',currency:'USD',balance:125000},{id:'K-002',name:'صندوق شعبه',currency:'USD',balance:48500}],
  transactions:[],
  transfers:[],
  trades:[],
  orders:[{id:'O-1001',customer:'مشتری نمونه الف',service:'شارژ موبایل',amount:10,status:'در انتظار'}],
  services:[{id:'P-001',name:'شارژ موبایل',fee:1,enabled:true},{id:'P-002',name:'بسته اینترنت',fee:2,enabled:true},{id:'P-003',name:'خدمات دیجیتال',fee:0,enabled:false}],
  rates:[{code:'USD',name:'دلار آمریکا',rate:1},{code:'EUR',name:'یورو',rate:1.08},{code:'AFN',name:'افغانی',rate:0.014}],
  fees:{transfer:1,trade:0.5,recharge:1},
  notifications:[{id:'N-001',title:'خوش آمدید',body:'این محیط کاملاً آزمایشی است.',status:'جدید'}],
  audit:[{id:'A-001',title:'شروع محیط آزمایشی',detail:'داده اولیه ساختگی بارگذاری شد.',at:new Date().toLocaleString('fa-IR')}]
});
const safeLoad = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return initialData();
    const parsed = JSON.parse(raw);
    return {...initialData(),...parsed};
  } catch { return initialData(); }
};
const money = value => Number(value || 0).toLocaleString('fa-IR');
const uid = prefix => prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase();

function Field({label,value,onChange,type='text',placeholder=''}) {
  return <label className="block min-w-0"><span className="mb-1 block text-xs text-slate-600">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>;
}
function SelectField({label,value,onChange,options}) {
  return <label className="block min-w-0"><span className="mb-1 block text-xs text-slate-600">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500">{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}
function PanelCard({title,children,action}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-800">{title}</h3>{action}</div>{children}</section>;
}
function Stat({label,value,icon:Icon}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="flex items-center justify-between gap-2 text-xs text-slate-500"><span>{label}</span><Icon className="h-4 w-4"/></div><div className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">{value}</div></div>;
}
function Table({columns,rows,onDelete}) {
  if (!rows.length) return <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">هنوز داده‌ای ثبت نشده است.</div>;
  return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[520px] text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr>{columns.map(c=><th key={c.key} className="whitespace-nowrap px-3 py-3 font-semibold">{c.label}</th>)}{onDelete&&<th className="px-3 py-3">عملیات</th>}</tr></thead><tbody>{rows.map((row,i)=><tr key={row.id||i} className="border-t border-slate-100">{columns.map(c=><td key={c.key} className="whitespace-nowrap px-3 py-3">{c.render?c.render(row):row[c.key]}</td>)}{onDelete&&<td className="px-3 py-2"><button onClick={()=>onDelete(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="حذف آزمایشی"><Trash2 className="h-4 w-4"/></button></td>}</tr>)}</tbody></table></div>;
}

export default function CreatorPreviewLab() {
  const [data,setData] = useState(safeLoad);
  const [role,setRole] = useState('creator');
  const [section,setSection] = useState('overview');
  const [mobileMenu,setMobileMenu] = useState(false);
  const [query,setQuery] = useState('');
  const [notice,setNotice] = useState('محیط مستقل آماده است؛ همه تغییرات فقط در حافظه محلی همین مرورگر ذخیره می‌شوند.');
  const [form,setForm] = useState({name:'',phone:'',city:'تهران',amount:'',currency:'USD',cashbox:'K-001',service:'شارژ موبایل',fee:'1',title:''});
  const [showForm,setShowForm] = useState(false);
  const [amount,setAmount] = useState('100');
  const [from,setFrom] = useState('cash');
  const [to,setTo] = useState('customer');
  const [selectedCustomer,setSelectedCustomer] = useState('C-1001');
  const [selectedCashbox,setSelectedCashbox] = useState('K-001');
  const [selectedService,setSelectedService] = useState('P-001');

  useEffect(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(data));}catch{setNotice('ذخیره‌سازی مرورگر در دسترس نیست؛ داده‌ها تا زمان بسته‌شدن صفحه موقت می‌مانند.');}},[data]);
  const current = MODULES.find(m=>m.id===section)||MODULES[0];
  const addAudit = (title,detail) => setData(d=>({...d,audit:[{id:uid('LOG'),title,detail,at:new Date().toLocaleString('fa-IR')},...d.audit].slice(0,150)}));
  const updateList = (key,list) => setData(d=>({...d,[key]:list}));
  const addPerson = key => {
    if(!form.name.trim()){setNotice('نام را وارد کن.');return;}
    const prefix=key==='customers'?'C':key==='exchangers'?'E':'S';
    const item={id:uid(prefix),name:form.name.trim(),phone:form.phone,city:form.city,status:'فعال',balance:0,currency:form.currency,service:form.service};
    setData(d=>({...d,[key]:[item,...d[key]],audit:[{id:uid('LOG'),title:'ایجاد '+(key==='customers'?'مشتری':key==='exchangers'?'صراف':'فروشنده'),detail:item.name,at:new Date().toLocaleString('fa-IR')},...d.audit]}));
    setForm(f=>({...f,name:'',phone:''}));setShowForm(false);setNotice('رکورد آزمایشی ایجاد شد.');
  };
  const addCashbox = () => {
    if(!form.name.trim()){setNotice('نام صندوق را وارد کن.');return;}
    const item={id:uid('K'),name:form.name,currency:form.currency,balance:0};
    setData(d=>({...d,cashboxes:[item,...d.cashboxes],audit:[{id:uid('LOG'),title:'ایجاد صندوق آزمایشی',detail:item.name,at:new Date().toLocaleString('fa-IR')},...d.audit]}));
    setForm(f=>({...f,name:''}));setShowForm(false);setNotice('صندوق آزمایشی با موفقیت ایجاد شد.');
  };
  const addOperation = kind => {
    const value=Number(amount);
    if(!Number.isFinite(value)||value<=0){setNotice('مبلغ باید بیشتر از صفر باشد.');return;}
    const customer=data.customers.find(x=>x.id===selectedCustomer);
    const box=data.cashboxes.find(x=>x.id===selectedCashbox);
    if(!customer||!box){setNotice('مشتری یا صندوق انتخاب‌شده پیدا نشد.');return;}
    const isCashToCustomer=kind==='cash_to_customer';
    if(isCashToCustomer&&box.balance<value){setNotice('موجودی صندوق نمونه کافی نیست.');return;}
    if(!isCashToCustomer&&customer.balance<value){setNotice('موجودی مشتری نمونه کافی نیست.');return;}
    setData(d=>{
      const nextCustomers=d.customers.map(c=>c.id===customer.id?{...c,balance:c.balance+(isCashToCustomer?value:-value)}:c);
      const nextBoxes=d.cashboxes.map(b=>b.id===box.id?{...b,balance:b.balance+(isCashToCustomer?-value:value)}:b);
      const tx={id:uid('TX'),kind:isCashToCustomer?'انتقال صندوق به مشتری':'انتقال مشتری به صندوق',customer:customer.name,cashbox:box.name,amount:value,currency:customer.currency,status:'ثبت آزمایشی',at:new Date().toLocaleString('fa-IR')};
      return {...d,customers:nextCustomers,cashboxes:nextBoxes,transactions:[tx,...d.transactions],audit:[{id:uid('LOG'),title:tx.kind,detail:money(value)+' '+tx.currency,at:tx.at},...d.audit]};
    });
    setNotice('عملیات آزمایشی ثبت شد و مانده‌های محلی به‌روزرسانی شدند.');
  };
  const addTrade = () => {
    const value=Number(amount);if(!value||value<=0){setNotice('مبلغ معامله معتبر نیست.');return;}
    const tx={id:uid('TR'),customer:data.customers.find(c=>c.id===selectedCustomer)?.name||'مشتری نمونه',side:'خرید ارز',amount:value,currency:'USD',rate:1.08,status:'ثبت آزمایشی',at:new Date().toLocaleString('fa-IR')};
    updateList('trades',[tx,...data.trades]);addAudit('ثبت معامله آزمایشی',money(value)+' USD');setNotice('معامله نمونه ثبت شد.');
  };
  const addTransfer = () => {
    const value=Number(amount);if(!value||value<=0){setNotice('مبلغ حواله معتبر نیست.');return;}
    const tx={id:uid('TRF'),customer:data.customers.find(c=>c.id===selectedCustomer)?.name||'مشتری نمونه',destination:form.city||'مقصد نمونه',amount:value,currency:form.currency,status:'در انتظار بررسی',at:new Date().toLocaleString('fa-IR')};
    updateList('transfers',[tx,...data.transfers]);addAudit('ایجاد حواله آزمایشی',money(value)+' '+tx.currency);setNotice('حواله آزمایشی به فهرست اضافه شد.');
  };
  const addOrder = () => {
    const service=data.services.find(s=>s.id===selectedService);
    const order={id:uid('ORD'),customer:data.customers.find(c=>c.id===selectedCustomer)?.name||'مشتری نمونه',service:service?.name||'خدمت نمونه',amount:Number(amount)||1,status:'جدید',at:new Date().toLocaleString('fa-IR')};
    updateList('orders',[order,...data.orders]);addAudit('ثبت سفارش آزمایشی',order.service);setNotice('سفارش آزمایشی ثبت شد.');
  };
  const deleteRow = (key,row) => {updateList(key,data[key].filter(x=>x.id!==row.id));addAudit('حذف رکورد آزمایشی',row.name||row.id);setNotice('رکورد از محیط آزمایشی حذف شد.');};
  const toggleService = row => updateList('services',data.services.map(s=>s.id===row.id?{...s,enabled:!s.enabled}:s));
  const reset = () => {if(!window.confirm('تمام داده‌های آزمایشی این مرورگر به حالت اولیه برگردد؟'))return;setData(initialData());setNotice('محیط آزمایشی به حالت اولیه بازنشانی شد.');};
  const exportData = () => {const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='a1-preview-data.json';a.click();URL.revokeObjectURL(url);setNotice('خروجی داده‌های آزمایشی آماده شد.');};
  const importData = e => {const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(String(reader.result));if(!parsed.customers||!parsed.cashboxes)throw new Error('invalid');setData({...initialData(),...parsed});setNotice('داده آزمایشی وارد شد.');}catch{setNotice('فایل انتخاب‌شده ساختار معتبر آزمایشگاه را ندارد.');}};reader.readAsText(file);e.target.value='';};
  const visibleModules=useMemo(()=>MODULES.filter(m=>m.label.includes(query)||m.group.includes(query)),[query]);
  const roleLabel={creator:'سازنده سیستم',exchanger:'صراف',customer:'مشتری',seller:'فروشنده'}[role];
  const allowed=role==='creator'?MODULES:role==='exchanger'?MODULES.filter(m=>!['roles','settings'].includes(m.id)):role==='customer'?MODULES.filter(m=>['overview','orders','services','support','notifications'].includes(m.id)):MODULES.filter(m=>['overview','orders','services','support'].includes(m.id));
  const openForm = () => {setForm(f=>({...f,name:'',phone:''}));setShowForm(true);};

  const content = () => {
    if(section==='overview') return <div className="space-y-4"><div className="grid grid-cols-2 gap-2 xl:grid-cols-4"><Stat label="مشتریان آزمایشی" value={money(data.customers.length)} icon={Users}/><Stat label="صندوق‌ها" value={money(data.cashboxes.length)} icon={Wallet}/><Stat label="عملیات مالی" value={money(data.transactions.length+data.trades.length)} icon={Activity}/><Stat label="سفارش‌ها" value={money(data.orders.length)} icon={ShoppingBag}/></div><div className="grid gap-4 xl:grid-cols-2"><PanelCard title="آخرین رویدادها"><div className="space-y-2">{data.audit.slice(0,6).map(a=><div key={a.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 p-3"><div><div className="text-sm font-semibold">{a.title}</div><div className="mt-1 text-xs text-slate-500">{a.detail}</div></div><span className="text-[10px] text-slate-400">{a.at}</span></div>)}</div></PanelCard><PanelCard title="وضعیت محیط"><div className="space-y-3 text-sm"><p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4"/>ذخیره‌سازی محلی فعال</p><p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4"/>اتصال Supabase غیرفعال</p><p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4"/>داده‌ها ساختگی و مستقل</p><p className="text-xs text-slate-500">اطلاعات بین دستگاه‌ها همگام نمی‌شوند. پاک‌کردن داده‌های مرورگر ممکن است اطلاعات آزمایشی را حذف کند.</p><div className="flex flex-wrap gap-2"><button onClick={exportData} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Download className="ml-1 inline h-4 w-4"/>خروجی گرفتن</button><label className="cursor-pointer rounded-xl border px-3 py-2 text-xs"><Upload className="ml-1 inline h-4 w-4"/>ورود فایل<input type="file" accept="application/json" onChange={importData} className="hidden"/></label><button onClick={reset} className="rounded-xl border border-rose-200 px-3 py-2 text-xs text-rose-600"><RotateCcw className="ml-1 inline h-4 w-4"/>بازنشانی</button></div></div></PanelCard></div></div>;
    if(section==='customers'||section==='exchangers'||section==='sellers'){
      const key=section, title=section==='customers'?'مشتریان':section==='exchangers'?'صراف‌ها و شعب':'فروشندگان';
      const rows=data[key];const columns=section==='customers'?[{key:'id',label:'شناسه'},{key:'name',label:'نام'},{key:'phone',label:'تلفن'},{key:'balance',label:'مانده',render:r=>money(r.balance)+' '+r.currency},{key:'status',label:'وضعیت'}]:section==='exchangers'?[{key:'id',label:'شناسه'},{key:'name',label:'نام صرافی'},{key:'phone',label:'تلفن'},{key:'city',label:'شهر'},{key:'status',label:'وضعیت'}]:[{key:'id',label:'شناسه'},{key:'name',label:'نام فروشنده'},{key:'phone',label:'تلفن'},{key:'service',label:'خدمت'},{key:'status',label:'وضعیت'}];
      return <div className="space-y-4"><PanelCard title={'دفتر '+title} action={<button onClick={openForm} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="ml-1 inline h-4 w-4"/>ایجاد مورد جدید</button>}>{showForm&&<div className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2"><Field label="نام" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))}/><Field label="شماره تماس" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))}/><Field label="شهر / توضیح" value={form.city} onChange={v=>setForm(f=>({...f,city:v}))}/><div className="flex items-end gap-2"><button onClick={()=>addPerson(key)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm text-white">ذخیره آزمایشی</button><button onClick={()=>setShowForm(false)} className="rounded-xl border px-4 py-2.5 text-sm">انصراف</button></div></div>}<Table columns={columns} rows={rows} onDelete={row=>deleteRow(key,row)}/></PanelCard></div>;
    }
    if(section==='cash') return <div className="space-y-4"><PanelCard title="صندوق‌ها و بانک" action={<button onClick={openForm} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs text-white"><Plus className="ml-1 inline h-4 w-4"/>صندوق جدید</button>}>{showForm&&<div className="mb-3 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3"><Field label="نام صندوق" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))}/><SelectField label="ارز" value={form.currency} onChange={v=>setForm(f=>({...f,currency:v}))} options={data.rates.map(r=>({value:r.code,label:r.code+' - '+r.name}))}/><button onClick={addCashbox} className="self-end rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white">ایجاد صندوق</button></div>}<Table columns={[{key:'id',label:'شناسه'},{key:'name',label:'نام صندوق'},{key:'currency',label:'ارز'},{key:'balance',label:'موجودی',render:r=>money(r.balance)}]} rows={data.cashboxes} onDelete={r=>deleteRow('cashboxes',r)}/></PanelCard><PanelCard title="انتقال بین حساب مشتری و صندوق"><div className="grid gap-3 sm:grid-cols-2"><SelectField label="مشتری" value={selectedCustomer} onChange={setSelectedCustomer} options={data.customers.map(c=>({value:c.id,label:c.name}))}/><SelectField label="صندوق" value={selectedCashbox} onChange={setSelectedCashbox} options={data.cashboxes.map(c=>({value:c.id,label:c.name}))}/><Field label="مبلغ" type="number" value={amount} onChange={setAmount}/><div className="flex flex-wrap items-end gap-2"><button onClick={()=>addOperation('cash_to_customer')} className="rounded-xl bg-indigo-600 px-3 py-2.5 text-xs text-white">صندوق ← مشتری</button><button onClick={()=>addOperation('customer_to_cash')} className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs text-white">مشتری ← صندوق</button></div></div></PanelCard></div>;
    if(section==='transactions') return <div className="space-y-4"><PanelCard title="ثبت دریافت و پرداخت آزمایشی"><div className="grid gap-3 sm:grid-cols-2"><SelectField label="مشتری" value={selectedCustomer} onChange={setSelectedCustomer} options={data.customers.map(c=>({value:c.id,label:c.name}))}/><SelectField label="صندوق" value={selectedCashbox} onChange={setSelectedCashbox} options={data.cashboxes.map(c=>({value:c.id,label:c.name}))}/><Field label="مبلغ" type="number" value={amount} onChange={setAmount}/><div className="flex items-end gap-2"><button onClick={()=>addOperation('customer_to_cash')} className="rounded-xl bg-indigo-600 px-3 py-2.5 text-xs text-white">دریافت از مشتری</button><button onClick={()=>addOperation('cash_to_customer')} className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs text-white">پرداخت به مشتری</button></div></div></PanelCard><PanelCard title="دفتر عملیات"><Table columns={[{key:'id',label:'شناسه'},{key:'kind',label:'نوع'},{key:'customer',label:'مشتری'},{key:'cashbox',label:'صندوق'},{key:'amount',label:'مبلغ',render:r=>money(r.amount)+' '+r.currency},{key:'status',label:'وضعیت'}]} rows={data.transactions}/></PanelCard></div>;
    if(section==='trades') return <PanelCard title="معامله ارز آزمایشی"><div className="grid gap-3 sm:grid-cols-2"><SelectField label="مشتری" value={selectedCustomer} onChange={setSelectedCustomer} options={data.customers.map(c=>({value:c.id,label:c.name}))}/><Field label="مبلغ" type="number" value={amount} onChange={setAmount}/><div className="rounded-xl bg-slate-50 p-3 text-sm">نرخ نمونه EUR/USD: <b>1.08</b> · کارمزد: {data.fees.trade}%</div><button onClick={addTrade} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">ثبت معامله نمونه</button></div><div className="mt-4"><Table columns={[{key:'id',label:'شناسه'},{key:'customer',label:'مشتری'},{key:'side',label:'نوع'},{key:'amount',label:'مبلغ',render:r=>money(r.amount)+' '+r.currency},{key:'status',label:'وضعیت'}]} rows={data.trades}/></div></PanelCard>;
    if(section==='transfers') return <PanelCard title="ثبت حواله آزمایشی"><div className="grid gap-3 sm:grid-cols-2"><SelectField label="مشتری" value={selectedCustomer} onChange={setSelectedCustomer} options={data.customers.map(c=>({value:c.id,label:c.name}))}/><Field label="مقصد" value={form.city} onChange={v=>setForm(f=>({...f,city:v}))}/><Field label="مبلغ" type="number" value={amount} onChange={setAmount}/><SelectField label="ارز" value={form.currency} onChange={v=>setForm(f=>({...f,currency:v}))} options={data.rates.map(r=>({value:r.code,label:r.code}))}/><button onClick={addTransfer} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">ثبت حواله</button></div><div className="mt-4"><Table columns={[{key:'id',label:'شناسه'},{key:'customer',label:'مشتری'},{key:'destination',label:'مقصد'},{key:'amount',label:'مبلغ',render:r=>money(r.amount)+' '+r.currency},{key:'status',label:'وضعیت'}]} rows={data.transfers}/></div></PanelCard>;
    if(section==='currencies') return <PanelCard title="ارزها و نرخ‌های آزمایشی"><Table columns={[{key:'code',label:'کد ارز'},{key:'name',label:'نام ارز'},{key:'rate',label:'نرخ نسبت به USD',render:r=><input type="number" step="0.001" value={r.rate} onChange={e=>updateList('rates',data.rates.map(x=>x.code===r.code?{...x,rate:Number(e.target.value)}:x))} className="w-28 rounded-lg border px-2 py-1"/>}]} rows={data.rates}/></PanelCard>;
    if(section==='ledger') return <div className="space-y-4"><PanelCard title="اسناد و دفاتر آزمایشی"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['دفتر روزنامه','journal'],['دفتر کل','general'],['ثبت سند','entry'],['ترازنامه','balance']].map(x=><div key={x[1]} className="rounded-xl border p-3 text-center"><BookOpen className="mx-auto mb-2 h-5 w-5 text-indigo-600"/><div className="text-sm font-semibold">{x[0]}</div><div className="mt-1 text-xs text-slate-500">نمایش نمونه</div></div>)}</div><p className="mt-3 text-xs text-slate-500">این دفترها برای بررسی چیدمان هستند؛ ثبت حسابداری رسمی یا سند متصل به دفتر کل ایجاد نمی‌کنند.</p></PanelCard><PanelCard title="سوابق عملیات"><Table columns={[{key:'id',label:'شناسه'},{key:'title',label:'شرح'},{key:'detail',label:'جزئیات'},{key:'at',label:'زمان'}]} rows={data.audit}/></PanelCard></div>;
    if(section==='reports') return <PanelCard title="گزارش‌های آزمایشی"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label="مشتریان" value={money(data.customers.length)} icon={Users}/><Stat label="حواله‌ها" value={money(data.transfers.length)} icon={Send}/><Stat label="معاملات" value={money(data.trades.length)} icon={ArrowLeftRight}/><Stat label="سفارش‌ها" value={money(data.orders.length)} icon={ShoppingBag}/></div><div className="mt-4"><Table columns={[{key:'id',label:'شناسه'},{key:'title',label:'رویداد'},{key:'detail',label:'شرح'},{key:'at',label:'زمان'}]} rows={data.audit}/></div></PanelCard>;
    if(section==='services') return <PanelCard title="مدیریت محصولات آنلاین"><div className="space-y-2">{data.services.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><div className="font-semibold">{s.name}</div><div className="text-xs text-slate-500">کارمزد نمونه: {s.fee}% · شناسه {s.id}</div></div><button onClick={()=>toggleService(s)} className={'rounded-full px-3 py-1.5 text-xs '+(s.enabled?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600')}>{s.enabled?'فعال':'غیرفعال'} · تغییر وضعیت</button></div>)}</div></PanelCard>;
    if(section==='orders') return <PanelCard title="سفارش‌های مشتری و فروشنده"><div className="mb-3 grid gap-3 sm:grid-cols-3"><SelectField label="مشتری" value={selectedCustomer} onChange={setSelectedCustomer} options={data.customers.map(c=>({value:c.id,label:c.name}))}/><SelectField label="خدمت" value={selectedService} onChange={setSelectedService} options={data.services.map(s=>({value:s.id,label:s.name}))}/><button onClick={addOrder} className="self-end rounded-xl bg-indigo-600 px-3 py-2.5 text-sm text-white">ایجاد سفارش نمونه</button></div><Table columns={[{key:'id',label:'شناسه'},{key:'customer',label:'مشتری'},{key:'service',label:'خدمت'},{key:'amount',label:'مبلغ'},{key:'status',label:'وضعیت'}]} rows={data.orders}/></PanelCard>;
    if(section==='roles') return <PanelCard title="نقش‌ها و دسترسی‌های نمونه"><div className="grid gap-3 sm:grid-cols-2">{[['سازنده سیستم','تمام ابزارهای آزمایشگاه'],['صراف','عملیات شعبه، مشتری، صندوق و حواله'],['مشتری','کیف پول، سفارش، خدمات و پشتیبانی'],['فروشنده','سفارش‌های تخصیص‌یافته و وضعیت انجام']].map(x=><div key={x[0]} className="rounded-xl border p-3"><div className="font-bold">{x[0]}</div><div className="mt-1 text-xs text-slate-500">{x[1]}</div></div>)}</div><p className="mt-3 text-xs text-amber-700">تعویض نقش در بالای صفحه فقط شبیه‌سازی رابط کاربری است و مجوزهای حساب واقعی را تغییر نمی‌دهد.</p></PanelCard>;
    if(section==='settings') return <PanelCard title="تنظیمات، نرخ و کارمزدهای آزمایشی"><div className="grid gap-3 sm:grid-cols-3"><Field label="کارمزد حواله (%)" type="number" value={String(data.fees.transfer)} onChange={v=>setData(d=>({...d,fees:{...d.fees,transfer:Number(v)}}))}/><Field label="کارمزد معامله (%)" type="number" value={String(data.fees.trade)} onChange={v=>setData(d=>({...d,fees:{...d.fees,trade:Number(v)}}))}/><Field label="کارمزد شارژ (%)" type="number" value={String(data.fees.recharge)} onChange={v=>setData(d=>({...d,fees:{...d.fees,recharge:Number(v)}}))}/></div><p className="mt-3 text-xs text-slate-500">تغییرات فقط در همین محیط آزمایشی ذخیره می‌شوند.</p></PanelCard>;
    if(section==='notifications') return <PanelCard title="اعلان‌ها و پیام‌های نمونه"><Table columns={[{key:'id',label:'شناسه'},{key:'title',label:'عنوان'},{key:'body',label:'متن'},{key:'status',label:'وضعیت'}]} rows={data.notifications}/></PanelCard>;
    if(section==='support') return <PanelCard title="مرکز پشتیبانی آزمایشی"><div className="grid gap-3 sm:grid-cols-2"><Field label="موضوع پیام" value={form.title} onChange={v=>setForm(f=>({...f,title:v}))}/><button onClick={()=>{if(!form.title.trim()){setNotice('موضوع پیام را بنویس.');return;}setData(d=>({...d,notifications:[{id:uid('MSG'),title:form.title,body:'درخواست آزمایشی ثبت شد.',status:'ثبت‌شده'},...d.notifications]}));setForm(f=>({...f,title:''}));setNotice('درخواست پشتیبانی نمونه ثبت شد.');}} className="self-end rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white">ارسال درخواست</button></div><p className="mt-3 text-xs text-slate-500">پیام فقط در محیط آزمایشی نگهداری می‌شود و برای پشتیبانی واقعی ارسال نمی‌شود.</p></PanelCard>;
    return null;
  };

  const menu = <div className="space-y-4">{['عمومی','مدیریت','عملیات مالی','حسابداری','خدمات','مدیریت سیستم','ارتباطات'].map(group=>{const list=allowed.filter(m=>m.group===group);if(!list.length)return null;return <div key={group}><div className="mb-1 px-3 text-[10px] font-bold text-slate-400">{group}</div>{list.map(m=>{const Icon=m.icon;return <button key={m.id} onClick={()=>{setSection(m.id);setMobileMenu(false);}} className={'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm '+(section===m.id?'bg-indigo-600 text-white':'text-slate-300 hover:bg-slate-700')}><Icon className="h-4 w-4 shrink-0"/><span>{m.label}</span></button>;})}</div>;})}</div>;

  return <div dir="rtl" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-900 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white sm:px-5">
      <div className="flex items-center gap-2"><div className="rounded-xl bg-indigo-500 p-2"><FlaskConical className="h-5 w-5"/></div><div><div className="font-bold">آزمایشگاه کامل حساب صراف</div><div className="text-[10px] text-slate-300">محیط مستقل · داده ساختگی · ذخیره محلی</div></div></div>
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] text-emerald-200">بدون اتصال زنده</span><select value={role} onChange={e=>{setRole(e.target.value);setSection('overview');}} className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white"><option value="creator">نمایش نقش سازنده</option><option value="exchanger">نمایش نقش صراف</option><option value="customer">نمایش نقش مشتری</option><option value="seller">نمایش نقش فروشنده</option></select><button onClick={()=>setMobileMenu(v=>!v)} className="rounded-xl border border-slate-600 p-2 md:hidden"><Menu className="h-4 w-4"/></button></div>
    </div>
    <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600"><b>نقش فعال در شبیه‌سازی:</b> {roleLabel} <span className="mx-2 text-slate-300">|</span> <span>{notice}</span></div>
    <div className="flex min-h-[620px]">
      <aside className="hidden w-60 shrink-0 bg-slate-900 p-3 md:block"><div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-3 text-xs text-slate-300"><Search className="h-4 w-4"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجوی بخش‌ها" className="w-full bg-transparent outline-none placeholder:text-slate-500"/></div>{menu}</aside>
      {mobileMenu&&<div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={()=>setMobileMenu(false)}><div className="absolute right-0 top-0 h-full w-[min(86vw,340px)] overflow-y-auto bg-slate-900 p-3" onClick={e=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between text-white"><b>همه امکانات</b><button onClick={()=>setMobileMenu(false)}><X className="h-5 w-5"/></button></div>{menu}</div></div>}
      <main className="min-w-0 flex-1 p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs text-slate-500">پنل {roleLabel}</div><h2 className="mt-1 text-lg font-extrabold">{current.label}</h2></div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold text-indigo-700">پیش‌نمایش تعاملی</span></div>
        {content()}
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><LockKeyhole className="ml-1 inline h-4 w-4"/>هشدار ایمنی: تمام اطلاعات و عملیات این صفحه ساختگی است. هیچ درخواست مالی، احراز هویت، RPC یا نوشتنی به Supabase یا A1 واقعی ارسال نمی‌شود.</div>
      </main>
    </div>
    <div className="grid grid-cols-4 gap-1 border-t bg-white p-2 md:hidden">{allowed.slice(0,4).map(m=>{const Icon=m.icon;return <button key={m.id} onClick={()=>setSection(m.id)} className={'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] '+(section===m.id?'bg-indigo-50 text-indigo-700':'text-slate-500')}><Icon className="h-4 w-4"/>{m.label}</button>})}</div>
  </div>;
}
