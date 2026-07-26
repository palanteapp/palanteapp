// Local and Cloud storage API for Palante
import { readJSON } from '../utils/safeStorage';
import type {
    UserProfile, JournalEntry, DailyFocus, ActivityLog, MeditationReflection,
    AccountabilityPartner, PartnerCheckIn, PartnerCheckInKind,
} from '../types';
import { supabase } from './supabase';
import { clearProfileBackup } from '../utils/nativeStorage';
import { mergeProfiles } from '../utils/profileMerge';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Turn a Postgres error into something worth showing a person.
 * The codes correspond to the RAISE EXCEPTION calls in
 * supabase/migrations/20260725_partner_connections.sql.
 */
export function translatePartnerError(error: { code?: string; message?: string }): string {
    switch (error.code) {
        case '28000': return 'You need to be signed in to connect with a partner.';
        case 'P0002': return 'No one found with that invite code.';
        case '22023': return error.message?.includes('your own')
            ? 'That is your own invite code.'
            : 'That invite code does not look right.';
        case '42501': return 'This connection is unavailable.';
        case '23505': return 'You are already connected with this person.';
        // The RPCs live in a migration that has to be run by hand. PostgREST reports
        // a missing function as PGRST202 (schema cache miss) rather than surfacing
        // Postgres's own 42883, so both are mapped here.
        case 'PGRST202':
        case '42883': return 'Partner connections are not set up on the server yet.';
        // Table missing entirely: same cause, different symptom.
        case 'PGRST205':
        case '42P01': return 'Partner connections are not set up on the server yet.';
        default:
            console.error('Partner operation failed:', error);
            return error.message || 'Could not complete that. Check your connection and try again.';
    }
}

