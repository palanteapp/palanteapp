import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

const isHapticsEnabled = (): boolean => {
    const stored = localStorage.getItem(STORAGE_KEYS.HAPTICS_ENABLED);
    // Default to enabled if the preference has never been set
    return stored === null ? true : stored === 'true';
};

export const haptics = {
    // Light tap for minor interactions (toggles, secondary buttons)
    light: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // Ignore if haptics not supported
        }
    },

    // Medium tap for primary actions (likes, saves, sending)
    medium: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {
            // Ignore
        }
    },

    // Heavy tap for destructive or significant actions
    heavy: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {
            // Ignore
        }
    },

    // Success notification
    success: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch {
            // Ignore
        }
    },

    // Error notification
    error: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch {
            // Ignore
        }
    },

    // Selection change (e.g., date picker, scroll wheel, tab switch)
    selection: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {
            // Ignore
        }
    },

    // Intense "Blast" for deep sensory feedback
    blast: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 80);
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 160);
        } catch {
            // Ignore
        }
    },

    // Sonic "Pulse" for rhythmic feedback
    pulse: async () => {
        if (!isHapticsEnabled()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 100);
        } catch {
            // Ignore
        }
    }
};

export const useHaptics = () => {
    const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' | 'blast' | 'pulse') => {
        if (haptics[style as keyof typeof haptics]) {
            (haptics[style as keyof typeof haptics] as () => Promise<void>)();
        }
    }, []);
    return { triggerHaptic };
};
