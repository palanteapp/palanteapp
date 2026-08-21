/**
 * Regression for a gap in generateWeeklyReflection's retry guard: its prompt bans
 * "show up"/"showed up"/etc (the same list every other generator enforces via
 * containsBannedPhrase), but the function never actually checked for it, so a banned
 * phrase from the model shipped straight to the user instead of triggering a retry.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setAIEnabled } from '../utils/aiGate';

const mockResponse = (text: string) => ({
    ok: true,
    json: async () => ({ content: [{ text }] }),
});

describe('generateWeeklyReflection banned-phrase retry', () => {
    beforeEach(() => setAIEnabled(true));
    afterEach(() => {
        vi.unstubAllGlobals();
        setAIEnabled(false);
    });

    it('retries once when the first response uses a banned phrase, and returns the clean retry', async () => {
        const fetchSpy = vi.fn()
            .mockResolvedValueOnce(mockResponse('You showed up this week. That is the whole game.'))
            .mockResolvedValueOnce(mockResponse('You closed out real work this week and kept your word to yourself.'));
        vi.stubGlobal('fetch', fetchSpy);

        const { generateWeeklyReflection } = await import('../utils/aiService');
        const text = await generateWeeklyReflection(['shipped the gate', 'ran five miles'], 'Mike');

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(text.toLowerCase()).not.toMatch(/show(ed|ing)? up/);
        expect(text).toBe('You closed out real work this week and kept your word to yourself.');
    });

    it('falls back to the static reflection if the retry still uses a banned phrase', async () => {
        const fetchSpy = vi.fn()
            .mockResolvedValueOnce(mockResponse('You showed up this week. That is the whole game.'))
            .mockResolvedValueOnce(mockResponse('Showing up again this week is what matters most.'));
        vi.stubGlobal('fetch', fetchSpy);

        const { generateWeeklyReflection } = await import('../utils/aiService');
        const text = await generateWeeklyReflection(['shipped the gate'], 'Mike');

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(text.toLowerCase()).not.toMatch(/show(ed|ing)? up/);
    });

    it('returns a clean first response as-is, with no retry', async () => {
        const fetchSpy = vi.fn()
            .mockResolvedValueOnce(mockResponse('You closed out real work this week and kept your word to yourself.'));
        vi.stubGlobal('fetch', fetchSpy);

        const { generateWeeklyReflection } = await import('../utils/aiService');
        const text = await generateWeeklyReflection(['shipped the gate'], 'Mike');

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(text).toBe('You closed out real work this week and kept your word to yourself.');
    });
});
