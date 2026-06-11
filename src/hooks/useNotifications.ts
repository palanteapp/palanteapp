import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { ContentType } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { DispatchMessage } from '../utils/dailyDispatch';

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
    lastCallEnabled: boolean;
    lastCallTime: string; // "21:30"
    nudgeEnabled: boolean;
    nudgeFrequency: 'hourly' | 'every-2-hours' | 'every-4-hours' | 'morning-evening' | 'off';
    waterRemindersEnabled: boolean; // Accountability toggle
}

export const useNotifications = () => {
    const [permission, setPermission] = useState<PermissionState>('prompt');
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...parsed,
                morningReminderEnabled: parsed.morningReminderEnabled ?? false,
                morningReminderTime: parsed.morningReminderTime ?? '07:00',
                eveningReminderEnabled: parsed.eveningReminderEnabled ?? true,
                eveningReminderTime: parsed.eveningReminderTime ?? '20:00',
                lastCallEnabled: parsed.lastCallEnabled ?? true,
                lastCallTime: parsed.lastCallTime ?? '21:30',
                nudgeEnabled: parsed.nudgeEnabled ?? false,
                nudgeFrequency: parsed.nudgeFrequency ?? 'every-4-hours',
                waterRemindersEnabled: parsed.waterRemindersEnabled ?? false
            };
        }
        return {
            enabled: false,
            frequency: 2,
            quietStart: '22:00',
            quietEnd: '08:00',
            morningReminderEnabled: false,
            morningReminderTime: '07:00',
            eveningReminderEnabled: true,
            eveningReminderTime: '20:00',
            lastCallEnabled: true,
            lastCallTime: '21:30',
            nudgeEnabled: false,
            nudgeFrequency: 'every-4-hours',
            waterRemindersEnabled: false
        };
    });

    const checkPermission = useCallback(async () => {
        try {
            const status = await LocalNotifications.checkPermissions();
            setPermission(status.display as PermissionState);
        } catch (e) {
            console.error('Error checking notification permissions:', e);
        }
    }, []);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

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
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
    }, [settings]);

    // Listen for notification actions
    useEffect(() => {
        let listenerHandle: { remove: () => void } | undefined;

        const setupListener = async () => {
            listenerHandle = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                const actionId = notification.actionId;
                const quoteText = notification.notification.extra?.quote;

                if (actionId === 'VIEW_QUOTE_CARD' && quoteText) {
                    // Store the quote to be displayed when app opens
                    localStorage.setItem(STORAGE_KEYS.PENDING_QUOTE_CARD, JSON.stringify({
                        text: quoteText,
                        author: 'Palante',
                        timestamp: Date.now()
                    }));
                    // The app will check for this on mount and display the quote card
                } else if (actionId === 'FAVORITE' && quoteText) {
                    // Add to favorites without opening app
                    const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITE_QUOTES) || '[]');
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
                    localStorage.setItem(STORAGE_KEYS.FAVORITE_QUOTES, JSON.stringify(favorites));
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
        } catch (e: unknown) {
            console.error('Error requesting notification permissions:', e);
            // Show the actual error message for debugging
            console.error('Unable to request notifications:', e);
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
                        sound: 'bell.caf',
                        smallIcon: 'ic_stat_icon_config_sample',
                    }]
                });
            } catch (error) {
                console.error("Notification failed", error);
            }
        }
    };

    const scheduleMorningReminder = async (enabled: boolean, timeStr: string, coachName?: string, userName?: string) => {
        if (permission !== 'granted') return;
        await LocalNotifications.cancel({ notifications: [{ id: 2000 }] });
        if (!enabled) return;

        const first = userName?.split(' ')[0];
        const morningBodies = first ? [
            `Good morning, ${first}. Your intentions are waiting. Let's design the day.`,
            `${first}, the morning belongs to you. Set the tone before the world does.`,
            `Rise with purpose, ${first}. Five minutes of intention changes everything.`,
        ] : [
            "Your morning practice is ready. Set your intentions before the world sets them for you.",
            "The most powerful hour is the first. Start yours with purpose.",
        ];
        const body = morningBodies[Math.floor(Math.random() * morningBodies.length)];

        const [hour, minute] = timeStr.split(':').map(Number);
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    id: 2000,
                    title: coachName || "Rise & Shine",
                    body,
                    schedule: { on: { hour, minute }, allowWhileIdle: true },
                    sound: 'bell.caf',
                    smallIcon: 'ic_stat_icon_config_sample',
                }]
            });
        } catch (e) {
            console.error('Error scheduling morning reminder:', e);
        }
    };

    const scheduleEveningReminder = async (enabled: boolean, timeStr: string, coachName?: string, userName?: string, streak: number = 0, lastCallEnabled: boolean = true, lastCallTimeStr: string = '21:30') => {
        if (permission !== 'granted') return;
        await LocalNotifications.cancel({ notifications: [{ id: 4000 }, { id: 4001 }] });
        if (!enabled) return;

        const first = userName?.split(' ')[0];
        const coach = coachName || 'Palante';
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        const isFriday = new Date().getDay() === 5;
        const streakLine = streak > 1 ? ` You're on a ${streak}-day streak.` : '';

        // Main reminder — personal, G.L.A.D.-aware, streak-aware
        const mainBodies = first ? [
            `${first}, how did today feel? Your G.L.A.D. reflection is waiting.${streakLine}`,
            `Before you close ${dayName}, ${first} — what's one thing you're grateful for right now?`,
            `${first}, one honest reflection tonight compounds into clarity tomorrow.${streakLine}`,
            `Your wins from today deserve to be captured, ${first}. G.L.A.D. takes 3 minutes.`,
            `${isFriday ? `End the week strong, ${first}.` : `${first}, how did ${dayName} treat you?`} Your evening reflection is open.`,
            `${first}, Grateful · Learned · Accomplished · Desired — close the day with intention.${streakLine}`,
            `The best version of tomorrow starts with reflecting on today, ${first}.`,
        ] : [
            "How did today feel? Your G.L.A.D. evening reflection takes 3 minutes.",
            `${isFriday ? 'End the week strong.' : `How did ${dayName} treat you?`} Capture your wins before the day slips away.`,
            "What are you grateful for right now? Your evening reflection is waiting.",
            "One honest reflection tonight builds lasting clarity tomorrow.",
            "Grateful · Learned · Accomplished · Desired — close the day with intention.",
            "The best version of tomorrow starts with reflecting on today.",
        ];
        const mainBody = mainBodies[Math.floor(Math.random() * mainBodies.length)];

        // Last-call reminder at 9:30pm — softer, zero pressure
        const lastCallBodies = first ? [
            `Still here, ${first}. Your G.L.A.D. reflection takes just a few minutes before bed.`,
            `No rush, ${first} — just a gentle nudge to close the day with intention.`,
            `${first}, even one sentence of reflection tonight makes tomorrow clearer.`,
            `Last chance to capture today's wins, ${first}. You've got this.`,
        ] : [
            "Still here — your evening reflection is just a few minutes before bed.",
            "A gentle nudge to close the day with intention before you rest.",
            "Even one sentence of reflection tonight makes tomorrow clearer.",
        ];
        const lastCallBody = lastCallBodies[Math.floor(Math.random() * lastCallBodies.length)];

        const [hour, minute] = timeStr.split(':').map(Number);
        const [lcHour, lcMinute] = lastCallTimeStr.split(':').map(Number);

        const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [
            {
                id: 4000,
                title: `${coach} • Evening Reflection`,
                body: mainBody,
                schedule: { on: { hour, minute }, allowWhileIdle: true },
                sound: 'bell.caf',
                smallIcon: 'ic_stat_icon_config_sample',
            }
        ];

        if (lastCallEnabled) {
            notifications.push({
                id: 4001,
                title: `${coach} • Last call 🌙`,
                body: lastCallBody,
                schedule: { on: { hour: lcHour, minute: lcMinute }, allowWhileIdle: true },
                sound: 'bell.caf',
                smallIcon: 'ic_stat_icon_config_sample',
            });
        }

        try {
            await LocalNotifications.schedule({ notifications });
        } catch (e) {
            console.error('Error scheduling evening reminder:', e);
        }
    };

    // Cancel just the 9:30pm last-call notification for tonight.
    // Called from App when the user completes their evening practice.
    // The daily reminder (4000) keeps firing on future nights.
    // 4001 re-schedules on the next rescheduleAll call (next settings change or new day).
    const cancelEveningLastCall = async () => {
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 4001 }] });
        } catch (e) {
            console.error('Error cancelling last-call reminder:', e);
        }
    };

    const scheduleNudges = async (nudgeFreqIdx: string, quietStart: string, quietEnd: string, activeFocuses: string[] = [], intensity: number = 2, coachName?: string, userName?: string) => {
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
                const goal = activeFocuses[Math.floor(Math.random() * activeFocuses.length)];
                const first = userName?.split(' ')[0];
                const n = first ? `${first}, ` : '';
                const nCap = first ? `${first} — ` : '';

                const templatesByIntensity: Record<number, string[]> = {
                    1: [ // Gentle & Reflective
                        `${n}a gentle nudge toward: ${goal}`,
                        `${nCap}how does ${goal} feel calling to you right now?`,
                        `You set an intention to ${goal}. Is this a good moment?`,
                        `${n}your heart knows the way. ${goal} is waiting.`,
                        `Small step, big ripple: ${goal}`,
                    ],
                    2: [ // Direct & Clear
                        `${n}time to move on: ${goal}`,
                        `${nCap}you committed to ${goal}. Now's the moment.`,
                        `Stay on track${first ? ', ' + first : ''}: ${goal}`,
                        `Next up for you: ${goal}`,
                        `${n}your future self will thank you for this: ${goal}`,
                    ],
                    3: [ // Bold & Empowered
                        `${n}step into it: ${goal}`,
                        `${nCap}you said ${goal}. Honor that.`,
                        `Your word to yourself: ${goal} — make it count.`,
                        `${n}the gap between who you are and who you want to be closes here: ${goal}`,
                        `Now. ${goal}. Go.`,
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
                title: coachName || "Palante",
                body: bodyText,
                schedule: { on: { hour: Math.floor(scheduleMinutes / 60), minute: scheduleMinutes % 60 }, allowWhileIdle: true },
                sound: 'bell.caf',
                smallIcon: 'ic_stat_icon_config_sample',
            });
        }

        try {
            await LocalNotifications.schedule({ notifications });

        } catch (e) {
            console.error('Error scheduling nudges:', e);
        }
    };

    const scheduleWaterReminders = async (enabled: boolean, quietStart: string, quietEnd: string, coachName?: string) => {
        if (permission !== 'granted' || !enabled) {
            const ids = [5001, 5002, 5003, 5004, 5005];
            await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
            return;
        }

        // Cancel existing (IDs 5001-5005)
        await LocalNotifications.cancel({ notifications: [5001, 5002, 5003, 5004, 5005].map(id => ({ id })) });

        const waterNudges = [
            "Flush time: Your cells are cleaning house. Give them the water they need.",
            "Quick win: 8oz of cold water. Right now. No excuses.",
            "Accountability check: Every sip is a step forward. Hydrate now.",
            "Stall the hunger, boost the burning. One glass of water. Go.",
            "Your metabolic engine runs on hydrogen. Get some H2O in there now."
        ];

        // Distribution logic
        const [startH, startM] = quietStart.split(':').map(Number);
        const [endH, endM] = quietEnd.split(':').map(Number);
        let activeStart = endH * 60 + endM;
        let activeEnd = startH * 60 + startM;
        if (activeEnd < activeStart) activeEnd += 24 * 60;
        const totalMin = activeEnd - activeStart;

        const notifications = [];
        const interval = Math.floor(totalMin / 5);

        for (let i = 0; i < 5; i++) {
            let scheduleMin = activeStart + (i * interval) + Math.floor(Math.random() * 30) + 15;
            if (scheduleMin >= 24 * 60) scheduleMin -= 24 * 60;

            notifications.push({
                id: 5001 + i,
                title: coachName ? `${coachName} • Hydration` : "Water Accountability",
                body: waterNudges[i],
                schedule: { on: { hour: Math.floor(scheduleMin / 60), minute: scheduleMin % 60 }, allowWhileIdle: true },
                sound: 'bell.caf',
                smallIcon: 'ic_stat_icon_config_sample'
            });
        }

        try {
            await LocalNotifications.schedule({ notifications });
        } catch (e) {
            console.error('Error scheduling water reminders:', e);
        }
    };

    const rescheduleAll = useCallback(async (targetSettings: NotificationSettings = settings, currentFocuses: string[] = [], intensity: number = 2, contentType: ContentType = 'mix', coachName?: string, userName?: string) => {
        if (permission !== 'granted' || !targetSettings.enabled) {
            // Cancel everything just in case
            const allIds = [
                2000,
                4000,
                4001,
                6000,
                ...Array.from({ length: 50 }, (_, i) => 1000 + i),
                ...Array.from({ length: 50 }, (_, i) => 3000 + i),
                5001, 5002, 5003, 5004, 5005
            ].map(id => ({ id }));
            await LocalNotifications.cancel({ notifications: allIds });
            return;
        }

        await scheduleMorningReminder(targetSettings.morningReminderEnabled, targetSettings.morningReminderTime, coachName, userName);
        await scheduleEveningReminder(targetSettings.eveningReminderEnabled, targetSettings.eveningReminderTime, coachName, userName, 0, targetSettings.lastCallEnabled, targetSettings.lastCallTime);

        // Cancel any previously scheduled quote/encouragement notifications (IDs 1000-1050)
        const encouragementIds = Array.from({ length: 50 }, (_, i) => ({ id: 1000 + i }));
        await LocalNotifications.cancel({ notifications: encouragementIds });

        if (targetSettings.nudgeEnabled) {
            await scheduleNudges(targetSettings.nudgeFrequency, targetSettings.quietStart, targetSettings.quietEnd, currentFocuses, intensity, coachName, userName);
        } else {
            const nudgeIds = Array.from({ length: 50 }, (_, i) => ({ id: 3000 + i }));
            await LocalNotifications.cancel({ notifications: nudgeIds });
        }

        await scheduleWaterReminders(targetSettings.waterRemindersEnabled, targetSettings.quietStart, targetSettings.quietEnd, coachName);
        await scheduleWeeklyHighlightNotification(targetSettings.enabled, userName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        sound: 'bell.caf',
                        smallIcon: 'ic_stat_icon_config_sample',
                        actionTypeId: 'QUOTE_ACTIONS'
                    }]
                });
                // Notification will appear in ~1s — no alert needed
            } else {
                console.warn('Test notification: permission denied.');
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
                if (!granted) return;
            }
            const newSettings = { ...settings, morningReminderEnabled: enabled, morningReminderTime: time };
            setSettings(newSettings);
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
        updateLastCallConfig: async (enabled: boolean, time: string) => {
            if (enabled && permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    console.warn('Cannot enable last-call reminder: Permission denied');
                    return;
                }
            }
            const newSettings = { ...settings, lastCallEnabled: enabled, lastCallTime: time };
            setSettings(newSettings);
            setTimeout(() => rescheduleAll(newSettings), 100);
        },
        updateNudgeConfig: async (enabled: boolean, frequency: NotificationSettings['nudgeFrequency'], intensity: number = 2, contentType: ContentType = 'mix') => {
            if (enabled && permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    console.warn('Nudge notifications require permission.');
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
        updateWaterRemindersConfig: async (enabled: boolean) => {
            if (enabled && permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    console.warn('Water reminders require notification permission.');
                    return;
                }
            }
            const newSettings = { ...settings, waterRemindersEnabled: enabled };
            setSettings(newSettings);
            setTimeout(() => rescheduleAll(newSettings), 100);
        },
        rescheduleAll,
        cancelEveningLastCall,

        // Schedule personalized daily dispatch notifications after morning practice.
        //
        // Behavior:
        //  - If iOS permission has never been requested, prompts the user once.
        //    This is intentionally the first place we prompt: the user has just
        //    completed their morning practice, so they're maximally invested.
        //  - If the user has previously disabled notifications in our app
        //    settings (settings.enabled === false) we respect that and bail.
        //  - Any individual dispatch message whose fire time falls inside the
        //    user's quiet hours window is dropped, so we never wake people at 3am.
        scheduleDailyDispatch: async (messages: DispatchMessage[], coachName?: string) => {
            // Check permission directly via Capacitor — our React state may be stale.
            let permStatus = await LocalNotifications.checkPermissions();
            const initialDisplay = permStatus.display;

            if (
                initialDisplay === 'prompt' ||
                initialDisplay === 'prompt-with-rationale' ||
                initialDisplay === 'default'
            ) {
                permStatus = await LocalNotifications.requestPermissions();
                // Sync React state so the Settings UI reflects reality
                setPermission(permStatus.display as PermissionState);
                if (permStatus.display === 'granted') {
                    setSettings(prev => ({ ...prev, enabled: true }));
                }
            }

            if (permStatus.display !== 'granted') return;

            // If the user previously had the toggle on and we just (re)granted
            // permission, settings.enabled may be true from the closure or from
            // the setSettings above. If it's explicitly false here AND we did
            // not just prompt, treat as user-disabled.
            const userJustGrantedFromPrompt =
                initialDisplay === 'prompt' ||
                initialDisplay === 'prompt-with-rationale' ||
                initialDisplay === 'default';
            if (!settings.enabled && !userJustGrantedFromPrompt) return;

            // Cancel any existing dispatch notifications (IDs 7000-7009)
            const idsToCancel = Array.from({ length: 10 }, (_, i) => ({ id: 7000 + i }));
            await LocalNotifications.cancel({ notifications: idsToCancel });

            // Quiet-hours window (minutes from midnight). Same logic as isInQuietHours().
            const [qsH, qsM] = settings.quietStart.split(':').map(Number);
            const [qeH, qeM] = settings.quietEnd.split(':').map(Number);
            const quietStartMin = qsH * 60 + qsM;
            const quietEndMin = qeH * 60 + qeM;
            const crossesMidnight = quietStartMin > quietEndMin;

            const inQuiet = (date: Date): boolean => {
                const m = date.getHours() * 60 + date.getMinutes();
                return crossesMidnight
                    ? m >= quietStartMin || m < quietEndMin
                    : m >= quietStartMin && m < quietEndMin;
            };

            const now = Date.now();
            const notifications = messages
                .slice(0, 4)
                .map((msg, i) => ({ msg, idx: i, fireAt: new Date(now + msg.minutesFromNow * 60 * 1000) }))
                .filter(({ fireAt }) => !inQuiet(fireAt))
                .map(({ msg, idx, fireAt }) => ({
                    id: 7000 + idx,
                    title: coachName || 'Palante',
                    body: msg.body,
                    schedule: {
                        at: fireAt,
                        allowWhileIdle: true,
                    },
                    sound: 'bell.caf',
                    smallIcon: 'ic_stat_palante',
                }));

            if (notifications.length > 0) {
                try {
                    await LocalNotifications.schedule({ notifications });
                } catch (e) {
                    console.error('Daily dispatch scheduling failed:', e);
                }
            }
        },

        // Send a single recovery nudge when user returns after 2+ days away
        sendRecoveryNudge: async (body: string, coachName?: string) => {
            if (permission !== 'granted' || !settings.enabled || isInQuietHours()) return;
            try {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: 7099,
                        title: coachName || 'Palante',
                        body,
                        schedule: { at: new Date(Date.now() + 2000), allowWhileIdle: true },
                        sound: 'bell.caf',
                        smallIcon: 'ic_stat_palante',
                    }]
                });
            } catch (e) {
                console.error('Recovery nudge failed:', e);
            }
        },
    };
};

// ─── Weekly Highlight Notification ───────────────────────────────────────────

export const scheduleWeeklyHighlightNotification = async (
    enabled: boolean,
    userName: string = 'Friend'
): Promise<void> => {
    const firstName = userName.split(' ')[0] || 'Friend';

    // Always cancel existing first
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 6000 }] });
    } catch { /* ignore */ }

    if (!enabled) return;

    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;

    // Schedule for every Sunday at 9:00 PM
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(21, 0, 0, 0);

    await LocalNotifications.schedule({
        notifications: [{
            id: 6000,
            title: 'Palante',
            body: `Your week in full, ${firstName}. Tap to see what you accomplished.`,
            schedule: {
                on: {
                    weekday: 1, // Sunday = 1 in Capacitor (1=Sun, 2=Mon, ... 7=Sat)
                    hour: 21,
                    minute: 0,
                },
                repeats: true,
                allowWhileIdle: true,
            },
            smallIcon: 'ic_stat_palante',
            sound: 'default',
        }]
    });
};
