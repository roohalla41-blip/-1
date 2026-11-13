import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, Square, Volume2, VolumeX, ShieldCheck, Radio, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseConfig } from '@/lib/supabaseConfig';

const FUNCTION_PATH = '/functions/v1/builder-ai-assistant';

function getToken() {
  try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
}

export default function BuilderLiveAssistant({ projectSnapshot = [], requestSnapshot = null, role }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'سلام. من دستیار زنده و محرمانه پنل سازنده هستم. می‌توانم درباره وضعیت بخش‌های ثبت‌شده در پنل، موارد تکمیل‌شده یا غیرفعال و اطلاعاتی که به‌صورت امن در اختیارم قرار گرفته گزارش بدهم. عملیات مالی یا تغییر تنظیمات انجام نمی‌دهم.',
    ts: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const speechRef = useRef(null);

  const canUseSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const snapshot = useMemo(() => (Array.isArray(projectSnapshot) ? projectSnapshot.slice(0, 100) : []), [projectSnapshot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, sending]);

  const stopSpeech = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    setSpeaking(false);
  }, []);

  const speak = useCallback((text) => {
    if (!text) return;
    if (!voiceEnabled) {
      setError('صدای پاسخ خاموش است. ابتدا گزینه «صدای پاسخ روشن» را فعال کنید.');
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      setError('این مرورگر قابلیت تبدیل متن به گفتار را ندارد. صفحه را در نسخه به‌روز Chrome باز کنید.');
      return;
    }
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const voices = synth.getVoices?.() || [];
      const persianVoice = voices.find(voice => /^fa([-_]|$)/i.test(voice.lang));
      const utterance = new window.SpeechSynthesisUtterance(String(text));
      utterance.lang = 'fa-IR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      if (persianVoice) utterance.voice = persianVoice;
      utterance.onstart = () => { setSpeaking(true); setError(''); };
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = (event) => {
        setSpeaking(false);
        const code = event?.error || 'unknown';
        const messages = {
          'not-allowed': 'مرورگر اجازه پخش صدا را نداده است. روی دکمه پخش همین پاسخ بزنید و مطمئن شوید صفحه بی‌صدا نیست.',
          'voice-unavailable': 'موتور گفتار انتخاب‌شده در دسترس نیست. در تنظیمات گوشی، سرویس تبدیل متن به گفتار و صدای فارسی را بررسی کنید.',
          'language-unavailable': 'در دستگاه شما صدای فارسی نصب یا فعال نیست؛ زبان فارسی را به موتور گفتار گوشی اضافه کنید.',
          'audio-busy': 'خروجی صوتی گوشی مشغول است. پخش‌های دیگر را متوقف و دوباره امتحان کنید.',
          'audio-hardware': 'مرورگر به خروجی صوتی گوشی دسترسی پیدا نکرد. صدای رسانه و اتصال هدفون را بررسی کنید.',
          'synthesis-failed': 'موتور گفتار گوشی نتوانست متن را بخواند. سرویس تبدیل متن به گفتار را بررسی یا به‌روزرسانی کنید.',
        };
        setError(messages[code] || `پخش گفتار توسط مرورگر متوقف شد (کد: ${code}). صدای رسانه و سرویس گفتار گوشی را بررسی کنید.`);
      };
      speechRef.current = utterance;
      synth.speak(utterance);
    } catch (err) {
      setSpeaking(false);
      setError(`شروع پخش صدا ناموفق بود: ${err?.message || 'خطای مرورگر'}`);
    }
  }, [voiceEnabled]);

  const sendMessage = useCallback(async (rawText) => {
    const message = String(rawText || '').trim();
    if (!message || sending) return;
    if (role !== 'creator') {
      setError('این دستیار فقط برای حساب سازنده سیستم فعال است. لطفاً با حساب اصلی سازنده وارد شوید.');
      return;
    }
    const token = getToken();
    if (!token) {
      setError('نشست سازنده پیدا نشد. از حساب خارج شوید و دوباره وارد پنل سازنده شوید.');
      return;
    }
    setError('');
    const next = [...messages, { role: 'user', text: message, ts: Date.now() }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const { url, key } = getSupabaseConfig();
      const headers = { 'Content-Type': 'application/json', 'x-app-token': token };
      if (key) { headers.apikey = key; headers.Authorization = `Bearer ${key}`; }
      const response = await fetch(String(url || '').replace(/\/+$/, '') + FUNCTION_PATH, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          context: next.slice(-7, -1).map(item => ({ role: item.role, text: item.text })),
          projectSnapshot: snapshot,
          requestSnapshot,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || `پاسخ سرور دریافت نشد (کد ${response.status}).`);
      }
      const reply = data.reply || 'پاسخ خالی از سرور دریافت شد.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply, ts: Date.now() }]);
      speak(reply);
    } catch (err) {
      setError(err?.message || 'ارتباط با دستیار زنده برقرار نشد.');
    } finally {
      setSending(false);
    }
  }, [messages, sending, role, snapshot, requestSnapshot, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود. می‌توانید پیام را تایپ کنید.');
      return;
    }
    try {
      recognitionRef.current?.stop();
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || '';
        if (text.trim()) sendMessage(text);
      };
      recognition.onerror = (event) => {
        setError(event.error === 'not-allowed' ? 'اجازه میکروفون داده نشده است. مجوز میکروفون مرورگر را فعال کنید.' : 'تشخیص صدا با مشکل روبه‌رو شد؛ پیام را تایپ کنید.');
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setError('');
    } catch {
      setListening(false);
      setError('میکروفون شروع نشد. مجوز میکروفون مرورگر را بررسی کنید.');
    }
  }, [sendMessage]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <section dir="rtl" className="mx-auto w-full max-w-5xl space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Bot className="h-6 w-6 text-primary" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">دستیار زنده سازنده</h2>
            <p className="text-xs text-muted-foreground">ویژه حساب سازنده · متصل به سرویس اختصاصی پنل · فقط‌خواندنی</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700"><Radio className="h-3 w-3" /> اختصاصی</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded-lg bg-muted p-3"><ShieldCheck className="mb-1 h-4 w-4 text-primary" />دسترسی محدود به سازنده</div>
          <div className="rounded-lg bg-muted p-3"><Bot className="mb-1 h-4 w-4 text-primary" />گزارش بر پایه snapshot پنل</div>
          <div className="rounded-lg bg-muted p-3"><Volume2 className="mb-1 h-4 w-4 text-primary" />گفتار فارسی در مرورگر سازگار</div>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">این دستیار هیچ تراکنش، موجودی، کاربر، مجوز یا تنظیمی را تغییر نمی‌دهد. اطلاعاتی که به آن نرسیده باشد، به‌جای حدس زدن به‌عنوان «در دسترس نیست» اعلام می‌شود.</p>
      </div>

      <div className="flex min-h-[360px] flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-semibold">گفت‌وگو با دستیار سازنده</div>
          <Button type="button" variant="outline" size="sm" onClick={() => setVoiceEnabled(v => !v)} className="gap-2">
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceEnabled ? 'صدای پاسخ روشن' : 'صدای پاسخ خاموش'}
          </Button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {messages.map((item, index) => (
            <div key={item.ts + '-' + index} className={item.role === 'user' ? 'mr-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-primary p-3 text-sm text-primary-foreground' : 'ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-muted p-3 text-sm leading-7'}>
              <div className="mb-1 text-[10px] opacity-70">{item.role === 'user' ? 'شما' : 'دستیار زنده سازنده'}</div>
              <div className="whitespace-pre-wrap">{item.text}</div>
              {item.role === 'assistant' && (
                <div className="mt-2 flex justify-start">
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs" onClick={() => speak(item.text)} disabled={!voiceEnabled}>
                    <Volume2 className="h-3.5 w-3.5" /> پخش پاسخ با صدا
                  </Button>
                </div>
              )}
            </div>
          ))}
          {sending && <div className="text-xs text-muted-foreground">دستیار در حال بررسی و پاسخ‌گویی است…</div>}
          <div ref={messagesEndRef} />
        </div>
        {error && <div role="alert" className="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="درباره وضعیت پنل سازنده سؤال کنید…" disabled={sending} />
          <Button type="button" variant={listening ? 'destructive' : 'outline'} size="icon" aria-label={listening ? 'توقف میکروفون' : 'شروع میکروفون'} onClick={() => listening ? recognitionRef.current?.stop() : startListening()} disabled={sending || !canUseSpeech}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {speaking && <Button type="button" variant="outline" size="icon" aria-label="توقف صدا" onClick={stopSpeech}><Square className="h-4 w-4" /></Button>}
          <Button type="submit" size="icon" aria-label="ارسال پیام" disabled={sending || !input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </section>
  );
}
