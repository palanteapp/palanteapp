import React, { useState, useMemo } from 'react';
import { Wind, Flower, Timer, Utensils, BookOpen, Music, Sparkles, Layers, ChevronRight, Settings2 } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { ReorderModal } from './ReorderModal';
import type { UserProfile } from '../types';

type PracticeId = 'breath' | 'meditate' | 'focus' | 'fasting' | 'reflect' | 'soundscapes' | 'wisdom' | 'routines';

interface PracticeViewProps {
    onNavigate: (section: PracticeId) => void;
    isDarkMode: boolean;
    user: UserProfile | null;
    updateProfile: (updatedUser: UserProfile) => Promise<void>;
}

const ALL_PRACTICES: { id: PracticeId; title: string; subtitle: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'breath',     title: 'Breathwork',       subtitle: 'Regulate your nervous system',     icon: Wind },
    { id: 'meditate',   title: 'Meditation',        subtitle: 'Find calm with guided sessions',   icon: Flower },
    { id: 'focus',      title: 'Focus Timer',       subtitle: 'Deep work with rest cycles',       icon: Timer },
    { id: 'fasting',    title: 'Fasting',           subtitle: 'Track your metabolic window',      icon: Utensils },
    { id: 'reflect',    title: 'Journal',           subtitle: 'Capture thoughts and growth',      icon: BookOpen },
    { id: 'soundscapes',title: 'Soundscapes',       subtitle: 'Immersive audio for focus or sleep', icon: Music },
    { id: 'wisdom',     title: 'Japanese Wisdom',   subtitle: 'Ancient systems for action',       icon: Sparkles },
    { id: 'routines',   title: 'Habit Builder',     subtitle: 'Design your daily rituals',        icon: Layers },
];

const DEFAULT_ORDER: PracticeId[] = ['breath', 'meditate', 'focus', 'fasting', 'reflect', 'soundscapes', 'wisdom', 'routines'];

export const PracticeView: React.FC<PracticeViewProps> = ({ onNavigate, isDarkMode, user, updateProfile }) => {
    const [showReorder, setShowReorder] = useState(false);

    const orderedPractices = useMemo(() => {
        const order = (user?.exploreOrder as PracticeId[] | undefined);
        if (!order || order.length === 0) return ALL_PRACTICES;
        return [...ALL_PRACTICES].sort((a, b) => {
            const iA = order.indexOf(a.id);
            const iB = order.indexOf(b.id);
            if (iA !== -1 && iB !== -1) return iA - iB;
            if (iA !== -1) return -1;
            if (iB !== -1) return 1;
            return DEFAULT_ORDER.indexOf(a.id) - DEFAULT_ORDER.indexOf(b.id);
        });
    }, [user?.exploreOrder]);

    const primaryPractices = orderedPractices.slice(0, 4);
    const morePractices    = orderedPractices.slice(4);

    const textPrimary = isDarkMode ? 'text-white'    : 'text-sage';
    const textMuted   = isDarkMode ? 'text-white/50' : 'text-sage/55';
    const cardBg      = isDarkMode
        ? 'bg-white/[0.07] border border-white/[0.10]'
        : 'bg-white/70 border border-sage/10 shadow-sm';
    const moreCardBg  = isDarkMode
        ? 'bg-white/[0.05] border border-white/[0.08]'
        : 'bg-white/50 border border-sage/10';

    return (
        <div className="px-5 pt-6 pb-32 animate-fade-in max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-7 px-1">
                <div>
                    <h2 className={`font-display font-medium text-3xl ${textPrimary}`}>Practice</h2>
                    <p className={`text-[11px] uppercase tracking-[0.25em] font-black mt-1 ${textMuted}`}>Choose your practice</p>
                </div>
                <button
                    onClick={() => { haptics.light(); setShowReorder(true); }}
                    className={`p-2 rounded-full transition-colors mb-1 ${isDarkMode ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-sage/40 hover:text-sage hover:bg-sage/5'}`}
                    title="Customize practices"
                >
                    <Settings2 size={20} />
                </button>
            </div>

            {/* Primary practice cards */}
            <div className="flex flex-col gap-3 mb-8">
                {primaryPractices.map((p) => {
                    const Icon = p.icon;
                    return (
                        <button
                            key={p.id}
                            onClick={() => { haptics.medium(); onNavigate(p.id); }}
                            className={`w-full text-left rounded-[1.75rem] [transform:translateZ(0)] active:scale-[0.98] transition-transform duration-150 ${cardBg}`}
                        >
                            <div className="flex items-center gap-4 px-5 py-4">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-white/[0.12]' : 'bg-sage/10'}`}>
                                    <Icon size={22} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-display font-semibold text-lg leading-tight ${textPrimary}`}>
                                        {p.title}
                                    </h3>
                                    <p className={`text-xs mt-0.5 ${textMuted}`}>
                                        {p.subtitle}
                                    </p>
                                </div>

                                <ChevronRight size={18} className={isDarkMode ? 'text-white/25 flex-shrink-0' : 'text-sage/30 flex-shrink-0'} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* More tools */}
            {morePractices.length > 0 && (
                <>
                    <div className="mb-3 px-1">
                        <p className={`text-[10px] uppercase tracking-[0.25em] font-black ${textMuted}`}>More Tools</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {morePractices.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => { haptics.selection(); onNavigate(tool.id); }}
                                    className={`flex items-center gap-3 p-4 rounded-2xl [transform:translateZ(0)] transition-all active:scale-[0.97] text-left ${moreCardBg}`}
                                >
                                    <div className={`p-2 rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-white/[0.10]' : 'bg-sage/8'}`}>
                                        <Icon size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                    </div>
                                    <span className={`text-sm font-display font-semibold truncate ${textPrimary}`}>{tool.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Reorder modal */}
            <ReorderModal
                isOpen={showReorder}
                onClose={() => setShowReorder(false)}
                isDarkMode={isDarkMode}
                title="Your Top 4 Practices"
                items={ALL_PRACTICES.map(p => ({ id: p.id, label: p.title }))}
                currentOrder={user?.exploreOrder || DEFAULT_ORDER}
                onSave={(newOrder) => {
                    if (user) updateProfile({ ...user, exploreOrder: newOrder });
                }}
            />
        </div>
    );
};
