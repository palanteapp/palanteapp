// The single entry point for looping a sound FILE in the Sound Mixer.
//
// ── Why this file exists ────────────────────────────────────────────────────
// Three previous attempts fixed the loop dropout in the wrong layer. The
// dropout was never a scheduling-jitter problem, so no amount of better
// scheduling could remove it. It was digital silence sitting inside the asset:
//
//   1. scripts/bake-loops.mjs correlation-matches the tail to the head and
//      crossfades, producing a PCM buffer whose end genuinely flows into its
//      start. That part has always worked.
//   2. That PCM is then encoded to AAC. AAC frames are 1024 samples, so the
//      encoder pads the final frame, and the decoder does not reliably strip
//      it. Measured on the shipped assets: up to 24.3ms of pure silence welded
//      onto the end of the file (busy-cafe-3 24.3ms, cat-purring 19.5ms,
//      set-adrift 16.2ms, birdsong 15.2ms, and eleven more above 10ms).
//   3. The runtime then looped on HTMLAudioElement.duration — a number that
//      INCLUDES that padding — so every single wrap crossfaded into silence.
//      That is the dropout, once per loop, on roughly a third of the library.
//
// The manifest already records the exact pre-padding length as `loopSeconds`,
// and seamlessAudio.ts already slices to it. The bug was that SoundMixer
// bypassed both and streamed everything through DualPlayerLoop instead.
//
// ── How looping actually happens now ────────────────────────────────────────
// BUFFER PATH (every file that fits in memory — 33 of the 39 in the library,
// and the ones that wrap often enough for a seam to matter, every 6–190s):
// decode once, slice to exactly `loopSeconds`, hand the AudioBuffer to a
// single AudioBufferSourceNode with `loop = true`. The wrap is then performed
// by the audio rendering thread, sample-exactly, with NO JavaScript involved
// per cycle. There is no timer to drift, no element to stall, no handoff to
// mistime, and no `duration` to be wrong about. It is gapless by construction
// rather than by scheduling, which is the whole point: correctness here is a
// property of the graph, not of how busy the main thread happens to be.
//
// STREAM PATH (the 9 `longform` entries — 8-to-18-minute compositions, far too
// large to hold decoded; 20MB compressed each becomes ~380MB of float32): two
// elements handing off, but with the two things the old engine got wrong made
// right — the deadline comes from `loopSeconds` rather than `duration`, so the
// fade lands on audio instead of on the encoder's padding; and the gain
// automation is ARMED SECONDS AHEAD at an absolute AudioContext time, so
// main-thread jitter between arming and the seam cannot move it. These wrap
// once every 8–18 minutes, so this path runs a few times per session at most.

import { getAudioContext, getMasterLimiter } from './audioGraph';
import { loadSeamlessBuffer } from './seamlessAudio';
import { encodeWav } from './synthSounds';
import { preBakedEntry } from '../constants/bakedLoops';

export type LoopLogEvent =
    | { type: 'mode'; mode: 'buffer' | 'stream'; src: string; loopSeconds: number | null }
    | { type: 'wrap-armed'; atCtxTime: number; loopSeconds: number }
    | { type: 'underrun'; reason: string; readyState: number }
    | { type: 'error'; message: string };

export interface LoopHandle {
    readonly mode: 'buffer' | 'stream';
    setVolume(vol: number, instant?: boolean): void;
    stop(): void;
}

export interface StartLoopOptions {
    src: string;
    volume?: number;
    /** Fade applied when the sound starts and when it is stopped. Not a loop seam fade. */
    entrySec?: number;
    onLog?: (event: LoopLogEvent) => void;
}

/**
 * Overlap used ONLY on the stream path. Deliberately short: the baked file
 * already carries the correlation-matched blend in its head, so a long runtime
 * crossfade would blend an already-blended region a second time and smear it.
 * 60ms is long enough to hide element start-up jitter and short enough to be
 * inaudible on material that is continuous across the seam anyway.
 */
const STREAM_OVERLAP_SEC = 0.06;
/** How far ahead of the seam the stream path primes the next element and arms the ramp. */
const STREAM_ARM_LEAD_SEC = 4.0;

