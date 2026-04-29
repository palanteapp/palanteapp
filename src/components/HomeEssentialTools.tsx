import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wind, Flower2, BookOpen, Utensils, Music, Layers, Sparkles, Timer,
    Wrench, X, Check, Pencil, GripVertical,
} from 'lucide-react';
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { haptics } from '../utils/haptics';

export type EssentialToolId =
    | 'breath' | 'meditate' | 'reflect' | 'fasting'
    | 'soundscapes' | 'routines' | 'wisdom' | 'focus' | 'toolkit';

interface Tool {
    id: EssentialToolId;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
}

const ALL_TOOLS: Tool[] = [
    { id: 'breath',      label: 'Breathe',      sublabel: 'REGULATE',    icon: <Wind size={24} />,     color: '#7A9B84' },
    { id: 'fasting',     label: 'Fast',          sublabel: 'FASTING',     icon: <Utensils size={24} />, color: '#C96A3A' },
    { id: 'toolkit',     label: 'Toolkit',       sublabel: 'RESOURCES',   icon: <Wrench size={24} />,   color: '#8B6914' },
    { id: 'meditate',    label: 'Meditate',      sublabel: 'MINDFULNESS', icon: <Flower2 size={24} />,  color: '#879582' },
    { id: 'reflect',     label: 'Reflect',       sublabel: 'JOURNAL',     icon: <BookOpen size={24} />, color: '#B07B5A' },
    { id: 'soundscapes', label: 'Sonic Canvas',   sublabel: 'AUDIO',       icon: <Music size={24} />,    color: '#415D43' },
    { id: 'routines',    label: 'Routines',      sublabel: 'HABITS',      icon: <Layers size={24} />,   color: '#5C7A5E' },
    { id: 'wisdom',      label: 'Wisdom',        sublabel: 'QUOTES',      icon: <Sparkles size={24} />, color: '#8B6914' },
    { id: 'focus',       label: 'Focus Timer',   sublabel: 'CYCLES',      icon: <Timer size={24} />,    color: '#4A6741' },
];

const DEFAULT_TOOLS: EssentialToolId[] = ['breath', 'fasting', 'toolkit'];

interface HomeEssentialToolsProps {
    isDarkMode: boolean;
    selectedTools?: string[];
    fastingActive?: boolean;
    fastingTime?: string;
    onNavigate: (id: EssentialToolId) => void;
    onSave: (tools: EssentialToolId[]) => void;
}

