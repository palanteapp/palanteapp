/**
 * AI Service for Palante
 * Uses Anthropic Claude API to generate personalized affirmations and coaching messages.
 * Also contains behavior analysis and coach intervention logic (consolidated from aiCoach).
 */

import { fetchWithTimeout } from './fetchWithTimeout';
import { isChatLimitReached, recordChatCall, getDailyLimitMessage } from './aiUsageBudget';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`;
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

// The proxy validates via the project anon key — no user session needed.
// This avoids Capacitor WKWebView issues where getSession() returns null
// during background/foreground cycles even when the user is authenticated.
function getProxyHeaders(): HeadersInit {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) {
        console.error('[Palante AI] VITE_SUPABASE_ANON_KEY not set — API calls will fail');
        throw new Error('Missing VITE_SUPABASE_ANON_KEY');
    }
    return {
        'content-type': 'application/json',
        'apikey': anonKey,
    };
}

export interface AIAffirmationRequest {
    profession: string;
    focusGoal: string;
    interests: string[];
    quoteIntensity: 1 | 2 | 3; // 1 = Gentle, 2 = Direct, 3 = Bold
    streak?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    userName?: string;
    coachName?: string;
    focusAreas?: string[];
    dailyIntention?: string;
    currentMood?: string;
    currentEnergy?: number;
}

export interface UserContext {
    name: string;
    quoteIntensity: 1 | 2 | 3;
    energyLevel?: number;
    currentStreak: number;
    completedGoals: number;
    totalGoals: number;
    profession?: string;
    activeFocus?: string;
    recentJournalEntries?: { date: string; highlight: string; lowlight: string }[];
    recentReflections?: { date: string; intention: string; reflection: string }[];
    energyTrends?: { timestamp: string; level: number }[];
    // Narrative Engine
    userNarrative?: string;
    momentumState?: 'on_a_roll' | 'recovering' | 'breakthrough' | 'steady';
    currentMood?: string;
    focusAreas?: string[];
    coachTone?: 'nurturing' | 'direct' | 'accountability';
    persistedMemories?: string[];
    healthContext?: { sleepHours?: number; restingHR?: number; sleepTrend?: 'below_average' | 'above_average' | 'typical' };
    bio?: string;
}

export type MomentumState = 'on_a_roll' | 'recovering' | 'breakthrough' | 'steady';

export const getMomentumState = (user: UserProfile): MomentumState => {
    const streak = user.streak || 0;
    const pattern = user.behaviorPattern;
    const consecutiveSkips = pattern?.patterns.skipPatterns.consecutiveSkips ?? 0;
    const avgEnergy = pattern?.patterns.moodPatterns.averageEnergy ?? 3;
    const goalRate = pattern?.patterns.goalCompletionRate ?? 0;

    if (streak >= 14 && avgEnergy >= 3.5 && goalRate >= 0.7) return 'breakthrough';
    if (streak >= 5 && consecutiveSkips === 0 && avgEnergy >= 3) return 'on_a_roll';
    if (consecutiveSkips >= 2 || streak <= 1) return 'recovering';
    return 'steady';
};

const MOMENTUM_GUIDANCE: Record<MomentumState, string> = {
    breakthrough: 'They are in a breakthrough period — deep consistency, high energy, results compounding. Honor the depth of what they are creating.',
    on_a_roll: 'They are building beautiful momentum. Let the message reflect their forward motion and affirm that it is working.',
    recovering: 'They are finding their way back. Let the message be a warm welcome home — gentle, not a push. No pressure.',
    steady: 'They are in a steady, quiet rhythm. Celebrate the underrated power of just showing up.',
};

export const COACH_TONE_GUIDANCE: Record<'nurturing' | 'direct' | 'accountability', string> = {
    nurturing: `Be warm, patient, and unhurried. Acknowledge how they feel before pointing forward. Lead with care — make them feel seen first. Gentle, not soft. Like the coach who checks in on you as a person, not just a performer.`,
    direct: `Be honest and clear. No filler, no fluff — but stay warm. Say the real thing plainly. Skip the build-up. Trust them to handle a straight answer. Be the friend who tells the truth because they respect you.`,
    accountability: `Be firm and high-standard. You see what they're capable of and you won't let them coast. Acknowledge the work but name the gap. No cruelty — but no excuses either. The coach who pushes because they believe in you more than you believe in yourself right now.`,
};

import type { ChatMessage, UserProfile, UserBehaviorPattern, CoachIntervention, UserVoiceProfile } from '../types';

export interface AIAffirmationResponse {
    text: string;
    author: string;
    category: string;
    isAI: boolean;
}

/**
 * Extract the user's core values and themes from their gratitudes and affirmations.
 * Used to inform personalized message generation.
 */
export const extractUserValues = (user: UserProfile): { values: string[]; themes: string[] } => {
    const gratitudes = (user.dailyMorningPractice || [])
        .slice(-14) // Last 2 weeks
        .flatMap(p => p.gratitudes || [])
        .join(' ');

    const affirmations = (user.dailyMorningPractice || [])
        .slice(-14)
        .flatMap(p => p.affirmations || [])
        .join(' ');

    const combined = `${gratitudes} ${affirmations}`.toLowerCase();

    // Common value words to extract
    const valueKeywords = [
        'courage', 'strength', 'peace', 'presence', 'growth', 'love', 'connection',
        'authenticity', 'integrity', 'wisdom', 'balance', 'joy', 'purpose', 'freedom',
        'resilience', 'trust', 'clarity', 'compassion', 'grace', 'gratitude', 'creativity'
    ];

    const foundValues = valueKeywords.filter(v => combined.includes(v));

    // Extract themes by looking for repeated short phrases
    const words = combined.match(/\b\w{4,}\b/g) || [];
    const wordFreq: Record<string, number> = {};
    words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

    const themes = Object.entries(wordFreq)
        .filter(([_, count]) => count >= 2)
        .map(([word]) => word)
        .slice(0, 5);

    return {
        values: foundValues.length > 0 ? foundValues : ['growth'],
        themes: themes.length > 0 ? themes : []
    };
};

/**
 * Generates a 4-5 sentence "growth memoir" for the user by synthesizing
 * their recent behavioral data. Stored on UserProfile and refreshed weekly.
 * Fed into every AI prompt in the app so the coach always knows who they are.
 */
export const generateUserNarrative = async (user: UserProfile): Promise<string> => {
    const recentMorning = (user.dailyMorningPractice || user.dailyPriming || []).slice(-3);
    const recentEvening = (user.dailyEveningPractice || []).slice(-3);
    const recentJournal = (user.journalEntries || []).slice(-3);
    const recentMeditation = (user.meditationReflections || []).slice(-3);
    const recentNoise = (user.noiseEntries || []).filter(n => !n.wasCleared).slice(-3);
    const activeGoals = (user.goals || []).filter(g => !g.completedAt).slice(0, 3);
    const totalPractices = user.practiceData?.totalPractices ?? 0;

    // First name only — extract from full name if needed.
    const firstName = (user.name || '').trim().split(/\s+/)[0] || 'they';

    // Behavior pattern facts (skip days, avg energy, preferred practice time)
    const pattern = user.behaviorPattern;
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const skipDayNames = pattern?.patterns.skipPatterns.daysOfWeek
        ?.map(d => DAY_NAMES[d])
        .filter(Boolean) ?? [];
    const consecutiveSkips = pattern?.patterns.skipPatterns.consecutiveSkips ?? 0;
    const avgEnergy = pattern?.patterns.moodPatterns.averageEnergy;
    const lowEnergyDays = pattern?.patterns.moodPatterns.lowEnergyDays
        ?.map(d => DAY_NAMES[d])
        .filter(Boolean) ?? [];
    const preferredMeditationTime = pattern?.patterns.preferredPracticeTime.meditation;
    const preferredMorningWindow = pattern?.patterns.preferredPracticeTime.morningPractice;
    const goalRate = pattern?.patterns.goalCompletionRate;

    const behaviorBlock = [
        skipDayNames.length ? `Days they tend to skip: ${skipDayNames.join(', ')}` : '',
        consecutiveSkips > 0 ? `Consecutive skip days right now: ${consecutiveSkips}` : '',
        typeof avgEnergy === 'number' ? `Average energy (rolling): ${avgEnergy.toFixed(1)}/5` : '',
        lowEnergyDays.length ? `Days their energy typically dips: ${lowEnergyDays.join(', ')}` : '',
        preferredMeditationTime && preferredMeditationTime !== 'unknown' ? `Preferred meditation time: ${preferredMeditationTime}` : '',
        preferredMorningWindow && preferredMorningWindow !== 'unknown' ? `Morning practice window: ${preferredMorningWindow.replace('_', ' ')}` : '',
        typeof goalRate === 'number' ? `Goal completion rate: ${Math.round(goalRate * 100)}%` : '',
    ].filter(Boolean).join('\n');

    const contextBlock = [
        `First name: ${firstName}`,
        user.profession ? `Profession: ${user.profession}` : '',
        `Current streak: ${user.streak || 0} days`,
        `Total practices completed all-time: ${totalPractices}`,
        user.currentMood ? `Current mood: ${user.currentMood}` : '',
        user.currentEnergy ? `Current energy right now: ${user.currentEnergy}/5` : '',
        user.focusAreas?.length ? `Working on: ${user.focusAreas.join(', ')}` : '',
        activeGoals.length
            ? `Active goals: ${activeGoals.map(g => g.title).join('; ')}`
            : '',
        recentMorning.length
            ? `Recent morning gratitudes: ${recentMorning.flatMap(m => m.gratitudes).slice(0, 6).join(', ')}`
            : '',
        recentMorning.length
            ? `Recent intentions: ${recentMorning.map(m => m.dailyIntention).filter(Boolean).join(', ')}`
            : '',
        recentEvening.length
            ? `Recent evening delights: ${recentEvening.map(e => e.delight).filter(Boolean).join('; ')}`
            : '',
        recentEvening.length
            ? `Recent accomplishments: ${recentEvening.map(e => e.accomplishment).filter(Boolean).join('; ')}`
            : '',
        recentJournal.length
            ? `Recent journal highlights: ${recentJournal.map(j => j.highlight).filter(Boolean).join('; ')}`
            : '',
        recentMeditation.length
            ? `Recent meditation intentions: ${recentMeditation.map(m => m.intention).filter(Boolean).join('; ')}`
            : '',
        recentNoise.length
            ? `Current stressors they've named: ${recentNoise.map(n => n.text).join('; ')}`
            : '',
        behaviorBlock ? `\nBEHAVIOR PATTERN:\n${behaviorBlock}` : '',
    ].filter(Boolean).join('\n');

    const fallback = buildFallbackNarrative(user);

    const prompt = `You are Palante, a personal growth companion. Based on the data below, write a warm 4-5 sentence observation of this specific person's pattern. This will appear on their profile as a personal note from Palante.

Tone: supportive, specific, and human — like a trusted friend who has genuinely been paying attention to how this person actually moves through their weeks. Use second person ("you", "your"). Reference what they've actually been grateful for and intending toward. If there is meaningful behavior pattern data (skip days, energy dips, preferred practice time), weave at least one specific observation about it in — but only if it's there. Make it feel like a real read on this person, not a template that could apply to anyone.

ABSOLUTE RULES:
- 4-5 sentences. No more.
- No headers, no lists, no bullets. Flowing sentences only.
- Never use the person's name in the text. Start with "You're" or "You've".
- No em dashes (the — character). Use periods and commas only.
- Never use the words: journey, intentional, mindful, anchor, foundation, tapestry, weave, tether, sovereignty.
- Never write something that could apply to any person on any week. Be specific to what their data actually shows.

USER DATA:
${contextBlock}

Write the observation now (4-5 sentences, second person, no headers, no lists):`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 400,
                temperature: 0.85,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) return fallback;

        const json = await response.json();
        let text = json.content?.[0]?.text?.trim();
        if (!text) return fallback;

        // Strip wrapping quotes if the model added them.
        text = text.replace(/^["'']|["'']$/g, '').trim();
        return text;
    } catch {
        return fallback;
    }
};

