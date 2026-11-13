import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, Square, Volume2, VolumeX, ShieldCheck, Radio, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseConfig } from '@/lib/supabaseConfig';
import { useLanguage, LANGUAGES } from '@/lib/i18n';
import { speakPersian, stopPersianSpeech } from '@/lib/persianPiperTTS';

const FUNCTION_PATH = '/functions/v1/builder-ai-assistant';

const VOICE_LANGUAGES = {
  farsi: { tag: 'fa-IR', match: ['fa'], label: 'فارسی' },
  dari: { tag: 'fa-AF', match: ['fa'], label: 'دری' },
  pashto: { tag: 'ps-AF', match: ['ps'], label: 'پښتو' },
  uzbek: { tag: 'uz-UZ', match: ['uz'], label: "O'zbekcha" },
  english: { tag: 'en-US', match: ['en'], label: 'English' },
  turkish: { tag: 'tr-TR', match: ['tr'], label: 'Türkçe' },
  arabic: { tag: 'ar-SA', match: ['ar'], label: 'العربية' },
};

function getToken() {
  try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
}

function waitForVoices(synth) {
  const current = synth.getVoices();
  if (current.length) return Promise.resolve(current);
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', finish);
      resolve(synth.getVoices());
    };
    const timer = window.setTimeout(finish, 1200);
    synth.addEventListener?.('voiceschanged', finish, { once: true });
  });
}

async function speakInLanguage(text, language, onPlaybackStart = () => {}) {
  const config = VOICE_LANGUAGES[language] || VOICE_LANGUAGES.farsi;
  if (typeof window === 'undefined') throw new Error('خروجی صوتی در این محیط در دسترس نیست.');

  if (language === 'farsi' || language === 'dari') {
    try {
      await speakPersian(text, status => { if (status === 'playing') onPlaybackStart(); });
      return;
    } catch {
      // Fall back to an installed browser voice if the local Piper model cannot start.
    }
  }

  const synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
    throw new Error(`صدای زبان ${config.label} در این مرورگر در دسترس نیست؛ متن پاسخ نمایش داده شده است.`);
  }
  const voices = await waitForVoices(synth);
  const prefix = config.tag.split('-')[0].toLowerCase();
  const voice = voices.find(item => item.lang?.toLowerCase() === config.tag.toLowerCase())
    || voices.find(item => item.lang?.toLowerCase().startsWith(prefix + '-'));
  if (!voice) throw new Error(`صدای زبان ${config.label} روی این گوشی یا مرورگر نصب نیست؛ متن پاسخ نمایش داده شده است.`);
  synth.cancel();
  await new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.tag;
    utterance.voice = voice;
    utterance.rate = 1;
    utterance.onstart = onPlaybackStart;
    utterance.onend = resolve;
    utterance.onerror = () => reject(new Error('پخش صدای پاسخ در مرورگر ناموفق بود.'));
    synth.speak(utterance);
  });
}

