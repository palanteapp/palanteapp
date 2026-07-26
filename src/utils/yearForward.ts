/**
 * Your Year, Forward, the annual growth memoir.
 *
 * Composes a full calendar year of practice data into a story dataset and a
 * letter to the user's forward self, written in their own words. Distinct from
 * the 90-day Growth Story (one-time, ring ceremony) and the weekly partner
 * letter: this is the yearly, Wrapped-for-the-inner-life moment.
 *
 * buildYearForwardData() is pure and deterministic so it can be unit-tested;
 * generateYearForwardLetter() layers the AI call on top with a graceful,
 * fully-formed deterministic fallback.
 */
import type { UserProfile, CoachTone } from '../types';
import { fetchWithTimeout } from './fetchWithTimeout';
import { assertAIEnabled } from './aiGate';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`;
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

// Choke point for the AI opt-out, see aiGate.ts.
const getProxyHeaders = (): HeadersInit => {
    assertAIEnabled();
    return {
        'content-type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    };
};

export interface YearForwardData {
    firstName: string;
    coachTone: CoachTone;
    year: number;
    windowLabel: string;      // "2026" once the year is complete, "2026, so far" mid-year
    isCompleteYear: boolean;

    // The numbers
    totalPractices: number;
    morningsCount: number;
    eveningsCount: number;
    gratitudesWritten: number;
    wordsWritten: number;
    daysPracticed: number;
    longestStreak: number;

    // The themes (recurring words they returned to)
    topThemes: string[];
    topIntentions: string[];

    // Their words, resurfaced
    firstIntention?: string;
    lastIntention?: string;
    standoutGratitude?: string;
    standoutDelight?: string;
    standoutAccomplishment?: string;
    standoutLearning?: string;

    // Source material for the letter
    futureLetter?: string;
}

export interface YearForwardResult {
    letter: string;
    data: YearForwardData;
}

// Words too common to count as a theme: kept tight and intentional.
const STOPWORDS = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'have', 'has', 'had', 'was', 'were',
    'are', 'being', 'been', 'from', 'they', 'them', 'their', 'there', 'here', 'what',
    'when', 'where', 'which', 'while', 'about', 'into', 'over', 'than', 'then', 'just',
    'more', 'most', 'some', 'such', 'only', 'very', 'really', 'today', 'todays', 'day',
    'able', 'will', 'would', 'could', 'should', 'because', 'still', 'also', 'around',
    'feel', 'feeling', 'felt', 'thing', 'things', 'something', 'someone', 'myself',
    'morning', 'evening', 'time', 'good', 'great', 'nice', 'know', 'going', 'getting',
    'get', 'got', 'make', 'made', 'want', 'like', 'much', 'little', 'always', 'never',
    'every', 'each', 'much', 'many', 'your', 'you', 'our', 'out', 'now', 'one', 'two',
]);

const isWithinYear = (isoDate: string | undefined, year: number): boolean =>
    !!isoDate && isoDate.slice(0, 4) === String(year);

const countWords = (s: string | undefined): number =>
    s ? s.trim().split(/\s+/).filter(Boolean).length : 0;

/**
 * Longest run of consecutive calendar days that contain at least one practice,
 * restricted to the target year. Pure over the supplied date set.
 */
const computeLongestStreak = (practiceDates: string[]): number => {
    const unique = [...new Set(practiceDates)].sort();
    if (unique.length === 0) return 0;

    let longest = 1;
    let run = 1;
    for (let i = 1; i < unique.length; i++) {
        const prev = new Date(unique[i - 1] + 'T00:00:00');
        const curr = new Date(unique[i] + 'T00:00:00');
        const dayGap = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (dayGap === 1) {
            run += 1;
            longest = Math.max(longest, run);
        } else if (dayGap > 1) {
            run = 1;
        }
        // dayGap === 0 (duplicate) is impossible after dedupe, but harmless
    }
    return longest;
};

/**
 * Rank the words a person returned to across their gratitudes and intentions.
 * Voice-profile values, when present, are seeded first so an established theme
 * isn't lost to raw frequency.
 */
const extractThemes = (corpus: string[], seedValues: string[], limit: number): string[] => {
    const counts = new Map<string, number>();

    for (const value of seedValues) {
        const w = value.trim().toLowerCase();
        if (w.length >= 4 && !STOPWORDS.has(w)) counts.set(w, (counts.get(w) ?? 0) + 3);
    }

    for (const entry of corpus) {
        for (const raw of entry.toLowerCase().split(/[^a-z']+/)) {
            const w = raw.replace(/'s$/, '').trim();
            if (w.length >= 4 && !STOPWORDS.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
        }
    }

    return [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([w]) => w);
};

const longest = (entries: (string | undefined)[]): string | undefined =>
    entries
        .map(e => e?.trim())
        .filter((e): e is string => !!e)
        .sort((a, b) => b.length - a.length)[0];

/**
 * Aggregate one calendar year of practice into a story dataset. Pure and
 * deterministic: no clock reads beyond the optional `now` parameter.
 */
export const buildYearForwardData = (user: UserProfile, now: Date = new Date()): YearForwardData => {
    const year = now.getFullYear();
    const isCompleteYear = now.getMonth() === 11 && now.getDate() === 31;
    const firstName = (user.name || '').trim().split(/\s+/)[0] || 'Friend';
    const coachTone: CoachTone = user.coachSettings?.coachTone ?? 'nurturing';

    const mornings = (user.dailyMorningPractice || user.dailyPriming || [])
        .filter(p => isWithinYear(p.date, year))
        .sort((a, b) => a.date.localeCompare(b.date));
    const evenings = (user.dailyEveningPractice || [])
        .filter(p => isWithinYear(p.date, year))
        .sort((a, b) => a.date.localeCompare(b.date));

    const allGratitudes = mornings.flatMap(p => (p.gratitudes || []).map(g => g.trim()).filter(Boolean));
    const allIntentions = mornings.map(p => p.dailyIntention?.trim()).filter((i): i is string => !!i);

    const gratitudesWritten = allGratitudes.length;
    const wordsWritten =
        allGratitudes.reduce((n, g) => n + countWords(g), 0) +
        mornings.flatMap(p => p.affirmations || []).reduce((n, a) => n + countWords(a), 0) +
        evenings.reduce((n, e) =>
            n + countWords(e.gratitude) + countWords(e.learning) +
            countWords(e.accomplishment) + countWords(e.delight) +
            countWords(e.commitmentReflection), 0);

    // Days practiced = union of any morning/evening date, plus any practiceData
    // activity within the year (covers meditation/breathwork-only days).
    const practiceDayDates = new Set<string>([
        ...mornings.map(p => p.date),
        ...evenings.map(p => p.date),
        ...((user.practiceData?.activityHistory || [])
            .filter(a => isWithinYear(a.date, year))
            .map(a => a.date)),
    ]);

    const topThemes = extractThemes(allGratitudes, user.userVoiceProfile?.extractedValues || [], 5);
    const topIntentions = extractThemes(allIntentions, user.userVoiceProfile?.coreThemes || [], 4);

    // Most recent future letter written during the year, for the "you wrote
    // yourself a letter" beat.
    const futureLetter = (user.futureLetters || [])
        .filter(l => isWithinYear(l.writtenDate, year))
        .sort((a, b) => b.writtenDate.localeCompare(a.writtenDate))[0]?.content;

    return {
        firstName,
        coachTone,
        year,
        windowLabel: isCompleteYear ? String(year) : `${year}, so far`,
        isCompleteYear,

        totalPractices: mornings.length + evenings.length,
        morningsCount: mornings.length,
        eveningsCount: evenings.length,
        gratitudesWritten,
        wordsWritten,
        daysPracticed: practiceDayDates.size,
        longestStreak: computeLongestStreak([...practiceDayDates]),

        topThemes,
        topIntentions,

        firstIntention: allIntentions[0],
        lastIntention: allIntentions.length > 1 ? allIntentions[allIntentions.length - 1] : undefined,
        standoutGratitude: longest(allGratitudes),
        standoutDelight: longest(evenings.map(e => e.delight)),
        standoutAccomplishment: longest(evenings.map(e => e.accomplishment)),
        standoutLearning: longest(evenings.map(e => e.learning)),

        futureLetter,
    };
};

/**
 * Whether there is enough lived data for the memoir to feel earned. Below this,
 * the entry point stays hidden rather than presenting a thin story.
 */
export const hasEnoughForYearForward = (data: YearForwardData): boolean =>
    data.totalPractices >= 20;

/**
 * Deterministic letter: always returns a complete, warm letter from the data
 * alone. Used as the offline/error fallback and as the seed the AI elevates.
 */
export const buildYearForwardFallback = (data: YearForwardData): string => {
    const {
        firstName, windowLabel, morningsCount, eveningsCount, gratitudesWritten,
        daysPracticed, longestStreak, firstIntention, lastIntention,
        standoutGratitude, standoutDelight, standoutAccomplishment, topThemes, futureLetter,
    } = data;

    const lines: string[] = [];

    lines.push(`${firstName}, here is ${windowLabel}, told back to you.`);

    if (firstIntention) {
        lines.push(`You opened the year setting "${firstIntention}" as your intention, and you kept coming back to set the next one, and the next.`);
    } else {
        lines.push(`You showed up on ${daysPracticed} days this year, and each one was a quiet choice that nobody else saw.`);
    }

    if (gratitudesWritten > 0) {
        lines.push(`Across ${morningsCount} mornings you named ${gratitudesWritten} things you were grateful for. That is ${gratitudesWritten} times you chose to look for what was good.`);
    }

    if (standoutGratitude) {
        lines.push(`You wrote down "${standoutGratitude}," and you let it count.`);
    }

    if (standoutAccomplishment) {
        lines.push(`You moved real things this year. "${standoutAccomplishment}" was one of them.`);
    }

    if (standoutDelight) {
        lines.push(`And there was delight too, like "${standoutDelight}." You noticed it. You let it land.`);
    }

    if (longestStreak >= 3) {
        lines.push(`Your longest unbroken run was ${longestStreak} days. Proof that consistency is something you are capable of, not something you wish for.`);
    }

    if (eveningsCount > 0) {
        lines.push(`You closed ${eveningsCount} days with honesty instead of letting them blur past.`);
    }

    if (topThemes.length >= 2) {
        lines.push(`If this year had words, they were ${topThemes.slice(0, 3).join(', ')}. You returned to them again and again.`);
    }

    if (futureLetter) {
        lines.push(`Somewhere in here you wrote a letter to yourself for a hard day. That version of you was right to believe in this one.`);
    }

    if (lastIntention && lastIntention !== firstIntention) {
        lines.push(`You are setting intentions like "${lastIntention}" now. That is not who started the year. That is who you became. Whatever next year asks of you, you already have the evidence that you come back. Pa'lante.`);
    } else {
        lines.push(`Whatever next year asks of you, you walk into it with a year of proof that you keep going. Carry that forward. Pa'lante.`);
    }

    return lines.join(' ');
};

