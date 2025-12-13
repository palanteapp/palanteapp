import React from 'react';
import { VolumeX, Music } from 'lucide-react';

interface SoundMixerProps {
    isDarkMode: boolean;
    isVisible: boolean;
    onClose: () => void;
}

export const SoundMixer: React.FC<SoundMixerProps> = ({ isDarkMode, isVisible, onClose }) => {
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
                className={`relative z-10 w-full max-w-md pointer-events-auto transform transition-all duration-300 animate-slide-up-fade p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl border ${isDarkMode
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

                {/* Coming Soon Message */}
                <div className="text-center py-12">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'
                        }`}>
                        <Music size={32} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    </div>
                    <h4 className={`text-lg font-display font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'
                        }`}>
                        Ambient Sounds Coming Soon
                    </h4>
                    <p className={`text-sm opacity-60 max-w-xs mx-auto ${isDarkMode ? 'text-white' : 'text-warm-gray-green'
                        }`}>
                        We're curating a collection of soothing soundscapes to enhance your experience.
                    </p>
                </div>
            </div>
        </div>
    );
};
