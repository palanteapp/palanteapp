import React from 'react';
import { Flame, Award, TrendingUp } from 'lucide-react';
import type { StreakData } from '../types';
import { motion } from 'framer-motion';


interface StreakWidgetProps {
    streakData: StreakData;
    onClick?: () => void;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ streakData, onClick }) => {
    const { currentStreak, longestStreak, isGracePeriod } = streakData;
    const hasActiveStreak = currentStreak > 0;

    // Determine color scheme
    const getColorClasses = () => {
        if (isGracePeriod) {
            return {
                bg: 'bg-gradient-to-br from-orange-500/20 to-red-500/20',
                border: 'border-orange-500/40',
                text: 'text-orange-400',
                glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]'
            };
        }
        if (hasActiveStreak) {
            return {
                bg: 'bg-gradient-to-br from-amber/20 to-amber-500/20',
                border: 'border-pale-gold/40',
                text: 'text-pale-gold',
                glow: 'shadow-[0_0_20px_rgba(229,214,167,0.4)]'
            };
        }
        return {
            bg: 'bg-warm-gray-green/10',
            border: 'border-white/10',
            text: 'text-white/40',
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
            {/* Animated background pulse for active streaks */}
            {hasActiveStreak && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber/10 to-transparent animate-pulse opacity-50" />
            )}

            {/* Grace period warning pulse */}
            {isGracePeriod && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent animate-pulse" />
            )}

            <div className="relative z-10 flex items-center justify-between">
                {/* Left side: Streak count */}
                <div className="flex items-center gap-4">
                    <div className={`
                        p-4 rounded-2xl bg-[#3A1700]/20 
                        ${hasActiveStreak ? 'animate-bounce-subtle' : ''}
                    `}>
                        <Flame
                            size={32}
                            className={`${colors.text} ${hasActiveStreak ? 'drop-shadow-[0_0_8px_rgba(229,214,167,0.6)]' : ''}`}
                            fill={hasActiveStreak ? 'currentColor' : 'none'}
                        />
                    </div>

                    <div className="text-left">
                        <div className="flex items-baseline gap-2">
                            <motion.span
                                key={currentStreak}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className={`text-4xl font-display font-bold ${colors.text}`}
                            >
                                {currentStreak}
                            </motion.span>
                            <span className="text-white/60 text-sm font-medium">

                                {currentStreak === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                        <p className="text-white/60 text-sm mt-1">
                            {isGracePeriod ? (
                                <span className="text-orange-400 font-medium">⚠️ Grace period - Complete a practice today!</span>
                            ) : hasActiveStreak ? (
                                'Current streak'
                            ) : (
                                'Start your streak today'
                            )}
                        </p>
                    </div>
                </div>

                {/* Right side: Stats */}
                <div className="flex flex-col items-end gap-2">
                    {/* Longest streak */}
                    {longestStreak > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3A1700]/20">
                            <Award size={14} className="text-white/40" />
                            <span className="text-xs text-white/60 font-medium">
                                Best: {longestStreak}
                            </span>
                        </div>
                    )}

                    {/* Next milestone indicator */}
                    {hasActiveStreak && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3A1700]/20">
                            <TrendingUp size={14} className={colors.text} />
                            <span className={`text-xs font-medium ${colors.text}`}>
                                {getNextMilestoneText(currentStreak)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tap hint */}
            <div className="absolute bottom-2 right-2 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                Tap for details
            </div>
        </button>
    );
};

/**
 * Get text for next milestone
 */
const getNextMilestoneText = (currentStreak: number): string => {
    if (currentStreak < 7) {
        return `${7 - currentStreak} to Week Warrior`;
    }
    if (currentStreak < 30) {
        return `${30 - currentStreak} to Monthly Master`;
    }
    if (currentStreak < 100) {
        return `${100 - currentStreak} to Century Champion`;
    }
    if (currentStreak < 365) {
        return `${365 - currentStreak} to Year Legend`;
    }
    return 'Legend Status!';
};
