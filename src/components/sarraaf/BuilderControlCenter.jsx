import React from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, Boxes, CheckCircle2, CircleHelp,
  Database, Gauge, Layers3, LockKeyhole, ShieldCheck, Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CONTROL_AREAS = [
  { title: 'نظارت و سلامت سامانه', description: 'وضعیت کلی، اتصال سرویس‌ها، خطاها و عملیات نگهداری', icon: Activity, tabs: ['system', 'supabase_audit'] },
  { title: 'هویت و دسترسی', description: 'کاربران، نقش‌ها، مجوزها و کمک‌سازندگان', icon: Users, tabs: ['users', 'perms', 'co_creators', 'email_verify'] },
  { title: 'ساختار و قابلیت‌ها', description: 'نقشه معماری، ماژول‌ها و وضعیت تکمیل قابلیت‌ها', icon: Boxes, tabs: ['architecture', 'features'] },
  { title: 'پلن‌ها و درآمد', description: 'سطوح اشتراک، سهمیه‌ها، قیمت‌گذاری و پرداخت', icon: Gauge, tabs: ['plans', 'pricing', 'payments', 'withdrawals', 'trial'] },
  { title: 'انتشار و نگهداری', description: 'نسخه‌ها، پشتیبان‌ها و پیش‌نمایش رابط کاربری', icon: Layers3, tabs: ['version', 'backup', 'backup_v2', 'triple_backup', 'layout_preview'] },
  { title: 'خدمات و ارتباطات', description: 'اعلان‌ها، چت، خدمات دیجیتال و فروشندگان', icon: CircleHelp, tabs: ['notif', 'chat', 'uc_manager', 'recharge', 'afghan5', 'sellers', 'masnavi_ai'] },
];

export default function BuilderControlCenter({ groups = [], onSelect }) {
  const labels = Object.fromEntries(groups.map(group => [group.value, group.label]));
  const preview = typeof window !== 'undefined' && window.__PREVIEW_MODE__ === true;
  const config = typeof window !== 'undefined' ? window.__SUPABASE_CONFIG__ : null;
  const connectedConfig = !!(config?.url && config?.key && !String(config.url).includes('.invalid'));
  const status = preview && !connectedConfig ? 'اتصال دیتابیس در این پیش‌نمایش برقرار نیست' : 'وضعیت اتصال نیازمند آزمون زنده است';

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="border-primary/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3"><ShieldCheck className="h-6 w-6 text-primary" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">مرکز کنترل کل سامانه</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-6">مدیریت مرکزی کاربران، صرافی‌ها، دسترسی‌ها، قابلیت‌ها، پلن‌ها، زیرساخت و انتشار؛ مستقل از عملیات روزمره پنل صرافی.</p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{status}. هیچ داده‌ای از دیتابیس اصلی A1 در این محیط خوانده یا تغییر داده نمی‌شود.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CONTROL_AREAS.map(area => {
          const Icon = area.icon;
          return (
            <Card key={area.title} className="transition-colors hover:border-primary/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">{area.title}</h3>
                </div>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{area.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {area.tabs.map(tab => (
                    <Button key={tab} size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => onSelect?.(tab)}>
                      {labels[tab] || tab}<ArrowLeft className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Database className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">مرز ایمنی پیش‌نمایش</h3>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">ابزارهای تغییر دیتابیس، مهاجرت، پرداخت و عملیات مالی تا زمان اتصال یک دیتابیس آزمایشی مستقل غیرفعال می‌مانند. این صفحه مرکز هدایت به ماژول‌های موجود است و وضعیت واقعی اتصال را جعل نمی‌کند.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
