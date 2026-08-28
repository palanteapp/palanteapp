// Which library files the OFFLINE loop baker owns.
//
// `scripts/bake-loops.mjs` searches each master for the loop end whose tail best
// correlates with its head, then equal-power crossfades across a per-track
// window. The file it writes to public/ therefore already contains a
// correlation-matched seam. The runtime must NOT rebuild that seam: its own
// crossfade has no correlation search, so re-blending an already-baked file
// overwrites the matched head with an arbitrary, uncorrelated one.
//
// Both the baker and the runtime read `loopManifest.json`, so this list can
// never drift from what was actually baked.

import manifest from './loopManifest.json';

export interface LoopManifestEntry {
    id: string;
    /** Path relative to public/, e.g. "sounds/gentle-rain.mp3" (the raw master; never served). */
    src: string;
    /** Baked output path actually served to the app (all tracks re-encode to AAC/.m4a for gapless iOS looping). */
    out?: string;
    /** Crossfade window the baker used, in seconds. */
    fade: number;
    kind: 'texture' | 'periodic';
    /**
     * Legacy routing flag for the deleted streaming path. Nothing sets it any
     * more and loopEngine no longer reads it; kept on the type only so an old
     * manifest still parses. See loopEngine.ts for why the path is gone.
     */
    stream?: boolean;
    /**
     * Upper bound on this loop's length in seconds, by material class:
     * stochastic beds 30, scene recordings with recognisable events 45,
     * bilateral 45, musical and chant 75. Set because decoded audio is the
     * app's dominant memory cost - autumn-wind was 83.5MB resident as a 217s
     * stereo bed - and because keeping every file in memory is what allows a
     * single playback path. The baker only ever shortens toward it.
     */
    targetSec?: number;
    /**
     * Measured period of the left/right pan, for bilateral material only, found
     * by autocorrelating the master's L/R balance envelope. The loop is locked
     * to a whole number of these: a bilateral loop that is not a whole number of
     * pan cycles snaps the stereo image across the wrap however well its content
     * matches, and correlation cannot see that on its own because the match
     * window is 0.17s against pans that run 4-53s.
     */
    panPeriodSec?: number;
    /**
     * Exact length of the baked loop in seconds, written by the baker. Lets the
     * runtime trim to the sample instead of hunting for the end with an
     * amplitude threshold, which cannot tell real audio from the encoder's
     * trailing AAC padding.
     */
    loopSeconds?: number;
}

const ENTRIES = [
    ...(manifest.baked as LoopManifestEntry[]),
    ...(manifest.longform as LoopManifestEntry[]),
];

/**
 * Normalize a runtime `src` ("/sounds/gentle-rain.mp3", "/Autumn%20Wind.mp3")
 * to the manifest's public-relative form ("sounds/gentle-rain.mp3",
 * "Autumn Wind.mp3").
 */
function normalize(src: string): string {
    let path = src;
    const schemeEnd = path.indexOf('://');
    if (schemeEnd >= 0) {
        const slash = path.indexOf('/', schemeEnd + 3);
        path = slash >= 0 ? path.slice(slash) : '/';
    }
    path = path.split('?')[0].split('#')[0];
    try { path = decodeURIComponent(path); } catch { /* leave as-is */ }
    return path.replace(/^\/+/, '');
}

const BY_PATH = new Map<string, LoopManifestEntry>();
for (const entry of ENTRIES) {
    BY_PATH.set(normalize(entry.out ?? entry.src), entry);
}

/** The baker entry that produced this file, or undefined if it is unbaked. */
export function preBakedEntry(src: string): LoopManifestEntry | undefined {
    return BY_PATH.get(normalize(src));
}

/** True when `src` already carries a correlation-matched seam from the baker. */
export function isPreBakedLoop(src: string): boolean {
    return BY_PATH.has(normalize(src));
}
