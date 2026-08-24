#!/usr/bin/env node
// Offline seamless-loop baker for the sound library.
//
// The runtime can only ever crossfade the LAST n seconds of a file onto its
// head. That sounds clean on stationary textures but seams badly on anything
// with structure, because an arbitrary cut point makes the tail and head
// uncorrelated. This script fixes that upstream: for each file it SEARCHES for
// the loop end whose tail best matches the head (normalized cross-correlation),
// snaps both edges to zero crossings, then equal-power crossfades across the
// matched region. The result is a file whose end already continues into its
// start, so looping it is seamless.
//
// Usage:
//   node scripts/bake-loops.mjs --report           # dry-run, print seam metrics
//   node scripts/bake-loops.mjs --write             # bake + overwrite outputs
//   node scripts/bake-loops.mjs --write ocean-waves # one id only
//   node scripts/bake-loops.mjs --all --report      # MANIFEST + LONGFORM
//   node scripts/bake-loops.mjs --all --tune --report
//        ↑ ignore the hand-picked `fade` and try a spread of windows per file,
//          keeping whichever actually bakes the best seam. The chosen window is
//          printed in the `fade` column so a good one can be written back into
//          loopManifest.json.
//
// Sources are read from audio-raw/ (created on first run by copying the current
// public files); baked outputs are written to public/. This keeps an untouched
// master so re-baking with different params is always possible.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'audio-raw');
const PUBLIC = path.join(ROOT, 'public');

// ── Manifest: id → { src (relative to public), fade s, treatment } ───────────
// treatment tunes the loop search; 'texture' allows a long loop near full
// length, 'periodic' demands tighter tail/head alignment for wave/call cycles.
//
// This lives in src/constants/loopManifest.json because the RUNTIME needs it
// too: src/utils/seamlessAudio.ts must know which public/ files already carry a
// correlation-matched seam so it does not blindly rebuild one on top. Keeping
// one file means the two can never disagree about what was baked.
//
// `baked`    — decoded into memory and looped by the audio thread at runtime.
// `longform` — 8–18 minute pieces, far too large to hold decoded, so they keep
//              streaming. We still bake ONE clean tail→head seam so the single,
//              rare loop is continuous. Full length is preserved; bilateral
//              tracks keep their stereo panning (`stereo: true`). Whale is
//              transcoded from an 80MB 24-bit WAV.
const MANIFEST_PATH = path.join(ROOT, 'src/constants/loopManifest.json');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const MANIFEST = manifest.baked;
const LONGFORM = manifest.longform;

// ── ffmpeg decode / encode ───────────────────────────────────────────────────
function decode(file, targetRate) {
    // Probe native sample rate so we don't resample (keeps it bit-faithful)
    // unless a job pins a lower rate to fit a long file under the RAM cap.
    const sr = targetRate || parseInt(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0',
        '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', file]).toString().trim(), 10) || 44100;
    const rateArgs = targetRate ? ['-ar', String(targetRate)] : [];
    const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, ...rateArgs, '-ac', '2', '-f', 'f32le',
        '-acodec', 'pcm_f32le', 'pipe:1'], { maxBuffer: 1 << 30 });
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const inter = new Float32Array(ab);
    const n = Math.floor(inter.length / 2);
    const L = new Float32Array(n), R = new Float32Array(n);
    for (let i = 0; i < n; i++) { L[i] = inter[2 * i]; R[i] = inter[2 * i + 1]; }
    return { channels: [L, R], sr };
}

