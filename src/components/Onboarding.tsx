import React, { useState, useEffect } from 'react';
import type { UserProfile, Tier } from '../types';
import { Mic, Sun, Moon, ArrowRight, ArrowLeft, Sparkles, Target, Flame, Play, Pause, Rocket, Palette, BookOpen, Activity, Briefcase, Heart, Monitor, Compass } from 'lucide-react';
import { previewVoice, stop, type OpenAIVoice } from '../utils/ttsService'; // Removed unused OPENAI_VOICES, stopTTS (aliased stop as stopTTS but used stop() in code?)

interface OnboardingProps {
    onComplete: (profile: Omit<UserProfile, 'id'>) => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

const PROFESSIONS = [
    { value: 'entrepreneur', label: 'Entrepreneur', icon: Rocket },
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'student', label: 'Student', icon: BookOpen },
    { value: 'athlete', label: 'Athlete', icon: Activity },
    { value: 'leader', label: 'Leader', icon: Briefcase },
    { value: 'wellness', label: 'Wellness', icon: Heart },
    { value: 'tech', label: 'Tech', icon: Monitor },
    { value: 'other', label: 'Explorer', icon: Compass },
];

const VOICES: { id: OpenAIVoice, name: string, desc: string }[] = [
    { id: 'nova', name: 'Nova', desc: 'Friendly & Energetic' },
    { id: 'onyx', name: 'Onyx', desc: 'Deep & Authoritative' },
    { id: 'shimmer', name: 'Shimmer', desc: 'Calm & Gentle' },
    { id: 'fable', name: 'Fable', desc: 'British & Classic' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isDarkMode, onToggleTheme }) => {
    const [step, setStep] = useState(1);

    // Form State
    const [name, setName] = useState('');
    const [profession, setProfession] = useState('');
    const [interests] = useState<string[]>([]);
    const [tier, setTier] = useState<Tier>(1);
    const [voiceId, setVoiceId] = useState<OpenAIVoice>('nova');
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    // Initial load animation
    const [showWelcome, setShowWelcome] = useState(false);
    useEffect(() => {
        setTimeout(() => setShowWelcome(true), 300);
    }, []);

    // Helper functions
    // toggleInterest removed as unused

    const handlePlayPreview = async (vId: OpenAIVoice, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlayingPreview) {
            stop();
            setIsPlayingPreview(false);
            return;
        }

        setIsPlayingPreview(true);
        setVoiceId(vId); // Auto select when previewing
        await previewVoice(vId, () => { }, () => setIsPlayingPreview(false));
    };

    const handleSubmit = () => {
        stop(); // Stop any audio
        onComplete({
            name,
            career: 'Building my future', // default goal
            profession,
            interests,
            tier,
            subscriptionTier: 'free',
            streak: 0,
            points: 0,
            sourcePreference: 'mix',
            notificationFrequency: 3,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            goals: [],
            voicePreference: voiceId,
            activityHistory: [],
            favoriteQuotes: [],
        });
    };

    // Styling helpers
    const bgClass = isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const cardClass = isDarkMode
        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-pale-gold/50'
        : 'bg-white/60 border-sage/10 hover:bg-white hover:border-sage/30';
    const activeCardClass = isDarkMode
        ? 'bg-white/10 border-pale-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]'
        : 'bg-white border-sage shadow-lg scale-[1.02]';

    // Components
    const ThemeToggle = () => (
        <button
            onClick={onToggleTheme}
            className={`absolute top-6 right-6 p-3 rounded-full transition-all z-50 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
        >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );

    const StepIndicator = () => (
        <div className="flex gap-2 justify-center mt-8">
            {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step
                    ? `w-8 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`
                    : `w-2 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`
                    }`} />
            ))}
        </div>
    );

    // --- STEP 1: WELCOME & NAME ---
    if (step === 1) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${bgClass}`}>
                <ThemeToggle />
                {/* Background Decor */}
                <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-indigo-500' : 'bg-sage'}`} />
                <div className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

                <div className={`w-full max-w-md text-center z-10 transition-all duration-1000 transform ${showWelcome ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                        Personalized Motivation, Delivered Daily
                    </p>
                    <img
                        src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                        alt="Palante"
                        className="w-20 h-20 object-contain mx-auto mb-6 drop-shadow-xl"
                    />

                    <h1 className={`text-4xl md:text-5xl font-display font-medium mb-3 ${textPrimary}`}>
                        Hi there.
                    </h1>
                    <p className={`text-lg font-body mb-8 max-w-xs mx-auto ${textSecondary}`}>
                        I'm Palante. Your daily companion for mindfulness and motivation.
                    </p>

                    <div className="space-y-3 text-left">
                        <label className={`text-xs font-bold uppercase tracking-widest pl-4 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                            What should I call you?
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && name && setStep(2)}
                                placeholder="Your Name"
                                autoFocus
                                className={`w-full px-6 py-4 rounded-2xl text-xl font-display outline-none transition-all border-2 ${isDarkMode
                                    ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/20'
                                    : 'bg-white/50 border-sage/20 focus:border-sage text-sage placeholder-sage/30'
                                    }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={() => name && setStep(2)}
                                    disabled={!name}
                                    className={`p-2 rounded-full transition-all ${name
                                        ? (isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:scale-110' : 'bg-sage text-white hover:scale-110')
                                        : 'opacity-0 scale-50'
                                        }`}
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8">
                    <StepIndicator />
                </div>
            </div>
        );
    }

    // --- STEP 2: PROFESSION (Visual Cards) ---
    if (step === 2) {
        return (
            <div className={`min-h-screen flex flex-col items-center pt-16 pb-6 px-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle />
                <div className="w-full max-w-lg animate-fade-in text-center flex flex-col h-full">
                    <h2 className={`text-3xl font-display font-medium mb-1 ${textPrimary}`}>What defines you?</h2>
                    <p className={`text-sm mb-6 ${textSecondary}`}>Pick the role that resonates most.</p>

                    <div className="grid grid-cols-2 gap-3 mb-6 flex-1 overflow-y-auto min-h-0">
                        {PROFESSIONS.map((p) => {
                            const Icon = p.icon;
                            return (
                                <button
                                    key={p.value}
                                    onClick={() => setProfession(p.value)}
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 ${profession === p.value ? activeCardClass : cardClass
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${profession === p.value
                                        ? (isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white')
                                        : (isDarkMode ? 'bg-white/5 text-white/50' : 'bg-sage/5 text-sage/50')
                                        }`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className={`font-medium text-sm ${profession === p.value ? (isDarkMode ? 'text-white' : 'text-sage') : textSecondary}`}>
                                        {p.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-4">
                        <button onClick={() => setStep(1)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                            <ArrowLeft className={textSecondary} size={24} />
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!profession}
                            className={`px-8 py-3 rounded-full font-bold transition-all ${profession ? (isDarkMode ? 'bg-white text-black hover:scale-105' : 'bg-sage text-white hover:scale-105') : 'opacity-50 cursor-not-allowed bg-gray-500/20'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                    <StepIndicator />
                </div>
            </div>
        );
    }

    // --- STEP 3: TONE (Pills) ---
    if (step === 3) {
        return (
            <div className={`min-h-screen flex flex-col items-center pt-16 pb-6 px-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle />
                <div className="w-full max-w-lg animate-fade-in text-center flex flex-col h-full">
                    <h2 className={`text-3xl font-display font-medium mb-1 ${textPrimary}`}>How should we push you?</h2>
                    <p className={`text-sm mb-8 ${textSecondary}`}>Select your coaching style.</p>

                    <div className="flex flex-col gap-4 mb-6 flex-1 justify-center">
                        {/* Description Display */}
                        <div className={`min-h-[60px] flex items-center justify-center px-4 ${textSecondary}`}>
                            {tier === 1 && "Gentle, poetic encouragement that nurtures your soul."}
                            {tier === 2 && "Direct, purposeful guidance to keep you on track."}
                            {tier === 3 && "Bold, high-energy motivation. No excuses."}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {[
                                { t: 1, label: "Muse", icon: <Sparkles size={18} />, color: "text-purple-400" },
                                { t: 2, label: "Focus", icon: <Target size={18} />, color: "text-blue-400" },
                                { t: 3, label: "Firestarter", icon: <Flame size={18} />, color: "text-orange-400" }
                            ].map((opt) => (
                                <button
                                    key={opt.t}
                                    onClick={() => setTier(opt.t as Tier)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 border ${tier === opt.t
                                        ? isDarkMode
                                            ? 'bg-pale-gold text-warm-gray-green border-pale-gold shadow-[0_0_15px_rgba(255,215,0,0.2)] scale-105'
                                            : 'bg-sage text-white border-sage shadow-lg scale-105'
                                        : isDarkMode
                                            ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                            : 'bg-sage/5 text-sage/60 border-sage/10 hover:bg-sage/10'
                                        }`}
                                >
                                    <span className={tier === opt.t ? 'text-inherit' : opt.color}>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-4">
                        <button onClick={() => setStep(2)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                            <ArrowLeft className={textSecondary} size={24} />
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            className={`px-8 py-3 rounded-full font-bold transition-all ${isDarkMode ? 'bg-white text-black hover:scale-105' : 'bg-sage text-white hover:scale-105'}`}
                        >
                            Continue
                        </button>
                    </div>
                    <StepIndicator />
                </div>
            </div>
        );
    }

    // --- STEP 4: VOICE (Audio Preview) ---
    return (
        <div className={`min-h-screen flex flex-col items-center pt-16 pb-6 px-6 transition-colors duration-500 ${bgClass}`}>
            <ThemeToggle />
            <div className="w-full max-w-lg animate-fade-in text-center flex flex-col h-full">
                <h2 className={`text-3xl font-display font-medium mb-1 ${textPrimary}`}>Choose your guide</h2>
                <p className={`text-sm mb-6 ${textSecondary}`}>Who should speak to you?</p>

                <div className="grid grid-cols-1 gap-3 mb-6 flex-1 overflow-y-auto min-h-0">
                    {VOICES.map((v) => (
                        <div
                            key={v.id}
                            onClick={() => setVoiceId(v.id)}
                            className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${voiceId === v.id ? activeCardClass : cardClass
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <Mic size={20} className={voiceId === v.id ? (isDarkMode ? 'text-pale-gold' : 'text-sage') : textSecondary} />
                                </div>
                                <div className="text-left">
                                    <h4 className={`font-medium ${voiceId === v.id ? (isDarkMode ? 'text-white' : 'text-sage') : textSecondary}`}>
                                        {v.name}
                                    </h4>
                                    <p className="text-xs opacity-60">{v.desc}</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => handlePlayPreview(v.id, e)}
                                className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/20' : 'hover:bg-sage/20'
                                    }`}
                            >
                                {isPlayingPreview && voiceId === v.id ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-auto pt-4">
                    <button onClick={() => setStep(3)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                        <ArrowLeft className={textSecondary} size={24} />
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                            }`}
                    >
                        Begin Journey
                    </button>
                </div>
                <StepIndicator />
            </div>
        </div>
    );
};
