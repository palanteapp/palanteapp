import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle } from 'lucide-react';
import { Countdown } from './Countdown';

interface BreathingProps {
    isDarkMode: boolean;
    accentColor: string;
    onComplete?: () => void;
}

type Technique = 'Box' | '4-7-8' | 'Coherent';

interface PhaseConfig {
    name: string;
    duration: number;
    next: string;
}

const TECHNIQUES: Record<Technique, Record<string, PhaseConfig>> = {
    'Box': {
        'Inhale': { name: 'Inhale', duration: 4, next: 'Hold' },
        'Hold': { name: 'Hold', duration: 4, next: 'Exhale' },
        'Exhale': { name: 'Exhale', duration: 4, next: 'Hold ' },
        'Hold ': { name: 'Hold', duration: 4, next: 'Inhale' },
    },
    '4-7-8': {
        'Empty': { name: 'Exhale', duration: 1, next: 'Inhale' }, // Quick reset
        'Inhale': { name: 'Inhale', duration: 4, next: 'Hold' },
        'Hold': { name: 'Hold', duration: 7, next: 'Exhale' },
        'Exhale': { name: 'Exhale', duration: 8, next: 'Inhale' }, // Simplified loop
    },
    'Coherent': {
        'Inhale': { name: 'Inhale', duration: 6, next: 'Exhale' },
        'Exhale': { name: 'Exhale', duration: 6, next: 'Inhale' },
    }
};

