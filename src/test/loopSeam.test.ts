// Seam math against the REAL decoded audio the app ships.
//
// This is the test that would have caught the dropout. Everything else in the
// loop stack can be unit-tested against synthetic signals (see
// seamlessLoop.test.ts); the defect that shipped lived in the gap between the
// numbers in loopManifest.json and the samples an actual AAC decoder produces,
// and only real files can prove that gap is handled.
//
// The claim under test, per file:
//
//   Cut the decoded stream at exactly `loopSeconds` and wrap it back to sample
//   zero, and the join is inaudible — no step, no hole, no dead air.
//
// and the matching negative claim, which is the shipped bug:
//
//   Everything the decoder emits AFTER `loopSeconds` is encoder padding. It is
//   near-silence. An engine that wraps at HTMLMediaElement.duration (which
//   includes it) crossfades into that silence every single loop.
//
// Metrics come from ./helpers/seamMetrics.ts, which the browser QA harness
// (loopqa/harness.ts) also imports, so the automated suite and the manual one
// cannot grade a seam differently.

import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import manifest from '../constants/loopManifest.json';
import type { LoopManifestEntry } from '../constants/bakedLoops';
import { crossSeamRmsRatio, seamStepRatio, rms } from './helpers/seamMetrics';
import { decodeEnds, hasFfmpeg, type DecodedEnds } from './helpers/decodeAudio';

const PUBLIC = resolve(__dirname, '../../public');
const ENTRIES = [...manifest.baked, ...manifest.longform] as LoopManifestEntry[];

// ── The subset ───────────────────────────────────────────────────────────────
// Eight tracks, chosen to span every axis that could break the slice rather
// than to flatter it: all three sample rates in the library, mono and stereo,
// 7 seconds to 10 minutes, both routing paths, and both the smallest and the
// largest encoder padding in the library.
const SUBSET = [
    'gentle-rain',           // 48kHz stereo, 24s texture, in-memory path
    'calm-wind',             // 24kHz, shortest file in the library (7.4s)
    'camp-fire',             // 44.1kHz stereo, crackle transients across the seam
    'ocean-waves',           // 44.1kHz, slow swell — level genuinely moves at the seam
    'box-fan',               // 48kHz, only 0.35ms of padding: control for the padding metric
    'bilateral-tranquility', // longform, 10min stereo, streaming path
    'busy-cafe-3',           // longform, largest padding in the library (~30ms)
    'whale-sounds',          // longform, periodic content, streams despite a small file
];

// ── Thresholds ───────────────────────────────────────────────────────────────
// A 20ms window is the shortest span at which a dropout is reliably audible
// rather than perceived as a click, and it is short enough that a 12-30ms
// padding tail dominates it. Values below are measured across the subset with
// a stated margin, not guessed.

/** Window straddling the wrap vs. its immediate neighbours. */
const SEAM_WINDOW_MS = 20;
/** Measured across the subset at loopSeconds: 0.85 .. 1.21. At the file's full
 *  decoded duration (the broken anchor) five of the eight fall to 0.58-0.66. */
const MIN_CROSS_SEAM_RMS_RATIO = 0.75;
/** Single-sample step at the wrap, in units of the largest step the surrounding
 *  audio already makes. Measured across the subset: 0.06 .. 0.96. A generous
 *  ceiling — this metric is a gross-click guard, and one sample of a 24kHz
 *  stream is not by itself audible; the RMS ratio above is the sensitive one. */
const MAX_SEAM_STEP_RATIO = 3.0;
/** The last 20ms INSIDE the loop must still be real audio. Measured: 0.46 ..
 *  1.62 of whole-file RMS. If a future bake let the slice end in silence, the
 *  loop would breathe once per cycle. */
const MIN_SLICE_TAIL_RMS_RATIO = 0.25;
/** Everything past loopSeconds must be padding, i.e. essentially silence.
 *  Measured: 0.0023 .. 0.106 of whole-file RMS — a full order of magnitude
 *  below the floor above, which is what makes the two claims separable. */
const MAX_PADDING_RMS_RATIO = 0.30;

interface Measured {
    id: string;
    sampleRate: number;
    paddingMs: number;
    crossSeamAtLoopSeconds: number;
    crossSeamAtDuration: number;
    seamStep: number;
    sliceTailRmsRatio: number;
    paddingRmsRatio: number;
}

