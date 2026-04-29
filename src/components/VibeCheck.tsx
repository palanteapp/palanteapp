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
            isDarkMode={true}
        >
            <div className="p-6 w-full max-w-sm mx-auto space-y-6">
                <div className="text-center space-y-2 mt-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                        {getGreeting()}, {userName.split(' ')[0]}
                    </p>
                    <h1 className="text-2xl font-display font-bold leading-tight px-2 text-white">
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
                                className={`group relative w-full h-20 rounded-xl border flex items-center px-5 transition-all duration-300 tap-zone animate-fade-in-up ${isSelected
                                    ? 'bg-[#C96A3A] border-[#C96A3A]'
                                    : 'bg-white/[0.06] border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-transform group-hover:scale-110 ${isSelected ? 'bg-white/20' : 'bg-white/[0.12]'}`}>
                                    <Icon size={20} className="text-white" />
                                </div>

                                <div className="text-left flex-1">
                                    <h3 className="text-lg font-display font-bold text-white">
                                        {vibe.label}
                                    </h3>
                                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-white/50'}`}>
                                        {vibe.desc}
                                    </p>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 text-white/40">
                                    <ArrowRight size={18} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-5">
                    {/* Content Type Selector */}
                    <div className="space-y-2">
                        <p className="text-center text-xs font-medium text-white/60">What do you need?</p>
                        <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-white/[0.06]">
                            {[
                                { id: 'quotes', label: 'Quotes', icon: MessageSquareQuote },
                                { id: 'mix', label: 'Both', icon: Layers },
                                { id: 'affirmations', label: 'Affirmations', icon: Sparkles }
                            ].map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => { haptics.light(); setContent(c.id as ContentType); }}
                                    className={`flex flex-col items-center justify-center py-2.5 rounded-md transition-all duration-200 ${content === c.id
                                        ? 'bg-[#E5D6A7] text-[#1B4332] shadow-sm'
                                        : 'text-white/60 hover:bg-white/10'}`}
                                >
                                    <c.icon size={16} className="mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Source Selector */}
                    <div className="space-y-2">
                        <p className="text-center text-xs font-medium text-white/60">Who from?</p>
                        <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-white/[0.06]">
                            {[
                                { id: 'human', label: 'Human', icon: User },
                                { id: 'mix', label: 'Both', icon: Layers },
                                { id: 'ai', label: 'Coach', icon: Sparkles }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { haptics.light(); setSource(s.id as QuoteSource); }}
                                    className={`flex flex-col items-center justify-center py-2.5 rounded-md transition-all duration-200 ${source === s.id
                                        ? 'bg-[#E5D6A7] text-[#1B4332] shadow-sm'
                                        : 'text-white/60 hover:bg-white/10'}`}
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
                    className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 mt-2 bg-[#C96A3A] text-white shadow-lg"
                >
                    {selected ? 'Activate Vibe' : 'Keep my current vibe'}
                </button>
            </div>
        </SlideUpModal>
    );
};