export const api = {
    // Helper to check if we should use Supabase (user is logged in)
    async isCloudSyncEnabled(): Promise<boolean> {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    // User profile operations
    async getProfile(userId: string): Promise<UserProfile | null> {
        // Always check local first for speed
        // A corrupt cached profile must not take down profile loading at boot.
        const localData = readJSON<UserProfile | null>(`palante_profile_${userId}`, null);

        // If cloud sync is enabled, try to fetch from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('data, updated_at')
                    .eq('id', session.user.id)
                    .single();

                if (data && data.data) {
                    const lastSeenStamp = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC_STAMP);
                    const cloudChanged = data.updated_at && data.updated_at !== lastSeenStamp;

                    // If another device wrote since our last sync, cloud scalars win
                    // but local collections are preserved via union. If we were the
                    // last writer, local wins (it may hold changes that failed to push).
                    const result: UserProfile = localData
                        ? (cloudChanged
                            ? mergeProfiles(data.data, localData)
                            : mergeProfiles(localData, data.data))
                        : data.data;

                    localStorage.setItem(`palante_profile_${userId}`, JSON.stringify(result));
                    if (data.updated_at) {
                        localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_STAMP, data.updated_at);
                    }
                    return result;
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
        const existing = readJSON<UserProfile | null>(`palante_profile_${userId}`, null);
        let updated = { ...existing, ...profile } as UserProfile;

        // Save local immediately: cloud round-trips below must never delay
        // or block persistence. Re-saved after a conflict merge if one occurs.
        localStorage.setItem(`palante_profile_${userId}`, JSON.stringify(updated));

        // Save to Supabase if logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            try {
                // Conflict guard: if the cloud row changed since our last sync,
                // another device wrote in between. Merge (union collections,
                // local scalars win) instead of overwriting their entries.
                const { data: cloudRow } = await supabase
                    .from('profiles')
                    .select('data, updated_at')
                    .eq('id', session.user.id)
                    .maybeSingle();

                const lastSeenStamp = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC_STAMP);
                if (cloudRow?.data && cloudRow.updated_at && cloudRow.updated_at !== lastSeenStamp) {
                    updated = mergeProfiles(updated, cloudRow.data);
                }

                const newStamp = new Date().toISOString();
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        data: updated,
                        updated_at: newStamp
                    }, { onConflict: 'id' });

                if (error) {
                    console.error('Error updating profile in Supabase:', error);
                } else {
                    localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_STAMP, newStamp);
                }
            } catch (e) {
                console.error('Supabase update failed:', e);
            }
        }

        // Re-save local in case the conflict merge changed the profile
        localStorage.setItem(`palante_profile_${userId}`, JSON.stringify(updated));
    },

    async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
        await this.updateProfile(userId, profile);
    },

    // Journal entries
    async saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) throw new Error('Profile not found. Cannot save journal entry.');

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
        if (!profile) throw new Error('Profile not found. Cannot save meditation reflection.');

        const reflections = profile.meditationReflections || [];
        reflections.unshift(reflection);

        await this.updateProfile(userId, { meditationReflections: reflections });
    },

    // Daily focus
    async saveDailyFocus(userId: string, focus: DailyFocus): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) throw new Error('Profile not found. Cannot save daily focus.');

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
        if (!profile) throw new Error('Profile not found. Cannot delete goal.');

        const focuses = profile.dailyFocuses || [];
        const updatedFocuses = focuses.filter(f => f.id !== focusId);
        await this.updateProfile(userId, { dailyFocuses: updatedFocuses });
    },

    // Activity tracking
    async logActivity(userId: string, activity: ActivityLog): Promise<void> {
        const profile = await this.getProfile(userId);
        if (!profile) throw new Error('Profile not found. Cannot log activity.');

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
    async toggleFavorite(_userId: string, _quoteId: string, _isFavorite: boolean): Promise<void> {
        // Optimistically handled in UI or via specific implementations
    },

    // ── Accountability partners ──────────────────────────────────────────────
    //
    // These all go through partner_connections / partner_check_ins. There is
    // deliberately no local fallback: a partner connection either exists on the
    // server, where both people can see it, or it does not exist. The previous
    // implementation fabricated a local "provisional" partner whenever the lookup
    // failed, which meant the UI could show an accepted partnership with someone
    // who had never been contacted. Failing honestly is the whole point here.

    /** Redeem an invite code. Opens a PENDING request the other person must accept. */
    async requestPartnerConnection(code: string): Promise<{ connectionId: string; partnerId: string; partnerName: string; status: string }> {
        const { data, error } = await supabase
            .rpc('request_partner_connection', { invite_code: code.trim().toUpperCase() });

        if (error) throw new Error(translatePartnerError(error));

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) throw new Error('No one found with that invite code.');

        return {
            connectionId: row.connection_id,
            partnerId: row.partner_id,
            partnerName: row.partner_name || 'Partner',
            status: row.status,
        };
    },

    /**
     * Server truth for every connection, in both directions. This is what keeps
     * partner streaks live: they used to be snapshotted at add-time and never
     * refreshed, so every partner drifted toward a frozen number.
     */
    async getPartnerSummaries(): Promise<AccountabilityPartner[]> {
        const { data, error } = await supabase.rpc('get_partner_summaries');
        if (error) throw new Error(translatePartnerError(error));

        return (data ?? []).map((row: {
            connection_id: string;
            partner_id: string;
            partner_name: string;
            current_streak: number;
            last_activity_date: string | null;
            status: string;
            is_incoming: boolean;
            created_at: string;
        }): AccountabilityPartner => ({
            id: row.partner_id,
            name: row.partner_name || 'Partner',
            currentStreak: row.current_streak ?? 0,
            lastActivityDate: row.last_activity_date ?? row.created_at,
            inviteStatus: row.status === 'accepted' ? 'accepted' : 'pending',
            addedDate: row.created_at,
            connectionId: row.connection_id,
            isIncoming: row.is_incoming,
        }));
    },

    async respondToPartnerRequest(connectionId: string, accept: boolean): Promise<void> {
        const { error } = await supabase
            .rpc('respond_to_partner_request', { target_connection: connectionId, accept });
        if (error) throw new Error(translatePartnerError(error));
    },

    async removePartnerConnection(connectionId: string): Promise<void> {
        const { error } = await supabase
            .from('partner_connections')
            .delete()
            .eq('id', connectionId);
        if (error) throw new Error(translatePartnerError(error));
    },

    async blockPartnerConnection(connectionId: string): Promise<void> {
        const { error } = await supabase
            .from('partner_connections')
            .update({ status: 'blocked', responded_at: new Date().toISOString() })
            .eq('id', connectionId);
        if (error) throw new Error(translatePartnerError(error));
    },

    /** Post a check-in the partner will actually see when they next open the app. */
    async postCheckIn(connectionId: string, authorId: string, kind: PartnerCheckInKind, body?: string): Promise<void> {
        const { error } = await supabase
            .from('partner_check_ins')
            .insert({ connection_id: connectionId, author_id: authorId, kind, body: body ?? null });
        if (error) throw new Error(translatePartnerError(error));
    },

    async getCheckIns(sinceIso: string): Promise<PartnerCheckIn[]> {
        const { data, error } = await supabase
            .from('partner_check_ins')
            .select('id, connection_id, author_id, kind, body, created_at')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw new Error(translatePartnerError(error));

        return (data ?? []).map(row => ({
            id: row.id,
            connectionId: row.connection_id,
            authorId: row.author_id,
            kind: row.kind as PartnerCheckInKind,
            body: row.body ?? undefined,
            createdAt: row.created_at,
        }));
    },

    // Account Deletion (Mandatory for App Store)
    async deleteUserAccount(userId: string): Promise<{ error: { message: string } | null }> {
        // 1. Clear local data: including the native filesystem backup, otherwise
        // loadProfileWithFallback resurrects the deleted profile on next launch
        localStorage.removeItem(`palante_profile_${userId}`);
        localStorage.removeItem(STORAGE_KEYS.CLOUD_SYNC_STAMP);
        await clearProfileBackup();

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
