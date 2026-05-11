/**
 * AI Service for Palante
 * Uses Anthropic Claude API to generate personalized affirmations and coaching messages.
 * Also contains behavior analysis and coach intervention logic (consolidated from aiCoach).
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

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

import type { ChatMessage, UserProfile, UserBehaviorPattern, CoachIntervention } from '../types';

export interface AIAffirmationResponse {
    text: string;
    author: string;
    category: string;
    isAI: boolean;
}

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

    const contextBlock = [
        user.profession ? `Profession: ${user.profession}` : '',
        `Current streak: ${user.streak || 0} days`,
        `Total practices completed all-time: ${totalPractices}`,
        user.currentMood ? `Current mood: ${user.currentMood}` : '',
        user.currentEnergy ? `Current energy: ${user.currentEnergy}/5` : '',
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
    ].filter(Boolean).join('\n');

    const fallback = buildFallbackNarrative(user);

    if (!GEMINI_API_KEY) return fallback;

    const prompt = `You are Palante, a personal growth companion. Based on the data below, write a warm 3-4 sentence reflection that speaks directly to the user. This will appear on their profile as a personal note from Palante.

Tone: supportive, specific, and human — like a trusted friend who has genuinely been paying attention. Always use second person ("you", "your"). Reference what they've actually been grateful for and what they're working toward — make it feel personal and seen. Never use the person's name. Never use generic filler. Weave details into flowing sentences, no lists.

Start with "You're" or "You've" — never with their name.

USER DATA:
${contextBlock}

Write the reflection now (3-4 sentences, second person, no headers, no lists):`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.85, maxOutputTokens: 300, topP: 0.95 }
            })
        });

        if (!response.ok) return fallback;

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || fallback;
    } catch {
        return fallback;
    }
};

const buildFallbackNarrative = (user: UserProfile): string => {
    const streak = user.streak || 0;
    const name = user.name || 'this person';
    const profession = user.profession || 'their field';
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
        : ` Whatever brought you here today, you showed up — and that\'s always the hardest part.`;

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
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, using fallback');
        return getFallbackAffirmation(request);
    }

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

    const coachIdentity = request.coachName ? `Coach ${request.coachName}` : 'Palante Coach';

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
Provide the response in exactly this JSON format:
{
    "text": "The affirmation or quote text (under 25 words)",
    "author": "${coachIdentity}" (Default to ${coachIdentity} unless you are quoting a specific historical figure that perfectly fits this persona's ${intensityDesc} tone)
}

Generate JSON now:`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 200,
                    topP: 0.95,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            console.error('Gemini API error:', response.status);
            return getFallbackAffirmation(request);
        }

        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!jsonText) {
            return getFallbackAffirmation(request);
        }

        try {
            const cleanJson = jsonText.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanJson);

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
        console.error('Error calling Gemini API:', error);
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
    if (!GEMINI_API_KEY) {
        return getDefaultCoachingMessage(context);
    }

    const prompt = `You are Palante Coach. Generate a brief, personalized coaching message (under 15 words) for ${userName}.

Context:
- Time: ${context.timeOfDay}
- Profession: ${context.profession}
- Current streak: ${context.streak} days
- Today's goals: ${context.completedGoals}/${context.totalGoals} completed

TONE: Be warm, friendly, and professional. NEVER use overly familiar terms like "my love", "dear", "honey". Address them by name or "you".

Be direct and focus on what matters most right now.

MEDICAL SAFETY GUIDE:
- Use only motivational language.
- NEVER give health, medical, or dietary advice.
- Stay within the bounds of a supportive coach.
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 50,
                }
            })
        });

        if (!response.ok) {
            return getDefaultCoachingMessage(context);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || getDefaultCoachingMessage(context);
    } catch {
        return getDefaultCoachingMessage(context);
    }
};

/**
 * Generate a personalized morning practice message based on gratitude, affirmations, and intention.
 */
