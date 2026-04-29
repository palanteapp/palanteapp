import React, { useState, useEffect, useCallback, memo } from 'react';
import { Play, Pause, RotateCcw, Sparkles, X, Mic, Lightbulb, MessageCircle, Target, HelpCircle, Microscope, Music, Settings, Volume2, Waves, CloudRain, Leaf, Wind } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Countdown } from './Countdown';
import { FeatureInfoModal } from './FeatureInfoModal';
import { FEATURE_INFO } from '../data/featureInfo';
import { SoundMixer } from './SoundMixer';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancementSettings, type EnhancementOptions } from './EnhancementSettings';
import type { UserProfile, SoundMix } from '../types';

// --- Sakura Petals Enhancement ---
const SakuraPetals = memo(({ isDarkMode }: { isDarkMode: boolean }) => {
    // Memoize petal data so positions/delays don't change on re-render (e.g. theme toggle)
    const petals = React.useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${18 + Math.random() * 20}s`,
        opacity: 0.3 + Math.random() * 0.4,
        rotate: `${Math.random() * 360}deg`,
        scale: 0.7 + Math.random()
    })), []);

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

interface MeditationProps {
    isDarkMode: boolean;
    onComplete?: () => void;
    onSaveReflection?: (reflection: { intention: string; duration: number; reflection: string; mantra: string }) => void;
    tipsEnabled?: boolean;
    onShowTip?: () => void;
    onStrategize?: () => void;
    user?: UserProfile;
    onSaveMix?: (mix: SoundMix) => void;
    onDeleteMix?: (mixId: string) => void;
    onOpenSoundMixer?: () => void;
}

interface Mantra {
    sanskrit: string;
    meaning: string;
    description: string;
    keywords?: string[];
}

const MANTRAS: Mantra[] = [
    {
        sanskrit: "Om",
        meaning: "The Sound of the Universe",
        description: "The primordial vibration that connects all living things.",
        keywords: ["universe", "connection", "oneness", "unity", "cosmic"]
    },
    {
        sanskrit: "So Hum",
        meaning: "I Am That",
        description: "Identifying yourself with the universe and all of creation.",
        keywords: ["self", "identity", "awareness", "consciousness", "being"]
    },
    {
        sanskrit: "Om Namah Shivaya",
        meaning: "I Bow to the Inner Self",
        description: "Honoring the divine consciousness that dwells within you.",
        keywords: ["inner", "divine", "self", "honor", "respect", "sacred"]
    },
    {
        sanskrit: "Lokah Samastah Sukhino Bhavantu",
        meaning: "May All Beings Be Happy",
        description: "A prayer for peace, harmony, and happiness for all.",
        keywords: ["peace", "happiness", "harmony", "love", "compassion", "kindness", "joy"]
    },
    {
        sanskrit: "Om Gam Ganapataye Namaha",
        meaning: "Salutations to the Remover of Obstacles",
        description: "Invoking strength to overcome challenges and new beginnings.",
        keywords: ["challenge", "obstacle", "strength", "courage", "overcome", "difficult", "hard"]
    }
];

// Function to match mantra to intention
const matchMantraToIntention = (intention: string): Mantra => {
    const intentionLower = intention.toLowerCase();

    // Find mantra with matching keywords
    for (const mantra of MANTRAS) {
        if (mantra.keywords?.some(keyword => intentionLower.includes(keyword))) {
            return mantra;
        }
    }

    // Default to a random mantra if no match
    return MANTRAS[Math.floor(Math.random() * MANTRAS.length)];
};

export const Meditation = memo<MeditationProps>(({ isDarkMode, onComplete, onSaveReflection, tipsEnabled = true, onShowTip, onStrategize, user, onSaveMix, onDeleteMix, onOpenSoundMixer }) => {
    const [isActive, setIsActive] = useState(false);
    const [duration, setDuration] = useState(10); // minutes
    const [timeLeft, setTimeLeft] = useState(10 * 60);
    const [intention, setIntention] = useState('');
    const [showIntentionInput, setShowIntentionInput] = useState(true);
    const [selectedMantra, setSelectedMantra] = useState<Mantra>(MANTRAS[0]);
    const [showNamaste, setShowNamaste] = useState(false);
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [reflection, setReflection] = useState('');
    const [isListeningReflection, setIsListeningReflection] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [showFeatureInfo, setShowFeatureInfo] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [enhancements, setEnhancements] = useState<EnhancementOptions>(() => {
        const saved = localStorage.getItem('palante_enhancements');
        return saved ? JSON.parse(saved) : {
            immersiveHaptics: false,
            dynamicBackgrounds: false,
            smoothTransitions: false,
            groundingHeartbeat: false
        };
    });

    // Soundscape integration
    const [showSoundExpanded, setShowSoundExpanded] = useState(false);
    const [activeSoundIds, setActiveSoundIds] = useState<Set<string>>(new Set());
    const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>({});

    // Listen for setting changes
    useEffect(() => {
        const handleSettingsUpdate = () => {
            const saved = localStorage.getItem('palante_enhancements');
            if (saved) setEnhancements(JSON.parse(saved));
        };
        window.addEventListener('storage', handleSettingsUpdate);
        return () => window.removeEventListener('storage', handleSettingsUpdate);
    }, []);

    // Listen for sound state changes from SoundMixer
    useEffect(() => {
        const handleSoundsChanged = (event: any) => {
            const { activeSounds, volumes } = event.detail || {};
            if (activeSounds) {
                setActiveSoundIds(new Set(activeSounds));
                setSoundVolumes(volumes || {});
            }
        };

        window.addEventListener('palante-sounds-changed', handleSoundsChanged);
        return () => window.removeEventListener('palante-sounds-changed', handleSoundsChanged);
    }, []);

    // Wake Lock functions
    const requestWakeLock = async () => {
        try {
            await KeepAwake.keepAwake();
        } catch (err) {
            console.error('❌ Failed to acquire wake lock:', err);
        }
    };

    const releaseWakeLock = async () => {
        try {
            // Keep persistent for now
            console.log('🔓 Wake Lock release requested (suppressed)');
        } catch (err) {
            console.error('❌ Failed to release wake lock:', err);
        }
    };

    const handleCountdownComplete = async () => {
        setIsCountingDown(false);
        await playGong();
        setIsActive(true);
        await requestWakeLock();
    };

    useEffect(() => {
        setSelectedMantra(MANTRAS[Math.floor(Math.random() * MANTRAS.length)]);
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                if (enhancements.groundingHeartbeat && timeLeft % 2 === 0) {
                    haptics.pulse();
                }
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            handleSessionEnd();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, enhancements.groundingHeartbeat]);

    const playGong = async () => {
        try {
            const gong = new Audio('/sounds/gong-sfx.mp3');
            gong.volume = 0.5;
            await gong.play();
        } catch (error) {
            console.error('❌ Gong playback failed:', error);
        }
    };

    const toggleTimer = async () => {
        if (!isActive && !intention.trim()) return;

        if (!isActive) {
            if (showIntentionInput && intention.trim()) {
                setShowIntentionInput(false);
                const matchedMantra = matchMantraToIntention(intention);
                setSelectedMantra(matchedMantra);
                haptics.medium();
            }
            setIsCountingDown(true);
        } else {
            setIsActive(false);
            await releaseWakeLock();
        }
    };

    const handleSessionEnd = async () => {
        await playGong();
        haptics.success();
        await releaseWakeLock();
        setShowNamaste(true);
        if (onComplete) onComplete();
        setTimeout(() => {
            setShowNamaste(false);
            setShowReflectionModal(true);
        }, 5000);
    };

    const resetTimer = async () => {
        setIsActive(false);
        setTimeLeft(duration * 60);
        setShowIntentionInput(true);
        setShowNamaste(false);
        setShowReflectionModal(false);
        await releaseWakeLock();
    };

    const handleDurationChange = (minutes: number) => {
        setDuration(minutes);
        setTimeLeft(minutes * 60);
        setIsActive(false);
        haptics.selection();
    };

    const startReflectionDictation = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListeningReflection(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setReflection(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        recognition.onerror = () => setIsListeningReflection(false);
        recognition.onend = () => setIsListeningReflection(false);
        recognition.start();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';

    return (
        <div className="w-full flex flex-col items-center px-6 pb-32 animate-fade-in transition-colors duration-500 overflow-hidden relative">
            {enhancements.natureParticles && (isActive || isCountingDown) && <SakuraPetals isDarkMode={isDarkMode} />}
            <Countdown isActive={isCountingDown} onComplete={handleCountdownComplete} />

            {/* Namaste Overlay */}
            <AnimatePresence>
                {showNamaste && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <h2 className={`text-7xl font-display font-medium tracking-wide ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                            Namaste
                        </h2>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reflection Modal */}
            {showReflectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-lg p-8 rounded-2xl shadow-2xl bg-warm-gray-green border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-2xl font-display font-medium ${textPrimary}`}>Reflect on your practice</h3>
                            <button onClick={resetTimer} className={`p-2 rounded-full hover:bg-black/5 ${textSecondary}`}>
                                <X size={24} />
                            </button>
                        </div>
                        <p className={`mb-6 ${textSecondary}`}>How are you feeling right now?</p>
                        <div className="relative mb-6">
                            <textarea
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                className={`w-full p-4 pr-12 rounded-xl h-32 outline-none resize-none ${isDarkMode
                                    ? 'bg-white/5 text-white placeholder-white/30 border border-white/10 focus:border-pale-gold'
                                    : 'bg-white text-warm-gray-green placeholder-warm-gray-green/30 border border-sage/20 focus:border-sage'
                                    }`}
                                placeholder="I feel..."
                            />
                            <button
                                type="button"
                                onClick={startReflectionDictation}
                                className={`absolute right-3 top-3 p-2 rounded-full transition-all ${isListeningReflection ? 'bg-red-500 text-white animate-pulse' : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                                title="Voice Dictation"
                            >
                                <Mic size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                if (onSaveReflection && reflection.trim()) {
                                    onSaveReflection({
                                        intention: intention || 'Stillness',
                                        duration,
                                        reflection: reflection.trim(),
                                        mantra: `${selectedMantra.sanskrit} - ${selectedMantra.meaning}`
                                    });
                                }
                                resetTimer();
                            }}
                            className={`w-full py-4 rounded-full font-display font-medium text-lg transition-all ${isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:bg-white' : 'bg-sage text-white hover:shadow-spa'}`}
                        >
                            Save Reflection
                        </button>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className={`w-full max-w-md text-center z-10 transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {showIntentionInput && !isActive && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}>1</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Set Your Intention</span>
                    </div>
                )}
                {showIntentionInput && !isActive ? (
                    <div className="space-y-6 animate-fade-in">
                        <input
                            type="text"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && intention.trim() && toggleTimer()}
                            placeholder="What do you seek today?"
                            className={`w-full text-center bg-transparent border-b-2 text-2xl font-body focus:outline-none pb-2 transition-colors ${isDarkMode
                                ? 'border-white/20 text-white placeholder-white/30 focus:border-pale-gold'
                                : 'border-sage/20 text-warm-gray-green placeholder-warm-gray-green/30 focus:border-sage'
                                }`}
                        />
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${textSecondary}`}>Your Intention</p>
                        <h3 className={`text-2xl font-display font-medium ${textPrimary}`}>"{intention || 'Stillness'}"</h3>
                    </div>
                )}

                {/* Preparation Card - NEW DESIGN */}
                {showIntentionInput && !isActive && (
                    <div className={`mt-8 p-6 rounded-[2.5rem] border transition-all duration-700 ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white/40 border-sage/10'}`}>
                        <div className="flex justify-center items-center gap-3 mb-6">
                            <button
                                onClick={() => setShowFeatureInfo(true)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/5 text-sage hover:bg-sage/10'}`}
                            >
                                <HelpCircle size={14} />
                                Guide
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${enhancements.groundingHeartbeat ? 'bg-pale-gold text-warm-gray-green' : isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/5 text-sage hover:bg-sage/10'}`}
                            >
                                <Settings size={14} />
                                Settings
                            </button>
                        </div>

                        <div className="w-full space-y-4">
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 text-center ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                Select Atmosphere
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'ocean', label: 'Ocean Waves', icon: Waves },
                                    { id: 'rain', label: 'Gentle Rain', icon: CloudRain },
                                    { id: 'zen', label: 'Zen Garden', icon: Leaf },
                                    { id: 'adrift', label: 'Set Adrift', icon: Wind }
                                ].map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => window.dispatchEvent(new CustomEvent('palante-load-preset', { detail: { preset: preset.id } }))}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-medium transition-all ${isDarkMode
                                            ? 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'
                                            : 'bg-sage/5 text-sage hover:bg-sage/10 border border-sage/10'}`}
                                    >
                                        <preset.icon size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {showIntentionInput && !isActive && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={onOpenSoundMixer}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border flex items-center justify-center gap-2 w-full max-w-[200px] ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-sage/5 border-sage/10 text-sage/40 hover:text-sage'}`}
                        >
                            <Music size={14} />
                            Full Sound Mixer
                        </button>
                    </div>
                )}
            </div>

            {/* Timer Display */}
            <div className={`w-full max-w-md flex flex-col items-center mt-12 mb-16 z-10 transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="relative w-80 h-80 flex items-center justify-center">
                    <motion.div
                        animate={isActive ? { scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] } : { scale: 1, opacity: 0.3 }}
                        transition={isActive ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}}
                        className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? 'border-pale-gold' : 'border-sage'}`}
                    />
                    <div className={`absolute inset-4 rounded-full border border-dashed opacity-40 ${isActive ? 'animate-orbit' : ''} ${isDarkMode ? 'border-white' : 'border-sage'}`}>
                        {(isActive || isCountingDown) && (
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] ${isDarkMode ? 'bg-pale-gold text-pale-gold' : 'bg-sage text-sage'}`} />
                        )}
                    </div>
                    <motion.div
                        animate={isActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                        transition={isActive ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}}
                        className={`w-64 h-64 rounded-full flex items-center justify-center border-4 transition-all duration-1000 z-10 ${isActive ? (isDarkMode ? 'border-pale-gold bg-white/5' : 'border-sage bg-sage/5') : (isDarkMode ? 'border-white/10' : 'border-sage/10')}`}
                    >
                        <span className={`text-6xl font-display font-medium tabular-nums ${textPrimary}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Mantra Section */}
            {!showIntentionInput && (
                <div className={`text-center max-w-lg mb-16 z-10 min-h-[120px] transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles size={16} className={accentColor} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Ancient Wisdom</span>
                        <Sparkles size={16} className={accentColor} />
                    </div>
                    <h3 className={`text-3xl font-display font-medium mb-2 ${textPrimary}`}>{selectedMantra.sanskrit}</h3>
                    <p className={`text-lg font-medium mb-2 ${accentColor}`}>{selectedMantra.meaning}</p>
                    <p className={`text-sm ${textSecondary}`}>{selectedMantra.description}</p>
                </div>
            )}

            {/* Controls */}
            <div className={`flex flex-col items-center gap-8 z-10 transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {!isActive && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}>2</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Choose Duration</span>
                    </div>
                )}
                {!isActive && (
                    <div className="grid grid-cols-3 md:flex gap-2 md:gap-4 mb-4">
                        {[5, 10, 15, 20, 30, 60].map((m) => (
                            <button
                                key={m}
                                onClick={() => handleDurationChange(m)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${duration === m ? (isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white') : (isDarkMode ? 'bg-white/10 text-white/60' : 'bg-sage/10 text-sage')}`}
                            >
                                {m}m
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}>3</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Begin Meditation</span>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleTimer}
                            disabled={!isActive && !intention.trim()}
                            className={`p-6 rounded-full transition-all ${!isActive && !intention.trim() ? (isDarkMode ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-sage/5 text-sage/30 cursor-not-allowed') : isActive ? (isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white') : (isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white')}`}
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        {(isActive || timeLeft !== duration * 60) && (
                            <button onClick={resetTimer} className={`p-4 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white' : 'bg-sage/10 text-sage'}`}>
                                <RotateCcw size={24} />
                            </button>
                        )}
                    </div>

                    {!isActive && !intention.trim() && (
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse mt-2 ${isDarkMode ? 'text-pale-gold/60' : 'text-sage/60'}`}>
                            set an intention above to get started
                        </p>
                    )}
                </div>
            </div>

            {/* Modals */}
            <FeatureInfoModal
                isOpen={showFeatureInfo}
                onClose={() => setShowFeatureInfo(false)}
                isDarkMode={isDarkMode}
                featureName="Meditation"
                howToUse={FEATURE_INFO.meditation.howToUse}
                theScience={FEATURE_INFO.meditation.theScience}
            />
            <EnhancementSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                isDarkMode={isDarkMode}
                onUpdate={setEnhancements}
            />

            {/* Sound Mixer Overlay Integrated via Prop-based visibility in Parent */}
            {(onOpenSoundMixer as any) === undefined && (
                <div className="hidden">
                    <SoundMixer
                        isVisible={false}
                        onClose={() => { }}
                        source="meditation"
                        isDarkMode={isDarkMode}
                    />
                </div>
            )}
        </div>
    );
});
