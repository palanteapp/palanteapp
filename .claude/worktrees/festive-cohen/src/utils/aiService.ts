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
    // New Memory Fields
    recentJournalEntries?: { date: string; highlight: string; lowlight: string }[];
    recentReflections?: { date: string; intention: string; reflection: string }[];
    energyTrends?: { timestamp: string; level: number }[];
}

import type { ChatMessage, UserProfile, UserBehaviorPattern, CoachIntervention } from '../types';

export interface AIAffirmationResponse {
    text: string;
    author: string;
    category: string;
    isAI: boolean;
}

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

    const coachIdentity = request.coachName ? `Coach ${request.coachName}` : 'Palante Coach';

    const prompt = `You are ${coachIdentity}, a high-performance wellness and motivation coach. "Pa'lante" means "para adelante" — strictly forward. Your mission is to help the user move forward with clarity and power.

Generate a single, powerful affirmation or motivational quote for someone with these characteristics:
- Profession: ${request.profession || 'General'}
- Current Focus/Goal: ${request.focusGoal || 'Personal growth'}
- Interests: ${request.interests?.join(', ') || 'General wellness'}
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
    }
): Promise<string> => {
    if (!GEMINI_API_KEY) {
        return getFallbackMorningMessage(data);
    }

    const prompt = `You are Palante Coach, a professional, supportive, and uplifting coach.
Generate a short, powerful morning message for ${userName} that sets a high-vibe tone for the day.

INPUTS:
- Gratitudes: ${data.gratitudes.join(', ')}
- Affirmations: ${data.affirmations.join(', ')}
- Intention: ${data.intention}

REQUIREMENTS:
1. NEVER list the items out. Instead, weave them into a single, cohesive, and professional narrative.
2. Be brief (strictly under 35 words).
3. Opening: Always use a warm, professional greeting with their name (e.g., "Good morning, ${userName}!").
4. Tone: Encouraging, supportive, and grounded. Avoid fluffy or overly sentimental language.
5. Focus on how their gratitudes and affirmations fuel their intention of ${data.intention}.
6. CRITICAL: Avoid violent or aggressive language in coaching advice (e.g., 'conquer', 'battle', 'destroy'). Use growth-oriented words instead. You may use the term 'Warrior' ONLY when referring to a user's 'Week Warrior' or 'Year Warrior' milestone achievement. Otherwise, stick to supportive language like 'thrive', 'blossom', 'flow', or 'create'.

Generate this brief, professional boost now:

