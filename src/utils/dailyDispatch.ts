/**
 * Daily Dispatch: Proactive coach notification generator.
 *
 * After a user completes their morning practice, this generates 3
 * personalized notifications spaced through the day that reference
 * their actual intention, gratitude, and momentum state.
 *
 * No API calls. Pure template logic driven by real user data.
 */

import type { PrimaryIntent } from '../types';

export interface DispatchMessage {
    body: string;
    minutesFromNow: number;
}

type CoachTone = 'nurturing' | 'direct' | 'accountability';
type MomentumState = 'on_a_roll' | 'recovering' | 'breakthrough' | 'steady';

// Map the onboarding "what's bringing you here?" answer to the partner's default voice,
// so a person who came to "manage stress" is met with a calmer tone than someone here
// to "build consistency." Used only as the default, an explicit tone in settings wins.
const INTENT_TONE: Record<PrimaryIntent, CoachTone> = {
    consistency: 'accountability',
    clarity:     'direct',
    stress:      'nurturing',
    purpose:     'nurturing',
};

export function intentToTone(intent?: PrimaryIntent | null): CoachTone | undefined {
    return intent ? INTENT_TONE[intent] : undefined;
}

// Intent-flavored midday lines. Used when the user has no typed intention to reference yet
// (e.g. their first days, or a quick practice) so the dispatch still speaks to their "why."
const INTENT_OPENER: Record<PrimaryIntent, string[]> = {
    consistency: [
        '{name}, showing up today is the whole game. You came here to be consistent. This is it.',
        'Consistency is just today, repeated. You already did today. Keep it going, {name}.',
        'The streak isn\'t the point, {name}. The showing-up is. And you showed up.',
    ],
    clarity: [
        '{name}, you came here for clarity. Take one minute now to name the single thing that matters most today.',
        'Clarity comes from subtraction. What can you set down for the rest of today, {name}?',
        'A clear afternoon beats a busy one. What\'s the one thing, {name}?',
    ],
    stress: [
        '{name}, one slow breath right now. You came here to feel steadier. This is the moment to practice it.',
        'Whatever the afternoon holds, {name}, your shoulders can come down an inch. Try it now.',
        'You don\'t have to carry it all at once, {name}. Just the next thing.',
    ],
    purpose: [
        '{name}, you\'re here to make your days mean something. Does this afternoon point that direction?',
        'Purpose lives in small choices, {name}. Pick one that matters in the next hour.',
        'Before the day runs out, {name}, one act that feels like the person you\'re becoming.',
    ],
};

// ─── Template pools ───────────────────────────────────────────────────────────
// Each key is [tone][slot] where slot is 'midday', 'afternoon', or 'sunset'.
// {intention} and {gratitude} are replaced at runtime with real values.
// {name} is replaced with the user's first name.

const INTENTION_MIDDAY: Record<CoachTone, string[]> = {
    nurturing: [
        'You set "{intention}" as your intention this morning. How is it sitting with you now?',
        '"{intention}". The morning was yours. The afternoon still is.',
        'Halfway through the day. Is "{intention}" still what today is about?',
    ],
    direct: [
        '"{intention}". Midday checkpoint. Are you living it?',
        'Your intention was "{intention}". The afternoon is where it gets real.',
        'You said "{intention}" this morning. Mid-day audit: how are you doing?',
    ],
    accountability: [
        'You committed to "{intention}" this morning. The afternoon is where commitments get tested.',
        '"{intention}". You put that into the world today. Are you honoring it?',
        'Midday. "{intention}". No excuses. Just honest check-in.',
    ],
};

const GRATITUDE_AFTERNOON: Record<CoachTone, string[]> = {
    nurturing: [
        'You said you\'re grateful for "{gratitude}" today. Let that anchor you through the rest of the afternoon.',
        '"{gratitude}". You named that this morning. Hold it close as the day winds down.',
        'The thing you\'re most grateful for today: "{gratitude}". Don\'t lose sight of it.',
    ],
    direct: [
        '"{gratitude}". You wrote that this morning. Use that energy now.',
        'You named "{gratitude}" as something that matters. Keep that in mind.',
        'Gratitude on deck: "{gratitude}". Let that fuel the last push of your day.',
    ],
    accountability: [
        'You said "{gratitude}" is worth being grateful for. Are you acting like it?',
        '"{gratitude}". You named that. Make your afternoon worthy of it.',
        'Your gratitude was "{gratitude}". What are you doing with that right now?',
    ],
};

