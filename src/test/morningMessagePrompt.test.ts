/**
 * Regression for a bug where the morning message read as if it only drew from the
 * daily intention: gratitudes and affirmations were present in the function's input
 * type but the prompt text sent to the model needs to actually weave all three in
 * (not just the intention) for the "single thread" synthesis to have anything besides
 * the intention to work with. This asserts the constructed prompt body actually
 * contains the gratitude and affirmation content, not just the intention, when all
 * three are provided.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { setAIEnabled } from '../utils/aiGate';

const mockResponse = (text: string) => ({
    ok: true,
    json: async () => ({ content: [{ text }] }),
});

describe('generateMorningPracticeMessage prompt content', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        setAIEnabled(false);
    });

    it('includes gratitude, affirmation, and intention content in the prompt sent to the model', async () => {
        setAIEnabled(true);
        const fetchSpy = vi.fn().mockResolvedValueOnce(
            mockResponse('I move through today carrying what steadies me.')
        );
        vi.stubGlobal('fetch', fetchSpy);

        const { generateMorningPracticeMessage } = await import('../utils/aiService');
        await generateMorningPracticeMessage('Mike', {
            gratitudes: ['my daughter laughing this morning'],
            affirmations: ['I follow through on what I start'],
            intention: 'finish the build',
        });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
        const prompt: string = body.messages[0].content;

        expect(prompt).toContain('my daughter laughing this morning');
        expect(prompt).toContain('I follow through on what I start');
        expect(prompt).toContain('finish the build');
    });
});
