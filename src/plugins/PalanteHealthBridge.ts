import { registerPlugin } from '@capacitor/core';

export interface HealthAuthStatus {
    status: 'authorized' | 'notDetermined' | 'denied' | 'unavailable';
}

export interface HealthContext {
    sleepHours?: number;
    restingHR?: number;
    sleepTrend?: 'below_average' | 'above_average' | 'typical';
}

export interface PalanteHealthBridgePlugin {
    checkAuthStatus(): Promise<HealthAuthStatus>;
    requestPermissions(): Promise<HealthAuthStatus>;
    getHealthContext(): Promise<HealthContext>;
    logMindfulSession(options: { startTime: number; endTime: number }): Promise<{ success: boolean }>;
}

export const PalanteHealthBridge = registerPlugin<PalanteHealthBridgePlugin>(
    'PalanteHealthBridge',
    {
        web: {
            async checkAuthStatus() { return { status: 'unavailable' }; },
            async requestPermissions() { return { status: 'unavailable' }; },
            async getHealthContext() { return {}; },
            async logMindfulSession() { return { success: false }; },
        },
    }
);
