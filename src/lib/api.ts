import { supabase } from './supabase';
import type { JournalEntry, UserProfile, Tier, ActivityType, ActivityLog } from '../types';

// --- PROFILES ---
export const api = {
    // Get full user profile with all related data
    async getFullUserProfile(userId: string): Promise<UserProfile | null> {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) return null;

        // Fetch related data
        const [journalRes, activityRes, favoritesRes] = await Promise.all([
            // goalsRes handled separately below due to different table name logic
            supabase.from('journal_entries').select('*').eq('user_id', userId),
            supabase.from('activity_logs').select('*').eq('user_id', userId),
            supabase.from('favorite_quotes').select('*').eq('user_id', userId),
            // reflectionsRes skipped as table not created yet
        ]);

        const goals = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });

        // Construct the profile object
        return {
            id: userId,
            name: profile.full_name,
            tier: profile.tier,
            career: 'General',
            profession: 'General',
            interests: [],
            subscriptionTier: 'free',
            notificationFrequency: 3,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            sourcePreference: 'mix',
            voicePreference: profile.voice_preference || 'nova',

            streak: 0,
            points: 0,

            dailyFocuses: (goals.data || []).map(g => ({
                id: g.id.toString(),
                text: g.text,
                isCompleted: g.is_completed,
                createdAt: g.created_at
            })),

            goals: [], // Added to satisfy interface, separate from dailyFocuses

            journalEntries: (journalRes.data || []).map(j => ({
                id: j.id,
                date: j.date,
                highlight: j.highlight,
                midpoint: j.midpoint,
                lowlight: j.lowlight
            })),

            favoriteQuotes: (favoritesRes.data || []).map(f => ({
                quoteId: f.quote_id,
                savedAt: f.saved_at
            })),

            activityHistory: (activityRes.data || []).map(a => ({
                date: a.date,
                type: a.type as ActivityType,
                count: a.count,
                duration: a.duration,
                details: a.details
            })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

            meditationReflections: []
        };
    },

    // --- GOALS ---
    async createGoal(userId: string, text: string) {
        const { data, error } = await supabase
            .from('goals')
            .insert({ user_id: userId, text, is_completed: false })
            .select()
            .single();
        return { data, error };
    },

    async toggleGoal(goalId: string, isCompleted: boolean) {
        const { error } = await supabase
            .from('goals')
            .update({ is_completed: isCompleted })
            .eq('id', goalId);
        return { error };
    },

    // --- JOURNAL ---
    async createJournalEntry(userId: string, entry: JournalEntry) {
        const { error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: userId,
                date: entry.date,
                highlight: entry.highlight,
                midpoint: entry.midpoint,
                lowlight: entry.lowlight
            });
        return { error };
    },

    // --- ACTIVITY ---
    async logActivity(userId: string, log: ActivityLog) {
        // Simple insert for now. Complex logic (increment count if same day) could be DB side or check-then-update.
        // For simplicity/speed: Check if exists, then update or insert.

        // 1. Check existing
        const { data: existing } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', log.date)
            .eq('type', log.type)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('activity_logs')
                .update({ count: existing.count + 1 })
                .eq('id', existing.id);
            return { error };
        } else {
            const { error } = await supabase
                .from('activity_logs')
                .insert({
                    user_id: userId,
                    date: log.date,
                    type: log.type,
                    count: 1,
                    duration: log.duration,
                    details: log.details
                });
            return { error };
        }
    },

    // --- FAVORITES ---
    async toggleFavorite(userId: string, quoteId: string, isFavorited: boolean) {
        if (isFavorited) {
            // Add
            await supabase.from('favorite_quotes').insert({ user_id: userId, quote_id: quoteId });
        } else {
            // Remove
            await supabase.from('favorite_quotes').delete().eq('user_id', userId).eq('quote_id', quoteId);
        }
    },

    // --- SETTINGS / PROFILE UPDATE ---
    async updateUserProfile(userId: string, profile: UserProfile) {
        // Update profile table
        await supabase.from('profiles').update({
            full_name: profile.name,
            tier: profile.tier,
            voice_preference: profile.voicePreference
        }).eq('id', userId);

        // Update goals (dailyFocuses)
        if (profile.dailyFocuses) {
            // Delete existing goals and recreate (simpler than sync)
            await supabase.from('goals').delete().eq('user_id', userId);

            for (const focus of profile.dailyFocuses) {
                await supabase.from('goals').insert({
                    user_id: userId,
                    text: focus.text,
                    is_completed: focus.isCompleted,
                    created_at: focus.createdAt
                });
            }
        }
    },

    async updateTier(userId: string, tier: Tier) {
        await supabase.from('profiles').update({ tier }).eq('id', userId);
    }
};
