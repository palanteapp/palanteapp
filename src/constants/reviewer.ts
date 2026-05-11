/**
 * App Store review mode.
 *
 * Apple reviewers spend only minutes with an app, so any feature that
 * normally fires hours after a user action (like the Daily Dispatch
 * notifications) must have a fast-path so reviewers can verify the
 * feature actually works. We key that fast-path off the reviewer's
 * Supabase auth email.
 *
 * Update REVIEWER_EMAIL to whatever account you submit in
 * App Store Connect > App Review Information.
 */

export const REVIEWER_EMAIL = 'appreview@palante.app';

export function isReviewerEmail(email?: string | null): boolean {
    return !!email && email.trim().toLowerCase() === REVIEWER_EMAIL.toLowerCase();
}

/**
 * Daily Dispatch offsets, in minutes, used when the logged-in user is
 * the App Store reviewer account. Real users get the full 3 / 5 / 7 hour
 * cadence from dailyDispatch.ts; reviewers get back-to-back notifications
 * so they can see all three fire within a few minutes of completing the
 * morning practice.
 */
export const REVIEWER_DISPATCH_OFFSETS_MIN = [1, 2, 3];
