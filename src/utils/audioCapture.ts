// "The ears" — debug-only recorder for the ACTUAL live audio graph output.
//
// ── Why this exists ─────────────────────────────────────────────────────────
// Five code-level fixes have been aimed at a recurring ~1s dropout in
// soundscape playback and none of them landed, because every one of them was
// aimed by ear. An ear can tell you a gap happened. It cannot tell you when it
// started to the millisecond, how deep it went, whether it was digital silence
// or a duck, or — the question that actually decides the fix — whether the gaps
// are periodic and whether that period matches a loop length.
//
// audioWatchdog.ts already answers "is the graph healthy right now" and acts on
// the answer. This module answers a different question and never acts on
// anything: it makes a RECORDING of what came out, plus a sidecar of everything
// the recording cannot show (AudioContext state, the audio clock against the
// wall clock, which sounds were on), on ONE timeline anchored at t0. The
// recording goes to a Mac, scripts/analyze-capture.mjs measures it, and the
// dropout stops being a matter of opinion.
//
// ── The one hard rule ───────────────────────────────────────────────────────
// This instrument must not be capable of causing the fault it is measuring.
// Everything here hangs off the master limiter as a PARALLEL branch; the
// limiter's existing edge to ctx.destination is never touched, never replaced,
// and never disconnected. Teardown only ever removes edges by explicit target
// (`limiter.disconnect(node)`), never with the argument-less form, which would
// take the whole output down with it.
//
// ── Two backends, and when each is right ────────────────────────────────────
// MediaRecorder is the default: in WebKit it encodes off the main thread, so it
// adds no JavaScript to the render path at all. The cost is that it hands back
// AAC in an MP4, and an AAC round trip cannot represent true digital zero and
// blurs an edge by up to one 1024-sample frame (~21ms at 48k). For "is there a
// ~1s hole every ~47s" that is irrelevant. For "is this hole EXACTLY 1024
// samples" it is not, so `backend: 'pcm'` records lossless PCM through an
// AudioWorklet instead (public/audio/capture-processor.js) and writes a WAV.
// The PCM path is also the automatic fallback when MediaRecorder is missing or
// — the realistic WKWebView failure — present but silently producing no bytes.
//
// Reached by long-pressing the Soundscapes title. See scripts/README-ears.md
// for the end-to-end procedure.

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getAudioContext, getMasterLimiter } from './audioGraph';
import { encodeWav } from './synthSounds';
import { getAudioLog, type AudioWatchdogEvent } from './audioWatchdog';

export type CaptureBackend = 'mediarecorder' | 'pcm-worklet' | 'pcm-scriptprocessor';

/** One audible voice, as the sidecar records it. */
export interface ActiveSound {
    /** Mixer id, e.g. 'rain'. What a human reads. */
    id: string;
    /** Asset path, e.g. '/sounds/gentle-rain.m4a'. What resolves against loopManifest.json. */
    src: string | null;
}

/** One entry of the passive 100ms trace. Keys are short because there are ten per second. */
export interface CaptureClockSample {
    /** ms since t0, on the wall clock (performance.now). */
    w: number;
    /** ctx.currentTime at that instant — the audio clock. */
    ct: number;
    /** ctx.state. Anything but 'running' during a gap names the cause outright. */
    st: string;
    /** 1 when the document was hidden. Absent otherwise. */
    h?: 1;
}

