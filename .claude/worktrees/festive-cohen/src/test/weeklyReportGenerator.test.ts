import { describe, it, expect } from 'vitest';
import {
    getWeekDateRange,
    generateWeeklyReport,
    shouldGenerateWeeklyReport,
} from '../utils/weeklyReportGenerator';
import type { UserProfile, Quote } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build the minimal UserProfile required by the generator */
const makeUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: 'u1',
    name: 'Test User',
    career: 'tech',
    profession: 'developer',
    interests: [],
    quoteIntensity: 2,
    subscriptionTier: 'free',
    streak: 0,
    points: 0,
    sourcePreference: 'mix',
    contentTypePreference: 'mix',
    notificationFrequency: 1,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    goals: [],
    ...overrides,
});

const makeQuote = (id: string): Quote => ({
    id,
    text: `Quote ${id}`,
    author: 'Author',
    category: 'Motivation',
    intensity: 2,
});

// ── getWeekDateRange ──────────────────────────────────────────────────────────

describe('getWeekDateRange', () => {
    it('returns start as Monday and end as Sunday', () => {
        // 2024-01-10 is a Wednesday
        const { start, end } = getWeekDateRange(new Date(2024, 0, 10));
        expect(start).toBe('2024-01-08'); // Monday
        expect(end).toBe('2024-01-14');   // Sunday
    });

    it('handles a Monday reference date (start === reference day)', () => {
        const { start } = getWeekDateRange(new Date(2024, 0, 8));
        expect(start).toBe('2024-01-08');
    });

    it('handles a Sunday reference date (end === reference day)', () => {
        const { end } = getWeekDateRange(new Date(2024, 0, 14));
        expect(end).toBe('2024-01-14');
    });

    it('start is always 6 days before end', () => {
        const { start, end } = getWeekDateRange(new Date(2024, 2, 15));
        const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
        expect(diff).toBe(6);
    });

    it('returns YYYY-MM-DD formatted strings', () => {
        const { start, end } = getWeekDateRange(new Date(2024, 5, 20));
        expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('uses today when no reference date is provided', () => {
        const { start, end } = getWeekDateRange();
        expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

// ── generateWeeklyReport ─────────────────────────────────────────────────────

describe('generateWeeklyReport', () => {
    const REF_DATE = new Date(2024, 0, 10); // Wednesday in a known week (local time)

    it('returns a report with correct weekStartDate and weekEndDate', () => {
        const report = generateWeeklyReport(makeUser(), [], REF_DATE);
        expect(report.weekStartDate).toBe('2024-01-08');
        expect(report.weekEndDate).toBe('2024-01-14');
    });

    it('returns zero counts when user has no activity data', () => {
        const report = generateWeeklyReport(makeUser(), [], REF_DATE);
        expect(report.practices.meditation.count).toBe(0);
        expect(report.practices.breathwork.count).toBe(0);
        expect(report.practices.morningPractice.count).toBe(0);
        expect(report.practices.reflections.count).toBe(0);
    });

    it('counts meditation reflections that fall within the week', () => {
        const user = makeUser({
            meditationReflections: [
                { id: 'm1', date: '2024-01-09', duration: 10, intention: '', reflection: '', mantra: '' },
                { id: 'm2', date: '2024-01-11', duration: 15, intention: '', reflection: '', mantra: '' },
                // outside the week
                { id: 'm3', date: '2024-01-01', duration: 5, intention: '', reflection: '', mantra: '' },
            ],
        });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.practices.meditation.count).toBe(2);
        expect(report.practices.meditation.totalMinutes).toBe(25);
    });

    it('counts morning practice entries within the week', () => {
        const user = makeUser({
            dailyPriming: [
                { id: 'p1', date: '2024-01-08', gratitudes: [], affirmations: [] },
                { id: 'p2', date: '2024-01-09', gratitudes: [], affirmations: [] },
                { id: 'p3', date: '2024-01-20', gratitudes: [], affirmations: [] }, // outside
            ],
        });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.practices.morningPractice.count).toBe(2);
    });

    it('counts journal entries (reflections) within the week', () => {
        const user = makeUser({
            journalEntries: [
                { id: 'j1', date: '2024-01-12', highlight: 'Felt great', midpoint: '', lowlight: '', energyLevel: 4 },
                { id: 'j2', date: '2024-01-13', highlight: 'Busy day',   midpoint: '', lowlight: '', energyLevel: 3 },
            ],
        });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.practices.reflections.count).toBe(2);
    });

    it('calculates goal completion rate correctly', () => {
        const user = makeUser({
            dailyFocuses: [
                { id: 'g1', text: 'goal 1', isCompleted: true,  createdAt: '2024-01-09T10:00:00Z' },
                { id: 'g2', text: 'goal 2', isCompleted: true,  createdAt: '2024-01-10T10:00:00Z' },
                { id: 'g3', text: 'goal 3', isCompleted: false, createdAt: '2024-01-11T10:00:00Z' },
                { id: 'g4', text: 'goal 4', isCompleted: false, createdAt: '2024-01-12T10:00:00Z' },
            ],
        });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.goals.set).toBe(4);
        expect(report.goals.completed).toBe(2);
        expect(report.goals.completionRate).toBe(50);
    });

    it('sets streakInfo from user.streakData', () => {
        const user = makeUser({
            streakData: {
                currentStreak: 7,
                longestStreak: 14,
                lastActivityDate: '2024-01-09',
                isGracePeriod: false,
                gracePeriodEndsAt: null,
                milestones: { week: true, month: false, century: false, year: false },
                activityHistory: [],
            },
        });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.streakInfo.currentStreak).toBe(7);
        expect(report.streakInfo.maintained).toBe(true);
        expect(report.streakInfo.longestThisWeek).toBe(14);
    });

    it('includes topQuotes matched from allQuotes', () => {
        const allQuotes = [makeQuote('q1'), makeQuote('q2'), makeQuote('q3')];
        const user = makeUser({
            favoriteQuotes: [
                { quoteId: 'q1', savedAt: '2024-01-09T10:00:00Z' },
                { quoteId: 'q2', savedAt: '2024-01-11T10:00:00Z' },
            ],
        });
        const report = generateWeeklyReport(user, allQuotes, REF_DATE);
        expect(report.topQuotes.map(q => q.id)).toContain('q1');
        expect(report.topQuotes.map(q => q.id)).toContain('q2');
    });

    it('includes comparisonToPreviousWeek when user has prior reports', () => {
        const previousReport = generateWeeklyReport(makeUser(), [], new Date(2024, 0, 3));
        const user = makeUser({ weeklyReports: [previousReport] });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.comparisonToPreviousWeek).toBeDefined();
        expect(['improved', 'declined', 'stable']).toContain(report.comparisonToPreviousWeek?.moodChange);
    });

    it('omits comparisonToPreviousWeek when user has no prior reports', () => {
        const report = generateWeeklyReport(makeUser(), [], REF_DATE);
        expect(report.comparisonToPreviousWeek).toBeUndefined();
    });

    it('computes average energy from energyHistory within the week', () => {
        const user = makeUser({
            energyHistory: [
                { level: 4 as const, timestamp: '2024-01-09T08:00:00Z' },
                { level: 2 as const, timestamp: '2024-01-11T08:00:00Z' },
                // outside week — should not affect average
                { level: 1 as const, timestamp: '2023-12-01T08:00:00Z' },
            ],
        });
        const report = generateWeeklyReport(user, [], REF_DATE);
        expect(report.moodTrends.energyAverage).toBe(3.0);
    });
});

// ── shouldGenerateWeeklyReport ────────────────────────────────────────────────

describe('shouldGenerateWeeklyReport', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('returns true on Sunday at 7 PM', () => {
        vi.setSystemTime(new Date(2024, 0, 14, 19, 0, 0));
        expect(shouldGenerateWeeklyReport()).toBe(true);
    });

    it('returns false on Sunday before 7 PM', () => {
        vi.setSystemTime(new Date(2024, 0, 14, 12, 0, 0));
        expect(shouldGenerateWeeklyReport()).toBe(false);
    });

    it('returns false on a weekday evening', () => {
        vi.setSystemTime(new Date(2024, 0, 10, 20, 0, 0));
        expect(shouldGenerateWeeklyReport()).toBe(false);
    });

    it('returns false at midnight Sunday (hour 0 is < 19)', () => {
        vi.setSystemTime(new Date(2024, 0, 14, 0, 0, 0));
        expect(shouldGenerateWeeklyReport()).toBe(false);
    });
});