// Pure PCM → codec. NO -af filter chain: every sample handed in lands in the
// output at the same index it came in at.
//
// This function used to run the leveler here as `volume=...,alimiter=...`, and
// that silently destroyed the baked seam on EVERY track in the library.
// ffmpeg's `alimiter` is a LOOKAHEAD limiter: `attack=5` buys its lookahead by
// delaying the whole signal 5ms (239 samples at 48k) while keeping the output
// length equal to the input. So the encoded file was the baked loop shifted
// late — ~5ms of digital silence welded onto the head, and the last ~5ms
// (which is precisely the tail that bakeCrossfade matched INTO that head)
// chopped off. Measured end-to-end through this exact encode path: a marker
// impulse at sample 1000 came back at 1239 with the filter chain, and at 1000
// without it. No amount of seam tuning upstream can survive that, which is why
// well-baked tracks (box-fan: ratio 1.23, rmsCont 1.00) still clicked audibly.
//
// The leveler now runs in JS, circularly, in levelLoop() — before seamMetric()
// measures anything — so the numbers this script prints describe the samples
// that actually ship.
function encode(outFile, channels, sr) {
    const nCh = channels.length, n = channels[0].length;
    const inter = new Float32Array(n * nCh);
    for (let i = 0; i < n; i++) for (let c = 0; c < nCh; c++) inter[i * nCh + c] = channels[c][i];
    const raw = Buffer.from(inter.buffer);
    const ext = path.extname(outFile).toLowerCase();
    const codec = ext === '.wav' ? ['-c:a', 'pcm_s16le']
        : ext === '.m4a' ? ['-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart']
        : ['-c:a', 'libmp3lame', '-q:a', '2'];
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(sr), '-ac', String(nCh),
        '-i', 'pipe:0', ...codec, outFile], { input: raw, maxBuffer: 1 << 30 });
}

// ── DSP ──────────────────────────────────────────────────────────────────────
function findLoudRange(channels, threshold = 0.001) {
    const len = channels[0].length;
    let start = 0, end = len;
    outer: for (let i = 0; i < len; i++) for (const ch of channels) if (Math.abs(ch[i]) > threshold) { start = i; break outer; }
    back: for (let i = len - 1; i >= 0; i--) for (const ch of channels) if (Math.abs(ch[i]) > threshold) { end = i + 1; break back; }
    return end <= start ? { start: 0, end: len } : { start, end };
}

function isDualMono(channels, stride = 997) {
    if (channels.length < 2) return true;
    const [a, b] = channels;
    for (let i = 0; i < a.length; i += stride) if (a[i] !== b[i]) return false;
    return true;
}

function mixMono(channels) {
    const n = channels[0].length, m = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (const ch of channels) s += ch[i]; m[i] = s / channels.length; }
    return m;
}

// Find the loop end whose tail window best matches the head (max NCC), keeping
// at least `minFrac` of the trimmed signal. Coarse hop then fine refine.
function findBestLoopEnd(mono, start, end, fade, sr, minFrac, searchSec) {
    const W = Math.min(fade, Math.floor((end - start) / 4), 8192);
    const head = mono.subarray(start, start + W);
    let headE = 0; for (let i = 0; i < W; i++) headE += head[i] * head[i];
    const minLen = Math.floor((end - start) * minFrac);
    const eMin = Math.max(start + minLen, end - Math.floor(searchSec * sr));
    const score = (E) => {
        const base = E - W; let dot = 0, tailE = 0;
        for (let i = 0; i < W; i++) { const t = mono[base + i]; dot += t * head[i]; tailE += t * t; }
        return dot / (Math.sqrt(tailE * headE) + 1e-9); // NCC, maximize
    };
    let bestE = end, best = -Infinity;
    for (let E = eMin; E <= end; E += 16) { const s = score(E); if (s > best) { best = s; bestE = E; } }
    for (let E = Math.max(eMin, bestE - 16); E <= Math.min(end, bestE + 16); E++) { const s = score(E); if (s > best) { best = s; bestE = E; } }
    return { bestE, ncc: best };
}

// NCC of the W samples ending at `E` against the W samples starting at `start`.
// Fixed W, so scores are comparable across different fade lengths.
function nccAt(mono, start, E, W) {
    const base = E - W;
    if (base < start || E > mono.length) return 0;
    let dot = 0, a = 0, b = 0;
    for (let i = 0; i < W; i++) {
        const h = mono[start + i], t = mono[base + i];
        dot += h * t; a += h * h; b += t * t;
    }
    return dot / (Math.sqrt(a * b) + 1e-9);
}

