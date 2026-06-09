import { QUOTES } from '../data/quotes';
import { AFFIRMATIONS } from '../data/affirmations';
import type { UserProfile, Quote } from '../types';
import { generateAffirmation, isAIAvailable, getMomentumState } from './aiService';
import { STORAGE_KEYS } from '../constants/storageKeys';

// Themes that resonate most with each momentum state
const MOMENTUM_THEMES: Record<string, string[]> = {
    recovering:  ['resilience', 'grace', 'healing', 'return', 'patience', 'forgiveness', 'self-compassion', 'rest', 'beginning', 'renewal', 'gentleness', 'peace'],
    on_a_roll:   ['momentum', 'consistency', 'discipline', 'progress', 'growth', 'habit', 'commitment', 'focus', 'work', 'drive', 'dedication'],
    breakthrough:['legacy', 'purpose', 'mastery', 'impact', 'excellence', 'vision', 'leadership', 'greatness', 'elevation', 'transformation'],
    steady:      ['wisdom', 'presence', 'mindfulness', 'gratitude', 'balance', 'reflection', 'clarity', 'simplicity', 'contentment'],
};

// Mood → themes that soothe or energize
const MOOD_THEMES: Record<string, string[]> = {
    Anxious:   ['peace', 'calm', 'breath', 'present', 'trust', 'release', 'grounding', 'safety'],
    Stressed:  ['peace', 'calm', 'release', 'simplicity', 'ease', 'rest', 'flow'],
    Tired:     ['rest', 'gentleness', 'renewal', 'grace', 'patience', 'recovery'],
    Happy:     ['momentum', 'growth', 'gratitude', 'joy', 'abundance', 'expansion'],
    Energetic: ['momentum', 'action', 'drive', 'focus', 'discipline', 'growth', 'ambition'],
    Calm:      ['wisdom', 'presence', 'mindfulness', 'gratitude', 'depth', 'stillness'],
};

// Words that signal a quote is about rivalry/revenge — penalize unless user profile warrants it
const ADVERSARIAL_WORDS = ['revenge', 'enemy', 'beat them', 'prove them wrong', 'haters', 'doubters', 'show them'];

// key: quoteId, value: timestamp (ms)
interface SeenQuoteHistory {
    [id: string]: number;
}

// Ordered list of recent quote IDs (most recent last), capped at RECENT_CAP
const RECENT_CAP = 30;
const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

// ── Seen history (6-month cooldown) ──────────────────────────────────────────

const loadSeenHistory = (): SeenQuoteHistory => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SEEN_QUOTES);
        if (!saved) return {};
        const parsed = JSON.parse(saved);
        // Migration: old array format → timestamped object
        if (Array.isArray(parsed)) {
            const history: SeenQuoteHistory = {};
            const now = Date.now();
            parsed.forEach((id: string) => { history[id] = now; });
            return history;
        }
        return parsed as SeenQuoteHistory;
    } catch {
        return {};
    }
};

let seenHistory: SeenQuoteHistory = loadSeenHistory();

const saveSeenHistory = () => {
    localStorage.setItem(STORAGE_KEYS.SEEN_QUOTES, JSON.stringify(seenHistory));
};

// ── Recent quotes (short-term dedup, last RECENT_CAP shown) ──────────────────

const loadRecentQuotes = (): string[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.RECENT_QUOTES);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

let recentQuoteIds: string[] = loadRecentQuotes();

const saveRecentQuotes = () => {
    localStorage.setItem(STORAGE_KEYS.RECENT_QUOTES, JSON.stringify(recentQuoteIds));
};

const pushRecentQuote = (id: string) => {
    recentQuoteIds = recentQuoteIds.filter(q => q !== id);
    recentQuoteIds.push(id);
    if (recentQuoteIds.length > RECENT_CAP) recentQuoteIds.shift();
    saveRecentQuotes();
};

// ── Author cooldown (14 days — prevents same author from repeating too soon) ──

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

interface AuthorHistory {
    [author: string]: number;
}

const loadAuthorHistory = (): AuthorHistory => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SEEN_AUTHORS);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

let authorHistory: AuthorHistory = loadAuthorHistory();

const saveAuthorHistory = () => {
    localStorage.setItem(STORAGE_KEYS.SEEN_AUTHORS, JSON.stringify(authorHistory));
};

const markAuthorSeen = (author: string) => {
    // Skip Palante-branded attributions. Includes legacy "Palante Coach" / "AI Coach" / "Coach Sarah" data
    // saved on existing devices before the rename — we don't want to log those as if they were real authors.
    if (!author || author === 'Palante' || author === 'Palante Coach' || author === 'AI Coach' || author.startsWith('Coach')) return;
    authorHistory[author] = Date.now();
    saveAuthorHistory();
};

