import { describe, it, expect, vi, beforeEach } from 'vitest';

const setPlaying = vi.fn().mockResolvedValue(undefined);
vi.mock('../plugins/PalanteAudioBridge', () => ({
    PalanteAudioBridge: { setPlaying: (...args: unknown[]) => setPlaying(...args) },
}));

import { claimAudioSession } from '../utils/audioSessionClaim';

// Two independent ambient-audio owners (e.g. a Soundscape mix left running in
// the background and the Koi Pond) can both want the native AVAudioSession at
// once. Before this module existed, each owner called PalanteAudioBridge's
// blunt setPlaying(boolean) directly off its own state, so whichever owner
// stopped first deactivated the session out from under the other — the same
// class of dropout documented in project memory as the actual root cause of
// the "still dropping out" soundscape reports. These tests pin the reference
// counting that prevents that.
describe('audioSessionClaim', () => {
    beforeEach(() => {
        setPlaying.mockClear();
    });

    it('activates on the first claim and deactivates on the last release', () => {
        const releaseA = claimAudioSession();
        expect(setPlaying).toHaveBeenCalledTimes(1);
        expect(setPlaying).toHaveBeenCalledWith({ playing: true });

        releaseA();
        expect(setPlaying).toHaveBeenCalledTimes(2);
        expect(setPlaying).toHaveBeenLastCalledWith({ playing: false });
    });

    it('a second concurrent owner does not re-activate, and releasing it does not deactivate a still-active session', () => {
        const releasePond = claimAudioSession();
        expect(setPlaying).toHaveBeenCalledTimes(1);

        const releaseMix = claimAudioSession();
        // Already active for the first owner: no redundant native call.
        expect(setPlaying).toHaveBeenCalledTimes(1);

        // The pond closes first. The mix is still playing in the background,
        // so the session must stay claimed — this is the exact scenario that
        // used to drop the mix's audio out from under it.
        releasePond();
        expect(setPlaying).toHaveBeenCalledTimes(1);

        // Only once the last owner releases does the session actually deactivate.
        releaseMix();
        expect(setPlaying).toHaveBeenCalledTimes(2);
        expect(setPlaying).toHaveBeenLastCalledWith({ playing: false });
    });

    it('is idempotent: releasing the same claim twice only counts once', () => {
        const release = claimAudioSession();
        const releaseOther = claimAudioSession();
        expect(setPlaying).toHaveBeenCalledTimes(1);

        release();
        release(); // stray second call, e.g. a defensive cleanup running twice
        expect(setPlaying).toHaveBeenCalledTimes(1); // still one other claim outstanding

        releaseOther();
        expect(setPlaying).toHaveBeenCalledTimes(2);
        expect(setPlaying).toHaveBeenLastCalledWith({ playing: false });
    });
});