export interface CaptureSidecar {
    schema: 'palante-ears/1';
    /**
     * The anchor that makes every other number in this file comparable to a
     * sample offset in the recording. `performanceNow` is the origin the
     * watchdog's own `at` timestamps are measured against, and `ctxCurrentTime`
     * is the audio-clock origin, so the analysis can align on either clock and
     * cross-check them against each other.
     */
    t0: {
        epochMs: number;
        performanceNow: number;
        ctxCurrentTime: number;
        sampleRate: number;
    };
    /**
     * Audio-clock seconds between t0 and the first recorded sample. A few
     * render quanta on the PCM backends, and the analysis subtracts it before
     * mapping an event timestamp onto a sample offset. Reported as 0 on the
     * MediaRecorder backend, which does not expose when its encoder actually
     * took its first frame — one more reason the PCM backend is the one to
     * reach for when the exact edge of a gap is the question.
     */
    captureLeadSec: number;
    backend: CaptureBackend;
    /** Non-null when the backend in use can itself distort the measurement. */
    backendCaveat: string | null;
    mimeType: string | null;
    audioFile: string;
    durationSec: number;
    clockIntervalMs: number;
    clock: CaptureClockSample[];
    /**
     * Render-thread discontinuities, PCM backends only: the audio thread
     * produced fewer frames than wall time says it should have. A gap here is a
     * different fault from silence in the samples and must not be read as one.
     */
    renderGaps: Array<{ atSec: number; missingFrames: number }>;
    /**
     * What was audible, recorded only when the set changes.
     *
     * Both the mixer id and the file are kept: the mixer id is what a human
     * reads ('rain'), and the file is what the analysis can actually resolve
     * against loopManifest.json, whose ids are the file stems ('gentle-rain').
     * Recording only one of the two makes a loopSeconds match unattributable.
     */
    sounds: Array<{ w: number; active: ActiveSound[] }>;
    watchdog: {
        /**
         * False when audioWatchdog.startAudioWatchdog() was never called, in
         * which case `events` is empty because nothing was watching — NOT
         * because the graph stayed healthy. The analysis must not read an empty
         * log as a clean bill of health.
         */
        running: boolean;
        events: AudioWatchdogEvent[];
    };
    device: Record<string, string | number | boolean | null>;
}

export interface CaptureResult {
    audioUri: string;
    sidecarUri: string;
    audioFile: string;
    sidecarFile: string;
    durationSec: number;
    backend: CaptureBackend;
    bytes: number;
}

export interface StartCaptureOptions {
    /**
     * Ids of the sounds that are supposed to be audible right now. Polled on
     * the clock tick so the sidecar records what was playing WHEN, which is how
     * a dropout gets attributed to a particular file rather than to "the mixer".
     */
    describeActive?: () => ActiveSound[];
    /**
     * Hard stop, so a capture forgotten in a pocket cannot fill the device.
     * Defaults to 300s on the PCM backend (the accumulator is preallocated, see
     * the memory note on allocatePcm) and 900s on MediaRecorder, which streams
     * to compressed chunks and costs almost nothing per minute.
     */
    maxSeconds?: number;
    /** 'auto' probes MediaRecorder and falls back to PCM. 'pcm' forces lossless. */
    backend?: 'auto' | 'mediarecorder' | 'pcm';
}

export type CaptureState =
    | { phase: 'idle' }
    | { phase: 'starting' }
    | { phase: 'recording'; backend: CaptureBackend; startedAt: number; maxSeconds: number }
    | { phase: 'finalizing' };

/** How often the passive trace samples the context. */
const CLOCK_INTERVAL_MS = 100;
/** MediaRecorder chunk size. Small enough that a crash loses at most this much. */
const CHUNK_MS = 5000;
/** Length of the start-up probe that proves MediaRecorder actually emits bytes. */
const PROBE_MS = 700;
/** How long stopCapture waits for MediaRecorder to report having stopped. */
const STOP_TIMEOUT_MS = 4000;
const DEFAULT_MAX_SECONDS_PCM = 300;
const DEFAULT_MAX_SECONDS_MEDIARECORDER = 900;
/** ScriptProcessor block size, only ever used on the last-resort backend. */
const SCRIPT_PROCESSOR_BLOCK = 4096;

const WORKLET_URL = '/audio/capture-processor.js';

// ── module state ────────────────────────────────────────────────────────────

interface Session {
    ctx: AudioContext;
    limiter: AudioNode;
    backend: CaptureBackend;
    backendCaveat: string | null;
    mimeType: string | null;
    maxSeconds: number;
    describeActive: () => ActiveSound[];

    t0Epoch: number;
    t0Perf: number;
    t0Ctx: number;
    captureLeadSec: number;

    clock: CaptureClockSample[];
    sounds: Array<{ w: number; active: ActiveSound[] }>;
    lastActiveKey: string;
    renderGaps: Array<{ atSec: number; missingFrames: number }>;
    clockTimer: ReturnType<typeof setInterval> | null;
    autoStopTimer: ReturnType<typeof setTimeout> | null;
    /** Watchdog events accumulated across polls, keyed so the ring buffer can overflow safely. */
    watchdogSeen: Map<string, AudioWatchdogEvent>;
    watchdogEverPopulated: boolean;

    // MediaRecorder backend
    streamDest: MediaStreamAudioDestinationNode | null;
    recorder: MediaRecorder | null;
    chunks: Blob[];

