import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { readJSON } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { Play, Pause, X, Info, Lightbulb, Target, HelpCircle, Settings } from 'lucide-react';
import { haptics, useHaptics } from '../utils/haptics';
import { SlideUpModal } from './SlideUpModal';
import { FeatureInfoModal } from './FeatureInfoModal';
import { EnhancementSettings, DEFAULT_OPTIONS as DEFAULT_ENHANCEMENTS, type EnhancementOptions } from './EnhancementSettings';
import { FEATURE_INFO } from '../data/featureInfo';

// --- Types & Config ---
type Technique = 'Box' | '4-7-8' | 'Coherent';

interface BreathworkProps {
    onComplete?: () => void;
    onExit?: () => void;
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
            { name: 'Inhale', duration: 4 },
            { name: 'HoldIn', duration: 4 },
            { name: 'Exhale', duration: 4 },
        ] as const,
        intro: "A powerful technique used by professionals to instantly calm the nervous system and regain focus.",
        instructions: [
            { title: "Inhale (4s)", desc: "Build the charge." },
            { title: "Hold (4s)", desc: "Contain the energy." },
            { title: "Exhale (4s)", desc: "Release and expand." },
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
            { name: 'Inhale', duration: 6 },
            { name: 'Exhale', duration: 6 },
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

// ── Breathwork Visuals. CSS transitions only, zero per-frame JS ─────────────
// All animation runs on the GPU compositor via transform + opacity.
// Each component receives the current phase name and its duration (seconds);
// a CSS transition fires once per phase boundary, no rAF, no SVG math.

/** Sacred geometry background layer: static, one per technique */
const SacredGeo = memo(({ technique }: { technique: Technique }) => {
    const cx = 100, cy = 100;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const pt = (r: number, deg: number): [number, number] => [
        cx + r * Math.cos(toRad(deg)),
        cy + r * Math.sin(toRad(deg)),
    ];

    if (technique === 'Box') {
        // Metatron's Cube: Fruit of Life (13 circles) + all 78 connecting lines
        const d = 22;
        const centers: [number, number][] = [
            [cx, cy],
            ...Array.from({ length: 6 }, (_, i) => pt(d,     -90 + i * 60)),
            ...Array.from({ length: 6 }, (_, i) => pt(d * 2, -90 + i * 60)),
        ];
        const lines: React.ReactElement[] = [];
        for (let i = 0; i < centers.length; i++)
            for (let j = i + 1; j < centers.length; j++)
                lines.push(
                    <line key={`${i}-${j}`}
                        x1={centers[i][0]} y1={centers[i][1]}
                        x2={centers[j][0]} y2={centers[j][1]} />
                );
        return (
            <g fill="none" stroke="rgba(229,214,167,0.13)" strokeWidth="0.6">
                {centers.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={d} />)}
                {lines}
            </g>
        );
    }

    if (technique === '4-7-8') {
        // Golden Spiral: logarithmic spiral, grows by φ per quarter turn, 1.5 revolutions
        const phi = 1.6180339887;
        const N = 300, tMax = 3 * Math.PI;
        const pts = Array.from({ length: N }, (_, i) => {
            const t = (i / (N - 1)) * tMax;
            const r = 3.5 * Math.pow(phi, (2 * t) / Math.PI);
            const a = -Math.PI / 2 + t; // starts at 12 o'clock, winds clockwise
            return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
        });
        return (
            <polyline points={pts.join(' ')} fill="none"
                stroke="rgba(229,214,167,0.22)" strokeWidth="1.1" />
        );
    }

    // Coherent → Merkaba (two interlocking tetrahedra, 2-D star-tetrahedron projection)
    const R    = 56;
    const rHex = R / Math.sqrt(3);
    const upTri  = [-90,  30, 150].map(deg => pt(R, deg));
    const dnTri  = [ 90, -30, 210].map(deg => pt(R, deg));
    const hexPts = [-60,   0,  60, 120, 180, 240].map(deg => pt(rHex, deg));
    const str    = ([x, y]: [number, number]) => `${x.toFixed(2)},${y.toFixed(2)}`;

    return (
        <g fill="none" stroke="rgba(229,214,167,0.16)" strokeWidth="0.9">
            <polygon points={upTri.map(str).join(' ')} />
            <polygon points={dnTri.map(str).join(' ')} />
            <polygon points={hexPts.map(str).join(' ')} strokeWidth="0.55" />
            {hexPts.map((h, i) => (
                <line key={i} x1={cx} y1={cy} x2={h[0]} y2={h[1]} strokeWidth="0.5" />
            ))}
        </g>
    );
});

