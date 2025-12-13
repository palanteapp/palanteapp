import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, X, Volume2, Square, Mic } from 'lucide-react';
import { Countdown } from './Countdown';
import { speak, stop as stopTTS, type OpenAIVoice } from '../utils/ttsService';

interface MeditationProps {
    isDarkMode: boolean;
    onComplete?: () => void;
    voicePreference?: OpenAIVoice;
    onSaveReflection?: (reflection: { intention: string; duration: number; reflection: string; mantra: string }) => void;
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

// Bell sound is now generated synthetically using Web Audio API

export const Meditation: React.FC<MeditationProps> = ({ isDarkMode, onComplete, voicePreference = 'nova', onSaveReflection }) => {
    const [isActive, setIsActive] = useState(false);
    const [duration, setDuration] = useState(10); // minutes
    const [timeLeft, setTimeLeft] = useState(10 * 60);
    const [intention, setIntention] = useState('');
    const [showIntentionInput, setShowIntentionInput] = useState(true);
    const [selectedMantra, setSelectedMantra] = useState<Mantra>(MANTRAS[0]);
    const [showNamaste, setShowNamaste] = useState(false);
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [reflection, setReflection] = useState('');
    const [isSpeakingMantra, setIsSpeakingMantra] = useState(false);
    const [isListeningReflection, setIsListeningReflection] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);

    const handleCountdownComplete = async () => {
        setIsCountingDown(false);
        // Play starting bell - this is triggered by user click so it should work
        console.log('🔔 Starting meditation - playing START bell');
        await playBell();
        setIsActive(true);
    };


