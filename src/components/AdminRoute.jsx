import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';
import { canAccessRoute, HOME_BY_ROLE } from '@/lib/rbac';
import { checkBuilderAccess, fetchAndCacheBuilderAccess } from '@/lib/builderAccess';
import { useEffect, useState } from 'react';

// مسیر پنل سازنده: سازنده اصلی یا کمک‌سازنده‌ای با مجوز فعال.
export default function AdminRoute() {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasBuilderAccess, setHasBuilderAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user || !isAuthenticated) {
      setHasBuilderAccess(false);
      setAccessChecked(true);
      return () => { cancelled = true; };
    }

    if (user.role === 'creator') {
      setHasBuilderAccess(true);
      setAccessChecked(true);
      return () => { cancelled = true; };
    }

    // مدیر صراف به‌صورت خودکار سازنده سیستم محسوب نمی‌شود.
    // برای کمک‌سازنده، مجوز باید در همین بارگذاری از سرور دریافت شود.
    setAccessChecked(false);
    setHasBuilderAccess(false);
    fetchAndCacheBuilderAccess()
      .then(() => {
        if (!cancelled) {
          setHasBuilderAccess(!!checkBuilderAccess(user));
          setAccessChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasBuilderAccess(false);
          setAccessChecked(true);
        }
      });

    return () => { cancelled = true; };
  }, [user, isAuthenticated]);

  if (isLoadingAuth || !accessChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return <Navigate to="/login" replace state={{ reason: 'offline_admin' }} />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || 'user';

  if (role === 'creator') {
    if (!canAccessRoute(role, location.pathname)) {
      const home = HOME_BY_ROLE[role] || '/';
      return <Navigate to={home} replace />;
    }
    return <Outlet />;
  }

  if (location.pathname.startsWith('/builder') && hasBuilderAccess) {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" replace />;
}
