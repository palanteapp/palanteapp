/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UserProfile, UserBehaviorPattern, CoachIntervention } from '../types';

/**
 * Analyze user behavior patterns from the last 30 days
 */
export const analyzeUserBehavior = (user: UserProfile): UserBehaviorPattern => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Analyze meditation timing
    const meditationTimes = user.meditationReflections
        ?.filter(m => m.date >= thirtyDaysAgoStr)
        .map(m => {
            const hour = new Date(m.date).getHours();
            if (hour < 12) return 'morning';
            if (hour < 18) return 'afternoon';
            return 'evening';
        }) || [];

    const preferredMeditationTime = getMostCommon(meditationTimes) || 'unknown';

    // Analyze morning practice timing
    const morningPrimingTimes = user.dailyPriming
        ?.filter(p => p.date >= thirtyDaysAgoStr)
        .map(p => {
            const hour = new Date(p.date).getHours();
            return hour < 9 ? 'early' : 'late_morning';
        }) || [];

    const preferredMorningPrimingTime = getMostCommon(morningPrimingTimes) || 'unknown';

    // Calculate practice frequency (per week)
    const meditationCount = user.meditationReflections?.filter(m => m.date >= thirtyDaysAgoStr).length || 0;
    const breathworkCount = user.activityHistory?.filter(a =>
        a.type === 'breath' && a.date >= thirtyDaysAgoStr
    ).reduce((sum, a) => sum + a.count, 0) || 0;
    const reflectionCount = user.journalEntries?.filter(j => j.date >= thirtyDaysAgoStr).length || 0;

    const weeksInPeriod = 4.3; // ~30 days
    const practiceFrequency = {
        meditation: Math.round(meditationCount / weeksInPeriod),
        breathwork: Math.round(breathworkCount / weeksInPeriod),
        reflections: Math.round(reflectionCount / weeksInPeriod)
    };

    // Analyze skip patterns
    const allDates = getLast30Days();
    const practiceDates = new Set([
        ...(user.meditationReflections?.map(m => m.date.split('T')[0]) || []),
        ...(user.dailyPriming?.map(p => p.date) || []),
        ...(user.journalEntries?.map(j => j.date) || [])
    ]);

    const skippedDays = allDates.filter(date => !practiceDates.has(date));
    const skippedDaysOfWeek = skippedDays.map(date => new Date(date).getDay());
    const skipPatternByDay = countOccurrences(skippedDaysOfWeek);

    // Find consecutive skips
    let maxConsecutiveSkips = 0;
    let currentSkips = 0;
    allDates.forEach(date => {
        if (!practiceDates.has(date)) {
            currentSkips++;
            maxConsecutiveSkips = Math.max(maxConsecutiveSkips, currentSkips);
        } else {
            currentSkips = 0;
        }
    });

    // Analyze mood/energy patterns
    const energyLogs = user.energyHistory?.filter(e =>
        new Date(e.timestamp).getTime() >= thirtyDaysAgo.getTime()
    ) || [];

    const energyByDay: Record<number, number[]> = {};
    energyLogs.forEach(log => {
        const day = new Date(log.timestamp).getDay();
        if (!energyByDay[day]) energyByDay[day] = [];
        energyByDay[day].push(log.level);
    });

    const lowEnergyDays: number[] = [];
    Object.entries(energyByDay).forEach(([day, levels]) => {
        const avg = levels.reduce((sum, l) => sum + l, 0) / levels.length;
        if (avg < 2.5) {
            lowEnergyDays.push(parseInt(day));
        }
    });

    const averageEnergy = energyLogs.length > 0
        ? energyLogs.reduce((sum, e) => sum + e.level, 0) / energyLogs.length
        : 3;

    // Calculate goal completion rate
    const recentGoals = user.dailyFocuses?.filter(g =>
        new Date(g.createdAt).getTime() >= thirtyDaysAgo.getTime()
    ) || [];
    const completedGoals = recentGoals.filter(g => g.isCompleted).length;
    const goalCompletionRate = recentGoals.length > 0
        ? completedGoals / recentGoals.length
        : 0;

    // Response to nudges (placeholder - would track actual engagement)
    const responseToNudges = {
        morning: 0.7,
        afternoon: 0.5,
        evening: 0.6
    };

    return {
        userId: user.id,
        patterns: {
            preferredPracticeTime: {
                meditation: preferredMeditationTime as any,
                breathwork: 'unknown', // Would need more data
                morningPractice: preferredMorningPrimingTime as any
            },
            practiceFrequency,
            skipPatterns: {
                daysOfWeek: Object.keys(skipPatternByDay)
                    .filter(day => skipPatternByDay[parseInt(day)] > 2)
                    .map(d => parseInt(d)),
                consecutiveSkips: maxConsecutiveSkips
            },
            moodPatterns: {
                lowEnergyDays,
                averageEnergy: Math.round(averageEnergy * 10) / 10
            },
            goalCompletionRate: Math.round(goalCompletionRate * 100) / 100,
            responseToNudges
        },
        lastAnalyzed: new Date().toISOString()
    };
};

