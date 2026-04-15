import type { StreakData, StreakActivity } from '../types';

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * Calculate the difference in days between two dates
 */
export const getDaysDifference = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Initialize streak data for a new user
 */
export const initializeStreakData = (): StreakData => {
    return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        isGracePeriod: false,
        gracePeriodEndsAt: null,
        milestones: {
            week: false,
            month: false,
            century: false,
            year: false
        },
        activityHistory: []
    };
};

/**
 * Calculate current streak from activity history
 * Rest days are treated as valid activity days to preserve streaks
 */
export const calculateStreak = (
    activityHistory: StreakActivity[],
    restDays: string[] = []
): number => {
    if (activityHistory.length === 0 && restDays.length === 0) return 0;

    // Combine activity dates and rest days
    const allActiveDates = new Set([
        ...activityHistory.map(a => a.date),
        ...restDays
    ]);

    const today = getTodayDate();
    let streak = 0;
    const currentDate = new Date(today);

    // Count backwards from today
    while (true) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - streak);
        const checkDateStr = checkDate.toISOString().split('T')[0];

        if (allActiveDates.has(checkDateStr)) {
            streak++;
        } else {
            // Gap found, streak broken
            break;
        }

        // Safety: don't go back more than 2 years
        if (streak > 730) break;
    }

    return streak;
};

/**
 * Check if user is in grace period
 */
export const checkGracePeriod = (lastActivityDate: string): {
    isGracePeriod: boolean;
    gracePeriodEndsAt: string | null;
} => {
    if (!lastActivityDate) {
        return { isGracePeriod: false, gracePeriodEndsAt: null };
    }

    const today = getTodayDate();
    const daysSinceActivity = getDaysDifference(lastActivityDate, today);

    if (daysSinceActivity === 1) {
        // Missed yesterday, grace period active
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setHours(23, 59, 59, 999); // End of today
        return {
            isGracePeriod: true,
            gracePeriodEndsAt: gracePeriodEnd.toISOString()
        };
    }

    return { isGracePeriod: false, gracePeriodEndsAt: null };
};

/**
 * Check if a milestone was just reached
 */
export const checkMilestone = (
    currentStreak: number,
    previousMilestones: StreakData['milestones']
): {
    milestone: 'week' | 'month' | 'century' | 'year' | null;
    isNew: boolean;
} => {
    if (currentStreak >= 365 && !previousMilestones.year) {
        return { milestone: 'year', isNew: true };
    }
    if (currentStreak >= 100 && !previousMilestones.century) {
        return { milestone: 'century', isNew: true };
    }
    if (currentStreak >= 30 && !previousMilestones.month) {
        return { milestone: 'month', isNew: true };
    }
    if (currentStreak >= 7 && !previousMilestones.week) {
        return { milestone: 'week', isNew: true };
    }

    return { milestone: null, isNew: false };
};

/**
 * Get milestone details
 */
export const getMilestoneDetails = (milestone: 'week' | 'month' | 'century' | 'year') => {
    const milestones = {
        week: {
            title: 'Week Warrior',
            icon: 'Flame',
            message: 'You\'ve completed 7 days in a row! Keep the momentum going!',
            days: 7
        },
        month: {
            title: 'Monthly Master',
            icon: 'Trophy',
            message: '30 days of dedication! You\'re building unstoppable habits!',
            days: 30
        },
        century: {
            title: 'Century Champion',
            icon: 'Award',
            message: '100 days! You\'re in the top 1% of committed individuals!',
            days: 100
        },
        year: {
            title: 'Year Legend',
            icon: 'PartyPopper',
            message: '365 days of excellence! You are a true master of consistency!',
            days: 365
        }
    };

    return milestones[milestone];
};

/**
 * Update streak data when a practice is completed
 */
export const updateStreakOnActivity = (
    currentStreakData: StreakData,
    practiceType: string,
    restDays: string[] = []
): StreakData => {
    const today = getTodayDate();
    const updatedHistory = [...currentStreakData.activityHistory];

    // Find or create today's activity entry
    const todayIndex = updatedHistory.findIndex(a => a.date === today);

    if (todayIndex >= 0) {
        // Add practice to today's list if not already there
        if (!updatedHistory[todayIndex].practices.includes(practiceType)) {
            updatedHistory[todayIndex].practices.push(practiceType);
        }
    } else {
        // Create new entry for today
        updatedHistory.push({
            date: today,
            practices: [practiceType]
        });
    }

    // Calculate new streak (including rest days)
    const newStreak = calculateStreak(updatedHistory, restDays);
    const longestStreak = Math.max(currentStreakData.longestStreak, newStreak);

    // Update milestones
    const updatedMilestones = { ...currentStreakData.milestones };
    const { milestone, isNew } = checkMilestone(newStreak, currentStreakData.milestones);

    if (milestone && isNew) {
        updatedMilestones[milestone] = true;
    }

    return {
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        isGracePeriod: false, // Activity completed, no longer in grace period
        gracePeriodEndsAt: null,
        milestones: updatedMilestones,
        activityHistory: updatedHistory
    };
};

/**
 * Check and update streak status on app open (handles midnight rollover)
 */
export const checkStreakStatus = (currentStreakData: StreakData): StreakData => {
    const today = getTodayDate();
    const daysSinceActivity = getDaysDifference(currentStreakData.lastActivityDate, today);

    // If more than 2 days have passed, streak is broken
    if (daysSinceActivity > 1) {
        return {
            ...currentStreakData,
            currentStreak: 0,
            isGracePeriod: false,
            gracePeriodEndsAt: null
        };
    }

    // Check if grace period is active
    const { isGracePeriod, gracePeriodEndsAt } = checkGracePeriod(currentStreakData.lastActivityDate);

    return {
        ...currentStreakData,
        isGracePeriod,
        gracePeriodEndsAt
    };
};
