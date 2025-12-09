import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import type { CoachSettings } from '../types';

interface CoachSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: CoachSettings;
    onSave: (settings: CoachSettings) => void;
    isDarkMode: boolean;
}

export const CoachSettingsModal: React.FC<CoachSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
    isDarkMode
}) => {
    const [localSettings, setLocalSettings] = useState<CoachSettings>(settings);

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    const frequencies = [
        { value: 'hourly' as const, label: 'Every hour', description: 'Check in every hour' },
        { value: 'every-2-hours' as const, label: 'Every 2 hours', description: 'Check in twice per day' },
        { value: 'every-4-hours' as const, label: 'Every 4 hours', description: 'Check in 2-3 times per day' },
        { value: 'morning-evening' as const, label: 'Morning & Evening', description: 'Start and end of day only' },
        { value: 'off' as const, label: 'Off', description: 'No automatic nudges' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative max-w-md w-full p-8 rounded-3xl shadow-spa-lg ${isDarkMode ? 'bg-warm-gray-green border border-white/10' : 'bg-white border border-sage/20'
                }`}>
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'
                        }`}
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings size={24} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        <h2 className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'
                            }`}>
                            Coach Settings
                        </h2>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                        Customize how often your accountability coach checks in
                    </p>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="mb-6">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                            Enable Nudges
                        </span>
                        <button
                            onClick={() => setLocalSettings({ ...localSettings, nudgeEnabled: !localSettings.nudgeEnabled })}
                            className={`relative w-12 h-6 rounded-full transition-all ${localSettings.nudgeEnabled
                                ? isDarkMode ? 'bg-pale-gold' : 'bg-sage'
                                : isDarkMode ? 'bg-white/20' : 'bg-sage/20'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.nudgeEnabled ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </label>
                </div>

                {/* Frequency Options */}
                {localSettings.nudgeEnabled && (
                    <div className="space-y-3 mb-6">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                            Nudge Frequency
                        </label>
                        {frequencies.map((freq) => (
                            <button
                                key={freq.value}
                                onClick={() => setLocalSettings({ ...localSettings, nudgeFrequency: freq.value })}
                                className={`w-full p-4 rounded-xl border text-left transition-all ${localSettings.nudgeFrequency === freq.value
                                    ? isDarkMode
                                        ? 'bg-pale-gold/20 border-pale-gold text-white'
                                        : 'bg-sage/20 border-sage text-sage'
                                    : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        : 'bg-white border-sage/20 text-warm-gray-green/60 hover:bg-sage/10'
                                    }`}
                            >
                                <div className="font-medium mb-1">{freq.label}</div>
                                <div className="text-xs opacity-70">{freq.description}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${isDarkMode
                        ? 'bg-pale-gold text-warm-gray-green hover:scale-105'
                        : 'bg-sage text-white hover:scale-105'
                        }`}
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
};
