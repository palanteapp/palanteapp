import React from 'react';
import type { Quote } from '../types';

/**
 * Check if the browser is currently online
 */
export const isOnline = (): boolean => {
    return navigator.onLine;
};

/**
 * React hook for online/offline status
 */
export const useOnlineStatus = (): boolean => {
    const [online, setOnline] = React.useState(isOnline());

    React.useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return online;
};

// ── Storage key registry ──────────────────────────────────────────────────────

const CACHE_KEYS = {
    // Original
    QUOTE: 'offline_cache_quote',
    COACH_MESSAGE: 'offline_cache_coach_message',
    REFLECTIONS_QUEUE: 'offline_queue_reflections',
    // New
    DAILY_BRIEF: 'offline_cache_daily_brief',
    DAILY_BRIEF_DATE: 'offline_cache_daily_brief_date',
    AI_REQUEST_QUEUE: 'offline_queue_ai_requests',
    USER_SNAPSHOT: 'offline_cache_user_snapshot',
} as const;

// ── Quote ─────────────────────────────────────────────────────────────────────

export const cacheQuote = (quote: Quote): void => {
    try {
        localStorage.setItem(CACHE_KEYS.QUOTE, JSON.stringify(quote));
    } catch (e) {
        console.error('Failed to cache quote:', e);
    }
};

export const getCachedQuote = (): Quote | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEYS.QUOTE);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

// ── Coach message ─────────────────────────────────────────────────────────────

export const cacheCoachMessage = (message: string): void => {
    try {
        localStorage.setItem(CACHE_KEYS.COACH_MESSAGE, message);
    } catch (e) {
        console.error('Failed to cache coach message:', e);
    }
};

export const getCachedCoachMessage = (): string | null => {
    try {
        return localStorage.getItem(CACHE_KEYS.COACH_MESSAGE);
    } catch {
        return null;
    }
};

// ── Daily brief ───────────────────────────────────────────────────────────────

/**
 * Cache the AI-generated daily brief for today.
 * Brief is invalidated automatically on a new calendar day.
 */
export const cacheDailyBrief = (brief: string): void => {
    try {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(CACHE_KEYS.DAILY_BRIEF, brief);
        localStorage.setItem(CACHE_KEYS.DAILY_BRIEF_DATE, today);
    } catch (e) {
        console.error('Failed to cache daily brief:', e);
    }
};

export const getCachedDailyBrief = (): string | null => {
    try {
        const cachedDate = localStorage.getItem(CACHE_KEYS.DAILY_BRIEF_DATE);
        const today = new Date().toISOString().split('T')[0];
        if (cachedDate !== today) {
            // Stale — clear it
            localStorage.removeItem(CACHE_KEYS.DAILY_BRIEF);
            localStorage.removeItem(CACHE_KEYS.DAILY_BRIEF_DATE);
            return null;
        }
        return localStorage.getItem(CACHE_KEYS.DAILY_BRIEF);
    } catch {
        return null;
    }
};

export const clearCachedDailyBrief = (): void => {
    try {
        localStorage.removeItem(CACHE_KEYS.DAILY_BRIEF);
        localStorage.removeItem(CACHE_KEYS.DAILY_BRIEF_DATE);
    } catch {
        // ignore
    }
};

// ── User snapshot ─────────────────────────────────────────────────────────────
// A lightweight snapshot of the user's essential data for offline display.

interface UserSnapshot {
    name: string;
    streak: number;
    points: number;
    currentEnergy?: number;
    latestIntention?: string;
    cachedAt: string; // ISO timestamp
}

export const cacheUserSnapshot = (snapshot: UserSnapshot): void => {
    try {
        localStorage.setItem(CACHE_KEYS.USER_SNAPSHOT, JSON.stringify({ ...snapshot, cachedAt: new Date().toISOString() }));
    } catch (e) {
        console.error('Failed to cache user snapshot:', e);
    }
};

export const getCachedUserSnapshot = (): UserSnapshot | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEYS.USER_SNAPSHOT);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

// ── Reflection sync queue ─────────────────────────────────────────────────────

export const queueReflection = (entry: Record<string, unknown>): void => {
    try {
        const queue = getReflectionQueue();
        queue.push({ ...entry, queuedAt: Date.now() });
        localStorage.setItem(CACHE_KEYS.REFLECTIONS_QUEUE, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to queue reflection:', e);
    }
};

export const getReflectionQueue = (): Record<string, unknown>[] => {
    try {
        const queue = localStorage.getItem(CACHE_KEYS.REFLECTIONS_QUEUE);
        return queue ? JSON.parse(queue) : [];
    } catch {
        return [];
    }
};

export const clearReflectionQueue = (): void => {
    try {
        localStorage.removeItem(CACHE_KEYS.REFLECTIONS_QUEUE);
    } catch {
        // ignore
    }
};

// ── AI request queue ──────────────────────────────────────────────────────────
// When offline, queue AI requests and flush them when connectivity is restored.

export type QueuedAIRequestType = 'daily_brief' | 'coach_chat' | 'affirmation';

export interface QueuedAIRequest {
    id: string;
    type: QueuedAIRequestType;
    payload: Record<string, unknown>;
    queuedAt: number;
}

export const queueAIRequest = (request: Omit<QueuedAIRequest, 'id' | 'queuedAt'>): void => {
    try {
        const queue = getAIRequestQueue();
        const newRequest: QueuedAIRequest = {
            ...request,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            queuedAt: Date.now(),
        };
        queue.push(newRequest);
        // Keep max 20 queued requests to avoid storage bloat
        const trimmed = queue.slice(-20);
        localStorage.setItem(CACHE_KEYS.AI_REQUEST_QUEUE, JSON.stringify(trimmed));
    } catch (e) {
        console.error('Failed to queue AI request:', e);
    }
};

export const getAIRequestQueue = (): QueuedAIRequest[] => {
    try {
        const raw = localStorage.getItem(CACHE_KEYS.AI_REQUEST_QUEUE);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const clearAIRequestQueue = (): void => {
    try {
        localStorage.removeItem(CACHE_KEYS.AI_REQUEST_QUEUE);
    } catch {
        // ignore
    }
};

/**
 * Flush queued AI requests when connectivity is restored.
 * Pass a handler for each request type that knows how to re-run the request.
 */
export const flushAIRequestQueue = async (
    handler: (request: QueuedAIRequest) => Promise<void>
): Promise<void> => {
    if (!isOnline()) return;
    const queue = getAIRequestQueue();
    if (!queue.length) return;

    clearAIRequestQueue();

    for (const request of queue) {
        try {
            await handler(request);
        } catch (e) {
            console.error(`Failed to flush queued AI request ${request.id}:`, e);
        }
    }
};
