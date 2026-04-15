
import {
    Wind,
    Flower,
    BookOpen,
    Utensils,
    Music,
    Layers,
    Compass,
    Settings2,
    Sparkles,
    Timer
} from 'lucide-react';

import React, { useMemo, useState, useCallback } from 'react';
import type { UserProfile } from '../types';
import { ReorderModal } from './ReorderModal';
import {
    DndContext,
    useSensors,
    useSensor,
    closestCenter,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,   // ← grid-aware strategy
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { haptics } from '../utils/haptics';

interface ExploreViewProps {
    onNavigate: (section: 'breath' | 'meditate' | 'reflect' | 'fasting' | 'soundscapes' | 'routines' | 'wisdom' | 'pomodoro') => void;
    isDarkMode: boolean;
    user: UserProfile | null;
    updateProfile: (updatedUser: UserProfile) => Promise<void>;
}

export const ExploreView = ({ onNavigate, isDarkMode, user, updateProfile }: ExploreViewProps) => {
    const [showReorder, setShowReorder] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const toolsDef = useMemo(() => [
        {
            id: 'wisdom',
            title: 'Japanese Wisdom',
            description: 'Master ancient systems for inevitable action.',
            icon: Sparkles,
        },
        {
            id: 'routines',
            title: 'Habit Builder',
            description: 'Design custom habits and morning rituals.',
            icon: Layers,
        },
        {
            id: 'reflect',
            title: 'Journal',
            description: 'Capture thoughts and track your growth.',
            icon: BookOpen,
        },
        {
            id: 'meditate',
            title: 'Meditation',
            description: 'Find calm with curated sessions.',
            icon: Flower,
        },
        {
            id: 'soundscapes',
            title: 'Soundscapes',
            description: 'Immersive audio for focus or sleep.',
            icon: Music,
        },
        {
            id: 'breath',
            title: 'Breathwork',
            description: 'Regulate your nervous system.',
            icon: Wind,
        },
        {
            id: 'fasting',
            title: 'Fasting Timer',
            description: 'Track fasting windows for optimal health.',
            icon: Utensils,
        },
        {
            id: 'pomodoro',
            title: 'Pomodoro',
            description: 'Master focus with work/rest cycles.',
            icon: Timer,
        }
    ] as const, []);

    const sortedTools = useMemo(() => {
        if (!user?.exploreOrder || user.exploreOrder.length === 0) return toolsDef;
        const order = user.exploreOrder;
        return [...toolsDef].sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });
    }, [toolsDef, user]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        haptics.selection();
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            haptics.medium();
            const oldOrder = sortedTools.map(t => t.id as string);
            const oldIndex = oldOrder.indexOf(active.id as string);
            const newIndex = oldOrder.indexOf(over.id as string);
            const newOrder = arrayMove(oldOrder, oldIndex, newIndex);
            if (user) updateProfile({ ...user, exploreOrder: newOrder });
        }
    }, [sortedTools, user, updateProfile]);

    const bgClass = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/10';
    const textClass = isDarkMode ? 'text-white' : 'text-sage';
    const subTextClass = isDarkMode ? 'text-white/50' : 'text-sage/55';

    const activeTool = activeId ? toolsDef.find(t => t.id === activeId) : null;

    return (
        <div className="px-4 pt-6 pb-32 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 px-2">
                <div className="flex items-start gap-3">
                    <Compass className={`w-6 h-6 mt-1 flex-shrink-0 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />
                    <div>
                        <h2 className={`font-display font-medium text-2xl leading-tight ${textClass}`}>
                            Toolkit
                        </h2>
                        <p className={`text-[12px] font-body italic mt-0.5 tracking-wide ${isDarkMode ? 'text-white/35' : 'text-sage/45'}`}>
                            Explore, practice, evolve.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowReorder(true)}
                    className={`p-2 rounded-full transition-colors mt-0.5 flex-shrink-0 ${
                        isDarkMode
                            ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                            : 'bg-sage/5 text-sage/40 hover:bg-sage/10 hover:text-sage'
                    }`}
                    title="Customize Toolkit"
                >
                    <Settings2 size={20} />
                </button>
            </div>

            {/* 2-column drag grid */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <SortableContext
                    items={sortedTools.map(t => t.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-2 gap-3">
                        {sortedTools.map((tool) => (
                            <SortableToolCard
                                key={tool.id}
                                tool={tool}
                                isDarkMode={isDarkMode}
                                bgClass={bgClass}
                                textClass={textClass}
                                subTextClass={subTextClass}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                </SortableContext>

                {/* Floating drag ghost */}
                <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
                    {activeTool ? (
                        <ToolCardContent
                            tool={activeTool}
                            isDarkMode={isDarkMode}
                            bgClass={bgClass}
                            textClass={textClass}
                            subTextClass={subTextClass}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <ReorderModal
                isOpen={showReorder}
                onClose={() => setShowReorder(false)}
                isDarkMode={isDarkMode}
                title="Arrange Toolkit"
                items={toolsDef.map(t => ({ id: t.id, label: t.title }))}
                currentOrder={user?.exploreOrder || toolsDef.map(t => t.id)}
                onSave={(newOrder) => {
                    if (user) updateProfile({ ...user, exploreOrder: newOrder });
                }}
            />
        </div>
    );
};

type ToolId = 'breath' | 'meditate' | 'reflect' | 'fasting' | 'soundscapes' | 'routines' | 'wisdom' | 'pomodoro';

interface SortableToolCardProps {
    tool: {
        id: ToolId;
        title: string;
        description: string;
        icon: React.ComponentType<{ className?: string }>;
    };
    isDarkMode: boolean;
    bgClass: string;
    textClass: string;
    subTextClass: string;
    onNavigate: (id: ToolId) => void;
}

interface ToolCardContentProps {
    tool: SortableToolCardProps['tool'];
    isDarkMode: boolean;
    bgClass: string;
    textClass: string;
    subTextClass: string;
    isOverlay?: boolean;
    [key: string]: unknown;
}

const ToolCardContent = ({
    tool,
    isDarkMode,
    bgClass,
    textClass,
    subTextClass,
    isOverlay,
    ...rest
}: ToolCardContentProps) => {
    const Icon = tool.icon;
    return (
        <div
            className={`
                relative flex flex-col items-start
                p-4 rounded-[24px] border w-full h-full min-h-[140px]
                backdrop-blur-sm overflow-hidden
                transition-all duration-200
                ${isOverlay
                    ? 'scale-[1.04] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)] rotate-1 cursor-grabbing'
                    : 'hover:scale-[1.02] active:scale-[0.98] cursor-grab'
                }
                ${bgClass}
            `}
            {...rest}
        >
            {/* Subtle glow orb */}
            <div
                className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-20 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
            />

            {/* Icon + drag handle row */}
            <div className="flex items-start justify-between w-full mb-3">
                <div className={`p-2.5 rounded-[14px] ${isDarkMode ? 'bg-white/6' : 'bg-sage/8'} pointer-events-none`}>
                    <Icon className={`w-5 h-5 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />
                </div>
                {/* Drag dots */}
                <div className={`flex flex-col gap-[3px] items-center mt-1 mr-0.5 transition-opacity ${isOverlay ? 'opacity-80' : 'opacity-20'} ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                    <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-current" />
                        <div className="w-[3px] h-[3px] rounded-full bg-current" />
                    </div>
                    <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-current" />
                        <div className="w-[3px] h-[3px] rounded-full bg-current" />
                    </div>
                    <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-current" />
                        <div className="w-[3px] h-[3px] rounded-full bg-current" />
                    </div>
                </div>
            </div>

            <h3 className={`font-display font-semibold text-[14px] leading-tight mb-1 pointer-events-none ${textClass}`}>
                {tool.title}
            </h3>
            <p className={`font-body text-[11px] leading-relaxed pointer-events-none ${subTextClass}`}>
                {tool.description}
            </p>
        </div>
    );
};

const SortableToolCard = ({
    tool,
    isDarkMode,
    bgClass,
    textClass,
    subTextClass,
    onNavigate,
}: SortableToolCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tool.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'transform 180ms cubic-bezier(0.25,1,0.5,1)',
        zIndex: isDragging ? 0 : 1,
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-full h-full"
        >
            {isDragging ? (
                /* Ghost placeholder while dragging */
                <div
                    className={`w-full min-h-[140px] rounded-[24px] border-2 border-dashed flex items-center justify-center
                        ${isDarkMode ? 'border-pale-gold/30 bg-pale-gold/5' : 'border-sage/25 bg-sage/5'}`}
                >
                    <div className={`w-8 h-1 rounded-full animate-pulse ${isDarkMode ? 'bg-pale-gold/40' : 'bg-sage/30'}`} />
                </div>
            ) : (
                <button
                    {...attributes}
                    {...listeners}
                    onClick={() => onNavigate(tool.id)}
                    className="w-full h-full p-0 m-0 bg-transparent border-none outline-none appearance-none block text-left touch-none"
                >
                    <ToolCardContent
                        tool={tool}
                        isDarkMode={isDarkMode}
                        bgClass={bgClass}
                        textClass={textClass}
                        subTextClass={subTextClass}
                    />
                </button>
            )}
        </div>
    );
};
