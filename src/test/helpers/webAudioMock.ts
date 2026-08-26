// A Web Audio + HTMLAudioElement double, just deep enough to answer the one
// question loopEngine tests need answered: WHICH numbers did the engine put on
// the graph, and where did they come from?
//
// jsdom has neither a real AudioContext nor a working HTMLMediaElement, so
// there is nothing to spy on otherwise. Every node here records the parameter
// automation it receives, with times, because "the crossfade was scheduled at
// loopSeconds and not at duration" is a claim about exactly those numbers.

import { vi } from 'vitest';

export interface ParamEvent {
    type: 'setValueAtTime' | 'linearRamp' | 'cancel';
    value: number;
    time: number;
}

export class FakeAudioParam {
    value = 0;
    readonly events: ParamEvent[] = [];
    setValueAtTime(value: number, time: number) {
        this.value = value;
        this.events.push({ type: 'setValueAtTime', value, time });
        return this;
    }
    linearRampToValueAtTime(value: number, time: number) {
        this.events.push({ type: 'linearRamp', value, time });
        return this;
    }
    cancelScheduledValues(time: number) {
        this.events.push({ type: 'cancel', value: 0, time });
        return this;
    }
    /** Times at which this param was told to reach a value. */
    rampTimes(): number[] {
        return this.events.filter(e => e.type === 'linearRamp').map(e => e.time);
    }
}

class FakeNode {
    readonly connectedTo: unknown[] = [];
    connect(dest: unknown) { this.connectedTo.push(dest); return dest as FakeNode; }
    disconnect() { /* no-op */ }
}

export class FakeGainNode extends FakeNode {
    readonly gain = new FakeAudioParam();
}

export class FakeBufferSourceNode extends FakeNode {
    buffer: FakeAudioBuffer | null = null;
    loop = false;
    loopStart = 0;
    loopEnd = 0;
    onended: (() => void) | null = null;
    startCalls: number[] = [];
    stopCalls: number[] = [];
    start(when = 0) { this.startCalls.push(when); }
    stop(when = 0) { this.stopCalls.push(when); }
}

export class FakeAudioBuffer {
    private readonly data: Float32Array[];
    readonly numberOfChannels: number;
    readonly length: number;
    readonly sampleRate: number;
    constructor(numberOfChannels: number, length: number, sampleRate: number, seed?: Float32Array[]) {
        this.numberOfChannels = numberOfChannels;
        this.length = length;
        this.sampleRate = sampleRate;
        this.data = seed ?? Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    }
    get duration() { return this.length / this.sampleRate; }
    getChannelData(c: number) { return this.data[c]; }
    copyToChannel(src: Float32Array, c: number, offset = 0) { this.data[c].set(src, offset); }
}

export class FakeMediaElementSourceNode extends FakeNode {
    readonly mediaElement: FakeAudioElement;
    constructor(mediaElement: FakeAudioElement) { super(); this.mediaElement = mediaElement; }
}

export class FakeAudioContext {
    state: 'running' | 'suspended' = 'running';
    /** Fixed on purpose: every scheduled time is then trivially readable as an offset. */
    currentTime = 1000;
    readonly destination = new FakeNode();
    readonly bufferSources: FakeBufferSourceNode[] = [];
    readonly gains: FakeGainNode[] = [];
    readonly mediaSources: FakeMediaElementSourceNode[] = [];
    readonly createdBuffers: FakeAudioBuffer[] = [];
    decodeCalls = 0;

    /** What decodeAudioData hands back — set per test to model a padded file. */
    decoded: FakeAudioBuffer | null = null;

    createGain() { const g = new FakeGainNode(); this.gains.push(g); return g; }
    createBufferSource() { const s = new FakeBufferSourceNode(); this.bufferSources.push(s); return s; }
    createBuffer(channels: number, length: number, rate: number) {
        const b = new FakeAudioBuffer(channels, length, rate);
        this.createdBuffers.push(b);
        return b;
    }
    createMediaElementSource(el: FakeAudioElement) {
        const n = new FakeMediaElementSourceNode(el);
        this.mediaSources.push(n);
        return n;
    }
    createDynamicsCompressor() {
        return Object.assign(new FakeNode(), {
            threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 },
            attack: { value: 0 }, release: { value: 0 },
        });
    }
    decodeAudioData(_data: ArrayBuffer): Promise<FakeAudioBuffer> {
        this.decodeCalls++;
        if (!this.decoded) return Promise.reject(new Error('no decoded buffer configured'));
        return Promise.resolve(this.decoded);
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
}

