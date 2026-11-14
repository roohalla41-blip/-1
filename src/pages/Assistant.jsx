import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Loader2, AlertCircle, Bot, Mic, MicOff, Volume2, VolumeX,
  ArrowRight, BookOpen, UserPlus, LogIn, Users, ArrowLeftRight,
  Wallet, Landmark, Coins, ChartNoAxesCombined, ClipboardList,
  Headphones, Smartphone, Eye, ShieldCheck, Sparkles, ChevronLeft,
  CircleHelp, X, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { speakPersian, stopPersianSpeech } from '@/lib/persianPiperTTS';
import {
  sendAssistantMessage,
  loadHistory,
  saveHistory,
  MODEL_STATUS,
} from '@/lib/aiChat';

const WELCOME_TEXT =
  'سلام! من دستیار تخصصی حساب صراف هستم. می‌توانم کاربرد آیکون‌ها و دکمه‌ها را توضیح بدهم، مراحل ورود و ثبت‌نام را راهنمایی کنم و برای کارهای روزمره صرافی چک‌لیست و پیش‌نمایش آموزشی بسازم. به اطلاعات پنل سازنده یا حساب‌های مالی دسترسی ندارم و هیچ عملیات مالی را به‌جای شما ثبت نمی‌کنم.';

const GUIDE_GROUPS = [
  {
    title: 'شروع و دسترسی',
    items: [
      { id: 'register', title: 'ثبت‌نام صراف', subtitle: 'راهنمای ساخت حساب صرافی', icon: UserPlus, prompt: 'مراحل ثبت‌نام صراف در حساب صراف را قدم‌به‌قدم راهنمایی کن.' },
      { id: 'login', title: 'ورود به حساب', subtitle: 'انتخاب ورود صراف یا مشتری', icon: LogIn, prompt: 'برای ورود به حساب صراف یا مشتری چه مراحلی را انجام بدهم؟' },
      { id: 'customers', title: 'مدیریت مشتریان', subtitle: 'شناخت بخش مشتریان', icon: Users, prompt: 'آیکون مشتریان چه کاربردی دارد و روند معمول کار با آن چیست؟' },
    ],
  },
  {
    title: 'عملیات روزمره صرافی',
    items: [
      { id: 'transfers', title: 'حواله و انتقال', subtitle: 'راهنمای مراحل و بررسی اطلاعات', icon: ArrowLeftRight, prompt: 'برای انجام و بررسی یک حواله، چه مواردی را باید مرحله‌به‌مرحله کنترل کنم؟' },
      { id: 'cash', title: 'صندوق و دریافت‌وپرداخت', subtitle: 'کار با عملیات صندوق', icon: Wallet, prompt: 'بخش صندوق برای چه کاری است و قبل از ثبت دریافت یا پرداخت چه چیزهایی را بررسی کنم؟' },
      { id: 'bank', title: 'بانک', subtitle: 'راهنمای بخش بانکی', icon: Landmark, prompt: 'آیکون بانک در حساب صراف چه کاربردی دارد؟' },
      { id: 'currencies', title: 'ارز و نرخ', subtitle: 'شناخت ارزها و نرخ‌ها', icon: Coins, prompt: 'بخش ارز و نرخ چه کاربردی دارد و هنگام کار با نرخ چه نکاتی را بررسی کنم؟' },
      { id: 'reports', title: 'گزارش‌ها', subtitle: 'مرور گزارش و گردش کار', icon: ChartNoAxesCombined, prompt: 'از بخش گزارش‌ها برای پیگیری کارهای روزانه چگونه استفاده کنم؟' },
      { id: 'ledger', title: 'دفترها و اسناد', subtitle: 'آشنایی با دفتر روزنامه و کل', icon: ClipboardList, prompt: 'دفتر روزنامه و دفتر کل چه تفاوتی دارند؟ ساده و کاربردی توضیح بده.' },
    ],
  },
  {
    title: 'خدمات و پشتیبانی',
    items: [
      { id: 'services', title: 'خدمات آنلاین', subtitle: 'شارژ، بسته و خدمات دیگر', icon: Smartphone, prompt: 'بخش خدمات آنلاین چه کاربردی دارد و چگونه وضعیت یک قابلیت را بررسی کنم؟' },
      { id: 'support', title: 'پشتیبانی', subtitle: 'گزارش خطا و دریافت راهنمایی', icon: Headphones, prompt: 'اگر در حساب صراف با خطا روبه‌رو شدم، چطور مشکل را درست گزارش کنم؟' },
    ],
  },
];

