// Read an MP3's Xing/Info header: exact length, and the encoder delay/padding
// that make `loop = true` hiccup.
//
// Two things depend on this and neither can be answered by the compressed byte
// count alone:
//
//  1. Decoded size. `gentle-rain-for-relaxation.mp3` is 6.1MB compressed but
//     8.7 minutes of 48kHz audio: 100MB decoded. Gating on compressed bytes let
//     it through, so it decoded 100MB, built a 100MB crossfaded copy, then got
//     rejected by the decoded-size cap anyway. Reading the frame count first
//     turns that 200MB spike into a cheap 8KB range request.
//
//  2. Gapless offsets. Every file in the library is written by libmp3lame via
//     ffmpeg, which emits a proper Info tag: 576 samples of encoder delay at the
//     head and ~1000 samples of padding at the tail. Chrome's decoder strips
//     those; the AVFoundation decoder behind an <audio> element in an iOS
//     WKWebView does not, which is exactly why a streamed track ticks when it
//     wraps. Knowing the numbers lets the streaming player start at real audio
//     instead of at silence.
//
// Only the first frame header plus the Xing/Info tag is needed, so ~8KB from
// the front of the file is enough.

export interface Mp3Info {
    sampleRate: number;
    channels: number;
    /** Total decoded samples per channel, excluding encoder delay and padding. */
    samples: number;
    durationSeconds: number;
    /** Samples of encoder delay at the head (0 when the tag is absent). */
    encoderDelay: number;
    /** Samples of encoder padding at the tail (0 when the tag is absent). */
    encoderPadding: number;
}

const SAMPLE_RATES: Record<number, number[]> = {
    3: [44100, 48000, 32000], // MPEG 1
    2: [22050, 24000, 16000], // MPEG 2
    0: [11025, 12000, 8000],  // MPEG 2.5
};

/** Skip an ID3v2 container if one is present. */
function id3Length(bytes: Uint8Array): number {
    if (bytes.length < 10) return 0;
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0; // "ID3"
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    return 10 + size;
}

/** Locate the first MPEG audio frame header at or after `from`. */
function findFrameHeader(bytes: Uint8Array, from: number): number {
    for (let i = from; i < bytes.length - 4; i++) {
        if (bytes[i] !== 0xff || (bytes[i + 1] & 0xe0) !== 0xe0) continue;
        const versionBits = (bytes[i + 1] >> 3) & 0x03;
        const layerBits = (bytes[i + 1] >> 1) & 0x03;
        const rateBits = (bytes[i + 2] >> 2) & 0x03;
        // Reject the reserved encodings so we do not latch onto random bytes.
        if (versionBits === 1 || layerBits === 0 || rateBits === 3) continue;
        if (((bytes[i + 2] >> 4) & 0x0f) === 0x0f) continue; // bad bitrate index
        return i;
    }
    return -1;
}

/**
 * Parse what the Xing/Info tag says about an MP3. Returns null when the buffer
 * is not MP3, or has no Xing/Info tag (so the length is unknown without a full
 * decode). Callers should treat null as "cannot predict, be conservative".
 */
export function probeMp3(data: ArrayBuffer | Uint8Array): Mp3Info | null {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const frame = findFrameHeader(bytes, id3Length(bytes));
    if (frame < 0) return null;

    const versionBits = (bytes[frame + 1] >> 3) & 0x03;
    const layerBits = (bytes[frame + 1] >> 1) & 0x03;
    const rateBits = (bytes[frame + 2] >> 2) & 0x03;
    const channelMode = (bytes[frame + 3] >> 6) & 0x03;

    const rates = SAMPLE_RATES[versionBits];
    if (!rates) return null;
    const sampleRate = rates[rateBits];
    const channels = channelMode === 3 ? 1 : 2;

    const isMpeg1 = versionBits === 3;
    // Layer bits: 3 = Layer I, 2 = Layer II, 1 = Layer III.
    const samplesPerFrame = layerBits === 3 ? 384 : (layerBits === 2 ? 1152 : (isMpeg1 ? 1152 : 576));

    // The Xing/Info tag lives in the first frame, after the side-information
    // block, whose size depends on version and channel mode.
    const sideInfo = isMpeg1 ? (channels === 1 ? 17 : 32) : (channels === 1 ? 9 : 17);
    const tag = frame + 4 + sideInfo;
    // A Range request can come back short, and a CDN can ignore Range entirely
    // and hand back something else; every read below is bounds-checked so a
    // truncated or unexpected body returns null instead of throwing.
    if (tag + 8 > bytes.length) return null;
    const magic = String.fromCharCode(bytes[tag], bytes[tag + 1], bytes[tag + 2], bytes[tag + 3]);
    if (magic !== 'Xing' && magic !== 'Info') return null;

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const flags = view.getUint32(tag + 4);
    let cursor = tag + 8;
    if (!(flags & 0x01)) return null; // no frame count → no reliable length
    if (cursor + 4 > bytes.length) return null;
    const frames = view.getUint32(cursor); cursor += 4;
    if (flags & 0x02) cursor += 4;   // byte count
    if (flags & 0x04) cursor += 100; // seek table
    if (flags & 0x08) cursor += 4;   // quality

    // LAME/Lavc extension: 3 bytes of 12-bit delay + 12-bit padding at +21.
    let encoderDelay = 0;
    let encoderPadding = 0;
    const dp = cursor + 21;
    if (dp + 3 <= bytes.length) {
        encoderDelay = (bytes[dp] << 4) | (bytes[dp + 1] >> 4);
        encoderPadding = ((bytes[dp + 1] & 0x0f) << 8) | bytes[dp + 2];
    }

    // The Xing frame itself carries no audio, hence `frames` already excludes it
    // in ffmpeg output; guard the arithmetic either way.
    const gross = frames * samplesPerFrame;
    const samples = Math.max(0, gross - encoderDelay - encoderPadding);
    if (samples === 0) return null;

    return {
        sampleRate,
        channels,
        samples,
        durationSeconds: samples / sampleRate,
        encoderDelay,
        encoderPadding,
    };
}

/** Bytes a decoder will allocate for this file as float32 PCM. */
export function decodedByteSize(info: Mp3Info): number {
    return info.samples * info.channels * 4;
}
