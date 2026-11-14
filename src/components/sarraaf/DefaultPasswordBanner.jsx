import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import {
  DEFAULT_PASSWORD_ALERT_EVENT,
  readDefaultPasswordAlert,
} from '@/lib/passwordAlert';

// هشدار رمز پیش‌فرض برای صراف و مشتری. خود رمز هرگز نمایش داده نمی‌شود.
const CHANGE_PASSWORD_ROUTE = {
  exchange: '/settings',
  sarraaf: '/settings',
  customer: '/customer/profile',
};

function readInfo() {
  if (typeof window === 'undefined') return null;
  return readDefaultPasswordAlert(window.localStorage);
}

export default function DefaultPasswordBanner({ className = 'mb-3' }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [info, setInfo] = useState(readInfo);

  useEffect(() => {
    const refresh = () => setInfo(readInfo());
    window.addEventListener(DEFAULT_PASSWORD_ALERT_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DEFAULT_PASSWORD_ALERT_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (dismissed || !info) return null;

  return (
    <div
      role="alert"
      className={`${className} rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 flex items-start gap-3`}
    >
      <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-200 dark:bg-amber-900 flex items-center justify-center">
        <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">رمز عبور شما همان رمز پیش‌فرض است</p>
        <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
          برای حفظ امنیت حساب و اطلاعات مالی خود، همین حالا یک رمز عبور جدید و غیرتکراری انتخاب کنید.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => navigate(CHANGE_PASSWORD_ROUTE[info.role] || '/settings')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
          >
            تغییر رمز عبور
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 rounded-lg text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-medium transition-colors"
          >
            بعداً
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label="بستن"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-700 dark:text-amber-300 hover:text-amber-900"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
