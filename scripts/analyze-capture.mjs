#!/usr/bin/env node
// "The ears", Mac half: measure a device recording and say what the dropouts are.
//
//   node scripts/analyze-capture.mjs <recording> [sidecar.json] [flags]
//
// The recording comes from src/utils/audioCapture.ts, triggered by long-pressing
// the Soundscapes title on device. See scripts/README-ears.md for the whole
// procedure. Decoding and statistics come from scripts/lib/audio-dsp.mjs, the
// same code scripts/verify-seams.mjs measures the shipped assets with, so a
// number here and a number there mean the same thing.
//
// ── What question this answers ──────────────────────────────────────────────
// Five fixes have been aimed at a recurring ~1s dropout on the strength of "it
// sounds like it happens at the loop point". The single output that settles
// that is the INTERVAL BETWEEN DROPOUTS: a loop seam can only produce a gap
// once per loop, so if the gaps arrive every 47s +/- 0.4s and no sound in the
// mix has a loopSeconds anywhere near 47 (or 23.5, or 15.7), the seam is
// innocent no matter how much it sounds like a seam. Everything else printed
// below is in service of trusting that number.
//
// ── How a dropout is detected ───────────────────────────────────────────────
// Two independent triggers, either of which opens a dropout, both of which have
// to hold for at least --min-ms:
//
//   1. ABSOLUTE. Frame level at or below --silence-db (default -60 dBFS). This
//      is the trigger that catches a hole in already-quiet material, where a
//      relative test has nothing to be relative to.
//
//   2. RELATIVE. Frame level --duck-db (default 18 dB) or more below the LOCAL
//      programme reference, which is the median second-level over a +/-
//      --context-sec window. Relative is what catches a partial duck: a limiter
//      clamping down, a gain ramp landing in the wrong place, a crossfade that
//      dips to -20 dB instead of holding unity. None of those ever reach
//      absolute silence and all of them are audible as a hole.
//      Suppressed where the local reference is itself below --silence-db, so a
//      genuinely quiet passage cannot manufacture ducks out of its own noise.
//
// A detected run is then CLASSIFIED. Below -80 dBFS peak (1e-4, the same
// digital-silence level verify-seams.mjs uses) it is `silence`: the samples are
// actually zero, which means the graph stopped producing rather than turned
// down. Anything above that is `duck`: something applied gain. Those two have
// completely different causes and the fix for one is never the fix for the
// other, which is why they are never merged into one count.
//
// For a `silence` dropout the frame-resolution edges are then refined at SAMPLE
// resolution, because the frame grid can only place an edge to within one
// window and the length of a gap in samples is often the tell (1024 samples is
// an AAC frame; 128 is a render quantum; 4096 is a ScriptProcessor block).
//
// ── Flags ───────────────────────────────────────────────────────────────────
//   --silence-db <dbfs>   -60    absolute trigger, and the "is the programme
//                                even audible here" guard for the relative one
//   --duck-db <db>         18    dB below local reference that counts as a duck
//   --min-ms <ms>         150    shortest run reported as a dropout
//   --window-ms <ms>       10    envelope window (roughly the ear's loudness
//                                integration floor, as in verify-seams.mjs)
//   --hop-ms <ms>           2    envelope hop
//   --merge-ms <ms>        40    gaps closer than this are one dropout
//   --context-sec <s>       8    half-width of the local reference median
//   --periodic-cv <r>    0.10    stddev/mean at or below this reads as periodic
//   --manifest <path>           alternate loopManifest.json
//   --json [path]               machine-readable; bare --json prints to stdout

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, mixMono, pct, toDb, meanStd } from './lib/audio-dsp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Defaults ────────────────────────────────────────────────────────────────
const D = {
    silenceDb: -60,
    duckDb: 18,
    minMs: 150,
    windowMs: 10,
    hopMs: 2,
    mergeMs: 40,
    contextSec: 8,
    periodicCv: 0.10,
};
/** Peak at or below this is digital silence. Matches SILENCE_LVL in verify-seams.mjs. */
const DIGITAL_SILENCE = 1e-4;
/**
 * A dropout touching the first or last of these seconds is reported but kept
 * out of the interval statistics: the head and tail of every capture contain a
 * human starting and stopping a recording, and letting that noise into the
 * periodicity number is how a real period gets buried.
 */