const SUNSET_INTENTIONS: Record<CoachTone, string[]> = {
    nurturing: [
        'The day is almost done. How did "{intention}" feel? Your evening reflection is waiting.',
        'Before you close out, you set "{intention}" this morning. How did today honor that?',
        'One last check-in on "{intention}". Then take a moment to close it out.',
    ],
    direct: [
        '"{intention}". How did today go? Your evening reflection takes 3 minutes.',
        'End-of-day audit: "{intention}". Did the day match the intention?',
        'The sun is setting on your intention: "{intention}". Time to reflect.',
    ],
    accountability: [
        'You set "{intention}" this morning. The day is almost over. Did you mean it?',
        'One question before tonight: did "{intention}" guide your day?',
        '"{intention}". Day\'s almost done. Own the result, whatever it is.',
    ],
};

// Fallback messages when no intention or gratitude is available
const MIDDAY_FALLBACK: Record<CoachTone, string[]> = {
    nurturing: [
        '{name}, you showed up this morning. The afternoon is still yours.',
        'Halfway through the day. Take a breath. You\'re doing the work.',
        'Midday check-in: how are you really doing, {name}?',
    ],
    direct: [
        'Midday, {name}. Are you still on track with what matters?',
        'Half the day is gone. What are you doing with the other half?',
        'Check in with yourself. Right now. How is today actually going?',
    ],
    accountability: [
        '{name}, the morning was warm-up. The afternoon is the game. Stay in it.',
        'Midday. No coast mode. Keep the standard high.',
        'Half the day done. The second half is where it counts.',
    ],
};

const AFTERNOON_FALLBACK: Record<CoachTone, string[]> = {
    nurturing: [
        'The afternoon energy dip is real, {name}. One breath. Then keep going.',
        'You put in real work this morning. Don\'t let the afternoon undo it.',
        '{name}, you\'re closer to the end of the day than the beginning. Finish strong.',
    ],
    direct: [
        'Afternoon slump is a test. Pass it.',
        '{name}, now\'s not the time to drift. Refocus.',
        'You set an intention today. The afternoon is where it either holds or folds.',
    ],
    accountability: [
        '{name}, this is the hour most people lose. You\'re not most people.',
        'The afternoon is the weakest hour. Make it your strongest.',
        'You started strong this morning. Don\'t let up now.',
    ],
};

const SUNSET_FALLBACK: Record<CoachTone, string[]> = {
    nurturing: [
        '{name}, the day is winding down. Your evening reflection is waiting. Just 3 minutes.',
        'Before you close out: what are you grateful for right now? Your reflection is ready.',
        'One honest evening reflection tonight compounds into clarity tomorrow.',
    ],
    direct: [
        'Day\'s almost done. Time to close it out properly.',
        '{name}, your evening reflection takes 3 minutes. Don\'t skip it.',
        'The day isn\'t done until you reflect on it. 3 minutes.',
    ],
    accountability: [
        '{name}, you don\'t log the day until you reflect on it. It\'s time.',
        'High performers close the day with intention. Your reflection is ready.',
        'The athletes who win study the game tape. Your evening reflection is your tape.',
    ],
};

