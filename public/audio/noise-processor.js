// Continuous, seam-free colored-noise generator running on the audio thread.
//
// Because the noise is generated sample-by-sample forever, there is no buffer
// to loop and therefore no loop point that could ever click or hiccup. This is
// the same reason we moved off the main-thread setInterval crossfader: an
// AudioWorkletProcessor runs on the realtime audio thread and is immune to GC
// pauses, dropped frames, or the app being backgrounded.
//
// color is passed via processorOptions: 'white' | 'pink' | 'brown' | 'violet'.

// Output trim per color so all four sit at roughly equal perceived loudness
// (~0.18 RMS) with headroom. Mirrored in synthSounds.ts fillNoise().
const NOISE_TRIM = { white: 0.30, pink: 0.90, brown: 0.90, violet: 0.45 };

class NoiseProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.color = (options && options.processorOptions && options.processorOptions.color) || 'white';
        this.stopped = false;
        // Per-color output trim: level-match the four colors to ~0.18 RMS and
        // keep peaks well under full scale so layered sounds never clip.
        this.trim = NOISE_TRIM[this.color] !== undefined ? NOISE_TRIM[this.color] : 1;
        // Per-channel filter state so stereo channels stay decorrelated.
        this.state = [];
        this.port.onmessage = (e) => {
            if (e.data === 'stop') this.stopped = true;
        };
    }

    ensure(channelCount) {
        while (this.state.length < channelCount) {
            this.state.push({ b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, brown: 0, lastWhite: 0 });
        }
    }

    process(_inputs, outputs) {
        if (this.stopped) return false; // release the node from the audio graph
        const out = outputs[0];
        this.ensure(out.length);
        for (let ch = 0; ch < out.length; ch++) {
            const o = out[ch];
            const s = this.state[ch];
            for (let i = 0; i < o.length; i++) {
                const white = Math.random() * 2 - 1;
                let v;
                if (this.color === 'pink') {
                    // Paul Kellet's refined pink-noise filter (~ -3dB/oct).
                    s.b0 = 0.99886 * s.b0 + white * 0.0555179;
                    s.b1 = 0.99332 * s.b1 + white * 0.0750759;
                    s.b2 = 0.96900 * s.b2 + white * 0.1538520;
                    s.b3 = 0.86650 * s.b3 + white * 0.3104856;
                    s.b4 = 0.55000 * s.b4 + white * 0.5329522;
                    s.b5 = -0.7616 * s.b5 - white * 0.0168980;
                    v = (s.b0 + s.b1 + s.b2 + s.b3 + s.b4 + s.b5 + s.b6 + white * 0.5362) * 0.11;
                    s.b6 = white * 0.115926;
                } else if (this.color === 'brown') {
                    // Leaky integrator (~ -6dB/oct), DC-stable so it never drifts.
                    v = (s.brown + 0.02 * white) / 1.02;
                    s.brown = v;
                    v *= 3.5;
                } else if (this.color === 'violet') {
                    // First difference of white (~ +6dB/oct).
                    v = (white - s.lastWhite) * 0.5;
                    s.lastWhite = white;
                } else {
                    v = white;
                }
                o[i] = v * this.trim;
            }
        }
        return true;
    }
}

registerProcessor('noise-processor', NoiseProcessor);
