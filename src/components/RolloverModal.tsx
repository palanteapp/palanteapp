import React, { useState } from 'react';
import { ArrowRight, RefreshCw, Calendar, Trash2 } from 'lucide-react';
import type { DailyFocus } from '../types';

interface RolloverModalProps {
    isOpen: boolean;
    staleGoals: DailyFocus[];
    onRollover: (selectedGoalIds: string[]) => void;
    onClearAll: () => void;
    isDarkMode: boolean;
}

export const RolloverModal: React.FC<RolloverModalProps> = ({
    isOpen,
    staleGoals,
    onRollover,
    onClearAll,
    isDarkMode
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(staleGoals.map(g => g.id)));

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleMainAction = () => {
        onRollover(Array.from(selectedIds));
    };

    const bgClass = isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-ivory border-sage/20';
    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-slide-up ${bgClass}`}>

                {/* Header */}
                <div className={`p-8 text-center border-b ${isDarkMode ? 'border-white/5' : 'border-sage/10'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                        <RefreshCw size={32} />
                    </div>
                    <h2 className={`text-2xl font-display font-medium mb-2 ${textPrimary}`}>
                        Morning Review
                    </h2>
                    <p className={`text-sm ${textSecondary}`}>
                        You have {staleGoals.length} unfinished goals from yesterday.
                        Move them to today?
                    </p>
                </div>

                {/* List */}
                <div className="p-6 max-h-[300px] overflow-y-auto space-y-3">
                    {staleGoals.map(goal => (
                        <div
                            key={goal.id}
                            onClick={() => toggleSelection(goal.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor -pointer ${selectedIds.has(goal.id)
                                ? isDarkMode ? 'bg-white/10 border-pale-gold/50' : 'bg-sage/10 border-sage/50'
                                : isDarkMode ? 'bg-white/5 border-transparent opacity-60' : 'bg-white/60 border-transparent opacity-60'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded -md border flex items-center justify-center transition-colors ${selectedIds.has(goal.id)
                                ? isDarkMode ? 'bg-pale-gold border-pale-gold text-warm-gray-green' : 'bg-sage border-sage text-white'
                                : 'border-current opacity-40'
                                }`}>
                                {selectedIds.has(goal.id) && <ArrowRight size={12} />}
                            </div>
                            <span className={`flex-1 font-medium ${selectedIds.has(goal.id) ? textPrimary : textSecondary}`}>
                                {goal.text}
                            </span>
                            <span className={`text-xs opacity-40 flex items-center gap-1 ${textSecondary}`}>
                                <Calendar size={10} />
                                {new Date(goal.createdAt).toLocaleDateString(undefined, { weekday: 'short' })}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer Buttons */}
                <div className={`p-6 border-t ${isDarkMode ? 'border-white/5' : 'border-sage/10'} space-y-3`}>
                    <button
                        onClick={handleMainAction}
                        disabled={selectedIds.size === 0}
                        className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${selectedIds.size > 0
                            ? isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:bg-pale-gold/90' : 'bg-sage text-white hover:bg-sage/90'
                            : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <RefreshCw size={18} />
                        <span>Move {selectedIds.size} to Today</span>
                    </button>

                    <button
                        onClick={onClearAll}
                        className={`w-full py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10' : 'text-warm-gray-green/40 hover:text-red-600 hover:bg-red-500/10'
                            }`}
                    >
                        <Trash2 size={16} />
                        <span>Clear All (Start Fresh)</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