const EDGE_GUARD_SEC = 1.5;
/**
 * How far ahead of a dropout to look for a cause in the sidecar. A suspension
 * takes effect before the samples run out, because the samples already queued
 * in the output buffer keep playing.
 */
const CAUSE_LOOKBACK_MS = 400;
/** A trace gap this long means the main thread was blocked, not that audio was fine. */
const MAIN_THREAD_GAP_MS = 400;
/**
 * Floor on the loop-match tolerance, in seconds. The onset of a full-silence
 * dropout is located to the sample, so 20ms is a generous allowance for the
 * envelope grid on the ducks; the real tolerance is three times the measured
 * interval spread, and this only stops a perfectly regular series demanding an
 * exact-to-the-microsecond loop length.
 */
const LOOP_MATCH_TOL = 0.02;

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const num = (name, dflt) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : dflt;
};
const str = (name, dflt) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};
const has = (name) => argv.includes(name);

const opt = {
    silenceDb: num('--silence-db', D.silenceDb),
    duckDb: num('--duck-db', D.duckDb),
    minMs: num('--min-ms', D.minMs),
    windowMs: num('--window-ms', D.windowMs),
    hopMs: num('--hop-ms', D.hopMs),
    mergeMs: num('--merge-ms', D.mergeMs),
    contextSec: num('--context-sec', D.contextSec),
    periodicCv: num('--periodic-cv', D.periodicCv),
};
const MANIFEST_PATH = path.resolve(ROOT, str('--manifest', 'src/constants/loopManifest.json'));
const WANT_JSON = has('--json');
const JSON_OUT = WANT_JSON ? str('--json', null) : null;

const positional = [];
for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
        // Skip this flag's value, unless the flag is a bare --json.
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) i++;
        continue;
    }
    positional.push(a);
}
const RECORDING = positional[0];
const SIDECAR = positional[1] || null;

if (!RECORDING) {
    console.error('usage: node scripts/analyze-capture.mjs <recording> [sidecar.json] [flags]');
    process.exit(2);
}
if (!existsSync(RECORDING)) {
    console.error(`no such file: ${RECORDING}`);
    process.exit(2);
}

// ── envelope ────────────────────────────────────────────────────────────────

/**
 * Block-wise sum-of-squares and peak, then frames built from whole blocks.
 *
 * Done this way rather than by re-summing a sliding window per frame because
 * captures run to hundreds of millions of samples and the naive version is
 * O(n * window/hop). Blocks make it O(n), and since the window is an exact
 * multiple of the hop nothing is approximated by doing it.
 */
function envelope(mono, sr, windowMs, hopMs) {
    const hop = Math.max(1, Math.round((hopMs / 1000) * sr));
    const perFrame = Math.max(1, Math.round(windowMs / hopMs));
    const blocks = Math.floor(mono.length / hop);
    const blockSq = new Float64Array(blocks);
    const blockPeak = new Float64Array(blocks);
    for (let b = 0; b < blocks; b++) {
        let s = 0, p = 0;
        const off = b * hop;
        for (let i = 0; i < hop; i++) {
            const v = mono[off + i];
            s += v * v;
            const a = v < 0 ? -v : v;
            if (a > p) p = a;
        }
        blockSq[b] = s;
        blockPeak[b] = p;
    }
    const frames = Math.max(0, blocks - perFrame + 1);
    const rmsArr = new Float64Array(frames);
    const peakArr = new Float64Array(frames);
    for (let k = 0; k < frames; k++) {
        // Summed fresh over the window's few blocks rather than carried as a
        // running total. A running sum across a hundred thousand blocks
        // accumulates float error, and inside a true digital-silence region
        // that error can leave the total very slightly NEGATIVE, whose square
        // root is NaN, and NaN fails every "is this below the threshold" test
        // there is. The result is a real dropout silently not being reported,
        // which is the one failure this whole rig cannot afford. perFrame is
        // 5 by default, so exactness costs nothing.
        let s = 0, p = 0;
        for (let b = k; b < k + perFrame; b++) {
            s += blockSq[b];
            if (blockPeak[b] > p) p = blockPeak[b];
        }
        rmsArr[k] = Math.sqrt(s / (perFrame * hop));
        peakArr[k] = p;
    }
    return { rms: rmsArr, peak: peakArr, hop, perFrame, frames, frameSec: hop / sr };
}