MEDICAL SAFETY GUIDE:
- NEVER provide medical advice, diagnosis, or treatment recommendations.
- NEVER suggest specific diets or medical interventions.
- If the user asks for medical advice, gently redirect them to a healthcare professional.
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 150,
                    topP: 0.95,
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
        return getFallbackEveningMessage(data);
    }

    const prompt = `You are Palante Coach, a professional, supportive, and grounded coach.
Generate a short, soothing, and beautiful evening message for ${userName} that summarizes their day based on their G.L.A.D. reflection.

INPUTS:
- Gratitude (G): ${data.gratitude}
- Learning (L): ${data.learning}
- Accomplishment (A): ${data.accomplishment}
- Delight (D): ${data.delight}

REQUIREMENTS:
1. NEVER list the items out. Instead, weave them into a single, cohesive, and poetic narrative that honors their day.
2. Be brief (strictly under 35 words).
3. Opening: Use a warm, soothing greeting with their name (e.g., "Well done today, ${userName}.").
4. Tone: Reflective, peaceful, and encouraging. Focus on the beauty of their day and the growth they achieved.
5. Close: End with a gentle, positive closing (e.g., "Rest well now.").
6. CRITICAL: Avoid violent or aggressive language. Use words like 'peace', 'growth', 'gratitude', 'rest', and 'clarity'.

Generate this brief, beautiful evening summary now:

MEDICAL SAFETY GUIDE:
- NEVER provide medical advice or suggest medical interventions.
- Stay within the bounds of a supportive, reflective coach.
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 150,
                    topP: 0.95,
                }
            })
        });

        if (!response.ok) {
            return getFallbackEveningMessage(data);
        }

        const json = await response.json();
        let message = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!message) return getFallbackEveningMessage(data);

        // Clean up quotes if AI adds them
        message = message.replace(/^["'']|["'']$/g, '').trim();

        return message;
    } catch (error) {
        console.error('Error generating evening message:', error);
        return getFallbackEveningMessage(data);
    }
};

const getFallbackEveningMessage = (data: { gratitude: string; learning: string; accomplishment: string; delight: string }): string => {
    const { gratitude } = data;
    const gratitudeSample = gratitude.length > 20 ? gratitude.substring(0, 20) + "..." : gratitude;

    const templates = [
        `Rest well, knowing your day was anchored in ${gratitudeSample}. May your night be as peaceful as the delight you found today. Sleep deeply.`,
        `A day well-lived ends in gratitude. Your reflection on ${gratitudeSample} and today's accomplishments show true growth. Peaceful dreams.`,
        `Honor the journey of this day. Your heart is full of gratitude, and your mind is wise with new learnings. Rest with a light heart.`
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

    // Construct System Prompt
    const systemPrompt = `You are Palante Coach, a warm, nurturing, and deeply supportive friend and mentor.
    
    USER CONTEXT:
    - Name: ${context.name}
    - Profession: ${context.profession || 'Undisclosed'}
    - Streak: ${context.currentStreak} days
    - Today's Progress: ${context.completedGoals}/${context.totalGoals} goals completed.
    - Time: ${timeOfDay}
    
    ${energyMemory}
    ${journalMemory}
    ${reflectionMemory}
    
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
    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Got it! I'm ready to be a friendly, feature-focused guide." }] },
        ...history.slice(-10).map(msg => ({
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
- Offer specific, science-backed strategies: Pomodoro, single-tasking, environment design, reducing friction.
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

    const systemPrompt = `${pillarPrompt}

USER CONTEXT:
- Name: ${context.name}
- Profession: ${context.profession || 'Undisclosed'}
- Streak: ${context.currentStreak} days
- Today's Progress: ${context.completedGoals}/${context.totalGoals} goals completed.
- Time: ${timeOfDay}

${energyMemory}
${journalMemory}
${reflectionMemory}

STYLE: ${intensityDesc}
RESPONSE LENGTH: Keep responses focused and conversational. Under 120 words unless the user asks for something detailed.

MEDICAL SAFETY GUIDE:
- You are a wellness coach, NOT a doctor.
- NEVER provide medical advice or suggest specific diets.
- If asked for medical advice, clearly state you are an AI coach and they should consult a professional.`;

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Understood. I'm ready to be a focused ${pillar} coach for ${context.name}.` }] },
        ...history.slice(-10).map(msg => ({
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
    const gratitudeText = gratitudes.length > 0 ? gratitudes[0].toLowerCase() : "the abundance in your life";
    const affirmationText = affirmations.length > 0 ? affirmations[0].toLowerCase() : "your inner power";

    const templates = [
        `Today, I carry the intent of ${gratitudeText} as my foundation. Step into the world knowing that I am ${affirmationText} and believing in all of my dreams. Let ${intention.toUpperCase()} be my guide.`,
        `Good morning! With ${gratitudeText} in your mind and the power of being ${affirmationText}, you are unstoppable today. Let ${intention} lead the way.`,
        `Your journey today starts with ${gratitudeText}. Remember that you are ${affirmationText}. Trust in your path and let ${intention} be your North Star.`,
        `A beautiful day begins with ${gratitudeText}. You are ${affirmationText}, and your intention of ${intention} will guide you to greatness.`,
        `Sending you a boost of energy! Ground yourself in ${gratitudeText}, embrace that you are ${affirmationText}, and let ${intention} shine through everything you do.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
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
