import React, { useState } from 'react';
import { Wind, Flower, Music, ChevronRight, Info, X, GripVertical } from 'lucide-react';
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

type PracticeId = 'breath' | 'meditate' | 'soundscapes';

interface PracticeViewProps {
    onNavigate: (section: PracticeId) => void;
    isDarkMode: boolean;
}

interface Practice {
    id: PracticeId;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    info: string;
    accent: { icon: string; bg: string; glow: string; border: string };
}

const PRACTICES: Practice[] = [
    {
        id: 'breath',
        title: 'Breathwork',
        subtitle: 'Regulate your nervous system',
        icon: Wind,
        info: 'Guided breathing patterns that activate your parasympathetic nervous system — easing anxiety, sharpening focus, and bringing you back to center in minutes. Choose from Energy, Relax, or Balance breathing.',
        accent: { icon: '#E5D6A7', bg: 'rgba(229,214,167,0.13)', glow: 'rgba(229,214,167,0.08)', border: 'rgba(229,214,167,0.30)' },
    },
    {
        id: 'meditate',
        title: 'Meditation',
        subtitle: 'Find calm with guided sessions',
        icon: Flower,
        info: 'Short, guided sessions designed to quiet mental noise and build presence. Whether you have 5 minutes or 20, each session is crafted to meet you where you are — no experience needed.',
        accent: { icon: '#E5D6A7', bg: 'rgba(229,214,167,0.13)', glow: 'rgba(229,214,167,0.08)', border: 'rgba(229,214,167,0.30)' },
    },
    {
        id: 'soundscapes',
        title: 'Sonic Canvas',
        subtitle: 'Immersive audio for focus or rest',
        icon: Music,
        info: 'Layer ambient sounds — rain, forest, white noise, binaural tones — to create your ideal sonic environment. Use it for deep work, sleep, meditation, or just blocking out the world for a moment.',
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

                {/* Text — tappable to navigate */}
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
export const PracticeView: React.FC<PracticeViewProps> = ({ onNavigate, isDarkMode }) => {
    const [order, setOrder] = useState<PracticeId[]>(PRACTICES.map(p => p.id));
    const [infoTarget, setInfoTarget] = useState<Practice | null>(null);

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
                <h2 className={`font-display font-medium text-3xl ${textPrimary}`}>Practice</h2>
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

            {/* Info modal — portal */}
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
                                    className={`mt-7 w-full py-4 rounded-[2rem] font-display font-semibold text-sm uppercase tracking-widest transition-all active:scale-[0.98] bg-[#1B4332] text-white shadow-lg`}
                                >
                                    Open {infoTarget.title}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
