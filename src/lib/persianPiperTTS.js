// Pinned Persian Piper WebAssembly runtime and model bundle.
// The upstream bundle is ~81 MB, so keep it off the Pages deployment artifact
// and fetch it from its immutable upstream Git commit instead.
// Upstream project: gyroing/Persian-Piper-TTS-WebAssembly (MIT).
// Production deployment bundles the pinned Piper runtime into public/tts.
const ASSET_BASE = '/tts';
let enginePromise = null;
let engine = null;
let audioContext = null;
let activeSource = null;

function loadClassicScript(file) {
  return new Promise((resolve, reject) => {
    const src = `${ASSET_BASE}/${file}?v=20261113-4`;
    const existing = document.querySelector(`script[data-persian-piper="${file}"]`);
    if (existing?.dataset.loaded === 'true') return resolve();
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => { existing.remove(); reject(new Error(`بارگذاری فایل ${file} ناموفق بود؛ اتصال یا دسترسی مرورگر به فایل را بررسی کنید.`)); }, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.persianPiper = file;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => { script.remove(); reject(new Error(`دریافت فایل ${file} از سایت حساب صراف ناموفق بود.`)); };
    document.head.appendChild(script);
  });
}

async function loadEngine() {
  if (engine) return engine;
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    if (typeof window === 'undefined') throw new Error('این محیط از موتور گفتار پشتیبانی نمی‌کند.');
    if (window.Module && !window.Module.__persianPiper) {
      throw new Error('یک موتور WebAssembly دیگر در صفحه فعال است؛ برای جلوگیری از تداخل، موتور فارسی بارگذاری نشد.');
    }

    let resolveRuntime;
    let rejectRuntime;
    let runtimeTimer;
    const runtimeReady = new Promise((resolve, reject) => {
      runtimeTimer = window.setTimeout(() => reject(new Error('دریافت مدل صدای فارسی بیش از حد طول کشید؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.')), 180000);
      resolveRuntime = () => { window.clearTimeout(runtimeTimer); resolve(); };
      rejectRuntime = (error) => { window.clearTimeout(runtimeTimer); reject(error); };
    });

    window.Module = {
      __persianPiper: true,
      locateFile: (path) => `${ASSET_BASE}/${path}`,
      onRuntimeInitialized: resolveRuntime,
      onAbort: () => rejectRuntime(new Error('راه‌اندازی موتور گفتار فارسی متوقف شد.')),
    };

    await loadClassicScript('sherpa-onnx.js');
    await loadClassicScript('sherpa-onnx-wasm-main.js');
    await runtimeReady;

    if (typeof window.initSherpaOnnxOfflineTts !== 'function') {
      throw new Error('رابط موتور گفتار فارسی بارگذاری نشد.');
    }
    engine = window.initSherpaOnnxOfflineTts();
    if (!engine || engine.numSpeakers < 1) throw new Error('مدل صدای فارسی آماده نیست.');
    return engine;
  })().catch((error) => {
    enginePromise = null;
    throw error;
  });

  return enginePromise;
}

function splitPersianText(value) {
  const cleaned = String(value || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[\t ]+/g, ' ')
    .trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^.!?؟؛。\n]+[.!?؟؛。\n]*/g) || [cleaned];
  const chunks = [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 420) chunks.push(trimmed);
    else {
      for (let i = 0; i < trimmed.length; i += 420) chunks.push(trimmed.slice(i, i + 420));
    }
  }
  return chunks;
}

export async function speakPersian(text, onStatus = () => {}) {
  const chunks = splitPersianText(text);
  if (!chunks.length) throw new Error('متنی برای خواندن وجود ندارد.');

  onStatus('loading');
  const tts = await loadEngine();
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('مرورگر این گوشی خروجی صوتی لازم را پشتیبانی نمی‌کند.');
    audioContext = new AudioContextClass({ sampleRate: tts.sampleRate });
  }
  await audioContext.resume();
  if (activeSource) {
    try { activeSource.stop(); } catch {}
    activeSource = null;
  }

  onStatus('generating');
  const buffers = [];
  let totalLength = 0;
  for (let index = 0; index < chunks.length; index += 1) {
    const result = tts.generate({ text: chunks[index], sid: 0, speed: 0.94 });
    if (!result?.samples?.length) continue;
    buffers.push(result.samples);
    totalLength += result.samples.length;
    const silenceLength = Math.round(result.sampleRate * 0.12);
    if (index < chunks.length - 1) {
      buffers.push(new Float32Array(silenceLength));
      totalLength += silenceLength;
    }
  }
  if (!totalLength) throw new Error('موتور نتوانست از این متن صدای قابل پخش تولید کند.');

  const samples = new Float32Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    samples.set(buffer, offset);
    offset += buffer.length;
  }

  const audioBuffer = audioContext.createBuffer(1, samples.length, tts.sampleRate);
  audioBuffer.copyToChannel(samples, 0);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  activeSource = source;

  await new Promise((resolve, reject) => {
    source.onended = () => {
      if (activeSource === source) activeSource = null;
      onStatus('idle');
      resolve();
    };
    try {
      source.start(0);
      onStatus('playing');
    } catch (error) {
      activeSource = null;
      onStatus('idle');
      reject(error);
    }
  });
}

export function stopPersianSpeech() {
  if (activeSource) {
    try { activeSource.stop(); } catch {}
    activeSource = null;
  }
  onStopped();
}

function onStopped() {
  // Playback state is reset by the component when the stop button is pressed.
}
