import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useCallback } from 'react';

export const haptics = {
    // Light tap for minor interactions (toggles, secondary buttons)
    light: async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Ignore if haptics not supported/enabled
        }
    },

    // Medium tap for primary actions (likes, saves, sending)
    medium: async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Ignore
        }
    },

    // Heavy tap for destructive or significant actions
    heavy: async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Ignore
        }
    },

    // Success notification
    success: async () => {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            // Ignore
        }
    },

    // Error notification
    error: async () => {
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
            // Ignore
        }
    },

    // Selection change (e.g., date picker, scroll wheel, tab switch)
    selection: async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Ignore
        }
    },

    // Intense "Blast" for deep sensory feedback
    blast: async () => {
        try {
            // Triple heavy impact for maximum tactile sensation
            await Haptics.impact({ style: ImpactStyle.Heavy });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 80);
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 160);
        } catch (e) {
            // Ignore
        }
    },

    // Sonic "Pulse" for rhythmic feedback
    pulse: async () => {
        try {
            // A medium impact followed by a heavy impact to create a "double beat" heartbeat feel
            await Haptics.impact({ style: ImpactStyle.Medium });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 100);
        } catch (e) {
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
