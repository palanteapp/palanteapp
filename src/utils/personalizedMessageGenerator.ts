/**
 * Personalized Message Generator
 * Wraps the standard message generation functions with learned patterns
 * This is the Phase 2 layer that makes messages actually personal
 */

import { generateMorningPracticeMessage, generateEveningPracticeMessage } from './aiService';
import { VoiceProfileLearner } from './voiceProfileLearner';
import type { UserVoiceProfile, MomentumState } from '../types';

/**
 * Generate a personalized morning practice message using learned patterns
 * Falls back to standard generation if voice profile is not yet developed
 */
export async function generatePersonalizedMorningMessage(
    userName: string,
    data: {
        gratitudes: string[];
        affirmations: string[];
        intention: string;
        commitment?: string;
        narrative?: string;
        momentumState?: MomentumState;
        coachTone?: 'nurturing' | 'direct' | 'accountability';
        userVoiceProfile?: UserVoiceProfile;
    }
): Promise<string> {
    // If no voice profile or very few ratings, use standard generation
    if (!data.userVoiceProfile || (data.userVoiceProfile.ratedMessageCount ?? 0) < 3) {
        return generateMorningPracticeMessage(userName, data);
    }

    const voiceProfile = data.userVoiceProfile;

    // Get personalization context
    const personalizationContext = VoiceProfileLearner.getPersonalizationContext(voiceProfile);

    // Enhanced data object with learned patterns
    const enhancedData = {
        ...data,
        _personalizationHint: personalizationContext.prompt,
        _constraints: personalizationContext.constraints,
    };

    // For now, pass through to standard generation
    // In a real implementation, this would call a different endpoint that respects the constraints
    return generateMorningPracticeMessage(userName, enhancedData);
}

/**
 * Generate a personalized evening practice message using learned patterns
 * Falls back to standard generation if voice profile is not yet developed
 */
export async function generatePersonalizedEveningMessage(
    userName: string,
    data: {
        gratitude: string;
        learning: string;
        accomplishment: string;
        delight: string;
        morningCommitment?: string;
        commitmentReflection?: string;
        userVoiceProfile?: UserVoiceProfile;
    }
): Promise<string> {
    // If no voice profile or very few ratings, use standard generation
    if (!data.userVoiceProfile || (data.userVoiceProfile.ratedMessageCount ?? 0) < 3) {
        return generateEveningPracticeMessage(userName, data);
    }

    const voiceProfile = data.userVoiceProfile;

    // Get personalization context
    const personalizationContext = VoiceProfileLearner.getPersonalizationContext(voiceProfile);

    // Enhanced data object with learned patterns
    const enhancedData = {
        ...data,
        _personalizationHint: personalizationContext.prompt,
        _constraints: personalizationContext.constraints,
    };

    // For now, pass through to standard generation
    // In a real implementation, this would call a different endpoint that respects the constraints
    return generateEveningPracticeMessage(userName, enhancedData);
}

/**
 * Build a prompt injection string that respects learned patterns
 * This can be added to any message generation prompt to inject personalization
 */
export function buildPersonalizationPromptInjection(voiceProfile: UserVoiceProfile): string {
    const context = VoiceProfileLearner.getPersonalizationContext(voiceProfile);

    const parts: string[] = [
        'PERSONALIZATION DATA (from this user\'s patterns):',
        context.prompt,
        '',
        'CONSTRAINTS (phrases that don\'t land):',
        ...context.constraints
    ];

    return parts.join('\n');
}

/**
 * Check if we should show a "Message Quality" prompt to the user
 * Users with low engagement rates should be prompted to rate messages more
 */
export function shouldPromptForRating(voiceProfile: UserVoiceProfile | null | undefined): boolean {
    if (!voiceProfile) return false;

    const ratedCount = voiceProfile.ratedMessageCount ?? 0;
    const engagementRate = voiceProfile.engagementRate ?? 0;

    // Prompt if: not many ratings yet, or engagement has dropped
    return ratedCount < 10 || engagementRate < 0.3;
}

/**
 * Get a user-friendly message about the learning progress
 */
export function getLearningPhaseMessage(voiceProfile: UserVoiceProfile | null | undefined): string | null {
    if (!voiceProfile) {
        return 'Rate your messages to help Palante learn what works for you.';
    }

    const ratedCount = voiceProfile.ratedMessageCount ?? 0;

    if (ratedCount === 0) {
        return 'Start rating your messages so I can learn what resonates with you.';
    } else if (ratedCount < 3) {
        return `${3 - ratedCount} more rating${3 - ratedCount === 1 ? '' : 's'} to start learning what works for you.`;
    } else if (ratedCount < 10) {
        return `${10 - ratedCount} more rating${10 - ratedCount === 1 ? '' : 's'} for personalization to kick in.`;
    } else if (ratedCount < 30) {
        return `I'm learning from your ratings. ${30 - ratedCount} more messages and I'll be fully personalized.`;
    } else {
        return 'I\'ve learned what works for you. Every message gets better.';
    }
}

/**
 * Suggest what to do next based on voice profile maturity
 */
export function getNextStep(voiceProfile: UserVoiceProfile | null | undefined): 'setup' | 'rate' | 'personalize' | 'optimize' {
    if (!voiceProfile) return 'setup';

    const ratedCount = voiceProfile.ratedMessageCount ?? 0;

    if (ratedCount === 0) return 'rate';
    if (ratedCount < 3) return 'rate';
    if (ratedCount < 30) return 'personalize';
    return 'optimize';
}
