import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * `began` — the session was deactivated by iOS and playback has already
 * stopped. `ended` — the interruption is over and the native side has already
 * reactivated the session; the web graph still has to resume itself.
 * `mediaServicesReset` — the audio server restarted, so every node and element
 * created before it is dead and the graph must be rebuilt from scratch.
 */
export type AudioInterruptionState = 'began' | 'ended' | 'mediaServicesReset';

export interface AudioInterruptionEvent {
  state: AudioInterruptionState;
  /** Whether iOS itself suggested resuming. Native reactivates regardless when the mixer still wants playback. */
  shouldResume: boolean;
}

export interface AudioRouteChangeEvent {
  reason: 'oldDeviceUnavailable';
}

export interface PalanteAudioBridgePlugin {
  setPlaying(options: { playing: boolean }): Promise<void>;
  playBell(): Promise<void>;
  addListener(
    eventName: 'audioInterruption',
    listener: (event: AudioInterruptionEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'audioRouteChange',
    listener: (event: AudioRouteChangeEvent) => void,
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export const PalanteAudioBridge = registerPlugin<PalanteAudioBridgePlugin>(
  'PalanteAudioBridge',
  {
    web: {
      async setPlaying() {},
      async playBell() {
        throw new Error('playBell is native-only');
      },
      // The web build has no AVAudioSession, so nothing ever fires. Returning a
      // no-op handle keeps callers from having to branch on platform.
      async addListener() {
        return { remove: async () => {} } as PluginListenerHandle;
      },
      async removeAllListeners() {},
    },
  }
);
