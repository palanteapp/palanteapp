#!/usr/bin/env node
// Offline seam verifier for the shipped soundscape loops.
//
// bake-loops.mjs measures its seam on the PRE-ENCODE PCM it is about to hand to
// the AAC encoder. This script measures the seam on the FILE THAT SHIPS, after
// the AAC round trip, sliced exactly the way the runtime slices it — to
// `loopSeconds` from src/constants/loopManifest.json. Those are not the same
// numbers, and only this one describes what a user hears.
//
// Usage:
//   node scripts/verify-seams.mjs                  # verify public/
//   node scripts/verify-seams.mjs --dir audio-baked-candidates
//   node scripts/verify-seams.mjs kalimba-africa   # one id
//   node scripts/verify-seams.mjs --json out.json  # machine-readable dump
//   node scripts/verify-seams.mjs --manifest path  # alternate manifest (staging loopSeconds)
//
// ── What is measured, and why these thresholds ──────────────────────────────
//
// A loop wrap is audible for exactly four reasons. Each gets its own axis, and
// each is scored BOTH in absolute terms and against what the material itself
// already does, because a 0.01 step is a gunshot in a singing bowl and is
// invisible inside a waterfall.
//
// 0. STEPRMS — |x[0] - x[N-1]| / RMS(|Δx|) over the first 30 s. THE GATE.
//    How big the wrap jump is relative to how fast this material normally
//    moves. This is the metric the runtime engineer measured the library with
//    and the one that separates audible from inaudible in practice: dense
//    material (rain, cafe, waterfall, forest) sits at 0.2-2.2, and the four
//    tracks that actually click sit at 7-16. PASS if stepRms <= 6.0.
//    Raw step size alone is not a usable gate — it flags kalimba-africa and
//    waterfall, whose own sample motion dwarfs their wrap step.
//
// 1. STEP  — |x[0] - x[N-1]|, the sample-to-sample jump across the wrap.
//    A step is a broadband impulse: its click energy is flat to Nyquist, so
//    audibility tracks the step's absolute size relative to full scale far more
//    than it tracks the program level.
//      PASS if  stepAbs <= STEP_ABS_FLOOR (0.004 ≈ -48 dBFS)
//            OR stepRel <= 2.0, where stepRel = stepAbs / p99.9(interior |Δx|)
//      Advisory only — stepRms above is the gate.
//    Justification of the floor: -48 dBFS of impulse against an ambient bed
//    played at a comfortable level sits at or under the noise floor of both the
//    material and a phone speaker. Justification of the relative term: if the
//    signal already produces a jump that big roughly once per 1000 samples
//    (p99.9), one more at the wrap is not a distinguishable event.
//
// 2. CLICK — |Δ²x| at the join, normalised by p99.9(interior |Δ²x|).
//    The second difference is a high-pass filter. A step OR a slope break both
//    show up here, so this catches seams that look continuous in value but
//    kink. PASS if clickZ <= 3.0: three times the 1-in-1000 outlier of the
//    material's own high-frequency motion.
//
// 3. LEVEL — RMS of the 20 ms before the wrap vs the 20 ms after.
//    20 ms is roughly the ear's loudness integration floor; a level step inside
//    that window reads as a pump or a swell rather than as two sounds.
//    PASS if the ratio (min/max) >= 0.5 (-6 dB) AND |ln ratio| is within 2x the
//    p99 of |ln ratio| between ADJACENT interior 20 ms windows — i.e. the wrap's
//    level move is not far outside moves the track makes on its own. The 2x
//    slack is deliberate: p99 over a few hundred probes is estimated from its
//    own tail, so 1.0x would fail any track whose seam happens to be its single
//    largest transition, which is not the same as being audible.
//
// 4. SPECTRUM — log-spectral distance (dB RMS across bins) between the 512-pt
//    Hann window ending at the wrap and the one starting at it.
//    Catches a timbral cut (different birds, different chord) that has neither
//    a step nor a level jump. PASS if lsd <= 2x the p99 of interior
//    adjacent-window LSD. LSD is inherently noisy on stochastic material (two
//    adjacent frames of rain differ by 10-15 dB RMS all on their own), so this
//    axis only earns a FAIL when the seam is grossly outside the track's own
//    frame-to-frame spread — whale-song cut mid-call, not rain meeting rain.
//
// Plus a slice hygiene check: after cutting to `loopSeconds` there must be
// under 1 ms of near-silence at either edge. Leading silence is a gap the
// runtime cannot fix; trailing silence means loopSeconds is still long and the
// wrap is landing inside encoder padding.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Thresholds ──────────────────────────────────────────────────────────────
const STEP_RMS_MAX   = 6.0;    // THE GATE: wrap step / RMS adjacent-sample delta
const STEP_RMS_SEC   = 30;     // window the RMS delta is measured over
const STEP_ABS_FLOOR = 0.004;  // below this a step is inaudible outright
const STEP_REL_MAX   = 2.0;    // × the material's own p99.9 sample delta
const CLICK_Z_MAX    = 3.0;    // × the material's own p99.9 second difference
const RMS_RATIO_MIN  = 0.5;    // -6 dB, hard floor on level continuity
const RMS_Z_MAX      = 2.0;    // seam |ln ratio| vs p99 of interior, ×
const LSD_Z_MAX      = 2.0;    // seam LSD vs p99 of interior, ×
const SILENCE_LVL    = 1e-4;   // -80 dBFS counts as digital silence
const SILENCE_MS_MAX = 1.0;    // residual silence budget at either edge

