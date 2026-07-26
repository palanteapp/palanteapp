/**
 * Profile merge for cloud sync conflicts.
 *
 * The profile syncs as one JSONB blob, so two devices writing in the same
 * window would otherwise clobber each other (last write wins, journal
 * entries silently lost). When api.ts detects that the cloud row changed
 * since our last sync, it merges instead:
 *
 *  - Collections (journal entries, practices, reflections…) are unioned by
 *    their natural key, so nothing either device wrote is ever dropped.
 *  - Monotonic counters (points, xp, totalPractices…) take the max.
 *  - Milestone flags OR together, once earned, never un-earned.
 *  - Every other field comes from `preferred` (the side the caller trusts
 *    as fresher: local on write conflicts, cloud on read conflicts).
 */
import type {
    UserProfile,
    ActivityLog,
    PracticeData,
    PracticeActivity,
} from '../types';

/** Union two arrays by key: preferred's version wins on collisions, extras from other are appended. */
const unionBy = <T>(
    preferred: T[] | undefined,
    other: T[] | undefined,
    key: (item: T) => string,
): T[] | undefined => {
    if (!preferred && !other) return undefined;
    const result = [...(preferred ?? [])];
    const seen = new Set(result.map(key));
    for (const item of other ?? []) {
        if (!seen.has(key(item))) {
            seen.add(key(item));
            result.push(item);
        }
    }
    return result;
};

const unionStrings = (a: string[] | undefined, b: string[] | undefined): string[] | undefined => {
    if (!a && !b) return undefined;
    return [...new Set([...(a ?? []), ...(b ?? [])])];
};

const maxOf = (a: number | undefined, b: number | undefined): number | undefined => {
    if (a === undefined && b === undefined) return undefined;
    return Math.max(a ?? 0, b ?? 0);
};

const laterDate = (a: string | undefined, b: string | undefined): string | undefined => {
    if (!a) return b;
    if (!b) return a;
    return a >= b ? a : b;
};

/** Activity logs are keyed by date+type; counts take the max (both sides counted the same real events). */
const mergeActivityHistory = (
    preferred: ActivityLog[] | undefined,
    other: ActivityLog[] | undefined,
): ActivityLog[] | undefined => {
    if (!preferred && !other) return undefined;
    const byKey = new Map<string, ActivityLog>();
    for (const log of [...(other ?? []), ...(preferred ?? [])]) {
        const k = `${log.date}|${log.type}`;
        const existing = byKey.get(k);
        if (!existing) {
            byKey.set(k, log);
        } else {
            byKey.set(k, {
                ...log,
                count: Math.max(existing.count, log.count),
                duration: maxOf(existing.duration, log.duration),
            });
        }
    }
    return [...byKey.values()];
};

const mergePracticeData = (
    preferred: PracticeData | undefined,
    other: PracticeData | undefined,
): PracticeData | undefined => {
    if (!preferred) return other;
    if (!other) return preferred;

    const byDate = new Map<string, PracticeActivity>();
    for (const day of [...other.activityHistory, ...preferred.activityHistory]) {
        const existing = byDate.get(day.date);
        byDate.set(day.date, existing
            ? { date: day.date, practices: [...new Set([...existing.practices, ...day.practices])] }
            : day);
    }
    const activityHistory = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    // Never let a merge lower the lifetime count: take the largest of either
    // side's counter and the recomputed union.
    const recomputed = activityHistory.reduce((sum, d) => sum + d.practices.length, 0);
    const totalPractices = Math.max(preferred.totalPractices, other.totalPractices, recomputed);

    return {
        totalPractices,
        lastActivityDate: laterDate(preferred.lastActivityDate, other.lastActivityDate) ?? preferred.lastActivityDate,
        milestones: {
            practices_1: preferred.milestones.practices_1 || other.milestones.practices_1,
            practices_3: preferred.milestones.practices_3 || other.milestones.practices_3,
            practices_7: preferred.milestones.practices_7 || other.milestones.practices_7,
            practices_14: preferred.milestones.practices_14 || other.milestones.practices_14,
            practices_30: preferred.milestones.practices_30 || other.milestones.practices_30,
            practices_50: preferred.milestones.practices_50 || other.milestones.practices_50,
            practices_90: preferred.milestones.practices_90 || other.milestones.practices_90,
            practices_100: preferred.milestones.practices_100 || other.milestones.practices_100,
            practices_180: preferred.milestones.practices_180 || other.milestones.practices_180,
            practices_200: preferred.milestones.practices_200 || other.milestones.practices_200,
            practices_365: preferred.milestones.practices_365 || other.milestones.practices_365,
        },
        activityHistory,
    };
};

/**
 * Merge two versions of the same profile. `preferred` wins all scalar /
 * settings fields; collections are unioned and counters never decrease.
 */
export const mergeProfiles = (preferred: UserProfile, other: UserProfile): UserProfile => {
    return {
        ...other,
        ...preferred,

        // ── Collections: union so neither device's entries are lost ──────────
        journalEntries: unionBy(preferred.journalEntries, other.journalEntries, e => e.id),
        meditationReflections: unionBy(preferred.meditationReflections, other.meditationReflections, r => r.id),
        dailyMorningPractice: unionBy(preferred.dailyMorningPractice, other.dailyMorningPractice, p => p.date),
        dailyEveningPractice: unionBy(preferred.dailyEveningPractice, other.dailyEveningPractice, p => p.date),
        noiseEntries: unionBy(preferred.noiseEntries, other.noiseEntries, n => n.id),
        futureLetters: unionBy(preferred.futureLetters, other.futureLetters, l => l.id),
        favoriteQuotes: unionBy(preferred.favoriteQuotes, other.favoriteQuotes, f => f.quoteId),
        goals: unionBy(preferred.goals, other.goals, g => g.id) ?? [],
        dailyFocuses: unionBy(preferred.dailyFocuses, other.dailyFocuses, f => f.id),
        savedMixes: unionBy(preferred.savedMixes, other.savedMixes, m => m.id),
        weeklyReports: unionBy(preferred.weeklyReports, other.weeklyReports, r => r.weekStartDate),
        accountabilityPartners: unionBy(preferred.accountabilityPartners, other.accountabilityPartners, p => p.id),
        coachInterventions: unionBy(preferred.coachInterventions, other.coachInterventions, i => i.id),
        energyHistory: unionBy(preferred.energyHistory, other.energyHistory, e => e.timestamp),
        weightHistory: unionBy(preferred.weightHistory, other.weightHistory, w => w.date),
        restDays: unionStrings(preferred.restDays, other.restDays),
        unlockedBadges: unionStrings(preferred.unlockedBadges, other.unlockedBadges),
        activityHistory: mergeActivityHistory(preferred.activityHistory, other.activityHistory),
        practiceData: mergePracticeData(preferred.practiceData, other.practiceData),

        // ── Counters: monotonic, never decrease through a merge ──────────────
        points: maxOf(preferred.points, other.points) ?? 0,
        streak: maxOf(preferred.streak, other.streak) ?? 0,
        xp: maxOf(preferred.xp, other.xp),
        level: maxOf(preferred.level, other.level),
        goalStreak: maxOf(preferred.goalStreak, other.goalStreak),
        lastGoalCompletionDate: laterDate(preferred.lastGoalCompletionDate, other.lastGoalCompletionDate),
    };
};
