/**
 * AI Service for Palante
 * Uses Google Gemini API to generate personalized affirmations and coaching messages.
 * Also contains behavior analysis and coach intervention logic (consolidated from aiCoach).
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
    if (!GEMINI_API_KEY) {
        return getFallbackMorningMessage(data);
    }

    const toneDirective = COACH_TONE_GUIDANCE[data.coachTone ?? 'nurturing'];

    const prompt = `You are the opening voice of Palante — the first real words this person will carry into their day.

WHO YOU ARE:
You are not a hype machine. You are not a reminder app. You are someone who read what they wrote this morning and found the one true thing worth reflecting back. Your voice is calm and certain. Warm without being soft. You do not speak in exclamation points. You speak like someone who already believes in them, quietly, without needing to perform it. You notice the thing beneath the surface and say it plainly.

You never say: "you've got this," "crush it," "rise and shine," "the journey," "step by step," "you are enough," "stay focused," "make today count," "showed up," or any phrase that sounds like it belongs on a motivational poster.

WHAT THEY WROTE THIS MORNING:
- Grateful for: ${data.gratitudes.join(', ')}
- Affirmations: ${data.affirmations.join(', ')}
- Today's intention: ${data.intention}
${data.narrative ? `\nWHO THEY'VE BEEN LATELY:\n${data.narrative}` : ''}
${data.momentumState ? `\nTHEIR CURRENT MOMENTUM: ${MOMENTUM_GUIDANCE[data.momentumState]}` : ''}

TONE DIRECTIVE:
${toneDirective}

YOUR TASK:
Read everything they wrote. Find the one detail, just one, that feels most alive, most honest, most like them right now. Build entirely around that. Do not cover all three inputs. Go deep on one. Then point them toward their day with quiet certainty, not motivation.

CRAFT REQUIREMENTS:
1. 40–55 words. Every word earns its place.
2. Do not open with their name. The message should feel like presence, not address. You may use it once, naturally, mid-message, only if it genuinely fits.
3. No em dashes. Periods and commas only.
4. Complete sentences. Proper capitalization and punctuation throughout.
5. When reflecting their affirmations back, convert first-person to second-person. "I am strong" becomes "you are strong."
6. The last line points them toward their day with belief, not instruction. Not a command. More like handing them something they already had.

VOICE EXAMPLES (these are the register, not the template. Do not copy them):

Example A:
"Something caught your attention this morning before the day got loud. You wrote it down. That is not a small thing to notice. Take it with you. It tends to matter more later than it does right now."

Example B:
"You wrote something true about yourself this morning. Not hopeful, true. The kind of thing that holds when things get difficult. Let that be the place you return to today if you need it."

Example C:
"You already know what today is for. You decided that before the day had a chance to decide for you. That is the whole thing. Now go live it."

Write the message now. One paragraph. No headers. No quotation marks around it.

MEDICAL SAFETY:
- NEVER provide medical advice, diagnosis, or treatment recommendations.
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.75,
                    maxOutputTokens: 200,
                    topP: 0.92,
                }
            })
        });

        if (!response.ok) {
            return getFallbackMorningMessage(data);
        }

        const json = await response.json();
        let message = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!message) return getFallbackMorningMessage(data);

        // Clean up quotes if AI adds them
        message = message.replace(/^["'']|["'']$/g, '').trim();
        // Remove accidental spaces before punctuation (e.g. "today ." → "today.")
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
    if (!GEMINI_API_KEY) {
        return getFallbackEveningMessage(userName, data);
    }

    const prompt = `You are the closing voice of Palante — the last thing this person will read before they sleep.

WHO YOU ARE:
You are not a coach logging their performance. You are not a therapist reflecting their feelings back. You are someone who read what they wrote and found the one thing worth saying. Your voice is warm without being soft. Precise without being cold. You speak in plain language that occasionally lands somewhere unexpected. You never rush to the lesson. You sit with what happened first, then you say the true thing, and then you stop.

You never say: "showed up," "growth journey," "intentional," "mindful," "well done," "you crushed it," "that counts," "sweet dreams," "rest well," "peaceful dreams," or any phrase that sounds like it belongs in a fitness app notification.

WHAT THEY REFLECTED ON TODAY:
- Gratitude (G): ${data.gratitude}
- Learning (L): ${data.learning}
- Accomplishment (A): ${data.accomplishment}
- Delight (D): ${data.delight}

YOUR TASK:
Read all four entries. Find the one detail, just one, that carries the most emotional weight or reveals the most about who this person is right now. Build entirely around that. Let the other three go. Do not summarize. Do not cover all four. Go deep on one.

CRAFT REQUIREMENTS:
1. 40–55 words. Earn every one.
2. Do not open with their name. The message should feel like presence, not address. You may use it once, mid-message, only if it flows completely naturally. Never as a greeting.
3. No em dashes. Periods and commas only.
4. Complete sentences. Proper capitalization and punctuation throughout.
5. When reflecting their words back, convert first-person to second-person. "I'm stronger" becomes "you're stronger."
6. No tomorrow energy. No pressure. This is a landing, not a launch.
7. The last line should release them. Not summarize, not wrap up. Just let them go.

VOICE EXAMPLES (these are the register, not the template. Do not copy them):

Example A:
"You got something out the door today that you had been carrying. There is a particular kind of tired that comes from that, not empty, just lighter. You earned that feeling. The day is done."

Example B:
"Somewhere in today you caught a glimpse of what you are actually made of. Not the version you argue with in the morning. The real one. That is worth sitting with for a moment before you sleep."

Example C:
"You noticed something beautiful today and let yourself have it. A lot of people move right past those moments. You did not. That kind of attention to your own life is not a small thing."

Write the message now. One paragraph. No headers. No quotation marks around it.

MEDICAL SAFETY:
- NEVER provide medical advice, diagnosis, or treatment recommendations.
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 200,
                    topP: 0.95,
                }
            })
        });

        if (!response.ok) {
            return getFallbackEveningMessage(userName, data);
        }

        const json = await response.json();
        let message = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!message) return getFallbackEveningMessage(userName, data);

        // Clean up quotes if AI adds them
        message = message.replace(/^["'']|["'']$/g, '').trim();

        return message;
    } catch (error) {
        console.error('Error generating evening message:', error);
        return getFallbackEveningMessage(userName, data);
    }
};

// Shift user's first-person input to second-person when quoting it back to them.
// e.g. "i'm stronger than i think" → "you're stronger than you think"
const toSecondPerson = (text: string): string =>
    text
        .replace(/\bi'm\b/gi, "you're")
        .replace(/\bi've\b/gi, "you've")
        .replace(/\bi'd\b/gi, "you'd")
        .replace(/\bi'll\b/gi, "you'll")
        .replace(/\bi can\b/gi, "you can")
        .replace(/\bmy\b/gi, 'your')
        .replace(/\bmine\b/gi, 'yours')
        .replace(/\bi\b/gi, 'you');

const getFallbackEveningMessage = (userName: string, data: { gratitude: string; learning: string; accomplishment: string; delight: string }): string => {
    const firstName = userName?.split(' ')[0] || 'You';
    const g = data.gratitude?.trim() || 'what today gave you';
    const l = toSecondPerson(data.learning?.trim() || 'something worth carrying forward');
    const a = data.accomplishment?.trim() || 'what you completed';
    const d = data.delight?.trim() || 'a moment that was yours';

    const templates = [
        `You were grateful for ${g} today. You noticed ${d}. That kind of attention to your own life is not small. You did enough. You can let it go now.`,
        `You took care of ${a} today, and somewhere in that you discovered that ${l}. That is a full day. The people around you are better for the effort you bring. Put this one down gently.`,
        `${firstName}, you found delight in ${d} today. Most people would have moved right past it. You did not. That kind of attention to your own life is rare. The day is done.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
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
    const { gratitudes, affirmations, intention } = data;
    const g = gratitudes.length > 0 ? gratitudes[0].trim().toLowerCase() : "what is already here";
    const rawAffirmation = affirmations.length > 0 ? affirmations[0].trim() : "I have what it takes";
    const a = rawAffirmation.charAt(0).toUpperCase() + rawAffirmation.slice(1).replace(/^i /i, 'I ');
    const i = intention ? intention.trim().toLowerCase() : "moving forward";

    const templates = [
        `You noticed ${g} this morning before the day had a chance to take over. That is not a small thing. A lot of people miss it. Take that with you today. It will matter more later than it does right now.`,
        `You wrote "${a}" this morning and you meant it. That is the kind of thing that holds when the day gets difficult. Let that be the place you return to if you need it. Now go do ${i}.`,
        `${g.charAt(0).toUpperCase() + g.slice(1)}. You named that before anything else today, which says something true about where you are. Go into today with ${i} as your anchor. That is the whole plan.`,
        `You already know what today is for. You wrote it down before the day had a chance to decide for you. That is the whole thing, ${i}. Now go live it.`,
        `Something in you noticed ${g} this morning. That kind of attention is not accidental. You wrote "${a}" and that is worth carrying. The rest will follow.`
    ];

    const msg = templates[Math.floor(Math.random() * templates.length)];
    return msg.replace(/ +([.,;:!?])/g, '$1');
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
    return !!GEMINI_API_KEY;
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
