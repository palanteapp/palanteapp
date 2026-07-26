import { useEffect, useState } from 'react';
import type { UserProfile } from '../types';
import { loadConversationMemories } from '../utils/memoryService';
import { generateContinuityOpener } from '../utils/aiService';
import { STORAGE_KEYS } from '../constants/storageKeys';

/** Local day key, 'YYYY-MM-DD'. Resets the cached opener at local midnight. */
export const localDayKey = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Read today's cached continuity opener synchronously, or null if absent/stale. */
export const readCachedOpener = (): string | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.CONTINUITY_OPENER);
        if (!raw) return null;
        const cached = JSON.parse(raw) as { date: string; text: string };
        return cached.date === localDayKey() ? (cached.text || null) : null;
    } catch {
        return null;
    }
};

// Module-level in-flight guard. The opener can be requested from two places at
// once (the app root, for the home card, and the Coach tab). With a cold cache
// both would otherwise fire their own generation; this shares a single call per
// day so we never double-spend the daily budget.
let inflight: Promise<string | null> | null = null;
let inflightDay: string | null = null;

/**
 * Loads the user's cross-session memories and precomputes the memory-aware
 * continuity opener once per local day (cached in localStorage). Safe to mount
 * from multiple components: memory loading is per-instance, but generation is
 * de-duped across callers via the module-level guard above.
 *
 * Returns both the raw memories (for chat context) and the ready callback line.
 */
export function useContinuityOpener(
    user: UserProfile | null | undefined,
): { persistedMemories: string[]; continuityOpener: string | null } {
    const [persistedMemories, setPersistedMemories] = useState<string[]>([]);
    const [continuityOpener, setContinuityOpener] = useState<string | null>(() => readCachedOpener());

    const userId = user?.id;
    const userName = user?.name;
    const coachName = user?.coachName;

    // Load cross-session memories so the partner remembers across conversations.
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        loadConversationMemories(userId)
            .then(m => { if (!cancelled) setPersistedMemories(m); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [userId]);

    // Precompute the opener once per day. A cache hit for today (including an
    // empty "" = nothing worth recalling) means we've already spent today's call.
    useEffect(() => {
        if (!userId || persistedMemories.length === 0) return;

        const today = localDayKey();
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CONTINUITY_OPENER);
            if (raw) {
                const cached = JSON.parse(raw) as { date: string; text: string };
                if (cached.date === today) {
                    setContinuityOpener(cached.text || null);
                    return;
                }
            }
        } catch { /* corrupt cache, fall through and regenerate */ }

        let cancelled = false;
        if (!inflight || inflightDay !== today) {
            inflightDay = today;
            inflight = generateContinuityOpener(persistedMemories, userName || 'Friend', coachName)
                .then(line => {
                    try {
                        localStorage.setItem(STORAGE_KEYS.CONTINUITY_OPENER, JSON.stringify({ date: today, text: line ?? '' }));
                    } catch { /* best-effort cache */ }
                    return line;
                })
                .catch(() => null);
        }
        inflight.then(line => { if (!cancelled) setContinuityOpener(line); });
        return () => { cancelled = true; };
    }, [userId, userName, coachName, persistedMemories]);

    return { persistedMemories, continuityOpener };
}
