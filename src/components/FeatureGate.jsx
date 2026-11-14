import React from 'react';
import { useFeatures, useSarraafProfile } from '@/lib/useSarraaf';
import { useAuth } from '@/lib/AuthContext';
import { usePaidSystemEnabled } from '@/lib/usePaidSystem';
import { useUpgrade } from '@/lib/UpgradeContext';
import { isFeatureEnabled, getFeatureStatus, getFeatureMessage } from '@/lib/features';
import { isFeatureAccessible } from '@/lib/permissions';
import { Loader2, ShieldAlert, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UpdatingNotice from '@/components/sarraaf/UpdatingNotice';

export default function FeatureGate({ featureKey, children }) {
  const { user } = useAuth();
  const { data: features, isLoading } = useFeatures();
  const { data: profile, isLoading: profileLoading } = useSarraafProfile(user?.id);
  const { data: paidSystemEnabled, isLoading: paidSystemLoading } = usePaidSystemEnabled();
  const { openUpgrade } = useUpgrade();
  const isCustomer = user?.role === 'customer';
  const isSystemAdmin = ['creator', 'admin'].includes(user?.role);

  if (isLoading || profileLoading || paidSystemLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const status = getFeatureStatus(features || [], featureKey);
  const hasTierAccess = isCustomer || isSystemAdmin || isFeatureAccessible(features || [], featureKey, profile || user, paidSystemEnabled);

  if (!hasTierAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <LockKeyhole className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold">این قابلیت در سطح اشتراک فعلی شما فعال نیست</p>
        <p className="text-sm text-muted-foreground mt-1">برای دسترسی به این بخش، سطح اشتراک را ارتقا دهید.</p>
        <Button className="mt-4" onClick={() => openUpgrade(featureKey)}>مشاهده سطح‌های اشتراک</Button>
      </div>
    );
  }

  if (!isFeatureEnabled(features || [], featureKey) || status === 'disabled') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold">این بخش غیرفعال است</p>
        <p className="text-sm text-muted-foreground mt-1">
          برای فعال‌سازی، با مدیر سیستم تماس بگیرید
        </p>
      </div>
    );
  }

  if (status === 'updating') {
    return <UpdatingNotice message={getFeatureMessage(features || [], featureKey)} />;
  }

  return children;
}