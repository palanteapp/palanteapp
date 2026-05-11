import React from 'react';
import { Flame, Trophy, Award, PartyPopper, Lock } from 'lucide-react';
import { MILESTONES } from '../data/milestones';
import { haptics } from '../utils/haptics';

interface AchievementGalleryProps {
    unlockedBadges: string[];
    totalPractices: number;
    isDarkMode: boolean;
}

const iconMap: Record<string, React.FC<{ size: number; className?: string }>> = {
    'Flame': Flame,
    'Trophy': Trophy,
    'Award': Award,
    'PartyPopper': PartyPopper,
};

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({
    unlockedBadges,
    totalPractices,
    isDarkMode
}) => {
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage/60';

    return (
        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                    Achievements
                </h4>
                <span className={`text-xs ${textSecondary}`}>
                    {unlockedBadges.length}/{MILESTONES.length} unlocked
                </span>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-4 gap-3">
                {MILESTONES.map((milestone) => {
                    const isUnlocked = unlockedBadges.includes(milestone.badge);
                    const IconComponent = iconMap[milestone.icon] || Award;
                    const progress = Math.min(100, Math.round((totalPractices / milestone.day) * 100));

                    return (
                        <div
                            key={milestone.badge}
                            className="relative group"
                            onClick={() => isUnlocked && haptics.light()}
                        >
                            {/* Badge Circle */}
                            <div
                                className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${isUnlocked
                                        ? isDarkMode
                                            ? 'bg-gradient-to-br from-amber/30 to-amber-500/20 border-2 border-pale-gold/50'
                                            : 'bg-gradient-to-br from-sage/30 to-sage/10 border-2 border-sage/50'
                                        : isDarkMode
                                            ? 'bg-white/5 border border-white/10'
                                            : 'bg-sage/5 border border-sage/10'
                                    } ${isUnlocked ? 'hover:scale-105 cursor-pointer' : ''}`}
                            >
                                {isUnlocked ? (
                                    <IconComponent
                                        size={24}
                                        className={isDarkMode ? 'text-pale-gold' : 'text-sage'}
                                    />
                                ) : (
                                    <Lock
                                        size={18}
                                        className={isDarkMode ? 'text-white/20' : 'text-sage/20'}
                                    />
                                )}
                            </div>

                            {/* Progress ring for locked */}
                            {!isUnlocked && progress > 0 && (
                                <svg
                                    className="absolute inset-0 w-full h-full -rotate-90"
                                    viewBox="0 0 100 100"
                                >
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke={isDarkMode ? 'rgba(111,123,109,0.3)' : 'rgba(111,123,109,0.2)'}
                                        strokeWidth="4"
                                        strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}

                            {/* Label */}
                            <p className={`text-center text-[10px] mt-2 font-medium leading-tight ${isUnlocked
                                    ? isDarkMode ? 'text-white' : 'text-sage'
                                    : isDarkMode ? 'text-white/30' : 'text-sage/30'
                                }`}>
                                {milestone.day}d
                            </p>

                            {/* Tooltip */}
                            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-32 ${isDarkMode ? 'bg-white text-black' : 'bg-sage text-white'
                                }`}>
                                <p className="text-xs font-bold mb-1">{milestone.title}</p>
                                <p className="text-[10px] opacity-70">
                                    {isUnlocked ? '🎉 Unlocked!' : `${progress}% complete`}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Encouragement Message */}
            {unlockedBadges.length === 0 && (
                <p className={`text-center text-xs mt-4 ${textSecondary}`}>
                    Complete your first 7 practices to earn a badge!
                </p>
            )}
        </div>
    );
};
