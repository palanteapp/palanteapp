import React from 'react';
import type { Tier } from '../types';
import { Sparkles, Target, Flame } from 'lucide-react';

interface TierSelectorProps {
    currentTier: Tier;
    onSelect: (tier: Tier) => void;
    isDarkMode: boolean;
}

export const TierSelector: React.FC<TierSelectorProps> = ({ currentTier, onSelect, isDarkMode }) => {
    const tiers = [
        { id: 1, name: 'Muse', icon: Sparkles, description: 'Gentle & poetic' },
        { id: 2, name: 'Focus', icon: Target, description: 'Direct & clear' },
        { id: 3, name: 'Firestarter', icon: Flame, description: 'Bold & intense' },
    ];

    return (
        <div className="flex justify-center">
            <div className="flex items-center gap-4">
                <span className={`text-sm font-body uppercase tracking-widest ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>Tone</span>
                <div className="flex gap-2">
                    {tiers.map((tier) => {
                        const Icon = tier.icon;
                        const isActive = currentTier === tier.id;

                        return (
                            <button
                                key={tier.id}
                                onClick={() => onSelect(tier.id as Tier)}
                                className={`tap-zone group relative px-6 py-3 rounded-full transition-all duration-300 ${isActive
                                    ? isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-spa' : 'bg-sage text-white shadow-spa'
                                    : isDarkMode
                                        ? 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                        : 'bg-white/40 border border-sage/20 text-warm-gray-green/60 hover:bg-white/60 hover:text-warm-gray-green'
                                    }`}
                                title={tier.description}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-sm font-body font-medium">{tier.name}</span>
                                </div>

                                {/* Tooltip on hover */}
                                {!isActive && (
                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <div className="px-3 py-2 rounded-lg bg-warm-gray-green text-white text-xs font-body whitespace-nowrap shadow-spa">
                                            {tier.description}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