export const Breathing: React.FC<BreathingProps> = ({ isDarkMode, onComplete }) => {
    const [isActive, setIsActive] = useState(false);
    const [technique, setTechnique] = useState<Technique>('Box');
    const [phase, setPhase] = useState<string>('Inhale');
    const [timeLeft, setTimeLeft] = useState(4);
    const [sessionTime, setSessionTime] = useState(0);
    const [hasLoggedSession, setHasLoggedSession] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);

    const currentDuration = TECHNIQUES[technique][phase]?.duration || 4;

    const handleCountdownComplete = () => {
        setIsCountingDown(false);
        setIsActive(true);
    };

    const toggleTimer = () => {
        if (isActive) {
            setIsActive(false);
        } else {
            setIsCountingDown(true);
        }
    };

    // Timer effect
    useEffect(() => {
        if (!isActive) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive]);

    // Phase transition effect
    useEffect(() => {
        if (isActive && timeLeft === 0) {
            const currentConfig = TECHNIQUES[technique]?.[phase];
            if (currentConfig) {
                const nextPhase = currentConfig.next;
                const nextConfig = TECHNIQUES[technique]?.[nextPhase];

                if (nextConfig) {
                    setPhase(nextPhase);
                    setTimeLeft(nextConfig.duration);
                }
            }
        }
    }, [isActive, timeLeft, technique, phase]);

    // Reset effect
    useEffect(() => {
        setIsActive(false);
        const initialPhase = 'Inhale';
        setPhase(initialPhase);
        setTimeLeft(TECHNIQUES[technique][initialPhase].duration);
        setSessionTime(0);
        setHasLoggedSession(false);
    }, [technique]);

    // Session timer
    useEffect(() => {
        let sessionTimer: ReturnType<typeof setInterval>;
        if (isActive) {
            sessionTimer = setInterval(() => {
                setSessionTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(sessionTimer);
    }, [isActive]);

    const handleComplete = () => {
        if (sessionTime >= 60 && !hasLoggedSession && onComplete) {
            onComplete();
            setHasLoggedSession(true);
        }
    };

    const isInhaling = phase === 'Inhale';
    const isHolding = phase.includes('Hold');

    // Determine scale based on phase
    const getScale = () => {
        if (!isActive) return 'scale-100 opacity-50'; // Resting state
        if (isInhaling) return 'scale-150'; // Expanded
        if (isHolding) return 'scale-150'; // Stay expanded
        return 'scale-100'; // Contracted (Exhale)
    };

    const bgClass = isDarkMode
        ? 'bg-warm-gray-green'
        : 'bg-gradient-to-b from-ivory to-sand-beige';

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';

    // Organic blob animation styles
    const blobKeyframes = `
        @keyframes blob-breathe {
            0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            50% { border-radius: 40% 60% 30% 70% / 40% 40% 60% 50%; }
            75% { border-radius: 70% 30% 50% 50% / 30% 40% 60% 70%; }
        }
        .animate-blob {
            animation: blob-breathe 10s ease-in-out infinite;
        }
    `;

    return (
        <div className={`fixed inset-0 flex flex-col items-center justify-center pt-32 overflow-hidden transition-colors duration-500 z-10 ${bgClass}`}>
            <style>{blobKeyframes}</style>

            {/* Geometric Circles (Consistent with global design) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className={`absolute top-0 right-0 w-[80vmin] h-[80vmin] rounded-full translate-x-1/3 -translate-y-1/3 opacity-20 ${isDarkMode ? 'bg-white' : 'bg-sage'}`}
                />
                <div
                    className="absolute bottom-0 left-0 w-[65vmin] h-[65vmin] rounded-full -translate-x-1/3 translate-y-1/3 bg-pale-gold opacity-20"
                />
            </div>

            {/* Ambient Background removed - circles added above */}

            {/* Title */}
            <div className="text-center mb-12 z-20">
                <h2 className={`text-5xl md:text-6xl font-display font-medium mb-3 tracking-tight ${textPrimary}`}>Breathwork</h2>
                <p className={`text-lg font-body tracking-wide ${textSecondary}`}>Sync your mind and body</p>
            </div>

            {/* Technique Selector */}
            <div className="flex gap-2 mb-16 z-20 bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                {(['Box', '4-7-8', 'Coherent'] as Technique[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTechnique(t)}
                        className={`px-6 py-2 rounded-full text-sm font-body font-medium transition-all duration-300 ${technique === t
                            ? isDarkMode
                                ? 'bg-white text-warm-gray-green shadow-lg'
                                : 'bg-sage text-white shadow-spa'
                            : isDarkMode
                                ? 'text-white/60 hover:text-white hover:bg-white/10'
                                : 'text-sage/60 hover:text-sage hover:bg-sage/10'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Main Breathing Visual */}
            <div className="relative flex items-center justify-center mb-16 z-10 w-[500px] h-[500px]">
                {/* 1. Outer Guidance Ring (Static) */}
                <div className={`absolute w-[350px] h-[350px] rounded-full border border-dashed transition-colors duration-1000 ${isDarkMode ? 'border-white/10' : 'border-sage/20'}`}></div>

                {/* 2. Expanding Breath Orb (The Blob) */}
                <div
                    className={`absolute w-[250px] h-[250px] animate-blob transition-all ease-in-out ${getScale()} ${isDarkMode
                        ? 'bg-gradient-to-br from-white/20 to-white/5 shadow-[0_0_60px_rgba(255,255,255,0.1)]'
                        : 'bg-gradient-to-br from-sage to-sage/80 shadow-[0_0_60px_rgba(181,194,163,0.4)]'
                        }`}
                    style={{
                        transitionDuration: `${currentDuration}s`, // Dynamic duration based on phase
                    }}
                ></div>

                {/* 3. Inner Core (Glow) */}
                <div
                    className={`absolute w-[180px] h-[180px] rounded-full blur-2xl transition-all duration-1000 ${isDarkMode ? 'bg-white/10' : 'bg-white/40'
                        }`}
                ></div>

                {/* Text Overlay */}
                <div className="relative flex flex-col items-center justify-center z-20 pointer-events-none">
                    <span
                        key={phase} // Key triggers animation on change
                        className={`text-3xl font-display font-medium mb-2 ${textPrimary} animate-fade-in-up`}
                    >
                        {TECHNIQUES[technique][phase]?.name}
                    </span>
                    <span className={`text-7xl font-display font-medium tabular-nums ${isDarkMode ? 'text-white/80' : 'text-white/90'}`}>
                        {timeLeft}
                    </span>
                </div>
            </div>

            {/* Countdown Overlay */}
            <Countdown isActive={isCountingDown} onComplete={handleCountdownComplete} />

            {/* Controls */}
            <div className="flex items-center gap-6 z-20">
                <button
                    onClick={toggleTimer}
                    className={`tap-zone h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-105 ${isActive
                        ? isDarkMode ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-sage border border-sage/10'
                        : isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white'
                        }`}
                >
                    {isActive ? <Pause size={28} /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>

                {sessionTime >= 60 && !hasLoggedSession && (
                    <button
                        onClick={handleComplete}
                        className={`tap-zone px-6 py-3 rounded-full font-display font-medium transition-all duration-300 animate-fade-in flex items-center gap-2 ${isDarkMode
                            ? 'bg-pale-gold text-warm-gray-green hover:bg-pale-gold/90'
                            : 'bg-warm-gray-green text-white hover:bg-warm-gray-green/90'
                            }`}
                    >
                        <CheckCircle size={20} />
                        <span>Complete</span>
                    </button>
                )}
            </div>

            {/* Helper Text */}
            {!isActive && (
                <p className={`mt-8 text-sm font-body tracking-wide opacity-80 ${textSecondary}`}>
                    Select a technique and press play to begin
                </p>
            )}

            {/* Session Timer */}
            {isActive && sessionTime > 0 && (
                <div className={`mt-8 px-4 py-1 rounded-full text-xs font-mono tracking-widest uppercase ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-sage/5 text-sage/60'
                    }`}>
                    Session {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
                </div>
            )}
        </div>
    );
};
