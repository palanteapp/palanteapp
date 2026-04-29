import React, { useState, useEffect } from 'react';
import { X, Clock, Target, ArrowRight, Check, Flame, Sparkles } from 'lucide-react';
import type { RoutineStack, StackStep } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';

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
            setStep('intro');
            setAnswers({ duration: '', goal: '' });
            setGeneratedStack(null);
        }
    }, [isOpen]);

    const handleAnswer = (key: keyof typeof answers, value: string) => {
        haptics.selection();
        setAnswers(prev => ({ ...prev, [key]: value }));

        if (key === 'duration') setStep('goal');
        if (key === 'goal') {
            generateStack(value);
        }
    };

    const generateStack = (_finalAnswer: string) => {
        const duration = answers.duration;
        const goal = answers.goal;

        const steps: StackStep[] = [];
        let name = "Custom Routine";
        let icon = "sun";

        steps.push({
            id: uuidv4(),
            type: 'checkin',
            label: 'Energy Check-In',
            duration: 30
        });

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

        setGeneratedStack(newStack);
        setStep('confirm');
    };

    const handleConfirm = (shouldLaunch: boolean) => {
        if (generatedStack) {
            haptics.success();
            onSave(generatedStack, shouldLaunch);
        }
    };

    const textPrimary = 'text-white';
    const accentLabel = 'text-white/60 font-black text-[10px] uppercase tracking-[0.4em]';

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onClose}
            isDarkMode={isDarkMode}
            showCloseButton={false}
        >
            <div className="p-8 pb-12">
                {/* Close Button */}
                <button
                    onClick={() => { haptics.light(); onClose(); }}
                    className={`absolute top-6 right-6 p-2 rounded-full transition-all bg-white/[0.10] hover:bg-white/[0.18] shadow-sm ${textPrimary}`}
                >
                    <X size={24} />
                </button>

                <div className="mt-4 min-h-[400px] flex flex-col">

                    {step === 'intro' && (
                        <div className="flex flex-col items-center text-center animate-fade-in py-10">
                            <div className="w-24 h-24 rounded-[2rem] bg-[#E5D6A7] flex items-center justify-center mb-8 shadow-md rotate-3">
                                <Clock size={48} className={textPrimary} />
                            </div>
                            <h2 className={`text-4xl font-display font-medium ${textPrimary} mb-4`}>
                                Create your flow.
                            </h2>
                            <p className={`text-sm font-medium leading-relaxed max-w-[260px] mb-12 ${textPrimary}/60`}>
                                Answer simple questions to design a personal ritual for this moment.
                            </p>
                            <button
                                onClick={() => { haptics.medium(); setStep('duration'); }}
                                className="w-full py-5 bg-white/[0.15] text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                            >
                                Start Building
                            </button>
                        </div>
                    )}

                    {step === 'duration' && (
                        <div className="animate-in slide-in-from-right duration-300 w-full flex flex-col">
                            <div className="mb-10 text-center">
                                <h3 className={`text-2xl font-display font-medium ${textPrimary} mb-2`}>How much time?</h3>
                                <p className={accentLabel}>TIME INVESTMENT</p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: '5 Minutes', value: '5', sub: 'The Quick Reset' },
                                    { label: '15 Minutes', value: '15', sub: 'Deep Connection' },
                                    { label: '30 Minutes', value: '30', sub: 'Full Transformation' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleAnswer('duration', opt.value)}
                                        className="w-full p-6 rounded-[2.5rem] bg-white/[0.08] border-2 border-white/10 hover:border-[#E5D6A7] hover:bg-white/[0.14] transition-all text-left flex items-center justify-between group active:scale-[0.98]"
                                    >
                                        <div className="flex-1">
                                            <div className={`font-black uppercase tracking-widest text-xs mb-1 ${textPrimary}`}>{opt.label}</div>
                                            <div className={`text-[11px] font-medium ${textPrimary}/60`}>{opt.sub}</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-[#E5D6A7]/20 flex items-center justify-center group-hover:bg-[#E5D6A7] transition-all">
                                            <ArrowRight size={18} className={textPrimary} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'goal' && (
                        <div className="animate-in slide-in-from-right duration-300 w-full flex flex-col">
                            <div className="mb-10 text-center">
                                <h3 className={`text-2xl font-display font-medium ${textPrimary} mb-2`}>What is the goal?</h3>
                                <p className={accentLabel}>CORE INTENTION</p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'More Energy', value: 'energy', sub: 'Vitality & Force', icon: <Flame size={20} fill="currentColor" /> },
                                    { label: 'Calm & Peace', value: 'calm', sub: 'Stillness & Ease', icon: <Sparkles size={20} /> },
                                    { label: 'Razor Focus', value: 'focus', sub: 'Clarity & Action', icon: <Target size={20} /> }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleAnswer('goal', opt.value)}
                                        className="w-full p-6 rounded-[2.5rem] bg-white/[0.08] border-2 border-white/10 hover:border-[#E5D6A7] hover:bg-white/[0.14] transition-all text-left flex items-center justify-between group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white/[0.12] flex items-center justify-center text-white shadow-sm">
                                                {opt.icon}
                                            </div>
                                            <div>
                                                <div className={`font-black uppercase tracking-widest text-xs mb-1 ${textPrimary}`}>{opt.label}</div>
                                                <div className={`text-[11px] font-medium ${textPrimary}/60`}>{opt.sub}</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-[#E5D6A7]/20 flex items-center justify-center group-hover:bg-[#E5D6A7] transition-all">
                                            <ArrowRight size={18} className={textPrimary} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="animate-in scale-in duration-300 flex flex-col items-center text-center py-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-[#E5D6A7] flex items-center justify-center mb-8 shadow-lg rotate-3">
                                <Check size={48} strokeWidth={4} className={textPrimary} />
                            </div>
                            <h2 className={`text-4xl font-display font-medium ${textPrimary} mb-4`}>Routine Ready.</h2>
                            <p className={`text-sm font-medium leading-relaxed max-w-[240px] mb-12 ${textPrimary}/60`}>
                                Your new {answers.duration}-minute flow for {answers.goal} is locked into your dashboard.
                            </p>
                            
                            <div className="w-full space-y-4">
                                <button
                                    onClick={() => handleConfirm(true)}
                                    className="w-full py-5 bg-white/[0.15] text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-pulse" />
                                    <span>Start This Now</span>
                                </button>
                                <button
                                    onClick={() => handleConfirm(false)}
                                    className="w-full py-5 bg-white/[0.08] text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-white/[0.15] transition-all"
                                >
                                    Save for Later
                                </button>
                                <button
                                    onClick={() => {
                                        if (generatedStack) {
                                            haptics.light();
                                            onSave(generatedStack, false, true);
                                        }
                                    }}
                                    className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] ${textPrimary}/40 hover:${textPrimary} transition-all`}
                                >
                                    Customize Flow Details
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </SlideUpModal>
    );
};