const QUICK_PROMPTS = [
  'امروز برای شروع کار صرافی چه مراحلی را بررسی کنم؟',
  'یک مشتری جدید را چطور ثبت کنم؟',
  'قبل از ثبت حواله چه مواردی را کنترل کنم؟',
  'این آیکون یا دکمه چه کاری انجام می‌دهد؟',
];

const GUIDE_DETAILS = {
  register: {
    heading: 'راهنمای ثبت‌نام صراف',
    steps: ['در صفحه ورود، گزینه ساخت حساب جدید را انتخاب کنید.', 'نوع حساب و اطلاعاتی را که فرم درخواست می‌کند با دقت وارد کنید.', 'اطلاعات را بازبینی کنید و فقط از طریق دکمه خود صفحه ادامه دهید.', 'اگر پیام خطا دیدید، متن خطا را بدون رمز یا کد محرمانه برای راهنمایی نگه دارید.'],
    note: 'این راهنما عمومی است؛ فیلدها و شرایط نهایی را همان فرم ثبت‌نام مشخص می‌کند.',
  },
  login: {
    heading: 'راهنمای ورود',
    steps: ['نوع ورود درست را انتخاب کنید: صراف یا مشتری.', 'نام کاربری، شماره موبایل یا ایمیل و رمز را در فرم مربوط وارد کنید.', 'اگر ورود انجام نشد، متن خطا را بخوانید و از گزینه بازیابی رمز استفاده کنید.', 'رمز و کد ورود را در گفتگو با هیچ‌کس به اشتراک نگذارید.'],
    note: 'انتخاب نوع حساب اهمیت دارد؛ حساب مشتری و حساب صراف مسیرهای جداگانه دارند.',
  },
  customers: {
    heading: 'راهنمای بخش مشتریان',
    steps: ['از منوی پنل صراف، بخش مشتریان را پیدا کنید.', 'برای یافتن یا افزودن مشتری، از ابزارهای همان صفحه استفاده کنید.', 'پیش از ذخیره، نام و اطلاعات واردشده را بازبینی کنید.', 'برای مشاهده جزئیات، فقط حساب و مشتری مجاز در شعبه خود را انتخاب کنید.'],
    note: 'این پیش‌نمایش آموزشی است؛ هیچ مشتری واقعی جست‌وجو یا ثبت نمی‌شود.',
  },
  transfers: {
    heading: 'چک‌لیست حواله و انتقال',
    steps: ['نوع حواله یا جهت انتقال را مشخص کنید.', 'مشخصات فرستنده، گیرنده، ارز و مبلغ را با مدارک خود تطبیق دهید.', 'کارمزد، نرخ و جمع نهایی را پیش از تأیید بررسی کنید.', 'فقط پس از اطمینان، عملیات را در صفحه اصلی خودتان ثبت کنید.'],
    note: 'دستیار حواله ایجاد یا تأیید نمی‌کند و به تراکنش‌های واقعی دسترسی ندارد.',
  },
  cash: {
    heading: 'چک‌لیست صندوق',
    steps: ['صندوق و ارز موردنظر را در صفحه مربوط انتخاب کنید.', 'نوع عملیات، دریافت یا پرداخت، را مشخص کنید.', 'مبلغ و شرح را با رسید یا مدرک تطبیق دهید.', 'مانده و نتیجه را پس از ثبت در خود برنامه بررسی کنید.'],
    note: 'این چک‌لیست آموزشی است؛ هیچ موجودی یا سندی تغییر نمی‌کند.',
  },
  bank: {
    heading: 'راهنمای بخش بانک',
    steps: ['بخش بانک را از منوی پنل پیدا کنید.', 'حساب بانکی و ارز مربوط را مطابق اطلاعات ثبت‌شده انتخاب کنید.', 'پیش از ثبت هر عملیات، مبلغ و مرجع پرداخت را تطبیق دهید.', 'نتیجه را از صفحه و گزارش مربوط بررسی کنید.'],
    note: 'دستیار به حساب بانکی یا سوابق واقعی دسترسی ندارد.',
  },
  currencies: {
    heading: 'راهنمای ارز و نرخ',
    steps: ['فهرست ارزهای موجود را در بخش ارز و نرخ بررسی کنید.', 'ارز مبدأ و مقصد را از نظر کد و نام دقیق تطبیق دهید.', 'نرخ مورد استفاده و زمان اعتبار آن را پیش از محاسبه بررسی کنید.', 'اگر نرخ نمایش‌داده‌شده نامشخص است، پیش از معامله از مسئول مربوط استعلام بگیرید.'],
    note: 'دستیار نرخ زنده یا قیمت قطعی معامله ارائه نمی‌کند.',
  },
  reports: {
    heading: 'راهنمای گزارش‌ها',
    steps: ['گزارش متناسب با هدف خود را انتخاب کنید.', 'بازه زمانی و فیلترهای موجود را کنترل کنید.', 'جمع‌ها و جزئیات را با اسناد مبنا مقایسه کنید.', 'در صورت مشاهده اختلاف، پیش از هر اصلاحی علت را بررسی کنید.'],
    note: 'دستیار گزارش واقعی یا اطلاعات مالی حساب شما را مشاهده نمی‌کند.',
  },
  ledger: {
    heading: 'راهنمای دفترها و اسناد',
    steps: ['دفتر روزنامه برای مشاهده ثبت‌های حسابداری به ترتیب ثبت استفاده می‌شود.', 'دفتر کل گردش و مانده حساب‌ها را در سطح حساب نشان می‌دهد.', 'برای پیگیری اختلاف، شماره سند و دوره مربوط را یادداشت کنید.', 'اصلاح سند مالی را فقط از مسیر مجاز و پس از بررسی انجام دهید.'],
    note: 'این توضیح آموزشی است و جای بررسی حسابدار یا اسناد اصلی را نمی‌گیرد.',
  },
  services: {
    heading: 'راهنمای خدمات آنلاین',
    steps: ['خدمت موردنظر را از بخش محصولات یا خدمات آنلاین انتخاب کنید.', 'وضعیت فعال یا درحال‌راه‌اندازی بودن خدمت را بررسی کنید.', 'اطلاعات سفارش را قبل از ادامه بازبینی کنید.', 'اگر وضعیت خدمت نامشخص یا درحال‌به‌روزرسانی است، سفارش واقعی ثبت نکنید.'],
    note: 'فعال‌بودن هر خدمت ممکن است به تنظیمات و تأمین‌کننده وابسته باشد.',
  },
  support: {
    heading: 'راهنمای گزارش مشکل',
    steps: ['نام صفحه یا آیکونی را که با آن مشکل دارید یادداشت کنید.', 'متن کامل خطا و زمان تقریبی رخداد را ثبت کنید.', 'در صورت ارسال تصویر، نام، شماره تلفن، موجودی و اطلاعات محرمانه را بپوشانید.', 'گزارش را از راه پشتیبانی رسمی حساب صراف ارسال کنید.'],
    note: 'رمز، کد ورود، توکن یا اطلاعات کامل مالی را در پیام پشتیبانی یا گفتگو ارسال نکنید.',
  },
};

