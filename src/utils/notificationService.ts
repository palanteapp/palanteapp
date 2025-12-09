// import { LocalNotifications } from '@capacitor/local-notifications';
import type { UserProfile } from '../types';
// import { getRelevantQuotes } from './quoteMatcher';

export const scheduleNotifications = async (user: UserProfile) => {
    // TODO: Implement with @capacitor/local-notifications when ready
    console.log('Notification scheduling placeholder', user);
    /*
    try {
        // Request permissions first
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== 'granted') {
            console.warn('Notification permissions not granted');
            return;
        }

        // Cancel existing notifications
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }

        const frequency = user.notificationFrequency || 3;
        const quotes = getRelevantQuotes(user);

        // Schedule for the next 24 hours
        const notifications = [];
        const now = new Date();
        const startHour = 8; // 8 AM
        const endHour = 22; // 10 PM

        // Calculate intervals
        const activeHours = endHour - startHour;
        const intervalHours = activeHours / frequency;

        for (let i = 0; i < frequency; i++) {
            const quote = quotes[i % quotes.length];
            if (!quote) continue;

            const triggerDate = new Date(now);
            // Distribute throughout the day starting tomorrow if it's late, or today if early
            triggerDate.setHours(startHour + (i * intervalHours) + (Math.random() * 1)); // Add some randomness
            triggerDate.setMinutes(Math.floor(Math.random() * 60));
            triggerDate.setSeconds(0);

            // If time passed, schedule for tomorrow
            if (triggerDate <= now) {
                triggerDate.setDate(triggerDate.getDate() + 1);
            }

            notifications.push({
                title: 'Motiv8 Daily',
                body: `"${quote.text}" - ${quote.author}`,
                id: i + 1,
                schedule: { at: triggerDate },
                sound: 'beep.wav',
                attachments: [],
                actionTypeId: '',
                extra: null
            });
        }

        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} notifications`);

    } catch (error) {
        console.error('Error scheduling notifications:', error);
    }
    */
};