/** Unified ring visual: one ring track for all three techniques.
 *  Orb orbits the ring in one cycle. Tangential tick marks at phase transitions.
 *  Inner circle breathes with the phase. */
const RingVisual = memo(({ phase, duration, technique }: {
    phase: string; duration: number; technique: Technique;
}) => {
    const R  = 82;
    const cx = 100, cy = 100;
    const config       = TECHNIQUES[technique];
    const cycleDuration = config.phases.reduce((sum, p) => sum + p.duration, 0);

    // Angle from top (−90°), clockwise, mark every phase transition
    let acc = 0;
    const markerAngles: number[] = [];
    config.phases.forEach(p => {
        const deg = -90 + (acc / cycleDuration) * 360;
        markerAngles.push(deg);
        acc += p.duration;
    });

    const isExpanded = phase === 'Inhale' || phase === 'HoldIn';
    const ease = technique === 'Box'      ? 'linear'
               : technique === 'Coherent' ? 'ease-in-out'
               :                           'cubic-bezier(0.4, 0, 0.2, 1)';

    return (
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            <svg width="200" height="200" style={{ position: 'absolute', overflow: 'visible' }}>
                {/* Sacred geometry: bottom layer */}
                <SacredGeo technique={technique} />
                {/* Track ring */}
                <circle cx={cx} cy={cy} r={R}
                    fill="none" stroke="rgba(229,214,167,0.15)" strokeWidth="2" />
                {/* Tangential phase-transition markers */}
                {markerAngles.map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const mx  = cx + R * Math.cos(rad);
                    const my  = cy + R * Math.sin(rad);
                    const tx  = -Math.sin(rad);
                    const ty  =  Math.cos(rad);
                    const len = 6;
                    return (
                        <line key={i}
                            x1={mx - tx * len} y1={my - ty * len}
                            x2={mx + tx * len} y2={my + ty * len}
                            stroke="rgba(229,214,167,0.65)" strokeWidth="2.5" strokeLinecap="round" />
                    );
                })}
            </svg>
            {/* Inner breathing circle */}
            <div style={{
                position: 'absolute',
                width: 126, height: 126,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229,214,167,0.10) 10%, rgba(229,214,167,0.03) 60%, transparent 100%)',
                border: '1.5px solid rgba(229,214,167,0.32)',
                transform: `scale(${isExpanded ? 1 : 0.55})`,
                transition: `transform ${duration}s ${ease}`,
                willChange: 'transform',
            }} />
            {/* Center dot */}
            <div style={{
                position: 'absolute',
                width: 5, height: 5,
                borderRadius: '50%',
                background: 'rgba(229,214,167,0.45)',
                boxShadow: '0 0 4px rgba(229,214,167,0.3)',
            }} />
            {/* Orbiting bead: starts at 12 o'clock, travels clockwise */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 11, height: 11,
                marginTop: -5.5, marginLeft: -5.5,
                borderRadius: '50%',
                background: 'rgba(229,214,167,0.95)',
                boxShadow: '0 0 10px rgba(229,214,167,0.85), 0 0 22px rgba(229,214,167,0.4)',
                opacity: phase !== '' ? 1 : 0,
                transition: 'opacity 0.6s ease',
                animation: `orbit-ring ${cycleDuration}s linear infinite`,
                animationPlayState: phase !== '' ? 'running' : 'paused',
                willChange: 'transform',
            }} />
        </div>
    );
});

// --- Main Controller ---

