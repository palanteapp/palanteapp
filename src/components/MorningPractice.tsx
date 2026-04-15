import React, { useState, useEffect } from 'react';
import { DailyMorningPracticeWidget } from './DailyMorningPracticeWidget';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import type { UserProfile, DailyMorningPractice } from '../types';
import { logPractice, migrateStreakToPractice } from '../utils/practiceUtils';
import { useTheme } from '../contexts/ThemeContext';

interface MorningPracticeProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
}

export const MorningPractice: React.FC<MorningPracticeProps> = ({
    isOpen,
    onClose,
    user,
    onUpdateUser
}) => {
    const { isDarkMode } = useTheme();
    const [isExiting, setIsExiting] = useState(false);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            Promise.resolve().then(() => setIsExiting(false));
        }
    }, [isOpen]);

    // handleClose removed as close button was removed

    const handleMorningPracticeComplete = (data: DailyMorningPractice) => {
        // Find if we already have an entry for today (to preserve/update)
        const today = new Date();
        const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const existingEntries = user.dailyMorningPractice || [];
        const otherEntries = existingEntries.filter(p => p.date !== todayDate);

        // Update practice count as well
        const currentPracticeData = user.practiceData || migrateStreakToPractice(user);
        const updatedPracticeData = logPractice(currentPracticeData, 'morning_practice');

        // Update user profile
        onUpdateUser({
            dailyMorningPractice: [...otherEntries, data],
            practiceData: updatedPracticeData
        });

        haptics.success();
        triggerConfetti();

        // Auto-close after 45 seconds of enjoying the summary
        setTimeout(() => {
            if (isOpen) {
                setIsExiting(true);
                setTimeout(onClose, 500);
            }
        }, 45000);
    };

    const handleRefresh = () => {
        if (!user) return;
        const today = new Date();
        const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const existing = (user.dailyMorningPractice || []).find(p => p.date === todayDate);
        const otherEntries = (user.dailyMorningPractice || []).filter(p => p.date !== todayDate);

        if (existing) {
            // Re-add with wiped details but preserved intention
            onUpdateUser({
                dailyMorningPractice: [...otherEntries, {
                    ...existing,
                    gratitudes: [],
                    affirmations: [],
                    dailyIntention: existing.dailyIntention || ''
                }]
            });
        }
        haptics.light();
    };

    if (!isOpen && !isExiting) return null;

    const bgClass = isDarkMode ? 'bg-sage-mid/95 backdrop-blur-xl' : 'bg-cream/95 backdrop-blur-xl';

    // Get today's existing priming if any
    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todaysPractice = (user.dailyMorningPractice || []).find(p => p.date === todayDate);

    return (
        <div className={`fixed inset-0 z-[60] flex flex-col pb-[env(safe-area-inset-bottom)] transition-all duration-500 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${bgClass}`}>

            {/* Safe Area Top Spacer */}
            <div className="w-full h-[env(safe-area-inset-top)] bg-transparent" />

            {/* Close Button */}
            {/* Close Button Removed as per user request */}
            {/* <button
                onClick={handleClose}
                className={`absolute top-[max(1.5rem,env(safe-area-inset-top)+1rem)] right-6 p-3 rounded-full z-50 transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
            >
                <X size={24} />
            </button> */}

            {/* Content Area - Centered DailyPrimingWidget */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-lg">
                    <DailyMorningPracticeWidget
                        userName={user.name.split(' ')[0]}
                        onComplete={handleMorningPracticeComplete}
                        onRefresh={handleRefresh}
                        isDarkMode={isDarkMode}
                        existingPriming={todaysPractice || null}
                        onFinish={() => {
                            setIsExiting(true);
                            setTimeout(onClose, 500);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
