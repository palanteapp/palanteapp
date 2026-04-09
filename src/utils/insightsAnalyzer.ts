import type { UserProfile, DailyFocus } from '../types';

export interface Insight {
    id: string;
    type: 'pattern' | 'recommendation' | 'achievement' | 'energy';
    title: string;
    description: string;
    icon: string;
    confidence: number; // 0-1, how confident we are in this insight
    actionable?: string; // Optional actionable recommendation
}

/**
 * Analyzes user data to generate weekly insights
 */
export const generateWeeklyInsights = (user: UserProfile): Insight[] => {
    const insights: Insight[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent activity
    const recentFocuses = (user.dailyFocuses || []).filter(f => {
        const createdDate = new Date(f.createdAt);
        return createdDate >= thirtyDaysAgo;
    });

    const recentActivity = (user.activityHistory || []).filter(a => {
        const activityDate = new Date(a.date);
        return activityDate >= thirtyDaysAgo;
    });

    // 1. Completion Rate Analysis
    if (recentFocuses.length >= 5) {
        const completedCount = recentFocuses.filter(f => f.isCompleted).length;
        const completionRate = completedCount / recentFocuses.length;

        if (completionRate >= 0.75) {
            insights.push({
                id: 'high-completion',
                type: 'achievement',
                title: `${Math.round(completionRate * 100)}% Completion Rate`,
                description: `You've completed ${completedCount} of ${recentFocuses.length} goals this month. Outstanding!`,
                icon: 'target',
                confidence: 0.9,
                actionable: 'Keep this momentum going!'
            });
        } else if (completionRate < 0.5) {
            insights.push({
                id: 'low-completion',
                type: 'recommendation',
                title: 'Try Smaller Goals',
                description: `Your completion rate is ${Math.round(completionRate * 100)}%. Breaking goals into smaller tasks might help.`,
                icon: 'lightbulb',
                confidence: 0.7,
                actionable: 'Set 1-2 quick wins today'
            });
        }
    }

    // 2. Day of Week Pattern
    const dayCompletionRates = analyzeDayPatterns(recentFocuses);
    const bestDay = Object.entries(dayCompletionRates)
        .sort(([, a], [, b]) => b.rate - a.rate)[0];

    if (bestDay && bestDay[1].count >= 3 && bestDay[1].rate > 0.7) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        insights.push({
            id: 'best-day',
            type: 'pattern',
            title: `${dayNames[parseInt(bestDay[0])]}s Are Your Power Day`,
            description: `You complete ${Math.round(bestDay[1].rate * 100)}% of goals on ${dayNames[parseInt(bestDay[0])]}s.`,
            icon: 'trending',
            confidence: 0.8,
            actionable: `Schedule your toughest goals for ${dayNames[parseInt(bestDay[0])]}`
        });
    }

    // 3. Energy Correlation
    if (user.energyHistory && user.energyHistory.length >= 5) {
        const energyInsight = analyzeEnergyImpact(recentFocuses, user.energyHistory);
        if (energyInsight) {
            insights.push(energyInsight);
        }
    }

    // 4. Goal Length Analysis
    const lengthInsight = analyzeGoalLength(recentFocuses);
    if (lengthInsight) {
        insights.push(lengthInsight);
    }

    // 5. Streak Celebration
    if (user.goalStreak && user.goalStreak >= 7) {
        insights.push({
            id: 'streak-milestone',
            type: 'achievement',
            title: `${user.goalStreak}-Day Streak!`,
            description: `You've maintained your goal streak for ${user.goalStreak} days straight.`,
            icon: 'flame',
            confidence: 1.0,
            actionable: 'Keep the fire burning!'
        });
    }

    // 6. Activity Diversity
    if (recentActivity.length >= 10) {
        const activityTypes = new Set(recentActivity.map(a => a.type));
        if (activityTypes.size >= 3) {
            insights.push({
                id: 'balanced-practice',
                type: 'achievement',
                title: 'Balanced Practice',
                description: `You're engaging with ${activityTypes.size} different practices. Great holistic approach!`,
                icon: 'scale',
                confidence: 0.85
            });
        }
    }

    // Return top 4 insights sorted by confidence
    return insights
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 4);
};

