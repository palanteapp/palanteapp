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
    Music,
    Wrench
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
        { id: 'wisdom',      icon: <Sparkles size={14} />,     label: 'Wisdom'   },
        { id: 'focus',       icon: <Timer size={14} />,         label: 'Focus'    },
        { id: 'routines',    icon: <Layers size={14} />,        label: 'Habits'   },
        { id: 'reflect',     icon: <BookOpen size={14} />,      label: 'Reflect'  },
        { id: 'meditate',    icon: <Flower size={14} />,        label: 'Meditate' },
        { id: 'soundscapes', icon: <Music size={14} />,         label: 'Sounds'   },
        { id: 'breath',      icon: <Wind size={14} />,          label: 'Breathe'  },
        { id: 'fasting',     icon: <Utensils size={14} />,      label: 'Fasting'  },
        { id: 'coach',       icon: <MessageCircle size={14} />, label: 'Coach'    },
        { id: 'toolkit',     icon: <Wrench size={14} />,        label: 'Toolkit'  },
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
        console.log('FAB Action Triggered:', id);
        haptics.success();
        // Give a tiny moment for haptics/animation before switching
        setTimeout(() => {
            onAction(id);
            setIsOpen(false);
        }, 50);
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
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-auto">

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
                                onTap={(e) => {
                                    e.stopPropagation();
                                    handleAction(action.id);
                                }}
                                className={`flex items-center gap-3 pr-2 pl-4 py-2 rounded-full shadow-lg
                                           border-l-2 ring-1 ring-black/5 transition-all active:scale-95
                                           ${isDarkMode 
                                                ? 'bg-[#2D6A4F]/80 text-white border-pale-gold border shadow-[0_0_15px_rgba(45,106,79,0.3)]' 
                                                : 'bg-white/90 text-sage-dark border-sage/30 backdrop-blur-xl shadow-sage/10'}`}
                                style={{ 
                                    willChange: 'transform, opacity',
                                    pointerEvents: 'auto' 
                                }}
                            >
                                <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-white/90' : 'text-sage-dark'}`}>
                                    {action.label}
                                </span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner ${
                                    isDarkMode ? 'bg-white/10 text-pale-gold' : 'bg-sage/10 text-sage'
                                }`}>
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
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl
                            pointer-events-auto backdrop-blur-xl border transition-all duration-500
                            ${isOpen
                                ? (isDarkMode
                                    ? 'bg-white/10 text-white border-white/20'
                                    : 'bg-white/50 text-sage-dark border-white/30')
                                : (isDarkMode 
                                    ? 'bg-white/10 text-white border-white/20' 
                                    : 'bg-white/40 text-sage-dark border-sage/10 backdrop-blur-md')
                            }`}
                style={{ 
                    willChange: 'transform',
                    boxShadow: !isOpen 
                        ? (isDarkMode 
                            ? '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)' 
                            : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.4)')
                        : 'none'
                }}
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
