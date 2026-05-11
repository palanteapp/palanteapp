
import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Wind, Zap, Sun, Moon, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import type { SmartSuggestion } from '../hooks/useSmartSuggestions';
import { haptics } from '../utils/haptics';

interface SmartSuggestionCardProps {
    suggestion: SmartSuggestion | null;
    onDismiss: () => void;
    onAction: (toolId: string) => void;
    isDarkMode: boolean;
    onEnergyUpdate: (level: 1 | 2 | 3 | 4 | 5) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    breath: Wind,
    focus: Zap,
    priming: Sun,
    reflect: Moon,
};

const getIcon = (type: string): React.ComponentType<{ size?: number }> => ICON_MAP[type] ?? Sparkles;

export const SmartSuggestionCard: React.FC<SmartSuggestionCardProps> = ({
    suggestion,
    onDismiss,
    onAction,
    isDarkMode,
    onEnergyUpdate
}) => {
    const [isDismissing, setIsDismissing] = useState(false);
    // Local state to handle transition from check-in to suggestion
    const [_justCheckedIn, setJustCheckedIn] = useState(false);

    const iconType = suggestion?.type ?? '';

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.light();
        setIsDismissing(true);
        setTimeout(onDismiss, 300);
    };

    // If we have a suggestion, render the suggestion card
    if (suggestion) {
        if (isDismissing) return null; // Or render nothing if fully dismissed

        return (
            <div
                className={`w-full relative overflow-hidden rounded-2xl border transition-all duration-500 animate-in slide-in-from-top-4 fade-in ${isDarkMode
                    ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20'
                    : 'bg-gradient-to-br from-white/80 to-white/40 border-sage/10 hover:border-sage/20 shadow-sm'
                    }`}
            >
                {/* Decorative Background Blur */}
                <div
                    className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'
                        }`}
                />

                <div className="p-5 flex items-start gap-4">
                    {/* Icon Container */}
                    <div className={`p-3 rounded-full shrink-0 ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'
                        }`}>
                        {React.createElement(getIcon(iconType), { size: 20 })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                        <h3 className={`font-display font-medium text-lg leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-sage'
                            }`}>
                            {suggestion.title}
                        </h3>
                        <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-white/70' : 'text-sage/70'
                            }`}>
                            {suggestion.description}
                        </p>

                        {/* Action Button */}
                        <button
                            onClick={() => {
                                haptics.medium();
                                onAction(suggestion.toolId);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${isDarkMode
                                ? 'bg-pale-gold text-sage-dark hover:bg-white hover:scale-105 active:scale-95'
                                : 'bg-terracotta-500 text-white hover:bg-sage-600 hover:scale-105 active:scale-95'
                                }`}
                        >
                            {suggestion.actionLabel}
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* Dismiss Button */}
                    <button
                        onClick={handleDismiss}
                        className={`p-2 rounded-full -mt-2 -mr-2 transition-colors ${isDarkMode
                            ? 'text-white/20 hover:text-white hover:bg-white/10'
                            : 'text-sage/30 hover:text-sage hover:bg-sage/10'
                            }`}
                        aria-label="Dismiss suggestion"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Default State: Inline Energy Check-In (Asking the question)
    // Only show if NOT dismissing (meaning user hasn't reduced 'noise')
    // But we might want to respect 'isDismissing' even here if we want to hide it completely on X?
    // For now, let's say the Check-In is always there if no suggestion exists, unless global dismiss?
    // User requested "Ask: How's your energy level today?" imply it should be there.

    const energyLevels = [
        { level: 2 as const, icon: BatteryLow, label: 'Low', color: 'text-red-400' },
        { level: 3 as const, icon: BatteryMedium, label: 'Steady', color: 'text-yellow-400' },
        { level: 4 as const, icon: BatteryFull, label: 'High', color: 'text-green-400' },
        { level: 5 as const, icon: Zap, label: 'Peak', color: 'text-purple-400' },
    ];

    return (
        <div className={`w-full p-5 rounded-2xl border transition-all animate-fade-in ${isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white/60 border-sage/20 shadow-sm'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-sage/80'}`}>
                    How's your energy level today?
                </h3>
            </div>

            <div className="flex justify-between gap-2">
                {energyLevels.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                        <button
                            key={option.level}
                            onClick={() => {
                                haptics.selection();
                                setJustCheckedIn(true);
                                onEnergyUpdate(option.level);
                            }}
                            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${isDarkMode
                                ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                : 'bg-white/40 hover:bg-white/60 text-sage/60 hover:text-sage'
                                }`}
                        >
                            <OptionIcon size={20} className={isDarkMode ? '' : ''} />
                            <span className="text-[10px] font-medium uppercase tracking-wide">
                                {option.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
