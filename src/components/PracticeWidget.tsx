import React from 'react';
import { Sparkles, Award, TrendingUp } from 'lucide-react';
import type { PracticeData } from '../utils/practiceUtils';
import { getNextMilestone } from '../utils/practiceUtils';

interface PracticeWidgetProps {
    practiceData: PracticeData;
    onClick?: () => void;
    isDarkMode?: boolean;
}

export const PracticeWidget: React.FC<PracticeWidgetProps> = ({
    practiceData,
    onClick,
    isDarkMode = true
}) => {
    const { totalPractices } = practiceData;
    const nextMilestone = getNextMilestone(totalPractices);
    const hasPractices = totalPractices > 0;

    // Determine color scheme
    const getColorClasses = () => {
        if (hasPractices) {
            return {
                bg: isDarkMode
                    ? 'bg-gradient-to-br from-pale-gold/20 to-amber-500/20'
                    : 'bg-gradient-to-br from-sage/20 to-emerald-500/20',
                border: isDarkMode ? 'border-pale-gold/40' : 'border-sage/40',
                text: isDarkMode ? 'text-pale-gold' : 'text-sage',
                glow: isDarkMode
                    ? 'shadow-[0_0_20px_rgba(229,214,167,0.4)]'
                    : 'shadow-[0_0_20px_rgba(134,171,142,0.4)]'
            };
        }
        return {
            bg: isDarkMode ? 'bg-warm-gray-green/10' : 'bg-white/40',
            border: isDarkMode ? 'border-white/10' : 'border-sage/20',
            text: isDarkMode ? 'text-white/40' : 'text-sage/40',
            glow: ''
        };
    };

    const colors = getColorClasses();

    return (
        <button
            onClick={onClick}
            className={`
                relative w-full p-6 rounded-3xl border-2 
                ${colors.bg} ${colors.border} ${colors.glow}
                transition-all duration-500 hover:scale-[1.02] active:scale-95
                overflow-hidden group
            `}
        >
            {/* Animated background pulse for active practices */}
            {hasPractices && (
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-pale-gold/10' : 'bg-gradient-to-br from-sage/10'} to-transparent animate-pulse opacity-50`} />
            )}

            <div className="relative z-10 flex items-center justify-between">
                {/* Left side: Total practices count */}
                <div className="flex items-center gap-4">
                    <div className={`
                        p-4 rounded-2xl bg-black/20 
                        ${hasPractices ? 'animate-glow' : ''}
                    `}>
                        <Sparkles
                            size={32}
                            className={`${colors.text} ${hasPractices ? 'drop-shadow-[0_0_8px_rgba(229,214,167,0.6)]' : ''}`}
                            fill={hasPractices ? 'currentColor' : 'none'}
                        />
                    </div>

                    <div className="text-left">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-display font-bold ${colors.text}`}>
                                {totalPractices}
                            </span>
                            <span className={`${isDarkMode ? 'text-white/60' : 'text-sage/60'} text-sm font-medium`}>
                                {totalPractices === 1 ? 'practice' : 'practices'}
                            </span>
                        </div>
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-sage/60'} text-sm mt-1`}>
                            {hasPractices ? (
                                'Total completed'
                            ) : (
                                'Start your journey today'
                            )}
                        </p>
                    </div>
                </div>

                {/* Right side: Stats */}
                <div className="flex flex-col items-end gap-2">
                    {/* Next milestone indicator */}
                    {nextMilestone && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20">
                            <TrendingUp size={14} className={colors.text} />
                            <span className={`text-xs font-medium ${colors.text}`}>
                                {nextMilestone.remaining} to {nextMilestone.name}
                            </span>
                        </div>
                    )}

                    {/* Milestone badge if reached major milestone */}
                    {totalPractices >= 365 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20">
                            <Award size={14} className={colors.text} />
                            <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-sage/60'} font-medium`}>
                                Legend Status
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tap hint */}
            <div className={`absolute bottom-2 right-2 text-[10px] ${isDarkMode ? 'text-white/30' : 'text-sage/30'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Tap for details
            </div>
        </button>
    );
};

// Add glow animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes glow {
        0%, 100% {
            filter: brightness(1);
        }
        50% {
            filter: brightness(1.2);
        }
    }
    .animate-glow {
        animation: glow 3s ease-in-out infinite;
    }
`;
document.head.appendChild(style);
