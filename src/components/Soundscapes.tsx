import React, { useState, useEffect } from 'react';
import { Play, Pause, Lightbulb, Target } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import type { SoundTrack } from '../data/audioTracks';

interface SoundscapesProps {
    currentTrackId: string | null;
    isPlaying: boolean;
    onTogglePlay: (trackId: string) => void;
    tracks: SoundTrack[];
    isDarkMode: boolean;
    tipsEnabled?: boolean;
    onShowTip?: () => void;
}

export const Soundscapes: React.FC<SoundscapesProps> = ({
    currentTrackId,
    isPlaying,
    onTogglePlay,
    tracks,
    isDarkMode,
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

    // ── Theme tokens — amber/sage accent palette ──────────────────────
    const text      = isDarkMode ? 'text-white'      : 'text-sage-dark';
    const subText   = isDarkMode ? 'text-white/50'   : 'text-sage-dark/60';
    const labelText = isDarkMode ? 'text-pale-gold'      : 'text-terracotta-500';   // rich yellow / burnt orange
    const cardBg    = isDarkMode ? 'bg-white/5 border-white/10'  : 'bg-white/60 border-sage/20';
    const cardActive = isDarkMode
        ? 'bg-pale-gold/10 border-pale-gold/40 shadow-[0_0_20px_rgba(212,148,58,0.15)]'
        : 'bg-terracotta-500/10 border-terracotta-500/50 shadow-spa';
    const toggleBg  = isDarkMode ? 'bg-white/5'      : 'bg-sage/10';
    const toggleActive = isDarkMode
        ? 'bg-pale-gold text-sage-dark shadow-[0_2px_8px_rgba(212,148,58,0.3)]'
        : 'bg-terracotta-500 text-white shadow-spa';
    const toggleInactive = isDarkMode ? 'text-white/40 hover:text-white' : 'text-sage/60 hover:text-sage';
    const playBtnActive = 'bg-terracotta-500 text-white hover:scale-105';
    const playBtnIdle   = isDarkMode ? 'bg-white/10 text-white/70' : 'bg-sage/10 text-sage';
    const sectionCard   = isDarkMode
        ? 'bg-white/5 border-white/10'
        : 'bg-gradient-to-br from-terracotta-500/5 to-transparent border-terracotta-500/20';
    const mantraCard    = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    return (
        <div className="w-full min-h-screen p-6 flex flex-col animate-fade-in">

            {/* Header */}
            <div className="text-center mb-8">
                <h2 className={`text-3xl font-display font-medium mb-2 ${text}`}>
                    Soundscape & Meditation
                </h2>
                <div className="flex items-center justify-center gap-3">
                    <p className={`text-sm font-body ${subText}`}>Find your calm</p>
                    {tipsEnabled !== false && (
                        <>
                            <button
                                onClick={() => onShowTip?.()}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    isDarkMode
                                        ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                        : 'bg-sage/10 text-sage hover:bg-sage/20'
                                }`}
                                title="The Science"
                            >
                                <Lightbulb size={12} strokeWidth={2.5} />
                                <span>The Science</span>
                            </button>
                            <button
                                onClick={() => onShowTip?.()}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    isDarkMode ? 'text-pale-gold hover:opacity-80' : 'text-pale-gold-600 hover:opacity-80'
                                }`}
                            >
                                <Target size={12} strokeWidth={2.5} />
                                <span>Optimization Tip</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Category Toggle */}
            <div className={`flex gap-2 mb-6 p-1 ${toggleBg} rounded-full`}>
                <button
                    onClick={() => setCategory('ambient')}
                    className={`flex-1 py-2 px-4 rounded-full font-body font-medium transition-all ${
                        category === 'ambient' ? toggleActive : toggleInactive
                    }`}
                >
                    Ambient Sounds
                </button>
                <button
                    onClick={() => setCategory('binaural')}
                    className={`flex-1 py-2 px-4 rounded-full font-body font-medium transition-all ${
                        category === 'binaural' ? toggleActive : toggleInactive
                    }`}
                >
                    Binaural Beats
                </button>
            </div>

            {/* Ambient Sounds */}
            {category === 'ambient' && (
                <div className="mb-8">
                    <h3 className={`text-sm font-body font-bold uppercase tracking-widest mb-4 ${labelText}`}>
                        Ambient Sounds
                    </h3>
                    <div className="flex flex-col gap-3">
                        {tracks.map(track => {
                            const active = currentTrackId === track.id && isPlaying;
                            return (
                                <button
                                    key={track.id}
                                    onClick={() => onTogglePlay(track.id)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                                        active ? cardActive : `${cardBg} hover:border-sage/40 hover:shadow-spa`
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`font-display font-medium transition-colors ${
                                            active
                                                ? isDarkMode ? 'text-white' : 'text-sage'
                                                : isDarkMode ? 'text-white/80 group-hover:text-white' : 'text-sage-dark group-hover:text-sage'
                                        }`}>
                                            {track.name}
                                        </span>
                                        <div className={`p-2 rounded-full transition-colors ${active ? playBtnActive : playBtnIdle}`}>
                                            {active ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Binaural Beats */}
            {category === 'binaural' && (
                <div className="mb-8">
                    <h3 className={`text-sm font-body font-bold uppercase tracking-widest mb-4 ${labelText}`}>
                        Binaural Beats
                    </h3>
                    <p className={`text-xs mb-4 ${subText}`}>
                        Frequency-based soundscapes for focus, relaxation, and meditation
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'delta', name: 'Delta (1–4 Hz)',   description: 'Deep sleep & healing',      color: isDarkMode ? 'text-indigo-400' : 'text-indigo-600' },
                            { id: 'theta', name: 'Theta (4–8 Hz)',   description: 'Meditation & creativity',   color: isDarkMode ? 'text-purple-400' : 'text-purple-600' },
                            { id: 'alpha', name: 'Alpha (8–12 Hz)',  description: 'Relaxation & learning',     color: isDarkMode ? 'text-blue-400'   : 'text-blue-600'   },
                            { id: 'beta',  name: 'Beta (12–30 Hz)',  description: 'Focus & alertness',         color: isDarkMode ? 'text-emerald-400': 'text-emerald-600' },
                            { id: 'gamma', name: 'Gamma (30–100 Hz)',description: 'Peak performance',          color: isDarkMode ? 'text-pale-gold-400'  : 'text-pale-gold-600'  },
                        ].map(beat => {
                            const active = currentTrackId === beat.id && isPlaying;
                            return (
                                <button
                                    key={beat.id}
                                    onClick={() => onTogglePlay(beat.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        active ? cardActive : `${cardBg} hover:border-sage/40 hover:shadow-spa`
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className={`font-display font-medium mb-1 ${beat.color}`}>
                                                {beat.name}
                                            </div>
                                            <div className={`text-xs ${subText}`}>{beat.description}</div>
                                        </div>
                                        <div className={`ml-4 p-2 rounded-full ${active ? playBtnActive : playBtnIdle}`}>
                                            {active ? <Pause size={16} /> : <Play size={16} />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mantra Generator */}
            <div className={`p-6 rounded-card border shadow-spa ${sectionCard}`}>
                <h3 className={`text-sm font-body font-bold uppercase tracking-widest mb-4 ${labelText}`}>
                    Guided Meditation
                </h3>
                {!showMantraGenerator ? (
                    <button
                        onClick={() => { setShowMantraGenerator(true); generateMantra(); }}
                        className={`w-full py-4 px-6 rounded-full font-display font-medium shadow-spa hover:shadow-spa-lg transition-all ${
                            isDarkMode
                                ? 'bg-white/15 text-white hover:bg-white/25'
                                : 'bg-pale-gold text-sage-dark'
                        }`}
                    >
                        Generate Mantra
                    </button>
                ) : (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-card border ${mantraCard}`}>
                            <p className={`text-xl font-display font-medium text-center leading-relaxed ${text}`}>
                                "{mantra}"
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={generateMantra}
                                className={`flex-1 py-3 px-4 rounded-full border-2 font-body font-medium transition-all ${
                                    isDarkMode
                                        ? 'border-white/20 text-white/70 hover:bg-white/10'
                                        : 'border-sage/30 text-sage hover:bg-sage/10'
                                }`}
                            >
                                New Mantra
                            </button>
                            <button
                                onClick={() => setShowMantraGenerator(false)}
                                className={`flex-1 py-3 px-4 rounded-full font-body font-medium shadow-spa hover:shadow-spa-lg transition-all ${
                                    isDarkMode
                                        ? 'bg-white/15 text-white hover:bg-white/25'
                                        : 'bg-pale-gold text-sage-dark'
                                }`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Meditation Timer (Coming Soon) */}
            <div className={`mt-6 p-6 rounded-card border ${sectionCard}`}>
                <h3 className={`text-sm font-body font-bold uppercase tracking-widest mb-3 ${labelText}`}>
                    Meditation Timer
                </h3>
                <p className={`text-sm font-body mb-4 ${subText}`}>
                    Coming soon: Customizable meditation sessions with guided breathing
                </p>
                <div className="flex gap-3">
                    {['5 min', '10 min', '15 min', '20 min'].map(time => (
                        <button
                            key={time}
                            className={`flex-1 py-3 rounded-xl font-body text-sm font-medium transition-all opacity-40 cursor-not-allowed ${
                                isDarkMode ? 'bg-white/10 text-white' : 'bg-sage/10 text-sage'
                            }`}
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
