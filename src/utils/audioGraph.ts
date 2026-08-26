// Shared Web Audio graph plumbing used by every Sound Mixer voice class
// (SoundMixer.tsx) AND by the offline loop-seam test harness
// (public/_loopqa/harness.ts). Living in one place means the harness renders
// through the EXACT node graph production audio does — same threshold, same
// ratio, same attack/release — so a passing test result actually means
// something. Duplicating these numbers into the harness would drift silently
// the next time either one changed, which is the same failure mode
// bakedLoops.ts already exists to prevent for the manifest.

export const getAudioContext = (): AudioContext | null => {
    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    const win = window as { _palanteAudioContext?: AudioContext };
    if (!win._palanteAudioContext) {
        win._palanteAudioContext = new AudioContextClass();
    }
    return win._palanteAudioContext as AudioContext;
};

// Tuning for the shared master limiter. Exported so the offline test harness
// can render the identical node without importing the whole SoundMixer module
// tree (which pulls in React/Capacitor and can't run inside an
// OfflineAudioContext harness page).
export const MASTER_LIMITER_CONFIG = {
    // Per-track peak ceiling (bake-loops.mjs PEAK_CEILING_DB) is -3dB, WITH
    // headroom already reserved for the equal-power crossfade hump at the loop
    // seam (two correlated signals summed via sin/cos can peak up to +3dB
    // above either alone). A limiter threshold AT -3dB therefore sits exactly
    // on top of every well-baked track's intentional seam peak and fires on
    // it every single loop, producing a rhythmic gain-reduction "duck" synced
    // to the seam — audibly worse than the click it replaced. Sitting the
    // threshold at 0dBFS leaves that entire designed headroom untouched and
    // only catches genuine multi-layer summing above full scale.
    thresholdDb: 0,
    kneeDb: 0,
    ratio: 20,
    attackSec: 0.003,
    releaseSec: 0.25,
} as const;

export const getMasterLimiter = (ctx: AudioContext): AudioNode => {
    const win = window as { _palanteMasterLimiter?: DynamicsCompressorNode };
    if (!win._palanteMasterLimiter) {
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = MASTER_LIMITER_CONFIG.thresholdDb;
        limiter.knee.value = MASTER_LIMITER_CONFIG.kneeDb;
        limiter.ratio.value = MASTER_LIMITER_CONFIG.ratio;
        limiter.attack.value = MASTER_LIMITER_CONFIG.attackSec;
        limiter.release.value = MASTER_LIMITER_CONFIG.releaseSec;
        limiter.connect(ctx.destination);
        win._palanteMasterLimiter = limiter;
    }
    return win._palanteMasterLimiter;
};

/** Build a fresh (uncached) limiter node against an arbitrary destination — used by the offline test harness, which renders into an OfflineAudioContext instead of the shared live one. */
export const buildLimiterNode = (ctx: BaseAudioContext): DynamicsCompressorNode => {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = MASTER_LIMITER_CONFIG.thresholdDb;
    limiter.knee.value = MASTER_LIMITER_CONFIG.kneeDb;
    limiter.ratio.value = MASTER_LIMITER_CONFIG.ratio;
    limiter.attack.value = MASTER_LIMITER_CONFIG.attackSec;
    limiter.release.value = MASTER_LIMITER_CONFIG.releaseSec;
    return limiter;
};
