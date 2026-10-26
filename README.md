# حساب صراف — بازسازی آزمایشی

این شاخه برای مرتب‌سازی ساختار و آزمون بیلد ساخته شده است؛ شاخه اصلی دست‌نخورده می‌ماند.

- این نسخه نباید به دیتابیس واقعی وصل شود. فقط از پروژه Supabase آزمایشی جداگانه استفاده کنید.
- کلید service-role، رمزها و اطلاعات واقعی کاربران را در مخزن قرار ندهید.
- فایل‌های SQL صرفاً نگهداری شده‌اند و خودکار اجرا نمی‌شوند.
- وابستگی‌های Base44 باید پس از موفقیت بیلد، مسیر به مسیر بررسی و جایگزین شوند؛ این مرحله به‌تنهایی حذف کامل Base44 نیست.
- فایل‌های پشتیبان SQL/PDF از این شاخه آزمایشی کپی نشده‌اند.

## اجرا
`npm install` سپس `npm run build`


## Preview deployment audit — 2026-10-26
The public preview source was updated on `preview/live-supabase-pages` with guarded status labels and a safe contact-settings fallback. This commit requests a fresh verified Pages build; it does not modify Supabase data.
