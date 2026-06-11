import { describe, it, expect } from 'vitest';
import { findLoudRange, isDualMono, bakeSeamlessLoop } from '../utils/seamlessLoop';

const RATE = 48000;

function noise(length: number, seed = 1): Float32Array {
    // Deterministic pseudo-random signal in (-1, 1)
    const out = new Float32Array(length);
    let x = seed;
    for (let i = 0; i < length; i++) {
        x = (x * 16807) % 2147483647;
        out[i] = (x / 2147483647) * 2 - 1;
    }
    return out;
}

describe('findLoudRange', () => {
    it('trims digital silence from both ends', () => {
        const sig = new Float32Array(10000);
        sig.set(noise(6000).map(v => v * 0.5), 2000); // loud region [2000, 8000)
        const { start, end } = findLoudRange([sig]);
        expect(start).toBe(2000);
        expect(end).toBe(8000);
    });

    it('returns the full range for an all-silent signal', () => {
        const sig = new Float32Array(5000);
        const { start, end } = findLoudRange([sig]);
        expect(start).toBe(0);
        expect(end).toBe(5000);
    });

    it('considers all channels when finding the loud range', () => {
        const left = new Float32Array(10000);
        const right = new Float32Array(10000);
        left[3000] = 0.5;
        right[7000] = 0.5;
        const { start, end } = findLoudRange([left, right]);
        expect(start).toBe(3000);
        expect(end).toBe(7001);
    });
});

describe('isDualMono', () => {
    it('detects identical channels', () => {
        const ch = noise(RATE);
        expect(isDualMono([ch, new Float32Array(ch)])).toBe(true);
    });

    it('detects differing channels', () => {
        expect(isDualMono([noise(RATE, 1), noise(RATE, 2)])).toBe(false);
    });

    it('treats mono input as dual-mono', () => {
        expect(isDualMono([noise(RATE)])).toBe(true);
    });
});

describe('bakeSeamlessLoop', () => {
    it('produces a sample-exact seam: last sample flows into first', () => {
        // 8 seconds — long enough that the fade is not clamped to length/4
        const input = noise(RATE * 8);
        const [out] = bakeSeamlessLoop([input], RATE, 1.5);
        const fade = 1.5 * RATE;
        const outLength = input.length - fade;
        expect(out.length).toBe(outLength);

        // At the wrap point the output continues the original waveform exactly:
        // out[last] is input[outLength - 1] and out[0] is input[outLength] —
        // consecutive samples of the source. No discontinuity exists to hear.
        expect(out[out.length - 1]).toBe(input[outLength - 1]);
        expect(out[0]).toBe(input[outLength]);
    });

    it('keeps power constant through the fade for steady signals (no dip)', () => {
        const input = new Float32Array(RATE * 8).fill(0.5);
        const [out] = bakeSeamlessLoop([input], RATE, 1.5);
        const fade = 1.5 * RATE;
        for (let i = 0; i < fade; i += 100) {
            // Equal-power sums sin+cos ∈ [1, √2] — never below unity gain,
            // unlike a linear crossfade which dips to 0.5 at the midpoint.
            expect(out[i]).toBeGreaterThanOrEqual(0.5 - 1e-6);
            expect(out[i]).toBeLessThanOrEqual(0.5 * Math.SQRT2 + 1e-6);
        }
    });

    it('removes MP3-style encoder padding before building the loop', () => {
        const body = noise(RATE * 8);
        const padded = new Float32Array(RATE * 8 + 4000);
        padded.set(body, 2000); // 2000 silent samples at each end
        const [out] = bakeSeamlessLoop([padded], RATE, 1.5);
        expect(out.length).toBe(body.length - 1.5 * RATE);
        // First output sample comes from the (trimmed) tail window, not silence.
        expect(out[0]).toBe(body[body.length - 1.5 * RATE]);
    });

    it('handles clips too short to crossfade by returning trimmed audio', () => {
        const input = noise(8);
        const [out] = bakeSeamlessLoop([input], RATE, 1.5);
        // fade clamps to length/4 = 2 → output is length - fade = 6
        expect(out.length).toBe(6);
    });

    it('bakes every channel of stereo input', () => {
        const left = noise(RATE * 8, 1);
        const right = noise(RATE * 8, 2);
        const out = bakeSeamlessLoop([left, right], RATE, 1.5);
        expect(out.length).toBe(2);
        const outLength = left.length - 1.5 * RATE;
        expect(out[0][0]).toBe(left[outLength]);
        expect(out[1][0]).toBe(right[outLength]);
    });
});
