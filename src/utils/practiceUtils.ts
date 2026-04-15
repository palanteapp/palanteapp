/**
 * Practice Tracking Utilities
 *
 * Replaces streak-based tracking with total practice counting.
 * No pressure, no guilt - just celebration of progress.
 */

/** Get today's date in YYYY-MM-DD format */
export const getTodayDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/** Calculate the difference in days between two YYYY-MM-DD date strings */
export const getDaysDifference = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

/** Get display details for a streak milestone (legacy streak celebrations) */
export const getMilestoneDetails = (milestone: 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'century' | 'twohundred' | 'year') => {
    const milestones = {
        first: { title: 'First Step', icon: 'Sprout', message: "You've completed your very first practice! A journey of a thousand miles begins with a single step.", days: 1 },
        three: { title: 'Consistency Starter', icon: 'Sun', message: "Three practices completed! You're planting the seeds of habit.", days: 3 },
        week: { title: 'Week Warrior', icon: 'Flame', message: "You've completed 7 total practices! Your momentum is building beautifully.", days: 7 },
        fortnight: { title: 'Fortnight Flow', icon: 'Compass', message: "14 total practices. You've established a great rhythm!", days: 14 },
        month: { title: 'Monthly Master', icon: 'Trophy', message: "30 practices of dedication! You're building unstoppable habits!", days: 30 },
        fifty: { title: 'Half-Century Hero', icon: 'Star', message: "50 total practices! Your commitment to yourself is inspiring.", days: 50 },
        century: { title: 'Century Champion', icon: 'Award', message: "100 practices! You're in the top 1% of committed individuals!", days: 100 },
        twohundred: { title: 'Dedicated Soul', icon: 'Heart', message: "200 practices. This is no longer a habit, it's a lifestyle.", days: 200 },
        year: { title: 'Year Legend', icon: 'PartyPopper', message: '365 practices of excellence! You are a true master of consistency!', days: 365 },
    };
    return milestones[milestone];
};

import type { UserProfile } from '../types';

export interface PracticeData {
    totalPractices: number; // Total number of practices completed (all time)
    lastActivityDate: string; // ISO date (YYYY-MM-DD)
    milestones: {
        practices_1: boolean;      // 1 total practices
        practices_3: boolean;      // 3 total practices
        practices_7: boolean;      // 7 total practices
        practices_14: boolean;     // 14 total practices
        practices_30: boolean;     // 30 total practices
        practices_50: boolean;     // 50 total practices
        practices_100: boolean;    // 100 total practices
        practices_200: boolean;    // 200 total practices
        practices_365: boolean;    // 365 total practices
    };
    activityHistory: PracticeActivity[];
}

export interface PracticeActivity {
    date: string; // YYYY-MM-DD
    practices: string[]; // ['meditation', 'morning_practice', 'breathwork', 'reflection', 'goal']
}

/**
 * Initialize practice data for a new user
 */
export const initializePracticeData = (): PracticeData => ({
    totalPractices: 0,
    lastActivityDate: '',
    milestones: {
        practices_1: false,
        practices_3: false,
        practices_7: false,
        practices_14: false,
        practices_30: false,
        practices_50: false,
        practices_100: false,
        practices_200: false,
        practices_365: false,
    },
    activityHistory: []
});

/**
 * Log a practice activity
 * No consecutive day requirements - just count total practices
 */
export const logPractice = (
    currentData: PracticeData,
    practiceType: string
): PracticeData => {
    const today = new Date().toISOString().split('T')[0];

    // Find or create today's activity
    const existingActivityIndex = currentData.activityHistory.findIndex(
        a => a.date === today
    );

    const updatedHistory = [...currentData.activityHistory];

    if (existingActivityIndex >= 0) {
        // Update existing activity
        const existingActivity = updatedHistory[existingActivityIndex];
        if (!existingActivity.practices.includes(practiceType)) {
            updatedHistory[existingActivityIndex] = {
                ...existingActivity,
                practices: [...existingActivity.practices, practiceType]
            };
        }
    } else {
        // Create new activity
        updatedHistory.push({
            date: today,
            practices: [practiceType]
        });
    }

    // Calculate total practices (count unique practice types per day)
    const totalPractices = updatedHistory.reduce((sum, activity) => {
        return sum + activity.practices.length;
    }, 0);

    return {
        ...currentData,
        totalPractices,
        lastActivityDate: today,
        activityHistory: updatedHistory
    };
};

