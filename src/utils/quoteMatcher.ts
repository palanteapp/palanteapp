import { QUOTES } from '../data/quotes';
import type { UserProfile, Quote } from '../types';
import { generateAffirmation, isAIAvailable } from './aiService';

// Track seen quotes to prevent repetition
const seenQuotes = new Set<string>();

export const getRelevantQuotes = (user: UserProfile): Quote[] => {
    // 1. Filter by Tier and Source Preference
    let tierQuotes = QUOTES.filter((q) => {
        const tierMatch = q.tier === user.tier;

        let sourceMatch = true;
        if (user.sourcePreference === 'human') {
            sourceMatch = !q.isAI;
        } else if (user.sourcePreference === 'ai') {
            sourceMatch = !!q.isAI;
        }
        // 'mix' allows both, so sourceMatch remains true

        return tierMatch && sourceMatch;
    });

    // 2. Score quotes based on relevance
    const scoredQuotes = tierQuotes.map((quote) => {
        let score = 0;

        // PRIORITY 1: Exact profession match (highest weight)
        if (user.profession && quote.profession) {
            if (quote.profession.toLowerCase() === user.profession.toLowerCase()) {
                score += 150; // Strong boost, but allows high-interest quotes to compete
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

        // BONUS: Penalize recently seen quotes
        if (seenQuotes.has(quote.id)) {
            score -= 30;
        }

        // Add small random factor for variety among similar scores
        score += Math.random() * 5;

        return { quote, score };
    });

    // 3. Sort by score (descending)
    scoredQuotes.sort((a, b) => b.score - a.score);

    // 4. Extract quotes and track as seen
    const quotes = scoredQuotes.map((item) => {
        seenQuotes.add(item.quote.id);
        return item.quote;
    });

    // 5. Clear seen quotes if we've seen more than 50% of available quotes
    if (seenQuotes.size > tierQuotes.length * 0.5) {
        seenQuotes.clear();
    }

    return quotes;
};

/**
 * Generate a fresh AI-powered quote personalized for the user
 */
export const getAIQuote = async (user: UserProfile): Promise<Quote> => {
    const timeOfDay = getTimeOfDay();

    if (!isAIAvailable()) {
        // Return a fallback AI quote from the existing pool
        const aiQuotes = QUOTES.filter(q => q.isAI && q.tier === user.tier);
        if (aiQuotes.length > 0) {
            return aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
        }
    }

    try {
        const response = await generateAffirmation({
            profession: user.profession,
            focusGoal: user.career,
            interests: user.interests,
            tier: user.tier,
            streak: user.streak,
            timeOfDay,
            userName: user.name,
        });

        return {
            id: `ai_${Date.now()}`,
            text: response.text,
            author: response.author,
            category: response.category,
            tier: user.tier,
            isAI: true,
        };
    } catch (error) {
        console.error('Error generating AI quote:', error);
        // Fallback to existing AI quotes
        const aiQuotes = QUOTES.filter(q => q.isAI && q.tier === user.tier);
        if (aiQuotes.length > 0) {
            return aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
        }
        // Ultimate fallback
        return {
            id: `ai_fallback_${Date.now()}`,
            text: "Your potential is limitless. Keep moving forward.",
            author: "Palante Coach",
            category: "Motivation",
            tier: user.tier,
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
export const resetSeenQuotes = () => {
    seenQuotes.clear();
};