export const Breathing = memo<BreathworkProps>(({ onComplete, onExit, onShowTip, isDarkMode = false }) => {
    const { triggerHaptic } = useHaptics();
    const [activeTechnique, setActiveTechnique] = useState<Technique>('Box');
    const [status, setStatus] = useState<'idle' | 'countdown' | 'active'>('idle');
    const [isPaused, setIsPaused] = useState(false);



    // Phase state drives CSS transitions: updates only at phase boundaries, not per-frame
    const [phaseState, setPhaseState] = useState<{ phase: string; duration: number }>({ phase: '', duration: 4 });

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
    const [_showControls, setShowControls] = useState(true);
    const [showFeatureInfo, setShowFeatureInfo] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [enhancements, setEnhancements] = useState<EnhancementOptions>(() => readJSON<EnhancementOptions>(STORAGE_KEYS.ENHANCEMENTS, DEFAULT_ENHANCEMENTS));

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [_nextTechnique, setNextTechnique] = useState<Technique | null>(null);

    // Listen for setting changes
    useEffect(() => {
        const handleSettingsUpdate = () => {
            const saved = readJSON<EnhancementOptions | null>(STORAGE_KEYS.ENHANCEMENTS, null);
            if (saved) setEnhancements(saved);
        };
        window.addEventListener('storage', handleSettingsUpdate);
        return () => window.removeEventListener('storage', handleSettingsUpdate);
    }, []);

    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);


    const [phaseName, setPhaseName] = useState('Ready');
    const [_phaseProgress, setPhaseProgress] = useState(0);
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
            }
        } catch { /* ignore */ }
    };

    const releaseWakeLock = useCallback(async () => {
        if (wakeLock) {
            try { await wakeLock.release(); setWakeLock(null); } catch { /* ignore */ }
        }
    }, [wakeLock]);

    const reset = useCallback(async () => {
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
            setPhaseState({ phase: activePhase.name, duration: activePhase.duration });
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

        setPhaseProgress(progress);
        setCurrentPhaseSimple(activePhase.name);

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
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [status, isPaused, activeTechnique, animate]);

    const pauseStartRef = useRef<number>(0);
    useEffect(() => {
        if (isPaused) { pauseStartRef.current = performance.now(); }
        else { if (pauseStartRef.current > 0) { pausedTimeRef.current += performance.now() - pauseStartRef.current; pauseStartRef.current = 0; } }
    }, [isPaused]);

    // Seed the visual with phase[0] the moment a session becomes active
    useEffect(() => {
        if (status === 'active') {
            const cfg = TECHNIQUES[activeTechnique];
            setPhaseState({ phase: cfg.phases[0].name, duration: cfg.phases[0].duration });
        } else {
            setPhaseState({ phase: '', duration: 4 });
        }
    }, [status, activeTechnique]);



    // Background hue that shifts with breath phase (for dynamicBackgrounds enhancement)
    const getPhaseBackground = () => {
        if (currentPhaseSimple === 'Inhale')
            return 'radial-gradient(ellipse at 50% 50%, rgba(229,214,167,0.10) 0%, transparent 70%)';
        if (currentPhaseSimple === 'HoldIn')
            return 'radial-gradient(ellipse at 50% 50%, rgba(229,214,167,0.15) 0%, transparent 65%)';
        if (currentPhaseSimple === 'Exhale')
            return 'radial-gradient(ellipse at 50% 50%, rgba(126,159,137,0.12) 0%, transparent 70%)';
        if (currentPhaseSimple === 'HoldOut')
            return 'radial-gradient(ellipse at 50% 50%, rgba(74,111,165,0.08) 0%, transparent 70%)';
        return 'none';
    };

    const renderVisual = () => {
        const { phase, duration } = phaseState;
        return <RingVisual key={activeTechnique} phase={phase} duration={duration} technique={activeTechnique} />;
    };

    return (
        <>
        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes breathe-idle {
                0%, 100% { transform: scale(1.0); }
                50% { transform: scale(1.08); }
            }
            .animate-breathe-idle {
                animation: breathe-idle 6s ease-in-out infinite;
            }
            @keyframes orbit-ring {
                from { transform: rotate(-90deg) translateX(82px); }
                to   { transform: rotate(270deg) translateX(82px); }
            }
        ` }} />
        <div
            className="relative w-full h-full flex flex-col items-center text-white overflow-hidden bg-transparent"
            onMouseMove={() => { setShowControls(true); setTimeout(() => setShowControls(false), 3000); }}
            onTouchStart={() => setShowControls(true)}
        >
            {/* Dark Sensory Mode Overlay: screen goes black, haptics only */}
            {enhancements.hapticDarkMode && status === 'active' && (
                <div
                    className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center select-none"
                    onDoubleClick={() => reset()}
                >
                    <div className="text-center">
                        <p className="text-white text-xs uppercase tracking-[0.35em] mb-12">Dark Sensory Mode</p>
                        <div className="text-white text-6xl font-display font-light tracking-[0.15em] mb-4">
                            {isPaused ? 'PAUSED' : phaseName}
                        </div>
                        <div className="text-white text-5xl font-mono font-light tabular-nums">{timeLeftInPhase}s</div>
                        <div className="text-white font-mono text-sm mt-10">
                            {Math.floor(totalSecondsLeft / 60)}:{String(totalSecondsLeft % 60).padStart(2, '0')} remaining
                        </div>
                    </div>
                    <div className="absolute bottom-14 text-center">
                        <p className="text-white text-xs uppercase tracking-[0.3em]">Double-tap to exit</p>
                    </div>
                </div>
            )}
            {/* Dynamic background: warm gold on inhale, cool sage on exhale */}
            {enhancements.dynamicBackgrounds && status === 'active' && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        background: getPhaseBackground(),
                        transition: 'background 2000ms ease-in-out',
                    }}
                />
            )}
            {enhancements.natureParticles && (status === 'active' || status === 'countdown') && <SakuraPetals isDarkMode={isDarkMode} />}
            {/* Session controls: only rendered (and take layout space) when session is running */}
            {status !== 'idle' && (
                <div className="relative z-50 w-full px-6 flex items-center justify-between mb-2"
                  style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
                >
                    {/* Left: Exit */}
                    <button
                        onClick={() => { reset(); if (onExit) onExit(); else onComplete?.(); }}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                        <X size={16} />
                    </button>

                    {/* Center: Tip + Timer */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onShowTip?.()}
                            className="inline-flex items-center gap-2 text-pale-gold"
                        >
                            <div className="p-1 rounded-full bg-white/5">
                                <Target size={14} strokeWidth={2} />
                            </div>
                            <span className="text-base font-bold uppercase tracking-wider opacity-90">Tip</span>
                        </button>
                        <div className="font-mono text-base font-bold text-white/90 tracking-wider">
                            {Math.floor(totalSecondsLeft / 60)}:{Math.floor(totalSecondsLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>

                    {/* Right: balance spacer */}
                    <div className="w-8" />
                </div>
            )}

            <div className="relative z-10 flex-1 w-full flex flex-col items-center">

                {/* Description Text & Landing UI, collapses when session is running */}
                <div className={`w-full px-6 transition-all duration-700 ease-in-out overflow-hidden ${
                    status === 'idle' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}>
                    {/* Header: same pattern as Meditation */}
                    <div className="pt-6 mb-5">
                        <h1 className="font-display font-medium text-3xl text-white">Breathwork</h1>
                        <p className="text-xs uppercase tracking-[0.25em] font-black mt-1 text-white">Regulate your breath</p>
                    </div>
                    {/* Technique description */}
                    <div className="mb-5">
                        <p className="text-base text-white/80 font-medium tracking-wide mb-1">
                            {activeConfig.label} <span className="text-white mx-2">•</span> {activeConfig.subLabel}
                        </p>
                        <p className="text-sm text-white leading-relaxed">
                            {activeConfig.intro}
                        </p>
                    </div>
                    {/* Action buttons: two pills + exit, no overflow */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { haptics.light(); setShowFeatureInfo(true); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white/80 active:scale-95 transition-all"
                        >
                            <HelpCircle size={13} strokeWidth={2.5} />
                            <span className="whitespace-nowrap">How to Use</span>
                        </button>
                        <button
                            onClick={() => { haptics.light(); setShowSettings(true); }}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${enhancements.groundingHeartbeat ? 'bg-pale-gold text-warm-gray-green shadow-[0_0_15px_rgba(229,214,167,0.4)]' : 'bg-white/10 text-white/80'}`}
                        >
                            <Settings size={13} strokeWidth={2.5} />
                            <span className="whitespace-nowrap">Enhancements</span>
                        </button>
                        <button
                            onClick={() => { haptics.light(); if (onExit) onExit(); else onComplete?.(); }}
                            className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                        >
                            <X size={13} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Visual Area: grows to fill available space, animation scales up when active */}
                <div
                    className={`relative flex-1 flex items-center justify-center w-full ${
                        status === 'idle' ? 'animate-breathe-idle' : ''
                    } ${isTransitioning ? 'blur-md' : 'blur-0'}`}
                    style={{
                        opacity: isTransitioning ? 0 : status === 'countdown' ? 0.08 : 1,
                        transition: 'opacity 500ms ease, filter 600ms ease',
                    }}
                >
                    <div style={{
                        transform: `scale(${status === 'active' ? 1.65 : 1.2})`,
                        transition: 'transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transformOrigin: 'center center',
                    }}>
                        {renderVisual()}
                    </div>
                </div>

                {/* Content Stack: Selector -> Play Button */}
                <div className="flex flex-col items-center gap-3 w-full max-w-sm px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">

                    {/* Technique Selector (Always Visible) */}
                    <div className="flex p-0.5 bg-black/20 backdrop-blur-xl rounded-full border border-white/5 relative z-50">
                        {(Object.keys(TECHNIQUES) as Technique[]).map((tech) => (
                            <button key={tech} onClick={() => {
                                haptics.selection();
                                changeTechnique(tech);
                            }} className={`px-5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${activeTechnique === tech ? 'bg-pale-gold text-warm-gray-green shadow-lg' : 'text-white hover:text-white/60'}`}>{TECHNIQUES[tech].label}</button>
                        ))}
                    </div>

                    {/* Countdown / Stats */}
                    <div className="relative min-h-[90px] flex flex-col items-center justify-center w-full gap-4">
                        {status === 'countdown' && (
                            <div className="text-center animate-pulse">
                                <span className="text-5xl font-display font-light text-white">{countdownVal}</span>
                                <div className="text-xs uppercase tracking-[0.2em] text-white mt-1">Get Ready</div>
                            </div>
                        )}

                        {status === 'active' && (
                            <div className="text-center flex flex-col gap-1 z-20">
                                <span key={phaseName} className="text-white/90 text-xs font-bold tracking-[0.3em] uppercase animate-fade-in">{isPaused ? 'PAUSED' : phaseName}</span>
                                <span className="text-pale-gold text-3xl font-mono font-light tabular-nums">{timeLeftInPhase}s</span>
                            </div>
                        )}

                        {/* Play Button (Only show in idle or active, hidden during countdown) */}
                        {status !== 'countdown' && (
                            <div className="flex flex-col items-center gap-3">
                                <button onClick={togglePlay} className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 ${status !== 'idle' ? 'bg-white/10 border border-white/10 hover:bg-white/20' : 'bg-pale-gold shadow-[0_0_30px_rgba(229,214,167,0.2)] hover:scale-105'}`}>
                                    {status === 'active' && !isPaused ? (<Pause size={24} className="text-white fill-current" />) : (<Play size={26} className={`fill-current ${status === 'idle' ? 'text-[#6F7B6D]' : 'text-white'}`} />)}
                                </button>
                                {status === 'idle' && (
                                    <span className="text-pale-gold/40 text-xs font-bold tracking-[0.2em] uppercase">Start Session</span>
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
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-base font-bold ${isDarkMode ? 'bg-white/20 text-white' : 'bg-sage/20 text-sage'}`}>{i + 1}</div>
                                    <div className="flex-1"><div className={`font-medium text-lg mb-1 leading-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>{inst.title}</div><div className={`opacity-70 text-base leading-relaxed ${isDarkMode ? 'text-white' : 'text-sage/60'}`}>{inst.desc}</div></div>
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
        </>
    );
});
