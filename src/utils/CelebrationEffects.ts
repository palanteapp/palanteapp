// Palante Brand Colors
import { haptics } from './haptics';

const COLORS = {
    sage: '#7C9082',
    paleGold: '#E5D5B0',
    white: '#FFFFFF',
    warmGray: '#A3A3A3'
};

export const triggerConfetti = async () => {
    try {
        const end = Date.now() + 1000;
        haptics.success();

        // Lazy load confetti
        const confetti = (await import('canvas-confetti')).default;

        // Frame-by-frame animation for smoother effect
        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: [COLORS.sage, COLORS.paleGold, COLORS.white]
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: [COLORS.sage, COLORS.paleGold, COLORS.white]
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } catch (e) {
        console.warn('Confetti failed', e);
    }
};


export const triggerLevelUpConfetti = async () => {
    try {
        haptics.success();
        const duration = 3000;
        const end = Date.now() + duration;

        // Lazy load confetti
        const confetti = (await import('canvas-confetti')).default;

        (function frame() {
            const timeLeft = end - Date.now();

            if (timeLeft <= 0) return;

            const particleCount = 50 * (timeLeft / duration);

            // Random bursts from bottom corners
            confetti({
                particleCount,
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
                colors: [COLORS.sage, COLORS.paleGold, COLORS.white, COLORS.warmGray]
            });

            requestAnimationFrame(frame);
        }());
    } catch (e) {
        console.warn('Level up confetti failed', e);
    }
};

export const triggerHaptic = () => {
    // Check if vibration is supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // "Tock" pattern: sharp, short vibration
        navigator.vibrate([10, 30, 10]);
    }
};
