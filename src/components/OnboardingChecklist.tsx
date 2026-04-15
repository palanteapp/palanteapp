import React, { useState } from 'react';
import { CheckCircle2, X, Target, Sunrise, Zap } from 'lucide-react';

interface OnboardingChecklistProps {
    completedMorning: boolean;
    hasGoals: boolean;
    hasSelectedVibe: boolean;
    hasTriedPractice: boolean;
    onDismiss: () => void;
    isDarkMode?: boolean;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
    completedMorning,
    hasGoals,
    hasSelectedVibe,
    hasTriedPractice,
    onDismiss,
    isDarkMode = true
}) => {
    const [isExpanded] = useState(true);

    const tasks = [
        { label: 'Complete Morning Practice', complete: completedMorning, icon: Sunrise },
        { label: 'Set a daily goal', complete: hasGoals, icon: Target },
        { label: 'Choose your vibe', complete: hasSelectedVibe, icon: Zap },
        { label: 'Try a practice', complete: hasTriedPractice, icon: CheckCircle2 }
    ];

    const completedCount = tasks.filter(t => t.complete).length;
    const allComplete = completedCount === tasks.length;

    if (allComplete) return null;

    return (
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-gradient-to-br from-amber/10 to-amber-500/10 border-pale-gold/30' : 'bg-gradient-to-br from-sage/10 to-sage/5 border-sage/30'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'}`}>
                        <CheckCircle2 size={16} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                            Getting Started
                        </h3>
                        <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                            {completedCount}/{tasks.length} complete
                        </p>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'}`}
                >
                    <X size={16} />
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-2 mt-3">
                    {tasks.map((task, idx) => {
                        const Icon = task.icon;
                        return (
                            <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${task.complete ? (isDarkMode ? 'bg-white/5' : 'bg-white/60') : ''}`}>
                                {task.complete ? (
                                    <CheckCircle2 size={14} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                ) : (
                                    <Icon size={14} className={isDarkMode ? 'text-white/30' : 'text-sage/30'} />
                                )}
                                <span className={`text-xs ${task.complete
                                    ? (isDarkMode ? 'text-white/80 line-through' : 'text-sage/80 line-through')
                                    : (isDarkMode ? 'text-white/60' : 'text-sage/60')
                                    }`}>
                                    {task.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
