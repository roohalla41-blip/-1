import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Trash2, Loader2, AlertCircle, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  sendBuilderAssistantMessage,
  BUILDER_ASSISTANT_HISTORY_KEY,
  loadHistory,
  saveHistory,
  clearHistory,
  MODEL_STATUS,
} from '@/lib/aiChat';
import { useFeatures } from '@/lib/useSarraaf';
import { FEATURE_CATALOG } from '@/lib/features';
import { getAllTickets, getAllFeedback, getErrorReports } from '@/lib/supportSystem';

const VOICE_NAVIGATION = [
  { path: '/dashboard', phrases: ['داشبورد', 'صفحه اصلی', 'صفحه اول', 'خانه'] },
  { path: '/customers', phrases: ['مشتریان', 'لیست مشتریان', 'صفحه مشتریان'] },
  { path: '/trade', phrases: ['معاملات', 'صفحه معاملات'] },
  { path: '/cash', phrases: ['صندوق', 'صندوق نقدی', 'صفحه صندوق'] },
  { path: '/bank', phrases: ['بانک', 'حساب بانکی', 'صفحه بانک'] },
  { path: '/currencies', phrases: ['ارزها', 'نرخ ارز', 'صفحه ارزها'] },
  { path: '/reports', phrases: ['گزارشات', 'گزارش ها', 'گزارش‌ها', 'صفحه گزارشات'] },
  { path: '/profit-loss', phrases: ['سود و زیان', 'گزارش سود و زیان'] },
  { path: '/journal', phrases: ['دفتر روزنامه', 'ژورنال'] },
  { path: '/general-ledger', phrases: ['دفتر کل', 'حساب کل'] },
  { path: '/journal-entry', phrases: ['ثبت سند حسابداری', 'سند حسابداری'] },
  { path: '/balance-sheet', phrases: ['ترازنامه', 'بیلانس شیت'] },
  { path: '/reconciliation', phrases: ['مغایرت گیری', 'تطبیق حساب'] },
  { path: '/transfer-book', phrases: ['دفتر حواله', 'حواله ها', 'حواله‌ها'] },
  { path: '/debtors', phrases: ['بدهکاران', 'لیست بدهکاران'] },
  { path: '/agents', phrases: ['نمایندگان', 'نماینده ها', 'نماینده‌ها'] },
  { path: '/notifications', phrases: ['اعلان ها', 'اعلان‌ها', 'اطلاعیه ها', 'اطلاعیه‌ها'] },
  { path: '/agency-network', phrases: ['شبکه نمایندگی', 'شبکه نمایندگان'] },
  { path: '/online-products', phrases: ['خدمات آنلاین', 'محصولات آنلاین'] },
  { path: '/payment-gateway', phrases: ['درگاه پرداخت', 'درگاه بانکی'] },
  { path: '/backup', phrases: ['پشتیبان گیری', 'پشتیبان‌گیری', 'بکاپ'] },
  { path: '/support', phrases: ['پشتیبانی', 'تماس با پشتیبانی'] },
  { path: '/settings', phrases: ['تنظیمات', 'صفحه تنظیمات'] },
  { path: '/assistant', phrases: ['دستیار', 'صفحه دستیار'] },
];

