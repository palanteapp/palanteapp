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

// Track seen quotes with timestamps to ensure 6-month rotation
// key: quoteId, value: timestamp (ms)
interface SeenQuoteHistory {
    [id: string]: number;
}

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

// Load history (migrating from old Set format if needed)
const loadSeenHistory = (): SeenQuoteHistory => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SEEN_QUOTES);
        if (!saved) return {};

        const parsed = JSON.parse(saved);

        // Migration: If it's an array (old Set format), convert to history with old timestamp
        if (Array.isArray(parsed)) {
            const history: SeenQuoteHistory = {};
            const now = Date.now();
            parsed.forEach((id: string) => {
                // Spread them out slightly backwards so they don't all expire at once?
                // Or just set them to "now" to be safe? 
                // Let's set them to 3 months ago to be safe, or just let them expire naturally.
                // Better: Set them as "seen now" to avoid immediate re-show.
                history[id] = now;
            });
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

export const getRelevantQuotes = (user: UserProfile): Quote[] => {
    // Combine Quotes and Affirmations
    const allContent = [...QUOTES, ...AFFIRMATIONS];
    const now = Date.now();

    // 1. SAFELY Parse Intensity (Handle string/number mismatch)
    let intensity = 2;
    if (user.quoteIntensity !== undefined && user.quoteIntensity !== null) {
        const parsed = Number(user.quoteIntensity);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) {
            intensity = parsed;
        }
    }

    // Soften intensity when user is low-energy or stressed/anxious
    const isLowState = (user.currentEnergy !== undefined && user.currentEnergy <= 2)
        || user.currentMood === 'Stressed'
        || user.currentMood === 'Anxious';
    const effectiveIntensity = isLowState ? Math.max(1, intensity - 1) as 1 | 2 | 3 : intensity as 1 | 2 | 3;

    // Pull today's morning intention for quote matching
    const todayDate = new Date().toISOString().split('T')[0];
    const todaysPriming = (user.dailyMorningPractice || user.dailyPriming || [])
        .find(p => p.date === todayDate);
    const dailyIntention = todaysPriming?.dailyIntention?.toLowerCase().trim() || '';

    // 2. Filter by Intensity & Cooldown — allow effective and set intensity
    const availableQuotes = allContent.filter((q) => {
        // Accept set intensity and softer tier when in low state
        if (q.intensity !== effectiveIntensity && q.intensity !== intensity) return false;

        // Cooldown Check (6 months)
        if (seenHistory[q.id]) {
            const timeSinceSeen = now - seenHistory[q.id];
            if (timeSinceSeen < SIX_MONTHS_MS) {
                return false; // Still in cooldown
            }
        }
        return true;
    });

    // 3. Apply Preferences (Source & Content Type)
    const filteredQuotes = availableQuotes.filter((q) => {
        // Source preference (AI vs Human)
        let sourceMatch = true;
        if (user.sourcePreference === 'human') {
            sourceMatch = !q.isAI;
        } else if (user.sourcePreference === 'ai') {
            sourceMatch = !!q.isAI;
        }

        // Content type preference (Quotes vs Affirmations)
        let contentTypeMatch = true;
        if (user.contentTypePreference === 'quotes') {
            // User wants quotes: Exclude affirmations
            contentTypeMatch = !q.isAffirmation;
        } else if (user.contentTypePreference === 'affirmations') {
            // User wants affirmations: Only include affirmations
            contentTypeMatch = !!q.isAffirmation;
        }
        // 'mix' allows both (true)

        return sourceMatch && contentTypeMatch;
    });

    // 4. Score quotes based on relevance
    const scoredQuotes = filteredQuotes.map((quote) => {
        let score = 0;
        const quoteSearchText = `${quote.text} ${quote.category} ${quote.tags?.join(' ') || ''}`.toLowerCase();

        // PRIORITY 0: Today's morning intention — strongest signal
        if (dailyIntention && dailyIntention.length > 2) {
            if (quoteSearchText.includes(dailyIntention)) score += 400;
            const intentionRoot = dailyIntention.slice(0, Math.max(4, dailyIntention.length - 2));
            if (intentionRoot.length > 3 && quoteSearchText.includes(intentionRoot)) score += 200;
        }

        // PRIORITY 1: Profession match (highest weight)
        if (user.profession && quote.profession) {
            const userProf = user.profession.toLowerCase();
            const quoteProf = quote.profession.toLowerCase();

            // Direct match
            if (userProf === quoteProf) {
                score += 150;
            }
            // Mapped match (e.g. Filmmaker -> Creative)
            else {
                const mappings: Record<string, string[]> = {
                    'creative': ['filmmaker', 'musician', 'photographer', 'artist', 'designer', 'writer', 'producer', 'director'],
                    'tech': ['developer', 'engineer', 'scientist', 'data scientist'],
                    'business': ['entrepreneur', 'executive', 'sales', 'marketing', 'consultant', 'finance', 'real estate', 'investor'],
                    'wellness': ['coach', 'healthcare', 'doctor', 'teacher', 'therapist'],
                    'athlete': ['athlete', 'player', 'coach'],
                    // Reverse mapping for robustness
                    'filmmaker': ['creative', 'artist', 'director'],
                    'musician': ['creative', 'artist'],
                    'developer': ['tech', 'engineer'],
                    'engineer': ['tech', 'developer', 'scientist'],
                    'entrepreneur': ['business', 'executive'],
                    'marketing': ['business', 'sales'],
                    'sales': ['business', 'marketing'],
                    'finance': ['business'],
                    'real estate': ['business', 'sales']
                };

                // Check if quote profession covers user profession
                if (mappings[quoteProf]?.includes(userProf)) {
                    score += 150;
                }
                // Check if user profession maps to quote profession
                else if (mappings[userProf]?.includes(quoteProf)) {
                    score += 150;
                }
            }
        }

        // PRIORITY 1.5: Daily Focus Match (High relevance to current day)
        if (user.dailyFocuses && user.dailyFocuses.length > 0) {
            const activeFocusText = user.dailyFocuses
                .filter(f => !f.isCompleted)
                .map(f => f.text.toLowerCase())
                .join(' ');

            if (activeFocusText) {
                const quoteContent = `${quote.text} ${quote.category} ${quote.author || ''}`.toLowerCase();
                const keywords = activeFocusText.split(' ').filter(w => w.length > 3);
                keywords.forEach(keyword => {
                    if (quoteContent.includes(keyword)) {
                        score += 500; // Boost extremely high if it matches today's focus
                    }
                });
            }
        }

        // PRIORITY 2: Career field match
        if (user.career && quote.category) {
            if (quote.category.toLowerCase().includes(user.career.toLowerCase())) {
                score += 50;
            }
        }

        // PRIORITY 3: Interest match
        if (user.interests && user.interests.length > 0) {
            user.interests.forEach((interest) => {
                if (quote.category.toLowerCase().includes(interest.toLowerCase())) {
                    score += 20;
                }
            });
        }

        // PRIORITY 4: Momentum state
        const momentum = getMomentumState(user);
        const momentumKeywords = MOMENTUM_THEMES[momentum] || [];
        momentumKeywords.forEach(keyword => {
            if (quoteSearchText.includes(keyword)) score += 60;
        });

        // PRIORITY 5: Current mood
        if (user.currentMood && MOOD_THEMES[user.currentMood]) {
            MOOD_THEMES[user.currentMood].forEach(keyword => {
                if (quoteSearchText.includes(keyword)) score += 40;
            });
        }

        // PRIORITY 6: Focus areas
        if (user.focusAreas?.length) {
            user.focusAreas.forEach(area => {
                if (quoteSearchText.includes(area)) score += 30;
            });
        }

        // Prefer softer quotes when user is in a low state
        if (isLowState && quote.intensity < intensity) score += 60;

        // Small random factor — variety without overriding real matches
        score += Math.random() * 15;

        return { quote, score };
    });

    // 5. Sort by score
    scoredQuotes.sort((a, b) => b.score - a.score);

    const quotes = scoredQuotes.map((item) => item.quote);

    // 6. Handle Empty Results
    // If no quotes found (all in cooldown), we must relax the rule
    if (quotes.length === 0 && Object.keys(seenHistory).length > 0) {
        // Recycle all quotes and reset seen history to ensure rotation
        console.warn('All quotes in cooldown. Recycling and resetting seen history.');

        const recycledQuotes = allContent.filter(q => {
            if (q.intensity != intensity) return false;

            let sourceMatch = true;
            if (user.sourcePreference === 'human') sourceMatch = !q.isAI;
            else if (user.sourcePreference === 'ai') sourceMatch = !!q.isAI;

            let contentTypeMatch = true;
            if (user.contentTypePreference === 'quotes') contentTypeMatch = !q.isAffirmation;
            else if (user.contentTypePreference === 'affirmations') contentTypeMatch = !!q.isAffirmation;

            return sourceMatch && contentTypeMatch;
        }).sort(() => Math.random() - 0.5);

        seenHistory = {};
        if (recycledQuotes.length > 0) {
            seenHistory[recycledQuotes[0].id] = Date.now();
        }
        saveSeenHistory();
        return recycledQuotes.length > 0 ? recycledQuotes : allContent.sort(() => Math.random() - 0.5);
    }

    // If STILL no quotes
    if (quotes.length === 0) {
        return allContent.sort(() => Math.random() - 0.5); // Ultimate fallback
    }

    // NOTE: Do NOT mutate seenHistory here — this is a pure read/rank function.
    // Call markQuoteSeen(id) only after the quote is actually shown to the user.
    return quotes;
};