function measure(entry: LoopManifestEntry, decoded: DecodedEnds): Measured {
    const { head, tail, totalSamples, sampleRate, fileRms } = decoded;
    const win = Math.round((SEAM_WINDOW_MS / 1000) * sampleRate);

    // Where the loop really ends, as a sample index into the decoded stream.
    const loopSamples = Math.round(entry.loopSeconds! * sampleRate);
    // `tail` holds the LAST tail.length samples, so shift into its frame.
    const tailOffset = totalSamples - tail.length;
    const endInTail = Math.min(loopSamples - tailOffset, tail.length);

    // Two candidate wrap points: the manifest's (correct) and the decoded
    // length (what HTMLMediaElement.duration reports, and what the shipped
    // DualPlayerLoop scheduled its crossfade to land on).
    const atLoopSeconds = tail.subarray(0, endInTail);
    const atDuration = tail;

    return {
        id: entry.id,
        sampleRate,
        paddingMs: ((totalSamples - loopSamples) / sampleRate) * 1000,
        crossSeamAtLoopSeconds: crossSeamRmsRatio(head, atLoopSeconds, win),
        crossSeamAtDuration: crossSeamRmsRatio(head, atDuration, win),
        seamStep: seamStepRatio(head, atLoopSeconds, win),
        sliceTailRmsRatio: rms(atLoopSeconds, endInTail - win, endInTail) / fileRms,
        paddingRmsRatio: endInTail >= tail.length ? 0 : rms(tail, endInTail, tail.length) / fileRms,
    };
}

const describeAudio = hasFfmpeg ? describe : describe.skip;

describeAudio('loop seam, measured on the shipped audio', () => {
    const results = new Map<string, Measured>();

    // One decode per file, shared by every assertion below. The three longform
    // tracks are 6-18 minutes each; decoding all eight takes ~1.5s.
    async function load(id: string): Promise<Measured> {
        const cached = results.get(id);
        if (cached) return cached;
        const entry = ENTRIES.find(e => e.id === id);
        if (!entry) throw new Error(`no manifest entry for ${id}`);
        const file = resolve(PUBLIC, (entry.out ?? entry.src));
        // 200ms head / 400ms tail: comfortably more than the 1.5 windows each
        // metric needs, plus room for the padding that sits inside the tail.
        const decoded = await decodeEnds(file, Math.round(0.2 * 48000), Math.round(0.4 * 48000));
        const m = measure(entry, decoded);
        results.set(id, m);
        return m;
    }

    for (const id of SUBSET) {
        describe(id, () => {
            it('claims no more audio than the decoder produces', async () => {
                const m = await load(id);
                // Negative padding = loopSeconds runs past the end of the file.
                // One AAC frame of slack (1024 samples ≈ 21-43ms) is not
                // acceptable here; the encode round-trip agrees to well under
                // a millisecond, so anything more is a stale manifest.
                expect(m.paddingMs).toBeGreaterThan(-1);
            }, 30_000);

            it('wraps without a level hole at loopSeconds', async () => {
                const m = await load(id);
                expect(m.crossSeamAtLoopSeconds).toBeGreaterThan(MIN_CROSS_SEAM_RMS_RATIO);
            }, 30_000);

            it('wraps without a step discontinuity at loopSeconds', async () => {
                const m = await load(id);
                expect(m.seamStep).toBeLessThan(MAX_SEAM_STEP_RATIO);
            }, 30_000);

            it('ends on real audio, not on trailing digital silence', async () => {
                // THE defect. If the slice is taken anywhere at or past the
                // decoder's full output, its final milliseconds are the AAC
                // encoder's padding and the loop fades to nothing every cycle.
                const m = await load(id);
                expect(m.sliceTailRmsRatio).toBeGreaterThan(MIN_SLICE_TAIL_RMS_RATIO);
            }, 30_000);

            it('leaves the encoder padding outside the loop', async () => {
                const m = await load(id);
                expect(m.paddingRmsRatio).toBeLessThan(MAX_PADDING_RMS_RATIO);
            }, 30_000);
        });
    }

    describe('the metric actually discriminates', () => {
        // Guard against the thresholds above being so loose that they would
        // have passed the broken engine too. Anchoring the wrap on the decoded
        // duration instead of loopSeconds must visibly degrade the seam.
        it('scores the duration-anchored wrap worse than the loopSeconds wrap', async () => {
            const measured = await Promise.all(SUBSET.map(load));
            const withPadding = measured.filter(m => m.paddingMs > 1);
            expect(withPadding.length).toBeGreaterThanOrEqual(6);

            const regressed = withPadding.filter(
                m => m.crossSeamAtDuration < MIN_CROSS_SEAM_RMS_RATIO,
            );
            // Most files with real padding must FAIL the seam threshold when
            // wrapped at duration. (Not all: how badly a 12-30ms hole scores
            // depends on the material — a café is denser than a fan hum.)
            expect(regressed.length).toBeGreaterThanOrEqual(4);

            const better = measured.filter(m => m.crossSeamAtLoopSeconds > m.crossSeamAtDuration);
            expect(better.length).toBeGreaterThanOrEqual(6);
        }, 60_000);

        it('finds encoder padding on nearly every file (the thing being sliced off)', async () => {
            const measured = await Promise.all(SUBSET.map(load));
            const padded = measured.filter(m => m.paddingMs > 1);
            expect(padded.length).toBeGreaterThanOrEqual(6);
            // Documented range across the whole library: 0.35ms .. 29.5ms.
            expect(Math.max(...measured.map(m => m.paddingMs))).toBeLessThan(50);
        }, 60_000);
    });
});
