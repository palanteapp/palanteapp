// loopEngine routing: which path a sound takes, and what number the seam is
// scheduled against.
//
// The dropout that shipped was a routing failure before it was an audio
// failure. SoundMixer sent every file — including the 33 that comfortably fit
// in memory — down a streaming crossfade, and that crossfade took its deadline
// from HTMLMediaElement.duration, which includes the AAC encoder's trailing
// padding. Two separate mistakes, so two separate things to pin down here:
//
//   1. Files that fit in memory must reach the AudioBufferSourceNode path,
//      where the wrap is performed by the audio thread and there is no
//      deadline to get wrong at all. Only the 9 `longform` entries may stream.
//   2. On the streaming path that does remain, every scheduled instant must be
//      derived from the manifest's `loopSeconds` and never from `duration`.
//
// The doubles in helpers/webAudioMock.ts deliberately report a `duration` that
// is FIVE SECONDS longer than loopSeconds. Any code that reads it produces
// visibly wrong numbers here.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import manifest from '../constants/loopManifest.json';
import type { LoopManifestEntry } from '../constants/bakedLoops';
import { PRE_BAKED_FADE_SECONDS } from '../utils/seamlessLoop';
import { startLoop, type LoopLogEvent } from '../utils/loopEngine';
import {
    installWebAudio,
    paddedDecodedBuffer,
    type WebAudioHarness,
} from './helpers/webAudioMock';

const BAKED = manifest.baked as LoopManifestEntry[];
const LONGFORM = manifest.longform as LoopManifestEntry[];

/** Padding the encoder leaves behind, at the top of the measured range. */
const PADDING_MS = 24;
/** How much longer than the true loop the element claims to be. */
const FAKE_DURATION_EXCESS_SEC = 5;

const entryFor = (id: string) => [...BAKED, ...LONGFORM].find(e => e.id === id)!;
const srcOf = (e: LoopManifestEntry) => '/' + (e.out ?? e.src);

let harness: WebAudioHarness;

afterEach(() => {
    harness?.restore();
    vi.useRealTimers();
});

// ── 1. Routing ───────────────────────────────────────────────────────────────

describe('startLoop routing', () => {
    it('sends an in-memory file to the AudioBuffer path', async () => {
        const entry = entryFor('gentle-rain');
        const rate = 48000;
        harness = installWebAudio({
            decoded: paddedDecodedBuffer(
                Math.round(entry.loopSeconds! * rate),
                Math.round((PADDING_MS / 1000) * rate),
                rate,
            ),
        });

        const logs: LoopLogEvent[] = [];
        const handle = await startLoop({ src: srcOf(entry), onLog: e => logs.push(e) });

        expect(handle?.mode).toBe('buffer');
        expect(logs).toContainEqual({
            type: 'mode', mode: 'buffer', src: srcOf(entry), loopSeconds: entry.loopSeconds,
        });
        // A buffer-path sound must not create media elements at all: an element
        // is what brings `duration`, stalls and handoffs back into the picture.
        expect(harness.elements).toHaveLength(0);
        expect(harness.ctx.bufferSources).toHaveLength(1);
    });

    it('sends every longform entry to the streaming path without decoding it', async () => {
        for (const entry of LONGFORM) {
            harness?.restore();
            harness = installWebAudio();
            const handle = await startLoop({ src: srcOf(entry) });
            expect(handle?.mode, `${entry.id} should stream`).toBe('stream');
            // Not merely "it ended up streaming": it must never have tried to
            // decode. om-gum alone is ~380MB of float32; discovering that by
            // allocating it is how an older device gets the app killed.
            expect(harness.ctx.decodeCalls, `${entry.id} attempted a decode`).toBe(0);
            expect(harness.fetchCalls, `${entry.id} fetched the whole file`).toEqual([]);
            handle?.stop();
        }
    });

    it('routes on the manifest flag, not on file size', async () => {
        // whale-sounds is 5.4MB compressed — UNDER seamlessAudio's 6.5MB
        // in-memory fallback cap, and smaller than several tracks that do get
        // decoded. It still has to stream: 525s at 24kHz is ~50MB decoded, and
        // only the manifest knows that. A size heuristic misroutes this one.
        const entry = entryFor('whale-sounds');
        harness = installWebAudio();
        const handle = await startLoop({ src: srcOf(entry) });
        expect(handle?.mode).toBe('stream');
        expect(harness.ctx.decodeCalls).toBe(0);
        handle?.stop();
    });

    it('keeps a decode failure audible by falling back to streaming', async () => {
        // No decoded buffer configured, so loadSeamlessBuffer resolves null.
        const entry = entryFor('calm-wind');
        harness = installWebAudio();
        const handle = await startLoop({ src: srcOf(entry) });
        expect(handle?.mode).toBe('stream');
        handle?.stop();
    });
});

