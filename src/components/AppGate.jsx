import React, { useState, useEffect, useCallback } from 'react';
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

  // Show the same branded first-entry splash on public and protected routes.
  // Keep builder-only keepalive and setup work gated to builder routes.
  useKeepAlive(isBuilderRoute);

  useEffect(() => {
    if (isBuilderRoute) seedBase44Entities();
  }, [isBuilderRoute]);

  const [splashFinished, setSplashFinished] = useState(false);
  const handleSplashDone = useCallback(() => setSplashFinished(true), []);

  // Keep the original 1–100 counter visible on first app entry.
  // Wait for both app initialization and the full counter before continuing.
  useEffect(() => {
    if (!loading && splashFinished) setShowSplash(false);
  }, [loading, splashFinished]);

  if (showSplash) {
    return <WelcomeSplash onDone={handleSplashDone} />;
  }

  if (isBuilderRoute) return <PinLockGate>{children}</PinLockGate>;
  return children;
}