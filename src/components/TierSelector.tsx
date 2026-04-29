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
        { id: 1, name: 'Gentle & Poetic', icon: Sparkles, description: 'Calm inspiration' },
        { id: 2, name: 'Direct & Clear', icon: Target, description: 'Focused motivation' },
        { id: 3, name: 'Bold & Intense', icon: Flame, description: 'High energy' },
    ];

    return (
        <div className="w-full px-4">
            <div className="text-center mb-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                    Choose your Vibe
                </p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
                {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isActive = currentTier === tier.id;

                    return (
                        <button
                            key={tier.id}
                            onClick={() => onSelect(tier.id as Tier)}
                            className={`tap -zone group relative px-3 py-3 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border w-full ${isActive
                                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold shadow-spa' : 'bg-sage text-white border-sage shadow-spa'
                                : isDarkMode
                                    ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    : 'bg-white/40 border-sage/10 text-sage-dark hover:bg-white/60'
                                }`}
                            title={tier.description}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                            <span className="text-xs font-body font-medium text-center leading-tight">{tier.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
