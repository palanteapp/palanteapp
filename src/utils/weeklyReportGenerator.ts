import type { UserProfile, WeeklyReport, Quote } from '../types';

/**
 * Get the date range for the current week (Monday to Sunday)
 */
export const getWeekDateRange = (referenceDate?: Date): { start: string; end: string } => {
    const now = referenceDate || new Date();
    const dayOfWeek = now.getDay();

    // Calculate Monday of current week
    const monday = new Date(now);
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, so it's 6 days from Monday
    monday.setDate(now.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
    };
};

/**
 * Check if a date falls within a week range
 */
const isDateInWeek = (date: string, weekStart: string, weekEnd: string): boolean => {
    return date >= weekStart && date <= weekEnd;
};

/**
 * Analyze practice data for the week
 */
const analyzePracticeData = (user: UserProfile, weekStart: string, weekEnd: string) => {
    const practices = {
        meditation: { count: 0, totalMinutes: 0 },
        breathwork: { count: 0, totalMinutes: 0 },
        morningPractice: { count: 0 },
        reflections: { count: 0 }
    };

    // Count meditation reflections
    user.meditationReflections?.forEach(reflection => {
        if (isDateInWeek(reflection.date, weekStart, weekEnd)) {
            practices.meditation.count++;
            practices.meditation.totalMinutes += reflection.duration;
        }
    });

    // Count morning practice
    user.dailyPriming?.forEach(priming => {
        if (isDateInWeek(priming.date, weekStart, weekEnd)) {
            practices.morningPractice.count++;
        }
    });

    // Count reflections (journal entries)
    user.journalEntries?.forEach(entry => {
        if (isDateInWeek(entry.date, weekStart, weekEnd)) {
            practices.reflections.count++;
        }
    });

    // Count breathwork from activity history
    user.activityHistory?.forEach(activity => {
        if (activity.type === 'breath' && isDateInWeek(activity.date, weekStart, weekEnd)) {
            practices.breathwork.count += activity.count;
            practices.breathwork.totalMinutes += activity.duration || 0;
        }
    });

    return practices;
};

/**
 * Analyze mood and energy trends
 */
const analyzeMoodTrends = (user: UserProfile, weekStart: string, weekEnd: string) => {
    const energyLevels: number[] = [];
    const moodCounts: Record<string, number> = {};

    // Analyze energy history
    user.energyHistory?.forEach(log => {
        if (isDateInWeek(log.timestamp.split('T')[0], weekStart, weekEnd)) {
            energyLevels.push(log.level);
        }
    });

    // Analyze journal entries for mood
    user.journalEntries?.forEach(entry => {
        if (isDateInWeek(entry.date, weekStart, weekEnd) && entry.energyLevel) {
            energyLevels.push(entry.energyLevel);
        }
    });

    // Calculate energy average
    const energyAverage = energyLevels.length > 0
        ? energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length
        : 0;

    // Determine most common mood (simplified - using energy levels as proxy)
    const mostCommonMood = energyAverage >= 4 ? 'Energetic' :
        energyAverage >= 3 ? 'Balanced' :
            energyAverage >= 2 ? 'Calm' : 'Low Energy';

    // Create mood distribution
    energyLevels.forEach(level => {
        const moodKey = level >= 4 ? 'High' : level >= 3 ? 'Medium' : 'Low';
        moodCounts[moodKey] = (moodCounts[moodKey] || 0) + 1;
    });

    return {
        mostCommonMood,
        energyAverage: Math.round(energyAverage * 10) / 10,
        moodDistribution: moodCounts
    };
};

/**
 * Analyze goal achievement
 */
const analyzeGoals = (user: UserProfile, weekStart: string, weekEnd: string) => {
    const goalsInWeek = user.dailyFocuses?.filter(goal =>
        isDateInWeek(goal.createdAt.split('T')[0], weekStart, weekEnd)
    ) || [];

    const completed = goalsInWeek.filter(g => g.isCompleted).length;
    const set = goalsInWeek.length;
    const completionRate = set > 0 ? Math.round((completed / set) * 100) : 0;

    return { set, completed, completionRate };
};

/**
 * Get top quotes from the week (most favorited)
 */
const getTopQuotes = (user: UserProfile, weekStart: string, weekEnd: string, allQuotes: Quote[]): Quote[] => {
    const favoritesThisWeek = user.favoriteQuotes?.filter(fav =>
        isDateInWeek(fav.savedAt.split('T')[0], weekStart, weekEnd)
    ) || [];

    // Get the actual quote objects
    const topQuoteIds = favoritesThisWeek.slice(0, 3).map(fav => fav.quoteId);
    return allQuotes.filter(q => topQuoteIds.includes(q.id)).slice(0, 3);
};

