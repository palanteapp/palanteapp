import React from 'react';
import { Check, X } from 'lucide-react';
import type { DailyFocus } from '../types';

interface FocusItemProps {
    focus: DailyFocus;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    isDarkMode: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({
    focus,
    onToggle,
    onDelete,
    isDarkMode
}) => {
    const bgClass = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';
    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';

    return (
        <div
            className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 ${bgClass} ${focus.isCompleted ? 'opacity-60' : 'hover:scale-[1.02] hover:shadow-spa'}`}
        >
            <div className="flex items-center gap-4 flex-1 relative z-10">
                <button
                    onClick={() => onToggle(focus.id)}
                    className={`relative flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${focus.isCompleted
                        ? 'bg-sage border-sage text-white'
                        : isDarkMode ? 'border-white/30 hover:border-pale-gold' : 'border-sage/30 hover:border-sage'
                        }`}
                >
                    {focus.isCompleted && <Check size={16} strokeWidth={3} />}

                    {/* Ripple Effect Container */}
                    {focus.isCompleted && (
                        <span className="absolute inset-0 rounded-full bg-sage animate-ping opacity-20"></span>
                    )}
                </button>

                <div className="flex-1">
                    <span className={`text-lg font-medium transition-all duration-300 block mb-2 ${focus.isCompleted ? 'opacity-50' : textPrimary
                        }`}>
                        {focus.text}
                    </span>

                    {/* Progress Bar */}
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                            style={{ width: focus.isCompleted ? '100%' : '0%' }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={() => onDelete(focus.id)}
                className={`p-2 rounded-full transition-all relative z-10 ${focus.isCompleted
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                    } ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'}`}
            >
                <X size={18} />
            </button>
        </div>
    );
};