// ── 2. The buffer path's loop bounds ─────────────────────────────────────────

describe('buffer path loop bounds', () => {
    // seamlessAudio.ts caches decoded buffers per src for the life of the
    // module, so every case here uses a sound no other test in this file
    // loads — otherwise a later case would be handed an earlier case's buffer.
    const CASES = ['waterfall', 'camp-fire', 'box-fan', 'set-adrift'];

    for (const id of CASES) {
        it(`${id}: loops on loopSeconds, not on the padded decode`, async () => {
            const entry = entryFor(id);
            const rate = 44100;
            const loopSamples = Math.round(entry.loopSeconds! * rate);
            const paddingSamples = Math.round((PADDING_MS / 1000) * rate);
            harness = installWebAudio({
                decoded: paddedDecodedBuffer(loopSamples, paddingSamples, rate),
            });

            const handle = await startLoop({ src: srcOf(entry) });
            expect(handle?.mode).toBe('buffer');

            const source = harness.ctx.bufferSources[0];
            expect(source.loop).toBe(true);
            expect(source.loopStart).toBe(0);

            // planLoopBuffer folds the last PRE_BAKED_FADE_SECONDS into the
            // head as a 30ms touch-up, so the playable buffer is that much
            // shorter than loopSeconds. What matters is the reference point:
            // the length derives from loopSeconds, so the padding is gone.
            const expected = (loopSamples - Math.floor(PRE_BAKED_FADE_SECONDS * rate)) / rate;
            expect(source.loopEnd).toBeCloseTo(expected, 5);

            // The falsifiable half: had anything measured the decoded buffer
            // instead, loopEnd would sit at least a padding-length later.
            const paddedEnd = (loopSamples + paddingSamples - Math.floor(PRE_BAKED_FADE_SECONDS * rate)) / rate;
            expect(source.loopEnd).toBeLessThan(paddedEnd - 0.02);
            expect(source.buffer!.length).toBe(loopSamples - Math.floor(PRE_BAKED_FADE_SECONDS * rate));
        });
    }

    it('starts the loop immediately and needs no per-cycle timer', async () => {
        const entry = entryFor('forest');
        const rate = 48000;
        harness = installWebAudio({
            decoded: paddedDecodedBuffer(Math.round(entry.loopSeconds! * rate), 1024, rate),
        });
        const before = harness.timerDelays.length;
        const handle = await startLoop({ src: srcOf(entry) });
        expect(handle?.mode).toBe('buffer');
        // No wrap timer: the audio thread performs every cycle. (stop() does
        // schedule one teardown timer — that is not a per-cycle deadline.)
        expect(harness.timerDelays.slice(before)).toEqual([]);
        expect(harness.ctx.bufferSources[0].startCalls).toEqual([0]);
    });
});

// ── 3. The streaming path's deadline ─────────────────────────────────────────