// ── Keyword extraction helpers ────────────────────────────────────────────────

const STOP_WORDS = new Set([
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'the', 'a', 'an',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'that', 'this', 'these', 'those', 'so', 'as', 'if', 'not', 'no', 'just',
    'very', 'more', 'can', 'am', 'up', 'out', 'into', 'than', 'then', 'when',
]);

const extractKeywords = (text: string): string[] => {
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOP_WORDS.has(w));
};

// ── Main scoring function ─────────────────────────────────────────────────────

export const getRelevantQuotes = (user: UserProfile): Quote[] => {
    const allContent = [...QUOTES, ...AFFIRMATIONS];
    const now = Date.now();

    // Parse intensity
    let intensity = 2;
    if (user.quoteIntensity !== undefined && user.quoteIntensity !== null) {
        const parsed = Number(user.quoteIntensity);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) intensity = parsed;
    }

    const isLowState = (user.currentEnergy !== undefined && user.currentEnergy <= 2)
        || user.currentMood === 'Stressed'
        || user.currentMood === 'Anxious';
    const effectiveIntensity = isLowState ? Math.max(1, intensity - 1) as 1 | 2 | 3 : intensity as 1 | 2 | 3;

    // Today's morning intention
    const todayDate = new Date().toISOString().split('T')[0];
    const todaysPriming = (user.dailyMorningPractice || user.dailyPriming || [])
        .find(p => p.date === todayDate);
    const dailyIntention = todaysPriming?.dailyIntention?.toLowerCase().trim() || '';

    // Recent gratitude + affirmation text (last 7 days) for theme matching
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentPriming = (user.dailyMorningPractice || user.dailyPriming || [])
        .filter(p => p.date >= sevenDaysAgo);
    const recentPracticeText = recentPriming.flatMap(p => [
        ...(p.gratitudes || []),
        ...(p.affirmations || []),
        p.dailyIntention || '',
    ]).join(' ').toLowerCase();
    const recentPracticeKeywords = extractKeywords(recentPracticeText);

    // User narrative text keywords
    const narrativeKeywords = extractKeywords(user.userNarrative?.text || '');

    // 1. Filter by intensity & 6-month cooldown
    const availableQuotes = allContent.filter((q) => {
        if (q.intensity !== effectiveIntensity && q.intensity !== intensity) return false;
        if (seenHistory[q.id] && (now - seenHistory[q.id]) < SIX_MONTHS_MS) return false;
        return true;
    });

    // 2. Apply source & content type preferences
    const filteredQuotes = availableQuotes.filter((q) => {
        let sourceMatch = true;
        if (user.sourcePreference === 'human') sourceMatch = !q.isAI;
        else if (user.sourcePreference === 'ai') sourceMatch = !!q.isAI;

        let contentTypeMatch = true;
        if (user.contentTypePreference === 'quotes') contentTypeMatch = !q.isAffirmation;
        else if (user.contentTypePreference === 'affirmations') contentTypeMatch = !!q.isAffirmation;

        return sourceMatch && contentTypeMatch;
    });

    // 3. Exclude recently shown quotes (short-term dedup)
    //    Progressively relax the recency window if the pool gets too small
    const recentSet30 = new Set(recentQuoteIds.slice(-30));
    const recentSet10 = new Set(recentQuoteIds.slice(-10));
    const recentSet3  = new Set(recentQuoteIds.slice(-3));

    const withoutRecent30 = filteredQuotes.filter(q => !recentSet30.has(q.id));
    const withoutRecent10 = filteredQuotes.filter(q => !recentSet10.has(q.id));
    const withoutRecent3  = filteredQuotes.filter(q => !recentSet3.has(q.id));

    const deduped =
        withoutRecent30.length >= 5 ? withoutRecent30 :
        withoutRecent10.length >= 3 ? withoutRecent10 :
        withoutRecent3.length  >= 1 ? withoutRecent3  :
        filteredQuotes;

    // 4. Score
    const scoredQuotes = deduped.map((quote) => {
        let score = 0;
        const quoteSearchText = `${quote.text} ${quote.category} ${quote.tags?.join(' ') || ''}`.toLowerCase();

        // PRIORITY 0: Today's morning intention — strongest signal
        if (dailyIntention && dailyIntention.length > 2) {
            if (quoteSearchText.includes(dailyIntention)) score += 400;
            const intentionRoot = dailyIntention.slice(0, Math.max(4, dailyIntention.length - 2));
            if (intentionRoot.length > 3 && quoteSearchText.includes(intentionRoot)) score += 200;
        }

        // PRIORITY 1: Profession match
        if (user.profession && quote.profession) {
            const userProf = user.profession.toLowerCase();
            const quoteProf = quote.profession.toLowerCase();
            if (userProf === quoteProf) {
                score += 150;
            } else {
                const mappings: Record<string, string[]> = {
                    'creative': ['filmmaker', 'musician', 'photographer', 'artist', 'designer', 'writer', 'producer', 'director'],
                    'tech': ['developer', 'engineer', 'scientist', 'data scientist'],
                    'business': ['entrepreneur', 'executive', 'sales', 'marketing', 'consultant', 'finance', 'real estate', 'investor'],
                    'wellness': ['coach', 'healthcare', 'doctor', 'teacher', 'therapist'],
                    'athlete': ['athlete', 'player', 'coach'],
                    'filmmaker': ['creative', 'artist', 'director'],
                    'musician': ['creative', 'artist'],
                    'developer': ['tech', 'engineer'],
                    'engineer': ['tech', 'developer', 'scientist'],
                    'entrepreneur': ['business', 'executive'],
                    'marketing': ['business', 'sales'],
                    'sales': ['business', 'marketing'],
                    'finance': ['business'],
                    'real estate': ['business', 'sales'],
                };
                if (mappings[quoteProf]?.includes(userProf) || mappings[userProf]?.includes(quoteProf)) {
                    score += 150;
                }
            }
        }

        // PRIORITY 1.5: Daily focus match
        if (user.dailyFocuses && user.dailyFocuses.length > 0) {
            const activeFocusText = user.dailyFocuses
                .filter(f => !f.isCompleted)
                .map(f => f.text.toLowerCase())
                .join(' ');
            if (activeFocusText) {
                const keywords = activeFocusText.split(' ').filter(w => w.length > 3);
                keywords.forEach(keyword => {
                    if (quoteSearchText.includes(keyword)) score += 500;
                });
            }
        }

        // PRIORITY 2: User narrative match — what the user wrote about themselves
        if (narrativeKeywords.length > 0) {
            let narrativeHits = 0;
            narrativeKeywords.forEach(kw => {
                if (quoteSearchText.includes(kw)) narrativeHits++;
            });
            // Scale: more hits = higher score, capped to prevent dominance
            score += Math.min(narrativeHits * 40, 300);
        }

        // PRIORITY 3: Recent practice themes (gratitudes, affirmations, intentions this week)
        if (recentPracticeKeywords.length > 0) {
            let practiceHits = 0;
            recentPracticeKeywords.forEach(kw => {
                if (quoteSearchText.includes(kw)) practiceHits++;
            });
            score += Math.min(practiceHits * 25, 200);
        }

        // PRIORITY 4: Career field match
        if (user.career && quote.category) {
            if (quote.category.toLowerCase().includes(user.career.toLowerCase())) score += 50;
        }

        // PRIORITY 5: Interest match
        if (user.interests && user.interests.length > 0) {
            user.interests.forEach((interest) => {
                if (quote.category.toLowerCase().includes(interest.toLowerCase())) score += 20;
            });
        }

        // PRIORITY 6: Momentum state
        const momentum = getMomentumState(user);
        const momentumKeywords = MOMENTUM_THEMES[momentum] || [];
        momentumKeywords.forEach(keyword => {
            if (quoteSearchText.includes(keyword)) score += 60;
        });

        // PRIORITY 7: Current mood
        if (user.currentMood && MOOD_THEMES[user.currentMood]) {
            MOOD_THEMES[user.currentMood].forEach(keyword => {
                if (quoteSearchText.includes(keyword)) score += 40;
            });
        }

        // PRIORITY 8: Focus areas
        if (user.focusAreas?.length) {
            user.focusAreas.forEach(area => {
                if (quoteSearchText.includes(area)) score += 30;
            });
        }

        // Prefer softer quotes in low states
        if (isLowState && quote.intensity < intensity) score += 60;

        // Penalize adversarial/revenge-themed quotes unless the user's profile is explicitly competitive
        const isCompetitive = (user.focusAreas || []).some(a =>
            ['competition', 'sports', 'athlete', 'winning'].includes(a.toLowerCase())
        ) || user.profession?.toLowerCase() === 'athlete';
        if (!isCompetitive) {
            ADVERSARIAL_WORDS.forEach(word => {
                if (quoteSearchText.includes(word)) score -= 200;
            });
        }

        // Author cooldown: penalize quotes from authors shown in the last 14 days
        if (quote.author && authorHistory[quote.author] && (now - authorHistory[quote.author]) < FOURTEEN_DAYS_MS) {
            score -= 350;
        }

        // Small random factor — variety without overriding real matches
        score += Math.random() * 15;

        return { quote, score };
    });

    // 5. Sort by score descending
    scoredQuotes.sort((a, b) => b.score - a.score);
    const quotes = scoredQuotes.map(item => item.quote);

    // 6. Handle empty results — relax cooldown if needed
    if (quotes.length === 0 && Object.keys(seenHistory).length > 0) {
        console.warn('All quotes in cooldown. Recycling seen history.');
        const recycledQuotes = allContent.filter(q => {
            if (q.intensity !== intensity) return false;
            let sourceMatch = true;
            if (user.sourcePreference === 'human') sourceMatch = !q.isAI;
            else if (user.sourcePreference === 'ai') sourceMatch = !!q.isAI;
            let contentTypeMatch = true;
            if (user.contentTypePreference === 'quotes') contentTypeMatch = !q.isAffirmation;
            else if (user.contentTypePreference === 'affirmations') contentTypeMatch = !!q.isAffirmation;
            return sourceMatch && contentTypeMatch;
        }).sort(() => Math.random() - 0.5);

        seenHistory = {};
        if (recycledQuotes.length > 0) seenHistory[recycledQuotes[0].id] = Date.now();
        saveSeenHistory();
        return recycledQuotes.length > 0 ? recycledQuotes : allContent.sort(() => Math.random() - 0.5);
    }

    if (quotes.length === 0) return allContent.sort(() => Math.random() - 0.5);

    return quotes;
};

