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

/**
 * Every AI generation call in the app (morning/evening messages, weekly letter,
 * weekly reflection, growth story, affirmation personalization, and — while
 * COACH_CHAT_ENABLED is also off — the coach chat). Shelved at the same time as
 * the coach: not shipping with an AI coach for now, and every one of these
 * features already has a hand-written, non-AI fallback that reads well on its
 * own (see aiGate.ts's file header) — verified before this flag was flipped.
 *
 * This is the ONE place that has to be false for the Anthropic account to be
 * genuinely unused end to end: `aiGate.ts`'s per-user `aiDisabled` toggle only
 * covers users who opted out, and defaults to AI ON (`defaultProfile.ts`), so
 * without this flag most users would still be generating live AI content. With
 * it off, `isAIEnabled()` is force-false for everyone regardless of their own
 * setting, so no request ever reaches the proxy.
 *
 * The Settings "Enable AI Features" toggle and the first-launch AI disclosure
 * modal are both gated behind this too, so nobody sees a toggle or a
 * disclosure for something that silently does nothing.
 *
 * To re-enable: flip this to true. The per-user aiDisabled toggle, the
 * disclosure modal, and every AI call site are untouched and still wired up.
 */
export const AI_FEATURES_ENABLED = false;
