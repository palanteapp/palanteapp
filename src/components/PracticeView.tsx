import React, { useState } from 'react';
import { Wind, Flower, Music, ChevronRight, Info, X, GripVertical, TrendingUp, Zap, Goal as GoalIcon, Lightbulb, Mail, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { haptics } from '../utils/haptics';
import { WeeklyInsightsCard } from './WeeklyInsightsCard';
import { SlideUpModal } from './SlideUpModal';
import type { UserProfile } from '../types';

type PracticeId = 'breath' | 'meditate' | 'soundscapes';

interface PracticeViewProps {
    onNavigate: (section: PracticeId) => void;
    isDarkMode: boolean;
    user?: UserProfile;
    onOpenHighlights?: () => void;
    highlightsBadge?: boolean;
    onWriteLetter?: () => void;
}

interface Practice {
    id: PracticeId;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    info: string;
    accent: { icon: string; bg: string; glow: string; border: string };
}

const PRACTICES: Practice[] = [
    {
        id: 'breath',
        title: 'Breathwork',
        subtitle: 'Regulate your nervous system',
        icon: Wind,
        info: 'Guided breathing patterns that shift you toward calm or focus through the pace and ratio of your own breath, often within minutes. Choose from Energy, Relax, or Balance breathing.',
        accent: { icon: '#E5D6A7', bg: 'rgba(229,214,167,0.13)', glow: 'rgba(229,214,167,0.08)', border: 'rgba(229,214,167,0.30)' },
    },
    {
        id: 'meditate',
        title: 'Meditation',
        subtitle: 'Find calm with guided sessions',
        icon: Flower,
        info: 'Short, guided sessions designed to quiet mental noise and build presence. Whether you have 5 minutes or 20, each session is crafted to meet you where you are. No experience needed.',
        accent: { icon: '#E5D6A7', bg: 'rgba(229,214,167,0.13)', glow: 'rgba(229,214,167,0.08)', border: 'rgba(229,214,167,0.30)' },
    },
    {
        id: 'soundscapes',
        title: 'Soundscapes',
        subtitle: 'Immersive audio for focus or rest',
        icon: Music,
        info: 'Layer ambient sounds (rain, forest, white noise, binaural tones) to create your ideal sonic environment. Use it for deep work, sleep, meditation, or just blocking out the world for a moment.',
        accent: { icon: '#E5D6A7', bg: 'rgba(229,214,167,0.13)', glow: 'rgba(229,214,167,0.08)', border: 'rgba(229,214,167,0.30)' },
    },
];

// ── Sortable row ──────────────────────────────────────────────────────────────
const SortablePracticeCard: React.FC<{
    practice: Practice;
    isDarkMode: boolean;
    onNavigate: (id: PracticeId) => void;
    onInfo: (practice: Practice) => void;
}> = ({ practice, isDarkMode, onNavigate, onInfo }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: practice.id });

    const Icon = practice.icon;
    const { accent } = practice;
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textMuted   = isDarkMode ? 'text-white' : 'text-sage/55';
    const cardBg      = isDarkMode
        ? 'bg-white/[0.07] border border-white/[0.10]'
        : 'bg-white/70 border border-sage/10 shadow-sm';

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                zIndex: isDragging ? 20 : 'auto',
                opacity: isDragging ? 0.75 : 1,
                ...(isDarkMode ? { borderLeft: `2px solid ${accent.border}` } : {}),
            }}
            className={`w-full rounded-[1.75rem] [transform:translateZ(0)] ${cardBg}`}
        >
            <div className="flex items-center gap-4 px-5 py-4">
                {/* Drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="touch-none p-1 cursor-grab active:cursor-grabbing flex-shrink-0"
                    aria-label="Drag to reorder"
                >
                    <GripVertical size={16} className={isDarkMode ? 'text-white' : 'text-sage/25'} />
                </button>

                {/* Icon */}
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isDarkMode ? accent.bg : accent.bg, boxShadow: `0 0 18px ${accent.glow}` }}
                >
                    <Icon size={22} style={{ color: isDarkMode ? accent.icon : accent.icon }} />
                </div>

                {/* Text: tappable to navigate */}
                <button
                    className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
                    onClick={() => { haptics.medium(); onNavigate(practice.id); }}
                >
                    <h3 className={`font-display font-semibold text-lg leading-tight ${textPrimary}`}>
                        {practice.title}
                    </h3>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>
                        {practice.subtitle}
                    </p>
                </button>

                {/* Info button */}
                <button
                    onClick={() => { haptics.light(); onInfo(practice); }}
                    className={`p-2 rounded-xl flex-shrink-0 transition-colors ${isDarkMode ? 'text-white hover:text-white/50 hover:bg-white/10' : 'text-sage/30 hover:text-sage/60 hover:bg-sage/10'}`}
                    aria-label={`About ${practice.title}`}
                >
                    <Info size={16} />
                </button>

                {/* Chevron */}
                <button
                    onClick={() => { haptics.medium(); onNavigate(practice.id); }}
                    className="flex-shrink-0"
                >
                    <ChevronRight size={18} className={isDarkMode ? 'text-white' : 'text-sage/30'} />
                </button>
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
export const PracticeView: React.FC<PracticeViewProps> = ({ onNavigate, isDarkMode, user, onOpenHighlights, highlightsBadge, onWriteLetter }) => {
    const [order, setOrder] = useState<PracticeId[]>(PRACTICES.map(p => p.id));
    const [infoTarget, setInfoTarget] = useState<Practice | null>(null);
    const [showInsightsExplainer, setShowInsightsExplainer] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setOrder(prev => {
            const oldIdx = prev.indexOf(active.id as PracticeId);
            const newIdx = prev.indexOf(over.id as PracticeId);
            return arrayMove(prev, oldIdx, newIdx);
        });
        haptics.light();
    };

    const orderedPractices = order.map(id => PRACTICES.find(p => p.id === id)!);

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textMuted   = isDarkMode ? 'text-white' : 'text-sage/55';
    const overlayBg   = isDarkMode ? 'bg-[#0f1f15]/96' : 'bg-ivory/97';

    return (
        <div className="px-5 pt-6 pb-32 animate-fade-in max-w-md mx-auto">
            {/* Header */}
            <div className="mb-8 px-1">
                <h2 className={`font-display font-medium text-3xl ${textPrimary}`}>Explore</h2>
                <p className={`text-xs uppercase tracking-[0.25em] font-black mt-1 ${textMuted}`}>
                    The art of moving forward
                </p>
            </div>

            {/* Sortable practice cards */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={order} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                        {orderedPractices.map(practice => (
                            <SortablePracticeCard
                                key={practice.id}
                                practice={practice}
                                isDarkMode={isDarkMode}
                                onNavigate={onNavigate}
                                onInfo={setInfoTarget}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Drag hint */}
            <p className={`text-center text-xs mt-4 ${textMuted}`}>
                Hold <GripVertical size={10} className="inline" /> to reorder
            </p>

            {/* Weekly Insights, Weekly Wins, and Letters to Your Future Self: one
                group of equally-spaced link-out cards under a shared header — each
                card's own title already says what it is, so no repeated eyebrows. */}
            {(user || onOpenHighlights || onWriteLetter) && (
                <div className="mt-10">
                    <h3 className={`text-lg font-display font-medium mb-4 ${textPrimary}`}>
                        Weekly Insights
                    </h3>
                    <div className="flex flex-col gap-3">
                    {user && (
                        <WeeklyInsightsCard
                            user={user}
                            isDarkMode={isDarkMode}
                            onClick={() => setShowInsightsExplainer(true)}
                        />
                    )}
                    {onOpenHighlights && (
                        <button
                            onClick={() => { haptics.light(); onOpenHighlights(); }}
                            className={`w-full rounded-2xl px-5 py-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] ${isDarkMode ? 'glass-surface border border-white/10 hover:border-white/20' : 'bg-white/70 border border-sage/15 shadow-sm hover:shadow-md'}`}
                            style={{ background: isDarkMode ? undefined : 'linear-gradient(135deg, rgba(201,106,58,0.08) 0%, rgba(201,106,58,0.03) 100%)' }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(201,106,58,0.15)' }}>
                                <Award size={18} style={{ color: '#C96A3A' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white/85' : 'text-sage-dark'}`}>
                                        This Week's Achievements
                                    </p>
                                    {highlightsBadge && (
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#C96A3A' }} />
                                    )}
                                </div>
                                <p className={`text-xs ${isDarkMode ? 'text-white/45' : 'text-sage/45'}`}>
                                    Review your wins, your reflection, and what moved you forward.
                                </p>
                            </div>
                            <ChevronRight size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-white/25' : 'text-sage/25'}`} />
                        </button>
                    )}

                    {onWriteLetter && (() => {
                        const letters = user?.futureLetters ?? [];
                        const letterCount = letters.length;
                        const lastLetter = letters[letters.length - 1];
                        const lastWrittenLabel = lastLetter
                            ? new Date(lastLetter.writtenDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                            : null;
                        return (
                            <button
                                onClick={() => { haptics.light(); onWriteLetter(); }}
                                className={`w-full rounded-2xl px-5 py-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] ${isDarkMode ? 'glass-surface border border-white/10 hover:border-white/20' : 'bg-white/70 border border-sage/15 shadow-sm hover:shadow-md'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#E5D6A7]/12' : 'bg-[#E5D6A7]/20'}`}>
                                    <Mail size={18} color="#E5D6A7" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium mb-0.5 ${isDarkMode ? 'text-white/85' : 'text-sage-dark'}`}>
                                        {letterCount === 0 ? 'Write your first letter' : 'Write another letter'}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-white' : 'text-sage/45'}`}>
                                        {letterCount === 0
                                            ? 'A message from who you are now to who you\'ll become.'
                                            : `Last written ${lastWrittenLabel}${letterCount > 1 ? ` · ${letterCount} letters` : ''}`}
                                    </p>
                                </div>
                                <ChevronRight size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-sage/25'}`} />
                            </button>
                        );
                    })()}
                    </div>
                </div>
            )}

            {/* Info modal: portal */}
            {createPortal(
                <AnimatePresence>
                    {infoTarget && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] flex items-end justify-center"
                            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
                            onClick={() => setInfoTarget(null)}
                        >
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                                className={`w-full max-w-md rounded-t-[2.5rem] px-7 pt-7 pb-10 ${overlayBg} shadow-2xl`}
                                style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Handle */}
                                <div className={`w-10 h-1 rounded-full mx-auto mb-6 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-white/[0.12]' : 'bg-sage/10'}`}>
                                            {React.createElement(infoTarget.icon, { size: 22, className: isDarkMode ? 'text-pale-gold' : 'text-sage' })}
                                        </div>
                                        <div>
                                            <h3 className={`font-display font-semibold text-xl leading-tight ${textPrimary}`}>
                                                {infoTarget.title}
                                            </h3>
                                            <p className={`text-xs mt-0.5 ${textMuted}`}>{infoTarget.subtitle}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setInfoTarget(null)}
                                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                                    >
                                        <X size={18} className={textMuted} />
                                    </button>
                                </div>

                                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-white/75' : 'text-sage-dark/75'}`}>
                                    {infoTarget.info}
                                </p>

                                <button
                                    onClick={() => { setInfoTarget(null); haptics.medium(); onNavigate(infoTarget.id); }}
                                    className={`mt-7 w-full py-4 rounded-[2rem] font-display font-semibold text-sm uppercase tracking-widest transition-all active:scale-[0.98] bg-terracotta-500 text-white shadow-lg`}
                                >
                                    Open {infoTarget.title}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Weekly Insights explainer */}
            <SlideUpModal
                isOpen={showInsightsExplainer}
                onClose={() => setShowInsightsExplainer(false)}
                isDarkMode={isDarkMode}
            >
                <div className={`p-6 w-full max-w-sm mx-auto ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'}`}>
                            <TrendingUp size={24} />
                        </div>
                        <h2 className="text-3xl font-display font-medium mb-2">Unlock Your Insights</h2>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-sage-dark/60'}`}>
                            Once you track your focus for a few days, Palante will start spotting patterns to help you optimize your flow.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: Lightbulb, title: "Productivity Patterns", desc: "Discover when you do your best work." },
                            { icon: Zap, title: "Energy Correlation", desc: "See how your mood affects your output." },
                            { icon: GoalIcon, title: "Consistency Score", desc: "Track your streak and reliability." }
                        ].map((item, i) => (
                            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                <item.icon size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                <div>
                                    <h3 className="font-medium text-sm mb-0.5">{item.title}</h3>
                                    <div className={`text-xs ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowInsightsExplainer(false)}
                        className={`w-full py-4 mt-8 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isDarkMode
                            ? 'bg-pale-gold text-sage-dark hover:bg-white'
                            : 'bg-terracotta-500 text-white hover:bg-sage-600'}`}
                    >
                        Got it
                    </button>
                </div>
            </SlideUpModal>
        </div>
    );
};