describe('stream path schedules against loopSeconds, never duration', () => {
    const STREAM_ARM_LEAD_SEC = 4.0;
    const STREAM_OVERLAP_SEC = 0.06;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('arms the wrap a fixed lead before loopSeconds', async () => {
        const entry = entryFor('bilateral-tranquility');
        const loopSeconds = entry.loopSeconds!;
        harness = installWebAudio();

        const handle = await startLoop({ src: srcOf(entry) });
        expect(handle?.mode).toBe('stream');
        // Both elements exist and claim to be longer than the loop really is.
        expect(harness.elements).toHaveLength(2);
        for (const el of harness.elements) el.duration = loopSeconds + FAKE_DURATION_EXCESS_SEC;

        await vi.advanceTimersByTimeAsync(1);

        const expectedArmMs = (loopSeconds - STREAM_ARM_LEAD_SEC) * 1000;
        const wrongArmMs = (loopSeconds + FAKE_DURATION_EXCESS_SEC - STREAM_ARM_LEAD_SEC) * 1000;
        const armDelays = harness.timerDelays.filter(d => d > 1000);
        expect(armDelays.some(d => Math.abs(d - expectedArmMs) < 1)).toBe(true);
        expect(armDelays.some(d => Math.abs(d - wrongArmMs) < 1)).toBe(false);

        handle?.stop();
    });

    it('lands the crossfade on loopSeconds, five seconds before the file ends', async () => {
        const entry = entryFor('busy-cafe-3');
        const loopSeconds = entry.loopSeconds!;
        harness = installWebAudio();

        const logs: LoopLogEvent[] = [];
        const handle = await startLoop({ src: srcOf(entry), onLog: e => logs.push(e) });
        for (const el of harness.elements) el.duration = loopSeconds + FAKE_DURATION_EXCESS_SEC;

        const t0 = harness.ctx.currentTime;
        await vi.advanceTimersByTimeAsync((loopSeconds - STREAM_ARM_LEAD_SEC) * 1000 + 10);

        const armed = logs.filter(e => e.type === 'wrap-armed');
        expect(armed).toHaveLength(1);
        const event = armed[0] as Extract<LoopLogEvent, { type: 'wrap-armed' }>;
        expect(event.loopSeconds).toBe(loopSeconds);
        expect(event.atCtxTime).toBeCloseTo(t0 + loopSeconds, 6);
        expect(event.atCtxTime).not.toBeCloseTo(t0 + loopSeconds + FAKE_DURATION_EXCESS_SEC, 3);

        // And the gain automation actually on the params agrees: the outgoing
        // voice reaches zero exactly at the seam, having started its ramp one
        // overlap earlier. The regression ramped to zero at `duration`, i.e.
        // after the file had already gone silent.
        const rampTimes = harness.ctx.gains.flatMap(g => g.gain.rampTimes());
        expect(rampTimes.some(t => Math.abs(t - (t0 + loopSeconds)) < 1e-6)).toBe(true);
        expect(rampTimes.some(t => t > t0 + loopSeconds + 0.5)).toBe(false);

        const setTimes = harness.ctx.gains.flatMap(g =>
            g.gain.events.filter(e => e.type === 'setValueAtTime').map(e => e.time));
        expect(setTimes.some(t => Math.abs(t - (t0 + loopSeconds - STREAM_OVERLAP_SEC)) < 1e-6)).toBe(true);

        handle?.stop();
    });

    it('never schedules anything past loopSeconds for any longform entry', async () => {
        for (const entry of LONGFORM) {
            harness?.restore();
            harness = installWebAudio();
            const loopSeconds = entry.loopSeconds!;
            const logs: LoopLogEvent[] = [];
            const handle = await startLoop({ src: srcOf(entry), onLog: e => logs.push(e) });
            for (const el of harness.elements) el.duration = loopSeconds + FAKE_DURATION_EXCESS_SEC;
            // Let the initial play() promise settle so the wrap timer exists.
            await vi.advanceTimersByTimeAsync(1);

            const t0 = harness.ctx.currentTime;
            await vi.advanceTimersByTimeAsync((loopSeconds - STREAM_ARM_LEAD_SEC) * 1000 + 10);

            const rampTimes = harness.ctx.gains.flatMap(g => g.gain.rampTimes());
            const late = rampTimes.filter(t => t > t0 + loopSeconds + 1e-6);
            expect(late, `${entry.id} scheduled past its loop point`).toEqual([]);

            const armed = logs.find(e => e.type === 'wrap-armed');
            expect(armed, `${entry.id} never armed a wrap`).toBeDefined();
            handle?.stop();
        }
    }, 30_000);
});
