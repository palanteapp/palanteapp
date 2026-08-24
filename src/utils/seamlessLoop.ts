// Pure DSP helpers for building gaplessly loopable audio buffers.
// Free of Web Audio types so the math is unit-testable in jsdom, the
// Web Audio wiring lives in seamlessAudio.ts.

/**
 * Find the first and last sample (across all channels) louder than the
 * threshold. MP3 encoding pads both ends of a file with digital silence
 * (~50ms of encoder delay), which is what makes `loop = true` audibly hiccup;
 * trimming to the loud range removes it. Returns the full range when the
 * file never crosses the threshold.
 */
export function findLoudRange(
    channels: Float32Array[],
    threshold = 0.001,
): { start: number; end: number } {
    const length = channels[0]?.length ?? 0;
    let start = 0;
    let end = length;

    scanForward: for (let i = 0; i < length; i++) {
        for (const ch of channels) {
            if (Math.abs(ch[i]) > threshold) {
                start = i;
                break scanForward;
            }
        }
    }
    scanBackward: for (let i = length - 1; i >= 0; i--) {
        for (const ch of channels) {
            if (Math.abs(ch[i]) > threshold) {
                end = i + 1;
                break scanBackward;
            }
        }
    }

    if (end <= start) return { start: 0, end: length };
    return { start, end };
}

/**
 * True when every channel carries identical audio (dual-mono). Many ambient
 * files are encoded as stereo from a mono master; collapsing them to one
 * channel halves decoded memory with zero quality loss. Sampled comparison
 * a prime stride keeps the check cheap while making coincidental matches on
 * genuinely stereo material (bilateral pans, binaural beats) implausible.
 */
export function isDualMono(channels: Float32Array[], stride = 997): boolean {
    if (channels.length < 2) return true;
    const [first, ...rest] = channels;
    for (let i = 0; i < first.length; i += stride) {
        for (const ch of rest) {
            if (ch[i] !== first[i]) return false;
        }
    }
    return true;
}

/**
 * Build channel data that loops with zero discontinuity.
 *
 * Trims encoder-padding silence, then overlap-adds the final `fadeSeconds`
 * of audio onto the head with an equal-power crossfade. The output's last
 * sample is the sample immediately preceding the tail window and its first
 * sample is the tail window's first sample: so when a looping source wraps
 * end→start, the waveform continues sample-exactly, and the only "seam" is a
 * gentle morph from tail into head spread across the whole fade window.
 */
export function bakeSeamlessLoop(
    channels: Float32Array[],
    sampleRate: number,
    fadeSeconds = 2.0,
    silenceThreshold = 0.001,
): Float32Array[] {
    const plan = planLoopBuffer(channels, sampleRate, { fadeSeconds, silenceThreshold });
    return channels.map((ch, c) => {
        const out = new Float32Array(plan.length);
        out.set(ch.subarray(plan.start, plan.start + plan.length));
        if (plan.head) out.set(plan.head[c], 0);
        return out;
    });
}

/**
 * The crossfade window used when the file was already seam-matched offline by
 * scripts/bake-loops.mjs.
 *
 * The baker leaves the output sample-exact across the wrap (its last sample and
 * its first sample are adjacent samples of the master), so in principle it
 * needs no runtime treatment at all. In practice the MP3 round-trip that ships
 * the file destroys that sample-exactness: measured on the shipped assets, the
 * wrap step is up to 86× the ordinary sample-to-sample step (heartbeat), which
 * ticks audibly. 30ms of equal-power crossfade restores an exactly-adjacent
 * wrap while rewriting only the first 30ms of the baker's 1–4s matched blend,
 * instead of the 2 full seconds the old fixed default overwrote.
 */
export const PRE_BAKED_FADE_SECONDS = 0.03;

export interface LoopPlan {
    /** First sample of the loop inside the source channels. */
    start: number;
    /** Number of samples in the loop. */
    length: number;
    /** Crossfade length in samples (0 when no crossfade was applied). */
    fade: number;
    /**
     * The crossfaded first `fade` samples per channel, or null when `fade` is 0.
     * The rest of the loop is `channel.subarray(start + fade, start + length)`,
     * so a caller can build the output without a second full-length copy.
     */
    head: Float32Array[] | null;
    /** Peak normalized cross-correlation of the chosen tail against the head. */
    ncc: number;
}

interface PlanOptions {
    fadeSeconds?: number;
    silenceThreshold?: number;
    /**
     * When true, search backwards from the end for the loop point whose tail
     * best correlates with the head instead of cutting at the literal end.
     * Only worth paying for on files the offline baker has NOT already matched.
     */
    search?: boolean;
    /** Keep at least this fraction of the trimmed signal when searching. */
    minFrac?: number;
    /** How far back from the end the search may look, in seconds. */
    searchSeconds?: number;
    /**
     * Exact loop length in samples, from the baker (`loopSeconds` in
     * loopManifest.json, converted at the decoded rate). When given, the loop
     * is taken as [0, exactLength) verbatim: no silence trim at either edge.
     *
     * Both edges matter. At the END, the amplitude trim cannot distinguish the
     * real last sample from AAC's trailing encoder padding, and on dense
     * material that padding sits above the threshold and gets looped. At the
     * START, a baked file begins exactly ON the loop point by construction, so
     * trimming a quiet head (distant-rain-and-thunder and bilateral-tune-up
     * both open below the threshold) would slide the buffer off the seam the
     * baker built and produce the very discontinuity this avoids.
     */
    exactLength?: number;
}