const REF_WINDOWS = 400;       // interior reference probes, spread over the file
const REF_LEN     = 4096;

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name, dflt) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const DIR = path.resolve(ROOT, flag('--dir', 'public'));
const MANIFEST_PATH = path.resolve(ROOT, flag('--manifest', 'src/constants/loopManifest.json'));
const JSON_OUT = flag('--json', null);
const onlyIds = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const entries = [...manifest.baked.map(e => ({ ...e, group: 'baked' })),
                 ...manifest.longform.map(e => ({ ...e, group: 'longform' }))];

// ── decode ──────────────────────────────────────────────────────────────────
function probe(file) {
    const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries',
        'stream=sample_rate,channels', '-of', 'csv=p=0', file]).toString().trim().split(',');
    return { sr: parseInt(out[0], 10), ch: parseInt(out[1], 10) };
}

function decode(file) {
    const { sr, ch } = probe(file);
    const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le',
        '-acodec', 'pcm_f32le', 'pipe:1'], { maxBuffer: 1 << 30 });
    const inter = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
    const n = Math.floor(inter.length / ch);
    const channels = [];
    for (let c = 0; c < ch; c++) {
        const a = new Float32Array(n);
        for (let i = 0; i < n; i++) a[i] = inter[i * ch + c];
        channels.push(a);
    }
    return { channels, sr, n };
}

// ── tiny radix-2 FFT (magnitude only) ───────────────────────────────────────
function magSpectrum(x) {
    const N = x.length;                    // power of two
    const re = Float64Array.from(x), im = new Float64Array(N);
    for (let i = 1, j = 0; i < N; i++) {   // bit reversal
        let bit = N >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= N; len <<= 1) {
        const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < N; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const ur = re[i + k], ui = im[i + k];
                const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
                const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
                re[i + k] = ur + vr; im[i + k] = ui + vi;
                re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
                const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
            }
        }
    }
    const half = N >> 1, mag = new Float64Array(half);
    for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i]);
    return mag;
}

const FFT_N = 512;
const HANN = Float64Array.from({ length: FFT_N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / FFT_N));

// Log-spectral distance in dB RMS between two equal-length frames.
function lsd(a, b) {
    const wa = new Float64Array(FFT_N), wb = new Float64Array(FFT_N);
    for (let i = 0; i < FFT_N; i++) { wa[i] = a[i] * HANN[i]; wb[i] = b[i] * HANN[i]; }
    const A = magSpectrum(wa), B = magSpectrum(wb);
    let s = 0;
    for (let i = 1; i < A.length; i++) {
        const d = 20 * Math.log10((A[i] + 1e-7) / (B[i] + 1e-7));
        s += d * d;
    }
    return Math.sqrt(s / (A.length - 1));
}

// ── helpers ─────────────────────────────────────────────────────────────────
const pct = (arr, p) => {
    const a = Float64Array.from(arr).sort();
    if (!a.length) return 0;
    return a[Math.min(a.length - 1, Math.max(0, Math.floor(p * (a.length - 1))))];
};
const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)); };

function mixMono(channels, n) {
    if (channels.length === 1) return channels[0].subarray(0, n);
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (const c of channels) s += c[i]; m[i] = s / channels.length; }
    return m;
}

// Circular fetch across the wrap: index may be negative or >= n.
const at = (x, i, n) => x[((i % n) + n) % n];

