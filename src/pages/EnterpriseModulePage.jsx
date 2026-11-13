import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Construction, ShieldCheck, ArrowRight } from 'lucide-react';

const MODULES = {
  'chart-of-accounts': ['کدینگ حساب‌ها', 'حسابداری و دفاتر مالی'],
  'subsidiary-ledger': ['دفاتر معین و تفصیلی', 'حسابداری و دفاتر مالی'],
  'trial-balance': ['تراز آزمایشی', 'حسابداری و دفاتر مالی'],
  'cash-flow': ['جریان وجوه نقد', 'گزارش‌ها و تحلیل مالی'],
  'cost-centers': ['مراکز هزینه و سود', 'مدیریت سازمانی'],
  'fiscal-periods': ['دوره‌های مالی', 'حسابداری و دفاتر مالی'],
  'period-close': ['بستن دوره مالی', 'حسابداری و دفاتر مالی'],
  'fixed-assets': ['دارایی‌های ثابت', 'مدیریت سازمانی'],
  'accounts-receivable': ['حساب‌های دریافتنی', 'مشتریان و طرف‌های حساب'],
  'accounts-payable': ['حساب‌های پرداختنی', 'مشتریان و طرف‌های حساب'],
  budgets: ['بودجه و پیش‌بینی', 'گزارش‌ها و تحلیل مالی'],
  treasury: ['خزانه‌داری و نقدینگی', 'صندوق، بانک و خزانه‌داری'],
  intercompany: ['حساب‌های بین‌صرافی', 'حواله‌ها و تسویه'],
  'multi-company': ['مدیریت چندشرکتی', 'مدیریت سازمانی'],
  kyc: ['احراز هویت مشتری', 'ریسک، انطباق و امنیت'],
  compliance: ['انطباق و مقررات', 'ریسک، انطباق و امنیت'],
  'audit-log': ['ردپای حسابرسی', 'ریسک، انطباق و امنیت'],
  'document-center': ['مرکز اسناد', 'ریسک، انطباق و امنیت'],
  approvals: ['گردش تأییدها', 'ریسک، انطباق و امنیت'],
  'fx-exposure': ['موقعیت و ریسک ارزی', 'ارز و مدیریت ریسک'],
  tax: ['مالیات و گزارش قانونی', 'ریسک، انطباق و امنیت'],
  standards: ['استانداردهای حسابداری', 'حسابداری و گزارشگری'],
  'aml-screening': ['کنترل AML و غربالگری', 'ریسک، انطباق و امنیت'],
  'fx-revaluation': ['تسعیر و ارزیابی مجدد ارز', 'ارز و مدیریت ریسک'],
  consolidation: ['صورت‌های مالی تلفیقی', 'سازمان و گزارشگری گروه'],
  'internal-controls': ['کنترل‌های داخلی و ریسک', 'ریسک، انطباق و امنیت'],
  'data-governance': ['حاکمیت داده و حریم خصوصی', 'ریسک، انطباق و امنیت'],
};

export default function EnterpriseModulePage() {
  const { moduleKey } = useParams();
  const module = MODULES[moduleKey];
  if (!module) {
    return <section dir="rtl" className="rounded-xl border bg-card p-6">
      <h1 className="text-lg font-bold">بخش موردنظر یافت نشد</h1>
      <Link className="mt-3 inline-flex items-center gap-2 text-primary underline" to="/dashboard">بازگشت به داشبورد</Link>
    </section>;
  }
  return (
    <section dir="rtl" className="mx-auto w-full max-w-5xl space-y-4">
      <header className="flex items-start gap-3 rounded-2xl border bg-card p-5">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Construction className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{module[1]}</p>
          <h1 className="mt-1 text-xl font-bold">{module[0]}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">ساختار این بخش در نقشه سامانه تعریف شده است. تا تکمیل گردش‌کار، کنترل‌های دسترسی و آزمون حسابداری، عملیات واقعی این بخش فعال نیست.</p>
        </div>
      </header>
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 p-4 dark:bg-amber-950/10">
        <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" />حالت ایمن · فقط ساختار</div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">در این مرحله هیچ سند، مانده، تراکنش یا اطلاعاتی در پایگاه داده ایجاد یا تغییر نمی‌شود.</p>
      </div>
      <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"><ArrowRight className="h-4 w-4" />بازگشت به داشبورد</Link>
    </section>
  );
}
