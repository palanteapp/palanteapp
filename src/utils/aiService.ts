/**
 * AI Service for Palante
 * Uses Google Gemini API to generate personalized affirmations and coaching messages
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface AIAffirmationRequest {
    profession: string;
    focusGoal: string;
    interests: string[];
    tier: 1 | 2 | 3; // 1 = Calm, 2 = Firm, 3 = Drill Sergeant
    streak?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    userName?: string;
}

export interface AIAffirmationResponse {
    text: string;
    author: string;
    category: string;
    isAI: boolean;
}

const getTierDescription = (tier: 1 | 2 | 3): string => {
    switch (tier) {
        case 1: return 'gentle, calming, and nurturing. Think Buddha, Thich Nhat Hanh - peaceful and affirming.';
        case 2: return 'stoic, disciplined, and direct. Think Marcus Aurelius, Jocko Willink - firm but wise.';
        case 3: return 'intense, aggressive, and no-nonsense. Think David Goggins, military drill sergeant - in your face, profanity allowed.';
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

/**
 * Generate a personalized affirmation using Gemini AI
 */
export const generateAffirmation = async (request: AIAffirmationRequest): Promise<AIAffirmationResponse> => {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, using fallback');
        return getFallbackAffirmation(request);
    }

    const tierDesc = getTierDescription(request.tier);
    const timeContext = getTimeContext(request.timeOfDay);
    const streakContext = request.streak && request.streak > 0
        ? `They are on a ${request.streak}-day streak - acknowledge their consistency!`
        : '';

    const prompt = `You are Palante Coach, a personal wellness and motivation coach. Generate a single, powerful affirmation or motivational quote for someone with these characteristics:

- Profession: ${request.profession || 'General'}
- Current Focus/Goal: ${request.focusGoal || 'Personal growth'}
- Interests: ${request.interests?.join(', ') || 'General wellness'}
${streakContext}
${timeContext}

IMPORTANT STYLE GUIDE:
Your tone should be ${tierDesc}

RULES:
1. Generate ONLY the quote/affirmation text - no quotes marks, no attribution
2. Make it specific to their profession when possible (reference their work, challenges, wins)
3. Keep it under 25 words for impact
4. Make it actionable when appropriate
5. ${request.tier === 3 ? 'Profanity is allowed and encouraged for intensity.' : 'Keep it clean but powerful.'}

Generate one affirmation now:`;

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
                    maxOutputTokens: 100,
                    topP: 0.95,
                }
            })
        });

        if (!response.ok) {
            console.error('Gemini API error:', response.status);
            return getFallbackAffirmation(request);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!generatedText) {
            return getFallbackAffirmation(request);
        }

        // Clean up the response (remove any quotation marks Gemini might add)
        const cleanedText = generatedText
            .replace(/^["'"']|["'"']$/g, '')
            .replace(/^- /, '')
            .trim();

        return {
            text: cleanedText,
            author: 'Palante Coach',
            category: getCategoryFromRequest(request),
            isAI: true
        };
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

Be warm but direct. Focus on what matters most right now.`;

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
        "Nobody cares. Work harder.",
        "Stop talking. Start doing.",
        "Excuses are for the weak. You're not weak.",
        "Pain is temporary. Quitting lasts forever.",
    ],
};

const getFallbackAffirmation = (request: AIAffirmationRequest): AIAffirmationResponse => {
    const tier = request.tier || 2;
    const affirmations = FALLBACK_AFFIRMATIONS[tier];
    const text = affirmations[Math.floor(Math.random() * affirmations.length)];

    return {
        text,
        author: 'Palante Coach',
        category: getCategoryFromRequest(request),
        isAI: true
    };
};

const getCategoryFromRequest = (request: AIAffirmationRequest): string => {
    if (request.focusGoal) return 'Focus';
    if (request.profession) return request.profession;
    return 'Motivation';
};

const getDefaultCoachingMessage = (context: { timeOfDay: string; completedGoals: number; totalGoals: number }): string => {
    if (context.completedGoals === context.totalGoals && context.totalGoals > 0) {
        return "All goals complete. You crushed it today.";
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