    // PCM backends
    worklet: AudioWorkletNode | null;
    scriptNode: ScriptProcessorNode | null;
    sink: GainNode | null;
    pcm: Float32Array | null;
    pcmWritten: number;
    /** Frames the worklet says it has produced, for the contiguity check. */
    pcmFramesReported: number;
}

let session: Session | null = null;
let state: CaptureState = { phase: 'idle' };

export function getCaptureState(): CaptureState {
    return state;
}

export function isCapturing(): boolean {
    return state.phase === 'recording';
}

// ── backend probing ─────────────────────────────────────────────────────────

/**
 * MIME types worth asking WKWebView for, most-likely first.
 *
 * WebKit's MediaRecorder speaks MP4/AAC and has never shipped WebM, so the
 * WebM/Opus entries below are only here for the desktop-Safari-adjacent and
 * Chrome-devtools cases where this module also has to run. The list is probed
 * rather than hardcoded because `isTypeSupported` is itself absent on some
 * WKWebView builds, and a type it accepts is still not proof it will emit
 * bytes — see probeMediaRecorder.
 */
const MIME_CANDIDATES = [
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
];

function pickMimeType(): string | null {
    if (typeof MediaRecorder === 'undefined') return null;
    const supports = typeof MediaRecorder.isTypeSupported === 'function'
        ? (t: string) => {
            try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
        }
        : null;
    // With no isTypeSupported to ask, the first candidate is taken on faith and
    // the probe below is what actually decides.
    if (!supports) return MIME_CANDIDATES[0];
    for (const type of MIME_CANDIDATES) {
        if (supports(type)) return type;
    }
    return null;
}

/**
 * Construct a throwaway recorder on a real WebAudio stream and confirm it
 * produces a non-empty blob.
 *
 * This is not paranoia. The WKWebView failure that matters is not a missing
 * MediaRecorder — it is a MediaRecorder that constructs, reports `recording`,
 * fires no error, and hands back zero bytes for a stream whose only source is a
 * MediaStreamAudioDestinationNode rather than a camera or microphone. Finding
 * that out at stopCapture() means the whole session is gone, and a session is
 * several minutes of a human sitting still listening for a bug. 700ms up front
 * is the cheapest possible insurance against that.
 */
async function probeMediaRecorder(ctx: AudioContext, limiter: AudioNode, mimeType: string | null): Promise<boolean> {
    if (typeof MediaRecorder === 'undefined') return false;
    let dest: MediaStreamAudioDestinationNode | null = null;
    let rec: MediaRecorder | null = null;
    try {
        dest = ctx.createMediaStreamDestination();
        limiter.connect(dest);
        rec = mimeType ? new MediaRecorder(dest.stream, { mimeType }) : new MediaRecorder(dest.stream);
        let bytes = 0;
        rec.ondataavailable = (e) => { bytes += e.data?.size ?? 0; };
        rec.start();
        await new Promise((r) => setTimeout(r, PROBE_MS));
        // Raced against a timeout, not simply awaited: the WebView being probed
        // is one that might never fire onstop at all, and a probe that hangs
        // takes startCapture() down with it and leaves no way to record.
        const done = settledStop(rec, PROBE_MS);
        try { rec.stop(); } catch { /* already stopped by an error */ }
        await done;
        return bytes > 0;
    } catch {
        return false;
    } finally {
        // Remove ONLY this edge. The argument-less disconnect() would also
        // sever the limiter from ctx.destination and mute the whole app.
        if (dest) { try { limiter.disconnect(dest); } catch { /* edge already gone */ } }
    }
}

/**
 * Resolve when the recorder has finished, or when `timeoutMs` has passed,
 * whichever comes first. Never rejects, and never leaves the caller hanging on
 * an event the WebView may simply not send.
 */
function settledStop(rec: MediaRecorder, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => { if (!settled) { settled = true; resolve(); } };
        rec.onstop = finish;
        rec.onerror = finish;
        setTimeout(finish, timeoutMs);
    });
}

async function ensureCaptureWorklet(ctx: AudioContext): Promise<boolean> {
    try {
        if (!ctx.audioWorklet) return false;
        await ctx.audioWorklet.addModule(WORKLET_URL);
        return true;
    } catch (e) {
        console.warn('[ears] capture worklet failed to load', e);
        return false;
    }
}