export default function BuilderLiveAssistant({ projectSnapshot = [], requestSnapshot = null, role }) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'سلام. من دستیار زنده و محرمانه پنل سازنده هستم. می‌توانم درباره وضعیت بخش‌های ثبت‌شده در پنل، موارد تکمیل‌شده یا غیرفعال و اطلاعاتی که به‌صورت امن در اختیارم قرار گرفته گزارش بدهم. عملیات مالی یا تغییر تنظیمات انجام نمی‌دهم.',
    language: lang,
    ts: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechStatus, setSpeechStatus] = useState('idle');
  const [error, setError] = useState('');
  const [timing, setTiming] = useState({ phase: 'idle', label: '', startedAt: 0, elapsedMs: 0, responseMs: null, playbackMs: null });
  const [timingNow, setTimingNow] = useState(0);
  const timingStartRef = useRef(0);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const snapshot = useMemo(() => (Array.isArray(projectSnapshot) ? projectSnapshot.slice(0, 100) : []), [projectSnapshot]);
  const supportedLanguageNames = useMemo(() => LANGUAGES.map(item => item.name).join('، '), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, sending, listening]);

  useEffect(() => {
    if (timing.phase !== 'waiting' || !timing.startedAt) return undefined;
    const update = () => setTimingNow(performance.now());
    update();
    const timer = window.setInterval(update, 10);
    return () => window.clearInterval(timer);
  }, [timing.phase, timing.startedAt]);

  const formatElapsed = value => `${(Math.max(0, value) / 1000).toFixed(2)} ثانیه`;
  const beginTiming = (label, responseMs = null) => {
    const startedAt = performance.now();
    timingStartRef.current = startedAt;
    setTiming({ phase: 'waiting', label, startedAt, elapsedMs: 0, responseMs, playbackMs: null });
    setTimingNow(startedAt);
  };
  const finishTiming = (key, value) => {
    setTiming(previous => ({ ...previous, phase: 'done', elapsedMs: value, [key]: value }));
  };

  const stopSpeech = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    stopPersianSpeech();
    setSpeaking(false);
    setSpeechStatus('idle');
  }, []);

  const speak = useCallback(async (text, language = lang, previousResponseMs = null) => {
    if (!text) return;
    if (!voiceEnabled) {
      setError('صدای پاسخ خاموش است. ابتدا گزینه «صدای پاسخ روشن» را فعال کنید.');
      return;
    }
    setError('');
    beginTiming('آماده‌شدن پخش صدا', previousResponseMs);
    setSpeaking(true);
    setSpeechStatus('loading');
    let playbackStarted = false;
    const onPlaybackStart = () => {
      if (playbackStarted) return;
      playbackStarted = true;
      const elapsed = performance.now() - timingStartRef.current;
      setTiming(previous => ({ ...previous, phase: 'playing', elapsedMs: elapsed, playbackMs: elapsed }));
    };
    try {
      await speakInLanguage(text, language, onPlaybackStart);
      if (!playbackStarted) onPlaybackStart();
      setSpeaking(false);
      setSpeechStatus('idle');
      setTiming(previous => ({ ...previous, phase: 'done' }));
    } catch (err) {
      setSpeaking(false);
      setSpeechStatus('idle');
      setTiming(previous => ({ ...previous, phase: 'error', elapsedMs: performance.now() - timingStartRef.current }));
      setError(err?.message || 'پخش پاسخ صوتی انجام نشد.');
    }
  }, [voiceEnabled, lang]);

  const sendMessage = useCallback(async (rawText, speakReply = false) => {
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
    beginTiming('دریافت پاسخ متنی');
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
      if (data.status === 'not_configured') {
        throw new Error(data.reply || 'سرویس هوش مصنوعی در سرور پیکربندی نشده است. تنظیمات محرمانه سرویس باید در محیط سرور بررسی شود.');
      }
      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || `پاسخ سرور دریافت نشد (کد ${response.status}).`);
      }
      if (data.status !== 'ok') throw new Error(`پاسخ سرور قابل تشخیص نیست (کد ${response.status}).`);
      const reply = typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : 'پاسخ خالی از سرور دریافت شد.';
      const responseMs = performance.now() - timingStartRef.current;
      finishTiming('responseMs', responseMs);
      setMessages(prev => [...prev, { role: 'assistant', text: reply, language: lang, ts: Date.now() }]);
      if (speakReply && voiceEnabled) await speak(reply, lang, responseMs);
    } catch (err) {
      setTiming(previous => ({ ...previous, phase: 'error', elapsedMs: performance.now() - timingStartRef.current }));
      setError(err?.message || 'ارتباط با دستیار زنده برقرار نشد.');
    } finally {
      setSending(false);
    }
  }, [messages, sending, role, snapshot, requestSnapshot, lang, voiceEnabled, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود. می‌توانید پیام را تایپ کنید.');
      return;
    }
    try {
      recognitionRef.current?.stop();
      const recognition = new SpeechRecognition();
      recognition.lang = (VOICE_LANGUAGES[lang] || VOICE_LANGUAGES.farsi).tag;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = event => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) void sendMessage(transcript, true);
        else setError('گفتاری تشخیص داده نشد؛ دوباره تلاش کنید.');
      };
      recognition.onerror = event => {
        const message = event.error === 'not-allowed'
          ? 'اجازه میکروفون داده نشده است. مجوز میکروفون مرورگر را فعال کنید.'
          : event.error === 'no-speech'
            ? 'صدایی تشخیص داده نشد؛ دوباره صحبت کنید.'
            : 'تشخیص گفتار در مرورگر ناموفق بود؛ می‌توانید پیام را تایپ کنید.';
        setError(message);
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setError('');
    } catch {
      setListening(false);
      setError('میکروفون شروع نشد. مجوز میکروفون و پشتیبانی مرورگر را بررسی کنید.');
    }
  }, [sendMessage, lang]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    stopPersianSpeech();
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
            <p className="text-xs text-muted-foreground">ویژه حساب سازنده · چندزبانه · فقط‌خواندنی</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700"><Radio className="h-3 w-3" /> اختصاصی</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded-lg bg-muted p-3"><ShieldCheck className="mb-1 h-4 w-4 text-primary" />دسترسی محدود به سازنده</div>
          <div className="rounded-lg bg-muted p-3"><Bot className="mb-1 h-4 w-4 text-primary" />گزارش بر پایه snapshot پنل</div>
          <div className="rounded-lg bg-muted p-3"><Volume2 className="mb-1 h-4 w-4 text-primary" />گفت‌وگوی صوتی در زبان‌های برنامه</div>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          با زدن دکمه گفت‌وگوی صوتی، مرورگر گفتار را به متن تبدیل می‌کند و متن برای همان دستیار سازنده ارسال می‌شود. زبان تشخیص گفتار مطابق زبان انتخاب‌شده در برنامه است. فارسی و دری ابتدا با موتور Piper داخل برنامه خوانده می‌شوند؛ زبان‌های دیگر به صدای نصب‌شده در مرورگر یا گوشی نیاز دارند. پشتیبانی تشخیص گفتار به مرورگر و اتصال اینترنت وابسته است.
        </p>
        <p className="text-[11px] text-muted-foreground">زبان‌های برنامه: {supportedLanguageNames}</p>
      </div>

      <div className="flex min-h-[360px] flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-semibold">گفت‌وگو با دستیار سازنده</div>
          <Button type="button" variant="outline" size="sm" onClick={() => setVoiceEnabled(v => !v)} className="gap-2">
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceEnabled ? 'پاسخ صوتی روشن' : 'پاسخ صوتی خاموش'}
          </Button>
        </div>
        <div className="border-b bg-muted/30 px-3 py-2 text-xs space-y-1">
          {timing.phase === 'waiting' && <div className="flex items-center justify-between gap-2"><span>{timing.label}…</span><strong className="tabular-nums">{formatElapsed((timingNow || performance.now()) - timing.startedAt)}</strong></div>}
          {timing.phase === 'playing' && <div className="flex items-center justify-between gap-2"><span>صدا در حال پخش است · زمان شروع پخش</span><strong className="tabular-nums">{formatElapsed(timing.playbackMs ?? timing.elapsedMs)}</strong></div>}
          {(timing.phase === 'done' || timing.phase === 'error') && <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {timing.responseMs !== null && <span>آماده‌شدن پاسخ: <strong className="tabular-nums">{formatElapsed(timing.responseMs)}</strong></span>}
            {timing.playbackMs !== null && <span>شروع پخش صدا: <strong className="tabular-nums">{formatElapsed(timing.playbackMs)}</strong></span>}
            {timing.responseMs === null && timing.playbackMs === null && <span>{timing.label}: <strong className="tabular-nums">{formatElapsed(timing.elapsedMs)}</strong></span>}
          </div>}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {messages.map((item, index) => (
            <div key={item.ts + '-' + index} className={item.role === 'user' ? 'mr-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-primary p-3 text-sm text-primary-foreground' : 'ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-muted p-3 text-sm leading-7'}>
              <div className="mb-1 text-[10px] opacity-70">{item.role === 'user' ? 'شما' : 'دستیار زنده سازنده'}{item.language && item.role === 'assistant' ? ` · ${VOICE_LANGUAGES[item.language]?.label || ''}` : ''}</div>
              <div className="whitespace-pre-wrap">{item.text}</div>
              {item.role === 'assistant' && (
                <div className="mt-2 flex justify-start">
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs" onClick={() => speak(item.text, item.language || lang)} disabled={!voiceEnabled || speechStatus === 'loading'}>
                    <Volume2 className="h-3.5 w-3.5" /> {speechStatus === 'loading' ? 'آماده‌سازی صدا…' : 'پخش پاسخ با صدا'}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {sending && <div className="text-xs text-muted-foreground">دستیار در حال بررسی و پاسخ‌گویی است…</div>}
          <div ref={messagesEndRef} />
        </div>
        {error && <div role="alert" className="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <div className="border-t p-3 space-y-2">
          <Button type="button" variant={listening ? 'destructive' : 'outline'} className="w-full gap-2" onClick={() => listening ? recognitionRef.current?.stop() : startListening()} disabled={sending}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? 'پایان گوش‌دادن' : 'شروع گفت‌وگوی صوتی'}
          </Button>
          {speaking && <Button type="button" variant="outline" className="w-full gap-2" onClick={stopSpeech}><Square className="h-4 w-4" />توقف پخش صدا</Button>}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="یا پیام متنی بنویسید…" disabled={sending || listening} />
            <Button type="submit" size="icon" aria-label="ارسال پیام" disabled={sending || listening || !input.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