const buildFallbackNarrative = (user: UserProfile): string => {
    const streak = user.streak || 0;
    const goals = (user.goals || []).filter(g => !g.completedAt).map(g => g.title);
    const recentGratitude = user.dailyMorningPractice?.[user.dailyMorningPractice.length - 1]?.gratitudes?.[0];

    const streakLine = streak > 0
        ? `You're on a ${streak}-day streak — that kind of consistency builds something real.`
        : `You're finding your way back to your practice, and that return takes courage.`;

    const gratitudeLine = recentGratitude
        ? ` You've been holding onto gratitude for ${recentGratitude} — that kind of awareness is rare and worth honoring.`
        : '';

    const goalsLine = goals.length
        ? ` Right now you're working toward ${goals.slice(0, 2).join(' and ')}, and every small step you take here is part of that.`
        : ` Whatever brought you here today, you showed up — and that's always the hardest part.`;

    return `${streakLine}${gratitudeLine}${goalsLine}`.replace(/\s+/g, ' ').trim();
};

const getIntensityDescription = (intensity: 1 | 2 | 3): string => {
    switch (intensity) {
        case 1: return 'gentle, poetic, and nurturing. Think Buddha, Thich Nhat Hanh - peaceful and affirming.';
        case 2: return 'direct, clear, and stoic. Think Marcus Aurelius, Ryan Holiday - firm but wise.';
        case 3: return 'bold, intense, and empowering. Think David Goggins or a high-performance coach - high energy and limitless.';
        default: return 'balanced and motivational.';
    }
};

const getTimeContext = (timeOfDay?: string): string => {
    switch (timeOfDay) {
        case 'morning': return 'It is morning - focus on starting the day with energy and intention.';
        case 'afternoon': return 'It is afternoon - help them push through and maintain momentum.';
        case 'evening': return 'It is evening - focus on reflection, rest, and preparation for tomorrow.';
        default: return '';
    }
};

export const generateAffirmation = async (request: AIAffirmationRequest): Promise<AIAffirmationResponse> => {
    const intensityDesc = getIntensityDescription(request.quoteIntensity);
    const timeContext = getTimeContext(request.timeOfDay);
    const streakContext = request.streak && request.streak > 0
        ? `They are on a ${request.streak}-day streak - acknowledge their consistency!`
        : '';

    const intentionLine = request.dailyIntention
        ? `- Today's Intention: "${request.dailyIntention}" — lean into this theme directly`
        : '';
    const focusAreasLine = request.focusAreas?.length
        ? `- Focus Areas: ${request.focusAreas.join(', ')}`
        : '';
    const stateContext = (request.currentEnergy !== undefined && request.currentEnergy <= 2)
        || request.currentMood === 'Stressed' || request.currentMood === 'Anxious'
        ? `- Current State: User is feeling low-energy or stressed. Be gentle and grounding, not high-intensity.`
        : '';

    // If user set a custom name, use it as-is (they can include their own prefix). Otherwise default to brand "Palante".
    const coachIdentity = request.coachName?.trim() || 'Palante';

    const prompt = `You are ${coachIdentity}, a high-performance wellness and motivation coach. "Pa'lante" means "para adelante" — strictly forward. Your mission is to help the user move forward with clarity and power.

Generate a single, powerful affirmation or motivational quote for someone with these characteristics:
- Profession: ${request.profession || 'General'}
- Current Focus/Goal: ${request.focusGoal || 'Personal growth'}
- Interests: ${request.interests?.join(', ') || 'General wellness'}
${intentionLine}
${focusAreasLine}
${stateContext}
${streakContext}
${timeContext}

STYLE GUIDE:
Tone: ${intensityDesc}
Vibe: Professional, inspiring, and grounded.

TONE REQUIREMENTS:
- NEVER use profanity, curse words, or offensive language.
- NEVER use overly familiar terms like: "my love", "dear", "honey", "sweetie", "darling", "babe".
- Address the user directly with "you" or their name if provided.
- Avoid "fluff" - be direct and impactful.
- CRITICAL: Avoid violent, combative, or aggressive language in coaching advice (e.g., 'conquer', 'battle', 'destroy'). Use growth-oriented words instead. You may use the term 'Warrior' ONLY when referring to a user's 'Week Warrior' or 'Year Warrior' milestone achievement. Otherwise, stick to supportive language like 'thrive', 'blossom', 'flow', or 'create'.

MEDICAL SAFETY GUIDE:
- NEVER provide medical advice, diagnosis, or treatment recommendations.
- NEVER suggest specific diets, fasting protocols (beyond encouraging the user's own goals), or medical interventions.
- If the user asks for medical advice, gently steer them toward consulting a professional.

OUTPUT FORMAT:
Respond with ONLY a single valid JSON object, no markdown fences, no commentary before or after. Exactly this shape:
{"text":"The affirmation or quote text (under 25 words)","author":"${coachIdentity}"}

The author field defaults to ${coachIdentity} unless you are quoting a specific historical figure that perfectly fits this persona's ${intensityDesc} tone.`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 250,
                temperature: 0.9,
                messages: [{ role: 'user', content: prompt }],
            })
        });

        if (!response.ok) {
            console.error('Anthropic API error:', response.status);
            return getFallbackAffirmation(request);
        }

        const data = await response.json();
        const jsonText = data.content?.[0]?.text?.trim();

        if (!jsonText) {
            return getFallbackAffirmation(request);
        }

        try {
            // Strip any fences and isolate the first {...} block, in case the model wrapped it.
            let clean = jsonText.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
                clean = clean.slice(first, last + 1);
            }
            const result = JSON.parse(clean);

            return {
                text: result.text || "Keep moving forward.",
                author: result.author || coachIdentity,
                category: getCategoryFromRequest(request),
                isAI: true
            };
        } catch (e) {
            console.error('Failed to parse affirmation JSON', e);
            return getFallbackAffirmation(request);
        }
    } catch (error) {
        console.error('Error calling Anthropic API:', error);
        return getFallbackAffirmation(request);
    }
};

/**
 * Generate a personalized coaching message for the Coach Card
 */
export const generateCoachingMessage = async (
    userName: string,
    context: {
        streak: number;
        completedGoals: number;
        totalGoals: number;
        timeOfDay: 'morning' | 'afternoon' | 'evening';
        profession: string;
    }
): Promise<string> => {
    const prompt = `You are Palante. Generate a brief, personalized coaching message (under 15 words) for ${userName}.

Context:
- Time: ${context.timeOfDay}
- Profession: ${context.profession}
- Current streak: ${context.streak} days
- Today's goals: ${context.completedGoals}/${context.totalGoals} completed

TONE: Be warm, friendly, and professional. NEVER use overly familiar terms like "my love", "dear", "honey". Address them by name or "you".

Be direct and focus on what matters most right now. Respond with ONLY the message — no preamble, no quotation marks around it.

MEDICAL SAFETY GUIDE:
- Use only motivational language.
- NEVER give health, medical, or dietary advice.
- Stay within the bounds of a supportive coach.`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 80,
                temperature: 0.8,
                messages: [{ role: 'user', content: prompt }],
            })
        });

        if (!response.ok) {
            return getDefaultCoachingMessage(context);
        }

        const data = await response.json();
        let text = data.content?.[0]?.text?.trim();
        if (!text) return getDefaultCoachingMessage(context);
        text = text.replace(/^["'']|["'']$/g, '').trim();
        return text;
    } catch {
        return getDefaultCoachingMessage(context);
    }
};

/**
 * Generate a personalized morning practice message based on gratitude, affirmations, and intention.
 * Now with synthesis focus: makes the user feel SEEN, not told what to do.
 */