/** Downmix to a single channel for correlation analysis. */
export function mixToMono(channels: Float32Array[]): Float32Array {
    if (channels.length === 1) return channels[0];
    const n = channels[0].length;
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (const ch of channels) sum += ch[i];
        out[i] = sum / channels.length;
    }
    return out;
}

/**
 * Find the loop end whose preceding `window` samples best match the head, by
 * normalized cross-correlation. Coarse hop then a fine pass around the winner.
 *
 * Note there is deliberately no zero-crossing snap afterwards: the crossfade
 * below already guarantees a sample-exact wrap, so nudging the edge to a zero
 * crossing buys nothing and moves the cut away from the correlation optimum.
 */
export function findBestLoopEnd(
    mono: Float32Array,
    start: number,
    end: number,
    window: number,
    minEnd: number,
): { end: number; ncc: number } {
    const w = Math.min(window, Math.floor((end - start) / 4), 8192);
    if (w <= 0 || minEnd >= end) return { end, ncc: 0 };

    let headEnergy = 0;
    for (let i = 0; i < w; i++) headEnergy += mono[start + i] * mono[start + i];

    const score = (candidate: number): number => {
        const base = candidate - w;
        if (base < start) return -Infinity;
        let dot = 0;
        let tailEnergy = 0;
        for (let i = 0; i < w; i++) {
            const t = mono[base + i];
            dot += t * mono[start + i];
            tailEnergy += t * t;
        }
        return dot / (Math.sqrt(tailEnergy * headEnergy) + 1e-9);
    };

    let bestEnd = end;
    let best = -Infinity;
    for (let e = minEnd; e <= end; e += 16) {
        const s = score(e);
        if (s > best) { best = s; bestEnd = e; }
    }
    for (let e = Math.max(minEnd, bestEnd - 16); e <= Math.min(end, bestEnd + 16); e++) {
        const s = score(e);
        if (s > best) { best = s; bestEnd = e; }
    }
    return { end: bestEnd, ncc: best === -Infinity ? 0 : best };
}

/**
 * Plan a gapless loop without materializing the output.
 *
 * Only the crossfaded head is allocated; the body stays a view into the caller's
 * decoded channels. On a 9-minute track that is the difference between one extra
 * megabyte and one extra hundred megabytes.
 */
export function planLoopBuffer(
    channels: Float32Array[],
    sampleRate: number,
    options: PlanOptions = {},
): LoopPlan {
    const {
        fadeSeconds = 2.0,
        silenceThreshold = 0.001,
        search = false,
        minFrac = 0.7,
        searchSeconds = 8,
        exactLength,
    } = options;

    const usable = channels[0]?.length ?? 0;
    // Clamp rather than reject: the AAC round-trip returns a hair FEWER samples
    // than were handed to it on at least one track (colombia-eas, -29 samples),
    // and using every sample that did come back beats falling all the way back
    // to threshold trimming, which is the guess this is here to replace.
    const exact = exactLength && exactLength > 0
        ? Math.min(Math.floor(exactLength), usable)
        : 0;

    const trimmed = exact ? { start: 0, end: exact } : findLoudRange(channels, silenceThreshold);
    const start = trimmed.start;
    let end = trimmed.end;
    let ncc = 0;

    const wanted = Math.floor(fadeSeconds * sampleRate);
    if (search && wanted > 0) {
        const span = end - start;
        const minEnd = Math.max(
            start + Math.floor(span * minFrac),
            end - Math.floor(searchSeconds * sampleRate),
        );
        const found = findBestLoopEnd(mixToMono(channels), start, end, wanted, minEnd);
        // Only accept a match that still leaves room to crossfade.
        if (found.end > start + wanted * 2) {
            end = found.end;
            ncc = found.ncc;
        }
    }

    const length = end - start;
    const fade = Math.max(0, Math.min(wanted, Math.floor(length / 4)));
    const outLength = length - fade;

    if (fade <= 0 || outLength <= 0) {
        return { start, length, fade: 0, head: null, ncc };
    }

    const head = channels.map(ch => {
        const out = new Float32Array(fade);
        for (let i = 0; i < fade; i++) {
            const t = (i / fade) * (Math.PI / 2);
            // Equal-power: head fades in as the overlapped tail fades out.
            out[i] = ch[start + i] * Math.sin(t) + ch[start + outLength + i] * Math.cos(t);
        }
        return out;
    });

    return { start, length: outLength, fade, head, ncc };
}
