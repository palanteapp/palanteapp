/**
 * Palante Analytics
 * Thin wrapper around PostHog. All tracking goes through here so
 * the provider can be swapped without touching any feature code.
 *
 * To activate: set VITE_POSTHOG_KEY in your .env file.
 */

import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

export function initAnalytics() {
    if (!KEY) return; // Silently skip in dev until key is configured
    posthog.init(KEY, {
        api_host: HOST,
        person_profiles: 'identified_only',
        capture_pageview: false,      // We fire screen_viewed manually
        capture_pageleave: true,
        autocapture: false,           // Explicit events only — no noise
        persistence: 'localStorage',
        loaded: (ph) => {
            if (import.meta.env.DEV) ph.debug();
        },
    });
}

// ─── Identity ────────────────────────────────────────────────────────────────

export function identifyUser(userId: string, traits: {
    name?: string;
    profession?: string;
    subscriptionTier?: string;
    quoteIntensity?: number;
    focusAreas?: string[];
}) {
    if (!KEY) return;
    posthog.identify(userId, traits);
}

export function resetIdentity() {
    if (!KEY) return;
    posthog.reset();
}

// ─── Core helper ─────────────────────────────────────────────────────────────

function track(event: string, props?: Record<string, unknown>) {
    if (!KEY) return;
    posthog.capture(event, props);
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export const analytics = {

    onboardingCompleted(props: {
        profession: string;
        quoteIntensity: number;
        interests: string[];
        contentType: string;
        sourcePreference: string;
    }) {
        track('onboarding_completed', props);
    },

    // ─── Morning ritual ──────────────────────────────────────────────────────

    morningRitualStarted() {
        track('morning_ritual_started');
    },

    morningRitualCompleted(props: {
        hadIntention: boolean;
        gratitudeCount: number;
        affirmationCount: number;
    }) {
        track('morning_ritual_completed', props);
    },

    // ─── Evening practice ────────────────────────────────────────────────────

    eveningPracticeStarted() {
        track('evening_practice_started');
    },

    eveningPracticeCompleted() {
        track('evening_practice_completed');
    },

    // ─── Quotes & affirmations ───────────────────────────────────────────────

    quoteViewed(props: {
        isAI: boolean;
        intensity: number;
        category: string;
        matchedIntention: boolean;  // did today's intention influence this quote?
    }) {
        track('quote_viewed', props);
    },

    quoteFavorited(props: { isAI: boolean; category: string }) {
        track('quote_favorited', props);
    },

    quoteShared(props: { isAI: boolean; category: string }) {
        track('quote_shared', props);
    },

    quoteRefreshed() {
        track('quote_refreshed');
    },

    // ─── Practices ───────────────────────────────────────────────────────────

    practiceCompleted(props: {
        type: 'breath' | 'meditate' | 'reflect' | 'routine' | 'fasting' | 'pomodoro';
        durationMinutes?: number;
        routineName?: string;
    }) {
        track('practice_completed', props);
    },

    // ─── Goals ───────────────────────────────────────────────────────────────

    goalCreated(props: { category: string }) {
        track('goal_created', props);
    },

    goalCompleted(props: { category: string; daysToComplete?: number }) {
        track('goal_completed', props);
    },

    focusTaskAdded() {
        track('focus_task_added');
    },

    focusTaskCompleted() {
        track('focus_task_completed');
    },

    // ─── Coach ───────────────────────────────────────────────────────────────

    coachChatOpened() {
        track('coach_chat_opened');
    },

    coachMessageSent() {
        track('coach_message_sent');
    },

    // ─── Navigation ──────────────────────────────────────────────────────────

    screenViewed(screen: string) {
        track('screen_viewed', { screen });
    },

    // ─── Milestones & retention ───────────────────────────────────────────────

    milestoneReached(props: { milestone: string; totalPractices: number }) {
        track('milestone_reached', props);
    },

    futureLetterWritten() {
        track('future_letter_written');
    },

    futureLetterDelivered() {
        track('future_letter_delivered');
    },

    // ─── Settings & profile ───────────────────────────────────────────────────

    profileUpdated(props: { fieldsChanged: string[] }) {
        track('profile_updated', props);
    },

    themeToggled(props: { isDarkMode: boolean }) {
        track('theme_toggled', props);
    },
};