// Move an index to the nearest rising zero crossing within `win` samples.
//
// This looks like it should be load-bearing and mostly is not: bakeCrossfade's
// output is already sample-exact across the wrap (its last sample is
// ch[end-fade-1] and its first is ch[end-fade], adjacent samples of the
// master), so there is no step for a zero crossing to soften. The suspicion
// that it was actively harmful — dragging the cut off the correlation optimum —
// was measured across all 41 tracks and did not hold up either: dropping the
// snap scored better on 10, worse on 16, mean ΔNCC -0.001, and on most tracks
// it moves the edge by well under a millisecond. Kept as-is because it is a
// wash and these are shipped assets.
function snapZero(mono, idx, win = 600) {
    for (let d = 0; d < win; d++) {
        for (const i of [idx + d, idx - d]) {
            if (i > 0 && i < mono.length && mono[i - 1] <= 0 && mono[i] > 0) return i;
        }
    }
    return idx;
}

function bakeCrossfade(channels, start, end, fade) {
    const length = end - start;
    const f = Math.min(fade, Math.floor(length / 4));
    const outLen = length - f;
    if (f <= 0 || outLen <= 0) return channels.map(ch => ch.slice(start, end));
    return channels.map(ch => {
        const out = new Float32Array(outLen);
        for (let i = 0; i < f; i++) {
            const t = (i / f) * (Math.PI / 2);
            out[i] = ch[start + i] * Math.sin(t) + ch[start + outLen + i] * Math.cos(t);
        }
        for (let i = f; i < outLen; i++) out[i] = ch[start + i];
        return out;
    });
}

// Seam metric: average wrap discontinuity vs. average interior step, plus RMS
// continuity of the 50ms on either side of the wrap. ratio≈1 ⇒ seam is
// indistinguishable from ordinary sample-to-sample motion.
function seamMetric(channels, sr) {
    const win = Math.floor(0.05 * sr);
    let wrap = 0, interior = 0, count = 0;
    for (const ch of channels) {
        const n = ch.length;
        wrap += Math.abs(ch[0] - ch[n - 1]);
        for (let i = 1; i <= 4000 && i < n; i++) { interior += Math.abs(ch[i] - ch[i - 1]); count++; }
    }
    wrap /= channels.length; interior /= count;
    const rms = (ch, a, b) => { let s = 0; for (let i = a; i < b; i++) s += ch[i] * ch[i]; return Math.sqrt(s / (b - a)); };
    let headR = 0, tailR = 0;
    for (const ch of channels) { headR += rms(ch, 0, win); tailR += rms(ch, ch.length - win, ch.length); }
    headR /= channels.length; tailR /= channels.length;
    return {
        wrapDelta: +wrap.toFixed(5),
        interiorDelta: +interior.toFixed(5),
        ratio: +(wrap / (interior + 1e-9)).toFixed(2),
        rmsContinuity: +(Math.min(headR, tailR) / (Math.max(headR, tailR) + 1e-9)).toFixed(2),
    };
}

// ── Library leveler ─────────────────────────────────────────────────────────
// Every track in the mixer currently plays at whatever level it was recorded
// at, so users end up riding the per-sound volume slider just to get a
// consistent mix. This computes, straight from the already-decoded PCM (no
// extra ffmpeg analysis pass needed), the gain that brings a track's BODY to
// a common target loudness (RMS). True-peak safety is handled separately, by
// a lookahead limiter (see encode()'s `alimiter`) rather than by capping the
// whole track's gain off one loud sample: gentle-rain-style content has rare
// sharp droplet transients ~30dB above its own RMS, and clamping gain to keep
// THOSE under the ceiling would leave the entire track's body inaudibly quiet
// next to steadier textures — exactly the "have to raise the volume" problem
// this is meant to fix. A limiter instead only pulls down the rare transient
// sample, leaving the body at the common target.
const TARGET_RMS_DB = -20;   // perceived-loudness target, ambient background level
const PEAK_CEILING_DB = -3;  // true-peak ceiling; leaves room for the crossfade hump
const MAX_GAIN_DB = 12;      // don't blow up near-silent passages into audible hiss/noise floor

