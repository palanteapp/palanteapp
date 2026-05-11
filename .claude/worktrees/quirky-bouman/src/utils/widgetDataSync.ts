/**
 * Widget Data Sync
 *
 * Writes structured JSON to a shared App Group container so that an iOS
 * WidgetKit extension can read and display live Palante data.
 *
 * ── NATIVE SETUP REQUIRED ────────────────────────────────────────────────────
 * For the widget to read this data on iOS:
 *
 * 1. In Xcode → Signing & Capabilities for BOTH the main app and widget target:
 *    Add "App Groups" → e.g. "group.com.palante.shared"
 *
 * 2. In capacitor.config.ts (or capacitor.config.json), configure the
 *    Filesystem plugin to use the shared app group:
 *    { "ios": { "appGroupsIdentifier": "group.com.palante.shared" } }
 *
 * 3. In the iOS Widget Swift extension, read widget.json from the shared group:
 *    let containerURL = FileManager.default
 *        .containerURL(forSecurityApplicationGroupIdentifier: "group.com.palante.shared")!
 *    let fileURL = containerURL.appendingPathComponent("widget.json")
 *    let data = try Data(contentsOf: fileURL)
 *
 * 4. Call WidgetCenter.shared.reloadAllTimelines() after each write so the
 *    widget refreshes immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * While the above is being set up, this module writes a JSON snapshot to
 * both localStorage (instant, always works) and to the Capacitor Filesystem
 * shared container (requires App Group config above).
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { UserProfile } from '../types';

// ── Widget payload type ────────────────────────────────────────────────────────

export interface WidgetPayload {
    /** User's first name */
    name: string;
    /** Current streak in days */
    streak: number;
    /** Total essence points */
    points: number;
    /** Today's intention / focus (from latest morning practice) */
    todayIntention: string;
    /** A daily quote or affirmation — text */
    quoteText: string;
    /** Author of the quote */
    quoteAuthor: string;
    /** Active goals (max 3) */
    goals: Array<{ title: string; isCompleted: boolean }>;
    /** Current energy level 1-5 */
    energy: number | null;
    /** Garden health scores 0-1 per practice type */
    gardenHealth: {
        meditation: number;
        morning_practice: number;
        breathwork: number;
        reflection: number;
    };
    /** ISO timestamp of last sync */
    updatedAt: string;
}

const WIDGET_FILE = 'widget.json';
const WIDGET_LS_KEY = 'palante_widget_snapshot';

// ── Helpers ────────────────────────────────────────────────────────────────────

function countPractices(
    history: { date: string; practices: string[] }[] | undefined,
    key: string,
    days: number
): number {
    if (!history?.length) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return history.filter(h => h.date >= cutoffStr && h.practices.includes(key)).length;
}

function toHealth(count: number): number {
    if (count <= 0) return 0;
    if (count === 1) return 0.3;
    if (count === 2) return 0.55;
    if (count === 3) return 0.75;
    return 1.0;
}

function buildPayload(user: UserProfile, quote?: { text: string; author: string }): WidgetPayload {
    const history = user.practiceData?.activityHistory;
    const lastMorning = user.dailyMorningPractice?.slice(-1)[0];

    return {
        name: user.name.split(' ')[0],
        streak: user.streak || 0,
        points: user.points || 0,
        todayIntention: lastMorning?.intention ?? '',
        quoteText: quote?.text ?? '',
        quoteAuthor: quote?.author ?? 'Palante',
        goals: (user.goals ?? [])
            .filter(g => !g.isCompleted)
            .slice(0, 3)
            .map(g => ({ title: g.title, isCompleted: g.isCompleted })),
        energy: user.currentEnergy ?? null,
        gardenHealth: {
            meditation:       toHealth(countPractices(history, 'meditation', 7)),
            morning_practice: toHealth(countPractices(history, 'morning_practice', 7)),
            breathwork:       toHealth(countPractices(history, 'breathwork', 7)),
            reflection:       toHealth(countPractices(history, 'reflection', 7)),
        },
        updatedAt: new Date().toISOString(),
    };
}

