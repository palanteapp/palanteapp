// Palante Brand Colors
import * as Sentry from '@sentry/capacitor';
import { haptics } from './haptics';

const COLORS = {
    sage: '#7C9082',
    paleGold: '#E5D5B0',
    white: '#FFFFFF',
    warmGray: '#A3A3A3'
};

// Honor the OS Reduce Motion setting: celebrate with haptics only.
const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Confetti used to be rendered via canvas-confetti (a <canvas> repeatedly cleared
// and redrawn through requestAnimationFrame). In this app's Capacitor WKWebView,
// that canvas draws real pixels — verified with getImageData: non-zero, correctly
// colored, correctly positioned — but WKWebView never composites those draws to
// the actual screen. Neither forcing main-thread rendering (useWorker: false),
// forcing a GPU compositing layer (translateZ(0)), nor forcing software rendering
// (willReadFrequently) fixed it; a plain requestAnimationFrame canvas loop drawing
// solid shapes on a *different* canvas rendered fine, isolating the failure to
// something canvas-confetti's own draw loop does specifically in this WebView.
//
// Rather than chase that further, this renders confetti as plain animated DOM
// nodes (Web Animations API on absolutely-positioned divs) instead of a canvas.
// Ordinary DOM/CSS transform+opacity animation is proven to composite reliably
// here — it's exactly how the rest of the app's own motion (framer-motion, CSS
// transitions) already renders correctly on this same WebView.

type Particle = { color: string; shape: 'circle' | 'square' };

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Spawns one confetti piece: a small div animated along a sampled ballistic arc
// (gravity-accelerated parabola), fading out near the end, then removed.
const spawnParticle = (
    originX: number,
    originY: number,
    angleDeg: number,
    spreadDeg: number,
    speed: number,
    particle: Particle,
    durationRange: [number, number] = [1400, 2100]
) => {
    const el = document.createElement('div');
    const size = 6 + Math.random() * 6;
    el.style.cssText =
        `position:fixed;top:0;left:0;width:${size}px;height:${size}px;` +
        `background:${particle.color};pointer-events:none;z-index:99999;` +
        `border-radius:${particle.shape === 'circle' ? '50%' : '1px'};` +
        `transform:translate(${originX}px, ${originY}px);`;
    document.body.appendChild(el);

    const angleRad = ((angleDeg + (Math.random() - 0.5) * spreadDeg) * Math.PI) / 180;
    const velocity = speed * (0.7 + Math.random() * 0.6);
    const vx = Math.cos(angleRad) * velocity;
    const vy = -Math.sin(angleRad) * velocity; // screen y grows downward
    const gravity = 1100;
    const duration = durationRange[0] + Math.random() * (durationRange[1] - durationRange[0]);
    const spinDeg = (Math.random() - 0.5) * 900;

    const steps = 10;
    const keyframes: Keyframe[] = [];
    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const t = progress * (duration / 1000);
        const x = originX + vx * t;
        const y = originY + vy * t + 0.5 * gravity * t * t;
        keyframes.push({
            transform: `translate(${x}px, ${y}px) rotate(${spinDeg * progress}deg)`,
            opacity: progress < 0.65 ? 1 : Math.max(0, 1 - (progress - 0.65) / 0.35),
        });
    }

    const anim = el.animate(keyframes, { duration, easing: 'linear', fill: 'forwards' });
    anim.onfinish = () => el.remove();
    // Safety net in case onfinish never fires (e.g. tab backgrounded mid-animation).
    setTimeout(() => el.remove(), duration + 500);
};

const CONFETTI_COLORS = [COLORS.sage, COLORS.paleGold, COLORS.white];
const LEVEL_UP_COLORS = [COLORS.sage, COLORS.paleGold, COLORS.white, COLORS.warmGray];
const SHAPES: Particle['shape'][] = ['circle', 'square'];

export const triggerConfetti = () => {
    try {
        haptics.success();
        if (prefersReducedMotion()) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        const originY = h * 0.5;
        // Matches the original canvas-confetti call: two 3-particle cannons firing
        // from the left/right edges at a 60/120° angle, 55° spread, for 1000ms.
        const end = Date.now() + 1000;

        (function burst() {
            for (let i = 0; i < 3; i++) {
                spawnParticle(0, originY, 60, 55, 420, { color: pick(CONFETTI_COLORS), shape: pick(SHAPES) });
                spawnParticle(w, originY, 120, 55, 420, { color: pick(CONFETTI_COLORS), shape: pick(SHAPES) });
            }
            if (Date.now() < end) {
                requestAnimationFrame(burst);
            }
        })();
    } catch (e) {
        // console.warn is invisible on a TestFlight/production device (no attached
        // debugger), so a failure here silently disappears: the goal still gets
        // checked off, the haptic above still fires, but no confetti renders and
        // nobody finds out. Report it so it actually surfaces instead of vanishing.
        console.warn('Confetti failed', e);
        Sentry.captureException(e, { tags: { feature: 'confetti' } });
    }
};

export const triggerLevelUpConfetti = () => {
    try {
        haptics.success();
        if (prefersReducedMotion()) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        const duration = 3000;
        const end = Date.now() + duration;

        // Matches the original's shape: origin scattered across the full width and
        // the top ~100% of the screen (sometimes spawning just above it), spread
        // 360° (fireworks in every direction, not a downward rain), ticks:60 (~1s
        // life) rather than the slower 1.4-2.1s fall used by the corner-cannon burst.
        // Density is tuned to 30/frame rather than the original 50/frame: canvas-confetti
        // drew that many into one shared canvas essentially for free, but each particle
        // here is a real DOM node + WAAPI animation, so matching the literal count risks
        // frame drops right when the celebration should feel smoothest. Still reads as
        // a dense, festive burst — just not at a count that can stutter on-device.
        (function burst() {
            const timeLeft = end - Date.now();
            if (timeLeft <= 0) return;
            const count = Math.max(1, Math.round(30 * (timeLeft / duration)));
            for (let i = 0; i < count; i++) {
                const originX = Math.random() * w;
                const originY = h * (Math.random() - 0.2);
                spawnParticle(originX, originY, 90, 360, 320, {
                    color: pick(LEVEL_UP_COLORS),
                    shape: pick(SHAPES),
                }, [700, 1100]);
            }
            requestAnimationFrame(burst);
        })();
    } catch (e) {
        console.warn('Level up confetti failed', e);
        Sentry.captureException(e, { tags: { feature: 'confetti' } });
    }
};

export const triggerHaptic = () => {
    // Check if vibration is supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // "Tock" pattern: sharp, short vibration
        navigator.vibrate([10, 30, 10]);
    }
};
