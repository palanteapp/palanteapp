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
    /** True for the long-form pieces that stream instead of decoding. */
    stream?: boolean;
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
