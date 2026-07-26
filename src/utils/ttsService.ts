/**
 * Text-to-Speech for the Palante partner.
 *
 * DESIGN: three cost-control layers, all invisible to the user:
 *   1. On-demand only. Audio is synthesized when the user taps to hear a reply,
 *      never automatically. No tap, no cost.
 *   2. Session cache. Re-tapping the same message replays cached audio for free.
 *   3. Monthly backstop. Past TTS_MONTHLY_MINUTE_LIMIT (see aiUsageBudget), paid
 *      synthesis stops and we fall back to the free on-device iOS voice, the
 *      partner still speaks, the metered OpenAI bill does not grow.
 *
 * The free on-device voice is also the fallback for any error (offline, proxy
 * down, missing key), so "tap to hear" never just fails silently.
 */

import { isTtsLimitReached, recordTtsUsage } from './aiUsageBudget';
import { isAIEnabled } from './aiGate';

const TTS_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts-proxy`;

/** Warm, friend-like voice. Must be in the proxy's ALLOWED_VOICES set. */
export const PARTNER_VOICE = 'nova';

const VOICE_INSTRUCTIONS =
  'You are a warm, caring friend. Speak naturally and conversationally. Vary your intonation the way a real person does, pause slightly between thoughts, and never sound flat or mechanical. Tone: supportive, genuine, unhurried. No robotic cadence.';

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

let currentAudio: HTMLAudioElement | null = null;
let deviceSpeaking = false;
let audioUnlocked = false;

/** Session-scoped cache: voice+text hash → object URL of synthesized audio. */
const audioCache = new Map<string, string>();

/**
 * iOS WKWebView blocks audio.play() after any await (the gesture context expires).
 * Calling this synchronously inside a user-gesture handler, before the first await
 * plays a silent 1-sample buffer through AudioContext, which permanently unlocks
 * HTMLAudioElement playback for the rest of the session.
 */
function unlockAudio(): void {
  if (audioUnlocked || typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx() as AudioContext;
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlocked = true;
  } catch { /* ignore */ }
}

/** djb2: cheap stable hash so identical replies reuse cached audio. */
function hashText(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Returning null routes speak() to the free on-device voice. That is also how the
// AI opt-out is honored here: cloud synthesis sends the partner's text to OpenAI,
// so a user who turned AI off gets the device voice instead, nothing leaves the phone.
function getProxyHeaders(): HeadersInit | null {
  if (!isAIEnabled()) return null;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) return null;
  return { 'content-type': 'application/json', apikey: anonKey };
}

export function isSpeaking(): boolean {
  return currentAudio !== null || deviceSpeaking;
}

/** Stop whatever is currently playing (cloud audio or device voice). */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (deviceSpeaking) {
    deviceSpeaking = false;
    import('@capacitor-community/text-to-speech')
      .then(({ TextToSpeech }) => TextToSpeech.stop())
      .catch(() => {});
  }
}

/** Free on-device voice, the fallback path. Uses Web Speech API with the best
 *  available enhanced voice on iOS (sounds far more natural than Capacitor TTS). */
async function speakOnDevice(text: string, cb?: SpeakCallbacks): Promise<void> {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  if (synth) {
    return new Promise((resolve) => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'en-US';
      utt.rate = 0.9;   // Slightly slower reads more naturally
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const applyVoice = () => {
        const voices = synth.getVoices();
        // Preference order: enhanced local > any local > any English > first available
        const best =
          voices.find(v => v.lang.startsWith('en') && v.localService && /enhanced|premium/i.test(v.name)) ||
          voices.find(v => v.lang.startsWith('en') && v.localService) ||
          voices.find(v => v.lang.startsWith('en')) ||
          voices[0];
        if (best) utt.voice = best;
      };

      // Voices may not be populated yet on first call
      if (synth.getVoices().length > 0) {
        applyVoice();
      } else {
        synth.addEventListener('voiceschanged', applyVoice, { once: true });
      }

      deviceSpeaking = true;
      cb?.onStart?.();

      utt.onend = () => { deviceSpeaking = false; cb?.onEnd?.(); resolve(); };
      utt.onerror = () => { deviceSpeaking = false; cb?.onError?.(); resolve(); };

      synth.cancel();
      synth.speak(utt);
    });
  }

  // Last-resort: Capacitor TTS (most robotic, only if Web Speech is unavailable)
  try {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    deviceSpeaking = true;
    cb?.onStart?.();
    await TextToSpeech.speak({ text, lang: 'en-US', rate: 0.9, pitch: 1.0, volume: 1.0, category: 'playback' });
    deviceSpeaking = false;
    cb?.onEnd?.();
  } catch (err) {
    deviceSpeaking = false;
    cb?.onError?.(err);
  }
}

/** Play an audio URL, optionally metering its duration against the backstop. */
function playUrl(url: string, meter: boolean, cb?: SpeakCallbacks): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    let metered = false;

    audio.onloadedmetadata = () => {
      if (meter && !metered && Number.isFinite(audio.duration)) {
        recordTtsUsage(audio.duration);
        metered = true;
      }
    };
    audio.onplay = () => cb?.onStart?.();
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      cb?.onEnd?.();
      resolve();
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      cb?.onError?.();
      resolve();
    };
    audio.play().catch((err) => {
      if (currentAudio === audio) currentAudio = null;
      cb?.onError?.(err);
      resolve();
    });
  });
}

/**
 * Speak a partner reply aloud. Resolves when playback finishes.
 * Only one utterance plays at a time: a new call interrupts the previous.
 */
export async function speak(text: string, cb?: SpeakCallbacks): Promise<void> {
  // Must be called before any await: unlocks audio.play() on iOS WKWebView.
  unlockAudio();
  stopSpeaking();
  const clean = text.trim();
  if (!clean) return;

  const key = `${PARTNER_VOICE}:${hashText(clean)}`;

  // 1. Cached → replay free (already metered on first synth).
  const cached = audioCache.get(key);
  if (cached) {
    await playUrl(cached, false, cb);
    return;
  }

  // 2. Over the monthly paid ceiling → free device voice.
  if (isTtsLimitReached()) {
    await speakOnDevice(clean, cb);
    return;
  }

  // 3. Paid path → synthesize via the proxy, cache, meter, play.
  const headers = getProxyHeaders();
  if (!headers) {
    await speakOnDevice(clean, cb);
    return;
  }

  try {
    const res = await fetch(TTS_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input: clean, voice: PARTNER_VOICE, instructions: VOICE_INSTRUCTIONS }),
    });
    if (!res.ok) {
      await speakOnDevice(clean, cb);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioCache.set(key, url);
    await playUrl(url, true, cb);
  } catch (err) {
    // Network / offline → free device voice so tapping never just fails.
    await speakOnDevice(clean, cb);
    void err;
  }
}
