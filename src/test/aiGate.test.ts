/**
 * The AI opt-out is a promise we make to the user in the disclosure shown on first
 * launch: turn the toggle off and nothing you write is sent to a model provider.
 *
 * These tests assert that promise at the only level that matters, the network. Each
 * one turns the gate off, calls a real AI entry point, and fails if `fetch` was
 * touched. They deliberately do not mock the AI modules; mocking them would test the
 * mock rather than the guard.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setAIEnabled, isAIEnabled, assertAIEnabled, isAIDisabledError, AIDisabledError } from '../utils/aiGate';

const fetchSpy = vi.fn();

beforeEach(() => {
    fetchSpy.mockReset();
    fetchSpy.mockRejectedValue(new Error('network should not be reached'));
    vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
    vi.unstubAllGlobals();
    setAIEnabled(false);
});

describe('aiGate', () => {
    it('defaults to disabled so a cold start cannot leak a request', async () => {
        vi.resetModules();
        const fresh = await import('../utils/aiGate');
        expect(fresh.isAIEnabled()).toBe(false);
    });

    it('reflects what setAIEnabled was given', () => {
        setAIEnabled(true);
        expect(isAIEnabled()).toBe(true);
        setAIEnabled(false);
        expect(isAIEnabled()).toBe(false);
    });

    it('assertAIEnabled throws a recognizable error when off', () => {
        setAIEnabled(false);
        expect(() => assertAIEnabled()).toThrow(AIDisabledError);
        try {
            assertAIEnabled();
        } catch (e) {
            expect(isAIDisabledError(e)).toBe(true);
        }
    });

    it('assertAIEnabled is a no-op when on', () => {
        setAIEnabled(true);
        expect(() => assertAIEnabled()).not.toThrow();
    });

    it('isAIDisabledError ignores unrelated failures', () => {
        expect(isAIDisabledError(new Error('offline'))).toBe(false);
        expect(isAIDisabledError(null)).toBe(false);
        expect(isAIDisabledError(undefined)).toBe(false);
    });
});

describe('no user text reaches the network while AI is disabled', () => {
    beforeEach(() => setAIEnabled(false));

    it('partner chat falls back without calling the proxy', async () => {
        const { chatWithCoach } = await import('../utils/aiService');
        const reply = await chatWithCoach('I have been struggling this week', [], {
            userName: 'Mike',
            profession: '',
            focusGoal: '',
        } as never);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(typeof reply).toBe('string');
        expect(reply.length).toBeGreaterThan(0);
    });

    it('morning message falls back without calling the proxy', async () => {
        const { generateMorningPracticeMessage } = await import('../utils/aiService');
        const message = await generateMorningPracticeMessage('Mike', {
            gratitudes: ['my daughter'],
            affirmations: ['I follow through'],
            intention: 'finish the build',
        } as never);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
    });

    it('evening message falls back without calling the proxy', async () => {
        const { generateEveningPracticeMessage } = await import('../utils/aiService');
        const message = await generateEveningPracticeMessage('Mike', {
            gratitude: 'quiet morning',
            learning: 'ask sooner',
            accomplishment: 'shipped the gate',
            delight: 'coffee outside',
        } as never);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
    });

    it('weekly reflection falls back without calling the proxy', async () => {
        const { generateWeeklyReflection } = await import('../utils/aiService');
        const text = await generateWeeklyReflection(['shipped the gate', 'ran five miles'], 'Mike');

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(typeof text).toBe('string');
    });

    it('weekly partner letter falls back without calling the proxy', async () => {
        const { generateWeeklyLetter } = await import('../utils/weeklyLetter');
        const letter = await generateWeeklyLetter({
            id: 'u1',
            name: 'Mike Vargas',
            coachName: 'Palante',
            streak: 4,
            goals: [],
            interests: [],
        } as never);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(typeof letter).toBe('string');
        expect(letter.length).toBeGreaterThan(0);
    });
});
