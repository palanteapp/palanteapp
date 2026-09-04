// The single entry point for looping a sound FILE in the Sound Mixer.
//
// ── One path ────────────────────────────────────────────────────────────────
// Decode the file once, slice it to the manifest's `loopSeconds`, and hand the
// AudioBuffer to a single AudioBufferSourceNode with `loop = true`. The wrap is
// performed by the audio rendering thread, sample-exactly, with NO JavaScript
// per cycle. There is no timer to drift, no element to stall, no handoff to
// mistime and no `duration` to be wrong about. It is gapless by construction
// rather than by scheduling: correctness is a property of the graph, not of how
// busy the main thread happens to be.
//
// Below it sits a plain looping HTMLAudioElement, kept ONLY as a safety net for
// a file that fails to decode. It wraps at the container duration and so keeps
// the encoder's padding at the seam - a poor loop, but far better than a sound
// that never plays at all.
//
// ── What used to be here, and why it is gone ────────────────────────────────
// A second "stream" path ran nine long-form pieces through two HTMLAudioElements
// handing off across a 60ms crossfade, because those files were 8 to 18 minutes
// long and could not be held decoded (om-gum alone was ~380MB of float32). It
// carried a race that could not be tuned away: the incoming element was started
// 60ms before the seam, while the outgoing element's gain ramp was ALREADY
// committed on the audio thread to reach zero at that instant. Any decode
// latency above 60ms - routine in WKWebView after a seek on a 20MB file - was
// an audible hole, and nothing verified the incoming element was producing
// samples before the outgoing one was silenced.
//
// It is gone because the reason for it is gone. Every long-form piece is now
// baked to a 19-105 second loop, so the whole library fits in memory. See
// `targetSec` in loopManifest.json and findBestLoopWindow() in bake-loops.mjs.
//
// ── The asset-level bug this file was built around ──────────────────────────
// bake-loops.mjs correlation-matches a track's tail to its head and crossfades,
// producing PCM whose end genuinely flows into its start. That PCM is then
// encoded to AAC, whose 1024-sample frames mean the encoder pads the final
// frame and the decoder does not reliably strip it. An engine that loops on
// HTMLAudioElement.duration - which INCLUDES that padding - crossfades into
// silence every cycle.
//
// ANYTHING THAT COMPUTES A LOOP BOUNDARY FROM `.duration` IS WRONG. The
// manifest's `loopSeconds` is the only trustworthy length.
//
// ── And the bug that was NOT here ───────────────────────────────────────────
// Five rewrites of this file chased a ~1s dropout that was never in it. Buffer
// wraps happen on the render thread with no JS involved, and the dropout hit
// sounds whose loop lengths differ by 5x at the same felt rhythm, which no
// seam-synchronised fault can do. The causes were global to the graph:
// unhandled AVAudioSession interruptions (PalanteAudioBridge.swift) and memory
// pressure from oversized decoded buffers. Before changing anything here in
// response to a dropout report, measure it - audioWatchdog.ts and
// scripts/analyze-capture.mjs exist for exactly that.

import { Capacitor } from '@capacitor/core';
import { getAudioContext, getMasterLimiter } from './audioGraph';
import { loadSeamlessBuffer } from './seamlessAudio';
import { encodeWav } from './synthSounds';
import { preBakedEntry } from '../constants/bakedLoops';
import { PalanteAudioBridge } from '../plugins/PalanteAudioBridge';

export type LoopLogEvent =
    | { type: 'mode'; mode: 'buffer' | 'element' | 'native'; src: string; loopSeconds: number | null }
    | { type: 'underrun'; reason: string; readyState: number }
    | { type: 'error'; message: string };

export interface LoopHandle {
    readonly mode: 'buffer' | 'element' | 'native';
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

// ── Native path (iOS) ───────────────────────────────────────────────────────

/**
 * Routes a loop through PalanteNativeLoopEngine's AVAudioEngine instead of
 * Web Audio API. See PalanteNativeLoopEngine.swift for the full reasoning:
 * WKWebView's own Web Audio implementation has a documented history of
 * silently stalling on iOS (WebKit bug 237878; multiple Apple Developer
 * Forum reports of AudioContexts freezing after ~27s backgrounded and
 * sometimes never resuming) independent of anything in this file or in
 * PalanteAudioBridge's session handling. A native AVAudioEngine is a
 * separate audio unit, not subject to that failure mode.
 */
class NativeLoop implements LoopHandle {
    readonly mode = 'native' as const;
    private stopped = false;
    private readonly id: string;
    constructor(id: string) {
        this.id = id;
    }

