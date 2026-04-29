
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    ArrowRight,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { FeatureInfoModal } from './FeatureInfoModal';

interface PomodoroTimerProps {
    isDarkMode: boolean;
    onAddHydration?: () => void;
}

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const BREAK_SUGGESTIONS = [
    { text: "Stretch your body gently. Reach for the sky and let your breath flow. You've been doing great work.", icon: Wind },
    { text: "Flow with hydration. Your brain thrives on water. Drink a full glass to stay clear and focused.", icon: Droplet, action: 'hydrate' },
    { text: "Wake up your energy with 10 gentle squats. Feel the strength in your foundation.", icon: Brain },
    { text: "Give your eyes a rest. Look out a window at the horizon for 20 seconds. Let your vision expand.", icon: CheckCircle2 },
    { text: "Take 5 deep intentional breaths. Inhale peace for 4, hold clarity for 4, exhale tension for 8.", icon: Wind },
    { text: "Step away from the digital world for a moment. Even a short walk to another room resets your spirit.", icon: Coffee }
];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isDarkMode, onAddHydration }) => {
    // Settings State (persisted)
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('palante_pomodoro_settings');
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

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sync timer when settings change (if not active)
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(settings[mode === 'focus' ? 'focus' : mode === 'shortBreak' ? 'shortBreak' : 'longBreak'] * 60);
        }
        localStorage.setItem('palante_pomodoro_settings', JSON.stringify(settings));
    }, [settings, mode, isActive]);

    // Timer Logic
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleComplete = () => {
        setIsActive(false);
        haptics.success();
        triggerConfetti();

        if (!isMuted) {
            const audio = new Audio('/sounds/gong-sfx.mp3');
            audio.play().catch(e => console.error("Audio error", e));
        }

        // Cycle mode or stay
        if (mode === 'focus') {
            const newCycles = cyclesCompleted + 1;
            if (newCycles >= 4) {
                setMode('longBreak');
                setCyclesCompleted(0);
                setCurrentSuggestion(BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]);
            } else {
                setMode('shortBreak');
                setCyclesCompleted(newCycles);
                setCurrentSuggestion(BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]);
            }
        } else {
            setMode('focus');
        }
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
        haptics.medium();
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(settings[mode === 'focus' ? 'focus' : mode === 'shortBreak' ? 'shortBreak' : 'longBreak'] * 60);
        haptics.light();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progress = (timeLeft / (settings[mode === 'focus' ? 'focus' : mode === 'shortBreak' ? 'shortBreak' : 'longBreak'] * 60)) * 100;

    // Theme values
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage/60';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
    const bgCard = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-sage/10 shadow-sm';

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto px-6 pt-6 animate-fade-in pb-32">
            {/* Header */}
            <div className="w-full flex flex-col items-center mb-8 gap-5">
                <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Timer className={accentColor} size={24} />
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
                            className={`p-2 rounded-full ${showSettings ? 'bg-pale-gold text-warm-gray-green' : isDarkMode ? 'bg-white/5' : 'bg-sage/5'} ${textSecondary}`}
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Info Buttons Row */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={() => {
                            haptics.light();
                            setShowInfo('how-to');
                        }}
                        className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-sage/10 text-sage/40 hover:bg-sage/5'}`}
                    >
                        <HelpCircle size={12} /> How to Use
                    </button>
                    <button
                        onClick={() => {
                            haptics.light();
                            setShowInfo('science');
                        }}
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
                            haptics.selection();
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === m
                            ? (isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-lg' : 'bg-sage text-white shadow-lg')
                            : textSecondary
                            }`}
                    >
                        {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </button>
                ))}
            </div>

            {/* Main Timer Circle */}
            <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="160" cy="160" r="145"
                        fill="none" stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} strokeWidth="10"
                    />
                    <circle
                        cx="160" cy="160" r="145"
                        fill="none" stroke={isDarkMode ? '#E5D6A7' : '#3A453C'} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 145}
                        strokeDashoffset={2 * Math.PI * 145 * (1 - progress / 100)}
                        className="transition-all duration-1000 ease-linear"
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

            {/* Cycle Indicators */}
            <div className="flex justify-center items-center gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-500 border-2 shadow-sm
                        ${isDarkMode ? 'border-pale-gold' : 'border-sage/40'} 
                        ${i < cyclesCompleted
                                ? (isDarkMode ? 'bg-pale-gold shadow-pale-gold/20' : 'bg-sage/80 shadow-sage/20 border-sage/80')
                                : 'bg-transparent'
                            }`}
                    />
                ))}
            </div>

            {/* Manual Controls */}
            <div className="flex items-center gap-6 mb-12">
                <button
                    onClick={resetTimer}
                    className={`p-4 rounded-full border transition-all ${isDarkMode ? 'border-white/10 text-white/40 hover:text-white' : 'border-sage/10 text-sage/40 hover:text-sage'}`}
                >
                    <RotateCcw size={24} />
                </button>
                <button
                    onClick={toggleTimer}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                        }`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <div className="w-14" /> {/* Spacer for balance */}
            </div>

            {/* Break Suggestions Card */}
            <AnimatePresence mode="wait">
                {mode !== 'focus' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`w-full p-6 rounded-[2rem] border ${bgCard} text-center`}
                    >
                        <div className={`inline-flex p-3 rounded-2xl mb-4 ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                            <currentSuggestion.icon size={24} />
                        </div>
                        <h3 className={`text-lg font-display font-medium mb-3 ${textPrimary}`}>Coach Suggestion</h3>
                        <p className={`text-sm leading-relaxed mb-6 ${textSecondary}`}>
                            {currentSuggestion.text}
                        </p>
                        {currentSuggestion.action === 'hydrate' && (
                            <button
                                onClick={() => {
                                    onAddHydration?.();
                                    haptics.success();
                                }}
                                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Track Water
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Settings Modal (Overlay) - NOW USING REFINED SlideUpModal */}
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
                        className={`w-full mt-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest active:scale-95 transition-all outline-none ${isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-lg shadow-pale-gold/20' : 'bg-sage text-white shadow-lg shadow-sage/20'}`}
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
