import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { readJSON } from '../utils/safeStorage';
import { Settings, X, Volume2, VolumeX, Eye, EyeOff, HelpCircle, Fish as FishIcon } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import type { PluginListenerHandle } from '@capacitor/core';
import { haptics } from '../utils/haptics';
import { RippleLayer, type RippleLayerRef } from './RippleLayer';
import { SlideUpModal } from './SlideUpModal';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { SOUND_SOURCES } from '../constants/soundSources';
import { isSynthSound, SynthVoice, SYNTH_SOUNDS } from '../utils/synthSounds';
import { getAudioContext, getMasterLimiter } from '../utils/audioGraph';
import { startLoop, type LoopHandle } from '../utils/loopEngine';
import { PalanteAudioBridge } from '../plugins/PalanteAudioBridge';
import { claimAudioSession } from '../utils/audioSessionClaim';
import type { SoundMix } from '../types';
// Fish removed per user request
// KoiFishSprite logic removed, using Processed Static Assets

/** Name of the user-saved mix the pond plays by default (case-insensitive match). */
const POND_MIX_NAME = 'koi pond vibes';

// Pond layers run through the SAME Web Audio graph as the Sound Mixer, rather
// than as bare HTMLAudioElements.
//
// ── What was here, and why it distorted ─────────────────────────────────────
// Each layer used to be two HTMLAudioElements crossfading into each other at
// the loop seam. Three faults compounded:
//
//   1. It timed the crossfade off `element.duration`, which INCLUDES the AAC
//      encoder's trailing padding. Anything that computes a loop boundary from
//      `duration` is wrong; the manifest's `loopSeconds` is the only
//      trustworthy length. The fade therefore ran partly into silence.
//   2. It used an equal-power (sin/cos) curve to blend a track's tail against
//      its own head. Equal power is right for UNCORRELATED signals; the baker
//      deliberately makes tail and head correlate as closely as it can, so the
//      two summed almost linearly and peaked around +3dB at the midpoint of
//      every wrap. audioGraph.ts documents exactly this hump and reserves 3dB
//      of headroom for it.
//   3. That headroom lives in the master limiter, and bare HTMLAudioElements
//      never reach it. The pond sums SEVERAL layers this way, so the overshoot
//      had nothing catching it and landed straight on the output.
//
// ── What replaces it ────────────────────────────────────────────────────────
// Files go through startLoop(), the same AudioBufferSourceNode path the mixer
// uses: sliced to `loopSeconds`, wrapped by the audio rendering thread, with no
// crossfade at the seam at all and so no hump to clip. Synth layers go through
// SynthVoice, which is already the mixer's Web Audio path for them. Both land
// on getMasterLimiter(), so every layer is inside the headroom the rest of the
// app assumes. Files also now SHARE the mixer's decoded-buffer cache instead of
// opening their own pair of decoders per layer.

/** One pond layer, however it is produced. */
interface PondLayer {
    setVolume(v: number, instant?: boolean): void;
    stop(): void;
}

function fileLayer(handle: LoopHandle): PondLayer {
    return {
        setVolume: (v, instant) => handle.setVolume(v, instant ?? true),
        stop: () => handle.stop(),
    };
}

function synthLayer(ctx: AudioContext, voice: SynthVoice): PondLayer {
    return {
        setVolume: (v, instant) => voice.setVolume(ctx, v, instant ?? true),
        stop: () => voice.stop(ctx),
    };
}

interface KoiPondProps {
    totalPractices?: number;
    isDarkMode: boolean;
    onClose: () => void;
    streak?: number;
    points?: number;
    savedMixes?: SoundMix[];
}

/** How many koi to spawn: takes the higher of streak-based or practices-based milestones.
 *  Thresholds are intentionally high so the pond grows over months, not days. */
function getFishCount(streak: number, totalPractices: number): number {
    // ~2 weeks of daily practice = 2 fish, ~1 year = 7 fish
    const byPractices =
        totalPractices >= 300 ? 7 :
        totalPractices >= 200 ? 6 :
        totalPractices >= 120 ? 5 :
        totalPractices >= 60  ? 4 :
        totalPractices >= 30  ? 3 :
        totalPractices >= 14  ? 2 : 1;

    // 30-day streak = 2 fish, 1-year streak = 7 fish
    const byStreak =
        streak >= 365 ? 7 :
        streak >= 200 ? 6 :
        streak >= 120 ? 5 :
        streak >= 60  ? 4 :
        streak >= 30  ? 3 :
        streak >= 14  ? 2 : 1;

    return Math.min(7, Math.max(byStreak, byPractices));
}

// FishState Interface Removed

// Ripple Interface moved to RippleLayer



interface Lotus {
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    type: 'lotus' | 'lilypad';
    // Drift properties
    driftDirection: number;
    speed: number;
}

interface DriftingLotus {
    id: number;
    x: number;
    y: number;
    rotation: number;
    speed: number;
    delay: number;
    color: string;
    scale: number;
    opacity: number;
    driftDirection?: number;
}

interface Fish {
    id: number;
    x: number;
    y: number;
    angle: number;
    targetAngle: number;
    speed: number;
    variant: 'blackGold' | 'redOrange' | 'yellowOrange' | 'blackRed' | 'purpleGalaxy' | 'midnightBlue' | 'jadeDragon' | 'volcanic' | 'sunset' | 'royalAmethyst';
    scale: number;
    spawnTime?: number;
    isActive?: boolean;
    isEating?: boolean;
    eatTimer?: number;
    targetFoodId?: number | null;
    /** Set once when the fish first fades in, so the loop stops re-writing opacity every frame. */
    didFadeIn?: boolean;
    /** Accumulated tail-sway phase, in radians. Stepped by a small increment each frame rather
     *  than recomputed from absolute time * currentSpeed — see the comment at its call site for
     *  why that distinction matters. */
    tailPhase?: number;
    /** Whether this fish was off-screen last frame — the edge that seeds a fresh
     *  set of return-trip characteristics below, so it's re-rolled once per trip
     *  rather than every frame (which would look jittery) or never (which is why
     *  every return used to look identical). */
    wasOffScreen?: boolean;
    /** Per-trip return speed, turn rate, and wobble — randomized once when a fish
     *  goes off-screen so consecutive trips don't all swim back the same way. */
    offscreenSpeedMult?: number;
    offscreenTurnRate?: number;
    offscreenWobbleAmp?: number;
    offscreenWobbleFreq?: number;
    offscreenWobblePhase?: number;
    /** Per-fish tail/fin sway rate and amplitude multipliers, rolled once at spawn,
     *  so two fish moving at the same speed don't sway in lockstep with each other. */
    swayRateMult?: number;
    swayAmpMult?: number;
    /** Brief, rare drift-to-stillness while cruising open water — reinforces
     *  patience rather than the fish being perpetually mid-swim. */
    isPausing?: boolean;
    pauseTimer?: number;
}

interface FoodPellet {
    id: number;
    x: number;
    y: number;
    size: number;
    isClaimed?: boolean;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    rotation: number;
    rotSpeed: number;
    wiggle: number;
    wiggleSpeed: number;
    color: string;
}