/**
 * Generate AI coach interventions based on behavior patterns
 */
export const generateInterventions = (
    user: UserProfile,
    pattern: UserBehaviorPattern
): CoachIntervention[] => {
    const interventions: CoachIntervention[] = [];
    const now = new Date();

    // Check for consecutive skips
    if (pattern.patterns.skipPatterns.consecutiveSkips >= 3) {
        interventions.push({
            id: `skip-${Date.now()}`,
            type: 'alternative',
            trigger: {
                condition: 'consecutive_skips_3_days',
                confidence: 0.9
            },
            message: `It's great to see you again! Whenever you're ready, a quick 2-minute breathing exercise is a perfect way to reconnect with yourself.`,
            action: {
                type: 'show_breathing'
            },
            priority: 'medium', // Changed from high to reduce "warning" feel
            timestamp: now.toISOString()
        });
    }

    // Check for low meditation frequency
    if (pattern.patterns.practiceFrequency.meditation < 2) {
        interventions.push({
            id: `low-meditation-${Date.now()}`,
            type: 'suggestion',
            trigger: {
                condition: 'low_meditation_frequency',
                confidence: 0.8
            },
            message: "Building a meditation habit? Start small - even 5 minutes makes a difference. Want to set a goal for 3 sessions this week?",
            action: {
                type: 'suggest_goal',
                data: {
                    title: 'Meditate 3x this week',
                    category: 'Mindfulness'
                }
            },
            priority: 'medium',
            timestamp: now.toISOString()
        });
    }

    // Check for low energy pattern
    if (pattern.patterns.moodPatterns.averageEnergy < 2.5) {
        interventions.push({
            id: `low-energy-${Date.now()}`,
            type: 'suggestion',
            trigger: {
                condition: 'low_energy_pattern',
                confidence: 0.85
            },
            message: "Your energy has been lower lately. Let's boost it with a morning breathwork session - it can really energize your day!",
            action: {
                type: 'show_breathing'
            },
            priority: 'medium',
            timestamp: now.toISOString()
        });
    }

    // Check for streak grace period
    if (user.streakData?.isGracePeriod) {
        interventions.push({
            id: `grace-period-${Date.now()}`,
            type: 'streak_warning',
            trigger: {
                condition: 'streak_grace_period',
                confidence: 1.0
            },
            message: `⚠️ You're in your grace period! Complete any practice today to keep your ${user.streakData.currentStreak}-day streak alive`,
            action: {
                type: 'open_practice'
            },
            priority: 'high',
            timestamp: now.toISOString()
        });
    }

    // Check for goal stagnation
    const daysSinceLastGoal = (user.dailyFocuses && user.dailyFocuses.length > 0)
        ? Math.floor((now.getTime() - new Date(user.dailyFocuses[user.dailyFocuses.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    if (daysSinceLastGoal > 7) {
        interventions.push({
            id: `goal-stagnation-${Date.now()}`,
            type: 'check_in',
            trigger: {
                condition: 'no_goals_7_days',
                confidence: 0.7
            },
            message: "You haven't set any new goals in a while. Want to set a fresh intention for the week ahead?",
            action: {
                type: 'suggest_goal'
            },
            priority: 'low',
            timestamp: now.toISOString()
        });
    }

    // Pattern-based suggestion
    if (pattern.patterns.preferredPracticeTime.meditation !== 'unknown') {
        const preferredTime = pattern.patterns.preferredPracticeTime.meditation;
        interventions.push({
            id: `pattern-${Date.now()}`,
            type: 'encouragement',
            trigger: {
                condition: 'detected_preference',
                confidence: 0.75
            },
            message: `I noticed you usually meditate in the ${preferredTime}. Want me to send you a reminder at that time?`,
            priority: 'low',
            timestamp: now.toISOString()
        });
    }

    return interventions;
};

// Helper functions

function getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    const counts: Record<string, number> = {};
    arr.forEach(item => {
        const key = String(item);
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as any;
}

function getLast30Days(): string[] {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates.reverse();
}

function countOccurrences(arr: number[]): Record<number, number> {
    const counts: Record<number, number> = {};
    arr.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });
    return counts;
}
