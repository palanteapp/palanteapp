import React, { useState, useEffect } from 'react';
import { Check, X, ShieldCheck, Sparkles, Zap, Heart, Leaf, EyeOff } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { SlideUpModal } from './SlideUpModal';
import { STORAGE_KEYS } from '../constants/storageKeys';

export interface EnhancementOptions {
    immersiveHaptics: boolean;
    dynamicBackgrounds: boolean;
    smoothTransitions: boolean;
    groundingHeartbeat: boolean;
    natureParticles: boolean;
    hapticDarkMode: boolean;
}

const DEFAULT_OPTIONS: EnhancementOptions = {
    immersiveHaptics: false,
    dynamicBackgrounds: false,
    smoothTransitions: false,
    groundingHeartbeat: false,
    natureParticles: false,
    hapticDarkMode: false,
};

interface EnhancementSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate?: (options: EnhancementOptions) => void;
    exclude?: (keyof EnhancementOptions)[];
}

const SettingRow = ({
    id,
    label,
    description,
    icon: Icon,
    options,
    onToggle,
}: {
    id: keyof EnhancementOptions,
    label: string,
    description: string,
    icon: React.ComponentType<{ size?: number; className?: string }>,
    options: EnhancementOptions,
    onToggle: (id: keyof EnhancementOptions) => void,
    isDarkMode: boolean
}) => (
    <div
        onClick={(e) => {
            e.stopPropagation();
            onToggle(id);
        }}
        className={`group flex items-center gap-4 p-4 rounded-[2rem] border transition-all duration-500 cursor-pointer active:scale-[0.98] ${options[id]
            ? 'bg-white/[0.06] border-white/10 shadow-lg scale-[1.02]'
            : 'bg-white/[0.06] border-white/10 hover:bg-white/10'
            }`}
    >
        {/* Left Icon Container - Solid Badge Style */}
        <div className={`w-12 h-12 rounded-2xl transition-all duration-500 relative flex items-center justify-center shadow-sm ${options[id]
            ? 'bg-white/[0.12] rotate-3'
            : 'bg-white/[0.08] opacity-50 rotate-0'
            }`}>
            <Icon size={20} className={`transition-colors duration-300 text-white`} strokeWidth={options[id] ? 2.5 : 1.5} />
        </div>

        {/* Title & Description */}
        <div className="flex-1">
            <h4 className={`text-xs font-black uppercase tracking-[0.1em] transition-colors ${options[id] ? 'text-white' : 'text-white'}`}>
                {label}
            </h4>
            <p className={`text-[11px] leading-relaxed transition-opacity mt-0.5 font-medium ${options[id] ? 'text-white' : 'text-white'}`}>
                {description}
            </p>
        </div>

        {/* Right Toggle (The "Hole") - Re-refined */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${options[id]
            ? 'bg-white/[0.15] border-white/20 shadow-md scale-110'
            : 'border-white/20 bg-black/5'
            }`}>
            {options[id] && <Check size={12} strokeWidth={4} className="text-white animate-scale-in" />}
        </div>
    </div>
);

export const EnhancementSettings: React.FC<EnhancementSettingsProps> = ({ isOpen, onClose, isDarkMode, onUpdate, exclude = [] }) => {
    const [options, setOptions] = useState<EnhancementOptions>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.ENHANCEMENTS);
        return saved ? JSON.parse(saved) : DEFAULT_OPTIONS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.ENHANCEMENTS, JSON.stringify(options));
        if (onUpdate) onUpdate(options);
    }, [options, onUpdate]);

    const toggleOption = (key: keyof EnhancementOptions) => {
        haptics.selection();
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const selectAll = () => {
        haptics.medium();
        const newOptions = { ...options };
        (Object.keys(DEFAULT_OPTIONS) as (keyof EnhancementOptions)[]).forEach(key => {
            if (!exclude.includes(key)) newOptions[key] = true;
        });
        setOptions(newOptions);
    };

    const deselectAll = () => {
        haptics.selection();
        const newOptions = { ...options };
        (Object.keys(DEFAULT_OPTIONS) as (keyof EnhancementOptions)[]).forEach(key => {
            if (!exclude.includes(key)) newOptions[key] = false;
        });
        setOptions(newOptions);
    };

    if (!isOpen) return null;

    const textPrimary = 'text-white';
    const accentLabel = 'text-white/60 font-black text-[10px] uppercase tracking-[0.2em]';

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onClose}
            isDarkMode={isDarkMode}
            showCloseButton={false}
        >
            <div className={`w-full overflow-hidden ${textPrimary}`}>
                {/* Header */}
                <div className={`p-6 border-b border-white/10 space-y-4 backdrop-blur-md bg-white/10`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.12] flex items-center justify-center shadow-sm">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-display font-medium ${textPrimary}`}>
                                    Premium Experience
                                </h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/60">Sensory Enhancements</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all hover:bg-white/[0.06] text-white/40`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={selectAll}
                            className="flex-1 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border-2 border-white/10 transition-all active:scale-95 bg-white/[0.08] hover:bg-white/[0.15] text-white"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="flex-1 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border-2 border-white/10 transition-all active:scale-95 bg-white/[0.08] hover:bg-white/[0.15] text-white"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Body - Tighter spacing, no unnecessary margins */}
                <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    {!exclude.includes('immersiveHaptics') && (
                        <div className="space-y-4">
                            <p className={accentLabel}>Sensory & Audio</p>
                            <SettingRow
                                id="immersiveHaptics"
                                label="Immersive Haptics"
                                description="Tactile vibrations synchronized with your breath."
                                icon={Zap}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}

                    {(!exclude.includes('dynamicBackgrounds') || !exclude.includes('smoothTransitions')) && (
                        <div className="space-y-4">
                            <p className={accentLabel}>Visuals & Flow</p>
                            <div className="space-y-3">
                                {!exclude.includes('dynamicBackgrounds') && (
                                    <SettingRow
                                        id="dynamicBackgrounds"
                                        label="Phase Gradients"
                                        description="Subtle color shifts that paint the background."
                                        icon={Sparkles}
                                        options={options}
                                        onToggle={toggleOption}
                                        isDarkMode={isDarkMode}
                                    />
                                )}

                                {!exclude.includes('smoothTransitions') && (
                                    <SettingRow
                                        id="smoothTransitions"
                                        label="Smooth Transitions"
                                        description="Cinematic cross-fades between techniques."
                                        icon={ShieldCheck}
                                        options={options}
                                        onToggle={toggleOption}
                                        isDarkMode={isDarkMode}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {!exclude.includes('groundingHeartbeat') && (
                        <div className="space-y-4">
                            <p className={accentLabel}>Meditation Only</p>
                            <SettingRow
                                id="groundingHeartbeat"
                                label="Grounding Heartbeat"
                                description="A delicate pulse to keep you anchored."
                                icon={Heart}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}

                    {!exclude.includes('natureParticles') && (
                        <div className="space-y-4">
                            <p className={accentLabel}>Studio Environment</p>
                            <SettingRow
                                id="natureParticles"
                                label="Nature Particles"
                                description="Falling cherry blossoms that drift with you."
                                icon={Leaf}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}

                    {!exclude.includes('hapticDarkMode') && (
                        <div className="space-y-4">
                            <p className={accentLabel}>Sensory Focus</p>
                            <SettingRow
                                id="hapticDarkMode"
                                label="Dark Sensory Mode"
                                description="Eyes closed, guided only by haptic pulse."
                                icon={EyeOff}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}
                </div>

                {/* Footer - Minimalist */}
                <div className="p-6 bg-white/[0.06] flex items-start gap-4">
                    <ShieldCheck size={20} className="text-[#98B07D] flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed text-white">
                        Real-time enhancements optimized for your device. Adjust to find your perfect balance.
                    </p>
                </div>
            </div>
        </SlideUpModal>
    );
};
