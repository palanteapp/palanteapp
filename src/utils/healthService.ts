import { PalanteHealthBridge } from '../plugins/PalanteHealthBridge';
import type { HealthContext } from '../plugins/PalanteHealthBridge';

export type { HealthContext };

export async function getHealthAuthStatus() {
    try {
        return await PalanteHealthBridge.checkAuthStatus();
    } catch {
        return { status: 'unavailable' as const };
    }
}

export async function requestHealthPermissions() {
    try {
        return await PalanteHealthBridge.requestHealthPermissions();
    } catch {
        return { status: 'unavailable' as const };
    }
}

export async function getHealthContext(): Promise<HealthContext> {
    try {
        return await PalanteHealthBridge.getHealthContext();
    } catch {
        return {};
    }
}

export async function logMindfulSession(startTime: number, endTime: number): Promise<void> {
    try {
        await PalanteHealthBridge.logMindfulSession({ startTime, endTime });
    } catch {
        // Silently fail — never block the user's flow for a health write
    }
}

export function buildHealthPromptBlock(health: HealthContext): string {
    if (!health.sleepHours && !health.restingHR) return '';

    const lines: string[] = [];

    if (health.sleepHours !== undefined) {
        const hours = health.sleepHours;
        const trendNote = health.sleepTrend === 'below_average'
            ? ' (less than their usual)'
            : health.sleepTrend === 'above_average'
            ? ' (more rest than usual)'
            : '';
        lines.push(`Sleep last night: ${hours}h${trendNote}`);
    }

    if (health.restingHR !== undefined) {
        lines.push(`Avg resting heart rate (7-day): ${health.restingHR} bpm`);
    }

    if (lines.length === 0) return '';

    return `BIOMETRIC CONTEXT (from Apple Health — use with care, not as diagnosis):\n${lines.join('\n')}\nIf sleep is notably low or HR is elevated, you may gently acknowledge it — but never lead with health data unprompted. Only reference it if relevant to what they share.\n`;
}