/**
 * Record a quote as seen ONLY when it has actually been delivered to the user.
 */
export const markQuoteSeen = (quoteId: string) => {
    if (!quoteId || quoteId.startsWith('emergency_fallback')) return;
    seenHistory[quoteId] = Date.now();
    saveSeenHistory();
};

/**
 * Pick the best available quote for a user, mark it seen, and return it.
 * Selects from the top 5 scored candidates (not randomly from all) to ensure
 * relevance while still providing variety.
 */
export const pickAndMarkQuote = (user: UserProfile, excludeId?: string): Quote | null => {
    const candidates = getRelevantQuotes(user);
    const filtered = excludeId ? candidates.filter(q => q.id !== excludeId) : candidates;
    const pool = filtered.length > 0 ? filtered : candidates;
    if (pool.length === 0) return null;

    // Pick from the top 5 (or fewer if the pool is smaller) — scores are already sorted descending
    const topN = Math.min(5, pool.length);
    const selected = pool[Math.floor(Math.random() * topN)];

    markQuoteSeen(selected.id);
    markAuthorSeen(selected.author);
    pushRecentQuote(selected.id);
    return selected;
};

/**
 * Generate a fresh AI-powered quote personalized for the user
 */
export const getAIQuote = async (user: UserProfile): Promise<Quote> => {
    const timeOfDay = getTimeOfDay();

    if (!isAIAvailable()) {
        const aiQuotes = QUOTES.filter(q => q.isAI && q.intensity === user.quoteIntensity);
        if (aiQuotes.length > 0) return aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
    }

    try {
        const todayDateAI = new Date().toISOString().split('T')[0];
        const todaysPrimingAI = (user.dailyMorningPractice || user.dailyPriming || [])
            .find(p => p.date === todayDateAI);

        const response = await generateAffirmation({
            profession: user.profession,
            focusGoal: user.career,
            interests: user.interests,
            quoteIntensity: user.quoteIntensity,
            streak: user.streak,
            timeOfDay,
            userName: user.name,
            coachName: user.coachName,
            focusAreas: user.focusAreas,
            dailyIntention: todaysPrimingAI?.dailyIntention,
            currentMood: user.currentMood,
            currentEnergy: user.currentEnergy,
        });

        return {
            id: `ai_${Date.now()}`,
            text: response.text,
            author: response.author,
            category: response.category,
            intensity: user.quoteIntensity,
            isAI: true,
        };
    } catch (error) {
        console.error('Error generating AI quote:', error);
        const aiQuotes = QUOTES.filter(q => q.isAI && q.intensity === user.quoteIntensity);
        if (aiQuotes.length > 0) return aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
        return {
            id: `ai_fallback_${Date.now()}`,
            text: "Your potential is limitless. Keep moving forward.",
            author: user.coachName?.trim() || "Palante",
            category: "Motivation",
            intensity: user.quoteIntensity,
            isAI: true,
        };
    }
};

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

export const resetSeenQuotes = () => {
    seenHistory = {};
    recentQuoteIds = [];
    saveSeenHistory();
    saveRecentQuotes();
};