export const generateMorningPracticeMessage = async (
    userName: string,
    data: {
        gratitudes: string[];
        affirmations: string[];
        intention: string;
        narrative?: string;
        momentumState?: MomentumState;
        coachTone?: 'nurturing' | 'direct' | 'accountability';
    }
): Promise<string> => {
    if (!ANTHROPIC_API_KEY) {
        return getFallbackMorningMessage(data);
    }

    const toneDirective = COACH_TONE_GUIDANCE[data.coachTone ?? 'nurturing'];

    const prompt = `You are the morning voice of Palante. You are a close friend and accountability partner who genuinely knows this person. You have read what they wrote this morning. Now you are going to say one true thing to them before they start their day.

YOUR VOICE:
You are warm, direct, and human. You do not perform. You do not poeticize. You speak the way a trusted friend texts you something real before a big day. Short sentences. Plain words. Nothing that sounds written. You believe in this person completely, and that belief comes through in how specific and honest you are, not in how beautiful your words are.

WHAT THEY WROTE THIS MORNING:
- Grateful for: ${data.gratitudes.join(', ')}
- Affirmations: ${data.affirmations.join(', ')}
- Today's intention: ${data.intention}
${data.narrative ? `\nWHO THEY'VE BEEN LATELY:\n${data.narrative}` : ''}
${data.momentumState ? `\nTHEIR CURRENT MOMENTUM: ${MOMENTUM_GUIDANCE[data.momentumState]}` : ''}

TONE:
${toneDirective}

YOUR TASK:
Read what they wrote. Pick the one thing that feels most alive. Respond to the meaning of it, not the words. What does it say about who they are right now? What do they need to hear to walk into this day with purpose? Say that. Say it like a person, not a program.

ABSOLUTE RULES — breaking any of these is a failure:
1. HARD LIMIT: 3 sentences, 40 words maximum total. Count both. If you are over, cut until you are under.
2. Each sentence should be short enough to say out loud in one breath.
3. NEVER use em dashes (the — character). Not once. Use periods and commas only.
4. NEVER open with their name.
5. NEVER paste their words back verbatim. Respond to the meaning, not the text.
6. NEVER write anything that could apply to any person on any day. If it could be on a poster, rewrite it.
7. NEVER use these words or phrases: "journey," "intentional," "mindful," "grounds you," "anchor," "foundation," "tapestry," "weave," "tether," "sovereignty," "mathematics," "small mercy," "not a small thing," "you've got this," "crush it," "make today count," "showed up."

VOICE EXAMPLES — the register to aim for. Never copy these:

"Your kids are going to feel who you are today. You already know how to show up for them. Go be that."

"Wanting peace is one thing. Deciding it is the ground you stand on is something else. That is what you did this morning."

"You have been building something. Today is another day of that. Keep going."

Write the message now. One paragraph, 3 sentences, no em dashes, no quotation marks around it.

MEDICAL SAFETY: NEVER provide medical advice, diagnosis, or treatment recommendations.
`;

    try {
        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 300,
                temperature: 0.9,
                messages: [{ role: 'user', content: prompt }],
            })
        });

        if (!response.ok) {
            return getFallbackMorningMessage(data);
        }

        const json = await response.json();
        let message = json.content?.[0]?.text?.trim();

        if (!message) return getFallbackMorningMessage(data);

        message = message.replace(/^["'']|["'']$/g, '').trim();
        message = message.replace(/ +([.,;:!?])/g, '$1');

        return message;
    } catch (error) {
        console.error('Error generating morning message:', error);
        return getFallbackMorningMessage(data);
    }
};

/**
 * Generate a personalized evening reflection message based on GLAD responses.
 */
export const generateEveningPracticeMessage = async (
    userName: string,
    data: {
        gratitude: string;
        learning: string;
        accomplishment: string;
        delight: string;
    }
): Promise<string> => {
    if (!ANTHROPIC_API_KEY) {
        return getFallbackEveningMessage(userName, data);
    }

    const prompt = `You are the evening voice of Palante. You are a close friend who just heard about this person's day. You have read what they shared. Now you are going to say one true thing to them before they rest.

YOUR VOICE:
Warm, honest, and human. Not a coach signing off. Not a poet performing. A person who genuinely cares, speaking plainly. Short sentences. Real words. Nothing that sounds like it was generated. You see what was good about their day and you say it simply, without embellishment.

WHAT THEY REFLECTED ON TODAY:
- Grateful for: ${data.gratitude}
- Something they learned: ${data.learning}
- What they accomplished: ${data.accomplishment}
- What delighted them: ${data.delight}

YOUR TASK:
Read all four. Pick the one that feels most real and human. Respond to what it means, not what it says. What does it tell you about who this person is and how they moved through today? Say that. Leave them feeling seen, not summarized.

ABSOLUTE RULES — breaking any of these is a failure:
1. HARD LIMIT: 3 sentences. Count them. If you wrote 4, delete one.
2. NEVER use em dashes (the — character). Not once. Use periods and commas only.
3. NEVER open with their name.
4. NEVER paste their words back verbatim. Respond to the meaning.
5. NEVER write something that could apply to anyone on any day. Be specific to what they actually shared.
6. No pressure toward tomorrow. This is an evening message. They are winding down, not gearing up.
7. NEVER use these words or phrases: "journey," "intentional," "mindful," "anchor," "tapestry," "tether," "sovereignty," "not a small thing," "well done," "you crushed it," "sweet dreams," "rest well," "the day is done," "you earned that."

VOICE EXAMPLES — the register to aim for. Never copy these:

"Someone you love got good news today and you were there for it. That is a real thing that happened. Hold onto that."

"You figured something out today that you did not know yesterday. That kind of thing does not go away."

"You got something done that needed doing. You know the difference that makes. Sleep well."

Write the message now. One paragraph, 3 sentences, no em dashes, no quotation marks around it.

MEDICAL SAFETY: NEVER provide medical advice, diagnosis, or treatment recommendations.
`;

    try {
        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 300,
                temperature: 0.9,
                messages: [{ role: 'user', content: prompt }],
            })
        });

        if (!response.ok) {
            return getFallbackEveningMessage(userName, data);
        }

        const json = await response.json();
        let message = json.content?.[0]?.text?.trim();

        if (!message) return getFallbackEveningMessage(userName, data);

        message = message.replace(/^["'']|["'']$/g, '').trim();

        return message;
    } catch (error) {
        console.error('Error generating evening message:', error);
        return getFallbackEveningMessage(userName, data);
    }
};

const getFallbackEveningMessage = (_userName: string, data: { gratitude: string; learning: string; accomplishment: string; delight: string }): string => {
    const g = data.gratitude?.trim();
    const l = data.learning?.trim();
    const a = data.accomplishment?.trim();
    const d = data.delight?.trim();

    // Deterministic seed from the actual content
    const seed = `${g}${l}${a}${d}`.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);

    // Safely quote user input — shorter entries get quoted directly, longer ones get referenced
    const q = (s: string) => s.length <= 80 ? `"${s}"` : `what you wrote about ${s.split(' ').slice(0, 3).join(' ')}...`;

    // Pick the single most vivid anchor — the longest entry wins (more words = more specific)
    const ranked = ([
        { field: 'delight', value: d },
        { field: 'accomplishment', value: a },
        { field: 'learning', value: l },
        { field: 'gratitude', value: g },
    ] as const).filter(e => e.value).sort((x, y) => y.value!.length - x.value!.length);

    if (!ranked.length) {
        return `You stopped at the end of your day to look at it. That is the whole practice. The life you are building runs on exactly this kind of attention. Keep reading it.`;
    }

    const { field, value } = ranked[0];

    if (field === 'delight') {
        const pool = [
            `${q(value!)} — you noticed that. Not just that it happened, but that it was worth writing down. That is a specific kind of aliveness that a lot of people lose over time. You have not lost it. Carry that into tomorrow.`,
            `You found delight in ${q(value!)} today. That moment, in a day full of things you could have rushed past, landed on you. The fact that you felt it and named it means you are still paying attention to the good parts of being alive. Protect that.`,
            `${q(value!)} — that cracked you open a little today. Good. Let it. That is what a life worth living feels like from the inside. You recognized it. That recognition is the whole thing.`,
        ];
        return pool[seed % pool.length];
    }

    if (field === 'accomplishment') {
        const pool = [
            `${q(value!)} — that moved from undone to done today, and you are the one who moved it. Not time. Not circumstance. You. Feel the full weight of that before you sleep. You earned the rest.`,
            `You got ${q(value!)} done today. The gap between where that stood this morning and where it stands tonight — you are that gap. You closed it. Let that sit with you.`,
            `${q(value!)} happened because you made it happen. That is the story of today. Tomorrow will ask something different of you. But today you delivered. Sleep knowing that.`,
        ];
        return pool[seed % pool.length];
    }

    if (field === 'learning') {
        const pool = [
            `${q(value!)} — you walked away from today knowing that. You did not know it this morning. You know it now. That is a real thing you built today, and no one can take it from you.`,
            `You figured out ${q(value!)} today. From being inside your own life and paying close enough attention to notice it. That kind of knowing does not expire. You will carry it into tomorrow without even trying.`,
            `${q(value!)} — that is what the day taught you. You were open enough to receive it. Most people miss that lesson because they are moving too fast. You were not moving too fast today.`,
        ];
        return pool[seed % pool.length];
    }

    // gratitude anchor
    const pool = [
        `You ended this day grateful for ${q(value!)}. That specific thing was still with you at the close of a whole day. That means it mattered — not just in the morning, but all the way through. Let it carry you into sleep.`,
        `${q(value!)} — that is what you are taking into tonight. There is something right about ending a day with your attention on the things worth holding. You did that. Rest well with it.`,
        `You found ${q(value!)} worth naming at the end of a full day. That kind of noticing is how people stay close to what their life is actually made of. You stayed close today.`,
    ];
    return pool[seed % pool.length];
};

/**
 * Chat with Palante Coach
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

export const chatWithCoach = async (
    message: string,
    history: ChatMessage[],
    context: UserContext
): Promise<string> => {
    // If no key, skip straight to simulation to avoid error logs
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('placeholder')) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Fake realistic delay
        return getSimulatedResponse(message, context);
    }

    const intensityDesc = getIntensityDescription(context.quoteIntensity);
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

    // Construct Memory Block
    const journalMemory = context.recentJournalEntries?.length
        ? `RECENT JOURNAL HIGHLIGHTS:\n${context.recentJournalEntries.map(e => `- ${e.date}: Win: ${e.highlight} | Challenge: ${e.lowlight}`).join('\n')}`
        : '';

    const reflectionMemory = context.recentReflections?.length
        ? `RECENT MEDITATION REFLECTIONS:\n${context.recentReflections.map(r => `- ${r.date}: Intention: ${r.intention} | Reflection: ${r.reflection}`).join('\n')}`
        : '';

    const energyMemory = context.energyLevel
        ? `Current Energy: ${context.energyLevel}/5. ${context.energyLevel <= 2 ? 'User is feeling low energy.' : 'User is feeling energized.'}`
        : '';

    const narrativeBlock = context.userNarrative
        ? `THEIR GROWTH STORY (synthesized from recent weeks):\n${context.userNarrative}\n`
        : '';

    const momentumBlock = context.momentumState
        ? `THEIR MOMENTUM RIGHT NOW: ${MOMENTUM_GUIDANCE[context.momentumState]}\n`
        : '';

    const moodBlock = context.currentMood ? `Current mood: ${context.currentMood}` : '';
    const focusBlock = context.focusAreas?.length ? `Focus areas: ${context.focusAreas.join(', ')}` : '';

    const toneBlock = context.coachTone
        ? `\nTONE DIRECTIVE FOR THIS SESSION:\n${COACH_TONE_GUIDANCE[context.coachTone]}\n`
        : `\nTONE DIRECTIVE FOR THIS SESSION:\n${COACH_TONE_GUIDANCE['nurturing']}\n`;

    // Construct System Prompt
    const systemPrompt = `You are Palante Coach, a warm, nurturing, and deeply supportive friend and mentor.

    USER CONTEXT:
    - Name: ${context.name}
    - Profession: ${context.profession || 'Undisclosed'}
    - Streak: ${context.currentStreak} days
    - Today's Progress: ${context.completedGoals}/${context.totalGoals} goals completed.
    - Time: ${timeOfDay}
    ${moodBlock}
    ${focusBlock}

    ${narrativeBlock}
    ${momentumBlock}
    ${energyMemory}
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

    MEDICAL SAFETY GUIDE:
    - You are a wellness coach, NOT a doctor.
    - NEVER provide medical advice or suggest specific diets.
    - If asked for medical advice, clearly state you are an AI coach and they should consult a professional.
    `;

    // Format History for Gemini
    // Filter out init-greeting messages (they're represented by the fake model ack below),
    // and drop the last message if it's the current user message to avoid duplication.
    const cleanHistory = history
        .filter(msg => !msg.id?.startsWith('init-'))
        .slice(-10);
    const historyForAPI = cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user'
        ? cleanHistory.slice(0, -1)
        : cleanHistory;

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Got it! I'm ready to be a friendly, feature-focused guide." }] },
        ...historyForAPI.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
    ];

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                }
            })
        });

        if (!response.ok) {
            // Silently fall back to simulation instead of showing error
            console.warn('Gemini Chat API fail, using fallback.');
            return getSimulatedResponse(message, context);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || getSimulatedResponse(message, context); // Fallback if empty

    } catch (error) {
        console.error('Error calling Gemini Chat:', error);
        // Fallback to simulation
        return getSimulatedResponse(message, context);
    }
};

// ── Pillar System Prompts ────────────────────────────────────────────────────
// Each pillar gives the AI a focused coaching lens from the very first message.

export type CoachPillarKey = 'anxiety' | 'focus' | 'motivation' | 'setbacks' | 'open';

const PILLAR_SYSTEM_PROMPTS: Record<CoachPillarKey, string> = {
    anxiety: `You are Palante Coach, operating specifically as an anxiety and stress-relief guide.
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

    focus: `You are Palante Coach, operating specifically as a focus and deep-work guide.
The user has come to you because they are struggling to concentrate, stay on task, or cut through distraction.

YOUR APPROACH:
- Start by understanding what kind of focus they need (deep work, task-switching, procrastination, etc.).
- Offer specific, science-backed strategies: timed focus intervals, single-tasking, environment design, reducing friction.
- Help them identify and remove the root obstacle to their focus (fear of failure? perfectionism? unclear priorities?).
- Reference their current goals and energy level if available.
- Be direct and practical — they need a plan, not just encouragement.

NEVER: be vague or fluffy. They chose Focus because they need real help cutting through the noise.
TONE: Crisp, efficient, warm-but-direct. Like a high-performance coach who respects their time.`,

    motivation: `You are Palante Coach, operating specifically as a motivation and momentum guide.
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

    setbacks: `You are Palante Coach, operating specifically as a resilience and recovery guide.
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

    open: `You are Palante Coach, a warm, nurturing, and deeply supportive friend and mentor.
The user has come for an open conversation — no specific agenda.

YOUR APPROACH:
- Be curious and open. Let them lead. Ask a good question first.
- Listen actively. Reference their context naturally (energy, journal, goals).
- Only offer tools or advice once they've felt genuinely heard.
- Match their emotional register — don't project energy they haven't shown.

TONE: Conversational, human, patient. Like a trusted friend who happens to be a great coach.`,
};

