import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GoogleIcon from '@/components/GoogleIcon';
import SarraafLogo from '@/components/SarraafLogo';
import { ArrowLeft, Lock, Loader2, UserCircle, Store, Bot } from 'lucide-react';
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
import { syncDefaultPasswordAlert } from '@/lib/passwordAlert';

const LOGIN_TIMEOUT = 12000;
const MIGRATION_TIMEOUT = 8000;

function waitForLoginResult(promise, timeoutMs, fallback) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

const goldStyles = `
  @keyframes pgm-enter {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .pgm-page {
    min-height: 100svh;
    padding: clamp(16px, 3.5vh, 36px) 16px;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(38, 91, 91, .24), transparent 42%),
      linear-gradient(145deg, #0b1420 0%, #101b29 52%, #0b111b 100%);
    color: #eef3f5;
    font-family: Tahoma, Arial, sans-serif;
  }
  .pgm-shell {
    width: 100%;
    max-width: 440px;
    margin: auto;
    animation: pgm-enter .45s ease both;
  }
  .pgm-eyebrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 12px;
    padding: 6px 13px;
    border: 1px solid rgba(198, 166, 93, .24);
    border-radius: 999px;
    background: rgba(198, 166, 93, .07);
    color: #d8c18b;
    font-size: 11px;
    letter-spacing: .3px;
  }
  .pgm-coin-wrap {
    margin: 0 auto 10px;
    filter: drop-shadow(0 8px 22px rgba(198, 166, 93, .14));
  }
  .pgm-coin-wrap > * { max-width: 64px; max-height: 64px; }
  .pgm-title {
    margin: 0 0 8px;
    color: #f3e6c3;
    font-size: clamp(21px, 5vw, 26px);
    line-height: 1.45;
    font-weight: 800;
    letter-spacing: 0;
  }
  .pgm-ai-entry {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    width: 100%; margin: 0 0 16px; padding: 13px 15px;
    border: 1px solid rgba(77, 190, 174, .32); border-radius: 14px;
    background: linear-gradient(110deg, rgba(13, 148, 136, .17), rgba(27, 55, 65, .42));
    color: #d9f5ef; text-align: right; text-decoration: none;
    transition: .18s ease;
  }
  .pgm-ai-entry:hover { border-color: rgba(103, 220, 200, .58); background: rgba(13,148,136,.22); transform: translateY(-1px); }
  .pgm-ai-icon {
    display: grid; place-items: center; flex: 0 0 38px; height: 38px;
    border: 1px solid rgba(103, 220, 200, .25); border-radius: 11px;
    background: rgba(13, 148, 136, .2); color: #83dfd0;
  }
  .pgm-ai-title { display: block; color: #b7f0e5; font-size: 13px; font-weight: 800; }
  .pgm-ai-caption { display: block; margin-top: 3px; color: #a6b9bd; font-size: 10px; line-height: 1.7; }
  .pgm-ai-arrow { color: #83dfd0; font-size: 18px; }
  .pgm-rule {
    width: 54px;
    height: 2px;
    margin: 0 auto 17px;
    border-radius: 99px;
    background: linear-gradient(90deg, transparent, #c6a65d, transparent);
  }
  .pgm-card {
    padding: clamp(16px, 4vw, 23px);
    border: 1px solid rgba(184, 198, 207, .16);
    border-radius: 20px;
    background: linear-gradient(155deg, rgba(27, 41, 55, .98), rgba(17, 29, 42, .98));
    box-shadow: 0 20px 55px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255,255,255,.035);
    text-align: right;
  }
  .pgm-google-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; min-height: 46px; border-radius: 12px;
    border: 1px solid rgba(213, 224, 231, .2);
    background: rgba(7, 16, 26, .42); color: #edf2f5;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: .18s ease;
  }
  .pgm-google-btn:hover { background: rgba(255,255,255,.07); border-color: rgba(213,224,231,.35); }
  .pgm-google-btn:disabled { opacity: .58; cursor: not-allowed; }
  .pgm-divider {
    position: relative; height: 1px; margin: 21px 0;
    background: rgba(204, 216, 224, .13);
  }
  .pgm-divider-label {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    padding: 0 12px; white-space: nowrap;
    background: #192a3a; color: #9eabb5; font-size: 11px;
  }
  .pgm-tablist {
    display: grid; grid-template-columns: 1fr 1fr; gap: 5px;
    padding: 5px; margin: 0 0 19px;
    border: 1px solid rgba(184, 198, 207, .13);
    border-radius: 13px; background: rgba(5, 14, 24, .42);
  }
  .pgm-tabtrigger {
    min-height: 42px; border-radius: 9px; color: #b9c5cc;
    font-size: 13px; font-weight: 700; transition: .18s ease;
  }
  .pgm-tabtrigger[data-state=active] {
    background: linear-gradient(135deg, #d9c184, #b99850);
    color: #17212b; box-shadow: 0 3px 12px rgba(0,0,0,.16);
  }
  .pgm-label { display: block; margin-bottom: 7px; color: #dce4e8; font-size: 12px; font-weight: 600; }
  .pgm-input {
    width: 100%; height: 46px; border-radius: 11px;
    border: 1px solid rgba(184, 198, 207, .2) !important;
    background: rgba(5, 14, 24, .48) !important;
    color: #f3f6f7 !important; font-size: 13px;
  }
  .pgm-input::placeholder { color: #788995; }
  .pgm-input:focus-visible {
    border-color: #c6a65d !important;
    box-shadow: 0 0 0 3px rgba(198,166,93,.13) !important;
  }
  .pgm-submit {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; min-height: 48px; margin-top: 5px;
    border: 0; border-radius: 12px;
    background: linear-gradient(135deg, #ddc789, #bd9c55);
    color: #17212b; font-size: 14px; font-weight: 800;
    box-shadow: 0 7px 18px rgba(184, 150, 75, .15);
    transition: .18s ease;
  }
  .pgm-submit:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .pgm-submit:disabled { opacity: .58; cursor: not-allowed; }
  .pgm-error { margin: 9px 0; color: #ff9a9a; font-size: 12px; line-height: 1.8; text-align: center; }
  .pgm-google-error {
    margin-bottom: 13px; padding: 11px 13px; border-radius: 11px;
    border: 1px solid rgba(248,113,113,.3); background: rgba(127,29,29,.15);
    text-align: center;
  }
  .pgm-google-error p { margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.7; }
  .pgm-google-error-hint { margin-top: 3px !important; color: #b9a5a5 !important; font-size: 11px !important; }
  .pgm-register-link {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 43px; padding: 9px 17px; border-radius: 11px;
    border: 1px solid rgba(74, 190, 168, .35);
    background: rgba(13, 148, 136, .12); color: #8de0d1;
    font-size: 12px; font-weight: 700; transition: .18s ease;
  }
  .pgm-register-link:hover { background: rgba(13,148,136,.2); }
  .pgm-link { color: #aab7bf; font-size: 12px; transition: color .18s; }
  .pgm-link:hover { color: #e2c987; }
  .pgm-footer { margin-top: 14px; color: #aab7bf; font-size: 11px; line-height: 1.8; text-align: center; }
  .pgm-ambient-1, .pgm-ambient-2 { display: none; }
  @media (max-width: 380px) {
    .pgm-page { padding: 12px 11px 18px; }
    .pgm-coin-wrap > * { max-width: 54px; max-height: 54px; }
    .pgm-title { font-size: 20px; }
    .pgm-card { padding: 14px 12px; border-radius: 16px; }
    .pgm-divider { margin: 17px 0; }
    .pgm-input { height: 43px; }
  }
  @media (min-height: 760px) {
    .pgm-page { justify-content: center; }
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
        // Keep the notice visible until the server confirms access is restored.
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
            syncDefaultPasswordAlert(password, userRole);
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
          syncDefaultPasswordAlert(password, userRole);
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
      // legacy_login does not return is_default_password, so the typed password is checked too.
      syncDefaultPasswordAlert(password, userRole, result.is_default_password === true);
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
          <button type="button" onClick={async () => {
            try {
              const info = await getUserLoginRestrictionStatus();
              setLoginRestrictionInfo(info);
              setRestrictionClockOffset(info?.server_now ? Date.parse(info.server_now) - Date.now() : 0);
              if (!info?.enabled) setLoginRestrictionBlocked(false);
            } catch { /* Keep the notice until the server confirms restoration. */ }
          }} className="mt-5 rounded-xl border border-sky-200/30 px-5 py-2.5 text-sm font-semibold text-sky-100 hover:bg-white/10">
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
      className="pgm-page min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 50% 25%, #302719 0%, #191a1d 36%, #0f1115 75%)',
        color: '#f4edd8',
      }}
    >
      <style>{goldStyles}</style>

      {/* دکوراسیون محیطی طلایی */}
      <span className="pgm-ambient-1" />
      <span className="pgm-ambient-2" />

      <div className="pgm-shell relative z-10 text-center">
        {/* ابروی خوش‌آمد + لوگو + تیتر */}
        <p className="pgm-eyebrow">خوش آمدید</p>
        <div className="pgm-coin-wrap flex justify-center">
          <SarraafLogo size={64} />
        </div>
        <h1 className="pgm-title">ورود به حساب صراف</h1>
        <div className="pgm-rule" />

        {/* دسترسی مستقل به دستیار هوش مصنوعی */}
        <Link to="/assistant" className="pgm-ai-entry" aria-label="ورود به دستیار هوش مصنوعی">
          <span className="flex min-w-0 items-center gap-3">
            <span className="pgm-ai-icon"><Bot className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="pgm-ai-title">دستیار هوش مصنوعی</span>
              <span className="pgm-ai-caption">راهنمای استفاده از حساب صراف، پیش از ورود</span>
            </span>
          </span>
          <span className="pgm-ai-arrow" aria-hidden="true">←</span>
        </Link>

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
          <ContactInfo compact />
        </div>

        {/* لینک‌ها */}
        <div className="mt-5 flex flex-col gap-2 text-xs text-center">
          <Link to="/register" className="pgm-register-link">+ ساخت حساب جدید</Link>
          <Link to="/forgot-password" className="pgm-link">رمز را فراموش کرده‌اید؟</Link>
        </div>

      </div>
    </div>
  );
}