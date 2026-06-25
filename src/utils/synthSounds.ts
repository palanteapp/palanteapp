// Procedural synthesis for the sounds that never needed to be files: colored
// noise and binaural beats. Synthesized sources have NO loop point — they are
// generated continuously on the audio thread — so they are seam-free by
// construction, weigh nothing in the bundle, and cost almost no CPU.
//
// Noise runs in an AudioWorklet (see public/audio/noise-processor.js) with a
// looped-buffer fallback for the rare engine that lacks AudioWorklet. Binaural
// beats are two sine OscillatorNodes hard-panned to each ear.

import { bakeSeamlessLoop } from './seamlessLoop';

export type NoiseColor = 'white' | 'pink' | 'brown' | 'violet';

export type SynthSpec =
    | { kind: 'noise'; color: NoiseColor }
    | { kind: 'binaural'; carrier: number; beat: number };

// Keyed by SoundTrack.id (see SOUNDS in SoundMixer.tsx). Carrier/beat values
// are easy to tune; binaural beat = right-ear minus left-ear frequency.
export const SYNTH_SOUNDS: Record<string, SynthSpec> = {
    white: { kind: 'noise', color: 'white' },
    pink: { kind: 'noise', color: 'pink' },
    brown: { kind: 'noise', color: 'brown' },
    violet: { kind: 'noise', color: 'violet' },
    '40hz': { kind: 'binaural', carrier: 200, beat: 40 }, // gamma / focus
    '528hz': { kind: 'binaural', carrier: 528, beat: 4 }, // 528Hz "love" tone
    '8hz': { kind: 'binaural', carrier: 200, beat: 8 },   // alpha / creativity
    '4hz': { kind: 'binaural', carrier: 200, beat: 4 },   // theta / healing
};

export function isSynthSound(id: string): boolean {
    return id in SYNTH_SOUNDS;
}

// ── Noise worklet loading (once per AudioContext) ────────────────────────────
const WORKLET_URL = '/audio/noise-processor.js';
const workletReady = new WeakMap<BaseAudioContext, Promise<boolean>>();

function ensureNoiseWorklet(ctx: BaseAudioContext): Promise<boolean> {
    let p = workletReady.get(ctx);
    if (!p) {
        p = (async () => {
            try {
                if (!ctx.audioWorklet) return false;
                await ctx.audioWorklet.addModule(WORKLET_URL);
                return true;
            } catch (e) {
                console.warn('Noise worklet failed to load; using buffer fallback', e);
                return false;
            }
        })();
        workletReady.set(ctx, p);
    }
    return p;
}

// ── Fallback noise generator (mirrors the worklet math, runs once) ───────────
// Output trim must match NOISE_TRIM in public/audio/noise-processor.js.
const NOISE_TRIM: Record<NoiseColor, number> = { white: 0.30, pink: 0.90, brown: 0.90, violet: 0.45 };

function fillNoise(out: Float32Array, color: NoiseColor): void {
    const trim = NOISE_TRIM[color];
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, brown = 0, lastWhite = 0;
    for (let i = 0; i < out.length; i++) {
        const white = Math.random() * 2 - 1;
        let v: number;
        if (color === 'pink') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            v = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        } else if (color === 'brown') {
            v = (brown + 0.02 * white) / 1.02;
            brown = v;
            v *= 3.5;
        } else if (color === 'violet') {
            v = (white - lastWhite) * 0.5;
            lastWhite = white;
        } else {
            v = white;
        }
        out[i] = v * trim;
    }
}

function makeNoiseLoopBuffer(ctx: BaseAudioContext, color: NoiseColor): AudioBuffer {
    const seconds = 12;
    const len = Math.floor(ctx.sampleRate * seconds);
    const left = new Float32Array(len);
    const right = new Float32Array(len);
    fillNoise(left, color);
    fillNoise(right, color);
    const baked = bakeSeamlessLoop([left, right], ctx.sampleRate);
    const buffer = ctx.createBuffer(2, baked[0].length, ctx.sampleRate);
    baked.forEach((ch, c) => buffer.copyToChannel(ch, c));
    return buffer;
}

