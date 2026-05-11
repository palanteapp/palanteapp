import { describe, it, expect } from 'vitest';
import { generateInviteCode, isValidInviteCode } from '../utils/inviteCodeGenerator';

describe('generateInviteCode', () => {
    it('returns a string', () => {
        expect(typeof generateInviteCode()).toBe('string');
    });

    it('has the format XXXX-XXXX (two 4-char segments separated by a dash)', () => {
        const code = generateInviteCode();
        expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });

    it('has a total length of 9 characters', () => {
        expect(generateInviteCode()).toHaveLength(9);
    });

    it('does not contain easily-confused characters (0, 1, I, O)', () => {
        // Run many times to increase confidence
        for (let i = 0; i < 200; i++) {
            const code = generateInviteCode();
            expect(code).not.toMatch(/[01IO]/);
        }
    });

    it('generates unique codes on successive calls', () => {
        const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()));
        // With ~32^8 possibilities, 50 calls should always be unique
        expect(codes.size).toBe(50);
    });

    it('generated code passes isValidInviteCode', () => {
        for (let i = 0; i < 20; i++) {
            expect(isValidInviteCode(generateInviteCode())).toBe(true);
        }
    });
});

describe('isValidInviteCode', () => {
    it('accepts a valid XXXX-XXXX code', () => {
        expect(isValidInviteCode('ABCD-2345')).toBe(true);
    });

    it('accepts a code with digits only', () => {
        expect(isValidInviteCode('2345-6789')).toBe(true);
    });

    it('accepts a code with letters only', () => {
        expect(isValidInviteCode('ABCD-EFGH')).toBe(true);
    });

    it('rejects a code missing the dash', () => {
        expect(isValidInviteCode('ABCD2345')).toBe(false);
    });

    it('rejects a code with segments that are too short', () => {
        expect(isValidInviteCode('ABC-2345')).toBe(false);
    });

    it('rejects a code with segments that are too long', () => {
        expect(isValidInviteCode('ABCDE-2345')).toBe(false);
    });

    it('rejects lowercase letters', () => {
        expect(isValidInviteCode('abcd-2345')).toBe(false);
    });

    it('rejects characters outside the A-Z / 2-9 range (e.g. 0 and 1)', () => {
        // 0 and 1 are below the '2' lower bound of the digit range
        expect(isValidInviteCode('ABCD-0123')).toBe(false);
        expect(isValidInviteCode('1111-2222')).toBe(false);
    });

    it('accepts I and O (validator is intentionally more permissive than the generator)', () => {
        // The regex [A-Z2-9] includes I and O even though the generator never
        // produces them — the validator only rejects structurally invalid codes.
        expect(isValidInviteCode('IOIO-ABCD')).toBe(true);
    });

    it('rejects an empty string', () => {
        expect(isValidInviteCode('')).toBe(false);
    });

    it('rejects three-segment codes', () => {
        expect(isValidInviteCode('ABCD-EFGH-2345')).toBe(false);
    });
});
