// Palante Brand Colors
import * as Sentry from '@sentry/capacitor';
import { haptics } from './haptics';

const COLORS = {
    sage: '#7C9082',
    paleGold: '#E5D5B0',
    white: '#FFFFFF',
    warmGray: '#A3A3A3'
};

// True whenever the OS asks for less motion. Note this is NOT only the
// Accessibility > Motion > Reduce Motion switch: WebKit also reports it in
// other states the user never thinks of as a motion preference, so a build can
// look completely broken on one device and fine on the next.
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

// The DOM rewrite above originally approximated confetti motion as a real
// accelerating ballistic parabola (constant gravity in px/s², compounding
// over real elapsed time). That's NOT how canvas-confetti itself ever moved:
// its source (randomPhysics/updateFetti in canvas-confetti/src/confetti.js)
// runs a discrete per-frame walk where the launch velocity decays 10% every
// tick and a small CONSTANT (non-accelerating) amount is added to the
// position each tick for "gravity". The result is a quick outward burst that
// goes almost fully slack within ~15-20 frames and then drifts down at a
// gentle, near-constant rate — light and floaty. A true accelerating parabola
// instead keeps speeding up for its whole flight, so particles drop fast and
// hit bottom quickly: heavier, and on a visibly different path. This mirrors
// that exact recurrence (same constants: velocity decay 0.9/tick, gravity
// option × 3/tick) so the motion and direction match what shipped before.
const TICK_MS = 1000 / 60; // canvas-confetti's "tick" is one animation frame
const MAX_KEYFRAMES = 24;  // downsample the walk for WAAPI; shape is unaffected

interface BurstOptions {
    angle: number;
    spread: number;
    startVelocity: number;
    gravity?: number;
    decay?: number;
    ticks: number;
}

// Spawns one confetti piece: a small div walked along canvas-confetti's own
// per-tick recurrence (not a closed-form curve, so it's simulated tick by
// tick), fading linearly across its whole life like the original did, then
// removed.
const spawnParticle = (originX: number, originY: number, opts: BurstOptions, particle: Particle) => {
    const { angle, spread, startVelocity, gravity: gravityOpt = 1, decay = 0.9, ticks } = opts;

    const el = document.createElement('div');
    const size = 5 + Math.random() * 5;
    el.style.cssText =
        `position:fixed;top:0;left:0;width:${size}px;height:${size}px;` +
        `background:${particle.color};pointer-events:none;z-index:99999;` +
        `border-radius:${particle.shape === 'circle' ? '50%' : '1px'};`;
    document.body.appendChild(el);

    const radAngle = (angle * Math.PI) / 180;
    const radSpread = (spread * Math.PI) / 180;
    let velocity = startVelocity * 0.5 + Math.random() * startVelocity;
    const angle2D = -radAngle + (0.5 * radSpread - Math.random() * radSpread);
    const gravity = gravityOpt * 3;
    let tiltAngle = (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI; // flutter/squish phase
    let wobble = Math.random() * 10;                                  // spin phase
    const wobbleSpeed = Math.min(0.11, Math.random() * 0.1 + 0.05);

    const keyframeEvery = Math.max(1, Math.ceil(ticks / MAX_KEYFRAMES));
    const keyframes: Keyframe[] = [];
    let x = 0, y = 0;
    for (let tick = 0; tick <= ticks; tick++) {
        if (tick > 0) {
            x += Math.cos(angle2D) * velocity;
            y += Math.sin(angle2D) * velocity + gravity;
            velocity *= decay;
            tiltAngle += 0.1;
            wobble += wobbleSpeed;
        }
        if (tick % keyframeEvery === 0 || tick === ticks) {
            // Paper tumbling in 3D reads as a periodic squish, not a flat 2D
            // spin: this is what made the original look light instead of like
            // a rigid, always-full-width chip.
            const flutter = Math.max(0.2, Math.abs(Math.cos(tiltAngle)));
            const rotation = (Math.PI / 10) * wobble;
            keyframes.push({
                transform: `translate(${originX + x}px, ${originY + y}px) rotate(${rotation}rad) scaleX(${flutter})`,
                // Linear fade across the whole life (not held opaque then fading
                // late) — matches canvas-confetti's alpha = 1 - progress exactly,
                // and reads as much lighter/airier than staying solid until 65%.
                opacity: Math.max(0, 1 - tick / ticks),
            });
        }
    }

    const duration = ticks * TICK_MS;
    const anim = el.animate(keyframes, { duration, easing: 'linear', fill: 'forwards' });
    anim.onfinish = () => el.remove();
    // Safety net in case onfinish never fires (e.g. tab backgrounded mid-animation).
    setTimeout(() => el.remove(), duration + 500);
};

// ── Reduced-motion celebration ───────────────────────────────────────────────
// Both triggers below used to `return` outright when prefersReducedMotion() was
// true, firing a haptic and nothing else. That is why "confetti is broken on
// device" kept coming back with nothing to debug: verified on iOS 26 WebKit,
// with Reduce Motion on, triggerConfetti() spawns 0 particles, throws nothing,
// logs nothing and reports nothing to Sentry. It is indistinguishable from the
// feature being dead, and it only reproduces on a device whose motion setting
// happens to be on -- never in the browser preview, where it is off.
//
// So: still honor the setting, but stop treating it as "celebrate with nothing".
// What Reduce Motion is actually for is travel and zoom (those are the
// vestibular triggers); a pure cross-fade is explicitly safe under it. These
// sparkles never translate and never scale -- they fade up and back down
// exactly where they are spawned.
const spawnStaticSparkle = (x: number, y: number, color: string, delay: number) => {
    const el = document.createElement('div');
    const size = 6 + Math.random() * 6;
    el.style.cssText =
        `position:fixed;top:0;left:0;width:${size}px;height:${size}px;` +
        `background:${color};pointer-events:none;z-index:99999;border-radius:50%;` +
        `transform:translate(${x}px, ${y}px);opacity:0;`;
    document.body.appendChild(el);

    const duration = 900;
    const anim = el.animate(
        [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }],
        { duration, delay, easing: 'ease-in-out', fill: 'forwards' },
    );
    anim.onfinish = () => el.remove();
    // Same safety net as spawnParticle: onfinish can never fire if the webview is
    // backgrounded mid-animation, and these are position:fixed at z-index 99999,
    // so a leaked one would sit on top of the UI forever.
    setTimeout(() => el.remove(), duration + delay + 500);
};