export const generateMorningPracticeMessage = async (
    userName: string,
    data: {
        gratitudes: string[];
        affirmations: string[];
        intention: string;
        commitment?: string;
        narrative?: string;
        momentumState?: MomentumState;
        coachTone?: 'nurturing' | 'direct' | 'accountability';
        userVoiceProfile?: UserVoiceProfile;
        healthContext?: { sleepHours?: number; restingHR?: number; sleepTrend?: 'below_average' | 'above_average' | 'typical' };
    }
): Promise<string> => {
    const toneDirective = COACH_TONE_GUIDANCE[data.coachTone ?? 'nurturing'];
    const voiceContext = data.userVoiceProfile
        ? `\nTheir core values: ${data.userVoiceProfile.extractedValues.join(', ')}\nHow they want to be spoken to: ${data.userVoiceProfile.voiceTone}`
        : '';

    const { buildHealthPromptBlock } = await import('./healthService');
    const healthBlock = data.healthContext ? buildHealthPromptBlock(data.healthContext) : '';

    const prompt = `You are a wise, present partner who knows ${userName} deeply.

YOUR RELATIONSHIP WITH THEM:
You listen. You remember. You see the pattern in what they care about.
${voiceContext}
${data.narrative ? `\nWho they've been lately: ${data.narrative}` : ''}
${healthBlock}

WHAT THEY SHARED THIS MORNING:
- Grateful for: ${data.gratitudes.join(', ')}
- Affirmations (who they're becoming): ${data.affirmations.join(', ')}
- Today's intention: ${data.intention}
${data.commitment ? `- One concrete thing they committed to: ${data.commitment}` : ''}
${data.momentumState ? `\nTheir current momentum: ${MOMENTUM_GUIDANCE[data.momentumState]}` : ''}

YOUR TASK:
Write a 2-sentence affirmation in their voice, as if the wisest version of
themselves is speaking. Use "I" or "Today I."

You are not a mirror. You are a wise listener. They already know what they wrote.
Your job is to hear what is UNDERNEATH it: the single thread that connects what
they are grateful for, who they say they are, and where they are pointed today${data.commitment ? ' (including the concrete thing they committed to)' : ''}.
Then give that thread back to them as something larger than what they handed you.

OUTPUT FORMAT — this is critical:
The output is the affirmation ONLY, spoken entirely in the user's own
first-person voice, start to finish. You are invisible in it. Never narrate
your listening ("I notice," "I see," "I hear you"), never address the user
("you," "your"), never preface or explain. Every "I" in the output is the
USER speaking about themselves.

HOW TO TRANSFORM (never echo):
- Find the meaning behind the specifics. "Coffee with mom" is not about coffee,
  it is about being loved and unhurried. Speak to THAT.
- You may allude to AT MOST ONE specific from their practice, reframed in fresh
  words. NEVER inventory all three sections back to them.
- Never reuse their phrasing. If they wrote "I am patient," the word "patient"
  should probably not appear. Find the sharper angle on the same truth.
- The message should feel like a discovery, not a receipt. They should think
  "that IS what I meant," never "that is what I typed."

The test: it must fit this one person's morning so well it could not be swapped
into someone else's, yet contain almost none of their own words.

ABSOLUTE RULES:
- 40 words MAX (count carefully)
- ALWAYS write in first person: "I am," "Today I," "I carry," "I know," etc.
- NEVER write in second person ("you," "your") — this is the user's own voice
- NEVER quote, restate, or list back their entries. Transform them.
- NEVER use em dashes (—). Periods and commas only.
- NEVER use: "journey," "intentional," "mindful," "anchor," "show up," "showed up," "showing up," "tapestry," "sovereignty"
- No quotation marks around the output
- Sound grounded and real, not performative

EXAMPLES — study the transformation, never copy the content:
(grateful: coffee with mom, affirmation: I am patient, intention: presence)
"I was reminded this morning that nothing worth having needs to be rushed. Today I move slowly enough to actually be here for my life."
(grateful: the deal closed, affirmation: I am a builder, intention: momentum)
"What I make holds. Today I do not need to prove that again, I only need to keep going."
(grateful: slept well, affirmation: I am calm under pressure, commitment: the 9am call)
"I have everything a steady morning can give a person. Whatever gets decided at nine o'clock, I will be the calmest one in the room."

TONE DIRECTIVE:
${toneDirective}

Write the message now. Make them feel seen and grounded.

MEDICAL SAFETY: NEVER provide medical advice, diagnosis, or treatment recommendations.`;

    // The affirmation must be the user's own first-person voice. If the model
    // narrates as the partner instead ("I notice what you're building..."),
    // retry once with a corrective note before falling back.
    const isSecondPerson = (text: string) => /\b(you|your|yours)\b/i.test(text);

    const requestOnce = async (correction?: string): Promise<string | null> => {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 300,
                temperature: 0.78,
                messages: [{ role: 'user', content: correction ? `${prompt}\n\n${correction}` : prompt }],
            })
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '(unreadable)');
            console.error(`[Palante AI] morning message proxy failed — status ${response.status}:`, errBody);
            return null;
        }

        const json = await response.json();
        let message = json.content?.[0]?.text?.trim();

        if (!message) {
            console.error('[Palante AI] morning message: empty response body', json);
            return null;
        }

        message = message.replace(/^["'']|["'']$/g, '').trim();
        message = message.replace(/ +([.,;:!?])/g, '$1');
        return message;
    };

    try {
        let message = await requestOnce();
        if (message && isSecondPerson(message)) {
            console.warn('[Palante AI] morning message slipped into second person, retrying once');
            message = await requestOnce('IMPORTANT: your previous attempt slipped into second person ("you"/"your"). Write the affirmation again, entirely in the user\'s first-person voice, with no "you" or "your" anywhere in it.');
        }
        if (!message || isSecondPerson(message)) return getFallbackMorningMessage(data);
        return message;
    } catch (error) {
        console.error('[Palante AI] morning message exception:', error);
        return getFallbackMorningMessage(data);
    }
};

/**
 * Generate a short, quotable Palante affirmation anchored in what the user
 * actually wrote during their morning practice. Used for the garden card on
 * the home screen — should feel like a real quote, not a coaching message.
 */
export const generatePalanteQuote = async (data: {
    gratitudes: string[];
    affirmations: string[];
    intention: string;
    commitment?: string;
    coachTone?: 'nurturing' | 'direct' | 'accountability';
    streak?: number;
}): Promise<string> => {
    const toneDirective = COACH_TONE_GUIDANCE[data.coachTone ?? 'nurturing'];

    const contentBlock = [
        data.gratitudes.length ? `Grateful for: ${data.gratitudes.slice(0, 3).join(', ')}` : '',
        data.affirmations.length ? `Their own affirmations: ${data.affirmations.slice(0, 3).join(', ')}` : '',
        data.intention ? `Today's intention: ${data.intention}` : '',
        data.commitment ? `What they committed to do: ${data.commitment}` : '',
        data.streak ? `Current streak: ${data.streak} days` : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are Palante. Based on what this person wrote in their morning practice, write ONE short quote-like affirmation — 8 to 18 words. It should feel like something they could save, share, or return to.

WHAT THEY WROTE:
${contentBlock}

TONE:
${toneDirective}

RULES:
- 8–18 words. No more.
- Written in second person ("you", "your") OR as a universal present-tense truth.
- Must feel DIRECTLY connected to what they wrote — not generic.
- Quotable, specific, resonant. Like a line they'd underline.
- No em dashes. No colons. Commas and periods only.
- No quotation marks in the output.
- NEVER use: "journey," "intentional," "mindful," "anchor," "tapestry," "weave," "sovereignty," "make it count," "you've got this."
- Do NOT repeat their exact words back verbatim — reframe, distill, elevate.

Write only the affirmation. Nothing else.`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 100,
                temperature: 0.85,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '(unreadable)');
            console.error(`[Palante AI] garden affirmation proxy failed — status ${response.status}:`, errBody);
            return '';
        }

        const json = await response.json();
        let text = json.content?.[0]?.text?.trim();
        if (!text) {
            console.error('[Palante AI] garden affirmation: empty response', json);
            return '';
        }
        text = text.replace(/^["'']|["'']$/g, '').trim();
        return text;
    } catch (error) {
        console.error('[Palante AI] garden affirmation exception:', error);
        return '';
    }
};

/**
 * Generate a personalized evening reflection message based on GLAD responses.
 * Enhanced to synthesize and honor what the user actually reflected on.
 */
export const generateEveningPracticeMessage = async (
    userName: string,
    data: {
        gratitude: string;
        learning: string;
        accomplishment: string;
        delight: string;
        /**
         * What the user committed to this morning, if anything. Stored on the morning practice as `commitment`.
         */
        morningCommitment?: string;
        /**
         * The user's evening reflection on how the morning commitment went. May be empty even if a commitment was set.
         */
        commitmentReflection?: string;
        userVoiceProfile?: UserVoiceProfile;
    }
): Promise<string> => {
    const voiceContext = data.userVoiceProfile
        ? `\nTheir core values: ${data.userVoiceProfile.extractedValues.join(', ')}\nHow they want to be spoken to: ${data.userVoiceProfile.voiceTone}`
        : '';

    const commitmentBlock = data.morningCommitment
        ? `\nWHAT THEY COMMITTED TO THIS MORNING:\n"${data.morningCommitment}"\n${data.commitmentReflection ? `\nHOW IT WENT:\n"${data.commitmentReflection}"` : '\n(No reflection on how it went. Treat this as neutral—maybe they did it, maybe not. Be curious, not assumptive.)'}`
        : '';

    const prompt = `You are the evening voice of Palante. A close friend who just listened to this person's day.

YOUR VOICE:
Warm, honest, human. A person who genuinely cares, speaking plainly. Not performing. Not a coach signing off. You see what was real about their day and you honor it simply, without fluff.
${voiceContext}

WHAT THEY REFLECTED ON TODAY (G.L.A.D.):
- Grateful for: ${data.gratitude}
- Learned: ${data.learning}
- Accomplished: ${data.accomplishment}
- Delighted by: ${data.delight}
${commitmentBlock}

YOUR TASK:
Read all of it. Find the MOST ALIVE thread—the thing that feels most real and human about their day. Then connect it to ONE other moment from their reflections, so they can feel the shape of the whole day, not just a fragment of it.

You are a close friend who was paying attention, not a transcript. Being SEEN
does not mean having your day read back to you. It means someone noticed what
the day actually MEANT and can say that meaning in one breath. Find what the
two threads reveal together that neither one says alone. That insight, not
the inventory, is what makes someone feel heard.

If the morning commitment is present AND they reflected on it: this is often the most alive thread. But only respond if you can do so without shame, scorekeeping, or pep-talk energy.
- If they did it: witness it plainly, with quiet pride.
- If they didn't: witness that plainly too, with affection and zero judgment.

Otherwise: respond to what's most alive in the four reflections (G, L, A, or D).

Your job is simple: let them know they were SEEN. Not fixed. Not graded. Seen.

ABSOLUTE RULES — these are non-negotiable:
1. EXACTLY 3 sentences. Count them. If 4, delete one.
2. NEVER use em dashes (—). Periods and commas only.
3. NEVER open with their name.
4. NEVER reproduce their own words verbatim, not even a short phrase, not
   even inside quotation marks. If three or more consecutive words match
   what they typed, rewrite the sentence. Touch each of your two threads in
   ONE short, glancing phrase, entirely in YOUR OWN words, then spend the
   rest of the sentence on what it MEANS, not what it WAS. A reader should
   feel "they got it," not "they quoted my entry back to me."
5. Reference at least TWO of the things they shared tonight, but lightly.
   One thread leads, the other appears naturally. Neither should be restated
   in full, and neither should ever appear inside quotation marks.
6. NEVER write something generic. If the message could be sent to a stranger, start over.
7. No pressure toward tomorrow. This is EVENING. They're winding down.
8. NEVER use: "journey," "intentional," "mindful," "anchor," "show up," "showed up," "showing up," "tapestry," "tether," "sovereignty," "not a small thing," "well done," "crushed it," "sweet dreams," "rest well," "earned it," "the day is done"
9. No quotation marks anywhere in the output, full stop. Never quote the
   user's own words back to them, even accurately.

EXAMPLES — study how two specifics get touched lightly and then read for meaning, never copy the content:
(gratitude: sister called / accomplishment: finished the deck)
"You closed something out today and someone who loves you called in the middle of it. Work and the people who matter rarely land on the same day. When they do, that is worth noticing."
(learning: saying no is allowed / delight: kid's joke at dinner)
"You drew a line today that cost you something to draw, and a few hours later your own kid had you laughing without trying. Both of those are what a good day is actually made of."
(commitment: morning run, done / gratitude: cool weather)
"You said you would go and you went, and the morning met you halfway with cooler air than usual. That kind of follow through is quiet, but it is the kind that builds a person you can trust."

Write the message. Three sentences. Make them feel seen, honored, and ready to rest.

MEDICAL SAFETY: NEVER provide medical advice, diagnosis, or treatment recommendations.`;

    // Guards against the two ways the model can slip into echoing instead of
    // witnessing: quoting the user's words outright, or reproducing a long
    // run of their own phrasing unquoted.
    const hasQuotes = (text: string) => /["“”]/.test(text);
    const hasVerbatimRun = (text: string) => {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
        const sourceWords = new Set<string>();
        [data.gratitude, data.learning, data.accomplishment, data.delight, data.commitmentReflection]
            .filter((s): s is string => !!s && s.trim().length > 0)
            .forEach(entry => {
                const words = normalize(entry);
                // Index every 4-word run from the user's own entries.
                for (let i = 0; i <= words.length - 4; i++) sourceWords.add(words.slice(i, i + 4).join(' '));
            });
        if (sourceWords.size === 0) return false;
        const outWords = normalize(text);
        for (let i = 0; i <= outWords.length - 4; i++) {
            if (sourceWords.has(outWords.slice(i, i + 4).join(' '))) return true;
        }
        return false;
    };
    const BANNED_PHRASES = ['journey', 'intentional', 'mindful', 'anchor', 'show up', 'showed up', 'showing up', 'tapestry', 'tether', 'sovereignty'];
    const hasBannedPhrase = (text: string) => BANNED_PHRASES.some(p => text.toLowerCase().includes(p));

    const requestOnce = async (correction?: string): Promise<string | null> => {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 300,
                temperature: 0.72,
                messages: [{ role: 'user', content: correction ? `${prompt}\n\n${correction}` : prompt }],
            })
        });

        if (!response.ok) return null;

        const json = await response.json();
        let message = json.content?.[0]?.text?.trim();
        if (!message) return null;

        message = message.replace(/^["'“”]|["'“”]$/g, '').trim();

        const sentences = message.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 3);
        // Ceiling raised from 480 to 560: the 3-sentence, two-thread synthesis
        // this prompt now asks for legitimately runs long, and the old cap was
        // discarding clean, non-echoing responses into the fallback pool below.
        if (message.length < 60 || message.length > 560 || sentences.length < 2 || sentences.length > 6) {
            console.warn('[Palante AI] evening message failed length/structure validation', { len: message.length, sentences: sentences.length });
            return null;
        }
        return message;
    };

    const needsRetry = (text: string) => hasQuotes(text) || hasVerbatimRun(text) || hasBannedPhrase(text);

    try {
        let message = await requestOnce();

        if (message && needsRetry(message)) {
            console.warn('[Palante AI] evening message echoed the user\'s words or used a banned phrase, retrying once');
            message = await requestOnce('IMPORTANT: your previous attempt either quoted/reproduced the user\'s own words directly, or used a banned word (journey, intentional, mindful, anchor, show up/showed up/showing up, tapestry, tether, sovereignty). Write it again with zero quotation marks, zero verbatim phrases from what they wrote, and none of those banned words, entirely in your own words.');
        }

        if (!message || needsRetry(message)) {
            return getFallbackEveningMessage(userName, data);
        }

        return message;
    } catch (error) {
        console.error('Error generating evening message:', error);
        return getFallbackEveningMessage(userName, data);
    }
};

/**
 * Offline / proxy-failure fallback for the evening message. Same discipline
 * as the AI path: never quote the user's entry verbatim, no matter how
 * short. These templates speak to the MEANING of whichever entry is
 * strongest, in the app's own words, exactly the way the live prompt is
 * required to.
 */
const getFallbackEveningMessage = (_userName: string, data: { gratitude: string; learning: string; accomplishment: string; delight: string }): string => {
    const g = data.gratitude?.trim();
    const l = data.learning?.trim();
    const a = data.accomplishment?.trim();
    const d = data.delight?.trim();

    const seed = `${g}${l}${a}${d}`.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);

    const ranked = ([
        { field: 'delight', value: d },
        { field: 'accomplishment', value: a },
        { field: 'learning', value: l },
        { field: 'gratitude', value: g },
    ] as const).filter(e => e.value).sort((x, y) => y.value!.length - x.value!.length);

    if (!ranked.length) {
        return `You stopped at the end of your day to look at it. That is the whole practice. The kind of attention it takes to do that is not nothing.`;
    }

    const { field } = ranked[0];

    if (field === 'delight') {
        const pool = [
            `Something in your day opened something up in you. You noticed it and named it. That is the kind of attention that keeps a life feeling alive, and not everyone still has it.`,
            `You found a moment of delight in a full day and you held onto it long enough to name it tonight. Most days rush past people. This one did not rush past you.`,
            `The fact that you can still be delighted, and notice it, says something real about how you move through the world. You stayed close to your life today.`,
        ];
        return pool[seed % pool.length];
    }

    if (field === 'accomplishment') {
        const pool = [
            `You did something today that needed doing. That gap between undone and done, you are what closed it. Not luck, not time. You.`,
            `Something moved forward today because you put in the work for it. That is the whole story, and it is worth naming.`,
            `You got it done. Whatever it took to cross that line, you had it. That is yours to carry into tomorrow.`,
        ];
        return pool[seed % pool.length];
    }

    if (field === 'learning') {
        const pool = [
            `You walked away from today knowing something you did not know this morning. That is a real thing you built, and no one can take it from you.`,
            `You were paying close enough attention to your own life today that it taught you something. That kind of knowing does not expire.`,
            `Most people move too fast to notice what the day is trying to show them. You were not moving too fast. You caught it.`,
        ];
        return pool[seed % pool.length];
    }

    // gratitude anchor
    const pool = [
        `You ended today with something worth being grateful for, and you named it. That specific attention at the close of a full day means it mattered, all the way through.`,
        `There is something right about closing a day with your attention on the things worth holding. You did that tonight.`,
        `You stayed close to what your life is actually made of today. That is the whole practice, and you did it.`,
    ];
    return pool[seed % pool.length];
};

/**
 * Chat with Palante
 */
// Smart Fallback Engine
const getSimulatedResponse = (message: string, context: UserContext): string => {
    const lowerMsg = message.toLowerCase();

    // Reassurance
    const reassurance = "I'm right here with you. ";

    // Feature: Clear The Noise
    if (lowerMsg.includes('worried') || lowerMsg.includes('anxious') || lowerMsg.includes('stress') || lowerMsg.includes('overwhelm') || lowerMsg.includes('noise')) {
        return `${reassurance}It sounds like a lot. Do you want to talk more about what's weighing on you, or would it help to just get it all out of your head and into 'Clear the Noise' for a moment?`;
    }

    // Feature: Breathwork
    if (lowerMsg.includes('tired') || lowerMsg.includes('exhausted') || lowerMsg.includes('breathe') || lowerMsg.includes('panic')) {
        return `${reassurance}I hear you. Sometimes just stopping for a second is the best first step. Would you like to try a quick breathing rhythm together?`;
    }

    // Generic Friendly / Coaching
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg.includes('hey')) {
        return `Hey ${context.name}! I'm so glad you reached out. I'm right here—what's on your mind?`;
    }

    if (lowerMsg.includes('thanks') || lowerMsg.includes('thank you')) {
        return "Of course. I'm just happy to be here with you. Keep moving forward at your own pace.";
    }

    // Default catch-all
    return `I'm listening. Tell me more about that? I'm here for as long as you need.`;
};