    useEffect(() => {
        setSelectedMantra(MANTRAS[Math.floor(Math.random() * MANTRAS.length)]);

        console.log('Meditation component initialized');

        // Stop any speaking when component unmounts
        return () => {
            stopTTS();
        };
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            handleSessionEnd();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const playBell = async () => {
        try {
            // Generate a synthetic bell sound using Web Audio API
            // This is guaranteed to work without external URLs
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            console.log('🔔 Generating bell sound...');

            // Create oscillators for a bell-like sound
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            // Bell frequencies (fundamental + harmonic)
            oscillator1.frequency.value = 528; // C note - healing frequency
            oscillator2.frequency.value = 792; // Harmonic

            oscillator1.type = 'sine';
            oscillator2.type = 'sine';

            // Connect oscillators to gain
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Envelope: quick attack, smooth long fade-out (no abrupt cutoff)
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3); // Smooth 3-second fade

            // Start oscillators
            oscillator1.start(now);
            oscillator2.start(now);

            // Stop after fade completes
            oscillator1.stop(now + 3);
            oscillator2.stop(now + 3);

            console.log('✅ Bell sound played successfully!');
        } catch (error) {
            console.error('❌ Bell sound generation failed:', error);
        }
    };

    const toggleTimer = async () => {
        // Require intention before starting
        if (!isActive && !intention.trim()) {
            return; // Don't start if no intention
        }

        if (!isActive) {
            // Starting meditation sequence
            if (showIntentionInput && intention.trim()) {
                setShowIntentionInput(false);
                // Match mantra to intention
                const matchedMantra = matchMantraToIntention(intention);
                setSelectedMantra(matchedMantra);
            }
            // Trigger countdown
            setIsCountingDown(true);
        } else {
            // Stopping meditation early
            console.log('⏸️ Stopping meditation early');
            setIsActive(false);
        }
    };

    const handleSessionEnd = async () => {
        console.log('🔔 Meditation complete - playing END bell');
        await playBell(); // Play ending bell
        setShowNamaste(true);
        if (onComplete) onComplete();
        setTimeout(() => {
            setShowNamaste(false); // Hide Namaste before showing modal
            setShowReflectionModal(true);
        }, 5000); // Show modal after 5 seconds of Namaste
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(duration * 60);
        setShowIntentionInput(true);
        setShowNamaste(false);
        setShowReflectionModal(false);
    };

    const handleSpeakMantra = async () => {
        if (isSpeakingMantra) {
            stopTTS();
            setIsSpeakingMantra(false);
        } else {
            setIsSpeakingMantra(true);
            const text = `${selectedMantra.sanskrit}. ${selectedMantra.meaning}. ${selectedMantra.description}`;
            await speak(
                text,
                voicePreference,
                () => { }, // onStart
                () => setIsSpeakingMantra(false), // onEnd
                0.8 // slower speed for mantras
            );
        }
    };

    const handleDurationChange = (minutes: number) => {
        setDuration(minutes);
        setTimeLeft(minutes * 60);
        setIsActive(false);
    };

    const startReflectionDictation = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListeningReflection(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setReflection(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListeningReflection(false);
        };

        recognition.onend = () => {
            setIsListeningReflection(false);
        };

        recognition.start();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const bgClass = isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';

    return (
        <div className={`w-full min-h-screen flex flex-col items-center justify-center p-8 animate-fade-in transition-colors duration-500 ${bgClass}`}>
            <Countdown isActive={isCountingDown} onComplete={handleCountdownComplete} />

            {/* Subtle Namaste - appears where timer was */}
            {showNamaste && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <h2 className={`text-7xl font-display font-medium tracking-wide animate-fade-in ${isDarkMode ? 'text-pale-gold' : 'text-sage'
                        }`}>
                        Namaste
                    </h2>
                </div>
            )}

            {/* Reflection Modal */}
            {showReflectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-lg p-8 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-warm-gray-green border border-white/10' : 'bg-ivory border border-sage/20'}`}>
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
                                className={`absolute right-3 top-3 p-2 rounded-full transition-all ${isListeningReflection
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                    }`}
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
                            className={`w-full py-4 rounded-full font-display font-medium text-lg transition-all ${isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:bg-white' : 'bg-sage text-white hover:shadow-spa'
                                }`}
                        >
                            Save Reflection
                        </button>
                    </div>
                </div>
            )}

            {/* Header / Intention */}
            <div className={`w-full max-w-md text-center mb-12 z-10 transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                {/* Step 1 Label */}
                {showIntentionInput && !isActive && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                            }`}>1</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Set Your Intention</span>
                    </div>
                )}
                {showIntentionInput && !isActive ? (
                    <div className="space-y-6 animate-fade-in">
                        <input
                            type="text"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && intention.trim()) {
                                    toggleTimer();
                                }
                            }}
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
            </div>

            {/* Timer Display */}
            <div className={`relative mb-16 z-10 transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                {/* Decorative Ring */}
                <div className={`absolute inset-0 rounded-full border-2 opacity-20 animate-pulse-glow ${isDarkMode ? 'border-white' : 'border-sage'}`}></div>

                <div className={`w-72 h-72 rounded-full flex items-center justify-center border-4 transition-all duration-1000 ${isActive
                    ? isDarkMode ? 'border-pale-gold bg-white/5' : 'border-sage bg-sage/5'
                    : isDarkMode ? 'border-white/10' : 'border-sage/10'
                    }`}>
                    <span className={`text-7xl font-display font-medium tabular-nums ${textPrimary}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Mantra */}
            <div className={`text-center max-w-lg mb-16 z-10 min-h-[120px] transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles size={16} className={accentColor} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Ancient Wisdom</span>
                    <Sparkles size={16} className={accentColor} />
                </div>
                <h3 className={`text-3xl font-display font-medium mb-2 ${textPrimary}`}>{selectedMantra.sanskrit}</h3>
                <p className={`text-lg font-medium mb-2 ${accentColor}`}>{selectedMantra.meaning}</p>
                <p className={`text-sm ${textSecondary}`}>{selectedMantra.description}</p>

                {/* Listen Button */}
                <button
                    onClick={handleSpeakMantra}
                    className={`mt-4 tap-zone p-3 rounded-full transition-all ${isSpeakingMantra
                        ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                        : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    title={isSpeakingMantra ? "Stop" : "Listen to Mantra"}
                >
                    {isSpeakingMantra ? <Square size={16} /> : <Volume2 size={16} />}
                </button>
            </div>

            {/* Controls */}
            <div className={`flex flex-col items-center gap-8 z-10 transition-opacity duration-1000 ${showNamaste ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                {/* Step 2 Label - Duration Selector */}
                {!isActive && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                            }`}>2</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Choose Duration</span>
                    </div>
                )}

                {/* Duration Selector (Only when paused) */}
                {!isActive && (
                    <div className="grid grid-cols-3 md:flex gap-2 md:gap-4">
                        {[5, 10, 15, 20, 30, 60].map((m) => (
                            <button
                                key={m}
                                onClick={() => handleDurationChange(m)}
                                className={`tap-zone px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${duration === m
                                    ? isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                    }`}
                            >
                                {m}m
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 3 Label - Play Button */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                        }`}>3</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Begin Meditation</span>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleTimer}
                        disabled={!isActive && !intention.trim()}
                        className={`tap-zone p-6 rounded-full transition-all ${!isActive && !intention.trim()
                            ? isDarkMode ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-sage/5 text-sage/30 cursor-not-allowed'
                            : isActive
                                ? isDarkMode ? 'bg-white text-warm-gray-green hover:bg-pale-gold' : 'bg-sage text-white hover:bg-sage/80'
                                : isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:bg-white' : 'bg-sage text-white hover:bg-sage/80'
                            }`}
                        title={!intention.trim() ? 'Set an intention first' : isActive ? 'Pause' : 'Start'}
                    >
                        {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    {(isActive || timeLeft !== duration * 60) && (
                        <button
                            onClick={resetTimer}
                            className={`tap-zone p-4 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                }`}
                        >
                            <RotateCcw size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-0 left-0 w-full h-full opacity-30 ${isDarkMode
                    ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]'
                    : 'bg-[radial-gradient(circle_at_50%_50%,rgba(181,194,163,0.2),transparent_70%)]'
                    }`}></div>
            </div>
        </div>
    );
};