const reducedMotionCelebration = (colors: string[], count: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < count; i++) {
        spawnStaticSparkle(
            Math.random() * w,
            h * (0.18 + Math.random() * 0.54),
            pick(colors),
            Math.random() * 400,
        );
    }
    // Leave a trail so this branch is never invisible again. A breadcrumb (not an
    // exception) because taking this path is correct behavior, not a fault -- it
    // just needs to be attributable when someone reports "no confetti".
    Sentry.addBreadcrumb({
        category: 'celebration',
        level: 'info',
        message: 'reduced-motion: static sparkle celebration instead of confetti',
    });
};

const CONFETTI_COLORS = [COLORS.sage, COLORS.paleGold, COLORS.white];
const LEVEL_UP_COLORS = [COLORS.sage, COLORS.paleGold, COLORS.white, COLORS.warmGray];
const SHAPES: Particle['shape'][] = ['circle', 'square'];

export const triggerConfetti = () => {
    try {
        haptics.success();
        if (prefersReducedMotion()) {
            reducedMotionCelebration(CONFETTI_COLORS, 14);
            return;
        }

        const w = window.innerWidth;
        const h = window.innerHeight;
        const originY = h * 0.5;
        // Matches the original canvas-confetti call exactly: two 3-particle
        // cannons firing from the left/right edges at a 60/120° angle, 55°
        // spread, default startVelocity (45) and ticks (200), for 1000ms.
        const end = Date.now() + 1000;
        const cannonOpts = { spread: 55, startVelocity: 45, ticks: 200 };

        (function burst() {
            for (let i = 0; i < 3; i++) {
                spawnParticle(0, originY, { ...cannonOpts, angle: 60 }, { color: pick(CONFETTI_COLORS), shape: pick(SHAPES) });
                spawnParticle(w, originY, { ...cannonOpts, angle: 120 }, { color: pick(CONFETTI_COLORS), shape: pick(SHAPES) });
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
        if (prefersReducedMotion()) {
            reducedMotionCelebration(LEVEL_UP_COLORS, 26);
            return;
        }

        const w = window.innerWidth;
        const h = window.innerHeight;
        const duration = 3000;
        const end = Date.now() + duration;

        // Matches the original's shape: origin scattered across the full width and
        // the top ~100% of the screen (sometimes spawning just above it), spread
        // 360° (fireworks in every direction, not a downward rain), startVelocity
        // 30 and ticks 60 (~1s life), exactly as the original call specified.
        // Density is tuned to 30/frame rather than the original 50/frame: canvas-confetti
        // drew that many into one shared canvas essentially for free, but each particle
        // here is a real DOM node + WAAPI animation, so matching the literal count risks
        // frame drops right when the celebration should feel smoothest. Still reads as
        // a dense, festive burst — just not at a count that can stutter on-device.
        const fireworkOpts = { angle: 90, spread: 360, startVelocity: 30, ticks: 60 };

        (function burst() {
            const timeLeft = end - Date.now();
            if (timeLeft <= 0) return;
            const count = Math.max(1, Math.round(30 * (timeLeft / duration)));
            for (let i = 0; i < count; i++) {
                const originX = Math.random() * w;
                const originY = h * (Math.random() - 0.2);
                spawnParticle(originX, originY, fireworkOpts, {
                    color: pick(LEVEL_UP_COLORS),
                    shape: pick(SHAPES),
                });
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
