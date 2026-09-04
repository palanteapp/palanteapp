import { describe, it, expect, beforeEach } from 'vitest';
import { getFallbackMorningMessage } from '../utils/aiService';

describe('getFallbackMorningMessage, language regression', () => {
    const data = {
        gratitudes: ['my morning coffee'],
        affirmations: ['I am capable'],
        intention: 'presence',
    };

    // The fallback now nudges away from literally repeating the last message it
    // showed (see aiService.ts), tracked in localStorage — cleared here so that
    // guard can't make two same-content calls in the SAME test differ and be
    // mistaken for the language field mattering, which is what these tests
    // actually check. See the dedicated describe block below for the guard itself.
    beforeEach(() => localStorage.clear());

    it('omitting language still produces English output (pre-existing call sites are unaffected)', () => {
        const message = getFallbackMorningMessage(data);
        expect(message).toMatch(/[a-zA-Z]/);
        expect(message.toLowerCase()).not.toMatch(/\b(yo|tú|hoy soy)\b/);
    });

    it('language: "en" matches the no-language-field default exactly (same seed, deterministic)', () => {
        const withLang = getFallbackMorningMessage({ ...data, language: 'en' });
        localStorage.clear();
        expect(getFallbackMorningMessage(data)).toBe(withLang);
    });

    it('language: "es" produces different, Spanish-language output', () => {
        const en = getFallbackMorningMessage(data);
        const es = getFallbackMorningMessage({ ...data, language: 'es' });
        expect(es).not.toBe(en);
        // Spanish branch should contain no em dash, consistent with the app-wide copy rule.
        expect(es).not.toMatch(/—/);
    });
});

describe('getFallbackMorningMessage, anti-repeat guard', () => {
    const data = {
        gratitudes: ['my morning coffee'],
        affirmations: ['I am capable'],
        intention: 'presence',
    };

    beforeEach(() => localStorage.clear());

    // This is the exact user-reported bug: with AI off, the fallback is the ONLY
    // path, and its pick is otherwise deterministic on entered content — so two
    // mornings (or two rapid re-tests) with the same entries showed the literal
    // same message, reading as "is anything actually writing this?"
    it('does not literally repeat the same message on back-to-back calls with identical content', () => {
        const first = getFallbackMorningMessage(data);
        const second = getFallbackMorningMessage(data);
        expect(second).not.toBe(first);
    });

    it('a third call with identical content can repeat the first (only the IMMEDIATE repeat is guarded)', () => {
        const first = getFallbackMorningMessage(data);
        getFallbackMorningMessage(data);
        const third = getFallbackMorningMessage(data);
        expect(third).toBe(first);
    });
});

describe('getFallbackMorningMessage, field rotation regression', () => {
    // The fallback used to have a hardcoded priority (intention, then gratitude,
    // then affirmation), so whenever a user filled in an intention the fallback
    // message referenced ONLY it and gratitude/affirmation were unreachable, even
    // though both were provided. It now rotates fairly across whichever fields are
    // present, seeded on the day's own content.
    it('references gratitude and affirmation content, not just the intention, across many entries', () => {
        const n = 40;
        const results = Array.from({ length: n }, (_, i) => getFallbackMorningMessage({
            gratitudes: [`sample gratitude ${i}`],
            affirmations: [`sample affirmation ${i}`],
            intention: `sample intention ${i}`,
        }));

        const intentionHits = results.filter((m, i) => m.includes(`sample intention ${i}`)).length;
        const gratitudeHits = results.filter((m, i) => m.includes(`sample gratitude ${i}`)).length;
        const affirmationHits = results.filter((m, i) => m.includes(`I am sample affirmation ${i}`)).length;

        expect(gratitudeHits).toBeGreaterThan(0);
        expect(affirmationHits).toBeGreaterThan(0);
        expect(intentionHits).toBeGreaterThan(0);
        // Every entry resolves to exactly one of the three categories.
        expect(intentionHits + gratitudeHits + affirmationHits).toBe(n);
    });
});
