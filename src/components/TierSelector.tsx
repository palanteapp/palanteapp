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
        <div className="flex justify-center w-full overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2 px-4 min-w-max">
                {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isActive = currentTier === tier.id;

                    return (
                        <button
                            key={tier.id}
                            onClick={() => onSelect(tier.id as Tier)}
                            className={`tap-zone group relative px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 border ${isActive
                                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold shadow-spa' : 'bg-sage text-white border-sage shadow-spa'
                                : isDarkMode
                                    ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    : 'bg-white/40 border-sage/10 text-warm-gray-green/60 hover:bg-white/60'
                                }`}
                            title={tier.description}
                        >
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-sm font-body font-medium">{tier.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
