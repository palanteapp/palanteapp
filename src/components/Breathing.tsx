import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Play, Pause, X, Info, Lightbulb, Target, HelpCircle, Settings } from 'lucide-react';
import { haptics, useHaptics } from '../utils/haptics';
import { SlideUpModal } from './SlideUpModal';
import { FeatureInfoModal } from './FeatureInfoModal';
import { EnhancementSettings, type EnhancementOptions } from './EnhancementSettings';
import { FEATURE_INFO } from '../data/featureInfo';

// --- Types & Config ---
type Technique = 'Box' | '4-7-8' | 'Coherent';

interface BreathworkProps {
    onComplete?: () => void;
    onShowTip?: () => void;
    isActive?: boolean;
    isDarkMode?: boolean;
    accentColor?: string;
}

const TECHNIQUES = {
    'Box': {
        id: 'Box',
        label: 'Energy',
        subLabel: 'Box Breathing',
        phases: [
            { name: 'Exhale', duration: 4 },
            { name: 'HoldOut', duration: 4 },
            { name: 'Inhale', duration: 4 },
            { name: 'HoldIn', duration: 4 },
        ] as const,
        intro: "A powerful technique used by professionals to instantly calm the nervous system and regain focus.",
        instructions: [
            { title: "Inhale (4s)", desc: "Build the charge." },
            { title: "Hold (4s)", desc: "Contain the energy." },
            { title: "Exhale (4s)", desc: "Release and expand." },
            { title: "Hold (4s)", desc: "Center and reset." }
        ],
        benefits: [
            { title: "Reduces Stress", desc: "Calms the fight-or-flight response." },
            { title: "Sharpens Focus", desc: "Enhances mental clarity instantly." },
            { title: "Regulates Pulse", desc: "Lowers heart rate effectively." }
        ],
        tips: [
            "Visualize containing light within a cube.",
            "Let the vibration settle your mind.",
            "Keep your focus soft and drifting."
        ]
    },
    '4-7-8': {
        id: '4-7-8',
        label: 'Relax',
        subLabel: '4-7-8 Technique',
        phases: [
            { name: 'Inhale', duration: 4 },
            { name: 'HoldIn', duration: 7 },
            { name: 'Exhale', duration: 8 },
        ] as const,
        intro: "The 4-7-8 technique promotes deep relaxation to help you sleep or decompress.",
        instructions: [
            { title: "Inhale (4s)", desc: "Breath of renewal." },
            { title: "Hold (7s)", desc: "Quiet connection." },
            { title: "Exhale (8s)", desc: "Total release." }
        ],
        benefits: [
            { title: "Better Sleep", desc: "Helps fall asleep faster." },
            { title: "Anxiety Relief", desc: "Powerful natural tranquilizer." }
        ],
        tips: ["Feel the vibration travel through your body.", "Let every muscle soften with the ripple."]
    },
    'Coherent': {
        id: 'Coherent',
        label: 'Balance',
        subLabel: 'Coherent Breathing',
        phases: [
            { name: 'Exhale', duration: 6 },
            { name: 'Inhale', duration: 6 },
        ] as const,
        intro: "Coherent breathing balances the nervous system in a continuous flow.",
        instructions: [
            { title: "Inhale (6s)", desc: "Flow continuously." },
            { title: "Exhale (6s)", desc: "Loop without pause." }
        ],
        benefits: [
            { title: "Heart-Brain Coherence", desc: "Syncs your biological rhythms." },
            { title: "Emotional Balance", desc: "Stabilizes mood and energy." }
        ],
        tips: ["Imagine liquid gold flowing endlessly.", "Smooth out every corner of the breath."]
    }
} as const;


// Pre-generated petal data (module-level, stable across renders)
const BREATHING_SAKURA_PETALS = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    duration: `${18 + Math.random() * 20}s`,
    opacity: 0.4 + Math.random() * 0.4,
    rotate: `${Math.random() * 360}deg`,
    scale: 0.5 + Math.random()
}));

