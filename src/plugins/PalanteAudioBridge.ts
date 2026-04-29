import { registerPlugin } from '@capacitor/core';

export interface PalanteAudioBridgePlugin {
  setPlaying(options: { playing: boolean }): Promise<void>;
}

export const PalanteAudioBridge = registerPlugin<PalanteAudioBridgePlugin>(
  'PalanteAudioBridge',
  {
    web: {
      async setPlaying() {},
    },
  }
);