/**
 * Preallocate the whole PCM accumulator up front rather than growing a list of
 * chunks and concatenating at the end. Concatenation would need both copies
 * resident at the moment of the join — the single worst instant to double a
 * 60MB allocation on a phone that is already holding decoded loop buffers.
 *
 * Mono float32 at 48kHz costs ~11.5MB per minute, so the 300s default is
 * ~58MB and the encodeWav pass that follows adds ~29MB of int16 plus its
 * base64 string. Raising maxSeconds past ~600 on the PCM backend is asking for
 * a memory kill mid-session; use the MediaRecorder backend for long runs.
 */
function allocatePcm(sampleRate: number, maxSeconds: number): Float32Array {
    return new Float32Array(Math.ceil(sampleRate * maxSeconds));
}

// ── start ───────────────────────────────────────────────────────────────────

export interface StartCaptureOutcome {
    ok: boolean;
    backend: CaptureBackend | null;
    /** Human-readable, shown in the debug panel. */
    note: string;
}

export async function startCapture(opts: StartCaptureOptions = {}): Promise<StartCaptureOutcome> {
    if (state.phase !== 'idle') {
        return { ok: false, backend: null, note: `capture already ${state.phase}` };
    }
    const ctx = getAudioContext();
    if (!ctx) return { ok: false, backend: null, note: 'no AudioContext' };
    // Do NOT resume a suspended context here. A suspended context during a
    // capture is a finding, not a problem to paper over, and resuming it would
    // erase the exact evidence the run exists to collect.

    state = { phase: 'starting' };
    const limiter = getMasterLimiter(ctx);

    let backend: CaptureBackend | null = null;
    let backendCaveat: string | null = null;
    let mimeType: string | null = null;

    const want = opts.backend ?? 'auto';
    if (want !== 'pcm') {
        mimeType = pickMimeType();
        if (mimeType !== null && await probeMediaRecorder(ctx, limiter, mimeType)) {
            backend = 'mediarecorder';
            backendCaveat = 'lossy AAC/Opus round trip: edges blur by up to one codec frame (~21ms at 48k) and true digital zero is not representable';
        } else if (want === 'mediarecorder') {
            state = { phase: 'idle' };
            return { ok: false, backend: null, note: 'MediaRecorder unusable on this WebView' };
        }
    }

    if (!backend) {
        if (await ensureCaptureWorklet(ctx)) {
            backend = 'pcm-worklet';
        } else if (typeof ctx.createScriptProcessor === 'function') {
            backend = 'pcm-scriptprocessor';
            backendCaveat = 'ScriptProcessorNode runs the tap on the MAIN THREAD: this backend can itself produce dropouts, so a gap found under it is not evidence on its own';
        } else {
            state = { phase: 'idle' };
            return { ok: false, backend: null, note: 'no usable capture backend' };
        }
        mimeType = 'audio/wav';
    }

    const maxSeconds = opts.maxSeconds
        ?? (backend === 'mediarecorder' ? DEFAULT_MAX_SECONDS_MEDIARECORDER : DEFAULT_MAX_SECONDS_PCM);

    const s: Session = {
        ctx,
        limiter,
        backend,
        backendCaveat,
        mimeType,
        maxSeconds,
        describeActive: opts.describeActive ?? (() => []),
        t0Epoch: Date.now(),
        t0Perf: performance.now(),
        t0Ctx: ctx.currentTime,
        captureLeadSec: 0,
        clock: [],
        sounds: [],
        lastActiveKey: ' ',
        renderGaps: [],
        clockTimer: null,
        autoStopTimer: null,
        watchdogSeen: new Map(),
        watchdogEverPopulated: false,
        streamDest: null,
        recorder: null,
        chunks: [],
        worklet: null,
        scriptNode: null,
        sink: null,
        pcm: null,
        pcmWritten: 0,
        pcmFramesReported: 0,
    };

    try {
        if (backend === 'mediarecorder') {
            startMediaRecorder(s);
        } else {
            startPcm(s);
        }
    } catch (e) {
        state = { phase: 'idle' };
        return { ok: false, backend: null, note: `capture failed to start: ${e}` };
    }

    // Everything downstream of here is measured from the instant the tap went
    // live, so re-anchor now that the nodes are connected instead of using the
    // pre-probe timestamps.
    s.t0Epoch = Date.now();
    s.t0Perf = performance.now();
    s.t0Ctx = ctx.currentTime;
    s.captureLeadSec = 0;

    startTrace(s);
    session = s;
    state = { phase: 'recording', backend, startedAt: s.t0Perf, maxSeconds };
    return {
        ok: true,
        backend,
        note: backend === 'mediarecorder' ? `recording ${mimeType}` : 'recording lossless PCM',
    };
}

