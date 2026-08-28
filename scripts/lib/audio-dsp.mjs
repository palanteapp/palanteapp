// Offline audio measurement primitives, shared by every analysis script.
//
// These were written for and proven by scripts/verify-seams.mjs, which measures
// the shipped loop assets. scripts/analyze-capture.mjs needs the same decode
// path and the same statistics to measure a DEVICE RECORDING, and two copies of
// a decoder that disagree about channel interleaving or percentile convention
// would make the two scripts' numbers quietly incomparable — the exact failure
// bakedLoops.ts exists to prevent for the loop manifest. So they live here once.
//
// Everything is ffmpeg-backed: decoding is done by piping f32le out of ffmpeg
// rather than by parsing containers in JS, so anything ffmpeg can open (m4a,
// wav, webm, mp3, caf) is analysable with no format-specific code.

import { execFileSync } from 'node:child_process';

/** Sample rate and channel count of a file's first audio stream. */
export function probe(file) {
    const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries',
        'stream=sample_rate,channels', '-of', 'csv=p=0', file]).toString().trim().split(',');
    return { sr: parseInt(out[0], 10), ch: parseInt(out[1], 10) };
}

/**
 * Decode to deinterleaved float32 channels at the file's native rate.
 *
 * Native rate, never a resample: every measurement downstream reports offsets
 * that have to line up with a sample index in the original, and a resampler
 * would also low-pass exactly the fast edges (a click, the boundary of a gap)
 * that the analysis is looking for.
 */
export function decode(file) {
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

/** Radix-2 FFT, magnitude only. `x.length` must be a power of two. */
export function magSpectrum(x) {
    const N = x.length;
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

export const FFT_N = 512;
export const HANN = Float64Array.from({ length: FFT_N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / FFT_N));

/** Log-spectral distance in dB RMS between two FFT_N-length frames. */
export function lsd(a, b) {
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

/** Nearest-rank percentile, p in [0, 1]. */
export const pct = (arr, p) => {
    const a = Float64Array.from(arr).sort();
    if (!a.length) return 0;
    return a[Math.min(a.length - 1, Math.max(0, Math.floor(p * (a.length - 1))))];
};

/** RMS of x over [a, b). */
export const rms = (x, a, b) => {
    let s = 0;
    for (let i = a; i < b; i++) s += x[i] * x[i];
    return Math.sqrt(s / Math.max(1, b - a));
};

/** Average the channels down to one, over the first n frames. */
export function mixMono(channels, n) {
    if (channels.length === 1) return channels[0].subarray(0, n);
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let s = 0;
        for (const c of channels) s += c[i];
        m[i] = s / channels.length;
    }
    return m;
}

/** Amplitude ratio to dBFS, floored so a digital zero prints as a number. */
export const toDb = (x) => 20 * Math.log10(Math.max(x, 1e-12));

/** Mean and sample standard deviation of an array of numbers. */
export function meanStd(values) {
    const n = values.length;
    if (!n) return { mean: 0, std: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / n;
    if (n < 2) return { mean, std: 0 };
    const varSum = values.reduce((a, b) => a + (b - mean) * (b - mean), 0);
    return { mean, std: Math.sqrt(varSum / (n - 1)) };
}
