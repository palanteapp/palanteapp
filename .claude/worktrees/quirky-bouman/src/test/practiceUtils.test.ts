import { describe, it, expect } from 'vitest';
import {
    initializePracticeData,
    logPractice,
    checkMilestone,
    getNextMilestone,
    getDaysDifference,
    getTodayDate,
} from '../utils/practiceUtils';

describe('getTodayDate', () => {
    it('returns a YYYY-MM-DD formatted string', () => {
        const result = getTodayDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('getDaysDifference', () => {
    it('returns 0 for the same date', () => {
        expect(getDaysDifference('2024-01-01', '2024-01-01')).toBe(0);
    });

    it('returns 1 for consecutive days', () => {
        expect(getDaysDifference('2024-01-01', '2024-01-02')).toBe(1);
    });

    it('handles order-independence', () => {
        expect(getDaysDifference('2024-01-10', '2024-01-05')).toBe(5);
    });
});

describe('initializePracticeData', () => {
    it('starts with zero total practices', () => {
        const data = initializePracticeData();
        expect(data.totalPractices).toBe(0);
    });

    it('starts with all milestones false', () => {
        const data = initializePracticeData();
        expect(data.milestones.practices_7).toBe(false);
        expect(data.milestones.practices_30).toBe(false);
        expect(data.milestones.practices_100).toBe(false);
        expect(data.milestones.practices_365).toBe(false);
    });

    it('starts with empty activity history', () => {
        const data = initializePracticeData();
        expect(data.activityHistory).toHaveLength(0);
    });
});

describe('logPractice', () => {
    it('increments totalPractices on first log', () => {
        const initial = initializePracticeData();
        const result = logPractice(initial, 'meditation');
        expect(result.totalPractices).toBe(1);
    });

    it('does not double-count the same practice type on the same day', () => {
        const initial = initializePracticeData();
        const after1 = logPractice(initial, 'meditation');
        const after2 = logPractice(after1, 'meditation');
        expect(after2.totalPractices).toBe(1);
    });

    it('counts different practice types separately on the same day', () => {
        const initial = initializePracticeData();
        const after1 = logPractice(initial, 'meditation');
        const after2 = logPractice(after1, 'breathwork');
        expect(after2.totalPractices).toBe(2);
    });

    it('updates lastActivityDate', () => {
        const initial = initializePracticeData();
        const result = logPractice(initial, 'meditation');
        expect(result.lastActivityDate).toBe(getTodayDate());
    });
});

describe('checkMilestone', () => {
    const freshMilestones = initializePracticeData().milestones;

    it('returns no milestone when under threshold', () => {
        const result = checkMilestone(5, freshMilestones);
        expect(result.milestone).toBeNull();
        expect(result.isNew).toBe(false);
    });

    it('detects the 7-practice milestone', () => {
        const result = checkMilestone(7, freshMilestones);
        expect(result.milestone).toBe('practices_7');
        expect(result.isNew).toBe(true);
    });

    it('detects the 30-practice milestone', () => {
        const result = checkMilestone(30, freshMilestones);
        expect(result.milestone).toBe('practices_30');
        expect(result.isNew).toBe(true);
    });

    it('does not re-trigger an already-reached milestone', () => {
        const result = checkMilestone(7, { ...freshMilestones, practices_7: true });
        expect(result.milestone).toBeNull();
    });

    it('prioritizes higher milestones first', () => {
        // 365 reached but not yet flagged — should return 365, not 100 or 30
        const result = checkMilestone(365, freshMilestones);
        expect(result.milestone).toBe('practices_365');
    });
});

describe('getNextMilestone', () => {
    it('returns 7 as first milestone for a new user', () => {
        const result = getNextMilestone(0);
        expect(result?.target).toBe(7);
        expect(result?.remaining).toBe(7);
    });

    it('returns null when all milestones are completed', () => {
        const result = getNextMilestone(400);
        expect(result).toBeNull();
    });

    it('calculates correct remaining count', () => {
        const result = getNextMilestone(20);
        expect(result?.target).toBe(30);
        expect(result?.remaining).toBe(10);
    });
});
