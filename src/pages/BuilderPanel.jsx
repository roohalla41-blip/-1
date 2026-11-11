import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useFeatures, useToggleFeature } from '@/lib/useSarraaf';
import { FEATURE_CATALOG, CRITICAL_FEATURES, getFeatureStatus } from '@/lib/features';
import { PageHeader } from '@/components/sarraaf/Pieces';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Users, CreditCard, Lock, Bell, MessageSquare,
  Server, Wallet, Crown, Upload, LogOut, Download, AlertTriangle, UserCog, Clock, Eye, Mail, Smartphone, Gamepad2, Zap, Globe, Store, FlaskConical, Database, Bot, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatManagement from '@/components/sarraaf/ChatManagement';
import UserManagement from '@/components/sarraaf/UserManagement';
import NotificationManager from '@/components/sarraaf/NotificationManager';
import PlanFeatureManager from '@/components/sarraaf/PlanFeatureManager';
import PaidSystemToggle from '@/components/sarraaf/PaidSystemToggle';
import PlanPricingManager from '@/components/sarraaf/PlanPricingManager';
import PermissionManager from '@/components/sarraaf/PermissionManager';
import PaymentMethodsManager from '@/components/sarraaf/PaymentMethodsManager';
import SystemOverview from '@/components/sarraaf/SystemOverview';
import OrphanCustomerManager from '@/components/sarraaf/OrphanCustomerManager';
import SqlMigrationHelper from '@/components/sarraaf/SqlMigrationHelper';
import VersionManager from '@/components/sarraaf/VersionManager';
import ContactSettingsManager from '@/components/sarraaf/ContactSettingsManager';
import AppIconDownloader from '@/components/sarraaf/AppIconDownloader';
import EmergencyBackup from '@/components/sarraaf/EmergencyBackup';
import EmergencyBackupV2 from '@/components/sarraaf/EmergencyBackupV2';
import TripleBackup from '@/components/sarraaf/TripleBackup';
import KeepaliveStatus from '@/components/sarraaf/KeepaliveStatus';
import WithdrawalManagement from '@/components/sarraaf/WithdrawalManagement';
import CoCreatorManager from '@/components/sarraaf/CoCreatorManager';
import ManualVerificationManager from '@/components/sarraaf/ManualVerificationManager';
import LegacyDataMigrator from '@/components/sarraaf/LegacyDataMigrator';
import AccountRecoveryManager from '@/components/sarraaf/AccountRecoveryManager';
import TrialManager from '@/components/sarraaf/TrialManager';
import MobileLayoutPreview from '@/components/sarraaf/MobileLayoutPreview';
import CreatorPreviewLab from '@/components/sarraaf/CreatorPreviewLab';
import { lazy } from 'react';
const Assistant = lazy(() => import('@/pages/Assistant'));
import UCManager from '@/components/sarraaf/UCManager';
import RechargeManager from '@/components/sarraaf/RechargeManager';
import Afghan5Manager from '@/components/sarraaf/Afghan5Manager';
import SellerManager from '@/components/sarraaf/SellerManager';
import SandboxPanel from '@/components/sandbox/SandboxPanel';
import SupabaseAuditManager from '@/components/sarraaf/SupabaseAuditManager';
import LiveDatabaseExplorer from '@/components/sarraaf/LiveDatabaseExplorer';
import { SandboxProvider } from '@/components/sandbox/SandboxProvider';
import { checkBuilderAccess, startBuilderSession } from '@/lib/builderAccess';
import { useToast } from '@/components/ui/use-toast';

const STATUS_LABELS = {
  active: 'فعال',
  updating: 'در حال به‌روزرسانی',
  disabled: 'غیرفعال',
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  updating: 'bg-amber-100 text-amber-700',
  disabled: 'bg-red-100 text-red-700',
};

