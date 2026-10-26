import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { sendAssistantMessage, MODEL_STATUS } from '@/lib/aiChat';

const WELCOME_TEXT = 'به دستیار هوشمند حساب صراف خوش آمدید. سؤال خود را بنویسید یا با میکروفون بگویید. این دستیار فقط دربارهٔ کار با خود برنامه راهنمایی می‌دهد.';

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [error, setError] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const speak = useCallback((text) => {
    if (!voiceOutput || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      const faVoice = window.speechSynthesis.getVoices().find((v) => /^fa(-|$)/i.test(v.lang));
      if (faVoice) utterance.voice = faVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // پاسخ نوشتاری همچنان موجود است.
    }
  }, [voiceOutput]);

  const sendText = useCallback(async (rawText) => {
    const text = String(rawText || '').trim();
    if (!text || sending) return;
    const context = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text, ts: Date.now() }]);
    setInput('');
    setSending(true);
    setError('');

    let result;
    try {
      result = await sendAssistantMessage(text, { context });
    } catch {
      result = { status: MODEL_STATUS.ERROR, error: 'ارتباط با دستیار برقرار نشد. اتصال اینترنت را بررسی کنید.' };
    }
    setSending(false);

    if (result.status === MODEL_STATUS.NOT_CONFIGURED) {
      setNotConfigured(true);
      if (result.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: result.reply, ts: Date.now() }]);
        speak(result.reply);
      }
      return;
    }
    if (result.status === MODEL_STATUS.ERROR || !result.reply) {
      setError(result.error || 'خطای نامشخص رخ داد.');
      return;
    }
    setNotConfigured(false);
    setMessages((prev) => [...prev, { role: 'assistant', text: result.reply, ts: Date.now() }]);
    speak(result.reply);
  }, [messages, sending, speak]);

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
    setError('');
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
      if (transcript) void sendText(transcript);
      else setError('گفتار تشخیص داده نشد. دوباره امتحان کنید.');
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('اجازهٔ میکروفون داده نشده است. مجوز میکروفون مرورگر را فعال کنید.');
      } else if (event.error === 'no-speech') {
        setError('صدایی شنیده نشد. دوباره روی میکروفون بزنید و صحبت کنید.');
      } else {
        setError('تشخیص گفتار در دسترس نیست. از میکروفون صفحه‌کلید یا نوشتن استفاده کنید.');
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch {
      setListening(false);
      setError('میکروفون شروع نشد. کمی بعد دوباره امتحان کنید.');
    }
  }, [listening, sending, sendText]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }, []);

  const clearConversation = () => {
    if (!window.confirm('گفتگوی همین صفحه پاک شود؟ گفتگو روی سرور یا در پایگاه داده ذخیره نمی‌شود.')) return;
    setMessages([]);
    setError('');
    setNotConfigured(false);
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  };

  const toggleVoice = () => {
    setVoiceOutput((enabled) => {
      if (enabled) {
        try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
      }
      return !enabled;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendText(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">دستیار صوتی حساب صراف</h1>
            <p className="text-[11px] text-muted-foreground truncate">{user?.name || user?.email || 'کاربر'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleVoice} title={voiceOutput ? 'خاموش کردن پاسخ صوتی' : 'روشن کردن پاسخ صوتی'} aria-label="تغییر پاسخ صوتی">
            {voiceOutput ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearConversation} className="text-muted-foreground">پاک‌کردن گفتگو</Button>
        </div>
      </div>

      {notConfigured && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning-foreground/90">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>دستیار هنوز در سرور پیکربندی نشده است. پس از افزودن کلید امن Groq فعال می‌شود.</span>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
            <Bot className="w-10 h-10 opacity-40" />
            <p className="text-sm max-w-xs">{WELCOME_TEXT}</p>
            <Button type="button" variant="outline" onClick={startListening} disabled={sending}>
              {listening ? <MicOff className="w-4 h-4 ml-2" /> : <Mic className="w-4 h-4 ml-2" />}
              {listening ? 'توقف از شنیدن' : 'صحبت کنید'}
            </Button>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.ts + '-' + i} className={'flex ' + (m.role === 'user' ? 'justify-start' : 'justify-end')}>
            <div className={'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ' + (m.role === 'user' ? 'bg-primary text-primary-foreground rounded-bl-sm' : 'bg-muted text-foreground rounded-br-sm')}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /><span>در حال پردازش…</span></div>}
      </div>

      <div className="border-t bg-card px-3 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Button type="button" variant={listening ? 'destructive' : 'outline'} size="icon" onClick={startListening} disabled={sending} aria-label={listening ? 'توقف میکروفون' : 'شروع میکروفون'}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="سؤال خود را بنویسید…" disabled={sending} maxLength={2000} className="flex-1" />
          <Button onClick={() => void sendText(input)} disabled={!input.trim() || sending} size="icon" aria-label="ارسال">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">متن گفتگو فقط تا وقتی این صفحه باز است در حافظه موقت نگهداری می‌شود؛ در پایگاه داده ذخیره نمی‌شود. تشخیص گفتار و صدای پاسخ به قابلیت‌های مرورگر و گوشی وابسته است.</p>
      </div>
    </div>
  );
}
