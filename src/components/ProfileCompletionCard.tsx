import React, { useState, useEffect } from 'react';
import { Briefcase, Heart, Target, Calendar, ChevronRight, X } from 'lucide-react';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface ProfileCompletionCardProps {
    user: {
        profession?: string;
        interests?: string[];
        career?: string; // "Focus Goals" from Profile.tsx are stored here
        age?: number;
        contentTypePreference?: string;
    };
    isDarkMode: boolean;
    onOpenProfile: () => void;
}

const STORAGE_KEY = STORAGE_KEYS.PROFILE_CARD_DISMISSED;
const DISMISS_COUNT_KEY = STORAGE_KEYS.PROFILE_CARD_DISMISS_COUNT;

const calculateCompletion = (user: ProfileCompletionCardProps['user']): number => {
    let score = 0;

    // Profession (20%)
    if (user.profession && user.profession.trim() !== '') score += 20;

    // Interests (20%)
    if (user.interests && user.interests.length > 0) score += 20;

    // Focus Goals (20%) - Mapped to 'career'
    if (user.career && user.career.trim() !== '') score += 20;

    // Age (20%)
    if (user.age !== undefined && user.age !== null) score += 20;

    // Content Preference (20%)
    if (user.contentTypePreference) score += 20;

    return Math.min(score, 100);
};

// Get missing fields
const getMissingFields = (user: ProfileCompletionCardProps['user']): { key: string; label: string; icon: React.ElementType }[] => {
    const missing: { key: string; label: string; icon: React.ElementType }[] = [];

    if (user.age === undefined || user.age === null) {
        missing.push({ key: 'age', label: 'Your age', icon: Calendar });
    }
    if (!user.profession || user.profession.trim() === '') {
        missing.push({ key: 'profession', label: 'Your profession', icon: Briefcase });
    }
    if (!user.career || user.career.trim() === '') {
        missing.push({ key: 'career', label: 'Focus goals', icon: Target });
    }
    if (!user.interests || user.interests.length === 0) {
        missing.push({ key: 'interests', label: 'Your interests', icon: Heart });
    }

    return missing;
};

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
    user,
    isDarkMode,
    onOpenProfile
}) => {
    const [isDismissed, setIsDismissed] = useState(false);

    const completion = calculateCompletion(user);
    const missingFields = getMissingFields(user);

    // Check if card should be shown
    useEffect(() => {
        const dismissData = localStorage.getItem(STORAGE_KEY);
        const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10);

        // Permanently hidden after 3 dismissals or 90%+ complete
        if (dismissCount >= 3 || completion >= 90) {
            setTimeout(() => setIsDismissed(true), 0);
            return;
        }

        if (dismissData) {
            const dismissedAt = new Date(dismissData);
            const now = new Date();
            const daysSinceDismiss = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);

            // Reappear after 7 days if still <80%
            if (daysSinceDismiss < 7 || completion >= 80) {
                setTimeout(() => setIsDismissed(true), 0);
            } else {
                setTimeout(() => setIsDismissed(false), 0);
            }
        }
    }, [completion]);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        const currentCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10);
        localStorage.setItem(DISMISS_COUNT_KEY, String(currentCount + 1));
        setIsDismissed(true);
    };

    // Don't render if dismissed or complete
    if (isDismissed || completion >= 90 || missingFields.length === 0) {
        return null;
    }

    const circumference = 2 * Math.PI * 18;
    const strokeDashoffset = circumference - (completion / 100) * circumference;

    return (
        <div className={`relative rounded-2xl p-4 mb-6 border backdrop-blur-sm shadow-lg transition-all ${isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white/60 border-sage/20'
            }`}>
            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${isDarkMode
                    ? 'hover:bg-white/10 text-white/40 hover:text-white/70'
                    : 'hover:bg-sage/10 text-sage/40 hover:text-sage/70'
                    }`}
            >
                <X size={14} />
            </button>

            <div className="flex items-start gap-4">
                {/* Progress Ring */}
                <div className="relative flex-shrink-0">
                    <svg width="48" height="48" className="-rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="24"
                            cy="24"
                            r="18"
                            fill="none"
                            stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(127,148,133,0.1)'}
                            strokeWidth="4"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="24"
                            cy="24"
                            r="18"
                            fill="none"
                            stroke={isDarkMode ? '#E5D6A7' : '#7F9485'}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'
                        }`}>
                        {completion}%
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-sage-dark'
                        }`}>
                        Personalize Your Experience
                    </h4>
                    <p className={`text-xs mb-2 ${isDarkMode ? 'text-white/50' : 'text-sage-dark/50'
                        }`}>
                        Complete your profile for better quotes & insights
                    </p>

                    {/* Missing Fields Preview */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {missingFields.slice(0, 3).map((field) => (
                            <span
                                key={field.key}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${isDarkMode
                                    ? 'bg-white/10 text-white/70'
                                    : 'bg-sage/10 text-sage/70'
                                    }`}
                            >
                                <field.icon size={10} />
                                {field.label}
                            </span>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={onOpenProfile}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-pale-gold/20 text-pale-gold hover:bg-pale-gold/30'
                            : 'bg-sage/20 text-sage hover:bg-sage/30'
                            }`}
                    >
                        Complete Profile
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