// ── Buffer path ─────────────────────────────────────────────────────────────

class BufferLoop implements LoopHandle {
    readonly mode = 'buffer' as const;
    private source: AudioBufferSourceNode | null = null;
    private gain: GainNode | null = null;
    private volume: number;
    private stopped = false;

    constructor(ctx: AudioContext, buffer: AudioBuffer, volume: number, entrySec: number) {
        this.volume = volume;
        this.gain = ctx.createGain();
        this.gain.gain.value = 0;
        this.gain.connect(getMasterLimiter(ctx));

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        // The buffer was already sliced to exactly `loopSeconds` by
        // loadSeamlessBuffer, so the whole of it IS the loop. Set the bounds
        // explicitly anyway rather than relying on the 0/0 "whole buffer"
        // default, so a future change to the slice can't silently start
        // looping trailing padding again.
        source.loopStart = 0;
        source.loopEnd = buffer.length / buffer.sampleRate;
        source.connect(this.gain);
        source.start(0);
        this.source = source;

        const t = ctx.currentTime;
        this.gain.gain.setValueAtTime(0, t);
        this.gain.gain.linearRampToValueAtTime(volume, t + entrySec);
    }

    setVolume(vol: number, instant = false) {
        this.volume = Math.min(1, Math.max(0, vol));
        const ctx = getAudioContext();
        if (!ctx || !this.gain || this.stopped) return;
        const t = ctx.currentTime;
        this.gain.gain.cancelScheduledValues(t);
        if (instant) {
            this.gain.gain.setValueAtTime(this.volume, t);
        } else {
            this.gain.gain.setValueAtTime(this.gain.gain.value, t);
            this.gain.gain.linearRampToValueAtTime(this.volume, t + 0.3);
        }
    }

    stop() {
        if (this.stopped) return;
        this.stopped = true;
        const ctx = getAudioContext();
        const source = this.source;
        const gain = this.gain;
        this.source = null;
        this.gain = null;
        if (!ctx || !source || !gain) {
            try { source?.stop(); } catch { /* already stopped */ }
            return;
        }
        const t = ctx.currentTime;
        const fade = 0.6;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + fade);
        try { source.stop(t + fade + 0.05); } catch { /* already stopped */ }
        source.onended = () => {
            try { source.disconnect(); gain.disconnect(); } catch { /* already torn down */ }
        };
    }
}

// ── Stream path ─────────────────────────────────────────────────────────────

class StreamLoop implements LoopHandle {
    readonly mode = 'stream' as const;
    private players: HTMLAudioElement[] = [];
    private gains: GainNode[] = [];
    private master: GainNode | null = null;
    private active = 0;
    private armTimer: ReturnType<typeof setTimeout> | null = null;
    private volume: number;
    private stopped = false;
    private token = 0;
    private readonly loopSeconds: number;
    private readonly src: string;
    private readonly log: (e: LoopLogEvent) => void;

    constructor(
        ctx: AudioContext,
        src: string,
        loopSeconds: number,
        volume: number,
        entrySec: number,
        log: (e: LoopLogEvent) => void,
    ) {
        this.src = src;
        this.loopSeconds = loopSeconds;
        this.volume = volume;
        this.log = log;

        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(getMasterLimiter(ctx));

        for (let i = 0; i < 2; i++) {
            const el = new Audio(src);
            el.preload = 'auto';
            el.loop = false;
            el.addEventListener('waiting', () =>
                this.log({ type: 'underrun', reason: 'waiting', readyState: el.readyState }));
            el.addEventListener('stalled', () =>
                this.log({ type: 'underrun', reason: 'stalled', readyState: el.readyState }));
            const g = ctx.createGain();
            g.gain.value = i === 0 ? 1 : 0;
            ctx.createMediaElementSource(el).connect(g);
            g.connect(this.master);
            this.players.push(el);
            this.gains.push(g);
        }

        const t = ctx.currentTime;
        this.master.gain.setValueAtTime(0, t);
        this.master.gain.linearRampToValueAtTime(volume, t + entrySec);

        void this.begin();
    }

