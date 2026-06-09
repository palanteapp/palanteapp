/**
 * Voice Profile Learner
 *
 * Analyzes message ratings and extracts patterns to personalize future messages.
 * This is the core of Phase 2: turning generic messages into personalized guidance.
 */

import type { UserVoiceProfile, DailyMorningPractice, DailyEveningPractice } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types for the learning system
// ─────────────────────────────────────────────────────────────────────────────

export interface RatedMessage {
    id: string;
    text: string;
    rating: 1 | 2 | 3 | 4 | 5;
    type: 'morning' | 'evening';
    generatedAt: string; // ISO timestamp
    ratedAt?: string; // ISO timestamp
    context?: {
        userInputs?: {
            gratitudes?: string[];
            affirmations?: string[];
            energy?: number;
            mood?: string;
        };
    };
}

export interface ExtractedPhrase {
    phrase: string;
    frequency: number;
    averageRating: number;
    appearances: RatedMessage[];
}

export interface ExtractedTheme {
    theme: string;
    frequency: number;
    averageRating: number;
    examples: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Phrase Extraction Utilities
// ─────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
    'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing',
    'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
    'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'might',
    'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
    'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
    'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
    'yours', 'yourself', 'yourselves',
    // Common filler words
    'really', 'just', 'like', 'kind', 'sort', 'thing', 'things', 'stuff', 'get',
    'make', 'take', 'go', 'come', 'say', 'said', 'says'
]);

const MIN_PHRASE_LENGTH = 2; // Minimum words in a phrase to extract
const MAX_PHRASE_LENGTH = 5; // Maximum words in a phrase
const MIN_PHRASE_FREQUENCY = 2; // Need to see a phrase at least twice

/**
 * Tokenize text into words, removing punctuation and converting to lowercase
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s'-]/g, '') // Keep letters, numbers, spaces, hyphens, apostrophes
        .split(/\s+/)
        .filter(w => w.length > 0 && !STOPWORDS.has(w));
}

/**
 * Extract n-grams (sequences of n words) from text
 * Returns a set of meaningful phrases
 */
function extractNGrams(text: string, minN: number = 1, maxN: number = 3): Set<string> {
    const tokens = tokenize(text);
    const phrases = new Set<string>();

    for (let n = minN; n <= Math.min(maxN, tokens.length); n++) {
        for (let i = 0; i <= tokens.length - n; i++) {
            const phrase = tokens.slice(i, i + n).join(' ');
            // Only keep phrases that are 2-5 words and not just stopwords
            if (phrase.split(' ').length >= MIN_PHRASE_LENGTH &&
                phrase.split(' ').length <= MAX_PHRASE_LENGTH) {
                phrases.add(phrase);
            }
        }
    }

    return phrases;
}

/**
 * Score phrases based on their appearance in messages
 * High-rated messages contribute positive signals, low-rated messages negative signals
 */
