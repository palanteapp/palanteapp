import React, { useState, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DailyFocus } from '../types';
import { haptics } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';

interface FocusItemProps {
    focus: DailyFocus;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export const FocusItem: React.FC<FocusItemProps> = ({
    focus,
    onToggle,
    onDelete,
}) => {
    const { isDarkMode } = useTheme();
    const bgClass = isDarkMode ? 'glass-surface' : 'bg-white/60 border-sage/20';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const roundedClass = 'rounded-card-premium';

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(focus.text);
    const inputRef = useRef<HTMLInputElement>(null);

    // Swipe State
    const [swipeOffset, setSwipeOffset] = useState(0);
    const touchStartX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isEditing) return;
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartX.current || isEditing) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;

        // Limit swipe range
        if (diff > 150) setSwipeOffset(150);
        else if (diff < -150) setSwipeOffset(-150);
        else setSwipeOffset(diff);
    };

    const handleTouchEnd = () => {
        const threshold = 100;
        if (swipeOffset > threshold) {
            if (!focus.isCompleted) haptics.success();
            onToggle(focus.id);
        } else if (swipeOffset < -threshold) {
            haptics.medium();
            onDelete(focus.id);
        }
        setSwipeOffset(0);
    };

    const handleEditSubmit = () => {
        if (editText.trim() && editText !== focus.text) {
            haptics.selection();
            window.dispatchEvent(new CustomEvent('edit-focus', {
                detail: { id: focus.id, text: editText.trim() }
            }));
        }
        setIsEditing(false);
    };

    // Drag and Drop State
    const [dragOverSide, setDragOverSide] = useState<'top' | 'bottom' | null>(null);

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('focusId', focus.id);
        e.dataTransfer.effectAllowed = 'move';

        // Hide default "black box" drag preview by setting a transparent image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        (e.currentTarget as HTMLElement).classList.add('opacity-40');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove('opacity-40');
        setDragOverSide(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Determine if mouse is in top or bottom half
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        setDragOverSide(y < rect.height / 2 ? 'top' : 'bottom');
    };

    const handleDragLeave = () => {
        setDragOverSide(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('focusId');
        setDragOverSide(null);

        if (draggedId && draggedId !== focus.id) {
            window.dispatchEvent(new CustomEvent('reorder-focus', {
                detail: { draggedId, targetId: focus.id, side: dragOverSide }
            }));
        }
    };

    const getSwipeBackground = () => {
        if (swipeOffset > 20) return isDarkMode ? 'bg-sage/40' : 'bg-sage/20';
        if (swipeOffset < -20) return isDarkMode ? 'bg-red-500/40' : 'bg-red-500/20';
        return 'transparent';
    };

    return (
        <div
            className={`relative overflow-hidden rounded-2xl mb-3 outline-none select-none transition-all duration-200 ${dragOverSide === 'top' ? 'pt-2' : dragOverSide === 'bottom' ? 'pb-2' : ''} ${isEditing ? '' : 'touch-none'}`}
            draggable={!isEditing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            {/* Landing Line Indicator */}
            {dragOverSide && (
                <div className={`absolute left-4 right-4 h-0.5 rounded-full z-50 transition-all ${isDarkMode ? 'bg-pale-gold shadow-[0_0_8px_rgba(232,201,155,0.5)]' : 'bg-sage shadow-[0_0_8px_rgba(115,134,120,0.3)]'} ${dragOverSide === 'top' ? 'top-0' : 'bottom-0'}`} />
            )}
            {/* Swipe Background Indicator */}
            <div className={`absolute inset-0 flex items-center justify-between px-6 transition-colors duration-300 rounded-2xl ${getSwipeBackground()}`}>
                <div className={`transition-opacity duration-300 ${swipeOffset > 20 ? 'opacity-100' : 'opacity-0'}`}>
                    <Check size={24} className={isDarkMode ? 'text-sage' : 'text-sage-dark'} />
                </div>
                <div className={`transition-opacity duration-300 ${swipeOffset < -20 ? 'opacity-100' : 'opacity-0'}`}>
                    <X size={24} className="text-red-500" />
                </div>
            </div>

            {/* Foreground Card */}
            <motion.div
                onTouchStart={isEditing ? undefined : handleTouchStart}
                onTouchMove={isEditing ? undefined : handleTouchMove}
                onTouchEnd={isEditing ? undefined : handleTouchEnd}
                whileTap={isEditing ? {} : { scale: 0.98 }}
                animate={{
                    transform: `translateX(${swipeOffset}px)`,
                    scale: focus.isCompleted ? [1, 1.02, 1] : 1
                }}
                transition={{
                    scale: { 
                        type: 'spring', 
                        stiffness: 400, 
                        damping: 10 
                    },
                    transform: { type: 'spring', damping: 25, stiffness: 300 }
                }}
                className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 ease-out select-none ${bgClass} ${focus.isCompleted ? 'opacity-60' : 'hover:scale-[1.01] hover:shadow-spa'} ${isEditing ? 'border-pale-gold ring-2 ring-amber/20 animate-pulse-subtle' : ''}`}
            >
                {/* Completion Shimmer Effect */}
                <AnimatePresence>
                    {focus.isCompleted && (
                        <motion.div
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: '100%', opacity: [0, 1, 0] }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                            className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-4 flex-1 relative z-10">
                    <button
                        onClick={() => {
                            if (!isEditing) {
                                if (!focus.isCompleted) haptics.success();
                                onToggle(focus.id);
                            }
                        }}
                        className={`relative flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${focus.isCompleted
                            ? 'bg-terracotta border-terracotta text-white'
                            : isDarkMode ? 'border-white/30 hover:border-pale-gold' : 'border-sage/30 hover:border-sage'
                            }`}
                    >
                        {focus.isCompleted && <Check size={16} strokeWidth={3} />}
                        {focus.isCompleted && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 rounded-full bg-terracotta"
                            ></motion.span>
                        )}
                    </button>

                    <div className="flex-1">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleEditSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                                className={`w-full bg-transparent border-none outline-none text-lg font-medium ${textPrimary}`}
                                autoFocus
                            />
                        ) : (
                            <span
                                onClick={() => !focus.isCompleted && setIsEditing(true)}
                                className={`text-lg font-medium transition-all duration-300 block mb-2 cursor-text ${focus.isCompleted ? 'opacity-50 line-through decoration-sage/30' : textPrimary}`}
                            >
                                {focus.text}
                            </span>
                        )}

                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                            <motion.div
                                className={`h-full rounded-full ${isDarkMode ? 'bg-amber' : 'bg-terracotta'}`}
                                initial={{ width: focus.isCompleted ? '0%' : '0%' }}
                                animate={{ width: focus.isCompleted ? '100%' : '0%' }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            haptics.medium();
                            onDelete(focus.id);
                        }}
                        className={`p-2 rounded-full transition-all relative z-10 ${focus.isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'}`}
                    >
                        <X size={18} />
                    </button>

                    <div className={`p-2 cursor-grab active:cursor-grabbing transition-opacity ${focus.isCompleted ? 'hidden' : 'opacity-0 group-hover:opacity-100'} ${isDarkMode ? 'text-white/20' : 'text-sage/20'}`}>
                        <div className="grid grid-cols-2 gap-1">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-1 h-1 rounded-full bg-current" />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