/**
 * Local programme level, as a median of per-second medians over a sliding
 * +/- contextSec window.
 *
 * A median, not a mean, and at two levels, because the thing being estimated is
 * "how loud is this material normally" and it has to be immune to the very
 * dropouts it is being used to find. A one-second hole inside a 17-second
 * window moves a median not at all and moves a mean by 6%.
 */
function localReference(env, sr, contextSec) {
    const framesPerSec = Math.max(1, Math.round(1 / env.frameSec));
    const seconds = Math.max(1, Math.ceil(env.frames / framesPerSec));
    const secMedian = new Float64Array(seconds);
    for (let s = 0; s < seconds; s++) {
        const a = env.rms.subarray(s * framesPerSec, Math.min(env.frames, (s + 1) * framesPerSec));
        secMedian[s] = a.length ? pct(a, 0.5) : 0;
    }
    const C = Math.max(1, Math.round(contextSec));
    const ref = new Float64Array(seconds);
    for (let s = 0; s < seconds; s++) {
        const lo = Math.max(0, s - C), hi = Math.min(seconds, s + C + 1);
        ref[s] = pct(secMedian.subarray(lo, hi), 0.5);
    }
    return { ref, framesPerSec, refAt: (k) => ref[Math.min(seconds - 1, Math.floor(k / framesPerSec))] };
}

// ── detection ───────────────────────────────────────────────────────────────

function findDropouts(mono, sr, env, refs, o) {
    const silenceLin = Math.pow(10, o.silenceDb / 20);
    const duckFactor = Math.pow(10, -o.duckDb / 20);
    const minFrames = Math.max(1, Math.round((o.minMs / 1000) / env.frameSec));
    const mergeFrames = Math.max(0, Math.round((o.mergeMs / 1000) / env.frameSec));

    const flagged = new Uint8Array(env.frames);
    for (let k = 0; k < env.frames; k++) {
        const level = env.rms[k];
        if (level <= silenceLin) { flagged[k] = 1; continue; }
        const ref = refs.refAt(k);
        // The guard: a relative duck only means anything where there is a
        // programme to duck away from.
        if (ref > silenceLin && level <= ref * duckFactor) flagged[k] = 1;
    }

    // Collect runs, then close gaps shorter than mergeFrames so one recovered
    // frame in the middle of a hole does not split it into two dropouts.
    const runs = [];
    let start = -1;
    for (let k = 0; k <= env.frames; k++) {
        const on = k < env.frames && flagged[k] === 1;
        if (on && start < 0) start = k;
        if (!on && start >= 0) { runs.push([start, k]); start = -1; }
    }
    const merged = [];
    for (const r of runs) {
        const last = merged[merged.length - 1];
        if (last && r[0] - last[1] <= mergeFrames) last[1] = r[1];
        else merged.push([...r]);
    }

    const totalSec = mono.length / sr;
    const out = [];
    for (const [a, b] of merged) {
        if (b - a < minFrames) continue;
        let startSample = a * env.hop;
        let endSample = Math.min(mono.length, b * env.hop + env.perFrame * env.hop);

        let minRms = Infinity, minPeak = Infinity;
        for (let k = a; k < b; k++) {
            if (env.rms[k] < minRms) minRms = env.rms[k];
            if (env.peak[k] < minPeak) minPeak = env.peak[k];
        }
        const isSilence = minPeak <= DIGITAL_SILENCE;
        if (isSilence) {
            const refined = refineSilence(mono, startSample, endSample, env.perFrame * env.hop);
            if (refined) { startSample = refined[0]; endSample = refined[1]; }
        }

        const startSec = startSample / sr;
        const durSec = (endSample - startSample) / sr;
        const ref = refs.refAt(a);
        out.push({
            startSec,
            endSec: startSample / sr + durSec,
            durationMs: durSec * 1000,
            durationSamples: endSample - startSample,
            depthDbfs: toDb(minRms),
            peakDbfs: toDb(minPeak),
            referenceDbfs: toDb(ref),
            relativeDb: toDb(minRms) - toDb(ref),
            type: isSilence ? 'silence' : 'duck',
            atEdge: startSec < EDGE_GUARD_SEC || startSec + durSec > totalSec - EDGE_GUARD_SEC,
        });
    }
    return out;
}

