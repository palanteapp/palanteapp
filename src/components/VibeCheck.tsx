import React, { useState } from 'react';
import { Flame, Waves, Mountain, ArrowRight, User, Sparkles, Layers, MessageSquareQuote } from 'lucide-react';
import { haptics } from '../utils/haptics';
import type { Tier, QuoteSource, ContentType } from '../types';
import { SlideUpModal } from './SlideUpModal';

interface VibeCheckProps {
    isOpen: boolean;
    onSelect: (tier: Tier, source: QuoteSource, content: ContentType) => void;
    onSkip: () => void;
    isDarkMode: boolean;
    userName: string;
    currentSource?: QuoteSource;
    currentContent?: ContentType;
}

export const VibeCheck: React.FC<VibeCheckProps> = ({ isOpen, onSelect, onSkip, isDarkMode, userName, currentSource = 'mix', currentContent = 'mix' }) => {
    const [selected, setSelected] = useState<Tier | null>(null);
    const [source, setSource] = useState<QuoteSource>(currentSource);
    const [content, setContent] = useState<ContentType>(currentContent);


    const handleSelect = (tier: Tier) => {
        haptics.selection();
        setSelected(tier);
        // Removed auto-exit to allow user to see selection and confirm
    };

    const handleConfirm = () => {
        if (!selected) {
            haptics.light();
            setTimeout(onSkip, 300);
            return;
        }

        haptics.success();
        // Brief delay for exit animation
        setTimeout(() => {
            onSelect(selected, source, content);
        }, 500);
    };

    const vibes = [
        {
            id: 'flow',
            tier: 1 as Tier,
            label: 'Gentle & Nurturing',
            icon: Waves,
            desc: 'Calm, poetic inspiration',
            color: 'text-pale-gold',
            bg: 'bg-cyan-900/40',
            border: 'border-cyan-500/30',
            ring: 'ring-cyan-400',
            pageBg: 'bg-[#2D6A70]' // Rich Aqua/Teal
        },
        {
            id: 'grounded',
            tier: 2 as Tier,
            label: 'Balanced & Clear',
            icon: Mountain,
            desc: 'Direct, focused motivation',
            color: 'text-pale-gold',
            bg: 'bg-sage/20',
            border: 'border-pale-gold/50',
            ring: 'ring-amber',
            pageBg: 'bg-[#6F7B6D]' // Sage
        },
        {
            id: 'fire',
            tier: 3 as Tier,
            label: 'Bold & Empowering',
            icon: Flame,
            desc: 'High-energy leadership',
            color: 'text-pale-gold',
            bg: 'bg-red-900/40',
            border: 'border-red-500/30',
            ring: 'ring-red-400',
            pageBg: 'bg-[#8F3B3B]' // Rich Red
        }
    ];



    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onSkip}
            isDarkMode={isDarkMode}
        >
            <div className={`p-6 w-full max-w-sm mx-auto space-y-6 ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                <div className="text-center space-y-2 mt-2">
                    <p className={`text-xs font-medium uppercase tracking-widest opacity-60 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                        {getGreeting()}, {userName.split(' ')[0]}
                    </p>
                    <h1 className={`text-2xl font-display font-medium leading-tight px-2 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                        What type of motivation would you like today?
                    </h1>
                </div>

                <div className="grid gap-3">
                    {vibes.map((vibe, index) => {
                        const Icon = vibe.icon;
                        const isSelected = selected === vibe.tier;

                        return (
                            <button
                                key={vibe.id}
                                onClick={() => handleSelect(vibe.tier)}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`group relative w-full h-20 rounded-xl border flex items-center px-5 transition-all duration-300 tap-zone hover:scale-[1.01] animate-fade-in-up ${isSelected
                                    ? `${vibe.bg} ${vibe.border} ring-1 ring-offset-1 ring-offset-black/5 ${vibe.ring}`
                                    : isDarkMode
                                        ? 'bg-white/10 border-white/10 hover:bg-white/20'
                                        : 'bg-white border-sage/10 hover:border-sage/30 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'
                                    }`}>
                                    <Icon size={20} className={vibe.color} />
                                </div>

                                <div className="text-left flex-1">
                                    <h3 className={`text-lg font-display font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {vibe.label}
                                    </h3>
                                    <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-sage/60'}`}>
                                        {vibe.desc}
                                    </p>
                                </div>

                                <div className={`opacity-0 group-hover:opacity-100 transition-opacity -mr-2 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>
                                    <ArrowRight size={18} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-5">
                    {/* Content Type Selector */}
                    <div className="space-y-2">
                        <p className={`text-center text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-sage/70'}`}>What do you need?</p>
                        <div className={`grid grid-cols-3 gap-2 p-1 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-sage/5'}`}>
                            {[
                                { id: 'quotes', label: 'Quotes', icon: MessageSquareQuote, desc: 'Wisdom' },
                                { id: 'mix', label: 'Both', icon: Layers, desc: 'Mixed' },
                                { id: 'affirmations', label: 'Affirmations', icon: Sparkles, desc: 'Self-belief' }
                            ].map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        haptics.light();
                                        setContent(c.id as ContentType);
                                    }}
                                    className={`flex flex-col items-center justify-center py-2.5 rounded-md transition-all duration-200 ${content === c.id
                                        ? 'bg-pale-gold text-warm-gray-green shadow-sm'
                                        : isDarkMode ? 'text-white/60 hover:bg-white/5' : 'text-sage/60 hover:bg-sage/10'
                                        }`}
                                >
                                    <c.icon size={16} className="mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Source Selector */}
                    <div className="space-y-2">
                        <p className={`text-center text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-sage/70'}`}>Who from?</p>
                        <div className={`grid grid-cols-3 gap-2 p-1 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-sage/5'}`}>
                            {[
                                { id: 'human', label: 'Human', icon: User, desc: 'Classic' },
                                { id: 'mix', label: 'Both', icon: Layers, desc: 'Best of both' },
                                { id: 'ai', label: 'Coach', icon: Sparkles, desc: 'Personal' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        haptics.light();
                                        setSource(s.id as QuoteSource);
                                    }}
                                    className={`flex flex-col items-center justify-center py-2.5 rounded-md transition-all duration-200 ${source === s.id
                                        ? 'bg-pale-gold text-warm-gray-green shadow-sm'
                                        : isDarkMode ? 'text-white/60 hover:bg-white/5' : 'text-sage/60 hover:bg-sage/10'
                                        }`}
                                >
                                    <s.icon size={16} className="mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Primary Action Button */}
                <button
                    onClick={handleConfirm}
                    className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 transform active:scale-95 shadow-lg mt-2 ${selected
                        ? 'bg-pale-gold text-sage-dark hover:bg-white'
                        : isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                >
                    {selected ? 'Activate Vibe' : 'Keep my current vibe'}
                </button>
            </div>
        </SlideUpModal>
    );
};
