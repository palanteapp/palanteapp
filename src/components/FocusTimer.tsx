
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
    Zap,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PalanteAudioBridge } from '../plugins/PalanteAudioBridge';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { FeatureInfoModal } from './FeatureInfoModal';

import { useTheme } from '../contexts/ThemeContext';

interface FocusTimerProps {
    onAddHydration?: () => void;
}

type FocusMode = 'focus' | 'shortBreak' | 'longBreak';

const BREAK_SUGGESTIONS = [
    { text: "Hydrate: Drink a glass of water to keep your mind sharp.", icon: Droplet, action: 'hydrate' },
    { text: "Stair Climb: Walk up and down one flight of stairs 3 times. A quick 'exercise snack' to boost metabolism.", icon: Activity },
    { text: "Shoulder Rolls: 10 slow circles backward, then 10 forward to release tension from typing.", icon: Coffee },
    { text: "20-20-20 Rule: Every 20 mins, look 20 feet away for 20 seconds to refresh your eye focus.", icon: Brain },
    { text: "Wall Sit: Sit against a wall with thighs parallel to floor for 30s to fire up your legs and focus.", icon: Zap },
    { text: "Palm the Eyes: Rub hands together for warmth, then cup over closed eyes for 30s of total darkness.", icon: Brain },
    { text: "Bodyweight Squats: Do 15 air squats. This 'snack' improves insulin sensitivity and clears mental fog.", icon: Activity },
    { text: "Brisk Walk: Spend 2 minutes walking around your space at a fast pace to reset your perspective.", icon: Wind },
    { text: "Neck Release: Gently tilt your ear to your shoulder for 15s on each side. Don't force it.", icon: Coffee },
    { text: "Jumping Jacks: Do 15 jumping jacks to spike your heart rate and clear mental fog.", icon: Zap },
    { text: "Doorway Stretch: Place your forearms on a door frame and lean through for 30s to open your chest.", icon: Activity },
    { text: "Leg Extensions: Straighten your legs under the desk 15 times to activate blood flow.", icon: Activity },
];

// iOS WKWebView blocks AudioContext creation unless triggered by a user gesture.
// We create and unlock the context on the first user tap (play/pause), store it
// in a module-level ref, then reuse it when the bell fires at timer completion.
let _sharedAudioCtx: AudioContext | null = null;

const getOrCreateAudioCtx = (): AudioContext | null => {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!_sharedAudioCtx) {
            _sharedAudioCtx = new AudioCtx();
        }
        if (_sharedAudioCtx.state === 'suspended') {
            _sharedAudioCtx.resume();
        }
        return _sharedAudioCtx;
    } catch {
        return null;
    }
};

const playBell = (isMuted: boolean) => {
    if (isMuted) return;
    if (Capacitor.isNativePlatform()) {
        // Native AVAudioPlayer under the .playback session — sounds even when
        // the hardware mute switch is on, which WKWebView Web Audio does not.
        PalanteAudioBridge.playBell().catch(() => playWebBell());
        return;
    }
    playWebBell();
};

const playWebBell = () => {
    try {
        const ctx = getOrCreateAudioCtx();
        if (!ctx) return;
        // Resume in case the context was suspended (iOS requirement)
        const doPlay = () => {
            // Tibetan singing bowl: fundamental + two harmonics with long exponential decay
            const tone = (freq: number, gain: number, startOffset: number) => {
                const osc = ctx.createOscillator();
                const env = ctx.createGain();
                osc.connect(env);
                env.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                env.gain.setValueAtTime(0, ctx.currentTime + startOffset);
                env.gain.linearRampToValueAtTime(gain, ctx.currentTime + startOffset + 0.012);
                env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + 4);
                osc.start(ctx.currentTime + startOffset);
                osc.stop(ctx.currentTime + startOffset + 4.2);
            };
            tone(432,  0.28, 0);
            tone(864,  0.14, 0.02);
            tone(1296, 0.07, 0.04);
        };
        if (ctx.state === 'suspended') {
            ctx.resume().then(doPlay).catch(e => console.warn('Bell resume failed', e));
        } else {
            doPlay();
        }
    } catch (e) {
        console.warn('Bell audio failed', e);
    }
};