    setVolume(vol: number) {
        if (this.stopped) return;
        const clamped = Math.min(1, Math.max(0, vol));
        PalanteAudioBridge.setNativeLoopVolume({ id: this.id, volume: clamped }).catch(() => {});
    }

    stop() {
        if (this.stopped) return;
        this.stopped = true;
        PalanteAudioBridge.stopNativeLoop({ id: this.id }).catch(() => {});
    }
}

function isIOSNative(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Start looping `src`.
 *
 * On iOS native, this routes through PalanteNativeLoopEngine (AVAudioEngine)
 * first, falling back to the Web Audio path below only if that fails to
 * start (e.g. the file is missing from the bundle). On web/Android it always
 * uses the Web Audio path.
 *
 * The Web Audio path: decode the file, slice it to the manifest's
 * `loopSeconds`, and hand it to an AudioBufferSourceNode with `loop = true`.
 * The wrap is then performed by the audio rendering thread, sample-exactly,
 * with no JavaScript per cycle - nothing to drift, nothing to mistime,
 * nothing for a busy main thread to miss.
 *
 * The two-element streaming crossfade that used to sit alongside it is gone.
 * It existed only because nine long-form pieces were 8 to 18 minutes long and
 * could not be held decoded (om-gum alone was ~380MB of float32). Those are now
 * baked to 19-105 second loops, so every file in the library fits in memory and
 * the streaming path had nothing left to serve. Deleting it removes its
 * handoff race outright: the incoming element was started 60ms before the seam
 * while the outgoing element's gain ramp was already committed to reach zero
 * there, so any decode latency above 60ms - routine in WKWebView after a seek -
 * was an audible hole.
 *
 * What remains below the buffer path is a plain looping element, kept only as a
 * safety net for a file that fails to decode at all. It wraps at the container
 * duration and so carries the encoder's padding at the seam, which is a poor
 * loop but a much better outcome than a sound that simply never plays.
 */
export async function startLoop(opts: StartLoopOptions): Promise<LoopHandle | null> {
    const { src } = opts;
    const volume = opts.volume ?? 0.5;
    const entrySec = opts.entrySec ?? 1.5;
    const log = opts.onLog ?? (() => {});

    const entry = preBakedEntry(src);
    const loopSeconds = entry?.loopSeconds ?? null;

    if (isIOSNative()) {
        const bundlePath = entry?.out ?? src.replace(/^\/+/, '');
        const nativeId = `loop:${src}`;
        try {
            await PalanteAudioBridge.startNativeLoop({
                id: nativeId,
                path: bundlePath,
                loopSeconds: loopSeconds ?? undefined,
                volume,
            });
            log({ type: 'mode', mode: 'native', src, loopSeconds });
            return new NativeLoop(nativeId);
        } catch (e) {
            log({ type: 'error', message: `native loop failed, falling back to Web Audio: ${e instanceof Error ? e.message : e}` });
            // Falls through to the Web Audio path below.
        }
    }

    const ctx = getAudioContext();
    if (!ctx) {
        log({ type: 'error', message: 'no AudioContext available' });
        return null;
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

    const buffer = await loadSeamlessBuffer(ctx, src);
    if (buffer) {
        log({ type: 'mode', mode: 'buffer', src, loopSeconds });
        return new BufferLoop(ctx, buffer, volume, entrySec);
    }

    // Safety net only. Every manifest file is now small enough to decode, so
    // reaching here means the fetch or the decode actually failed.
    log({ type: 'error', message: `decode unavailable for ${src}; falling back to element loop` });
    log({ type: 'mode', mode: 'element', src, loopSeconds });
    const el = new Audio(src);
    el.loop = true;
    el.volume = volume;
    await el.play().catch(e => log({ type: 'error', message: `fallback play failed: ${e}` }));
    return {
        mode: 'element',
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
