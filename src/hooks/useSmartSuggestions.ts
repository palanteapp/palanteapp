
import { useMemo } from 'react';
import type { UserProfile } from '../types';

export type SuggestionType = 'breath' | 'move' | 'focus' | 'reflect' | 'rest' | 'priming' | 'hydrate';

export interface SmartSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    actionLabel: string;
    toolId: 'breath' | 'meditate' | 'reflect' | 'fasting' | 'soundscapes' | 'routines' | 'none'; // 'none' for things like hydration
    priority: number; // Higher is more urgent
}

export const useSmartSuggestions = (user: UserProfile | null, isDarkMode: boolean) => {
    const suggestion = useMemo((): SmartSuggestion | null => {
        if (!user) return null;

        const now = new Date();
        const hour = now.getHours();
        const currentEnergy = user.currentEnergy;
        const lastAction = user.practiceData?.lastActivityDate; // Crude proxy, ideal would be "lastActionType"

        // 1. SIGNAL: Low Energy (1-2) -> Immediate Restoration
        if (currentEnergy === 1 || currentEnergy === 2) {
            return {
                id: 'low-energy-restore',
                type: 'breath',
                title: 'You seem a bit drained.',
                description: 'A 60-second recharge could help you reset.',
                actionLabel: 'Take a Breath',
                toolId: 'breath',
                priority: 10
            };
        }

        // 2. SIGNAL: High Energy (4-5) -> Channel Selection
        // 2. SIGNAL: High Energy (4-5)
        if (currentEnergy === 4 || currentEnergy === 5) {
            if (hour >= 9 && hour <= 17) {
                // Work Hours -> Deep Work
                return {
                    id: 'high-energy-focus',
                    type: 'focus',
                    title: 'Energy is high. Channel it.',
                    description: 'Perfect time for a deep work session.',
                    actionLabel: 'Start Focus Timer',
                    toolId: 'routines',
                    priority: 8
                };
            } else {
                // Off Hours -> Creative / Social / Active
                return {
                    id: 'high-energy-offhours',
                    type: 'move',
                    title: 'You are buzzing!',
                    description: 'Great time for a workout or passion project.',
                    actionLabel: 'Use the Energy',
                    toolId: 'none',
                    priority: 8
                };
            }
        }

        // 3. SIGNAL: Steady Energy (3) -> Maintenance
        if (currentEnergy === 3) {
            return {
                id: 'steady-energy',
                type: 'focus',
                title: 'You are balanced.',
                description: 'A stable state is perfect for clearing your list.',
                actionLabel: 'View Goals',
                toolId: 'routines', // or Goals tab if we could link it
                priority: 7
            };
        }

        // 3. SIGNAL: Morning (6am - 10am) -> Priming
        if (hour >= 6 && hour < 10) {
            // Check if priming is done today? 
            // Assuming dailyMorningPractice or journal entry exists for today
            const today = now.toISOString().split('T')[0];
            const hasPrimed = user.dailyPriming?.some(p => p.date === today);

            if (!hasPrimed) {
                return {
                    id: 'morning-prime',
                    type: 'priming',
                    title: 'Start your day strong.',
                    description: 'Set your intention before the chaos starts.',
                    actionLabel: 'Morning Priming',
                    toolId: 'routines', // Points to Morning Routine usually
                    priority: 5
                };
            }
        }

        // 4. SIGNAL: Evening (6pm - 10pm) -> Reflection
        if (hour >= 18 && hour < 22) {
            const today = now.toISOString().split('T')[0];
            const hasReflected = user.journalEntries?.some(e => e.date === today);

            if (!hasReflected) {
                return {
                    id: 'evening-reflect',
                    type: 'reflect',
                    title: 'Close the loop on today.',
                    description: 'A quick reflection helps you sleep better.',
                    actionLabel: 'Evening Reflection',
                    toolId: 'reflect',
                    priority: 5
                };
            }
        }

        // Default: Silence (No suggestion is better than a bad one)
        return null;

    }, [user?.currentEnergy, user?.practiceData?.lastActivityDate, user?.journalEntries, user?.dailyPriming]);

    return suggestion;
};
