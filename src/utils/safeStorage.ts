/**
 * Crash-proof reads of JSON stored in localStorage.
 *
 * WHY THIS EXISTS
 * A single corrupt value used to take down the whole app, permanently. `useNotifications`
 * parsed STORAGE_KEYS.NOTIFICATIONS inside a useState initializer with no guard, so a
 * malformed value threw during the first render of AppContent, the error boundary caught
 * it, and every reload hit the same bad bytes and threw again. There is no in-app way out
 * of that state: the user's only recovery is deleting and reinstalling the app.
 *
 * Corruption does not require a bug to reach a user. A write interrupted by the app being
 * backgrounded or killed, a quota error partway through a setItem, or storage eviction on
 * iOS can all leave a truncated value behind.
 *
 * So: never throw, and delete the unreadable key on the way out so the next launch starts
 * clean instead of failing the same way forever. The value could not be read regardless;
 * dropping it costs nothing that was not already lost, and it converts a permanent brick
 * into one session falling back to defaults.
 */

/**
 * Read and parse a JSON value from localStorage, falling back on any failure.
 *
 * Returns `fallback` when the key is absent, unparseable, or `null`, and removes the key
 * when its contents could not be parsed.
 */
export function readJSON<T>(key: string, fallback: T): T {
    let raw: string | null;
    try {
        raw = localStorage.getItem(key);
    } catch {
        // Private mode and disabled-storage environments throw on access.
        return fallback;
    }

    if (raw === null) return fallback;

    try {
        const parsed = JSON.parse(raw);
        // `JSON.parse('null')` succeeds and yields null, which is virtually never what a
        // caller wants behind a typed fallback.
        return parsed === null ? fallback : (parsed as T);
    } catch {
        try {
            localStorage.removeItem(key);
        } catch {
            // Nothing more to do: the read already failed safely.
        }
        return fallback;
    }
}

/**
 * Write a JSON value, swallowing quota and private-mode failures.
 *
 * Returns whether the write succeeded, for the rare caller that needs to know.
 */
export function writeJSON(key: string, value: unknown): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}
