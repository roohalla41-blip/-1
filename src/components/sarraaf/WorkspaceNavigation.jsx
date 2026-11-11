import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Product-domain navigation. Existing routes are reused; missing modules are
// explicitly shown as under construction and never presented as working links.
const GROUPS = [
  { title: 'نمای کلی و داشبورد', keys: ['dashboard'] },
  { title: 'مشتریان و طرف‌های حساب', keys: ['customers', 'debtors', 'agents'] },
  { title: 'عملیات صرافی', keys: ['dadogereft', 'trade', 'transfer_send', 'transfer_receive', 'transfer_book', 'convert'] },
  { title: 'صندوق، بانک و خزانه‌داری', keys: ['cash', 'bank'], pending: ['خزانه‌داری پیشرفته و گردش وجوه', 'مدیریت چندصندوقی و تسویه'] },
  { title: 'حسابداری و دفاتر', keys: ['journal', 'general_ledger'], pending: ['دفتر معین و تفصیلی', 'کدینگ حساب‌ها و کنترل تراز'] },
  { title: 'گزارش‌ها و تحلیل', keys: ['reports', 'profit_loss', 'balance_sheet', 'reconciliation'] },
  { title: 'سازمان و دسترسی', keys: ['agency_network', 'settings'], pending: ['مدیریت شعب و کارکنان', 'ماتریس نقش × مجوز × سطح اشتراک'] },
  { title: 'ریسک، انطباق و حسابرسی', keys: ['backup'], pending: ['ثبت رویدادهای حسابرسی و ردگیری تغییرات', 'کنترل‌های ریسک و انطباق'] },
  { title: 'اسناد و گردش تأیید', keys: ['receipt'], pending: ['گردش تأیید چندمرحله‌ای اسناد', 'مدیریت پیوست‌ها و سوابق سند'] },
  { title: 'خدمات و پشتیبانی', keys: ['currencies', 'sarraaf_market', 'online_products', 'payment_gateway', 'sarraaf_chat', 'chat_groups', 'support', 'assistant'] },
];

export default function WorkspaceNavigation({ items }) {
  const { pathname } = useLocation();
  const activePath = items
    .filter(item => pathname === item.path || pathname.startsWith(item.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  return (
    <nav aria-label="منوی اصلی صراف" className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-2 py-3 space-y-1">
      {GROUPS.map((group, index) => {
        const entries = group.keys.map(key => items.find(item => item.featureKey === key)).filter(Boolean);
        if (!entries.length && !group.pending?.length) return null;
        const isDefaultOpen = index === 0 || entries.some(item => item.path === activePath);
        return (
          <details key={group.title} open={isDefaultOpen} className="group">
            <summary className="flex items-center justify-between gap-2 list-none cursor-pointer rounded-md px-3 py-2 text-[11px] font-bold tracking-wide text-slate-400 hover:text-slate-200 transition-colors [&::-webkit-details-marker]:hidden">
              <span>{group.title}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="space-y-0.5 mt-0.5">
              {entries.map(item => {
                const Icon = item.icon;
                const active = item.path === activePath;
                return (
                  <Link
                    key={item.featureKey}
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
              {group.pending?.map(label => (
                <div key={label} aria-disabled="true" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-500">
                  <span className="w-4 h-4 shrink-0 rounded border border-dashed border-slate-600" />
                  <span className="truncate">{label}</span>
                  <span className="mr-auto shrink-0 text-[10px] text-amber-500/80">در حال تکمیل</span>
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