    private async begin() {
        const token = ++this.token;
        try {
            await this.players[0].play();
        } catch (e) {
            this.log({ type: 'error', message: `initial play() failed: ${e}` });
            return;
        }
        if (token !== this.token || this.stopped) return;
        this.armNextWrap();
    }

    /**
     * Schedule the next seam. Everything here is measured against
     * `this.loopSeconds` — the baker's exact pre-padding length — and NEVER
     * against element.duration, which includes the AAC encoder's trailing
     * silence and is the reason every previous version faded into a gap.
     */
    private armNextWrap() {
        if (this.stopped) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        const token = this.token;
        const outEl = this.players[this.active];
        const remaining = Math.max(0, this.loopSeconds - outEl.currentTime);
        const armInMs = Math.max(0, (remaining - STREAM_ARM_LEAD_SEC) * 1000);

        if (this.armTimer) clearTimeout(this.armTimer);
        this.armTimer = setTimeout(() => {
            if (token !== this.token || this.stopped) return;
            void this.armWrapNow();
        }, armInMs);
    }

    private async armWrapNow() {
        const ctx = getAudioContext();
        if (!ctx || this.stopped) return;
        const token = this.token;
        const outIdx = this.active;
        const inIdx = outIdx === 0 ? 1 : 0;
        const outEl = this.players[outIdx];
        const inEl = this.players[inIdx];

        // Rewind the incoming element to the loop point and get it buffered
        // while there are still seconds of lead time, so the handoff itself
        // never waits on a decode.
        try {
            inEl.pause();
            inEl.currentTime = 0;
        } catch (e) {
            this.log({ type: 'error', message: `rewind failed: ${e}` });
        }

        // How long until the seam, measured NOW, in audio-clock terms.
        const untilSeam = Math.max(0, this.loopSeconds - outEl.currentTime);
        const startPlayAt = Math.max(0, untilSeam - STREAM_OVERLAP_SEC);

        // Arm the gain automation at an ABSOLUTE AudioContext time. Once these
        // are on the param timeline the audio thread executes them exactly,
        // whatever the main thread is doing between now and then — which is
        // what makes this immune to the jitter the old engine was fighting.
        const seamAt = ctx.currentTime + untilSeam;
        const fadeFrom = seamAt - STREAM_OVERLAP_SEC;
        const outGain = this.gains[outIdx];
        const inGain = this.gains[inIdx];
        outGain.gain.cancelScheduledValues(fadeFrom);
        outGain.gain.setValueAtTime(1, fadeFrom);
        outGain.gain.linearRampToValueAtTime(0, seamAt);
        inGain.gain.cancelScheduledValues(fadeFrom);
        inGain.gain.setValueAtTime(0, fadeFrom);
        inGain.gain.linearRampToValueAtTime(1, seamAt);
        this.log({ type: 'wrap-armed', atCtxTime: seamAt, loopSeconds: this.loopSeconds });

        // Start the incoming element so that its position 0 lines up with the
        // start of the overlap window.
        setTimeout(() => {
            if (token !== this.token || this.stopped) return;
            inEl.play().catch(e => this.log({ type: 'error', message: `wrap play() failed: ${e}` }));
        }, startPlayAt * 1000);

        // Hand over just after the seam, park the outgoing element, and arm the
        // cycle after this one.
        setTimeout(() => {
            if (token !== this.token || this.stopped) return;
            this.active = inIdx;
            try { outEl.pause(); outEl.currentTime = 0; } catch { /* element torn down */ }
            this.armNextWrap();
        }, (untilSeam + 0.05) * 1000);
    }

    setVolume(vol: number, instant = false) {
        this.volume = Math.min(1, Math.max(0, vol));
        const ctx = getAudioContext();
        if (!ctx || !this.master || this.stopped) return;
        const t = ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        if (instant) {
            this.master.gain.setValueAtTime(this.volume, t);
        } else {
            this.master.gain.setValueAtTime(this.master.gain.value, t);
            this.master.gain.linearRampToValueAtTime(this.volume, t + 0.3);
        }
    }

