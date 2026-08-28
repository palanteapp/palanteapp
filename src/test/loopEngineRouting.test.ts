// loopEngine routing: which path a sound takes, and what number the seam is
// scheduled against.
//
// The dropout that shipped was a routing failure before it was an audio
// failure. SoundMixer sent every file down a streaming crossfade, and that
// crossfade took its deadline from HTMLMediaElement.duration, which includes
// the AAC encoder's trailing padding.
//
// There is now only one real path, so what has to be pinned down is that
// EVERYTHING reaches it:
//
//   1. Every file, longform included, must reach the AudioBufferSourceNode
//      path, where the wrap is performed by the audio thread and there is no
//      deadline to get wrong at all.
//   2. That is only true while every file stays under the in-memory size gate,
//      which is asserted directly against the shipped assets rather than
//      assumed.
//   3. A file that genuinely cannot decode still has to make a sound.
//
// The doubles in helpers/webAudioMock.ts deliberately report a `duration` that
// is FIVE SECONDS longer than loopSeconds. Any code that reads it produces
// visibly wrong numbers here.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import manifest from '../constants/loopManifest.json';
import type { LoopManifestEntry } from '../constants/bakedLoops';
import { PRE_BAKED_FADE_SECONDS } from '../utils/seamlessLoop';
import { MAX_SEAMLESS_COMPRESSED_BYTES } from '../utils/seamlessAudio';
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

    it('sends every longform entry to the AudioBuffer path too', async () => {
        // These nine used to be the whole reason a streaming path existed: at
        // 8-18 minutes they could not be held decoded. They are now baked to
        // 19-105 second loops (see `targetSec` in loopManifest.json), so they
        // take the same audio-thread wrap as everything else and the streaming
        // path they justified has been deleted.
        for (const entry of LONGFORM) {
            harness?.restore();
            const rate = 48000;
            harness = installWebAudio({
                decoded: paddedDecodedBuffer(
                    Math.round(entry.loopSeconds! * rate),
                    Math.round((PADDING_MS / 1000) * rate),
                    rate,
                ),
            });
            const handle = await startLoop({ src: srcOf(entry) });
            expect(handle?.mode, `${entry.id} should decode`).toBe('buffer');
            expect(harness.elements, `${entry.id} created a media element`).toHaveLength(0);
            handle?.stop();
        }
    });

    it('holds every library file under the in-memory size gate', async () => {
        // The collapse to one path is only valid while every file actually
        // fits. seamlessAudio rejects anything over MAX_SEAMLESS_COMPRESSED_BYTES
        // when it cannot read a header, and .m4a has no MP3 header to read, so
        // a track that grows past that cap would silently drop to the element
        // fallback and start wrapping on `duration` again.
        const { statSync, existsSync } = await import('node:fs');
        const { resolve } = await import('node:path');
        const PUBLIC = resolve(__dirname, '../../public');
        const oversized: string[] = [];
        for (const entry of [...BAKED, ...LONGFORM]) {
            const file = resolve(PUBLIC, entry.out ?? entry.src);
            if (!existsSync(file)) continue;
            if (statSync(file).size > MAX_SEAMLESS_COMPRESSED_BYTES) {
                oversized.push(`${entry.id} ${(statSync(file).size / 1e6).toFixed(1)}MB`);
            }
        }
        expect(oversized, 'these would fall back to the element loop').toEqual([]);
    });

    it('keeps a decode failure audible by falling back to a looping element', async () => {
        // No decoded buffer configured, so loadSeamlessBuffer resolves null.
        // The fallback wraps on `duration` and so keeps the encoder padding at
        // the seam; it exists to keep a broken file audible, not to loop well.
        const entry = entryFor('calm-wind');
        harness = installWebAudio();
        const handle = await startLoop({ src: srcOf(entry) });
        expect(handle?.mode).toBe('element');
        handle?.stop();
    });
});


// ── 2. The buffer path's loop bounds ─────────────────────────────────────────

describe('buffer path loop bounds', () => {
    // seamlessAudio.ts caches decoded buffers per src for the life of the
    // module, so every case here uses a sound no other test in this file
    // loads — otherwise a later case would be handed an earlier case's buffer.
    const CASES = ['waterfall', 'camp-fire', 'box-fan', 'night-crickets'];

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
