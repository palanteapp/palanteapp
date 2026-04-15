
import React, { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
    Timer,
    Settings,
    Play,
    Pause,
    RotateCcw,
    Coffee,
    Brain,
    CheckCircle2,
    Volume2,
    VolumeX,
    HelpCircle,
    Microscope,
    Droplet,
    Wind,
    X,
    Bell,
    ArrowRight,
    SkipForward,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { FeatureInfoModal } from './FeatureInfoModal';

import { useTheme } from '../contexts/ThemeContext';

interface PomodoroTimerProps {
    onAddHydration?: () => void;
}

// ... (BREAK_SUGGESTIONS and playBell remain same)

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onAddHydration }) => {
    const { isDarkMode } = useTheme();
    // Settings State (persisted)
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
        return saved ? JSON.parse(saved) : { focus: 25, shortBreak: 5, longBreak: 15 };
    });

    // Timer State
    const [mode, setMode] = useState<PomodoroMode>('focus');
    const [timeLeft, setTimeLeft] = useState(settings.focus * 60);
    const [isActive, setIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showInfo, setShowInfo] = useState<'science' | 'how-to' | null>(null);
    const [currentSuggestion, setCurrentSuggestion] = useState(BREAK_SUGGESTIONS[0]);
    const [cyclesCompleted, setCyclesCompleted] = useState(0);

    // Break prompt state — shown when focus session ends, before break auto-starts
    const [showBreakPrompt, setShowBreakPrompt] = useState(false);
    const [pendingBreakMode, setPendingBreakMode] = useState<'shortBreak' | 'longBreak' | null>(null);

    const bellFiredRef = useRef(false);

    // Sync timer when mode/settings change (if not active)
    useEffect(() => {
        if (!isActive) {
            const duration = mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
            setTimeLeft(duration * 60);
            bellFiredRef.current = false;
        }
        localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
    }, [settings, mode, isActive]);

    // Timer Logic — FOCUS: plays bell + shows manual prompt. BREAK: simply stops.
    const handleFocusComplete = () => {
        setIsActive(false);
        haptics.success();
        triggerConfetti();
        playBell(isMuted);

        const newCycles = cyclesCompleted + 1;
        const nextBreak: 'shortBreak' | 'longBreak' = newCycles >= 4 ? 'longBreak' : 'shortBreak';
        setPendingBreakMode(nextBreak);
        setCyclesCompleted(nextBreak === 'longBreak' ? 0 : newCycles);
        setCurrentSuggestion(BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]);
        setShowBreakPrompt(true);  // Always manual — never auto-start
    };

    const handleBreakComplete = () => {
        setIsActive(false);
        haptics.success();
        playBell(isMuted);
        // Return to focus mode — user must press Play manually
        setMode('focus');
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0 && !bellFiredRef.current) {
            bellFiredRef.current = true;
            setTimeout(() => {
                if (mode === 'focus') {
                    handleFocusComplete();
                } else {
                    handleBreakComplete();
                }
            }, 0);
        }
        return () => { if (interval) clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, timeLeft, mode]);

    const handleStartBreak = () => {
        if (!pendingBreakMode) return;
        setShowBreakPrompt(false);
        setMode(pendingBreakMode);
        setPendingBreakMode(null);
        bellFiredRef.current = false;
        // User must press Play — do NOT auto-start
    };

    const handleSkipBreak = () => {
        setShowBreakPrompt(false);
        setPendingBreakMode(null);
        setMode('focus');
        bellFiredRef.current = false;
        // User must press Play — do NOT auto-start
    };

    const toggleTimer = () => {
        setIsActive(prev => !prev);
        haptics.medium();
    };

    const resetTimer = () => {
        setIsActive(false);
        bellFiredRef.current = false;
        const duration = mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
        setTimeLeft(duration * 60);
        haptics.light();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const totalSeconds = (mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
    const progress = 1 - (timeLeft / totalSeconds); // 0 → 1 as time fills up

    // SVG circle params
    const R = 145;
    const CIRC = 2 * Math.PI * R;

    // Theme values
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage/60';
    const bgCard = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-sage/10 shadow-sm';

    // Session circle fill color
    const accentStroke = mode === 'focus'
        ? (isDarkMode ? '#D4943A' : '#B05530')   // amber / sage
        : (isDarkMode ? '#7A9B84' : '#4A5D4E');   // sage for break

    // Cycle dot fill colors
    const dotFilled = isDarkMode ? '#D4943A' : '#B05530';

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto px-6 pt-6 animate-fade-in pb-32">
            {/* Header */}
            <div className="w-full flex flex-col items-center mb-8 gap-5">
                <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Timer className={isDarkMode ? 'text-pale-gold' : 'text-terracotta-500'} size={24} />
                        <h2 className={`font-display font-medium text-2xl ${textPrimary}`}>Pomodoro Timer</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'} ${textSecondary}`}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-full ${showSettings ? ('bg-terracotta-500 text-white hover:scale-105') : `${isDarkMode ? 'bg-white/5' : 'bg-sage/5'} ${textSecondary}`}`}
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Info Buttons Row */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={() => { haptics.light(); setShowInfo('how-to'); }}
                        className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-sage/10 text-sage/40 hover:bg-sage/5'}`}
                    >
                        <HelpCircle size={12} /> How to Use
                    </button>
                    <button
                        onClick={() => { haptics.light(); setShowInfo('science'); }}
                        className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-sage/10 text-sage/40 hover:bg-sage/5'}`}
                    >
                        <Microscope size={12} /> The Science
                    </button>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className={`flex p-1 rounded-2xl mb-10 w-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                {(['focus', 'shortBreak', 'longBreak'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => {
                            setMode(m);
                            setIsActive(false);
                            bellFiredRef.current = false;
                            haptics.selection();
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === m
                            ? (isDarkMode ? 'bg-pale-gold text-sage-dark shadow-lg' : 'bg-terracotta-500 text-white shadow-lg')
                            : textSecondary
                            }`}
                    >
                        {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </button>
                ))}
            </div>

            {/* Main Timer Circle */}
            <div className="relative w-80 h-80 flex items-center justify-center mb-8">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 320 320">
                    {/* Track */}
                    <circle
                        cx="160" cy="160" r={R}
                        fill="none"
                        stroke={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                        strokeWidth="12"
                    />
                    {/* Fill — grows as time elapses */}
                    <circle
                        cx="160" cy="160" r={R}
                        fill="none"
                        stroke={accentStroke}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC * (1 - progress)}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>

                <div className="z-10 text-center">
                    <div className={`text-6xl font-display font-medium tabular-nums mb-2 ${textPrimary}`}>
                        {formatTime(timeLeft)}
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-[0.2em] opacity-40 ${textPrimary}`}>
                        {mode === 'focus' ? 'Stay Boundless' : 'Rest Well'}
                    </div>
                </div>
            </div>

            {/* Session Progress Circles */}
            <div className="flex justify-center items-center gap-3 mb-10">
                {[...Array(4)].map((_, i) => {
                    const isFilled = i < cyclesCompleted;
                    // Current active session partially fills
                    const isCurrent = i === cyclesCompleted && mode === 'focus' && isActive;
                    const segFill = isCurrent ? progress : isFilled ? 1 : 0;
                    const SR = 10;
                    const SCIRC = 2 * Math.PI * SR;
                    return (
                        <svg key={i} width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
                            <circle
                                cx="14" cy="14" r={SR}
                                fill="none"
                                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(74,93,78,0.12)'}
                                strokeWidth="3"
                            />
                            <circle
                                cx="14" cy="14" r={SR}
                                fill="none"
                                stroke={dotFilled}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={SCIRC}
                                strokeDashoffset={SCIRC * (1 - segFill)}
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                    );
                })}
            </div>

            {/* Manual Controls */}
            <div className="flex items-center gap-4 mb-12">
                <button
                    onClick={resetTimer}
                    className={`p-4 rounded-full border transition-all ${isDarkMode ? 'border-white/10 text-white/40 hover:text-white' : 'border-sage/10 text-sage/40 hover:text-sage'}`}
                >
                    <RotateCcw size={24} />
                </button>
                <button
                    onClick={toggleTimer}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl ${'bg-terracotta-500 text-white hover:scale-105'}`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                {/* Skip pill — jumps to next mode without waiting */}
                <button
                    onClick={() => {
                        setIsActive(false);
                        bellFiredRef.current = true; // prevent double-fire
                        if (mode === 'focus') {
                            const newCycles = cyclesCompleted + 1;
                            const nextBreak: 'shortBreak' | 'longBreak' = newCycles >= 4 ? 'longBreak' : 'shortBreak';
                            setCyclesCompleted(nextBreak === 'longBreak' ? 0 : newCycles);
                            setCurrentSuggestion(BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]);
                            setPendingBreakMode(nextBreak);
                            setShowBreakPrompt(true);
                        } else {
                            setMode('focus');
                            bellFiredRef.current = false;
                        }
                        haptics.light();
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white' : 'border-sage/10 text-sage/40 hover:bg-sage/5 hover:text-sage'}`}
                    title="Skip to next session"
                >
                    <SkipForward size={14} />
                    Skip
                </button>
            </div>

            {/* Break Suggestion Card */}
            <AnimatePresence mode="wait">
                {mode !== 'focus' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`w-full p-6 rounded-[2rem] border ${bgCard} text-center`}
                    >
                        <div className={`inline-flex p-3 rounded-2xl mb-4 ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold' : 'bg-terracotta-500/10 text-terracotta-500'}`}>
                            <currentSuggestion.icon size={24} />
                        </div>
                        <h3 className={`text-lg font-display font-medium mb-3 ${textPrimary}`}>Coach Suggestion</h3>
                        <p className={`text-sm leading-relaxed mb-6 ${textSecondary}`}>
                            {currentSuggestion.text}
                        </p>
                        {currentSuggestion.action === 'hydrate' && (
                            <button
                                onClick={() => { onAddHydration?.(); haptics.success(); }}
                                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${'bg-terracotta-500 text-white hover:scale-105'}`}
                            >
                                Track Water
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Break Prompt Modal ── appears after focus session ends ── */}
            <AnimatePresence>
                {showBreakPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center pb-12 px-6"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className={`w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#1e2820]' : 'bg-white'}`}
                        >
                            {/* Top accent bar */}
                            <div className={`h-1.5 w-full ${isDarkMode ? 'bg-pale-gold' : 'bg-terracotta-500'}`} />
                            <div className="p-7 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDarkMode ? 'bg-pale-gold/15 text-pale-gold' : 'bg-terracotta-500/10 text-terracotta-500'}`}>
                                    <Bell size={28} />
                                </div>
                                <h3 className={`text-xl font-display font-bold mb-2 ${textPrimary}`}>
                                    Focus session complete!
                                </h3>
                                <p className={`text-sm mb-7 ${textSecondary}`}>
                                    {pendingBreakMode === 'longBreak'
                                        ? "4 sessions done — you've earned a long break. Ready?"
                                        : "Great work. Would you like to take a short break?"}
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleStartBreak}
                                        className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${'bg-terracotta-500 text-white hover:scale-105'}`}
                                    >
                                        <Coffee size={16} />
                                        {pendingBreakMode === 'longBreak' ? 'Start Long Break (15 min)' : 'Start Short Break (5 min)'}
                                    </button>
                                    <button
                                        onClick={handleSkipBreak}
                                        className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${isDarkMode ? 'border-white/10 text-white/50 hover:bg-white/5' : 'border-sage/15 text-sage/50 hover:bg-sage/5'}`}
                                    >
                                        <SkipForward size={14} />
                                        Skip — Keep Going
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <SlideUpModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                isDarkMode={isDarkMode}
                showCloseButton={false}
                position="center"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-2xl font-display font-medium ${textPrimary}`}>Timer Settings</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {(['focus', 'shortBreak', 'longBreak'] as const).map(key => (
                            <div key={key}>
                                <div className="flex justify-between mb-4">
                                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>
                                        {key === 'focus' ? 'Focus Work' : key === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                    </span>
                                    <span className={`text-sm font-bold ${textPrimary}`}>{settings[key]}m</span>
                                </div>
                                <input
                                    type="range"
                                    min={key === 'focus' ? 10 : 1}
                                    max={key === 'focus' ? 60 : 30}
                                    value={settings[key]}
                                    onChange={(e) => setSettings({ ...settings, [key]: parseInt(e.target.value) })}
                                    className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}
                                    onMouseUp={() => haptics.selection()}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowSettings(false)}
                        className={`w-full mt-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest active:scale-95 transition-all outline-none ${isDarkMode ? 'bg-pale-gold text-sage-dark shadow-lg shadow-pale-gold/20' : 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20'}`}
                    >
                        Save Changes
                    </button>
                </div>
            </SlideUpModal>

            {/* Info Modal */}
            <FeatureInfoModal
                isOpen={!!showInfo}
                onClose={() => setShowInfo(null)}
                isDarkMode={isDarkMode}
                featureName="Pomodoro Technique"
                howToUse={{
                    title: "The Pomodoro Method",
                    description: "A time management system that breaks work into intervals.",
                    steps: [
                        "Work for 25 minutes (Focus)",
                        "Take a 5-minute breather (Break)",
                        "Repeat 4 times",
                        "Take a longer 15-minute rest (Long Break)"
                    ],
                    tips: [
                        "Avoid all distractions during Focus",
                        "Actually step away from the desk during breaks",
                        "Use the Long Break to reset completely"
                    ]
                }}
                theScience={{
                    title: "The Science of Focus",
                    overview: "Human focus begins to degrade after 90 minutes. Short, scheduled breaks allow the prefrontal cortex to 'reset'.",
                    benefits: [
                        "Prevents decision fatigue",
                        "Maintains high quality of output",
                        "Reduces mental exhaustion",
                        "Improves task consistency"
                    ],
                    research: "Research shows that brief diversions from a task can dramatically improve one's ability to focus on that task for long periods."
                }}
            />
        </div>
    );
};