const TONE_GUIDANCE: Record<CoachTone, string> = {
    nurturing: 'Warm, intimate, and literary. Like someone who has quietly watched the whole year and deeply cares.',
    direct: 'Clear-eyed and honest. Name what changed without embellishment. Every word earns its place.',
    accountability: 'High-standard and proud. Name what they built with the full weight of what it took to build it.',
};

/**
 * Generate the year-in-review letter. AI when reachable, deterministic
 * fallback otherwise. Never throws; always returns a complete letter.
 */
export const generateYearForwardLetter = async (data: YearForwardData): Promise<string> => {
    const fallback = buildYearForwardFallback(data);

    const prompt = `You are writing a year-in-review letter for someone who practiced with a growth app called Palante across ${data.windowLabel}. They will read this as the centerpiece of their "Your Year, Forward": a quiet, literary year-in-review. It should feel like a letter written by someone who watched their whole year and is now handing it back to them, then pointing gently toward the year ahead.

THEIR YEAR, IN DATA:
Name: ${data.firstName}
Window: ${data.windowLabel}
Mornings practiced: ${data.morningsCount}
Evenings reflected: ${data.eveningsCount}
Days showed up: ${data.daysPracticed}
Longest unbroken run: ${data.longestStreak} days
Gratitudes written: ${data.gratitudesWritten}
Words written in total: ${data.wordsWritten}
${data.firstIntention ? `First intention of the year: "${data.firstIntention}"` : ''}
${data.lastIntention ? `A recent intention: "${data.lastIntention}"` : ''}
${data.topThemes.length ? `Recurring themes in their gratitudes: ${data.topThemes.join(', ')}` : ''}
${data.standoutGratitude ? `Something they were grateful for: "${data.standoutGratitude}"` : ''}
${data.standoutAccomplishment ? `Something they accomplished: "${data.standoutAccomplishment}"` : ''}
${data.standoutDelight ? `Something that delighted them: "${data.standoutDelight}"` : ''}
${data.standoutLearning ? `Something they learned: "${data.standoutLearning}"` : ''}
${data.futureLetter ? `They wrote themselves a letter for a hard day earlier in the year.` : ''}

WRITING DIRECTIVE:
${TONE_GUIDANCE[data.coachTone]}

Write the letter. Rules:
1. Open with their name and the year, anchored in a real detail from the data.
2. Tell the arc of the year using their actual words: quote at least two of the phrases above verbatim, in quotation marks.
3. Name one or two of their recurring themes if present, as the through-line of who they were this year.
4. If they wrote a letter to themselves, reference it as a quiet callback.
5. End by turning toward the year ahead, forward-looking but never pressuring. It should feel like permission and proof, not a to-do list. You may end on "Pa'lante."
6. Speak directly to them ("you", "your"). Never third person.
7. No em dashes. No bullet points. No headers. Flowing prose, 2 to 3 short paragraphs.
8. Never use these words: journey, intentional, mindful, tapestry, weave, manifested, transformational, incredible, unleash.
9. HARD LIMIT: under 220 words.

Write the letter now, with no preamble, no quotation marks around the whole thing:`;

    try {
        const response = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 600,
                temperature: 0.9,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) return fallback;

        const json = await response.json();
        let letter: string = json.content?.[0]?.text?.trim() || '';
        if (!letter) return fallback;

        letter = letter.replace(/^["'']|["'']$/g, '').trim();
        return letter;
    } catch {
        return fallback;
    }
};
