import type { UserProfile, Milestone } from '../types';

// Constants
export const XP_PER_GOAL = 50;
export const XP_PER_DAILY_CHECKIN = 100;
export const BASE_LEVEL_XP = 500; // XP needed for first level
export const STREAK_MILESTONES: Milestone[] = [
    { day: 3, title: "Consistency Starter", icon: "Sprout", bonusPoints: 100, badge: 'streak_3', message: "Great start! You're planting the seeds of habit." },
    { day: 7, title: "Week Warrior", icon: "Flame", bonusPoints: 300, badge: 'streak_7', message: "That's one full week of momentum!" },
    { day: 14, title: "Fortnight Streak", icon: "Castle", bonusPoints: 500, badge: 'streak_14', message: "Two weeks strong. You're building a strong foundation." },
    { day: 30, title: "Monthly Master", icon: "Crown", bonusPoints: 1000, badge: 'streak_30', message: "Incredible. A full month of dedication." },
    { day: 100, title: "Centurion", icon: "Award", bonusPoints: 5000, badge: 'streak_100', message: "100 Days. You are unstoppable." },
];

export interface LevelProgress {
    currentLevel: number;
    currentXP: number;
    nextLevelXP: number;
    progressPercent: number;
}

// 1. Calculate Level from Total XP
export const calculateLevelProgress = (totalXP: number): LevelProgress => {
    // Simple geometric progression: Level N reserves base * 1.2^(N-1)
    let level = 1;
    let xpForNext = BASE_LEVEL_XP;
    let accumulatedXP = 0;

    while (totalXP >= accumulatedXP + xpForNext) {
        accumulatedXP += xpForNext;
        level++;
        xpForNext = Math.floor(xpForNext * 1.5); // 50% increase per level for difficulty curve
    }

    const currentLevelXP = totalXP - accumulatedXP;
    const progressPercent = Math.min(100, Math.round((currentLevelXP / xpForNext) * 100));

    return {
        currentLevel: level,
        currentXP: currentLevelXP,
        nextLevelXP: xpForNext,
        progressPercent
    };
};

// 2. Check for newly unlocked milestones
export const checkMilestones = (currentStreak: number, previouslyUnlockedBadges: string[] = []): Milestone | null => {
    const milestone = STREAK_MILESTONES.find(m => m.day === currentStreak);

    if (milestone && !previouslyUnlockedBadges.includes(milestone.badge)) {
        return milestone;
    }

    return null;
};

// 3. Simulation helper (for testing)
export const simulateXPAdd = (user: UserProfile, amount: number) => {
    return (user.xp || 0) + amount;
};
