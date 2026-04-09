/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from 'react';
import { X, Clock, Target, ArrowRight, Check, Flame, Sparkles } from 'lucide-react';
import type { RoutineStack, StackStep } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StackWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (stack: RoutineStack, shouldLaunch?: boolean, shouldEdit?: boolean) => void;
    isDarkMode: boolean;
}

type WizardStep = 'intro' | 'duration' | 'goal' | 'confirm';

export const StackWizardModal: React.FC<StackWizardProps> = ({ isOpen, onClose, onSave, isDarkMode }) => {
    const [step, setStep] = useState<WizardStep>('intro');
    const [answers, setAnswers] = useState({
        duration: '',
        goal: ''
    });
    const [generatedStack, setGeneratedStack] = useState<RoutineStack | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            Promise.resolve().then(() => {
                setStep('intro');
                setAnswers({ duration: '', goal: '' });
                setGeneratedStack(null);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const bgClass = isDarkMode ? 'bg-warm-gray-green/95 text-white' : 'bg-warm-gray-green/95 text-white';
    const cardClass = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-stone-200';

    const handleAnswer = (key: keyof typeof answers, value: string) => {
        setAnswers(prev => ({ ...prev, [key]: value }));

        // Auto-advance
        if (key === 'duration') setStep('goal');
        if (key === 'goal') {
            // Generate stack immediately after goal selection
            generateStack(value);
        }
    };

    const generateStack = (finalAnswer: string) => {
        // Logic to build stack based on answers
        // This is a simplified generator
        const duration = answers.duration; // '5', '15', '30'
        const goal = answers.goal; // 'energy', 'calm', 'focus'

        const steps: StackStep[] = [];
        let name = "Custom Routine";
        let icon = "sun";

        // Step 1: Always check-in
        steps.push({
            id: uuidv4(),
            type: 'checkin',
            label: 'Energy Check-In',
            duration: 30
        });

        // Step 2: Breathwork
        if (goal === 'energy') {
            steps.push({
                id: uuidv4(),
                type: 'breathwork',
                label: 'Energizing Breaths',
                config: { method: 'wim-hof' },
                duration: duration === '5' ? 120 : 300
            });
            name = "Energy Boost";
            icon = "zap";
        } else if (goal === 'calm') {
            steps.push({
                id: uuidv4(),
                type: 'breathwork',
                label: 'Box Breathing',
                config: { method: 'box' },
                duration: duration === '5' ? 120 : 300
            });
            name = "Calm & Center";
            icon = "leaf";
        } else {
            steps.push({
                id: uuidv4(),
                type: 'meditation',
                label: 'Focus Meditation',
                duration: duration === '5' ? 180 : 600
            });
            name = "Deep Focus";
            icon = "target";
        }

        // Step 3: Gratitude/Affirmation/Journal based on duration and goal
        if (duration !== '5') {
            if (goal === 'calm') {
                steps.push({
                    id: uuidv4(),
                    type: 'gratitude',
                    label: 'Gratitude Practice',
                    duration: 120
                });
            } else if (goal === 'energy') {
                steps.push({
                    id: uuidv4(),
                    type: 'affirmation',
                    label: 'Power Affirmations',
                    duration: 120
                });
            } else {
                steps.push({
                    id: uuidv4(),
                    type: 'journal',
                    label: 'Daily Intention',
                    duration: 180
                });
            }
        }

        // Step 4: Quote
        steps.push({
            id: uuidv4(),
            type: 'quote',
            label: 'Daily Wisdom',
            duration: 30
        });

        const newStack: RoutineStack = {
            id: uuidv4(),
            name,
            description: `A ${duration}-minute flow for ${goal}.`,
            icon,
            steps,
            totalDuration: parseInt(duration),
            themeColor: goal === 'energy' ? 'emerald' : (goal === 'calm' ? 'sage' : 'sky')
        };

        // Don't save immediately, wait for confirmation
        // Store it in state or just recreate it in confirm step?
        // Let's store it in a ref or state
        setGeneratedStack(newStack);
        setStep('confirm');
    };



    const handleConfirm = (shouldLaunch: boolean) => {
        if (generatedStack) {
            onSave(generatedStack, shouldLaunch);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden ${bgClass}`}>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <X size={20} className="opacity-50" />
                </button>

                {/* Content */}
                <div className="mt-2 min-h-[300px] flex flex-col items-center justify-center text-center">

                    {step === 'intro' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="w-16 h-16 rounded-full bg-pale-gold/10 border border-pale-gold/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <Clock className="text-pale-gold" size={32} />
                            </div>
                            <h2 className="text-2xl font-display font-medium">Let's build your flow.</h2>
                            <p className="opacity-60">Answer 3 questions to create a perfect routine for right now.</p>
                            <button
                                onClick={() => setStep('duration')}
                                className="px-8 py-3 bg-ink-black text-white dark:bg-white dark:text-warm-gray-green rounded-full font-medium active:scale-95 transition-all"
                            >
                                Start
                            </button>
                        </div>
                    )}

                    {step === 'duration' && (
                        <div className="animate-in slide-in-from-right duration-300 w-full">
                            <h3 className="text-xl font-display mb-8">How much time do you have?</h3>
                            <div className="space-y-3">
                                {[
                                    { label: '5 Minutes', value: '5', sub: 'Quick reset' },
                                    { label: '15 Minutes', value: '15', sub: 'Deep dive' },
                                    { label: '30 Minutes', value: '30', sub: 'Full transformation' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleAnswer('duration', opt.value)}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between group hover:border-sage transition-all text-left ${cardClass}`}
                                    >
                                        <div>
                                            <div className="font-medium">{opt.label}</div>
                                            <div className="text-xs opacity-50">{opt.sub}</div>
                                        </div>
                                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'goal' && (
                        <div className="animate-in slide-in-from-right duration-300 w-full">
                            <h3 className="text-xl font-display mb-8">What is your goal?</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'More Energy', value: 'energy', icon: <Flame size={24} className="text-pale-gold" fill="currentColor" fillOpacity={0.2} /> },
                                    { label: 'Calm & Peace', value: 'calm', icon: <Sparkles size={24} className="text-pale-gold" fill="currentColor" fillOpacity={0.2} /> },
                                    { label: 'Razor Focus', value: 'focus', icon: <Target size={24} className="text-pale-gold" /> }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleAnswer('goal', opt.value)}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between group hover:border-sage transition-all text-left ${cardClass}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{opt.icon}</span>
                                            <div className="font-medium">{opt.label}</div>
                                        </div>
                                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="animate-in scale-in duration-300 text-center">
                            <div className="w-16 h-16 rounded-full bg-pale-gold text-warm-gray-green flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pale-gold/20">
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-display font-medium mb-2">Routine Ready!</h2>
                            <p className="opacity-60 mb-8 max-w-xs mx-auto">We've added this flow to your dashboard.</p>
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={() => handleConfirm(false)}
                                    className="flex-1 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all"
                                >
                                    Save for Later
                                </button>
                                <button
                                    onClick={() => handleConfirm(true)}
                                    className="flex-1 py-3 bg-white text-warm-gray-green rounded-full font-bold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <div className="w-2 h-2 rounded-full bg-pale-gold animate-pulse" />
                                    Start Now
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    if (generatedStack) {
                                        onSave(generatedStack, false, true); // shouldLaunch=false, shouldEdit=true
                                    }
                                }}
                                className="text-white/40 text-sm font-medium hover:text-white transition-colors"
                            >
                                Customize Flow
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
