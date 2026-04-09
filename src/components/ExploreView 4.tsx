
import {
    Wind,
    Flower,
    BookOpen,
    Utensils,
    Music,
    Layers,
    Compass,
    Settings2,
    ArrowRight,
    Sparkles,
    Timer
} from 'lucide-react';

import { useMemo, useState, useCallback } from 'react';
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
    verticalListSortingStrategy,
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
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Defines tools definitions
    const toolsDef = useMemo(() => [
        {
            id: 'wisdom',
            title: 'Japanese Wisdom',
            description: 'Master the 7 ancient systems for inevitable action.',
            icon: Sparkles,
            actionLabel: 'Enter Wisdom'
        },
        {
            id: 'routines',
            title: 'Habit Builder',
            description: 'Design custom habits and morning rituals.',
            icon: Layers,
            actionLabel: 'Manage Routines'
        },
        {
            id: 'reflect',
            title: 'Reflection Journal',
            description: 'Capture your thoughts and track your growth.',
            icon: BookOpen,
            actionLabel: 'Start Reflection'
        },
        {
            id: 'meditate',
            title: 'Meditation Station',
            description: 'Find calm and clarity with curated sessions.',
            icon: Flower,
            actionLabel: 'Open Library'
        },
        {
            id: 'soundscapes',
            title: 'Soundscapes',
            description: 'Immersive audio environments for focus or sleep.',
            icon: Music,
            actionLabel: 'Listen Now'
        },
        {
            id: 'breath',
            title: 'Breathwork Studio',
            description: 'Regulate your nervous system with guided breathing.',
            icon: Wind,
            actionLabel: 'Start Breathing'
        },
        {
            id: 'fasting',
            title: 'Fasting Timer',
            description: 'Track your fasting windows for optimal health.',
            icon: Utensils,
            actionLabel: 'Open Timer'
        },
        {
            id: 'pomodoro',
            title: 'Pomodoro Timer',
            description: 'Master your focus with customizable work/rest cycles.',
            icon: Timer,
            actionLabel: 'Open Timer'
        }
    ] as const, []);

    // Derived sorted tools
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
    }, [toolsDef, user?.exploreOrder]);

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
            const activeId = active.id as string;
            const overId = over.id as string;

            const oldIndex = oldOrder.indexOf(activeId);
            const newIndex = oldOrder.indexOf(overId);

            const newOrder = arrayMove(oldOrder, oldIndex, newIndex);
            if (user) {
                updateProfile({ ...user, exploreOrder: newOrder });
            }
        }
    }, [sortedTools, user, updateProfile]);

    // Theme constants
    const bgClass = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/10';
    const textClass = isDarkMode ? 'text-white' : 'text-sage';
    const subTextClass = isDarkMode ? 'text-white/60' : 'text-sage/60';

    return (
        <div className="px-8 pt-6 pb-32 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Compass className={`w-6 h-6 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />
                    <h2 className={`font-display font-medium text-2xl ${textClass}`}>
                        Toolkit
                    </h2>
                </div>

                <button
                    onClick={() => setShowReorder(true)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-sage/5 text-sage/40 hover:bg-sage/10 hover:text-sage'
                        }`}
                    title="Customize Toolkit"
                >
                    <Settings2 size={20} />
                </button>
            </div>

            {/* Grid with Drag and Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <SortableContext
                    items={sortedTools.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <DragOverlay dropAnimation={{ duration: 250, easing: 'ease-out' }}>
                    {activeId ? (
                        <ToolCardContent
                            tool={toolsDef.find(t => t.id === activeId)!}
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
                    if (user) {
                        updateProfile({ ...user, exploreOrder: newOrder });
                    }
                }}
            />
        </div>
    );
};

interface SortableToolCardProps {
    tool: {
        id: 'breath' | 'meditate' | 'reflect' | 'fasting' | 'soundscapes' | 'routines' | 'wisdom' | 'pomodoro';
        title: string;
        description: string;
        icon: any;
    };
    isDarkMode: boolean;
    bgClass: string;
    textClass: string;
    subTextClass: string;
    onNavigate: (id: any) => void;
}

const ToolCardContent = ({ tool, isDarkMode, bgClass, textClass, subTextClass, isOverlay, ...rest }: any) => {
    const Icon = tool.icon;
    return (
        <div
            className={`text-left p-5 rounded-3xl border transition-all duration-300 group flex flex-col items-start relative w-full h-full min-h-[140px] ${isOverlay ? 'scale-105 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] rotate-2 cursor-grabbing' : 'hover:scale-[1.02] active:scale-[0.98] cursor-grab'} ${bgClass} backdrop-blur-sm overflow-hidden`}
            {...rest}
        >
            <div className="flex justify-between items-start mb-4 w-full">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage/10'} pointer-events-none`}>
                    <Icon className={`w-6 h-6 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />
                </div>
                <div className={`flex flex-col gap-1 items-center justify-center h-full mr-2 transition-opacity ${isOverlay ? 'opacity-100 text-pale-gold' : 'opacity-30 group-hover:opacity-100'} ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    <div className="w-1 h-3 rounded-full bg-current pointer-events-none" />
                    <div className="w-1 h-3 rounded-full bg-current pointer-events-none" />
                </div>
            </div>

            <h3 className={`font-display font-medium text-lg mb-1 pointer-events-none ${textClass}`}>
                {tool.title}
            </h3>

            <p className={`font-body text-xs leading-relaxed pointer-events-none ${subTextClass}`}>
                {tool.description}
            </p>
        </div>
    );
};

const SortableToolCard = ({ tool, isDarkMode, bgClass, textClass, subTextClass, onNavigate }: SortableToolCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: tool.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 0 : 1,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-full h-full min-h-[140px] rounded-[2rem] border-2 border-dashed border-pale-gold/50 flex flex-col items-center justify-center opacity-70 bg-pale-gold/5"
            >
                <div className="w-1/3 h-1.5 rounded-full bg-pale-gold animate-pulse shadow-[0_0_15px_rgba(229,214,167,0.5)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-pale-gold/70 mt-3 animate-pulse">Drop Here</span>
            </div>
        );
    }

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onNavigate(tool.id)}
            className="w-full h-full !p-0 !m-0 !bg-transparent border-none outline-none appearance-none block text-left"
        >
            <ToolCardContent
                tool={tool}
                isDarkMode={isDarkMode}
                bgClass={bgClass}
                textClass={textClass}
                subTextClass={subTextClass}
            />
        </button>
    );
};
