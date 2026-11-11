import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import WelcomeSplash from '@/components/WelcomeSplash';
import PinLockGate from '@/components/PinLockGate';
import { seedBase44Entities } from '@/lib/seedBase44Entities';
import { useKeepAlive } from '@/lib/useKeepAlive';

export default function AppGate({ children }) {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const loading = isLoadingAuth || isLoadingPublicSettings;
  const [showSplash, setShowSplash] = useState(true);
  const isPreview = typeof window !== 'undefined' && window.__PREVIEW_MODE__ === true;

  useKeepAlive();

  useEffect(() => {
    seedBase44Entities();
  }, []);

  useEffect(() => {
    if (!loading) {
      // give splash a moment to finish its counter if it hasn't
      const t = setTimeout(() => setShowSplash(false), 300);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (showSplash && loading) {
    return <WelcomeSplash onDone={() => setShowSplash(false)} />;
  }

  return (
    <>
      {isPreview && (
        <div
          role="status"
          className="sticky top-0 z-[100] w-full border-b border-amber-400/40 bg-amber-950 px-3 py-2 text-center text-xs font-medium text-amber-100 shadow-md"
        >
          پیش‌نمایش امن — داده‌ها نمایشی هستند؛ ثبت، ویرایش و انتقال مالی واقعی انجام ندهید.
        </div>
      )}
      <PinLockGate>{children}</PinLockGate>
    </>
  );
}
