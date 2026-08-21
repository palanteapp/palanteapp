import type { ChatMessage, CoachSession } from '../types';

export interface AiMessageReportEvent {
    pillar: string;
    sessionId: string;
    messageId: string;
    messageIndex: number;
}

/**
 * Builds the analytics payload for a user flagging an AI-generated reply as
 * bad or harmful. This is the AI-output counterpart to the human-partner
 * report flow in Profile.tsx (handleReportPartner) — App Store 1.4/4.3 expect
 * a visible way to flag a bad AI reply, separate from reporting a person.
 *
 * Deliberately excludes the message text: analytics.ts never logs raw
 * user/AI-generated content elsewhere (quoteFavorited logs a quoteId, not the
 * quote text; goalCreated logs a category, not the goal text), so this
 * follows the same precedent. The session id + message id + index are enough
 * to locate the full message locally if real moderation follow-up is ever
 * needed, without putting conversation content into the analytics pipeline.
 */
export function buildAiMessageReportEvent(session: CoachSession, message: ChatMessage): AiMessageReportEvent {
    return {
        pillar: session.pillar,
        sessionId: session.id,
        messageId: message.id,
        messageIndex: session.messages.findIndex(m => m.id === message.id),
    };
}
