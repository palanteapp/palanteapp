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

// ── Run ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const write = args.includes('--write');
const tune = args.includes('--tune');
const qa = args.includes('--qa');
const longform = args.includes('--longform');
const all = args.includes('--all');
const onlyId = args.find(a => !a.startsWith('--'));

const source = all ? [...MANIFEST, ...LONGFORM] : longform ? LONGFORM : MANIFEST;
const QA_DIR = path.join(PUBLIC, '_loopqa');
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });
if (qa && !existsSync(QA_DIR)) mkdirSync(QA_DIR, { recursive: true });
const qaManifest = [];

const jobs = source.filter(m => !onlyId || m.id === onlyId);
console.log(`\n${'id'.padEnd(26)} ${'orig ratio'.padStart(10)} ${'baked ratio'.padStart(11)} ${'rmsCont'.padStart(8)}  ${'loopNCC'.padStart(7)}  ${'fade'.padStart(5)}  ${'sec'.padStart(6)}  out`);
console.log('-'.repeat(108));

for (const job of jobs) {
    try {
        const srcPublicPath = path.join(PUBLIC, job.src);
        const outPublicPath = path.join(PUBLIC, job.out || job.src);
        const rawPath = path.join(RAW_DIR, job.id + path.extname(job.src));
        // Snapshot the untouched master once.
        if (!existsSync(rawPath)) copyFileSync(srcPublicPath, rawPath);

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

        const { f: chosenFade, ncc, out: baked, seam: bakedSeam } = choice;
        const outSec = (baked[0].length / sr).toFixed(1);

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

        console.log(
            `${job.id.padEnd(26)} ${String(origSeam.ratio).padStart(10)} ${String(bakedSeam.ratio).padStart(11)} ${String(bakedSeam.rmsContinuity).padStart(8)}  ${ncc.toFixed(3).padStart(7)}  ${(chosenFade / sr).toFixed(1).padStart(5)}  ${outSec.padStart(6)}  ${write ? '✓ written' : '(dry)'}`
        );
    } catch (e) {
        console.log(`${job.id.padEnd(26)} ERROR: ${e.message.split('\n')[0]}`);
    }
}
if (qa) {
    writeFileSync(path.join(QA_DIR, 'manifest.json'), JSON.stringify(qaManifest, null, 2));
    console.log(`\nQA assets written to public/_loopqa/ — open /_loopqa/loopqa.html`);
}
console.log('');
