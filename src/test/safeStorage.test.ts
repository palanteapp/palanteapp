/**
 * These exist because a corrupt localStorage value used to be unrecoverable. A malformed
 * STORAGE_KEYS.NOTIFICATIONS threw from a useState initializer during the first render of
 * AppContent, so the app died at boot, and because the bad bytes stayed on disk it died
 * the same way on every relaunch. The only user-side fix was reinstalling.
 *
 * The contract that prevents a repeat: reads never throw, and an unparseable key is
 * cleared on the way out so the next launch is clean.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readJSON, writeJSON } from '../utils/safeStorage';

describe('readJSON', () => {
    beforeEach(() => localStorage.clear());

    it('returns the parsed value for well-formed JSON', () => {
        localStorage.setItem('k', JSON.stringify({ a: 1 }));
        expect(readJSON('k', { a: 0 })).toEqual({ a: 1 });
    });

    it('returns the fallback for a missing key', () => {
        expect(readJSON('absent', { a: 0 })).toEqual({ a: 0 });
    });

    it('returns the fallback instead of throwing on malformed JSON', () => {
        localStorage.setItem('k', '{not valid json');
        expect(() => readJSON('k', { a: 0 })).not.toThrow();
        expect(readJSON('k', { a: 0 })).toEqual({ a: 0 });
    });

    /**
     * The part that turns a permanent brick into a single bad session. Without this the
     * value stays on disk and every subsequent launch reads the same broken bytes.
     */
    it('deletes the corrupt key so the next launch starts clean', () => {
        localStorage.setItem('k', '{not valid json');
        readJSON('k', null);
        expect(localStorage.getItem('k')).toBeNull();
    });

    it('leaves a valid key in place', () => {
        localStorage.setItem('k', '{"a":1}');
        readJSON('k', null);
        expect(localStorage.getItem('k')).toBe('{"a":1}');
    });

    it('treats a stored literal null as absent', () => {
        localStorage.setItem('k', 'null');
        expect(readJSON('k', { a: 0 })).toEqual({ a: 0 });
    });

    it('survives every kind of truncation of a real value', () => {
        const full = JSON.stringify({ enabled: true, frequency: 5, quietStart: '22:00' });
        for (let cut = 1; cut < full.length; cut++) {
            localStorage.setItem('k', full.slice(0, cut));
            expect(() => readJSON('k', null)).not.toThrow();
        }
    });

    it('returns the fallback when localStorage itself throws', () => {
        const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('SecurityError: storage disabled');
        });
        expect(readJSON('k', 'fallback')).toBe('fallback');
        spy.mockRestore();
    });
});

describe('writeJSON', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => vi.restoreAllMocks());

    it('round-trips through readJSON', () => {
        writeJSON('k', { a: 1 });
        expect(readJSON('k', null)).toEqual({ a: 1 });
    });

    it('reports failure instead of throwing when the quota is exceeded', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        expect(() => writeJSON('k', { a: 1 })).not.toThrow();
        expect(writeJSON('k', { a: 1 })).toBe(false);
    });
});
