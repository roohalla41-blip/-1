// a1/pages/LoginOriginal.jsx — صفحهٔ ورود اصلی سورس A1 (پیش‌نمایش ظاهری)
// انتقال مستقیم از reference/A1-extracted-source-temp/src/pages/Login.jsx
// بدون طراحی مجدد و بدون تغییر چیدمان: همان سبک طلایی، همان کارت، همان دو تب و همان لینک‌ها.
// تنها تغییر: وابستگی‌های احراز هویت واقعی (Supabase، ورود محلی، گوگل، وضعیت تعمیرات)
// حذف شده‌اند و هیچ ورود یا اتصال دیتابیسی انجام نمی‌شود.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sandboxLogin, sandboxRead } from '@/a1/lib/sandboxAuth';
import { useAuth } from '@/a1/lib/demoAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GoogleIcon from '@/components/GoogleIcon';
import SarraafLogo from '@/a1/components/SarraafLogo';
import { ArrowLeft, Lock, Loader2, UserCircle, Store, Bot } from 'lucide-react';

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

export default function LoginOriginal() {
  const [tab, setTab] = useState('sarraaf');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const navigate = useNavigate();
  const { signInSandbox } = useAuth();

  // ورود صراف با هویت و پروندهٔ واقعی همان کاربر؛ چیدمان و رفتار فرم حفظ شده است.
  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    if (tab !== 'sarraaf') {
      setError('ورود مشتری در این پیش‌نمایش هنوز فعال نشده است.');
      return;
    }
    if (!identifier.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const result = await sandboxLogin(identifier, password);
      if (result.user?.role !== 'sarraaf' || !result.exchange?.exchange_code) {
        throw new Error('این حساب به پروندهٔ معتبر صرافی متصل نیست.');
      }
      const snapshot = await sandboxRead(result.token);
      const session = {
        id: String(result.user.id),
        username: result.user.username,
        full_name: result.user.full_name || result.user.username,
        role: 'sarraaf',
        status: result.user.status,
        exchange_code: result.exchange.exchange_code,
        exchange_id: String(result.exchange.id),
        exchange_name: result.exchange.exchange_name || result.exchange.name,
        is_v22_remote_session: true,
        access_mode: result.access || 'read_only',
      };
      signInSandbox(session, result.token, snapshot);
      navigate('/exchanger', { replace: true });
    } catch (loginError) {
      setError(loginError?.message || 'ورود انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setGoogleError('ورود با گوگل در این پیش‌نمایش غیرفعال است.');
  };

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

        {/* لینک‌ها */}
        <div className="mt-5 flex flex-col gap-2 text-xs text-center">
          <Link to="/register" className="pgm-register-link">+ ساخت حساب جدید</Link>
          <Link to="/forgot-password" className="pgm-link">رمز را فراموش کرده‌اید؟</Link>
        </div>

      </div>
    </div>
  );
}