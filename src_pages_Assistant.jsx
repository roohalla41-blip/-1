import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, Loader2, AlertCircle, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  sendAssistantMessage,
  loadHistory,
  saveHistory,
  clearHistory,
  MODEL_STATUS,
} from '@/lib/aiChat';

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
  { path: '/builder', phrases: ['پنل سازنده', 'پنل مدیریت سازنده', 'مدیریت سیستم'] },
  { path: '/main-settings', phrases: ['تنظیمات اصلی', 'تنظیمات مادر'] },
  { path: '/builder/assistant', phrases: ['دستیار سازنده', 'دستیار هوشمند سازنده', 'صفحه دستیار'] },
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
    const builderIntent = /^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\\s*/.test(text);
    if (!builderIntent) return null;
    const builderTarget = text.replace(/^(برو به|برو|باز کن|صفحه|نمایش بده|بریم به)\\s*/, '').replace(/^(صفحه|بخش)\\s*/, '');
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
  'به دستیار هوشمند حساب صراف خوش آمدید. سؤال خود را بنویسید یا با میکروفون بگویید. در این مرحله دستیار فقط برای آزمایش پنل سازنده فعال است؛ می‌توانید درباره پنل سازنده راهنمایی بخواهید یا بگویید «برو به پنل سازنده» و «برو به تنظیمات اصلی». گزارش وضعیت واقعی پروژه تا زمان اتصال امن به اطلاعات و گزارش‌های معتبر، حدس زده نمی‌شود.';

export default function Assistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // بارگذاری تاریخچه محلی هنگام نمایش صفحه
  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  // ذخیره خودکار تاریخچه
  useEffect(() => {
    saveHistory(messages);
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
      window.speechSynthesis.speak(utterance);
    } catch { /* متن پاسخ همچنان قابل مشاهده است */ }
  }, [voiceOutput]);

  const startListening = useCallback(() => {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setListening(false);
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
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    const recognition = new Recognition();
    recognition.lang = 'fa-IR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      setListening(false);
      if (transcript) setInput(transcript);
      else setError('گفتار تشخیص داده نشد. دوباره امتحان کنید.');
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setError('اجازهٔ میکروفون داده نشده است. مجوز میکروفون مرورگر را فعال کنید.');
      else if (event.error === 'no-speech') setError('صدایی شنیده نشد. دوباره روی میکروفون بزنید و صحبت کنید.');
      else setError('تشخیص گفتار در دسترس نیست. از میکروفون صفحه‌کلید یا نوشتن استفاده کنید.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch {
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

    const voiceCommand = resolveVoiceCommand(text, user?.role, location.pathname.startsWith('/builder/assistant'));
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
      result = await sendAssistantMessage(text, { context });
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
  }, [input, sending, messages, speak, navigate, user?.role, location.pathname]);

  const handleClearHistory = useCallback(() => {
    if (!window.confirm('تاریخچه گفتگوی محلی پاک شود؟ این عمل فقط داده‌های این مرورگر را حذف می‌کند و بر سوابق سرور تأثیری ندارد.')) {
      return;
    }
    clearHistory();
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] max-w-3xl mx-auto w-full">
      {/* هدر */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">دستیار هوشمند حساب صراف</h1>
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
            placeholder="پیام خود را بنویسید…"
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
          {listening ? 'در حال شنیدن صدای شما… برای پایان، دوباره روی میکروفون بزنید. ' : ''}
          متن گفتار پیش از ارسال قابل اصلاح است. متن پیام و بخشی از گفتگو برای پاسخ به سرویس هوش مصنوعی ارسال می‌شود؛ اپ صدای خام را در پایگاه داده ذخیره نمی‌کند. تأیید نهایی عملیات همیشه دستی و با خود شماست.
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