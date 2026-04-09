/**
 * Practice Tracking Utilities
 * 
 * Replaces streak-based tracking with total practice counting.
 * No pressure, no guilt - just celebration of progress.
 */

import type { UserProfile } from '../types';

export interface PracticeData {
    totalPractices: number; // Total number of practices completed (all time)
    lastActivityDate: string; // ISO date (YYYY-MM-DD)
    milestones: {
        practices_7: boolean;      // 7 total practices
        practices_30: boolean;     // 30 total practices
        practices_100: boolean;    // 100 total practices
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
        practices_7: false,
        practices_30: false,
        practices_100: false,
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

    let updatedHistory = [...currentData.activityHistory];

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
): { milestone: 'practices_7' | 'practices_30' | 'practices_100' | 'practices_365' | null; isNew: boolean } => {
    // Check milestones in order
    if (totalPractices >= 365 && !currentMilestones.practices_365) {
        return { milestone: 'practices_365', isNew: true };
    }
    if (totalPractices >= 100 && !currentMilestones.practices_100) {
        return { milestone: 'practices_100', isNew: true };
    }
    if (totalPractices >= 30 && !currentMilestones.practices_30) {
        return { milestone: 'practices_30', isNew: true };
    }
    if (totalPractices >= 7 && !currentMilestones.practices_7) {
        return { milestone: 'practices_7', isNew: true };
    }

    return { milestone: null, isNew: false };
};

/**
 * Get next milestone info for display
 */
export const getNextMilestone = (totalPractices: number): { target: number; name: string; remaining: number } | null => {
    if (totalPractices < 7) {
        return { target: 7, name: '7 Practices', remaining: 7 - totalPractices };
    }
    if (totalPractices < 30) {
        return { target: 30, name: '30 Practices', remaining: 30 - totalPractices };
    }
    if (totalPractices < 100) {
        return { target: 100, name: '100 Practices', remaining: 100 - totalPractices };
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
    if ((user as any).practiceData) {
        return (user as any).practiceData;
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
        practices_7: totalPractices >= 7,
        practices_30: totalPractices >= 30,
        practices_100: totalPractices >= 100,
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