/**
 * Pull the edges of a digital-silence dropout in to the actual zero samples.
 *
 * The envelope can only place an edge to within one window, and for this bug
 * the exact LENGTH IN SAMPLES is a fingerprint: 128 is one render quantum, 1024
 * is an AAC frame, 4096 is a ScriptProcessor block, and a round number of
 * milliseconds is a timer. Rounding all of those to the nearest 10ms throws
 * away the most identifying thing in the recording.
 */
function refineSilence(mono, startSample, endSample, slack) {
    const lo = Math.max(0, startSample - slack);
    const hi = Math.min(mono.length, endSample + slack);
    let best = null, runStart = -1;
    for (let i = lo; i <= hi; i++) {
        const quiet = i < hi && Math.abs(mono[i]) <= DIGITAL_SILENCE;
        if (quiet && runStart < 0) runStart = i;
        if (!quiet && runStart >= 0) {
            if (!best || i - runStart > best[1] - best[0]) best = [runStart, i];
            runStart = -1;
        }
    }
    // Only trust the refinement if it accounts for most of what the envelope
    // found; otherwise the "silence" was a near-silence and the frame bounds
    // are the honest answer.
    if (!best) return null;
    return (best[1] - best[0]) >= 0.5 * (endSample - startSample) ? best : null;
}

// ── periodicity ─────────────────────────────────────────────────────────────

/**
 * Interval statistics over one series of dropouts.
 *
 * Run per TYPE as well as over everything, because two faults with different
 * causes can be present at once and interleaving them destroys both periods:
 * a dead-regular 47.0s silence and one stray duck in the middle of it come out
 * as "37.6s +/- 14.7s, not periodic", which is the wrong answer twice over. The
 * caller picks whichever series is actually periodic and reports the rest as
 * context.
 */
function periodicity(interior, o) {
    const intervals = [];
    for (let i = 1; i < interior.length; i++) {
        intervals.push(interior[i].startSec - interior[i - 1].startSec);
    }
    const { mean, std } = meanStd(intervals);
    const cv = mean > 0 ? std / mean : 0;
    return {
        count: interior.length,
        intervals,
        meanSec: mean,
        stdSec: std,
        cv,
        minSec: intervals.length ? Math.min(...intervals) : 0,
        maxSec: intervals.length ? Math.max(...intervals) : 0,
        // Three intervals is the fewest that can distinguish a rhythm from a
        // coincidence between two events.
        periodic: intervals.length >= 3 && cv <= o.periodicCv,
    };
}

/**
 * Does the observed period correspond to a loop wrapping?
 *
 * A loop seam can produce a gap once per wrap and no more often, so the test is
 * whether meanInterval / loopSeconds lands on a whole number. Multiples up to 4
 * are allowed because a seam that only misbehaves on some wraps is a real
 * failure mode; fractions are not, because there is no mechanism by which one
 * loop produces three gaps.
 *
 * The tolerance is the MEASURED spread of the intervals and nothing else. A
 * fixed percentage slop was the first version of this and it is exactly wrong:
 * a series whose intervals are 47.00, 47.00, 47.00, 47.00 is not consistent
 * with a 23.583s loop wrapping twice, because that would put the gaps 47.166s
 * apart and drift 0.66s over those four wraps. The tighter the observed period,
 * the more it can rule out, and a percentage-of-loop-length window throws that
 * discriminating power away. `nearest` is returned separately so a near miss is
 * still visible to a human without being asserted as a match.
 */
