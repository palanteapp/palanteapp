// Manifest integrity for the soundscape library.
//
// The gapless engine is only as correct as loopManifest.json. It is the ONLY
// record of where a baked loop actually ends: the AAC encoder rounds every
// stream up to whole 1024-sample frames, so the decoder hands the app a few
// extra milliseconds of near-silence that nothing in the audio itself marks as
// padding. `loopSeconds` is what lets the runtime slice that off to the sample.
//
// The shipped regression was an engine that ignored this file and scheduled off
// HTMLMediaElement.duration instead — the padded length — so every wrap
// crossfaded into the encoder's silence. These tests keep the manifest honest
// enough for the fix to stand: a sound with no entry, an entry pointing at a
// file that no longer exists, or a `loopSeconds` that drifted away from the
// audio after a re-bake all put the engine back on the wrong number.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../constants/loopManifest.json';
import { preBakedEntry, type LoopManifestEntry } from '../constants/bakedLoops';
import { SYNTH_SOUNDS } from '../utils/synthSounds';
import { probeStream, hasFfmpeg } from './helpers/decodeAudio';

const REPO = resolve(__dirname, '../..');
const PUBLIC = resolve(REPO, 'public');
const SOUND_MIXER = resolve(REPO, 'src/components/SoundMixer.tsx');

const BAKED = manifest.baked as LoopManifestEntry[];
const LONGFORM = manifest.longform as LoopManifestEntry[];
const ENTRIES = [...BAKED, ...LONGFORM];

// Sounds in the mixer that are deliberately NOT loops, so deliberately not in
// the manifest. Anything else missing an entry is a bug, not an exemption.
const EXEMPT_SOUND_IDS = new Set([
    // A single gong strike used as a one-shot punctuation, not a bed. It has no
    // loop point to bake, and looping it would be wrong even if it did.
    'gong',
]);

