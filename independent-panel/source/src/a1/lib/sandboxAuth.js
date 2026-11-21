// اتصال احراز هویت نسخهٔ ۲۲ به درگاه امن Supabase.
// کلید publishable فقط کلید عمومی کلاینت است؛ کلید service-role هرگز به مرورگر ارسال نمی‌شود.
export const SANDBOX_TOKEN_KEY = 'hisab_sarraf_v22_sandbox_token';
export const V22_BRIDGE_URL = 'https://tcivyztftnoodobsdxev.supabase.co/functions/v1/v22-sarraf-bridge';
const V22_PUBLISHABLE_KEY = 'sb_publishable_QkTwySOOA9fiUuTRfmAMTQ_WV6JjPS6';

async function callBridge(payload) {
  let response;
  try {
    response = await fetch(V22_BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: V22_PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + V22_PUBLISHABLE_KEY,
      },
      cache: 'no-store',
      body: JSON.stringify(payload),
    });
  } catch {
    const error = new Error('ارتباط با سرویس حساب صراف برقرار نشد. اتصال اینترنت را بررسی کنید.');
    error.code = 'network_error';
    throw error;
  }

  let result;
  try { result = await response.json(); }
  catch {
    const error = new Error('پاسخ سرویس حساب صراف قابل خواندن نیست.');
    error.code = 'invalid_server_response';
    throw error;
  }
  if (!response.ok || result?.success !== true) {
    const messages = {
      invalid_credentials: 'نام کاربری یا رمز عبور نادرست است.',
      too_many_attempts: 'تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
      exchange_profile_unavailable: 'پروندهٔ صرافی این حساب قابل تأیید نیست؛ ورود برای حفاظت از اطلاعات متوقف شد.',
      exchange_access_revoked: 'دسترسی این حساب یا پروندهٔ صرافی غیرفعال شده است.',
      invalid_or_expired_token: 'نشست ورود منقضی شده است؛ دوباره وارد شوید.',
      data_service_unavailable: 'بارگذاری اطلاعات از پایگاه داده انجام نشد.',
      transaction_gateway_not_enabled: 'ثبت اطلاعات تا فعال‌سازی درگاه تراکنش امن در دسترس نیست.',
    };
    const error = new Error(messages[result?.error] || 'درخواست به سرویس حساب صراف ناموفق بود.');
    error.code = result?.error || 'bridge_request_failed';
    throw error;
  }
  return result;
}

export async function sandboxLogin(username, password) {
  return callBridge({ action: 'login', username, password });
}

export async function sandboxVerify(token) {
  return callBridge({ action: 'verify', token });
}

export async function sandboxRead(token) {
  return callBridge({ action: 'snapshot', token });
}