function matchLoopSeconds(meanSec, tolSec, manifest, activeIds) {
    if (!(meanSec > 0)) return { matches: [], nearest: [] };
    const entries = [
        ...(manifest.baked || []).map(e => ({ ...e, group: 'baked' })),
        ...(manifest.longform || []).map(e => ({ ...e, group: 'longform' })),
    ];
    const all = [];
    for (const e of entries) {
        const L = e.loopSeconds;
        if (!(L > 0)) continue;
        const k = Math.round(meanSec / L);
        if (k < 1 || k > 4) continue;
        const errSec = Math.abs(meanSec - k * L);
        all.push({
            id: e.id,
            group: e.group,
            loopSeconds: L,
            multiple: k,
            errorSec: errSec,
            errorPct: (errSec / meanSec) * 100,
            wasPlaying: activeIds ? activeIds.has(e.id) : null,
        });
    }
    all.sort((a, b) => a.errorSec - b.errorSec);
    return { matches: all.filter(m => m.errorSec <= tolSec), nearest: all.slice(0, 4), tolSec };
}

// ── sidecar correlation ─────────────────────────────────────────────────────

/**
 * Attribute each dropout to a cause using the sidecar's passive trace.
 *
 * The trace is what the recording cannot contain: whether the AudioContext was
 * running, whether its clock was advancing, and whether the main thread was
 * alive to record any of it. The four labels are deliberately exhaustive and
 * mutually exclusive, and `unexplained` is a real answer, not a failure: a gap
 * with a healthy context, an advancing audio clock and a responsive main thread
 * is a gap in the MATERIAL, which points straight back at the loop content or
 * the gain automation and away from the session.
 */
function correlate(dropouts, sidecar) {
    if (!sidecar) return;
    const clock = sidecar.clock || [];
    const lead = (sidecar.captureLeadSec || 0) * 1000;
    const wdOrigin = sidecar.t0?.performanceNow ?? 0;
    const events = (sidecar.watchdog?.events || []).map(e => ({ ...e, w: e.at - wdOrigin }));
    const renderGaps = sidecar.renderGaps || [];

    for (const d of dropouts) {
        const w0 = d.startSec * 1000 + lead - CAUSE_LOOKBACK_MS;
        const w1 = (d.startSec + d.durationMs / 1000) * 1000 + lead;

        const inWindow = clock.filter(c => c.w >= w0 && c.w <= w1);
        const detail = [];

        // Main-thread stall shows as the trace itself going missing.
        let mainGapMs = 0;
        for (let i = 1; i < clock.length; i++) {
            const gap = clock[i].w - clock[i - 1].w;
            if (gap < MAIN_THREAD_GAP_MS) continue;
            if (clock[i].w < w0 || clock[i - 1].w > w1) continue;
            mainGapMs = Math.max(mainGapMs, gap);
        }
        if (mainGapMs) detail.push(`main thread blocked ${Math.round(mainGapMs)}ms`);

        const suspended = inWindow.some(c => c.st !== 'running')
            || events.some(e => e.w >= w0 && e.w <= w1 && e.kind === 'ctx-suspended');
        const hidden = inWindow.some(c => c.h === 1);
        if (hidden) detail.push('app was backgrounded');

        // Audio clock against wall clock across the window.
        let stalled = false;
        if (inWindow.length >= 2) {
            const first = inWindow[0], last = inWindow[inWindow.length - 1];
            const wallSec = (last.w - first.w) / 1000;
            const ctSec = last.ct - first.ct;
            if (wallSec > 0.2 && ctSec < wallSec * 0.25) {
                stalled = true;
                detail.push(`audio clock advanced ${ctSec.toFixed(3)}s over ${wallSec.toFixed(3)}s of wall time`);
            }
        }
        if (events.some(e => e.w >= w0 && e.w <= w1 && e.kind === 'ctx-stalled')) stalled = true;

        for (const g of renderGaps) {
            const gw = g.atSec * 1000;
            if (gw >= w0 && gw <= w1) detail.push(`render thread skipped ${g.missingFrames} frames`);
        }

        const wdKinds = [...new Set(events.filter(e => e.w >= w0 && e.w <= w1).map(e => e.kind))];
        if (wdKinds.length) detail.push(`watchdog: ${wdKinds.join(', ')}`);

        if (suspended) d.cause = 'ctx-suspended';
        else if (stalled) d.cause = 'ctx-stalled';
        else if (inWindow.length >= 2 && !mainGapMs) d.cause = 'silence-with-healthy-graph';
        else d.cause = 'unexplained';
        d.causeDetail = detail.join('; ') || null;
    }
}

// ── run ─────────────────────────────────────────────────────────────────────

