import React, { useState, useEffect } from 'react';
import { Check, X, ShieldCheck, Sparkles, Zap, Heart, Leaf } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { SlideUpModal } from './SlideUpModal';
import { STORAGE_KEYS } from '../constants/storageKeys';

export interface EnhancementOptions {
    immersiveHaptics: boolean;
    dynamicBackgrounds: boolean;
    smoothTransitions: boolean;
    groundingHeartbeat: boolean;
    natureParticles: boolean;
}

const DEFAULT_OPTIONS: EnhancementOptions = {
    immersiveHaptics: false,
    dynamicBackgrounds: false,
    smoothTransitions: false,
    groundingHeartbeat: false,
    natureParticles: false
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
    isDarkMode
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
        className={`group flex items-center gap-4 p-4 rounded-2x border transition-all duration-500 cursor-pointer active:scale-[0.98] ${options[id]
            ? (isDarkMode ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-sage/10 border-sage/20 shadow-[0_0_15px_rgba(111,123,109,0.05)]')
            : (isDarkMode ? 'bg-white/5 border-transparent hover:border-white/10' : 'bg-sage/5 border-transparent hover:border-sage/10')
            }`}
    >
        {/* Left Icon Container - Subtle selection frame */}
        <div className={`p-3 rounded-xl transition-all duration-500 relative flex items-center justify-center ${options[id]
            ? (isDarkMode ? 'bg-white/10' : 'bg-sage/20')
            : 'bg-white/5 opacity-40 grayscale'
            }`}>
            {/* Subtle outer ring for selection */}
            {options[id] && (
                <div className={`absolute -inset-1 rounded-2xl border-2 opacity-30 animate-pulse ${isDarkMode ? 'border-pale-gold' : 'border-sage'}`} />
            )}
            <Icon size={20} className={`transition-colors duration-300 ${options[id] ? (isDarkMode ? 'text-pale-gold' : 'text-sage') : 'text-white'}`} />
        </div>

        {/* Title & Description */}
        <div className="flex-1">
            <h4 className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${options[id] ? (isDarkMode ? 'text-white' : 'text-sage') : (isDarkMode ? 'text-white/40' : 'text-sage/40')}`}>
                {label}
            </h4>
            <p className={`text-[9px] leading-relaxed transition-opacity mt-0.5 ${options[id] ? 'opacity-90' : 'opacity-40'} ${isDarkMode ? 'text-white/80' : 'text-sage-dark'}`}>
                {description}
            </p>
        </div>

        {/* Right Toggle (The "Hole") - Re-refined */}
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500 ${options[id]
            ? 'bg-pale-gold border-pale-gold shadow-[0_0_15px_rgba(229,214,167,0.4)] scale-110'
            : 'border-white/10 bg-[#3A1700]/5'
            }`}>
            {options[id] && <Check size={12} strokeWidth={4} className="text-warm-gray-green animate-scale-in" />}
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

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onClose}
            isDarkMode={isDarkMode}
            showCloseButton={false}
        >
            <div className={`w-full overflow-hidden ${isDarkMode ? 'bg-sage-mid' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-5 border-b space-y-3 ${isDarkMode ? 'border-white/5' : 'border-sage/5'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-pale-gold/10">
                                <Sparkles size={16} className="text-pale-gold" />
                            </div>
                            <div>
                                <h3 className={`text-base font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                    Premium Experience
                                </h3>
                                <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">Sensory Enhancements</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'}`}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={selectAll}
                            className={`flex-1 text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl border transition-all ${isDarkMode
                                ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                                : 'border-sage/10 text-sage/60 hover:text-sage hover:bg-sage/5'}`}
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className={`flex-1 text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl border transition-all ${isDarkMode
                                ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                                : 'border-sage/10 text-sage/60 hover:text-sage hover:bg-sage/5'}`}
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Body - Tighter spacing, no unnecessary margins */}
                <div className="p-3 space-y-1">
                    {!exclude.includes('immersiveHaptics') && (
                        <p className="px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.25em] opacity-25">Sensory & Audio</p>
                    )}

                    <div className="space-y-1">
                        {!exclude.includes('immersiveHaptics') && (
                            <SettingRow
                                id="immersiveHaptics"
                                label="Immersive Haptics"
                                description="Tactile vibrations synchronized with your breath."
                                icon={Zap}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        )}
                    </div>

                    {(!exclude.includes('dynamicBackgrounds') || !exclude.includes('smoothTransitions')) && (
                        <p className="px-3 pt-3 pb-1.5 text-[8px] font-black uppercase tracking-[0.25em] opacity-25">Visuals & Flow</p>
                    )}

                    <div className="space-y-1">
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

                    {!exclude.includes('groundingHeartbeat') && (
                        <p className="px-3 pt-3 pb-1.5 text-[8px] font-black uppercase tracking-[0.25em] opacity-25">Meditation Only</p>
                    )}

                    <div className="space-y-1">
                        {!exclude.includes('groundingHeartbeat') && (
                            <SettingRow
                                id="groundingHeartbeat"
                                label="Grounding Heartbeat"
                                description="A delicate pulse to keep you anchored."
                                icon={Heart}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        )}
                    </div>

                    {!exclude.includes('natureParticles') && (
                        <p className="px-3 pt-3 pb-1.5 text-[8px] font-black uppercase tracking-[0.25em] opacity-25">Studio Environment</p>
                    )}

                    <div className="space-y-1">
                        {!exclude.includes('natureParticles') && (
                            <SettingRow
                                id="natureParticles"
                                label="Nature Particles"
                                description="Falling cherry blossoms that drift with you."
                                icon={Leaf}
                                options={options}
                                onToggle={toggleOption}
                                isDarkMode={isDarkMode}
                            />
                        )}
                    </div>
                </div>

                {/* Footer - Minimalist */}
                <div className={`mt-2 p-4 bg-[#3A1700]/5 flex items-start gap-3 ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>
                    <ShieldCheck size={14} className="mt-0.5" />
                    <p className="text-[8px] font-medium leading-tight">
                        Real-time enhancements optimized for your device. Adjust to find your perfect balance.
                    </p>
                </div>
            </div>
        </SlideUpModal>
    );
};
