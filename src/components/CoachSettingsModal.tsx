import React, { useState } from 'react';
import { Settings, Check } from 'lucide-react';
import type { CoachSettings } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';

interface CoachSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: CoachSettings;
    onSave: (settings: CoachSettings) => void;
    onToggleTheme?: () => void;
}

export const CoachSettingsModal: React.FC<CoachSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
}) => {
    const { isDarkMode } = useTheme();
    const [localSettings, setLocalSettings] = useState<CoachSettings>(settings);

    // Auto-save on change
    const updateLocalSetting = (newSettings: CoachSettings) => {
        haptics.light();
        setLocalSettings(newSettings);
        onSave(newSettings);
    };

    const frequencies = [
        { value: 'hourly' as const, label: 'Every hour', description: 'Real-time accountability' },
        { value: 'every-2-hours' as const, label: 'Every 2 hours', description: 'Twice per day' },
        { value: 'every-4-hours' as const, label: 'Every 4 hours', description: 'High-level check-ins' },
        { value: 'morning-evening' as const, label: 'Morning & Evening', description: 'Day start/end only' },
        { value: 'off' as const, label: 'Off', description: 'No automatic nudges' }
    ];

    const textPrimary = 'text-white';
    const accentLabel = 'text-white/60 font-black text-[10px] uppercase tracking-[0.2em]';

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode}>
            <div className="p-8 pb-12">
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.12] text-white flex items-center justify-center shadow-sm">
                            <Settings size={28} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-display font-medium ${textPrimary}`}>
                                Coach Settings
                            </h2>
                            <p className={`text-[11px] font-black uppercase tracking-wider text-white/60`}>
                                Personalize your guidance
                            </p>
                        </div>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${textPrimary}`}>
                        Customize how often your Palante Coach checks in.
                    </p>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="mb-12 space-y-6">
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-3xl bg-white/[0.08] border border-white/10">
                        <span className={`text-base font-bold uppercase tracking-wide ${textPrimary}`}>
                            Enable Nudges
                        </span>
                        <button
                            onClick={() => updateLocalSetting({ ...localSettings, nudgeEnabled: !localSettings.nudgeEnabled })}
                            className={`relative w-14 h-8 rounded-full transition-all border-2 ${localSettings.nudgeEnabled
                                ? 'bg-white/[0.15] border-white/20 shadow-inner'
                                : 'bg-black/5 border-white/10'
                                }`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all shadow-md ${localSettings.nudgeEnabled ? 'left-6.5 bg-[#E5D6A7]' : 'left-0.5 bg-white/30'}`} />
                        </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-3xl bg-white/[0.08] border border-white/10">
                        <span className={`text-base font-bold uppercase tracking-wide ${textPrimary}`}>
                            Enable Daily Tips
                        </span>
                        <button
                            onClick={() => updateLocalSetting({ ...localSettings, tipsEnabled: !localSettings.tipsEnabled })}
                            className={`relative w-14 h-8 rounded-full transition-all border-2 ${localSettings.tipsEnabled
                                ? 'bg-white/[0.15] border-white/20 shadow-inner'
                                : 'bg-black/5 border-white/10'
                                }`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all shadow-md ${localSettings.tipsEnabled ? 'left-6.5 bg-[#E5D6A7]' : 'left-0.5 bg-white/30'}`} />
                        </button>
                    </label>
                </div>

                {/* Frequency Options */}
                {localSettings.nudgeEnabled && (
                    <div className="space-y-4 mb-12">
                        <label className={accentLabel}>
                            Nudge Frequency
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {frequencies.map((freq) => (
                                <button
                                    key={freq.value}
                                    onClick={() => updateLocalSetting({ ...localSettings, nudgeFrequency: freq.value })}
                                    className={`w-full group p-5 rounded-[2rem] border-2 text-left transition-all ${localSettings.nudgeFrequency === freq.value
                                        ? 'bg-white/[0.06] border-[#E5D6A7] shadow-lg scale-[1.02]'
                                        : 'bg-white/[0.06] border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className={`font-black uppercase tracking-wider text-xs mb-1 ${textPrimary}`}>
                                                {freq.label}
                                            </div>
                                            <div className={`text-[11px] font-medium transition-opacity ${localSettings.nudgeFrequency === freq.value ? 'text-white' : 'text-white/60'}`}>
                                                {freq.description}
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${localSettings.nudgeFrequency === freq.value
                                            ? 'bg-white/[0.15] border-white/20'
                                            : 'border-white/20 bg-black/5'
                                            }`}>
                                            {localSettings.nudgeFrequency === freq.value && <Check size={16} strokeWidth={4} className="text-[#E5D6A7]" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={() => { haptics.light(); onClose(); }}
                    className="w-full py-5 rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] bg-white/[0.15] text-white shadow-xl shadow-black/10 transition-all active:scale-95"
                >
                    Save Preferences
                </button>
            </div>
        </SlideUpModal>
    );
};
