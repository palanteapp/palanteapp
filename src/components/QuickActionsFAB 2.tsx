import React, { useState, useMemo } from 'react';
import {
    Plus,
    Flame,
    Wind,
    Flower,
    Utensils,
    X,
    MessageCircle,
    Sparkles,
    Timer,
    BookOpen,
    Layers,
    Music
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../utils/haptics';

interface QuickActionsFABProps {
    onAction: (action: string) => void;
    isDarkMode: boolean;
    userOrder?: string[];
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({ onAction, isDarkMode, userOrder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        haptics.medium();
        setIsOpen(!isOpen);
    };

    const toolsDef = useMemo(() => [
        { id: 'wisdom', icon: <Sparkles size={14} />, label: 'Wisdom' },
        { id: 'pomodoro', icon: <Timer size={14} />, label: 'Timer' },
        { id: 'routines', icon: <Layers size={14} />, label: 'Habits' },
        { id: 'reflect', icon: <BookOpen size={14} />, label: 'Journal' },
        { id: 'meditate', icon: <Flower size={14} />, label: 'Meditate' },
        { id: 'soundscapes', icon: <Music size={14} />, label: 'Sounds' },
        { id: 'breath', icon: <Wind size={14} />, label: 'Breathe' },
        { id: 'fasting', icon: <Utensils size={14} />, label: 'Fast' },
        { id: 'coach', icon: <MessageCircle size={14} />, label: 'Coach' },
    ], []);

    const actions = useMemo(() => {
        if (!userOrder || userOrder.length === 0) return toolsDef;

        // Custom order includes most but maybe not Coach (since it's not in explore grid)
        // We'll append Coach to the end if not present
        const sorted = [...toolsDef].sort((a, b) => {
            const indexA = userOrder.indexOf(a.id);
            const indexB = userOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });

        return sorted;
    }, [userOrder, toolsDef]);

    const handleAction = (id: string) => {
        haptics.success();
        onAction(id);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex flex-col items-end gap-3 mb-2 pointer-events-auto"
                    >
                        {actions.map((action, index) => (
                            <motion.button
                                key={action.id}
                                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: 0,
                                    transition: { delay: index * 0.05 }
                                }}
                                onClick={() => handleAction(action.id)}
                                className={`flex items-center gap-2 pr-1.5 pl-3 py-1.5 rounded-full shadow-xl transition-all active:scale-95 bg-sage/80 backdrop-blur-xl border border-white/10 text-white`}
                            >
                                <span className={`text-[11px] font-bold uppercase tracking-widest text-white`}>
                                    {action.label}
                                </span>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white`}>
                                    {action.icon}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={toggleMenu}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 pointer-events-auto backdrop-blur-xl border ${isOpen
                    ? (isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-sage/5 text-sage border-sage/10')
                    : (isDarkMode ? 'bg-pale-gold border-white/10 text-warm-gray-green' : 'bg-sage border-sage/10 text-white')
                    }`}
            >
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    {isOpen ? <X size={20} /> : <Plus size={20} />}
                </div>
            </button>
        </div>
    );
};
