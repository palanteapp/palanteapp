

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

    const textPrimary = 'text-white';
    const textSecondary = 'text-white/60';
    const bgCard = 'bg-white/[0.06] border-white/10';

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onClose}
            isDarkMode={true}
            title="Morning Alignment"
        >
            <div className="pb-8 px-6 pt-10">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 bg-white/[0.12] text-white">
                        <Sparkles size={24} />
                    </div>
                    <h2 className={`text-2xl font-display font-bold mb-1.5 ${textPrimary}`}>
                        {greeting}, {user.name.split(' ')[0]}.
                    </h2>
                    <p className={`text-[13px] max-w-xs mx-auto ${textSecondary} leading-relaxed font-semibold`}>
                        Let's align your spirit and your work.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Accountability Section */}
                    <div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] px-1 mb-2 ${textSecondary}`}>Accountability</h3>
                        <div className={`p-4 rounded-2xl border ${bgCard}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full flex-shrink-0 ${progress === 100 ? 'bg-[#C96A3A] text-white' : 'bg-white/[0.12] text-white'}`}>
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
                                        <div className="mt-2.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#E5D6A7] transition-all duration-500 ease-out"
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
                                <div className="p-2 rounded-full flex-shrink-0 bg-white/[0.12] text-white">
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

                    {/* Actions */}
                    <div className="pt-2 grid grid-cols-2 gap-3">
                        <button
                            onClick={onAdjustGoals}
                            className="py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white/[0.08] border border-white/10 text-white/70 transition-all active:scale-[0.98]"
                        >
                            <Target size={14} />
                            <span>Goals</span>
                        </button>
                        <button
                            onClick={onUpdateSettings}
                            className="py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white/[0.08] border border-white/10 text-white/70 transition-all active:scale-[0.98]"
                        >
                            <Settings size={14} />
                            <span>Coach</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-[#C96A3A] text-white shadow-lg shadow-black/20"
                    >
                        <span>I'm Ready</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </SlideUpModal>
    );
};
