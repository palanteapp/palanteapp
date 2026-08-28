// Lossless PCM tap for the debug capture rig ("the ears" — see
// src/utils/audioCapture.ts and scripts/README-ears.md).
//
// ── Why a worklet and not a ScriptProcessorNode ─────────────────────────────
// This node exists to MEASURE a dropout, so it must not be capable of causing
// one. A ScriptProcessorNode is pulled on the main thread: every GC pause,
// React render and layout the app does lands inside the render quantum, which
// is exactly the class of fault we are hunting. Recording through one would
// make the instrument indistinguishable from the bug. An
// AudioWorkletProcessor runs on the realtime audio thread, so the copy below
// happens in the same place the samples are already being produced and adds
// nothing the main thread can stall.
//
// ── Why it batches ─────────────────────────────────────────────────────────
// A render quantum is 128 frames — at 48kHz that is one message every 2.7ms,
// ~375 postMessage round trips per second, all of them landing on the main
// thread that we are trying to keep idle. Accumulating into ~1s blocks first
// makes it one message per second instead, and the block is handed over as a
// transferable so nothing is copied on the way out.
//
// ── Why mono ───────────────────────────────────────────────────────────────
// The analysis (scripts/analyze-capture.mjs) measures an amplitude envelope.
// A dropout is a dropout in both channels — the master limiter is the last
// node before the destination and it has no per-channel path that could gap
// one side alone — so the second channel would double memory and bandwidth
// while adding no measurement. Downmixing here rather than in the analysis
// keeps the on-device buffer at half size, which is what decides whether a
// ten-minute capture survives on an older phone.

const BLOCK_SECONDS = 1;

class CaptureProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const opts = (options && options.processorOptions) || {};
        this.blockSize = Math.max(128, Math.round((opts.blockSeconds || BLOCK_SECONDS) * sampleRate));
        this.block = new Float32Array(this.blockSize);
        this.filled = 0;
        this.stopped = false;
        // Frames seen since construction. Posted with every block so the
        // consumer can prove the stream is contiguous: if two consecutive
        // blocks are not exactly blockSize frames apart, the RENDER THREAD
        // ITSELF skipped, which is a completely different fault from silence
        // in the samples and must not be confused with one.
        this.framesSeen = 0;
        this.port.onmessage = (e) => {
            if (e.data === 'stop') {
                this.flush();
                this.stopped = true;
            }
        };
    }

    flush() {
        if (!this.filled) return;
        // Copy out only what is filled; the residue of the block is stale.
        const out = this.block.slice(0, this.filled);
        this.framesSeen += this.filled;
        this.port.postMessage(
            { pcm: out, frames: this.framesSeen, ctxTime: currentTime },
            [out.buffer],
        );
        this.filled = 0;
    }

    process(inputs) {
        if (this.stopped) return false;
        const input = inputs[0];
        // No connected input yet (or a disconnected upstream): emit nothing
        // rather than silence, so a gap in the FILE always means a gap in the
        // AUDIO and never means "the tap was not wired up".
        if (!input || input.length === 0 || !input[0]) return true;

        const chCount = input.length;
        const n = input[0].length;
        for (let i = 0; i < n; i++) {
            let s = 0;
            for (let c = 0; c < chCount; c++) s += input[c][i];
            this.block[this.filled++] = s / chCount;
            if (this.filled === this.blockSize) {
                this.framesSeen += this.blockSize;
                const out = this.block;
                this.block = new Float32Array(this.blockSize);
                this.filled = 0;
                this.port.postMessage(
                    { pcm: out, frames: this.framesSeen, ctxTime: currentTime },
                    [out.buffer],
                );
            }
        }
        return true;
    }
}

registerProcessor('capture-processor', CaptureProcessor);