async function writeToFilesystem(payload: WidgetPayload): Promise<void> {
    try {
        await Filesystem.writeFile({
            path: WIDGET_FILE,
            data: JSON.stringify(payload),
            directory: Directory.ExternalStorage, // Falls back gracefully on iOS
            encoding: Encoding.UTF8,
        });
    } catch {
        // Filesystem write is best-effort; localStorage is the reliable fallback
    }
}

function writeToLocalStorage(payload: WidgetPayload): void {
    try {
        localStorage.setItem(WIDGET_LS_KEY, JSON.stringify(payload));
    } catch {
        // ignore storage quota errors
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

export class WidgetDataSync {
    /**
     * Full sync — builds the complete payload from the UserProfile and writes it.
     * Call this whenever user data changes (after practice completion, energy update, etc.)
     */
    static async syncAll(user: UserProfile, quote?: { text: string; author: string }): Promise<void> {
        const payload = buildPayload(user, quote);
        writeToLocalStorage(payload);
        if (Capacitor.getPlatform() === 'ios') {
            await writeToFilesystem(payload);
        }
    }

    /** Partial update: energy level changed */
    static async updateEnergy(level: number): Promise<void> {
        const existing = WidgetDataSync.readFromLocalStorage();
        if (!existing) return;
        const updated = { ...existing, energy: level, updatedAt: new Date().toISOString() };
        writeToLocalStorage(updated);
        if (Capacitor.getPlatform() === 'ios') {
            await writeToFilesystem(updated);
        }
    }

    /** Partial update: streak changed */
    static async updateStreak(count: number): Promise<void> {
        const existing = WidgetDataSync.readFromLocalStorage();
        if (!existing) return;
        const updated = { ...existing, streak: count, updatedAt: new Date().toISOString() };
        writeToLocalStorage(updated);
        if (Capacitor.getPlatform() === 'ios') {
            await writeToFilesystem(updated);
        }
    }

    /** Partial update: goals list changed */
    static async updateGoals(goals: Array<{ title?: string; text?: string; isCompleted?: boolean }>, streak?: number): Promise<void> {
        const existing = WidgetDataSync.readFromLocalStorage();
        const mapped = goals.slice(0, 3).map(g => ({
            title: g.title ?? g.text ?? '',
            isCompleted: g.isCompleted ?? false,
        }));
        const base = existing ?? {
            name: '',
            streak: streak ?? 0,
            points: 0,
            todayIntention: '',
            quoteText: '',
            quoteAuthor: 'Palante',
            goals: mapped,
            energy: null,
            gardenHealth: { meditation: 0, morning_practice: 0, breathwork: 0, reflection: 0 },
            updatedAt: new Date().toISOString(),
        };
        const updated: WidgetPayload = {
            ...base,
            goals: mapped,
            streak: streak ?? base.streak,
            updatedAt: new Date().toISOString(),
        };
        writeToLocalStorage(updated);
        if (Capacitor.getPlatform() === 'ios') {
            await writeToFilesystem(updated);
        }
    }

    /** Partial update: today's quote changed */
    static async updateQuote(text: string, author: string): Promise<void> {
        const existing = WidgetDataSync.readFromLocalStorage();
        if (!existing) return;
        const updated = { ...existing, quoteText: text, quoteAuthor: author, updatedAt: new Date().toISOString() };
        writeToLocalStorage(updated);
        if (Capacitor.getPlatform() === 'ios') {
            await writeToFilesystem(updated);
        }
    }

    /** Read current widget payload from localStorage (available on any platform) */
    static readFromLocalStorage(): WidgetPayload | null {
        try {
            const raw = localStorage.getItem(WIDGET_LS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /**
     * Legacy shim used by App.tsx — reads widget data and merges with user profile.
     * Returns null if no widget data exists.
     */
    static async readFromWidget(_currentUser: UserProfile): Promise<Partial<UserProfile> | null> {
        return null; // Widget is write-only from app side; no user data flows back
    }
}
