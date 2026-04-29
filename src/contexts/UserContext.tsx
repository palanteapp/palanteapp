import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { UserProfile, ActivityType, MeditationReflection } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { WidgetDataSync } from '../utils/widgetDataSync';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { logPractice, migrateStreakToPractice, getTodayDate } from '../utils/practiceUtils';
import { generateUserNarrative, generateMonthlyPatternInsight } from '../utils/aiService';

const getLocalYesterdayDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface UserContextType {
    user: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updatedUser: UserProfile | ((prev: UserProfile | null) => UserProfile)) => Promise<void>;
    logActivity: (type: ActivityType) => Promise<void>;
    saveReflection: (data: { intention: string; duration: number; reflection: string; mantra: string }) => Promise<void>;
    toggleFavorite: (quoteId: string, isFavorite: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Keep a ref to the current user for imperative updates
    const userRef = useRef<UserProfile | null>(null);

    // Initial Profile Load
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                // 1. Check local storage for immediate data
                let localUser: UserProfile | null = null;
                const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
                if (storedUser) {
                    try {
                        localUser = JSON.parse(storedUser);
                        // Patch missing fields for legacy data
                        if (localUser) {
                            localUser = {
                                ...localUser,
                                favoriteQuotes: localUser.favoriteQuotes || [],
                                goals: localUser.goals || [],
                                interests: localUser.interests || [],
                                dailyFocuses: localUser.dailyFocuses || [],
                                weeklyReports: localUser.weeklyReports || [],
                                coachInterventions: localUser.coachInterventions || [],
                                hapticsEnabled: localUser.hapticsEnabled ?? true,
                                journalPromptsEnabled: localUser.journalPromptsEnabled ?? true,
                                aiDisabled: localUser.aiDisabled ?? false,
                                quoteIntensity: (Number(localUser.quoteIntensity) || Number((localUser as Record<string, unknown>).tier) || 2) as 1 | 2 | 3,
                                coachName: localUser.coachName ?? 'Palante Coach'
                            };
                        }
                    } catch (e) {
                        console.error('Failed to parse stored user', e);
                    }
                }

                // 2. If logged in, fetch from Cloud
                if (authUser) {
                    try {
                        const cloudProfile = await api.getProfile(authUser.id);
                        if (cloudProfile) {
                            // Cloud takes precedence
                            setUser(cloudProfile);
                            userRef.current = cloudProfile;
                            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(cloudProfile));
                            // Sync Widgets
                            WidgetDataSync.syncAll(cloudProfile).catch(e => console.error('Initial cloud widget sync failed', e));
                        } else if (localUser && localUser.id === authUser.id) {
                            // First time cloud sync
                            await api.updateProfile(authUser.id, localUser);
                            setUser(localUser);
                            userRef.current = localUser;
                            // Sync Widgets
                            WidgetDataSync.syncAll(localUser).catch(e => console.error('Initial local sync to cloud failed', e));
                        } else {
                            // No cloud, no matching local -> New User or Guest
                            // Initialize Default Guest User
                            const guestUser: UserProfile = {
                                id: 'guest-' + Date.now(),
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
                                aiDisabled: false
                            };
                            setUser(guestUser);
                            userRef.current = guestUser;
                            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guestUser));
                            // Sync Widgets
                            WidgetDataSync.syncAll(guestUser).catch(e => console.error('Initial guest widget sync failed', e));
                        }
                    } catch (err) {
                        console.error('Error fetching profile:', err);
                        // Fallback to local
                        setUser(localUser);
                        userRef.current = localUser;
                        if (localUser) {
                            WidgetDataSync.syncAll(localUser).catch(e => console.error('Initial fallback widget sync failed', e));
                        }
                    }
                } else {
                    // Guest Mode
                    if (localUser) {
                        setUser(localUser);
                        userRef.current = localUser;
                        WidgetDataSync.syncAll(localUser).catch(e => console.error('Initial guest local widget sync failed', e));
                    } else {
                        // Create fresh guest user
                        const guestUser: UserProfile = {
                            id: 'guest-' + Date.now(),
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
                            aiDisabled: false
                        };
                        setUser(guestUser);
                        userRef.current = guestUser;
                        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guestUser));
                        WidgetDataSync.syncAll(guestUser).catch(e => console.error('Initial new guest widget sync failed', e));
                    }
                }
            } catch (error) {
                console.error('Profile load error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [authUser]);

    // Narrative Engine — silently regenerates the user's growth memoir weekly
    useEffect(() => {
        const currentUser = userRef.current;
        if (!currentUser || currentUser.aiDisabled) return;

        const lastGenerated = currentUser.userNarrative?.generatedAt;
        const isStale = !lastGenerated ||
            Date.now() - new Date(lastGenerated).getTime() > 7 * 24 * 60 * 60 * 1000;

        if (!isStale) return;

        generateUserNarrative(currentUser).then(text => {
            if (!text) return;
            const updated = {
                ...userRef.current!,
                userNarrative: { text, generatedAt: new Date().toISOString() }
            };
            setUser(updated);
            userRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
            if (authUser) {
                api.updateProfile(authUser.id, updated).catch(() => {});
            }
        }).catch(() => {});
    // Run once after the profile is first populated
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Monthly Pattern Engine — generates one specific behavioral insight after 30+ days
    useEffect(() => {
        const currentUser = userRef.current;
        if (!currentUser || currentUser.aiDisabled) return;

        const totalPractices = currentUser.practiceData?.totalPractices ?? 0;
        if (totalPractices < 10) return; // Need meaningful data first

        const lastGenerated = currentUser.monthlyPattern?.generatedAt;
        const isStale = !lastGenerated ||
            Date.now() - new Date(lastGenerated).getTime() > 30 * 24 * 60 * 60 * 1000;

        if (!isStale) return;

        generateMonthlyPatternInsight(currentUser).then(result => {
            if (!result) return;
            const updated = {
                ...userRef.current!,
                monthlyPattern: {
                    insight: result.insight,
                    dataPoint: result.dataPoint,
                    generatedAt: new Date().toISOString(),
                    dismissed: false,
                }
            };
            setUser(updated);
            userRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
            if (authUser) {
                api.updateProfile(authUser.id, updated).catch(() => {});
            }
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Core Update Logic
    const updateProfile = useCallback(async (updateInput: UserProfile | ((prev: UserProfile | null) => UserProfile)) => {

        const currentUser = userRef.current;
        let newUser: UserProfile;

        if (typeof updateInput === 'function') {
            if (!currentUser) return; // Cannot update if no user exists
            newUser = updateInput(currentUser);
        } else {
            newUser = updateInput;
        }

        // Update state and ref
        setUser(newUser);
        userRef.current = newUser;

        // Sync Local immediately
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

        // Sync Cloud (async, fire-and-forget from here context)
        if (authUser) {
            api.updateProfile(authUser.id, newUser).catch(e => console.error('Cloud save failed', e));
        }

        // Sync Widgets (iOS)
        WidgetDataSync.syncAll(newUser).catch(e => console.error('Widget sync failed', e));
    }, [authUser]);

    const logActivity = useCallback(async (type: ActivityType) => {
        // Log activity logic rewritten to be atomic if possible, but 'logActivity' is complex.
        // For now, we will use the functional update pattern where possible, 
        // asking updateProfile to handle the state merge.

        await updateProfile(prevUser => {
            if (!prevUser) return prevUser!;

            const today = getTodayDate();
            const updatedActivityHistory = [...(prevUser.activityHistory || [])];

            const existingLogIndex = updatedActivityHistory.findIndex(log => log.date === today && log.type === type);

            if (existingLogIndex >= 0) {
                updatedActivityHistory[existingLogIndex] = {
                    ...updatedActivityHistory[existingLogIndex],
                    count: updatedActivityHistory[existingLogIndex].count + 1
                };
            } else {
                updatedActivityHistory.push({ date: today, type, count: 1 });
            }

            // Accurate Daily Streak Logic — uses local date to avoid midnight UTC boundary resets
            const yesterdayStr = getLocalYesterdayDate();
            
            // Was there activity before this call today?
            const hadActivityTodayBefore = (prevUser.activityHistory || []).some(log => log.date === today);
            const hadActivityYesterday = (prevUser.activityHistory || []).some(log => log.date === yesterdayStr);

            let newStreak = prevUser.streak || 0;
            if (!hadActivityTodayBefore) {
                if (hadActivityYesterday) {
                    newStreak = (prevUser.streak || 0) + 1;
                } else {
                    newStreak = 1;
                }
            }
            // If already had activity today, keep current streak.
            // If no activity today and no activity yesterday, streak becomes 1 (today).
            // (Note: streak resetting to 0 happens if a day passes without activity, usually checked on app launch)

            // Sync with new practice tracking system (Counts as a check-in)
            const currentPracticeData = prevUser.practiceData || migrateStreakToPractice(prevUser);
            const updatedPracticeData = logPractice(currentPracticeData, type);

            return {
                ...prevUser,
                activityHistory: updatedActivityHistory,
                streak: newStreak,
                practiceData: updatedPracticeData
            };
        });

        // API Log (Fire and Forget)
        if (authUser) {
            api.logActivity(authUser.id, { date: getTodayDate(), type, count: 1 }).catch(console.error);
        }
    }, [authUser, updateProfile]);

    const saveReflection = useCallback(async (data: { intention: string; duration: number; reflection: string; mantra: string }) => {
        const newReflection: MeditationReflection = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...data
        };

        await updateProfile(prevUser => {
            if (!prevUser) return prevUser!;
            return {
                ...prevUser,
                meditationReflections: [newReflection, ...(prevUser.meditationReflections || [])]
            };
        });

        if (authUser) {
            api.saveMeditationReflection(authUser.id, newReflection).catch(console.error);
        }
    }, [authUser, updateProfile]);

    const toggleFavorite = useCallback(async (quoteId: string, isFavorite: boolean) => {
        // Fully atomic functional update
        await updateProfile(prevUser => {
            if (!prevUser) return prevUser!;

            const favorites = prevUser.favoriteQuotes || [];
            let updatedFavorites;

            if (isFavorite) {
                // Add if not exists
                if (!favorites.some(f => String(f.quoteId) === String(quoteId))) {
                    updatedFavorites = [...favorites, { quoteId: String(quoteId), savedAt: new Date().toISOString() }];
                } else {
                    updatedFavorites = favorites;
                }
            } else {
                // Remove
                updatedFavorites = favorites.filter(f => String(f.quoteId) !== String(quoteId));
            }

            return { ...prevUser, favoriteQuotes: updatedFavorites };
        });

        // Specific API call for stats/optimization
        if (authUser) {
            api.toggleFavorite(authUser.id, quoteId, isFavorite).catch(console.error);
        }

        // Trigger 'quote' activity if favoriting
        if (isFavorite) {
            // This calls logActivity which calls updateProfile again.
            // Since updateProfile is atomic, this is safe.
            logActivity('quote');
        }
    }, [authUser, updateProfile, logActivity]);


    const refreshProfile = useCallback(async () => {
        if (!authUser) return;
        const profile = await api.getProfile(authUser.id);
        if (profile) {
            setUser(profile);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
        }
    }, [authUser]);

    return (
        <UserContext.Provider value={{
            user,
            loading,
            refreshProfile,
            updateProfile,
            logActivity,
            saveReflection,
            toggleFavorite
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
