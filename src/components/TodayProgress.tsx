import React from 'react';
import { Check, Circle } from 'lucide-react';

interface TodayProgressProps {
    morningComplete: boolean;
    practiceComplete: boolean;
    goalsComplete: boolean;
    isDarkMode?: boolean;
}

export const TodayProgress: React.FC<TodayProgressProps> = ({
    morningComplete,
    practiceComplete,
    goalsComplete,
    isDarkMode = true
}) => {
    const items = [
        { label: 'Morning Practice', complete: morningComplete },
        { label: 'Practice Session', complete: practiceComplete },
        { label: 'Daily Goals', complete: goalsComplete }
    ];

    const completedCount = items.filter(i => i.complete).length;
    const progress = (completedCount / items.length) * 100;

    return (
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/70' : 'text-sage/70'}`}>
                    Today's Progress
                </h3>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    {completedCount}/{items.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div className={`h-1.5 rounded-full mb-3 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Checklist */}
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        {item.complete ? (
                            <Check size={14} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        ) : (
                            <Circle size={14} className={isDarkMode ? 'text-white/20' : 'text-sage/20'} />
                        )}
                        <span className={`text-xs ${item.complete
                            ? (isDarkMode ? 'text-white/80' : 'text-sage/80')
                            : (isDarkMode ? 'text-white/40' : 'text-sage/40')
                            }`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