/**
 * Safety net: strip markdown that slips through the system prompt's "plain prose" rule.
 * Coach replies render as plain text in the chat bubble, so raw `**asterisks**` and
 * leading `- bullets` show up as ugly literals. This removes the most common patterns.
 */
const stripMarkdown = (text: string): string => {
    return text
        // **bold** and __bold__ — keep inner text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // *italic* and _italic_ — keep inner text (single chars only, not paired **)
        .replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, '$1$2$3')
        .replace(/(^|[^_])_([^_\n]+)_([^_]|$)/g, '$1$2$3')
        // Leading bullets at line start: `- foo` or `* foo` → `foo`
        .replace(/^[ \t]*[-*][ \t]+/gm, '')
        // Leading numbered list: `1. foo` → `foo`
        .replace(/^[ \t]*\d+\.[ \t]+/gm, '')
        // Leading `# `, `## ` headers — just keep the text
        .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
        // Inline code backticks → keep inner text
        .replace(/`([^`]+)`/g, '$1')
        // Collapse 3+ consecutive newlines that may result from bullet stripping
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

/**
 * Generate the "continuity opener" — the single line the partner uses to greet a
 * returning user by gently calling back to something they shared in a PAST
 * conversation. This is the moment that makes the remembering feel real: instead
 * of "What's on your mind?", the partner opens with "A while back you mentioned
 * the thing with your brother — has that settled?"
 *
 * Craft rules (the difference between magic and creepy) are enforced in the
 * prompt: exactly one callback, decay with age, never fabricate a detail, and a
 * "NONE" escape hatch when nothing is substantial enough to warrant a callback.
 *
 * Returns the callback line WITHOUT a "Hey {name}" prefix (the caller adds that),
 * or null when there is nothing worth recalling / on any failure — callers fall
 * back to the generic greeting. Precompute this once per day and cache it; it is
 * one Haiku call and is counted against the same daily chat budget as a turn.
 */
export const generateContinuityOpener = async (
    memories: string[],
    userName: string,
    coachName?: string,
): Promise<string | null> => {
    // Only real conversation memories earn a callback — thin/empty entries don't.
    const realMemories = memories.map(m => m?.trim()).filter((m): m is string => !!m && m.length > 15);
    if (realMemories.length === 0) return null;

    // Respect the same daily ceiling as chat. If the user is already capped, skip
    // the precompute silently and let the greeting fall back to generic.
    if (isChatLimitReached()) return null;

    const coachIdentity = coachName?.trim() || 'Palante';
    const firstName = userName?.split(' ')[0] || 'Friend';

    const prompt = `You are ${coachIdentity}, ${firstName}'s personal growth partner. ${firstName} is opening a new conversation with you right now. Below are things ${firstName} shared with you in PAST conversations, newest first.

Write ONE short opening line that gently calls back to the single most meaningful, still-open thing — a feeling they named, a situation they were working through, a person who matters to them. The goal is for ${firstName} to feel genuinely remembered, the way a close friend remembers.

PAST MEMORIES (newest first):
${realMemories.slice(0, 10).map(m => `- ${m}`).join('\n')}

RULES:
- ONE callback only. Pick the single most emotionally resonant, still-unresolved thread and ignore the rest. Do not list or stack multiple memories.
- Lead with warmth. This line is an act of care — a friend who is glad they came back and remembers what mattered to them. Make them feel held and quietly rooted for. Invite, never interrogate; a soft question is welcome but optional.
- Decay with age: the memories are newest first. If you reach for an older one, soften the time ("a while back…", "a bit ago…") rather than implying it just happened.
- NEVER invent or assume. Use only what is explicitly written above. If you are unsure of a name or detail, stay general — a wrong detail breaks trust far worse than a soft one. Better vague-and-true than specific-and-wrong.
- Do NOT open with "Hey ${firstName}" or any greeting word — that is added separately. Start directly with the callback.
- If none of these memories are substantial enough for a natural, caring callback (they are logistical, vague, or trivial), reply with exactly: NONE
- Plain prose. No markdown, no surrounding quotes. Under 30 words.

REGISTER — always, no matter what: warm, supportive, and encouraging. Even when calling back to something hard, your belief in ${firstName} and your gladness that they are here comes through first. Never clinical, never probing, never a performance review. Just a partner who genuinely cares.`;

    try {
        const res = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 120,
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        if (!res.ok) return null;

        const result = await res.json();
        recordChatCall();

        let text: string = (result?.content?.[0]?.text ?? '').trim();
        if (!text || /^NONE\b/i.test(text)) return null;

        // Safety net: strip stray surrounding quotes and any greeting the model
        // led with despite instructions, so the caller's "Hey {name}." reads clean.
        text = text.replace(/^["'“”']+|["'“”']+$/g, '').trim();
        text = text.replace(/^(hey|hi|hello)\b[^.!?]*[.,!?]+\s*/i, '').trim();
        if (text.length < 8) return null;

        return text;
    } catch {
        return null;
    }
};

export const chatWithCoach = async (
    message: string,
    history: ChatMessage[],
    context: UserContext
): Promise<string> => {
    // Daily cost guardrail: partner chat is the only unbounded AI vector. Once a
    // user hits the daily ceiling, return a warm sign-off instead of calling the
    // API — protects margins without ever touching normal use. See aiUsageBudget.
    if (isChatLimitReached()) {
        return getDailyLimitMessage(context.name);
    }

    // If no key, skip straight to simulation to avoid error logs

    const intensityDesc = getIntensityDescription(context.quoteIntensity);
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

    // Construct Memory Block — all blocks are trimmed to bound token cost per call.
    const trunc = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s;

    const journalMemory = context.recentJournalEntries?.length
        ? `RECENT JOURNAL HIGHLIGHTS:\n${context.recentJournalEntries.slice(-5).map(e =>
            `- ${e.date}: Win: ${trunc(e.highlight, 120)} | Challenge: ${trunc(e.lowlight, 120)}`).join('\n')}`
        : '';

    const reflectionMemory = context.recentReflections?.length
        ? `RECENT MEDITATION REFLECTIONS:\n${context.recentReflections.slice(-3).map(r =>
            `- ${r.date}: Intention: ${trunc(r.intention, 100)} | Reflection: ${trunc(r.reflection, 100)}`).join('\n')}`
        : '';

    const energyMemory = context.energyLevel
        ? `Current Energy: ${context.energyLevel}/5. ${context.energyLevel <= 2 ? 'User is feeling low energy.' : 'User is feeling energized.'}`
        : '';

    const narrativeBlock = context.userNarrative
        ? `THEIR GROWTH STORY (synthesized from recent weeks):\n${trunc(context.userNarrative, 600)}\n`
        : '';

    const momentumBlock = context.momentumState
        ? `THEIR MOMENTUM RIGHT NOW: ${MOMENTUM_GUIDANCE[context.momentumState]}\n`
        : '';

    const moodBlock = context.currentMood ? `Current mood: ${context.currentMood}` : '';
    const focusBlock = context.focusAreas?.length ? `Focus areas: ${context.focusAreas.join(', ')}` : '';

    const toneBlock = context.coachTone
        ? `\nTONE DIRECTIVE FOR THIS SESSION:\n${COACH_TONE_GUIDANCE[context.coachTone]}\n`
        : `\nTONE DIRECTIVE FOR THIS SESSION:\n${COACH_TONE_GUIDANCE['nurturing']}\n`;

    const memoriesBlock = context.persistedMemories?.length
        ? `MEMORIES FROM PAST CONVERSATIONS (reference naturally, not robotically):\n${context.persistedMemories.slice(0, 8).map(m => `- ${m}`).join('\n')}\n`
        : '';

    const { buildHealthPromptBlock } = await import('./healthService');
    const healthBlock = context.healthContext ? buildHealthPromptBlock(context.healthContext) : '';

    // Construct System Prompt — sent as Anthropic's top-level `system` field, not as a user message.
    const bioBlock = context.bio
        ? `\nABOUT THIS PERSON (in their own words):\n${context.bio}`
        : '';

    const systemPrompt = `You are Palante, a warm, nurturing, and deeply supportive friend and mentor.

