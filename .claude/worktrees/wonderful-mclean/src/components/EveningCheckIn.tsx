

import { useState, useEffect } from 'react';
import { ArrowRight, Moon, Star, CheckCircle } from 'lucide-react';
import type { JournalEntry, DailyFocus } from '../types';

interface EveningCheckInProps {
    isOpen: boolean;
    onClose: () => void;
    completedGoals: DailyFocus[];
    totalGoals: number;
    username: string;
    onSaveReflection: (entry: JournalEntry) => void;
}

type Step = 'intro' | 'recap' | 'wins' | 'challenges' | 'learnings' | 'closing';

export const EveningCheckIn: React.FC<EveningCheckInProps> = ({
    isOpen,
    onClose,
    completedGoals,
    username,
    onSaveReflection
}) => {
    const [step, setStep] = useState<Step>('intro');
    const [highlight, setHighlight] = useState(''); // Wins
    const [lowlight, setLowlight] = useState('');   // Challenges
    const [midpoint, setMidpoint] = useState('');   // Learnings
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Auto advance intro
            const t = setTimeout(() => setStep('recap'), 3500);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (step === 'recap') setStep('wins');
        else if (step === 'wins') setStep('challenges');
        else if (step === 'challenges') setStep('learnings');
        else if (step === 'learnings') {
            // Save data
            const today = new Date().toISOString().split('T')[0];
            const entry: JournalEntry = {
                id: today,
                date: today,
                highlight, // Win
                lowlight,  // Challenge
                midpoint,  // Learning
            };
            onSaveReflection(entry);
            setStep('closing');
        }
    };

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-start justify-center bg-[linear-gradient(180deg,transparent_0%,rgba(30,27,75,0.7)_12%,rgba(30,27,75,0.95)_100%)] backdrop-blur-2xl text-white overflow-y-auto overflow-x-hidden transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'} pt-safe`}>
            {/* Ambient Background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none fixed">
                <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-900 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 max-w-lg w-full px-8 text-center pt-[15vh] pb-12 min-h-screen flex flex-col justify-start">

                {/* Step 1: Intro */}
                {step === 'intro' && (
                    <div className="animate-fade-in-up">
                        <Moon size={48} className="text-purple-300 mx-auto mb-6 animate-pulse" />
                        <h2 className="text-xl font-light text-white/60 mb-2">The sun has set.</h2>
                        <h1 className="text-4xl font-display font-medium leading-relaxed">
                            Time to reflect,<br />
                            <span className="text-purple-300">{username}</span>.
                        </h1>
                    </div>
                )}

                {/* Step 2: Recap */}
                {step === 'recap' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-display font-medium mb-8">Today's Journey</h2>

                        <div className="bg-white/5 rounded-[2.5rem] p-10 mb-8 border border-white/5 backdrop-blur-2xl shadow-2xl">
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <span className="text-5xl font-display font-bold text-purple-300">{completedGoals.length}</span>
                                <div className="text-left leading-tight text-white/80">
                                    <div className="font-bold">Goals</div>
                                    <div className="text-sm">Completed</div>
                                </div>
                            </div>

                            <div className="space-y-3 text-left">
                                {completedGoals.length > 0 ? (
                                    completedGoals.map(goal => (
                                        <div key={goal.id} className="flex items-center gap-3 text-white/90">
                                            <CheckCircle size={18} className="text-sage shrink-0" />
                                            <span className="line-through opacity-70">{goal.text}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-white/60 text-center italic">A quiet day for goals, but a day lived nonetheless.</p>
                                )}
                            </div>
                        </div>

                        <button onClick={handleNext} className="btn-primary-purple group">
                            <span>Let's Reflect</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {/* Step 3: Wins */}
                {step === 'wins' && (
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <Star size={32} className="text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Highlight</h3>
                            <h2 className="text-2xl font-display font-medium">What went well today?</h2>
                        </div>
                        <textarea
                            value={highlight}
                            onChange={e => setHighlight(e.target.value)}
                            placeholder="A small win, a nice moment, a task completed..."
                            className="w-full bg-white/5 border-b border-white/10 text-lg text-center py-6 focus:outline-none focus:border-purple-300/50 placeholder-white/10 min-h-[120px] resize-none transition-all mb-8"
                            autoFocus
                        />
                        <button onClick={handleNext} className="btn-primary-purple">
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 4: Challenges */}
                {step === 'challenges' && (
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Challenge</h3>
                            <h2 className="text-2xl font-display font-medium">What got in the way?</h2>
                        </div>
                        <textarea
                            value={lowlight}
                            onChange={e => setLowlight(e.target.value)}
                            placeholder="Distractions, energy, unexpected events..."
                            className="w-full bg-white/5 border-b border-white/10 text-lg text-center py-6 focus:outline-none focus:border-red-300/50 placeholder-white/10 min-h-[120px] resize-none transition-all mb-8"
                            autoFocus
                        />
                        <button onClick={handleNext} className="btn-primary-purple">
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 5: Learnings */}
                {step === 'learnings' && (
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Growth</h3>
                            <h2 className="text-2xl font-display font-medium">One thing I learned...</h2>
                        </div>
                        <textarea
                            value={midpoint}
                            onChange={e => setMidpoint(e.target.value)}
                            placeholder="About myself, my work, or the world..."
                            className="w-full bg-white/5 border-b border-white/10 text-lg text-center py-6 focus:outline-none focus:border-blue-300/50 placeholder-white/10 min-h-[120px] resize-none transition-all mb-8"
                            autoFocus
                        />
                        <button onClick={handleNext} className="btn-primary-purple">
                            Complete Reflection
                        </button>
                    </div>
                )}

                {/* Step 6: Closing */}
                {step === 'closing' && (
                    <div className="animate-fade-in">
                        <h1 className="text-4xl font-display font-medium mb-6">Rest well, {username}.</h1>
                        <p className="text-white/60 mb-12">Your reflection has been saved. Tomorrow is a new beginning.</p>

                        <button onClick={handleClose} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md">
                            Good Night
                        </button>
                    </div>
                )}

            </div>

            <style>{`
                .btn-primary-purple {
                    @apply flex items-center justify-center gap-3 px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white rounded-full mx-auto transition-all shadow-lg font-medium;
                }
            `}</style>
        </div>
    );
};
