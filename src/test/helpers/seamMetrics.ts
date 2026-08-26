// The one definition of "is this loop seam good?" in the repo.
//
// Two very different runners consume these functions, and they MUST agree:
//
//   • src/test/loopSeam.test.ts — a Vitest suite that decodes the shipped
//     .m4a files with ffmpeg and measures these numbers with no browser at
//     all. Answers "did anyone break the loop seam?" on every `npm test`.
//
//   • loopqa/harness.ts — a browser page that decodes with the real Web Audio
//     decoder and renders through the real production node graph. Answers
//     "what does the app actually play?", but needs a dev server, a browser,
//     and a human to open it. It imports from here rather than the other way
//     round: /loopqa/ is gitignored dev-only scaffolding, so the definition of
//     a good seam has to live in tracked source.
//
// Keeping the math in one place is the same anti-drift move audioGraph.ts
// makes for the limiter constants: if a threshold moves, it moves for both
// runners at once.

// ── Primitives ───────────────────────────────────────────────────────────────

export function rms(data: Float32Array, a = 0, b = data.length): number {
    let s = 0;
    const n = Math.max(1, b - a);
    for (let i = a; i < b; i++) s += data[i] * data[i];
    return Math.sqrt(s / n);
}

export function peak(data: Float32Array, a = 0, b = data.length): number {
    let p = 0;
    for (let i = a; i < b; i++) p = Math.max(p, Math.abs(data[i]));
    return p;
}

export function dbfs(x: number): number {
    return 20 * Math.log10(Math.max(Math.abs(x), 1e-9));
}

/** Largest sample-to-sample step present in [a, b). The natural scale for
 *  "is the step at the wrap point unusual for this material?" */
export function maxStep(data: Float32Array, a = 0, b = data.length): number {
    let m = 0;
    for (let i = a + 1; i < b; i++) m = Math.max(m, Math.abs(data[i] - data[i - 1]));
    return m;
}

// ── Whole-buffer seam metric (used by the browser harness) ───────────────────
// Operates on a finished loop buffer, where the wrap is buffer[last] → buffer[0].

export interface SeamMetric {
    wrapDelta: number;
    interiorDelta: number;
    /** wrapDelta relative to the average interior step. >8 is a click. */
    ratio: number;
    /** min/max of head vs tail RMS. <0.5 means one side of the wrap is much quieter. */
    rmsContinuity: number;
}

export function seamMetric(channels: Float32Array[]): SeamMetric {
    const win = 2048;
    let wrap = 0, interior = 0, count = 0;
    for (const ch of channels) {
        const n = ch.length;
        wrap += Math.abs(ch[0] - ch[n - 1]);
        for (let i = 1; i <= 4000 && i < n; i++) { interior += Math.abs(ch[i] - ch[i - 1]); count++; }
    }
    wrap /= channels.length; interior /= Math.max(1, count);
    let headR = 0, tailR = 0;
    for (const ch of channels) {
        headR += rms(ch, 0, Math.min(win, ch.length));
        tailR += rms(ch, Math.max(0, ch.length - win), ch.length);
    }
    headR /= channels.length; tailR /= channels.length;
    return {
        wrapDelta: wrap,
        interiorDelta: interior,
        ratio: wrap / (interior + 1e-9),
        rmsContinuity: Math.min(headR, tailR) / (Math.max(headR, tailR) + 1e-9),
    };
}

export function grade(ratio: number, rmsCont: number): 'ok' | 'warn' | 'bad' {
    if (ratio > 8 || rmsCont < 0.5) return 'bad';
    if (ratio > 3 || rmsCont < 0.8) return 'warn';
    return 'ok';
}

export function dipGrade(dipDb: number): 'ok' | 'warn' | 'bad' {
    if (Math.abs(dipDb) > 1.0) return 'bad';
    if (Math.abs(dipDb) > 0.3) return 'warn';
    return 'ok';
}

// ── Wrap metrics for a slice that has NOT been cut yet ────────────────────────
//
// seamMetric() above assumes you already hold the finished loop. The regression
// suite needs the opposite: it holds the raw decoded file plus a candidate loop
// length, and asks "if I wrapped HERE, would it be seamless?" — so it can score
// the manifest's loopSeconds against the wrong answer (the file's full decoded
// duration, which is what HTMLAudioElement.duration reports and what the
// DualPlayerLoop regression scheduled its crossfade from).
//
// Both take `head` = samples from the start of the loop and `tail` = samples
// ending exactly at the candidate wrap point. Both need ≥ 1.5 windows of each.

/** How much louder/quieter a window straddling the wrap is than its neighbours.
 *  1.0 = the wrap is inaudible. Below ~0.75 the wrap has a hole in it: either
 *  dead air spliced in, or a level jump. */
export function crossSeamRmsRatio(head: Float32Array, tail: Float32Array, win: number): number {
    const half = Math.floor(win / 2);
    const cross = new Float32Array(half * 2);
    cross.set(tail.subarray(tail.length - half), 0);
    cross.set(head.subarray(0, half), half);
    // Reference: the same amount of audio, same distance away, but not touching
    // the wrap. Using neighbours rather than a whole-file average keeps the
    // metric honest on material whose level moves (waves, cafés, whale song).
    const refTail = rms(tail, tail.length - 3 * half, tail.length - half);
    const refHead = rms(head, half, 3 * half);
    const ref = Math.sqrt((refTail * refTail + refHead * refHead) / 2);
    return rms(cross) / Math.max(ref, 1e-9);
}

/** The single-sample step at the wrap, in units of "the biggest step this
 *  material already makes". 1.0 means the wrap is no worse than the loudest
 *  transient nearby; a hard cut into silence scores far higher. */
export function seamStepRatio(head: Float32Array, tail: Float32Array, win: number): number {
    const half = Math.floor(win / 2);
    const step = Math.abs(head[0] - tail[tail.length - 1]);
    const scale = Math.max(
        maxStep(tail, tail.length - 3 * half, tail.length - half),
        maxStep(head, half, 3 * half),
        1e-9,
    );
    return step / scale;
}
