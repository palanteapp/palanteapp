import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Music, CloudLightning, Coffee, Minus, Plus } from 'lucide-react';
import { TRACKS, type SoundTrack } from '../data/audioTracks';

interface SoundMixerProps {
    isDarkMode: boolean;
    isVisible: boolean;
    onClose: () => void;
}

interface TrackState {
    isPlaying: boolean;
    volume: number;
}

export const SoundMixer: React.FC<SoundMixerProps> = ({ isDarkMode, isVisible, onClose }) => {
    // State to track playing status and volume for each track
    const [trackStates, setTrackStates] = useState<Record<string, TrackState>>(() => {
        const initial: Record<string, TrackState> = {};
        TRACKS.forEach(track => {
            initial[track.id] = { isPlaying: false, volume: 0.5 };
        });
        return initial;
    });

    // Refs to hold Audio objects to persist between renders
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        // Initialize Audio objects
        TRACKS.forEach(track => {
            if (!audioRefs.current[track.id]) {
                const audio = new Audio(track.url);
                audio.loop = true;
                audio.volume = 0.5;
                audioRefs.current[track.id] = audio;
            }
        });

        // Cleanup on unmount
        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        };
    }, []);

    const toggleTrack = (trackId: string) => {
        setTrackStates(prev => {
            const newState = { ...prev };
            const isPlaying = !newState[trackId].isPlaying;
            newState[trackId] = { ...newState[trackId], isPlaying };

            const audio = audioRefs.current[trackId];
            if (audio) {
                if (isPlaying) {
                    audio.play().catch(e => console.error("Audio play failed", e));
                } else {
                    audio.pause();
                }
            }
            return newState;
        });
    };

    const updateVolume = (trackId: string, newVolume: number) => {
        const volume = Math.max(0, Math.min(1, newVolume));
        setTrackStates(prev => ({
            ...prev,
            [trackId]: { ...prev[trackId], volume }
        }));

        const audio = audioRefs.current[trackId];
        if (audio) {
            audio.volume = volume;
        }
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'rain': return CloudRain;
            case 'thunder': return CloudLightning;
            case 'cafe': return Coffee;
            default: return Music; // Fallback for Ocean/others
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Mixer Panel */}
            <div
                className={`w-full max-w-md pointer-events-auto transform transition-all duration-300 animate-slide-up-fade p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl border ${isDarkMode
                    ? 'bg-warm-gray-green/95 border-white/10 text-white'
                    : 'bg-white/95 border-sage/20 text-warm-gray-green'
                    }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-medium">Soundscape Mixer</h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full hover:bg-black/5 ${isDarkMode ? 'hover:bg-white/10' : ''}`}
                    >
                        <VolumeX size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {TRACKS.map(track => {
                        const Icon = getIcon(track.id);
                        const state = trackStates[track.id];

                        return (
                            <div key={track.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => toggleTrack(track.id)}
                                        className={`flex items-center gap-3 transition-opacity ${state.isPlaying ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className={`p-2 rounded-full ${state.isPlaying
                                            ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                            : isDarkMode ? 'bg-white/10' : 'bg-sage/10'
                                            }`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className="font-medium">{track.name}</span>
                                    </button>

                                    {state.isPlaying && (
                                        <span className="text-xs font-mono opacity-60">
                                            {Math.round(state.volume * 100)}%
                                        </span>
                                    )}
                                </div>

                                {/* Volume Slider */}
                                <div className={`flex items-center gap-3 transition-all duration-300 ${state.isPlaying ? 'h-6 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                                    <button
                                        onClick={() => updateVolume(track.id, state.volume - 0.1)}
                                        className="p-1 opacity-60 hover:opacity-100"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={state.volume}
                                        onChange={(e) => updateVolume(track.id, parseFloat(e.target.value))}
                                        className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`}
                                        style={{ accentColor: isDarkMode ? '#E5D6A7' : '#B5C2A3' }}
                                    />
                                    <button
                                        onClick={() => updateVolume(track.id, state.volume + 0.1)}
                                        className="p-1 opacity-60 hover:opacity-100"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 text-center">
                    <p className={`text-xs opacity-50 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                        Mix sounds to create your perfect sanctuary
                    </p>
                </div>
            </div>
        </div>
    );
};