const sidecar = SIDECAR ? JSON.parse(readFileSync(SIDECAR, 'utf8')) : null;
const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : { baked: [], longform: [] };

const { channels, sr, n } = decode(RECORDING);
const mono = mixMono(channels, n);
const env = envelope(mono, sr, opt.windowMs, opt.hopMs);
const refs = localReference(env, sr, opt.contextSec);
const dropouts = findDropouts(mono, sr, env, refs, opt);
correlate(dropouts, sidecar);

const durationSec = n / sr;
const interior = dropouts.filter(d => !d.atEdge);
const byType = {
    silence: interior.filter(d => d.type === 'silence').length,
    duck: interior.filter(d => d.type === 'duck').length,
};

// Three candidate series. Whichever is actually periodic is the one the verdict
// speaks about, because a period is a property of a MECHANISM and two different
// mechanisms firing during the same capture do not share one.
const series = [
    { label: 'all dropouts', items: interior },
    { label: 'full digital silence only', items: interior.filter(d => d.type === 'silence') },
    { label: 'partial ducks only', items: interior.filter(d => d.type === 'duck') },
]
    .filter(s => s.items.length >= 2)
    .map(s => ({ ...s, stats: periodicity(s.items, opt) }));
// Prefer a periodic series, tightest first; failing that, speak about all of
// them together and say plainly that nothing was periodic.
const periodicSeries = series.filter(s => s.stats.periodic).sort((a, b) => a.stats.cv - b.stats.cv);
const primary = periodicSeries[0] || series.find(s => s.label === 'all dropouts') || null;
const period = primary ? primary.stats : periodicity(interior, opt);

/**
 * Everything that was audible at any point, as a set of names a manifest entry
 * can be looked up by.
 *
 * The mixer and the manifest do not share an id space: the mixer calls it
 * 'rain', the manifest calls it 'gentle-rain' after the file stem. The sidecar
 * records both, so this collects the id AND the stem of the path (URL-decoded,
 * because a few assets ship with a space in the filename) and the loop matcher
 * accepts either. Without this a real loopSeconds match reads as "NOT playing"
 * and gets dismissed.
 */
const stemOf = (src) => {
    if (!src) return null;
    try { src = decodeURIComponent(src); } catch { /* leave as-is */ }
    return src.split('/').pop().replace(/\.[^.]+$/, '');
};
const activeIds = sidecar
    ? new Set((sidecar.sounds || []).flatMap(s => (s.active || []).flatMap(a => (
        typeof a === 'string' ? [a] : [a.id, stemOf(a.src)]
    ))).filter(Boolean))
    : null;
const activeLabels = sidecar
    ? [...new Set((sidecar.sounds || []).flatMap(s => (s.active || []).map(a => (
        typeof a === 'string' ? a : a.id
    ))))]
    : [];
// Tolerance for the loop match: three standard deviations of the observed
// intervals, floored at the envelope's own resolution so a perfectly regular
// series is not rejected for being measured through a 10ms window. Only
// computed for a periodic series: a loopSeconds "match" to a scattered interval
// is arithmetic, not evidence.
const loop = period.periodic
    ? matchLoopSeconds(period.meanSec, Math.max(LOOP_MATCH_TOL, 3 * period.stdSec), manifest, activeIds)
    : { matches: [], nearest: [], tolSec: 0 };
const loopMatches = loop.matches;
const byCause = {};
for (const d of interior) byCause[d.cause || 'no-sidecar'] = (byCause[d.cause || 'no-sidecar'] || 0) + 1;
const durStats = meanStd(interior.map(d => d.durationMs));

// ── verdict ─────────────────────────────────────────────────────────────────