/**
 * Check if a new milestone has been reached
 */
export const checkMilestone = (
    totalPractices: number,
    currentMilestones: PracticeData['milestones']
): { milestone: 'practices_1' | 'practices_3' | 'practices_7' | 'practices_14' | 'practices_30' | 'practices_50' | 'practices_100' | 'practices_200' | 'practices_365' | null; isNew: boolean } => {
    // Check milestones in order
    if (totalPractices >= 365 && !currentMilestones.practices_365) {
        return { milestone: 'practices_365', isNew: true };
    }
    if (totalPractices >= 200 && !currentMilestones.practices_200) {
        return { milestone: 'practices_200', isNew: true };
    }
    if (totalPractices >= 100 && !currentMilestones.practices_100) {
        return { milestone: 'practices_100', isNew: true };
    }
    if (totalPractices >= 50 && !currentMilestones.practices_50) {
        return { milestone: 'practices_50', isNew: true };
    }
    if (totalPractices >= 30 && !currentMilestones.practices_30) {
        return { milestone: 'practices_30', isNew: true };
    }
    if (totalPractices >= 14 && !currentMilestones.practices_14) {
        return { milestone: 'practices_14', isNew: true };
    }
    if (totalPractices >= 7 && !currentMilestones.practices_7) {
        return { milestone: 'practices_7', isNew: true };
    }
    if (totalPractices >= 3 && !currentMilestones.practices_3) {
        return { milestone: 'practices_3', isNew: true };
    }
    if (totalPractices >= 1 && !currentMilestones.practices_1) {
        return { milestone: 'practices_1', isNew: true };
    }

    return { milestone: null, isNew: false };
};

/**
 * Get next milestone info for display
 */
export const getNextMilestone = (totalPractices: number): { target: number; name: string; remaining: number } | null => {
    if (totalPractices < 1) {
        return { target: 1, name: '1st Practice', remaining: 1 - totalPractices };
    }
    if (totalPractices < 3) {
        return { target: 3, name: '3 Practices', remaining: 3 - totalPractices };
    }
    if (totalPractices < 7) {
        return { target: 7, name: '7 Practices', remaining: 7 - totalPractices };
    }
    if (totalPractices < 14) {
        return { target: 14, name: '14 Practices', remaining: 14 - totalPractices };
    }
    if (totalPractices < 30) {
        return { target: 30, name: '30 Practices', remaining: 30 - totalPractices };
    }
    if (totalPractices < 50) {
        return { target: 50, name: '50 Practices', remaining: 50 - totalPractices };
    }
    if (totalPractices < 100) {
        return { target: 100, name: '100 Practices', remaining: 100 - totalPractices };
    }
    if (totalPractices < 200) {
        return { target: 200, name: '200 Practices', remaining: 200 - totalPractices };
    }
    if (totalPractices < 365) {
        return { target: 365, name: '365 Practices', remaining: 365 - totalPractices };
    }
    return null; // No more milestones
};

/**
 * Migrate old streak data to new practice data
 * For backward compatibility
 */
