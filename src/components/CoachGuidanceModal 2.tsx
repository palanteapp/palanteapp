

import React from 'react';
import { SlideUpModal } from './SlideUpModal';
import type { UserProfile } from '../types';
import { Target, Zap, Settings, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface CoachGuidanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    isDarkMode: boolean;
    onAdjustGoals: () => void;
    onUpdateSettings: () => void;
}

export const CoachGuidanceModal: React.FC<CoachGuidanceModalProps> = ({
    isOpen,
    onClose,
    user,
    isDarkMode,
    onAdjustGoals,
    onUpdateSettings
}) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');

    const dailyFocuses = user.dailyFocuses || [];
    const completedCount = dailyFocuses.filter(f => f.isCompleted).length;
    const remainingCount = dailyFocuses.length - completedCount;
    const progress = dailyFocuses.length > 0 ? (completedCount / dailyFocuses.length) * 100 : 0;

    const getWellnessMessage = (energy: number) => {
        if (energy >= 4) return "Your energy is high! Great time to tackle the hard stuff.";
        if (energy === 3) return "You're steady. Keep this rhythm going.";
        return "Energy is a bit low. Be kind to yourself and focus on one thing.";
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const bgCard = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode} title="Coach Check-In">
            <div className="pb-8 px-5 pt-8">
                {/* Header Section - More Compact */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-2.5 rounded-full mb-3 bg-pale-gold/20 text-pale-gold">
                        <Sparkles size={22} />
                    </div>
                    <h2 className={`text-xl font-display font-medium mb-1.5 ${textPrimary}`}>
                        {greeting}, {user.name.split(' ')[0]}.
                    </h2>
                    <p className={`text-xs max-w-xs mx-auto ${textSecondary} leading-relaxed`}>
                        Let's align your spirit and your work.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Accountability Section */}
                    <div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] px-1 mb-2 ${textSecondary}`}>Accountability</h3>
                        <div className={`p-4 rounded-2xl border ${bgCard}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full flex-shrink-0 ${progress === 100 ? 'bg-green-500/20 text-green-500' : 'bg-pale-gold/20 text-pale-gold'}`}>
                                    {progress === 100 ? <CheckCircle2 size={18} /> : <Target size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium ${textPrimary} truncate`}>
                                        {dailyFocuses.length === 0
                                            ? "No goals set yet."
                                            : progress === 100
                                                ? "All goals complete!"
                                                : `${remainingCount} goal${remainingCount !== 1 ? 's' : ''} remaining.`}
                                    </h4>
                                    {dailyFocuses.length > 0 && progress < 100 && (
                                        <div className="mt-2 w-full h-1 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-pale-gold transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wellness Section */}
                    <div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] px-1 mb-2 ${textSecondary}`}>Wellness & Spirit</h3>
                        <div className={`p-4 rounded-2xl border ${bgCard}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full flex-shrink-0 bg-purple-500/20 text-purple-400`}>
                                    <Zap size={18} />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-medium ${textPrimary}`}>
                                        Energy: {user.currentEnergy ? user.currentEnergy + '/5' : 'Unknown'}
                                    </h4>
                                    <p className={`text-[11px] ${textSecondary} leading-normal`}>
                                        {user.currentEnergy ? getWellnessMessage(user.currentEnergy) : "How are you feeling?"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions - More Integrated */}
                    <div className="pt-2 grid grid-cols-2 gap-3">
                        <button
                            onClick={onAdjustGoals}
                            className={`py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isDarkMode
                                ? 'bg-white/5 border border-white/10 text-white'
                                : 'bg-sage/5 border border-sage/10 text-sage'}`}
                        >
                            <Target size={14} />
                            <span>Goals</span>
                        </button>
                        <button
                            onClick={onUpdateSettings}
                            className={`py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isDarkMode
                                ? 'bg-white/5 border border-white/10 text-white'
                                : 'bg-sage/5 border border-sage/10 text-sage'}`}
                        >
                            <Settings size={14} />
                            <span>Coach</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${isDarkMode
                            ? 'bg-pale-gold text-warm-gray-green shadow-pale-gold/10'
                            : 'bg-sage text-white shadow-sage/20'}`}
                    >
                        <span>I'm Ready</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </SlideUpModal>
    );
};
