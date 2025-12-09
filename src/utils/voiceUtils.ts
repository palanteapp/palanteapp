export const getVoiceForId = (voiceId: string, systemVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    let selectedVoice: SpeechSynthesisVoice | undefined;

    // Strict priority lists for each voice ID to ensure distinctness
    switch (voiceId) {
        case 'shimmer': // Gentle & Calming (UK/Soft Female)
            const shimmerPreferences = ['Google UK English Female', 'Victoria', 'Microsoft Hazel', 'English (UK)', 'en-GB'];
            for (const name of shimmerPreferences) {
                selectedVoice = systemVoices.find(v => v.name.includes(name));
                if (selectedVoice) return selectedVoice;
            }
            break;

        case 'fable': // Smooth & Confident (UK/Smooth Male)
            // Daniel is the standard high-quality UK male voice on Mac.
            const fablePreferences = ['Daniel', 'Google UK English Male', 'Oliver', 'English (UK)', 'en-GB'];
            for (const name of fablePreferences) {
                selectedVoice = systemVoices.find(v => v.name.includes(name));
                if (selectedVoice) return selectedVoice;
            }
            break;
    }

    // Fallback if no specific match found
    if (voiceId === 'shimmer') {
        // Try to find any female-sounding voice
        const commonFemaleNames = ['Samantha', 'Victoria', 'Karen', 'Zira', 'Hazel', 'Susan', 'Julie'];
        selectedVoice = systemVoices.find(v => commonFemaleNames.some(n => v.name.includes(n)));
    } else {
        // Try to find any male-sounding voice
        const commonMaleNames = ['Alex', 'Daniel', 'Fred', 'David', 'Mark', 'George', 'James'];
        selectedVoice = systemVoices.find(v => commonMaleNames.some(n => v.name.includes(n)));
    }

    if (selectedVoice) return selectedVoice;

    // Ultimate fallback
    return systemVoices.find(v => v.lang.startsWith('en')) || null;
};
