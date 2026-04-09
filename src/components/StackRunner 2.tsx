/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Compass, Heart, Mic, Sparkles, Target, Waves, X } from 'lucide-react';
import type { RoutineStack, StackStep } from '../types';
import { Breathing } from './Breathing';
import { Meditation } from './Meditation';
import { DailyMorningPracticeWidget } from './DailyMorningPracticeWidget';
import { FocusTimer } from './FocusTimer';
import { triggerConfetti } from '../utils/CelebrationEffects';
import type { UserProfile } from '../types';

interface StackRunnerProps {
    routine: RoutineStack;
    onComplete: () => void;
    onClose: () => void;
    isDarkMode: boolean;
    user: UserProfile;
    onUpdateUser: (u: Partial<UserProfile>) => void;
}

export const StackRunner: React.FC<StackRunnerProps> = ({
    routine,
    onComplete,
    onClose,
    isDarkMode,
    user,
    onUpdateUser
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const finishRoutine = () => {
        setIsFinished(true);
        triggerConfetti();
        // Delay close to show completion screen
    };

    // Safeguard: Unknown routine or no steps
    if (!routine || !routine.steps || routine.steps.length === 0) {
        return (
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-8 ${isDarkMode ? 'bg-warm-gray-green text-white' : 'bg-white text-warm-gray-green'}`}>
                <div className="text-center">
                    <p>Empty or invalid routine.</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-sage text-white rounded-full">Close</button>
                </div>
            </div>
        );
    }

    const currentStep = routine.steps[currentStepIndex];
    // Safeguard index out of bounds
    if (!currentStep) {
        finishRoutine(); // Should have finished already, force finish
        return null;
    }

    const progress = ((currentStepIndex) / routine.steps.length) * 100;

    const handleStepComplete = () => {
        if (currentStepIndex < routine.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            finishRoutine();
        }
    };



    if (isFinished) {
        return (
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in ${isDarkMode ? 'bg-warm-gray-green text-white' : 'bg-white text-warm-gray-green'}`}>
                <div className="scale-150 mb-8 text-green-400 flex justify-center">
                    <CheckCircle2 size={64} />
                </div>
                <h2 className="text-3xl font-display font-medium mb-4">Flow Complete</h2>
                <p className="opacity-60 mb-12">You've completed {routine.name}.</p>
                <button
                    onClick={onComplete}
                    className="px-8 py-3 bg-sage text-white rounded-full font-medium active:scale-95 transition-all"
                >
                    Return to Day
                </button>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col ${isDarkMode ? 'bg-warm-gray-green text-white' : 'bg-white text-warm-gray-green'}`}>

            {/* Top Bar: Progress & Close */}
            <div className="flex items-center justify-between px-6 pb-6 pt-16 border-b border-white/10">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity bg-white/5 px-3 py-1.5 rounded-full"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium opacity-60 uppercase tracking-wider">
                            Step {currentStepIndex + 1} of {routine.steps.length}
                        </span>
                        <span className="font-display text-lg">{currentStep.label}</span>
                    </div>
                </div>

                {/* Progress Ring */}
                <div className="w-12 h-12 relative flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-10" />
                        <circle
                            cx="24" cy="24" r="18"
                            stroke="currentColor" strokeWidth="2" fill="none"
                            strokeDasharray={113}
                            strokeDashoffset={113 - (113 * progress / 100)}
                            className="transition-all duration-500 text-pale-gold"
                        />
                    </svg>
                    <span className="absolute text-xs font-bold">{Math.round(progress)}%</span>
                </div>
            </div>

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                {/* 
                       We render different components based on step type.
                       We pass 'isActive={true}' to ensure animations run.
                    */}

                {currentStep.type === 'breathwork' && (
                    <div className="min-h-[500px]">
                        <Breathing
                            isActive={true}
                            isDarkMode={isDarkMode}
                            onComplete={handleStepComplete}
                        />
                    </div>
                )}

                {currentStep.type === 'meditation' && (
                    <div className="min-h-[500px]">
                        <Meditation
                            isDarkMode={isDarkMode}
                            onComplete={handleStepComplete}
                        />
                    </div>
                )}

                {(currentStep.type === 'journal' || currentStep.type === 'checkin') && (
                    <div className="p-6">
                        <DailyMorningPracticeWidget
                            isDarkMode={isDarkMode}
                            onComplete={(data) => {
                                // Save data if needed (it does it mostly internally but we might want to capture it)
                                const today = new Date();
                                const todayDate = today.toISOString().split('T')[0];
                                const currentHistory = user.dailyMorningPractice || [];
                                // avoid dupes
                                const others = currentHistory.filter(d => d.date !== todayDate);
                                onUpdateUser({
                                    dailyMorningPractice: [...others, data]
                                });
                                handleStepComplete();
                            }}
                            onFinish={handleStepComplete}
                            existingPriming={null} // Or fetch from user if we want resume
                        />
                    </div>
                )}

                {currentStep.type === 'quote' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in min-h-[400px]">
                        <p className="text-2xl md:text-3xl font-serif italic mb-6 leading-relaxed">
                            "The only way to do great work is to love what you do."
                        </p>
                        <p className="text-sm opacity-60 tracking-widest uppercase">— Steve Jobs</p>

                        <button
                            onClick={handleStepComplete}
                            className={`mt-12 px-8 py-3 rounded-full transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-sage/10 hover:bg-sage/20'}`}
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Fallback for Fasting or other generic types */}
                {currentStep.type === 'fasting' && (
                    <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                        <p>Fasting Timer Step (Placeholder)</p>
                        <button onClick={handleStepComplete} className="mt-4 px-6 py-2 bg-sage text-white rounded-full">Next</button>
                    </div>
                )}

                {currentStep.type === 'focus' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in min-h-[500px]">
                        <div className="mb-12">
                            <h3 className={`text-4xl font-display font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {currentStep.title || 'Stay Focused'}
                            </h3>
                            <p className="text-xl opacity-60 max-w-sm mx-auto">
                                {currentStep.text}
                            </p>
                        </div>

                        {/* Focus Timer Component (Inline) */}
                        <FocusTimer
                            duration={currentStep.duration || 60}
                            onComplete={handleStepComplete}
                            isDarkMode={isDarkMode}
                        />

                        {currentStep.requiresInput && (
                            <div className="mt-8 w-full max-w-md animate-slide-up">
                                <textarea
                                    className={`w-full p-6 rounded-3xl border outline-none transition-all text-lg font-body ${isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-pale-gold/30'
                                        : 'bg-white border-sage/10 text-sage placeholder:text-sage/20 shadow-sm focus:border-sage/30'
                                        }`}
                                    placeholder="Write your sentence or answer here..."
                                    rows={3}
                                    autoFocus
                                />
                                <p className="mt-4 text-xs opacity-40 uppercase tracking-widest font-bold">
                                    Capture your thought while the timer runs
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Gratitude Step */}
                {currentStep.type === 'gratitude' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in min-h-[400px]">
                        <h3 className="text-2xl font-display mb-6">Gratitude Practice</h3>
                        <p className="text-lg mb-8 opacity-80">Take a moment to reflect on what you're grateful for today.</p>
                        <div className="max-w-md w-full space-y-4">
                            <textarea
                                placeholder="I'm grateful for..."
                                className={`w-full p-4 rounded-xl border outline-none resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-sage/20 text-warm-gray-green'
                                    }`}
                                rows={4}
                            />
                        </div>
                        <button
                            onClick={handleStepComplete}
                            className={`mt-8 px-8 py-3 rounded-full transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-sage/10 hover:bg-sage/20'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Affirmation Step */}
                {currentStep.type === 'affirmation' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in min-h-[400px]">
                        <h3 className="text-2xl font-display mb-6">Power Affirmations</h3>
                        <p className="text-3xl font-display italic mb-8 text-pale-gold">
                            "I am capable of achieving my goals."
                        </p>
                        <p className="text-lg mb-8 opacity-80">Repeat this affirmation and feel its power.</p>
                        <button
                            onClick={handleStepComplete}
                            className={`mt-8 px-8 py-3 rounded-full transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-sage/10 hover:bg-sage/20'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                )}

            </div>

        </div>
    );
};
