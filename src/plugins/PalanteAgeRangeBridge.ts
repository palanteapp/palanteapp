import { registerPlugin } from '@capacitor/core';

export interface AgeRangeResult {
    outcome: 'shared' | 'declined' | 'unavailable';
    lowerBound?: number;
    upperBound?: number;
}

export interface PalanteAgeRangeBridgePlugin {
    requestAgeRange(): Promise<AgeRangeResult>;
}

export const PalanteAgeRangeBridge = registerPlugin<PalanteAgeRangeBridgePlugin>(
    'PalanteAgeRangeBridge',
    {
        web: {
            async requestAgeRange() { return { outcome: 'unavailable' }; },
        },
    }
);
