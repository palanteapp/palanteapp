/**
 * AI Gate: the single switch that makes `user.aiDisabled` mean something.
 *
 * WHY THIS EXISTS
 * The Settings toggle ("Enable AI Features") writes `aiDisabled` to the profile, and
 * the AI disclosure shown on first launch promises the user they can turn AI off.
 * Honoring that promise means no user text can reach a model provider once the
 * toggle is off: not the partner chat, not the morning message, not the weekly
 * letter, not the memory summarizer, not text-to-speech.
 *
 * Every AI call in the app is spread across five modules and seventeen fetch sites,
 * each with its own prompt and its own fallback. Rather than gate each one (and
 * silently miss the next feature someone adds), the guard lives in the one line
 * every request must pass through: the function that builds the proxy headers.
 * A disabled call throws before the network is touched, and because every call site
 * already wraps its fetch in try/catch returning a deterministic fallback, the app
 * degrades into its non-AI form with no further changes.
 *
 * The flag is module state rather than a parameter because the AI modules are plain
 * functions called from a dozen components, most of which never receive the user
 * object. `UserContext` owns the write; everything else reads.
 *
 * FAIL-CLOSED: the flag starts `false`. AI stays off until a loaded profile
 * explicitly enables it, so a race at startup can never leak a request for a user
 * who opted out.
 */

let aiEnabled = false;

/** Thrown by {@link assertAIEnabled} when the user has AI turned off. */
export class AIDisabledError extends Error {
    constructor() {
        super('AI features are disabled in settings');
        this.name = 'AIDisabledError';
    }
}

/** True when `err` is the gate refusing a call, not a real failure worth logging. */
export const isAIDisabledError = (err: unknown): boolean =>
    err instanceof AIDisabledError || (err as { name?: string })?.name === 'AIDisabledError';

/**
 * Set from `UserContext` whenever the profile loads or changes.
 * Pass `!user.aiDisabled`, or `false` when there is no user yet.
 */
export const setAIEnabled = (enabled: boolean): void => {
    aiEnabled = enabled;
};

export const isAIEnabled = (): boolean => aiEnabled;

/**
 * Call before issuing any request to a model provider.
 * Throws {@link AIDisabledError} when the user has opted out.
 */
export const assertAIEnabled = (): void => {
    if (!aiEnabled) throw new AIDisabledError();
};
