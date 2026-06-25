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
const MANIFEST = [
    // Textures — stationary, crossfade-friendly
    { id: 'gentle-rain', src: 'sounds/gentle-rain.mp3', fade: 2.0, kind: 'texture' },
    { id: 'waterfall', src: 'sounds/waterfall.mp3', fade: 2.0, kind: 'texture' },
    { id: 'flowing-river', src: 'sounds/flowing-river.mp3', fade: 2.0, kind: 'texture' },
    { id: 'calm-wind', src: 'sounds/calm-wind.mp3', fade: 1.5, kind: 'texture' },
    { id: 'forest', src: 'sounds/forest.mp3', fade: 2.5, kind: 'texture' },
    { id: 'camp-fire', src: 'sounds/camp-fire.mp3', fade: 1.5, kind: 'texture' },
    { id: 'autumn-wind', src: 'Autumn Wind.mp3', fade: 2.5, kind: 'texture' },
    { id: 'distant-rain-and-thunder', src: 'sounds/distant-rain-and-thunder.mp3', fade: 3.0, kind: 'texture' },
    // Quasi-periodic — align to the wave/call cycle
    { id: 'ocean-waves', src: 'sounds/ocean-waves.mp3', fade: 2.0, kind: 'periodic' },
    { id: 'shoreline', src: 'sounds/shoreline.mp3', fade: 2.5, kind: 'periodic' },
    { id: 'beach-and-birds', src: 'sounds/beach-and-birds.mp3', fade: 2.5, kind: 'periodic' },
    // Structured / musical / heritage — keep the recording, find a clean loop
    { id: 'birdsong', src: 'sounds/birdsong.mp3', fade: 1.5, kind: 'periodic' },
    { id: 'boriquen-coqui', src: 'sounds/boriquen-coqui.mp3', fade: 2.0, kind: 'periodic' },
    { id: 'busy-cafe-1', src: 'sounds/busy-cafe-1.mp3', fade: 2.0, kind: 'texture' },
    { id: 'busy-cafe-2', src: 'sounds/busy-cafe-2.mp3', fade: 2.5, kind: 'texture' },
    { id: 'busy-cafe-4', src: 'busy-cafe-4.mp3', fade: 2.5, kind: 'texture' },
    { id: 'kalimba-africa', src: 'sounds/kalimba-africa.mp3', fade: 1.0, kind: 'periodic' },
    { id: '1970-pr', src: 'sounds/1970-pr.mp3', fade: 2.0, kind: 'texture' },
    { id: 'colombia-eas', src: 'colombia-eas.mp3', fade: 1.5, kind: 'periodic' },
    { id: 'zen-out', src: 'sounds/zen-out.mp3', fade: 2.5, kind: 'periodic' },
    { id: 'sounds-of-zen', src: 'sounds/sounds-of-zen.mp3', fade: 2.5, kind: 'periodic' },
    { id: 'set-adrift', src: 'sounds/set-adrift.mp3', fade: 3.0, kind: 'periodic' },
    { id: 'chillax-uno', src: 'sounds/chillax-uno.mp3', fade: 1.5, kind: 'periodic' },
    { id: 'chillax-dos', src: 'sounds/chillax-dos.mp3', fade: 1.5, kind: 'periodic' },
    { id: 'chillax-tres', src: 'sounds/chillax-tres.mp3', fade: 1.5, kind: 'periodic' },
    { id: 'chill-cinco', src: 'Chill Cinco.mp3', fade: 2.0, kind: 'periodic' },
];

// Long-form pieces (8–18 min). These are far too large to hold decoded in RAM,
// so they keep streaming at runtime — but we bake ONE clean tail→head seam so
// the single, rare loop is continuous. Full length is preserved; bilateral
// tracks keep their stereo panning. Whale is transcoded from an 80MB 24-bit WAV.
const LONGFORM = [
    { id: 'bilateral-eternal-reflection', src: 'sounds/bilateral-eternal-reflection.mp3', fade: 4.0, kind: 'texture', stereo: true, minFrac: 0.9, searchSec: 14 },
    { id: 'bilateral-replenished', src: 'sounds/bilateral-replenished.mp3', fade: 4.0, kind: 'texture', stereo: true, minFrac: 0.9, searchSec: 14 },
    { id: 'bilateral-tranquility', src: 'sounds/bilateral-tranquility.mp3', fade: 4.0, kind: 'texture', stereo: true, minFrac: 0.9, searchSec: 14 },
    { id: 'bilateral-tune-up', src: 'sounds/bilateral-tune-up.mp3', fade: 4.0, kind: 'texture', stereo: true, minFrac: 0.9, searchSec: 14 },
    { id: 'om-gum-shreem', src: 'sounds/om-gum-shreem-maha-lakshmiyei-namaha.mp3', fade: 3.0, kind: 'periodic', minFrac: 0.85, searchSec: 16 },
    { id: 'chillax-quatro', src: 'sounds/chillax-quatro.mp3', fade: 3.0, kind: 'periodic', minFrac: 0.85, searchSec: 16 },
    { id: 'busy-cafe-3', src: 'sounds/busy-cafe-3.mp3', fade: 3.0, kind: 'texture', minFrac: 0.85, searchSec: 12 },
    { id: 'whale-sounds', src: 'sounds/whale-sounds.wav', out: 'sounds/whale-sounds.mp3', fade: 4.0, kind: 'periodic', minFrac: 0.85, searchSec: 16, rate: 24000 },
];

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
    const codec = ext === '.wav' ? ['-c:a', 'pcm_s16le'] : ['-c:a', 'libmp3lame', '-q:a', '2'];
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

// Move an index to the nearest rising zero crossing within `win` samples.
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
console.log(`\n${'id'.padEnd(26)} ${'orig ratio'.padStart(10)} ${'baked ratio'.padStart(11)} ${'rmsCont'.padStart(8)}  ${'loopNCC'.padStart(7)}  ${'sec'.padStart(6)}  out`);
console.log('-'.repeat(100));

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
        const { bestE, ncc } = findBestLoopEnd(mono, start, end, fade, sr, minFrac, searchSec);
        const s2 = snapZero(mono, start);
        const e2 = snapZero(mono, bestE);
        const baked = bakeCrossfade(chans, s2, e2 > s2 + fade ? e2 : end, fade);
        const bakedSeam = seamMetric(baked, sr);
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
            `${job.id.padEnd(26)} ${String(origSeam.ratio).padStart(10)} ${String(bakedSeam.ratio).padStart(11)} ${String(bakedSeam.rmsContinuity).padStart(8)}  ${ncc.toFixed(3).padStart(7)}  ${outSec.padStart(6)}  ${write ? '✓ written' : '(dry)'}`
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
