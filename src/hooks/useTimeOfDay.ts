import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeContext {
    timeOfDay: TimeOfDay;
    hour: number;
    isMorning: boolean;
    isEvening: boolean;
    isNight: boolean;
    shouldShowMorningMode: boolean;
    shouldShowEveningMode: boolean;
}

/**
 * Hook to detect time of day and provide context-aware UI states
 * 
 * Time Definitions:
 * - Morning: 5 AM - 12 PM (show Morning Mode on first open)
 * - Afternoon: 12 PM - 6 PM
 * - Evening: 6 PM - 9 PM
 * - Night: 9 PM - 5 AM (show Evening Wind-Down mode)
 */
export const useTimeOfDay = (): TimeContext => {
    const [hour, setHour] = useState(new Date().getHours());

    useEffect(() => {
        // Update hour every minute to stay current
        const interval = setInterval(() => {
            setHour(new Date().getHours());
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, []);

    // Determine time of day
    const timeOfDay: TimeOfDay =
        hour >= 5 && hour < 12 ? 'morning' :
            hour >= 12 && hour < 18 ? 'afternoon' :
                hour >= 18 && hour < 21 ? 'evening' : 'night';

    const isMorning = timeOfDay === 'morning';
    const isEvening = timeOfDay === 'evening';
    const isNight = timeOfDay === 'night';

    // Morning Mode: Show on first app open before noon
    const shouldShowMorningMode = isMorning && !sessionStorage.getItem('palante_morning_mode_shown');

    // Evening Mode: Show after 8 PM (20:00) per user feedback
    const shouldShowEveningMode = hour >= 20;

    return {
        timeOfDay,
        hour,
        isMorning,
        isEvening,
        isNight,
        shouldShowMorningMode,
        shouldShowEveningMode
    };
};
