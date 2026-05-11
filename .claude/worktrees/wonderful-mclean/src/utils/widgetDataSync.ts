import type { UserProfile } from '../types';

/**
 * Widget Data Sync - DEACTIVATED
 * All widget functionality has been removed.
 */
export class WidgetDataSync {
    static async syncAll(_user: UserProfile): Promise<void> {
        // Disabled
        return;
    }

    static async readFromWidget(_currentUser: UserProfile): Promise<Partial<UserProfile> | null> {
        // Disabled
        return null;
    }

    static async updateEnergy(_level: number): Promise<void> {
        return;
    }

    static async updateStreak(_count: number): Promise<void> {
        return;
    }

    static async updateGoals(_goals: unknown[], _streak: number = 0): Promise<void> {
        return;
    }

    static async updateQuote(_text: string, _author: string): Promise<void> {
        return;
    }
}
