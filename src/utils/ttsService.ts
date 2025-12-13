/**
 * Enhanced Web Speech API TTS Service
 * Intelligently selects the best available voices for premium quality
 * 100% free, works offline, zero latency
 */

export type VoiceId = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface VoiceInfo {
    id: VoiceId;
    name: string;
    description: string;
    gender: 'male' | 'female' | 'neutral';
}

export const OPENAI_VOICES: VoiceInfo[] = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral & balanced', gender: 'neutral' },
    { id: 'echo', name: 'Echo', description: 'Warm & resonant', gender: 'male' },
    { id: 'fable', name: 'Fable', description: 'Expressive British', gender: 'male' },
    { id: 'onyx', name: 'Onyx', description: 'Deep & authoritative', gender: 'male' },
    { id: 'nova', name: 'Nova', description: 'Friendly & upbeat', gender: 'female' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft & calming', gender: 'female' },
];

// Alias for backwards compatibility
export type OpenAIVoice = VoiceId;

// Current utterance for stop functionality
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Get all premium/enhanced voices available on the system
 * Prioritizes: Enhanced > Premium > Neural > Google > Standard
 */
const getPremiumVoices = (): SpeechSynthesisVoice[] => {
    const allVoices = window.speechSynthesis.getVoices();

    // Filter for English voices only
    const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));

    // Categorize by quality
    const enhanced = englishVoices.filter(v =>
        v.name.includes('Enhanced') ||
        v.name.includes('Premium') ||
        v.name.includes('Neural')
    );

    const google = englishVoices.filter(v =>
        v.name.includes('Google') &&
        !v.name.includes('eSpeak')
    );

    const microsoft = englishVoices.filter(v =>
        v.name.includes('Microsoft') &&
        (v.name.includes('Natural') || v.name.includes('Online'))
    );

    // Return in priority order
    return [...enhanced, ...google, ...microsoft, ...englishVoices];
};

/**
 * Intelligently select the best voice for a given voice ID
 * Uses platform-specific optimizations
 */
const selectBestVoice = (voiceId: VoiceId): SpeechSynthesisVoice | null => {
    const premiumVoices = getPremiumVoices();
    if (premiumVoices.length === 0) return null;

    // Voice preferences by ID (platform-agnostic, prioritizes best voices)
    const preferences: Record<VoiceId, string[]> = {
        alloy: [
            // macOS Enhanced/Premium voices (BEST)
            'Samantha (Enhanced)', 'Ava (Enhanced)', 'Ava (Premium)',
            // Standard fallbacks
            'Samantha', 'Alex', 'Ava',
            // Google voices
            'Google US English', 'Google UK English Female',
            // Windows Neural voices
            'Microsoft Aria Online', 'Microsoft Jenny Online',
            // Language fallback
            'en-US', 'en-GB'
        ],
        echo: [
            // macOS Enhanced voices
            'Nathan (Enhanced)', 'Evan (Enhanced)',
            // Standard
            'Daniel', 'Nathan', 'Evan',
            // Google
            'Google UK English Male',
            // Windows
            'Microsoft Guy Online', 'Microsoft Ryan Online',
            'en-GB', 'en-AU'
        ],
        fable: [
            // macOS Enhanced voices (expressive)
            'Karen', 'Ava (Premium)', 'Ava (Enhanced)',
            // Other good options
            'Allison (Enhanced)', 'Joelle (Enhanced)',
            // Standard
            'Ava', 'Karen', 'Joelle', 'Allison',
            // Google
            'Google UK English Female',
            // Windows
            'Microsoft Libby Online', 'Microsoft Sonia Online',
            'en-AU', 'en-GB'
        ],
        onyx: [
            // macOS Enhanced voices (deeper male voices)
            'Nathan (Enhanced)', 'Evan (Enhanced)',
            // Good standard deep voices (NOT Fred - he's terrible)
            'Ralph', 'Bruce', 'Nathan', 'Evan',
            // Google
            'Google US English Male',
            // Windows
            'Microsoft Davis Online', 'Microsoft Tony Online',
            'en-US'
        ],
        nova: [
            // macOS Enhanced/Premium voices (BEST for female)
            'Samantha (Enhanced)', 'Ava (Enhanced)', 'Ava (Premium)',
            'Allison (Enhanced)', 'Noelle (Enhanced)',
            // Standard
            'Samantha', 'Ava', 'Allison', 'Noelle',
            // Google
            'Google US English Female',
            // Windows
            'Microsoft Aria Online', 'Microsoft Jenny Online',
            'en-US'
        ],
        shimmer: [
            // macOS Enhanced/Premium voices (soft/calming)
            'Ava (Premium)', 'Ava (Enhanced)', 'Allison (Enhanced)',
            'Noelle (Enhanced)', 'Nicky (Enhanced)',
            // Standard soft voices
            'Ava', 'Allison', 'Noelle', 'Nicky', 'Kathy',
            // Google
            'Google US English Female',
            // Windows
            'Microsoft Aria Online', 'Microsoft Jenny Online',
            'en-US'
        ]
    };

    const preferredNames = preferences[voiceId];

    // Try to find exact matches first
    for (const name of preferredNames) {
        const found = premiumVoices.find(v => {
            // Exact match
            if (v.name === name) return true;
            // Contains match (case-insensitive)
            if (v.name.toLowerCase().includes(name.toLowerCase())) return true;
            // Language code match
            if (v.lang.includes(name)) return true;
            return false;
        });
        if (found) {
            console.log(`🎙️ TTS: Selected "${found.name}" for ${voiceId}`);
            return found;
        }
    }

    // Fallback: Use first premium voice
    const fallback = premiumVoices[0];
    console.log(`🎙️ TTS: Using fallback voice "${fallback.name}" for ${voiceId}`);
    return fallback;
};

