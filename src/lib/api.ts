/* eslint-disable @typescript-eslint/no-explicit-any */
// Local and Cloud storage API for Palante
import type { UserProfile, JournalEntry, DailyFocus, ActivityLog, MeditationReflection } from '../types';
import { supabase } from './supabase';

export const api = {
    // Helper to check if we should use Supabase (user is logged in)
    async isCloudSyncEnabled(): Promise<boolean> {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    async createProfile(userId: string): Promise<UserProfile> {
        const defaultProfile: UserProfile = {
            id: userId,
            name: '',
            tier: 1,
            subscriptionTier: 'free',
            career: '',
            profession: '',
            interests: [],
            streak: 0,
            points: 0,
            dailyFocuses: [],
            sourcePreference: 'human',
            contentTypePreference: 'mix',
            notificationFrequency: 3,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            goals: [],
            coachSettings: { nudgeEnabled: true, nudgeFrequency: 'every-2-hours' },
            activityHistory: [],
            journalEntries: [],
            meditationReflections: [],
            favoriteQuotes: [],
            dashboardOrder: ['morning_practice', 'todays_goals', 'accountability_coach'],
            hapticsEnabled: true
        };

        // Save local
        localStorage.setItem(`palante_profile_${userId}`, JSON.stringify(defaultProfile));

        // Save to Supabase if logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            try {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        data: defaultProfile,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
            } catch (e) {
                console.error('Supabase create profile failed:', e);
            }
        }

        return defaultProfile;
    },

    // User profile operations
    async getProfile(userId: string): Promise<UserProfile | null> {
        // Always check local first for speed
        const stored = localStorage.getItem(`palante_profile_${userId}`);
        const localData = stored ? JSON.parse(stored) : null;

        // If cloud sync is enabled, try to fetch from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('data')
                    .eq('id', session.user.id)
                    .single();

                if (data && data.data) {
                    // Sync local with cloud
                    localStorage.setItem(`palante_profile_${userId}`, JSON.stringify(data.data));
                    return data.data;
                }
                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error('Error fetching profile from Supabase:', error);
                }
            } catch (e) {
                console.error('Supabase fetch failed:', e);
            }
        }

        return localData;
    },

    async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
        const existing = await this.getProfile(userId);
        const updated = { ...existing, ...profile } as UserProfile;

        // Save local
        localStorage.setItem(`palante_profile_${userId}`, JSON.stringify(updated));

        // Save to Supabase if logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        data: updated,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (error) console.error('Error updating profile in Supabase:', error);
            } catch (e) {
                console.error('Supabase update failed:', e);
            }
        }
    },

    async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
        await this.updateProfile(userId, profile);
    },

    // Journal entries
    async saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) return;

        const entries = profile.journalEntries || [];
        const existingIndex = entries.findIndex(e => e.id === entry.id);

        if (existingIndex >= 0) {
            entries[existingIndex] = entry;
        } else {
            entries.unshift(entry); // Add to beginning
        }

        await this.updateProfile(userId, { journalEntries: entries });
    },

    async saveMeditationReflection(userId: string, reflection: MeditationReflection): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) return;

        const reflections = profile.meditationReflections || [];
        reflections.unshift(reflection);

        await this.updateProfile(userId, { meditationReflections: reflections });
    },

    // Daily focus
    async saveDailyFocus(userId: string, focus: DailyFocus): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) return;

        const focuses = profile.dailyFocuses || [];
        const existingIndex = focuses.findIndex(f => f.id === focus.id);

        if (existingIndex >= 0) {
            focuses[existingIndex] = focus;
        } else {
            focuses.push(focus);
        }

        await this.updateProfile(userId, { dailyFocuses: focuses });
    },

    async createGoal(userId: string, text: string): Promise<{ data: DailyFocus }> {
        const newFocus: DailyFocus = {
            id: Date.now().toString(),
            text,
            isCompleted: false,
            createdAt: new Date().toISOString()
        };
        await this.saveDailyFocus(userId, newFocus);
        return { data: newFocus };
    },

    async deleteGoal(userId: string, focusId: string): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) return;

        const focuses = profile.dailyFocuses || [];
        const updatedFocuses = focuses.filter(f => f.id !== focusId);
        await this.updateProfile(userId, { dailyFocuses: updatedFocuses });
    },

    // Activity tracking
    async logActivity(userId: string, activity: ActivityLog): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) return;

        const history = profile.activityHistory || [];
        const existingIndex = history.findIndex(h => h.date === activity.date && h.type === activity.type);

        if (existingIndex >= 0) {
            history[existingIndex].count += activity.count;
        } else {
            history.push(activity);
        }

        await this.updateProfile(userId, { activityHistory: history });
    },

    // Favorites
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async toggleFavorite(userId: string, quoteId: string, isFavorite: boolean): Promise<void> {
        // Optimistically handled in UI or via specific implementations
    },

    // Accountability
    async findUserByInviteCode(code: string): Promise<UserProfile | null> {
        // 1. Try RPC first (Secure & Fast)
        try {
            const { data, error } = await supabase
                .rpc('find_user_by_invite_code', { invite_code: code });

            if (!error && data) {
                return data as unknown as UserProfile;
            }
        } catch (e) {
            console.warn('RPC find_user call failed:', e);
        }

        console.warn('RPC find_user failed/missing, attempting direct query fallback...');

        // 2. Fallback: Direct Query (Depends on RLS permitting read)
        try {
            // We search for the specific JSON key in the 'data' column
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('profiles')
                .select('id, data')
                // This syntax works for checking if the JSONB 'data' object contains the key-value pair
                .contains('data', { partnerInviteCode: code })
                .maybeSingle();

            if (fallbackError) {
                console.error('Direct query fallback failed:', fallbackError);
                return null;
            }

            if (fallbackData && fallbackData.data) {
                const profile = fallbackData.data as UserProfile;
                profile.id = fallbackData.id; // Ensure top-level ID is preserved
                return profile;
            }
        } catch (e) {
            console.error('Overall findUser failure:', e);
        }

        return null;
    },

    async addPartnerConnection(userId: string, partnerProfile: UserProfile): Promise<void> {
        // 1. Try RPC for mutual connection
        try {
            const { error } = await supabase.rpc('add_partner_connection', {
                user_id_1: userId,
                user_id_2: partnerProfile.id
            });

            if (!error) return; // Success
            console.warn('RPC add_partner failed, attempting manual update fallback...', error);
        } catch (e) {
            console.warn('RPC add_partner call crashed:', e);
        }

        // 2. Fallback: Manual Update (At least add to MY list)
        // If the backend function is missing, we likely can't update the *other* user due to RLS.
        // But we can definitely update our own profile so the flow doesn't break for the current user.
        try {
            const myProfile = await this.getProfile(userId);
            if (myProfile) {
                const newPartner = {
                    id: partnerProfile.id,
                    name: partnerProfile.name || 'Partner',
                    currentStreak: partnerProfile.streak || 0,
                    lastActivityDate: new Date().toISOString(),
                    inviteStatus: 'accepted' as const,
                    addedDate: new Date().toISOString()
                };

                const currentPartners = myProfile.accountabilityPartners || [];

                // Prevent duplicates
                if (!currentPartners.some(p => p.id === partnerProfile.id)) {
                    await this.updateProfile(userId, {
                        accountabilityPartners: [...currentPartners, newPartner]
                    });
                }
            }
        } catch (e) {
            console.error('Manual partner add failed:', e);
            throw new Error('Could not add partner. Please check your connection.');
        }
    },

    // Tier updates
    async updateTier(userId: string, tier: any): Promise<void> {
        await this.updateProfile(userId, { tier });
    },

    // Account Deletion (Mandatory for App Store)
    async deleteUserAccount(userId: string): Promise<{ error: any }> {
        // 1. Clear local data
        localStorage.removeItem(`palante_profile_${userId}`);
        localStorage.removeItem('palante_user');

        // 2. Clear all journal entries from local storage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('palante_journal_')) {
                localStorage.removeItem(key);
            }
        }

        // 3. Delete from Supabase if logged in
        // Note: This requires a postgres function 'delete_user_account' with SECURITY DEFINER
        const { error } = await supabase.rpc('delete_user_account');

        if (error) {
            console.error('Error deleting account from cloud:', error);
            return { error };
        }

        return { error: null };
    }
};
