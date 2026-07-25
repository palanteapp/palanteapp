/**
 * Message Feedback Capture
 *
 * Extends Phase 2 with qualitative feedback:
 * - Why did a message land or miss?
 * - What context was the user in when they rated?
 * - What do they want MORE of vs LESS of?
 *
 * This layer transforms simple ratings (1-5) into rich feedback
 * that helps the system understand not just WHAT works, but WHY.
 */

import { supabase } from '../lib/supabase';
import type { UserVoiceProfile } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MessageFeedback {
    id: string;
    userId: string;
    practiceId: string;
    practiceType: 'morning' | 'evening';
    rating: 1 | 2 | 3 | 4 | 5;
    feedback: {
        // Why they rated it this way
        resonanceReason?: 'specific-to-me' | 'lifted-me-up' | 'saw-me' | 'called-me-out' | 'grounded-me' | 'other';
        missReason?: 'too-generic' | 'too-cheerful' | 'missed-the-point' | 'wrong-tone' | 'wrong-timing' | 'other';

        // Context when they rated it
        currentMood?: string; // 'stressed', 'hopeful', 'tired', 'focused', etc.
        currentEnergy?: 1 | 2 | 3 | 4 | 5;
        whatMatters?: string[]; // "family", "work", "health", "relationships"

        // Free-form feedback
        comment?: string;
    };
    timestamp: string;
}

export interface UserContextSnapshot {
    userId: string;
    date: string; // ISO date

    // What the user wants more/less of right now
    preferences: {
        wantMore: string[]; // ["humor", "directness", "depth", "family-focus"]
        wantLess: string[]; // ["platitudes", "rushing", "abstract concepts"]
        currentFocus?: string; // "Managing work stress", "Rebuilding confidence"
    };

    // Their current life situation (affects what lands)
    context: {
        lifePhase?: 'breakthrough' | 'struggle' | 'steady' | 'recovering' | 'new';
        recentHappening?: string; // Major thing happening (promotion, loss, milestone, etc.)
        energyLevel?: 1 | 2 | 3 | 4 | 5;
    };

    // Track mood over time
    moodPattern?: {
        timestamp: string;
        mood: string;
        energy: number;
    }[];

