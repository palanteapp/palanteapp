
import React, { useState, useEffect } from 'react';
import { X, Save, Clock, GripVertical, Trash2, Plus } from 'lucide-react';
import type { RoutineStack, StackStep } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StackEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    routine: RoutineStack | null;
    onSave: (updatedRoutine: RoutineStack) => void;
    isDarkMode: boolean;
}

type StepType = 'breathwork' | 'meditation' | 'journal' | 'quote' | 'checkin' | 'fasting' | 'gratitude' | 'affirmation';

// Sortable Item Component
const SortableStepItem = ({
    step,
    index: _index,
    handleStepChange,
    removeStep,
    isDarkMode
}: {
    step: StackStep;
    index: number;
    handleStepChange: (id: string, field: keyof StackStep, value: string | number | boolean) => void;
    removeStep: (id: string) => void;
    isDarkMode: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-3 rounded-xl border flex items-center gap-3 group relative transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-stone-200'
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="opacity-30 cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <input
                    value={step.label}
                    onChange={e => handleStepChange(step.id, 'label', e.target.value)}
                    className="bg-transparent border-none outline-none font-medium text-sm w-full"
                />
                <div className="text-xs opacity-50 capitalize">{step.type}</div>
            </div>

            {/* Duration Input (seconds) */}
            <div className="flex items-center gap-1 bg-[#3A1700]/5 dark:bg-white/10 px-2 py-1 rounded-md">
                <Clock size={12} className="opacity-50" />
                <input
                    type="number"
                    value={step.duration !== undefined ? Math.round(step.duration / 60) : 0}
                    onChange={e => handleStepChange(step.id, 'duration', parseInt(e.target.value) * 60)}
                    className="w-8 bg-transparent text-right outline-none text-xs font-mono"
                />
                <span className="text-[10px] opacity-50">min</span>
            </div>

            <button
                onClick={() => removeStep(step.id)}
                className={`opacity-0 group-hover:opacity-100 p-2 transition-all ${isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-sage/40 hover:text-sage/60'}`}
                type="button"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export const StackEditorModal: React.FC<StackEditorModalProps> = ({
    isOpen,
    onClose,
    routine,
    onSave,
    isDarkMode
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState<StackStep[]>([]);
    const [themeColor, setThemeColor] = useState('sage');

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (prevents accidental drags on tap)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Calculate total duration
    const totalDuration = steps.reduce((acc, s) => acc + (s.duration || 0), 0) / 60; // in minutes

    // Load routine data when opening
    useEffect(() => {
        if (routine) {
            Promise.resolve().then(() => {
                setName(routine.name);
                setDescription(routine.description || '');
                setSteps(JSON.parse(JSON.stringify(routine.steps))); // Deep copy
                setThemeColor(routine.themeColor || 'sage');
            });
        } else {
            // New routine defaults
            Promise.resolve().then(() => {
                setName('New Routine');
                setDescription('');
                setSteps([]);
                setThemeColor('sage');
            });
        }
    }, [routine, isOpen]);

    if (!isOpen) return null;

    const bgClass = isDarkMode ? 'bg-sage-mid text-white' : 'bg-ivory text-sage';
    const inputClass = isDarkMode ? 'bg-white/5 border-white/10 focus:border-pale-gold' : 'bg-white border-stone-200 focus:border-sage';

    const handleStepChange = (id: string, field: keyof StackStep, value: string | number | boolean) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id));
    };

    const addStep = (type: StepType) => {
        const newStep: StackStep = {
            id: uuidv4(),
            type,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            duration: 300 // 5 min default
        };
        setSteps(prev => [...prev, newStep]);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSteps((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = () => {
        if (!routine) return; // Should allow creating new too, but for now editing existing

        const totalDuration = steps.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;

        const updated: RoutineStack = {
            ...routine,
            name,
            description,
            steps,
            totalDuration: Math.round(totalDuration),
            themeColor
        };
        onSave(updated);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-[#3A1700]/40 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] ${bgClass}`}>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-medium">Edit Routine</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[#3A1700]/5 dark:hover:bg-white/5">
                        <X size={20} className="opacity-50" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 px-2">
                    {/* Name Input */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">Routine Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className={`w-full p-3 rounded-xl border outline-none transition-all ${inputClass}`}
                            placeholder="My Awesome Routine"
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={`w-full p-3 rounded-xl border outline-none transition-all resize-none ${inputClass}`}
                            placeholder="What's this routine for?"
                            rows={2}
                        />
                    </div>

                    {/* Steps List */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-60">Steps sequence</label>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                <Clock size={12} className="inline mr-1" />
                                {Math.round(totalDuration)} min total
                            </div>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={steps.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <SortableStepItem
                                            key={step.id}
                                            step={step}
                                            index={index}
                                            handleStepChange={handleStepChange}
                                            removeStep={removeStep}
                                            isDarkMode={isDarkMode}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Add Step Button */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {(['breathwork', 'meditation', 'gratitude', 'affirmation', 'journal', 'quote'] as StepType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => addStep(type)}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium border border-dashed flex items-center justify-center gap-2 hover:opacity-100 transition-all ${isDarkMode ? 'border-white/20 text-white/60 hover:bg-white/5' : 'border-sage/30 text-sage/70 hover:bg-sage/5'}`}
                                >
                                    <Plus size={14} />
                                    Add {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full font-medium hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 bg-sage text-white rounded-full font-medium shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>

            </div>
        </div >
    );
};
