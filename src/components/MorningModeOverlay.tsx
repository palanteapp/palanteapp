import { X, Sunrise, Play } from 'lucide-react';
import { haptics } from '../utils/haptics';
import type { Quote } from '../types';
import { SESSION_KEYS } from '../constants/storageKeys';

interface MorningModeOverlayProps {
    isDarkMode: boolean;
    quote: Quote | null;
    userName: string;
    onStartMeditation: () => void;
    onClose: () => void;
}

export const MorningModeOverlay: React.FC<MorningModeOverlayProps> = ({
    isDarkMode,
    quote,
    userName,
    onStartMeditation,
    onClose
}) => {
    const handleClose = () => {
        haptics.light();
        sessionStorage.setItem(SESSION_KEYS.MORNING_MODE_SHOWN, 'true');
        onClose();
    };

    const handleStartMeditation = () => {
        haptics.medium();
        sessionStorage.setItem(SESSION_KEYS.MORNING_MODE_SHOWN, 'true');
        onStartMeditation();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 animate-fade-in backdrop-blur-sm bg-[#3A1700]/40">
            {/* Background Gradient/Blur */}
            <div className="absolute inset-0 bg-gradient-to-br from-sage/20 via-amber/20 to-ivory/20 pointer-events-none" />

            {/* Modal Card */}
            <div className={`relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 flex flex-col ${isDarkMode ? 'bg-sage-mid border border-white/10' : 'bg-white border border-sage/10'}`}>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className={`absolute top-6 right-6 p-2 rounded-full transition-all z-20 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/40' : 'bg-sage/5 hover:bg-sage/10 text-sage/40'}`}
                >
                    <X size={20} />
                </button>

                <div className="px-8 pt-10 pb-10 flex flex-col items-center text-center overflow-y-auto max-h-[85vh] scrollbar-hide">
                    {/* Sunrise Icon - Pale Gold */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber to-amber-400 flex items-center justify-center shadow-lg">
                            <Sunrise size={40} className="text-white" />
                        </div>
                    </div>

                    {/* Greeting */}
                    <h1 className={`text-3xl font-display font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                        Good Morning, {userName}
                    </h1>

                    <p className={`text-sm mb-8 ${isDarkMode ? 'text-white/60' : 'text-sage-dark/70'}`}>
                        Start your day with intention
                    </p>

                    {/* Quote Card */}
                    {quote && (
                        <div className={`w-full rounded-3xl p-6 mb-8 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-sage/5 border-sage/10 shadow-sm'}`}>
                            <p className={`text-lg font-display leading-relaxed mb-4 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                "{quote.text}"
                            </p>
                            <p className={`text-xs italic ${isDarkMode ? 'text-white/40' : 'text-sage-dark/50'}`}>
                                — {quote.author}
                            </p>
                        </div>
                    )}

                    {/* CTA Button - Sage Green */}
                    <button
                        onClick={handleStartMeditation}
                        className={`w-full py-4 rounded-full font-display font-medium text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isDarkMode ? 'bg-pale-gold text-sage-dark' : 'bg-terracotta-500 text-white hover:bg-sage-600'}`}
                    >
                        <Play size={22} fill="currentColor" />
                        Morning Meditation
                    </button>

                    {/* Skip Link */}
                    <button
                        onClick={handleClose}
                        className={`mt-6 text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30 hover:text-white' : 'text-sage-dark/40 hover:text-sage'}`}
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};
