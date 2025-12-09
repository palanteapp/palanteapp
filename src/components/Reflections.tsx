import React, { useState, useEffect } from 'react';
import type { JournalEntry } from '../types';
import { Save, Calendar, Play, Pause, Music, Mic, X } from 'lucide-react';
import type { SoundTrack } from '../App';

interface ReflectionsProps {
    onSave: (entry: JournalEntry) => void;
    isDarkMode: boolean;
    currentTrackId: string | null;
    isPlaying: boolean;
    onTogglePlay: (trackId: string) => void;
    tracks: SoundTrack[];
}

export const Reflections: React.FC<ReflectionsProps> = ({
    onSave,
    isDarkMode,
    currentTrackId,
    isPlaying,
    onTogglePlay,
    tracks
}) => {
    const [highlight, setHighlight] = useState('');
    const [midpoint, setMidpoint] = useState('');
    const [lowlight, setLowlight] = useState('');
    const [savedToday, setSavedToday] = useState(false);
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [isListening, setIsListening] = useState<'highlight' | 'midpoint' | 'lowlight' | null>(null);

    // Check if already journaled today
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const saved = localStorage.getItem(`motiv8_journal_${today}`);
        if (saved) {
            const entry = JSON.parse(saved);
            setHighlight(entry.highlight);
            setMidpoint(entry.midpoint);
            setLowlight(entry.lowlight);
            setSavedToday(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const today = new Date().toISOString().split('T')[0];
        const entry: JournalEntry = {
            id: today,
            date: today,
            highlight,
            midpoint,
            lowlight,
        };

        console.log('Reflections component - submitting entry:', entry);
        localStorage.setItem(`motiv8_journal_${today}`, JSON.stringify(entry));

        // ALWAYS call onSave to update parent state
        onSave(entry);
        setSavedToday(true);
    };

    const startDictation = (field: 'highlight' | 'midpoint' | 'lowlight') => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(field);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;

            // Append to existing text
            if (field === 'highlight') {
                setHighlight(prev => prev ? `${prev} ${transcript}` : transcript);
            } else if (field === 'midpoint') {
                setMidpoint(prev => prev ? `${prev} ${transcript}` : transcript);
            } else if (field === 'lowlight') {
                setLowlight(prev => prev ? `${prev} ${transcript}` : transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(null);
        };

        recognition.onend = () => {
            setIsListening(null);
        };

        recognition.start();
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';

    const borderClass = isDarkMode ? 'border-white/10' : 'border-sage/20';
    const inputBg = isDarkMode ? 'bg-white/5' : 'bg-white/50';
    const inputText = isDarkMode ? 'text-white placeholder-white/30' : 'text-warm-gray-green placeholder-warm-gray-green/40';

    return (
        <div className="w-full min-h-screen p-8 flex flex-col animate-fade-in">
            {/* Header */}
            <div className={`flex items-center justify-between mb-12 pb-6 border-b ${borderClass}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-sage/10 text-sage'}`}>
                        <Calendar size={24} />
                    </div>
                    <h2 className={`text-3xl font-display font-medium ${textPrimary}`}>Daily Reflections</h2>
                </div>

                {/* Audio Menu Toggle */}
                <div className="relative">
                    <button
                        onClick={() => setShowAudioMenu(!showAudioMenu)}
                        className={`tap-zone p-4 rounded-full transition-all ${isPlaying
                            ? isDarkMode ? 'bg-white text-warm-gray-green animate-pulse-glow' : 'bg-sage text-white animate-pulse-glow'
                            : isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                    >
                        <Music size={24} />
                    </button>

                    {showAudioMenu && (
                        <div className={`absolute right-0 top-16 w-72 p-6 rounded-card shadow-spa-lg z-50 border backdrop-blur-xl ${isDarkMode ? 'bg-warm-gray-green/95 border-white/10' : 'bg-white/95 border-sage/20'}`}>
                            <h3 className={`text-xs font-body font-bold uppercase tracking-widest mb-4 ${textPrimary}`}>
                                Ambient Sounds
                            </h3>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {tracks.map(track => (
                                    <button
                                        key={track.id}
                                        onClick={() => onTogglePlay(track.id)}
                                        className={`tap-zone w-full flex items-center justify-between p-4 rounded-xl text-sm font-body transition-all ${currentTrackId === track.id
                                            ? isDarkMode ? 'bg-white text-warm-gray-green shadow-lg' : 'bg-sage text-white shadow-spa'
                                            : isDarkMode ? 'text-white/60 hover:bg-white/10' : 'text-warm-gray-green hover:bg-sage/10'
                                            }`}
                                    >
                                        <span>{track.name}</span>
                                        {currentTrackId === track.id && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reflection Form */}
            <form onSubmit={handleSubmit} className="space-y-8 flex-1 max-w-3xl mx-auto w-full">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className={`block text-sm font-body font-bold uppercase tracking-widest ${isDarkMode ? 'text-sage' : 'text-sage'}`}>High</label>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/60'}`}>What's working great? Your wins and highlights.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {highlight && (
                                <button
                                    type="button"
                                    onClick={() => setHighlight('')}
                                    className={`tap-zone p-2 rounded-full transition-all flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                                    title="Clear"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => startDictation('highlight')}
                                className={`tap-zone p-2 rounded-full transition-all flex items-center justify-center ${isListening === 'highlight'
                                    ? 'bg-sage text-white animate-pulse'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                    }`}
                                title="Voice Dictation"
                            >
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={highlight}
                        onChange={(e) => setHighlight(e.target.value)}
                        placeholder="Write here..."
                        className={`w-full p-6 rounded-card border-2 outline-none min-h-[120px] transition-all resize-none font-body text-lg ${inputBg} ${inputText} ${isDarkMode ? 'border-white/10 focus:border-sage' : 'border-sage/20 focus:border-sage'}`}
                    />
                </div>

                {/* Mid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className={`block text-sm font-body font-bold uppercase tracking-widest ${isDarkMode ? 'text-pale-gold' : 'text-pale-gold'}`}>Mid</label>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/60'}`}>What's working but could be better? Areas for improvement.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {midpoint && (
                                <button
                                    type="button"
                                    onClick={() => setMidpoint('')}
                                    className={`tap-zone p-2 rounded-full transition-all flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'}`}
                                    title="Clear"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => startDictation('midpoint')}
                                className={`tap-zone p-2 rounded-full transition-all flex items-center justify-center ${isListening === 'midpoint'
                                    ? 'bg-pale-gold text-white animate-pulse'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'
                                    }`}
                                title="Voice Dictation"
                            >
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={midpoint}
                        onChange={(e) => setMidpoint(e.target.value)}
                        placeholder="Write here..."
                        className={`w-full p-6 rounded-card border-2 outline-none min-h-[120px] transition-all resize-none font-body text-lg ${inputBg} ${inputText} ${isDarkMode ? 'border-white/10 focus:border-pale-gold' : 'border-pale-gold/20 focus:border-pale-gold'}`}
                    />
                </div>

                {/* Low */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className={`block text-sm font-body font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green'}`}>Low</label>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/60'}`}>What needs more time and attention? Challenges to address.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {lowlight && (
                                <button
                                    type="button"
                                    onClick={() => setLowlight('')}
                                    className={`tap-zone p-2 rounded-full transition-all flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-warm-gray-green/10 text-warm-gray-green hover:bg-warm-gray-green/20'}`}
                                    title="Clear"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => startDictation('lowlight')}
                                className={`tap-zone p-2 rounded-full transition-all flex items-center justify-center ${isListening === 'lowlight'
                                    ? 'bg-warm-gray-green text-white animate-pulse'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-warm-gray-green/10 text-warm-gray-green hover:bg-warm-gray-green/20'
                                    }`}
                                title="Voice Dictation"
                            >
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={lowlight}
                        onChange={(e) => setLowlight(e.target.value)}
                        placeholder="Write here..."
                        className={`w-full p-6 rounded-card border-2 outline-none min-h-[120px] transition-all resize-none font-body text-lg ${inputBg} ${inputText} ${isDarkMode ? 'border-white/10 focus:border-white/40' : 'border-warm-gray-green/20 focus:border-warm-gray-green'}`}
                    />
                </div>

                {/* Save/Update Buttons */}
                <div className="flex gap-4">
                    {!savedToday ? (
                        <button
                            type="submit"
                            className={`tap-zone flex-1 flex items-center justify-center gap-3 py-5 px-8 rounded-full font-display font-medium text-lg transition-all shadow-spa ${isDarkMode ? 'bg-white text-warm-gray-green hover:scale-105' : 'bg-sage text-white hover:shadow-spa-lg hover:scale-105'
                                }`}
                        >
                            <Save size={20} /> Save Reflection
                        </button>
                    ) : (
                        <>
                            <button
                                type="submit"
                                className={`tap-zone flex-1 flex items-center justify-center gap-3 py-5 px-8 rounded-full font-display font-medium text-lg transition-all shadow-spa ${isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:scale-105' : 'bg-pale-gold text-white hover:shadow-spa-lg hover:scale-105'
                                    }`}
                            >
                                <Save size={20} /> Update Reflection
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setHighlight('');
                                    setMidpoint('');
                                    setLowlight('');
                                    setSavedToday(false);
                                }}
                                className={`tap-zone px-8 py-5 rounded-full font-display font-medium text-lg transition-all ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                    }`}
                            >
                                Start Fresh
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};
