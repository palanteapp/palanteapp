import { useState, useEffect } from 'react';
import { Play, Pause, Lightbulb, Target } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import type { SoundTrack } from '../data/audioTracks';

interface SoundscapesProps {
    currentTrackId: string | null;
    isPlaying: boolean;
    onTogglePlay: (trackId: string) => void;
    tracks: SoundTrack[];
    isDarkMode: boolean; // This was missing in file read? The component signature used it? No, in file read it HAD isDarkMode in interface!
    // Wait, line 13: isDarkMode: boolean;
    // So I should keep it.
    tipsEnabled?: boolean;
    onShowTip?: () => void;
}

export const Soundscapes: React.FC<SoundscapesProps> = ({
    currentTrackId,
    isPlaying,
    onTogglePlay,
    tracks,
    tipsEnabled = true,
    onShowTip
}) => {
    const [mantra, setMantra] = useState('');
    const [showMantraGenerator, setShowMantraGenerator] = useState(false);
    const [category, setCategory] = useState<'ambient' | 'binaural'>('ambient');

    useEffect(() => {
        if (isPlaying) {
            KeepAwake.keepAwake().catch(console.error);
        }
    }, [isPlaying]);

    const generateMantra = () => {
        const mantras = [
            "I am moving forward with calm clarity",
            "Each breath brings me closer to my goals",
            "I embrace this moment with gratitude",
            "My potential is limitless",
            "I am exactly where I need to be",
            "Peace flows through me",
            "I trust the journey",
            "I am worthy of all good things"
        ];
        setMantra(mantras[Math.floor(Math.random() * mantras.length)]);
    };

    return (
        <div className="w-full min-h-screen p-6 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-medium text-sage mb-2">Soundscape & Meditation</h2>
                <div className="flex items-center justify-center gap-3">
                    <p className="text-sm font-body text-warm-gray-green/60">Find your calm</p>
                    {tipsEnabled !== false && (
                        <>
                            <button
                                onClick={() => onShowTip?.()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-sage/10 text-sage hover:bg-sage/20"
                                title="The Science"
                            >
                                <Lightbulb size={12} strokeWidth={2.5} />
                                <span>The Science</span>
                            </button>
                            <button
                                onClick={() => onShowTip?.()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all text-pale-gold hover:opacity-80"
                            >
                                <Target size={12} strokeWidth={2.5} />
                                <span>Optimization Tip</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Category Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-sage/10 rounded-full">
                <button
                    onClick={() => setCategory('ambient')}
                    className={`flex-1 py-2 px-4 rounded-full font-body font-medium transition-all ${category === 'ambient'
                        ? 'bg-sage text-white shadow-spa'
                        : 'text-sage/60 hover:text-sage'
                        }`}
                >
                    Ambient Sounds
                </button>
                <button
                    onClick={() => setCategory('binaural')}
                    className={`flex-1 py-2 px-4 rounded-full font-body font-medium transition-all ${category === 'binaural'
                        ? 'bg-sage text-white shadow-spa'
                        : 'text-sage/60 hover:text-sage'
                        }`}
                >
                    Binaural Beats
                </button>
            </div>

            {/* Ambient Sounds */}
            {category === 'ambient' && (
                <div className="mb-8">
                    <h3 className="text-sm font-body font-bold uppercase tracking-widest text-sage mb-4">Ambient Sounds</h3>
                    <div className="flex flex-col gap-3">
                        {tracks.map(track => (
                            <button
                                key={track.id}
                                onClick={() => onTogglePlay(track.id)}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${currentTrackId === track.id && isPlaying
                                    ? 'bg-sage/10 border-sage shadow-spa'
                                    : 'bg-white/60 border-sage/20 hover:border-sage/40 hover:shadow-spa'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-display font-medium text-warm-gray-green group-hover:text-sage transition-colors">{track.name}</span>

                                    <div className={`p-2 rounded-full transition-colors ${currentTrackId === track.id && isPlaying ? 'bg-sage text-white' : 'bg-sage/10 text-sage'}`}>
                                        {currentTrackId === track.id && isPlaying ? (
                                            <Pause size={18} />
                                        ) : (
                                            <Play size={18} className="translate-x-0.5" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Binaural Beats */}
            {category === 'binaural' && (
                <div className="mb-8">
                    <h3 className="text-sm font-body font-bold uppercase tracking-widest text-sage mb-4">Binaural Beats</h3>
                    <p className="text-xs text-warm-gray-green/60 mb-4">Frequency-based soundscapes for focus, relaxation, and meditation</p>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'delta', name: 'Delta (1-4 Hz)', description: 'Deep sleep & healing', color: 'text-indigo-500' },
                            { id: 'theta', name: 'Theta (4-8 Hz)', description: 'Meditation & creativity', color: 'text-purple-500' },
                            { id: 'alpha', name: 'Alpha (8-12 Hz)', description: 'Relaxation & learning', color: 'text-blue-500' },
                            { id: 'beta', name: 'Beta (12-30 Hz)', description: 'Focus & alertness', color: 'text-green-500' },
                            { id: 'gamma', name: 'Gamma (30-100 Hz)', description: 'Peak performance', color: 'text-amber-500' },
                        ].map(beat => (
                            <button
                                key={beat.id}
                                onClick={() => onTogglePlay(beat.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${currentTrackId === beat.id && isPlaying
                                    ? 'bg-sage/10 border-sage shadow-spa'
                                    : 'bg-white/60 border-sage/20 hover:border-sage/40 hover:shadow-spa'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className={`font-display font-medium mb-1 ${beat.color}`}>
                                            {beat.name}
                                        </div>
                                        <div className="text-xs text-warm-gray-green/60">
                                            {beat.description}
                                        </div>
                                    </div>
                                    <div className={`ml-4 p-2 rounded-full ${currentTrackId === beat.id && isPlaying ? 'bg-sage text-white' : 'bg-sage/10 text-sage'}`}>
                                        {currentTrackId === beat.id && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Mantra Generator */}
            <div className="p-6 rounded-card bg-gradient-sage-subtle border border-sage/20 shadow-spa">
                <h3 className="text-sm font-body font-bold uppercase tracking-widest text-sage mb-4">Guided Meditation</h3>

                {!showMantraGenerator ? (
                    <button
                        onClick={() => {
                            setShowMantraGenerator(true);
                            generateMantra();
                        }}
                        className="tap -zone w-full py-4 px-6 rounded-full bg-sage text-white font-display font-medium shadow-spa hover:shadow-spa-lg transition-all"
                    >
                        Generate Mantra
                    </button>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 rounded-card bg-white/60 border border-sage/20">
                            <p className="text-xl font-display font-medium text-warm-gray-green text-center leading-relaxed">
                                "{mantra}"
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={generateMantra}
                                className="tap -zone flex-1 py-3 px-4 rounded-full border-2 border-sage/30 text-sage font-body font-medium hover:bg-sage/10 transition-all"
                            >
                                New Mantra
                            </button>
                            <button
                                onClick={() => setShowMantraGenerator(false)}
                                className="tap -zone flex-1 py-3 px-4 rounded-full bg-sage text-white font-body font-medium shadow-spa hover:shadow-spa-lg transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Meditation Timer (Placeholder) */}
            <div className="mt-6 p-6 rounded-card bg-white/50 border border-sage/20">
                <h3 className="text-sm font-body font-bold uppercase tracking-widest text-sage mb-3">Meditation Timer</h3>
                <p className="text-sm font-body text-warm-gray-green/60 mb-4">Coming soon: Customizable meditation sessions with guided breathing</p>
                <div className="flex gap-3">
                    {['5 min', '10 min', '15 min', '20 min'].map(time => (
                        <button
                            key={time}
                            className="tap -zone flex-1 py-3 rounded-xl bg-sage/10 text-sage font-body text-sm font-medium hover:bg-sage/20 transition-all"
                            disabled
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
