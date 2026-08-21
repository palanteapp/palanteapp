import { describe, it, expect } from 'vitest';
import { isConfirmedUnder13 } from '../utils/ageRangeGate';
import type { AgeRangeResult } from '../plugins/PalanteAgeRangeBridge';

describe('isConfirmedUnder13', () => {
    it('blocks when the OS reports an upper bound under 13', () => {
        const result: AgeRangeResult = { outcome: 'shared', upperBound: 12 };
        expect(isConfirmedUnder13(result)).toBe(true);
    });

    it('does not block a shared range at exactly 13 (lower bound only, no upper bound)', () => {
        const result: AgeRangeResult = { outcome: 'shared', lowerBound: 13 };
        expect(isConfirmedUnder13(result)).toBe(false);
    });

    it('blocks an ambiguous upper bound of exactly 13 (deliberately conservative, pending real-device confirmation of Apple\'s bucket semantics)', () => {
        const result: AgeRangeResult = { outcome: 'shared', upperBound: 13 };
        expect(isConfirmedUnder13(result)).toBe(true);
    });

    it('does not block a shared range above 13 with no upper bound (open-ended adult bucket)', () => {
        const result: AgeRangeResult = { outcome: 'shared', lowerBound: 18 };
        expect(isConfirmedUnder13(result)).toBe(false);
    });

    it('does not block a shared range with neither bound present', () => {
        const result: AgeRangeResult = { outcome: 'shared' };
        expect(isConfirmedUnder13(result)).toBe(false);
    });

    it('does not block when the user declined to share', () => {
        const result: AgeRangeResult = { outcome: 'declined' };
        expect(isConfirmedUnder13(result)).toBe(false);
    });

    it('does not block when the API is unavailable (older iOS, Simulator, Android, web)', () => {
        const result: AgeRangeResult = { outcome: 'unavailable' };
        expect(isConfirmedUnder13(result)).toBe(false);
    });
});