const KoiFishSVG: React.FC<{ variant: Fish['variant']; shadowStrength?: number }> = React.memo(({ variant, shadowStrength = 1 }) => {
    // Colors based on variant
    const getColors = () => {
        switch (variant) {
            // DARK & RICH VARIANTS (No White)
            case 'blackGold': return { body: '#0A0A0A', accent: '#E6B800', pattern: 'grad' }; // Metallic Gold on Black
            case 'blackRed': return { body: '#080808', accent: '#A80000', pattern: 'spots' }; // Showa Style
            case 'midnightBlue': return { body: '#071630', accent: '#5C8FD6', pattern: 'spots' }; // Deep Navy & Sky Blue
            case 'jadeDragon': return { body: '#002E26', accent: '#3FBF85', pattern: 'striped' }; // Dark Green & Mint
            case 'volcanic': return { body: '#121212', accent: '#C22E00', pattern: 'striped' }; // Charcoal & Magma
            case 'royalAmethyst': return { body: '#1C0F55', accent: '#A830BD', pattern: 'grad' }; // Deep Purple & Neon Pink

            // VIBRANT VARIANTS
            case 'redOrange': return { body: '#8F1C00', accent: '#C28200', pattern: 'kohaku' }; // Deep Orange Base
            case 'yellowOrange': return { body: '#A34700', accent: '#C2A300', pattern: 'grad' }; // Amber Base
            case 'sunset': return { body: '#732008', accent: '#C2705C', pattern: 'grad' }; // Burnt Sienna & Peach
            case 'purpleGalaxy': return { body: '#0E1247', accent: '#00A6BD', pattern: 'spots' }; // Indigo & Cyan

            default: return { body: '#0A0A0A', accent: '#A80000', pattern: 'spots' };
        }
    };
    const { body, accent, pattern } = getColors();
    const clipId = useId();

    return (
        <svg width="60" height="90" viewBox="0 0 60 90" className="overflow-visible opacity-90">
            <defs>
                {/* Body-shaped clip so hand-placed pattern markings can never bleed past
                    the silhouette edge, no matter how large or roughly-estimated they are. */}
                <clipPath id={clipId}>
                    <ellipse cx="0" cy="0" rx="12" ry="30" />
                </clipPath>
            </defs>
            <g transform="translate(30, 45)">
                {/* Depth shadow, drawn as plain shapes rather than a CSS drop-shadow filter.
                    A `filter` on the wrapper forces WebKit to re-rasterize a blurred surface
                    every single frame, because the tail/fin below animate continuously.
                    Lightened from the original 0.10/0.16, and scaled per-fish by
                    `shadowStrength` (1 = the darkest, unchanged tier) so the pond doesn't
                    read as one shape repeated — see the per-fish tier at the call site. */}
                <ellipse cx="8" cy="13" rx="17" ry="37" fill="#000" opacity={0.06 * shadowStrength} />
                <ellipse cx="7" cy="11" rx="14.5" ry="33" fill="#000" opacity={0.10 * shadowStrength} />

                {/* Tail — rotation driven by the shared rAF clock via --koi-tail (see animate()).
                    Beat rate is tied to the fish's real speed, so the body and tail stay in phase. */}
                <g style={{ transform: 'rotate(var(--koi-tail, 0deg))', transformOrigin: '0 25px' }}>
                    <path d="M0,25 Q10,35 12,50 L0,45 L-12,50 Q-10,35 0,25" fill={body} opacity="0.9" />
                    {/* Fin rays — thin fanned lines from the base, as on a real tail fin */}
                    <g stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.4">
                        <line x1="0" y1="27" x2="-9" y2="45" />
                        <line x1="0" y1="27" x2="-4" y2="47" />
                        <line x1="0" y1="27" x2="4" y2="47" />
                        <line x1="0" y1="27" x2="9" y2="45" />
                    </g>
                </g>

                {/* Left Fin — same clock, counter-phase to the tail */}
                <g style={{ transform: 'rotate(var(--koi-fin-l, 0deg))', transformOrigin: '-12px 5px' }}>
                    <path d="M-12,0 Q-22,5 -25,15 Q-15,10 -12,5" fill={body} opacity="0.8" />
                    <g stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.4">
                        <line x1="-13" y1="2" x2="-20" y2="6" />
                        <line x1="-13" y1="3" x2="-23" y2="10" />
                        <line x1="-13" y1="4" x2="-24" y2="13" />
                    </g>
                </g>

                {/* Right Fin */}
                <g style={{ transform: 'rotate(var(--koi-fin-r, 0deg))', transformOrigin: '12px 5px' }}>
                    <path d="M12,0 Q22,5 25,15 Q15,10 12,5" fill={body} opacity="0.8" />
                    <g stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.4">
                        <line x1="13" y1="2" x2="20" y2="6" />
                        <line x1="13" y1="3" x2="23" y2="10" />
                        <line x1="13" y1="4" x2="24" y2="13" />
                    </g>
                </g>

                {/* Body */}
                <ellipse cx="0" cy="0" rx="12" ry="30" fill={body} />

                {/* Patterns */}
                {pattern === 'kohaku' && (
                    <g fill={accent} opacity="0.85">
                        {/* Large head patch */}
                        <path d="M-6,-25 Q0,-32 6,-25 Q8,-15 0,-12 Q-8,-15 -6,-25" />
                        {/* Body patches - more organic */}
                        <path d="M-8,0 Q0,-5 8,0 Q10,15 0,18 Q-10,15 -8,0" />
                        <circle cx="0" cy="8" r="4" />
                    </g>
                )}
                {pattern === 'tancho' && (
                    <circle cx="0" cy="-15" r="5" fill={accent} opacity="0.9" />
                )}
                {pattern === 'spots' && (
                    <g fill={accent} opacity="0.8">
                        <circle cx="-5" cy="-10" r="3" />
                        <circle cx="6" cy="5" r="4" />
                        <circle cx="-3" cy="18" r="2" />
                    </g>
                )}
                {pattern === 'striped' && (
                    <g stroke={accent} strokeWidth="3" opacity="0.8" strokeLinecap="round">
                        <path d="M-6,-15 L6,-15" />
                        <path d="M-9,0 L9,0" />
                        <path d="M-7,15 L7,15" />
                    </g>
                )}
                {pattern === 'grad' && (
                    <g clipPath={`url(#${clipId})`}>
                        {/* Traced from the reference photo's composition (not invented, not
                            noise-jittered) — a dominant navy shape interlocking with two
                            orange patches down the spine, a small pale patch, and two small
                            accent dots near the head. Points were estimated by eye against
                            the reference and run through a Catmull-Rom smoothing spline,
                            then scaled up around each shape's own centroid (not the body's)
                            so they cover more of the fish without the head patch shooting
                            past the nose — see scripts/koi-handtrace.js. Colors are fixed
                            across variants (not tied to the variant's accent) so every
                            'grad' fish carries the same white/black/orange marking language
                            as the source. Clipped to the body ellipse so the now-larger
                            shapes can never bleed past the silhouette edge. */}
                        <path d="M2.40,-25.20 C4.03,-24.97 6.83,-21.47 8.00,-18.20 C9.17,-14.93 9.87,-9.57 9.40,-5.60 C8.93,-1.63 7.30,2.80 5.20,5.60 C3.10,8.40 -1.10,11.43 -3.20,11.20 C-5.30,10.97 -7.17,7.47 -7.40,4.20 C-7.63,0.93 -5.53,-4.43 -4.60,-8.40 C-3.67,-12.37 -2.97,-16.80 -1.80,-19.60 C-0.63,-22.40 0.77,-25.43 2.40,-25.20 Z" fill="#1A2540" stroke="#000" strokeWidth="0.3" strokeOpacity="0.3" opacity="0.92" />
                        <path d="M-3.20,-28.01 C-1.90,-29.53 1.35,-30.18 3.30,-29.31 C5.25,-28.45 7.63,-25.41 8.50,-22.81 C9.37,-20.21 9.37,-16.10 8.50,-13.71 C7.63,-11.33 5.03,-8.73 3.30,-8.51 C1.57,-8.30 -0.60,-10.46 -1.90,-12.41 C-3.20,-14.36 -4.28,-17.61 -4.50,-20.21 C-4.72,-22.81 -4.50,-26.50 -3.20,-28.01 Z" fill="#FF5A2B" stroke="#000" strokeWidth="0.3" strokeOpacity="0.25" opacity="0.92" />
                        <path d="M7.34,-4.83 C8.06,-2.90 10.24,2.18 10.24,5.32 C10.24,8.46 8.79,12.33 7.34,14.02 C5.89,15.71 2.99,16.44 1.54,15.47 C0.09,14.50 -1.36,11.12 -1.36,8.22 C-1.36,5.32 0.33,0.49 1.54,-1.93 C2.74,-4.35 4.92,-5.80 5.89,-6.28 C6.85,-6.76 6.61,-6.76 7.34,-4.83 Z" fill="#FF5A2B" stroke="#000" strokeWidth="0.3" strokeOpacity="0.25" opacity="0.92" />
                        <path d="M1.50,5.33 C2.75,6.08 4.25,8.83 4.50,11.33 C4.75,13.83 4.00,18.58 3.00,20.33 C2.00,22.08 -0.25,22.83 -1.50,21.83 C-2.75,20.83 -4.25,16.83 -4.50,14.33 C-4.75,11.83 -4.00,8.33 -3.00,6.83 C-2.00,5.33 0.25,4.58 1.50,5.33 Z" fill="#1A2540" stroke="#000" strokeWidth="0.3" strokeOpacity="0.3" opacity="0.92" />
                        <path d="M-6.50,-10.87 C-5.57,-12.50 -3.70,-15.07 -2.30,-15.07 C-0.90,-15.07 1.43,-12.73 1.90,-10.87 C2.37,-9.00 1.43,-5.50 0.50,-3.87 C-0.43,-2.23 -2.30,-0.83 -3.70,-1.07 C-5.10,-1.30 -7.43,-3.63 -7.90,-5.27 C-8.37,-6.90 -7.43,-9.23 -6.50,-10.87 Z" fill="#F4F1E8" stroke="#000" strokeWidth="0.3" strokeOpacity="0.2" opacity="0.9" />
                        <circle cx="2" cy="-28.5" r="2.2" fill="#FF5A2B" opacity="0.92" />
                        <circle cx="7.5" cy="-19" r="1.3" fill="#1A2540" opacity="0.9" />
                        {/* Spine lines — the pale centerline marking visible down a real
                            koi's back, one long line plus a shorter one paralleling it */}
                        <g stroke="#F4F1E8" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.35">
                            <path d="M1,-24 Q2,-14 0,-2 Q-1,6 1,14" />
                            <path d="M2.5,-17 Q3,-10 1.5,-4" />
                        </g>
                    </g>
                )}
                {pattern === 'tux' && (
                    <g fill={accent} opacity="0.9">
                        <path d="M-4,-28 L4,-28 L0,-15 Z" />
                        <path d="M-2,20 L2,20 L0,30 Z" />
                    </g>
                )}


                {/* Eyes — from directly above, a koi's eye reads as barely more than a
                    faint mark on the side of the head, not a drawn circle. Each stroke
                    runs tangent to the body ellipse (rx=12, ry=30) a fraction inside its
                    edge, so it sits alongside the silhouette instead of poking through it. */}
                <g stroke="#F4F1E8" strokeWidth="0.6" strokeLinecap="round" opacity="0.5">
                    <line x1="-7.5" y1="-22" x2="-8.3" y2="-20" />
                    <line x1="7.5" y1="-22" x2="8.3" y2="-20" />
                </g>
                <circle cx="-7.9" cy="-21" r="0.55" fill="#000" />
                <circle cx="7.9" cy="-21" r="0.55" fill="#000" />
            </g>
        </svg>
    );
});



const KOI_VARIANTS: Fish['variant'][] = ['blackGold', 'redOrange', 'yellowOrange', 'blackRed', 'purpleGalaxy', 'midnightBlue', 'jadeDragon', 'volcanic', 'sunset', 'royalAmethyst'];

/** Cycled by fish id so shadows read as varied depth in the water rather than one
 *  shape stamped under every fish. 1 = the darkest tier (see KoiFishSVG's base opacities). */
const SHADOW_TIERS = [1, 0.7, 0.5, 0.35];

/** Caustics are soft, slow-moving blobs, so they are rendered into a half-resolution backing
 *  store and upscaled by the compositor. Quartering the pixel count is invisible here. */
/** Base angular frequency of the koi tail sway, in rad/ms.
 *  0.00157 rad/ms ~= 1.57 rad/s ~= one full sway every 4 seconds. Koi tails undulate slowly;
 *  anything meaningfully faster than this reads as flickering rather than swimming. */
const TAIL_BASE_OMEGA = 0.00157;

const CAUSTIC_SCALE = 0.5;
const CAUSTIC_SPRITE_R = 96;
const FOOD_SPRITE_R = 16;

