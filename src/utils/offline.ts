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

// LocalStorage keys
const CACHE_KEYS = {
    QUOTE: 'offline_cache_quote',
    COACH_MESSAGE: 'offline_cache_coach_message',
    REFLECTIONS_QUEUE: 'offline_queue_reflections',
} as const;

/**
 * Cache a quote for offline viewing
 */
export const cacheQuote = (quote: Quote): void => {
    try {
        localStorage.setItem(CACHE_KEYS.QUOTE, JSON.stringify(quote));
    } catch (e) {
        console.error('Failed to cache quote:', e);
    }
};

/**
 * Get cached quote
 */
export const getCachedQuote = (): Quote | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEYS.QUOTE);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        console.error('Failed to get cached quote:', e);
        return null;
    }
};

/**
 * Cache a coach message for offline viewing
 */
export const cacheCoachMessage = (message: string): void => {
    try {
        localStorage.setItem(CACHE_KEYS.COACH_MESSAGE, message);
    } catch (e) {
        console.error('Failed to cache coach message:', e);
    }
};

/**
 * Get cached coach message
 */
export const getCachedCoachMessage = (): string | null => {
    try {
        return localStorage.getItem(CACHE_KEYS.COACH_MESSAGE);
    } catch (e) {
        console.error('Failed to get cached coach message:', e);
        return null;
    }
};

/**
 * Queue a reflection/journal entry for sync when online
 */
export const queueReflection = (entry: any): void => {
    try {
        const queue = getReflectionQueue();
        queue.push({ ...entry, queuedAt: Date.now() });
        localStorage.setItem(CACHE_KEYS.REFLECTIONS_QUEUE, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to queue reflection:', e);
    }
};

/**
 * Get queued reflections
 */
export const getReflectionQueue = (): any[] => {
    try {
        const queue = localStorage.getItem(CACHE_KEYS.REFLECTIONS_QUEUE);
        return queue ? JSON.parse(queue) : [];
    } catch (e) {
        console.error('Failed to get reflection queue:', e);
        return [];
    }
};

/**
 * Clear reflection queue (after successful sync)
 */
export const clearReflectionQueue = (): void => {
    try {
        localStorage.removeItem(CACHE_KEYS.REFLECTIONS_QUEUE);
    } catch (e) {
        console.error('Failed to clear reflection queue:', e);
    }
};
