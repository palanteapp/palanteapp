import React, { useState, useEffect } from 'react';
import type { Quote } from '../types';
import { ArrowRight, Sparkles, Wind } from 'lucide-react';

interface MorningBriefingProps {
    quote: Quote;
    onComplete: (focus: string) => void;
    onDismiss: () => void;
    username: string; // We can pull this from user state
}

type Step = 'greeting' | 'wisdom' | 'intent' | 'breath' | 'complete';

export const MorningBriefing: React.FC<MorningBriefingProps> = ({ quote, onComplete, username }) => {
    const [step, setStep] = useState<Step>('greeting');
    const [focus, setFocus] = useState('');
    const [greeting, setGreeting] = useState('');
    const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
    const [breathCount, setBreathCount] = useState(0);

    useEffect(() => {
        // Determine time-based greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        // Auto-advance greeting after animation
        const timer = setTimeout(() => {
            setStep('wisdom');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleNext = () => {
        if (step === 'wisdom') setStep('intent');
        else if (step === 'intent' && focus.trim()) {
            // Option to skip breath or go to it. Let's go to breath for the "Ritual" feel
            setStep('breath');
        }
        else if (step === 'breath') setStep('complete');
    };

    const handleSkipBreath = () => {
        setStep('complete');
    }

    // Simple Breath Logic
    useEffect(() => {
        if (step === 'breath') {
            if (breathCount >= 3) {
                // Wait a moment after last exhale before completing
                const t = setTimeout(() => setStep('complete'), 1000);
                return () => clearTimeout(t);
            }

            const timers: ReturnType<typeof setTimeout>[] = [];

            setBreathPhase('inhale');
            timers.push(setTimeout(() => {
                setBreathPhase('hold');
                timers.push(setTimeout(() => {
                    setBreathPhase('exhale');
                    timers.push(setTimeout(() => {
                        setBreathCount(c => c + 1);
                    }, 4000)); // Exhale time
                }, 2000)); // Hold time
            }, 4000)); // Inhale time

            return () => {
                timers.forEach(clearTimeout);
            };
        }
    }, [step, breathCount]);




    if (step === 'complete') {
        // Small delay before actual unmount to show "Let's Begin"
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-warm-gray-green text-white animate-fade-in">
                <div className="text-center animate-fade-in-up">
                    <h1 className="text-4xl font-display font-medium mb-4">Let's Begin.</h1>
                    <button
                        onClick={() => onComplete(focus)}
                        className="mt-8 px-8 py-3 bg-pale-gold text-warm-gray-green rounded-full font-medium shadow-spa hover:bg-white transition-all"
                    >
                        Enter Palante
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-warm-gray-green text-white overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-sage rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-pale-gold rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-lg w-full px-8 text-center">

                {/* Step 1: Greeting */}
                {step === 'greeting' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-light text-white/60 mb-2">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                        <h1 className="text-5xl font-display font-medium leading-tight">
                            {greeting},<br />
                            <span className="text-pale-gold">{username}</span>.
                        </h1>
                    </div>
                )}

                {/* Step 2: Wisdom */}
                {step === 'wisdom' && (
                    <div className="animate-fade-in">
                        <div className="mb-8">
                            <Sparkles size={32} className="text-pale-gold mx-auto mb-4" />
                            <h3 className="text-sm font-bold tracking-widest uppercase text-white/40 mb-2">Daily Wisdom</h3>
                        </div>
                        <blockquote className="mb-10">
                            <p className="text-3xl font-display font-medium leading-relaxed mb-6">
                                "{quote.text}"
                            </p>
                            <footer className="text-lg font-body text-white/60">
                                — {quote.author}
                            </footer>
                        </blockquote>
                        <button
                            onClick={handleNext}
                            className="group flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full mx-auto transition-all backdrop-blur-md border border-white/10"
                        >
                            <span className="font-medium">Reflect & Continue</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {/* Step 3: Intent */}
                {step === 'intent' && (
                    <div className="animate-fade-in">
                        <h3 className="text-xl font-light text-white/80 mb-6">What is your main focus today?</h3>
                        <input
                            type="text"
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            placeholder="e.g., Deep work, Kindness, Recovery..."
                            className="w-full bg-transparent border-b-2 border-white/20 text-3xl font-display text-center py-4 focus:outline-none focus:border-pale-gold placeholder-white/20 transition-colors mb-6"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && focus && handleNext()}
                        />

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleNext}
                                disabled={!focus.trim()}
                                className={`group flex items-center gap-3 px-8 py-4 rounded-full transition-all ${focus.trim()
                                    ? 'bg-pale-gold text-warm-gray-green shadow-spa hover:bg-white'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                <span className="font-medium">Set Intent</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Breath */}
                {step === 'breath' && (
                    <div className="animate-fade-in">
                        <div className="mb-12 relative flex items-center justify-center h-64">
                            {/* Breathing Visual */}
                            <div className={`absolute w-32 h-32 rounded-full border-2 border-white/20 transition-all duration-[4000ms] ease-in-out ${breathPhase === 'inhale' ? 'scale-150 border-pale-gold opacity-100' :
                                breathPhase === 'hold' ? 'scale-150 border-white opacity-80' :
                                    breathPhase === 'exhale' ? 'scale-100 border-white/20 opacity-60' : 'scale-100'
                                }`} />

                            <div className={`absolute w-4 h-4 rounded-full bg-white transition-all duration-[4000ms] ${breathPhase === 'inhale' ? 'opacity-100' : 'opacity-40'
                                }`} />

                            <Wind size={48} className={`text-white/60 transition-opacity duration-1000 ${breathPhase === 'hold' ? 'opacity-100' : 'opacity-40'
                                }`} />
                        </div>

                        <h2 className="text-3xl font-display font-medium mb-4 transition-all duration-500">
                            {breathPhase === 'inhale' && "Inhale..."}
                            {breathPhase === 'hold' && "Hold."}
                            {breathPhase === 'exhale' && "Exhale..."}
                            {breathPhase === 'idle' && "Get ready..."}
                        </h2>
                        <p className="text-white/40">Center yourself ({breathCount + 1}/3)</p>

                        <button
                            onClick={handleSkipBreath}
                            className="mt-12 text-sm text-white/30 hover:text-white transition-colors"
                        >
                            Skip Breath
                        </button>
                    </div>
                )}

            </div>

            {/* progress indicators could go here */}
        </div>
    );
};
