import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import WelcomeSplash from '@/components/WelcomeSplash';
import PinLockGate from '@/components/PinLockGate';
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
  if (!isBuilderRoute) return children;

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

  return <PinLockGate>{children}</PinLockGate>;
}