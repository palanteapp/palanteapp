// Shared motion vocabulary so every "arrival" moment — onboarding, morning
// practice, the paywall, ring ceremonies, sheets — moves to the same pulse
// instead of each screen picking its own curve and stagger by feel.
// See the design audit: "The first five minutes are five different tempos"
// and "Every stagger delay was chosen by feel, separately."

/** Standard entrance ease: strong deceleration, the app's one arrival curve. */
export const ENTRANCE_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/** Shared spring for sheets/modals that slide up and must also animate back out. */
export const SHEET_SPRING = { type: 'spring' as const, stiffness: 380, damping: 36 };

/**
 * Stagger scale, in seconds, for cascading entrances (cards, list items, rings).
 * `ceremony` is deliberately outside the tight/base/loose run: full-screen,
 * once-in-a-while moments (ring ceremonies) earn a slower, more dramatic pace
 * than everyday UI, so it stays a named exception rather than a stray magic number.
 */
export const STAGGER = {
    tight: 0.04,
    base: 0.07,
    loose: 0.14,
    ceremony: 0.2,
} as const;
