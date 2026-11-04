import { useLocation, Link } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.replace(/^\\/+/, '');

  return (
    <main dir="rtl" lang="fa" className="min-h-screen flex items-center justify-center p-5 bg-slate-950 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-teal-900 bg-slate-900 p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-teal-950 text-3xl font-bold text-amber-300">ح</div>
        <p className="text-sm font-medium text-amber-300">سامانه حسابداری و مدیریت مالی</p>
        <h1 className="mt-3 text-3xl font-bold">این صفحه پیدا نشد</h1>
        <p className="mt-4 leading-8 text-slate-300">
          نشانی درخواستی در حساب صراف موجود نیست یا ممکن است جابه‌جا شده باشد.
        </p>
        {pageName && (
          <p className="mt-3 break-all rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-400">
            مسیر درخواستی: {pageName}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-xl bg-amber-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-200">
            بازگشت به صفحه اصلی
          </Link>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-slate-600 px-6 py-3 font-medium text-slate-200 transition hover:bg-slate-800">
            تلاش دوباره
          </button>
        </div>
        <p className="mt-8 border-t border-slate-700 pt-5 text-xs text-slate-500">حساب صراف · پشتیبانی سامانه</p>
      </section>
    </main>
  );
}