function dbfs(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }

function rmsAndPeak(channels) {
    let sumSq = 0, count = 0, peak = 0;
    for (const ch of channels) {
        for (let i = 0; i < ch.length; i++) {
            const v = ch[i];
            sumSq += v * v; count++;
            const a = Math.abs(v);
            if (a > peak) peak = a;
        }
    }
    return { rms: Math.sqrt(sumSq / Math.max(count, 1)), peak };
}

// Gain (dB) to apply so this baked track's BODY lands at TARGET_RMS_DB,
// never boosting more than MAX_GAIN_DB (silence/noise-floor guard). The
// true-peak ceiling is enforced by the circular limiter in levelLoop().
function loudnessGain(channels) {
    const { rms, peak } = rmsAndPeak(channels);
    const gainDb = Math.min(TARGET_RMS_DB - dbfs(rms), MAX_GAIN_DB);
    return { gainDb, rmsDbBefore: dbfs(rms), peakDbBefore: dbfs(peak) };
}

// Circular sliding minimum of `a` over the window [i, i+win-1], indices taken
// mod n. Monotonic deque, so O(n) rather than O(n·win) — at 240-sample
// lookahead over multi-million-sample tracks the naive version is unusable.
function slidingMinCircular(a, win) {
    const n = a.length;
    const out = new Float32Array(n);
    const idx = new Int32Array(n + win);   // deque of indices, increasing value
    let head = 0, tail = 0;
    // Walk i from -win+1 to n-1 so the window is primed by the time we emit.
    for (let k = -win + 1; k < n; k++) {
        const j = k + win - 1;             // newest index entering the window
        const v = a[((j % n) + n) % n];
        while (tail > head && a[((idx[tail - 1] % n) + n) % n] >= v) tail--;
        idx[tail++] = j;
        while (idx[head] < k) head++;      // drop indices that fell out behind
        if (k >= 0) out[k] = a[((idx[head] % n) + n) % n];
    }
    return out;
}

// Lookahead peak limiter that treats the track as a CIRCLE, not a line.
//
// Two properties matter here and neither is optional for a loop:
//   1. Zero latency. The gain envelope is computed with lookahead but applied
//      to sample i at index i, so nothing moves. (ffmpeg's alimiter buys its
//      lookahead with a real delay — see encode() for what that cost us.)
//   2. A gain envelope that WRAPS. The sliding minimum and the attack/release
//      smoother both run modulo n, and the smoother runs two passes so the
//      state it starts pass 2 with is the converged state from the end of the
//      loop. A linear limiter would leave the envelope mid-release at the tail
//      and at unity at the head — a level step exactly at the seam, which is
//      the very thing this whole script exists to avoid.
function limitCircular(channels, ceilingLin, sr, attackMs = 5, releaseMs = 50) {
    const n = channels[0].length;
    if (!n) return channels;
    const look = Math.max(1, Math.round((sr * attackMs) / 1000));

    // Per-sample gain that would just reach the ceiling (<= 1, attenuate only).
    const need = new Float32Array(n);
    let anyOver = false;
    for (let i = 0; i < n; i++) {
        let peak = 0;
        for (const ch of channels) { const v = Math.abs(ch[i]); if (v > peak) peak = v; }
        if (peak > ceilingLin) { need[i] = ceilingLin / peak; anyOver = true; }
        else need[i] = 1;
    }
    if (!anyOver) return channels;

    const target = slidingMinCircular(need, look);
    // Attack time constant is deliberately a QUARTER of the lookahead window:
    // a one-pole whose tau equals the window only closes ~63% of the distance
    // to the target before the transient it is ducking actually arrives, which
    // let gentle-rain out the door at +1.7dBFS. Even so the smoother alone is
    // not a guarantee, so `need` is applied as a hard floor below — that term
    // is what makes the ceiling arithmetic rather than aspirational. It stays
    // circular (need is indexed mod nothing; it IS the per-sample requirement),
    // so clamping cannot introduce a seam-only discontinuity.
    const aC = Math.exp(-1 / Math.max(1, (sr * attackMs) / 4000));
    const rC = Math.exp(-1 / Math.max(1, (sr * releaseMs) / 1000));
    const env = new Float32Array(n);
    let g = 1;
    for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < n; i++) {
            const t = target[i];
            g = t + (g - t) * (t < g ? aC : rC);
            if (g > need[i]) g = need[i];
            if (pass === 1) env[i] = g;
        }
    }
    for (const ch of channels) for (let i = 0; i < n; i++) ch[i] *= env[i];
    return channels;
}