// ── Voice ────────────────────────────────────────────────────────────────────
// API mirrors BufferLoopSound in SoundMixer.tsx: play(ctx, vol) / stop(ctx) /
// setVolume(ctx, vol, instant), with the same fade timings for a consistent feel.
export class SynthVoice {
    private spec: SynthSpec;
    private gain: GainNode | null = null;
    private oscillators: OscillatorNode[] = [];
    private worklet: AudioWorkletNode | null = null;
    private fallbackSource: AudioBufferSourceNode | null = null;

    constructor(spec: SynthSpec) {
        this.spec = spec;
    }

    async play(ctx: AudioContext, startVol: number): Promise<void> {
        this.teardownSources();
        if (!this.gain) {
            this.gain = ctx.createGain();
            this.gain.gain.value = 0;
            this.gain.connect(ctx.destination);
        }

        if (this.spec.kind === 'binaural') {
            this.buildBinaural(ctx, this.spec);
        } else {
            await this.buildNoise(ctx, this.spec);
        }

        const now = ctx.currentTime;
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(0, now);
        this.gain.gain.linearRampToValueAtTime(startVol, now + 1.5);
    }

    private buildBinaural(ctx: AudioContext, spec: { carrier: number; beat: number }): void {
        const merger = ctx.createChannelMerger(2);
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = 'sine';
        oscR.type = 'sine';
        oscL.frequency.value = spec.carrier - spec.beat / 2;
        oscR.frequency.value = spec.carrier + spec.beat / 2;
        oscL.connect(merger, 0, 0); // left ear
        oscR.connect(merger, 0, 1); // right ear
        merger.connect(this.gain!);
        oscL.start();
        oscR.start();
        this.oscillators = [oscL, oscR];
    }

    private async buildNoise(ctx: AudioContext, spec: { color: NoiseColor }): Promise<void> {
        const ok = await ensureNoiseWorklet(ctx);
        if (ok) {
            const node = new AudioWorkletNode(ctx, 'noise-processor', {
                numberOfInputs: 0,
                numberOfOutputs: 1,
                outputChannelCount: [2],
                processorOptions: { color: spec.color },
            });
            node.connect(this.gain!);
            this.worklet = node;
        } else {
            const src = ctx.createBufferSource();
            src.buffer = makeNoiseLoopBuffer(ctx, spec.color);
            src.loop = true;
            src.connect(this.gain!);
            src.start();
            this.fallbackSource = src;
        }
    }

    private teardownSources(): void {
        this.oscillators.forEach(o => { try { o.stop(); } catch { /* not started */ } try { o.disconnect(); } catch { /* noop */ } });
        this.oscillators = [];
        if (this.worklet) { try { this.worklet.port.postMessage('stop'); } catch { /* noop */ } try { this.worklet.disconnect(); } catch { /* noop */ } this.worklet = null; }
        if (this.fallbackSource) { try { this.fallbackSource.stop(); } catch { /* noop */ } try { this.fallbackSource.disconnect(); } catch { /* noop */ } this.fallbackSource = null; }
    }

    stop(ctx: AudioContext | null): void {
        if (!ctx || !this.gain) { this.teardownSources(); return; }
        const now = ctx.currentTime;
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(0, now + 1.0);
        // Detach sources after the fade so the tail is heard.
        const oscs = [...this.oscillators];
        const wl = this.worklet;
        const fb = this.fallbackSource;
        this.oscillators = [];
        this.worklet = null;
        this.fallbackSource = null;
        setTimeout(() => {
            oscs.forEach(o => { try { o.stop(); } catch { /* noop */ } try { o.disconnect(); } catch { /* noop */ } });
            if (wl) { try { wl.port.postMessage('stop'); } catch { /* noop */ } try { wl.disconnect(); } catch { /* noop */ } }
            if (fb) { try { fb.stop(); } catch { /* noop */ } try { fb.disconnect(); } catch { /* noop */ } }
        }, 1100);
    }

