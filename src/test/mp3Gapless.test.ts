import { describe, it, expect } from 'vitest';
import { probeMp3, decodedByteSize } from '../utils/mp3Gapless';
import { isPreBakedLoop, preBakedEntry } from '../constants/bakedLoops';

/**
 * Build the front of an MP3: an optional ID3v2 block, one MPEG frame header,
 * and the Xing/Info tag that carries the frame count and gapless offsets.
 *
 * The layout here was checked against the real shipped assets — parsing
 * public/sounds/heartbeat.mp3 yields 379 frames, delay 576, padding 1359, and
 * 379×1152−576−1359 = 434,673 samples = 9.8565s at 44.1kHz, which matches
 * ffprobe's reported duration exactly.
 */
function buildMp3Head(opts: {
    frames: number;
    mono?: boolean;
    rateBits?: 0 | 1 | 2; // 44100 / 48000 / 32000
    delay?: number;
    padding?: number;
    id3?: number;
    omitXing?: boolean;
}): Uint8Array {
    const { frames, mono = false, rateBits = 0, delay = 576, padding = 1000, id3 = 0 } = opts;
    const bytes = new Uint8Array(id3 + 512);
    let p = 0;
    if (id3 > 0) {
        bytes[0] = 0x49; bytes[1] = 0x44; bytes[2] = 0x33; // "ID3"
        const size = id3 - 10;
        bytes[6] = (size >> 21) & 0x7f;
        bytes[7] = (size >> 14) & 0x7f;
        bytes[8] = (size >> 7) & 0x7f;
        bytes[9] = size & 0x7f;
        p = id3;
    }
    // MPEG 1 Layer III, no CRC, 128kbps.
    bytes[p] = 0xff;
    bytes[p + 1] = 0xfb;
    bytes[p + 2] = 0x90 | (rateBits << 2);
    bytes[p + 3] = mono ? 0xc0 : 0x00;
    const sideInfo = mono ? 17 : 32;
    const t = p + 4 + sideInfo;
    if (opts.omitXing) return bytes;
    bytes.set([0x58, 0x69, 0x6e, 0x67], t); // "Xing"
    const view = new DataView(bytes.buffer);
    view.setUint32(t + 4, 0x0f); // frames | bytes | toc | quality
    let c = t + 8;
    view.setUint32(c, frames); c += 4;
    view.setUint32(c, 123456); c += 4; // byte count
    c += 100;                          // seek table
    view.setUint32(c, 0); c += 4;      // quality
    bytes[c + 21] = (delay >> 4) & 0xff;
    bytes[c + 22] = ((delay & 0x0f) << 4) | ((padding >> 8) & 0x0f);
    bytes[c + 23] = padding & 0xff;
    return bytes;
}

describe('probeMp3', () => {
    it('reads rate, channels, length and gapless offsets', () => {
        const info = probeMp3(buildMp3Head({ frames: 379, delay: 576, padding: 1359 }));
        expect(info).not.toBeNull();
        expect(info!.sampleRate).toBe(44100);
        expect(info!.channels).toBe(2);
        expect(info!.encoderDelay).toBe(576);
        expect(info!.encoderPadding).toBe(1359);
        // 379 frames × 1152 samples − 576 − 1359, as in public/sounds/heartbeat.mp3.
        expect(info!.samples).toBe(379 * 1152 - 576 - 1359);
        expect(info!.durationSeconds).toBeCloseTo(9.8565, 3);
    });

    it('skips an ID3v2 container to find the frame', () => {
        const info = probeMp3(buildMp3Head({ frames: 379, id3: 45 }));
        expect(info?.samples).toBe(379 * 1152 - 576 - 1000);
    });

    it('reads mono files, whose side-info block is shorter', () => {
        const info = probeMp3(buildMp3Head({ frames: 100, mono: true }));
        expect(info?.channels).toBe(1);
        expect(info?.samples).toBe(100 * 1152 - 576 - 1000);
    });

    it('predicts a decoded size that the compressed-byte gate got wrong', () => {
        // gentle-rain-for-relaxation is 6.1MB compressed — under the old 6.5MB
        // gate — but 8.7 minutes at 48kHz, so it decoded to ~100MB and built a
        // ~100MB crossfaded copy before the decoded-size cap rejected it anyway.
        const info = probeMp3(buildMp3Head({ frames: 21750, rateBits: 1, mono: true }));
        expect(info!.durationSeconds).toBeGreaterThan(500);
        expect(decodedByteSize(info!)).toBeGreaterThan(80_000_000);
    });

    it('returns null when there is no Xing tag to size the file with', () => {
        expect(probeMp3(buildMp3Head({ frames: 100, omitXing: true }))).toBeNull();
    });

    it('returns null for data that is not MP3', () => {
        expect(probeMp3(new Uint8Array(4096))).toBeNull();
        expect(probeMp3(new TextEncoder().encode('not an mp3 file at all'))).toBeNull();
    });

    it('survives a truncated header without throwing', () => {
        const short = buildMp3Head({ frames: 100 }).subarray(0, 40);
        expect(() => probeMp3(short)).not.toThrow();
    });

    it('accepts an ArrayBuffer as well as a view', () => {
        const bytes = buildMp3Head({ frames: 379 });
        const copy = bytes.slice().buffer;
        expect(probeMp3(copy)?.samples).toBe(probeMp3(bytes)?.samples);
    });
});

describe('bakedLoops manifest', () => {
    it('recognises the paths the SoundMixer actually requests', () => {
        expect(isPreBakedLoop('/sounds/gentle-rain.m4a')).toBe(true);
        expect(isPreBakedLoop('/sounds/heartbeat.m4a')).toBe(true);
        // Long-form entries stream, but they are still baked.
        expect(isPreBakedLoop('/sounds/bilateral-tune-up.m4a')).toBe(true);
    });

    it('decodes percent-escaped paths', () => {
        expect(isPreBakedLoop('/Autumn%20Wind.m4a')).toBe(true);
        expect(isPreBakedLoop('/Chill%20Cinco.m4a')).toBe(true);
    });

    it('maps a transcoded output back to its entry', () => {
        // busy-cafe-3's master is a .mp3 and it ships as .m4a, so a lookup by
        // the served path has to go through `out` rather than `src`.
        const entry = preBakedEntry('/sounds/busy-cafe-3.m4a');
        expect(entry?.id).toBe('busy-cafe-3');
    });

    it('does not claim files the baker never touched', () => {
        expect(isPreBakedLoop('/sounds/gong-sfx.m4a')).toBe(false);
        expect(isPreBakedLoop('/success.mp3')).toBe(false);
    });

    it('handles absolute URLs and query strings', () => {
        expect(isPreBakedLoop('https://localhost/sounds/gentle-rain.m4a?v=2')).toBe(true);
    });
});
