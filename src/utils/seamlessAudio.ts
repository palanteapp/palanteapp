// Web Audio side of seamless looping: fetch + decode a sound, give it a loop
// seam, and cache decoded buffers under a memory budget. Tracks too large to
// hold decoded resolve null and the caller streams them instead.
//
// The seam treatment depends on where the file came from:
//
//   • Offline-baked (everything in constants/loopManifest.json). The baker
//     already searched for the loop end whose tail best correlates with the
//     head and crossfaded across a per-track window, so the matched blend is
//     baked into the first 1–4 seconds of the file. Re-running a blind
//     crossfade over that region overwrites the match with an arbitrary one:
//     measured on the shipped assets, the old fixed 2s runtime crossfade
//     rewrote 74–115% of the baker's blend (RMS delta vs. the baked audio) and
//     found tail/head correlations of only 0.07–0.55 to do it with, because the
//     good match had already been consumed. All these files now get a 30ms
//     touch-up instead, which is only there to repair the sample-exact wrap
//     that the MP3 round-trip smears.
//
//   • Unbaked. These get the full treatment at runtime — a correlation search
//     for the loop end, then the crossfade — rather than the blind cut at the
//     literal end of the file that was applied before.

import { planLoopBuffer, PRE_BAKED_FADE_SECONDS } from './seamlessLoop';
import { isDualMono } from './seamlessLoop';
import { probeMp3, decodedByteSize, type Mp3Info } from './mp3Gapless';
import { isPreBakedLoop } from '../constants/bakedLoops';

// Bytes of the file worth reading just to inspect its header.
const HEADER_PROBE_BYTES = 8192;
// Hard ceiling per decoded sound (≈ 3.5 min of stereo 48kHz float32). Enforced
// from the header BEFORE decoding now, so an oversized track no longer spikes
// memory on its way to being rejected.
const MAX_DECODED_BYTES = 80_000_000;
// Fallback gate for files whose header we could not read: decoded PCM runs
// roughly 20× the compressed size, so ~6.5MB stays under the cap.
export const MAX_SEAMLESS_COMPRESSED_BYTES = 6_500_000;
// Total budget for cached buffers; least-recently-used entries are evicted.
// Eviction never interrupts playback: a playing sound holds its own
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
const headerCache = new Map<string, Mp3Info | null>();

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
 * Read a sound's MP3 header without downloading the whole file. Falls back to
 * whatever the server sent when it ignores the Range request (Capacitor's local
 * server honours it; some CDNs do not), and caches the answer per src.
 */
export async function readMp3Header(src: string): Promise<Mp3Info | null> {
    const cached = headerCache.get(src);
    if (cached !== undefined) return cached;
    let info: Mp3Info | null = null;
    try {
        const res = await fetch(src, { headers: { Range: `bytes=0-${HEADER_PROBE_BYTES - 1}` } });
        if (res.ok) info = probeMp3(await res.arrayBuffer());
    } catch {
        info = null;
    }
    headerCache.set(src, info);
    return info;
}

/**
 * Where the real audio starts and ends inside a file, in seconds, once encoder
 * delay and padding are discounted. Used by the streaming player so a wrap
 * lands on audio rather than on the silence MP3 pads both ends with.
 */
export async function getGaplessBounds(
    src: string,
): Promise<{ headOffset: number; trueEnd: number } | null> {
    const info = await readMp3Header(src);
    if (!info) return null;
    return {
        headOffset: info.encoderDelay / info.sampleRate,
        trueEnd: (info.encoderDelay + info.samples) / info.sampleRate,
    };
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
            // Decide from the header, before committing to a full download or a
            // decode, whether this track can be held in memory at all.
            const info = await readMp3Header(src);
            if (info && decodedByteSize(info) > MAX_DECODED_BYTES) return null;

            const res = await fetch(src);
            if (!res.ok) return null;
            const data = await res.arrayBuffer();
            // Header unreadable: fall back to the old compressed-size heuristic.
            if (!info && data.byteLength > MAX_SEAMLESS_COMPRESSED_BYTES) return null;

            const decoded = await ctx.decodeAudioData(data);
            let channels: Float32Array[] = [];
            for (let c = 0; c < decoded.numberOfChannels; c++) {
                channels.push(decoded.getChannelData(c));
            }
            if (channels.length > 1 && isDualMono(channels)) {
                channels = [channels[0]];
            }

            const preBaked = isPreBakedLoop(src);
            const plan = planLoopBuffer(channels, decoded.sampleRate, preBaked
                ? { fadeSeconds: PRE_BAKED_FADE_SECONDS }
                : { fadeSeconds: 2.0, search: true });
            if (!plan.length) return null;

            const bytes = channels.length * plan.length * 4;
            if (bytes > MAX_DECODED_BYTES) return null;

            const buffer = ctx.createBuffer(channels.length, plan.length, decoded.sampleRate);
            channels.forEach((ch, c) => {
                // Body is a view into the decoded data — no intermediate copy.
                const body = ch.subarray(plan.start, plan.start + plan.length);
                buffer.copyToChannel(body as Float32Array<ArrayBuffer>, c);
                if (plan.head) {
                    buffer.copyToChannel(plan.head[c] as Float32Array<ArrayBuffer>, c, 0);
                }
            });

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
