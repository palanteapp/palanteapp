// ffmpeg/ffprobe access for the loop regression suite.
//
// Vitest runs in jsdom, which has no real audio decoder: `decodeAudioData` does
// not exist and `HTMLAudioElement` never loads anything. Asserting anything
// about the SHIPPED .m4a files therefore has to go outside the JS runtime, so
// these helpers shell out to ffmpeg and hand back plain Float32Array PCM.
//
// Why ffmpeg's default (edit-list-aware) decode is the right reference: the
// baked AAC files carry gapless metadata that tells a decoder how many leading
// and trailing samples the encoder invented. Both CoreAudio (what WKWebView
// uses) and ffmpeg honour it, and both are left with the same residue — the
// encoder rounds the stream up to whole 1024-sample frames, and that last
// partial frame's worth of near-silence survives. Decoding here with
// `-ignore_editlist 1` would measure a file no shipped decoder ever produces.

/// <reference types="node" />
// ^ tsconfig.app.json deliberately ships without @types/node (see the note in
// bannedPhrases.test.ts). This one helper genuinely cannot avoid Node: there is
// no Vite-side way to run ffmpeg. The reference is kept here, in the only file
// that shells out, rather than widened into the app tsconfig.

import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const CANDIDATE_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin'];

function findBinary(name: string): string | null {
    for (const dir of CANDIDATE_DIRS) {
        const p = `${dir}/${name}`;
        if (existsSync(p)) return p;
    }
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    const hit = which.stdout?.trim();
    return hit && existsSync(hit) ? hit : null;
}

export const FFMPEG = findBinary('ffmpeg');
export const FFPROBE = findBinary('ffprobe');
export const hasFfmpeg = Boolean(FFMPEG && FFPROBE);

export interface StreamInfo {
    /** Container duration in seconds, as a decoder would report it. */
    durationSec: number;
    sampleRate: number;
    channels: number;
    codec: string;
}

export function probeStream(file: string): StreamInfo {
    if (!FFPROBE) throw new Error('ffprobe not available');
    const out = spawnSync(FFPROBE, [
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'format=duration:stream=sample_rate,channels,codec_name',
        '-of', 'json', file,
    ], { encoding: 'utf8', maxBuffer: 1 << 20 });
    if (out.status !== 0) throw new Error(`ffprobe failed for ${file}: ${out.stderr}`);
    const json = JSON.parse(out.stdout) as {
        format: { duration: string };
        streams: { sample_rate: string; channels: number; codec_name: string }[];
    };
    const s = json.streams[0];
    return {
        durationSec: Number(json.format.duration),
        sampleRate: Number(s.sample_rate),
        channels: s.channels,
        codec: s.codec_name,
    };
}

export interface DecodedEnds {
    /** First `headSamples` samples of the file (mono mix, native rate). */
    head: Float32Array;
    /** Last `tailSamples` samples of the file (mono mix, native rate). */
    tail: Float32Array;
    /** Total samples the decoder actually produced. */
    totalSamples: number;
    sampleRate: number;
    /** RMS over the entire decoded file — the level a seam is judged against. */
    fileRms: number;
}

/**
 * Decode a file to mono float32 and keep only what a seam test needs: the head,
 * a rolling tail, the total sample count, and whole-file RMS.
 *
 * The long-form tracks run 8–18 minutes; holding one of them decoded is 100–380
 * MB, which is exactly why the app streams them. Streaming ffmpeg's stdout and
 * keeping two small windows means the biggest file in the library costs a few
 * hundred KB of heap here instead. Decoding all 42 tracks this way takes a few
 * seconds, so tests that use it set an explicit timeout.
 */
export function decodeEnds(
    file: string,
    headSamples: number,
    tailSamples: number,
): Promise<DecodedEnds> {
    if (!FFMPEG) return Promise.reject(new Error('ffmpeg not available'));
    const { sampleRate } = probeStream(file);
    return new Promise((resolve, reject) => {
        const proc = spawn(FFMPEG, [
            '-v', 'error',
            '-i', file,
            '-ac', '1',                    // mono mix: a seam is a seam in every channel
            '-ar', String(sampleRate),     // no resampling — sample indices must stay exact
            '-f', 'f32le', '-acodec', 'pcm_f32le', '-',
        ]);

        const head = new Float32Array(headSamples);
        let headFilled = 0;
        const ring = new Float32Array(tailSamples);
        let ringPos = 0;
        let total = 0;
        let energy = 0;
        let carry = Buffer.alloc(0);

        proc.stdout.on('data', (chunk: Buffer) => {
            const buf = carry.length ? Buffer.concat([carry, chunk]) : chunk;
            const n = Math.floor(buf.length / 4);
            // A chunk boundary can land mid-sample; hold the remainder over.
            carry = Buffer.from(buf.subarray(n * 4));
            const view = new Float32Array(buf.buffer, buf.byteOffset, n);
            for (let i = 0; i < n; i++) {
                const v = view[i];
                if (headFilled < headSamples) head[headFilled++] = v;
                ring[ringPos] = v;
                ringPos = (ringPos + 1) % tailSamples;
                total++;
                energy += v * v;
            }
        });

        let stderr = '';
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('error', reject);
        proc.on('close', (code: number | null) => {
            if (code !== 0) return reject(new Error(`ffmpeg exited ${code} for ${file}: ${stderr}`));
            if (total === 0) return reject(new Error(`ffmpeg produced no samples for ${file}`));
            const len = Math.min(total, tailSamples);
            const tail = new Float32Array(len);
            for (let i = 0; i < len; i++) tail[i] = ring[(ringPos - len + i + tailSamples * 2) % tailSamples];
            resolve({
                head: head.subarray(0, headFilled),
                tail,
                totalSamples: total,
                sampleRate,
                fileRms: Math.sqrt(energy / total),
            });
        });
    });
}
