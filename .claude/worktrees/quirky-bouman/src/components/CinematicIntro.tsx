import React, { useState, memo } from 'react';
import { Sparkles, Focus, Flame, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import type { ContentType, QuoteSource } from '../types';

const INTEREST_OPTIONS = [
    'Wellness', 'Career', 'Creativity', 'Leadership',
    'Mindfulness', 'Fitness', 'Growth', 'Balance'
];

const INTENSITY_OPTIONS = [
    {
        quoteIntensity: 1,
        icon: Sparkles,
        label: 'Gentle & Nurturing',
        description: 'Calm, poetic inspiration'
    },
    {
        quoteIntensity: 2,
        icon: Focus,
        label: 'Balanced & Clear',
        description: 'Direct, focused motivation'
    },
    {
        quoteIntensity: 3,
        icon: Flame,
        label: 'Intense & Direct',
        description: 'High-energy, no-nonsense'
    }
];

interface CinematicIntroProps {
    onComplete: (userData: {
        name: string;
        profession: string;
        focusGoal: string;
        interests: string;
        quoteIntensity: number;
        contentType: ContentType;
        sourcePreference: QuoteSource;
        ageRange?: string;
    }) => void;
    onOpenSettings?: () => void;
}

export const CinematicIntro = memo(({ onComplete, onOpenSettings: _onOpenSettings }: CinematicIntroProps) => {
    const [step, setStep] = useState(0);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [quoteIntensity, setQuoteIntensity] = useState<number>(2); // Default to Balanced
    const [contentType, setContentType] = useState<ContentType>('mix');

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleComplete = async () => {
        if (isCompleting) return; // Prevent double-submission

        if (!name.trim()) {
            alert('Please enter your name to continue.');
            return;
        }

        if (selectedInterests.length === 0) {
            alert('Please select at least one interest to personalize your experience.');
            return;
        }

        setIsCompleting(true);

        try {
            // Save disclaimer acceptance
            const acceptance = {
                accepted: true,
                timestamp: new Date().toISOString(),
                version: LEGAL_DISCLAIMER.lastUpdated
            };
            localStorage.setItem('disclaimerAccepted', JSON.stringify(acceptance));

            // Pass complete user data with smart defaults
            await onComplete({
                name: name.trim(),
                profession: 'Other', // Default - can be set in Settings
                focusGoal: '', // Empty - will be set in Morning Practice
                interests: selectedInterests.join(', '),
                quoteIntensity,
                contentType,
                sourcePreference: 'mix', // Auto-default to best of both
                ageRange: undefined // Not collected - can be set in Settings
            });
        } catch (error) {
            console.error('Error completing intro:', error);
            setIsCompleting(false);
        }
    };

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            }
            // Limit to 3 selections
            if (prev.length >= 3) {
                return prev;
            }
            return [...prev, interest];
        });
    };

    // Animation classes
    const fadeUp = "animate-slide-up opacity-0 fill-mode-forwards";
    const _fadeIn = "animate-fade-in opacity-0 fill-mode-forwards";


    // Slide Content
    const slides = [
        // 0: The Reveal
        {
            content: (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 relative z-10" onClick={handleNext}>
                    {/* Glow behind logo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pale-gold/20 rounded-full blur-[80px] animate-pulse-slow"></div>

                    <div className={`${fadeUp} mb-6`}>
                        <Logo className="w-24 h-24 text-pale-gold drop-shadow-lg" color="#E5D6A7" />
                    </div>

                    <h1 className={`${fadeUp} text-5xl font-display font-bold text-white mb-3 drop-shadow-md`} style={{ animationDelay: '0.2s' }}>
                        Palante
                    </h1>

                    <p className={`${fadeUp} text-lg text-pale-gold/90 font-body tracking-wide mb-12 flex flex-col`} style={{ animationDelay: '0.4s' }}>
                        <span>Your Personal</span>
                        <span>Growth Companion</span>
                    </p>

                    <div className="mt-8" style={{ animationDelay: '0.8s' }}>
                        <p className="text-white/50 text-sm uppercase tracking-widest animate-pulse">Tap to begin</p>
                    </div>
                </div>
            )
        },
        // 1: Name + Interests
        {
            content: (
                <div className="flex flex-col h-full px-6 pt-32 pb-8 w-full max-w-lg mx-auto overflow-y-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className={`${fadeUp} text-3xl font-display font-medium text-white mb-3`} style={{ animationDelay: '0s' }}>
                            Let's personalize your experience
                        </h2>
                        <p className={`${fadeUp} text-white/60 text-sm`} style={{ animationDelay: '0.1s' }}>
                            This helps us deliver the right content for you.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-3">What should we call you? *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-pale-gold transition-all text-lg"
                                autoFocus
                            />
                        </div>

                        {/* Interests */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-3">
                                What are you focused on right now?
                            </label>
                            <p className="text-white/50 text-xs mb-3">Select 1-3 that resonate with you</p>
                            <div className="grid grid-cols-2 gap-3">
                                {INTEREST_OPTIONS.map((interest) => {
                                    const isSelected = selectedInterests.includes(interest);
                                    return (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => toggleInterest(interest)}
                                            className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${isSelected
                                                ? 'bg-pale-gold/20 border-pale-gold text-white scale-105'
                                                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            {interest}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedInterests.length === 3 && (
                                <p className="text-pale-gold text-xs mt-2">Maximum 3 selections reached</p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-6">
                        <button
                            onClick={handleNext}
                            disabled={!name.trim() || selectedInterests.length === 0}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${name.trim() && selectedInterests.length > 0
                                ? 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            )
        },
        // 2: Content Preferences
        {
            content: (
                <div className="flex flex-col h-full px-6 pt-32 pb-8 w-full max-w-lg mx-auto overflow-y-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className={`${fadeUp} text-3xl font-display font-medium text-white mb-3`} style={{ animationDelay: '0s' }}>
                            How would you like your motivation?
                        </h2>
                        <p className={`${fadeUp} text-white/60 text-sm`} style={{ animationDelay: '0.1s' }}>
                            You can change these anytime in Settings.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Content Type */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-3">Content Style</label>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setContentType('affirmations')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${contentType === 'affirmations'
                                        ? 'bg-pale-gold/20 border-pale-gold'
                                        : 'bg-white/5 border-white/20 hover:border-white/40'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={24} className={contentType === 'affirmations' ? 'text-pale-gold' : 'text-white/60'} />
                                        <div>
                                            <div className="font-medium text-white">Affirmations</div>
                                            <div className="text-xs text-white/60">Power statements for confidence</div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setContentType('quotes')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${contentType === 'quotes'
                                        ? 'bg-pale-gold/20 border-pale-gold'
                                        : 'bg-white/5 border-white/20 hover:border-white/40'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Focus size={24} className={contentType === 'quotes' ? 'text-pale-gold' : 'text-white/60'} />
                                        <div>
                                            <div className="font-medium text-white">Quotes</div>
                                            <div className="text-xs text-white/60">Wisdom & insight from thinkers</div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setContentType('mix')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${contentType === 'mix'
                                        ? 'bg-pale-gold/20 border-pale-gold'
                                        : 'bg-white/5 border-white/20 hover:border-white/40'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <Sparkles size={20} className={contentType === 'mix' ? 'text-pale-gold' : 'text-white/60'} />
                                            <Focus size={20} className={contentType === 'mix' ? 'text-pale-gold' : 'text-white/60'} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Both</div>
                                            <div className="text-xs text-white/60">Balanced mix</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Motivation Intensity */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-3">Motivation Intensity</label>
                            <div className="grid grid-cols-3 gap-3">
                                {INTENSITY_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = quoteIntensity === option.quoteIntensity;
                                    return (
                                        <button
                                            key={option.quoteIntensity}
                                            type="button"
                                            onClick={() => setQuoteIntensity(option.quoteIntensity)}
                                            className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                ? 'bg-pale-gold/20 border-pale-gold text-white'
                                                : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40'
                                                }`}
                                        >
                                            <Icon size={24} className={`mx-auto mb-2 ${isSelected ? 'text-pale-gold' : 'text-white/60'}`} />
                                            <div className="text-xs font-medium text-center">{option.label}</div>
                                            <div className="text-[10px] text-white/50 text-center mt-1">{option.description}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-6 space-y-4">
                        <button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className={`w-full py-4 font-bold rounded-xl transition-all text-lg ${isCompleting
                                ? 'bg-pale-gold/50 text-sage-dark/50 cursor-not-allowed'
                                : 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90'
                                }`}
                        >
                            {isCompleting ? 'Setting up your experience...' : "Let's Go! →"}
                        </button>

                        {/* Disclaimer */}
                        <p className="text-[10px] text-white/40 text-center leading-tight">
                            By continuing, you acknowledge Palante is a tool for wellness, not medical advice.
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDisclaimer(true); }}
                                className="underline ml-1 hover:text-white transition-colors"
                            >
                                Read Terms
                            </button>
                        </p>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-sage overflow-hidden font-display">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-white/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-pale-gold/10 rounded-full blur-[80px]" />
            </div>

            {/* Main Slide Content */}
            <div className={`relative z-10 w-full h-full transition-all duration-700 ease-in-out`}>
                {slides[step].content}
            </div>

            {/* Progress Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === step ? 'w-8 bg-pale-gold' : 'w-1.5 bg-white/20'
                            }`}
                    />
                ))}
            </div>

            {/* Disclaimer Overlay */}
            {showDisclaimer && (
                <div className="absolute inset-0 z-50 bg-sage/95 backdrop-blur-md p-8 flex flex-col items-center justify-center animate-fade-in">
                    <div className="bg-white/10 border border-white/10 rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <ShieldCheck size={20} className="text-pale-gold" />
                            <h3 className="font-bold text-lg">Mindful Disclaimer</h3>
                        </div>
                        <div className="space-y-4 text-white/80 text-xs leading-relaxed">
                            {LEGAL_DISCLAIMER.sections.map((s, i) => (
                                <div key={i}>
                                    <strong className="block text-pale-gold mb-1">{s.heading}</strong>
                                    {s.content}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowDisclaimer(false)}
                            className="mt-6 w-full py-3 bg-pale-gold text-sage-dark font-bold rounded-xl"
                        >
                            Close & Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
