import React, { useState, useEffect } from 'react';
import { readJSON } from '../utils/safeStorage';
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

/**
 * The one set of defaults. Breathing and Meditation each used to inline their own literal,
 * and both had drifted: Meditation's was missing hapticDarkMode and Breathing's was missing
 * groundingHeartbeat. Nothing caught it because the old `JSON.parse(saved)` returned `any`,
 * which widened the whole conditional and turned off checking on the fallback branch.
 */
export const DEFAULT_OPTIONS: EnhancementOptions = {
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
    note,
}: {
    id: keyof EnhancementOptions,
    label: string,
    description: string,
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>,
    options: EnhancementOptions,
    onToggle: (id: keyof EnhancementOptions) => void,
    isDarkMode: boolean,
    note?: string,
}) => (
    <div
        onClick={(e) => {
            e.stopPropagation();
            onToggle(id);
        }}
        className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${options[id]
            ? 'bg-white/[0.08] border-white/10'
            : 'bg-white/[0.05] border-white/10 hover:bg-white/10'
            }`}
    >
        {/* Left Icon Container - compact badge */}
        <div className={`w-9 h-9 rounded-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${options[id]
            ? 'bg-white/[0.14]'
            : 'bg-white/[0.08] opacity-50'
            }`}>
            <Icon size={16} className="text-white" strokeWidth={options[id] ? 2.5 : 1.5} />
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-black uppercase tracking-[0.08em] text-white">
                {label}
            </h4>
            <p className="text-[11px] text-white/70 font-medium">
                {description}
            </p>
            {note && (
                <p className="text-[10px] text-[#D4B882] font-semibold mt-0.5">
                    {note}
                </p>
            )}
        </div>

        {/* Right Toggle (The "Hole") */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${options[id]
            ? 'bg-white/[0.15] border-white/20 scale-105'
            : 'border-white/20 bg-black/5'
            }`}>
            {options[id] && <Check size={10} strokeWidth={4} className="text-white animate-scale-in" />}
        </div>
    </div>
);

export const EnhancementSettings: React.FC<EnhancementSettingsProps> = ({ isOpen, onClose, isDarkMode, onUpdate, exclude = [] }) => {
    const [options, setOptions] = useState<EnhancementOptions>(() => readJSON<EnhancementOptions>(STORAGE_KEYS.ENHANCEMENTS, DEFAULT_OPTIONS));

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

    // Flat list — a prior audit found 5 (or 6, on Meditation) items split across 4 separate
    // category headers made the panel read as more overwhelming than the option count alone
    // warrants. One flat list keeps every row equally glanceable.
    const rows: {
        id: keyof EnhancementOptions,
        label: string,
        description: string,
        icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>,
        note?: string,
    }[] = [
        {
            id: 'immersiveHaptics',
            label: 'Immersive Haptics',
            description: 'Vibrations synced to your breath.',
            icon: Zap,
            // Dark Sensory Mode's haptic pulse takes over the phase-tick logic whenever it's
            // on (see Breathing.tsx), silently superseding this one. Surface that inline
            // instead of leaving it to be discovered at runtime.
            note: options.hapticDarkMode ? 'Overridden by Dark Sensory Mode' : undefined,
        },
        {
            id: 'dynamicBackgrounds',
            label: 'Phase Gradients',
            description: 'Color shifts that paint the background.',
            icon: Sparkles,
        },
        {
            id: 'smoothTransitions',
            label: 'Smooth Transitions',
            description: 'Cinematic cross-fades between techniques.',
            icon: ShieldCheck,
        },
        {
            id: 'groundingHeartbeat',
            label: 'Grounding Heartbeat',
            description: 'A delicate pulse to keep you anchored.',
            icon: Heart,
        },
        {
            id: 'natureParticles',
            label: 'Nature Particles',
            description: 'Falling blossoms that drift with you.',
            icon: Leaf,
        },
        {
            id: 'hapticDarkMode',
            label: 'Dark Sensory Mode',
            description: 'Eyes closed, guided by haptic pulse.',
            icon: EyeOff,
        },
    ];

    const visibleRows = rows.filter(row => !exclude.includes(row.id));

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onClose}
            isDarkMode={isDarkMode}
            showCloseButton={false}
        >
            <div className={`w-full overflow-hidden ${textPrimary}`}>
                {/* Header */}
                <div className="p-5 border-b border-white/10 backdrop-blur-md bg-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.12] flex items-center justify-center shadow-sm">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-display font-medium ${textPrimary}`}>
                                    Premium Experience
                                </h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/80">Sensory Enhancements</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full transition-all hover:bg-white/[0.06] text-white"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-2">
                    {visibleRows.map(row => (
                        <SettingRow
                            key={row.id}
                            id={row.id}
                            label={row.label}
                            description={row.description}
                            icon={row.icon}
                            note={row.note}
                            options={options}
                            onToggle={toggleOption}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </div>

                {/* Select All / Deselect All - secondary, below the list */}
                <div className="flex items-center justify-center gap-3 pb-4">
                    <button
                        onClick={selectAll}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors underline underline-offset-4 decoration-white/20"
                    >
                        Select All
                    </button>
                    <span className="text-white/20 text-[10px]">·</span>
                    <button
                        onClick={deselectAll}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors underline underline-offset-4 decoration-white/20"
                    >
                        Deselect All
                    </button>
                </div>

                {/* Footer - Minimalist */}
                <div className="p-6 bg-white/[0.06] flex items-start gap-4">
                    <ShieldCheck size={20} className="text-[#98B07D] flex-shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-[0.1em] leading-relaxed text-white">
                        Real-time enhancements optimized for your device. Adjust to find your perfect balance.
                    </p>
                </div>
            </div>
        </SlideUpModal>
    );
};
