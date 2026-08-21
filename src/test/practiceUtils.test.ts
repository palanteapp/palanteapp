import { describe, it, expect, vi } from 'vitest';
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
        expect(result.data.totalPractices).toBe(1);
    });

    it('does not double-count the same practice type on the same day', () => {
        const initial = initializePracticeData();
        const after1 = logPractice(initial, 'meditation');
        const after2 = logPractice(after1.data, 'meditation');
        expect(after2.data.totalPractices).toBe(1);
    });

    it('counts different practice types separately on the same day', () => {
        const initial = initializePracticeData();
        const after1 = logPractice(initial, 'meditation');
        const after2 = logPractice(after1.data, 'breathwork');
        expect(after2.data.totalPractices).toBe(2);
    });

    it('updates lastActivityDate', () => {
        // Late evening in US Pacific: UTC has already rolled to the next day,
        // which exposes any local-vs-UTC mismatch between logPractice and getTodayDate
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T23:30:00-08:00'));
        try {
            const initial = initializePracticeData();
            const result = logPractice(initial, 'meditation');
            expect(result.data.lastActivityDate).toBe(getTodayDate());
        } finally {
            vi.useRealTimers();
        }
    });

    // Regression: logPractice's contract used to be "just return the updated data";
    // every caller then had to separately call checkMilestone with a hand-computed or
    // possibly-stale count to find out whether a milestone fired. Now logPractice
    // computes the milestone crossing itself (against the pre-call snapshot) and
    // returns it directly, so callers can't guess wrong or forget to check.
    describe('milestone result', () => {
        it('returns isNew: false and milestone: null when no threshold is crossed', () => {
            const initial = initializePracticeData();
            const result = logPractice(initial, 'meditation');
            // 1 total practice crosses the practices_1 threshold, so use a case that doesn't
            const noMilestone = logPractice(result.data, 'meditation'); // still 1 (same type, same day)
            expect(noMilestone.milestone).toBeNull();
            expect(noMilestone.isNew).toBe(false);
            expect(noMilestone.milestoneName).toBeNull();
        });

        it('returns the crossed milestone key, isNew: true, and the mapped display name', () => {
            const initial = initializePracticeData();
            const result = logPractice(initial, 'meditation');
            expect(result.milestone).toBe('practices_1');
            expect(result.isNew).toBe(true);
            expect(result.milestoneName).toBe('first');
        });

        it('does not re-report a milestone already sealed in the passed-in data', () => {
            const initial = initializePracticeData();
            const first = logPractice(initial, 'meditation');
            expect(first.milestone).toBe('practices_1');
            // Log a second, different practice type the same day -> totalPractices becomes 2,
            // still under the practices_3 threshold, and practices_1 is already sealed.
            const second = logPractice(first.data, 'breathwork');
            expect(second.milestone).toBeNull();
            expect(second.isNew).toBe(false);
        });
    });

    // Regression: logPractice used to never mark a crossed milestone as sealed, so
    // checkMilestone (which every caller runs against the pre-update snapshot) kept
    // re-detecting the same milestone as "new" on every practice after it, forever,
    // until the next threshold was crossed. Reported as "the 14-practice celebration
    // is stuck no matter how many practices I complete."
    describe('milestone sealing', () => {
        const logNDays = (n: number) => {
            let data = initializePracticeData();
            for (let day = 0; day < n; day++) {
                vi.setSystemTime(new Date(`2026-01-${String(day + 1).padStart(2, '0')}T12:00:00-08:00`));
                data = logPractice(data, 'meditation').data;
            }
            return data;
        };

        it('seals the milestone immediately on the call that crosses it', () => {
            // logPractice seals with `>=`, not `>`. All App.tsx call sites check the
            // milestone against the snapshot captured BEFORE this call runs, so sealing
            // immediately here is safe: it doesn't suppress the crossing call's own
            // celebration, and it stops the *next* call from re-detecting the same
            // milestone as new. See the "matches App.tsx call pattern" block below for
            // the regression this actually protects against (a double-fired celebration).
            vi.useFakeTimers();
            try {
                const data = logNDays(14);
                expect(data.totalPractices).toBe(14);
                expect(data.milestones.practices_14).toBe(true);
            } finally {
                vi.useRealTimers();
            }
        });

        it('seals a milestone once totalPractices has moved past it', () => {
            vi.useFakeTimers();
            try {
                const data = logNDays(15);
                expect(data.milestones.practices_14).toBe(true);
            } finally {
                vi.useRealTimers();
            }
        });

        it('stops checkMilestone from re-detecting a passed milestone as new', () => {
            vi.useFakeTimers();
            try {
                const data = logNDays(24);
                expect(data.totalPractices).toBe(24);
                expect(data.milestones.practices_14).toBe(true);

                const { milestone, isNew } = checkMilestone(data.totalPractices, data.milestones);
                expect(isNew).toBe(false);
                expect(milestone).toBeNull();
            } finally {
                vi.useRealTimers();
            }
        });
    });

    // Regression: every call site used to compute `updatedPracticeData` from `logPractice`,
    // then separately call `checkMilestone(updatedPracticeData.totalPractices,
    // currentPracticeData.milestones)` against the PRE-update snapshot, then persist
    // `updatedPracticeData` as the next call's `currentPracticeData`. With `>` sealing,
    // the just-crossed milestone stayed unsealed in that persisted state, so the very
    // next practice logged re-detected it as "new" and fired the celebration a second
    // time. logPractice now does this snapshot-vs-update check internally and returns
    // the result directly, so every call site gets it "for free" instead of hand-rolling
    // it (and risking exactly this bug). This block replicates the real call pattern -
    // logPractice(currentPracticeData, type) in a loop, using ONLY its own returned
    // milestone/isNew, never a separately-computed checkMilestone call - to prove each
    // milestone now fires exactly once.
    describe('matches App.tsx call pattern (logPractice as the single source of milestone truth)', () => {
        it('fires each milestone exactly once across consecutive practices, never twice', () => {
            vi.useFakeTimers();
            try {
                let currentPracticeData = initializePracticeData();
                const fireCounts: Record<string, number> = {};

                for (let day = 1; day <= 20; day++) {
                    vi.setSystemTime(new Date(`2026-01-${String(day).padStart(2, '0')}T12:00:00-08:00`));

                    // Exactly App.tsx's pattern post-refactor (e.g. _handlePracticeUpdate):
                    // a single logPractice() call yields both the updated data AND the
                    // milestone result, computed against the snapshot from before this call.
                    const { data: updatedPracticeData, milestone, isNew } = logPractice(currentPracticeData, 'meditation');
                    if (milestone && isNew) {
                        fireCounts[milestone] = (fireCounts[milestone] || 0) + 1;
                    }

                    // Mirrors updateProfile(updatedUser): updatedPracticeData becomes the
                    // next call's currentPracticeData.
                    currentPracticeData = updatedPracticeData;
                }

                // 20 days of one practice/day crosses 1, 3, 7, and 14 (not 30).
                expect(fireCounts.practices_1).toBe(1);
                expect(fireCounts.practices_3).toBe(1);
                expect(fireCounts.practices_7).toBe(1);
                expect(fireCounts.practices_14).toBe(1);
            } finally {
                vi.useRealTimers();
            }
        });
    });
});

describe('checkMilestone', () => {
    const freshMilestones = initializePracticeData().milestones;

    it('returns no milestone when under threshold', () => {
        const result = checkMilestone(0, freshMilestones);
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
        const result = checkMilestone(7, { ...freshMilestones, practices_1: true, practices_3: true, practices_7: true });
        expect(result.milestone).toBeNull();
    });

    it('prioritizes higher milestones first', () => {
        // 365 reached but not yet flagged: should return 365, not 100 or 30
        const result = checkMilestone(365, freshMilestones);
        expect(result.milestone).toBe('practices_365');
    });
});

describe('getNextMilestone', () => {
    it('returns 1 as first milestone for a new user', () => {
        const result = getNextMilestone(0);
        expect(result?.target).toBe(1);
        expect(result?.remaining).toBe(1);
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
