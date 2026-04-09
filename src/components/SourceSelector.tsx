import React from 'react';
import { User, Sparkles, Lock } from 'lucide-react';
import type { UserProfile } from '../types';
import { canUseAI } from '../types';

export type QuoteSource = 'human' | 'ai' | 'mix';

interface SourceSelectorProps {
    currentSource: QuoteSource;
    onSelect: (source: QuoteSource) => void;
    isDarkMode: boolean;
    user?: UserProfile | null;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({ currentSource, onSelect, isDarkMode, user }) => {
    const aiAllowed = canUseAI(user);
    const sources = [
        { id: 'human', name: 'Human', icon: User, description: "Timeless wisdom from history's greatest minds" },
        { id: 'ai', name: 'Palante Coach', icon: Sparkles, description: "AI-powered motivation tailored to you" },
    ];

    return (
        <div className="w-full">
            {/* Explanatory Text */}
            <p className={`text-center text-sm mb-3 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                Choose your source of inspiration
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mx-auto">
                {sources.map((source) => {
                    const Icon = source.icon;
                    const isActive = currentSource === source.id;

                    return (
                        <button
                            key={source.id}
                            onClick={() => {
                                if (source.id === 'ai' && !aiAllowed) return;
                                onSelect(source.id as QuoteSource);
                            }}
                            disabled={source.id === 'ai' && !aiAllowed}
                            className={`tap-zone group relative h-10 px-4 py-2 rounded-full transition-all duration-300 flex flex-row items-center justify-center gap-2 border w-full ${source.id === 'ai' && !aiAllowed
                                    ? 'opacity-50 cursor-not-allowed bg-transparent border-white/10 text-white/40'
                                    : isActive
                                        ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold shadow-spa' : 'bg-sage text-white border-sage shadow-spa'
                                        : isDarkMode
                                            ? 'bg-transparent border-white/10 text-white/60 hover:bg-white/5'
                                            : 'bg-white/30 border-sage/10 text-warm-gray-green/60 hover:bg-white/50'
                                }`}
                            title={source.id === 'ai' && !aiAllowed ? 'AI features available for ages 13+' : source.description}
                        >
                            {source.id === 'ai' && !aiAllowed ? (
                                <Lock size={16} strokeWidth={2} className="shrink-0" />
                            ) : (
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                            )}
                            <span className="text-sm font-body font-medium truncate">{source.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
