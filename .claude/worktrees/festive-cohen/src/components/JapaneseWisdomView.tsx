
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Timer,
    ChevronRight,
    Utensils,
    Target,
    Layers,
    Feather,
    Focus
} from 'lucide-react';
import { WISDOM_PRINCIPLES } from '../data/wisdomData';
import type { WisdomPrinciple } from '../data/wisdomData';
import { haptics } from '../utils/haptics';

interface JapaneseWisdomViewProps {
    isDarkMode: boolean;
    onStartFocus?: (minutes: number, objective?: string) => void;
    onStartReflection?: (theme: string, initialText?: string) => void;
    onNavigate?: (tab: 'home' | 'momentum' | 'explore' | 'fasting' | 'reflect' | 'breath' | 'meditate' | 'wisdom' | 'coach') => void;
    onAddGoal?: (text: string) => void;
}

export const JapaneseWisdomView: React.FC<JapaneseWisdomViewProps> = ({
    isDarkMode,
    onStartFocus,
    onStartReflection,
    onNavigate,
    onAddGoal
}) => {
    const handleAction = (principle: WisdomPrinciple, suggestion?: string) => {
        haptics.medium();

        const objective = suggestion || principle.title;

        switch (principle.id) {
            case 'kaizen':
                onStartFocus?.(1, `Kaizen: ${objective}`);
                break;
            case 'anchored-focus':
                onStartFocus?.(25, `Anchored Focus: ${objective}`);
                break;
            case 'ikigai':
                onStartReflection?.('Purpose', suggestion ? `Focus for today: ${suggestion}` : '');
                break;
            case 'hara-hachi-bu':
                onNavigate?.('fasting');
                break;
            case 'seiri-seiton':
                onAddGoal?.(suggestion || 'Clear space (2 mins)');
                break;
            case 'kintsugi':
                onStartReflection?.('Imperfection', suggestion ? `Working on: ${suggestion}` : '');
                break;
            case 'wabi-sabi':
                onAddGoal?.(suggestion || 'Take the first step');
                break;
            default:
                break;
        }
    };

    // Theme constants
    const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-sage/10 shadow-sm';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage/60';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';

    const getIcon = (id: string) => {
        switch (id) {
            case 'kaizen': return <Zap size={24} />;
            case 'ikigai': return <Target size={24} />;
            case 'hara-hachi-bu': return <Utensils size={24} />;
            case 'anchored-focus': return <Timer size={24} />;
            case 'seiri-seiton': return <Layers size={24} />;
            case 'kintsugi': return <Feather size={24} />;
            case 'wabi-sabi': return <Focus size={24} />;
            default: return <Sparkles size={24} />;
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in font-sans pb-40 overflow-y-auto px-6 pt-6">
            {/* Header Area */}
            <div className="mb-12 text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'} ${accentColor} text-[10px] font-bold uppercase tracking-[0.2em] mb-4`}>
                    <Sparkles size={12} />
                    Systems over Motivation
                </div>
                <h1 className={`text-4xl font-display font-medium mb-3 ${textPrimary}`}>Japanese Wisdom</h1>
                <p className={`text-lg opacity-60 max-w-xs mx-auto ${textSecondary}`}>
                    Ancient principles for modern mastery.
                </p>
            </div>

            {/* Stacked Principles */}
            <div className="space-y-12">
                {WISDOM_PRINCIPLES.map((principle) => (
                    <div key={principle.id} className="space-y-6">
                        {/* Principle Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-pale-gold' : 'bg-sage/5 text-sage'}`}>
                                    {getIcon(principle.id)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className={`text-2xl font-display font-bold ${textPrimary}`}>{principle.title}</h2>
                                        <span className={`text-xs opacity-40 font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-white/10' : 'bg-sage/5'}`}>
                                            {principle.kanji}
                                        </span>
                                    </div>
                                    <p className={`text-sm italic font-medium ${accentColor}`}>{principle.meaning}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description & Suggestions */}
                        <div className={`p-8 rounded-[2rem] border ${cardBg}`}>
                            <p className={`text-lg leading-relaxed mb-8 ${textPrimary}`}>
                                {principle.description}
                            </p>

                            <div className="space-y-4">
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ${textPrimary}`}>
                                    Apply this logic now
                                </p>
                                <div className="space-y-3">
                                    {principle.suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleAction(principle, suggestion)}
                                            className={`w-full group px-6 py-5 rounded-3xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${isDarkMode
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white'
                                                : 'bg-sage-mid/5 border-sage/5 hover:bg-white text-sage/80 hover:text-sage hover:shadow-xl hover:border-sage/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full transition-all group-hover:scale-150 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
                                                <span className="text-base font-medium">{suggestion}</span>
                                            </div>
                                            <ChevronRight size={18} className="opacity-0 group-hover:opacity-60 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Utility Buttons */}
                            <div className="flex gap-3 mt-8 pt-8 border-t border-white/5">
                                <DetailToggle title="The Science" content={principle.science} isDarkMode={isDarkMode} />
                                <DetailToggle title="How to Use" content={principle.howToUse} isDarkMode={isDarkMode} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Footer */}
            <div className="text-center py-10 opacity-20">
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${textPrimary}`}>
                    System Beats Motivation
                </p>
            </div>
        </div>
    );
};

const DetailToggle: React.FC<{ title: string; content: string; isDarkMode: boolean }> = ({ title, content, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex-1">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    haptics.light();
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isDarkMode
                    ? isOpen ? 'bg-pale-gold text-warm-gray-green' : 'bg-white/5 text-white/40 hover:bg-white/10'
                    : isOpen ? 'bg-sage text-white' : 'bg-sage/5 text-sage/40 hover:bg-sage/10'
                    }`}
            >
                {title}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className={`mt-4 text-xs leading-relaxed opacity-60 p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                            {content}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