function verdict() {
    if (!interior.length) {
        return `No dropouts found in ${durationSec.toFixed(1)}s at -${Math.abs(opt.silenceDb)} dBFS absolute / ${opt.duckDb} dB relative, minimum ${opt.minMs}ms. Either the fault did not reproduce during this capture, or it is shorter or shallower than those thresholds. Re-run with --min-ms 40 --duck-db 10 before concluding it is gone.`;
    }
    const parts = [];
    parts.push(`${interior.length} dropout${interior.length === 1 ? '' : 's'} in ${durationSec.toFixed(1)}s`);
    parts.push(`mean ${(durStats.mean / 1000).toFixed(2)}s`);

    const scope = primary && primary.label !== 'all dropouts' ? ` over ${primary.label}` : '';
    if (period.intervals.length >= 1) {
        parts.push(`mean interval ${period.meanSec.toFixed(1)}s +/- ${period.stdSec.toFixed(1)}s${scope}`);
    }
    if (period.periodic) {
        if (loopMatches.length) {
            const m = loopMatches[0];
            const playing = m.wasPlaying === false ? ' which was NOT playing during this capture' : '';
            parts.push(`matches ${m.id} loopSeconds ${m.loopSeconds.toFixed(2)}${m.multiple > 1 ? ` x${m.multiple}` : ''}${playing}`);
        } else {
            parts.push('does not match any loopSeconds in the manifest');
        }
    } else if (period.intervals.length >= 3) {
        parts.push(`not periodic (cv ${period.cv.toFixed(2)} above ${opt.periodicCv})`);
    } else {
        parts.push('too few dropouts to judge periodicity, capture for longer');
    }

    const mix = byType.silence && byType.duck
        ? `${byType.silence} full digital silence and ${byType.duck} partial duck`
        : byType.silence ? 'all full digital silence' : 'all partial ducks, the graph never stopped producing samples';
    parts.push(mix);

    if (sidecar) {
        const top = Object.entries(byCause).sort((a, b) => b[1] - a[1])[0];
        if (top) {
            const [cause, count] = top;
            const reading = {
                'ctx-suspended': 'cause is session interruption, not the loop seam',
                'ctx-stalled': 'the render thread stopped advancing, which is an engine or session fault, not the material',
                'silence-with-healthy-graph': 'the graph was running and its clock advancing throughout, so the gap is IN THE AUDIO: look at the material and the gain automation, not the session',
                'unexplained': 'the trace does not cover these, most often because the main thread was blocked, which is itself a candidate cause',
            }[cause] || '';
            parts.push(`${count} of ${interior.length} ${cause} -> ${reading}`);
        }
        if (sidecar.watchdog && sidecar.watchdog.running === false) {
            parts.push('NOTE: the watchdog was not running during this capture, so an empty watchdog log is not evidence of a healthy graph');
        }
        if (sidecar.backendCaveat) {
            parts.push(`NOTE: ${sidecar.backendCaveat}`);
        }
    } else {
        parts.push('no sidecar supplied, so no dropout could be attributed to a cause');
    }
    return parts.join(', ') + '.';
}

const report = {
    recording: path.relative(ROOT, path.resolve(RECORDING)),
    sidecar: SIDECAR ? path.relative(ROOT, path.resolve(SIDECAR)) : null,
    sampleRate: sr,
    channels: channels.length,
    durationSec,
    thresholds: { ...opt, digitalSilenceDbfs: toDb(DIGITAL_SILENCE) },
    backend: sidecar?.backend ?? null,
    backendCaveat: sidecar?.backendCaveat ?? null,
    watchdogRunning: sidecar?.watchdog?.running ?? null,
    activeSounds: sidecar ? activeLabels : null,
    dropouts,
    interiorCount: interior.length,
    byType,
    byCause: sidecar ? byCause : null,
    durationStatsMs: durStats,
    intervalSeries: series.map(s => ({ label: s.label, ...s.stats })),
    primarySeries: primary ? primary.label : null,
    interval: period,
    loopMatches,
    loopNearest: loop.nearest,
    loopToleranceSec: loop.tolSec,
    verdict: verdict(),
};

if (WANT_JSON && !JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
}

// ── table ───────────────────────────────────────────────────────────────────

const pad = (s, w) => String(s).padStart(w);
const padr = (s, w) => String(s).padEnd(w);

console.log('');
console.log(`capture analysis — ${report.recording}`);
console.log(`  ${durationSec.toFixed(1)}s, ${sr}Hz, ${channels.length}ch` +
    (sidecar ? `, backend ${sidecar.backend}` : ', no sidecar'));
