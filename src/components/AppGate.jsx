import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import WelcomeSplash from '@/components/WelcomeSplash';
import PinLockGate from '@/components/PinLockGate';
import PageLoader from '@/components/PageLoader';
import { seedBase44Entities } from '@/lib/seedBase44Entities';
import { useKeepAlive } from '@/lib/useKeepAlive';

export default function AppGate({ children }) {
  const location = useLocation();
  const builderPaths = ['/builder', '/main-settings'];
  const isBuilderRoute = builderPaths.some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const loading = isLoadingAuth || isLoadingPublicSettings;
  const [showSplash, setShowSplash] = useState(true);

  // Public visitors must see the maintenance notice immediately, without the
  // welcome splash or PIN gate. Builder routes retain their existing security flow.
  // Hooks must run in the same order on every route. Keep builder-only work
  // gated inside the hook/effect instead of returning before these calls.
  useKeepAlive(isBuilderRoute);

  useEffect(() => {
    if (isBuilderRoute) seedBase44Entities();
  }, [isBuilderRoute]);

  // Show the same offline-capable 1–100 startup counter to every visitor.
  // It is purely local and does not wait for authentication or server settings.
  if (showSplash) {
    return <WelcomeSplash onDone={() => setShowSplash(false)} />;
  }

  if (!isBuilderRoute) return children;
  if (loading) return <PageLoader />;

  return <PinLockGate>{children}</PinLockGate>;
}