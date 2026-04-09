import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import type { ScienceFact } from '../data/scienceFacts';
import { SlideUpModal } from './SlideUpModal';

interface DidYouKnowModalProps {
    isOpen: boolean;
    onClose: () => void;
    fact: ScienceFact | null;
    isDarkMode: boolean;
    fullScreen?: boolean;
}

export const DidYouKnowModal: React.FC<DidYouKnowModalProps> = ({ isOpen, onClose, fact, isDarkMode, fullScreen = false }) => {
    if (!isOpen || !fact) return null;

    // Defensive close handler with error catching
    const handleClose = () => {
        try {
            onClose();
        } catch (error) {
            console.error('Error closing DidYouKnowModal:', error);
            // Force close by resetting body overflow as a failsafe
            document.body.style.overflow = '';
        }
    };

    return (
        <SlideUpModal isOpen={isOpen} onClose={handleClose} isDarkMode={isDarkMode} fullScreen={fullScreen} position="center">
            <div className="p-8 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg transition-transform hover:scale-110 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                    }`}>
                    <Lightbulb size={32} strokeWidth={2} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-pale-gold' : 'text-sage'
                        }`}>Did You Know?</span>
                    <Sparkles size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                </div>

                <p className={`text-xl md:text-2xl font-display font-medium leading-relaxed mb-8 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'
                    }`}>
                    "{fact?.fact || 'Loading...'}"
                </p>

                <button
                    onClick={handleClose}
                    className={`w-full py-4 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 ${isDarkMode
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                        : 'bg-sage/10 text-sage hover:bg-sage/20 border border-sage/10'
                        }`}
                >
                    Got it, thanks!
                </button>
            </div>
        </SlideUpModal>
    );
};