console.log(`  triggers: <= ${opt.silenceDb} dBFS absolute, or ${opt.duckDb} dB below local reference; min ${opt.minMs}ms`);
if (sidecar?.backendCaveat) console.log(`  caveat: ${sidecar.backendCaveat}`);
if (sidecar?.watchdog?.running === false) console.log('  caveat: watchdog was NOT running, its log is empty for that reason');
if (activeLabels.length) console.log(`  sounds active during capture: ${activeLabels.join(', ')}`);
console.log('');

const H = `${padr('#', 4)}${pad('start s', 10)}${pad('dur ms', 9)}${pad('samples', 9)}${pad('depth dB', 10)}${pad('rel dB', 8)}  ${padr('type', 8)}${padr('cause', 28)}detail`;
console.log(H);
console.log('-'.repeat(Math.min(150, H.length + 20)));
if (!dropouts.length) {
    console.log('  none');
} else {
    dropouts.forEach((d, i) => {
        console.log(
            `${padr(d.atEdge ? `${i + 1}*` : i + 1, 4)}${pad(d.startSec.toFixed(3), 10)}${pad(d.durationMs.toFixed(0), 9)}` +
            `${pad(d.durationSamples, 9)}${pad(d.depthDbfs.toFixed(1), 10)}${pad(d.relativeDb.toFixed(1), 8)}  ` +
            `${padr(d.type, 8)}${padr(d.cause || '-', 28)}${d.causeDetail || ''}`
        );
    });
    if (dropouts.some(d => d.atEdge)) {
        console.log(`  * touches the first or last ${EDGE_GUARD_SEC}s of the capture, excluded from the interval statistics`);
    }
}

console.log('');
console.log('intervals between dropouts');
if (!series.length) {
    console.log('  fewer than two interior dropouts, no interval to measure');
} else {
    for (const s of series) {
        const st = s.stats;
        const mark = primary && s.label === primary.label ? '>' : ' ';
        console.log(`${mark} ${padr(s.label, 28)} n=${pad(st.intervals.length, 2)}  mean ${pad(st.meanSec.toFixed(3), 9)}s  stddev ${pad(st.stdSec.toFixed(3), 8)}s  cv ${st.cv.toFixed(3)}  ${st.periodic ? 'PERIODIC' : 'not periodic'}`);
        console.log(`  ${padr('', 28)} raw: ${st.intervals.map(v => v.toFixed(2)).join(', ')}`);
    }
    console.log(`  periodic means cv <= ${opt.periodicCv} over at least 3 intervals; "> " marks the series the verdict speaks about`);
}

console.log('');
console.log('loopSeconds correlation');
if (!period.periodic) {
    console.log('  skipped: no series is periodic, and a loopSeconds "match" to a');
    console.log('  scattered interval is arithmetic, not evidence. Capture for longer');
    console.log('  if a period is expected but too few dropouts were caught to see it.');
} else {
    const row = (m) => {
        const flag = m.wasPlaying === false ? '  (NOT playing during this capture)' : m.wasPlaying ? '  (was playing)' : '';
        return `  ${padr(m.id, 30)} loopSeconds ${pad(m.loopSeconds.toFixed(3), 10)} x${m.multiple}  err ${m.errorSec.toFixed(3)}s (${m.errorPct.toFixed(2)}%)${flag}`;
    };
    console.log(`  tolerance ${loop.tolSec.toFixed(3)}s (3x the measured interval spread)`);
    if (!loopMatches.length) {
        console.log('  NO MATCH: no loopSeconds in the manifest lands within tolerance at any');
        console.log('  multiple 1..4. A loop seam cannot produce a gap on a period unrelated to');
        console.log('  its own length, so on this evidence the seam is not the cause.');
        if (loop.nearest.length) {
            console.log('  nearest, for eyeballing only:');
            loop.nearest.forEach(m => console.log(row(m)));
        }
    } else {
        loopMatches.forEach(m => console.log(row(m)));
    }
}

if (sidecar) {
    console.log('');
    console.log('cause attribution');
    for (const [k, v] of Object.entries(byCause).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${padr(k, 30)} ${v}`);
    }
}

console.log('');
console.log('VERDICT');
console.log(`  ${report.verdict}`);
console.log('');

if (JSON_OUT) {
    writeFileSync(path.resolve(ROOT, JSON_OUT), JSON.stringify(report, null, 2));
    console.log(`json → ${JSON_OUT}\n`);
}
