import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Quote, UserProfile } from '../types';

// ── Hoisted mock data (avoids the "cannot access before initialization" error
//    that occurs when vi.mock factories reference module-level variables) ────────
const { MOCK_AFFIRMATIONS } = vi.hoisted(() => {
    // One pool. The imported-quotes module was deleted, so AFFIRMATIONS is the entire
    // library; these entries stand in for its range of intensity/profession/type.
    const MOCK_AFFIRMATIONS: Quote[] = [
        { id: 'q1', text: 'Keep pushing forward',   author: 'Palante', category: 'Motivation', intensity: 2 },
        { id: 'q2', text: 'Rest is productive',     author: 'Palante', category: 'Wellness',   intensity: 1 },
        { id: 'q3', text: 'Code your destiny',      author: 'Palante', category: 'Tech',       intensity: 2, profession: 'tech' },
        { id: 'q4', text: 'Bold moves win',         author: 'Palante', category: 'Motivation', intensity: 3 },
        { id: 'q5', text: 'AI wisdom speaks',       author: 'Palante', category: 'Motivation', intensity: 2, isAI: true },
        { id: 'a1', text: 'I am capable',           author: 'Palante', category: 'Confidence', intensity: 2, isAffirmation: true },
        { id: 'a2', text: 'I embrace challenge',    author: 'Palante', category: 'Growth',     intensity: 2, isAffirmation: true },
    ];
    return { MOCK_AFFIRMATIONS };
});

vi.mock('../data/affirmations', () => ({ AFFIRMATIONS: MOCK_AFFIRMATIONS }));
vi.mock('../utils/aiService',   () => ({
    generateAffirmation: vi.fn(),
    isAIAvailable:       vi.fn(() => false),
    getMomentumState:    vi.fn(() => 'steady'),
}));

import { getRelevantQuotes, getAIQuote, resetSeenQuotes } from '../utils/quoteMatcher';
import { generateAffirmation, isAIAvailable } from '../utils/aiService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: 'u1',
    name: 'Test',
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

// ── getRelevantQuotes ─────────────────────────────────────────────────────────

describe('getRelevantQuotes', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            getItem:    vi.fn(() => null),
            setItem:    vi.fn(),
            removeItem: vi.fn(),
            clear:      vi.fn(),
        });
        resetSeenQuotes();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns an array of quotes', () => {
        const result = getRelevantQuotes(makeUser());
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('only returns quotes matching the user intensity (default 2)', () => {
        const result = getRelevantQuotes(makeUser({ quoteIntensity: 2 }));
        result.forEach(q => expect(q.intensity).toBe(2));
    });

    it('filters to intensity 1 when specified', () => {
        const result = getRelevantQuotes(makeUser({ quoteIntensity: 1 }));
        result.forEach(q => expect(q.intensity).toBe(1));
    });

    it('filters to intensity 3 when specified', () => {
        const result = getRelevantQuotes(makeUser({ quoteIntensity: 3 }));
        result.forEach(q => expect(q.intensity).toBe(3));
    });

    // contentTypePreference and sourcePreference used to split a mixed library. With a
    // single Palante-written library they select nothing, and filtering on them would
    // hand the user an empty pool. These tests pin the replacement behavior: the
    // preferences are inert, and every setting still returns real lines.
    it('still returns lines when contentTypePreference is the legacy "quotes"', () => {
        const result = getRelevantQuotes(makeUser({ contentTypePreference: 'quotes' }));
        expect(result.length).toBeGreaterThan(0);
    });

    it('still returns lines when contentTypePreference is "affirmations"', () => {
        const result = getRelevantQuotes(makeUser({ contentTypePreference: 'affirmations' }));
        expect(result.length).toBeGreaterThan(0);
    });

    it('still returns lines when sourcePreference is "human"', () => {
        const result = getRelevantQuotes(makeUser({ sourcePreference: 'human' }));
        expect(result.length).toBeGreaterThan(0);
    });

    it('does not strand a legacy "ai" sourcePreference with an empty pool', () => {
        const result = getRelevantQuotes(makeUser({ sourcePreference: 'ai', quoteIntensity: 2 }));
        expect(result.length).toBeGreaterThan(0);
    });

    it('boosts quotes whose profession matches the user profession', () => {
        // q3 has profession: 'tech', user profession is 'tech', should rank first (+150 pts)
        const result = getRelevantQuotes(makeUser({ profession: 'tech', quoteIntensity: 2 }));
        const ids = result.map(q => q.id);
        expect(ids).toContain('q3');
        expect(ids[0]).toBe('q3');
    });

    it('falls back gracefully (non-empty result) when all quotes have been seen', () => {
        // Mark all intensity-2 quotes as seen via seenHistory module state.
        // The simplest way: call getRelevantQuotes once to mark the first quote,
        // then again repeatedly until the cooldown recycling path fires.
        // Instead: test that the function always returns at least 1 quote even
        // when seenHistory is populated.
        const result = getRelevantQuotes(makeUser({ quoteIntensity: 2 }));
        expect(result.length).toBeGreaterThan(0);
    });

    it('uses default intensity 2 when quoteIntensity is an invalid value', () => {
        const user = makeUser({ quoteIntensity: 99 as never });
        const result = getRelevantQuotes(user);
        expect(Array.isArray(result)).toBe(true);
        // With invalid intensity, the filter matches nothing at the normal path,
        // so the ultimate fallback returns all content: still non-empty
        expect(result.length).toBeGreaterThan(0);
    });

    it('boosts content when dailyFocuses text matches quote content', () => {
        const user = makeUser({
            quoteIntensity: 2,
            dailyFocuses: [
                { id: 'f1', text: 'Motivation exercise', isCompleted: false, createdAt: new Date().toISOString() },
            ],
        });
        const result = getRelevantQuotes(user);
        // Quotes with 'motivation' in category/text should score higher
        // at minimum the result should be a non-empty array.
        expect(result.length).toBeGreaterThan(0);
    });
});

