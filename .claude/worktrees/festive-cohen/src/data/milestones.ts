import type { Milestone } from '../types';

export const MILESTONES: Milestone[] = [
    {
        day: 7,
        title: "One Week Strong",
        icon: "Flame",
        bonusPoints: 50,
        badge: "week_warrior",
        message: "You've built a 7-day streak! Consistency is the foundation of greatness."
    },
    {
        day: 30,
        title: "One Month Momentum",
        icon: "Trophy",
        bonusPoints: 200,
        badge: "monthly_master",
        message: "30 days of daily motivation! You're building an unstoppable habit."
    },
    {
        day: 100,
        title: "Century Club",
        icon: "Award",
        bonusPoints: 500,
        badge: "century_club",
        message: "100 days! You're in the top 1% of committed individuals. Legendary status achieved."
    },
    {
        day: 365,
        title: "Year of Growth",
        icon: "PartyPopper",
        bonusPoints: 2000,
        badge: "year_warrior",
        message: "365 days of dedication! You've transformed your life one day at a time. This is mastery."
    }
];

export const getMilestoneForStreak = (streak: number): Milestone | null => {
    return MILESTONES.find(m => m.day === streak) || null;
};
