import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { createSupabaseEntity, getExchangeCode } from '@/lib/supabaseApi';
import { supabase } from '@/lib/supabaseClient';
import { FEATURE_CATALOG } from '@/lib/features';
import { PageHeader, LoadingState } from '@/components/sarraaf/Pieces';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { ListTree, Plus, Pencil, Check, X, RefreshCw, ShieldCheck, Lock, AlertTriangle, CalendarDays, GitBranch } from 'lucide-react';
import { formatNumber } from '@/lib/sarraaf';
import { useTreasuryBalances, useBankBalances } from '@/lib/useSarraaf';

const accountEntity = createSupabaseEntity('ChartOfAccount');
const TYPES = [
  { value: 'asset', label: 'دارایی', balance: 'debit' },
  { value: 'liability', label: 'بدهی', balance: 'credit' },
  { value: 'equity', label: 'سرمایه', balance: 'credit' },
  { value: 'revenue', label: 'درآمد', balance: 'credit' },
  { value: 'expense', label: 'هزینه', balance: 'debit' },
];
const EMPTY = { account_code: '', account_name: '', account_type: 'asset', parent_id: '', currency: '', description: '', is_active: true };
const ROOTS = [
  ['1000','دارایی‌ها','asset','debit'], ['2000','بدهی‌ها','liability','credit'],
  ['3000','سرمایه','equity','credit'], ['4000','درآمدها','revenue','credit'],
  ['5000','هزینه‌ها','expense','debit'],
];
const CHILDREN = [
  ['1100','صندوق‌ها','asset','debit','1000'], ['1200','بانک‌ها','asset','debit','1000'],
  ['1300','حساب‌های دریافتنی','asset','debit','1000'], ['2100','حساب‌های پرداختنی','liability','credit','2000'],
  ['4100','درآمد کارمزد','revenue','credit','4000'], ['5100','هزینه‌های عملیاتی','expense','debit','5000'],
];

const MODULE_INFO = {
  subsidiary_ledger:['دفاتر معین و تفصیلی','گردش و مانده حساب‌ها به تفکیک مشتری، صندوق، بانک و نماینده',['دفتر معین هر حساب','دفتر تفصیلی اشخاص','مانده اول دوره و گردش بدهکار/بستانکار']],
  trial_balance:['تراز آزمایشی','گزارش مانده بدهکار و بستانکار حساب‌ها',['تراز دو و چهار ستونی','تفکیک ارز','کنترل اختلاف تراز']],
  cash_flow:['جریان وجوه نقد','تحلیل ورود و خروج نقدینگی بر اساس اسناد ثبت‌شده',['جریان عملیاتی','جریان سرمایه‌گذاری','جریان تأمین مالی']],
  cost_centers:['مراکز هزینه و سود','گزارش عملکرد شعب، واحدها و فعالیت‌ها',['تعریف مرکز هزینه','تخصیص سند','گزارش سود و هزینه']],
  fiscal_periods:['دوره‌های مالی','مدیریت سال مالی بدون تغییر سوابق دوره‌های قبلی',['تعریف دوره','تاریخ شروع و پایان','وضعیت دوره']],
  period_close:['بستن دوره مالی','کنترل و بستن دوره پس از بررسی اسناد و مانده‌ها',['کنترل اسناد ناتراز','کنترل حساب‌های موقت','گزارش بستن دوره']],
  fixed_assets:['دارایی‌های ثابت','ثبت و پیگیری دارایی‌های بلندمدت و استهلاک',['دفتر دارایی','روش استهلاک','گزارش تغییرات']],
  accounts_receivable:['حساب‌های دریافتنی','مدیریت مطالبات از مشتریان و طرف‌های حساب',['سن مطالبات','سررسیدها','تطبیق دریافت‌ها']],
  accounts_payable:['حساب‌های پرداختنی','مدیریت بدهی به تأمین‌کنندگان و طرف‌های حساب',['سن بدهی‌ها','سررسیدها','تطبیق پرداخت‌ها']],
  budgets:['بودجه و پیش‌بینی','برنامه‌ریزی درآمد و هزینه در سطح شعبه و شرکت',['بودجه دوره‌ای','مقایسه بودجه و عملکرد','پیش‌بینی نقدینگی']],
  treasury:['خزانه‌داری و نقدینگی','مدیریت وجوه نقد، صندوق‌ها و بانک‌ها',['وضعیت نقدینگی','انتقال داخلی','پیش‌بینی نیاز نقدی']],
  intercompany:['حساب‌های بین‌صرافی','ثبت و تطبیق حساب‌های فی‌مابین صرافی‌ها',['حساب طرف مقابل','اسناد متقابل','تطبیق مانده']],
  multi_company:['مدیریت چندشرکتی','ساختار شرکت‌ها و شعب با جداسازی داده‌ها',['واحدهای سازمانی','سطح دسترسی','گزارش تجمیعی']],
  kyc:['احراز هویت مشتری','مدیریت اطلاعات شناسایی و وضعیت بررسی مشتری',['چک‌لیست مدارک','وضعیت تأیید','تاریخچه تغییرات']],
  compliance:['انطباق و مقررات','کنترل فرایندها و الزامات قانونی حوزه فعالیت',['سیاست‌های انطباق','کنترل عملیاتی','موارد نیازمند بررسی']],
  audit_log:['ردپای حسابرسی','تاریخچه اقدامات کاربران و تغییرات ثبت‌شده',['عامل و زمان تغییر','موضوع رکورد','دلیل عملیات']],
  document_center:['مرکز اسناد','مدیریت مدارک مرتبط با اسناد مالی',['دسته‌بندی مدارک','اتصال به سند','سطح دسترسی']],
  approvals:['گردش تأییدها','تعریف مراحل تأیید برای عملیات حساس',['سطوح تأیید','مسئول هر مرحله','تاریخچه تصمیم']],
  fx_exposure:['موقعیت و ریسک ارزی','بررسی دارایی و بدهی باز به تفکیک ارز',['موقعیت خالص ارز','حساسیت به نرخ','تمرکز ریسک']],
  tax:['مالیات و گزارش قانونی','ساختار گزارش‌های قانونی متناسب با حوزه قضایی',['تنظیمات مالیاتی','گزارش دوره‌ای','سوابق ارسال']],
  standards:['استانداردهای حسابداری','تنظیم سیاست‌های حسابداری و مبنای گزارش‌دهی',['مبنای ثبت','سیاست ارزی','نسخه استاندارد']],
  aml_screening:['کنترل AML و غربالگری','چارچوب بررسی هشدارها و موارد نیازمند رسیدگی',['ثبت هشدار','ارجاع بررسی','ثبت نتیجه']],
  fx_revaluation:['تسعیر و ارزیابی مجدد ارز','محاسبه آثار تغییر نرخ بر مانده‌های ارزی',['نرخ مبنا','محاسبه اختلاف','سند تعدیل']],
  consolidation:['صورت‌های مالی تلفیقی','تجمیع گزارش واحدها پس از تطبیق اقلام درون‌گروهی',['دامنه تلفیق','تطبیق حساب‌ها','گزارش تلفیقی']],
  internal_controls:['کنترل‌های داخلی و ریسک','تعریف کنترل‌های دسترسی و پایش ریسک فرایندها',['تفکیک وظایف','کنترل عملیات حساس','گزارش استثنا']],
  data_governance:['حاکمیت داده و حریم خصوصی','مدیریت نگهداری، دسترسی و ردگیری داده‌ها',['طبقه‌بندی داده','سیاست دسترسی','گزارش دسترسی']],
};

