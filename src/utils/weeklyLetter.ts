import type { UserProfile } from '../types';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`;
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const getProxyHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
});

// Returns ISO week number (1-53)
export const getISOWeekNumber = (date: Date = new Date()): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Returns true if today is Sunday
export const isSunday = (): boolean => new Date().getDay() === 0;

// Returns true if the stored letter is from a different week than today
export const letterIsStale = (user: UserProfile): boolean => {
    const stored = user.weeklyPartnerLetter;
    if (!stored) return true;
    const storedWeek = stored.weekNumber;
    const thisWeek = getISOWeekNumber();
    const storedYear = new Date(stored.generatedAt).getFullYear();
    const thisYear = new Date().getFullYear();
    return storedWeek !== thisWeek || storedYear !== thisYear;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const generateWeeklyLetter = async (user: UserProfile): Promise<string> => {
    const firstName = (user.name || '').trim().split(/\s+/)[0] || 'Friend';
    const partnerName = user.coachName || 'Palante';

    // Gather last 7 days of practice data
    const today = new Date();
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);

    const morningThisWeek = (user.dailyMorningPractice || user.dailyPriming || [])
        .filter(p => p.date >= weekAgoStr);
    const eveningThisWeek = (user.dailyEveningPractice || [])
        .filter(p => p.date >= weekAgoStr);

    const gratitudes = morningThisWeek.flatMap(p => p.gratitudes || []).filter(Boolean).slice(0, 6);
    const intentions = morningThisWeek.map(p => p.dailyIntention).filter(Boolean).slice(0, 5);
    const accomplishments = eveningThisWeek.map(p => p.accomplishment).filter(Boolean).slice(0, 5);
    const delights = eveningThisWeek.map(p => p.delight).filter(Boolean).slice(0, 4);
    const learnings = eveningThisWeek.map(p => p.learning).filter(Boolean).slice(0, 4);

    const activeGoals = (user.goals || []).filter(g => !g.completedAt).slice(0, 3);
    const completedThisWeek = (user.goals || []).filter(g =>
        g.completedAt && g.completedAt >= weekAgoStr
    ).slice(0, 3);

    const streak = user.streak ?? 0;
    const totalPractices = user.practiceData?.totalPractices ?? 0;
    const practicesThisWeek = morningThisWeek.length;

    const vp = user.userVoiceProfile;
    const bp = user.behaviorPattern;
    const narrative = user.userNarrative;
    const monthlyInsight = user.monthlyPattern?.insight;

    const skipDayNames = bp?.patterns.skipPatterns.daysOfWeek?.map(d => DAY_NAMES[d]) ?? [];
    const lowEnergyDayNames = bp?.patterns.moodPatterns.lowEnergyDays?.map(d => DAY_NAMES[d]) ?? [];

    const contextBlock = [
        `First name: ${firstName}`,
        user.profession ? `Profession: ${user.profession}` : '',
        `This week's practices: ${practicesThisWeek} of 7 days`,
        `Current streak: ${streak} days`,
        `Total practices all-time: ${totalPractices}`,
        user.focusAreas?.length ? `Working on: ${user.focusAreas.join(', ')}` : '',
        gratitudes.length ? `What they were grateful for this week: ${gratitudes.join('; ')}` : '',
        intentions.length ? `Intentions they set: ${intentions.join('; ')}` : '',
        accomplishments.length ? `Things they accomplished: ${accomplishments.join('; ')}` : '',
        delights.length ? `Small delights they noticed: ${delights.join('; ')}` : '',
        learnings.length ? `What they learned: ${learnings.join('; ')}` : '',
        activeGoals.length ? `Active goals: ${activeGoals.map(g => g.title).join('; ')}` : '',
        completedThisWeek.length ? `Goals completed this week: ${completedThisWeek.map(g => g.title).join('; ')}` : '',
        vp?.extractedValues?.length ? `Their core values: ${vp.extractedValues.join(', ')}` : '',
        vp?.coreThemes?.length ? `Recurring themes in their life: ${vp.coreThemes.join(', ')}` : '',
        vp?.voiceTone ? `How they like to be spoken to: ${vp.voiceTone}` : '',
        skipDayNames.length ? `Days they tend to rest: ${skipDayNames.join(', ')}` : '',
        lowEnergyDayNames.length ? `Days their energy typically dips: ${lowEnergyDayNames.join(', ')}` : '',
        narrative?.text ? `What I know about their story so far: ${narrative.text}` : '',
        monthlyInsight ? `Pattern I noticed this month: ${monthlyInsight}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are ${partnerName}, ${firstName}'s personal AI growth partner inside the Palante app. Write a personal Sunday letter to ${firstName}.

This is not a recap or a summary. It is a letter from a partner who has been genuinely paying attention — someone who noticed things, held space, and is reflecting back what they saw. Make it feel like it was written specifically for this one person, not a template.

LETTER STRUCTURE:
- Open with one specific, warm observation from this week — something they actually said or did (from their gratitudes, intentions, accomplishments, or delights). Make this the emotional anchor.
- Reflect on a pattern or theme you noticed across the week. What does this week's data say about where they are right now?
- Name one thing about them that you want them to carry into next week — a quality you observed, not generic encouragement.
- Close with one sentence that feels like a hand on the shoulder. No pep talk. Just presence.

ABSOLUTE RULES:
- Write in first person as their partner (use "I noticed", "I've been thinking about", "what I see in you").
- Address them directly as ${firstName} once, at or near the start. Then use "you" throughout.
- 4–6 sentences total. No more. Each sentence earns its place.
- No headers, no bullets, no lists. One flowing letter.
- No em dashes (the — character). Use periods and commas only.
- Never use these words: journey, intentional, mindful, anchor, tapestry, weave, tether, sovereignty, transformative, profound.
- Do NOT invent details not in the data. If the data is sparse, write warmly but stay general about what's real.
- End with a signature line on its own line: "— ${partnerName}"

USER DATA THIS WEEK:
${contextBlock}

Write the letter now:`;

    const fallback = buildFallbackLetter(firstName, partnerName, practicesThisWeek, streak, gratitudes[0]);

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 400,
                temperature: 0.9,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) return fallback;

        const json = await response.json();
        let text = json.content?.[0]?.text?.trim();
        if (!text) return fallback;

        text = text.replace(/^["'']|["'']$/g, '').trim();
        return text;
    } catch {
        return fallback;
    }
};

const buildFallbackLetter = (
    firstName: string,
    partnerName: string,
    practicesThisWeek: number,
    streak: number,
    firstGratitude?: string
): string => {
    const practiceStr = practicesThisWeek === 7
        ? 'every single day this week'
        : practicesThisWeek > 0
            ? `${practicesThisWeek} time${practicesThisWeek > 1 ? 's' : ''} this week`
            : 'this week';
    const streakStr = streak > 1 ? ` That's ${streak} days in a row.` : '';
    const gratitudeStr = firstGratitude
        ? ` When you wrote about ${firstGratitude.toLowerCase()}, I held onto that.`
        : '';

    return `${firstName}, I've been thinking about you.${gratitudeStr} You showed up ${practiceStr}, and that is not a small thing.${streakStr} What I see in you is someone who keeps choosing to come back, even when it isn't easy. Carry that into next week.

— ${partnerName}`;
};
