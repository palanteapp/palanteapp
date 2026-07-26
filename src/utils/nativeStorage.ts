import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { UserProfile } from '../types';

const BACKUP_FILE = 'palante_user_backup.json';

// Writes to localStorage immediately (sync), then mirrors to native filesystem
// non-blocking. On iOS, WKWebView localStorage can be evicted under disk pressure;
// the native Documents directory persists independently and is iCloud-backed.
export const persistProfile = (user: UserProfile): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (!Capacitor.isNativePlatform()) return;
    Filesystem.writeFile({
        path: BACKUP_FILE,
        data: JSON.stringify(user),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
    }).catch(() => {}); // localStorage is already written, native backup is best-effort
};

// Removes the native backup so a deleted account cannot be resurrected by
// loadProfileWithFallback on next launch. Safe to call when no backup exists.
export const clearProfileBackup = async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Filesystem.deleteFile({
            path: BACKUP_FILE,
            directory: Directory.Documents,
        });
    } catch {
        // File may not exist: nothing to clear
    }
};

// Reads from localStorage first (fast path). If evicted, recovers from native
// filesystem and restores localStorage so subsequent reads are fast again.
export const loadProfileWithFallback = async (): Promise<string | null> => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) return stored;

    if (!Capacitor.isNativePlatform()) return null;

    try {
        const result = await Filesystem.readFile({
            path: BACKUP_FILE,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
        });
        const raw = result.data as string;
        localStorage.setItem(STORAGE_KEYS.USER, raw);
        console.info('[Palante] Profile recovered from native storage backup');
        return raw;
    } catch {
        return null;
    }
};