/**
 * Chat with Palante Coach using a pillar-specific system prompt.
 * Drops straight into the chat — no separate intro card.
 */
export const chatWithCoachPillar = async (
    message: string,
    history: ChatMessage[],
    context: UserContext,
    pillar: CoachPillarKey
): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('placeholder')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getSimulatedResponse(message, context);
    }

    const pillarPrompt = PILLAR_SYSTEM_PROMPTS[pillar];
    const intensityDesc = getIntensityDescription(context.quoteIntensity);
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

    const journalMemory = context.recentJournalEntries?.length
        ? `RECENT JOURNAL HIGHLIGHTS:\n${context.recentJournalEntries.map(e => `- ${e.date}: Win: ${e.highlight} | Challenge: ${e.lowlight}`).join('\n')}`
        : '';

    const reflectionMemory = context.recentReflections?.length
        ? `RECENT MEDITATION REFLECTIONS:\n${context.recentReflections.map(r => `- ${r.date}: Intention: ${r.intention} | Reflection: ${r.reflection}`).join('\n')}`
        : '';

    const energyMemory = context.energyLevel
        ? `Current Energy: ${context.energyLevel}/5. ${context.energyLevel <= 2 ? 'User is feeling low energy.' : 'User is feeling energized.'}`
        : '';

    const narrativeBlockPillar = context.userNarrative
        ? `THEIR GROWTH STORY (synthesized from recent weeks):\n${context.userNarrative}\n`
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