// Momentum-specific bursts (mid-session, for users on streaks/breakthrough)
const MOMENTUM_BURST: Record<CoachTone, string[]> = {
    nurturing: [
        '{name}, you\'ve been building something real. Today is another chance to add to it.',
        'Something good is happening in you right now. Don\'t stop.',
        'The consistency you\'re building is real, {name}. Keep going.',
    ],
    direct: [
        'You\'re on a roll, {name}. Don\'t waste this window.',
        'Momentum is rare. You have it. Use it.',
        '{name}, this is your season. Stay in it.',
    ],
    accountability: [
        'Momentum is a muscle. You\'re building yours, {name}. Don\'t skip a rep.',
        'You\'re in a streak. The only thing that ends it is you. Don\'t.',
        '{name}, you\'ve earned this pace. Now hold it.',
    ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template: string, firstName: string, intention?: string, gratitude?: string): string {
    return template
        .replace(/\{name\}/g, firstName)
        .replace(/\{intention\}/g, intention || 'your intention')
        .replace(/\{gratitude\}/g, gratitude || 'what matters most to you');
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateDailyDispatch(params: {
    intention?: string;
    gratitudes?: string[];
    firstName: string;
    tone?: CoachTone;
    momentumState?: MomentumState;
    intent?: PrimaryIntent | null;
}): DispatchMessage[] {
    const {
        intention,
        gratitudes = [],
        firstName,
        tone = 'nurturing',
        momentumState = 'steady',
        intent,
    } = params;

    // Pick the most specific (longest) gratitude for the notification
    const gratitude = gratitudes
        .filter(g => g.trim().length > 3)
        .sort((a, b) => b.length - a.length)[0];

    const isOnRoll = momentumState === 'on_a_roll' || momentumState === 'breakthrough';

    // ── Message 1: Midday (~3 hours) ─────────────────────────────────────────
    let middayBody: string;
    if (isOnRoll) {
        middayBody = fill(pick(MOMENTUM_BURST[tone]), firstName, intention, gratitude);
    } else if (intention && intention.trim().length > 2) {
        middayBody = fill(pick(INTENTION_MIDDAY[tone]), firstName, intention, gratitude);
    } else if (intent) {
        // No typed intention to reference: fall back to their onboarding "why" instead of a generic nudge.
        middayBody = fill(pick(INTENT_OPENER[intent]), firstName, intention, gratitude);
    } else {
        middayBody = fill(pick(MIDDAY_FALLBACK[tone]), firstName, intention, gratitude);
    }

    // ── Message 2: Afternoon (~5 hours) ──────────────────────────────────────
    let afternoonBody: string;
    if (gratitude && gratitude.trim().length > 3) {
        afternoonBody = fill(pick(GRATITUDE_AFTERNOON[tone]), firstName, intention, gratitude);
    } else {
        afternoonBody = fill(pick(AFTERNOON_FALLBACK[tone]), firstName, intention, gratitude);
    }

    // ── Message 3: Sunset (~7 hours) ─────────────────────────────────────────
    let sunsetBody: string;
    if (intention && intention.trim().length > 2) {
        sunsetBody = fill(pick(SUNSET_INTENTIONS[tone]), firstName, intention, gratitude);
    } else {
        sunsetBody = fill(pick(SUNSET_FALLBACK[tone]), firstName, intention, gratitude);
    }

    return [
        { body: middayBody,   minutesFromNow: 180 },
        { body: afternoonBody, minutesFromNow: 300 },
        { body: sunsetBody,   minutesFromNow: 420 },
    ];
}

/**
 * Recovery dispatch: sent when user returns after 2+ days away.
 * Called from App.tsx open-app detection, not post-practice.
 */
export function generateRecoveryDispatch(params: {
    firstName: string;
    daysMissed: number;
    tone?: CoachTone;
}): DispatchMessage {
    const { firstName, daysMissed, tone = 'nurturing' } = params;

    const pools: Record<CoachTone, string[]> = {
        nurturing: [
            `${firstName}, your spot is still here. No explanation needed. Ready when you are.`,
            `It's been ${daysMissed} days. That's okay. What matters is you're back.`,
            `The garden kept growing, ${firstName}. Welcome back.`,
        ],
        direct: [
            `${daysMissed} days gone. The streak broke. That happens. Come back.`,
            `${firstName}, it's been a few days. The only question is what happens next.`,
            `You know what to do, ${firstName}. You just have to do it again.`,
        ],
        accountability: [
            `${firstName}, the longer the gap, the harder it gets. But you already know that.`,
            `${daysMissed} days. No judgment. But today counts. Make it count.`,
            `You built something good. Don't let it fade. Come back today, ${firstName}.`,
        ],
    };

    return {
        body: pick(pools[tone]),
        minutesFromNow: 2, // Near-immediate, sent on app open
    };
}
