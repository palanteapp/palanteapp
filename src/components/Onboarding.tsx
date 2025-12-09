import React, { useState } from 'react';
import type { UserProfile, Tier } from '../types';
import { ArrowRight, Sparkles, Flame, Target, Sun, Moon } from 'lucide-react';

interface OnboardingProps {
    onComplete: (profile: UserProfile) => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

const PROFESSIONS = [
    { value: 'architect', label: 'Architect / Designer' },
    { value: 'artist', label: 'Artist / Creative' },
    { value: 'athlete', label: 'Athlete / Competitor' },
    { value: 'business executive', label: 'Business Executive / CEO' },
    { value: 'coach', label: 'Coach / Trainer' },
    { value: 'doctor', label: 'Doctor / Medical Professional' },
    { value: 'engineer', label: 'Engineer / Developer' },
    { value: 'entrepreneur', label: 'Entrepreneur / Founder' },
    { value: 'filmmaker', label: 'Filmmaker / Director' },
    { value: 'lawyer', label: 'Lawyer / Legal Professional' },
    { value: 'musician', label: 'Musician / Composer' },
    { value: 'pilot', label: 'Pilot / Aviator' },
    { value: 'scientist', label: 'Scientist / Researcher' },
    { value: 'student', label: 'Student / Academic' },
    { value: 'teacher', label: 'Teacher / Educator' },
    { value: 'writer', label: 'Writer / Author' },
    { value: 'other', label: 'Other' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isDarkMode, onToggleTheme }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [career, setCareer] = useState('');
    const [profession, setProfession] = useState('');
    const [interests, setInterests] = useState('');
    const [tier, setTier] = useState<Tier>(1);
    const [sourcePreference] = useState<'human' | 'ai' | 'mix'>('mix');

    const handleSubmit = () => {
        const interestList = interests.split(',').map(i => i.trim()).filter(i => i);
        onComplete({
            name,
            career,
            profession: profession || 'other',
            interests: interestList,
            tier,
            subscriptionTier: 'free',
            streak: 0,
            points: 0,
            sourcePreference,
            notificationFrequency: 3,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            goals: [],
            voicePreference: 'nova',
            activityHistory: [],
            favoriteQuotes: [],
        });
    };

    const bgClass = isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const textBody = isDarkMode ? 'text-white/80' : 'text-warm-gray-green';

    const inputClasses = `w-full px-6 py-4 rounded-card text-base font-body outline-none transition-all duration-300 border-2 ${isDarkMode
        ? 'bg-white/5 border-white/10 focus:border-pale-gold focus:bg-white/10 text-white placeholder-white/30'
        : 'bg-white/50 border-sage/30 focus:border-sage focus:bg-white text-warm-gray-green placeholder-warm-gray-green/40'
        }`;

    const labelClasses = `block text-xs font-body font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`;

    // Theme Toggle Button
    const ThemeToggle = () => (
        <button
            onClick={onToggleTheme}
            className={`absolute top-6 right-6 p-3 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                }`}
        >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );

    // Common Branding Header
    const BrandingHeader = () => (
        <div className="flex flex-col items-center mb-8">
            <img
                src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                alt="Palante"
                className="w-20 h-20 object-contain mb-4"
            />
            <h1 className={`text-3xl font-display font-medium tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                Palante
            </h1>
            <p className={`text-sm font-body tracking-widest uppercase ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                Personalized Progress, Delivered Daily
            </p>
        </div>
    );

    // Step 1: Welcome
    if (step === 1) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen p-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle />
                <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
                    {/* Logo Animation */}
                    <div className="mb-12">
                        <div className={`inline-block p-3 rounded-2xl mb-6 animate-pulse-glow ${isDarkMode ? 'bg-white/5' : 'bg-white/40'}`}>
                            <img
                                src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                                alt="Palante Logo"
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                        <h1 className={`text-6xl font-display font-medium tracking-tight mb-3 ${textPrimary}`}>
                            Palante
                        </h1>
                        <p className={`text-sm font-body tracking-widest uppercase ${textSecondary}`}>
                            Personalized Progress, Delivered Daily
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className={`text-lg font-body leading-relaxed ${textBody}`}>
                            Welcome to your daily practice of mindfulness, motivation, and forward progress.
                        </p>
                        <p className={`text-base font-body leading-relaxed ${textSecondary}`}>
                            Let's personalize your experience in just a few moments.
                        </p>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className={`tap-zone w-full flex items-center justify-center gap-3 font-display font-medium py-5 px-8 rounded-full transition-all duration-300 transform hover:scale-105 mt-12 text-lg shadow-spa hover:shadow-spa-lg ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                            }`}
                    >
                        Begin <ArrowRight size={20} />
                    </button>

                    <div className="flex gap-2 justify-center mt-8">
                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`}></div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Personalization
    if (step === 2) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen p-6 transition-colors duration-500 ${bgClass}`}>
                <ThemeToggle />
                <div className="w-full max-w-md space-y-8 animate-fade-in">
                    <BrandingHeader />
                    <div className="text-center mb-8">
                        <h2 className={`text-3xl font-display font-medium mb-2 ${textPrimary}`}>
                            Tell us about you
                        </h2>
                        <p className={`text-sm font-body ${textSecondary}`}>
                            This helps us curate your daily affirmations
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className={labelClasses}>Your Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g. Alex"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Profession</label>
                            <select
                                required
                                value={profession}
                                onChange={(e) => setProfession(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="" className="text-black">Select...</option>
                                {PROFESSIONS.map((prof) => (
                                    <option key={prof.value} value={prof.value} className="text-black">
                                        {prof.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Current Goal</label>
                            <input
                                type="text"
                                value={career}
                                onChange={(e) => setCareer(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g. Run a marathon, Launch my business"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Interests (comma-separated)</label>
                            <input
                                type="text"
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g. Meditation, Running, Reading"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => setStep(1)}
                            className={`tap-zone flex-1 py-4 px-6 rounded-full font-display font-medium transition-all duration-300 border-2 ${isDarkMode
                                ? 'border-white/20 text-white hover:bg-white/10'
                                : 'border-sage/30 text-sage hover:bg-sage/10'
                                }`}
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!name || !profession}
                            className={`tap-zone flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full font-display font-medium transition-all duration-300 shadow-spa hover:shadow-spa-lg disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                }`}
                        >
                            Next <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="flex gap-2 justify-center mt-8">
                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/40'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`}></div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Motivational Tone Selection
    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-6 transition-colors duration-500 ${bgClass}`}>
            <ThemeToggle />
            <div className="w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className={`text-3xl font-display font-medium mb-2 ${textPrimary}`}>
                        Choose your tone
                    </h2>
                    <p className={`text-sm font-body ${textSecondary}`}>
                        How would you like to be motivated?
                    </p>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            t: 1,
                            label: "Muse",
                            desc: "Gentle, poetic encouragement",
                            icon: <Sparkles size={28} />,
                            color: isDarkMode ? "text-sage" : "text-sage",
                            borderColor: isDarkMode ? "border-sage" : "border-sage",
                            bgColor: isDarkMode ? "bg-sage" : "bg-sage"
                        },
                        {
                            t: 2,
                            label: "Focus",
                            desc: "Direct, clear, purposeful",
                            icon: <Target size={28} />,
                            color: isDarkMode ? "text-pale-gold" : "text-pale-gold",
                            borderColor: isDarkMode ? "border-pale-gold" : "border-pale-gold",
                            bgColor: isDarkMode ? "bg-pale-gold" : "bg-pale-gold"
                        },
                        {
                            t: 3,
                            label: "Firestarter",
                            desc: "Bold, intense, no excuses",
                            icon: <Flame size={28} />,
                            color: isDarkMode ? "text-white" : "text-warm-gray-green",
                            borderColor: isDarkMode ? "border-white" : "border-warm-gray-green",
                            bgColor: isDarkMode ? "bg-white" : "bg-warm-gray-green"
                        }
                    ].map((opt) => (
                        <button
                            key={opt.t}
                            type="button"
                            onClick={() => setTier(opt.t as Tier)}
                            className={`tap-zone w-full p-6 rounded-card text-left transition-all duration-300 border-2 ${tier === opt.t
                                ? `${opt.bgColor} ${opt.t === 3 && isDarkMode ? 'text-warm-gray-green' : 'text-white'} border-transparent shadow-spa-lg scale-[1.02]`
                                : `${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : `bg-white/50 ${opt.borderColor}/30 hover:${opt.borderColor}/50 hover:bg-white`}`
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`transition-colors duration-300 ${tier === opt.t ? (opt.t === 3 && isDarkMode ? 'text-warm-gray-green' : 'text-white') : opt.color}`}>
                                    {opt.icon}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-display font-medium text-xl mb-1 ${tier === opt.t ? (opt.t === 3 && isDarkMode ? 'text-warm-gray-green' : 'text-white') : textPrimary}`}>
                                        {opt.label}
                                    </div>
                                    <div className={`text-sm font-body ${tier === opt.t ? (opt.t === 3 && isDarkMode ? 'text-warm-gray-green/80' : 'text-white/80') : textSecondary}`}>
                                        {opt.desc}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={() => setStep(2)}
                        className={`tap-zone flex-1 py-4 px-6 rounded-full font-display font-medium transition-all duration-300 border-2 ${isDarkMode
                            ? 'border-white/20 text-white hover:bg-white/10'
                            : 'border-sage/30 text-sage hover:bg-sage/10'
                            }`}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`tap-zone flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full font-display font-medium transition-all duration-300 shadow-spa hover:shadow-spa-lg ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                            }`}
                    >
                        Start Journey <ArrowRight size={18} />
                    </button>
                </div>

                <div className="flex gap-2 justify-center mt-8">
                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/40'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/40'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}></div>
                </div>
            </div>
        </div>
    );
};