// ── the measurement ─────────────────────────────────────────────────────────
function analyze(file, loopSeconds) {
    const { channels, sr, n: decoded } = decode(file);
    const N = Math.round(loopSeconds * sr);
    if (N < FFT_N * 4 || N > decoded) {
        return { error: `loopSeconds ${loopSeconds}s → ${N} samples, file decodes to ${decoded}` };
    }
    const padSamples = decoded - N;
    const mono = mixMono(channels, N);

    // ── interior reference distributions ────────────────────────────────────
    const d1s = [], d2s = [], lnRatios = [], lsds = [];
    const W20 = Math.max(64, Math.round(0.02 * sr));
    const stride = Math.max(REF_LEN, Math.floor(N / REF_WINDOWS));
    for (let p = W20 + REF_LEN; p + REF_LEN + W20 < N; p += stride) {
        for (const ch of channels) {
            for (let i = p; i < p + REF_LEN; i++) {
                d1s.push(Math.abs(ch[i] - ch[i - 1]));
                d2s.push(Math.abs(ch[i + 1] - 2 * ch[i] + ch[i - 1]));
            }
        }
        const a = rms(mono, p - W20, p), b = rms(mono, p, p + W20);
        lnRatios.push(Math.abs(Math.log((a + 1e-9) / (b + 1e-9))));
        lsds.push(lsd(mono.subarray(p - FFT_N, p), mono.subarray(p, p + FFT_N)));
    }
    const d1p = pct(d1s, 0.999), d2p = pct(d2s, 0.999);
    const lnP99 = pct(lnRatios, 0.99), lsdP99 = pct(lsds, 0.99);

    // ── 0/1. step across the wrap ───────────────────────────────────────────
    let stepAbs = 0;
    for (const ch of channels) stepAbs = Math.max(stepAbs, Math.abs(ch[0] - ch[N - 1]));
    const stepRel = stepAbs / (d1p + 1e-12);
    // THE GATE: normalise by the RMS adjacent-sample delta over the first 30 s,
    // i.e. by how fast this material normally moves.
    const rmsWin = Math.min(N, Math.round(STEP_RMS_SEC * sr));
    let dsum = 0, dcount = 0;
    for (const ch of channels) for (let i = 1; i < rmsWin; i++) { const d = ch[i] - ch[i - 1]; dsum += d * d; dcount++; }
    const deltaRms = Math.sqrt(dsum / Math.max(1, dcount));
    const stepRms = stepAbs / (deltaRms + 1e-12);

    // ── 2. click: second difference straddling the join ─────────────────────
    let clickAbs = 0;
    for (const ch of channels) {
        // join sits between N-1 and 0; both centred second differences see it
        const l = Math.abs(at(ch, 0, N) - 2 * ch[N - 1] + ch[N - 2]);
        const r = Math.abs(ch[1] - 2 * ch[0] + at(ch, N - 1, N));
        clickAbs = Math.max(clickAbs, l, r);
    }
    const clickZ = clickAbs / (d2p + 1e-12);

    // ── 3. level across the wrap ────────────────────────────────────────────
    const tailR = rms(mono, N - W20, N), headR = rms(mono, 0, W20);
    const rmsRatio = Math.min(tailR, headR) / (Math.max(tailR, headR) + 1e-12);
    const seamLn = Math.abs(Math.log((tailR + 1e-9) / (headR + 1e-9)));
    const rmsZ = seamLn / (lnP99 + 1e-9);

    // ── 4. spectrum across the wrap ─────────────────────────────────────────
    const seamLsd = lsd(mono.subarray(N - FFT_N, N), mono.subarray(0, FFT_N));
    const lsdZ = seamLsd / (lsdP99 + 1e-9);

    // ── slice hygiene ───────────────────────────────────────────────────────
    const loud = i => { let m = 0; for (const ch of channels) m = Math.max(m, Math.abs(ch[i])); return m; };
    let lead = 0; while (lead < N && loud(lead) < SILENCE_LVL) lead++;
    let trail = 0; while (trail < N && loud(N - 1 - trail) < SILENCE_LVL) trail++;
    const leadMs = (lead / sr) * 1000, trailMs = (trail / sr) * 1000;

    // Trailing silence in the FULL decode — defect 1, informational: survivable
    // because the runtime slices it away, but worth reporting.
    let padTrail = 0;
    while (padTrail < padSamples) {
        let m = 0; for (const ch of channels) m = Math.max(m, Math.abs(ch[decoded - 1 - padTrail]));
        if (m >= SILENCE_LVL) break;
        padTrail++;
    }

    // ── verdicts ────────────────────────────────────────────────────────────
    const fails = [];
    // The gate. Everything below it is diagnostic detail explaining WHY.
    const stepOk = stepRms <= STEP_RMS_MAX || stepAbs <= STEP_ABS_FLOOR;
    if (!stepOk) fails.push(`stepRms ${stepRms.toFixed(1)}`);
    const clickOk = clickZ <= CLICK_Z_MAX || clickAbs <= STEP_ABS_FLOOR;
    if (!clickOk) fails.push(`click ${clickZ.toFixed(1)}z`);
    const rmsOk = rmsRatio >= RMS_RATIO_MIN && rmsZ <= RMS_Z_MAX;
    if (!rmsOk) fails.push(`rms ${rmsRatio.toFixed(2)} (${rmsZ.toFixed(1)}z)`);
    const lsdOk = lsdZ <= LSD_Z_MAX;
    if (!lsdOk) fails.push(`lsd ${seamLsd.toFixed(1)}dB (${lsdZ.toFixed(1)}z)`);
    const silOk = leadMs <= SILENCE_MS_MAX && trailMs <= SILENCE_MS_MAX;
    if (!silOk) fails.push(`silence ${leadMs.toFixed(1)}/${trailMs.toFixed(1)}ms`);

    return {
        sr, ch: channels.length, N, decoded, padMs: (padSamples / sr) * 1000, padSilentMs: (padTrail / sr) * 1000,
        stepAbs, stepRel, stepRms, deltaRms, d1p, clickAbs, clickZ, rmsRatio, rmsZ, seamLsd, lsdZ, lsdP99,
        leadMs, trailMs,
        stepOk, clickOk, rmsOk, lsdOk, silOk,
        pass: fails.length === 0, fails,
    };
}