USER CONTEXT:
- Name: ${context.name}
- Profession: ${context.profession || 'Undisclosed'}
- Streak: ${context.currentStreak} days
- Today's Progress: ${context.completedGoals}/${context.totalGoals} goals completed.
- Time: ${timeOfDay}
${moodBlock}
${focusBlock}
${bioBlock}

${memoriesBlock}
${narrativeBlock}
${momentumBlock}
${energyMemory}
${healthBlock}
${journalMemory}
${reflectionMemory}
${toneBlock}

YOUR PERSONA:
- Tone: Deeply conversational, empathetic, and patient. ${intensityDesc}
- Memory: You have context on their recent wins, challenges, and meditations. Reference them naturally if they are relevant to the current conversation (e.g., "I remember you were working on [X] yesterday...").
- Conversation Style: Focus on a natural back-and-forth. Keep your responses relatively short at first. Listen more than you talk.
- App Guidance: Only suggest ONE relevant app feature if it feels truly helpful.
- Reassurance: Softly remind the user that you are there for them.

GOAL:
Build a genuine connection. Be a supportive presence. Use their history to provide more personalized, insightful guidance. Only transition to "coaching" once you've truly listened.

FORMATTING:
- Plain prose only. NEVER use markdown — no asterisks for emphasis, no bold, no italics, no bullet points, no numbered lists, no headers.
- Write the way you would text a close friend. Short paragraphs. Real sentences.
- If you want to emphasize a question or idea, do it through phrasing, not punctuation.

MEDICAL SAFETY GUIDE:
- You are a wellness coach, NOT a doctor.
- NEVER provide medical advice or suggest specific diets.
- If asked for medical advice, clearly state you are an AI partner and they should consult a professional.
- If the user appears to be in ongoing distress or returning repeatedly for crisis-level support, gently remind them that Palante is a wellness companion — not a substitute for professional mental health support — and provide the 988 crisis line (call or text).`;

    // Build threaded history for Anthropic.
    // - Filter out init-greeting messages.
    // - Take the last 10 turns for context.
    // - Drop the last message if it's the current user message (avoid duplication with `message`).
    // - Anthropic requires strict user/assistant alternation starting with user — collapse any
    //   consecutive same-role messages by joining with a newline.
    const cleanHistory = history
        .filter(msg => !msg.id?.startsWith('init-'))
        .slice(-6);
    const historyForAPI = cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user'
        ? cleanHistory.slice(0, -1)
        : cleanHistory;

    type AnthropicMessage = { role: 'user' | 'assistant'; content: string };
    const threaded: AnthropicMessage[] = [];
    for (const msg of historyForAPI) {
        const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
        const last = threaded[threaded.length - 1];
        if (last && last.role === role) {
            last.content = `${last.content}\n\n${msg.text}`;
        } else {
            threaded.push({ role, content: msg.text });
        }
    }
    // The conversation must start with a user turn. If our first message is an assistant turn
    // (e.g. the seeded greeting got through), drop it.
    while (threaded.length > 0 && threaded[0].role !== 'user') {
        threaded.shift();
    }
    // Append the current user message. If the last threaded turn was also `user`, join instead
    // of producing two user turns in a row.
    const lastThreaded = threaded[threaded.length - 1];
    if (lastThreaded && lastThreaded.role === 'user') {
        lastThreaded.content = `${lastThreaded.content}\n\n${message}`;
    } else {
        threaded.push({ role: 'user', content: message });
    }

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 400,
                temperature: 0.7,
                system: systemPrompt,
                messages: threaded,
            })
        });

        if (!response.ok) {
            console.warn('Anthropic Chat API fail, using fallback.');
            return getSimulatedResponse(message, context);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text?.trim();
        if (!text) return getSimulatedResponse(message, context);
        // Only count calls that actually hit the API (cost money), not fallbacks.
        recordChatCall();
        return stripMarkdown(text);

    } catch (error) {
        console.error('Error calling Anthropic Chat:', error);
        return getSimulatedResponse(message, context);
    }
};

// ── Pillar System Prompts ────────────────────────────────────────────────────
// Each pillar gives the AI a focused coaching lens from the very first message.

export type CoachPillarKey = 'anxiety' | 'focus' | 'motivation' | 'setbacks' | 'open';

const PILLAR_SYSTEM_PROMPTS: Record<CoachPillarKey, string> = {
    anxiety: `You are Palante, operating specifically as an anxiety and stress-relief guide.
The user has come to you specifically because they are dealing with anxiety, worry, or overwhelm.

YOUR APPROACH:
- Lead with calm, grounded empathy. Match their energy — do NOT be overly cheerful.
- Your first goal is always to help them feel heard and safe before offering any tools or advice.
- Use evidence-backed CBT and mindfulness-adjacent techniques when appropriate (breathing, grounding, cognitive reframing).
- Offer gentle, concrete micro-actions — nothing overwhelming.
- Remind them that anxiety is information, not a verdict.
- Reference their recent journal entries or energy data if relevant.

NEVER: minimize their feelings, rush to fix-it mode, or give medical diagnoses.
TONE: Warm, unhurried, steady. Like a trusted friend who also happens to know a lot.`,

    focus: `You are Palante, operating specifically as a focus and deep-work guide.
The user has come to you because they are struggling to concentrate, stay on task, or cut through distraction.

YOUR APPROACH:
- Start by understanding what kind of focus they need (deep work, task-switching, procrastination, etc.).
- Offer specific, science-backed strategies: timed focus intervals, single-tasking, environment design, reducing friction.
- Help them identify and remove the root obstacle to their focus (fear of failure? perfectionism? unclear priorities?).
- Reference their current goals and energy level if available.
- Be direct and practical — they need a plan, not just encouragement.

NEVER: be vague or fluffy. They chose Focus because they need real help cutting through the noise.
TONE: Crisp, efficient, warm-but-direct. Like a high-performance coach who respects their time.`,

    motivation: `You are Palante, operating specifically as a motivation and momentum guide.
The user has come to you because their drive is low — they may feel stuck, uninspired, or disconnected from their why.

YOUR APPROACH:
- Start by uncovering WHY their motivation has dipped. Is it burnout? Unclear goals? Lack of progress visibility?
- Reconnect them to their deeper purpose, not just surface-level productivity.
- Use identity-based framing ("You're the kind of person who...") to re-anchor their self-concept.
- Offer one concrete action they can take in the next 10 minutes to build momentum.
- Celebrate any recent wins in their data (streak, goals completed, journal highlights).
- Be energizing without being hollow — no empty hype.

NEVER: give generic "you got this!" platitudes. They want to feel it, not just hear it.
TONE: Igniting, purposeful, real. Like someone who genuinely believes in them and has the receipts to prove it.`,

    setbacks: `You are Palante, operating specifically as a resilience and recovery guide.
The user has come to you after a setback — a failure, a rough day, a disappointment, or a knock to their confidence.

YOUR APPROACH:
- Open with full acknowledgment. Do NOT rush past the pain. Sit with them in it first.
- Normalize the setback — even the most successful people face these moments.
- Help them extract the lesson without toxic positivity ("everything happens for a reason" is off-limits).
- When they're ready, gently shift to a forward frame: what is ONE small thing they can control right now?
- Reference any past wins in their data as evidence of their resilience.
- Remind them that pa'lante — forward — doesn't mean pretending the fall didn't happen.

NEVER: rush to silver linings, dismiss their pain, or make them feel weak for struggling.
TONE: Grounded, compassionate, honest. Like a friend who has been through hard things and made it.`,

    open: `You are Palante, a warm, nurturing, and deeply supportive friend and mentor.
The user has come for an open conversation — no specific agenda.

YOUR APPROACH:
- Be curious and open. Let them lead. Ask a good question first.
- Listen actively. Reference their context naturally (energy, journal, goals).
- Only offer tools or advice once they've felt genuinely heard.
- Match their emotional register — don't project energy they haven't shown.

TONE: Conversational, human, patient. Like a trusted friend who happens to be a great coach.`,
};

/**
 * Chat with Palante using a pillar-specific system prompt.
 * Drops straight into the chat — no separate intro card.
 */
export const chatWithCoachPillar = async (
    message: string,
    history: ChatMessage[],
    context: UserContext,
    pillar: CoachPillarKey
): Promise<string> => {
    // Same daily cost guardrail as chatWithCoach — see aiUsageBudget.
    if (isChatLimitReached()) {
        return getDailyLimitMessage(context.name);
    }

    const pillarPrompt = PILLAR_SYSTEM_PROMPTS[pillar];
    const intensityDesc = getIntensityDescription(context.quoteIntensity);
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

    const trunc = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s;

    const journalMemory = context.recentJournalEntries?.length
        ? `RECENT JOURNAL HIGHLIGHTS:\n${context.recentJournalEntries.slice(-5).map(e =>
            `- ${e.date}: Win: ${trunc(e.highlight, 120)} | Challenge: ${trunc(e.lowlight, 120)}`).join('\n')}`
        : '';

    const reflectionMemory = context.recentReflections?.length
        ? `RECENT MEDITATION REFLECTIONS:\n${context.recentReflections.slice(-3).map(r =>
            `- ${r.date}: Intention: ${trunc(r.intention, 100)} | Reflection: ${trunc(r.reflection, 100)}`).join('\n')}`
        : '';

    const energyMemory = context.energyLevel
        ? `Current Energy: ${context.energyLevel}/5. ${context.energyLevel <= 2 ? 'User is feeling low energy.' : 'User is feeling energized.'}`
        : '';

    const narrativeBlockPillar = context.userNarrative
        ? `THEIR GROWTH STORY (synthesized from recent weeks):\n${trunc(context.userNarrative, 600)}\n`
        : '';

    const momentumBlockPillar = context.momentumState
        ? `THEIR MOMENTUM RIGHT NOW: ${MOMENTUM_GUIDANCE[context.momentumState]}\n`
        : '';

    const systemPrompt = `${pillarPrompt}

