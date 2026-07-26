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