// فهرست بخش‌ها؛ نام و شناسه هر تب برای حفظ سازگاری قبلی بدون تغییر مانده است.
const TAB_GROUPS = [
  { label: 'سیستم', value: 'system', description: 'نمای کلی، اتصال، وضعیت و ابزارهای پایه' },
  { label: 'ساختار و آیکون‌ها', value: 'structure', description: 'نقشه صفحات، فهرست قابلیت‌ها و وضعیت آیکون‌ها' },
  { label: 'بخش‌ها', value: 'features', description: 'فعال‌سازی و وضعیت قابلیت‌های برنامه' },
  { label: 'کاربران', value: 'users', description: 'مدیریت کاربران و حساب‌ها' },
  { label: 'مجوزها', value: 'perms', description: 'نقش‌ها و سطح دسترسی' },
  { label: 'پلن‌ها', value: 'plans', description: 'پلن‌ها و امکانات هر پلن' },
  { label: 'قیمت‌گذاری', value: 'pricing', description: 'قیمت و تعرفه پلن‌ها' },
  { label: 'اعلان‌ها', value: 'notif', description: 'پیام‌ها و اعلان‌های سیستم' },
  { label: 'چت', value: 'chat', description: 'مدیریت گفت‌وگوها و گروه‌ها' },
  { label: 'پرداخت', value: 'payments', description: 'روش‌های پرداخت' },
  { label: 'برداشت‌ها', value: 'withdrawals', description: 'بررسی درخواست‌های برداشت' },
  { label: 'نسخه', value: 'version', description: 'نسخه، نشان برنامه و اطلاعات تماس' },
  { label: 'پشتیبان', value: 'backup', description: 'پشتیبان اضطراری' },
  { label: 'پشتیبان v2', value: 'backup_v2', description: 'نسخه کامل پشتیبان' },
  { label: 'پشتیبان سه‌گانه', value: 'triple_backup', description: 'خروجی‌های PDF، ZIP و ساختار پایگاه داده' },
  { label: 'کمک‌سازنده', value: 'co_creators', description: 'مدیریت دسترسی کمک‌سازنده‌ها' },
  { label: 'تأیید ایمیل', value: 'email_verify', description: 'درخواست‌های تأیید دستی ایمیل' },
  { label: 'دوره آزمایشی', value: 'trial', description: 'مدیریت دوره آزمایشی صرافان' },
  { label: 'چیدمان موبایل', value: 'layout_preview', description: 'پیش‌نمایش چیدمان موبایل' },
  { label: 'آزمایشگاه توسعه', value: 'creator_preview', description: 'پیش‌نمایش امن در محیط مستقل' },
  { label: 'دستیار هوشمند', value: 'masnavi_ai', description: 'دستیار هوشمند آزمایشی' },
  { label: 'UC پابجی', value: 'uc_manager', description: 'مدیریت خدمات UC' },
  { label: 'شارژ و بسته', value: 'recharge', description: 'مدیریت شارژ و بسته اینترنت' },
  { label: 'افغان۵', value: 'afghan5', description: 'مدیریت خدمات افغان۵' },
  { label: 'فروشندگان', value: 'sellers', description: 'مدیریت فروشندگان و سفارش‌ها' },
  { label: 'آزمایش فروش', value: 'sandbox', description: 'محیط آزمایشی مستقل فروش' },
  { label: 'بررسی سوپابیس', value: 'supabase_audit', description: 'گزارش ساختار و سیاست‌های امنیتی' },
  { label: 'دیتابیس زنده', value: 'db_explorer', description: 'ابزار مشاهده پایگاه داده زنده' },
];

const TAB_CATEGORIES = [
  { label: 'نمای کلی', value: 'overview', icon: Server, tabs: ['system', 'features'] },
  { label: 'ساختار و ماژول‌ها', value: 'structure', icon: LayoutGrid, tabs: ['structure'] },
  { label: 'کاربران و دسترسی', value: 'access', icon: Users, tabs: ['users', 'perms', 'co_creators', 'email_verify'] },
  { label: 'مالی و پلن‌ها', value: 'finance', icon: Wallet, tabs: ['plans', 'pricing', 'payments', 'withdrawals', 'trial'] },
  { label: 'ارتباطات', value: 'communication', icon: MessageSquare, tabs: ['notif', 'chat', 'masnavi_ai'] },
  { label: 'خدمات و فروش', value: 'services', icon: Store, tabs: ['uc_manager', 'recharge', 'afghan5', 'sellers', 'sandbox'] },
  { label: 'ابزار و نگهداری', value: 'tools', icon: Database, tabs: ['version', 'layout_preview', 'creator_preview', 'backup', 'backup_v2', 'triple_backup', 'supabase_audit', 'db_explorer'] },
];