/**
 * Record a quote as seen ONLY when it has actually been delivered to the user.
 * Keeping this separate from getRelevantQuotes prevents phantom-marking quotes the user never saw.
 */
export const markQuoteSeen = (quoteId: string) => {
    if (!quoteId || quoteId.startsWith('emergency_fallback')) return;
    seenHistory[quoteId] = Date.now();
    saveSeenHistory();
};

/**
 * Pick the best available quote for a user, mark it seen, and return it.
 * Single entry point for all quote selection — eliminates dual-system conflicts.
 */
export const pickAndMarkQuote = (user: UserProfile, excludeId?: string): Quote | null => {
    const candidates = getRelevantQuotes(user);
    // Always exclude the currently-shown quote when refreshing
    const filtered = excludeId ? candidates.filter(q => q.id !== excludeId) : candidates;
    const pool = filtered.length > 0 ? filtered : candidates;
    if (pool.length === 0) return null;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    markQuoteSeen(selected.id);
    return selected;
};



/**
 * Generate a fresh AI-powered quote personalized for the user
 */
export const getAIQuote = async (user: UserProfile): Promise<Quote> => {
    const timeOfDay = getTimeOfDay();

    if (!isAIAvailable()) {
        // Return a fallback AI quote from the existing pool
        const aiQuotes = QUOTES.filter(q => q.isAI && q.intensity === user.quoteIntensity);
        if (aiQuotes.length > 0) {
            return aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
        }
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
        // Fallback to existing AI quotes
        const aiQuotes = QUOTES.filter(q => q.isAI && q.intensity === user.quoteIntensity);
        if (aiQuotes.length > 0) {
            return aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
        }
        // Ultimate fallback
        return {
            id: `ai_fallback_${Date.now()}`,
            text: "Your potential is limitless. Keep moving forward.",
            author: user.coachName ? `Coach ${user.coachName}` : "Palante Coach",
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

// Helper to reset seen quotes (useful for testing or user preference)
// Helper to reset seen quotes (useful for testing or user preference)
export const resetSeenQuotes = () => {
    seenHistory = {};
    saveSeenHistory();
};
