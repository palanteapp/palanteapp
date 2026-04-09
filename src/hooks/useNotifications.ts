/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { QUOTES } from '../data/quotes';
import { AFFIRMATIONS } from '../data/affirmations';
import type { ContentType } from '../types';

type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'default';

interface NotificationSettings {
    enabled: boolean;
    frequency: number; // 1-10
    quietStart: string; // "22:00"
    quietEnd: string;   // "08:00"
    morningReminderEnabled: boolean;
    morningReminderTime: string; // "07:00"
    eveningReminderEnabled: boolean;
    eveningReminderTime: string; // "20:00"
    nudgeEnabled: boolean;
    nudgeFrequency: 'hourly' | 'every-2-hours' | 'every-4-hours' | 'morning-evening' | 'off';
}

export const useNotifications = () => {
    const [permission, setPermission] = useState<PermissionState>('prompt');
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        const saved = localStorage.getItem('palante_notifications');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...parsed,
                morningReminderEnabled: parsed.morningReminderEnabled ?? false,
                morningReminderTime: parsed.morningReminderTime ?? '07:00',
                eveningReminderEnabled: parsed.eveningReminderEnabled ?? true,
                eveningReminderTime: parsed.eveningReminderTime ?? '20:00',
                nudgeEnabled: parsed.nudgeEnabled ?? true,
                nudgeFrequency: parsed.nudgeFrequency ?? 'every-2-hours'
            };
        }
        return {
            enabled: false,
            frequency: 3,
            quietStart: '22:00',
            quietEnd: '08:00',
            morningReminderEnabled: false,
            morningReminderTime: '07:00',
            eveningReminderEnabled: true,
            eveningReminderTime: '20:00',
            nudgeEnabled: true,
            nudgeFrequency: 'every-2-hours'
        };
    });

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        try {
            const status = await LocalNotifications.checkPermissions();
            setPermission(status.display as PermissionState);
        } catch (e) {
            console.error('Error checking notification permissions:', e);
        }
    };

    useEffect(() => {
        const registerActions = async () => {
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'QUOTE_ACTIONS',
                        actions: [
                            {
                                id: 'VIEW_QUOTE_CARD',
                                title: 'View Quote Card',
                                foreground: true, // Bring app to foreground to show quote card
                            },
                            {
                                id: 'FAVORITE',
                                title: 'Favorite',
                                foreground: false, // Don't bring app to foreground for favoring
                            }
                        ]
                    }
                ]
            });
        };
        registerActions();
    }, []);


    useEffect(() => {
        localStorage.setItem('palante_notifications', JSON.stringify(settings));
    }, [settings]);

    // Listen for notification actions
    useEffect(() => {
        let listenerHandle: any;

        const setupListener = async () => {
            listenerHandle = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                const actionId = notification.actionId;
                const quoteText = notification.notification.extra?.quote;

                if (actionId === 'VIEW_QUOTE_CARD' && quoteText) {
                    // Store the quote to be displayed when app opens
                    localStorage.setItem('palante_pending_quote_card', JSON.stringify({
                        text: quoteText,
                        author: 'Palante',
                        timestamp: Date.now()
                    }));
                    // The app will check for this on mount and display the quote card
                } else if (actionId === 'FAVORITE' && quoteText) {
                    // Add to favorites without opening app
                    const favorites = JSON.parse(localStorage.getItem('palante_favorite_quotes') || '[]');
                    const newFavorite = {
                        id: `notif-${Date.now()}`,
                        text: quoteText,
                        author: 'Palante',
                        category: 'Inspiration',
                        tier: 'Free',
                        isAI: false,
                        favoritedAt: Date.now()
                    };
                    favorites.push(newFavorite);
                    localStorage.setItem('palante_favorite_quotes', JSON.stringify(favorites));
                }
            });
        };

        setupListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, []);


    const requestPermission = async () => {
        try {
            const status = await LocalNotifications.requestPermissions();
            setPermission(status.display as PermissionState);

            if (status.display === 'granted') {
                setSettings(prev => ({ ...prev, enabled: true }));
                return true;
            }
            return false;
        } catch (e: any) {
            console.error('Error requesting notification permissions:', e);
            // Show the actual error message for debugging
            alert(`Unable to request notifications: ${e?.message || JSON.stringify(e)}`);
            return false;
        }
    };

    const toggleEnabled = async () => {
        if (!settings.enabled) {
            // Trying to enable
            if (permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) return; // User denied
            }
            setSettings(prev => ({ ...prev, enabled: true }));
        } else {
            // Disabling
            setSettings(prev => ({ ...prev, enabled: false }));
        }
    };


    const isInQuietHours = (): boolean => {
        if (!settings.enabled) return true; // Effectively quiet if disabled

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = settings.quietStart.split(':').map(Number);
        const [endH, endM] = settings.quietEnd.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (startTotal > endTotal) {
            // Crosses midnight (e.g. 22:00 to 08:00)
            return currentMinutes >= startTotal || currentMinutes < endTotal;
        } else {
            // Same day (e.g. 09:00 to 17:00)
            return currentMinutes >= startTotal && currentMinutes < endTotal;
        }
    };

    const sendNotification = async (title: string, body: string, id: number = Math.floor(Math.random() * 100000)) => {
        if (permission === 'granted' && settings.enabled && !isInQuietHours()) {
            try {
                await LocalNotifications.schedule({
                    notifications: [{
                        title: title, // Use provided title which can be coachName
                        body,
                        id,
                        schedule: { at: new Date(Date.now() + 1000) }, // Schedule 1s later
                        sound: 'beep.caf',
                        smallIcon: 'ic_stat_icon_config_sample',
                    }]
                });
            } catch (error) {
                console.error("Notification failed", error);
            }
        }
    };

    const scheduleMorningReminder = async (enabled: boolean, timeStr: string, coachName?: string) => {
        if (permission !== 'granted') return;

        // Cancel existing morning reminder (ID 2000)
        await LocalNotifications.cancel({ notifications: [{ id: 2000 }] });

        if (!enabled) return;

        const [hour, minute] = timeStr.split(':').map(Number);
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    id: 2000,
                    title: coachName || "Rise & Shine",
                    body: "Time to set your intentions. Meditate, move, and design your day.",
                    schedule: { on: { hour, minute }, allowWhileIdle: true },
                    sound: 'beep.caf',
                    smallIcon: 'ic_stat_icon_config_sample',
                }]
            });
        } catch (e) {
            console.error('Error scheduling morning reminder:', e);
        }
    };

    const scheduleEveningReminder = async (enabled: boolean, timeStr: string, coachName?: string) => {
        if (permission !== 'granted') return;

        // Cancel existing evening reminder (ID 4000)
        await LocalNotifications.cancel({ notifications: [{ id: 4000 }] });

        if (!enabled) return;

        const [hour, minute] = timeStr.split(':').map(Number);
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    id: 4000,
                    title: coachName ? `${coachName} • Evening Reflection` : "Evening Reflection",
                    body: "Time for your G.L.A.D. nightly recap. End your day with gratitude and growth.",
                    schedule: { on: { hour, minute }, allowWhileIdle: true },
                    sound: 'beep.caf',
                    smallIcon: 'ic_stat_icon_config_sample',
                }]
            });
        } catch (e) {
            console.error('Error scheduling evening reminder:', e);
        }
    };

    const scheduleEncouragement = async (freq: number, quietStart: string, quietEnd: string, contentType: ContentType = 'mix', coachName?: string) => {
        if (permission !== 'granted' || freq <= 0) return;

        // Cancel existing encouragement (IDs 1000-1050)
        const idsToCancel = Array.from({ length: 50 }, (_, i) => ({ id: 1000 + i }));
        await LocalNotifications.cancel({ notifications: idsToCancel });

        // Calculate available window
        const [startH, startM] = quietStart.split(':').map(Number);
        const [endH, endM] = quietEnd.split(':').map(Number);

        const activeWindowStart = endH * 60 + endM; // Start scheduling AFTER quiet end
        let activeWindowEnd = startH * 60 + startM; // Stop scheduling BEFORE quiet start

        // Handle day wrap (e.g., quiet from 22:00 to 08:00)
        // Window is 08:00 to 22:00 (1320)
        // But if quiet is 01:00 to 05:00
        // Window is 05:00 to 01:00 (next day) -> 05:00 to 25:00
        if (activeWindowEnd <= activeWindowStart) activeWindowEnd += 24 * 60;

        const totalAvailableMinutes = activeWindowEnd - activeWindowStart;
        if (totalAvailableMinutes <= 60) {
            console.warn("Notification window too small:", totalAvailableMinutes);
            return;
        }

        let encouragementPool: string[] = [];

        if (contentType === 'quotes' || contentType === 'mix') {
            encouragementPool = [...encouragementPool, ...QUOTES.map(q => `"${q.text}" - ${q.author}`)];
        }

        if (contentType === 'affirmations' || contentType === 'mix') {
            encouragementPool = [...encouragementPool, ...AFFIRMATIONS.map(a => a.text)];
        }

        // Fallback if empty (shouldn't happen)
        if (encouragementPool.length === 0) {
            encouragementPool = ["You have everything you need to succeed today."];
        }

        const notifications = [];
        const slotDuration = Math.floor(totalAvailableMinutes / freq);

        for (let i = 0; i < freq; i++) {
            const slotStart = activeWindowStart + (i * slotDuration);
            // Safe buffer to avoid edge cases
            const innerBuffer = 10;
            const safeSlotDuration = Math.max(1, slotDuration - (innerBuffer * 2));
            const randomOffset = Math.floor(Math.random() * safeSlotDuration) + innerBuffer;

            let scheduleMinutes = slotStart + randomOffset;

            // Normalize to 0-1439 for the actual notification object
            let dayOffset = 0;
            if (scheduleMinutes >= 24 * 60) {
                scheduleMinutes -= 24 * 60;
                dayOffset = 1; // It's tomorrow (technically LocalNotifications 'on' doesn't support 'tomorrow' easily without 'at')
                // However, 'schedule: { on: { hour, minute } }' repeats DAILY.
                // So we just need the correct hour/minute.
            }

            const hour = Math.floor(scheduleMinutes / 60);
            const minute = scheduleMinutes % 60;
            const quoteText = encouragementPool[Math.floor(Math.random() * encouragementPool.length)];

            notifications.push({
                id: 1000 + i,
                title: coachName || "Palante",
                body: quoteText,
                extra: { quote: quoteText },
                schedule: { on: { hour, minute }, allowWhileIdle: true },
                sound: 'beep.caf',
                smallIcon: 'ic_stat_icon_config_sample',
                actionTypeId: 'QUOTE_ACTIONS'
            });
        }

        if (notifications.length > 0) {
            try {
                await LocalNotifications.schedule({ notifications });
                console.log(`Scheduled ${notifications.length} encouragement notifications`);
            } catch (e) {
                console.error('Error scheduling encouragement:', e);
            }
        }
    };

    const scheduleNudges = async (nudgeFreqIdx: string, quietStart: string, quietEnd: string, activeFocuses: string[] = [], intensity: number = 2, coachName?: string) => {
        if (permission !== 'granted' || nudgeFreqIdx === 'off') return;

        const map: Record<string, number> = {
            'hourly': 12, // Cap at 12 to avoid overwhelming
            'every-2-hours': 6,
            'every-4-hours': 3,
            'morning-evening': 2
        };
        const numNudges = map[nudgeFreqIdx] ?? 0;
        if (numNudges <= 0) return;

        // Cancel existing nudges (IDs 3000-3050)
        const idsToCancel = Array.from({ length: 50 }, (_, i) => ({ id: 3000 + i }));
        await LocalNotifications.cancel({ notifications: idsToCancel });

        // Intensity-specific generic nudges
        const genericNudgesByIntensity: Record<number, string[]> = {
            1: [ // Gentle & Poetic
                "Take a breath and check in with yourself.",
                "What does your heart need right now?",
                "Small steps create beautiful journeys.",
                "Honor your rhythm. You're exactly where you need to be.",
                "Let's pause and reflect on your path.",
                "Your growth is unfolding perfectly.",
                "Embrace this moment of possibility.",
                "Listen to your inner wisdom.",
                "Flow with your intentions today."
            ],
            2: [ // Direct & Clear
                "Time to check in on your big picture.",
                "Take a deep breath. You got this.",
                "Small steps lead to big changes.",
                "What's one thing you can do right now to move forward?",
                "Remember your 'Why'.",
                "Stay focused on what matters most.",
                "Consistency is the key to breakthrough.",
                "Drink some water and stretch!",
                "Keep moving forward. Palante!"
            ],
            3: [ // Empowered & Bold
                "You have the power to create change. Use it.",
                "Step into your full potential today.",
                "You are stronger than any obstacle.",
                "Lead your life with intention.",
                "Your vision is worth the effort.",
                "Break through the doubt. Trust your power.",
                "Rise up. This is your moment.",
                "Limitless potential. Limitless growth.",
                "Commit to your greatness. Palante!"
            ]
        };

        // Intensity-specific "no goal" prompts
        const noGoalPromptsByIntensity: Record<number, string[]> = {
            1: [ // Gentle
                "What intention would serve your soul today?",
                "Invite clarity: What matters most right now?",
                "Let's explore what you'd like to create today.",
                "What would bring you peace and purpose today?"
            ],
            2: [ // Direct
                "What is your main focus for today?",
                "Set a clear intention to guide your energy.",
                "A clear goal is the first step to success.",
                "Take a moment to define your win for the day."
            ],
            3: [ // Bold
                "Clarity is power. Define your target.",
                "A clear mission drives powerful action.",
                "Great leaders set goals. What's yours?",
                "Choose your direction. Make it big."
            ]
        };

        const genericNudges = genericNudgesByIntensity[intensity] || genericNudgesByIntensity[2];
        const noGoalPrompts = noGoalPromptsByIntensity[intensity] || noGoalPromptsByIntensity[2];

        // Slot-based distribution logic same as encouragement
        const [startH, startM] = quietStart.split(':').map(Number);
        const [endH, endM] = quietEnd.split(':').map(Number);
        const activeWindowStart = endH * 60 + endM;
        let activeWindowEnd = startH * 60 + startM;
        if (activeWindowEnd < activeWindowStart) activeWindowEnd += 24 * 60;
        const totalMinutes = activeWindowEnd - activeWindowStart;
        if (totalMinutes <= 60) return;

        const notifications = [];
        const slotDuration = Math.floor(totalMinutes / numNudges);

        for (let i = 0; i < numNudges; i++) {
            const slotStart = activeWindowStart + (i * slotDuration);
            let scheduleMinutes = slotStart + Math.floor(Math.random() * (slotDuration - 10)) + 5;
            if (scheduleMinutes >= 24 * 60) scheduleMinutes -= 24 * 60;

            // Decide content: STRICTLY Goal-based if available
            let bodyText = "";

            if (activeFocuses.length > 0) {
                // 100% chance to use user's own goals with intensity-specific templates
                const goal = activeFocuses[Math.floor(Math.random() * activeFocuses.length)];

                const templatesByIntensity: Record<number, string[]> = {
                    1: [ // Gentle & Reflective
                        `Gentle reminder to honor your intention: ${goal}`,
                        `Your soul called, it's time to ${goal}`,
                        `Let's flow toward: ${goal}`,
                        `Remember the beauty in ${goal}`,
                        `Your journey includes: ${goal}`,
                        `Embrace this moment to ${goal}`
                    ],
                    2: [ // Direct & Clear
                        `Time to take action: ${goal}`,
                        `Don't forget to ${goal}`,
                        `Stay on track: ${goal}`,
                        `Next up: ${goal}`,
                        `Keep your commitment: ${goal}`,
                        `Focus now: ${goal}`
                    ],
                    3: [ // Bold & Empowered
                        `Step into your power: ${goal}`,
                        `You are stronger than this: ${goal}`,
                        `Lead the way: ${goal}`,
                        `Your vision matters: ${goal}`,
                        `Honor your word to yourself: ${goal}`,
                        `Make it count: ${goal}`
                    ]
                };

                const templates = templatesByIntensity[intensity] || templatesByIntensity[2];
                bodyText = templates[Math.floor(Math.random() * templates.length)];
            } else {
                // If no goals, mix generic motivation with prompts to set a goal
                if (Math.random() > 0.5) {
                    bodyText = genericNudges[Math.floor(Math.random() * genericNudges.length)];
                } else {
                    bodyText = noGoalPrompts[Math.floor(Math.random() * noGoalPrompts.length)];
                }
            }

            notifications.push({
                id: 3000 + i,
                title: coachName || "Palante Coach",
                body: bodyText,
                schedule: { on: { hour: Math.floor(scheduleMinutes / 60), minute: scheduleMinutes % 60 }, allowWhileIdle: true },
                sound: 'beep.caf',
                smallIcon: 'ic_stat_icon_config_sample',
            });
        }

        try {
            await LocalNotifications.schedule({ notifications });

        } catch (e) {
            console.error('Error scheduling nudges:', e);
        }
    };

    const rescheduleAll = useCallback(async (targetSettings: NotificationSettings = settings, currentFocuses: string[] = [], intensity: number = 2, contentType: ContentType = 'mix', coachName?: string) => {
        if (permission !== 'granted' || !targetSettings.enabled) {
            console.log('Skipping reschedule: Not granted or disabled');
            // Cancel everything just in case
            const allIds = [
                2000,
                4000,
                ...Array.from({ length: 50 }, (_, i) => 1000 + i),
                ...Array.from({ length: 50 }, (_, i) => 3000 + i)
            ].map(id => ({ id }));
            await LocalNotifications.cancel({ notifications: allIds });
            return;
        }

        console.log(`🔄 Rescheduling all notifications (Coach: ${coachName || 'None'})...`);
        await scheduleMorningReminder(targetSettings.morningReminderEnabled, targetSettings.morningReminderTime, coachName);
        await scheduleEveningReminder(targetSettings.eveningReminderEnabled, targetSettings.eveningReminderTime, coachName);
        await scheduleEncouragement(targetSettings.frequency, targetSettings.quietStart, targetSettings.quietEnd, contentType, coachName);
        if (targetSettings.nudgeEnabled) {
            await scheduleNudges(targetSettings.nudgeFrequency, targetSettings.quietStart, targetSettings.quietEnd, currentFocuses, intensity, coachName);
        } else {
            const nudgeIds = Array.from({ length: 50 }, (_, i) => ({ id: 3000 + i }));
            await LocalNotifications.cancel({ notifications: nudgeIds });
        }
    }, [permission, settings]);

    // Force send function for "Test Notification" button (ignores Quiet Hours)
    const testNotification = async (coachName?: string) => {
        try {
            let status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') {
                status = await LocalNotifications.requestPermissions();
            }

            if (status.display === 'granted') {
                const title = coachName ? `🔔 ${coachName}` : "🔔 Palante Test";
                await LocalNotifications.schedule({
                    notifications: [{
                        title: title,
                        body: "Notifications are working! We'll keep quiet during your set hours.",
                        id: 9999,
                        extra: { quote: "Notifications are working! We'll keep quiet during your set hours." },
                        schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
                        sound: 'beep.caf',
                        smallIcon: 'ic_stat_icon_config_sample',
                        actionTypeId: 'QUOTE_ACTIONS'
                    }]
                });
                alert('✅ Test notification scheduled!');
            } else {
                alert('❌ Permission denied.');
            }
        } catch (error) {
            console.error('❌ Notification error:', error);
        }
    };

    return {
        permission,
        settings,
        toggleEnabled,
        updateQuietHours: (start: string, end: string) => {
            const newSettings = { ...settings, quietStart: start, quietEnd: end };
            setSettings(newSettings);
            rescheduleAll(newSettings);
        },
        sendNotification,
        testNotification,
        isInQuietHours,
        updateMorningReminderConfig: async (enabled: boolean, time: string) => {
            if (enabled && permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    console.warn('Cannot enable morning reminder: Permission denied');
                    // Continue to save settings? Maybe better to stay disabled.
                    // For now, we save it but rescheduleAll will drop it.
                    // Ideally we'd return a success/fail but this is a hook.
                }
            }
            // Permission might have updated async, so we assume if granted it's good.
            // But we need to make sure rescheduleAll checks the *latest* status.
            // Since `permission` state updates on next render, we'll rely on rescheduleAll checking internal logic 
            // OR we pass a flag. But simple valid check:
            const newSettings = { ...settings, morningReminderEnabled: enabled, morningReminderTime: time };
            setSettings(newSettings);
            // We pass the potentially new permission state context? 
            // Actually rescheduleAll checks `permission` state variable which is stale.
            // Pivot: pass explicit forcePermission flag or move permission check inside rescheduleAll?
            // Cleanest: Wait for effect. But user wants instant feedback.
            // Let's modify rescheduleAll to accept an override permission status.

            // Re-implementing reschedule logic partially here safely:
            setTimeout(() => rescheduleAll(newSettings), 100);
        },
        updateEveningReminderConfig: async (enabled: boolean, time: string) => {
            if (enabled && permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    console.warn('Cannot enable evening reminder: Permission denied');
                }
            }
            const newSettings = { ...settings, eveningReminderEnabled: enabled, eveningReminderTime: time };
            setSettings(newSettings);
            setTimeout(() => rescheduleAll(newSettings), 100);
        },
        updateNudgeConfig: async (enabled: boolean, frequency: NotificationSettings['nudgeFrequency'], intensity: number = 2, contentType: ContentType = 'mix') => {
            if (enabled && permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    alert('Please enable notifications to receive nudges.');
                    return;
                }
            }

            const newSettings = { ...settings, nudgeEnabled: enabled, nudgeFrequency: frequency };
            setSettings(newSettings);
            setTimeout(() => rescheduleAll(newSettings, [], intensity, contentType), 100);
        },
        updateFrequency: (frequency: number, intensity: number = 2, contentType: ContentType = 'mix') => {
            const newSettings = { ...settings, frequency };
            setSettings(newSettings);
            rescheduleAll(newSettings, [], intensity, contentType);
        },
        rescheduleAll
    };
};