export default function BuilderPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: features, refetch } = useFeatures();
  const toggleMut = useToggleFeature();
  const [autoLogoutWarning, setAutoLogoutWarning] = useState(false);
  const { toast } = useToast();

  // ── Determine builder access level ──
  const accessInfo = useMemo(() => checkBuilderAccess(user), [user]);
  const isFullCreator = user?.role === 'creator' || user?.role === 'admin';
  const allowedTabs = accessInfo?.allowed_tabs === 'all' ? null : (accessInfo?.allowed_tabs || []);

  const [activeCategory, setActiveCategory] = useState('overview');
  const [activeTab, setActiveTab] = useState('system');

  // فهرست قابل‌نمایش بر اساس همان سطح دسترسی قبلی؛ تب‌های ابزار حساس فقط برای سازنده/مدیر.
  const visibleTabs = useMemo(() => TAB_GROUPS.filter((group) => {
    const creatorOnlyTabs = ['co_creators', 'creator_preview', 'sandbox', 'supabase_audit', 'db_explorer'];
    if (creatorOnlyTabs.includes(group.value) && !isFullCreator) return false;
    if (isFullCreator) return true;
    if (group.value === 'co_creators') return false;
    if (!allowedTabs) return true;
    return allowedTabs.includes(group.value);
  }), [isFullCreator, allowedTabs]);

  const visibleCategories = useMemo(() => TAB_CATEGORIES
    .map((category) => ({
      ...category,
      tabs: visibleTabs.filter((group) => category.tabs.includes(group.value)),
    }))
    .filter((category) => category.tabs.length > 0), [visibleTabs]);

  const activeCategoryTabs = visibleCategories.find((category) => category.value === activeCategory)?.tabs || [];
  const activeTabInfo = activeCategoryTabs.find((group) => group.value === activeTab);

  useEffect(() => {
    const selectedCategory = visibleCategories.find((category) => category.value === activeCategory) || visibleCategories[0];
    if (!selectedCategory) return;
    if (!selectedCategory.tabs.some((group) => group.value === activeTab)) {
      setActiveCategory(selectedCategory.value);
      setActiveTab(selectedCategory.tabs[0].value);
    }
  }, [visibleCategories, activeCategory, activeTab]);

  // ── Auto-logout after 30 min inactivity ──
  useEffect(() => {
    const cleanup = startBuilderSession(() => {
      setAutoLogoutWarning(true);
      setTimeout(() => logout(true), 2000);
    });
    return cleanup;
  }, [logout]);

  const handleToggle = async (f) => {
    if (CRITICAL_FEATURES.includes(f.feature_key)) return;
    const current = features?.find(fx => fx.feature_key === f.feature_key);
    if (!current) {
      // Record doesn't exist yet — create it
      try {
        const { createSupabaseEntity } = await import('@/lib/supabaseApi');
        const sbFeatures = createSupabaseEntity('FeatureSetting');
        await sbFeatures.create({
          feature_key: f.feature_key,
          name: f.name,
          icon: f.icon,
          location: f.location,
          display_order: f.display_order,
          enabled: true,
          status: f.default_status || 'active',
        });
        if (refetch) refetch();
        toast({ title: 'بخش فعال شد', description: f.name });
      } catch (err) {
        toast({ title: 'خطا', description: err.message || 'عملیات ناموفق بود', variant: 'destructive' });
      }
      return;
    }
    toggleMut.mutate({ id: current.id, enabled: !current.enabled });
  };

  const handleStatusChange = async (featureKey, newStatus) => {
    const current = features?.find(fx => fx.feature_key === featureKey);
    if (CRITICAL_FEATURES.includes(featureKey)) return;
    try {
      const { createSupabaseEntity } = await import('@/lib/supabaseApi');
      const sbFeatures = createSupabaseEntity('FeatureSetting');
      if (!current) {
        // Record doesn't exist yet — create it with the new status
        const f = FEATURE_CATALOG.find(fx => fx.feature_key === featureKey);
        await sbFeatures.create({
          feature_key: featureKey,
          name: f?.name || featureKey,
          icon: f?.icon,
          location: f?.location,
          display_order: f?.display_order,
          enabled: newStatus !== 'disabled',
          status: newStatus,
        });
      } else {
        await sbFeatures.update(current.id, {
          status: newStatus,
          enabled: newStatus !== 'disabled',
        });
      }
      if (refetch) refetch();
      toast({ title: 'وضعیت بخش به‌روزرسانی شد', description: `${featureKey}: ${STATUS_LABELS[newStatus]}` });
    } catch (err) {
      toast({ title: 'خطا', description: err.message || 'عملیات ناموفق بود', variant: 'destructive' });
    }
  };

  if (autoLogoutWarning) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-3 p-6">
        <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
        <h2 className="text-lg font-bold">خروج خودکار</h2>
        <p className="text-sm text-muted-foreground text-center">
          به دلیل ۳۰ دقیقه بی‌فعالیتی در پنل سازنده، نشست شما به‌صورت خودکار پایان می‌یابد.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="پنل سازنده حساب صراف"
        subtitle={isFullCreator ? user?.full_name : `کمک‌سازنده: ${accessInfo?.name || user?.full_name || ''}`}
        icon={Shield}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            پیش‌نمایش برنامه
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">دسته‌بندی پنل سازنده</h2>
              <p className="text-xs text-muted-foreground">امکانات در گروه‌های مشخص قرار گرفته‌اند تا منو خلوت‌تر و پیدا کردن هر بخش آسان‌تر باشد.</p>
            </div>
            <span className="text-xs text-muted-foreground">{visibleTabs.length} بخش مدیریتی</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={activeCategory}
              onValueChange={(value) => {
                const category = visibleCategories.find((item) => item.value === value);
                setActiveCategory(value);
                if (category?.tabs?.length) setActiveTab(category.tabs[0].value);
              }}
            >
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="انتخاب گروه مدیریتی" />
              </SelectTrigger>
              <SelectContent>
                {visibleCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} ({category.tabs.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="انتخاب بخش" />
              </SelectTrigger>
              <SelectContent>
                {activeCategoryTabs.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {activeTabInfo?.description || 'یک بخش را برای مدیریت انتخاب کنید'}
          </p>
        </div>

        {/* نقشه ساختار و آیکون‌ها — فقط مشاهده؛ بدون نوشتن در پایگاه داده */}
        <TabsContent value="structure">
          <div className="space-y-4" dir="rtl">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold">نقشه قابلیت‌ها و آیکون‌های برنامه</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-6">
                  این فهرست از کاتالوگ فعلی برنامه خوانده می‌شود. در این مرحله فقط مشاهده و ممیزی انجام می‌شود؛
                  هیچ آیکون، منو، پلن یا داده‌ای از این صفحه تغییر نمی‌کند.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="rounded-lg bg-muted p-3"><p className="text-xl font-bold">{FEATURE_CATALOG.length}</p><p className="text-[11px] text-muted-foreground">قابلیت ثبت‌شده</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xl font-bold">{FEATURE_CATALOG.filter(x => x.location === 'nav').length}</p><p className="text-[11px] text-muted-foreground">آیکون منو</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xl font-bold">{FEATURE_CATALOG.filter(x => x.location === 'action').length}</p><p className="text-[11px] text-muted-foreground">عملیات سریع</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xl font-bold">{FEATURE_CATALOG.filter(x => x.critical).length}</p><p className="text-[11px] text-muted-foreground">بخش حیاتی</p></div>
                </div>
              </CardContent>
            </Card>
            {[
              { title: 'حساب‌ها و عملیات صرافی', keys: ['customers','dadogereft','trade','convert','transfers','currencies','sarraaf_market'] },
              { title: 'صندوق، بانک و خزانه‌داری', keys: ['cash','bank','transfer_book'] },
              { title: 'حسابداری و دفاتر مالی', keys: ['journal','general_ledger','balance_sheet','reconciliation','profit_loss'] },
              { title: 'گزارش‌ها و سازمان', keys: ['reports','agents','agency_network'] },
              { title: 'خدمات دیجیتال و پرداخت', keys: ['online_products','mobile_recharge','pubg_uc','payment_gateway','bank_gateway','payment_card','payment_bank','payment_paypal','payment_crypto'] },
              { title: 'ارتباطات و پشتیبانی', keys: ['sarraaf_chat','chat_groups','support','assistant'] },
              { title: 'سیستم و نگهداری', keys: ['dashboard','backup','settings','main_settings'] },
            ].map(group => {
              const items = group.keys.map(key => FEATURE_CATALOG.find(item => item.feature_key === key)).filter(Boolean);
              if (!items.length) return null;
              return (
                <Card key={group.title}>
                  <CardContent className="p-3 space-y-2">
                    <h4 className="text-xs font-bold">{group.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map(item => {
                        const status = getFeatureStatus(features || [], item.feature_key);
                        const Icon = ({ Users, Send: Upload, ArrowRightLeft: Zap, FileText: Download, Banknote: Wallet, Store, MessageSquareMore: MessageSquare, ArrowLeftRight: Zap, Repeat: Zap, Landmark: CreditCard, Coins: Wallet, TrendingUp: Crown, BookOpen, BookCopy: Download, ScrollText: Download, BookOpen: Download, Scale: Shield, FileSearch: Eye, ShoppingBag: Store, Smartphone, Gamepad2, CreditCard, MessageSquare, DatabaseBackup: Database, Headphones: Bell, Bot, LayoutDashboard: Server, Settings: Lock, Shield: Shield })[item.icon] || LayoutGrid;
                        return (
                          <div key={item.feature_key} className="flex items-center gap-2 rounded-lg border p-2.5 min-w-0">
                            <div className="w-9 h-9 shrink-0 rounded-lg bg-muted flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{item.icon} · {item.location === 'nav' ? 'آیکون منو' : 'عملیات سریع'}</p>
                            </div>
                            <span className={`text-[10px] shrink-0 rounded-full px-2 py-1 ${STATUS_COLORS[status] || 'bg-muted text-muted-foreground'}`}>{STATUS_LABELS[status] || 'نامشخص'}</span>
                            {item.critical && <Shield className="w-3.5 h-3.5 text-primary shrink-0" aria-label="بخش حیاتی" />}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><h4 className="text-xs font-bold">کنترل نمایش بر اساس پلن</h4></div>
                <p className="text-xs text-muted-foreground leading-6">
                  جایگاه تنظیمات Basic، Standard و Enterprise در نقشه مشخص شده است؛ اما تغییر واقعی نمایش آیکون‌ها
                  باید پس از طراحی ذخیره‌سازی امن و هماهنگ بین دستگاه‌ها فعال شود. تنظیمات آزمایشی مبتنی بر حافظه مرورگر
                  از نسخه دیگر به برنامه زنده منتقل نشده‌اند.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {['Basic','Standard','Enterprise'].map(tier => <div key={tier} className="rounded-lg border p-2 text-center text-xs font-semibold">{tier}<p className="text-[10px] font-normal text-muted-foreground mt-1">نیازمند اتصال امن</p></div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* سیستم — نمای کلی، اتصال، آمار */}
        <TabsContent value="system">
          <div className="space-y-4">
            <AccountRecoveryManager />
            <KeepaliveStatus />
            <SystemOverview />
            <OrphanCustomerManager />
            <LegacyDataMigrator />
            <SqlMigrationHelper />
          </div>
        </TabsContent>

        {/* بخش‌ها */}
        <TabsContent value="features">
          <Card><CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-1">مدیریت بخش‌ها</h3>
            <p className="text-xs text-muted-foreground mb-4">هر بخش را می‌توانید فعال، در حال به‌روزرسانی یا غیرفعال کنید.</p>
            <div className="space-y-2">
              {FEATURE_CATALOG.map(f => {
                const dbFeature = features?.find(fx => fx.feature_key === f.feature_key);
                const enabled = dbFeature ? dbFeature.enabled !== false : true;
                const status = dbFeature?.status || (f.default_status || 'active');
                const isCritical = CRITICAL_FEATURES.includes(f.feature_key);
                return (
                  <div key={f.feature_key} className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{f.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      {isCritical && <span className="text-[10px] text-muted-foreground mr-2">(حیاتی)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCritical && (
                        <Select value={status} onValueChange={(v) => handleStatusChange(f.feature_key, v)}>
                          <SelectTrigger className="text-xs h-7 w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">فعال</SelectItem>
                            <SelectItem value="updating">به‌روزرسانی</SelectItem>
                            <SelectItem value="disabled">غیرفعال</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Switch
                        checked={enabled}
                        disabled={isCritical}
                        onCheckedChange={() => handleToggle(f)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* کاربران */}
        <TabsContent value="users"><UserManagement /></TabsContent>

        {/* مجوزها */}
        <TabsContent value="perms"><PermissionManager /></TabsContent>

        {/* پلن‌ها */}
        <TabsContent value="plans">
          <div className="space-y-4">
            <PaidSystemToggle />
            <PlanFeatureManager />
          </div>
        </TabsContent>

        {/* قیمت‌گذاری */}
        <TabsContent value="pricing"><PlanPricingManager /></TabsContent>

        {/* اعلان‌ها */}
        <TabsContent value="notif"><NotificationManager /></TabsContent>

        {/* چت */}
        <TabsContent value="chat"><ChatManagement /></TabsContent>

        {/* پرداخت */}
        <TabsContent value="payments"><PaymentMethodsManager /></TabsContent>

        {/* برداشت‌ها */}
        <TabsContent value="withdrawals"><WithdrawalManagement /></TabsContent>

        {/* نسخه */}
        <TabsContent value="version">
          <div className="space-y-4">
            <AppIconDownloader />
            <VersionManager />
            <ContactSettingsManager />
          </div>
        </TabsContent>

        {/* پشتیبان اضطراری */}
        <TabsContent value="backup">
          <EmergencyBackup />
        </TabsContent>

        {/* پشتیبان اضطراری v2 — Snapshot کامل وضعیت پروژه */}
        <TabsContent value="backup_v2">
          <EmergencyBackupV2 />
        </TabsContent>

        {/* پشتیبان سه‌گانه — PDF + ZIP + Supabase */}
        <TabsContent value="triple_backup">
          <TripleBackup />
        </TabsContent>

        {/* کمک‌سازنده‌ها — فقط سازنده اصلی */}
        {isFullCreator && (
          <TabsContent value="co_creators">
            <CoCreatorManager />
          </TabsContent>
        )}

        {/* تأیید دستی ایمیل */}
        <TabsContent value="email_verify">
          <ManualVerificationManager />
        </TabsContent>

        {/* مدیریت دوره آزمایشی */}
        <TabsContent value="trial">
          <TrialManager />
        </TabsContent>

        {/* پیش‌نمایش چیدمان موبایل */}
        <TabsContent value="layout_preview">
          <MobileLayoutPreview />
        </TabsContent>

        {/* آزمایشگاه توسعه — فقط پنل سازنده اصلی و کاملاً جدا از دیتابیس زنده */}
        {isFullCreator && (
          <TabsContent value="creator_preview">
            <CreatorPreviewLab />
          </TabsContent>
        )}

        {/* هوش مثنوی — دستیار هوشمند آزمایشی */}
        <TabsContent value="masnavi_ai">
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <Assistant />
          </React.Suspense>
        </TabsContent>

        {/* مدیریت UC پابجی موبایل */}
        <TabsContent value="uc_manager">
          <UCManager />
        </TabsContent>

        {/* شارژ و بسته اینترنت — افغان۵ */}
        <TabsContent value="recharge">
          <RechargeManager />
        </TabsContent>

        {/* مدیریت افغان۵ — نشانی حساب، بسته‌ها و سفارش‌ها */}
        <TabsContent value="afghan5">
          <Afghan5Manager />
        </TabsContent>

        {/* مدیریت فروشندگان — نقش‌ها، سفارش‌ها، قیمت‌گذاری */}
        <TabsContent value="sellers">
          <SellerManager />
        </TabsContent>

        {/* محیط آزمایشی فروش شارژ و خدمات دیجیتال — فقط سازندهٔ اصلی */}
        {isFullCreator && (
          <TabsContent value="sandbox">
            <SandboxProvider>
              <SandboxPanel />
            </SandboxProvider>
          </TabsContent>
        )}

        {/* بررسی امن سوپابیس — فقط سازنده/مدیر */}
        {isFullCreator && (
          <TabsContent value="supabase_audit">
            <SupabaseAuditManager />
          </TabsContent>
        )}

        {/* دیتابیس زنده — فقط سازندهٔ اصلی */}
        {isFullCreator && (
          <TabsContent value="db_explorer">
            <LiveDatabaseExplorer />
          </TabsContent>
        )}

      </Tabs>
    </>
  );
}