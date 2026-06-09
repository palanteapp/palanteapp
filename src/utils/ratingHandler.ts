/**
 * Rating Handler
 * Processes message ratings and updates user's voice profile with learned patterns.
 * Called whenever a user rates a morning or evening practice message.
 */

import { supabase } from '../lib/supabase';
import { VoiceProfileLearner, shouldRunWeeklyAnalysis, type RatedMessage } from './voiceProfileLearner';
import type { UserProfile, UserVoiceProfile, DailyMorningPractice, DailyEveningPractice } from '../types';

/**
 * Records a message rating and updates the user's voice profile
 * This is the main entry point called from the UI
 */
export async function recordMessageRating(
    userId: string,
    practiceId: string,
    practiceType: 'morning' | 'evening',
    messageText: string,
    rating: 1 | 2 | 3 | 4 | 5
): Promise<UserVoiceProfile | null> {
    try {
        // Fetch current user profile
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            console.error('Error fetching user profile:', userError);
            return null;
        }

        const user = userData as UserProfile;

        // Initialize voice profile if it doesn't exist
        let voiceProfile = user.userVoiceProfile || {
            userId,
            voiceTone: 'nurturing',
            messageLength: 'balanced',
            extractedValues: [],
            coreThemes: [],
            resonantPhrases: [],
            avoidPhrases: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            messagesSinceUpdate: 0,
            ratedMessageCount: 0,
            totalMessagesGenerated: 0,
            engagementRate: 0,
            averageRating: 0,
        };

        // Fetch all rated messages (morning and evening)
        const { data: morningData } = await supabase
            .from('daily_morning_practice')
            .select('*')
            .eq('user_id', userId);

        const { data: eveningData } = await supabase
            .from('daily_evening_practice')
            .select('*')
            .eq('user_id', userId);

        // Build list of already-rated messages
        const ratedMessages: RatedMessage[] = [];

        if (morningData) {
            for (const practice of morningData as DailyMorningPractice[]) {
                if (practice.messageOfTheDay && practice.messageRating) {
                    ratedMessages.push({
                        id: practice.id,
                        text: practice.messageOfTheDay,
                        rating: practice.messageRating,
                        type: 'morning',
                        generatedAt: practice.messageGeneratedAt || practice.date,
                    });
                }
            }
        }

        if (eveningData) {
            for (const practice of eveningData as DailyEveningPractice[]) {
                if (practice.reflectionMessage && practice.messageRating) {
                    ratedMessages.push({
                        id: practice.id,
                        text: practice.reflectionMessage,
                        rating: practice.messageRating,
                        type: 'evening',
                        generatedAt: practice.messageGeneratedAt || practice.date,
                    });
                }
            }
        }

        // Add the new rating
        const newRatedMessage: RatedMessage = {
            id: practiceId,
            text: messageText,
            rating,
            type: practiceType,
            generatedAt: new Date().toISOString(),
            ratedAt: new Date().toISOString(),
        };

        ratedMessages.push(newRatedMessage);

        // Update voice profile from this rating
        const updates = VoiceProfileLearner.updateProfileFromRating(
            voiceProfile,
            newRatedMessage,
            ratedMessages
        );

        // Merge into voice profile
        voiceProfile = { ...voiceProfile, ...updates };

        // Check if we should run weekly analysis
        if (shouldRunWeeklyAnalysis(voiceProfile)) {
            const weeklyUpdates = VoiceProfileLearner.analyzeWeeklyPatterns(
                voiceProfile,
                morningData as DailyMorningPractice[] || [],
                eveningData as DailyEveningPractice[] || []
            );
            voiceProfile = { ...voiceProfile, ...weeklyUpdates };
        }

        // Save updated voice profile back to user profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                user_voice_profile: voiceProfile,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating voice profile:', updateError);
            return null;
        }

        return voiceProfile;
    } catch (error) {
        console.error('Error in recordMessageRating:', error);
        return null;
    }
}

/**
 * Get the user's voice profile
 */
export async function getUserVoiceProfile(userId: string): Promise<UserVoiceProfile | null> {
    try {
        const { data: userData, error } = await supabase
            .from('profiles')
            .select('user_voice_profile')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            console.error('Error fetching voice profile:', error);
            return null;
        }

        return userData.user_voice_profile as UserVoiceProfile || null;
    } catch (error) {
        console.error('Error in getUserVoiceProfile:', error);
        return null;
    }
}

/**
 * Initialize a voice profile for new users
 */
export async function initializeVoiceProfile(
    userId: string,
    voiceTone: 'nurturing' | 'direct' | 'accountability',
    messageLength: 'concise' | 'balanced' | 'detailed'
): Promise<UserVoiceProfile> {
    const voiceProfile: UserVoiceProfile = {
        userId,
        voiceTone,
        messageLength,
        extractedValues: [],
        coreThemes: [],
        resonantPhrases: [],
        avoidPhrases: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messagesSinceUpdate: 0,
        ratedMessageCount: 0,
        totalMessagesGenerated: 0,
        engagementRate: 0,
        averageRating: 0,
    };

    try {
        await supabase
            .from('profiles')
            .update({
                user_voice_profile: voiceProfile,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        return voiceProfile;
    } catch (error) {
        console.error('Error initializing voice profile:', error);
        return voiceProfile; // Return even if save fails, at least it's in memory
    }
}