export class FakeAudioElement {
    preload = '';
    loop = false;
    volume = 1;
    currentTime = 0;
    /** Set per test. The whole point of these tests is that nothing reads it. */
    duration = NaN;
    readyState = 4;
    paused = true;
    readonly playCalls: number[] = [];
    private listeners = new Map<string, (() => void)[]>();
    src: string;

    constructor(src = '') { this.src = src; }

    addEventListener(type: string, fn: () => void) {
        const list = this.listeners.get(type) ?? [];
        list.push(fn);
        this.listeners.set(type, list);
    }
    removeEventListener() { /* no-op */ }
    play() { this.paused = false; this.playCalls.push(this.currentTime); return Promise.resolve(); }
    pause() { this.paused = true; }
    load() { /* no-op */ }
}

export interface WebAudioHarness {
    ctx: FakeAudioContext;
    /** Every element the engine constructed via `new Audio(src)`. */
    elements: FakeAudioElement[];
    /** Delays, in ms, passed to setTimeout while the harness was installed. */
    timerDelays: number[];
    fetchCalls: string[];
    restore(): void;
}

/**
 * Install the doubles and reset every module-level cache the audio stack keeps
 * on `window` (getAudioContext and getMasterLimiter both memoize there, so a
 * leftover from a previous test would silently be reused).
 */
export function installWebAudio(options: {
    /** Body handed to decodeAudioData; leave undefined to make decoding fail. */
    decoded?: FakeAudioBuffer;
    /** Bytes the mocked fetch returns. Keep well under the 6.5MB in-memory cap. */
    fetchBytes?: number;
} = {}): WebAudioHarness {
    const win = window as unknown as Record<string, unknown>;
    delete win._palanteAudioContext;
    delete win._palanteMasterLimiter;

    const ctx = new FakeAudioContext();
    ctx.decoded = options.decoded ?? null;
    win.AudioContext = function () { return ctx; } as unknown as typeof AudioContext;

    const elements: FakeAudioElement[] = [];
    const realAudio = globalThis.Audio;
    globalThis.Audio = function (src?: string) {
        const el = new FakeAudioElement(src ?? '');
        elements.push(el);
        return el;
    } as unknown as typeof Audio;

    const fetchCalls: string[] = [];
    const realFetch = globalThis.fetch;
    const bytes = options.fetchBytes ?? 4096;
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
        fetchCalls.push(String(input));
        return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(bytes)),
        } as Response);
    }) as unknown as typeof fetch;

    const timerDelays: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = ((fn: () => void, delay?: number, ...rest: unknown[]) => {
        timerDelays.push(delay ?? 0);
        return (realSetTimeout as unknown as (...a: unknown[]) => unknown)(fn, delay, ...rest);
    }) as unknown as typeof setTimeout;

    let restored = false;
    return {
        ctx,
        elements,
        timerDelays,
        fetchCalls,
        // Idempotent: tests that restore explicitly are followed by an
        // afterEach that restores again, and un-nesting the globals twice
        // would reinstate a wrapper instead of the original.
        restore() {
            if (restored) return;
            restored = true;
            globalThis.Audio = realAudio;
            globalThis.fetch = realFetch;
            globalThis.setTimeout = realSetTimeout;
            delete win.AudioContext;
            delete win._palanteAudioContext;
            delete win._palanteMasterLimiter;
        },
    };
}

/**
 * A decoded file the way a real AAC decoder hands one over: `loopSamples` of
 * actual audio followed by `paddingSamples` of the encoder's trailing silence.
 * This shape IS the bug — anything that measures the buffer's own length gets
 * the padded number.
 */
export function paddedDecodedBuffer(
    loopSamples: number,
    paddingSamples: number,
    sampleRate: number,
): FakeAudioBuffer {
    const total = loopSamples + paddingSamples;
    const ch = new Float32Array(total);
    // Deterministic, non-silent, and never exactly zero, so a slice landing in
    // the padding is unambiguous.
    let x = 12345;
    for (let i = 0; i < loopSamples; i++) {
        x = (x * 16807) % 2147483647;
        ch[i] = ((x / 2147483647) * 2 - 1) * 0.5;
    }
    return new FakeAudioBuffer(1, total, sampleRate, [ch]);
}