function scorePhrase(
    phrase: string,
    ratedMessages: RatedMessage[]
): { score: number; frequency: number; avgRating: number } {
    let totalRating = 0;
    let frequency = 0;

    for (const msg of ratedMessages) {
        if (msg.text.toLowerCase().includes(phrase.toLowerCase())) {
            totalRating += msg.rating;
            frequency += 1;
        }
    }

    if (frequency === 0) {
        return { score: 0, frequency: 0, avgRating: 0 };
    }

    // Score = (average rating - 2.5) * frequency
    // This gives more weight to phrases that appear frequently in highly-rated messages
    const avgRating = totalRating / frequency;
    const score = (avgRating - 2.5) * frequency;

    return { score, frequency, avgRating };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Learning Engine
// ─────────────────────────────────────────────────────────────────────────────

export class VoiceProfileLearner {
    /**
     * Analyzes rated messages and extracts resonant phrases
     * Phrases from 4-5 star messages go to resonantPhrases
     * Phrases from 1-2 star messages go to avoidPhrases
     */
    static extractResonantPhrases(ratedMessages: RatedMessage[]): {
        resonantPhrases: string[];
        avoidPhrases: string[];
    } {
        const resonantMessages = ratedMessages.filter(m => m.rating >= 4);
        const poorMessages = ratedMessages.filter(m => m.rating <= 2);

        const resonantPhrases = new Map<string, { frequency: number; avgRating: number }>();
        const avoidPhrases = new Map<string, { frequency: number; avgRating: number }>();

        // Extract phrases from resonant messages
        for (const msg of resonantMessages) {
            const phrases = extractNGrams(msg.text, 1, 3);
            for (const phrase of phrases) {
                if (resonantPhrases.has(phrase)) {
                    const current = resonantPhrases.get(phrase)!;
                    resonantPhrases.set(phrase, {
                        frequency: current.frequency + 1,
                        avgRating: (current.avgRating + msg.rating) / 2
                    });
                } else {
                    resonantPhrases.set(phrase, {
                        frequency: 1,
                        avgRating: msg.rating
                    });
                }
            }
        }

        // Extract phrases from poor messages
        for (const msg of poorMessages) {
            const phrases = extractNGrams(msg.text, 1, 3);
            for (const phrase of phrases) {
                if (avoidPhrases.has(phrase)) {
                    const current = avoidPhrases.get(phrase)!;
                    avoidPhrases.set(phrase, {
                        frequency: current.frequency + 1,
                        avgRating: (current.avgRating + msg.rating) / 2
                    });
                } else {
                    avoidPhrases.set(phrase, {
                        frequency: 1,
                        avgRating: msg.rating
                    });
                }
            }
        }

        // Filter to keep only meaningful phrases (appear at least twice)
        const resonantFiltered = Array.from(resonantPhrases.entries())
            .filter(([_, data]) => data.frequency >= MIN_PHRASE_FREQUENCY)
            .sort((a, b) => {
                // Sort by: frequency first, then by rating
                const freqDiff = b[1].frequency - a[1].frequency;
                return freqDiff !== 0 ? freqDiff : b[1].avgRating - a[1].avgRating;
            })
            .slice(0, 20) // Keep top 20
            .map(([phrase, _]) => phrase);

        const avoidFiltered = Array.from(avoidPhrases.entries())
            .filter(([_, data]) => data.frequency >= MIN_PHRASE_FREQUENCY)
            .sort((a, b) => a[1].avgRating - b[1].avgRating) // Sort by lowest rating first
            .slice(0, 15) // Keep top 15
            .map(([phrase, _]) => phrase);

        return {
            resonantPhrases: resonantFiltered,
            avoidPhrases: avoidFiltered
        };
    }

    /**
     * Extracts core themes and values from user's gratitudes and reflections
     * Looks for recurring concepts in high-rated practice entries
     */
    static extractCoreThemes(
        morningPractices: DailyMorningPractice[],
        eveningPractices: DailyEveningPractice[]
    ): {
        coreThemes: string[];
        extractedValues: string[];
    } {
        const highRatedMornings = morningPractices.filter(p => (p.messageRating ?? 0) >= 4);
        const highRatedEvenings = eveningPractices.filter(p => (p.messageRating ?? 0) >= 4);

        // Collect all text to analyze
        const textToAnalyze: string[] = [];

        // Add gratitudes and affirmations from morning practices
        for (const practice of highRatedMornings) {
            textToAnalyze.push(...(practice.gratitudes ?? []));
            textToAnalyze.push(...(practice.affirmations ?? []));
            if (practice.commitment) textToAnalyze.push(practice.commitment);
        }

        // Add evening practice reflections
        for (const practice of highRatedEvenings) {
            if (practice.gratitude) textToAnalyze.push(practice.gratitude);
            if (practice.learning) textToAnalyze.push(practice.learning);
            if (practice.accomplishment) textToAnalyze.push(practice.accomplishment);
            if (practice.delight) textToAnalyze.push(practice.delight);
        }

        if (textToAnalyze.length === 0) {
            return { coreThemes: [], extractedValues: [] };
        }

        // Extract themes: look for repeated concepts
        const themeScores = new Map<string, { count: number; examples: string[] }>();

        // Common theme keywords to look for
        const themeLookup: Record<string, string[]> = {
            'presence': ['present', 'presence', 'moment', 'here', 'now', 'aware', 'mindful', 'attentive'],
            'growth': ['grow', 'growth', 'develop', 'evolve', 'learning', 'improve', 'progress', 'expand'],
            'courage': ['courage', 'courageous', 'brave', 'bold', 'fear', 'scared', 'overcome'],
            'connection': ['connect', 'connection', 'close', 'bond', 'relate', 'understand', 'hear', 'listen'],
            'peace': ['peace', 'peaceful', 'calm', 'quiet', 'rest', 'still', 'ease', 'relief'],
            'purpose': ['purpose', 'meaning', 'why', 'intention', 'goal', 'direction', 'path'],
            'authenticity': ['authentic', 'real', 'genuine', 'true', 'honest', 'myself', 'true self'],
            'gratitude': ['grateful', 'grateful', 'thankful', 'appreciate', 'blessed', 'lucky'],
            'strength': ['strength', 'strong', 'capable', 'powerful', 'resilient', 'tough', 'endure'],
            'family': ['family', 'father', 'mother', 'parent', 'sibling', 'brother', 'sister', 'loved one'],
            'boundaries': ['boundary', 'boundaries', 'no', 'limit', 'protect', 'myself', 'stand'],
            'service': ['serve', 'help', 'support', 'give', 'share', 'contribute', 'impact']
        };

        for (const text of textToAnalyze) {
            const lowerText = text.toLowerCase();
            for (const [theme, keywords] of Object.entries(themeLookup)) {
                for (const keyword of keywords) {
                    if (lowerText.includes(keyword)) {
                        if (!themeScores.has(theme)) {
                            themeScores.set(theme, { count: 0, examples: [] });
                        }
                        const current = themeScores.get(theme)!;
                        current.count += 1;
                        if (current.examples.length < 2) {
                            current.examples.push(text);
                        }
                        break; // Only count once per text
                    }
                }
            }
        }

        // Sort themes by frequency and pick top ones
        const coreThemes = Array.from(themeScores.entries())
            .filter(([_, data]) => data.count >= 2) // Must appear at least twice
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([theme, _]) => theme);

        // Extract values: take top themes and add a few from phrase analysis
        const extractedValues = [...coreThemes].slice(0, 3);

        return {
            coreThemes,
            extractedValues
        };
    }

    /**
     * Records a message rating and updates the voice profile
     * This is called immediately when user rates a message
     */
    static updateProfileFromRating(
        voiceProfile: UserVoiceProfile,
        ratedMessage: RatedMessage,
        allRatedMessages: RatedMessage[]
    ): Partial<UserVoiceProfile> {
        // Update basic metrics
        const ratedMessageCount = (voiceProfile.ratedMessageCount || 0) + 1;
        const avgRating = allRatedMessages.length > 0
            ? allRatedMessages.reduce((sum, m) => sum + m.rating, 0) / allRatedMessages.length
            : 0;

        // Extract resonant/avoid phrases from messages rated so far
        const { resonantPhrases, avoidPhrases } = this.extractResonantPhrases(allRatedMessages);

        const updates: Partial<UserVoiceProfile> = {
            ratedMessageCount,
            averageRating: avgRating,
            resonantPhrases,
            avoidPhrases,
            lastUpdated: new Date().toISOString(),
        };

        // Update engagement rate
        const totalMessagesGenerated = (voiceProfile.totalMessagesGenerated || 0) + 1;
        updates.totalMessagesGenerated = totalMessagesGenerated;
        updates.engagementRate = totalMessagesGenerated > 0
            ? ratedMessageCount / totalMessagesGenerated
            : 0;

        return updates;
    }

    /**
     * Runs weekly analysis to extract core themes and values
     * Called after user has rated at least 7 messages
     */
    static analyzeWeeklyPatterns(
        voiceProfile: UserVoiceProfile,
        morningPractices: DailyMorningPractice[],
        eveningPractices: DailyEveningPractice[]
    ): Partial<UserVoiceProfile> {
        const { coreThemes, extractedValues } = this.extractCoreThemes(
            morningPractices,
            eveningPractices
        );

        const updates: Partial<UserVoiceProfile> = {
            coreThemes,
            extractedValues,
            messagesSinceUpdate: 0,
            lastUpdated: new Date().toISOString(),
        };

        // Add to analysis history
        const analysisHistory = voiceProfile.analysisHistory || [];
        analysisHistory.push({
            date: new Date().toISOString(),
            extractedValuesSnapshot: extractedValues,
            coreThemesSnapshot: coreThemes
        });
        updates.analysisHistory = analysisHistory.slice(-12); // Keep last 12 weeks

        return updates;
    }

    /**
     * Generate personalization context for the message generator
     * Returns a structured prompt injection and constraints
     */
    static getPersonalizationContext(voiceProfile: UserVoiceProfile): {
        prompt: string;
        constraints: string[];
        exemplars?: string[];
    } {
        const { messageLength = 'balanced', voiceTone = 'nurturing', extractedValues = [], resonantPhrases = [], avoidPhrases = [] } = voiceProfile;

        // Build the personalization prompt
        const parts: string[] = [];

        // Tone and length guidance
        const toneGuide: Record<string, string> = {
            'nurturing': 'warm, patient, acknowledging',
            'direct': 'clear and honest, no fluff',
            'accountability': 'high-standard, firm, believing in them'
        };

        const lengthGuide: Record<string, string> = {
            'concise': 'short and punchy, get to the point',
            'balanced': 'just right balance of context and brevity',
            'detailed': 'thorough, full picture with nuance'
        };

        parts.push(`Tone: ${toneGuide[voiceTone] || 'balanced and warm'}`);
        parts.push(`Length: ${lengthGuide[messageLength] || 'balanced'}`);

        // Core values injection
        if (extractedValues.length > 0) {
            parts.push(`\nThis person deeply values: ${extractedValues.join(', ')}.`);
            parts.push('Weave these naturally into the message—not as a list, but as genuine connections.');
        }

        // Resonant phrases
        const constraints: string[] = [];
        if (resonantPhrases.length > 0) {
            parts.push(`\nPhrases that land well for them: ${resonantPhrases.slice(0, 5).join(', ')}`);
        }

        if (avoidPhrases.length > 0) {
            constraints.push(`Do NOT use these phrases: ${avoidPhrases.slice(0, 8).join(', ')}`);
        }

        return {
            prompt: parts.join('\n'),
            constraints: [
                'Be specific and personal, not generic.',
                'Connect to what they said today, not universal platitudes.',
                ...constraints
            ]
        };
    }
}

