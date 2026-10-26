import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Store, UserCircle, Bot } from 'lucide-react';
import ContactInfo from '@/components/sarraaf/ContactInfo';
import SarraafLogo from '@/components/SarraafLogo';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n';

const goldStyles = `
  .pgm-btn-outline { color: #e8c875; }
  .pgm-btn-outline:hover { color: #fff1c9; }

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
    font-size: 12px;
    letter-spacing: 4px;
    color: #e8c875;
    margin: 0 0 18px;
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
    margin: 0 0 10px;
    animation: pgm-rise 0.8s 0.08s ease both;
  }
  .pgm-rule {
    height: 1px;
    width: 78px;
    background: linear-gradient(90deg, transparent, #c9a24b, transparent);
    margin: 0 auto 17px;
  }
  .pgm-description {
    font-size: 13px;
    line-height: 1.8;
    color: #d5cfbf;
    max-width: 340px;
    margin: 0 auto 12px;
    animation: pgm-rise 0.8s 0.12s ease both;
  }
  .pgm-secure {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(201,162,75,0.33);
    background: rgba(201,162,75,0.05);
    color: #e8c875;
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 11px;
    margin: 0 auto 20px;
    animation: pgm-rise 0.8s 0.16s ease both;
  }
  .pgm-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: pgm-rise 0.8s 0.2s ease both;
  }
  .pgm-btn {
    box-sizing: border-box;
    min-height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-decoration: none;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s;
  }
  .pgm-btn-primary {
    color: #17140e;
    background: linear-gradient(135deg, #e8c875, #c9a24b);
    box-shadow: 0 7px 22px rgba(201,162,75,0.19);
  }
  .pgm-btn-primary:hover {
    box-shadow: 0 7px 24px rgba(201,162,75,0.21);
    background-color: #edda9a;
  }
  .pgm-btn-outline {
    color: #e8c875;
    border: 1px solid rgba(201,162,75,0.5);
    background: #1a1d26;
  }
  .pgm-btn-outline:hover {
    color: #fff1c9;
    background: #29251d;
  }
  .pgm-btn:active {
    transform: translateY(1px);
  }
  .pgm-btn:focus-visible {
    outline: 2px solid #e8c875;
    outline-offset: 3px;
  }
  .pgm-ambient-1 {
    content: "";
    position: absolute;
    width: 270px;
    height: 270px;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    background: rgba(201,162,75,0.11);
    filter: blur(55px);
    pointer-events: none;
    animation: pgm-ambient 7s ease-in-out infinite alternate;
  }
  .pgm-ambient-2 {
    content: "";
    position: absolute;
    width: 210px;
    height: 210px;
    bottom: 80px;
    right: -80px;
    border-radius: 50%;
    background: rgba(201,162,75,0.07);
    filter: blur(55px);
    pointer-events: none;
    animation: pgm-ambient 7s ease-in-out infinite alternate;
  }
  .pgm-contact {
    width: 100%;
    margin-top: auto;
    padding: 12px 0 10px;
    border-top: 1px solid rgba(201,162,75,0.27);
    border-bottom: 1px solid rgba(201,162,75,0.15);
    box-sizing: border-box;
    animation: pgm-rise 0.8s 0.28s ease both;
  }
  .pgm-footer {
    font-size: 10px;
    line-height: 1.7;
    color: #aaa493;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: center;
    animation: pgm-rise 0.8s 0.32s ease both;
  }
  .pgm-footer .pgm-version {
    font-family: ui-monospace, monospace;
    color: #827d71;
    direction: ltr;
  }
`;

export default function Welcome() {
  const { t, dir } = useLanguage();

  return (
    <div
      dir={dir}
      className="min-h-[100dvh] relative flex flex-col items-center text-center px-4 sm:px-[34px] py-4 sm:py-[30px] safe-area"
      style={{
        background:
          'radial-gradient(ellipse at 50% 25%, #302719 0%, #191a1d 36%, #0f1115 75%)',
        color: '#f4edd8',
      }}
    >
      <style>{goldStyles}</style>

      {/* دکوراسیون محیطی طلایی */}
      <span className="pgm-ambient-1" />
      <span className="pgm-ambient-2" />

      {/* Language selector */}
      <div className="w-full max-w-sm flex justify-start relative z-10 mb-2">
        <LanguageSwitcher variant="dark" />
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center relative z-10 flex-1 min-h-0">
        {/* ابروی خوش‌آمد */}
        <p className="pgm-eyebrow">{t('common.welcome')}</p>

        {/* لوگوی فعلی با هاله طلایی */}
        <div className="pgm-coin-wrap">
          <SarraafLogo size={110} />
        </div>

        <h1 className="pgm-title">{t('welcome.title')}</h1>
        <div className="pgm-rule" />
        <p className="pgm-description">
          {t('welcome.subtitle')}
        </p>

        <div className="pgm-secure">
          <Shield className="w-[15px] h-[15px]" strokeWidth={1.6} />
          {t('welcome.secure_badge')}
        </div>

        <div className="pgm-actions">
          <Link to="/login" className="pgm-btn pgm-btn-primary">
            <ArrowLeft className="w-[18px] h-[18px]" />
            {t('welcome.login')}
          </Link>
          <Link to="/register?tab=sarraaf" className="pgm-btn pgm-btn-outline">
            <Store className="w-[18px] h-[18px]" />
            {t('welcome.register_sarraaf')}
          </Link>
          <Link to="/register?tab=customer" className="pgm-btn pgm-btn-outline">
            <UserCircle className="w-[18px] h-[18px]" />
            {t('welcome.register_customer')}
          </Link>
        </div>
      </div>

      {/* AI assistant entry point: obvious robot icon and clear AI label */}
      <div className="w-full max-w-sm relative z-10 mt-5 mb-5">
        <Link
          to="/assistant"
          aria-label="باز کردن هوش مصنوعی حساب صراف"
          className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-l from-[#29251d] via-[#1a1d26] to-[#25202a] px-4 py-3 text-right shadow-[0_8px_28px_rgba(201,162,75,0.14)] transition duration-200 hover:border-amber-200 hover:shadow-[0_8px_34px_rgba(201,162,75,0.25)] active:scale-[0.99]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[32px] shadow-inner" aria-hidden="true">
            🤖
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="flex items-center gap-2 text-base font-extrabold text-amber-100">
              هوش مصنوعی حساب صراف
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              دستیار هوشمند AI
            </span>
          </span>
          <ArrowLeft className="h-5 w-5 shrink-0 text-amber-200 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      {/* Contact Section */}
      <div className="pgm-contact w-full max-w-sm relative z-10 shrink-0">
        <ContactInfo />
      </div>

      {/* Footer */}
      <div className="pgm-footer w-full max-w-sm relative z-10 shrink-0">
        <p>{t('welcome.copyright')}</p>
        <p className="pgm-version">v1.0.1</p>
      </div>

      <PwaInstallPrompt showInstallPrompt={false} />
    </div>
  );
}