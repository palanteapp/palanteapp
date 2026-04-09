

import { useState, useEffect } from 'react';
import type { UserProfile, QuoteIntensity, ContentType, QuoteSource } from '../types';
import { Logo } from './Logo';
import { Sun, Moon, ArrowRight, ArrowLeft, Sparkles, Focus, Flame, Rocket, Palette, BookOpen, Activity, Briefcase, Monitor, Compass, Quote, User, Bot, Blend } from 'lucide-react';

interface OnboardingProps {
    onComplete: (profile: Omit<UserProfile, 'id'>) => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

interface ThemeToggleProps {
    onToggleTheme: () => void;
    isDarkMode: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ onToggleTheme, isDarkMode }) => (
    <button
        onClick={onToggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all z-50 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
    >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
);

interface StepIndicatorProps {
    step: number;
    isDarkMode: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step, isDarkMode }) => (
    <div className="flex gap-2 justify-center mt-8">
        {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step
                ? `w-8 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`
                : `w-2 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`
                }`} />
        ))}
    </div>
);

const PROFESSIONS = [
    { value: 'entrepreneur', label: 'Entrepreneur', icon: Rocket },
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'student', label: 'Student', icon: BookOpen },
    { value: 'athlete', label: 'Athlete', icon: Activity },
    { value: 'leader', label: 'Leader', icon: Briefcase },
    { value: 'wellness', label: 'Wellness', icon: Activity },
    { value: 'tech', label: 'Tech', icon: Monitor },
    { value: 'other', label: 'Explorer', icon: Compass },
];



export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isDarkMode, onToggleTheme }) => {
    const [step, setStep] = useState(1);

    // Form State
    const [name, setName] = useState('');
    const [coachName, setCoachName] = useState('');
    const [profession, setProfession] = useState('');
    const [interests] = useState<string[]>([]);
    const [tier, setTier] = useState<QuoteIntensity>(1);
    const [contentType, setContentType] = useState<ContentType>('quotes');
    const [quoteSource, setQuoteSource] = useState<QuoteSource>('mix');

    // Initial load animation
    const [showWelcome, setShowWelcome] = useState(false);
    useEffect(() => {
        setTimeout(() => setShowWelcome(true), 300);
    }, []);

    // Helper functions
    // toggleInterest removed as unused



    const handleSubmit = () => {
        onComplete({
            name,
            coachName: coachName || 'Palante Coach',
            career: 'Building my future', // default goal
            profession,
            interests,
            quoteIntensity: tier,
            subscriptionTier: 'free',
            streak: 0,
            points: 0,
            sourcePreference: quoteSource,
            contentTypePreference: contentType,
            notificationFrequency: 3,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            goals: [],
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


    // --- STEP 1: WELCOME & NAME ---
    if (step === 1) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${bgClass}`}>
                <ThemeToggle onToggleTheme={onToggleTheme} isDarkMode={isDarkMode} />
                {/* Background Decor */}
                <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-indigo-500' : 'bg-sage'}`} />
                <div className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

                <div className={`w-full max-w-md text-center z-10 transition-all duration-1000 transform ${showWelcome ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <p className={`text-[8px] font-bold uppercase tracking-wide mb-4 whitespace-nowrap ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                        Personalized Motivation, Delivered Daily
                    </p>
                    <Logo
                        className="w-20 h-20 mx-auto mb-6 drop-shadow-xl text-pale-gold"
                        color="#E5D6A7"
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
                    <StepIndicator step={step} isDarkMode={isDarkMode} />
                </div>
            </div>
        );
    }

    // --- STEP 2: COACH NAME ---
    if (step === 2) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${bgClass}`}>
                <ThemeToggle onToggleTheme={onToggleTheme} isDarkMode={isDarkMode} />
                <div className={`w-full max-w-md text-center z-10 animate-fade-in`}>
                    <div className={`mx-auto mb-6 p-4 rounded-full w-20 h-20 flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                        <Bot size={40} />
                    </div>

                    <h1 className={`text-4xl md:text-5xl font-display font-medium mb-3 ${textPrimary}`}>
                        Name your Coach.
                    </h1>
                    <p className={`text-lg font-body mb-8 max-w-xs mx-auto ${textSecondary}`}>
                        I'll be your guide. What would you like to call me?
                    </p>

                    <div className="space-y-3 text-left">
                        <label className={`text-xs font-bold uppercase tracking-widest pl-4 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                            Coach Name
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={coachName}
                                onChange={(e) => setCoachName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && coachName && setStep(3)}
                                placeholder="e.g. Athena, Atlas, Guide..."
                                autoFocus
                                className={`w-full px-6 py-4 rounded-2xl text-xl font-display outline-none transition-all border-2 ${isDarkMode
                                    ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/20'
                                    : 'bg-white/50 border-sage/20 focus:border-sage text-sage placeholder-sage/30'
                                    }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={() => coachName && setStep(3)}
                                    disabled={!coachName}
                                    className={`p-2 rounded-full transition-all ${coachName
                                        ? (isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:scale-110' : 'bg-sage text-white hover:scale-110')
                                        : 'opacity-0 scale-50'
                                        }`}
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <button
                                onClick={() => { setCoachName('Palante Coach'); setStep(3); }}
                                className={`text-xs uppercase tracking-widest font-bold hover:underline ${textSecondary}`}
                            >
                                Skip (Use Default)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8">
                    <div className="flex justify-between items-center w-full max-w-md px-4 absolute bottom-16 left-1/2 -translate-x-1/2">
                        <button onClick={() => setStep(1)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                            <ArrowLeft className={textSecondary} size={24} />
                        </button>
                    </div>
                    <StepIndicator step={step} isDarkMode={isDarkMode} />
                </div>
            </div>
        );
    }

    // --- STEP 3: PROFESSION (Visual Cards) ---
    if (step === 3) {
        return (
            <div className={`min-h-screen flex flex-col items-center pt-16 pb-6 px-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle onToggleTheme={onToggleTheme} isDarkMode={isDarkMode} />
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
                        <button onClick={() => setStep(2)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                            <ArrowLeft className={textSecondary} size={24} />
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            disabled={!profession}
                            className={`px-8 py-3 rounded-full font-bold transition-all ${profession ? (isDarkMode ? 'bg-white text-black hover:scale-105' : 'bg-sage text-white hover:scale-105') : 'opacity-50 cursor-not-allowed bg-gray-500/20'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                    <StepIndicator step={step} isDarkMode={isDarkMode} />
                </div>
            </div>
        );
    }

    // --- STEP 4: TONE (Intensities) ---
    if (step === 4) {
        return (
            <div className={`min-h-screen flex flex-col items-center pt-16 pb-6 px-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle onToggleTheme={onToggleTheme} isDarkMode={isDarkMode} />
                <div className="w-full max-w-lg animate-fade-in text-center flex flex-col h-full">
                    <h2 className={`text-3xl font-display font-medium mb-1 ${textPrimary}`}>How should we push you?</h2>
                    <p className={`text-sm mb-8 ${textSecondary}`}>Select your coaching intensity.</p>

                    <div className="flex flex-col gap-4 mb-6 flex-1 justify-center">
                        {/* Description Display */}
                        <div className={`min-h-[60px] flex items-center justify-center px-4 ${textSecondary}`}>
                            {tier === 1 && "Gentle & Poetic encouragement that nurtures your equilibrium."}
                            {tier === 2 && "Direct & Clear guidance to keep you on track."}
                            {tier === 3 && "Bold & Intense motivation. No excuses."}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {[
                                { t: 1, label: "Gentle", icon: <Sparkles size={18} />, color: "text-purple-400" },
                                { t: 2, label: "Direct", icon: <Focus size={18} />, color: "text-blue-400" },
                                { t: 3, label: "Bold", icon: <Flame size={18} />, color: "text-orange-400" }
                            ].map((opt) => (
                                <button
                                    key={opt.t}
                                    onClick={() => setTier(opt.t as QuoteIntensity)}
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
                        <button onClick={() => setStep(3)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                            <ArrowLeft className={textSecondary} size={24} />
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            className={`px-8 py-3 rounded-full font-bold transition-all ${isDarkMode ? 'bg-white text-black hover:scale-105' : 'bg-sage text-white hover:scale-105'}`}
                        >
                            Continue
                        </button>
                    </div>
                    <StepIndicator step={step} isDarkMode={isDarkMode} />
                </div>
            </div>
        );
    }

    // --- STEP 5: CONTENT STYLE & SOURCE ---
    if (step === 5) {
        return (
            <div className={`min-h-screen flex flex-col items-center pt-16 pb-6 px-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle onToggleTheme={onToggleTheme} isDarkMode={isDarkMode} />
                <div className="w-full max-w-lg animate-fade-in text-center flex flex-col h-full">
                    <h2 className={`text-3xl font-display font-medium mb-1 ${textPrimary}`}>Content Style</h2>
                    <p className={`text-sm mb-8 ${textSecondary}`}>Choose your preferred format</p>

                    <div className="flex flex-col gap-6 mb-6 flex-1 justify-center">
                        {/* Content Type Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setContentType('affirmations')}
                                className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${contentType === 'affirmations'
                                    ? isDarkMode
                                        ? 'bg-pale-gold/10 border-pale-gold text-pale-gold'
                                        : 'bg-sage/10 border-sage text-sage'
                                    : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        : 'bg-sage/5 border-sage/10 text-sage/60 hover:bg-sage/10'
                                    }`}
                            >
                                <Sparkles size={24} />
                                <div>
                                    <div className="font-bold">Affirmations</div>
                                    <div className="text-xs opacity-60">Power statements</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setContentType('quotes')}
                                className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${contentType === 'quotes'
                                    ? isDarkMode
                                        ? 'bg-pale-gold/10 border-pale-gold text-pale-gold'
                                        : 'bg-sage/10 border-sage text-sage'
                                    : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        : 'bg-sage/5 border-sage/10 text-sage/60 hover:bg-sage/10'
                                    }`}
                            >
                                <Quote size={24} />
                                <div>
                                    <div className="font-bold">Quotes</div>
                                    <div className="text-xs opacity-60">Wisdom & insight</div>
                                </div>
                            </button>
                        </div>
                        <button
                            onClick={() => setContentType('mix')}
                            className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${contentType === 'mix'
                                ? isDarkMode
                                    ? 'bg-pale-gold/10 border-pale-gold text-pale-gold'
                                    : 'bg-sage/10 border-sage text-sage'
                                : isDarkMode
                                    ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    : 'bg-sage/5 border-sage/10 text-sage/60 hover:bg-sage/10'
                                }`}
                        >
                            <Blend size={24} />
                            <div>
                                <div className="font-bold">Both</div>
                                <div className="text-xs opacity-60">Balanced mix</div>
                            </div>
                        </button>

                        {/* Quote Source Selection */}
                        <div className="mt-4">
                            <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Source</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setQuoteSource('human')}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${quoteSource === 'human'
                                        ? isDarkMode
                                            ? 'bg-pale-gold/10 border-pale-gold text-pale-gold'
                                            : 'bg-sage/10 border-sage text-sage'
                                        : isDarkMode
                                            ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            : 'bg-sage/5 border-sage/10 text-sage/60 hover:bg-sage/10'
                                        }`}
                                >
                                    <User size={24} />
                                    <div>
                                        <div className="font-bold">Human</div>
                                        <div className="text-xs opacity-60">Classic wisdom</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setQuoteSource('ai')}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${quoteSource === 'ai'
                                        ? isDarkMode
                                            ? 'bg-pale-gold/10 border-pale-gold text-pale-gold'
                                            : 'bg-sage/10 border-sage text-sage'
                                        : isDarkMode
                                            ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            : 'bg-sage/5 border-sage/10 text-sage/60 hover:bg-sage/10'
                                        }`}
                                >
                                    <Bot size={24} />
                                    <div>
                                        <div className="font-bold">Palante Coach</div>
                                        <div className="text-xs opacity-60">AI-powered</div>
                                    </div>
                                </button>
                            </div>
                            <button
                                onClick={() => setQuoteSource('mix')}
                                className={`mt-3 w-full p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${quoteSource === 'mix'
                                    ? isDarkMode
                                        ? 'bg-pale-gold/10 border-pale-gold text-pale-gold'
                                        : 'bg-sage/10 border-sage text-sage'
                                    : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        : 'bg-sage/5 border-sage/10 text-sage/60 hover:bg-sage/10'
                                    }`}
                            >
                                <Blend size={24} />
                                <div>
                                    <div className="font-bold">Both</div>
                                    <div className="text-xs opacity-60">Best of both worlds</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-4">
                        <button onClick={() => setStep(4)} className={`p-4 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}>
                            <ArrowLeft className={textSecondary} size={24} />
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                        >
                            Begin Journey
                        </button>
                    </div>
                    <StepIndicator step={step} isDarkMode={isDarkMode} />
                </div>
            </div>
        );
    }

    // --- STEP 5: REMOVED (Voice Selection) ---
    return null;
};