/**
 * Helper: Check if a user has enough data for weekly analysis
 */
export function shouldRunWeeklyAnalysis(voiceProfile: UserVoiceProfile): boolean {
    const ratedCount = voiceProfile.ratedMessageCount || 0;
    const messagesSinceUpdate = voiceProfile.messagesSinceUpdate || 0;

    // Run analysis if: at least 7 rated messages AND at least 7 new messages since last update
    return ratedCount >= 7 && messagesSinceUpdate >= 7;
}

/**
 * Helper: Get a summary of learning progress
 */
export function getLearningProgress(voiceProfile: UserVoiceProfile): {
    phase: 'starting' | 'learning' | 'personalized' | 'optimized';
    progress: number; // 0-100
    nextMilestone: string;
    stats: {
        ratedMessages: number;
        engagementRate: number;
        averageRating: number;
        knownThemes: number;
    };
} {
    const ratedCount = voiceProfile.ratedMessageCount || 0;
    const engagement = voiceProfile.engagementRate || 0;
    const avgRating = voiceProfile.averageRating || 0;
    const themes = (voiceProfile.coreThemes || []).length;

    let phase: 'starting' | 'learning' | 'personalized' | 'optimized';
    let progress: number;
    let nextMilestone: string;

    if (ratedCount < 3) {
        phase = 'starting';
        progress = (ratedCount / 3) * 25;
        nextMilestone = `Rate ${3 - ratedCount} more message${3 - ratedCount === 1 ? '' : 's'} to start learning`;
    } else if (ratedCount < 10) {
        phase = 'learning';
        progress = 25 + ((ratedCount - 3) / 7) * 25;
        nextMilestone = `Rate ${10 - ratedCount} more message${10 - ratedCount === 1 ? '' : 's'} for personalization`;
    } else if (ratedCount < 30) {
        phase = 'personalized';
        progress = 50 + ((ratedCount - 10) / 20) * 30;
        nextMilestone = `${30 - ratedCount} more message${30 - ratedCount === 1 ? '' : 's'} for optimization`;
    } else {
        phase = 'optimized';
        progress = 80 + Math.min((ratedCount - 30) / 70, 1) * 20;
        nextMilestone = 'System is fully personalized';
    }

    return {
        phase,
        progress: Math.min(progress, 100),
        nextMilestone,
        stats: {
            ratedMessages: ratedCount,
            engagementRate: Math.round(engagement * 100),
            averageRating: Math.round(avgRating * 10) / 10,
            knownThemes: themes
        }
    };
}