/**
 * Analyze completion patterns by day of week
 */
const analyzeDayPatterns = (focuses: DailyFocus[]): Record<number, { rate: number; count: number }> => {
    const dayStats: Record<number, { completed: number; total: number }> = {};

    focuses.forEach(focus => {
        const day = new Date(focus.createdAt).getDay();
        if (!dayStats[day]) {
            dayStats[day] = { completed: 0, total: 0 };
        }
        dayStats[day].total++;
        if (focus.isCompleted) {
            dayStats[day].completed++;
        }
    });

    const result: Record<number, { rate: number; count: number }> = {};
    Object.entries(dayStats).forEach(([day, stats]) => {
        result[parseInt(day)] = {
            rate: stats.completed / stats.total,
            count: stats.total
        };
    });

    return result;
};

/**
 * Analyze energy level impact on completion
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const analyzeEnergyImpact = (focuses: DailyFocus[], _energyHistory: any[]): Insight | null => {
    const focusesWithEnergy = focuses.filter(f => f.energyLevelWhenCreated);
    if (focusesWithEnergy.length < 5) return null;

    const highEnergyFocuses = focusesWithEnergy.filter(f => (f.energyLevelWhenCreated || 0) >= 4);
    const lowEnergyFocuses = focusesWithEnergy.filter(f => (f.energyLevelWhenCreated || 0) <= 2);

    if (highEnergyFocuses.length >= 3) {
        const highEnergyCompletion = highEnergyFocuses.filter(f => f.isCompleted).length / highEnergyFocuses.length;

        if (highEnergyCompletion > 0.8) {
            return {
                id: 'high-energy-success',
                type: 'energy',
                title: 'High Energy = High Success',
                description: `You complete ${Math.round(highEnergyCompletion * 100)}% of goals when energy is 4+/5.`,
                icon: 'zap',
                confidence: 0.85,
                actionable: 'Tackle tough goals during peak energy times'
            };
        }
    }

    if (lowEnergyFocuses.length >= 3) {
        const lowEnergyCompletion = lowEnergyFocuses.filter(f => f.isCompleted).length / lowEnergyFocuses.length;

        if (lowEnergyCompletion < 0.4) {
            return {
                id: 'low-energy-struggle',
                type: 'recommendation',
                title: 'Save Big Tasks for High Energy',
                description: `Low energy completion rate: ${Math.round(lowEnergyCompletion * 100)}%. Consider quick wins when energy is low.`,
                icon: 'battery',
                confidence: 0.75,
                actionable: 'Set smaller goals on low-energy days'
            };
        }
    }

    return null;
};

/**
 * Analyze goal text length impact
 */
const analyzeGoalLength = (focuses: DailyFocus[]): Insight | null => {
    if (focuses.length < 10) return null;

    const shortGoals = focuses.filter(f => f.text.split(' ').length <= 5);
    const longGoals = focuses.filter(f => f.text.split(' ').length > 5);

    if (shortGoals.length >= 5 && longGoals.length >= 5) {
        const shortCompletion = shortGoals.filter(f => f.isCompleted).length / shortGoals.length;
        const longCompletion = longGoals.filter(f => f.isCompleted).length / longGoals.length;

        if (shortCompletion > longCompletion + 0.2) {
            return {
                id: 'short-goals-win',
                type: 'pattern',
                title: 'Shorter Goals Work Better',
                description: `You complete ${Math.round(shortCompletion * 100)}% of short goals vs ${Math.round(longCompletion * 100)}% of longer ones.`,
                icon: 'scissors',
                confidence: 0.8,
                actionable: 'Keep goals under 5 words for better success'
            };
        }
    }

    return null;
};
