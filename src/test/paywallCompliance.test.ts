import { describe, it, expect } from 'vitest';
import { FEATURES, AI_DISCLOSURE, SUBSCRIPTION_TERMS } from '../components/PaywallScreen';

describe('PaywallScreen — Apple compliance constants', () => {
    describe('FEATURES list', () => {
        it('is non-empty', () => {
            expect(FEATURES.length).toBeGreaterThan(0);
        });

        it('mentions AI explicitly so users know the feature is AI-powered', () => {
            const hasAI = FEATURES.some(f => /\bai\b/i.test(f));
            expect(hasAI).toBe(true);
        });

        it('all entries are non-empty strings', () => {
            FEATURES.forEach(f => {
                expect(typeof f).toBe('string');
                expect(f.trim().length).toBeGreaterThan(0);
            });
        });
    });

    describe('AI_DISCLOSURE — Guideline 2.5 / AI content transparency', () => {
        it('is a non-empty string', () => {
            expect(typeof AI_DISCLOSURE).toBe('string');
            expect(AI_DISCLOSURE.trim().length).toBeGreaterThan(0);
        });

        it('mentions AI', () => {
            expect(/\bai\b/i.test(AI_DISCLOSURE)).toBe(true);
        });

        it('mentions personalization or user entries', () => {
            expect(/personaliz|entries|journal/i.test(AI_DISCLOSURE)).toBe(true);
        });
    });

    describe('SUBSCRIPTION_TERMS — Guideline 3.1.2 / 5.1.1(v)', () => {
        it('is a non-empty string', () => {
            expect(typeof SUBSCRIPTION_TERMS).toBe('string');
            expect(SUBSCRIPTION_TERMS.trim().length).toBeGreaterThan(0);
        });

        it('states billing is through Apple', () => {
            expect(/apple/i.test(SUBSCRIPTION_TERMS)).toBe(true);
        });

        it('states subscription renews automatically', () => {
            expect(/renew/i.test(SUBSCRIPTION_TERMS)).toBe(true);
        });

        it('states user can cancel', () => {
            expect(/cancel/i.test(SUBSCRIPTION_TERMS)).toBe(true);
        });
    });
});