function startMediaRecorder(s: Session) {
    const dest = s.ctx.createMediaStreamDestination();
    // Parallel branch. The limiter keeps its existing edge to ctx.destination.
    s.limiter.connect(dest);
    s.streamDest = dest;
    const rec = s.mimeType
        ? new MediaRecorder(dest.stream, { mimeType: s.mimeType })
        : new MediaRecorder(dest.stream);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) s.chunks.push(e.data); };
    rec.onerror = (e) => console.warn('[ears] MediaRecorder error', e);
    rec.start(CHUNK_MS);
    s.recorder = rec;
}

function startPcm(s: Session) {
    s.pcm = allocatePcm(s.ctx.sampleRate, s.maxSeconds);

    // A node only runs if it is pulled from the destination, so the tap needs a
    // path there. A gain of exactly 0 gives it one while contributing nothing:
    // it is a second, silent branch, not a change to the existing one.
    const sink = s.ctx.createGain();
    sink.gain.value = 0;
    sink.connect(s.ctx.destination);
    s.sink = sink;

    if (s.backend === 'pcm-worklet') {
        const node = new AudioWorkletNode(s.ctx, 'capture-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 2,
            channelCountMode: 'explicit',
            processorOptions: { blockSeconds: 1 },
        });
        node.port.onmessage = (e) => acceptPcm(s, e.data as { pcm: Float32Array; frames: number; ctxTime: number });
        s.limiter.connect(node);
        node.connect(sink);
        s.worklet = node;
        return;
    }

    // Last resort. Mono downmix happens here rather than in a worklet, and the
    // whole thing rides the main thread — see backendCaveat.
    const node = s.ctx.createScriptProcessor(SCRIPT_PROCESSOR_BLOCK, 2, 2);
    node.onaudioprocess = (e) => {
        const input = e.inputBuffer;
        const n = input.length;
        const chCount = input.numberOfChannels;
        const block = new Float32Array(n);
        for (let c = 0; c < chCount; c++) {
            const data = input.getChannelData(c);
            for (let i = 0; i < n; i++) block[i] += data[i] / chCount;
        }
        acceptPcm(s, { pcm: block, frames: s.pcmFramesReported + n, ctxTime: s.ctx.currentTime });
    };
    s.limiter.connect(node);
    node.connect(sink);
    s.scriptNode = node;
}

function acceptPcm(s: Session, msg: { pcm: Float32Array; frames: number; ctxTime: number }) {
    if (!s.pcm) return;
    // Contiguity: the tap reports total frames produced, so a jump larger than
    // the block it just handed over means the RENDER THREAD skipped. Recording
    // that separately is what stops a render-thread stall being misread as
    // silence in the material.
    const expected = s.pcmFramesReported + msg.pcm.length;
    if (s.pcmFramesReported > 0 && msg.frames > expected) {
        s.renderGaps.push({
            atSec: s.pcmWritten / s.ctx.sampleRate,
            missingFrames: msg.frames - expected,
        });
    }
    if (s.pcmWritten === 0) {
        // The block's ctxTime is stamped at its END, so backing out its own
        // length gives the audio-clock instant of the very first recorded
        // sample. That offset is what lets the analysis convert an event
        // timestamp into a sample index rather than an approximate second.
        s.captureLeadSec = Math.max(0, msg.ctxTime - msg.pcm.length / s.ctx.sampleRate - s.t0Ctx);
    }
    s.pcmFramesReported = msg.frames;

    const room = s.pcm.length - s.pcmWritten;
    if (room <= 0) return;
    const take = Math.min(room, msg.pcm.length);
    s.pcm.set(take === msg.pcm.length ? msg.pcm : msg.pcm.subarray(0, take), s.pcmWritten);
    s.pcmWritten += take;
}

// ── the passive trace ───────────────────────────────────────────────────────

/**
 * Everything the recording cannot show, sampled ten times a second and never
 * acted upon.
 *
 * This deliberately overlaps nothing with audioWatchdog: the watchdog is an
 * actor with a 250ms poll that resumes and rebuilds, and this is a witness. The
 * distinction matters for the analysis, because a `ctx.resume()` fired by a
 * recovery routine changes the very timeline being measured. Watchdog events
 * are merged in when the watchdog happens to be running, but nothing here
 * depends on that.
 *
 * A GAP in this trace is itself a finding: setInterval not firing for 400ms
 * means the main thread was blocked for 400ms, which is a candidate cause for a
 * dropout that no amount of audio-domain measurement would ever reveal.
 */
