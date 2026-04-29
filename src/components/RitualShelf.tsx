import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Wrench, Wind } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface RitualShelfProps {
    isDarkMode: boolean;
    fastingActive?: boolean;
    fastingTime?: string;
    onFastingClick?: () => void;
    onToolkitClick?: () => void;
    onBreathClick?: () => void;
}

export const RitualShelf: React.FC<RitualShelfProps> = ({ 
    isDarkMode, 
    fastingActive, 
    fastingTime,
    onFastingClick,
    onToolkitClick,
    onBreathClick
}) => {
    // Lush Green palette colors
    const lushGreen = '#1B4332';
    const paleGold = '#E5D6A7';

    return (
        <div className="w-full flex flex-col mb-10 px-1">
            <div className="text-center mb-8">
                <h2 className={`text-2xl font-display font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    Essential Tools
                </h2>
                <p className={`text-sm max-w-[340px] mx-auto opacity-60 leading-relaxed ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                    Quick access to your core practices. Navigate between Fasting, your Toolkit, and daily Breathing.
                </p>
            </div>
            
            <div className="w-full flex gap-3">
                {/* Fasting Widget */}
                <motion.button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        haptics.medium();
                        if (onFastingClick) onFastingClick();
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 p-4 rounded-[2rem] border transition-all active:scale-95 ${
                        isDarkMode 
                            ? (fastingActive ? 'bg-[#2D6A4F] border-[#40916C]' : 'bg-[#1B4332]/50 border-white/10') + ' shadow-xl backdrop-blur-md'
                            : (fastingActive ? 'bg-[#40916C]/20 border-[#2D6A4F]/30' : 'bg-white/60 border-sage/10') + ' shadow-spa backdrop-blur-md'
                    }`}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg ${fastingActive ? 'bg-[#52B788] text-white animate-pulse' : 'bg-white/10 text-[#74C69D]'}`}>
                        <Utensils size={24} fill={fastingActive ? "currentColor" : "none"} />
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className={`text-base font-display font-bold leading-tight mb-1 text-center max-w-[80px] ${fastingActive ? 'text-white' : (isDarkMode ? 'text-white' : 'text-sage-dark')}`}>
                            {fastingActive ? fastingTime : 'Fast'}
                        </div>
                        <div className={`text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Fasting
                        </div>
                    </div>
                </motion.button>

                {/* Toolkit Widget */}
                <motion.button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        haptics.medium();
                        if (onToolkitClick) onToolkitClick();
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 p-4 rounded-[2rem] border transition-all active:scale-95 ${
                        isDarkMode 
                            ? 'bg-[#1B4332]/50 border-white/10 shadow-xl backdrop-blur-md hover:bg-[#1B4332]/70' 
                            : 'bg-white/60 border-sage/10 shadow-spa backdrop-blur-md hover:bg-sage/5'
                    }`}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-[#E5D6A7] mb-3 shadow-lg">
                        <Wrench size={24} />
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className={`text-base font-display font-bold leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>Toolkit</div>
                        <div className={`text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>Resources</div>
                    </div>
                </motion.button>

                {/* Breathing Widget */}
                <motion.button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        haptics.medium();
                        if (onBreathClick) onBreathClick();
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 p-4 rounded-[2rem] border transition-all active:scale-95 ${
                        isDarkMode 
                            ? 'bg-[#1B4332]/50 border-white/10 shadow-xl backdrop-blur-md hover:bg-[#1B4332]/70' 
                            : 'bg-white/60 border-sage/10 shadow-spa backdrop-blur-md hover:bg-sage/5'
                    }`}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white mb-3 shadow-lg">
                        <Wind size={24} />
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className={`text-base font-display font-bold leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>Breathe</div>
                        <div className={`text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>Regulate</div>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};
