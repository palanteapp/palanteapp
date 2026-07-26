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
    const { start, end } = findLoudRange(channels, silenceThreshold);
    const length = end - start;
    const fade = Math.min(Math.floor(fadeSeconds * sampleRate), Math.floor(length / 4));
    const outLength = length - fade;

    if (fade <= 0 || outLength <= 0) {
        // Too short to crossfade: return the trimmed audio unchanged.
        return channels.map(ch => ch.slice(start, end));
    }

    return channels.map(ch => {
        const out = new Float32Array(outLength);
        for (let i = 0; i < fade; i++) {
            const t = (i / fade) * (Math.PI / 2);
            // Equal-power: head fades in as the overlapped tail fades out.
            out[i] = ch[start + i] * Math.sin(t) + ch[start + outLength + i] * Math.cos(t);
        }
        for (let i = fade; i < outLength; i++) {
            out[i] = ch[start + i];
        }
        return out;
    });
}