// --- Sakura Petals Enhancement ---
const SakuraPetals = memo(({ isDarkMode }: { isDarkMode: boolean }) => {
    const petals = BREATHING_SAKURA_PETALS;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {petals.map((petal) => (
                <div
                    key={petal.id}
                    className="absolute animate-float-petal"
                    style={{
                        left: petal.left,
                        top: `-20px`,
                        animationDelay: petal.delay,
                        animationDuration: petal.duration,
                        opacity: petal.opacity
                    }}
                >
                    <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-[#FFB7C5]/40' : 'bg-[#FFB7C5]/20'} blur-[1px]`}
                        style={{ transform: `rotate(${petal.rotate}) scale(${petal.scale})` }} />
                </div>
            ))}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float-petal {
                    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(110vh) translateX(100px) rotate(360deg); opacity: 0; }
                }
                .animate-float-petal { animation-name: float-petal; animation-timing-function: linear; animation-iteration-count: infinite; }
            `}} />
        </div>
    );
});

// --- VISUAL MASTERPIECES (REFINED ETHEREAL) ---



// 1. Box Breathing: "Sacred Box Dynamics"
// Concept: Nested squares that expand/contract and rotate in alternating directions
// Dynamic, structural, and strictly aligned with breath phases
const SacredBoxDynamics = memo(({ phase, progress, scale }: { phase: string, progress: number, scale: number }) => {
    const cx = 170;
    const cy = 170;

    // Configuration
    const numSquares = 4;
    const baseSize = 55; // Increased from 50 to match visual weight

    // Easing function for smooth motion
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Calculate generic factor based on phase
    let factor = 0;

    if (phase === 'Inhale') {
        factor = easeInOutCubic(progress);
    } else if (phase === 'HoldIn') {
        factor = 1.0; // Stay fully expanded
    } else if (phase === 'Exhale') {
        factor = 1.0 - easeInOutCubic(progress);
    } else if (phase === 'HoldOut') {
        factor = 0.0; // Stay fully contracted
    }

    return (
        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center transform-gpu transition-transform duration-1000 ease-out"
            style={{ transform: `scale(${scale})` }}>
            <svg viewBox="0 0 340 340" className="w-full h-full overflow-visible">
                <defs>
                    <filter id="box-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="box-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E5D6A7" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
                    </linearGradient>
                </defs>

                {/* Render concentric squares */}
                {Array.from({ length: numSquares }).map((_, i) => {
                    // Each square expands further than the last
                    // MODIFIED: Reduced expansionGap from 35 to 30 to prevent clipping at max rotation
                    // Max width calc: 50 + (3*20) + (4*30*1) = 110 + 120 = 230px
                    // Max Diagonal: 230 * 1.414 = 325px (Fits safely in 340px)
                    const expansionGap = 30;
                    const currentSize = baseSize + (i * 20) + ((i + 1) * expansionGap * factor);
                    const half = currentSize / 2;

                    // Rotation: Alternating directions, increasing with factor
                    const direction = i % 2 === 0 ? 1 : -1;
                    const rotation = (factor * 90 * direction) + (i * 22.5); // Increased rotation range

                    // Opacity: Inner squares slightly more visible
                    const opacity = 0.3 + (i * 0.15) + (factor * 0.2);

                    return (
                        <rect
                            key={i}
                            x={cx - half}
                            y={cy - half}
                            width={currentSize}
                            height={currentSize}
                            fill="none"
                            stroke="url(#box-gradient)"
                            strokeWidth={2}
                            strokeOpacity={opacity}
                            rx={4}
                            transform={`rotate(${rotation}, ${cx}, ${cy})`}
                            filter="url(#box-glow)"
                            className="transform-gpu"
                        />
                    );
                })}

                {/* Central Anchor */}
                <circle cx={cx} cy={cy} r={5} fill="#E5D6A7" opacity={0.6 + (factor * 0.4)} filter="url(#box-glow)" />

                {/* Connecting diagonal lines for sacred geometry feel */}
                {factor > 0.3 && (
                    <g opacity={factor * 0.3} stroke="#E5D6A7" strokeWidth="0.5" filter="url(#box-glow)">
                        <line x1={cx - 60} y1={cy - 60} x2={cx + 60} y2={cy + 60} />
                        <line x1={cx + 60} y1={cy - 60} x2={cx - 60} y2={cy + 60} />
                    </g>
                )}
            </svg>
        </div>
    );
});

// 2. Coherent Breathing: "The Flower of Life"
// Concept: A sacred geometry mesh that gently expands and blooms
const FlowerOfLife = memo(({ phase, progress, scale }: { phase: string, progress: number, scale: number }) => {
    const cx = 170;
    const cy = 170;
    const baseRadius = 48; // Consistent sizing

    // Easing and Logic
    const rawProgress = phase === 'Inhale' || phase === 'HoldIn' ? progress : 1 - progress;
    const breathProgress = (1 - Math.cos(rawProgress * Math.PI)) / 2;

    // Radius & Spacing Expansion (The "Bloom")
    // The pattern expands gently as a single cohesive unit
    const expansionFactor = 1.4; // Increased to 40% expansion for better visibility
    const currentR = baseRadius + (baseRadius * (expansionFactor - 1) * breathProgress);
    const spacing = currentR; // Spacing equals radius for perfect geometry intersections

    // Color Interpolation: Sage (#7E9F89) to Pale Gold (#E5D6A7)
    const r = 126 + (229 - 126) * breathProgress;
    const g = 159 + (214 - 159) * breathProgress;
    const b = 137 + (167 - 137) * breathProgress;
    const strokeColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

    // Opacity: Pulses slightly with breath
    const baseOpacity = 0.4 + (breathProgress * 0.4);

    // Generate Circles (Center + 2 Rings - 19 total)
    const circles = [];
    circles.push({ x: 0, y: 0 }); // Center

    // First Ring
    for (let i = 0; i < 6; i++) {
        const theta = (i * 60) * Math.PI / 180;
        circles.push({ x: Math.cos(theta) * spacing, y: Math.sin(theta) * spacing });
    }

    // Second Ring
    for (let i = 0; i < 6; i++) {
        const theta = (i * 60) * Math.PI / 180;
        circles.push({ x: Math.cos(theta) * 2 * spacing, y: Math.sin(theta) * 2 * spacing });
        const thetaGap = (i * 60 + 30) * Math.PI / 180;
        circles.push({ x: Math.cos(thetaGap) * spacing * Math.sqrt(3), y: Math.sin(thetaGap) * spacing * Math.sqrt(3) });
    }

    return (
        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center transform-gpu transition-transform duration-1000 ease-out"
            style={{ transform: `scale(${scale})` }}>
            <svg viewBox="0 0 340 340" className="w-full h-full overflow-visible">
                <defs>
                    <filter id="flower-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <radialGradient id="flower-center-glow">
                        <stop offset="0%" stopColor="#E5D6A7" stopOpacity={0.4 * breathProgress} />
                        <stop offset="70%" stopColor="#7E9F89" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Background Glow from center */}
                <circle cx={cx} cy={cy} r={spacing * 2.5} fill="url(#flower-center-glow)" />

                {/* The Flower Mesh */}
                <g filter="url(#flower-glow)">
                    {circles.map((pos, i) => (
                        <circle
                            key={i}
                            cx={cx + pos.x}
                            cy={cy + pos.y}
                            r={currentR}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={1.5}
                            opacity={baseOpacity}
                            className="transition-colors duration-75"
                        />
                    ))}
                </g>

                {/* Golden Intersections Highlights */}
                <g style={{ opacity: Math.max(0, (breathProgress - 0.5) * 2) }}>
                    {circles.map((pos, i) => (
                        <circle
                            key={`dot-${i}`}
                            cx={cx + pos.x}
                            cy={cy + pos.y}
                            r={1.5}
                            fill="#E5D6A7"
                            filter="url(#flower-glow)"
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
});

// 3. 4-7-8 Breathing: "The Mandala Bloom"
// Concept: Sacred flower-of-life pattern that blooms and contracts
// Orbs travel from center to petals and back
const MandalaBloom = memo(({ phase, progress, scale }: { phase: string, progress: number, scale: number }) => {
    const cx = 170;
    const cy = 170;
    const petalCount = 8;
    const maxRadius = 145; // Increased to 145 to match visual size
    // Calculate expansion based on phase
    let expansionRadius = 30; // Min radius
    let rotation = 0;
    const orbPositions: { x: number, y: number }[] = [];

    if (phase === 'Inhale') {
        // Expand from 30 to maxRadius
        expansionRadius = 30 + (progress * (maxRadius - 30));
    } else if (phase === 'HoldIn') {
        // Hold at full expansion with gentle rotation
        expansionRadius = maxRadius;
        rotation = progress * 15; // Slow rotation during hold
    } else if (phase === 'Exhale') {
        // Contract from maxRadius to 30
        expansionRadius = 30 + ((1 - progress) * (maxRadius - 30));
    }

    // Create petal positions (orbs at the tips)
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 + (rotation * Math.PI / 180);
        orbPositions.push({
            x: cx + Math.cos(angle) * expansionRadius,
            y: cy + Math.sin(angle) * expansionRadius
        });
    }

    // Create overlapping circles pattern (flower of life)
    const createPetalPath = (angle: number, radius: number) => {
        const petalX = cx + Math.cos(angle) * radius * 0.5;
        const petalY = cy + Math.sin(angle) * radius * 0.5;
        return { cx: petalX, cy: petalY, r: radius * 0.6 };
    };

    const petals = [];
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 + (rotation * Math.PI / 180);
        petals.push(createPetalPath(angle, expansionRadius));
    }

    // Opacity based on phase
    const petalOpacity = phase === 'HoldIn' ? 0.4 : 0.25;
    const centerGlowOpacity = phase === 'HoldIn' ? 0.8 : 0.4 + (expansionRadius / maxRadius) * 0.2;

    return (
        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center transform-gpu transition-transform duration-1000 ease-out"
            style={{ transform: `scale(${scale})` }}>
            <svg viewBox="0 0 340 340" className="w-full h-full overflow-visible">
                <defs>
                    <filter id="mandala-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <radialGradient id="mandala-center">
                        <stop offset="0%" stopColor="#E5D6A7" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#E5D6A7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#E5D6A7" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Central glow - pulses with breath */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={20 + expansionRadius * 0.3}
                    fill="url(#mandala-center)"
                    opacity={centerGlowOpacity}
                    className="transition-opacity duration-700 ease-in-out"
                />

                {/* Flower of Life petals */}
                {petals.map((petal, i) => (
                    <circle
                        key={`petal-${i}`}
                        cx={petal.cx}
                        cy={petal.cy}
                        r={petal.r}
                        fill="none"
                        stroke="#E5D6A7"
                        strokeWidth="1.5"
                        opacity={petalOpacity}
                        filter="url(#mandala-glow)"
                        className="transform-gpu"
                    />
                ))}

                {/* Outer ring connecting the petals */}
                {expansionRadius > 20 && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={expansionRadius}
                        fill="none"
                        stroke="#E5D6A7"
                        strokeWidth="1"
                        opacity="0.3"
                        filter="url(#mandala-glow)"
                        className="transform-gpu"
                    />
                )}

                {/* Lines from center to orbs */}
                {orbPositions.map((pos, i) => (
                    expansionRadius > 10 && (
                        <line
                            key={`line-${i}`}
                            x1={cx}
                            y1={cy}
                            x2={pos.x}
                            y2={pos.y}
                            stroke="#E5D6A7"
                            strokeWidth="1"
                            opacity="0.2"
                            className="transition-all duration-600 ease-in-out"
                        />
                    )
                ))}

                {/* Central orb */}
                <g filter="url(#mandala-glow)">
                    <circle cx={cx} cy={cy} r="6" fill="#FFF" opacity="0.9" />
                    <circle cx={cx} cy={cy} r="12" fill="#E5D6A7" fillOpacity="0.4" />
                </g>

                {/* Traveling orbs at petal tips */}
                {orbPositions.map((pos, i) => (
                    expansionRadius > 30 && (
                        <g key={`orb-${i}`} filter="url(#mandala-glow)">
                            <circle cx={pos.x} cy={pos.y} r="4" fill="#FFF" opacity="0.8" />
                            <circle cx={pos.x} cy={pos.y} r="8" fill="#E5D6A7" fillOpacity="0.3" />
                            {phase === 'HoldIn' && (
                                <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="#E5D6A7" strokeWidth="1" opacity="0.2">
                                    <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" begin={`${i * 0.25}s`} />
                                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" begin={`${i * 0.25}s`} />
                                </circle>
                            )}
                        </g>
                    )
                ))}
            </svg>
        </div>
    );
});


// --- Main Controller (Engine Same, Scale Logic Added) ---

export const Breathing = memo<BreathworkProps>(({ onComplete, onShowTip, isDarkMode = false }) => {
    const { triggerHaptic } = useHaptics();
    const [activeTechnique, setActiveTechnique] = useState<Technique>('Box');
    const [status, setStatus] = useState<'idle' | 'countdown' | 'active'>('idle');
    const [isPaused, setIsPaused] = useState(false);

    // DEBUG: Trace Mount and Pause
    useEffect(() => { console.log(`[Breathing] MOUNT/UPDATE. Tech: ${activeTechnique}, Status: ${status}`); }, [activeTechnique, status]);
    useEffect(() => { console.log(`[Breathing] isPaused changed to: ${isPaused}`); }, [isPaused]);


    // Safety Refs
    const statusRef = useRef(status);
    const isPausedRef = useRef(isPaused);
    const techniqueRef = useRef(activeTechnique);
    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { techniqueRef.current = activeTechnique; }, [activeTechnique]);

    // Callback Refs to keep animate stable
    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    const triggerHapticRef = useRef(triggerHaptic);
    useEffect(() => { triggerHapticRef.current = triggerHaptic; }, [triggerHaptic]);

    const [countdownVal, setCountdownVal] = useState(5);
    const [showInfo, setShowInfo] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showFeatureInfo, setShowFeatureInfo] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [enhancements, setEnhancements] = useState<EnhancementOptions>(() => {
        const saved = localStorage.getItem('palante_enhancements');
        return saved ? JSON.parse(saved) : {
            immersiveHaptics: false,
            dynamicBackgrounds: false,
            smoothTransitions: false,
            natureParticles: false
        };
    });

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [nextTechnique, setNextTechnique] = useState<Technique | null>(null);

    // Listen for setting changes
    useEffect(() => {
        const handleSettingsUpdate = () => {
            const saved = localStorage.getItem('palante_enhancements');
            if (saved) setEnhancements(JSON.parse(saved));
        };
        window.addEventListener('storage', handleSettingsUpdate);
        return () => window.removeEventListener('storage', handleSettingsUpdate);
    }, []);

    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);


    const [phaseName, setPhaseName] = useState('Ready');
    const [phaseProgress, setPhaseProgress] = useState(0);
    const [currentPhaseSimple, setCurrentPhaseSimple] = useState('Inhale');
    const [timeLeftInPhase, setTimeLeftInPhase] = useState(0);
    const [totalSecondsLeft, setTotalSecondsLeft] = useState(300);

    const requestRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number | undefined>(undefined);
    const pausedTimeRef = useRef<number>(0);
    const phaseIndexRef = useRef(0);
    const lastTickRef = useRef<number>(0);

    const activeConfig = TECHNIQUES[activeTechnique];

    // Wake Lock functions
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                const lock = await navigator.wakeLock.request('screen');
                setWakeLock(lock);
                console.log('🔒 Wake Lock acquired - screen will stay awake');

                lock.addEventListener('release', () => {
                    console.log('🔓 Wake Lock released');
                });
            } else {
                console.warn('⚠️ Wake Lock API not supported on this device');
            }
        } catch (err) {
            console.error('❌ Failed to acquire wake lock:', err);
        }
    };

    const releaseWakeLock = useCallback(async () => {
        if (wakeLock) {
            try {
                await wakeLock.release();
                setWakeLock(null);
                console.log('🔓 Wake Lock released manually');
            } catch (err) {
                console.error('❌ Failed to release wake lock:', err);
            }
        }
    }, [wakeLock]);

    const reset = useCallback(async () => {
        console.log(`[Breathing] RESET CALLED.`);
        setStatus('idle');
        setIsPaused(false);
        setCountdownVal(5);
        setPhaseName('Ready');
        setPhaseProgress(0);
        setCurrentPhaseSimple('Exhale');
        setTimeLeftInPhase(0);
        setTotalSecondsLeft(300);
        phaseIndexRef.current = 0;
        startTimeRef.current = undefined;
        pausedTimeRef.current = 0;
        lastTickRef.current = 0;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        // Release wake lock on reset
        await releaseWakeLock();
    }, [releaseWakeLock]);

    const changeTechnique = (t: Technique) => {
        if (enhancements.smoothTransitions && status === 'active') {
            setIsTransitioning(true);
            setNextTechnique(t);
            haptics.medium();
            setTimeout(() => {
                setActiveTechnique(t);
                setIsTransitioning(false);
                setNextTechnique(null);
            }, 600); // Cinematic cross-fade duration
        } else {
            reset();
            setActiveTechnique(t);
        }
    };

    const togglePlay = async () => {
        if (status === 'idle') {
            setStatus('countdown');
            // Wake lock will be requested when countdown finishes
        } else if (status === 'active') {
            const wasPaused = isPaused;
            setIsPaused(p => !p);

            // Release wake lock when pausing
            if (!wasPaused) {
                await releaseWakeLock();
            } else {
                await requestWakeLock();
            }
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (status === 'countdown') {
            interval = setInterval(() => {
                setCountdownVal(c => {
                    if (c === 1) {
                        setStatus('active');
                        // Acquire wake lock when breathwork starts
                        requestWakeLock();
                        return 5;
                    }
                    return c - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const animate = useCallback(function tick(time: number) {
        if (statusRef.current !== 'active') return;
        if (isPausedRef.current) return;

        if (!startTimeRef.current) startTimeRef.current = time;
        const rawElapsed = time - (startTimeRef.current || time) - pausedTimeRef.current;

        const currentTech = techniqueRef.current;
        const config = TECHNIQUES[currentTech];
        const phases = config.phases;

        let totalCycleDuration = 0;
        phases.forEach(p => totalCycleDuration += p.duration * 1000);

        const cycleTime = rawElapsed % totalCycleDuration;
        let accumulated = 0;
        let activePhase: typeof phases[number] | null = null;
        let activePhaseIndex = 0;
        let timeInCurrentPhase = 0;

        for (let i = 0; i < phases.length; i++) {
            const pDuration = phases[i].duration * 1000;
            if (cycleTime < accumulated + pDuration) {
                activePhase = phases[i];
                activePhaseIndex = i;
                timeInCurrentPhase = cycleTime - accumulated;
                break;
            }
            accumulated += pDuration;
        }

        if (!activePhase) activePhase = phases[0];



        if (activePhaseIndex !== phaseIndexRef.current) {
            triggerHapticRef.current('heavy');
            phaseIndexRef.current = activePhaseIndex;
        } else if (!isPausedRef.current) {
            const phase = phases[activePhaseIndex];
            if (enhancements.hapticDarkMode) {
                // DARK SENSORY MODE: Rhythmic light pulses every 1s during breath phases
                if (phase.name === 'Inhale' || phase.name === 'Exhale') {
                    if (Math.floor(timeInCurrentPhase / 1000) !== Math.floor((timeInCurrentPhase - 16) / 1000)) {
                        triggerHapticRef.current('light');
                    }
                } else {
                    // Hold phases: selection pulse every 1s
                    if (Math.floor(timeInCurrentPhase / 1000) !== Math.floor((timeInCurrentPhase - 16) / 1000)) {
                        triggerHapticRef.current('selection');
                    }
                }
            } else if (enhancements.immersiveHaptics) {
                if (phase.name === 'Inhale' || phase.name === 'Exhale') {
                    if (Math.floor(timeInCurrentPhase / 500) !== Math.floor((timeInCurrentPhase - 16) / 500)) {
                        triggerHapticRef.current('medium');
                    }
                }
            }
        }


        const progress = timeInCurrentPhase / (activePhase.duration * 1000);

        // AUDIO GUIDE removed as per user request
        setPhaseProgress(progress);
        setCurrentPhaseSimple(activePhase.name);

        // DEBUG LOGGING EVERY 100 FRAMES (approx 1.5s)
        if (Math.floor(rawElapsed / 100) % 15 === 0) {
            console.log(`[BreathLoop] Elapsed: ${rawElapsed.toFixed(0)}, Cycle: ${cycleTime.toFixed(0)}, Phase: ${activePhase.name}, TimeInPhase: ${timeInCurrentPhase.toFixed(0)}`);
        }

        const displayName = activePhase.name.startsWith('Hold') ? 'HOLD' : activePhase.name.toUpperCase();
        setPhaseName(displayName);
        setTimeLeftInPhase(Math.ceil(activePhase.duration - (timeInCurrentPhase / 1000)));

        if (time - lastTickRef.current > 1000) {
            setTotalSecondsLeft(t => { if (t <= 1) return 0; return t - 1; });
            lastTickRef.current = time;
        }

        if (rawElapsed > 300 * 1000) {
            reset();
            onCompleteRef.current?.();
            return;
        }

        requestRef.current = requestAnimationFrame(tick);
    }, [reset, enhancements.immersiveHaptics, enhancements.hapticDarkMode]);

    useEffect(() => {
        if (status === 'active' && !isPaused) {
            console.log('[Breathing] STARTING ANIMATION LOOP');
            requestRef.current = requestAnimationFrame(animate);
        }
        else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            console.log(`[Breathing] STOPPING ANIMATION LOOP (Status: ${status}, Paused: ${isPaused})`);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [status, isPaused, activeTechnique, animate]);

    const pauseStartRef = useRef<number>(0);
    useEffect(() => {
        if (isPaused) { pauseStartRef.current = performance.now(); }
        else { if (pauseStartRef.current > 0) { pausedTimeRef.current += performance.now() - pauseStartRef.current; pauseStartRef.current = 0; } }
    }, [isPaused]);


    // --- GLOBAL BREATHING SCALE CALCULATOR ---
    const getGlobalScale = () => {
        // Base scale = 1.05 (START AT FULL SCALE)
        // Exhale: 1.05 -> 1.0 (BEGIN WITH EXHALE)
        // Hold: Stay at 1.0
        // Inhale: 1.0 -> 1.05
        // Hold: Stay at 1.05
        if (status !== 'active') {
            // Idle/Countdown State:
            // Start at full scale (expanded) ready to exhale
            if (status === 'idle') return 1.05;
            return 1.05;
        }

        const p = phaseProgress;

        // Smooth easing function for continuous flow (Coherent breathing)
        // Uses sine wave for natural acceleration/deceleration
        const smoothEase = (t: number) => {
            // Sine easing: starts slow, speeds up, slows down at end
            return (1 - Math.cos(t * Math.PI)) / 2;
        };

        // Reordered to start with exhale
        if (currentPhaseSimple === 'Exhale') {
            // For Coherent breathing, use smooth easing for continuous flow
            const easedProgress = activeTechnique === 'Coherent' ? smoothEase(p) : p;
            return 1.05 - (easedProgress * 0.05);
        }
        if (currentPhaseSimple === 'HoldOut') return 1.0 + (Math.sin(p * Math.PI) * 0.005);
        if (currentPhaseSimple === 'Inhale') {
            // For Coherent breathing, use smooth easing for continuous flow
            const easedProgress = activeTechnique === 'Coherent' ? smoothEase(p) : p;
            return 1.0 + (easedProgress * 0.05);
        }
        if (currentPhaseSimple === 'HoldIn') return 1.05 + (Math.sin(p * Math.PI) * 0.01); // Subtle pulse
        return 1.05;
    };

    const scale = getGlobalScale();

    const renderVisual = () => {
        if (activeTechnique === 'Box') return <SacredBoxDynamics phase={currentPhaseSimple} progress={phaseProgress} scale={scale} />;
        if (activeTechnique === 'Coherent') return <FlowerOfLife phase={currentPhaseSimple} progress={phaseProgress} scale={scale} />;
        return <MandalaBloom phase={currentPhaseSimple} progress={phaseProgress} scale={scale} />;
    };

    return (
        <div
            className="relative w-full flex flex-col items-center text-white overflow-hidden bg-transparent"
            onMouseMove={() => { setShowControls(true); setTimeout(() => setShowControls(false), 3000); }}
            onTouchStart={() => setShowControls(true)}
        >
            {/* Dark Sensory Mode Overlay — screen goes black, haptics only */}
            {enhancements.hapticDarkMode && status === 'active' && (
                <div
                    className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center select-none"
                    onDoubleClick={() => reset()}
                >
                    <div className="text-center">
                        <p className="text-white/20 text-[9px] uppercase tracking-[0.35em] mb-12">Dark Sensory Mode</p>
                        <div className="text-white text-6xl font-display font-light tracking-[0.15em] mb-4">
                            {isPaused ? 'PAUSED' : phaseName}
                        </div>
                        <div className="text-white/30 text-5xl font-mono font-light tabular-nums">{timeLeftInPhase}s</div>
                        <div className="text-white/15 font-mono text-sm mt-10">
                            {Math.floor(totalSecondsLeft / 60)}:{String(totalSecondsLeft % 60).padStart(2, '0')} remaining
                        </div>
                    </div>
                    <div className="absolute bottom-14 text-center">
                        <p className="text-white/15 text-[9px] uppercase tracking-[0.3em]">Double-tap to exit</p>
                    </div>
                </div>
            )}
            {enhancements.natureParticles && (status === 'active' || status === 'countdown') && <SakuraPetals isDarkMode={isDarkMode} />}
            <div className={`relative z-50 w-full px-6 flex items-center justify-center transition-opacity duration-700 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

                {/* Center: Tip & Timer (Active Only) - Now centered globally */}
                <div className="flex items-center gap-4">
                    {status !== 'idle' && (
                        <>
                            <button
                                onClick={() => onShowTip?.()}
                                className={`inline-flex items-center gap-2 transition-all ${isDarkMode
                                    ? 'text-pale-gold hover:opacity-100'
                                    : 'text-sage hover:opacity-100'
                                    }`}
                            >
                                <div className="p-1 rounded-full bg-white/5">
                                    <Target size={14} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider opacity-90">Tip</span>
                            </button>

                            <div className="font-mono text-sm font-bold text-white/90 tracking-wider">
                                {Math.floor(totalSecondsLeft / 60)}:{Math.floor(totalSecondsLeft % 60).toString().padStart(2, '0')}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex-1 w-full flex flex-col items-center">

                {/* Description Text & Landing UI - MOVED TO TOP */}
                <div className="flex flex-col items-center animate-fade-in text-center gap-6 mb-10 w-full max-w-sm px-6">
                    <h1 className="text-3xl md:text-4xl font-display font-medium text-white tracking-wider uppercase">Breathwork</h1>

                    <div className="space-y-2">
                        <h3 className="text-base text-white/80 font-medium tracking-wide">
                            {activeConfig.label} <span className="text-white/40 mx-2">•</span> {activeConfig.subLabel}
                        </h3>
                        <p className="text-xs text-white/50 leading-relaxed max-w-[260px] mx-auto min-h-[3em]">
                            {activeConfig.intro}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 relative z-[100]">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                haptics.light();
                                setShowFeatureInfo(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all bg-white/10 text-white/80 hover:bg-white/20 active:scale-95"
                        >
                            <HelpCircle size={14} strokeWidth={2.5} />
                            <span>How to Use</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                haptics.light();
                                setShowSettings(true);
                            }}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${enhancements.groundingHeartbeat
                                ? 'bg-pale-gold text-warm-gray-green shadow-[0_0_15px_rgba(229,214,167,0.4)]'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                                }`}
                        >
                            <Settings size={14} strokeWidth={2.5} className={enhancements.groundingHeartbeat && status === 'active' ? 'animate-spin-slow' : ''} />
                            <span>Enhancements</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onComplete?.();
                            }}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all active:scale-90"
                            title="Exit Session"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Visual Area */}
                <div className={`relative flex items-center justify-center min-h-[220px] scale-90 mb-6 transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-75 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                    {renderVisual()}
                </div>

                {/* Content Stack: Selector -> Play Button */}
                <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">

                    {/* Technique Selector (Always Visible) */}
                    <div className="flex p-0.5 bg-black/20 backdrop-blur-xl rounded-full border border-white/5 relative z-50">
                        {(Object.keys(TECHNIQUES) as Technique[]).map((tech) => (
                            <button key={tech} onClick={() => {
                                haptics.selection();
                                changeTechnique(tech);
                            }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${activeTechnique === tech ? 'bg-pale-gold text-warm-gray-green shadow-lg' : 'text-white/40 hover:text-white/60'}`}>{TECHNIQUES[tech].label}</button>
                        ))}
                    </div>

                    {/* Countdown / Stats */}
                    <div className="relative min-h-[140px] flex flex-col items-center justify-center w-full gap-4">
                        {status === 'countdown' && (
                            <div className="text-center animate-pulse">
                                <span className="text-5xl font-display font-light text-white">{countdownVal}</span>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-1">Get Ready</div>
                            </div>
                        )}

                        {status === 'active' && (
                            <div className="text-center flex flex-col gap-1 animate-fade-in z-20">
                                <span className="text-white/90 text-xs font-bold tracking-[0.3em] uppercase">{isPaused ? 'PAUSED' : phaseName}</span>
                                <span className="text-pale-gold text-3xl font-mono font-light">{timeLeftInPhase}s</span>
                            </div>
                        )}

                        {/* Play Button (Only show in idle or active, hidden during countdown) */}
                        {status !== 'countdown' && (
                            <div className="flex flex-col items-center gap-3">
                                <button onClick={togglePlay} className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 ${status !== 'idle' ? 'bg-white/10 border border-white/10 hover:bg-white/20' : 'bg-pale-gold shadow-[0_0_30px_rgba(229,214,167,0.2)] hover:scale-105'}`}>
                                    {status === 'active' && !isPaused ? (<Pause size={24} className="text-white fill-current" />) : (<Play size={26} className={`fill-current ${status === 'idle' ? 'text-[#6F7B6D]' : 'text-white'}`} />)}
                                </button>
                                {status === 'idle' && (
                                    <span className="text-pale-gold/40 text-[9px] font-bold tracking-[0.2em] uppercase">Start Session</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SlideUpModal isOpen={showInfo} onClose={() => setShowInfo(false)} isDarkMode={isDarkMode} showCloseButton>
                <div className="px-8 py-10 pb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                            <Info size={24} className={isDarkMode ? 'text-white' : 'text-sage'} />
                        </div>
                        <h3 className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>{activeConfig.subLabel}</h3>
                    </div>
                    <p className={`opacity-70 text-base leading-relaxed mb-10 pl-[4rem] text-left ${isDarkMode ? 'text-white/80' : 'text-sage/80'}`}>{activeConfig.intro}</p>
                    <div className="space-y-10 pl-2">
                        <div className="space-y-6">
                            <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Technique</h4>
                            {activeConfig.instructions.map((inst, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold ${isDarkMode ? 'bg-white/20 text-white' : 'bg-sage/20 text-sage'}`}>{i + 1}</div>
                                    <div className="flex-1"><div className={`font-medium text-lg mb-1 leading-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>{inst.title}</div><div className={`opacity-70 text-sm leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>{inst.desc}</div></div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Key Benefits</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {activeConfig.benefits.map((b, i) => (
                                    <div key={i} className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}><div className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-sage'}`}>{b.title}</div><div className={`text-sm opacity-70 ${isDarkMode ? 'text-white/80' : 'text-sage/80'}`}>{b.desc}</div></div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-pale-gold/20 text-sage'}`}><Lightbulb size={18} /></div>
                            <div className="flex-1">
                                <h4 className={`font-medium text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-sage'}`}>Pro Tips</h4>
                                <ul className="space-y-2">{activeConfig.tips.map((tip, i) => (<li key={i} className={`flex items-start gap-2 text-sm opacity-70 ${isDarkMode ? 'text-white' : 'text-sage'}`}><span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-50 block shrink-0"></span>{tip}</li>))}</ul>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowInfo(false)} className={`w-full mt-12 py-4 rounded-xl font-bold tracking-widest text-sm uppercase transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-pale-gold text-sage-dark shadow-lg shadow-pale-gold/10' : 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20'}`}>Got It!</button>
                </div>
            </SlideUpModal>

            {/* Feature Info Modal */}
            <FeatureInfoModal
                isOpen={showFeatureInfo}
                onClose={() => setShowFeatureInfo(false)}
                isDarkMode={isDarkMode || false}
                featureName="Breathwork"
                howToUse={FEATURE_INFO.breathwork.howToUse}
                theScience={FEATURE_INFO.breathwork.theScience}
            />

            <EnhancementSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                isDarkMode={true}
                onUpdate={setEnhancements}
                exclude={['groundingHeartbeat']}
            />
        </div>
    );
});