USER CONTEXT:
- Name: ${context.name}
- Profession: ${context.profession || 'Undisclosed'}
- Streak: ${context.currentStreak} days
- Today's Progress: ${context.completedGoals}/${context.totalGoals} goals completed.
- Time: ${timeOfDay}
${context.currentMood ? `- Mood: ${context.currentMood}` : ''}
${context.focusAreas?.length ? `- Focus areas: ${context.focusAreas.join(', ')}` : ''}

${narrativeBlockPillar}
${momentumBlockPillar}
${energyMemory}
${journalMemory}
${reflectionMemory}

STYLE: ${intensityDesc}
RESPONSE LENGTH: Keep responses focused and conversational. Under 120 words unless the user asks for something detailed.

FORMATTING:
- Plain prose only. NEVER use markdown — no asterisks for emphasis, no bold, no italics, no bullet points, no numbered lists, no headers.
- Write the way you would text a close friend. Short paragraphs. Real sentences.
- If you want to emphasize a question or idea, do it through phrasing, not punctuation.

MEDICAL SAFETY GUIDE:
- You are a wellness coach, NOT a doctor.
- NEVER provide medical advice or suggest specific diets.
- If asked for medical advice, clearly state you are an AI partner and they should consult a professional.
- If the user appears to be in ongoing distress or returning repeatedly for crisis-level support, gently remind them that Palante is a wellness companion — not a substitute for professional mental health support — and provide the 988 crisis line (call or text).`;

    // Build threaded history for Anthropic — same shape as chatWithCoach.
    const cleanHistoryPillar = history
        .filter(msg => !msg.id?.startsWith('init-'))
        .slice(-6);
    const historyForAPIPillar = cleanHistoryPillar.length > 0 && cleanHistoryPillar[cleanHistoryPillar.length - 1].role === 'user'
        ? cleanHistoryPillar.slice(0, -1)
        : cleanHistoryPillar;

    type AnthropicMessage = { role: 'user' | 'assistant'; content: string };
    const threaded: AnthropicMessage[] = [];
    for (const msg of historyForAPIPillar) {
        const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
        const last = threaded[threaded.length - 1];
        if (last && last.role === role) {
            last.content = `${last.content}\n\n${msg.text}`;
        } else {
            threaded.push({ role, content: msg.text });
        }
    }
    while (threaded.length > 0 && threaded[0].role !== 'user') {
        threaded.shift();
    }
    const lastThreaded = threaded[threaded.length - 1];
    if (lastThreaded && lastThreaded.role === 'user') {
        lastThreaded.content = `${lastThreaded.content}\n\n${message}`;
    } else {
        threaded.push({ role: 'user', content: message });
    }

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 450,
                temperature: 0.72,
                system: systemPrompt,
                messages: threaded,
            })
        });

        if (!response.ok) {
            console.warn('Anthropic Pillar Chat fail, using fallback.');
            return getSimulatedResponse(message, context);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text?.trim();
        if (!text) return getSimulatedResponse(message, context);
        // Only count real API calls against the daily budget, not fallbacks.
        recordChatCall();
        return stripMarkdown(text);

    } catch (error) {
        console.error('Error calling Anthropic Pillar Chat:', error);
        return getSimulatedResponse(message, context);
    }
};

// Fallback affirmations when API is unavailable
const FALLBACK_AFFIRMATIONS: Record<1 | 2 | 3, string[]> = {
    1: [
        "You are exactly where you need to be right now.",
        "Progress, not perfection, is your path forward.",
        "Your potential unfolds one breath at a time.",
        "Trust where you are right now.",
    ],
    2: [
        "Discipline is the bridge between goals and accomplishment.",
        "Execute with precision. Results follow.",
        "Your craft demands your best. Deliver it.",
        "Strategy without execution is just a wish.",
    ],
    3: [
        "Your potential is limitless.",
        "Compete only with your potential.",
        "You are the author of your story.",
        "Strength is a choice you make every day.",
    ],
};

const getFallbackAffirmation = (request: AIAffirmationRequest): AIAffirmationResponse => {
    const intensity = (request.quoteIntensity || 2) as 1 | 2 | 3;
    const affirmations = FALLBACK_AFFIRMATIONS[intensity] ?? FALLBACK_AFFIRMATIONS[2];
    const text = affirmations[Math.floor(Math.random() * affirmations.length)];
    // If user set a custom name, use it as-is (they can include their own prefix). Otherwise default to brand "Palante".
    const coachIdentity = request.coachName?.trim() || 'Palante';

    return {
        text,
        author: coachIdentity,
        category: getCategoryFromRequest(request),
        isAI: true
    };
};

const getCategoryFromRequest = (request: AIAffirmationRequest): string => {
    if (request.focusGoal) return 'Focus';
    if (request.profession) return request.profession;
    return 'Motivation';
};

/**
 * Offline / proxy-failure fallback for the morning message. A template can't
 * be a wise listener, so it stays restrained instead: at most ONE light
 * reference to the user's own words, never an inventory of everything they
 * typed back at them. Exported so DailyMorningPracticeWidget can reuse it
 * for its timeout path.
 */
export const getFallbackMorningMessage = (data: { gratitudes: string[]; affirmations: string[]; intention: string; }): string => {
    const gratitude = data.gratitudes.find(g => g.trim())?.trim();
    const affirmation = data.affirmations.find(a => a.trim())?.trim();
    const intention = data.intention?.trim();

    const hashStr = `${intention ?? ''}|${gratitude ?? ''}|${affirmation ?? ''}`;
    const seed = hashStr.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
    const pick = (pool: string[]) => pool[seed % pool.length];

    // Embed helpers: strip trailing punctuation, leave the user's casing alone.
    // Entries are only embedded when short enough to read as a phrase.
    const frag = (s: string) => s.replace(/[.!?\s]+$/, '');
    const short = (s?: string): s is string => !!s && s.trim().length > 0 && s.trim().length <= 60;

    // One reference max, in priority order: the intention embeds most
    // naturally, then gratitude, then the affirmation as its own sentence.
    if (short(intention) && intention.length <= 50 && !/^i\b/i.test(intention)) {
        return pick([
            `I did not wander into this day, I chose it: ${frag(intention)}. Everything I named this morning is already carrying me there.`,
            `Today has one direction, ${frag(intention)}. I started from gratitude and I know who I am, so I am already moving.`,
        ]);
    }
    if (short(gratitude)) {
        return pick([
            `I started today from a full place: ${frag(gratitude)}. A day that begins with that much good is a day I can do something with.`,
            `Before today asked anything of me, I named what is good: ${frag(gratitude)}. That is not behind me now, it is underneath me.`,
        ]);
    }
    if (short(affirmation)) {
        const a = frag(affirmation);
        const line = /^i['\s]/i.test(a) ? `${a.charAt(0).toUpperCase()}${a.slice(1)}` : `I am ${a}`;
        return pick([
            `${line}. I did not say that this morning to sound good, I said it because today I intend to live like it is true.`,
            `${line}. The day has barely started and that is already true.`,
        ]);
    }
    return pick([
        `I gave myself these minutes before the day could decide anything for me. I carry that steadiness into everything that comes next.`,
        `I am here this morning, on purpose, before anything asked for me. That sets the tone for the whole day.`,
    ]);
};

const getDefaultCoachingMessage = (context: { timeOfDay: string; completedGoals: number; totalGoals: number }): string => {
    if (context.completedGoals === context.totalGoals && context.totalGoals > 0) {
        return "All goals complete. You did it today.";
    }
    if (context.timeOfDay === 'morning') {
        return "Fresh day. Set your intention.";
    }
    if (context.timeOfDay === 'evening') {
        return "Wind down. Reflect on your wins.";
    }
    return "Stay focused. You've got this.";
};

/**
 * Check if AI features are available
 */
export const isAIAvailable = (): boolean => {
    return !!import.meta.env.VITE_SUPABASE_URL;
};

export interface ReflectionAnalysis {
    praise: string;
    powerMove: string;
}

export interface ReflectionData {
    q1: string; // Dynamic Question 1 (e.g. Win)
    q2: string; // Dynamic Question 2 (e.g. Challenge)
    q3: string; // Dynamic Question 3 (e.g. Pivot)
    freeform?: string;
}

/**
 * Generate AI Analysis for Daily Reflection
 */
export const generateReflectionAnalysis = async (data: ReflectionData): Promise<ReflectionAnalysis> => {
    const prompt = `You are Palante, a warm and compassionate accountability partner. Analyze these 3 daily reflection answers from a user.

ANSWERS:
1. ${data.q1}
2. ${data.q2}
3. ${data.q3}
${data.freeform ? `Journal: ${data.freeform}` : ''}

TASK:
Provide immediate, high-impact feedback. Respond with ONLY a single valid JSON object, no markdown fences, no commentary. Exactly this shape:
{"praise":"1 brief sentence validating their specific win or insight.","powerMove":"1 specific, actionable sentence of advice for tomorrow based on their challenge/pivot."}