/**
 * Generate personalized insights based on report data
 */
const generatePersonalizedInsights = (
    report: WeeklyReport,
    previousReport?: WeeklyReport
): string[] => {
    const insights: string[] = [];

    // Practice insights
    const totalPractices = report.practices.meditation.count +
        report.practices.breathwork.count +
        report.practices.morningPractice.count +
        report.practices.reflections.count;

    if (previousReport) {
        const prevTotal = previousReport.practices.meditation.count +
            previousReport.practices.breathwork.count +
            previousReport.practices.morningPractice.count +
            previousReport.practices.reflections.count;

        const change = totalPractices - prevTotal;
        if (change > 0) {
            insights.push(`You completed ${change} more practice${change > 1 ? 's' : ''} than last week!`);
        } else if (change < 0) {
            insights.push(`Life got busy - you did ${Math.abs(change)} fewer practices. That's okay, let's get back on track!`);
        } else {
            insights.push(`You maintained consistent practice this week!`);
        }
    }

    // Meditation insights
    if (report.practices.meditation.count > 0) {
        insights.push(`You meditated ${report.practices.meditation.count}x this week for ${report.practices.meditation.totalMinutes} minutes total`);
    }

    // Goal completion insights
    if (report.goals.completionRate >= 80) {
        insights.push(`You crushed ${report.goals.completionRate}% of your goals - you're unstoppable!`);
    } else if (report.goals.completionRate >= 50) {
        insights.push(`You completed ${report.goals.completionRate}% of your goals - solid progress!`);
    }

    // Energy insights
    if (report.moodTrends.energyAverage >= 4) {
        insights.push(`Your energy levels were high this week (${report.moodTrends.energyAverage}/5) - keep that momentum!`);
    } else if (report.moodTrends.energyAverage < 2.5) {
        insights.push(`Your energy was lower this week. Remember to prioritize rest and self-care`);
    }

    // Streak insights
    if (report.streakInfo.maintained) {
        insights.push(`You maintained your ${report.streakInfo.currentStreak}-day streak! Consistency is key`);
    }

    // Morning practice insights
    if (report.practices.morningPractice.count >= 5) {
        insights.push(`You started ${report.practices.morningPractice.count} mornings with intention - that's powerful!`);
    }

    return insights;
};

/**
 * Generate a complete weekly report
 */
export const generateWeeklyReport = (
    user: UserProfile,
    allQuotes: Quote[],
    weekDate?: Date
): WeeklyReport => {
    const { start, end } = getWeekDateRange(weekDate);

    const practices = analyzePracticeData(user, start, end);
    const moodTrends = analyzeMoodTrends(user, start, end);
    const goals = analyzeGoals(user, start, end);
    const topQuotes = getTopQuotes(user, start, end, allQuotes);

    // Get streak info
    const streakInfo = {
        maintained: (user.streakData?.currentStreak || 0) > 0,
        currentStreak: user.streakData?.currentStreak || 0,
        longestThisWeek: user.streakData?.longestStreak || 0
    };

    // Get previous week's report for comparison
    const previousReport = user.weeklyReports?.[user.weeklyReports.length - 1];

    const report: WeeklyReport = {
        weekStartDate: start,
        weekEndDate: end,
        practices,
        moodTrends,
        goals,
        streakInfo,
        topQuotes,
        insights: [],
        comparisonToPreviousWeek: previousReport ? {
            practiceChange: (practices.meditation.count + practices.breathwork.count + practices.morningPractice.count + practices.reflections.count) -
                (previousReport.practices.meditation.count + previousReport.practices.breathwork.count + previousReport.practices.morningPractice.count + previousReport.practices.reflections.count),
            moodChange: moodTrends.energyAverage > previousReport.moodTrends.energyAverage ? 'improved' :
                moodTrends.energyAverage < previousReport.moodTrends.energyAverage ? 'declined' : 'stable'
        } : undefined
    };

    // Generate insights after report is built
    report.insights = generatePersonalizedInsights(report, previousReport);

    return report;
};

/**
 * Check if it's time to generate a weekly report (Sunday evening)
 */
export const shouldGenerateWeeklyReport = (): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // Sunday (0) evening (7 PM or later)
    return dayOfWeek === 0 && hour >= 19;
};