function startTrace(s: Session) {
    const tick = () => {
        const w = Math.round(performance.now() - s.t0Perf);
        const sample: CaptureClockSample = {
            w,
            ct: Math.round((s.ctx.currentTime - s.t0Ctx) * 1e6) / 1e6,
            st: s.ctx.state,
        };
        if (typeof document !== 'undefined' && document.hidden) sample.h = 1;
        s.clock.push(sample);

        const active = s.describeActive();
        const key = active.map(a => a.id).join(',');
        if (key !== s.lastActiveKey) {
            s.lastActiveKey = key;
            s.sounds.push({ w, active });
        }

        // The watchdog ring buffer holds 200 events and a long capture can
        // overflow it, so drain it repeatedly and dedupe rather than reading it
        // once at the end.
        for (const e of getAudioLog()) {
            s.watchdogEverPopulated = true;
            s.watchdogSeen.set(`${e.at}|${e.kind}`, e);
        }
    };
    tick();
    s.clockTimer = setInterval(tick, CLOCK_INTERVAL_MS);
    s.autoStopTimer = setTimeout(() => { void stopCapture(); }, s.maxSeconds * 1000);
}

// ── stop ────────────────────────────────────────────────────────────────────

export async function stopCapture(): Promise<CaptureResult | null> {
    const s = session;
    if (!s || state.phase !== 'recording') return null;
    state = { phase: 'finalizing' };
    session = null;

    if (s.clockTimer) clearInterval(s.clockTimer);
    if (s.autoStopTimer) clearTimeout(s.autoStopTimer);

    try {
        const { blob, durationSec, ext } = await finishRecording(s);
        const stamp = new Date(s.t0Epoch).toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const audioFile = `palante-ears-${stamp}.${ext}`;
        const sidecarFile = `palante-ears-${stamp}.json`;

        const sidecar = buildSidecar(s, audioFile, durationSec);

        const audioUri = await writeBinary(audioFile, blob);
        const sidecarUri = await writeText(sidecarFile, JSON.stringify(sidecar));

        await Share.share({
            title: 'Palante audio capture',
            text: `${durationSec.toFixed(1)}s via ${s.backend}. Run: node scripts/analyze-capture.mjs ${audioFile} ${sidecarFile}`,
            files: [audioUri, sidecarUri],
            dialogTitle: 'Send capture to Mac',
        }).catch(() => { /* user dismissed the sheet; the files are still written */ });

        return {
            audioUri,
            sidecarUri,
            audioFile,
            sidecarFile,
            durationSec,
            backend: s.backend,
            bytes: blob.size,
        };
    } finally {
        teardown(s);
        state = { phase: 'idle' };
    }
}

async function finishRecording(s: Session): Promise<{ blob: Blob; durationSec: number; ext: string }> {
    if (s.backend === 'mediarecorder' && s.recorder) {
        const rec = s.recorder;
        // Same timeout guard as the probe. If the recorder never reports having
        // stopped, the chunks already delivered are still a usable recording,
        // and a truncated capture beats a hung stopCapture() that loses all of
        // it.
        const done = settledStop(rec, STOP_TIMEOUT_MS);
        try { rec.stop(); } catch { /* already stopped */ }
        await done;
        const type = s.mimeType || 'audio/mp4';
        const blob = new Blob(s.chunks, { type });
        return {
            blob,
            durationSec: (performance.now() - s.t0Perf) / 1000,
            ext: extensionFor(type),
        };
    }

    // PCM: ask the worklet for its partial block before reading the accumulator,
    // so the tail of the recording is not silently truncated to the last whole
    // second.
    if (s.worklet) {
        try { s.worklet.port.postMessage('stop'); } catch { /* already gone */ }
        await new Promise((r) => setTimeout(r, 60));
    }
    const pcm = s.pcm ? s.pcm.subarray(0, s.pcmWritten) : new Float32Array(0);
    // encodeWav is the app's one WAV writer (synthSounds.ts). Reusing it here
    // means the capture format and the background-loop blob format can never
    // drift apart.
    const blob = encodeWav([pcm as Float32Array], s.ctx.sampleRate);
    return { blob, durationSec: s.pcmWritten / s.ctx.sampleRate, ext: 'wav' };
}

