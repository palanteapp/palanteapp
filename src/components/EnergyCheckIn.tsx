import React, { useState } from 'react';
import { BatteryLow, BatteryMedium, BatteryFull, Zap, Sparkles } from 'lucide-react';
import type { Tier } from '../types';
import { haptics } from '../utils/haptics';

interface EnergyCheckInProps {
    currentEnergy: 1 | 2 | 3 | 4 | 5 | null;
    onSelect: (level: 1 | 2 | 3 | 4 | 5) => void;
    isDarkMode: boolean;
    onVibeSelect?: (tier: Tier) => void;
    currentVibe?: Tier;
}

const energyLevels = [
    { level: 2 as const, icon: BatteryLow, label: 'Low', emoji: '🔋', description: 'Quick wins only' },
    { level: 3 as const, icon: BatteryMedium, label: 'Steady', emoji: '🔋🔋', description: 'Normal pace' },
    { level: 4 as const, icon: BatteryFull, label: 'Strong', emoji: '⚡', description: 'Ready to go' },
    { level: 5 as const, icon: Zap, label: 'Peak', emoji: '⚡⚡', description: 'Unstoppable' },
];

const vibes = [
    { tier: 1 as Tier, label: 'Gentle & Nurturing', description: 'Calm, poetic inspiration' },
    { tier: 2 as Tier, label: 'Balanced & Clear', description: 'Direct, focused motivation' },
    { tier: 3 as Tier, label: 'Bold & Empowering', description: 'High-energy leadership' },
];

export const EnergyCheckIn: React.FC<EnergyCheckInProps> = ({
    currentEnergy,
    onSelect,
    isDarkMode,
    onVibeSelect,
    currentVibe
}) => {
    const [showVibeCheck, setShowVibeCheck] = useState(false);
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';

    return (
        <div className={`w-full p-6 rounded-2xl border transition-all ${isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white/60 border-sage/20'
            }`}>
            <div className="text-center mb-4">
                <p className={`text-sm font-medium ${textSecondary}`}>
                    How's your energy right now?
                </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {energyLevels.map((energy) => {
                    const Icon = energy.icon;
                    const isSelected = currentEnergy === energy.level;

                    return (
                        <button
                            key={energy.level}
                            onClick={() => {
                                haptics.selection();
                                onSelect(energy.level);
                            }}
                            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all duration-300 ${isSelected
                                ? isDarkMode
                                    ? 'bg-pale-gold text-warm-gray-green shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-105'
                                    : 'bg-sage text-white shadow-spa scale-105'
                                : isDarkMode
                                    ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    : 'bg-white/40 text-sage/70 hover:bg-white/60 hover:text-sage'
                                }`}
                            title={energy.description}
                        >
                            <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                            <span className="text-[10px] font-medium leading-tight text-center">{energy.label}</span>
                        </button>
                    );
                })}</div>

            {currentEnergy && (
                <div className={`mt-4 text-center text-xs ${textSecondary}`}>
                    {energyLevels.find(e => e.level === currentEnergy)?.description}
                </div>
            )}

            {/* Vibe Check Integration */}
            {onVibeSelect && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <button
                        onClick={() => setShowVibeCheck(!showVibeCheck)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white/40 hover:bg-white/60'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                Set Your Vibe
                            </span>
                        </div>
                        {currentVibe && (
                            <span className={`text-xs ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                {vibes.find(v => v.tier === currentVibe)?.label}
                            </span>
                        )}
                    </button>

                    {showVibeCheck && (
                        <div className="mt-3 space-y-2 animate-fade-in">
                            {vibes.map((vibe) => (
                                <button
                                    key={vibe.tier}
                                    onClick={() => {
                                        haptics.selection();
                                        onVibeSelect(vibe.tier);
                                        setShowVibeCheck(false);
                                    }}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${currentVibe === vibe.tier
                                        ? isDarkMode
                                            ? 'bg-pale-gold text-warm-gray-green'
                                            : 'bg-sage text-white'
                                        : isDarkMode
                                            ? 'bg-white/5 text-white/70 hover:bg-white/10'
                                            : 'bg-white/40 text-sage/70 hover:bg-white/60'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{vibe.label}</div>
                                    <div className="text-xs opacity-70">{vibe.description}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
