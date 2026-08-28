// Ground truth for "is the soundscape actually making sound right now".
//
// ── Why this exists ─────────────────────────────────────────────────────────
// The recurring dropout was chased five times through the loop engine on the
// strength of one assumption — that a gap heard during playback must be a gap
// at the loop seam. It was not. Buffer-path sounds wrap on the audio rendering
// thread with no JavaScript per cycle, and the dropout hit sounds whose loop
// lengths differ by 5x at the same felt rhythm, which nothing seam-synchronised
// can do.
//
// The lesson is that ear-timed bug reports cannot locate a fault in a pipeline
// with this many asynchronous layers, so this module measures instead of
// guessing. It taps the master bus with an AnalyserNode and watches three
// independent signals:
//
//   1. ctx.state          — did iOS suspend the graph out from under us
//   2. ctx.currentTime    — is the render thread advancing at all, in wall-clock
//                           terms (a running context whose clock is frozen is
//                           stalled, and reports itself as perfectly healthy)
//   3. post-limiter peak  — are samples actually reaching the destination
//
// Signals 1 and 2 are unambiguous, so they trigger recovery immediately.
// Signal 3 is only acted on after SILENCE_RECOVER_MS, because a quiet passage
// is not a fault; below that threshold it is recorded for diagnosis only.
//
// Every observation lands in a ring buffer readable from Safari Web Inspector
// as `window.__palanteAudioLog()`, so a dropout reported on device can be
// attributed to a cause instead of re-litigated.

import { getAudioContext, getMasterLimiter } from './audioGraph';

export type AudioStallKind =
    /** The graph was suspended by the OS. Unambiguous. */
    | 'ctx-suspended'
    /** ctx.state is "running" but its clock is not advancing. Unambiguous. */
    | 'ctx-stalled'
    /** The graph looks healthy but no samples are reaching the output. */
    | 'silence';

export interface AudioWatchdogEvent {
    /** Wall clock (performance.now()) when the poll ran. */
    at: number;
    kind: AudioStallKind | 'recovered' | 'recovering';
    /** How long output has been silent, in ms, at the time of the event. */
    silentMs: number;
    ctxState: string;
    /** Seconds ctx.currentTime advanced over the last poll interval. */
    ctxAdvance: number;
    /** Wall-clock ms the last poll interval actually took. */
    wallMs: number;
    peak: number;
}

/** How often the master bus is sampled. */
const POLL_MS = 250;
/**
 * Peak below this counts as silence. -66 dBFS: comfortably under the noise
 * floor of every bed in the library at any listening volume, and well above
 * the exact zero a dead graph produces, so a stalled render thread is caught
 * without a merely quiet one being flagged.
 */
const SILENCE_PEAK = 0.0005;
/**
 * How long output must be silent before silence alone triggers a rebuild.
 * No ambient bed in the library is silent for two seconds; a spurious rebuild
 * costs one 1.5s fade-in, whereas missing a real stall costs the rest of the
 * session.
 */
const SILENCE_RECOVER_MS = 2000;
/**
 * Minimum fraction of the wall-clock interval that ctx.currentTime must cover
 * for the render thread to count as advancing. Generous, because a busy main
 * thread delays the poll itself and shortens the apparent advance.
 */
const MIN_CLOCK_RATIO = 0.25;
/** Never rebuild more often than this, so a genuinely dead graph cannot spin. */
const RECOVER_COOLDOWN_MS = 5000;

const LOG_CAPACITY = 200;
const log: AudioWatchdogEvent[] = [];

function record(event: AudioWatchdogEvent) {
    log.push(event);
    if (log.length > LOG_CAPACITY) log.shift();
}

export function getAudioLog(): AudioWatchdogEvent[] {
    return [...log];
}

interface WatchdogOptions {
    /** True when at least one sound is supposed to be audible right now. */
    isExpectingAudio: () => boolean;
    /** Rebuild every active voice. Called only for a confirmed fault. */
    recover: () => void;
}

