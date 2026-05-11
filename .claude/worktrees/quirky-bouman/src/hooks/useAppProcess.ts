import { useEffect, useCallback, useRef, useMemo } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { haptics } from '../utils/haptics';
import { QUOTES } from '../data/quotes';
import { AFFIRMATIONS } from '../data/affirmations';
import { generateWeeklyReport, shouldGenerateWeeklyReport, getWeekDateRange } from '../utils/weeklyReportGenerator';
import { analyzeUserBehavior, generateInterventions } from '../utils/aiService';
import type { UserProfile, WeeklyReport, CoachIntervention } from '../types';
import type { useNotifications } from './useNotifications';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface UseAppProcessProps {
    user: UserProfile | null;
    updateProfile: (updatedUser: UserProfile | ((prev: UserProfile | null) => UserProfile)) => Promise<void>;
    toggleFavorite: (id: string, val: boolean) => Promise<void>;
    loadNewQuote: (user: UserProfile) => Promise<void>;
    setCurrentWeeklyReport: (report: WeeklyReport) => void;
    setShowWeeklyReport: (show: boolean) => void;
    setActiveInterventions: (interventions: CoachIntervention[]) => void;
    notifications: ReturnType<typeof useNotifications>;
}

export const useAppProcess = ({
    user,
    updateProfile,
    toggleFavorite,
    loadNewQuote,
    setCurrentWeeklyReport,
    setShowWeeklyReport,
    setActiveInterventions,
    notifications
}: UseAppProcessProps) => {
    const { sendNotification, rescheduleAll } = notifications;
    const { permission, settings: notificationSettings } = notifications;

    // Refs to prevent infinite loops and stale closures
    const weeklyReportCheckedRef = useRef(false);
    const userRef = useRef(user);
    const loadNewQuoteRef = useRef(loadNewQuote);
    const toggleFavoriteRef = useRef(toggleFavorite);
    const updateProfileRef = useRef(updateProfile);

    // Keep refs in sync
    useEffect(() => {
        userRef.current = user;
        loadNewQuoteRef.current = loadNewQuote;
        toggleFavoriteRef.current = toggleFavorite;
        updateProfileRef.current = updateProfile;
    }, [user, loadNewQuote, toggleFavorite, updateProfile]);
    const _aiAnalysisDateRef = useRef<string | null>(null);
    const lastNotificationConfigRef = useRef<string>('');

    // 1. Weekly Report Generation
    const checkAndGenerateWeeklyReport = useCallback(() => {
        const currentUser = userRef.current;
        if (!currentUser) return;

        // Check if it's time to generate a report (Sunday evening)
        if (shouldGenerateWeeklyReport()) {
            // Check if we already have a report for this week
            const { end: currentWeekEnd } = getWeekDateRange();
            const hasReportForThisWeek = currentUser.weeklyReports?.some(
                report => report.weekEndDate === currentWeekEnd
            );

            if (!hasReportForThisWeek) {
                // Generate new report
                const report = generateWeeklyReport(currentUser, [...QUOTES, ...AFFIRMATIONS]);

                // Save to user profile
                const updatedReports = [...(currentUser.weeklyReports || []), report];
                // Keep only last 12 weeks
                if (updatedReports.length > 12) {
                    updatedReports.shift();
                }

                updateProfileRef.current((prev: UserProfile | null) => {
                    if (!prev) return currentUser!;
                    return { ...prev, weeklyReports: updatedReports };
                });

                // Show the report
                setCurrentWeeklyReport(report);
                setShowWeeklyReport(true);

                // Send notification
                sendNotification(
                    currentUser.coachName || 'Palante',
                    'Your Weekly Report is Ready! 📊 See how your week went.'
                );
            }
        }
    }, [setCurrentWeeklyReport, setShowWeeklyReport, sendNotification]);

    // Check for weekly report generation - Run once per session
    useEffect(() => {
        if (!user || weeklyReportCheckedRef.current) return;

        weeklyReportCheckedRef.current = true;
        checkAndGenerateWeeklyReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Only depend on user ID, not the whole user object

    // 2. AI Coach Analysis
    const _analyzeAndGenerateInterventions = useCallback(() => {
        if (!user) return;

        // Analyze user behavior
        const behaviorPattern = analyzeUserBehavior(user);

        // Generate interventions based on patterns
        const newInterventions = generateInterventions(user, behaviorPattern);

        // Filter out already dismissed interventions
        const existingDismissed = user.coachInterventions?.filter(i => i.dismissed).map(i => i.trigger.condition) || [];
        const filteredInterventions = newInterventions.filter(
            intervention => !existingDismissed.includes(intervention.trigger.condition)
        );

        // Show only top 2 highest priority interventions
        const topInterventions = filteredInterventions
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .slice(0, 2);

        setActiveInterventions(topInterventions);

        setActiveInterventions(topInterventions);

        // Save behavior pattern to user profile ATOMICALLY
        updateProfile((prev: UserProfile | null) => {
            if (!prev) return user!; // Should not happen
            return { ...prev, behaviorPattern };
        });
    }, [user, updateProfile, setActiveInterventions]);

    // Run AI coach analysis - Once per day
    // DISABLED: User requested removal of coach intervention modals
    /*
    useEffect(() => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

        // Skip if already analyzed today in this session
        if (aiAnalysisDateRef.current === today) return;

        const lastAnalyzed = user.behaviorPattern?.lastAnalyzed?.split('T')[0];

        if (lastAnalyzed !== today) {
            aiAnalysisDateRef.current = today;
            analyzeAndGenerateInterventions();
        } else {
            // Load existing interventions (only once per session)
            if (!aiAnalysisDateRef.current) {
                aiAnalysisDateRef.current = today;
                const existingInterventions = user.coachInterventions?.filter(i => !i.dismissed && !i.accepted) || [];
                setActiveInterventions(existingInterventions.slice(0, 2));
            }
        }
    }, [user?.id]); // Only depend on user ID
    */

    // 3. Global Goal Reordering/Editing Listeners
    useEffect(() => {
        const handleReorder = (e: CustomEvent<{ draggedId: string; targetId: string; side: string }>) => {
            if (!user || !user.dailyFocuses) return;
            const { draggedId, targetId, side } = e.detail;

            const draggedItem = user.dailyFocuses.find(f => f.id === draggedId);
            if (!draggedItem) return;

            const newFocuses = user.dailyFocuses.filter(f => f.id !== draggedId);
            const targetIndex = newFocuses.findIndex(f => f.id === targetId);

            if (targetIndex === -1) return;

            const insertIndex = side === 'bottom' ? targetIndex + 1 : targetIndex;
            newFocuses.splice(insertIndex, 0, draggedItem);

            const updatedUser = { ...user, dailyFocuses: newFocuses };
            updateProfile(updatedUser);
        };

        const handleEdit = (e: CustomEvent<{ id: string; text: string }>) => {
            if (!user || !user.dailyFocuses) return;
            const { id, text } = e.detail;

            const updatedFocuses = user.dailyFocuses.map(f =>
                f.id === id ? { ...f, text: text } : f
            );
            const updatedUser = { ...user, dailyFocuses: updatedFocuses };
            updateProfile(updatedUser);
        };

        window.addEventListener('reorder-focus', handleReorder as EventListener);
        window.addEventListener('edit-focus', handleEdit as EventListener);
        return () => {
            window.removeEventListener('reorder-focus', handleReorder as EventListener);
            window.removeEventListener('edit-focus', handleEdit as EventListener);
        };
    }, [user, updateProfile]);

    // 4. Midnight Reset Loop
    useEffect(() => {
        const checkMidnight = () => {
            const lastResetDate = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
            const today = new Date().toISOString().split('T')[0];

            if (lastResetDate && lastResetDate !== today) {
                // Logic for reset happens mostly in components via finding today's data,
                // but we update the flag here.
                localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
            } else if (!lastResetDate) {
                localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
            }
        };

        checkMidnight();
        const interval = setInterval(checkMidnight, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // 5. Notifications Schedule Sync - Only when config actually changes
    // Memoize activeFocuses to prevent infinite loop
    const activeFocuses = useMemo(() => {
        return user?.dailyFocuses
            ?.filter(f => !f.isCompleted)
            .map(f => f.text) || [];
    }, [user?.dailyFocuses]);

    // Memoize configKey to prevent infinite loop
    const configKey = useMemo(() => {
        return JSON.stringify({
            focuses: activeFocuses,
            intensity: user?.quoteIntensity,
            contentType: user?.contentTypePreference,
            coachName: user?.coachName,
            enabled: notificationSettings.enabled,
            v: 4 // Force update
        });
    }, [activeFocuses, user?.quoteIntensity, user?.contentTypePreference, user?.coachName, notificationSettings.enabled]);

    useEffect(() => {
        if (permission !== 'granted' || !user) return;

        // Only reschedule if config actually changed
        if (configKey !== lastNotificationConfigRef.current) {
            lastNotificationConfigRef.current = configKey;
            rescheduleAll(undefined, activeFocuses, user.quoteIntensity, user.contentTypePreference, user.coachName);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        permission,
        user?.id,
        configKey,
        activeFocuses,
        user?.quoteIntensity,
        user?.contentTypePreference
        // NOTE: rescheduleAll is intentionally NOT in dependencies to avoid infinite loop
    ]);

    // 6. Haptics Sync
    useEffect(() => {
        if (user && user.hapticsEnabled !== undefined) {
            localStorage.setItem(STORAGE_KEYS.HAPTICS_ENABLED, String(user.hapticsEnabled));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.hapticsEnabled]);

    // 7. Handle Local Notification Actions
    useEffect(() => {
        const setupListener = async () => {
            const handle = await LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
                const { actionId, notification } = action;
                const currentUser = userRef.current;

                if (actionId === 'FAVORITE' && notification.extra?.quote) {
                    const quoteText = notification.extra.quote;

                    if (currentUser) {
                        const match = [...QUOTES, ...AFFIRMATIONS].find(q => q.text === quoteText);
                        const quoteIdStr = match ? String(match.id) : `spirit-${btoa(quoteText.slice(0, 10))}`;

                        const favorites = currentUser.favoriteQuotes || [];
                        if (!favorites.some(f => String(f.quoteId) === quoteIdStr)) {
                            toggleFavoriteRef.current(quoteIdStr, true);
                            haptics.success();
                        }
                    }
                } else if (actionId === 'GET_ANOTHER') {
                    if (currentUser) {
                        loadNewQuoteRef.current(currentUser);
                    }
                }
            });
            return handle;
        };

        const handlePromise = setupListener();

        return () => {
            handlePromise.then(h => h.remove());
        };
    }, []);
};
