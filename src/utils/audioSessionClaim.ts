// Reference-counted claim on the native AVAudioSession, shared across every
// ambient-audio owner in the app (SoundMixer's active mix, the Koi Pond, and
// any future one).
//
// PalanteAudioBridge.setPlaying() is a blunt boolean: whichever caller invokes
// it last wins, and setPlaying(false) deactivates the session outright. That
// was safe while SoundMixer was the only caller, tying it straight to its own
// active-sound count. It stops being safe the moment a second, independent
// audio owner needs the same session concurrently (e.g. a Soundscape mix left
// running in the background while the user is on the Koi Pond): whichever
// owner stops first would call setPlaying(false) and cut the session out from
// under the other, silencing audio it did not ask to silence. Route every
// claim through here instead — the native side is only told "false" once
// nothing left in the app still wants it.
import { PalanteAudioBridge } from '../plugins/PalanteAudioBridge';

let claimCount = 0;

/**
 * Claim the session. Call the returned function exactly once when this owner
 * no longer needs it — it is idempotent, so a stray extra call is harmless.
 */
export function claimAudioSession(): () => void {
    claimCount++;
    if (claimCount === 1) void PalanteAudioBridge.setPlaying({ playing: true }).catch(() => {});

    let released = false;
    return () => {
        if (released) return;
        released = true;
        claimCount = Math.max(0, claimCount - 1);
        if (claimCount === 0) void PalanteAudioBridge.setPlaying({ playing: false }).catch(() => {});
    };
}