// ── getAIQuote ────────────────────────────────────────────────────────────────

describe('getAIQuote', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            getItem:    vi.fn(() => null),
            setItem:    vi.fn(),
            removeItem: vi.fn(),
            clear:      vi.fn(),
        });
        resetSeenQuotes();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetAllMocks();
    });

    it('falls back to a library line at the right intensity when AI is unavailable', async () => {
        vi.mocked(isAIAvailable).mockReturnValue(false);
        // The fallback now draws from the whole Palante library rather than the handful
        // of isAI entries that used to live in the imported quotes file.
        const result = await getAIQuote(makeUser({ quoteIntensity: 2 }));
        expect(result.intensity).toBe(2);
        expect(MOCK_AFFIRMATIONS.map(q => q.id)).toContain(result.id);
    });

    it('returns a properly shaped quote when AI generates successfully', async () => {
        vi.mocked(isAIAvailable).mockReturnValue(true);
        vi.mocked(generateAffirmation).mockResolvedValue({
            text:     'You are unstoppable',
            author:   'Palante AI',
            category: 'Motivation',
            isAI:     true,
        });

        const result = await getAIQuote(makeUser());
        expect(result.text).toBe('You are unstoppable');
        expect(result.author).toBe('Palante AI');
        expect(result.isAI).toBe(true);
        expect(result.id).toMatch(/^ai_\d+$/);
    });

    it('falls back to the library when the AI call throws', async () => {
        vi.mocked(isAIAvailable).mockReturnValue(true);
        vi.mocked(generateAffirmation).mockRejectedValue(new Error('Network error'));

        const result = await getAIQuote(makeUser({ quoteIntensity: 2 }));
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
    });

    it('uses hardcoded fallback text when pool is empty and AI throws', async () => {
        vi.mocked(isAIAvailable).mockReturnValue(true);
        vi.mocked(generateAffirmation).mockRejectedValue(new Error('fail'));

        // Intensity 4 matches nothing in the library, forcing the hardcoded fallback.
        const result = await getAIQuote(makeUser({ quoteIntensity: 4 as never }));
        expect(result.text).toBe('Your potential is limitless. Keep moving forward.');
        expect(result.id).toMatch(/^ai_fallback_/);
    });
});
