// ریشهٔ نسخهٔ ۲۲: نشست معتبر به میز کار نقش خودش می‌رود؛ نشست ناشناس به ورود هدایت می‌شود.
// ورود نمایشی خودکار حذف شده تا هیچ کاربر واقعی بدون احراز هویت وارد پنل نشود.
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from '@/a1/lib/demoAuth';

export default function RootEntry() {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div dir="rtl" lang="fa" className="flex min-h-screen items-center justify-center bg-[#f3f7fc] text-sm text-[#24496d]">
        <p className="m-0">در حال بررسی نشست…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] || '/dashboard'} replace />;
}