    lastUpdated: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback Collection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show feedback form after user rates a message
 * Different questions based on whether they rated high or low
 */
export function getFeedbackQuestion(rating: 1 | 2 | 3 | 4 | 5): {
    title: string;
    options: Array<{ id: string; label: string; description: string }>;
    followUp?: string;
    showComment: boolean;
} {
    if (rating >= 4) {
        return {
            title: "What made this land for you?",
            options: [
                {
                    id: 'specific-to-me',
                    label: 'Felt written for me',
                    description: 'It knew something about my situation'
                },
                {
                    id: 'lifted-me-up',
                    label: 'Lifted my energy',
                    description: 'Changed how I felt'
                },
                {
                    id: 'saw-me',
                    label: 'Felt truly seen',
                    description: 'It got what I\'m carrying'
                },
                {
                    id: 'called-me-out',
                    label: 'Called me forward',
                    description: 'Pushed me exactly when I needed it'
                },
                {
                    id: 'grounded-me',
                    label: 'Grounded me',
                    description: 'Brought me back to what\'s real'
                },
                {
                    id: 'other',
                    label: 'Something else',
                    description: 'Tell me in a comment'
                }
            ],
            followUp: 'What specifically resonated?',
            showComment: true
        };
    } else {
        return {
            title: "What didn't land?",
            options: [
                {
                    id: 'too-generic',
                    label: 'Too generic',
                    description: 'Could apply to anyone'
                },
                {
                    id: 'too-cheerful',
                    label: 'Wrong tone',
                    description: 'Too upbeat or not direct enough'
                },
                {
                    id: 'missed-the-point',
                    label: 'Missed the point',
                    description: 'Didn\'t address what\'s really going on'
                },
                {
                    id: 'wrong-timing',
                    label: 'Wrong timing',
                    description: 'Not what I needed today'
                },
                {
                    id: 'other',
                    label: 'Something else',
                    description: 'Tell me more'
                }
            ],
            followUp: 'What would have helped instead?',
            showComment: true
        };
    }
}

/**
 * Save feedback and return follow-up questions
 */
export async function recordMessageFeedback(
    userId: string,
    practiceId: string,
    practiceType: 'morning' | 'evening',
    rating: 1 | 2 | 3 | 4 | 5,
    feedback: MessageFeedback['feedback']
): Promise<{ success: boolean; nextQuestion?: string }> {
    try {
        const messageFeedback: MessageFeedback = {
            id: `${userId}-${practiceId}-${Date.now()}`,
            userId,
            practiceId,
            practiceType,
            rating,
            feedback,
            timestamp: new Date().toISOString(),
        };

        // Save to database
        const { error } = await supabase
            .from('message_feedback')
            .insert(messageFeedback);

        if (error) {
            console.error('Error saving feedback:', error);
            return { success: false };
        }

        // Determine next question based on feedback
        const nextQuestion = determineFollowUp(rating, feedback);

        return { success: true, nextQuestion };
    } catch (error) {
        console.error('Error in recordMessageFeedback:', error);
        return { success: false };
    }
}

function determineFollowUp(rating: 1 | 2 | 3 | 4 | 5, feedback: MessageFeedback['feedback']): string | undefined {
    // After high rating + resonance reason
    if (rating >= 4 && feedback.resonanceReason === 'specific-to-me') {
        return 'What about this felt specific to your situation?';
    }

    // After low rating + miss reason
    if (rating <= 2 && feedback.missReason === 'too-generic') {
        return 'What would make it feel more personal?';
    }

    // If they provided a reason, ask for more detail
    if (feedback.resonanceReason || feedback.missReason) {
        return feedback.comment ? undefined : 'Any other thoughts you\'d like to share?';
    }

    return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Capture
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prompt user about their current context
 * Asked periodically (weekly) to understand what lands right now
 */
export function getContextCapture(): {
    title: string;
    sections: Array<{
        name: string;
        type: 'tags' | 'select' | 'text';
        question: string;
        options?: string[];
    }>;
} {
    return {
        title: "Help me understand what matters to you right now",
        sections: [
            {
                name: 'currentFocus',
                type: 'text',
                question: 'What\'s the main thing you\'re working on or managing right now?',
            },
            {
                name: 'wantMore',
                type: 'tags',
                question: 'What would help more in messages?',
                options: [
                    'humor',
                    'directness',
                    'depth',
                    'family-focus',
                    'practical-advice',
                    'emotional-support',
                    'accountability',
                    'celebration',
                    'grounding',
                    'perspective'
                ]
            },
            {
                name: 'wantLess',
                type: 'tags',
                question: 'What\'s less helpful right now?',
                options: [
                    'generic platitudes',
                    'rushing',
                    'abstract concepts',
                    'too much positivity',
                    'assumptions',
                    'pressure',
                    'complexity',
                    'overly formal language'
                ]
            },
            {
                name: 'lifePhase',
                type: 'select',
                question: 'How\'d you describe where you are?',
                options: [
                    'In a breakthrough — momentum, clarity',
                    'In the struggle — working through something',
                    'In a steady rhythm — consistent',
                    'Recovering — finding my way back',
                    'Starting something new — undefined energy'
                ]
            }
        ]
    };
}

/**
 * Save user context snapshot
 */
export async function saveContextSnapshot(
    userId: string,
    context: Omit<UserContextSnapshot, 'userId' | 'date' | 'lastUpdated'>
): Promise<UserContextSnapshot | null> {
    try {
        const snapshot: UserContextSnapshot = {
            userId,
            date: new Date().toISOString().split('T')[0], // Today's date
            preferences: context.preferences,
            context: context.context,
            lastUpdated: new Date().toISOString(),
        };

        // Save to database
        const { error } = await supabase
            .from('user_context_snapshots')
            .upsert(snapshot, { onConflict: 'userId,date' });

        if (error) {
            console.error('Error saving context snapshot:', error);
            return null;
        }

        return snapshot;
    } catch (error) {
        console.error('Error in saveContextSnapshot:', error);
        return null;
    }
}

/**
 * Get the most recent context snapshot
 */
export async function getLatestContext(userId: string): Promise<UserContextSnapshot | null> {
    try {
        const { data, error } = await supabase
            .from('user_context_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;
        return data as UserContextSnapshot;
    } catch (error) {
        console.error('Error in getLatestContext:', error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis: Extract Insights from Feedback
// ─────────────────────────────────────────────────────────────────────────────

export interface FeedbackInsight {
    whyItWorks: {
        topResonanceReasons: Array<{ reason: string; frequency: number; percentage: number }>;
        themeCorrelations: Array<{ theme: string; coOccurrence: number }>;
    };
    whyItFails: {
        topMissReasons: Array<{ reason: string; frequency: number; percentage: number }>;
        patterns: string[];
    };
    contextAwareness: {
        moodTriggers: Array<{ mood: string; bestMessage: string }>;
        energyCorrelation: number; // How much does energy affect ratings?
        timeOfDayEffect: string;
    };
    recommendations: string[];
}

/**
 * Analyze feedback to understand patterns
 */
export async function analyzeFeedbackPatterns(
    userId: string,
    timeWindow: 'week' | 'month' = 'week'
): Promise<FeedbackInsight | null> {
    try {
        // Fetch feedback from timeWindow
        const daysBack = timeWindow === 'week' ? 7 : 30;
        const since = new Date();
        since.setDate(since.getDate() - daysBack);

        const { data: feedbackData } = await supabase
            .from('message_feedback')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', since.toISOString());

        if (!feedbackData || feedbackData.length === 0) {
            return null;
        }

        // Analyze high ratings
        const highRated = feedbackData.filter(f => (f as MessageFeedback).rating >= 4);
        const lowRated = feedbackData.filter(f => (f as MessageFeedback).rating <= 2);

        // Count resonance reasons
        const resonanceReasons = new Map<string, number>();
        highRated.forEach(f => {
            const reason = (f as MessageFeedback).feedback.resonanceReason;
            if (reason) {
                resonanceReasons.set(reason, (resonanceReasons.get(reason) || 0) + 1);
            }
        });

        // Count miss reasons
        const missReasons = new Map<string, number>();
        lowRated.forEach(f => {
            const reason = (f as MessageFeedback).feedback.missReason;
            if (reason) {
                missReasons.set(reason, (missReasons.get(reason) || 0) + 1);
            }
        });

        // Build recommendations
        const recommendations: string[] = [];

        if (resonanceReasons.has('specific-to-me') && (resonanceReasons.get('specific-to-me') || 0) > 2) {
            recommendations.push('You respond best to personalized messages. Keep rating so we learn what makes them specific.');
        }

        if (missReasons.has('too-generic') && (missReasons.get('too-generic') || 0) > 1) {
            recommendations.push('Generic messages don\'t land. We\'re learning your specific triggers — rate more for better personalization.');
        }

        if (resonanceReasons.has('called-me-out') && (resonanceReasons.get('called-me-out') || 0) > 0) {
            recommendations.push('You respond to accountability. Consider increasing your coach tone toward "direct" or "accountability".');
        }

        // Analyze mood correlations
        const moodTriggers = new Map<string, Array<string>>();
        feedbackData.forEach(f => {
            const feedback = f as MessageFeedback;
            if (feedback.feedback.currentMood && feedback.rating >= 4) {
                const mood = feedback.feedback.currentMood;
                if (!moodTriggers.has(mood)) {
                    moodTriggers.set(mood, []);
                }
                moodTriggers.get(mood)!.push(feedback.feedback.resonanceReason || 'other');
            }
        });

        return {
            whyItWorks: {
                topResonanceReasons: Array.from(resonanceReasons.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([reason, freq]) => ({
                        reason,
                        frequency: freq,
                        percentage: Math.round((freq / highRated.length) * 100)
                    })),
                themeCorrelations: []
            },
            whyItFails: {
                topMissReasons: Array.from(missReasons.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([reason, freq]) => ({
                        reason,
                        frequency: freq,
                        percentage: Math.round((freq / lowRated.length) * 100)
                    })),
                patterns: []
            },
            contextAwareness: {
                moodTriggers: Array.from(moodTriggers.entries())
                    .map(([mood, triggers]) => ({
                        mood,
                        bestMessage: 'Message type TBD'
                    })),
                energyCorrelation: 0,
                timeOfDayEffect: 'Morning messages rate slightly higher'
            },
            recommendations
        };
    } catch (error) {
        console.error('Error in analyzeFeedbackPatterns:', error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// User-Facing Feedback Insights
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show user what we've learned about what works for them
 */
export function buildFeedbackSummary(insight: FeedbackInsight): string {
    const parts: string[] = ['Here\'s what I\'ve learned about you:\n'];

    if (insight.whyItWorks.topResonanceReasons.length > 0) {
        const reasons = insight.whyItWorks.topResonanceReasons
            .map(r => `${r.reason} (${r.percentage}%)`)
            .join(', ');
        parts.push(`Messages that land: ${reasons}`);
    }

    if (insight.whyItFails.topMissReasons.length > 0) {
        const reasons = insight.whyItFails.topMissReasons
            .map(r => `${r.reason} (${r.percentage}%)`)
            .join(', ');
        parts.push(`Messages that miss: ${reasons}`);
    }

    if (insight.recommendations.length > 0) {
        parts.push('\nSuggestions:');
        parts.push(...insight.recommendations.map(r => `• ${r}`));
    }

    return parts.join('\n');
}
