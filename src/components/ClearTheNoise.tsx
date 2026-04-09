

import { useState, useEffect } from 'react';
import { X, Cloud, Sparkles, Target, Flame, Lightbulb, Mic } from 'lucide-react';
import type { UserProfile, NoiseEntry, Tier } from '../types';
import { CLEAR_THE_NOISE_CONTENT } from '../data/clearTheNoise';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ClearTheNoiseProps {
    user: UserProfile;
    isDarkMode: boolean;
    onClose: () => void;
    onComplete: (entries: NoiseEntry[]) => void;
}

type Screen = 'prompt' | 'input' | 'acknowledgment' | 'refocus';

export const ClearTheNoise: React.FC<ClearTheNoiseProps> = ({ user, isDarkMode, onClose, onComplete }) => {
    const [screen, setScreen] = useState<Screen>('prompt');
    const [entries, setEntries] = useState<string[]>(['']);
    const [currentInput, setCurrentInput] = useState('');

    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

    // Simplified effect to handle incoming transcript
    useEffect(() => {
        if (transcript) {
            Promise.resolve().then(() => {
                setCurrentInput(prev => {
                    const needsSpace = prev.length > 0 && !prev.endsWith(' ');
                    return prev + (needsSpace ? ' ' : '') + transcript;
                });
                resetTranscript();
            });
        }
    }, [transcript, resetTranscript]);

    // Styling
    const textPrimary = 'text-white';
    const textSecondary = 'text-white/70';
    const cardClass = 'bg-warm-gray-green/5 border-white/10'; // Consistent with app aesthetic

    // Random selection for variety
    const [seeds] = useState(() => ({
        ack: Math.floor(Math.random() * 100),
        ref: Math.floor(Math.random() * 100),
        fact: Math.floor(Math.random() * CLEAR_THE_NOISE_CONTENT.scienceFacts.length)
    }));

    // Tier-specific content
    const getTierContent = (tier: Tier) => {
        const content = CLEAR_THE_NOISE_CONTENT.tiers[tier];
        const fact = CLEAR_THE_NOISE_CONTENT.scienceFacts[seeds.fact];

        // Fallback or specific icons per tier
        let icon, prompt;

        switch (tier) {
            case 1: // Muse
                icon = <Sparkles size={32} className={isDarkMode ? 'text-pale-gold' : 'text-pale-gold'} />;
                prompt = "Let's gently acknowledge what's clouding your vision. What fears or doubts are taking up space in your mind?";
                break;
            case 2: // Focus
                icon = <Target size={32} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />;
                prompt = "Name your distractions. What's pulling your attention away from what matters?";
                break;
            case 3: // Fire
                icon = <Flame size={32} className={isDarkMode ? 'text-pale-gold' : 'text-orange-600'} />;
                prompt = "What's in your way? Write down every fear, doubt, and excuse holding you back.";
                break;
            default:
                icon = <Sparkles size={32} />;
                prompt = "What's on your mind?";
        }

        return {
            icon,
            prompt,
            acknowledgment: content.acknowledgments[seeds.ack % content.acknowledgments.length],
            refocus: content.refocus[seeds.ref % content.refocus.length],
            fact
        };
    };

    const tierContent = getTierContent(user.tier);

    const handleAddEntry = () => {
        if (currentInput.trim()) {
            setEntries([...entries.filter(e => e), currentInput.trim()]);
            setCurrentInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddEntry();
        }
    };

    const handleContinue = () => {
        if (screen === 'prompt') {
            setScreen('input');
        } else if (screen === 'input') {
            if (currentInput.trim()) handleAddEntry();
            if (entries.filter(e => e).length > 0 || currentInput.trim()) {
                setScreen('acknowledgment');
            }
        } else if (screen === 'acknowledgment') {
            // Create noise entries
            const finalEntries = [...entries.filter(e => e), currentInput.trim()].filter(e => e);
            const noiseEntries: NoiseEntry[] = finalEntries.map(text => ({
                id: `noise_${Date.now()}_${Math.random()}`,
                text,
                timestamp: new Date().toISOString(),
                wasCleared: true
            }));
            onComplete(noiseEntries);
            setScreen('refocus');
        } else if (screen === 'refocus') {
            onClose();
        }
    };

    const handleRemoveEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl overflow-hidden ${cardClass} border-2`}>
                {/* Header */}
                <div className={`p-6 flex justify-between items-center border-b ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                    <div className="flex items-center gap-3">
                        <Cloud size={24} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        <h2 className={`text-2xl font-display font-medium ${textPrimary}`}>
                            Clear the Noise
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                    >
                        <X size={20} className={textSecondary} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[400px] flex flex-col">
                    {/* PROMPT SCREEN */}
                    {screen === 'prompt' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                            <div className="mb-4">
                                {tierContent.icon}
                            </div>
                            <p className={`text-lg max-w-lg ${textPrimary}`}>
                                {tierContent.prompt}
                            </p>
                            <p className={`text-sm max-w-md ${textSecondary}`}>
                                Write them down. Acknowledge them. Then set them aside.
                            </p>
                        </div>
                    )}

                    {/* INPUT SCREEN */}
                    {screen === 'input' && (
                        <div className="flex-1 flex flex-col space-y-4 animate-fade-in">
                            <p className={`text-sm text-center ${textSecondary}`}>
                                Let it all out. Each fear, doubt, or pressure. Press Enter to add another.
                            </p>

                            {/* Existing entries */}
                            {entries.filter(e => e).map((entry, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl flex justify-between items-start ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}
                                >
                                    <p className={`flex-1 ${textPrimary}`}>{entry}</p>
                                    <button
                                        onClick={() => handleRemoveEntry(index)}
                                        className={`ml-2 p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                                    >
                                        <X size={16} className={textSecondary} />
                                    </button>
                                </div>
                            ))}

                            {/* Input area */}
                            <div className="relative">
                                <textarea
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="I'm afraid that..."
                                    autoFocus
                                    className={`w-full p-4 pr-12 rounded-xl resize-none outline-none border-2 transition-colors ${isDarkMode
                                        ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/30'
                                        : 'bg-white/50 border-sage/20 focus:border-sage text-sage placeholder-sage/30'
                                        } ${isListening ? 'ring-2 ring-offset-2 ring-red-400 border-red-400' : ''}`}
                                    rows={3}
                                />
                                <button
                                    onClick={() => {
                                        if (isListening) {
                                            stopListening();
                                        } else {
                                            startListening();
                                        }
                                    }}
                                    className={`absolute top-3 right-3 p-2 rounded-full transition-all ${isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : isDarkMode ? 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20' : 'bg-sage/10 text-sage/60 hover:text-sage hover:bg-sage/20'
                                        }`}
                                    title="Dictate"
                                >
                                    <Mic size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ACKNOWLEDGMENT SCREEN */}
                    {screen === 'acknowledgment' && (
                        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                            {/* Icon at top */}
                            <div className="mb-6">
                                {tierContent.icon}
                            </div>

                            {/* Main message - centered */}
                            <div className="text-center space-y-4 mb-8">
                                <p className={`text-xl font-medium max-w-lg mx-auto ${textPrimary}`}>
                                    {tierContent.acknowledgment}
                                </p>
                            </div>

                            {/* Science Fact Card */}
                            <div className={`p-4 rounded-xl border max-w-lg w-full flex gap-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-sage/5 border-sage/10'}`}>
                                <div className={`flex-shrink-0 mt-1 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                    <Lightbulb size={20} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                        Did you know?
                                    </p>
                                    <p className={`text-sm leading-relaxed ${textSecondary}`}>
                                        {tierContent.fact}
                                    </p>
                                </div>
                            </div>

                            {/* Entries list - below, compact, fading out */}
                            <div className="w-full max-w-md space-y-2 mt-8 opacity-40">
                                {[...entries.filter(e => e), currentInput.trim()].filter(e => e).slice(0, 3).map((entry, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 rounded-lg text-xs ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'} ${textPrimary}`}
                                        style={{
                                            animation: `fadeOut 0.5s ease-in-out ${index * 0.1}s forwards`
                                        }}
                                    >
                                        {entry.length > 60 ? entry.substring(0, 60) + '...' : entry}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REFOCUS SCREEN */}
                    {screen === 'refocus' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                            <div className="mb-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'}`}>
                                    <Sparkles size={32} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                </div>
                            </div>
                            <h3 className={`text-2xl font-display font-medium ${textPrimary}`}>
                                The noise is cleared.
                            </h3>
                            <p className={`text-lg max-w-lg ${textPrimary}`}>
                                {tierContent.refocus}
                            </p>
                            <p className={`text-sm ${textSecondary}`}>
                                Your mind is clear. Your path is open.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-6 border-t flex justify-between ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                    {screen !== 'prompt' && screen !== 'refocus' && (
                        <button
                            onClick={() => {
                                if (screen === 'input') setScreen('prompt');
                                else if (screen === 'acknowledgment') setScreen('input');
                            }}
                            className={`px-6 py-3 rounded-full font-medium transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'
                                }`}
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleContinue}
                        disabled={screen === 'input' && entries.filter(e => e).length === 0 && !currentInput.trim()}
                        className={`ml-auto px-8 py-3 rounded-full font-bold transition-all ${screen === 'input' && entries.filter(e => e).length === 0 && !currentInput.trim()
                            ? 'opacity-50 cursor-not-allowed bg-gray-500/20'
                            : isDarkMode
                                ? 'bg-pale-gold text-warm-gray-green hover:scale-105'
                                : 'bg-sage text-white hover:scale-105'
                            }`}
                    >
                        {screen === 'prompt' ? 'Begin' : screen === 'input' ? 'Continue' : screen === 'acknowledgment' ? 'Release' : 'Done'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeOut {
                    from { opacity: 0.6; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};
