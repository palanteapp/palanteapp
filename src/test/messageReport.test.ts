import { describe, it, expect } from 'vitest';
import { buildAiMessageReportEvent } from '../utils/messageReport';
import type { CoachSession } from '../types';

const makeSession = (): CoachSession => ({
    id: 'session-1',
    pillar: 'open',
    title: 'Chat',
    messages: [
        { id: 'm0', role: 'assistant', text: 'Hey there', timestamp: 1000 },
        { id: 'm1', role: 'user', text: 'hi', timestamp: 1001 },
        { id: 'm2', role: 'assistant', text: 'a bad reply', timestamp: 1002 },
    ],
    createdAt: 1000,
    updatedAt: 1002,
    messageCount: 2,
});

describe('buildAiMessageReportEvent', () => {
    it('captures pillar, session id, message id and index, and never the message text', () => {
        const session = makeSession();
        const event = buildAiMessageReportEvent(session, session.messages[2]);
        expect(event).toEqual({
            pillar: 'open',
            sessionId: 'session-1',
            messageId: 'm2',
            messageIndex: 2,
        });
        expect(event).not.toHaveProperty('text');
    });

    it('finds the correct index for an earlier message in the same session', () => {
        const session = makeSession();
        const event = buildAiMessageReportEvent(session, session.messages[0]);
        expect(event.messageIndex).toBe(0);
        expect(event.messageId).toBe('m0');
    });

    it('reflects the pillar of the session being reported in', () => {
        const session = { ...makeSession(), pillar: 'anxiety' as const };
        const event = buildAiMessageReportEvent(session, session.messages[2]);
        expect(event.pillar).toBe('anxiety');
    });
});