export const KoiPond: React.FC<KoiPondProps> = ({ isDarkMode, onClose, streak = 0, points: _points = 0, totalPractices = 0, savedMixes = [] }) => {
    const fishCount = getFishCount(streak, totalPractices);
    const earnedKoi = fishCount > 1; // earned a second fish via streak or practices

    // First-koi arrival celebration (shown once after reaching 30-day streak)
    const [showFirstArrival, setShowFirstArrival] = useState(() =>
        earnedKoi && !localStorage.getItem('koiFirstArrivalSeen')
    );
    const dismissFirstArrival = () => {
        localStorage.setItem('koiFirstArrivalSeen', 'true');
        setShowFirstArrival(false);
    };

    // Ambient hint for users still working toward their first earned koi
    const [showEmptyHint, setShowEmptyHint] = useState(false);
    useEffect(() => {
        if (earnedKoi) return;
        const showTimer = setTimeout(() => setShowEmptyHint(true), 1800);
        const hideTimer = setTimeout(() => setShowEmptyHint(false), 11800);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [earnedKoi]);

    // Persistent "Help" affordance, same pattern as Soundscapes' — a fading ambient
    // hint alone wasn't discoverable enough, so this is the always-there way in.
    const [showHelp, setShowHelp] = useState(false);

    // One-time-ever hint teaching the tap-to-feed gesture: nothing on this screen
    // otherwise signals that the water itself is tappable, and "Observe and relax"
    // arguably suggests the opposite. Shown once, the first time there's a fish to
    // feed; dismissed either by its own timeout or the moment the user actually taps.
    const [showFeedHint, setShowFeedHint] = useState(false);
    const dismissFeedHint = () => {
        localStorage.setItem('koiFeedHintSeen', 'true');
        setShowFeedHint(false);
    };
    useEffect(() => {
        if (!earnedKoi || localStorage.getItem('koiFeedHintSeen')) return;
        const showTimer = setTimeout(() => setShowFeedHint(true), 1800);
        return () => clearTimeout(showTimer);
    }, [earnedKoi]);
    useEffect(() => {
        if (!showFeedHint) return;
        const hideTimer = setTimeout(dismissFeedHint, 8000);
        return () => clearTimeout(hideTimer);
    }, [showFeedHint]);


    // Fish State (Required for Mounting DOM Elements)
    const [fish, setFish] = useState<Fish[]>([]);
    // Removed showFish state usage in JSX if redundant, or keep if togglable
    const [showFish, setShowFish] = useState(true);

    // const [ripples, setRipples] = useState<Ripple[]>([]); // MOVED TO RIPPLE LAYER

    const [lotuses, setLotuses] = useState<Lotus[]>([]);
    const [driftingLotuses, setDriftingLotuses] = useState<DriftingLotus[]>([]);

    // PHYSICS REFS (Direct DOM Manipulation for 60fps)
    const fishRef = useRef<Fish[]>([]);
    const lotusesRef = useRef<Lotus[]>([]);
    const driftingLotusesRef = useRef<DriftingLotus[]>([]);
    // Ripples don't need physics refs usually, they just play css animation, but we use ref for timing

    // DOM NODE REFS
    const fishElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
    const lotusElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
    const driftingElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

    const rippleLayerRef = useRef<RippleLayerRef>(null);
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false); // Track mute state for async audio loops
    const [isLoaded, setIsLoaded] = useState(false); // For fade-in transition
    const lastTimeRef = useRef<number | undefined>(undefined);
    const dtSmoothRef = useRef(1);
    const requestRef = useRef<number | undefined>(undefined);
    const windowSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
    const tapsRef = useRef<{ x: number, y: number, time: number }[]>([]);
    const foodRef = useRef<FoodPellet[]>([]);
    const nextFoodIdRef = useRef(0);

    // Cache window size on resize
    useEffect(() => {
        const handleResize = () => {
            windowSizeRef.current = { width: window.innerWidth, height: window.innerHeight };
            // The sakura/food canvas's width/height attributes (its actual pixel
            // backing store) were only ever set once at mount. Without updating them
            // here too, a resize (device rotation, iPad split-view, a keyboard-driven
            // viewport change) left the canvas drawing into a raster sized for the OLD
            // viewport — a blank strip along whichever edge grew, where no petals or
            // food pellets ever rendered, since the draw loop below reads its size
            // straight off these attributes.
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize caustic light patches + pre-rendered sprites.
    //
    // The caustics used to build a fresh createRadialGradient() for all 24 patches on every
    // frame and fill a large ellipse with it. Gradient fills are per-pixel work and this was
    // roughly 8x full-screen overdraw per frame. One gradient is baked into an offscreen
    // sprite here instead, and the loop just blits it, which is a texture copy.
    useEffect(() => {
        const cs = document.createElement('canvas');
        cs.width = cs.height = CAUSTIC_SPRITE_R * 2;
        const cctx = cs.getContext('2d');
        if (cctx) {
            const g = cctx.createRadialGradient(CAUSTIC_SPRITE_R, CAUSTIC_SPRITE_R, 0, CAUSTIC_SPRITE_R, CAUSTIC_SPRITE_R, CAUSTIC_SPRITE_R);
            g.addColorStop(0, 'rgba(190,230,170,1)');
            g.addColorStop(0.45, 'rgba(170,215,150,0.35)');
            g.addColorStop(1, 'rgba(170,215,150,0)');
            cctx.fillStyle = g;
            cctx.fillRect(0, 0, CAUSTIC_SPRITE_R * 2, CAUSTIC_SPRITE_R * 2);
        }
        causticSpriteRef.current = cs;

        // Same trick for food pellets: ctx.shadowBlur is one of the slowest 2D canvas
        // operations, and it was being set per pellet, per frame, while the user is tapping.
        const fs = document.createElement('canvas');
        fs.width = fs.height = FOOD_SPRITE_R * 2;
        const fctx = fs.getContext('2d');
        if (fctx) {
            const g = fctx.createRadialGradient(FOOD_SPRITE_R, FOOD_SPRITE_R, 0, FOOD_SPRITE_R, FOOD_SPRITE_R, FOOD_SPRITE_R);
            g.addColorStop(0, 'rgba(255,255,255,0.95)');
            g.addColorStop(0.30, '#E5D6A7');
            g.addColorStop(0.55, 'rgba(229,214,167,0.5)');
            g.addColorStop(1, 'rgba(229,214,167,0)');
            fctx.fillStyle = g;
            fctx.fillRect(0, 0, FOOD_SPRITE_R * 2, FOOD_SPRITE_R * 2);
        }
        foodSpriteRef.current = fs;

        const { width, height } = windowSizeRef.current;
        causticPatchesRef.current = Array.from({ length: 24 }, () => ({
            cx: Math.random() * width,
            cy: Math.random() * height,
            ax: 40 + Math.random() * 100,
            fx: 0.00025 + Math.random() * 0.00035,
            px: Math.random() * Math.PI * 2,
            ay: 30 + Math.random() * 80,
            fy: 0.00018 + Math.random() * 0.0004,
            py: Math.random() * Math.PI * 2,
            r: 70 + Math.random() * 130,
            intensity: 0.045 + Math.random() * 0.055,
        }));
    }, []);

    // Customization State
    const [showLilyPads, setShowLilyPads] = useState(true);
    const [showLotus, setShowLotus] = useState(true);
    const [showBabyLotus, setShowBabyLotus] = useState(true);
    const [showRain, setShowRain] = useState(false); // Rain Toggle
    const [showParticles, setShowParticles] = useState(() => {
        const parsed = readJSON<{ natureParticles?: boolean } | null>(STORAGE_KEYS.ENHANCEMENTS, null);
        if (parsed) {
            return parsed.natureParticles ?? false;
        }
        return false;
    });
    const [showFeeding, setShowFeeding] = useState(true);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Caustic light patches
    interface CausticPatch {
        cx: number; cy: number;
        ax: number; fx: number; px: number;
        ay: number; fy: number; py: number;
        r: number; intensity: number;
    }
    const causticCanvasRef = useRef<HTMLCanvasElement>(null);
    const causticPatchesRef = useRef<CausticPatch[]>([]);
    const causticSpriteRef = useRef<HTMLCanvasElement | null>(null);
    const foodSpriteRef = useRef<HTMLCanvasElement | null>(null);
    const frameCountRef = useRef(0);

    // Particle System Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const gravityRef = useRef({ x: 0, y: 1 }); // Default gravity (down)

    // Listen for orientation changes to simulate gravity
    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null && e.beta !== null) {
                // gamma is left/right tilt [-90, 90]
                // beta is front/back tilt [-180, 180]
                const gx = e.gamma / 45; // Normalize to approx [-2, 2]
                const gy = Math.max(0.5, e.beta / 45); // Normalize to approx [0.5, 4], ensure always falls down
                gravityRef.current = { x: gx, y: gy };
            }
        };

        if (window.DeviceOrientationEvent && 'DeviceMotionEvent' in window) {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    // Ripple Helper
    const addRipple = useCallback((x: number, y: number) => {
        rippleLayerRef.current?.addRipple(x, y);
    }, []);

    const bgClass = 'bg-sage-mid'; // Consistent with app aesthetic

    // Sync ripples to ref for animation loop - REMOVED (Handled in layer)
    /*
    useEffect(() => {
        ripplesRef.current = ripples;
    }, [ripples]);
    */

    // Transition Effect: Fade in after mount (1.1s)
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        // Keep screen awake while pond is active
        KeepAwake.keepAwake().catch(console.error);

        return () => {
            clearTimeout(timer);
        };
    }, []);


    // Initialize Static Elements (Lotus & Petals)
    useEffect(() => {
        // Spawn 8 Lotus Flowers/Pads (Foreground) - Spread out
        const lotusCount = 8;
        const newLotuses: Lotus[] = [];

        // Define quadrants to ensure spread
        const quadrants = [
            { x: 0, y: 0 }, { x: window.innerWidth / 2, y: 0 },
            { x: 0, y: window.innerHeight / 2 }, { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        ];

        for (let i = 0; i < lotusCount; i++) {
            const quad = quadrants[i % 4];
            const qW = window.innerWidth / 2;
            const qH = window.innerHeight / 2;

            newLotuses.push({
                id: i,
                // Random pos within quadrant with padding
                x: quad.x + (Math.random() * (qW - 100) + 50),
                y: quad.y + (Math.random() * (qH - 100) + 50),
                scale: 0.8 + Math.random() * 0.4,
                rotation: Math.random() * 360,
                type: i % 2 === 0 ? 'lotus' : 'lilypad', // Force 50/50 split
                // Drift props
                driftDirection: Math.random() * Math.PI * 2,
                speed: (0.1 + Math.random() * 0.2) * 0.3 // Reduced by 70% per request
            });
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time procedural scene generation on mount, not derivable from props during render
        setLotuses(newLotuses);
        lotusesRef.current = newLotuses; // Sync Ref
    }, []);

    useEffect(() => {
        const count = 12;
        const colors = ['#EF5350', '#E57373', '#FF7043', '#FF8A65']; // Red and Orange shades

        const newDrifting: DriftingLotus[] = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight, // Initial random position
            rotation: Math.random() * 360,
            speed: (0.2 + Math.random() * 0.3) * 0.3, // Reduced by 70%
            delay: Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            scale: 0.6 + Math.random() * 0.3, // Larger scale for visibility (0.6 - 0.9)
            opacity: 0.8 + Math.random() * 0.2,
            driftDirection: Math.random() * Math.PI * 2 // Random direction
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time procedural scene generation on mount, not derivable from props during render
        setDriftingLotuses(newDrifting);
        driftingLotusesRef.current = newDrifting; // Sync Ref
    }, []);

    // Initialize Particles
    useEffect(() => {
        if (!showParticles) {
            particlesRef.current = [];
            return;
        }

        const count = 40;
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * -window.innerHeight,
            size: 5 + Math.random() * 8,
            speed: 0.2 + Math.random() * 0.4, // Reduced speed further for ethereal feel
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 1.0, // Slower rotation
            wiggle: Math.random() * Math.PI,
            wiggleSpeed: 0.005 + Math.random() * 0.01, // Slower wiggle
            color: `rgba(255, ${180 + Math.random() * 40}, ${190 + Math.random() * 40}, ${0.6 + Math.random() * 0.3})`
        }));
    }, [showParticles]);


    // 1. Spawning Logic REMOVED (No Fish)
    /*
    useEffect(() => {
        const spawnFish = (forceOnScreen = false) => {
            setFish(prev => {
                // ... logic removed ...
                return prev;
            });
        };
        // ...
    }, []); 
    */


    // Initialize Specific Koi Fish - STAGGERED SPAWN
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the fish scene when the unlocked count changes, procedural spawn can't run during render
        setFish([]); // Start empty

        if (fishCount === 0) return;

        // Select variants based on unlocked count
        const selectedVariants: Fish['variant'][] = Array.from({ length: fishCount }, () => KOI_VARIANTS[Math.floor(Math.random() * KOI_VARIANTS.length)]);

        // Create all fish immediately but set their 'active' status or spawn time
        const newFish = selectedVariants.map((variant, i) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.max(window.innerWidth, window.innerHeight) * 0.8;
            const startX = (window.innerWidth / 2) - Math.cos(angle) * radius;
            const startY = (window.innerHeight / 2) - Math.sin(angle) * radius;

            // Point towards center
            const angleToCenter = Math.atan2((window.innerHeight / 2) - startY, (window.innerWidth / 2) - startX);

            // SCALE: Reduced by 15% (Range ~1.28 - 2.3)
            const scale = 1.275 + Math.random() * 1.02;
            // Bigger fish move slower and heavier, smaller ones a touch quicker — the way
            // real koi scale with size — with jitter so it's a correlation, not a lookup
            // table. scaleT 0 = smallest fish in the range, 1 = biggest.
            const scaleT = (scale - 1.275) / 1.02;
            const speed = Math.max(0.55, (2.0 - scaleT * 1.2) + (Math.random() - 0.5) * 0.3);

            return {
                id: i,
                x: startX,
                y: startY,
                angle: angleToCenter,
                targetAngle: angleToCenter,
                speed,
                variant: variant,
                scale,
                spawnTime: i * 2000, // Stagger 2s
                isActive: false,
                tailPhase: i * 1.7, // per-fish offset so they don't sway in lockstep
                // Sway rate/amplitude rolled once per fish so two fish moving at the same
                // speed don't undulate in lockstep with each other.
                swayRateMult: 0.85 + Math.random() * 0.3,
                swayAmpMult: 0.85 + Math.random() * 0.3,
            };
        });

        setFish(newFish);
        fishRef.current = newFish;

    }, []);

    // Animation Loop
    const lastRippleTimeRef = useRef(0);
    const rainGapRef = useRef(400);
    const startTimeRef = useRef<number | null>(null);


    const animate = (time: number) => {
        if (startTimeRef.current === null) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        frameCountRef.current++;

        if (lastTimeRef.current !== undefined) {
            const delta = time - lastTimeRef.current;
            // Cap delta to prevent huge jumps if tab was inactive (e.g. max 50ms)
            const rawDt = Math.min(delta, 50) / 16.67;
            // Low-pass the timestep. A frame that arrives 3ms late would otherwise translate
            // straight into a 3ms-worth jump in position, which reads as a stutter even when
            // the frame itself was delivered. Smoothing trades exact time-accuracy (irrelevant
            // for ambient drift) for visibly even spacing between frames.
            dtSmoothRef.current += (rawDt - dtSmoothRef.current) * 0.25;
            const dt = dtSmoothRef.current;

            // Expired taps are shared by every fish, so filter once per frame rather than
            // rebuilding the array once per fish per frame.
            tapsRef.current = tapsRef.current.filter(t => time - t.time < 1000);

            // 1. Update Fish (Direct Manipulation)
            fishRef.current.forEach(f => {
                // Check Spawn Activation
                if (!f.isActive && f.spawnTime !== undefined) {
                    if (elapsed > f.spawnTime) {
                        f.isActive = true;
                    } else {
                        return; // Don't process or show yet
                    }
                }

                let { x, y, angle, targetAngle } = f;
                const speed = f.speed;

                // Vary speed by position: slow in open water, a little quicker near edges,
                // calmly quicker still offscreen — everything here reads as unhurried now,
                // where it used to ramp up to 2x and swim back "briskly".
                const { width, height } = windowSizeRef.current;
                const distFromEdge = Math.min(x, width - x, y, height - y);
                const offScreenNow = distFromEdge < 0;
                if (offScreenNow && !f.wasOffScreen) {
                    // Fresh trip off-screen — roll new return characteristics so this
                    // swim-back doesn't look identical to the last one.
                    f.offscreenSpeedMult = 1.15 + Math.random() * 0.3; // 1.15–1.45, was a flat 2.0
                    f.offscreenTurnRate = 0.022 + Math.random() * 0.014; // 0.022–0.036, was a flat 0.05
                    f.offscreenWobbleAmp = 0.3 + Math.random() * 0.35;
                    f.offscreenWobbleFreq = 0.0006 + Math.random() * 0.0006;
                    f.offscreenWobblePhase = Math.random() * Math.PI * 2;
                }
                f.wasOffScreen = offScreenNow;

                let speedMultiplier: number;
                if (offScreenNow) {
                    speedMultiplier = f.offscreenSpeedMult ?? 1.3;
                } else if (distFromEdge < 100) {
                    speedMultiplier = 1.0 + (1 - distFromEdge / 100) * 0.5; // gentler ramp, was up to 2x
                } else {
                    speedMultiplier = 0.6; // open water, slow, meditative glide
                }
                const moveSpeed = speed * dt * speedMultiplier;

                // --- Repulsion Logic --- (tap list already pruned once per frame above)
                let repulsionAngle = 0;
                let repulsionStrength = 0;
                const REPULSION_RADIUS = 200;


                tapsRef.current.forEach(tap => {
                    const dx = x - tap.x;
                    const dy = y - tap.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < REPULSION_RADIUS * REPULSION_RADIUS) {
                        const dist = Math.sqrt(distSq);
                        const force = (1 - dist / REPULSION_RADIUS) * 0.1; // Gentle force
                        const angleToTap = Math.atan2(dy, dx);

                        // Add steering away from tap
                        repulsionAngle = angleToTap;
                        repulsionStrength = Math.max(repulsionStrength, force);
                    }
                });

                if (repulsionStrength > 0) {
                    // Gently rotate towards the repulsion angle
                    let angleDiff = repulsionAngle - angle;
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    angle += angleDiff * repulsionStrength * dt;

                    // Slight speed boost when repelled
                    x += Math.cos(angle) * (moveSpeed + repulsionStrength * 5 * dt);
                    y += Math.sin(angle) * (moveSpeed + repulsionStrength * 5 * dt);
                } else {
                    // --- Food Attraction Logic (Calm & Natural) ---
                    // Reset target if it no longer exists
                    if (f.targetFoodId !== null && f.targetFoodId !== undefined) {
                        if (!foodRef.current.some(p => p.id === f.targetFoodId)) {
                            f.targetFoodId = null;
                        }
                    }

                    // Find a target if we don't have one
                    if (f.targetFoodId === null || f.targetFoodId === undefined) {
                        let closestAvailableFood: FoodPellet | null = null;
                        let minDist = 300; // Scent range

                        (foodRef.current as FoodPellet[]).forEach(pellet => {
                            if (pellet.isClaimed) return; // No fighting!
                            const dx = pellet.x - x;
                            const dy = pellet.y - y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < minDist) {
                                minDist = dist;
                                closestAvailableFood = pellet;
                            }
                        });

                        if (closestAvailableFood) {
                            f.targetFoodId = (closestAvailableFood as FoodPellet).id;
                            (closestAvailableFood as FoodPellet).isClaimed = true;
                        }
                    }

                    // Move towards target if we have one
                    if (f.targetFoodId !== null && f.targetFoodId !== undefined) {
                        const targetFood = (foodRef.current as FoodPellet[]).find(p => p.id === f.targetFoodId);
                        if (targetFood) {
                            const dx = targetFood.x - x;
                            const dy = targetFood.y - y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const angleToFood = Math.atan2(dy, dx);

                            let angleDiff = angleToFood - angle;
                            while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                            // 1. Smooth Steering: slower still than before (was 0.05) for an
                            // unhurried, patient turn toward the food rather than a snap-to.
                            angle += angleDiff * 0.028 * dt;

                            // 2. Gentle Approach: Slow down as we get closer (Tranquil, not rushed)
                            // Ease in speed from 100% at distance 150 to ~40% at distance 20
                            const approachFactor = Math.max(0.4, Math.min(1.0, dist / 150));
                            const finalMoveSpeed = moveSpeed * approachFactor;

                            // No speed boost on approach anymore — a fish hurrying toward food
                            // fought the "ease, flow, patience" the pond is meant to feel like.
                            x += Math.cos(angle) * finalMoveSpeed;
                            y += Math.sin(angle) * finalMoveSpeed;

                            // "Eating" detection
                            if (dist < 15) {
                                f.isEating = true;
                                f.eatTimer = 12; // Shorter, more immediate wiggle
                                f.targetFoodId = null;
                                foodRef.current = (foodRef.current as FoodPellet[]).filter(p => p.id !== targetFood.id);
                                haptics.light();

                                // Reset momentum slightly during eating for a "pause" feel
                                f.speed = Math.max(0.5, f.speed * 0.8);
                            }
                        } else {
                            f.targetFoodId = null;
                            x += Math.cos(angle) * moveSpeed;
                            y += Math.sin(angle) * moveSpeed;
                        }
                    } else if (f.isPausing) {
                        // Mid-pause: a faint drift, not a hard stop — reads as the fish
                        // holding still in the water rather than freezing.
                        x += Math.cos(angle) * moveSpeed * 0.08;
                        y += Math.sin(angle) * moveSpeed * 0.08;
                        f.pauseTimer = (f.pauseTimer ?? 0) - dt;
                        if (f.pauseTimer <= 0) f.isPausing = false;
                    } else {
                        // Normal wandering, with a rare, brief drift-to-stillness in open
                        // water — reinforces patience rather than the fish being
                        // perpetually mid-swim. Never triggers near an edge or while food
                        // is being pursued (this branch only runs for neither).
                        if (distFromEdge > 150 && Math.random() < 0.0006) {
                            f.isPausing = true;
                            f.pauseTimer = 90 + Math.random() * 120; // ~1.5-3.5s of held stillness
                        }
                        x += Math.cos(angle) * moveSpeed;
                        y += Math.sin(angle) * moveSpeed;
                    }

                    if (f.isEating && f.eatTimer && f.eatTimer > 0) {
                        // Much more subtle wiggle, no delay
                        angle += Math.sin(time * 0.15) * 0.04;
                        f.eatTimer -= 1;
                        if (f.eatTimer <= 0) {
                            f.isEating = false;
                            // Restore speed gradually after wiggle
                            f.speed = f.speed + (1.2 - f.speed) * 0.1;
                        }
                    }
                }

                // --- Normal Wall/Straight Logic ---
                const margin = 200;
                const isOffScreen = x < -margin || x > width + margin || y < -margin || y > height + margin;

                if (isOffScreen) {
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const angleToCenter = Math.atan2(centerY - y, centerX - x);
                    // Wobble amplitude/frequency and turn rate are rolled fresh per trip above,
                    // so the path back on-screen varies instead of retracing the same curve
                    // every time — and the turn itself is slower (was a flat 0.05).
                    targetAngle = angleToCenter + (Math.sin(time * (f.offscreenWobbleFreq ?? 0.0009) + (f.offscreenWobblePhase ?? f.id)) * (f.offscreenWobbleAmp ?? 0.45));
                    let angleDiff = targetAngle - angle;
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    angle += angleDiff * (f.offscreenTurnRate ?? 0.028) * dt;
                }

                // Update Data Object
                f.x = x;
                f.y = y;
                f.angle = angle;
                f.targetAngle = targetAngle;

                // Update DOM Direct
                const el = fishElementsRef.current.get(f.id);
                if (el) {
                    // Fade in once on activation rather than re-writing opacity every frame.
                    if (!f.didFadeIn) { el.style.opacity = '1'; f.didFadeIn = true; }
                    el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotate(${angle * (180 / Math.PI) + 90}deg) scale(${f.scale})`;

                    // Tail/fin sway on the SAME clock as the body, at a rate gently coupled to how
                    // fast this fish is actually moving. Previously these were CSS @keyframes on a
                    // separate free-running clock, so a fish drifting through open water swayed at
                    // exactly the same rate as one darting back on-screen.
                    //
                    // PACING: a real koi's tail is a slow, lazy undulation, not a flick. Base
                    // period is ~4s per full sway, stretching to ~4.4s in open water and only
                    // tightening to ~3.2s when the fish is actually moving briskly. sin() is
                    // used directly because its velocity is zero at the extremes and greatest
                    // mid-stroke, which is the natural ease-in-out of a real tail stroke.
                    // Amplitude stays modest (+/-13deg) so it reads as a sway, not a twitch.
                    //
                    // PHASE MUST ACCUMULATE, NOT BE RECOMPUTED FROM ABSOLUTE TIME: this used to be
                    // `time * TAIL_BASE_OMEGA * currentSpeedFactor`, recomputed fresh every frame.
                    // speedMultiplier changes constantly as the fish moves between open water and
                    // pond edges, and multiplying a *changing* rate by the *absolute* elapsed time
                    // makes the phase jump every time the rate changes (by time * omega * delta-
                    // factor, which grows the longer the pond has been open) instead of smoothly
                    // changing its speed of change. That's what read as flickering/snapping rather
                    // than swimming. Stepping the phase by a small increment each frame keeps it
                    // continuous no matter how often the rate changes.
                    // swayRateMult/swayAmpMult are rolled once per fish at spawn, so two fish
                    // moving at the same speed still don't sway in lockstep with each other.
                    const swayRate = f.swayRateMult ?? 1;
                    const swayAmp = f.swayAmpMult ?? 1;
                    const angularStep = TAIL_BASE_OMEGA * (0.75 + speedMultiplier * 0.25) * swayRate * dt * 16.6667;
                    f.tailPhase = (f.tailPhase ?? 0) + angularStep;
                    const beat = f.tailPhase;
                    el.style.setProperty('--koi-tail', `${Math.sin(beat) * 13 * swayAmp}deg`);
                    // Pectoral fins paddle even slower than the tail, and slightly out of phase.
                    el.style.setProperty('--koi-fin-l', `${16 + Math.sin(beat * 0.55) * 15 * swayAmp}deg`);
                    el.style.setProperty('--koi-fin-r', `${-16 - Math.sin(beat * 0.55 + 0.7) * 15 * swayAmp}deg`);
                }
            });

            // 2. Update Drifting Baby Lotuses - FLOW DOWN
            driftingLotusesRef.current.forEach(l => {
                // Flow down (Positive Y) with slight sine wave on X
                let nx = l.x + Math.sin(time * 0.0005 + l.id) * 0.2 * dt;
                let ny = l.y + (l.speed * 0.8) * dt; // Consistent down flow

                // Wrap
                if (ny > windowSizeRef.current.height + 50) {
                    ny = -50;
                    nx = Math.random() * windowSizeRef.current.width;
                }

                l.x = nx;
                l.y = ny;

                const el = driftingElementsRef.current.get(l.id);
                if (el) {
                    el.style.transform = `translate3d(${nx}px, ${ny}px, 0) rotate(${l.rotation}deg) scale(${l.scale})`;
                }
            });

            // 3. Update MAIN Foreground Lotuses & Lily Pads - FLOW DOWN
            lotusesRef.current.forEach(l => {
                // Flow down but VERY slow with a gentle side-to-side sway
                let nx = l.x + Math.sin(time * 0.0003 + l.id) * 0.15 * dt;
                let ny = l.y + (l.speed * 0.4) * dt;

                // Wrap
                if (ny > windowSizeRef.current.height + 60) {
                    ny = -60;
                    nx = Math.random() * windowSizeRef.current.width;
                }
                if (nx > windowSizeRef.current.width + 60) nx = -60;
                if (nx < -60) nx = windowSizeRef.current.width + 60;

                l.x = nx;
                l.y = ny;

                const el = lotusElementsRef.current.get(l.id);
                if (el) {
                    el.style.transform = `translate3d(${nx}px, ${ny}px, 0) rotate(${l.rotation + Math.sin(time * 0.0001 + l.id) * 5}deg) scale(${l.scale})`;
                }
            });

            // 3.5 Caustic light shimmer.
            // Redrawn on every other frame only: the patches oscillate at ~0.0002 rad/ms, so a
            // 30Hz update is indistinguishable from 60Hz and halves the fill cost.
            const cCanvas = causticCanvasRef.current;
            const cSprite = causticSpriteRef.current;
            if (cCanvas && cSprite && frameCountRef.current % 2 === 0) {
                const ctx = cCanvas.getContext('2d');
                if (ctx) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
                    // Work in CSS pixels; the backing store is half-size.
                    ctx.setTransform(CAUSTIC_SCALE, 0, 0, CAUSTIC_SCALE, 0, 0);
                    causticPatchesRef.current.forEach(p => {
                        const x = p.cx + p.ax * Math.sin(time * p.fx + p.px);
                        const y = p.cy + p.ay * Math.sin(time * p.fy + p.py);
                        const xRad = p.r * (0.85 + 0.15 * Math.sin(time * 0.0002 + p.px));
                        const yRad = p.r * 0.55 * (0.85 + 0.15 * Math.cos(time * 0.00015 + p.py));
                        const tilt = Math.sin(time * 0.0001 + p.px) * 0.6;
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(tilt);
                        ctx.scale(1, yRad / xRad);
                        ctx.globalAlpha = p.intensity;
                        ctx.drawImage(cSprite, -xRad, -xRad, xRad * 2, xRad * 2);
                        ctx.restore();
                    });
                }
            }

            // 4. Update Sakura Particles (Canvas)
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    // Draw Food Pellets (Pale Gold) from the pre-baked glow sprite.
                    const fSprite = foodSpriteRef.current;
                    if (fSprite) {
                        foodRef.current.forEach(p => {
                            const r = p.size * 3;
                            ctx.drawImage(fSprite, p.x - r, p.y - r, r * 2, r * 2);
                        });
                    }

                    if (showParticlesRef.current) {
                        const gx = gravityRef.current.x;
                        const gy = gravityRef.current.y;
                        const { width: winW, height: winH } = windowSizeRef.current;

                        particlesRef.current.forEach(p => {
                            p.wiggle += p.wiggleSpeed;
                            p.x += (Math.sin(p.wiggle) * 0.5 + gx) * dt;
                            p.y += (p.speed * gy) * dt;
                            p.rotation += p.rotSpeed * dt;

                            if (p.y > winH + 20) {
                                p.y = -20;
                                p.x = Math.random() * winW;
                            }
                            if (p.x > winW + 20) p.x = -20;
                            if (p.x < -20) p.x = winW + 20;

                            ctx.save();
                            ctx.translate(p.x, p.y);
                            ctx.rotate(p.rotation * Math.PI / 180);

                            // Draw Sakura Petal
                            ctx.beginPath();
                            ctx.fillStyle = p.color;
                            ctx.moveTo(0, 0);
                            ctx.bezierCurveTo(p.size, -p.size, p.size * 2, p.size, 0, p.size * 1.5);
                            ctx.bezierCurveTo(-p.size * 2, p.size, -p.size, -p.size, 0, 0);
                            ctx.fill();

                            ctx.restore();
                        });
                    }
                }
            }

            // Ripple Spawning logic (Rain).
            // This is now the ONLY rain spawner. There used to be a second, independent
            // setInterval(100ms) doing the same job, so rain produced roughly twice the
            // intended droplets and each ripple costs a React state update in RippleLayer.
            // Intervals are also not vsync-aligned, so a droplet could mount mid-frame.
            if (showRainRef.current && time - lastRippleTimeRef.current > rainGapRef.current) {
                // eslint-disable-next-line react-hooks/purity -- inside the imperative rAF animation loop, not React render
                addRipple(Math.random() * windowSizeRef.current.width, Math.random() * windowSizeRef.current.height);
                lastRippleTimeRef.current = time;
                // Jitter the next gap so the rain sounds/looks sporadic rather than metronomic.
                // eslint-disable-next-line react-hooks/purity -- inside the imperative rAF animation loop, not React render
                rainGapRef.current = 260 + Math.random() * 420;
            }
        }

        lastTimeRef.current = time;
        // Rescheduling is owned by the mount effect below, so the loop always re-enters through
        // the current closure instead of pinning whichever one started it.
    };

    // The loop reads these through refs so it can be started exactly once. It used to depend on
    // [showRain], which meant (a) toggling "Nature Particles" did nothing until rain was also
    // toggled, because the running closure still held the old showParticles, and (b) every
    // restart left a stale lastTimeRef behind, producing one oversized dt and a visible lurch.
    const showRainRef = useRef(showRain);
    const showParticlesRef = useRef(showParticles);
    useEffect(() => { showRainRef.current = showRain; }, [showRain]);
    useEffect(() => { showParticlesRef.current = showParticles; }, [showParticles]);

    const animateRef = useRef(animate);
    animateRef.current = animate;

    useEffect(() => {
        const tick = (t: number) => {
            animateRef.current(t);
            requestRef.current = requestAnimationFrame(tick);
        };
        requestRef.current = requestAnimationFrame(tick);

        // Coming back from the background leaves a stale lastTime behind. Without this the first
        // frame after resuming computes a huge delta, clamps it, and jumps every element forward
        // at once, which is the lurch you see on returning to the pond.
        const onVisibility = () => {
            if (!document.hidden) {
                lastTimeRef.current = undefined;
                dtSmoothRef.current = 1;
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    // 3. Pond audio: plays the user's saved "koi pond vibes" mix (multiple looping
    //    layers at 40% master volume). Each layer loops seamlessly (baked files or
    //    procedurally-rendered synth blobs). Falls back to a single river track if the
    //    mix isn't found, so the pond is never silent.
    const tracksRef = useRef<Array<{ layer: PondLayer; targetVol: number }>>([]);
    const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const MASTER_VOLUME = 0.40;          // user-requested 40% overall
    const FALLBACK_SRC = '/sounds/flowing-river.m4a';
    const FALLBACK_VOLUME = 0.10;        // calm default when no mix is saved

    // Every other ambient-audio surface in the app (SoundMixer.tsx) went through a
    // hardening pass for AVAudioSession interruptions (a notification sound, Siri,
    // a call, another app taking audio) and media-services resets: see
    // PalanteAudioBridge.swift and project memory on the soundscape dropout. The
    // pond's own audio never got that pass — it plays through the same Web Audio
    // graph but never told the native side it wants the session, and never
    // listened for an interruption ending. iOS does not resume playback on its
    // own, so any interruption while the pond is open left it silent for the rest
    // of the visit with nothing to explain why. That gap, not a loop seam, is the
    // most likely reason a "soundscape dropout" can still be reproduced here after
    // SoundMixer's own dropout was fixed.
    useEffect(() => {
        let cancelled = false;
        let interruptionHandle: PluginListenerHandle | null = null;

        // Resolve the saved mix into layer specs. Synth ids (noise/binaural) have
        // no file and are played by SynthVoice; file ids map via SOUND_SOURCES.
        type Spec = { kind: 'file'; src: string; vol: number } | { kind: 'synth'; id: string; vol: number };
        const buildSpecs = (): Spec[] => {
            const mix = (savedMixes || []).find(
                m => m.name?.trim().toLowerCase() === POND_MIX_NAME
            );
            const entries = mix ? Object.entries(mix.volumes || {}).filter(([, v]) => v > 0) : [];
            if (!entries.length) return [{ kind: 'file', src: FALLBACK_SRC, vol: FALLBACK_VOLUME }];

            const out: Spec[] = [];
            for (const [id, raw] of entries) {
                const vol = Math.max(0, Math.min(1, raw)) * MASTER_VOLUME;
                if (vol <= 0) continue;
                if (isSynthSound(id)) {
                    out.push({ kind: 'synth', id, vol });
                } else if (SOUND_SOURCES[id]) {
                    // A sound removed from the library since the mix was saved
                    // simply drops out, rather than taking the pond down with it.
                    out.push({ kind: 'file', src: SOUND_SOURCES[id], vol });
                }
            }
            return out.length ? out : [{ kind: 'file', src: FALLBACK_SRC, vol: FALLBACK_VOLUME }];
        };

        const teardownLayers = () => {
            if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
            tracksRef.current.forEach(({ layer }) => layer.stop());
            tracksRef.current = [];
        };

        // Builds every layer at volume 0 and fades the group in together. Used
        // both for the initial mount and, unchanged, to rebuild from scratch after
        // a confirmed interruption end or media-services reset — the same
        // full-teardown-and-replay approach as MixerSound.recover() in
        // SoundMixer.tsx, for the same reason: a graph that reports itself healthy
        // after an interruption is exactly the state that produced silence nobody
        // could account for, so nothing here trusts a bare resume().
        const buildLayers = async () => {
            const ctx = getAudioContext();
            if (!ctx || cancelled) return;
            if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

            for (const spec of buildSpecs()) {
                if (cancelled) break;
                // Every layer starts silent; the group fade below brings them up
                // together, exactly as the old element version did.
                let layer: PondLayer | null = null;
                if (spec.kind === 'synth') {
                    const voice = new SynthVoice(SYNTH_SOUNDS[spec.id]);
                    await voice.play(ctx, 0, getMasterLimiter(ctx)).catch(() => {});
                    layer = synthLayer(ctx, voice);
                } else {
                    const handle = await startLoop({ src: spec.src, volume: 0, entrySec: 0.01 });
                    if (handle) layer = fileLayer(handle);
                }
                if (!layer) continue;
                if (cancelled) { layer.stop(); break; }
                layer.setVolume(0, true);
                tracksRef.current.push({ layer, targetVol: spec.vol });
            }

            if (cancelled || isMutedRef.current) return;
            // Gentle ~3s fade-in for every layer together.
            let t = 0;
            const steps = 30;
            fadeIntervalRef.current = setInterval(() => {
                t = Math.min(t + 1, steps);
                const k = t / steps;
                tracksRef.current.forEach(({ layer, targetVol }) => {
                    layer.setVolume(isMutedRef.current ? 0 : targetVol * k, true);
                });
                if (t >= steps) {
                    clearInterval(fadeIntervalRef.current!);
                    fadeIntervalRef.current = null;
                }
            }, 100);
        };

        void buildLayers();

        // Claim the AVAudioSession the same way SoundMixer does: `.playback` +
        // `mixWithOthers`, activated once and left alone. Without this the pond's
        // audio rides whatever category WKWebView happened to default to, which
        // never gets the interruption-recovery or backgrounding treatment the rest
        // of the app relies on. Goes through the shared reference-counted claim
        // (audioSessionClaim.ts), not a direct setPlaying() call: a Soundscape mix
        // can be left running in the background while the user is on the pond, and
        // a direct call here would deactivate the session out from under it the
        // moment the pond unmounts.
        const releaseSessionClaim = claimAudioSession();

        PalanteAudioBridge.addListener('audioInterruption', (event) => {
            if (event.state === 'began') return; // playback is already stopped
            // Both an interruption ending and a media-services reset are handled
            // the same way here: tear down and rebuild. A reset invalidates every
            // node built before it outright, and an ended interruption is not
            // trusted to have left a genuinely resumable graph either — see the
            // comment on buildLayers above.
            teardownLayers();
            void buildLayers();
        }).then(h => {
            if (cancelled) void h.remove();
            else interruptionHandle = h;
        }).catch(() => {});

        return () => {
            cancelled = true;
            void interruptionHandle?.remove();
            releaseSessionClaim();
            teardownLayers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleMute = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !isMutedRef.current;
        setIsMuted(newState);
        isMutedRef.current = newState;
        haptics.selection();

        const tracks = tracksRef.current;
        if (!tracks.length) return;
        if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }

        if (newState) {
            tracks.forEach(({ layer }) => { layer.setVolume(0, true); });
        } else {
            // Fade every layer back to its target together.
            let step = 0;
            const steps = 15;
            fadeIntervalRef.current = setInterval(() => {
                step = Math.min(step + 1, steps);
                const k = step / steps;
                tracks.forEach(({ layer, targetVol }) => { layer.setVolume(targetVol * k, true); });
                if (step >= steps) {
                    clearInterval(fadeIntervalRef.current!);
                    fadeIntervalRef.current = null;
                }
            }, 50);
        }
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        haptics.light();
        if (showFeedHint) dismissFeedHint();
        const touches = e.touches;

        if (showFeeding && touches.length === 1) {
            // Drop food
            const x = touches[0].clientX;
            const y = touches[0].clientY;
            foodRef.current.push({
                id: nextFoodIdRef.current++,
                x,
                y,
                // eslint-disable-next-line react-hooks/purity -- inside a touch event handler, not React render
                size: 3 + Math.random() * 2
            });
            // Also add a small ripple for visual feedback
            addRipple(x, y);
        } else {
            // Repel fish (Classic interaction)
            // Add ripples for all active fingers
            // eslint-disable-next-line react-hooks/purity -- inside a touch event handler, not React render
            const now = performance.now();
            for (let i = 0; i < touches.length; i++) {
                const x = touches[i].clientX;
                const y = touches[i].clientY;
                addRipple(x, y);
                tapsRef.current.push({ x, y, time: now });
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        if (showFeedHint) dismissFeedHint();

        const x = e.clientX;
        const y = e.clientY;

        if (showFeeding) {
            // Drop food
            foodRef.current.push({
                id: nextFoodIdRef.current++,
                x,
                y,
                // eslint-disable-next-line react-hooks/purity -- inside a mouse event handler, not React render
                size: 3 + Math.random() * 2
            });
            // Visual feedback
            addRipple(x, y);
            haptics.light();
        } else {
            // Always add ripple and repulsion for mouse/single-tap feedback
            addRipple(x, y);
            // eslint-disable-next-line react-hooks/purity -- inside a mouse event handler, not React render
            tapsRef.current.push({ x, y, time: performance.now() });
        }
    };

    // Rain droplet spawning lives in the rAF loop now (see "Ripple Spawning logic" above).
    // The setInterval that used to be here ran a second, unsynchronised spawner on top of it.



    return (
        // Wrapper starts Black, transitions content opacity
        <div
            className="fixed inset-0 z-50 bg-black/20 transition-colors duration-[1100ms] overflow-hidden cursor-pointer"
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
        >

            {/* Main Content Container - Fades In. Was 3000ms: a real reveal should
                commit quickly and let the pond's own ambient motion carry the calm
                afterward, rather than making the user wait through mostly-empty
                screen time for the calm to even begin. */}
            <div className={`absolute inset-0 transition-opacity duration-[1100ms] ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${bgClass}`}>

                {/* Animation Styles */}
                <style>{`
                    @keyframes swimFlex {
                        0% { transform: rotate(0deg) skewY(0deg); }
                        25% { transform: rotate(3deg) skewY(2deg); } 
                        75% { transform: rotate(-3deg) skewY(-2deg); }
                        100% { transform: rotate(0deg) skewY(0deg); }
                    }
                    /* swimTail / paddleFins / finFlutterLeft / finFlutterRight / finRingRipple
                       removed. Tail and fin rotation is now driven from the rAF loop via CSS
                       custom properties so it shares one clock with the body. finRingRipple was
                       animating stroke-width, which is not compositable and forced an SVG repaint
                       every frame per fish, for two rings at 0.05 opacity.
                       swimTail is kept only for the one-off celebration card, which sits on a
                       solid scrim and is not part of the live scene. */
                    @keyframes swimTail {
                         0% { transform: rotate(15deg); }
                         100% { transform: rotate(-15deg); }
                    }
                    @keyframes ripple {
                        0% { transform: scale(0); opacity: 0.5; }
                        100% { transform: scale(4); opacity: 0; }
                    }
                    @keyframes floatLilyPad {
                        0% { transform: translate(0, 0) rotate(0deg) scale(1); }
                        33% { transform: translate(5px, -10px) rotate(2deg) scale(1.02); }
                        66% { transform: translate(-8px, 5px) rotate(-2deg) scale(0.98); }
                        100% { transform: translate(0, 0) rotate(0deg) scale(1); }
                    }
                `}</style>

                {/* 0. Background Circles Layer (Logo ONLY) */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-100 z-0 flex items-center justify-center">
                    {/* Logo */}
                    {/* Logo */}
                    <div
                        className="absolute w-[8vmin] h-[8vmin] opacity-10 z-10 text-pale-gold animate-pulse-slow"
                    >
                        <div className="w-full h-full bg-pale-gold" style={{ maskImage: `url(/logo-gold.png)`, WebkitMaskImage: `url(/logo-gold.png)`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
                    </div>
                </div>

                {/* 0.5 AMBIENT RIPPLES - Gentle current from top to bottom (Z-2) */}
                <div className="absolute inset-0 pointer-events-none z-[2] opacity-30 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-white/20"
                            style={{
                                left: `${20 + i * 30}%`,
                                top: '-20%',
                                width: '60vw',
                                height: '20vh',
                                animation: `ambientRippleDrift ${15 + i * 5}s linear infinite`,
                                animationDelay: `${i * 3}s`
                            }}
                        />
                    ))}
                    <style>{`
                        @keyframes ambientRippleDrift {
                            0% { transform: translateY(0) scale(1); opacity: 0; }
                            10% { opacity: 0.3; }
                            90% { opacity: 0.3; }
                            100% { transform: translateY(120vh) scale(1.5); opacity: 0; }
                        }
                    `}</style>
                </div>

                {/* 0.7 Caustic light shimmer canvas (Z-3) */}
                <canvas
                    ref={causticCanvasRef}
                    width={Math.round(window.innerWidth * CAUSTIC_SCALE)}
                    height={Math.round(window.innerHeight * CAUSTIC_SCALE)}
                    className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
                    style={{ mixBlendMode: 'screen' }}
                />

                {/* 1. Fish Layer (Z-5) - Moved OUT of Background Layer context */}
                {showFish && fish.map(f => (
                    <div
                        key={f.id}
                        ref={el => {
                            if (el) fishElementsRef.current.set(f.id, el);
                            else fishElementsRef.current.delete(f.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            // Use transform for initial positioning (offscreen) to match Physics loop
                            transform: `translate(-50%, -50%) translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.angle * (180 / Math.PI) + 90}deg) scale(${f.scale})`,
                            opacity: 0, // Start invisible, fade in via loop or transition
                            zIndex: 5,
                            pointerEvents: 'none',
                            // remove transition to prevent fighting with JS loop
                            transition: 'opacity 0.5s ease-in-out',
                            // NO CSS `filter` here: the SVG children repaint every frame, which
                            // would force a blurred drop-shadow surface to be re-rasterized each
                            // time. The shadow is drawn inside the SVG instead.
                            willChange: 'transform',
                        }}
                    >
                        <KoiFishSVG variant={f.variant} shadowStrength={SHADOW_TIERS[f.id % SHADOW_TIERS.length]} />
                    </div>
                ))}

                {/* 2. Lily Pads Layer (Background Images) - NOW SIBLING Z-10 */}
                {/* This fixes the stacking context issue. Now Z-10 > Z-5 definitively. */}
                {showLilyPads && (
                    /* The drop-shadow used to live on this full-viewport `inset-0` container.
                       Because the three images inside animate continuously, that made WebKit
                       re-rasterize a screen-sized blurred filter surface on every frame, and it
                       also prevented the children from being promoted to compositor layers.
                       The shadow now sits on each image, where it is bounded by the image box
                       and can be cached in that image's own layer. */
                    <div className="absolute inset-0 opacity-80 z-[10] pointer-events-none transition-opacity duration-1000">
                        {/* Top Right */}
                        <div className={`absolute top-0 right-0 w-[80vmin] h-[80vmin] translate-x-1/3 -translate-y-1/3 rotate-12`}>
                            <img src="/assets/lily-pads.png" alt="" className="w-full h-full object-contain" style={{ animation: 'floatLilyPad 25s ease-in-out infinite', filter: 'drop-shadow(8px 8px 6px rgba(0,0,0,0.4))', willChange: 'transform' }} />
                        </div>
                        {/* Bottom Left */}
                        <div className={`absolute bottom-0 left-0 w-[65vmin] h-[65vmin]-translate-x-1/3 translate-y-1/3 -rotate-45`}>
                            <img src="/assets/lily-pads.png" alt="" className="w-full h-full object-contain" style={{ animation: 'floatLilyPad 30s ease-in-out infinite reverse', filter: 'drop-shadow(8px 8px 6px rgba(0,0,0,0.4))', willChange: 'transform' }} />
                        </div>
                        {/* Center */}
                        <div className={`absolute top-1/2 left-1/2 w-[50vmin] h-[50vmin]-translate-x-1/2 -translate-y-1/2 rotate-180`}>
                            <img src="/assets/lily-pads.png" alt="" className="w-full h-full object-contain" style={{ animation: 'floatLilyPad 35s ease-in-out infinite', filter: 'drop-shadow(8px 8px 6px rgba(0,0,0,0.4))', willChange: 'transform' }} />
                        </div>
                    </div>
                )}


                {/* 3. Ripples (Surface - Z-20) */}
                <RippleLayer ref={rippleLayerRef} isDarkMode={isDarkMode} />

                {/* 4. Drifting Baby Lotus (Z-15) */}
                {showBabyLotus && driftingLotuses.map(l => (
                    <div
                        key={l.id}
                        ref={el => {
                            if (el) driftingElementsRef.current.set(l.id, el);
                            else driftingElementsRef.current.delete(l.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            // Matches the loop format exactly: no jump on first frame
                            transform: `translate3d(${l.x}px, ${l.y}px, 0) rotate(${l.rotation}deg) scale(${l.scale})`,
                            opacity: l.opacity * 0.9,
                            pointerEvents: 'none',
                            zIndex: 15,
                            transition: 'opacity 1s ease-in-out',
                            // Filter removed: 12 of these move every frame, and a blurred filter
                            // surface per element is 12 re-rasterizations per frame for a shadow
                            // that reads at 0.2 alpha behind a 40px flower.
                            willChange: 'transform',
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 100 100" className="opacity-90 overflow-visible">
                            <g transform="translate(50,50)">
                                {/* Petals */}
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                    <g key={deg} transform={`rotate(${deg})`}>
                                        <path d="M0,0 Q15,-20 0,-40 Q-15,-20 0,0" fill={l.color} />
                                        <path d="M0,0 Q10,-15 0,-30 Q-10,-15 0,0" fill={l.color} style={{ filter: 'brightness(1.1)' }} />
                                    </g>
                                ))}
                                <circle cx="0" cy="0" r="12" fill="#FFEB3B" />
                                <circle cx="0" cy="0" r="8" fill="#FBC02D" />
                            </g>
                        </svg>
                    </div>
                ))}

                {/* 5. Generated Lily Pads (Z-10) */}
                {showLilyPads && lotuses.filter(l => l.type === 'lilypad').map(l => (
                    <div
                        key={l.id}
                        ref={el => {
                            // Was missing entirely: the physics loop below already mutates
                            // every lotus (both types) via lotusElementsRef.current.get(l.id)
                            // every frame, but with no ref registered here that lookup always
                            // returned undefined and silently no-opped for lily pads. They only
                            // moved when React happened to re-render for an unrelated reason
                            // (a tap, a hint timer), which dumped several frames of accumulated
                            // drift into one jump — the "catching up to itself" stutter.
                            if (el) lotusElementsRef.current.set(l.id, el);
                            else lotusElementsRef.current.delete(l.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            // Matches the loop format exactly (no centering offset): the loop
                            // writes translate3d(x,y,0) rotate(...) scale(...) verbatim, same
                            // as the Lotus layer below.
                            transform: `translate3d(${l.x}px, ${l.y}px, 0) rotate(${l.rotation}deg) scale(${l.scale})`,
                            opacity: 0.85,
                            zIndex: 10,
                            // Filter dropped: now rAF-transformed every frame same as the Lotus
                            // layer below, so a per-frame blurred drop-shadow surface is the
                            // same real cost that layer's own comment already calls out.
                            willChange: 'transform',
                        }}
                    >
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M30 5C30 5 55 5 55 30C55 55 30 55 30 55C30 55 5 55 5 30C5 20 10 10 18 8L30 30L30 5Z" fill="#8BA888" />
                        </svg>
                    </div>
                ))}

                {/* 3. Lotus Layer (Foreground) */}
                {showLotus && lotuses.filter(l => l.type === 'lotus').map(l => (
                    <div
                        key={l.id}
                        ref={el => {
                            if (el) lotusElementsRef.current.set(l.id, el);
                            else lotusElementsRef.current.delete(l.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            // Matches the loop format exactly: no jump on first frame
                            transform: `translate3d(${l.x}px, ${l.y}px, 0) rotate(${l.rotation}deg) scale(${l.scale})`,
                            opacity: 0.95,
                            zIndex: 20,
                            // Filter removed: these are rAF-transformed every frame and the shadow
                            // was 0.08 alpha, i.e. a per-frame blur pass for something invisible.
                            willChange: 'transform',
                        }}
                    >
                        <svg width="80" height="80" viewBox="0 0 100 100" className="overflow-visible">
                            <g transform="translate(50,50)">
                                {/* Petals */}
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                    <g key={deg} transform={`rotate(${deg})`}>
                                        <path d="M0,0 Q20,-25 0,-45 Q-20,-25 0,0" fill={isDarkMode ? "#E8D5B5" : "#F48FB1"} fillOpacity="0.95" />
                                        <path d="M0,0 Q12,-18 0,-35 Q-12,-18 0,0" fill={isDarkMode ? "#D4B896" : "#F06292"} fillOpacity="0.85" />
                                    </g>
                                ))}
                                <circle cx="0" cy="0" r="14" fill="#FFE082" />
                                <circle cx="0" cy="0" r="10" fill="#FFC107" />
                            </g>
                        </svg>
                    </div>
                ))}

                {/* 6. Sakura Particles & Food Canvas, below fish so food sits under them */}
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className={`absolute inset-0 w-full h-full pointer-events-none z-[4] transition-opacity duration-1000 opacity-100`}
                />
            </div>

            {/* Controls */}
            {/* Zen Mode Toggle (Always Visible but Discrete) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowControls(!showControls);
                    haptics.light();
                }}
                className={`fixed bottom-8 left-8 z-50 p-2 rounded-full transition-all duration-500 pointer-events-auto ${showControls
                    ? 'opacity-0 pointer-events-none'
                    : isDarkMode ? 'bg-white/5 text-white hover:text-white hover:bg-white/10' : 'bg-sage/5 text-sage/40 hover:text-sage hover:bg-sage/10'
                    }`}
            >
                <Eye size={20} />
            </button>

            {/* Top Control Bar.
                No backdrop-blur: a backdrop-filter over a scene that repaints every frame forces
                WebKit to re-snapshot and re-blur its backdrop every frame. A flat scrim reads
                near-identically over the pond and costs nothing. */}
            <div
                className={`fixed bottom-12 left-1/2 -translate-x-1/2 p-2 px-4 rounded-full bg-black/35 z-50 flex gap-4 transition-all duration-500 transform pointer-events-auto ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
                        className={`p-1.5 rounded-full transition-all duration-300 ${isSettingsOpen
                            ? isDarkMode ? 'bg-white/20 text-white' : 'bg-sage/20 text-sage'
                            : isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                        aria-label="Customize Pond"
                    >
                        <Settings size={14} />
                    </button>
                    {/* Centered Dropdown - Opens Upwards */}
                    {/* backdrop-blur-xl removed. This panel stays mounted so it can transition,
                        so its backdrop-filter was re-blurring the animating pond behind it on
                        every frame even while the menu was closed. At 97% opacity the blur was
                        doing nothing visible anyway. */}
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 rounded-2xl border transition-all duration-300 origin-bottom overflow-hidden ${isSettingsOpen
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95 pointer-events-none'
                        } ${isDarkMode ? 'bg-sage-mid/97 border-white/10' : 'bg-white/97 border-sage/10'}`}>
                        <div className="p-2 space-y-1 text-left">
                            {[
                                { label: 'Fish', state: showFish, setter: setShowFish },
                                { label: 'Lily Pads', state: showLilyPads, setter: setShowLilyPads },
                                { label: 'Lotus', state: showLotus, setter: setShowLotus },
                                { label: 'Baby Lotus', state: showBabyLotus, setter: setShowBabyLotus },
                                {
                                    label: 'Nature Particles', state: showParticles, setter: (val: boolean) => {
                                        setShowParticles(val);
                                        // Also sync to global enhancements
                                        const saved = localStorage.getItem(STORAGE_KEYS.ENHANCEMENTS);
                                        if (saved) {
                                            const parsed = JSON.parse(saved);
                                            parsed.natureParticles = val;
                                            localStorage.setItem(STORAGE_KEYS.ENHANCEMENTS, JSON.stringify(parsed));
                                            window.dispatchEvent(new Event('storage'));
                                        }
                                    }
                                },
                                { label: 'Gentle Rain', state: showRain, setter: setShowRain },
                                { label: 'Feed your fish', state: showFeeding, setter: setShowFeeding },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={(e) => { e.stopPropagation(); item.setter(!item.state); }}
                                    className={`w-full px-5 py-2 rounded-xl flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'
                                        }`}
                                >
                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                        {item.label}
                                    </span>
                                    <div className={`w-6 h-4 rounded-full relative transition-colors ${item.state
                                        ? isDarkMode ? 'bg-pale-gold' : 'bg-sage'
                                        : isDarkMode ? 'bg-white/20' : 'bg-black/20'
                                        }`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${item.state ? 'translate-x-2' : 'translate-x-0'
                                            }`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={toggleMute}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowControls(false); // Hide controls instead of close
                        haptics.light();
                    }}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    title="Hide UI (Zen Mode)"
                >
                    <EyeOff size={14} />
                </button>

                <button
                    onClick={onClose}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    aria-label="Close Koi Pond"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Controls Text Only */}
            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center text-center pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className={`text-2xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    Koi Pond
                </h1>
                <p className={`text-sm mt-1 mb-3 ${isDarkMode ? 'text-white' : 'text-sage-dark/60'}`}>
                    {earnedKoi ? 'Observe and relax' : 'Your pond is alive'}
                </p>
                <button
                    onClick={() => setShowHelp(true)}
                    className={`pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all duration-300 ${isDarkMode ? 'border-white/10 text-white/70 hover:text-white hover:bg-white/10' : 'border-sage/20 text-sage/70 hover:text-sage hover:bg-sage/10'}`}
                >
                    <HelpCircle size={12} />
                    <span className="text-xs font-medium">How it Works</span>
                </button>
            </div>

            {/* ── EMPTY STATE, ambient bottom hint, fades in then auto-hides ── */}
            {!earnedKoi && (
                <div
                    className="fixed bottom-28 inset-x-0 z-[45] flex justify-center pointer-events-none px-8"
                    style={{
                        opacity: showEmptyHint ? 1 : 0,
                        transition: 'opacity 1.4s ease-in-out',
                    }}
                >
                    <div
                        className="flex flex-col items-center gap-1 text-center"
                        style={{
                            color: 'rgba(229,214,167,0.38)',
                            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                        }}
                    >
                        <span className="text-sm font-medium tracking-widest uppercase" style={{ letterSpacing: '0.12em' }}>
                            Your pond grows as you do
                        </span>
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ letterSpacing: '0.18em', opacity: 0.7 }}>
                            Day {streak}
                        </span>
                    </div>
                </div>
            )}

            {/* ── One-time tap-to-feed hint, same fade treatment as the empty-state hint above ── */}
            {earnedKoi && (
                <div
                    className="fixed bottom-28 inset-x-0 z-[45] flex justify-center pointer-events-none px-8"
                    style={{
                        opacity: showFeedHint ? 1 : 0,
                        transition: 'opacity 1.4s ease-in-out',
                    }}
                >
                    <span
                        className="text-sm font-medium tracking-widest uppercase text-center"
                        style={{
                            letterSpacing: '0.12em',
                            color: 'rgba(229,214,167,0.38)',
                            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                        }}
                    >
                        Tap the water to feed your fish
                    </span>
                </div>
            )}

            {/* ── FIRST-KOI ARRIVAL CELEBRATION ──
                 Solid scrim instead of backdrop-filter: this covers the full viewport over a
                 scene that repaints every frame, so the blur was the single most expensive
                 thing on screen while the celebration was up. */}
            {showFirstArrival && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-8"
                    style={{ background: 'rgba(10,26,14,0.93)' }}
                    onClick={dismissFirstArrival}
                >
                    <div
                        className="relative w-full max-w-xs rounded-3xl p-8 text-center flex flex-col items-center gap-4"
                        style={{
                            background: 'rgba(30,58,40,0.96)',
                            border: '1.5px solid rgba(229,214,167,0.25)',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Decorative ring */}
                        <svg
                            aria-hidden
                            className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl overflow-hidden"
                            viewBox="0 0 320 400"
                            preserveAspectRatio="xMidYMid slice"
                        >
                            <circle cx="320" cy="0" r="160" fill="none" stroke="#C96A3A" strokeWidth="40" opacity="0.35" />
                            <circle cx="0" cy="400" r="130" fill="none" stroke="#2A4A2A" strokeWidth="36" opacity="0.30" />
                        </svg>

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            {/* Animated koi */}
                            <div style={{ animation: 'swimFlex 3s ease-in-out infinite' }}>
                                <svg width="56" height="84" viewBox="0 0 60 90">
                                    <g transform="translate(30,45)">
                                        <g style={{ animation: 'swimTail 2s ease-in-out infinite alternate', transformOrigin: '0 25px' }}>
                                            <path d="M0,25 Q10,35 12,50 L0,45 L-12,50 Q-10,35 0,25" fill="#C96A3A" opacity="0.9" />
                                        </g>
                                        <ellipse cx="0" cy="0" rx="12" ry="30" fill="#C96A3A" />
                                        <g fill="#FFD700" opacity="0.7">
                                            <circle cx="-5" cy="-10" r="3" />
                                            <circle cx="6" cy="5" r="4" />
                                            <circle cx="-3" cy="18" r="2" />
                                        </g>
                                        <circle cx="-6" cy="-22" r="1.5" fill="black" opacity="0.5" />
                                        <circle cx="6" cy="-22" r="1.5" fill="black" opacity="0.5" />
                                    </g>
                                </svg>
                            </div>

                            <div>
                                <p
                                    className="text-sm uppercase tracking-widest font-semibold mb-1"
                                    style={{ color: '#C96A3A' }}
                                >
                                    30-day streak reached
                                </p>
                                <h3
                                    className="text-3xl font-display font-bold"
                                    style={{ color: '#E5D6A7', letterSpacing: '-0.02em' }}
                                >
                                    Your koi has arrived.
                                </h3>
                                <p
                                    className="text-sm mt-2 leading-relaxed"
                                    style={{ color: 'rgba(229,214,167,0.60)' }}
                                >
                                    Consistency brought it here.<br />Keep going to unlock more.
                                </p>
                            </div>

                            <button
                                onClick={dismissFirstArrival}
                                className="mt-2 w-full py-3.5 rounded-2xl font-bold text-sm"
                                style={{
                                    background: '#C96A3A',
                                    color: '#FAF7F3',
                                    boxShadow: '0 6px 24px rgba(201,106,58,0.45)',
                                }}
                            >
                                Welcome to the pond
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SlideUpModal isOpen={showHelp} onClose={() => setShowHelp(false)} isDarkMode={isDarkMode} title="How to Use">
                <div className={`p-8 pb-12 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                            <FishIcon size={32} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        </div>
                        <h3 className="text-3xl font-display font-medium mb-2">Koi Pond</h3>
                        <p className={`text-sm uppercase tracking-widest font-bold ${isDarkMode ? 'text-white' : 'text-sage-dark/60'}`}>A Living Reward</p>
                    </div>
                    <div className={`space-y-4 mb-8 text-sm leading-relaxed font-body ${isDarkMode ? 'text-white/70' : 'text-sage-dark/70'}`}>
                        <p>Your pond grows and changes as your practice does. Here's what you can do with it.</p>
                        <ul className="space-y-3 list-none">
                            <li className="flex gap-3"><span className={`font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>01.</span> Tap or click the water to feed your fish and send out ripples.</li>
                            <li className="flex gap-3"><span className={`font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>02.</span> Use the gear icon to show or hide fish, lily pads, lotus, particles, and rain.</li>
                            <li className="flex gap-3"><span className={`font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>03.</span> More koi arrive as your streak and total practices grow.</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => setShowHelp(false)}
                        className={`w-full py-5 rounded-[2.5rem] font-black text-xs tracking-widest uppercase shadow-lg ${isDarkMode ? 'bg-pale-gold text-sage-dark shadow-pale-gold/10' : 'bg-terracotta-500 text-white shadow-terracotta-500/20'}`}
                    >
                        Back to the Pond
                    </button>
                </div>
            </SlideUpModal>
        </div>
    );
};