// ── run ─────────────────────────────────────────────────────────────────────
const jobs = entries.filter(e => !onlyIds.length || onlyIds.includes(e.id));
const results = [];

const H = `${'id'.padEnd(30)} ${'stepRms'.padStart(7)} ${'step'.padStart(8)} ${'xΔ99'.padStart(6)} ${'clickZ'.padStart(7)} ${'rms'.padStart(5)} ${'lsd'.padStart(6)} ${'lsdZ'.padStart(5)} ${'pad ms'.padStart(7)}  verdict`;
console.log(`\nseam verification — dir=${path.relative(ROOT, DIR) || '.'}  manifest=${path.relative(ROOT, MANIFEST_PATH)}`);
console.log(H);
console.log('-'.repeat(H.length + 24));

for (const job of jobs) {
    const file = path.join(DIR, job.out || job.src);
    if (!existsSync(file)) { console.log(`${job.id.padEnd(30)} MISSING ${path.relative(ROOT, file)}`); continue; }
    let r;
    try { r = analyze(file, job.loopSeconds); }
    catch (e) { r = { error: e.message.split('\n')[0] }; }
    if (r.error) { console.log(`${job.id.padEnd(30)} ERROR: ${r.error}`); results.push({ id: job.id, ...r }); continue; }
    const verdict = r.pass ? 'PASS' : `FAIL  ${r.fails.join(' | ')}`;
    console.log(
        `${job.id.padEnd(30)} ${r.stepRms.toFixed(2).padStart(7)} ${r.stepAbs.toFixed(5).padStart(8)} ${r.stepRel.toFixed(1).padStart(6)} ${r.clickZ.toFixed(1).padStart(7)} ` +
        `${r.rmsRatio.toFixed(2).padStart(5)} ${r.seamLsd.toFixed(1).padStart(6)} ${r.lsdZ.toFixed(1).padStart(5)} ` +
        `${r.padMs.toFixed(1).padStart(7)}  ${verdict}`
    );
    results.push({ id: job.id, group: job.group, ...r });
}

const pass = results.filter(r => r.pass).length;
const fail = results.filter(r => r.pass === false).length;
console.log('-'.repeat(H.length + 24));
console.log(`${pass} PASS / ${fail} FAIL / ${results.length} total`);
if (fail) {
    const by = k => results.filter(r => r[k] === false).map(r => r.id);
    console.log(`  step  : ${by('stepOk').join(', ') || '-'}`);
    console.log(`  click : ${by('clickOk').join(', ') || '-'}`);
    console.log(`  rms   : ${by('rmsOk').join(', ') || '-'}`);
    console.log(`  lsd   : ${by('lsdOk').join(', ') || '-'}`);
    console.log(`  silence: ${by('silOk').join(', ') || '-'}`);
}
if (JSON_OUT) { writeFileSync(path.resolve(ROOT, JSON_OUT), JSON.stringify(results, null, 2)); console.log(`\njson → ${JSON_OUT}`); }
console.log('');
