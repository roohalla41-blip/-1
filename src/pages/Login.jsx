import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GoogleIcon from '@/components/GoogleIcon';
import SarraafLogo from '@/components/SarraafLogo';
import { ArrowLeft, Lock, Loader2, UserCircle, Store } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { HOME_BY_ROLE } from '@/lib/rbac';
import { directLogin, checkLegacyUser } from '@/lib/directAuth';
import { login as localLogin } from '@/lib/localAuth';
import { tryMigrateLocalUser } from '@/lib/legacyMigration';
import LegacyUserNotice from '@/components/LegacyUserNotice';
import ContactInfo from '@/components/sarraaf/ContactInfo';
import { loginWithProvider, handleGoogleCallback } from '@/lib/googleAuth';
import { getMaintenanceStatus, getUserLoginRestrictionStatus } from '@/lib/maintenance';
import { supabase } from '@/lib/supabaseClient';

const LOGIN_TIMEOUT = 12000;
const MIGRATION_TIMEOUT = 8000;

function waitForLoginResult(promise, timeoutMs, fallback) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

const goldStyles = `
  @keyframes pgm-rise {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pgm-coinglow {
    from { box-shadow: 0 0 0 8px rgba(201,162,75,0.04), 0 0 34px rgba(201,162,75,0.2); }
    to { box-shadow: 0 0 0 8px rgba(201,162,75,0.07), 0 0 55px rgba(232,200,117,0.4); }
  }
  @keyframes pgm-ambient {
    from { opacity: 0.55; transform: scale(0.94); }
    to { opacity: 1; transform: scale(1.08); }
  }
  .pgm-eyebrow {
    font-size: 13px;
    letter-spacing: 4px;
    color: #e8c875;
    margin: 0 0 20px;
    animation: pgm-rise 0.7s ease both;
  }
  .pgm-coin-wrap {
    margin-bottom: 18px;
    animation: pgm-rise 0.8s ease both, pgm-coinglow 4s ease-in-out 1s infinite alternate;
  }
  .pgm-title {
    font-size: 28px;
    line-height: 1.2;
    letter-spacing: 1px;
    color: #e8c875;
    font-weight: 800;
    margin: 0 0 11px;
    animation: pgm-rise 0.8s 0.08s ease both;
  }
  .pgm-rule {
    height: 1px;
    width: 78px;
    background: linear-gradient(90deg, transparent, #c9a24b, transparent);
    margin: 0 auto 18px;
  }
  .pgm-card {
    background: rgba(26,29,38,0.7);
    border: 1px solid rgba(201,162,75,0.25);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    animation: pgm-rise 0.8s 0.16s ease both;
  }
  .pgm-google-btn {
    width: 100%;
    height: 44px;
    border-radius: 11px;
    border: 1px solid rgba(201,162,75,0.4);
    background: #1a1d26;
    color: #e8c875;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: background-color 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s;
  }
  .pgm-google-btn:hover {
    color: #fff1c9;
    background: #29251d;
  }
  .pgm-google-btn:active { transform: translateY(1px); }
  .pgm-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pgm-divider {
    position: relative;
    margin: 16px 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,162,75,0.3), transparent);
  }
  .pgm-divider-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1d26;
    padding: 0 10px;
    font-size: 11px;
    color: #827d71;
  }
  .pgm-tablist {
    background: rgba(15,17,21,0.6);
    border: 1px solid rgba(201,162,75,0.2);
    border-radius: 11px;
    padding: 4px;
    margin-bottom: 16px;
  }
  .pgm-tabtrigger[data-state=active] {
    background: linear-gradient(135deg, #e8c875, #c9a24b);
    color: #17140e;
  }
  .pgm-label {
    color: #d5cfbf;
    font-size: 13px;
  }
  .pgm-input {
    background: rgba(15,17,21,0.6) !important;
    border-color: rgba(201,162,75,0.25) !important;
    color: #f4edd8 !important;
    height: 44px;
  }
  .pgm-input::placeholder { color: #6f6a5c; }
  .pgm-input:focus-visible {
    border-color: #c9a24b !important;
    box-shadow: 0 0 0 2px rgba(201,162,75,0.2) !important;
  }
  .pgm-submit {
    width: 100%;
    height: 48px;
    border-radius: 11px;
    color: #17140e;
    background: linear-gradient(135deg, #e8c875, #c9a24b);
    box-shadow: 0 7px 22px rgba(201,162,75,0.19);
    font-size: 14px;
    font-weight: 700;
    transition: background-color 0.18s, box-shadow 0.18s, transform 0.18s;
  }
  .pgm-submit:hover { background-color: #edda9a; box-shadow: 0 7px 24px rgba(201,162,75,0.21); }
  .pgm-submit:active { transform: translateY(1px); }
  .pgm-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .pgm-error { color: #e57373; font-size: 13px; text-align: center; }
  .pgm-google-error {
    background: rgba(229,115,115,0.1);
    border: 1px solid rgba(229,115,115,0.35);
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 12px;
    text-align: center;
    animation: pgm-rise 0.4s ease both;
  }
  .pgm-google-error p { color: #e57373; font-size: 13px; margin: 0; }
  .pgm-google-error-hint { color: #827d71 !important; font-size: 11px !important; margin-top: 4px !important; }
  .pgm-register-link {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    padding: 10px 18px;
    border-radius: 12px;
    border: 1px solid rgba(45,212,191,0.42);
    background: linear-gradient(135deg, rgba(13,148,136,0.24), rgba(20,184,166,0.12));
    color: #99f6e4;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 5px 18px rgba(13,148,136,0.12);
    transition: background .18s, transform .18s, box-shadow .18s;
  }
  .pgm-register-link:hover {
    background: linear-gradient(135deg, rgba(13,148,136,0.38), rgba(20,184,166,0.22));
    box-shadow: 0 7px 22px rgba(13,148,136,0.2);
  }
  .pgm-register-link:active { transform: translateY(1px); }
  .pgm-link { color: #827d71; transition: color 0.18s; }
  .pgm-link:hover { color: #e8c875; }
  .pgm-link-gold { color: #e8c875; font-weight: 600; transition: color 0.18s; }
  .pgm-link-gold:hover { color: #fff1c9; }
  .pgm-footer {
    font-size: 11px;
    line-height: 1.8;
    color: #aaa493;
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: center;
    animation: pgm-rise 0.8s 0.3s ease both;
  }
  .pgm-footer .pgm-version {
    font-family: ui-monospace, monospace;
    color: #827d71;
    direction: ltr;
  }
  .pgm-ambient-1 {
    position: absolute;
    width: 270px;
    height: 270px;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    background: rgba(201,162,75,0.11);
    filter: blur(55px);
    pointer-events: none;
    animation: pgm-ambient 7s ease-in-out infinite alternate;
  }
  .pgm-ambient-2 {
    position: absolute;
    width: 210px;
    height: 210px;
    bottom: 60px;
    right: -80px;
    border-radius: 50%;
    background: rgba(201,162,75,0.07);
    filter: blur(55px);
    pointer-events: none;
    animation: pgm-ambient 7s ease-in-out infinite alternate;
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState('sarraaf');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [legacyInfo, setLegacyInfo] = useState(null);
  const [maintenanceBlocked, setMaintenanceBlocked] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [maintenanceStatusLoaded, setMaintenanceStatusLoaded] = useState(false);
  const [maintenanceNow, setMaintenanceNow] = useState(Date.now());
  const [maintenanceClockOffset, setMaintenanceClockOffset] = useState(0);
  const [loginRestrictionBlocked, setLoginRestrictionBlocked] = useState(false);
  const [loginRestrictionInfo, setLoginRestrictionInfo] = useState(null);
  const [restrictionNow, setRestrictionNow] = useState(Date.now());
  const [restrictionClockOffset, setRestrictionClockOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMaintenanceStatus().then((info) => {
      if (cancelled) return;
      setMaintenanceInfo(info || { enabled: false });
      setMaintenanceClockOffset(info?.server_now ? Date.parse(info.server_now) - Date.now() : 0);
      setMaintenanceStatusLoaded(true);
    }).catch(() => {
      if (cancelled) return;
      // Fail closed until the server can confirm that maintenance is disabled.
      setMaintenanceInfo({
        enabled: true,
        until: null,
        message: 'وضعیت تعمیرات از سرور قابل دریافت نیست. لطفاً کمی بعد دوباره تلاش کنید.',
      });
      setMaintenanceStatusLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!maintenanceBlocked) return;
    const timer = setInterval(() => setMaintenanceNow(Date.now()), 1000);
    const refreshStatus = async () => {
      try {
        const info = await getMaintenanceStatus();
        setMaintenanceInfo(info || { enabled: false });
        setMaintenanceClockOffset(info?.server_now ? Date.parse(info.server_now) - Date.now() : 0);
        if (!info?.enabled) {
          setMaintenanceBlocked(false);
          setError('');
        }
      } catch { /* Keep the maintenance notice visible until the server confirms it is off. */ }
    };
    const poll = setInterval(refreshStatus, 15000);
    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [maintenanceBlocked]);

  useEffect(() => {
    if (!loginRestrictionBlocked) return;
    const clock = setInterval(() => setRestrictionNow(Date.now()), 1000);
    const refresh = async () => {
      try {
        const info = await getUserLoginRestrictionStatus();
        setLoginRestrictionInfo(info);
        setRestrictionClockOffset(info?.server_now ? Date.parse(info.server_now) - Date.now() : 0);
        if (!info?.enabled) setLoginRestrictionBlocked(false);
      } catch {
        // Keep the notice visible if the server cannot confirm that access is restored.
      }
    };
    const poll = setInterval(refresh, 15000);
    return () => { clearInterval(clock); clearInterval(poll); };
  }, [loginRestrictionBlocked]);

  const restrictionRemainingMs = loginRestrictionInfo?.until
    ? Date.parse(loginRestrictionInfo.until) - (restrictionNow + restrictionClockOffset)
    : null;
  const restrictionRemaining = restrictionRemainingMs === null
    ? 'زمان پایان از سوی مدیر مشخص نشده است؛ لطفاً اطلاعیه را دنبال کنید.'
    : restrictionRemainingMs <= 0
      ? 'زمان اعلام‌شده به پایان رسیده؛ در حال بررسی بازشدن دسترسی از سرور هستیم.'
      : (() => {
          const totalMinutes = Math.ceil(restrictionRemainingMs / 60000);
          const days = Math.floor(totalMinutes / 1440);
          const hours = Math.floor((totalMinutes % 1440) / 60);
          const minutes = totalMinutes % 60;
          return [days ? `${days} روز` : '', hours ? `${hours} ساعت` : '', minutes ? `${minutes} دقیقه` : ''].filter(Boolean).join(' و ');
        })();

  const maintenanceRemainingMs = maintenanceInfo?.until
    ? Date.parse(maintenanceInfo.until) - (maintenanceNow + maintenanceClockOffset)
    : null;
  const maintenanceRemaining = maintenanceRemainingMs === null
    ? 'تا خاموش‌کردن دستی فعال می‌ماند'
    : maintenanceRemainingMs <= 0
      ? 'زمان تعمیرات به پایان رسیده است؛ صفحه را تازه‌سازی کنید.'
      : (() => {
          const minutes = Math.ceil(maintenanceRemainingMs / 60000);
          const days = Math.floor(minutes / 1440);
          const hours = Math.floor((minutes % 1440) / 60);
          const mins = minutes % 60;
          return [days ? `${days} روز` : '', hours ? `${hours} ساعت` : '', mins ? `${mins} دقیقه` : ''].filter(Boolean).join(' و ');
        })();

  // Legacy exchanges: once the typed username is recognised, show the update notice
  useEffect(() => {
    const id = identifier.trim();
    if (id.length < 3) {
      setLegacyInfo(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await checkLegacyUser(id);
      if (!cancelled) setLegacyInfo(res.legacy ? res : null);
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [identifier]);

  useEffect(() => {
    if (isLoadingAuth || !isAuthenticated || !user || !maintenanceStatusLoaded) return;
    if (user.role === 'creator') {
      navigate('/builder', { replace: true });
      return;
    }
    if (maintenanceInfo?.enabled) {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } catch { /* storage may be unavailable */ }
      setMaintenanceBlocked(true);
      return;
    }
    window.location.replace(HOME_BY_ROLE[user.role] || '/');
  }, [isAuthenticated, user, isLoadingAuth, maintenanceStatusLoaded, maintenanceInfo, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      let result = await waitForLoginResult(
        directLogin(identifier, password),
        LOGIN_TIMEOUT,
        { success: false, error: 'login_timeout' }
      );
      if (result?.error === 'login_timeout') {
        console.error('[auth-diagnostic]', { stage: 'legacy_login_rpc', code: 'timeout', at: new Date().toISOString() });
        setError('سرویس ورود در ۱۲ ثانیه پاسخ نداد. اتصال اینترنت و سرویس Supabase را بررسی کنید؛ دوباره تلاش کنید.');
        return;
      }

      // ── اگر ورود Supabase ناموفق بود و کاربر یافت نشد (یا دیتابیس در دسترس نبود)،
      //    ورود محلی را امتحان کن — سپس مهاجرت بی‌صدا به Supabase ──
      if (!result.success && (result.error === 'user_not_found' || result.error === 'rpc_error' || result.error === 'empty_response')) {
        const localResult = localLogin(identifier, password);
        if (localResult.success) {
          // Enforce the server-owned second restriction for local/offline fallback too.
          try {
            const { data: restriction, error: restrictionError } = await supabase.rpc('get_user_login_restriction');
            if (restrictionError) throw restrictionError;
            if (restriction?.enabled && localResult.user?.role !== 'creator') {
              setLoginRestrictionInfo(restriction);
              setRestrictionClockOffset(restriction.server_now ? Date.parse(restriction.server_now) - Date.now() : 0);
              setLoginRestrictionBlocked(true);
              return;
            }
          } catch (restrictionError) {
            setError('وضعیت مجوز ورود از سرور تأیید نشد؛ برای حفاظت از حساب، ورود محلی انجام نشد.');
            return;
          }
          // مهاجرت بی‌صدا کاربر محلی به Supabase
          let migrateResult = null;
          try {
            migrateResult = await waitForLoginResult(
              tryMigrateLocalUser(localResult.user, password),
              MIGRATION_TIMEOUT,
              { migrated: false, reason: 'timeout' }
            );
            if (migrateResult?.reason === 'timeout') {
              console.warn('[auth-diagnostic]', { stage: 'local_user_migration', code: 'timeout', at: new Date().toISOString() });
            }
          } catch { /* بی‌صدا — ورود مسدود نمی‌شود */ }

          if (migrateResult && migrateResult.migrated && migrateResult.token) {
            // مهاجرت موفق بود — از توکن Supabase استفاده کن
            localStorage.setItem('auth_token', migrateResult.token);
            const migratedUser = migrateResult.user || localResult.user;
            if (migratedUser && migratedUser.role !== 'creator') {
              localStorage.setItem('auth_user', JSON.stringify(migratedUser));
            }
            const userRole = migratedUser?.role;
            if (userRole !== 'creator' && maintenanceInfo?.enabled !== false) {
              try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch { /* ignore storage errors */ }
              setMaintenanceBlocked(true);
              setLoading(false);
              return;
            }
            if (password === '12345678' && (userRole === 'exchange' || userRole === 'sarraaf')) {
              localStorage.setItem('default_password_alert', '1');
            } else {
              localStorage.removeItem('default_password_alert');
            }
            if (tab === 'customer' && userRole !== 'customer') {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              setError('این حساب صرافی است. لطفاً از تب صراف وارد شوید.');
              setLoading(false);
              return;
            }
            if (tab === 'sarraaf' && !['creator', 'admin', 'sarraaf', 'employee', 'exchange'].includes(userRole)) {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              setError('این حساب مشتری است. لطفاً از تب مشتری وارد شوید.');
              setLoading(false);
              return;
            }
            window.location.replace(HOME_BY_ROLE[userRole] || '/');
            return;
          }

          // مهاجرت ناموفق بود — از ورود محلی استفاده کن
          localStorage.setItem('auth_token', localResult.token || `local_token_${Date.now()}`);
          if (localResult.user && localResult.user.role !== 'creator') {
            localStorage.setItem('auth_user', JSON.stringify(localResult.user));
          }
          const userRole = localResult.user?.role;
          if (userRole !== 'creator' && maintenanceInfo?.enabled !== false) {
            try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch { /* ignore storage errors */ }
            setMaintenanceBlocked(true);
            setLoading(false);
            return;
          }
          if (password === '12345678' && (userRole === 'exchange' || userRole === 'sarraaf')) {
            localStorage.setItem('default_password_alert', '1');
          } else {
            localStorage.removeItem('default_password_alert');
          }
          if (tab === 'customer' && userRole !== 'customer') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setError('این حساب صرافی است. لطفاً از تب صراف وارد شوید.');
            setLoading(false);
            return;
          }
          if (tab === 'sarraaf' && !['creator', 'admin', 'sarraaf', 'employee', 'exchange'].includes(userRole)) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setError('این حساب مشتری است. لطفاً از تب مشتری وارد شوید.');
            setLoading(false);
            return;
          }
          window.location.replace(HOME_BY_ROLE[userRole] || '/');
          return;
        }
      }

      if (!result.success) {
        if (result.error === 'maintenance_mode') {
          setMaintenanceInfo({
            enabled: true,
            until: result.maintenance_until || null,
            message: result.maintenance_message || '',
            server_now: result.server_now || null,
          });
          if (result.server_now) setMaintenanceClockOffset(Date.parse(result.server_now) - Date.now());
          setMaintenanceBlocked(true);
          return;
        }
        if (result.error === 'user_login_restricted') {
          setLoginRestrictionInfo({
            enabled: true,
            until: result.restriction_until || null,
            message: result.restriction_message || 'برای به‌روزرسانی و بهبود خدمات، ورود کاربران صراف و مشتری موقتاً متوقف شده است.',
            server_now: result.server_now || null,
          });
          if (result.server_now) setRestrictionClockOffset(Date.parse(result.server_now) - Date.now());
          setLoginRestrictionBlocked(true);
          return;
        }
        const msgs = {
          user_not_found: 'کاربر یافت نشد',
          wrong_password: 'رمز عبور اشتباه است',
          user_inactive: 'حساب کاربری غیرفعال است',
          too_many_attempts: 'تلاش‌های ناموفق زیاد. لطفاً ۱۵ دقیقه صبر کنید',
          auth_signin_failed: 'خطا در ورود. لطفاً دوباره تلاش کنید',
          rpc_error: 'خطا در ارتباط با دیتابیس. اسکریپت supabase-app-token-auth.sql را در Supabase اجرا کنید',
          rpc_not_available: 'توابع ورود هنوز در دیتابیس فعال نشده‌اند. اسکریپت supabase-app-token-auth.sql را در Supabase اجرا کنید',
          wrong_password_or_user_not_found: 'رمز عبور اشتباه است یا حساب یافت نشد',
          profile_not_found: 'پروفایل کاربری یافت نشد. لطفاً فایل supabase-login-fix.sql را در Supabase اجرا کنید',
        };
        if (result.error === 'rpc_error') {
          const detail = String(result.message || '');
          const missingLoginRpc = /PGRST202|42883|could not find the function|function .* does not exist|permission denied for function/i.test(detail);
          console.error('[auth] Supabase legacy_login RPC failed:', detail);
          setError(missingLoginRpc
            ? 'تابع ورود در Supabase پیدا نشد یا مجوز اجرای آن موجود نیست. فایل public_supabase-app-token-auth.sql باید در SQL Editor اجرا شود.'
            : 'سرویس ورود دیتابیس خطا داد. اتصال Supabase یا مجوز تابع ورود نیاز به بررسی دارد؛ تنظیمات حساب شما تغییر نکرده است.');
          return;
        }
        setError(msgs[result.error] || 'خطا در ورود');
        return;
      }

      // ورود Supabase موفق بود — رمز توسط directLogin به‌صورت بی‌صدا مهاجرت می‌شود
      localStorage.setItem('auth_token', result.token);
      if (result.user && result.user.role !== 'creator') {
        localStorage.setItem('auth_user', JSON.stringify(result.user));
      }
      const userRole = result.user?.role;
      if (result.is_default_password && (userRole === 'exchange' || userRole === 'sarraaf')) {
        localStorage.setItem('default_password_alert', '1');
      } else {
        localStorage.removeItem('default_password_alert');
      }
      const finalRole = result.user?.role;
      if (tab === 'customer' && finalRole !== 'customer') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setError('این حساب صرافی است. لطفاً از تب صراف وارد شوید.');
        setLoading(false);
        return;
      }
      if (tab === 'sarraaf' && !['creator', 'admin', 'sarraaf', 'employee'].includes(finalRole)) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setError('این حساب مشتری است. لطفاً از تب مشتری وارد شوید.');
        setLoading(false);
        return;
      }
      window.location.replace(HOME_BY_ROLE[result.user.role] || '/');
    } catch (err) {
      setError(err.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    // Cooldown: prevent rapid retries (e.g. in WebView)
    const last = localStorage.getItem('google_attempt_ts');
    const now = Date.now();
    if (last && now - Number(last) < 5000) {
      setGoogleLoading(false);
      setGoogleError('لطفاً چند ثانیه صبر کنید و دوباره تلاش کنید');
      return;
    }
    localStorage.setItem('google_attempt_ts', String(now));
    const result = await loginWithProvider('/');
    if (!result.ok) {
      setGoogleLoading(false);
      const msgs = {
        provider_disabled: 'ورود با گوگل فعال نیست. لطفاً با نام کاربری و رمز وارد شوید.',
        state_mismatch: 'نشست گوگل نامعتبر است. لطفاً با نام کاربری و رمز وارد شوید.',
        network_error: 'خطای شبکه در اتصال به گوگل. اتصال اینترنت را بررسی کنید.',
        unknown: 'ورود با گوگل ناموفق بود. لطفاً با نام کاربری و رمز وارد شوید.',
      };
      setGoogleError(msgs[result.error] || msgs.unknown);
    }
    // If ok, the browser will redirect to Google — keep loading state
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_cb') !== '1') return;
    // Clear any stale OAuth error params from URL
    if (urlParams.get('error')) {
      urlParams.delete('error');
      urlParams.delete('error_description');
      urlParams.delete('error_code');
      window.history.replaceState({}, '', window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : ''));
    }
    handleGoogleCallback().then(async (result) => {
      if (result?.linked && result?.user) {
        window.history.replaceState({}, '', '/login');
        if (result.user.role === 'creator') {
          window.location.replace('/builder');
          return;
        }
        let currentMaintenance = maintenanceInfo;
        try {
          currentMaintenance = await getMaintenanceStatus();
          setMaintenanceInfo(currentMaintenance);
          setMaintenanceClockOffset(currentMaintenance?.server_now ? Date.parse(currentMaintenance.server_now) - Date.now() : 0);
          setMaintenanceStatusLoaded(true);
        } catch {
          currentMaintenance = { enabled: true };
        }
        if (currentMaintenance?.enabled) {
          try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch { /* ignore storage errors */ }
          setMaintenanceBlocked(true);
          setGoogleLoading(false);
          return;
        }
        try {
          const { data: restriction, error: restrictionError } = await supabase.rpc('get_user_login_restriction');
          if (restrictionError) throw restrictionError;
          if (restriction?.enabled) {
            try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch { /* ignore storage errors */ }
            setLoginRestrictionInfo(restriction);
            setRestrictionClockOffset(restriction.server_now ? Date.parse(restriction.server_now) - Date.now() : 0);
            setLoginRestrictionBlocked(true);
            setGoogleLoading(false);
            return;
          }
        } catch {
          try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch { /* ignore storage errors */ }
          setGoogleError('وضعیت مجوز ورود از سرور تأیید نشد؛ لطفاً از روش ورود با نام کاربری استفاده کنید.');
          setGoogleLoading(false);
          return;
        }
        window.location.replace(HOME_BY_ROLE[result.user.role] || '/');
      } else if (result?.error === 'user_not_found' && result.google_email) {
        const params = new URLSearchParams({ tab: 'google', email: result.google_email });
        if (result.google_name) params.set('name', result.google_name);
        navigate(`/register?${params.toString()}`, { replace: true });
      } else {
        setGoogleLoading(false);
        const msgs = {
          provider_disabled: 'ورود با گوگل فعال نیست. لطفاً با نام کاربری و رمز وارد شوید.',
          state_mismatch: 'نشست گوگل نامعتبر است. لطفاً با نام کاربری و رمز وارد شوید.',
          oauth_redirect_error: 'ورود با گوگل ناموفق بود. لطفاً با نام کاربری و رمز وارد شوید.',
        };
        setGoogleError(msgs[result?.error] || 'ورود با گوگل ناموفق بود');
      }
    });
  }, []);

  if (loginRestrictionBlocked) {
    return (
      <main dir="rtl" lang="fa" className="min-h-screen flex items-center justify-center px-5 py-10 text-center" style={{ background: 'linear-gradient(145deg,#101827,#18364a)', color: '#f8fafc', fontFamily: 'Tahoma,Arial,sans-serif' }}>
        <section className="w-full max-w-lg rounded-3xl border border-sky-200/20 bg-white/5 p-8 shadow-2xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-sky-400/15 text-3xl text-sky-200">↻</div>
          <p className="mb-3 text-sm tracking-widest text-sky-200">حساب صراف</p>
          <h1 className="mb-4 text-2xl font-extrabold leading-relaxed">برنامه در حال به‌روزرسانی است</h1>
          <p className="leading-8 text-slate-200">{loginRestrictionInfo?.message || 'برای بهبود خدمات، ورود کاربران صراف و مشتری موقتاً متوقف شده است.'}</p>
          <div className="mt-5 rounded-2xl border border-sky-200/15 bg-black/15 p-4">
            <p className="text-sm font-semibold text-sky-100">زمان باقی‌مانده تا پایان به‌روزرسانی</p>
            <p className="mt-2 text-lg font-bold text-amber-100">{restrictionRemaining}</p>
            {loginRestrictionInfo?.until && (
              <p className="mt-2 text-xs text-slate-300">زمان پایان: {new Date(loginRestrictionInfo.until).toLocaleString('fa-IR')}</p>
            )}
          </div>
          <p className="mt-4 leading-7 text-emerald-100">حساب‌ها، موجودی‌ها و سوابق مالی شما محفوظ هستند.</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">پس از پایان به‌روزرسانی، دسترسی دوباره از طرف سرور بررسی می‌شود.</p>
          <button
            type="button"
            onClick={async () => {
              try {
                const info = await getUserLoginRestrictionStatus();
                setLoginRestrictionInfo(info);
                setRestrictionClockOffset(info?.server_now ? Date.parse(info.server_now) - Date.now() : 0);
                if (!info?.enabled) setLoginRestrictionBlocked(false);
              } catch {
                // Keep the notice in place until the server confirms restoration.
              }
            }}
            className="mt-5 rounded-xl border border-sky-200/30 px-5 py-2.5 text-sm font-semibold text-sky-100 hover:bg-white/10"
          >
            بررسی دوباره وضعیت
          </button>
        </section>
      </main>
    );
  }

  if (maintenanceBlocked) {
    return (
      <main dir="rtl" lang="fa" className="min-h-screen flex items-center justify-center px-5 py-10 text-center" style={{background:'linear-gradient(145deg,#0b1720,#123b3a)',color:'#f8fafc',fontFamily:'Tahoma,Arial,sans-serif'}}>
        <section className="w-full max-w-lg rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-teal-400/15 text-3xl text-teal-200">↻</div>
          <p className="mb-3 text-sm tracking-widest text-teal-200">حساب صراف</p>
          <h1 className="mb-4 text-2xl font-extrabold leading-relaxed">برنامه در حال تعمیرات است</h1>
          <p className="leading-8 text-slate-200">{maintenanceInfo?.message || 'برای بهبود خدمات و ارتقای سیستم، دسترسی عمومی به‌صورت موقت متوقف شده است.'}</p>
          {maintenanceInfo?.until ? (
            <p className="mt-3 leading-8 text-amber-100">زمان باقی‌مانده: {maintenanceRemaining}</p>
          ) : (
            <p className="mt-3 leading-8 text-amber-100">{maintenanceRemaining}</p>
          )}
          <p className="mt-3 leading-8 text-emerald-100">اطلاعات حساب‌ها و سوابق مالی شما در این مرحله تغییر داده نمی‌شود.</p>
          <p className="mt-3 leading-8 text-slate-300">پس از پایان زمان اعلام‌شده، دوباره تلاش کنید.</p>
          <button
            type="button"
            onClick={async () => {
              try {
                const info = await getMaintenanceStatus();
                setMaintenanceInfo(info);
                setMaintenanceClockOffset(info?.server_now ? Date.parse(info.server_now) - Date.now() : 0);
                if (!info?.enabled) {
                  setMaintenanceBlocked(false);
                  setError('');
                }
              } catch {
                setError('بررسی دوباره وضعیت سرور ناموفق بود؛ لطفاً کمی بعد تلاش کنید.');
              }
            }}
            className="mt-5 rounded-xl border border-teal-200/30 px-5 py-2 text-sm font-semibold text-teal-100"
          >
            بررسی دوباره وضعیت و ورود
          </button>
        </section>
      </main>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center justify-start px-4 py-8"
      style={{
        background: 'radial-gradient(ellipse at 50% 25%, #302719 0%, #191a1d 36%, #0f1115 75%)',
        color: '#f4edd8',
      }}
    >
      <style>{goldStyles}</style>

      {/* دکوراسیون محیطی طلایی */}
      <span className="pgm-ambient-1" />
      <span className="pgm-ambient-2" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* ابروی خوش‌آمد + لوگو + تیتر */}
        <p className="pgm-eyebrow">خوش آمدید</p>
        <div className="pgm-coin-wrap flex justify-center">
          <SarraafLogo size={80} />
        </div>
        <h1 className="pgm-title">ورود به حساب صراف</h1>
        <div className="pgm-rule" />

        {/* اعلان صراف‌های قدیمی */}
        <LegacyUserNotice info={legacyInfo} />

        {/* کارت ورود */}
        <div className="pgm-card">
          {/* بنر خطای گوگل */}
          {googleError && (
            <div className="pgm-google-error" role="alert">
              <p>{googleError}</p>
              <p className="pgm-google-error-hint">برای ورود، از فرم زیر با نام کاربری و رمز استفاده کنید.</p>
            </div>
          )}

          {/* دکمه گوگل */}
          <button
            type="button"
            className="pgm-google-btn"
            disabled={googleLoading}
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? 'در حال انتقال...' : 'ورود با گوگل'}
          </button>

          {/* جداکننده */}
          <div className="pgm-divider">
            <span className="pgm-divider-label">یا ورود با نام کاربری</span>
          </div>

          {/* تب‌ها */}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="pgm-tablist grid w-full grid-cols-2">
              <TabsTrigger value="sarraaf" className="pgm-tabtrigger">
                <Store className="w-4 h-4 ml-1" />
                صراف
              </TabsTrigger>
              <TabsTrigger value="customer" className="pgm-tabtrigger">
                <UserCircle className="w-4 h-4 ml-1" />
                مشتری
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sarraaf">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="text-right">
                  <Label className="pgm-label">نام کاربری، موبایل یا ایمیل</Label>
                  <Input
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="نام کاربری / موبایل / ایمیل"
                    className="pgm-input mt-1"
                    required
                  />
                </div>
                <div className="text-right">
                  <Label className="pgm-label">رمز عبور</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#827d71' }} />
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="رمز عبور"
                      className="pgm-input pr-9"
                      required
                    />
                  </div>
                </div>
                {error && <p className="pgm-error">{error}</p>}
                <Button type="submit" className="pgm-submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
                  {loading ? 'در حال ورود...' : 'ورود صراف'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="customer">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="text-right">
                  <Label className="pgm-label">نام کاربری، موبایل یا ایمیل</Label>
                  <Input
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="نام کاربری / موبایل / ایمیل"
                    className="pgm-input mt-1"
                    required
                  />
                </div>
                <div className="text-right">
                  <Label className="pgm-label">رمز عبور</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#827d71' }} />
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="رمز عبور"
                      className="pgm-input pr-9"
                      required
                    />
                  </div>
                </div>
                {error && <p className="pgm-error">{error}</p>}
                <Button type="submit" className="pgm-submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
                  {loading ? 'در حال ورود...' : 'ورود مشتری'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* راه‌های ارتباطی پیش از ورود */}
        <div className="mt-5">
          <ContactInfo />
        </div>

        {/* لینک‌ها */}
        <div className="mt-5 flex flex-col gap-2 text-xs text-center">
          <Link to="/register" className="pgm-register-link">+ ساخت حساب جدید</Link>
          <Link to="/forgot-password" className="pgm-link">رمز را فراموش کرده‌اید؟</Link>
        </div>

        {/* فوتر */}
        <div className="pgm-footer">
          <p className="pgm-version">v1.0.1</p>
        </div>
      </div>
    </div>
  );
}