/** Every { id, src } the Sound Mixer can play, read out of the component source. */
function readMixerSounds(): { id: string; src: string }[] {
    const source = readFileSync(SOUND_MIXER, 'utf8');
    const re = /\{\s*id:\s*'([^']+)',[^}]*?src:\s*'([^']+)'/g;
    const found: { id: string; src: string }[] = [];
    for (let m = re.exec(source); m; m = re.exec(source)) {
        found.push({ id: m[1], src: m[2] });
    }
    return found;
}

/** "/sounds/x.m4a" / "/Autumn%20Wind.m4a" → an absolute path under public/. */
function publicPath(src: string): string {
    return resolve(PUBLIC, decodeURIComponent(src).replace(/^\/+/, ''));
}

const MIXER_SOUNDS = readMixerSounds();
const FILE_SOUNDS = MIXER_SOUNDS.filter(s => !(s.id in SYNTH_SOUNDS));

describe('sound library / manifest coverage', () => {
    it('finds the mixer sound list (guards the parser itself)', () => {
        // If SoundMixer's list changes shape, every other assertion here would
        // silently pass over an empty array. Fail loudly instead.
        expect(MIXER_SOUNDS.length).toBeGreaterThanOrEqual(40);
        expect(FILE_SOUNDS.length).toBeGreaterThanOrEqual(35);
    });

    it('every synth voice in the mixer is a real SYNTH_SOUNDS entry', () => {
        const synthIds = MIXER_SOUNDS.filter(s => s.id in SYNTH_SOUNDS).map(s => s.id);
        expect(synthIds.sort()).toEqual(Object.keys(SYNTH_SOUNDS).sort());
    });

    it('every file-backed sound resolves to a file on disk', () => {
        const missing = FILE_SOUNDS.filter(s => !existsSync(publicPath(s.src)));
        expect(missing.map(s => `${s.id} -> ${s.src}`)).toEqual([]);
    });

    it('every file-backed sound is either baked or explicitly exempt', () => {
        const uncovered = FILE_SOUNDS
            .filter(s => !EXEMPT_SOUND_IDS.has(s.id))
            .filter(s => !preBakedEntry(s.src))
            .map(s => `${s.id} -> ${s.src}`);
        expect(uncovered).toEqual([]);
    });

    it('does not carry stale exemptions', () => {
        // An exempt id that later gets baked, or gets removed from the mixer,
        // should force this list to be revisited rather than rot.
        for (const id of EXEMPT_SOUND_IDS) {
            const sound = MIXER_SOUNDS.find(s => s.id === id);
            expect(sound, `exempt id "${id}" is no longer in the mixer`).toBeDefined();
            expect(preBakedEntry(sound!.src), `exempt id "${id}" is baked now`).toBeUndefined();
        }
    });
});

describe('loopManifest.json structure', () => {
    it('has unique ids and unique output paths', () => {
        const ids = ENTRIES.map(e => e.id);
        expect(new Set(ids).size).toBe(ids.length);
        const outs = ENTRIES.map(e => e.out ?? e.src);
        expect(new Set(outs).size).toBe(outs.length);
    });

    it('every entry points at a file that exists and is non-empty', () => {
        const broken = ENTRIES
            .map(e => ({ id: e.id, path: publicPath('/' + (e.out ?? e.src)) }))
            .filter(e => !existsSync(e.path) || statSync(e.path).size === 0)
            .map(e => `${e.id} -> ${e.path}`);
        expect(broken).toEqual([]);
    });

    it('every entry has a positive, finite loopSeconds', () => {
        const bad = ENTRIES
            .filter(e => !Number.isFinite(e.loopSeconds) || !(e.loopSeconds! > 0))
            .map(e => `${e.id}: ${e.loopSeconds}`);
        expect(bad).toEqual([]);
    });

    it('marks nothing as streaming', () => {
        // The streaming path is gone. It existed only for the nine long-form
        // pieces, which at 8-18 minutes could not be held decoded; they are now
        // capped by `targetSec` to loops the buffer path can take, so a
        // surviving `stream` flag would point at an engine branch that no
        // longer exists.
        expect(ENTRIES.filter(e => e.stream).map(e => e.id)).toEqual([]);
        // Deliberately no count assertion here: the size of the longform list is
        // a content decision (tracks get added and removed), not a structural
        // claim, and pinning it only produces a failure that has to be edited
        // rather than one that has to be understood.
    });

    it('caps every loop that a material tier says is too long', () => {
        // Decoded audio is the app's dominant memory cost, and it is what put a
        // four-sound nature mix at 272MB against budgets that permitted 224MB.
        // A track carrying `targetSec` must actually have been baked down to
        // roughly it; drift here means the manifest and the assets disagree
        // about how much memory a mix costs.
        const over = ENTRIES
            .filter(e => e.targetSec && e.loopSeconds! > e.targetSec * 2.5)
            .map(e => `${e.id}: ${e.loopSeconds!.toFixed(1)}s vs target ${e.targetSec}s`);
        expect(over).toEqual([]);
    });
});

describe.skipIf(!hasFfmpeg)('loopSeconds vs. the real audio', () => {
    // ffprobe reports the container duration, which already accounts for the
    // gapless metadata — so it lands within a millisecond of the true loop end.
    // (The DECODER still emits 0.3–30ms past this; that residue is what
    // seam tests measure. See src/test/loopSeam.test.ts.)
    //
    // Tolerance is deliberately tight and two-sided:
    //   • Overshoot means loopSeconds describes audio the file does not
    //     contain, so the wrap lands in padding — the shipped bug, in the
    //     manifest instead of the engine.
    //   • A large undershoot means loopSeconds is stale relative to a re-baked
    //     file, so the engine would cut the loop short of its matched seam.
    // Measured spread across all 42 shipped tracks: -0.75ms .. +0.63ms.
    const TOLERANCE_SEC = 0.002;

    it('agrees with the container duration for every entry', () => {
        const offenders: string[] = [];
        for (const entry of ENTRIES) {
            const file = publicPath('/' + (entry.out ?? entry.src));
            const { durationSec } = probeStream(file);
            const deltaMs = (durationSec - entry.loopSeconds!) * 1000;
            if (Math.abs(deltaMs) > TOLERANCE_SEC * 1000) {
                offenders.push(`${entry.id}: duration ${durationSec}s vs loopSeconds ${entry.loopSeconds}s (${deltaMs.toFixed(3)}ms)`);
            }
        }
        expect(offenders).toEqual([]);
    }, 60_000);

    it('never claims a loop longer than the file', () => {
        const overshoot = ENTRIES
            .map(e => ({ e, d: probeStream(publicPath('/' + (e.out ?? e.src))).durationSec }))
            .filter(({ e, d }) => e.loopSeconds! > d + TOLERANCE_SEC)
            .map(({ e, d }) => `${e.id}: loopSeconds ${e.loopSeconds} > duration ${d}`);
        expect(overshoot).toEqual([]);
    }, 60_000);
});

describe('streaming vs. in-memory routing cannot be inferred from size', () => {
    // Load-bearing for loopEngine: it is tempting to route by "is this file big"
    // (seamlessAudio.ts still falls back to MAX_SEAMLESS_COMPRESSED_BYTES when
    // it cannot read a header). No such threshold exists for this library — the
    // sets overlap on BOTH compressed and decoded size — so routing has to read
    // the manifest's `stream` flag. If a future re-bake ever separates them,
    // this test fails and the constraint can be relaxed deliberately.
    const sizeOf = (e: LoopManifestEntry) => statSync(publicPath('/' + (e.out ?? e.src))).size;

    it('compressed size does not separate the two sets', () => {
        const largestBaked = Math.max(...BAKED.map(sizeOf));
        const smallestLongform = Math.min(...LONGFORM.map(sizeOf));
        expect(smallestLongform).toBeLessThan(largestBaked * 2);
        // The two lists overlap in size: some longform entries are smaller than
        // several baked ones, so no single byte threshold ever separated them.
        // This is why routing was moved to a manifest flag and then, once every
        // file fit in memory, dropped entirely.
        expect(LONGFORM.some(e => sizeOf(e) < 6_500_000)).toBe(true);
    });

    it.skipIf(!hasFfmpeg)('decoded size does not separate them either', () => {
        const decodedBytes = (e: LoopManifestEntry) => {
            const { sampleRate, channels } = probeStream(publicPath('/' + (e.out ?? e.src)));
            return e.loopSeconds! * sampleRate * 4 * channels;
        };
        const largestBaked = Math.max(...BAKED.map(decodedBytes));
        const smallestLongform = Math.min(...LONGFORM.map(decodedBytes));
        expect(smallestLongform).toBeLessThan(largestBaked);
    }, 60_000);
});
