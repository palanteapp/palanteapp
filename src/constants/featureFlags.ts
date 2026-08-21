// Centralized feature flags. Each flag is a single source of truth for whether
// a feature is reachable — flip the value here rather than hunting down every
// call site again.

/**
 * Interactive AI chat partner (CoachView.tsx). Shelved for the Oct 2026 release:
 * every entry point into the coach tab is gated behind this flag, but the
 * underlying implementation is left fully intact so this is a clean re-enable
 * later. Untouched and ready to go: CoachView.tsx, the chat functions in
 * aiService.ts, messageReport.ts, and useContinuityOpener.ts.
 *
 * There is exactly one kill-switch for the daily continuity opener: an early
 * check inside useContinuityOpener.ts itself (every effect no-ops while this
 * flag is off, so no memories load and no AI call fires). App.tsx calls the
 * real hook unconditionally and the Partner Discovery / Memory callback cards
 * are gated only by this flag at their JSX usage sites — there's no second,
 * separately-hardcoded switch to keep in sync.
 *
 * To re-enable:
 *   1. Flip this to true.
 *   2. Sanity-check the Partner Discovery / Memory callback cards in App.tsx
 *      still read well — they're gated behind this flag, not deleted.
 */
export const COACH_CHAT_ENABLED = false;
