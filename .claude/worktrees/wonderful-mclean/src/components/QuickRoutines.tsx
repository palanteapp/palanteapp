
import React, { useState } from 'react';
import { Plus, Zap, ArrowRight, HelpCircle, Microscope, Pencil, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptics } from '../utils/haptics';
import type { RoutineStack } from '../types';
import { FeatureInfoModal } from './FeatureInfoModal';
import { FEATURE_INFO } from '../data/featureInfo';

interface QuickRoutinesProps {
    routines: RoutineStack[];
    onLaunch: (routine: RoutineStack) => void;
    onCreate: () => void;
    onEdit: (routine: RoutineStack) => void;
    onDelete: (routineId: string) => void;
    isDarkMode: boolean;
}

export const QuickRoutines: React.FC<QuickRoutinesProps> = ({
    routines,
    onLaunch,
    onCreate,
    onEdit,
    onDelete,
    isDarkMode
}) => {
    const [showFeatureInfo, setShowFeatureInfo] = useState(false);
    const [infoInitialTab, setInfoInitialTab] = useState<'how' | 'science'>('how');

    const openInfoModel = (tab: 'how' | 'science') => {
        setInfoInitialTab(tab);
        setShowFeatureInfo(true);
    };

    return (
        <div className="mb-8">
            <div className="flex flex-col items-center justify-center mb-6 gap-3">
                <h3 className={`text-lg font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    Create an Action Stack
                </h3>
                <p className={`text-xs text-center max-w-[260px] leading-relaxed ${isDarkMode ? 'text-white/50' : 'text-sage-dark/50'}`}>
                    Chain your daily habits into one powerful flow. Tap once — and let momentum do the rest.
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openInfoModel('how')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/10 text-sage/80 hover:bg-sage/20'
                            }`}
                    >
                        <HelpCircle size={12} strokeWidth={2.5} />
                        <span>How to Use</span>
                    </button>
                    <button
                        onClick={() => openInfoModel('science')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold/80 hover:bg-pale-gold/20 hover:text-pale-gold' : 'bg-sage/10 text-sage/80 hover:bg-sage/20'
                            }`}
                    >
                        <Microscope size={12} strokeWidth={2.5} />
                        <span>The Science</span>
                    </button>
                </div>
            </div>

            {routines.length === 0 ? (
                // Empty State - Full Width Banner
                <button
                    onClick={onCreate}
                    className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group ${isDarkMode
                        ? 'border-white/10 text-white/40 hover:border-pale-gold/40 hover:bg-white/5 hover:text-white'
                        : 'border-sage/20 text-sage/40 hover:border-sage/40 hover:bg-sage/5 hover:text-sage'
                        }`}
                >
                    <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'} group-hover:scale-110 transition-transform`}>
                        <Plus size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-center">Create Your First Flow</span>
                </button>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
                    {/* Create New Card (Compact) */}
                    <button
                        onClick={onCreate}
                        className={`snap-center flex-shrink-0 w-[140px] h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group ${isDarkMode
                            ? 'border-white/10 text-white/40 hover:border-pale-gold/40 hover:bg-white/5 hover:text-white active:scale-95'
                            : 'border-sage/20 text-sage/40 hover:border-sage/40 hover:bg-sage/5 hover:text-sage active:scale-95'
                            }`}
                    >
                        <div className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'} group-hover:scale-110 transition-transform`}>
                            <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">New Flow</span>
                    </button>

                    {/* Existing Routines */}
                    {routines.map((routine) => {
                        // Get theme color classes
                        const getColorClass = (color: string = 'sage') => {
                            const colorMap: Record<string, string> = {
                                'sage': 'bg-sage',
                                'emerald': 'bg-emerald-500',
                                'sky': 'bg-sky-500',
                                'amber': 'bg-pale-gold-500',
                                'teal': 'bg-teal-500',
                                'slate': 'bg-slate-500'
                            };
                            return colorMap[color] || 'bg-sage';
                        };

                        const getTextColorClass = (color: string = 'sage') => {
                            const colorMap: Record<string, string> = {
                                'sage': 'text-sage',
                                'emerald': 'text-emerald-500',
                                'sky': 'text-sky-500',
                                'amber': 'text-pale-gold-500',
                                'teal': 'text-teal-500',
                                'slate': 'text-slate-500'
                            };
                            return colorMap[color] || 'text-sage';
                        };

                        const themeColor = routine.themeColor || 'sage';
                        const bgColorClass = getColorClass(themeColor);
                        void getTextColorClass(themeColor); // retained for API completeness

                        return (
                            <div
                                key={routine.id}
                                className={`snap-center flex-shrink-0 w-[160px] h-36 rounded-2xl p-4 flex flex-col justify-between text-left transition-all relative overflow-hidden group ${isDarkMode
                                    ? 'bg-white/5 border border-white/10 hover:border-pale-gold/30 hover:bg-white/10'
                                    : 'bg-white border border-sage/10 hover:border-sage/30 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                {/* Background Accent */}
                                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 pointer-events-none ${bgColorClass}`} />

                                <div className="flex justify-between items-start relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-pale-gold' : 'bg-pale-gold/10 text-pale-gold'
                                        }`} >
                                        <Zap size={16} fill="currentColor" />
                                    </div>
                                    {/* Always visible action buttons for mobile compatibility */}
                                    <div className={`flex gap-1 transition-opacity ${isDarkMode ? 'opacity-40 hover:opacity-100' : 'opacity-30 hover:opacity-100'}`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(routine); }}
                                            className={`p-1.5 rounded-md transition-all active:scale-90 ${isDarkMode ? 'hover:bg-white/10 hover:text-pale-gold' : 'hover:bg-sage/10 hover:text-sage'}`}
                                            aria-label="Edit routine"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(routine.id);
                                            }}
                                            className={`p-1.5 rounded-md transition-all active:scale-90 relative z-20 ${isDarkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-sage/10 hover:text-sage'}`}
                                            aria-label="Delete routine"
                                            type="button"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        haptics.medium();
                                        onLaunch(routine);
                                    }}
                                    className="text-left w-full transition-transform"
                                >
                                    <h4 className={`font-medium text-sm leading-tight mb-1 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-rich-black'}`}>
                                        {routine.name}
                                    </h4>
                                    <div className={`text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                        {routine.steps.length} Steps <ArrowRight size={10} />
                                    </div>
                                </motion.button>
                            </div>
                        );
                    })}
                </div>
            )}

            <FeatureInfoModal
                isOpen={showFeatureInfo}
                onClose={() => setShowFeatureInfo(false)}
                isDarkMode={isDarkMode}
                featureName="Action Stacks"
                howToUse={FEATURE_INFO.actionStacks.howToUse}
                theScience={FEATURE_INFO.actionStacks.theScience}
                initialTab={infoInitialTab}
            />
        </div>
    );
};