// Apply the library leveler to the baked loop IN PLACE, returning the gain used.
// Runs before seamMetric() so the reported seam describes the shipped samples.
function levelLoop(channels, sr) {
    const { gainDb, peakDbBefore } = loudnessGain(channels);
    const lin = Math.pow(10, gainDb / 20);
    if (Math.abs(gainDb) > 0.01) for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= lin;
    // 1dB under the ceiling absorbs AAC's inter-sample reconstruction ripple
    // (lossy transform coding can overshoot the PCM peak it was handed).
    limitCircular(channels, Math.pow(10, (PEAK_CEILING_DB - 1) / 20), sr);
    return { gainDb, peakDbBefore };
}

// ── Run ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const write = args.includes('--write');
const tune = args.includes('--tune');
const qa = args.includes('--qa');
const verify = args.includes('--verify');
const longform = args.includes('--longform');
const all = args.includes('--all');
const onlyId = args.find(a => !a.startsWith('--'));

const source = all ? [...MANIFEST, ...LONGFORM] : longform ? LONGFORM : MANIFEST;
const QA_DIR = path.join(PUBLIC, '_loopqa');
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });
if (qa && !existsSync(QA_DIR)) mkdirSync(QA_DIR, { recursive: true });
const qaManifest = [];

const jobs = source.filter(m => !onlyId || m.id === onlyId);
// id → exact baked loop length in seconds, written back into loopManifest.json
// so the runtime can trim to the sample instead of guessing with a threshold.
const loopSecondsById = new Map();
console.log(`\n${'id'.padEnd(26)} ${'orig ratio'.padStart(10)} ${'baked ratio'.padStart(11)} ${'rmsCont'.padStart(8)}  ${'loopNCC'.padStart(7)}  ${'fade'.padStart(5)}  ${'sec'.padStart(6)}  ${'gain'.padStart(6)}  ${'peakOut'.padStart(8)}  out`);
console.log('-'.repeat(128));

