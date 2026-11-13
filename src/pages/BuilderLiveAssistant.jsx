import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, Square, Volume2, VolumeX, ShieldCheck, Radio, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseConfig } from '@/lib/supabaseConfig';
import { useLanguage, LANGUAGES } from '@/lib/i18n';
import { speakPersian, stopPersianSpeech } from '@/lib/persianPiperTTS';

const FUNCTION_PATH = '/functions/v1/builder-ai-assistant';
const VOICE_FUNCTION_PATH = '/functions/v1/builder-ai-voice-assistant';
const MAX_RECORDING_MS = 120_000;

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

async function speakInLanguage(text, language) {
  const config = VOICE_LANGUAGES[language] || VOICE_LANGUAGES.farsi;
  if (typeof window === 'undefined') throw new Error('خروجی صوتی در این محیط در دسترس نیست.');
  const synth = window.speechSynthesis;
  if (synth && typeof window.SpeechSynthesisUtterance === 'function') {
    const voices = await waitForVoices(synth);
    const prefix = config.tag.split('-')[0].toLowerCase();
    const voice = voices.find(item => item.lang?.toLowerCase() === config.tag.toLowerCase())
      || voices.find(item => item.lang?.toLowerCase().startsWith(prefix + '-'));
    if (voice) {
      synth.cancel();
      await new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = config.tag;
        utterance.voice = voice;
        utterance.rate = 1;
        utterance.onend = resolve;
        utterance.onerror = () => reject(new Error('پخش صدای پاسخ در مرورگر ناموفق بود.'));
        synth.speak(utterance);
      });
      return;
    }
  }
  if (language === 'farsi' || language === 'dari') {
    await speakPersian(text);
    return;
  }
  throw new Error(`صدای زبان ${config.label} روی این گوشی یا مرورگر در دسترس نیست؛ متن پاسخ نمایش داده شده است.`);
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
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechStatus, setSpeechStatus] = useState('idle');
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const maxDurationRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mountedRef = useRef(true);

  const snapshot = useMemo(() => (Array.isArray(projectSnapshot) ? projectSnapshot.slice(0, 100) : []), [projectSnapshot]);
  const supportedLanguageNames = useMemo(() => LANGUAGES.map(item => item.name).join('، '), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, sending, recording]);

  const stopSpeech = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    stopPersianSpeech();
    setSpeaking(false);
    setSpeechStatus('idle');
  }, []);

  const speak = useCallback(async (text, language = lang) => {
    if (!text) return;
    if (!voiceEnabled) {
      setError('صدای پاسخ خاموش است. ابتدا گزینه «صدای پاسخ روشن» را فعال کنید.');
      return;
    }
    setError('');
    setSpeaking(true);
    setSpeechStatus('loading');
    try {
      await speakInLanguage(text, language);
      setSpeaking(false);
      setSpeechStatus('idle');
    } catch (err) {
      setSpeaking(false);
      setSpeechStatus('idle');
      setError(err?.message || 'پخش پاسخ صوتی انجام نشد.');
    }
  }, [voiceEnabled, lang]);

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
      if (data.status === 'not_configured') {
        throw new Error(data.reply || 'سرویس هوش مصنوعی در سرور پیکربندی نشده است. تنظیمات محرمانه سرویس باید در محیط سرور بررسی شود.');
      }
      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || `پاسخ سرور دریافت نشد (کد ${response.status}).`);
      }
      if (data.status !== 'ok') throw new Error(`پاسخ سرور قابل تشخیص نیست (کد ${response.status}).`);
      const reply = typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : 'پاسخ خالی از سرور دریافت شد.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply, language: lang, ts: Date.now() }]);
    } catch (err) {
      setError(err?.message || 'ارتباط با دستیار زنده برقرار نشد.');
    } finally {
      setSending(false);
    }
  }, [messages, sending, role, snapshot, requestSnapshot, lang]);

  const sendVoiceAudio = useCallback(async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 1000) {
      setError('صدای ضبط‌شده خیلی کوتاه یا خالی است. دوباره صحبت کنید.');
      return;
    }
    if (role !== 'creator') {
      setError('این دستیار فقط برای حساب سازنده سیستم فعال است.');
      return;
    }
    const token = getToken();
    if (!token) {
      setError('نشست سازنده پیدا نشد. دوباره وارد پنل سازنده شوید.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const { url, key } = getSupabaseConfig();
      const form = new FormData();
      const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      form.append('audio', audioBlob, `builder-voice.${ext}`);
      form.append('preferredLanguage', lang);
      form.append('context', JSON.stringify(messages.slice(-6).map(item => ({ role: item.role, text: item.text }))));
      form.append('projectSnapshot', JSON.stringify(snapshot));
      form.append('requestSnapshot', JSON.stringify(requestSnapshot));
      const headers = { 'x-app-token': token };
      if (key) { headers.apikey = key; headers.Authorization = `Bearer ${key}`; }
      const response = await fetch(String(url || '').replace(/\/+$/, '') + VOICE_FUNCTION_PATH, {
        method: 'POST',
        headers,
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (data.transcript) {
        setMessages(prev => [...prev, { role: 'user', text: data.transcript, language: data.appLanguage || lang, ts: Date.now() }]);
      }
      if (!response.ok || data.status !== 'ok') {
        throw new Error(data.error || `پردازش گفت‌وگوی صوتی ناموفق بود (کد ${response.status}).`);
      }
      const responseLanguage = data.appLanguage || lang;
      const reply = typeof data.reply === 'string' ? data.reply.trim() : '';
      if (!reply) throw new Error('پاسخ متنی از دستیار دریافت نشد.');
      setMessages(prev => [...prev, { role: 'assistant', text: reply, language: responseLanguage, ts: Date.now() }]);
      if (voiceEnabled) await speak(reply, responseLanguage);
    } catch (err) {
      setError(err?.message || 'پردازش گفت‌وگوی صوتی انجام نشد.');
    } finally {
      setSending(false);
    }
  }, [role, lang, messages, snapshot, requestSnapshot, voiceEnabled, speak]);

  const startRecording = useCallback(async () => {
    if (recording) {
      try { recorderRef.current?.stop(); } catch {}
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder !== 'function') {
      setError('ضبط صوت در این مرورگر پشتیبانی نمی‌شود. لطفاً از مرورگر به‌روز استفاده کنید.');
      return;
    }
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeOptions = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mimeType = mimeOptions.find(type => window.MediaRecorder.isTypeSupported?.(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = event => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError('ضبط صدا با خطا روبه‌رو شد. مجوز و ورودی میکروفون را بررسی کنید.');
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      recorder.onstop = () => {
        if (maxDurationRef.current) window.clearTimeout(maxDurationRef.current);
        maxDurationRef.current = null;
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        if (!mountedRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        void sendVoiceAudio(blob);
      };
      recorderRef.current = recorder;
      recorder.start(300);
      setRecording(true);
      maxDurationRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (err) {
      setRecording(false);
      setError(err?.name === 'NotAllowedError'
        ? 'اجازه استفاده از میکروفون داده نشده است. مجوز میکروفون مرورگر را فعال کنید.'
        : 'میکروفون فعال نشد. اتصال امن سایت و مجوز میکروفون را بررسی کنید.');
    }
  }, [recording, sendVoiceAudio]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
    mountedRef.current = false;
    if (maxDurationRef.current) window.clearTimeout(maxDurationRef.current);
    try { recorderRef.current?.stop(); } catch {}
    streamRef.current?.getTracks?.().forEach(track => track.stop());
    try { window.speechSynthesis?.cancel(); } catch {}
    stopPersianSpeech();
    };
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
          با زدن دکمه گفت‌وگوی صوتی، ضبط فوراً پس از دریافت مجوز میکروفون شروع می‌شود؛ زبان گفتار به‌صورت خودکار از میان زبان‌های برنامه تشخیص داده می‌شود و پاسخ به همان زبان خواهد بود. هر نوبت حداکثر دو دقیقه است. برای تشخیص گفتار، فایل صوتی به سرویس هوش مصنوعی ارسال می‌شود و در جداول مالی A1 ذخیره نمی‌شود. پخش صدای پاسخ به صداهای نصب‌شده روی گوشی یا مرورگر وابسته است؛ فارسی و دری در صورت نبود صدای دستگاه از موتور فارسی موجود استفاده می‌کنند.
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
          <Button type="button" variant={recording ? 'destructive' : 'outline'} className="w-full gap-2" onClick={startRecording} disabled={sending}>
            {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {recording ? 'پایان ضبط و ارسال گفتار' : 'شروع گفت‌وگوی صوتی'}
            {recording && <span className="text-xs opacity-80">· حداکثر ۲ دقیقه</span>}
          </Button>
          {speaking && <Button type="button" variant="outline" className="w-full gap-2" onClick={stopSpeech}><Square className="h-4 w-4" />توقف پخش صدا</Button>}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="یا پیام متنی بنویسید…" disabled={sending || recording} />
            <Button type="submit" size="icon" aria-label="ارسال پیام" disabled={sending || recording || !input.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
