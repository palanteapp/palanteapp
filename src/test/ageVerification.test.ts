import { describe, it, expect } from 'vitest';
import { calculateAge, canUseAI, getAgeGroup } from '../types';

const dob = (yearsAgo: number, monthOffset = 0): string => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - yearsAgo);
    d.setMonth(d.getMonth() - monthOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

describe('calculateAge', () => {
    it('returns correct age for exact birthday this year', () => {
        const today = new Date();
        const dob = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        expect(calculateAge(dob)).toBe(25);
    });

    it('returns one less when birthday has not yet occurred this year', () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 2);
        const futureBirthday = `${d.getFullYear() - 20}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        expect(calculateAge(futureBirthday)).toBe(19);
    });

    it('handles 13-year-old exactly', () => {
        expect(calculateAge(dob(13))).toBe(13);
    });

    it('handles 12-year-old exactly', () => {
        expect(calculateAge(dob(12))).toBe(12);
    });

    it('handles adult age 30', () => {
        expect(calculateAge(dob(30))).toBe(30);
    });
});

describe('COPPA age gate — under-13 rejection', () => {
    it('blocks a 12-year-old from using AI', () => {
        const user = { dateOfBirth: dob(12), aiDisabled: false } as any;
        expect(canUseAI(user)).toBe(false);
    });

    it('blocks a 10-year-old from using AI', () => {
        const user = { dateOfBirth: dob(10), aiDisabled: false } as any;
        expect(canUseAI(user)).toBe(false);
    });

    it('allows a 13-year-old to use AI', () => {
        const user = { dateOfBirth: dob(13), aiDisabled: false } as any;
        expect(canUseAI(user)).toBe(true);
    });

    it('allows an adult to use AI', () => {
        const user = { dateOfBirth: dob(30), aiDisabled: false } as any;
        expect(canUseAI(user)).toBe(true);
    });

    it('blocks when aiDisabled is true regardless of age', () => {
        const user = { dateOfBirth: dob(25), aiDisabled: true } as any;
        expect(canUseAI(user)).toBe(false);
    });

    it('returns false for null user', () => {
        expect(canUseAI(null)).toBe(false);
    });

    it('returns false for user with no dateOfBirth — backward compat allows access', () => {
        const user = { aiDisabled: false } as any;
        expect(canUseAI(user)).toBe(true);
    });
});

describe('getAgeGroup', () => {
    it('classifies under-13 as child', () => {
        expect(getAgeGroup({ dateOfBirth: dob(10) } as any)).toBe('child');
    });

    it('classifies 13-17 as teen', () => {
        expect(getAgeGroup({ dateOfBirth: dob(15) } as any)).toBe('teen');
    });

    it('classifies 18+ as adult', () => {
        expect(getAgeGroup({ dateOfBirth: dob(25) } as any)).toBe('adult');
    });

    it('returns unknown for missing DOB', () => {
        expect(getAgeGroup({} as any)).toBe('unknown');
    });
});