for (const job of jobs) {
    try {
        const srcPublicPath = path.join(PUBLIC, job.src);
        const outPublicPath = path.join(PUBLIC, job.out || job.src);
        // `raw` lets a job point its audio-raw/ snapshot at a specific master
        // filename instead of the default `<id><ext of src>` — used when the
        // master itself was replaced (e.g. evolving-deep-sleep-drone's trim)
        // without touching/overwriting the original snapshot file.
        const rawPath = job.raw ? path.join(RAW_DIR, job.raw) : path.join(RAW_DIR, job.id + path.extname(job.src));
        // Snapshot the untouched master once (only when using the default,
        // id-keyed path — a `raw` override is expected to already exist).
        if (!existsSync(rawPath)) {
            if (job.raw) throw new Error(`raw override "${job.raw}" not found in audio-raw/`);
            copyFileSync(srcPublicPath, rawPath);
        }

        const { channels: rawCh, sr } = decode(rawPath, job.rate);
        const origSeam = seamMetric(rawCh, sr);

        // Collapse dual-mono unless the job pins stereo (bilateral panning).
        let chans = (!job.stereo && isDualMono(rawCh)) ? [rawCh[0]] : rawCh;
        const { start, end } = findLoudRange(chans);
        const mono = mixMono(chans);
        const fade = Math.floor(job.fade * sr);
        const minFrac = job.minFrac ?? (job.kind === 'periodic' ? 0.5 : 0.7);
        const searchSec = job.searchSec ?? (job.kind === 'periodic' ? 12 : 6);
        // Candidate fade windows. Without --tune this is just the hand-picked
        // value from the manifest; with it, the baker tries a spread and keeps
        // whichever actually bakes the best seam for THIS file.
        const candidates = tune
            ? [...new Set([0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, job.fade].map(f => Math.floor(f * sr)))]
                .filter(f => f > 0 && f <= Math.floor((end - start) / 4))
                .sort((a, b) => a - b)
            : [fade];

        let choice = null;
        const s2 = snapZero(mono, start);
        for (const f of candidates) {
            const { bestE } = findBestLoopEnd(mono, start, end, f, sr, minFrac, searchSec);
            const e2 = snapZero(mono, bestE);
            const e = e2 > s2 + f ? e2 : end;
            // Cap a tuned fade at 15% of the LOOP the search settled on, which
            // can be far shorter than the master (heartbeat: an 11s loop out of
            // a 21s file). The seam metrics always prefer a longer blend because
            // they only look AT the wrap; they cannot see that a 3s crossfade on
            // an 11s loop spends a quarter of it playing two uncorrelated pulse
            // trains over each other.
            if (tune && f > (e - s2) * 0.15) continue;
            const out = bakeCrossfade(chans, s2, e, f);
            const seam = seamMetric(out, sr);
            // Score on a FIXED window so different fade lengths are comparable:
            // the search's own NCC shrinks as its window grows and would always
            // favour the shortest fade. This also measures the seam that is
            // actually baked — post-snap, at the edges bakeCrossfade was handed.
            // The `loopNCC` column used to report the pre-snap number instead,
            // which is why `heartbeat` could show a perfect 1.000 next to a seam
            // ratio worse than its own source: the two described different cuts.
            const ncc = nccAt(mono, s2, e, Math.floor(0.5 * sr));
            // Three things make a wrap audible and all three are scored:
            // content mismatch (ncc), a level jump across the wrap
            // (rmsContinuity, 1.0 = the two sides are equally loud), and a
            // residual step (ratio, 1.0 = indistinguishable from ordinary
            // sample-to-sample motion). Without the rmsContinuity term the
            // tuner happily traded a 0.80 → 0.68 level match for a slightly
            // tidier ratio on gentle-rain-for-relaxation.
            const quality = ncc
                + 0.5 * seam.rmsContinuity
                - 0.05 * Math.min(Math.abs(seam.ratio - 1), 10);
            if (!choice || quality > choice.quality) choice = { f, ncc, out, seam, quality };
        }
        if (!choice) throw new Error('no usable fade window for this file');

        const { f: chosenFade, ncc, out: baked } = choice;
        const outSec = (baked[0].length / sr).toFixed(1);
        // Exact, in SECONDS not samples: decodeAudioData resamples to the
        // AudioContext's rate, so a sample count baked at 48k would be wrong on
        // a 44.1k context. Seconds survive the resample.
        loopSecondsById.set(job.id, +(baked[0].length / sr).toFixed(6));

        // Library leveler: bring the body to TARGET_RMS_DB and clamp the rare
        // transient under PEAK_CEILING_DB, in JS and circularly, so playback
        // needs no per-sound volume riding. Done HERE, before the seam is
        // measured and before the encoder sees anything, so `bakedSeam` below
        // describes the exact samples that ship.
        const { gainDb, peakDbBefore } = levelLoop(baked, sr);
        const bakedSeam = seamMetric(baked, sr);
        const { peak: peakAfterLin } = rmsAndPeak(baked);
        const peakDbAfter = dbfs(peakAfterLin);
        void peakDbBefore;

        if (write) encode(outPublicPath, baked, sr);
        if (qa) {
            const bakedName = `${job.id}.mp3`;
            const origName = `${job.id}-orig${path.extname(job.src)}`;
            encode(path.join(QA_DIR, bakedName), baked, sr);
            copyFileSync(rawPath, path.join(QA_DIR, origName));
            qaManifest.push({
                id: job.id, kind: job.kind, baked: bakedName, orig: origName,
                ncc: +ncc.toFixed(3), sec: +outSec,
                origRatio: origSeam.ratio, bakedRatio: bakedSeam.ratio, rmsCont: bakedSeam.rmsContinuity,
            });
        }

        // Prove the file on disk matches what we baked, rather than trusting the
        // encoder. Locates the baked head inside the decoded output and reports
        // the shift: anything but 0 means a filter/codec moved the audio and the
        // seam is broken, which is exactly how the alimiter regression hid.
        let verdict = write ? '✓ written' : '(dry)';
        if (write && verify) {
            const { channels: back } = decode(outPublicPath);
            const ref = baked[0], got = back[0];
            const W = Math.min(4096, ref.length);
            let bestOff = 0, bestScore = -Infinity;
            for (let off = -1024; off <= 1024; off++) {
                let dot = 0, e = 0;
                for (let i = 0; i < W; i++) {
                    const g = got[i + off + 2048] ?? 0;
                    dot += g * ref[i + 2048]; e += g * g;
                }
                const s = dot / (Math.sqrt(e) + 1e-9);
                if (s > bestScore) { bestScore = s; bestOff = off; }
            }
            const lenDelta = got.length - ref.length;
            // With offset proven 0, decoded index i IS baked index i, so the
            // real wrap is got[0] vs got[ref.length-1] — NOT vs got[got.length-1],
            // which sits inside the encoder's trailing padding. Measuring at the
            // container's duration_ts is no good either; it disagrees with the
            // true length by a few tens of samples on some files.
            const decSeam = seamMetric(back.map(ch => ch.subarray(0, ref.length)), sr);
            verdict = bestOff === 0
                ? `✓ off=0 seam=${decSeam.ratio} pad=${lenDelta}`
                : `✗ SHIFTED ${bestOff} samples`;
        }

        const gainStr = (gainDb >= 0 ? '+' : '') + gainDb.toFixed(1) + 'dB';
        const peakStr = peakDbAfter.toFixed(1) + 'dB';
        console.log(
            `${job.id.padEnd(26)} ${String(origSeam.ratio).padStart(10)} ${String(bakedSeam.ratio).padStart(11)} ${String(bakedSeam.rmsContinuity).padStart(8)}  ${ncc.toFixed(3).padStart(7)}  ${(chosenFade / sr).toFixed(1).padStart(5)}  ${outSec.padStart(6)}  ${gainStr.padStart(6)}  ${peakStr.padStart(8)}  ${verdict}`
        );
    } catch (e) {
        console.log(`${job.id.padEnd(26)} ERROR: ${e.message.split('\n')[0]}`);
    }
}
if (qa) {
    writeFileSync(path.join(QA_DIR, 'manifest.json'), JSON.stringify(qaManifest, null, 2));
    console.log(`\nQA assets written to public/_loopqa/ — open /_loopqa/loopqa.html`);
}

// Publish the exact loop lengths back to the manifest the runtime reads.
//
// Without this the runtime finds the loop end with a 0.001 amplitude threshold,
// which cannot see the difference between the real last sample and AAC's
// trailing encoder padding. On dense material the padding sits ABOVE that
// threshold and gets kept: measured across the baked set, 19 of 33 tracks were
// looping 2-12ms of encoder ring-out (gentle-rain 11.7ms, busy-cafe-2 11.0ms)
// before wrapping. An exact length removes the guess.
if (write && loopSecondsById.size) {
    let touched = 0;
    for (const list of [manifest.baked, manifest.longform]) {
        for (const entry of list) {
            const secs = loopSecondsById.get(entry.id);
            if (secs !== undefined && entry.loopSeconds !== secs) { entry.loopSeconds = secs; touched++; }
        }
    }
    if (touched) {
        writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 4) + '\n');
        console.log(`loopManifest.json: wrote loopSeconds for ${touched} track(s)`);
    }
}
console.log('');