// --- Drag-to-reorder row inside the modal ---
const SortableToolRow: React.FC<{
    id: EssentialToolId;
    tool: Tool;
    index: number;
    isDarkMode: boolean;
    onRemove: (id: EssentialToolId) => void;
}> = ({ id, tool, index, isDarkMode, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 'auto', opacity: isDragging ? 0.75 : 1 }}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isDarkMode ? 'bg-white/5 border-white/8' : 'bg-sage/5 border-sage/10'
            }`}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="touch-none p-1 cursor-grab active:cursor-grabbing"
                aria-label="Drag to reorder"
            >
                <GripVertical size={16} className={isDarkMode ? 'text-white/25' : 'text-sage/30'} />
            </button>

            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: tool.color }}
            >
                {React.cloneElement(tool.icon as React.ReactElement<{ size?: number }>, { size: 16 })}
            </div>

            <span className={`flex-1 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                {tool.label}
            </span>

            <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: tool.color }}
            >
                {index + 1}
            </div>

            <button
                onClick={() => onRemove(id)}
                className={`p-1 ml-0.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                aria-label={`Remove ${tool.label}`}
            >
                <X size={14} className={isDarkMode ? 'text-white/30' : 'text-sage/30'} />
            </button>
        </div>
    );
};

// --- Main component ---
export const HomeEssentialTools: React.FC<HomeEssentialToolsProps> = ({
    isDarkMode,
    selectedTools,
    fastingActive,
    fastingTime,
    onNavigate,
    onSave,
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<EssentialToolId[]>(() => {
        const saved = selectedTools?.filter((id): id is EssentialToolId => ALL_TOOLS.some(t => t.id === id));
        return saved?.length === 3 ? saved : [...DEFAULT_TOOLS];
    });

    const active: EssentialToolId[] = (() => {
        const saved = selectedTools?.filter((id): id is EssentialToolId => ALL_TOOLS.some(t => t.id === id));
        return saved?.length === 3 ? saved : [...DEFAULT_TOOLS];
    })();

    // @dnd-kit sensors — support both mouse and touch
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active: dragActive, over } = event;
        if (!over || dragActive.id === over.id) return;
        setDraft(prev => {
            const oldIdx = prev.indexOf(dragActive.id as EssentialToolId);
            const newIdx = prev.indexOf(over.id as EssentialToolId);
            return arrayMove(prev, oldIdx, newIdx);
        });
        haptics.light();
    };

    const toggleDraft = (id: EssentialToolId) => {
        haptics.light();
        if (draft.includes(id)) {
            setDraft(draft.filter(d => d !== id));
        } else if (draft.length < 3) {
            setDraft([...draft, id]);
        }
    };

    const handleSave = () => {
        haptics.medium();
        if (draft.length === 3) { onSave(draft); setEditing(false); }
    };

    const handleEdit = () => {
        haptics.light();
        setDraft([...active]);
        setEditing(true);
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textMuted = isDarkMode ? 'text-white/50' : 'text-sage-dark/50';
    const overlayBg = isDarkMode ? 'bg-sage-dark/95' : 'bg-ivory/97';

    return (
        <div className="w-full mb-6 px-1">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${textMuted}`}>Essential Tools</p>
                <button
                    onClick={handleEdit}
                    className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-full transition-all active:scale-95 ${
                        isDarkMode ? 'text-white/50 hover:text-white/80 hover:bg-white/10' : 'text-sage/50 hover:text-sage hover:bg-sage/10'
                    }`}
                >
                    <Pencil size={11} /> Customize
                </button>
            </div>

            {/* 3 big tool cards */}
            <div className="w-full flex gap-3">
                {active.map((id, i) => {
                    const tool = ALL_TOOLS.find(t => t.id === id)!;
                    const isFastingCard = id === 'fasting';

                    return (
                        <motion.button
                            key={id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { haptics.medium(); onNavigate(id); }}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 p-4 rounded-[2rem] border transition-all ${
                                isFastingCard && fastingActive
                                    ? isDarkMode
                                        ? 'bg-[#2D6A4F] border-[#40916C] shadow-xl backdrop-blur-md'
                                        : 'bg-[#40916C]/20 border-[#2D6A4F]/30 shadow-spa backdrop-blur-md'
                                    : isDarkMode
                                        ? 'bg-[#1B4332]/50 border-white/10 shadow-xl backdrop-blur-md hover:bg-[#1B4332]/70'
                                        : 'bg-white/60 border-sage/10 shadow-spa backdrop-blur-md hover:bg-sage/5'
                            }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg ${
                                    isFastingCard && fastingActive
                                        ? 'bg-[#52B788] text-white animate-pulse'
                                        : 'text-white'
                                }`}
                                style={!(isFastingCard && fastingActive) ? { backgroundColor: tool.color + 'cc' } : {}}
                            >
                                {React.cloneElement(tool.icon as React.ReactElement<{ fill?: string }>, {
                                    fill: isFastingCard && fastingActive ? 'currentColor' : 'none',
                                })}
                            </div>
                            <div className="text-center flex flex-col items-center">
                                <div className={`text-base font-display font-bold leading-tight mb-1 text-center max-w-[80px] ${
                                    isFastingCard && fastingActive ? 'text-white' : textPrimary
                                }`}>
                                    {isFastingCard && fastingActive && fastingTime ? fastingTime : tool.label}
                                </div>
                                <div className={`text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold ${textPrimary}`}>
                                    {tool.sublabel}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Customize modal — portal to escape any parent transforms */}
            {createPortal(
                <AnimatePresence>
                    {editing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] flex items-end justify-center"
                            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
                            onClick={(e) => { if (e.target === e.currentTarget) setEditing(false); }}
                        >
                            <motion.div
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 60, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                                className={`w-full max-w-md rounded-t-[2.5rem] pb-10 px-6 pt-6 ${overlayBg} shadow-2xl`}
                                style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Handle */}
                                <div className={`w-10 h-1 rounded-full mx-auto mb-5 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />

                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-display font-semibold text-lg ${textPrimary}`}>My Essential Tools</h3>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                                    >
                                        <X size={18} className={textMuted} />
                                    </button>
                                </div>
                                <p className={`text-sm mb-5 ${textMuted}`}>
                                    {draft.length}/3 selected · drag to reorder
                                </p>

                                {/* Draggable order list */}
                                {draft.length > 0 && (
                                    <div className="mb-5">
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={draft}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    {draft.map((id, idx) => {
                                                        const tool = ALL_TOOLS.find(t => t.id === id)!;
                                                        return (
                                                            <SortableToolRow
                                                                key={id}
                                                                id={id}
                                                                tool={tool}
                                                                index={idx}
                                                                isDarkMode={isDarkMode}
                                                                onRemove={(removeId) => {
                                                                    haptics.light();
                                                                    setDraft(d => d.filter(x => x !== removeId));
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className={`flex items-center gap-3 mb-4 ${draft.length < 3 ? '' : 'opacity-50'}`}>
                                    <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-sage/15'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>
                                        {draft.length < 3 ? `Choose ${3 - draft.length} more` : 'Tap to swap'}
                                    </span>
                                    <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-sage/15'}`} />
                                </div>

                                {/* Tool grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {ALL_TOOLS.map(tool => {
                                        const selected = draft.includes(tool.id);
                                        const disabled = !selected && draft.length >= 3;
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => toggleDraft(tool.id)}
                                                disabled={disabled}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left active:scale-[0.97] ${
                                                    selected
                                                        ? 'border-transparent shadow-md'
                                                        : disabled
                                                            ? `opacity-30 cursor-not-allowed ${isDarkMode ? 'border-white/5' : 'border-sage/10'}`
                                                            : `${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/15 hover:bg-sage/5'}`
                                                }`}
                                                style={selected ? { backgroundColor: tool.color + '22', borderColor: tool.color + '66' } : {}}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        backgroundColor: selected
                                                            ? tool.color
                                                            : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(65,93,67,0.12)',
                                                    }}
                                                >
                                                    <span style={{ color: selected ? 'white' : isDarkMode ? 'rgba(255,255,255,0.5)' : '#415D43' }}>
                                                        {React.cloneElement(tool.icon as React.ReactElement<{ size?: number }>, { size: 18 })}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold ${selected ? textPrimary : textMuted}`}>
                                                        {tool.label}
                                                    </p>
                                                </div>
                                                {selected && (
                                                    <div
                                                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: tool.color }}
                                                    >
                                                        <Check size={11} className="text-white" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={draft.length !== 3}
                                    className={`w-full py-4 rounded-[2rem] font-display font-semibold text-sm uppercase tracking-widest transition-all active:scale-[0.98] ${
                                        draft.length === 3
                                            ? 'bg-[#1B4332] text-white shadow-lg'
                                            : isDarkMode ? 'bg-white/10 text-white/30' : 'bg-sage/10 text-sage/30'
                                    }`}
                                >
                                    Save My Toolkit
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
