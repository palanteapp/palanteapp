import type { UserProfile } from '../types';

/**
 * The single source of truth for a brand-new profile. Used for both guest
 * sessions and freshly authenticated users: pass the id to stamp it with.
 */
export const createDefaultProfile = (id: string): UserProfile => ({
    id,
    name: 'Friend',
    career: '',
    profession: '',
    interests: [],
    quoteIntensity: 1,
    subscriptionTier: 'free',
    streak: 0,
    points: 0,
    sourcePreference: 'mix',
    contentTypePreference: 'mix',
    notificationFrequency: 3,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    goals: [],
    favoriteQuotes: [],
    aiDisabled: false,
    language: 'en',
});