    stop() {
        if (this.stopped) return;
        this.stopped = true;
        this.token++;
        if (this.armTimer) { clearTimeout(this.armTimer); this.armTimer = null; }
        const ctx = getAudioContext();
        const fade = 0.6;
        if (ctx && this.master) {
            const t = ctx.currentTime;
            this.master.gain.cancelScheduledValues(t);
            this.master.gain.setValueAtTime(this.master.gain.value, t);
            this.master.gain.linearRampToValueAtTime(0, t + fade);
        }
        const players = this.players;
        setTimeout(() => {
            for (const el of players) {
                try { el.pause(); el.src = ''; el.load(); } catch { /* already gone */ }
            }
        }, fade * 1000 + 50);
    }
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Start looping `src`. Routes to the sample-exact buffer path whenever the file
 * can be held decoded, and to the streaming path only for the long-form
 * compositions the manifest marks `stream: true`.
 *
 * The `stream` flag is consulted BEFORE any decode is attempted, rather than
 * letting an oversized file discover its own size on the way through
 * decodeAudioData. om-gum and chillax-quatro decode to roughly 380MB and 207MB
 * of float32 respectively; finding that out by allocating it first would spike
 * memory hard enough to get the app killed on an older device.
 */
export async function startLoop(opts: StartLoopOptions): Promise<LoopHandle | null> {
    const { src } = opts;
    const volume = opts.volume ?? 0.5;
    const entrySec = opts.entrySec ?? 1.5;
    const log = opts.onLog ?? (() => {});

    const ctx = getAudioContext();
    if (!ctx) {
        log({ type: 'error', message: 'no AudioContext available' });
        return null;
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

    const entry = preBakedEntry(src);
    const loopSeconds = entry?.loopSeconds ?? null;

    if (!entry?.stream) {
        const buffer = await loadSeamlessBuffer(ctx, src);
        if (buffer) {
            log({ type: 'mode', mode: 'buffer', src, loopSeconds });
            return new BufferLoop(ctx, buffer, volume, entrySec);
        }
        // Unbaked or unexpectedly oversized: fall through to streaming rather
        // than dropping the sound entirely.
        log({ type: 'error', message: `decode unavailable for ${src}; streaming instead` });
    }

    log({ type: 'mode', mode: 'stream', src, loopSeconds });
    // With no manifest length there is nothing trustworthy to wrap against, so
    // fall back to the element's own duration and accept its padding — this
    // only happens for files that are not in the manifest at all.
    const effective = loopSeconds ?? 0;
    if (effective > 0) {
        return new StreamLoop(ctx, src, effective, volume, entrySec, log);
    }
    const el = new Audio(src);
    el.loop = true;
    el.volume = volume;
    await el.play().catch(e => log({ type: 'error', message: `fallback play failed: ${e}` }));
    return {
        mode: 'stream',
        setVolume: (v: number) => { el.volume = Math.min(1, Math.max(0, v)); },
        stop: () => { try { el.pause(); el.src = ''; } catch { /* gone */ } },
    };
}

// ── Background playback ─────────────────────────────────────────────────────
// iOS suspends the AudioContext when the app is hidden, so nothing routed
// through the graph — including the buffer path above — makes a sound once the
// screen locks. Only a plain HTMLAudioElement keeps going, under AVAudioSession.
//
// An element's own `loop = true` is the cleanest wrap available there (the OS
// does it inside the decoder), and it is sample-exact on UNCOMPRESSED audio.
// The reason it was not trusted before is that on an AAC file it wraps at the
// container duration, which includes the encoder's trailing padding — the same
// silence that caused the foreground dropout.
//
// So: re-encode the already-sliced, already-seam-baked AudioBuffer as a PCM
// WAV blob and let the element loop THAT. A WAV has no encoder delay and no
// trailing padding by construction, so `loop = true` on it wraps exactly at
// the baked seam, with no crossfade machinery, no polling timer, and nothing
// for a throttled background timer to miss. This is the same trick the synth
// voices already used for backgrounding; it just never got applied to files.

/**
 * Per-file ceiling on a background WAV blob. Set just above the library's
 * largest bed (autumn-wind, ~42MB) so even the long ones CAN loop gaplessly in
 * the background; the real protection is the total budget below, which means
 * at most one file this size is ever resident. Above this ceiling the caller
 * loops the compressed file instead and keeps its encoder padding at the wrap —
 * a seam once every few minutes is a far better failure than being OOM-killed
 * halfway through the night.
 */
const MAX_BLOB_BYTES = 48_000_000;
/**
 * Total across every cached blob. These are a SECOND full copy of audio that
 * is already sitting in seamlessAudio's decoded-buffer cache, so the two
 * budgets stack: the library's four longest beds (autumn-wind, forest,
 * distant-rain-and-thunder, set-adrift) come to ~408MB of buffer+blob if all
 * four are backgrounded together, which is not survivable on an older device.
 * Bounded and refcounted rather than merely capped per file, because the whole
 * point of backgrounding is that it runs unattended for hours.
 */
const BLOB_BUDGET_BYTES = 64_000_000;

interface BlobEntry {
    url: string;
    bytes: number;
    lastUsed: number;
    /** Live BackgroundLoop instances holding this URL. Never evict above zero. */
    refs: number;
}

const blobs = new Map<string, BlobEntry>();
const blobJobs = new Map<string, Promise<string | null>>();
let blobBytes = 0;

function evictBlobs(incoming: number) {
    if (blobBytes + incoming <= BLOB_BUDGET_BYTES) return;
    const idleFirst = [...blobs.entries()]
        .filter(([, e]) => e.refs === 0)
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    for (const [src, e] of idleFirst) {
        if (blobBytes + incoming <= BLOB_BUDGET_BYTES) break;
        URL.revokeObjectURL(e.url);
        blobs.delete(src);
        blobBytes -= e.bytes;
    }
}

/**
 * Take a reference to a gaplessly-loopable PCM WAV for a library file, or null
 * when the file streams, would exceed a budget, or cannot be decoded — in which
 * case the caller must fall back to looping the compressed file and accept its
 * padding at the wrap.
 *
 * Every successful acquire MUST be paired with releaseFileLoopBlob(src) when
 * the player stops, or the entry pins its bytes for the life of the session.
 */
export function acquireFileLoopBlob(src: string): Promise<string | null> {
    const hit = blobs.get(src);
    if (hit) {
        hit.lastUsed = Date.now();
        hit.refs++;
        return Promise.resolve(hit.url);
    }
    const running = blobJobs.get(src);
    if (running) return running;

    const job = (async (): Promise<string | null> => {
        try {
            const entry = preBakedEntry(src);
            if (entry?.stream) return null;
            const ctx = getAudioContext();
            if (!ctx) return null;
            const buffer = await loadSeamlessBuffer(ctx, src);
            if (!buffer) return null;

            const bytes = 44 + buffer.length * buffer.numberOfChannels * 2;
            if (bytes > MAX_BLOB_BYTES) return null;
            evictBlobs(bytes);
            // Still no room even after evicting everything idle: the sounds
            // currently backgrounded already fill the budget.
            if (blobBytes + bytes > BLOB_BUDGET_BYTES) return null;

            // A second acquire may have completed while this one awaited.
            const raced = blobs.get(src);
            if (raced) {
                raced.lastUsed = Date.now();
                raced.refs++;
                return raced.url;
            }

            const channels: Float32Array[] = [];
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                channels.push(buffer.getChannelData(c));
            }
            const url = URL.createObjectURL(encodeWav(channels, buffer.sampleRate));
            blobs.set(src, { url, bytes, lastUsed: Date.now(), refs: 1 });
            blobBytes += bytes;
            return url;
        } catch {
            return null;
        } finally {
            blobJobs.delete(src);
        }
    })();

    blobJobs.set(src, job);
    return job;
}

/** Drop a reference taken by acquireFileLoopBlob, making the entry evictable again. */
export function releaseFileLoopBlob(src: string): void {
    const entry = blobs.get(src);
    if (entry && entry.refs > 0) entry.refs--;
}
