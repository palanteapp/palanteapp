import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings } from 'lucide-react';
import type { CoachSettings } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CoachSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: CoachSettings;
    onSave: (settings: CoachSettings) => void;
}

export const CoachSettingsModal: React.FC<CoachSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
}) => {
    const { isDarkMode, toggleDarkMode: onToggleTheme } = useTheme();
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

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#3A1700]/50 backdrop-blur-xl transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative max-w-md w-full max-h-[90vh] overflow-y-auto p-8 rounded-[2.5rem] shadow-spa-lg transition-all duration-500 ${isDarkMode ? 'bg-sage-mid/95 border border-white/10' : 'bg-white/95 border border-sage/20'}`}
                style={{
                    boxShadow: isDarkMode
                        ? '0 0 80px 20px rgba(0, 0, 0, 0.4), 0 0 150px 40px rgba(111, 123, 109, 0.2), 0 0 250px 60px rgba(111, 123, 109, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.02)'
                        : '0 0 80px 20px rgba(0, 0, 0, 0.1), 0 0 150px 40px rgba(111, 123, 109, 0.15), 0 0 250px 60px rgba(111, 123, 109, 0.08), inset 0 0 60px rgba(255, 255, 255, 0.6)'
                }}
            >


                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <Settings size={28} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        <h2 className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'
                            }`}>
                            Coach Settings
                        </h2>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                        Customize how often your accountability coach checks in
                    </p>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="mb-8 space-y-6">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Enable Nudges
                        </span>
                        <button
                            onClick={() => setLocalSettings({ ...localSettings, nudgeEnabled: !localSettings.nudgeEnabled })}
                            className={`relative w-14 h-8 rounded-full transition-all ${localSettings.nudgeEnabled
                                ? isDarkMode ? 'bg-pale-gold' : 'bg-sage'
                                : isDarkMode ? 'bg-white/20' : 'bg-sage/20'
                                }`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${localSettings.nudgeEnabled ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Enable Daily Tips
                        </span>
                        <button
                            onClick={() => setLocalSettings({ ...localSettings, tipsEnabled: !localSettings.tipsEnabled })}
                            className={`relative w-14 h-8 rounded-full transition-all ${localSettings.tipsEnabled
                                ? isDarkMode ? 'bg-pale-gold' : 'bg-sage'
                                : isDarkMode ? 'bg-white/20' : 'bg-sage/20'
                                }`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${localSettings.tipsEnabled ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </label>

                    {/* Theme Toggle */}
                    <label className="flex items-center justify-between cursor-pointer pt-6 border-t border-dashed border-white/10">
                        <span className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Dark Mode
                        </span>
                        <button
                            onClick={onToggleTheme}
                            className={`relative w-14 h-8 rounded-full transition-all ${isDarkMode
                                ? 'bg-pale-gold'
                                : 'bg-sage/20'
                                }`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${isDarkMode ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </label>
                </div>

                {/* Frequency Options */}
                {localSettings.nudgeEnabled && (
                    <div className="space-y-3 mb-8">
                        <label className={`text-sm font-medium uppercase tracking-wider opacity-80 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Nudge Frequency
                        </label>
                        {frequencies.map((freq) => (
                            <button
                                key={freq.value}
                                onClick={() => setLocalSettings({ ...localSettings, nudgeFrequency: freq.value })}
                                className={`w-full p-5 rounded-2xl border text-left transition-all ${localSettings.nudgeFrequency === freq.value
                                    ? isDarkMode
                                        ? 'bg-pale-gold/20 border-pale-gold text-white'
                                        : 'bg-sage/20 border-sage text-sage'
                                    : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        : 'bg-white border-sage/20 text-sage-dark/60 hover:bg-sage/10'
                                    }`}
                            >
                                <div className="font-medium mb-1">{freq.label}</div>
                                <div className="text-sm opacity-70">{freq.description}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className={`w-full py-4 px-6 rounded-2xl text-lg font-medium transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${isDarkMode
                        ? 'bg-pale-gold text-sage-dark'
                        : 'bg-terracotta-500 text-white'
                        }`}
                >
                    Save Settings
                </button>
            </div>
        </div>,
        document.body
    );
};