MEDICAL SAFETY GUIDE:
- You are a wellness coach, NOT a doctor.
- NEVER provide medical advice or suggest specific diets.
- If asked for medical advice, clearly state you are an AI coach and they should consult a professional.`;

    // Filter out init-greeting messages and drop last message if it's the current user message (avoid duplication)
    const cleanHistoryPillar = history
        .filter(msg => !msg.id?.startsWith('init-'))
        .slice(-10);
    const historyForAPIPillar = cleanHistoryPillar.length > 0 && cleanHistoryPillar[cleanHistoryPillar.length - 1].role === 'user'
        ? cleanHistoryPillar.slice(0, -1)
        : cleanHistoryPillar;

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Understood. I'm ready to be a focused ${pillar} coach for ${context.name}.` }] },
        ...historyForAPIPillar.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
    ];

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.72, maxOutputTokens: 350 }
            })
        });

        if (!response.ok) {
            console.warn('Gemini Pillar Chat fail, using fallback.');
            return getSimulatedResponse(message, context);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || getSimulatedResponse(message, context);

    } catch (error) {
        console.error('Error calling Gemini Pillar Chat:', error);
        return getSimulatedResponse(message, context);
    }
};

// Fallback affirmations when API is unavailable
const FALLBACK_AFFIRMATIONS: Record<1 | 2 | 3, string[]> = {
    1: [
        "You are exactly where you need to be right now.",
        "Progress, not perfection, is your path forward.",
        "Your potential unfolds one breath at a time.",
        "Trust the journey you're on.",
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
    const intensity = request.quoteIntensity || 2;
    // @ts-expect-error - FALLBACK_AFFIRMATIONS uses numeric index keys
    const affirmations = FALLBACK_AFFIRMATIONS[intensity] || FALLBACK_AFFIRMATIONS[2];
    const text = affirmations[Math.floor(Math.random() * affirmations.length)];
    const coachIdentity = request.coachName ? `Coach ${request.coachName}` : 'Palante Coach';

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

const getFallbackMorningMessage = (data: { gratitudes: string[]; affirmations: string[]; intention: string; }): string => {
    const hasGratitude = data.gratitudes.some(g => g.trim());
    const hasAffirmation = data.affirmations.some(a => a.trim());
    const intention = data.intention?.trim();

    const hashStr = `${intention ?? ''}|${data.gratitudes[0] ?? ''}|${data.affirmations[0] ?? ''}`;
    const seed = hashStr.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);

    // Embed intention only when it reads naturally as a phrase (short, doesn't open with "I")
    const canEmbed = intention && intention.length <= 50 && !/^i\b/i.test(intention);

    if (intention && hasGratitude && hasAffirmation) {
        const pool = canEmbed ? [
            `Today is for ${intention}. You walked in with gratitude and you know what you're made of. That's real. Go make it count.`,
            `You've got your intention, you've got gratitude, and you know who you are. Someone who starts like that goes into the day differently. Go.`,
            `${intention} is what today is for. You showed up knowing that and knowing yourself. Go live that out.`,
        ] : [
            `You know what today is for, you know what you're grateful for, and you know what you're made of. That's a real morning. Go.`,
            `You came in with gratitude, with belief in yourself, and with a clear intention. Go make it count.`,
            `Not everyone starts their day like this. You did. Go show up for the rest of it.`,
        ];
        return pool[seed % pool.length];
    }

    if (intention && hasGratitude) {
        const pool = canEmbed ? [
            `Today is for ${intention}. You've got gratitude behind you. Go.`,
            `You know what you're grateful for and you know what today is for. Let those two things carry you.`,
        ] : [
            `You started with gratitude and you know what today is for. That's enough to build a whole day on. Go.`,
            `Gratitude and a clear intention in the same morning. That's yours today. Go live it.`,
        ];
        return pool[seed % pool.length];
    }

    if (intention && hasAffirmation) {
        const pool = canEmbed ? [
            `Today is for ${intention} and you already know you've got what it takes. Go get it.`,
            `You know what today is for and you know who you are. Go use both.`,
        ] : [
            `You know what today is for and you know what you're capable of. That's enough. Go.`,
            `Clear on your intention, clear on yourself. Go see what that combination looks like today.`,
        ];
        return pool[seed % pool.length];
    }

    if (intention) {
        const pool = canEmbed ? [
            `Today is for ${intention}. You named that before the day had a chance to name itself. Hold it.`,
            `${intention}. That's what you're walking toward today. Go.`,
            `You decided what today is for before anything else got a vote. That's yours now. Go live it.`,
        ] : [
            `You named what today is for before anything else could. Hold onto that and go.`,
            `You know what today is for. Most people never get that clear. You already are. Go.`,
        ];
        return pool[seed % pool.length];
    }

    if (hasGratitude && hasAffirmation) {
        const pool = [
            `Gratitude and belief in yourself in the same morning. Not everyone starts there. Go build on it.`,
            `You found something worth being grateful for and you know who you are. That's a strong way to start. Go.`,
        ];
        return pool[seed % pool.length];
    }

    if (hasGratitude) {
        const pool = [
            `You started with gratitude. That means you're paying attention to what's real. Keep paying attention today.`,
            `You found something worth being grateful for this morning. Let that tell you something about the day you're capable of having.`,
        ];
        return pool[seed % pool.length];
    }

    if (hasAffirmation) {
        const pool = [
            `You know who you are. You said it out loud this morning before the day could say otherwise. Go live it.`,
            `You showed up for yourself today. That's the first move. Keep moving.`,
        ];
        return pool[seed % pool.length];
    }

    const pool = [
        `You showed up. That's the move. Go find out what today has for you.`,
        `You're here doing this. That matters more than it sounds like it does. Go.`,
    ];
    return pool[seed % pool.length];
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
    return !!ANTHROPIC_API_KEY;
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
    if (!GEMINI_API_KEY) {
        return getFallbackReflectionAnalysis();
    }

    const prompt = `You are a Compassionate Mindset Coach. Analyze these 3 daily reflection answers from a user.
    
    ANSWERS:
    1. ${data.q1}
    2. ${data.q2}
    3. ${data.q3}
    ${data.freeform ? `Journal: ${data.freeform}` : ''}

    TASK:
    Provide immediate, high-impact feedback in exactly this JSON format:
    {
        "praise": "1 brief sentence validating their specific win or insight.",
        "powerMove": "1 specific, actionable sentence advice for tomorrow based on their challenge/pivot."
    }

    TONE:
    - Praise: Warm, acknowledging, specific.
    - Power Move: Direct, strategic, encouraging. "Try this...", "Focus on...", "Remember to..."

    Generate JSON now:`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) return getFallbackReflectionAnalysis();

        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!text) return getFallbackReflectionAnalysis();

        // Parse JSON safely
        try {
            const cleanText = text.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanText);
            return {
                praise: result.praise || "Great work reflecting today.",
                powerMove: result.powerMove || "Keep pushing forward tomorrow."
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
    if (!GEMINI_API_KEY) return fallback;

    const factsText = facts.map(f => `- ${f.label}: ${f.value} (${f.dataPoint})`).join('\n');

    const prompt = `You have 30 days of behavioral data for a wellness app user. Pick the ONE most interesting, specific, and surprising pattern — something they might not have consciously noticed.

DATA:
${factsText}

RULES:
1. Choose the single most meaningful fact. Avoid the obvious. Prefer the specific.
2. Write ONE sentence (under 20 words) framing it as a warm discovery. Start with "You" or "Your".
3. Extract the most concrete data point (a day name, a number, a count).
4. Bad: "You practice regularly." Good: "Your energy consistently peaks on Thursdays."

Respond in JSON only:
{"insight": "...", "dataPoint": "..."}`;

    try {
        const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 120, responseMimeType: 'application/json' }
            })
        });
        if (!res.ok) return fallback;

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) return fallback;

        const result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
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
            message: `⚠️ You're in your grace period! Complete any practice today to keep your ${user.streakData.currentStreak}-day streak alive`,
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
    if (!GEMINI_API_KEY || accomplishments.length === 0) return fallback;

    const bulletList = accomplishments.map((a, i) => `${i + 1}. ${a}`).join('\n');

    const prompt = `You are Palante, a personal growth companion. A user named ${firstName} just completed their week and logged these accomplishments:

${bulletList}

Write a warm, specific 2-3 sentence reflection that speaks directly to them. Reference 2-3 of their actual wins by paraphrasing them — don't list them, weave them into flowing sentences. End with a short forward-leaning sentence that propels them into the next week (something like "Keep going." or "That's someone keeping their word to themselves.").

Tone: warm, human, like a trusted friend who genuinely noticed. Second person only ("you", "your"). Never use their name. No generic filler. No headers. No lists. Max 60 words.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.88, maxOutputTokens: 120, topP: 0.95 }
            })
        });
        if (!response.ok) return fallback;
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || fallback;
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
    if (!ANTHROPIC_API_KEY) return { memoir: fallbackMemoir, stats };

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
        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
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
