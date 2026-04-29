import { Capacitor } from '@capacitor/core';
import type { UserProfile } from '../types';
import { PalanteWidgetBridge } from '../plugins/PalanteWidgetBridge';
import { QUOTES } from '../data/quotes';
import { AFFIRMATIONS } from '../data/affirmations';
import { STORAGE_KEYS } from '../constants/storageKeys';

// Deterministic start index so the widget begins at the right position in the
// shuffled batch — advances every hour so the first quote changes each hour.
const hourlyStartIndex = (poolSize: number): number =>
    Math.floor(Date.now() / 3_600_000) % poolSize;

// Read pinned quote from localStorage; returns null if none pinned.
const getPinnedQuote = (): { text: string; author: string } | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PINNED_QUOTE);
        if (!raw) return null;
        const p = JSON.parse(raw);
        return p?.text ? { text: p.text, author: p.author ?? '' } : null;
    } catch { return null; }
};

const isIOS = () => Capacitor.getPlatform() === 'ios';

const todayISO = () => new Date().toISOString().slice(0, 10);

const isPracticeCompleteToday = (user: UserProfile): boolean => {
    const today = todayISO();
    const morning = user.dailyMorningPractice?.some(p => p.date?.startsWith(today));
    return Boolean(morning);
};

// Seeded LCG random — same seed → same sequence, so each day produces a unique
// but deterministic quote batch. Advancing the seed daily ensures no cross-day repeats.
function seededRandom(seed: number): () => number {
    let s = (seed ^ 0xDEADBEEF) >>> 0;
    return () => {
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        s = (s ^ (s >>> 16)) >>> 0;
        return s / 0xFFFFFFFF;
    };
}

function sampleQuotes(count: number, preference?: string): Array<{ text: string; author: string }> {
    let pool;
    if (preference === 'affirmations') {
        pool = [...AFFIRMATIONS];
    } else if (preference === 'quotes') {
        pool = QUOTES.filter(q => !q.isAffirmation);
    } else {
        pool = [...QUOTES];
    }

    // Use today's day-number as seed so each day gets a unique, deterministic batch
    const daySeed = Math.floor(Date.now() / 86_400_000);
    const rand = seededRandom(daySeed);

    // Fisher-Yates with seeded random — no repeats across the batch, and
    // a different order each calendar day
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count).map(q => ({ text: q.text, author: q.author }));
}

export class WidgetDataSync {
    static async syncAll(user: UserProfile): Promise<void> {
        if (!isIOS()) return;
        try {
            const shuffled = sampleQuotes(24, user.contentTypePreference);
            const pinned = getPinnedQuote();
            // Pinned quote leads the array so the widget always starts with it
            const quotes = pinned
                ? [pinned, ...shuffled.filter(q => q.text !== pinned.text)]
                : shuffled;
            const goals = (user.dailyFocuses ?? [])
                .slice(0, 3)
                .map(f => ({ text: f.text ?? '', completed: !!f.isCompleted }));
            const payload = {
                streak: user.streak ?? 0,
                practiceName: 'Morning Practice',
                practiceComplete: isPracticeCompleteToday(user),
                quotes,
                quoteStartIndex: pinned ? 0 : hourlyStartIndex(quotes.length),
                goals,
            };
            // Cache for AppDelegate's direct-read path (bypasses Capacitor plugin)
            try { localStorage.setItem('palante_widget_cache', JSON.stringify(payload)); } catch { /* ignore */ }
            console.log('📲 WidgetDataSync.syncAll calling native bridge', { streak: payload.streak, quotesCount: quotes.length, goalsCount: goals.length });
            await PalanteWidgetBridge.updateWidgetData(payload);
            await PalanteWidgetBridge.reloadWidget();
            console.log('✅ WidgetDataSync.syncAll complete');
        } catch (e) {
            console.error('Widget sync failed', e);
        }
    }

    static async readFromWidget(_currentUser: UserProfile): Promise<Partial<UserProfile> | null> {
        return null;
    }

    static async updateEnergy(_level: number): Promise<void> {
        return;
    }

    static async updateStreak(count: number): Promise<void> {
        if (!isIOS()) return;
        try {
            await PalanteWidgetBridge.updateWidgetData({
                streak: count,
                practiceName: 'Morning Practice',
                practiceComplete: false,
                quotes: sampleQuotes(24),
            });
        } catch (e) {
            console.error('Widget streak update failed', e);
        }
    }

    static async updateGoals(_goals: unknown[], streak: number = 0): Promise<void> {
        if (!isIOS()) return;
        try {
            await PalanteWidgetBridge.updateWidgetData({
                streak,
                practiceName: 'Morning Practice',
                practiceComplete: false,
                quotes: sampleQuotes(24),
            });
        } catch (e) {
            console.error('Widget goals update failed', e);
        }
    }

    static async updateQuote(_text: string, _author: string): Promise<void> {
        return;
    }

    // Re-syncs a fresh shuffled batch when the app returns to foreground
    static async refreshQuotes(user: UserProfile): Promise<void> {
        if (!isIOS()) return;
        try {
            const shuffled = sampleQuotes(24, user.contentTypePreference);
            const pinned = getPinnedQuote();
            const quotes = pinned
                ? [pinned, ...shuffled.filter(q => q.text !== pinned.text)]
                : shuffled;
            const goals = (user.dailyFocuses ?? [])
                .slice(0, 3)
                .map(f => ({ text: f.text ?? '', completed: !!f.isCompleted }));
            await PalanteWidgetBridge.updateWidgetData({
                streak: user.streak ?? 0,
                practiceName: 'Morning Practice',
                practiceComplete: isPracticeCompleteToday(user),
                quotes,
                quoteStartIndex: pinned ? 0 : hourlyStartIndex(quotes.length),
                goals,
            });
            await PalanteWidgetBridge.reloadWidget();
        } catch (e) {
            console.error('Widget foreground refresh failed', e);
        }
    }
}