/**
 * Preprocess text for more natural speech
 * Adds pauses and improves pacing
 */
const preprocessText = (text: string): string => {
    let processed = text;

    // Add slight pauses after punctuation
    processed = processed.replace(/\./g, '. ');
    processed = processed.replace(/,/g, ', ');
    processed = processed.replace(/;/g, '; ');
    processed = processed.replace(/:/g, ': ');

    // Add emphasis markers (SSML-like, browser may support)
    processed = processed.replace(/\*\*(.+?)\*\*/g, '$1'); // Remove markdown bold
    processed = processed.replace(/\*(.+?)\*/g, '$1'); // Remove markdown italic

    // Clean up multiple spaces
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
};

/**
 * Ensure voices are loaded (they load asynchronously)
 */
const ensureVoicesLoaded = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        // Voices not loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
        };

        // Fallback timeout
        setTimeout(() => {
            resolve(window.speechSynthesis.getVoices());
        }, 1000);
    });
};

/**
 * Speak text using enhanced Web Speech API
 * Optimized for natural, soothing delivery
 */
export const speak = async (
    text: string,
    voice: VoiceId = 'nova',
    onStart?: () => void,
    onEnd?: () => void,
    speed: number = 1.0
): Promise<void> => {
    // Stop any current speech
    stop();

    // Ensure voices are loaded
    await ensureVoicesLoaded();

    // Preprocess text for better delivery
    const processedText = preprocessText(text);

    const utterance = new SpeechSynthesisUtterance(processedText);

    // Optimized settings for clarity and naturalness
    utterance.rate = speed * 0.85; // Slower for clarity and calmness
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Select the best available voice
    const selectedVoice = selectBestVoice(voice);
    if (selectedVoice) {
        utterance.voice = selectedVoice;

        // Fine-tune pitch based on voice type
        const voiceInfo = OPENAI_VOICES.find(v => v.id === voice);
        if (voiceInfo?.gender === 'male') {
            if (voice === 'onyx') {
                utterance.pitch = 0.85; // Deeper for Onyx
            } else {
                utterance.pitch = 0.95; // Slightly lower for male voices
            }
        } else if (voiceInfo?.gender === 'female') {
            if (voice === 'shimmer') {
                utterance.pitch = 1.05; // Slightly higher for Shimmer
            } else {
                utterance.pitch = 1.0; // Natural for other female voices
            }
        }
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
        currentUtterance = null;
        onEnd?.();
    };
    utterance.onerror = (event) => {
        console.error('TTS Error:', event);
        currentUtterance = null;
        onEnd?.();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
};

/**
 * Stop any current speech
 */
export const stop = (): void => {
    window.speechSynthesis.cancel();
    if (currentUtterance) {
        currentUtterance = null;
    }
};

/**
 * Check if currently speaking
 */
export const isSpeaking = (): boolean => {
    return window.speechSynthesis.speaking;
};

/**
 * Preview a voice with a sample phrase
 */
export const previewVoice = async (
    voice: VoiceId,
    onStart?: () => void,
    onEnd?: () => void
): Promise<void> => {
    const voiceInfo = OPENAI_VOICES.find(v => v.id === voice);
    const sampleText = `Hi, I'm ${voiceInfo?.name || voice}. My voice is ${voiceInfo?.description.toLowerCase() || 'natural and clear'}.`;

    await speak(sampleText, voice, onStart, onEnd);
};

/**
 * Get a list of available premium voices (for debugging)
 */
export const getAvailableVoices = (): string[] => {
    const premium = getPremiumVoices();
    return premium.map(v => `${v.name} (${v.lang})`);
};

/**
 * Log available premium voices to console (for debugging)
 */
export const debugVoices = (): void => {
    console.log('🎙️ Available Premium Voices:');
    const voices = getPremiumVoices();
    voices.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.name} (${v.lang}) - ${v.localService ? 'Local' : 'Remote'}`);
    });
};
