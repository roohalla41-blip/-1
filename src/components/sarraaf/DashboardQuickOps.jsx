import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Download, BookOpen, ArrowRightLeft, Users, ShoppingBag } from 'lucide-react';
import { getProfilePlanLevel, isFeatureAvailableForLevel, isFeatureEnabled } from '@/lib/features';

const OPS = [
  { label: 'حواله ارسال', path: '/transfers/send', featureKey: 'transfer_send', icon: Send },
  { label: 'حواله دریافت', path: '/transfers/receive', featureKey: 'transfer_receive', icon: Download },
  { label: 'دفتر حواله', path: '/transfer-book', featureKey: 'transfer_book', icon: BookOpen },
  { label: 'تبدیل ارز', path: '/convert', featureKey: 'convert', icon: ArrowRightLeft },
  { label: 'مشتریان', path: '/customers', featureKey: 'customers', icon: Users },
  { label: 'محصولات آنلاین', path: '/online-products', featureKey: 'online_products', icon: ShoppingBag },
];

export default function DashboardQuickOps({ features = [], profile, userRole, paidSystemEnabled }) {
  const canSeeAllFeatures = ['creator', 'admin'].includes(userRole) || paidSystemEnabled === false;
  const level = getProfilePlanLevel(profile);
  const visibleOps = OPS.filter(op => isFeatureEnabled(features, op.featureKey) &&
    (canSeeAllFeatures || isFeatureAvailableForLevel(features, op.featureKey, level)));

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card lg:col-span-2 xl:col-span-1">
      <h2 className="text-sm font-semibold mb-3">عملیات سریع</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-2">
        {visibleOps.map(({ label, path, icon: Icon }) => (
          <Link key={path} to={path} className="flex items-center justify-between gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors">
            <span>{label}</span>
            <Icon className="w-5 h-5 text-primary shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}