TONE:
- Praise: Warm, acknowledging, specific to what they actually wrote.
- Power Move: Direct, strategic, encouraging. "Try this...", "Focus on...", "Remember to..."`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 200,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }],
            })
        });

        if (!response.ok) return getFallbackReflectionAnalysis();

        const json = await response.json();
        const text = json.content?.[0]?.text?.trim();

        if (!text) return getFallbackReflectionAnalysis();

        try {
            let clean = text.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
                clean = clean.slice(first, last + 1);
            }
            const result = JSON.parse(clean);
            // Strip wrapping quotes (smart or straight) that Claude sometimes adds around its own strings.
            const stripQuotes = (s: string) => s.replace(/^["'""'']+|["'""'']+$/g, '').trim();
            return {
                praise: result.praise ? stripQuotes(result.praise) : "Great work reflecting today.",
                powerMove: result.powerMove ? stripQuotes(result.powerMove) : "Keep pushing forward tomorrow."
            };
        } catch (e) {
            console.error("Failed to parse reflection JSON", e);
            return getFallbackReflectionAnalysis();
        }

    } catch (error) {
        console.error("Reflection Analysis Error", error);
        return getFallbackReflectionAnalysis();
    }
};

const getFallbackReflectionAnalysis = (): ReflectionAnalysis => {
    return {
        praise: "You've taken the time to pause and reflect, which is the first step to mastery.",
        powerMove: "Tomorrow, focus on one small action that moves the needle on your biggest goal."
    };
};

// ─── Monthly Pattern Insight Engine ──────────────────────────────────────────

interface PatternFact {
    label: string;
    value: string;
    dataPoint: string;
}

function computePatternFacts(user: UserProfile): PatternFact[] {
    const facts: PatternFact[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Most active day of week
    const practicesByDay: Record<number, number> = {};
    (user.practiceData?.activityHistory || [])
        .filter(a => a.date >= thirtyDaysAgo)
        .forEach(a => {
            const day = new Date(a.date + 'T12:00:00').getDay();
            practicesByDay[day] = (practicesByDay[day] || 0) + a.practices.length;
        });
    const mostActiveEntry = Object.entries(practicesByDay).sort(([, a], [, b]) => b - a)[0];
    if (mostActiveEntry && Number(mostActiveEntry[1]) > 1) {
        facts.push({
            label: 'most_active_day',
            value: DAY_NAMES[parseInt(mostActiveEntry[0])],
            dataPoint: `${mostActiveEntry[1]} practices`,
        });
    }

    // Highest energy day of week
    const energyByDay: Record<number, number[]> = {};
    (user.energyHistory || []).forEach(e => {
        const day = new Date(e.timestamp).getDay();
        if (!energyByDay[day]) energyByDay[day] = [];
        energyByDay[day].push(e.level);
    });
    const energySorted = Object.entries(energyByDay)
        .filter(([, levels]) => levels.length >= 2)
        .map(([day, levels]) => ({ day: parseInt(day), avg: levels.reduce((a, b) => a + b, 0) / levels.length }))
        .sort((a, b) => b.avg - a.avg);
    if (energySorted[0]) {
        facts.push({
            label: 'highest_energy_day',
            value: DAY_NAMES[energySorted[0].day],
            dataPoint: `${energySorted[0].avg.toFixed(1)}/5 avg`,
        });
    }

    // Gratitudes written this month
    const gratitudeCount = (user.dailyMorningPractice || user.dailyPriming || [])
        .filter(p => p.date >= thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.gratitudes?.filter(g => g.trim()).length || 0), 0);
    if (gratitudeCount > 0) {
        facts.push({ label: 'gratitudes_written', value: `${gratitudeCount} gratitudes`, dataPoint: `${gratitudeCount}` });
    }

    // Top practice type
    const typeCounts: Record<string, number> = {};
    (user.practiceData?.activityHistory || [])
        .filter(a => a.date >= thirtyDaysAgo)
        .forEach(a => a.practices.forEach(p => { typeCounts[p] = (typeCounts[p] || 0) + 1; }));
    const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
    if (topType) {
        const labels: Record<string, string> = {
            morning_practice: 'morning practice', meditation: 'meditation',
            breath: 'breathwork', reflect: 'reflection', quote: 'quote saving',
        };
        facts.push({ label: 'top_practice', value: labels[topType[0]] || topType[0], dataPoint: `${topType[1]} times` });
    }

    // Journal entries this month
    const journalCount = (user.journalEntries || []).filter(e => e.date >= thirtyDaysAgo).length;
    if (journalCount > 0) {
        facts.push({ label: 'journal_count', value: `${journalCount} reflections`, dataPoint: `${journalCount}` });
    }

    // Evening GLAD sessions this month
    const eveningCount = (user.dailyEveningPractice || []).filter(e => e.date >= thirtyDaysAgo).length;
    if (eveningCount > 0) {
        facts.push({ label: 'evening_count', value: `${eveningCount} evenings`, dataPoint: `${eveningCount}` });
    }

    return facts;
}

const buildFallbackInsight = (facts: PatternFact[]): { insight: string; dataPoint: string } | null => {
    const mostActive = facts.find(f => f.label === 'most_active_day');
    if (mostActive) return {
        insight: `Your practice naturally gravitates toward ${mostActive.value}s — your most consistent day of the month.`,
        dataPoint: mostActive.value,
    };
    const highEnergy = facts.find(f => f.label === 'highest_energy_day');
    if (highEnergy) return {
        insight: `Your energy consistently peaks on ${highEnergy.value}s. Your body has its own wisdom.`,
        dataPoint: highEnergy.value,
    };
    const gratitudes = facts.find(f => f.label === 'gratitudes_written');
    if (gratitudes) return {
        insight: `You've written ${gratitudes.dataPoint} this month. Gratitude is becoming a real practice for you.`,
        dataPoint: gratitudes.dataPoint,
    };
    return null;
};

/**
 * Analyzes 30 days of behavioral data and generates one specific, surprising
 * pattern insight the user likely hasn't consciously noticed about themselves.
 */
export const generateMonthlyPatternInsight = async (
    user: UserProfile
): Promise<{ insight: string; dataPoint: string } | null> => {
    const facts = computePatternFacts(user);
    if (facts.length < 2) return null;

    const fallback = buildFallbackInsight(facts);

    const factsText = facts.map(f => `- ${f.label}: ${f.value} (${f.dataPoint})`).join('\n');

    const prompt = `You have 30 days of behavioral data for a wellness app user. Pick the ONE most interesting, specific, and surprising pattern — something they might not have consciously noticed.

DATA:
${factsText}

RULES:
1. Choose the single most meaningful fact. Avoid the obvious. Prefer the specific.
2. Write ONE sentence (under 20 words) framing it as a warm discovery. Start with "You" or "Your".
3. Extract the most concrete data point (a day name, a number, a count).
4. Bad: "You practice regularly." Good: "Your energy consistently peaks on Thursdays."

Respond with ONLY a single valid JSON object, no markdown fences, no commentary. Exactly:
{"insight":"...","dataPoint":"..."}`;

    try {
        const res = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 180,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }],
            })
        });
        if (!res.ok) return fallback;

        const data = await res.json();
        const text = data.content?.[0]?.text?.trim();
        if (!text) return fallback;

        let clean = text.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
            clean = clean.slice(first, last + 1);
        }
        const result = JSON.parse(clean);
        if (result.insight && result.dataPoint) return { insight: result.insight, dataPoint: result.dataPoint };
        return fallback;
    } catch {
        return fallback;
    }
};

// ─── Behavior Analysis & Coach Interventions (consolidated from aiCoach) ───────

/** Analyze user behavior patterns from the last 30 days */
export const analyzeUserBehavior = (user: UserProfile): UserBehaviorPattern => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const meditationTimes = user.meditationReflections
        ?.filter(m => m.date >= thirtyDaysAgoStr)
        .map(m => {
            const hour = new Date(m.date).getHours();
            if (hour < 12) return 'morning';
            if (hour < 18) return 'afternoon';
            return 'evening';
        }) || [];

    const morningPrimingTimes = user.dailyPriming
        ?.filter(p => p.date >= thirtyDaysAgoStr)
        .map(p => {
            const hour = new Date(p.date).getHours();
            return hour < 9 ? 'early' : 'late_morning';
        }) || [];

    const meditationCount = user.meditationReflections?.filter(m => m.date >= thirtyDaysAgoStr).length || 0;
    const breathworkCount = user.activityHistory?.filter(a =>
        a.type === 'breath' && a.date >= thirtyDaysAgoStr
    ).reduce((sum, a) => sum + a.count, 0) || 0;
    const reflectionCount = user.journalEntries?.filter(j => j.date >= thirtyDaysAgoStr).length || 0;

    const weeksInPeriod = 4.3;
    const practiceFrequency = {
        meditation: Math.round(meditationCount / weeksInPeriod),
        breathwork: Math.round(breathworkCount / weeksInPeriod),
        reflections: Math.round(reflectionCount / weeksInPeriod),
    };

    const allDates = getLast30Days();
    const practiceDates = new Set([
        ...(user.meditationReflections?.map(m => m.date.split('T')[0]) || []),
        ...(user.dailyPriming?.map(p => p.date) || []),
        ...(user.journalEntries?.map(j => j.date) || []),
    ]);

    const skippedDays = allDates.filter(date => !practiceDates.has(date));
    const skipPatternByDay = countOccurrences(skippedDays.map(date => new Date(date).getDay()));

    let maxConsecutiveSkips = 0;
    let currentSkips = 0;
    allDates.forEach(date => {
        if (!practiceDates.has(date)) {
            currentSkips++;
            maxConsecutiveSkips = Math.max(maxConsecutiveSkips, currentSkips);
        } else {
            currentSkips = 0;
        }
    });

    const energyLogs = user.energyHistory?.filter(e =>
        new Date(e.timestamp).getTime() >= thirtyDaysAgo.getTime()
    ) || [];

    const energyByDay: Record<number, number[]> = {};
    energyLogs.forEach(log => {
        const day = new Date(log.timestamp).getDay();
        if (!energyByDay[day]) energyByDay[day] = [];
        energyByDay[day].push(log.level);
    });

    const lowEnergyDays: number[] = [];
    Object.entries(energyByDay).forEach(([day, levels]) => {
        const avg = levels.reduce((sum, l) => sum + l, 0) / levels.length;
        if (avg < 2.5) lowEnergyDays.push(parseInt(day));
    });

    const averageEnergy = energyLogs.length > 0
        ? energyLogs.reduce((sum, e) => sum + e.level, 0) / energyLogs.length
        : 3;

    const recentGoals = user.dailyFocuses?.filter(g =>
        new Date(g.createdAt).getTime() >= thirtyDaysAgo.getTime()
    ) || [];
    const goalCompletionRate = recentGoals.length > 0
        ? recentGoals.filter(g => g.isCompleted).length / recentGoals.length
        : 0;

    return {
        userId: user.id,
        patterns: {
            preferredPracticeTime: {
                meditation: (getMostCommonBehavior(meditationTimes) || 'unknown') as string,
                breathwork: 'unknown',
                morningPractice: (getMostCommonBehavior(morningPrimingTimes) || 'unknown') as string,
            },
            practiceFrequency,
            skipPatterns: {
                daysOfWeek: Object.keys(skipPatternByDay)
                    .filter(day => skipPatternByDay[parseInt(day)] > 2)
                    .map(d => parseInt(d)),
                consecutiveSkips: maxConsecutiveSkips,
            },
            moodPatterns: {
                lowEnergyDays,
                averageEnergy: Math.round(averageEnergy * 10) / 10,
            },
            goalCompletionRate: Math.round(goalCompletionRate * 100) / 100,
            responseToNudges: { morning: 0.7, afternoon: 0.5, evening: 0.6 },
        },
        lastAnalyzed: new Date().toISOString(),
    };
};

