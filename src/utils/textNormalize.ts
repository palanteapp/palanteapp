/**
 * Diacritic-safe word tokenizer for verbatim-echo matching (aiService.ts's
 * anti-echo guards). Mirrors crisisDetection.ts's normalize(): NFD-normalize
 * and strip combining marks before dropping punctuation, so accented words
 * compare correctly instead of losing the accent and silently producing
 * false matches/misses once replies are in Spanish.
 */
export function normalizeWords(text: string): string[] {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strips the Unicode combining-diacritical-marks block (U+0300-U+036F)
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}