function extensionFor(mime: string): string {
    if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('wav')) return 'wav';
    return 'bin';
}

function buildSidecar(s: Session, audioFile: string, durationSec: number): CaptureSidecar {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const extras = nav as unknown as { deviceMemory?: number; hardwareConcurrency?: number } | null;
    return {
        schema: 'palante-ears/1',
        t0: {
            epochMs: s.t0Epoch,
            performanceNow: s.t0Perf,
            ctxCurrentTime: s.t0Ctx,
            sampleRate: s.ctx.sampleRate,
        },
        captureLeadSec: s.captureLeadSec,
        backend: s.backend,
        backendCaveat: s.backendCaveat,
        mimeType: s.mimeType,
        audioFile,
        durationSec,
        clockIntervalMs: CLOCK_INTERVAL_MS,
        clock: s.clock,
        renderGaps: s.renderGaps,
        sounds: s.sounds,
        watchdog: {
            running: s.watchdogEverPopulated,
            events: [...s.watchdogSeen.values()].sort((a, b) => a.at - b.at),
        },
        device: {
            userAgent: nav?.userAgent ?? null,
            platform: (nav as unknown as { platform?: string })?.platform ?? null,
            deviceMemoryGb: extras?.deviceMemory ?? null,
            hardwareConcurrency: extras?.hardwareConcurrency ?? null,
            sampleRate: s.ctx.sampleRate,
            baseLatency: (s.ctx as unknown as { baseLatency?: number }).baseLatency ?? null,
            outputLatency: (s.ctx as unknown as { outputLatency?: number }).outputLatency ?? null,
            screen: typeof window !== 'undefined' ? `${window.screen?.width}x${window.screen?.height}@${window.devicePixelRatio}` : null,
        },
    };
}

/**
 * Detach every tap.
 *
 * `limiter.disconnect(node)` removes exactly one edge. The argument-less
 * `disconnect()` removes ALL of them, including the limiter's edge to
 * ctx.destination, which would silence the app for the rest of the session —
 * so it is never called here, not even in a catch.
 */
function teardown(s: Session) {
    if (s.streamDest) {
        try { s.limiter.disconnect(s.streamDest); } catch { /* edge already gone */ }
        try { s.streamDest.stream.getTracks().forEach(t => t.stop()); } catch { /* noop */ }
    }
    if (s.worklet) {
        try { s.limiter.disconnect(s.worklet); } catch { /* edge already gone */ }
        try { s.worklet.disconnect(); } catch { /* noop */ }
    }
    if (s.scriptNode) {
        try { s.limiter.disconnect(s.scriptNode); } catch { /* edge already gone */ }
        try { s.scriptNode.onaudioprocess = null; } catch { /* noop */ }
        try { s.scriptNode.disconnect(); } catch { /* noop */ }
    }
    if (s.sink) {
        try { s.sink.disconnect(); } catch { /* noop */ }
    }
    s.streamDest = null;
    s.recorder = null;
    s.chunks = [];
    s.worklet = null;
    s.scriptNode = null;
    s.sink = null;
    s.pcm = null;
}

// ── file output ─────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const url = String(reader.result);
            resolve(url.slice(url.indexOf(',') + 1));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * Directory.Cache, matching shareUtils.ts. These are throwaway diagnostic
 * artefacts that exist to be handed to a Mac and deleted; putting multi-tens-of
 * -megabyte WAVs in Documents would back them up to iCloud and show them to the
 * user in Files, neither of which anyone wants.
 */
async function writeBinary(path: string, blob: Blob): Promise<string> {
    const data = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({ path, data, directory: Directory.Cache });
    return saved.uri;
}

async function writeText(path: string, text: string): Promise<string> {
    const data = btoa(unescape(encodeURIComponent(text)));
    const saved = await Filesystem.writeFile({ path, data, directory: Directory.Cache });
    return saved.uri;
}

// ── Web Inspector handles ───────────────────────────────────────────────────
// Same posture as window.__palanteAudioLog: a device build attached to Safari
// Web Inspector can drive a capture without going near the UI, which matters
// when the reproduction involves backgrounding the app and the long-press
// affordance is not reachable.
if (typeof window !== 'undefined') {
    (window as unknown as { __palanteEars: unknown }).__palanteEars = {
        start: startCapture,
        stop: stopCapture,
        state: getCaptureState,
    };
}