function AccountEditor({ form, setForm, accounts, editing, onSubmit, onCancel, busy }) {
  const parents = accounts.filter(a => a.is_active !== false && a.id !== editing?.id && a.account_type === (editing?.account_type || form.account_type));
  return <Card className="border-primary/30"><CardContent className="p-4 space-y-3">
    <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">{editing ? 'ویرایش حساب' : 'افزودن حساب'}</h3><Button type="button" size="icon" variant="ghost" onClick={onCancel}><X className="w-4 h-4"/></Button></div>
    <form onSubmit={onSubmit} className="space-y-3">
      {!editing && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1"><Label>کد حساب</Label><Input value={form.account_code} onChange={e=>setForm(p=>({...p,account_code:e.target.value.trim()}))} placeholder="مثلاً 1110" required/></div>
        <div className="space-y-1"><Label>گروه حساب</Label><Select value={form.account_type} onValueChange={v=>setForm(p=>({...p,account_type:v,parent_id:''}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TYPES.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
      </div>}
      <div className="space-y-1"><Label>نام حساب</Label><Input value={form.account_name} onChange={e=>setForm(p=>({...p,account_name:e.target.value}))} required/></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1"><Label>حساب مادر</Label><Select value={form.parent_id || 'none'} onValueChange={v=>setForm(p=>({...p,parent_id:v==='none'?'':v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">بدون حساب مادر</SelectItem>{parents.map(a=><SelectItem key={a.id} value={String(a.id)}>{a.account_code} — {a.account_name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>ارز اختصاصی (اختیاری)</Label><Input value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value.toUpperCase()}))} placeholder="AFN / USD"/></div>
      </div>
      <div className="space-y-1"><Label>توضیحات</Label><Textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><Label htmlFor="coa-active">حساب فعال باشد</Label><Switch id="coa-active" checked={form.is_active} onCheckedChange={v=>setForm(p=>({...p,is_active:v}))}/></div>
      {editing && <p className="text-xs text-muted-foreground">کد، گروه و ماهیت حساب پس از ایجاد تغییر نمی‌کند تا طبقه‌بندی سوابق مالی دچار تغییر نشود.</p>}
      <div className="flex gap-2"><Button type="submit" disabled={busy} className="flex-1"><Check className="w-4 h-4"/>{busy?'در حال ذخیره…':'ذخیره حساب'}</Button><Button type="button" variant="outline" onClick={onCancel}>انصراف</Button></div>
    </form>
  </CardContent></Card>;
}

function ChartOfAccounts() {
  const exchangeCode = getExchangeCode();
  const qc = useQueryClient();
  const [search,setSearch] = useState('');
  const [inactive,setInactive] = useState(false);
  const [editor,setEditor] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(EMPTY);
  const query = useQuery({queryKey:['chartOfAccounts',exchangeCode],queryFn:async()=>{ const {data,error}=await supabase.from('chart_of_accounts').select('*').eq('exchange_code',exchangeCode).order('account_code',{ascending:true}).limit(1000); if(error) throw new Error(error.message); return data||[]; },enabled:!!exchangeCode});
  const accounts = query.data || [];

  const createAccount = async (record) => { const { data, error } = await supabase.from('chart_of_accounts').insert({ ...record, exchange_code:exchangeCode }).select().single(); if(error) throw new Error(error.message); return data; };

  const save = useMutation({
    mutationFn: async () => {
      const code=form.account_code.trim(), name=form.account_name.trim();
      if(!name) throw new Error('نام حساب الزامی است');
      if(!editing && !/^\d{3,12}$/.test(code)) throw new Error('کد حساب باید عددی و حداقل سه رقم باشد');
      if(!editing && accounts.some(a=>a.account_code===code)) throw new Error('این کد حساب قبلاً ثبت شده است');
      const parentId=form.parent_id?Number(form.parent_id):null;
      const parent=parentId?accounts.find(a=>Number(a.id)===parentId):null;
      if(parentId && (!parent || parent.account_type!==(editing?.account_type||form.account_type))) throw new Error('حساب مادر باید از همان گروه حساب باشد');
      if(parentId && editing) {
        let node=parent; const seen=new Set();
        while(node) { if(Number(node.id)===Number(editing.id)) throw new Error('این انتخاب باعث حلقه در ساختار حساب‌ها می‌شود'); if(seen.has(Number(node.id))) break; seen.add(Number(node.id)); node=node.parent_id?accounts.find(a=>Number(a.id)===Number(node.parent_id)):null; }
      }
      if(editing) { const { data, error } = await supabase.from('chart_of_accounts').update({ account_name:name, parent_id:parentId, currency:form.currency.trim()||null, description:form.description.trim()||null, is_active:form.is_active, updated_at:new Date().toISOString() }).eq('id',editing.id).eq('exchange_code',exchangeCode).select().single(); if(error) throw new Error(error.message); return data; }
      const { data, error } = await supabase.from('chart_of_accounts').insert({ exchange_code:exchangeCode, account_code:code, account_name:name, account_type:form.account_type, normal_balance:TYPES.find(t=>t.value===form.account_type)?.balance||'debit', parent_id:parentId, currency:form.currency.trim()||null, description:form.description.trim()||null, is_active:form.is_active, is_system:false }).select().single(); if(error) throw new Error(error.message); return data;
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:['chartOfAccounts',exchangeCode]});setEditor(false);setEditing(null);setForm(EMPTY);toast({title:'ذخیره شد',description:'کدینگ حساب‌ها به‌روزرسانی شد'});},
    onError:e=>toast({title:'خطا در ذخیره حساب',description:e.message,variant:'destructive'}),
  });

  const seed = useMutation({
    mutationFn: async()=>{
      const byCode=new Map(accounts.map(a=>[a.account_code,a]));
      for(const [code,name,type,balance] of ROOTS) if(!byCode.has(code)) byCode.set(code,await createAccount({account_code:code,account_name:name,account_type:type,normal_balance:balance,parent_id:null,is_system:true,is_active:true}));
      for(const [code,name,type,balance,parentCode] of CHILDREN) if(!byCode.has(code)) { const parent=byCode.get(parentCode); if(!parent) throw new Error('حساب مادر پایه پیدا نشد'); byCode.set(code,await createAccount({account_code:code,account_name:name,account_type:type,normal_balance:balance,parent_id:parent.id,is_system:true,is_active:true})); }
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:['chartOfAccounts',exchangeCode]});toast({title:'کدینگ پایه ایجاد شد',description:'حساب‌های پایه افزوده شدند؛ سوابق و مانده‌های قبلی تغییر نکردند.'});},
    onError:e=>{qc.invalidateQueries({queryKey:['chartOfAccounts',exchangeCode]});toast({title:'ایجاد کدینگ ناموفق بود',description:e.message,variant:'destructive'});},
  });

  const filtered=useMemo(()=>accounts.filter(a=>(inactive||a.is_active!==false)&&(!search||[a.account_code,a.account_name,a.description].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())))),[accounts,inactive,search]);
  const openEdit=a=>{setEditing(a);setForm({...EMPTY,account_code:a.account_code,account_name:a.account_name,account_type:a.account_type,parent_id:a.parent_id?String(a.parent_id):'',currency:a.currency||'',description:a.description||'',is_active:a.is_active!==false});setEditor(true);};
  if(!exchangeCode) return <Card><CardContent className="p-5 space-y-2"><div className="flex items-center gap-2 font-semibold"><Lock className="w-4 h-4"/>انتخاب صرافی لازم است</div><p className="text-sm text-muted-foreground">برای جلوگیری از نمایش اطلاعات چند صرافی در یک صفحه، مدیریت کدینگ فقط با نشست همان صرافی انجام می‌شود.</p></CardContent></Card>;

  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><h2 className="font-bold">کدینگ حساب‌ها</h2><p className="text-xs text-muted-foreground mt-1">درخت حساب‌های مستقل برای هر صرافی</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>query.refetch()} disabled={query.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button><Button size="sm" onClick={()=>{setEditing(null);setForm(EMPTY);setEditor(true);}}><Plus className="w-4 h-4"/>حساب جدید</Button></div></div>
      <div className="grid grid-cols-3 gap-2"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">کل حساب‌ها</p><p className="text-xl font-bold">{accounts.length}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">فعال</p><p className="text-xl font-bold">{accounts.filter(a=>a.is_active!==false).length}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">سیستمی</p><p className="text-xl font-bold">{accounts.filter(a=>a.is_system).length}</p></div></div>
      <div className="flex flex-col sm:flex-row gap-2"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی کد یا نام حساب…"/><label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap"><Switch checked={inactive} onCheckedChange={setInactive}/>نمایش غیرفعال‌ها</label></div>
    </CardContent></Card>
    {editor&&<AccountEditor form={form} setForm={setForm} accounts={accounts} editing={editing} onSubmit={e=>{e.preventDefault();save.mutate();}} onCancel={()=>{setEditor(false);setEditing(null);}} busy={save.isPending}/>}
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{query.error?.message||'دریافت حساب‌ها ناموفق بود'}</p><Button size="sm" onClick={()=>query.refetch()}>تلاش دوباره</Button></CardContent></Card>:accounts.length===0?<Card><CardContent className="p-5 text-center space-y-3"><ListTree className="w-9 h-9 mx-auto text-muted-foreground"/><h3 className="font-semibold">کدینگ حسابی ثبت نشده است</h3><p className="text-sm text-muted-foreground">ساختار پایه را ایجاد کنید یا حساب‌ها را دستی تعریف کنید. این کار فقط جدول جدید کدینگ را پر می‌کند و هیچ سند یا ماندهٔ قبلی را تغییر نمی‌دهد.</p><div className="flex flex-col sm:flex-row justify-center gap-2"><Button onClick={()=>seed.mutate()} disabled={seed.isPending}>ایجاد کدینگ پایه</Button><Button variant="outline" onClick={()=>{setEditing(null);setForm(EMPTY);setEditor(true);}}>تعریف دستی حساب</Button></div></CardContent></Card>:<Card><CardContent className="p-0 overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b bg-muted/40 text-right">{['کد','نام حساب','گروه','حساب مادر','ماهیت','وضعیت','عملیات'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{filtered.map(a=>{const parent=accounts.find(p=>Number(p.id)===Number(a.parent_id));return <tr key={a.id} className="border-b last:border-0"><td className="p-3 font-mono">{a.account_code}</td><td className="p-3"><div className="font-medium">{a.account_name}</div>{a.is_system&&<span className="text-[10px] text-primary">حساب پایه سیستم</span>}</td><td className="p-3">{TYPES.find(t=>t.value===a.account_type)?.label||a.account_type}</td><td className="p-3 text-muted-foreground">{parent?parent.account_code+' — '+parent.account_name:'—'}</td><td className="p-3">{a.normal_balance==='credit'?'بستانکار':'بدهکار'}</td><td className="p-3">{a.is_active===false?'غیرفعال':'فعال'}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={()=>openEdit(a)}><Pencil className="w-4 h-4"/>ویرایش</Button></td></tr>;})}</tbody></table>{filtered.length===0&&<p className="p-5 text-center text-sm text-muted-foreground">موردی پیدا نشد.</p>}</CardContent></Card>}
    <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 shrink-0 text-primary"/><p>حذف حساب در این مرحله وجود ندارد. کد، گروه و ماهیت حساب پس از ایجاد ثابت می‌ماند. این مرحله کدینگ جدید را ثبت می‌کند و سوابق قدیمی را بازطبقه‌بندی نمی‌کند.</p></div>
  </div>;
}


async function fetchAllTenantRows(table, columns, exchangeCode) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from(table).select(columns)
      .eq('exchange_code', exchangeCode).order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message || 'دریافت دفترکل ناموفق بود');
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function TrialBalance() {
  const exchangeCode = getExchangeCode();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const snapshot = useQuery({
    queryKey: ['enterpriseTrialBalance', exchangeCode],
    enabled: !!exchangeCode,
    queryFn: async () => {
      const [entries, documents] = await Promise.all([
        fetchAllTenantRows('ledger_entries', 'id,document_id,account_type,account_id,account_name,currency,debit,credit,deleted,created_at', exchangeCode),
        fetchAllTenantRows('documents', 'id,deleted,reversed,created_at,doc_number,doc_type', exchangeCode),
      ]);
      const docs = new Map(documents.map(d => [String(d.id), d]));
      return entries.filter(e => {
        if (e.deleted === true) return false;
        const doc = e.document_id ? docs.get(String(e.document_id)) : null;
        return !doc || (doc.deleted !== true && doc.reversed !== true);
      }).map(e => {
        const doc = e.document_id ? docs.get(String(e.document_id)) : null;
        return { ...e, report_date: doc?.created_at || e.created_at, document_no: doc?.doc_number || '' };
      });
    },
    staleTime: 30000,
  });
  const reportRows = useMemo(() => {
    const groups = new Map();
    for (const entry of snapshot.data || []) {
      const date = entry.report_date ? String(entry.report_date).slice(0, 10) : '';
      if (fromDate && date && date < fromDate) continue;
      if (toDate && date && date > toDate) continue;
      const name = entry.account_name || entry.account_id || entry.account_type || 'حساب نامشخص';
      const term = search.trim().toLowerCase();
      if (term && ![name, entry.account_type, entry.account_id, entry.currency].some(v => String(v || '').toLowerCase().includes(term))) continue;
      const key = [entry.account_type || '', entry.account_id || '', name, entry.currency || ''].join('|');
      const row = groups.get(key) || { key, account_type: entry.account_type || '—', account_id: entry.account_id || '', account_name: name, currency: entry.currency || '—', debit: 0, credit: 0, lines: 0 };
      row.debit += Number(entry.debit || 0);
      row.credit += Number(entry.credit || 0);
      row.lines += 1;
      groups.set(key, row);
    }
    return [...groups.values()].sort((a,b) => String(a.account_type).localeCompare(String(b.account_type)) || String(a.account_name).localeCompare(String(b.account_name)));
  }, [snapshot.data, fromDate, toDate, search]);
  const totals = useMemo(() => {
    const map = new Map();
    for (const row of reportRows) {
      const t = map.get(row.currency) || { debit: 0, credit: 0, accounts: 0 };
      t.debit += row.debit; t.credit += row.credit; t.accounts += 1; map.set(row.currency, t);
    }
    return [...map.entries()].map(([currency, value]) => ({ currency, ...value, difference: value.debit - value.credit }));
  }, [reportRows]);
  if (!exchangeCode) return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده تراز آزمایشی، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="space-y-1"><Label>از تاریخ</Label><Input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></div><div className="space-y-1"><Label>تا تاریخ</Label><Input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></div></div>
      <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو در نام، کد یا نوع حساب…"/>
      <div className="flex justify-between items-center text-xs text-muted-foreground"><span>تعداد ردیف‌های دفترکل: {(snapshot.data||[]).length}</span><Button size="sm" variant="outline" onClick={()=>snapshot.refetch()} disabled={snapshot.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div>
    </CardContent></Card>
    {snapshot.isLoading ? <LoadingState/> : snapshot.isError ? <Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{snapshot.error?.message||'دریافت تراز آزمایشی ناموفق بود'}</p><Button size="sm" onClick={()=>snapshot.refetch()}>تلاش دوباره</Button></CardContent></Card> : <>
      {totals.map(t=><Card key={t.currency}><CardContent className="p-4 space-y-2"><div className="flex justify-between font-semibold"><span>جمع {t.currency}</span><span>{Math.abs(t.difference)<0.01?'تراز':'دارای اختلاف'}</span></div><div className="grid grid-cols-3 gap-2 text-xs"><div><p className="text-muted-foreground">بدهکار</p><p className="font-mono font-semibold">{formatNumber(t.debit,2)}</p></div><div><p className="text-muted-foreground">بستانکار</p><p className="font-mono font-semibold">{formatNumber(t.credit,2)}</p></div><div><p className="text-muted-foreground">اختلاف</p><p className={Math.abs(t.difference)<0.01?'text-emerald-600':'text-destructive'}>{formatNumber(t.difference,2)}</p></div></div></CardContent></Card>)}
      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b bg-muted/40 text-right">{['نوع حساب','شناسه','نام حساب','ارز','بدهکار','بستانکار','ردیف'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{reportRows.map(row=><tr key={row.key} className="border-b last:border-0"><td className="p-3">{row.account_type}</td><td className="p-3 font-mono">{row.account_id||'—'}</td><td className="p-3">{row.account_name}</td><td className="p-3">{row.currency}</td><td className="p-3 font-mono">{formatNumber(row.debit,2)}</td><td className="p-3 font-mono">{formatNumber(row.credit,2)}</td><td className="p-3">{row.lines}</td></tr>)}</tbody></table>{reportRows.length===0&&<p className="p-5 text-center text-sm text-muted-foreground">برای این بازه اطلاعاتی وجود ندارد.</p>}</CardContent></Card>
    </>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">گزارش از ردیف‌های موجود دفترکل ساخته می‌شود؛ اسناد حذف‌شده یا معکوس‌شده در محاسبه وارد نمی‌شوند. مانده‌ها به تفکیک ارز نمایش داده می‌شوند و ارزهای متفاوت با هم جمع نمی‌شوند.</div>
  </div>;
}


function SubsidiaryLedger() {
  const exchangeCode = getExchangeCode();
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const query = useQuery({
    queryKey: ['enterpriseSubsidiaryLedger', exchangeCode],
    enabled: !!exchangeCode,
    queryFn: async () => {
      const [entries, documents] = await Promise.all([
        fetchAllTenantRows('ledger_entries', 'id,document_id,account_type,account_id,account_name,currency,debit,credit,description,deleted,created_at', exchangeCode),
        fetchAllTenantRows('documents', 'id,deleted,reversed,created_at,doc_number,doc_type,description', exchangeCode),
      ]);
      const docs = new Map(documents.map(d => [String(d.id), d]));
      return entries.filter(e => {
        if (e.deleted === true) return false;
        const doc = e.document_id ? docs.get(String(e.document_id)) : null;
        return !doc || (doc.deleted !== true && doc.reversed !== true);
      }).map(e => {
        const doc = e.document_id ? docs.get(String(e.document_id)) : null;
        return { ...e, report_date: doc?.created_at || e.created_at, document_no: doc?.doc_number || '', document_type: doc?.doc_type || '', document_description: doc?.description || '' };
      });
    },
    staleTime: 30000,
  });
  const entries = query.data || [];
  const accountKey = e => [e.account_type || '',e.account_id || '',e.account_name || '',e.currency || ''].join('|');
  const accountOptions = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const key = accountKey(e);
      if (!map.has(key)) map.set(key,{ key, account_type:e.account_type||'—', account_id:e.account_id||'', account_name:e.account_name||e.account_id||e.account_type||'حساب نامشخص', currency:e.currency||'—' });
    }
    return [...map.values()].sort((a,b)=>String(a.account_name).localeCompare(String(b.account_name)));
  },[entries]);
  const filtered = useMemo(() => entries.filter(e => {
    if (selected && accountKey(e)!==selected) return false;
    const date=e.report_date?String(e.report_date).slice(0,10):'';
    if(fromDate&&date&&date<fromDate) return false;
    if(toDate&&date&&date>toDate) return false;
    const term=search.trim().toLowerCase();
    return !term||[e.document_no,e.description,e.document_description,e.document_type].some(v=>String(v||'').toLowerCase().includes(term));
  }).sort((a,b)=>String(a.report_date||'').localeCompare(String(b.report_date||''))||Number(a.id)-Number(b.id)),[entries,selected,fromDate,toDate,search]);
  const totals=useMemo(()=>filtered.reduce((t,e)=>({debit:t.debit+Number(e.debit||0),credit:t.credit+Number(e.credit||0)}),{debit:0,credit:0}),[filtered]);
  if(!exchangeCode) return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده دفتر معین، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3">
      <div className="space-y-1"><Label>انتخاب حساب</Label><Select value={selected||'all'} onValueChange={v=>setSelected(v==='all'?'':v)}><SelectTrigger><SelectValue placeholder="همه حساب‌ها"/></SelectTrigger><SelectContent><SelectItem value="all">همه حساب‌ها</SelectItem>{accountOptions.map(a=><SelectItem key={a.key} value={a.key}>{a.account_name} · {a.account_type} · {a.currency}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="space-y-1"><Label>از تاریخ</Label><Input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></div><div className="space-y-1"><Label>تا تاریخ</Label><Input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></div></div>
      <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو شماره سند یا شرح…"/>
      <div className="flex justify-between items-center text-xs text-muted-foreground"><span>{filtered.length} ردیف</span><Button size="sm" variant="outline" onClick={()=>query.refetch()} disabled={query.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div>
    </CardContent></Card>
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{query.error?.message||'دریافت دفتر معین ناموفق بود'}</p><Button size="sm" onClick={()=>query.refetch()}>تلاش دوباره</Button></CardContent></Card>:<>
      <div className="grid grid-cols-3 gap-2"><Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">بدهکار</p><p className="font-mono text-sm font-semibold">{formatNumber(totals.debit,2)}</p></CardContent></Card><Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">بستانکار</p><p className="font-mono text-sm font-semibold">{formatNumber(totals.credit,2)}</p></CardContent></Card><Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">مانده</p><p className="font-mono text-sm font-semibold">{formatNumber(totals.debit-totals.credit,2)}</p></CardContent></Card></div>
      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b bg-muted/40 text-right">{['تاریخ','شماره سند','شرح','ارز','بدهکار','بستانکار'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{filtered.map(e=><tr key={e.id} className="border-b last:border-0"><td className="p-3 whitespace-nowrap">{e.report_date?new Date(e.report_date).toLocaleDateString('fa-IR'):'—'}</td><td className="p-3 font-mono">{e.document_no||'—'}</td><td className="p-3">{e.description||e.document_description||e.document_type||'—'}</td><td className="p-3">{e.currency||'—'}</td><td className="p-3 font-mono">{formatNumber(Number(e.debit||0),2)}</td><td className="p-3 font-mono">{formatNumber(Number(e.credit||0),2)}</td></tr>)}</tbody></table>{filtered.length===0&&<p className="p-5 text-center text-sm text-muted-foreground">برای این فیلتر ردیفی وجود ندارد.</p>}</CardContent></Card>
    </>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">دفتر معین از ردیف‌های موجود دفترکل و اسناد مرتبط استفاده می‌کند. این گزارش فقط خواندنی است و امکان تغییر سوابق مالی از این صفحه وجود ندارد.</div>
  </div>;
}


function AuditLogViewer() {
  const exchangeCode=getExchangeCode();
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('all');
  const query=useQuery({
    queryKey:['enterpriseAuditLog',exchangeCode],
    enabled:!!exchangeCode,
    queryFn:async()=>{
      const {data,error}=await supabase.from('audit_logs')
        .select('id,user_name,user_type,action,entity_type,entity_id,target_name,description,status,reason,ip_address,created_at')
        .eq('exchange_code',exchangeCode).order('created_at',{ascending:false}).limit(500);
      if(error) throw new Error(error.message||'دریافت ردپای حسابرسی ناموفق بود');
      return data||[];
    },
    staleTime:30000,
  });
  const rows=useMemo(()=>(query.data||[]).filter(row=>{
    if(status!=='all'&&String(row.status||'').toLowerCase()!==status) return false;
    const term=search.trim().toLowerCase();
    return !term||[row.user_name,row.user_type,row.action,row.entity_type,row.entity_id,row.target_name,row.description,row.reason,row.ip_address].some(v=>String(v||'').toLowerCase().includes(term));
  }),[query.data,status,search]);
  if(!exchangeCode) return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده گزارش حسابرسی، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-center gap-2"><div><h2 className="font-semibold">ردپای حسابرسی</h2><p className="text-xs text-muted-foreground">۵۰۰ رویداد اخیر ثبت‌شده برای همین صرافی</p></div><Button size="sm" variant="outline" onClick={()=>query.refetch()} disabled={query.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div>
      <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو کاربر، عملیات، رکورد یا شرح…"/>
      <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">همه وضعیت‌ها</SelectItem><SelectItem value="success">موفق</SelectItem><SelectItem value="failed">ناموفق</SelectItem><SelectItem value="warning">هشدار</SelectItem></SelectContent></Select>
      <p className="text-xs text-muted-foreground">{rows.length} رویداد</p>
    </CardContent></Card>
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{query.error?.message||'دریافت گزارش ناموفق بود'}</p><Button size="sm" onClick={()=>query.refetch()}>تلاش دوباره</Button></CardContent></Card>:rows.length===0?<Card><CardContent className="p-5 text-center text-sm text-muted-foreground">رویدادی برای این فیلتر پیدا نشد.</CardContent></Card>:<div className="space-y-2">{rows.map(row=><Card key={row.id}><CardContent className="p-3 space-y-2"><div className="flex justify-between items-start gap-2"><div className="min-w-0"><p className="text-sm font-semibold">{row.action||'عملیات ثبت‌شده'} · {row.target_name||row.entity_type||'—'}</p><p className="text-xs text-muted-foreground">{row.user_name||'کاربر نامشخص'}{row.user_type?' · '+row.user_type:''}</p></div><span className="text-[10px] text-muted-foreground whitespace-nowrap">{row.created_at?new Date(row.created_at).toLocaleString('fa-IR'):'—'}</span></div><p className="text-xs leading-5">{row.description||row.reason||'بدون شرح'}</p><div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground"><span>{row.entity_type||'—'}</span>{row.entity_id&&<span>شناسه: {row.entity_id}</span>}{row.status&&<span>وضعیت: {row.status}</span>}{row.ip_address&&<span>IP: {row.ip_address}</span>}</div></CardContent></Card>)}</div>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">این گزارش فقط‌خواندنی است و فقط رویدادهای دارای کد همین صرافی را می‌خواند. رویدادها از این صفحه ویرایش یا حذف نمی‌شوند.</div>
  </div>;
}


function DocumentCenter() {
  const exchangeCode=getExchangeCode();
  const [search,setSearch]=useState('');
  const [state,setState]=useState('active');
  const [selectedId,setSelectedId]=useState('');
  const docsQuery=useQuery({
    queryKey:['enterpriseDocuments',exchangeCode],
    enabled:!!exchangeCode,
    queryFn:async()=>{
      const {data,error}=await supabase.from('documents')
        .select('id,doc_number,doc_type,amount,currency,fee,related_type,related_id,related_name,description,registered_by,created_at,deleted,reversed,reverse_reason')
        .eq('exchange_code',exchangeCode).order('created_at',{ascending:false}).limit(500);
      if(error) throw new Error(error.message||'دریافت اسناد ناموفق بود');
      return data||[];
    },
    staleTime:30000,
  });
  const docs=docsQuery.data||[];
  const filtered=useMemo(()=>docs.filter(d=>{
    if(state==='active'&&(d.deleted||d.reversed)) return false;
    if(state==='deleted'&&!d.deleted) return false;
    if(state==='reversed'&&!d.reversed) return false;
    const term=search.trim().toLowerCase();
    return !term||[d.doc_number,d.doc_type,d.related_name,d.description,d.registered_by,d.currency].some(v=>String(v||'').toLowerCase().includes(term));
  }),[docs,state,search]);
  const selected=docs.find(d=>String(d.id)===String(selectedId))||null;
  const linesQuery=useQuery({
    queryKey:['enterpriseDocumentLines',exchangeCode,selectedId],
    enabled:!!exchangeCode&&!!selectedId,
    queryFn:async()=>{
      const {data,error}=await supabase.from('ledger_entries')
        .select('id,account_type,account_id,account_name,currency,debit,credit,description,doc_line_no')
        .eq('exchange_code',exchangeCode).eq('document_id',selectedId).order('doc_line_no',{ascending:true});
      if(error) throw new Error(error.message||'دریافت ردیف‌های سند ناموفق بود');
      return data||[];
    },
  });
  if(!exchangeCode) return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده اسناد، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-center gap-2"><div><h2 className="font-semibold">مرکز اسناد</h2><p className="text-xs text-muted-foreground">۵۰۰ سند اخیر این صرافی · فقط‌خواندنی</p></div><Button size="sm" variant="outline" onClick={()=>docsQuery.refetch()} disabled={docsQuery.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div>
      <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو شماره سند، نوع، طرف حساب یا شرح…"/>
      <Select value={state} onValueChange={setState}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">اسناد فعال</SelectItem><SelectItem value="deleted">حذف‌شده‌ها</SelectItem><SelectItem value="reversed">معکوس‌شده‌ها</SelectItem><SelectItem value="all">همه اسناد</SelectItem></SelectContent></Select>
      <p className="text-xs text-muted-foreground">{filtered.length} سند</p>
    </CardContent></Card>
    {docsQuery.isLoading?<LoadingState/>:docsQuery.isError?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{docsQuery.error?.message||'دریافت اسناد ناموفق بود'}</p><Button size="sm" onClick={()=>docsQuery.refetch()}>تلاش دوباره</Button></CardContent></Card>:<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="space-y-2">{filtered.map(d=><button key={d.id} type="button" onClick={()=>setSelectedId(String(d.id))} className={`w-full rounded-xl border p-3 text-right transition-colors ${String(d.id)===String(selectedId)?'border-primary bg-primary/5':'bg-card hover:bg-muted/50'}`}><div className="flex justify-between gap-2"><span className="font-semibold text-sm">{d.doc_number||'بدون شماره'}</span><span className="text-[10px] text-muted-foreground">{d.created_at?new Date(d.created_at).toLocaleDateString('fa-IR'):'—'}</span></div><p className="text-xs mt-1">{d.description||d.related_name||d.doc_type||'سند مالی'}</p><div className="flex justify-between mt-2 text-[10px] text-muted-foreground"><span>{d.doc_type||'—'} · {d.currency||'—'}</span><span>{d.deleted?'حذف‌شده':d.reversed?'معکوس‌شده':'ثبت‌شده'}</span></div></button>)}</div>
      <Card><CardContent className="p-4 space-y-3">
        {!selected?<p className="text-sm text-muted-foreground">برای مشاهده جزئیات، یک سند را انتخاب کنید.</p>:<>
          <div><h3 className="font-bold">{selected.doc_number||'سند بدون شماره'}</h3><p className="text-xs text-muted-foreground mt-1">{selected.description||selected.related_name||selected.doc_type}</p></div>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-muted/50 p-2"><p className="text-muted-foreground">مبلغ</p><p className="font-semibold">{formatNumber(Number(selected.amount||0),2)} {selected.currency}</p></div><div className="rounded-lg bg-muted/50 p-2"><p className="text-muted-foreground">کارمزد</p><p className="font-semibold">{formatNumber(Number(selected.fee||0),2)} {selected.currency}</p></div><div className="rounded-lg bg-muted/50 p-2"><p className="text-muted-foreground">طرف حساب</p><p className="font-semibold">{selected.related_name||'—'}</p></div><div className="rounded-lg bg-muted/50 p-2"><p className="text-muted-foreground">ثبت‌کننده</p><p className="font-semibold">{selected.registered_by||'—'}</p></div></div>
          {(selected.deleted||selected.reversed)&&<div className="rounded-lg border border-amber-300 p-2 text-xs text-amber-700">{selected.deleted?'این سند حذف‌شده است.':'این سند معکوس شده است.'} {selected.reverse_reason||''}</div>}
          <div><h4 className="text-sm font-semibold mb-2">ردیف‌های دفترکل</h4>{linesQuery.isLoading?<LoadingState/>:linesQuery.isError?<p className="text-xs text-destructive">{linesQuery.error?.message}</p>:<div className="space-y-2">{(linesQuery.data||[]).map(line=><div key={line.id} className="rounded-lg border p-2 text-xs"><div className="flex justify-between gap-2"><span className="font-medium">{line.account_name||line.account_type||'حساب'}</span><span>{line.currency}</span></div><div className="flex justify-between mt-1 text-muted-foreground"><span>بدهکار: {formatNumber(Number(line.debit||0),2)}</span><span>بستانکار: {formatNumber(Number(line.credit||0),2)}</span></div>{line.description&&<p className="mt-1 text-muted-foreground">{line.description}</p>}</div>)}{(linesQuery.data||[]).length===0&&<p className="text-xs text-muted-foreground">ردیف دفترکل برای این سند پیدا نشد.</p>}</div>}</div>
        </>}
      </CardContent></Card>
    </div>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">این مرکز فقط اسناد و ردیف‌های موجود را نمایش می‌دهد. هیچ سندی از این صفحه حذف، ویرایش یا معکوس نمی‌شود.</div>
  </div>;
}


function TreasuryOverview() {
  const exchangeCode=getExchangeCode();
  const cashQuery=useTreasuryBalances();
  const bankQuery=useBankBalances();
  const transactionsQuery=useQuery({
    queryKey:['enterpriseTreasuryTransactions',exchangeCode],
    enabled:!!exchangeCode,
    queryFn:async()=>{
      const {data,error}=await supabase.from('treasury_transactions')
        .select('id,currency,amount,type,description,registered_by,created_at')
        .eq('exchange_code',exchangeCode).order('created_at',{ascending:false}).limit(200);
      if(error) throw new Error(error.message||'دریافت گردش خزانه ناموفق بود');
      return data||[];
    },
    staleTime:30000,
  });
  if(!exchangeCode) return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده خزانه‌داری، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  const loading=cashQuery.isLoading||bankQuery.isLoading||transactionsQuery.isLoading;
  const error=cashQuery.error||bankQuery.error||transactionsQuery.error;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-2"><div className="flex justify-between items-center"><h2 className="font-semibold">خلاصه خزانه و نقدینگی</h2><Button size="sm" variant="outline" onClick={()=>{cashQuery.refetch();bankQuery.refetch();transactionsQuery.refetch();}} disabled={loading}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div><p className="text-xs text-muted-foreground">مانده‌ها از نماهای مالی فعلی خوانده می‌شوند؛ هیچ مبلغی در این صفحه ثبت یا تغییر داده نمی‌شود.</p></CardContent></Card>
    {loading?<LoadingState/>:error?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{error.message||'دریافت اطلاعات خزانه ناموفق بود'}</p><Button size="sm" onClick={()=>{cashQuery.refetch();bankQuery.refetch();transactionsQuery.refetch();}}>تلاش دوباره</Button></CardContent></Card>:<>
      <Card><CardContent className="p-4 space-y-3"><h3 className="font-semibold text-sm">موجودی نقدی صندوق به تفکیک ارز</h3>{(cashQuery.data||[]).length===0?<p className="text-xs text-muted-foreground">مانده‌ای ثبت نشده است.</p>:(cashQuery.data||[]).map((item,i)=><div key={item.currency||i} className="flex justify-between border-b last:border-0 py-2 text-sm"><span>{item.currency}</span><span className="font-mono font-semibold">{formatNumber(Number(item.balance||0),2)}</span></div>)}</CardContent></Card>
      <Card><CardContent className="p-4 space-y-3"><h3 className="font-semibold text-sm">مانده حساب‌های بانکی</h3>{(bankQuery.data||[]).length===0?<p className="text-xs text-muted-foreground">حساب بانکی فعالی در گزارش موجود نیست.</p>:(bankQuery.data||[]).map((item,i)=><div key={item.bank_id||i} className="flex justify-between gap-3 border-b last:border-0 py-2 text-sm"><div className="min-w-0"><p className="font-medium truncate">{item.bank_name||'بانک'}</p><p className="text-[10px] text-muted-foreground">{item.account_number||''} · {item.currency}</p></div><span className="font-mono font-semibold whitespace-nowrap">{formatNumber(Number(item.current_balance||0),2)}</span></div>)}</CardContent></Card>
      <Card><CardContent className="p-4 space-y-3"><h3 className="font-semibold text-sm">گردش‌های اخیر خزانه</h3>{(transactionsQuery.data||[]).length===0?<p className="text-xs text-muted-foreground">گردشی ثبت نشده است.</p>:(transactionsQuery.data||[]).map(row=><div key={row.id} className="flex justify-between gap-3 border-b last:border-0 py-2 text-xs"><div className="min-w-0"><p className="font-medium">{row.description||row.type||'عملیات خزانه'}</p><p className="text-muted-foreground">{row.created_at?new Date(row.created_at).toLocaleString('fa-IR'):'—'} · {row.registered_by||'—'}</p></div><div className="text-left whitespace-nowrap"><p className="font-mono font-semibold">{formatNumber(Number(row.amount||0),2)} {row.currency}</p><p className="text-muted-foreground">{row.type||'—'}</p></div></div>)}</CardContent></Card>
    </>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">این صفحه نمای کلی و گزارش‌خوانی خزانه است. عملیات انتقال یا ثبت پرداخت از مسیرهای مالی موجود انجام می‌شود تا کنترل‌های ثبت سند و تراز حفظ شود.</div>
  </div>;
}


function CashFlowReport() {
  const exchangeCode=getExchangeCode();
  const [fromDate,setFromDate]=useState('');
  const [toDate,setToDate]=useState('');
  const query=useQuery({
    queryKey:['enterpriseCashFlow',exchangeCode],
    enabled:!!exchangeCode,
    queryFn:async()=>{
      const [entries,docs]=await Promise.all([
        fetchAllTenantRows('ledger_entries','id,document_id,account_type,currency,debit,credit,deleted,created_at',exchangeCode),
        fetchAllTenantRows('documents','id,deleted,reversed,created_at,doc_number,doc_type',exchangeCode),
      ]);
      const docMap=new Map(docs.map(d=>[String(d.id),d]));
      return entries.filter(e=>{
        if(e.deleted===true||!['cash','bank'].includes(String(e.account_type||'').toLowerCase())) return false;
        const doc=e.document_id?docMap.get(String(e.document_id)):null;
        return !doc||(doc.deleted!==true&&doc.reversed!==true);
      }).map(e=>{const doc=e.document_id?docMap.get(String(e.document_id)):null;return {...e,report_date:doc?.created_at||e.created_at,doc_number:doc?.doc_number||''};});
    },
    staleTime:30000,
  });
  const filtered=useMemo(()=>(query.data||[]).filter(e=>{const d=e.report_date?String(e.report_date).slice(0,10):'';return (!fromDate||!d||d>=fromDate)&&(!toDate||!d||d<=toDate);}),[query.data,fromDate,toDate]);
  const totals=useMemo(()=>{const map=new Map();for(const e of filtered){const cur=e.currency||'—';const t=map.get(cur)||{debit:0,credit:0,rows:0};t.debit+=Number(e.debit||0);t.credit+=Number(e.credit||0);t.rows++;map.set(cur,t);}return [...map.entries()].map(([currency,v])=>({currency,...v,net:v.debit-v.credit}));},[filtered]);
  if(!exchangeCode)return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده گردش صندوق و بانک، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3"><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="space-y-1"><Label>از تاریخ</Label><Input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></div><div className="space-y-1"><Label>تا تاریخ</Label><Input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></div></div><div className="flex justify-between items-center text-xs text-muted-foreground"><span>{filtered.length} ردیف دفتر صندوق و بانک</span><Button size="sm" variant="outline" onClick={()=>query.refetch()} disabled={query.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div></CardContent></Card>
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{query.error?.message||'دریافت گردش نقدی ناموفق بود'}</p><Button size="sm" onClick={()=>query.refetch()}>تلاش دوباره</Button></CardContent></Card>:totals.length===0?<Card><CardContent className="p-5 text-center text-sm text-muted-foreground">برای این بازه گردش صندوق یا بانک ثبت نشده است.</CardContent></Card>:totals.map(t=><Card key={t.currency}><CardContent className="p-4 space-y-3"><div className="font-semibold">گردش {t.currency}</div><div className="grid grid-cols-3 gap-2 text-xs"><div><p className="text-muted-foreground">ورودی (بدهکار)</p><p className="font-mono font-semibold">{formatNumber(t.debit,2)}</p></div><div><p className="text-muted-foreground">خروجی (بستانکار)</p><p className="font-mono font-semibold">{formatNumber(t.credit,2)}</p></div><div><p className="text-muted-foreground">خالص گردش</p><p className="font-mono font-semibold">{formatNumber(t.net,2)}</p></div></div><p className="text-[10px] text-muted-foreground">{t.rows} ردیف دفترکل</p></CardContent></Card>)}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">این گزارش فقط گردش حساب‌های نوع صندوق و بانک را از دفترکل استخراج می‌کند؛ طبقه‌بندی سه‌گانهٔ جریان عملیاتی، سرمایه‌گذاری و تأمین مالی تا زمان تکمیل کدینگ و سیاست‌های حسابداری در دسترس نیست.</div>
  </div>;
}

function CustomerBalancesReport() {
  const exchangeCode=getExchangeCode();
  const [search,setSearch]=useState('');
  const [currency,setCurrency]=useState('all');
  const query=useQuery({
    queryKey:['enterpriseCustomerBalances',exchangeCode],
    enabled:!!exchangeCode,
    queryFn:async()=>{
      const [entries,docs]=await Promise.all([
        fetchAllTenantRows('ledger_entries','id,document_id,account_type,account_id,account_name,currency,debit,credit,deleted',exchangeCode),
        fetchAllTenantRows('documents','id,deleted,reversed',exchangeCode),
      ]);
      const docMap=new Map(docs.map(d=>[String(d.id),d]));
      return entries.filter(e=>{
        if(e.deleted===true)return false;
        const doc=e.document_id?docMap.get(String(e.document_id)):null;
        return !doc||(doc.deleted!==true&&doc.reversed!==true);
      });
    },
    staleTime:30000,
  });
  const rows=useMemo(()=>{
    const map=new Map();
    for(const e of query.data||[]){
      if(e.deleted===true||String(e.account_type||'').toLowerCase()!=='customer')continue;
      const cur=e.currency||'—';const key=[e.account_id||'',e.account_name||'',cur].join('|');
      const row=map.get(key)||{key,account_id:e.account_id||'',account_name:e.account_name||e.account_id||'مشتری بدون نام',currency:cur,debit:0,credit:0};
      row.debit+=Number(e.debit||0);row.credit+=Number(e.credit||0);map.set(key,row);
    }
    const term=search.trim().toLowerCase();
    return [...map.values()].filter(r=>(currency==='all'||r.currency===currency)&&(!term||[r.account_id,r.account_name].some(v=>String(v).toLowerCase().includes(term)))).map(r=>({...r,balance:r.debit-r.credit})).sort((a,b)=>Math.abs(b.balance)-Math.abs(a.balance));
  },[query.data,search,currency]);
  const currencies=[...new Set((query.data||[]).filter(e=>e.deleted!==true&&String(e.account_type||'').toLowerCase()==='customer').map(e=>e.currency||'—'))];
  if(!exchangeCode)return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مشاهده مانده حساب مشتریان، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی نام یا شناسه مشتری…"/><Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">همه ارزها</SelectItem>{currencies.map(cur=><SelectItem key={cur} value={cur}>{cur}</SelectItem>)}</SelectContent></Select><div className="flex justify-between items-center text-xs text-muted-foreground"><span>{rows.length} حساب مشتری</span><Button size="sm" variant="outline" onClick={()=>query.refetch()} disabled={query.isFetching}><RefreshCw className="w-4 h-4"/>بروزرسانی</Button></div></CardContent></Card>
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 space-y-2"><p className="text-sm text-destructive">{query.error?.message||'دریافت مانده مشتریان ناموفق بود'}</p><Button size="sm" onClick={()=>query.refetch()}>تلاش دوباره</Button></CardContent></Card>:<Card><CardContent className="p-0 overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b bg-muted/40 text-right">{['شناسه','مشتری','ارز','بدهکار','بستانکار','مانده'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.key} className="border-b last:border-0"><td className="p-3 font-mono">{r.account_id||'—'}</td><td className="p-3">{r.account_name}</td><td className="p-3">{r.currency}</td><td className="p-3 font-mono">{formatNumber(r.debit,2)}</td><td className="p-3 font-mono">{formatNumber(r.credit,2)}</td><td className="p-3 font-mono">{formatNumber(r.balance,2)} <span className="text-[10px] text-muted-foreground">{r.balance>0?'بدهکار':r.balance<0?'بستانکار':'تسویه'}</span></td></tr>)}</tbody></table>{rows.length===0&&<p className="p-5 text-center text-sm text-muted-foreground">حساب مشتری‌ای برای این فیلتر پیدا نشد.</p>}</CardContent></Card>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">مانده از جمع بدهکار منهای بستانکار ردیف‌های حساب مشتری در دفترکل محاسبه می‌شود و فقط‌خواندنی است. حساب‌های پرداختنی و تأمین‌کنندگان در این گزارش لحاظ نشده‌اند.</div>
  </div>;
}


function FiscalPeriodsManager() {
  const exchangeCode=getExchangeCode();
  const qc=useQueryClient();
  const EMPTY_PERIOD={period_code:'',period_name:'',start_date:'',end_date:'',description:''};
  const [form,setForm]=useState(EMPTY_PERIOD);
  const [editing,setEditing]=useState(null);
  const [open,setOpen]=useState(false);
  const query=useQuery({queryKey:['enterpriseFiscalPeriods',exchangeCode],enabled:!!exchangeCode,queryFn:async()=>{const {data,error}=await supabase.from('fiscal_periods').select('*').eq('exchange_code',exchangeCode).order('start_date',{ascending:false}).limit(300);if(error)throw new Error(error.message);return data||[];}});
  const save=useMutation({
    mutationFn:async()=>{
      const code=form.period_code.trim(),name=form.period_name.trim();
      if(!code||!name||!form.start_date||!form.end_date)throw new Error('کد، نام و بازهٔ دوره مالی الزامی است');
      if(form.start_date>form.end_date)throw new Error('تاریخ شروع باید قبل از تاریخ پایان باشد');
      const conflict=(query.data||[]).find(p=>p.id!==editing?.id&&form.start_date<=p.end_date&&form.end_date>=p.start_date);
      if(conflict)throw new Error('این بازه با دورهٔ باز دیگری هم‌پوشانی دارد');
      const payload={period_code:code,period_name:name,start_date:form.start_date,end_date:form.end_date,description:form.description.trim()||null,updated_at:new Date().toISOString()};
      if(editing){const {data,error}=await supabase.from('fiscal_periods').update(payload).eq('id',editing.id).eq('exchange_code',exchangeCode).eq('status','open').select().single();if(error)throw new Error(error.message);return data;}
      const {data,error}=await supabase.from('fiscal_periods').insert({...payload,exchange_code:exchangeCode,status:'open'}).select().single();if(error)throw new Error(error.message);return data;
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:['enterpriseFiscalPeriods',exchangeCode]});setOpen(false);setEditing(null);setForm(EMPTY_PERIOD);toast({title:'دوره مالی ذخیره شد'});},
    onError:e=>toast({title:'ذخیره دوره مالی ناموفق بود',description:e.message,variant:'destructive'}),
  });
  const beginEdit=p=>{setEditing(p);setForm({period_code:p.period_code,period_name:p.period_name,start_date:p.start_date,end_date:p.end_date,description:p.description||''});setOpen(true);};
  if(!exchangeCode)return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مدیریت دوره‌های مالی، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3"><div className="flex justify-between items-center gap-2"><div><h2 className="font-semibold">دوره‌های مالی</h2><p className="text-xs text-muted-foreground">تعریف بازه‌های مالی مستقل برای این صرافی</p></div><Button size="sm" onClick={()=>{setEditing(null);setForm(EMPTY_PERIOD);setOpen(true);}}><Plus className="w-4 h-4"/>دوره جدید</Button></div><div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-muted/50 p-3">کل دوره‌ها <b className="block text-lg">{(query.data||[]).length}</b></div><div className="rounded-lg bg-muted/50 p-3">دوره‌های باز <b className="block text-lg">{(query.data||[]).filter(p=>p.status==='open').length}</b></div></div></CardContent></Card>
    {open&&<Card><CardContent className="p-4 space-y-3"><div className="flex justify-between"><h3 className="font-semibold">{editing?'ویرایش دوره مالی':'تعریف دوره مالی'}</h3><Button size="icon" variant="ghost" onClick={()=>setOpen(false)}><X className="w-4 h-4"/></Button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="space-y-1"><Label>کد دوره</Label><Input value={form.period_code} onChange={e=>setForm(p=>({...p,period_code:e.target.value}))} disabled={!!editing}/></div><div className="space-y-1"><Label>نام دوره</Label><Input value={form.period_name} onChange={e=>setForm(p=>({...p,period_name:e.target.value}))}/></div><div className="space-y-1"><Label>تاریخ شروع</Label><Input type="date" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))}/></div><div className="space-y-1"><Label>تاریخ پایان</Label><Input type="date" value={form.end_date} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))}/></div></div><div className="space-y-1"><Label>توضیحات</Label><Textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div><div className="flex gap-2"><Button className="flex-1" onClick={()=>save.mutate()} disabled={save.isPending}><Check className="w-4 h-4"/>ذخیره</Button><Button variant="outline" onClick={()=>setOpen(false)}>انصراف</Button></div></CardContent></Card>}
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 text-sm text-destructive">{query.error?.message}</CardContent></Card>:<Card><CardContent className="p-0 overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b bg-muted/40 text-right">{['کد','نام دوره','شروع','پایان','وضعیت','عملیات'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{(query.data||[]).map(p=><tr key={p.id} className="border-b last:border-0"><td className="p-3 font-mono">{p.period_code}</td><td className="p-3">{p.period_name}</td><td className="p-3">{p.start_date}</td><td className="p-3">{p.end_date}</td><td className="p-3">{p.status==='closed'?'بسته':'باز'}</td><td className="p-3"><Button size="sm" variant="ghost" disabled={p.status!=='open'} onClick={()=>beginEdit(p)}><Pencil className="w-4 h-4"/>ویرایش</Button></td></tr>)}</tbody></table>{(query.data||[]).length===0&&<p className="p-5 text-center text-sm text-muted-foreground">هنوز دوره مالی تعریف نشده است.</p>}</CardContent></Card>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">در این مرحله فقط تعریف و ویرایش دوره‌های باز انجام می‌شود. بستن دوره تا تکمیل کنترل اسناد، تراز و جلوگیری از ثبت در دوره بسته غیرفعال است؛ هیچ سند یا مانده‌ای تغییر نمی‌کند.</div>
  </div>;
}

