import React, { useState } from 'react';
import { Settings, Check } from 'lucide-react';
import type { CoachSettings, CoachTone } from '../types';
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
        { value: 'morning-evening' as const, label: 'Morning & Evening', description: 'One to open the day, one to close it. The most effective rhythm.' },
        { value: 'morning-only' as const, label: 'Morning only', description: 'A single nudge to set the tone. Simple and clean.' },
        { value: 'off' as const, label: 'Off', description: 'No automatic nudges.' },
    ];

    const textPrimary = 'text-white';
    const accentLabel = 'text-white font-black text-xs uppercase tracking-[0.2em]';

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
                                Partner Settings
                            </h2>
                            <p className={`text-xs font-black uppercase tracking-wider text-white`}>
                                Personalize your guidance
                            </p>
                        </div>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${textPrimary}`}>
                        Set the tone of your accountability partner and how often they check in.
                    </p>
                </div>

                {/* Coach Tone Picker */}
                <div className="mb-10">
                    <p className={accentLabel + ' block mb-4'}>How should your partner show up?</p>
                    <div className="flex flex-col gap-3">
                        {(
                            [
                                {
                                    value: 'nurturing' as CoachTone,
                                    label: 'Nurturing',
                                    sub: 'Warm, poetic, patient',
                                    desc: 'No agenda, no pressure. Your partner listens first, meeting you where you are before going anywhere.',
                                    accent: 'rgba(229,214,167,0.85)',
                                    bg: 'rgba(229,214,167,0.08)',
                                },
                                {
                                    value: 'direct' as CoachTone,
                                    label: 'Direct',
                                    sub: 'Honest, clear, grounded',
                                    desc: 'Says the real thing, plainly. No inflation, no filler. The partner who respects you enough to be straight.',
                                    accent: 'rgba(135,149,130,0.9)',
                                    bg: 'rgba(135,149,130,0.08)',
                                },
                                {
                                    value: 'accountability' as CoachTone,
                                    label: 'Accountability',
                                    sub: 'Firm, high-standard, in your corner',
                                    desc: "Sees what you're capable of and holds you to it. High standard, zero cruelty, rooted in the belief that you've got more in you.",
                                    accent: 'rgba(201,106,58,0.9)',
                                    bg: 'rgba(201,106,58,0.10)',
                                },
                            ] as const
                        ).map((tone) => {
                            const active = (localSettings.coachTone ?? 'nurturing') === tone.value;
                            return (
                                <button
                                    key={tone.value}
                                    onClick={() => updateLocalSetting({ ...localSettings, coachTone: tone.value })}
                                    className="w-full text-left p-5 rounded-[1.8rem] border-2 transition-all active:scale-[0.98]"
                                    style={{
                                        background: active ? tone.bg : 'rgba(255,255,255,0.04)',
                                        borderColor: active ? tone.accent : 'rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-black uppercase tracking-wider text-white">{tone.label}</span>
                                            <p className="text-sm font-semibold mb-2 mt-0.5 text-white">{tone.sub}</p>
                                            <p className="text-[15px] text-white/75 leading-relaxed">{tone.desc}</p>
                                        </div>
                                        <div
                                            className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                                            style={{
                                                borderColor: active ? tone.accent : 'rgba(255,255,255,0.2)',
                                                background: active ? tone.bg : 'transparent',
                                            }}
                                        >
                                            {active && <Check size={13} strokeWidth={3} style={{ color: tone.accent }} />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
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
                                            <div className={`text-xs font-medium transition-opacity ${localSettings.nudgeFrequency === freq.value ? 'text-white' : 'text-white'}`}>
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
                    className="w-full py-5 rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-black/10 transition-all active:scale-95"
                    style={{ background: '#E5D6A7', color: '#1F3824' }}
                >
                    Save Preferences
                </button>
            </div>
        </SlideUpModal>
    );
};
