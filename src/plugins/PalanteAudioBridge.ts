import { registerPlugin } from '@capacitor/core';

export interface PalanteAudioBridgePlugin {
  setPlaying(options: { playing: boolean }): Promise<void>;
  playBell(): Promise<void>;
}

export const PalanteAudioBridge = registerPlugin<PalanteAudioBridgePlugin>(
  'PalanteAudioBridge',
  {
    web: {
      async setPlaying() {},
      async playBell() {
        throw new Error('playBell is native-only');
      },
    },
  }
);
