import { QUOTES } from '../data/quotes';
import type { UserProfile, Quote } from '../types';

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

// Helper to reset seen quotes (useful for testing or user preference)
export const resetSeenQuotes = () => {
    seenQuotes.clear();
};