export default function Assistant({ embedded = false, onClose }) {
  const { user } = useAuth();
  // Keep conversation history isolated by signed-in account and role.
  // The previous shared history key is intentionally left untouched.
  const historyScope = user?.id ? `user:${user.id}:${user.role || 'unknown'}` : 'guest';
  const [messages, setMessages] = useState([]);
  const [loadedHistoryScope, setLoadedHistoryScope] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [activeGuide, setActiveGuide] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setMessages(loadHistory(historyScope));
    setLoadedHistoryScope(historyScope);
  }, [historyScope]);
  useEffect(() => {
    if (loadedHistoryScope !== historyScope) return;
    saveHistory(messages, historyScope);
  }, [messages, historyScope, loadedHistoryScope]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const sendMessage = useCallback(async (rawText, speakReply = false) => {
    const text = String(rawText || '').trim();
    if (!text || sending) return;
    const userMsg = { role: 'user', text, ts: Date.now() };
    const previous = messages.slice(-8);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const result = await sendAssistantMessage(text, { context: previous });
      if (result.status === MODEL_STATUS.NOT_CONFIGURED) {
        setNotConfigured(true);
        setMessages(prev => [...prev, { role: 'assistant', text: result.reply, ts: Date.now() }]);
        return;
      }
      if (result.status === MODEL_STATUS.ERROR || !result.reply) {
        setError(result.error || 'پاسخ دریافت نشد.');
        return;
      }
      setNotConfigured(false);
      const reply = result.reply;
      setMessages(prev => [...prev, { role: 'assistant', text: reply, ts: Date.now() }]);
      if (speakReply && voiceEnabled) await speak(reply);
    } catch {
      setError('ارتباط با دستیار برقرار نشد. اتصال اینترنت را بررسی کنید.');
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, voiceEnabled]);

  const speak = useCallback(async (text) => {
    if (!text || !voiceEnabled) return;
    setSpeaking(true);
    setError(null);
    try {
      await speakPersian(text, () => {});
    } catch {
      const synth = window.speechSynthesis;
      if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
        setError('صدای فارسی در این مرورگر در دسترس نیست؛ پاسخ به‌صورت متنی باقی می‌ماند.');
        setSpeaking(false);
        return;
      }
      synth.cancel();
      await new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        utterance.rate = 0.95;
        utterance.onend = resolve;
        utterance.onerror = () => reject(new Error('پخش صدا ناموفق بود.'));
        synth.speak(utterance);
      }).catch(() => setError('پخش صدای پاسخ ناموفق بود؛ متن پاسخ در دسترس است.'));
    } finally {
      setSpeaking(false);
    }
  }, [voiceEnabled]);

  const stopVoice = () => {
    try { window.speechSynthesis?.cancel(); } catch {}
    stopPersianSpeech();
    setSpeaking(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود؛ می‌توانید سؤال را تایپ کنید.');
      return;
    }
    try {
      recognitionRef.current?.stop();
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = event => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setListening(false);
        if (transcript.trim()) void sendMessage(transcript, true);
        else setError('گفتاری تشخیص داده نشد؛ دوباره تلاش کنید.');
      };
      recognition.onerror = event => {
        setListening(false);
        setError(event.error === 'not-allowed' ? 'اجازه استفاده از میکروفون داده نشده است.' : 'تشخیص گفتار انجام نشد؛ می‌توانید پیام را تایپ کنید.');
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setError(null);
    } catch {
      setListening(false);
      setError('میکروفون شروع نشد. مجوز میکروفون مرورگر را بررسی کنید.');
    }
  };

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    stopPersianSpeech();
  }, []);

  const handleSend = () => sendMessage(input);
  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const selectedGuide = activeGuide ? GUIDE_DETAILS[activeGuide] : null;
  const displayRole = user?.role === 'customer' ? 'راهنمای مشتری' : user ? 'راهنمای صراف' : 'راهنمای ورود و ثبت‌نام';

  return (
    <main dir="rtl" lang="fa" className={`mx-auto flex w-full flex-col ${embedded ? 'h-full' : 'min-h-screen max-w-6xl px-3 py-4 sm:px-5 sm:py-6'}`} style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
        <header className="relative overflow-hidden bg-gradient-to-l from-slate-950 via-slate-900 to-teal-950 px-4 py-5 text-white sm:px-6 sm:py-6">
          <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-teal-200/25 bg-teal-300/10 text-teal-200 shadow-lg">
                <Bot className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-extrabold sm:text-lg">دستیار هوشمند حساب صراف</h1>
                  <span className="rounded-full border border-teal-200/20 bg-teal-200/10 px-2 py-0.5 text-[10px] text-teal-100">راهنمای تخصصی</span>
                </div>
                <p className="text-xs text-slate-300">{displayRole} · راهنمای آیکون‌ها، مراحل و کارهای روزمره</p>
              </div>
            </div>
            {onClose ? <Button variant="ghost" size="icon" onClick={onClose} aria-label="بستن دستیار" className="text-white hover:bg-white/10"><X className="h-5 w-5" /></Button> : (
              <Link to="/login" className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"><ArrowRight className="h-3.5 w-3.5" /> بازگشت به ورود</Link>
            )}
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5"><BookOpen className="mb-1 h-4 w-4 text-teal-200" /><p className="text-[11px] font-semibold">آموزش مرحله‌ای</p></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5"><Eye className="mb-1 h-4 w-4 text-teal-200" /><p className="text-[11px] font-semibold">پیش‌نمایش آموزشی</p></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5"><ShieldCheck className="mb-1 h-4 w-4 text-teal-200" /><p className="text-[11px] font-semibold">حریم خصوصی</p></div>
          </div>
        </header>

        <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
          <section className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900 dark:bg-teal-950/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-600 text-white"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">سلام، چطور کمکتان کنم؟</h2>
                  <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{WELCOME_TEXT}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">مرکز راهنمای حساب صراف</h2>
                <span className="text-[10px] text-slate-500">انتخاب کنید تا راهنما باز شود</span>
              </div>
              {GUIDE_GROUPS.map(group => (
                <div key={group.title} className="space-y-2">
                  <h3 className="px-1 text-xs font-bold text-slate-500">{group.title}</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button key={item.id} type="button" onClick={() => { setActiveGuide(item.id); setInput(item.prompt); }}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50/70 dark:hover:bg-teal-950/30 ${activeGuide === item.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-teal-700 dark:bg-slate-800 dark:text-teal-300"><Icon className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                            <span className="mt-1 block text-[10px] leading-5 text-slate-500">{item.subtitle}</span>
                          </span>
                          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedGuide && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-amber-700 dark:text-amber-300" /><h3 className="text-sm font-extrabold">{selectedGuide.heading}</h3></div>
                  <button type="button" onClick={() => setActiveGuide(null)} className="rounded-lg p-1 text-slate-500 hover:bg-black/5" aria-label="بستن پیش‌نمایش"><X className="h-4 w-4" /></button>
                </div>
                <div className="rounded-xl border border-amber-200/70 bg-white p-3 dark:border-amber-900/60 dark:bg-slate-900">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-700"><CircleHelp className="h-4 w-4 text-teal-600" /><span className="text-xs font-bold">پیش‌نمایش آموزشی مراحل</span><span className="mr-auto rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">نمونه</span></div>
                  <ol className="space-y-2">
                    {selectedGuide.steps.map((step, index) => <li key={step} className="flex gap-2 text-xs leading-6 text-slate-700 dark:text-slate-200"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-100">{index + 1}</span><span>{step}</span></li>)}
                  </ol>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-amber-900 dark:text-amber-200">{selectedGuide.note}</p>
                <Button type="button" size="sm" className="mt-3 w-full gap-2" onClick={() => sendMessage(GUIDE_GROUPS.flatMap(g => g.items).find(item => item.id === activeGuide)?.prompt || selectedGuide.heading)}>
                  <Bot className="h-4 w-4" /> توضیح بیشتر با دستیار
                </Button>
              </div>
            )}
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200"><Bot className="h-4 w-4" /></div><div><h2 className="text-xs font-extrabold">گفت‌وگو با دستیار</h2><p className="text-[10px] text-slate-500">متن و گفتار فارسی</p></div></div>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-[10px]" onClick={() => setVoiceEnabled(v => !v)}>{voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{voiceEnabled ? 'صدا روشن' : 'صدا خاموش'}</Button>
            </div>

            {notConfigured && <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>سرویس هوش مصنوعی در حال حاضر پیکربندی نشده است. راهنماهای آموزشی زیر همچنان قابل مشاهده‌اند.</span></div>}
            {error && <div role="alert" className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

            <div ref={scrollRef} className="flex min-h-[340px] flex-1 flex-col gap-3 overflow-y-auto p-3 sm:min-h-[440px]">
              {messages.length === 0 && (
                <div className="my-auto space-y-3 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200"><Bot className="h-8 w-8" /></div>
                  <p className="text-xs font-bold">برای شروع، یکی از پرسش‌ها را انتخاب کنید</p>
                  <div className="flex flex-col gap-2">
                    {QUICK_PROMPTS.map(question => <button key={question} type="button" onClick={() => setInput(question)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-[11px] leading-5 text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{question}</button>)}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={message.ts + '-' + index} className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-xs leading-6 ${message.role === 'user' ? 'mr-auto rounded-br-sm bg-slate-800 text-white dark:bg-teal-800' : 'ml-auto rounded-bl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}>
                  <div className="mb-1 text-[9px] font-bold opacity-60">{message.role === 'user' ? 'شما' : 'دستیار حساب صراف'}</div>
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  {message.role === 'assistant' && <button type="button" onClick={() => speak(message.text)} disabled={!voiceEnabled || speaking} className="mt-2 inline-flex items-center gap-1 text-[10px] text-teal-700 disabled:opacity-40 dark:text-teal-300"><Volume2 className="h-3 w-3" /> پخش پاسخ</button>}
                </div>
              ))}
              {sending && <div className="mr-auto flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800"><Loader2 className="h-4 w-4 animate-spin" /> در حال آماده‌سازی راهنما…</div>}
              <div />
            </div>

            <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex gap-2">
                <Button type="button" variant={listening ? 'destructive' : 'outline'} size="sm" className="flex-1 gap-2" onClick={() => listening ? recognitionRef.current?.stop() : startListening()} disabled={sending}><Mic className="h-4 w-4" />{listening ? 'پایان ضبط' : 'گفت‌وگوی صوتی'}</Button>
                {speaking && <Button type="button" variant="outline" size="sm" onClick={stopVoice}><MicOff className="h-4 w-4" /> توقف صدا</Button>}
              </div>
              <div className="flex items-center gap-2">
                <Input value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="سؤال خود را بنویسید…" disabled={sending || listening} maxLength={2000} className="h-11 min-w-0 rounded-xl text-xs" />
                <Button type="button" onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="h-11 w-11 shrink-0 rounded-xl" aria-label="ارسال پیام">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
              </div>
              <p className="mt-2 text-center text-[9px] leading-5 text-slate-400">دستیار فقط راهنمایی می‌کند؛ به پنل سازنده، موجودی و تراکنش‌های واقعی دسترسی ندارد و عملیات مالی ثبت نمی‌کند.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