    setVolume(ctx: AudioContext | null, vol: number, instant: boolean): void {
        if (!ctx || !this.gain) return;
        const now = ctx.currentTime;
        this.gain.gain.cancelScheduledValues(now);
        if (instant) {
            this.gain.gain.setValueAtTime(vol, now);
        } else {
            this.gain.gain.setValueAtTime(this.gain.gain.value, now);
            this.gain.gain.linearRampToValueAtTime(vol, now + 0.3);
        }
    }
}

// ── Background-safe loops ─────────────────────────────────────────────────────
// iOS suspends the AudioContext when the app backgrounds, which silences synth
// voices. The background path plays a plain looping HTMLAudioElement, so each
// synth sound needs a seamless loop file. We render one to a WAV Blob on demand
// (no recorded asset ships in the bundle) and cache the object URL per sound.
//
// Binaural loops are cut to an exact integer number of cycles of BOTH tones, so
// the loop content is sample-continuous. Noise loops reuse the offline worklet
// render plus the crossfade bake. (A plain HTMLAudioElement may still insert a
// hairline gap at the file boundary, but at ~20s it is rare and screen-locked.)

function gcd(a: number, b: number): number {
    a = Math.round(a); b = Math.round(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
}

function renderBinauralLoop(spec: { carrier: number; beat: number }, sampleRate: number): Float32Array[] {
    const fL = spec.carrier - spec.beat / 2;
    const fR = spec.carrier + spec.beat / 2;
    const baseFreq = gcd(fL, fR);                       // both tones complete whole cycles at this rate
    const baseSamples = Math.round(sampleRate / baseFreq);
    const k = Math.max(1, Math.round((20 * sampleRate) / baseSamples)); // ~20s
    const len = baseSamples * k;
    const left = new Float32Array(len);
    const right = new Float32Array(len);
    const twoPi = Math.PI * 2;
    for (let n = 0; n < len; n++) {
        left[n] = Math.sin((twoPi * fL * n) / sampleRate);
        right[n] = Math.sin((twoPi * fR * n) / sampleRate);
    }
    return [left, right];
}

async function renderNoiseLoop(spec: { color: NoiseColor }, sampleRate: number): Promise<Float32Array[]> {
    const seconds = 22;
    const len = Math.floor(sampleRate * seconds);
    let channels: Float32Array[];
    const off = new OfflineAudioContext(2, len, sampleRate);
    if (await ensureNoiseWorklet(off)) {
        const node = new AudioWorkletNode(off, 'noise-processor', {
            numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
            processorOptions: { color: spec.color },
        });
        node.connect(off.destination);
        const r = await off.startRendering();
        channels = [r.getChannelData(0).slice(), r.getChannelData(1).slice()];
    } else {
        const l = new Float32Array(len), rr = new Float32Array(len);
        fillNoise(l, spec.color); fillNoise(rr, spec.color);
        channels = [l, rr];
    }
    return bakeSeamlessLoop(channels, sampleRate); // ~20s after the 2s crossfade
}

function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
    const numCh = channels.length;
    const len = channels[0].length;
    const blockAlign = numCh * 2; // 16-bit
    const dataSize = len * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE');
    writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
    writeStr(36, 'data'); view.setUint32(40, dataSize, true);
    let off = 44;
    for (let i = 0; i < len; i++) {
        for (let c = 0; c < numCh; c++) {
            const s = Math.max(-1, Math.min(1, channels[c][i]));
            view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            off += 2;
        }
    }
    return new Blob([buffer], { type: 'audio/wav' });
}

const loopBlobCache = new Map<string, Promise<string>>();

/** Object URL of a seamless loop WAV for a synth sound (for the background path). Cached per sound + rate. */
export function getSynthLoopBlobUrl(id: string, spec: SynthSpec, sampleRate: number): Promise<string> {
    const key = `${id}@${sampleRate}`;
    let p = loopBlobCache.get(key);
    if (!p) {
        p = (async () => {
            const channels = spec.kind === 'binaural'
                ? renderBinauralLoop(spec, sampleRate)
                : await renderNoiseLoop(spec, sampleRate);
            return URL.createObjectURL(encodeWav(channels, sampleRate));
        })();
        loopBlobCache.set(key, p);
    }
    return p;
}