export const migrateStreakToPractice = (user: UserProfile): PracticeData => {
    // If user already has practice data, return it
    if ((user as Record<string, unknown>).practiceData) {
        return (user as Record<string, unknown>).practiceData as PracticeData;
    }

    // Otherwise, migrate from old streak data
    const streakData = user.streakData;
    if (!streakData) {
        return initializePracticeData();
    }

    // Convert activity history
    const activityHistory: PracticeActivity[] = streakData.activityHistory.map(activity => ({
        date: activity.date,
        practices: activity.practices
    }));

    // Calculate total practices from history
    const totalPractices = activityHistory.reduce((sum, activity) => {
        return sum + activity.practices.length;
    }, 0);

    // Migrate milestones (map old streak milestones to practice milestones)
    const milestones = {
        practices_1: totalPractices >= 1,
        practices_3: totalPractices >= 3,
        practices_7: totalPractices >= 7,
        practices_14: totalPractices >= 14,
        practices_30: totalPractices >= 30,
        practices_50: totalPractices >= 50,
        practices_100: totalPractices >= 100,
        practices_200: totalPractices >= 200,
        practices_365: totalPractices >= 365,
    };

    return {
        totalPractices,
        lastActivityDate: streakData.lastActivityDate,
        milestones,
        activityHistory
    };
};

/**
 * Get practices completed this week
 */
export const getWeeklyPracticeCount = (practiceData: PracticeData): number => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    return practiceData.activityHistory
        .filter(activity => activity.date >= weekAgoStr)
        .reduce((sum, activity) => sum + activity.practices.length, 0);
};

/**
 * Get practices completed this month
 */
export const getMonthlyPracticeCount = (practiceData: PracticeData): number => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    return practiceData.activityHistory
        .filter(activity => activity.date >= monthAgoStr)
        .reduce((sum, activity) => sum + activity.practices.length, 0);
};

/**
 * NEW: Analyze user behavior patterns for deep AI Context
 * Detects trends in reflections, energy, and engagement.
 */
export const analyzeBehaviorPatterns = (user: UserProfile) => {
    const patterns: string[] = [];

    // 1. Analyze Energy Trends by Day of Week
    const energyByDay: Record<number, number[]> = {};
    user.energyHistory?.forEach(entry => {
        const day = new Date(entry.timestamp).getDay();
        if (!energyByDay[day]) energyByDay[day] = [];
        energyByDay[day].push(entry.level);
    });

    Object.entries(energyByDay).forEach(([day, levels]) => {
        const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
        if (avg < 2.5 && levels.length >= 2) {
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)];
            patterns.push(`USER_TREND: Consistently lower energy detected on ${dayName}s (Avg: ${avg.toFixed(1)}).`);
        }
    });

    // 2. Analyze Reflection Keywords (Detecting "Interruptions" or "Focus" issues)
    const reflectionClues = [
        { kw: ['interupt', 'interruption', 'distract', 'phone', 'text'], label: 'Frequent interruptions' },
        { kw: ['tired', 'sleep', 'exhausted', 'rest'], label: 'Sleep/Energy concerns' },
        { kw: ['focus', 'concentrate', 'flow', 'deep'], label: 'Focus performance' },
        { kw: ['anxious', 'stress', 'pressure', 'hard'], label: 'Emotional load' }
    ];

    const clueCounts: Record<string, number> = {};
    const recentReflections = [
        ...(user.journalEntries || []).map(e => `${e.highlight} ${e.midpoint} ${e.lowlight} ${e.freeform || ''}`),
        ...(user.meditationReflections || []).map(r => r.reflection)
    ].slice(-10);

    recentReflections.forEach(text => {
        const lowerText = text.toLowerCase();
        reflectionClues.forEach(clue => {
            if (clue.kw.some(k => lowerText.includes(k))) {
                clueCounts[clue.label] = (clueCounts[clue.label] || 0) + 1;
            }
        });
    });

    Object.entries(clueCounts).forEach(([label, count]) => {
        if (count >= 3) {
            patterns.push(`USER_TREND: ${label} mentioned in ${count} recent reflections.`);
        }
    });

    // 3. Pomodoro Interruption Fallback
    // If user completes few Pomodoros compared to starts (if we tracked starts)
    // For now, we use the completion count as a baseline
    const completedFocus = user.dailyFocuses?.filter(f => f.isCompleted).length || 0;
    if (completedFocus < 2 && (user.journalEntries?.length || 0) > 5) {
        patterns.push(`USER_TREND: Low goal completion rate recently. May need shorter sessions.`);
    }

    return patterns;
};
