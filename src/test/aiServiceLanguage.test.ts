import { describe, it, expect } from 'vitest';
import { getFallbackMorningMessage } from '../utils/aiService';

describe('getFallbackMorningMessage, language regression', () => {
    const data = {
        gratitudes: ['my morning coffee'],
        affirmations: ['I am capable'],
        intention: 'presence',
    };

    it('omitting language still produces English output (pre-existing call sites are unaffected)', () => {
        const message = getFallbackMorningMessage(data);
        expect(message).toMatch(/[a-zA-Z]/);
        expect(message.toLowerCase()).not.toMatch(/\b(yo|tú|hoy soy)\b/);
    });

    it('language: "en" matches the no-language-field default exactly (same seed, deterministic)', () => {
        expect(getFallbackMorningMessage({ ...data, language: 'en' })).toBe(getFallbackMorningMessage(data));
    });

    it('language: "es" produces different, Spanish-language output', () => {
        const en = getFallbackMorningMessage(data);
        const es = getFallbackMorningMessage({ ...data, language: 'es' });
        expect(es).not.toBe(en);
        // Spanish branch should contain no em dash, consistent with the app-wide copy rule.
        expect(es).not.toMatch(/—/);
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
