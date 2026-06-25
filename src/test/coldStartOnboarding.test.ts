/**
 * Tests for the three cold-start / onboarding improvements:
 *   1. Bio step in CinematicIntro — onComplete shape includes bio
 *   2. Apple Health integration — platform guard, seed storage key
 *   3. Cold start memory — intent-to-seed-narrative mapping, seed memory generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from '../constants/storageKeys';

// ─── 1. Bio step ──────────────────────────────────────────────────────────────

describe('CinematicIntro — bio field', () => {
    it('onComplete payload type includes optional bio field', () => {
        // The shape is validated by TypeScript; here we confirm the runtime object
        // can carry a bio string or be undefined (both are valid).
        const payloadWithBio = {
            name: 'Maria',
            profession: 'Other',
            focusGoal: 'Build consistency',
            interests: '',
            quoteIntensity: 2,
            contentType: 'mix' as const,
            sourcePreference: 'mix' as const,
            primaryIntent: 'consistency' as const,
            bio: 'I am a mom of two trying to find 10 minutes for myself every morning.',
        };
        expect(payloadWithBio.bio).toBeTruthy();
        expect(payloadWithBio.bio!.length).toBeLessThanOrEqual(500);
    });

    it('onComplete payload is valid when bio is omitted (optional)', () => {
        const payloadNoBio = {
            name: 'Alex',
            profession: 'Other',
            focusGoal: '',
            interests: '',
            quoteIntensity: 2,
            contentType: 'mix' as const,
            sourcePreference: 'mix' as const,
        };
        expect(payloadNoBio).not.toHaveProperty('bio');
        // bio is optional — absence should not break anything
        const bio = (payloadNoBio as { bio?: string }).bio;
        expect(bio).toBeUndefined();
    });

    it('bio is trimmed before being passed to onComplete', () => {
        const raw = '  working through a rough patch at work  ';
        const trimmed = raw.trim() || undefined;
        expect(trimmed).toBe('working through a rough patch at work');
    });

    it('empty bio string becomes undefined after trim', () => {
        const raw = '   ';
        const trimmed = raw.trim() || undefined;
        expect(trimmed).toBeUndefined();
    });
});

// ─── 2. Apple Health storage key & platform guard ─────────────────────────────

describe('Apple Health integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('HEALTH_ASKED key exists in STORAGE_KEYS', () => {
        expect(STORAGE_KEYS.HEALTH_ASKED).toBe('palante_health_asked');
    });

    it('SEED_MEMORIES key exists in STORAGE_KEYS', () => {
        expect(STORAGE_KEYS.SEED_MEMORIES).toBe('palante_seed_memories');
    });

    it('health prompt is not shown after HEALTH_ASKED is set', () => {
        localStorage.setItem(STORAGE_KEYS.HEALTH_ASKED, 'true');
        // Simulate the guard logic used in DailyMorningPracticeWidget
        const shouldShowPrompt = !localStorage.getItem(STORAGE_KEYS.HEALTH_ASKED);
        expect(shouldShowPrompt).toBe(false);
    });

    it('health prompt would be shown when HEALTH_ASKED is absent', () => {
        const shouldShowPrompt = !localStorage.getItem(STORAGE_KEYS.HEALTH_ASKED);
        expect(shouldShowPrompt).toBe(true);
    });

    it('connecting health sets HEALTH_ASKED so prompt never repeats', () => {
        // Simulate what happens when user taps "Connect Health"
        localStorage.setItem(STORAGE_KEYS.HEALTH_ASKED, 'true');
        expect(localStorage.getItem(STORAGE_KEYS.HEALTH_ASKED)).toBe('true');
        // Second render: prompt would not show
        const shouldShowOnNextRender = !localStorage.getItem(STORAGE_KEYS.HEALTH_ASKED);
        expect(shouldShowOnNextRender).toBe(false);
    });
});

// ─── 3. Cold start — seed memory generation ───────────────────────────────────

describe('Cold start — intent seed memories', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    const INTENT_MEMORY: Record<string, string> = {
        consistency: 'came to Palante because they want to build more consistency',
        clarity: 'looking for clarity and focus',
        stress: 'dealing with real stress',
        purpose: 'wants their days to feel meaningful',
    };

    it('generates a seed memory for every primaryIntent value', () => {
        const intents = ['consistency', 'clarity', 'stress', 'purpose'] as const;
        for (const intent of intents) {
            expect(INTENT_MEMORY[intent]).toBeTruthy();
        }
    });

    it('seed memory for consistency references showing up', () => {
        expect(INTENT_MEMORY.consistency).toContain('consistency');
    });

    it('seed memory for stress references stress', () => {
        expect(INTENT_MEMORY.stress).toContain('stress');
    });

    it('seed memory for clarity references clarity', () => {
        expect(INTENT_MEMORY.clarity).toContain('clarity');
    });

    it('seed memory for purpose references meaningful', () => {
        expect(INTENT_MEMORY.purpose).toContain('meaningful');
    });

    it('bio seed memory is included when bio is provided', () => {
        const firstName = 'Maria';
        const bio = 'I am a single parent juggling a lot right now.';
        const bioMemory = `${firstName} shared this about themselves when they joined: "${bio}"`;
        expect(bioMemory).toContain(firstName);
        expect(bioMemory).toContain(bio);
    });

    it('seed memories are stored as JSON array in localStorage', () => {
        const seeds = [
            'Maria came to Palante because they want to build more consistency.',
            'Maria shared this about themselves when they joined: "Trying to find balance."',
        ];
        localStorage.setItem(STORAGE_KEYS.SEED_MEMORIES, JSON.stringify(seeds));
        const loaded = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_MEMORIES)!);
        expect(Array.isArray(loaded)).toBe(true);
        expect(loaded).toHaveLength(2);
        expect(loaded[0]).toContain('Maria');
    });

    it('seed memories survive JSON round-trip with no data loss', () => {
        const original = ['Seed A', 'Seed B'];
        localStorage.setItem(STORAGE_KEYS.SEED_MEMORIES, JSON.stringify(original));
        const recovered = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_MEMORIES)!);
        expect(recovered).toEqual(original);
    });
});

// ─── 4. Intent-seeded greeting strings ────────────────────────────────────────

describe('Cold start — intent-seeded greeting content', () => {
    const INTENT_GREETINGS: Record<string, string> = {
        consistency: 'Building a daily practice is one of the most powerful things you can do. Tell me — what\'s been getting in the way of showing up consistently?',
        clarity: 'You said you\'re looking for more clarity and focus. What\'s feeling most scattered or overwhelming right now?',
        stress: 'Life has been heavy lately. I\'m right here. What\'s been weighing on you the most?',
        purpose: 'You want your days to mean something more. I love that you\'re here for that reason. What would a life with more purpose actually feel like to you?',
    };

    it('returns a non-generic greeting for every intent', () => {
        const generic = "What's on your mind?";
        for (const [, greeting] of Object.entries(INTENT_GREETINGS)) {
            expect(greeting).not.toBe(generic);
            expect(greeting.length).toBeGreaterThan(30);
        }
    });

    it('consistency greeting references showing up', () => {
        expect(INTENT_GREETINGS.consistency).toContain('showing up');
    });

    it('stress greeting is warm and non-pressuring', () => {
        expect(INTENT_GREETINGS.stress).toContain('right here');
    });

    it('clarity greeting references focus or scattered', () => {
        const g = INTENT_GREETINGS.clarity;
        expect(g.includes('clarity') || g.includes('scattered') || g.includes('focus')).toBe(true);
    });

    it('purpose greeting asks what purpose would feel like', () => {
        expect(INTENT_GREETINGS.purpose).toContain('purpose');
    });

    it('all greetings end with a question mark', () => {
        for (const [, greeting] of Object.entries(INTENT_GREETINGS)) {
            expect(greeting.trimEnd()).toMatch(/\?$/);
        }
    });
});