/** Generate coach interventions based on behavior patterns */
export const generateInterventions = (
    user: UserProfile,
    pattern: UserBehaviorPattern
): CoachIntervention[] => {
    const interventions: CoachIntervention[] = [];
    const now = new Date();

    if (pattern.patterns.skipPatterns.consecutiveSkips >= 3) {
        interventions.push({
            id: `skip-${Date.now()}`,
            type: 'alternative',
            trigger: { condition: 'consecutive_skips_3_days', confidence: 0.9 },
            message: "It's great to see you again! Whenever you're ready, a quick 2-minute breathing exercise is a perfect way to reconnect with yourself.",
            action: { type: 'show_breathing' },
            priority: 'medium',
            timestamp: now.toISOString(),
        });
    }

    if (pattern.patterns.practiceFrequency.meditation < 2) {
        interventions.push({
            id: `low-meditation-${Date.now()}`,
            type: 'suggestion',
            trigger: { condition: 'low_meditation_frequency', confidence: 0.8 },
            message: "Building a meditation habit? Start small - even 5 minutes makes a difference. Want to set a goal for 3 sessions this week?",
            action: { type: 'suggest_goal', data: { title: 'Meditate 3x this week', category: 'Mindfulness' } },
            priority: 'medium',
            timestamp: now.toISOString(),
        });
    }

    if (pattern.patterns.moodPatterns.averageEnergy < 2.5) {
        interventions.push({
            id: `low-energy-${Date.now()}`,
            type: 'suggestion',
            trigger: { condition: 'low_energy_pattern', confidence: 0.85 },
            message: "Your energy has been lower lately. Let's boost it with a morning breathwork session - it can really energize your day!",
            action: { type: 'show_breathing' },
            priority: 'medium',
            timestamp: now.toISOString(),
        });
    }

    if (user.streakData?.isGracePeriod) {
        interventions.push({
            id: `grace-period-${Date.now()}`,
            type: 'streak_warning',
            trigger: { condition: 'streak_grace_period', confidence: 1.0 },
            message: `Grace period: complete any practice today to keep your ${user.streakData.currentStreak}-day streak alive`,
            action: { type: 'open_practice' },
            priority: 'high',
            timestamp: now.toISOString(),
        });
    }

    const daysSinceLastGoal = (user.dailyFocuses && user.dailyFocuses.length > 0)
        ? Math.floor((now.getTime() - new Date(user.dailyFocuses[user.dailyFocuses.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    if (daysSinceLastGoal > 7) {
        interventions.push({
            id: `goal-stagnation-${Date.now()}`,
            type: 'check_in',
            trigger: { condition: 'no_goals_7_days', confidence: 0.7 },
            message: "You haven't set any new goals in a while. Want to set a fresh intention for the week ahead?",
            action: { type: 'suggest_goal' },
            priority: 'low',
            timestamp: now.toISOString(),
        });
    }

    if (pattern.patterns.preferredPracticeTime.meditation !== 'unknown') {
        interventions.push({
            id: `pattern-${Date.now()}`,
            type: 'encouragement',
            trigger: { condition: 'detected_preference', confidence: 0.75 },
            message: `I noticed you usually meditate in the ${pattern.patterns.preferredPracticeTime.meditation}. Want me to send you a reminder at that time?`,
            priority: 'low',
            timestamp: now.toISOString(),
        });
    }

    return interventions;
};

// Private helpers for behavior analysis
function getMostCommonBehavior<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    const counts: Record<string, number> = {};
    arr.forEach(item => { const k = String(item); counts[k] = (counts[k] || 0) + 1; });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as T;
}

function getLast30Days(): string[] {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates.reverse();
}

function countOccurrences(arr: number[]): Record<number, number> {
    const counts: Record<number, number> = {};
    arr.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
    return counts;
}

// ─── Weekly Reflection Generator ─────────────────────────────────────────────

export const generateWeeklyReflection = async (
    accomplishments: string[],
    firstName: string
): Promise<string> => {
    const fallback = buildWeeklyReflectionFallback(accomplishments, firstName);
    if (accomplishments.length === 0) return fallback;

    const bulletList = accomplishments.map((a, i) => `${i + 1}. ${a}`).join('\n');

    const prompt = `You are Palante, a personal growth companion. A user named ${firstName} just completed their week and logged these accomplishments:

${bulletList}

Write a warm, specific 2-3 sentence reflection that speaks directly to them. Reference 2-3 of their actual wins by paraphrasing them — don't list them, weave them into flowing sentences. End with a short forward-leaning sentence that propels them into the next week (something like "Keep going." or "That's someone keeping their word to themselves.").

Tone: warm, human, like a trusted friend who genuinely noticed. Second person only ("you", "your"). Never use their name. No generic filler. No headers. No lists. Max 60 words.`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 200,
                temperature: 0.88,
                messages: [{ role: 'user', content: prompt }],
            })
        });
        if (!response.ok) return fallback;
        const data = await response.json();
        let text = data.content?.[0]?.text?.trim();
        if (!text) return fallback;
        text = text.replace(/^["'']|["'']$/g, '').trim();
        return text;
    } catch {
        return fallback;
    }
};

const buildWeeklyReflectionFallback = (accomplishments: string[], _firstName: string): string => {
    if (accomplishments.length === 0) return "You showed up this week. That's the whole game.";
    if (accomplishments.length === 1) return `You got it done — ${accomplishments[0].toLowerCase().replace(/\.$/, '')}. One win is enough to build on. Keep going.`;
    return `You held your ground this week, took care of what needed taking care of, and kept moving. Every one of these wins is evidence of someone who follows through. Keep going.`;
};

// ─── Day 90 Growth Story ──────────────────────────────────────────────────────

export interface GrowthStoryData {
    morningPractices: Array<{ date: string; gratitudes: string[]; dailyIntention?: string }>;
    eveningPractices: Array<{ date: string; delight: string; accomplishment: string; learning: string }>;
    futureLetter?: string; // Content of the Day 3 letter to self
    totalPractices: number;
    firstName: string;
    coachTone?: 'nurturing' | 'direct' | 'accountability';
    startDate?: string; // ISO date of first practice
}

export interface GrowthStory {
    memoir: string; // 5-7 sentence AI-generated narrative
    stats: { gratitudesWritten: number; eveningsReflected: number; totalPractices: number };
}

const buildGrowthStoryFallback = (data: GrowthStoryData): string => {
    const { morningPractices, eveningPractices, futureLetter, totalPractices, firstName } = data;

    const firstIntention = morningPractices[0]?.dailyIntention?.trim();
    const lastIntention = morningPractices[morningPractices.length - 1]?.dailyIntention?.trim();
    const firstGratitude = morningPractices[0]?.gratitudes?.find(g => g.trim())?.trim();
    const bestDelight = eveningPractices
        .map(e => e.delight?.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0];
    const bestAccomplishment = eveningPractices
        .map(e => e.accomplishment?.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0];
    const gratitudeCount = morningPractices.reduce((n, p) => n + (p.gratitudes?.filter(g => g.trim()).length || 0), 0);

    const lines: string[] = [];

    if (firstIntention) {
        lines.push(`${firstName}, you walked in with "${firstIntention}." That was the first thing you named for yourself, and everything that came after grew from that seed.`);
    } else {
        lines.push(`${firstName}, you showed up 90 times when it would have been easier not to. That is the whole story, really — but it deserves to be told properly.`);
    }

    if (firstGratitude) {
        lines.push(`You found ${firstGratitude} worth naming out loud — and you kept finding things. Over and over, you chose to look at what was good.`);
    }

    if (gratitudeCount > 0) {
        lines.push(`In ${totalPractices} practices, you wrote ${gratitudeCount} moments of gratitude. That is ${gratitudeCount} times you consciously chose to see what was working instead of what wasn't.`);
    }

    if (bestDelight) {
        lines.push(`And there were real delights along the way — like "${bestDelight}." You noticed those. You let them land. That is not small.`);
    }

    if (bestAccomplishment) {
        lines.push(`You moved real things. "${bestAccomplishment}" is one of them. The gap between where that stood before and where it stands now — you are that gap.`);
    }

    if (futureLetter) {
        lines.push(`At the beginning, you wrote yourself a letter for a hard day. Today is not that day. Today is the day your past self was hoping for when they wrote it.`);
    }

    if (lastIntention && lastIntention !== firstIntention) {
        lines.push(`Ninety practices later, you are setting intentions like "${lastIntention}." That is not who walked in. That is who you built.`);
    } else {
        lines.push(`Ninety practices. The garden is not a metaphor anymore. It is the life you have been building, one morning at a time. Pa'lante.`);
    }

    return lines.join(' ');
};

/**
 * Generates the Day 90 Growth Story — a personal memoir synthesized from
 * the user's actual intentions, gratitudes, evening reflections, and letter to self.
 */
export const generateGrowthStory = async (data: GrowthStoryData): Promise<GrowthStory> => {
    const { morningPractices, eveningPractices, futureLetter, totalPractices, firstName, coachTone = 'nurturing' } = data;

    const gratitudeCount = morningPractices.reduce(
        (n, p) => n + (p.gratitudes?.filter(g => g.trim()).length || 0), 0
    );
    const stats = {
        gratitudesWritten: gratitudeCount,
        eveningsReflected: eveningPractices.length,
        totalPractices,
    };

    const fallbackMemoir = buildGrowthStoryFallback(data);
    // Build a curated data snapshot — first 3 + last 3 morning practices
    const all = morningPractices;
    const earliest = all.slice(0, 3);
    const latest = all.slice(-3);
    const highlights = [
        ...earliest.map(p => ({
            phase: 'early',
            intention: p.dailyIntention,
            gratitudes: p.gratitudes?.filter(g => g.trim()).slice(0, 2),
        })),
        ...latest.map(p => ({
            phase: 'recent',
            intention: p.dailyIntention,
            gratitudes: p.gratitudes?.filter(g => g.trim()).slice(0, 2),
        })),
    ];

    const eveningHighlights = [...eveningPractices]
        .sort((a, b) =>
            (b.delight?.length || 0) + (b.accomplishment?.length || 0) -
            (a.delight?.length || 0) - (a.accomplishment?.length || 0)
        )
        .slice(0, 5)
        .map(e => ({ delight: e.delight, accomplishment: e.accomplishment, learning: e.learning }));

    const toneGuidance: Record<string, string> = {
        nurturing: 'Warm, intimate, and literary. Like someone who has been quietly watching and deeply cares.',
        direct: 'Clear-eyed and honest. You name what changed without embellishment. Every word earns its place.',
        accountability: 'High-standard and proud. You name what they built with the full weight of what that took.',
    };

    const prompt = `You are writing a personal memoir for someone who just completed 90 days of a growth practice called Palante. This will be the first thing they read after their Full Bloom ceremony. It should feel like reading a short story about themselves — specific, earned, true.

THEIR JOURNEY DATA:

Early practices (how they started):
${highlights.filter(h => h.phase === 'early').map(h =>
    [h.intention && `Intention: "${h.intention}"`, h.gratitudes?.length && `Grateful for: ${h.gratitudes.join(', ')}`].filter(Boolean).join(' | ')
).join('\n') || 'No early practice data.'}

Recent practices (who they are now):
${highlights.filter(h => h.phase === 'recent').map(h =>
    [h.intention && `Intention: "${h.intention}"`, h.gratitudes?.length && `Grateful for: ${h.gratitudes.join(', ')}`].filter(Boolean).join(' | ')
).join('\n') || 'No recent practice data.'}

Top evening moments (delights and accomplishments they lived):
${eveningHighlights.map(e =>
    [e.delight && `Delight: "${e.delight}"`, e.accomplishment && `Accomplished: "${e.accomplishment}"`, e.learning && `Learned: "${e.learning}"`].filter(Boolean).join(' | ')
).join('\n') || 'No evening reflection data.'}

${futureLetter ? `Letter they wrote to themselves at the beginning:\n"${futureLetter.slice(0, 400)}${futureLetter.length > 400 ? '...' : ''}"` : ''}

Total: ${totalPractices} practices, ${gratitudeCount} gratitudes written, ${eveningPractices.length} evenings reflected.
Name: ${firstName}

WRITING DIRECTIVE:
${toneGuidance[coachTone]}

Write a memoir of 5 to 7 sentences. Rules:
1. Open with their name, then anchor in a real detail from the data (an intention they set, something they were grateful for, or a delight they named). If no real details exist, open with the weight of 90 practices.
2. Show the arc: who they were at the start versus who they are now. Make the change specific and earned.
3. Quote their actual words from the data — at least 1-2 quoted phrases. These are the moments that make it feel like their story, not anyone's story.
4. If a letter exists, reference it: they wrote something to themselves then, and this is that day arriving.
5. End with one sentence that looks forward without pressure — it should feel like a completion, not a launchpad.
6. Speak directly to them ("you", "your"). Never write in third person.
7. No em dashes. No bullet points. No headers. One flowing paragraph.
8. Never use these words: journey, intentional, mindful, tapestry, weave, tether, manifested, sovereignty, transformational, incredible.
9. HARD LIMIT: Under 150 words total.

Write the memoir now — no quotation marks around the whole thing, no preamble:`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 400,
                temperature: 0.9,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) return { memoir: fallbackMemoir, stats };

        const json = await response.json();
        let memoir = json.content?.[0]?.text?.trim();
        if (!memoir) return { memoir: fallbackMemoir, stats };

        // Strip wrapping quotes if model added them
        memoir = memoir.replace(/^["'']|["'']$/g, '').trim();

        return { memoir, stats };
    } catch {
        return { memoir: fallbackMemoir, stats };
    }
};