// When the app is backgrounded or the screen is locked, the webview is frozen
// and the in-app bell can't fire. A local notification scheduled at the end
// time covers that case. It's offset 1.5s past endTime so that when the app is
// foregrounded, the in-app completion (which ticks within 1s) cancels it first
// and the user hears a single bell instead of two.
const TIMER_NOTIFICATION_ID = 8000;

const scheduleCompletionNotification = async (forMode: FocusMode, endTime: number) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted' && perm.display !== 'denied') {
            perm = await LocalNotifications.requestPermissions();
        }
        if (perm.display !== 'granted') return;
        await LocalNotifications.schedule({
            notifications: [{
                id: TIMER_NOTIFICATION_ID,
                title: forMode === 'focus' ? 'Session complete.' : 'Break over.',
                body: forMode === 'focus'
                    ? 'Time to rest before the next round.'
                    : 'Ready for the next focus round?',
                schedule: { at: new Date(endTime + 1500), allowWhileIdle: true },
                sound: 'bell.caf',
            }]
        });
    } catch (e) {
        console.warn('Focus timer notification scheduling failed', e);
    }
};

const cancelCompletionNotification = () => {
    if (!Capacitor.isNativePlatform()) return;
    LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] }).catch(() => {});
};

export const FocusTimer: React.FC<FocusTimerProps> = ({ onAddHydration }) => {
    const { isDarkMode } = useTheme();
    // Settings State (persisted)
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SETTINGS);
            const parsed = saved ? JSON.parse(saved) : null;
            return parsed || { focus: 25, shortBreak: 5, longBreak: 15 };
        } catch (e) {
            console.error('Failed to parse focus settings:', e);
            return { focus: 25, shortBreak: 5, longBreak: 15 };
        }
    });

    // --- PERSISTENCE LOGIC ---
    const [mode, setMode] = useState<FocusMode>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
            const parsed = saved ? JSON.parse(saved) : null;
            return parsed?.mode || 'focus';
        } catch { return 'focus'; }
    });

    const [timeLeft, setTimeLeft] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed?.isActive && parsed.endTime) {
                const remaining = Math.max(0, Math.floor((parsed.endTime - Date.now()) / 1000));
                return remaining;
            }
            return parsed?.timeLeft ?? (settings.focus * 60);
        } catch { return settings.focus * 60; }
    });

    const [isActive, setIsActive] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
            const parsed = saved ? JSON.parse(saved) : null;
            return !!parsed?.isActive;
        } catch { return false; }
    });

    const [cyclesCompleted, setCyclesCompleted] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
            const parsed = saved ? JSON.parse(saved) : null;
            return parsed?.cyclesCompleted ?? 0;
        } catch { return 0; }
    });

    const [isMuted, setIsMuted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showInfo, setShowInfo] = useState<'science' | 'how-to' | null>(null);
    const [currentSuggestion, setCurrentSuggestion] = useState(BREAK_SUGGESTIONS[0]);

    // Break prompt state — shown when focus session ends, before break auto-starts
    const [showBreakPrompt, setShowBreakPrompt] = useState(false);
    const [pendingBreakMode, setPendingBreakMode] = useState<'shortBreak' | 'longBreak' | null>(null);

    const bellFiredRef = useRef(false);

    // Save session to localStorage
    const saveSession = (overrides = {}) => {
        const session = {
            mode,
            timeLeft,
            isActive,
            cyclesCompleted,
            endTime: isActive ? Date.now() + (timeLeft * 1000) : null,
            ...overrides
        };
        localStorage.setItem(STORAGE_KEYS.FOCUS_SESSION, JSON.stringify(session));
    };

    // Effect to handle timer countdown and background sync
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
                const parsed = saved ? JSON.parse(saved) : null;

                if (parsed?.endTime) {
                    const remaining = Math.max(0, Math.floor((parsed.endTime - Date.now()) / 1000));
                    setTimeLeft(remaining);

                    if (remaining <= 0 && !bellFiredRef.current) {
                        bellFiredRef.current = true;
                        if (mode === 'focus') {
                            handleFocusComplete();
                        } else {
                            handleBreakComplete();
                        }
                    }
                }
            }, 1000);
        } else if (isActive && timeLeft <= 0 && !bellFiredRef.current) {
            bellFiredRef.current = true;
            if (mode === 'focus') {
                handleFocusComplete();
            } else {
                handleBreakComplete();
            }
        }

        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft, mode]);

    // Initialize/Reset timer when mode changes manually
    const resetToMode = (newMode: FocusMode) => {
        const duration = newMode === 'focus' ? settings.focus : newMode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
        setMode(newMode);
        setTimeLeft(duration * 60);
        setIsActive(false);
        bellFiredRef.current = false;
        cancelCompletionNotification();
        saveSession({ mode: newMode, timeLeft: duration * 60, isActive: false, endTime: null });
    };

    // Sync settings — only if not mid-session
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(settings));
        if (!isActive) {
            const duration = mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
            setTimeLeft(duration * 60);
        }
    }, [settings]);

    const handleFocusComplete = () => {
        setIsActive(false);
        cancelCompletionNotification();
        haptics.success();
        triggerConfetti();
        playBell(isMuted);

        const newCycles = cyclesCompleted + 1;
        const nextBreak: 'shortBreak' | 'longBreak' = newCycles >= 4 ? 'longBreak' : 'shortBreak';
        setPendingBreakMode(nextBreak);

        const finalCycles = nextBreak === 'longBreak' ? 0 : newCycles;
        setCyclesCompleted(finalCycles);
        setCurrentSuggestion(BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]);
        setShowBreakPrompt(true);

        saveSession({ isActive: false, cyclesCompleted: finalCycles, endTime: null });
    };

    const handleBreakComplete = () => {
        setIsActive(false);
        cancelCompletionNotification();
        haptics.success();
        playBell(isMuted);
        setMode('focus');
        const duration = settings.focus * 60;
        setTimeLeft(duration);
        saveSession({ mode: 'focus', timeLeft: duration, isActive: false, endTime: null });
    };

    const toggleTimer = () => {
        const nextActive = !isActive;
        setIsActive(nextActive);
        haptics.medium();

        // Unlock AudioContext during this user gesture so bell can fire later
        getOrCreateAudioCtx();

        if (nextActive) {
            // Starting: Set endTime
            const end = Date.now() + (timeLeft * 1000);
            saveSession({ isActive: true, endTime: end });
            scheduleCompletionNotification(mode, end);
        } else {
            // Pausing: clear endTime, keep timeLeft
            saveSession({ isActive: false, endTime: null });
            cancelCompletionNotification();
        }
    };

    const resetTimer = () => {
        resetToMode(mode);
        haptics.light();
    };

    const resetCycle = () => {
        setCyclesCompleted(0);
        resetToMode('focus');
        setShowBreakPrompt(false);
        haptics.medium();
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
    const textSecondary = isDarkMode ? 'text-white' : 'text-sage/60';
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
                        <Timer className={isDarkMode ? 'text-pale-gold' : 'text-[#C96A3A]'} size={24} />
                        <h2 className={`font-display font-medium text-2xl ${textPrimary}`}>Focus Timer</h2>
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
                            className={`p-2 rounded-full ${showSettings ? ('bg-[#C96A3A] text-white hover:scale-105') : `${isDarkMode ? 'bg-white/5' : 'bg-sage/5'} ${textSecondary}`}`}
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Info Buttons Row */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={() => { haptics.light(); setShowInfo('how-to'); }}
                        className={`flex-1 py-2 px-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-sage/10 text-sage/40 hover:bg-sage/5'}`}
                    >
                        <HelpCircle size={12} /> How to Use
                    </button>
                    <button
                        onClick={() => { haptics.light(); setShowInfo('science'); }}
                        className={`flex-1 py-2 px-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-sage/10 text-sage/40 hover:bg-sage/5'}`}
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
                            resetToMode(m);
                            haptics.selection();
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === m
                            ? (isDarkMode ? 'bg-pale-gold text-sage-dark shadow-lg' : 'bg-[#C96A3A] text-white shadow-lg')
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
            <div className="flex flex-col items-center gap-3 mb-12">
                <div className="flex items-center gap-4">
                <button
                    onClick={resetTimer}
                    className={`p-4 rounded-full border transition-all ${isDarkMode ? 'border-white/10 text-white hover:text-white' : 'border-sage/10 text-sage/40 hover:text-sage'}`}
                    title="Reset current timer"
                >
                    <RotateCcw size={24} />
                </button>
                <button
                    onClick={toggleTimer}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl ${'bg-[#C96A3A] text-white hover:scale-105'}`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                {/* Skip pill — jumps to next mode without waiting */}
                <button
                    onClick={() => {
                        setIsActive(false);
                        cancelCompletionNotification();
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
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5 hover:text-white' : 'border-sage/10 text-sage/40 hover:bg-sage/5 hover:text-sage'}`}
                    title="Skip to next session"
                >
                    <SkipForward size={14} />
                    Skip
                </button>
                </div>
                {/* Reset full cycle */}
                <button
                    onClick={resetCycle}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all active:scale-95 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5 hover:text-white/60' : 'border-sage/10 text-sage/30 hover:bg-sage/5 hover:text-sage/60'}`}
                >
                    <RotateCcw size={12} />
                    Reset Cycle
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
                        <div className={`inline-flex p-3 rounded-2xl mb-4 ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold' : 'bg-[#C96A3A]/10 text-[#C96A3A]'}`}>
                            <currentSuggestion.icon size={24} />
                        </div>
                        <h3 className={`text-lg font-display font-medium mb-3 ${textPrimary}`}>Partner Suggestion</h3>
                        <p className={`text-base leading-relaxed mb-6 ${textSecondary}`}>
                            {currentSuggestion.text}
                        </p>
                        {currentSuggestion.action === 'hydrate' && (
                            <button
                                onClick={() => { onAddHydration?.(); haptics.success(); }}
                                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${'bg-[#C96A3A] text-white hover:scale-105'}`}
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
                        className="fixed inset-0 z-[200] flex items-center justify-center px-6"
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
                            <div className={`h-1.5 w-full ${isDarkMode ? 'bg-pale-gold' : 'bg-[#C96A3A]'}`} />
                            <div className="p-7 text-center">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-pale-gold/15 text-pale-gold' : 'bg-[#C96A3A]/10 text-[#C96A3A]'}`}>
                                    <Bell size={24} />
                                </div>
                                <h3 className={`text-xl font-display font-bold mb-1 ${textPrimary}`}>
                                    {pendingBreakMode === 'longBreak' ? 'All 4 sessions done.' : 'Session complete.'}
                                </h3>
                                <p className={`text-sm mb-6 opacity-60 ${textPrimary}`}>
                                    {pendingBreakMode === 'longBreak'
                                        ? "You've earned a long break."
                                        : "Time to rest before the next round."}
                                </p>
                                <button
                                    onClick={() => {
                                        if (pendingBreakMode) {
                                            const mode = pendingBreakMode;
                                            setPendingBreakMode(null);
                                            setShowBreakPrompt(false);
                                            resetToMode(mode);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 mb-3 ${'bg-[#C96A3A] text-white hover:scale-105'}`}
                                >
                                    <Coffee size={16} />
                                    {pendingBreakMode === 'longBreak' ? 'Start Long Break' : 'Start Short Break'}
                                </button>
                                <button
                                    onClick={() => {
                                        setPendingBreakMode(null);
                                        setShowBreakPrompt(false);
                                        resetToMode('focus');
                                    }}
                                    className={`text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-70 transition-opacity ${textPrimary}`}
                                >
                                    Skip break
                                </button>
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
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-sage/10 text-sage/40'}`}
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
                                    <span className={`text-base font-bold ${textPrimary}`}>{settings[key]}m</span>
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
                        className={`w-full mt-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest active:scale-95 transition-all outline-none ${isDarkMode ? 'bg-pale-gold text-sage-dark shadow-lg shadow-pale-gold/20' : 'bg-[#C96A3A] text-white shadow-lg shadow-[#C96A3A]/20'}`}
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
                featureName="Focus Timer"
                howToUse={{
                    title: "The Focus Timer Method",
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
