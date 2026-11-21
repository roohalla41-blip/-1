// ورود نمایشی محیط مستقل نسخهٔ ۲۲
// قرارداد AuthContext برای رابط حفظ شده؛ نشست و دادهٔ ورود واقعی هنوز فعال نیست.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { seedIfEmpty, ensureDemoTransactions, DEMO_ACCOUNTS } from '@/a1/lib/seed';
import { SANDBOX_TOKEN_KEY, sandboxVerify, sandboxRead } from '@/a1/lib/sandboxAuth';
import { setRemoteSnapshot } from '@/a1/lib/v21Session';

const SESSION_KEY = 'hisab_sarraf_v22_session';
const AuthContext = createContext(null);

export const DemoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [seedError, setSeedError] = useState('');
  const [remoteSnapshot, setRemoteSnapshot] = useState(null);
  const authRevisionRef = React.useRef(0);

  useEffect(() => {
    let active = true;
    const authRevision = authRevisionRef.current;

    // آماده‌سازی داده‌های محلی در پس‌زمینه انجام می‌شود و نباید ورود/مسیر پنل را متوقف کند.
    (async () => {
      try {
        await seedIfEmpty();
        await ensureDemoTransactions(10);
      } catch (error) {
        if (active) setSeedError(error?.message || 'بارگذاری دادهٔ آزمایشی ناموفق بود.');
      }
    })();

    // ابتدا فقط نشست را بازیابی و اعتبارسنجی می‌کنیم؛ آماده‌سازی داده‌های نمایشی مستقل است.
    (async () => {
      const revisionAtStart = authRevision;
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw && active) {
          let session = JSON.parse(raw);
          if (session?.is_v22_remote_session || session?.is_sandbox_session) {
            const token = localStorage.getItem(SANDBOX_TOKEN_KEY);
            if (!token) {
              session = null;
            } else {
              try {
                const verified = await sandboxVerify(token);
                if (authRevisionRef.current !== revisionAtStart) return;
                if (verified.user?.role !== 'sarraaf' || verified.user?.status !== 'active' || !verified.exchange?.exchange_code) {
                  session = null;
                } else {
                  const snapshot = await sandboxRead(token);
                  if (authRevisionRef.current !== revisionAtStart) return;
                  setRemoteSnapshot(snapshot);
                  session = {
                    ...session,
                    id: String(verified.user.id),
                    full_name: verified.user.full_name || session.full_name,
                    role: 'sarraaf',
                    status: 'active',
                    exchange_code: verified.exchange.exchange_code,
                    exchange_id: String(verified.exchange.id),
                    exchange_name: verified.exchange.exchange_name || verified.exchange.name,
                    is_v22_remote_session: true,
                    access_mode: 'read_only',
                  };
                }
              } catch (verifyError) {
                if (verifyError?.code !== 'network_error' || session?.is_v22_remote_session) session = null;
              }
            }
            if (!session) {
              localStorage.removeItem(SESSION_KEY);
              localStorage.removeItem(SANDBOX_TOKEN_KEY);
            } else {
              localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
          } else {
            const account = DEMO_ACCOUNTS.find(item => item.username === session?.username);
            if (session?.role === 'customer' && account?.customer_mobile) {
              session = {
                ...session,
                customer_mobile: session.customer_mobile || account.customer_mobile,
                customer_name: session.customer_name || account.customer_name,
              };
              localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
          }
          if (active && authRevisionRef.current === revisionAtStart && session) setUser(session);
        }
      } catch { /* نشست محلی نامعتبر است */ }
      finally {
        if (active && authRevisionRef.current === revisionAtStart) setIsLoadingAuth(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const signIn = useCallback((account) => {
    try { localStorage.removeItem(SANDBOX_TOKEN_KEY); } catch { /* storage optional */ }
    authRevisionRef.current += 1;
    const session = {
      id: account.username,
      username: account.username,
      full_name: account.full_name || account.username,
      role: account.role,
      customer_mobile: account.customer_mobile || null,
      customer_name: account.customer_name || null,
      exchange_code: 'DEMO-EX',
      is_demo_session: true,
    };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* storage optional */ }
    setRemoteSnapshot(null);
    setUser(session);
    setIsLoadingAuth(false);
    return session;
  }, []);

  const signInSandbox = useCallback((session, token, snapshot = null) => {
    authRevisionRef.current += 1;
    try {
      localStorage.setItem(SANDBOX_TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      throw new Error('ذخیرهٔ نشست ورود در این مرورگر ممکن نشد.');
    }
    setRemoteSnapshot(snapshot);
    setUser(session);
    setIsLoadingAuth(false);
    return session;
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    authRevisionRef.current += 1;
    try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(SANDBOX_TOKEN_KEY); } catch { /* storage optional */ }
    setUser(null);
    setRemoteSnapshot(null);
    if (shouldRedirect) window.location.replace('/login');
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    seedError,
    remoteSnapshot,
    accounts: DEMO_ACCOUNTS,
    signIn,
    signInSandbox,
    logout,
    navigateToLogin: () => window.location.replace('/login'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within DemoAuthProvider');
  return context;
};

export const HOME_BY_ROLE = {
  creator: '/builder',
  admin: '/dashboard',
  sarraaf: '/exchanger',
  employee: '/dashboard',
  customer: '/customer',
  user: '/',
};