import { registerPlugin } from '@capacitor/core';

export interface PalanteWidgetBridgePlugin {
  updateWidgetData(options: {
    streak: number;
    practiceName: string;
    practiceComplete: boolean;
    quotes?: Array<{ text: string; author: string }>;
    quoteStartIndex?: number;
    goals?: Array<{ text: string; completed: boolean }>;
  }): Promise<void>;
  reloadWidget(): Promise<void>;
}

export const PalanteWidgetBridge = registerPlugin<PalanteWidgetBridgePlugin>(
  'PalanteWidgetBridge',
  {
    web: {
      async updateWidgetData() {},
      async reloadWidget() {},
    },
  }
);
