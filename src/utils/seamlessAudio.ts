// Web Audio side of seamless looping: fetch + decode a sound, bake the loop
// seam into an AudioBuffer (see seamlessLoop.ts), and cache decoded buffers
// under a memory budget. Long tracks return null and the caller falls back
// to streaming playback — decoded PCM is roughly 20× the compressed size,
// and a 10+ minute track only loops once in a long while anyway.

import { bakeSeamlessLoop, isDualMono } from './seamlessLoop';

// Compressed-size gate: ≤ ~6.5MB covers every library sound up to ~3 minutes.
export const MAX_SEAMLESS_COMPRESSED_BYTES = 6_500_000;
// Hard ceiling per decoded sound (≈ 3.5 min of stereo 48kHz float32).
const MAX_DECODED_BYTES = 80_000_000;
// Total budget for cached buffers; least-recently-used entries are evicted.
// Eviction never interrupts playback — a playing sound holds its own
// reference to the buffer; eviction only means a later replay re-decodes.
const CACHE_BUDGET_BYTES = 160_000_000;

interface CacheEntry {
    buffer: AudioBuffer;
    bytes: number;
    lastUsed: number;
}

const cache = new Map<string, CacheEntry>();
let cacheBytes = 0;
const pending = new Map<string, Promise<AudioBuffer | null>>();

function evictOverBudget() {
    if (cacheBytes <= CACHE_BUDGET_BYTES) return;
    const oldestFirst = [...cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    for (const [src, entry] of oldestFirst) {
        if (cacheBytes <= CACHE_BUDGET_BYTES) break;
        cache.delete(src);
        cacheBytes -= entry.bytes;
    }
}

/**
 * Load a sound as a gaplessly loopable AudioBuffer. Resolves null when the
 * file is too large to hold decoded (caller should stream instead) or when
 * fetching/decoding fails. Concurrent calls for the same src share one job.
 */
export function loadSeamlessBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer | null> {
    const cached = cache.get(src);
    if (cached) {
        cached.lastUsed = Date.now();
        return Promise.resolve(cached.buffer);
    }
    const inFlight = pending.get(src);
    if (inFlight) return inFlight;

    const job = (async (): Promise<AudioBuffer | null> => {
        try {
            const res = await fetch(src);
            if (!res.ok) return null;
            const data = await res.arrayBuffer();
            if (data.byteLength > MAX_SEAMLESS_COMPRESSED_BYTES) return null;

            const decoded = await ctx.decodeAudioData(data);
            let channels: Float32Array[] = [];
            for (let c = 0; c < decoded.numberOfChannels; c++) {
                channels.push(decoded.getChannelData(c));
            }
            if (channels.length > 1 && isDualMono(channels)) {
                channels = [channels[0]];
            }

            const baked = bakeSeamlessLoop(channels, decoded.sampleRate);
            if (!baked.length || !baked[0].length) return null;
            const bytes = baked.length * baked[0].length * 4;
            if (bytes > MAX_DECODED_BYTES) return null;

            const buffer = ctx.createBuffer(baked.length, baked[0].length, decoded.sampleRate);
            baked.forEach((ch, c) => buffer.copyToChannel(ch, c));

            cache.set(src, { buffer, bytes, lastUsed: Date.now() });
            cacheBytes += bytes;
            evictOverBudget();
            return buffer;
        } catch (e) {
            console.warn(`Seamless decode failed for ${src}; falling back to streaming`, e);
            return null;
        } finally {
            pending.delete(src);
        }
    })();

    pending.set(src, job);
    return job;
}