function CostCentersManager() {
  const exchangeCode=getExchangeCode();
  const qc=useQueryClient();
  const EMPTY_CENTER={center_code:'',center_name:'',center_type:'department',parent_id:'',description:'',is_active:true};
  const [form,setForm]=useState(EMPTY_CENTER);
  const [editing,setEditing]=useState(null);
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState('');
  const query=useQuery({queryKey:['enterpriseCostCenters',exchangeCode],enabled:!!exchangeCode,queryFn:async()=>{const {data,error}=await supabase.from('cost_centers').select('*').eq('exchange_code',exchangeCode).order('center_code',{ascending:true}).limit(500);if(error)throw new Error(error.message);return data||[];}});
  const save=useMutation({
    mutationFn:async()=>{
      const code=form.center_code.trim(),name=form.center_name.trim();
      if(!code||!name)throw new Error('کد و نام مرکز هزینه الزامی است');
      const parentId=form.parent_id?Number(form.parent_id):null;
      let parent=parentId?(query.data||[]).find(x=>Number(x.id)===parentId):null;
      if(parentId&&!parent)throw new Error('مرکز مادر معتبر نیست');
      if(editing&&parentId){const seen=new Set();while(parent){if(Number(parent.id)===Number(editing.id))throw new Error('انتخاب مرکز مادر باعث ایجاد حلقه می‌شود');if(seen.has(Number(parent.id)))break;seen.add(Number(parent.id));parent=parent.parent_id?(query.data||[]).find(x=>Number(x.id)===Number(parent.parent_id)):null;}}
      const payload={center_code:code,center_name:name,center_type:form.center_type,parent_id:parentId,description:form.description.trim()||null,is_active:form.is_active,updated_at:new Date().toISOString()};
      if(editing){const {data,error}=await supabase.from('cost_centers').update(payload).eq('id',editing.id).eq('exchange_code',exchangeCode).select().single();if(error)throw new Error(error.message);return data;}
      const {data,error}=await supabase.from('cost_centers').insert({...payload,exchange_code:exchangeCode}).select().single();if(error)throw new Error(error.message);return data;
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:['enterpriseCostCenters',exchangeCode]});setOpen(false);setEditing(null);setForm(EMPTY_CENTER);toast({title:'مرکز هزینه ذخیره شد'});},
    onError:e=>toast({title:'ذخیره مرکز هزینه ناموفق بود',description:e.message,variant:'destructive'}),
  });
  const rows=(query.data||[]).filter(x=>!search||[x.center_code,x.center_name,x.center_type].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));
  const beginEdit=x=>{setEditing(x);setForm({center_code:x.center_code,center_name:x.center_name,center_type:x.center_type,parent_id:x.parent_id?String(x.parent_id):'',description:x.description||'',is_active:x.is_active});setOpen(true);};
  if(!exchangeCode)return <Card><CardContent className="p-5 text-sm text-muted-foreground">برای مدیریت مراکز هزینه، ابتدا با حساب همان صرافی وارد شوید.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardContent className="p-4 space-y-3"><div className="flex justify-between items-center gap-2"><div><h2 className="font-semibold">مراکز هزینه و سود</h2><p className="text-xs text-muted-foreground">ساختار سازمانی و مراکز هزینهٔ مستقل هر صرافی</p></div><Button size="sm" onClick={()=>{setEditing(null);setForm(EMPTY_CENTER);setOpen(true);}}><Plus className="w-4 h-4"/>مرکز جدید</Button></div><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی کد یا نام مرکز…"/></CardContent></Card>
    {open&&<Card><CardContent className="p-4 space-y-3"><div className="flex justify-between"><h3 className="font-semibold">{editing?'ویرایش مرکز':'تعریف مرکز هزینه'}</h3><Button size="icon" variant="ghost" onClick={()=>setOpen(false)}><X className="w-4 h-4"/></Button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="space-y-1"><Label>کد مرکز</Label><Input value={form.center_code} onChange={e=>setForm(p=>({...p,center_code:e.target.value}))} disabled={!!editing}/></div><div className="space-y-1"><Label>نام مرکز</Label><Input value={form.center_name} onChange={e=>setForm(p=>({...p,center_name:e.target.value}))}/></div><div className="space-y-1"><Label>نوع مرکز</Label><Select value={form.center_type} onValueChange={v=>setForm(p=>({...p,center_type:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="department">واحد / اداره</SelectItem><SelectItem value="branch">شعبه</SelectItem><SelectItem value="project">پروژه</SelectItem><SelectItem value="profit_center">مرکز سود</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>مرکز مادر</Label><Select value={form.parent_id||'none'} onValueChange={v=>setForm(p=>({...p,parent_id:v==='none'?'':v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">بدون مرکز مادر</SelectItem>{(query.data||[]).filter(x=>x.id!==editing?.id&&x.is_active).map(x=><SelectItem key={x.id} value={String(x.id)}>{x.center_code} — {x.center_name}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-1"><Label>توضیحات</Label><Textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div><div className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><Label>مرکز فعال باشد</Label><Switch checked={form.is_active} onCheckedChange={v=>setForm(p=>({...p,is_active:v}))}/></div><div className="flex gap-2"><Button className="flex-1" onClick={()=>save.mutate()} disabled={save.isPending}><Check className="w-4 h-4"/>ذخیره</Button><Button variant="outline" onClick={()=>setOpen(false)}>انصراف</Button></div></CardContent></Card>}
    {query.isLoading?<LoadingState/>:query.isError?<Card><CardContent className="p-4 text-sm text-destructive">{query.error?.message}</CardContent></Card>:<Card><CardContent className="p-0 overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b bg-muted/40 text-right">{['کد','مرکز','نوع','مرکز مادر','وضعیت','عملیات'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map(x=><tr key={x.id} className="border-b last:border-0"><td className="p-3 font-mono">{x.center_code}</td><td className="p-3">{x.center_name}</td><td className="p-3">{x.center_type}</td><td className="p-3">{(query.data||[]).find(p=>p.id===x.parent_id)?.center_name||'—'}</td><td className="p-3">{x.is_active?'فعال':'غیرفعال'}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={()=>beginEdit(x)}><Pencil className="w-4 h-4"/>ویرایش</Button></td></tr>)}</tbody></table>{rows.length===0&&<p className="p-5 text-center text-sm text-muted-foreground">مرکزی ثبت نشده است.</p>}</CardContent></Card>}
    <div className="rounded-lg border p-3 text-xs text-muted-foreground">تعریف مراکز هزینه مستقل و فقط برای همین صرافی است. تخصیص سند و گزارش سود/هزینه تا اتصال کامل به دفترکل در حالت به‌روزرسانی می‌ماند.</div>
  </div>;
}

export default function EnterpriseModulePage() {
  const { moduleKey='' } = useParams();
  const key=String(moduleKey).replace(/-/g,'_');
  const feature=FEATURE_CATALOG.find(f=>f.feature_key===key);
  if(key==='chart_of_accounts') return <><PageHeader title="کدینگ حساب‌ها" icon={ListTree}/><ChartOfAccounts/></>;
  if(key==='trial_balance') return <><PageHeader title="تراز آزمایشی" icon={ListTree}/><TrialBalance/></>;
  if(key==='subsidiary_ledger') return <><PageHeader title="دفاتر معین و تفصیلی" icon={ListTree}/><SubsidiaryLedger/></>;
  if(key==='audit_log') return <><PageHeader title="ردپای حسابرسی" icon={ListTree}/><AuditLogViewer/></>;
  if(key==='cash_flow') return <><PageHeader title="گردش وجوه نقد" icon={ListTree}/><CashFlowReport/></>;
  if(key==='accounts_receivable') return <><PageHeader title="مانده حساب مشتریان" icon={ListTree}/><CustomerBalancesReport/></>;
  if(key==='fiscal_periods') return <><PageHeader title="دوره‌های مالی" icon={CalendarDays}/><FiscalPeriodsManager/></>;
  if(key==='cost_centers') return <><PageHeader title="مراکز هزینه و سود" icon={GitBranch}/><CostCentersManager/></>;
  if(key==='document_center') return <><PageHeader title="مرکز اسناد" icon={ListTree}/><DocumentCenter/></>;
  if(key==='treasury') return <><PageHeader title="خزانه‌داری و نقدینگی" icon={ListTree}/><TreasuryOverview/></>;
  const info=MODULE_INFO[key];
  return <>
    <PageHeader title={info?.[0]||feature?.name||'ماژول سازمانی'} icon={ListTree}/>
    <Card><CardContent className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="w-4 h-4 text-amber-500"/>مسیر و صفحهٔ این ماژول فعال است؛ عملیات واقعی هنوز تکمیل نشده است.</div>
      <p className="text-sm text-muted-foreground">{info?.[1]||feature?.default_message||'این ماژول در ساختار سازمانی حساب صراف تعریف شده است.'}</p>
      {info?.[2]?.length>0&&<div className="space-y-2"><h3 className="text-sm font-semibold">دامنهٔ عملکرد برنامه</h3><ul className="list-disc pr-5 space-y-1 text-sm text-muted-foreground">{info[2].map(x=><li key={x}>{x}</li>)}</ul></div>}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">تا زمان اتصال کامل به دفترکل، کنترل دسترسی و آزمون حسابداری، این صفحه اطلاعات مالی ساختگی ثبت نمی‌کند.</div>
    </CardContent></Card>
  </>;
}
