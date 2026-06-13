// Fetch wrapper that aborts hung connections so AI calls fall back to local
// content instead of spinning forever on dead networks (subway, captive wifi).
export const AI_FETCH_TIMEOUT_MS = 20_000;

export async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number = AI_FETCH_TIMEOUT_MS,
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}