const BUILDER_VOICE_NAVIGATION = [
  { path: '/builder?tab=system', phrases: ['پنل سازنده', 'پنل مدیریت سازنده', 'مدیریت سیستم', 'نمای کلی سیستم'] },
  { path: '/builder?tab=features', phrases: ['مدیریت بخش ها', 'مدیریت بخش‌ها', 'بخش ها', 'بخش‌ها', 'امکانات سیستم'] },
  { path: '/builder?tab=users', phrases: ['مدیریت کاربران', 'کاربران'] },
  { path: '/builder?tab=perms', phrases: ['مجوزها', 'دسترسی ها', 'دسترسی‌ها'] },
  { path: '/builder?tab=plans', phrases: ['پلن ها', 'پلن‌ها', 'سطح بندی', 'سطح‌بندی'] },
  { path: '/builder?tab=pricing', phrases: ['قیمت گذاری', 'قیمت‌گذاری'] },
  { path: '/builder?tab=notif', phrases: ['مدیریت اعلان ها', 'مدیریت اعلان‌ها'] },
  { path: '/builder?tab=chat', phrases: ['مدیریت چت', 'چت و گروه ها', 'چت و گروه‌ها'] },
  { path: '/builder?tab=payments', phrases: ['روش های پرداخت', 'روش‌های پرداخت'] },
  { path: '/builder?tab=withdrawals', phrases: ['برداشت ها', 'برداشت‌ها'] },
  { path: '/builder?tab=version', phrases: ['مدیریت نسخه', 'نسخه برنامه'] },
  { path: '/builder?tab=backup', phrases: ['پشتیبان اضطراری'] },
  { path: '/builder?tab=trial', phrases: ['دوره آزمایشی', 'مدیریت دوره آزمایشی'] },
  { path: '/builder?tab=layout_preview', phrases: ['پیش نمایش موبایل', 'پیش‌نمایش موبایل'] },
  { path: '/builder?tab=masnavi_ai', phrases: ['دستیار سازنده', 'دستیار هوشمند سازنده', 'صفحه دستیار'] },
  { path: '/builder?tab=supabase_audit', phrases: ['بررسی سوپابیس', 'ممیزی سوپابیس'] },
  { path: '/builder?tab=db_explorer', phrases: ['دیتابیس زنده', 'مرور دیتابیس'] },
  { path: '/main-settings', phrases: ['تنظیمات اصلی', 'تنظیمات مادر'] },
];

const CUSTOMER_VOICE_NAVIGATION = [
  { path: '/customer', phrases: ['خانه', 'صفحه نخست', 'صفحه مشتری'] },
  { path: '/customer/wallet', phrases: ['کیف پول', 'موجودی کیف پول', 'تاریخچه کیف پول'] },
  { path: '/customer/account', phrases: ['حساب من', 'حساب من با صراف', 'مانده حساب', 'گردش حساب', 'موجودی حساب'] },
  { path: '/customer/orders', phrases: ['سفارش ها', 'سفارش‌ها', 'سفارشات'] },
  { path: '/customer/transfer', phrases: ['ارسال پول', 'حواله', 'انتقال پول'] },
  { path: '/customer/support', phrases: ['پشتیبانی', 'کمک', 'راهنمایی'] },
];