let timer: ReturnType<typeof setInterval> | null = null;
let analyser: AnalyserNode | null = null;
let probe: Uint8Array | null = null;
let lastCtxTime = 0;
let lastWall = 0;
let silentSince = 0;
let lastRecoverAt = 0;
let wasFaulted = false;

function attach(ctx: AudioContext): AnalyserNode {
    if (analyser) return analyser;
    const node = ctx.createAnalyser();
    // Small window: this only ever asks "was there signal", never "what was it",
    // and a short FFT keeps the per-poll copy cheap.
    node.fftSize = 256;
    // Tap in parallel with the limiter's existing path to the destination, so
    // the watchdog observes exactly what the user hears and adds nothing to it.
    getMasterLimiter(ctx).connect(node);
    analyser = node;
    probe = new Uint8Array(node.fftSize);
    return node;
}

function peakOf(node: AnalyserNode): number {
    if (!probe) return 0;
    node.getByteTimeDomainData(probe as Uint8Array<ArrayBuffer>);
    let peak = 0;
    for (let i = 0; i < probe.length; i++) {
        // Byte time-domain data is unsigned, centred on 128.
        const v = Math.abs(probe[i] - 128) / 128;
        if (v > peak) peak = v;
    }
    return peak;
}

/**
 * Begin watching the master bus. Safe to call repeatedly; only one watcher
 * ever runs. Returns a stop function.
 */
export function startAudioWatchdog(opts: WatchdogOptions): () => void {
    stopAudioWatchdog();
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    const node = attach(ctx);
    lastCtxTime = ctx.currentTime;
    lastWall = performance.now();
    silentSince = 0;
    wasFaulted = false;

    timer = setInterval(() => {
        const now = performance.now();
        const wallMs = now - lastWall;
        const ctxAdvance = ctx.currentTime - lastCtxTime;
        lastWall = now;
        lastCtxTime = ctx.currentTime;

        // Only meaningful while something is supposed to be playing.
        if (!opts.isExpectingAudio()) {
            silentSince = 0;
            wasFaulted = false;
            return;
        }

        const peak = peakOf(node);
        if (peak >= SILENCE_PEAK) {
            if (wasFaulted) {
                record({ at: now, kind: 'recovered', silentMs: 0, ctxState: ctx.state, ctxAdvance, wallMs, peak });
                wasFaulted = false;
            }
            silentSince = 0;
            return;
        }

        if (!silentSince) silentSince = now;
        const silentMs = now - silentSince;

        let kind: AudioStallKind | null = null;
        if (ctx.state !== 'running') {
            kind = 'ctx-suspended';
        } else if (wallMs > 0 && ctxAdvance < (wallMs / 1000) * MIN_CLOCK_RATIO) {
            kind = 'ctx-stalled';
        } else if (silentMs >= SILENCE_RECOVER_MS) {
            kind = 'silence';
        }

        if (!kind) return;

        record({ at: now, kind, silentMs, ctxState: ctx.state, ctxAdvance, wallMs, peak });
        wasFaulted = true;

        if (now - lastRecoverAt < RECOVER_COOLDOWN_MS) return;
        lastRecoverAt = now;
        record({ at: now, kind: 'recovering', silentMs, ctxState: ctx.state, ctxAdvance, wallMs, peak });
        // Resuming first is enough for a plain suspension and costs nothing
        // when it is not; the rebuild covers the cases where it is not.
        void ctx.resume().catch(() => {});
        opts.recover();
        silentSince = 0;
    }, POLL_MS);

    return stopAudioWatchdog;
}

export function stopAudioWatchdog(): void {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    silentSince = 0;
    wasFaulted = false;
}

// Readable from Safari Web Inspector against a device build, so a dropout can
// be attributed rather than guessed at.
if (typeof window !== 'undefined') {
    (window as unknown as { __palanteAudioLog: () => AudioWatchdogEvent[] }).__palanteAudioLog = getAudioLog;
}
