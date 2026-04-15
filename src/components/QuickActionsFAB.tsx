import React, { useState, useMemo } from 'react';
import {
    Plus,
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
        setIsOpen(prev => !prev);
    };

    const toolsDef = useMemo(() => [
        { id: 'wisdom',     icon: <Sparkles size={14} />,     label: 'Wisdom'  },
        { id: 'pomodoro',   icon: <Timer size={14} />,         label: 'Timer'   },
        { id: 'routines',   icon: <Layers size={14} />,        label: 'Habits'  },
        { id: 'reflect',    icon: <BookOpen size={14} />,      label: 'Journal' },
        { id: 'meditate',   icon: <Flower size={14} />,        label: 'Meditate'},
        { id: 'soundscapes',icon: <Music size={14} />,         label: 'Sounds'  },
        { id: 'breath',     icon: <Wind size={14} />,          label: 'Breathe' },
        { id: 'fasting',    icon: <Utensils size={14} />,      label: 'Fasting' },
        { id: 'coach',      icon: <MessageCircle size={14} />, label: 'Coach'   },
    ], []);

    const actions = useMemo(() => {
        if (!userOrder || userOrder.length === 0) return toolsDef;
        return [...toolsDef].sort((a, b) => {
            const iA = userOrder.indexOf(a.id);
            const iB = userOrder.indexOf(b.id);
            if (iA !== -1 && iB !== -1) return iA - iB;
            if (iA !== -1) return -1;
            if (iB !== -1) return 1;
            return 0;
        });
    }, [userOrder, toolsDef]);

    const handleAction = (id: string) => {
        haptics.success();
        onAction(id);
        setIsOpen(false);
    };

    // Ultra-smooth simple pop transition instead of heavy stagger physics
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: 0 }
        },
        exit: {
            opacity: 0,
            transition: { staggerChildren: 0.02, staggerDirection: -1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'tween', ease: 'easeOut', duration: 0.2 }
        },
        exit: {
            opacity: 0,
            y: 8,
            scale: 0.95,
            transition: { type: 'tween', ease: 'easeIn', duration: 0.15 }
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">

            {/* Action pills list */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex flex-col items-end gap-2.5 mb-2 pointer-events-auto"
                    >
                        {actions.map(action => (
                            <motion.button
                                key={action.id}
                                variants={itemVariants}
                                onClick={() => handleAction(action.id)}
                                className={`flex items-center gap-2 pr-1.5 pl-3 py-1.5 rounded-full shadow-lg
                                           border transition-transform active:scale-95
                                           ${'bg-terracotta-500 border-terracotta-500 text-white'}`}
                                style={{ willChange: 'transform, opacity' }}
                            >
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                                    {action.label}
                                </span>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 text-white shadow-inner">
                                    {action.icon}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB button */}
            <motion.button
                onClick={toggleMenu}
                aria-label={isOpen ? 'Close quick actions' : 'Quick actions'}
                whileTap={{ scale: 0.88 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xl
                            pointer-events-auto backdrop-blur-xl border transition-colors duration-200
                            ${isOpen
                                ? (isDarkMode
                                    ? 'bg-white/10 text-white border-white/10'
                                    : 'bg-sage/5  text-sage  border-sage/10')
                                : 'bg-terracotta-500 text-white border-terracotta-500/10'
                            }`}
                style={{ willChange: 'transform' }}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                    {isOpen ? <X size={20} /> : <Plus size={20} />}
                </motion.div>
            </motion.button>
        </div>
    );
};