function normalizeVoiceCommand(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[؟?!.,،؛:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveVoiceCommand(value, role, builderContext = false) {
  const text = normalizeVoiceCommand(value);
  const approvalIntent = /(تایید|تأیید|ثبت نهایی|نهایی کن|ارسال نهایی|پرداخت کن|انتقال بده|واریز کن|برداشت کن|دکمه ثبت|دکمه تایید|دکمه تأیید)/.test(text);
  if (approvalIntent) return { type: 'manual_confirmation_required' };

  if (builderContext || role === 'creator' || role === 'admin') {
    const builderIntent = /^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\s*/.test(text);
    if (!builderIntent) return null;
    const builderTarget = text.replace(/^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\s*/, '').replace(/^(صفحه|بخش)\s*/, '');
    const builderMatch = BUILDER_VOICE_NAVIGATION.find((item) =>
      item.phrases.some((phrase) => normalizeVoiceCommand(phrase) === builderTarget)
    );
    return builderMatch ? { type: 'navigate', path: builderMatch.path, label: builderTarget } : null;
  }

  if (role === 'customer') {
    // Customer voice actions stay inside the authenticated customer workspace.
    // The balance is displayed by the account screen; this command never guesses it.
    if (/(موجودی|مانده).*(کیف پول)|(کیف پول).*(موجودی|مانده)/.test(text)) {
      return { type: 'navigate', path: '/customer/wallet', label: 'کیف پول شما' };
    }
    if (/(موجودی|مانده|گردش).*(حساب)|(حساب).*(موجودی|مانده|گردش)/.test(text)) {
      return { type: 'navigate', path: '/customer/account', label: 'حساب شما' };
    }
    const customerNavigationIntent = /^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\s*/.test(text);
    if (!customerNavigationIntent) return null;
    const customerTarget = text.replace(/^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\s*/, '').replace(/^(صفحه|بخش)\s*/, '');
    const customerMatch = CUSTOMER_VOICE_NAVIGATION.find((item) =>
      item.phrases.some((phrase) => normalizeVoiceCommand(phrase) === customerTarget)
    );
    return customerMatch ? { type: 'navigate', path: customerMatch.path, label: customerTarget } : null;
  }

  const navigationIntent = /^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\s*/.test(text);
  if (!navigationIntent) return null;
  const target = text.replace(/^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\s*/, '').replace(/^(صفحه|بخش)\s*/, '');
  const match = VOICE_NAVIGATION.find((item) =>
    item.phrases.some((phrase) => normalizeVoiceCommand(phrase) === target)
  );
  return match ? { type: 'navigate', path: match.path, label: target } : null;
}

const WELCOME_TEXT =
  'سلام. من دستیار اختصاصی پنل سازنده هستم. می‌توانم درباره وضعیت فعال‌سازی بخش‌ها، تیکت‌ها، بازخوردها و گزارش خطاهای قابل‌دسترسی توضیح بدهم. برای صحبت، میکروفون را روشن کنید؛ متن تشخیص‌داده‌شده پیش از ارسال قابل اصلاح است. پاسخ را هم می‌توانم با صدای فارسی بخوانم. من فقط گزارش می‌دهم و هیچ تنظیم، مجوز یا داده‌ای را تغییر نمی‌دهم.';

export default function Assistant() {
  const { user } = useAuth();
  const isCreator = user?.role === 'creator';
  const { data: featureSettings, isLoading: featuresLoading, error: featuresError } = useFeatures(isCreator);
  const [supportData, setSupportData] = useState({ tickets: [], feedback: [], errors: [] });
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState(false);
  const featureSnapshot = useMemo(() => {
    if (!Array.isArray(featureSettings)) return [];
    return FEATURE_CATALOG.map((item) => {
      const saved = featureSettings.find((entry) => entry.feature_key === item.feature_key);
      const status = saved?.enabled === false ? 'disabled' : (saved?.status || item.default_status || 'active');
      return { name: item.name, status: status === 'active' ? 'فعال' : status === 'updating' ? 'در حال تکمیل' : 'غیرفعال', source: saved ? 'تنظیم ثبت‌شده' : 'پیش‌فرض کاتالوگ' };
    });
  }, [featureSettings]);
  useEffect(() => {
    if (!isCreator) { setSupportLoading(false); return; }
    let active = true;
    setSupportLoading(true);
    Promise.all([getAllTickets(), getAllFeedback(), getErrorReports()])
      .then(([tickets, feedback, errors]) => {
        if (active) setSupportData({ tickets: tickets || [], feedback: feedback || [], errors: errors || [] });
      })
      .catch(() => { if (active) setSupportError(true); })
      .finally(() => { if (active) setSupportLoading(false); });
    return () => { active = false; };
  }, [isCreator]);
  const requestSnapshot = useMemo(() => [
    ...supportData.tickets.slice(0, 20).map((item) => ({ type: 'تیکت', category: String(item.category || '').slice(0, 40), priority: String(item.priority || '').slice(0, 20), status: String(item.status || 'نامشخص').slice(0, 30), date: String(item.created_date || item.created_at || '').slice(0, 10) })),
    ...supportData.feedback.slice(0, 15).map((item) => ({ type: 'بازخورد/پیشنهاد', category: String(item.type || '').slice(0, 40), priority: '', status: String(item.status || 'جدید').slice(0, 30), date: String(item.created_date || item.created_at || '').slice(0, 10) })),
    ...supportData.errors.slice(0, 15).map((item) => ({ type: 'گزارش خطا', category: 'خطای فنی', priority: '', status: String(item.status || 'جدید').slice(0, 30), date: String(item.created_date || item.created_at || '').slice(0, 10) })),
  ], [supportData]);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const sendRef = useRef(null);
  const startListeningRef = useRef(null);
  const handsFreeRef = useRef(false);

  // بارگذاری تاریخچه محلی هنگام نمایش صفحه
  useEffect(() => {
    setMessages(loadHistory(BUILDER_ASSISTANT_HISTORY_KEY));
  }, []);

  // ذخیره خودکار تاریخچه
  useEffect(() => {
    saveHistory(messages, BUILDER_ASSISTANT_HISTORY_KEY);
  }, [messages]);

  // اسکرول به پایین هنگام افزودن پیام
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const speak = useCallback((text) => {
    if (!voiceOutput || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      const voice = window.speechSynthesis.getVoices().find((item) => /^fa(-|$)/i.test(item.lang));
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (handsFreeRef.current) startListeningRef.current?.();
      };
      window.speechSynthesis.speak(utterance);
    } catch { /* متن پاسخ همچنان قابل مشاهده است */ }
  }, [voiceOutput]);

  const startListening = useCallback(() => {
    if (listening) {
      const pendingText = transcriptRef.current.trim();
      transcriptRef.current = '';
      handsFreeRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setListening(false);
      if (pendingText) sendRef.current?.(pendingText);
      return;
    }
    if (sending) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('این مرورگر تشخیص گفتار را پشتیبانی نمی‌کند. از میکروفون صفحه‌کلید یا نوشتن استفاده کنید.');
      return;
    }
    setError(null);
    setInput('');
    transcriptRef.current = '';
    handsFreeRef.current = true;
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    const recognition = new Recognition();
    recognition.lang = 'fa-IR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const finalParts = [];
      const interimParts = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) continue;
        if (result.isFinal) finalParts.push(transcript);
        else interimParts.push(transcript);
      }
      const transcript = [...finalParts, ...interimParts].join(' ').trim();
      if (transcript) {
        transcriptRef.current = finalParts.join(' ').trim() || interimParts.join(' ').trim();
        setInput(transcript.slice(0, 2000));
      }
    };
    recognition.onerror = (event) => {
      handsFreeRef.current = false;
      transcriptRef.current = '';
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setError('اجازهٔ میکروفون داده نشده است. مجوز میکروفون مرورگر را فعال کنید.');
      else if (event.error === 'no-speech') setError('صدایی شنیده نشد. دوباره روی میکروفون بزنید و صحبت کنید.');
      else setError('تشخیص گفتار در دسترس نیست. از میکروفون صفحه‌کلید یا نوشتن استفاده کنید.');
    };
    recognition.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current.trim();
      transcriptRef.current = '';
      if (!handsFreeRef.current) return;
      if (finalText) sendRef.current?.(finalText);
      else startListeningRef.current?.();
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch {
      handsFreeRef.current = false;
      setListening(false);
      setError('میکروفون شروع نشد. کمی بعد دوباره امتحان کنید.');
    }
  }, [listening, sending]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }, []);

  const handleSend = useCallback(async (rawText = input) => {
    const text = String(rawText || '').trim();
    if (!text || sending) return;
    transcriptRef.current = '';

    if (!isCreator) {
      setError('این دستیار فقط برای حساب سازنده سیستم در دسترس است.');
      return;
    }
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
    const voiceCommand = resolveVoiceCommand(text, user?.role, true);
    if (voiceCommand?.type === 'manual_confirmation_required') {
      const userMsg = { role: 'user', text, ts: Date.now() };
      const botMsg = {
        role: 'assistant',
        text: 'من نمی‌توانم عملیات مالی یا ثبت نهایی را تأیید کنم. لطفاً اطلاعات را خودتان بررسی کنید و فقط با لمس دستی دکمهٔ تأیید، عملیات را انجام دهید.',
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput('');
      speak(botMsg.text);
      return;
    }
    if (voiceCommand?.type === 'navigate') {
      const userMsg = { role: 'user', text, ts: Date.now() };
      const botMsg = {
        role: 'assistant',
        text: `بخش «${voiceCommand.label}» را باز می‌کنم. برای ثبت یا تأیید هر عملیات، اقدام نهایی همچنان با خود شماست.`,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput('');
      speak(botMsg.text);
      navigate(voiceCommand.path);
      return;
    }

    const userMsg = { role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError(null);

    const context = messages.slice(-8).map((item) => ({ role: item.role, text: item.text }));
    let result;
    try {
      result = await sendBuilderAssistantMessage(text, {
        context,
        projectSnapshot: featureSnapshot,
        requestSnapshot: supportLoading || supportError ? null : requestSnapshot,
      });
    } catch {
      result = { status: MODEL_STATUS.ERROR, error: 'ارتباط با دستیار برقرار نشد. اتصال اینترنت را بررسی کنید.' };
    }

    setSending(false);

    if (result.status === MODEL_STATUS.NOT_CONFIGURED) {
      setNotConfigured(true);
      const botMsg = { role: 'assistant', text: result.reply, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
      speak(botMsg.text);
      return;
    }

    if (result.status === MODEL_STATUS.ERROR || !result.reply) {
      setError(result.error || 'خطای ناشناخته.');
      return;
    }

    setNotConfigured(false);
    const botMsg = { role: 'assistant', text: result.reply, ts: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    speak(botMsg.text);
  }, [input, sending, messages, speak, navigate, user?.role, isCreator, featureSnapshot, requestSnapshot, supportLoading, supportError]);

  sendRef.current = handleSend;
  startListeningRef.current = startListening;

  const handleClearHistory = useCallback(() => {
    if (!window.confirm('تاریخچه گفتگوی محلی پاک شود؟ این عمل فقط داده‌های این مرورگر را حذف می‌کند و بر سوابق سرور تأثیری ندارد.')) {
      return;
    }
    clearHistory(BUILDER_ASSISTANT_HISTORY_KEY);
    setMessages([]);
    setError(null);
    setNotConfigured(false);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isCreator) {
    return <div className="p-6 text-center text-sm text-muted-foreground">این بخش در دسترس نیست.</div>;
  }

  const completedCount = featureSnapshot.filter((item) => item.status === 'فعال').length;
  const inProgressCount = featureSnapshot.filter((item) => item.status === 'در حال تکمیل').length;
  const disabledCount = featureSnapshot.filter((item) => item.status === 'غیرفعال').length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] max-w-3xl mx-auto w-full">
      {/* هدر */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">دستیار اختصاصی سازنده</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {user?.name || user?.email || 'کاربر'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVoiceOutput((enabled) => {
            if (enabled) window.speechSynthesis?.cancel();
            return !enabled;
          })}
          title={voiceOutput ? 'خاموش کردن پاسخ صوتی' : 'روشن کردن پاسخ صوتی'}
          aria-label="تغییر پاسخ صوتی"
        >
          {voiceOutput ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          className="text-muted-foreground hover:text-destructive"
          title="پاک‌کردن تاریخچه محلی"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">پاک‌کردن</span>
        </Button>
      </div>

      <div className="mx-4 mt-3 rounded-lg border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2"><strong className="text-sm">گزارش وضعیت بخش‌های برنامه</strong><span className="text-[10px] text-muted-foreground">بر اساس تنظیمات موجود در پنل</span></div>
        {featuresLoading ? <p className="text-xs text-muted-foreground">در حال دریافت وضعیت بخش‌ها…</p> : featuresError ? <p className="text-xs text-destructive">وضعیت بخش‌ها دریافت نشد؛ گزارش قطعی ارائه نمی‌شود.</p> : <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-muted p-2"><strong className="block text-lg">{completedCount}</strong><span className="text-[10px]">فعال</span></div><div className="rounded-md bg-muted p-2"><strong className="block text-lg">{inProgressCount}</strong><span className="text-[10px]">در حال تکمیل</span></div><div className="rounded-md bg-muted p-2"><strong className="block text-lg">{disabledCount}</strong><span className="text-[10px]">غیرفعال</span></div></div>}
        <p className="text-[10px] text-muted-foreground">این گزارش وضعیت فعال‌سازی است، نه تأیید تکمیل فنی همه قابلیت‌ها؛ موارد بدون تنظیم ثبت‌شده از پیش‌فرض کاتالوگ محاسبه می‌شوند.</p>
        <div className="border-t pt-2 space-y-1">
          <strong className="text-xs">درخواست‌ها و گزارش‌های دریافتی</strong>
          {supportLoading ? <p className="text-xs text-muted-foreground">در حال دریافت تیکت‌ها و بازخوردها…</p> : supportError ? <p className="text-xs text-destructive">دریافت درخواست‌ها ناموفق بود؛ برای جلوگیری از گزارش اشتباه، عددی نمایش داده نمی‌شود.</p> : <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-muted p-2"><strong className="block text-lg">{supportData.tickets.filter((item) => ['open', 'in_progress'].includes(item.status)).length}</strong><span className="text-[10px]">تیکت باز/درحال بررسی</span></div><div className="rounded-md bg-muted p-2"><strong className="block text-lg">{supportData.feedback.filter((item) => ['new', 'open'].includes(item.status)).length}</strong><span className="text-[10px]">بازخورد جدید</span></div><div className="rounded-md bg-muted p-2"><strong className="block text-lg">{supportData.errors.filter((item) => ['new', 'open'].includes(item.status)).length}</strong><span className="text-[10px]">گزارش خطای جدید</span></div></div>}
          {!supportLoading && !supportError && requestSnapshot.length > 0 && <ul className="space-y-1 max-h-28 overflow-y-auto">{requestSnapshot.slice(0, 5).map((item, index) => <li key={`${item.type}-${index}`} className="text-[10px] text-muted-foreground truncate">{item.type}: {item.category || 'عمومی'} — {item.status}</li>)}</ul>}
        </div>
      </div>

      {/* پیام پیکربندی‌نشدن */}
      {notConfigured && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning-foreground/90">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
          <span>دستیار هوشمند هنوز پیکربندی نشده است. پاسخ‌های واقعی پس از راه‌اندازی کامل ارائه می‌شود.</span>
        </div>
      )}

      {/* خطا */}
      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* لیست پیام‌ها */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2">
            <Bot className="w-10 h-10 opacity-40" />
            <p className="text-sm max-w-xs">{WELCOME_TEXT}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>در حال پردازش…</span>
          </div>
        )}
      </div>

      {/* کادر ورودی */}
      <div className="border-t bg-card px-3 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Button type="button" variant={listening ? 'destructive' : 'outline'} size="icon" onClick={startListening} disabled={sending} aria-label={listening ? 'توقف میکروفون' : 'شروع میکروفون'}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? 'صحبت کنید؛ متن گفتار اینجا نمایش داده می‌شود…' : 'پیام خود را بنویسید…'}
            disabled={sending}
            maxLength={2000}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending || listening}
            size="icon"
            aria-label="ارسال"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          {listening ? 'مکالمه صوتی فعال است؛ با مکث شما پیام ارسال می‌شود و پس از پاسخ دوباره گوش می‌دهم. ' : 'برای شروع مکالمه صوتی، میکروفون را روشن کنید. '}
          در این حالت پس از مکث، گفتار به متن تبدیل و برای پاسخ ارسال می‌شود؛ سپس پاسخ فارسی خوانده شده و میکروفون دوباره فعال می‌شود. برای پایان مکالمه روی دکمه میکروفون بزنید. این روش از گفتار مرورگر و پاسخ متنی مدل استفاده می‌کند و صدای خام را ذخیره نمی‌کند؛ صدای پاسخ به پشتیبانی صدای فارسی در دستگاه وابسته است. تأیید نهایی عملیات همیشه دستی است.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-bl-sm'
            : 'bg-muted text-foreground rounded-br-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}