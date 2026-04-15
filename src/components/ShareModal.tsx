import React from 'react';
import { Share2, Instagram, Facebook } from 'lucide-react';
import { SharedQuotePreview } from './SharedQuotePreview';
import { SharedReflectionPreview } from './SharedReflectionPreview';
import type { Quote } from '../types';
import { SlideUpModal } from './SlideUpModal';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    quote?: Quote;
    reflection?: {
        date: string;
        highlight: string;
        midpoint: string;
        lowlight: string;
        energyLevel?: number;
    };
    text?: string;
    title?: string;
    isDarkMode: boolean;
    onGenerateImage?: () => Promise<void>;
    isGeneratingImage?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    quote,
    reflection,
    text,
    isDarkMode,
    onGenerateImage,
    isGeneratingImage = false
}) => {
    if (!isOpen) return null;

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode}>
            <div className="p-6 flex flex-col items-center w-full">

                {/* Content Preview */}
                <div className="mb-8 flex justify-center shadow-2xl rounded-3xl overflow-hidden animate-slide-up">
                    {quote ? (
                        <SharedQuotePreview quote={quote} />
                    ) : reflection ? (
                        <SharedReflectionPreview
                            date={reflection.date}
                            highlight={reflection.highlight}
                            midpoint={reflection.midpoint}
                            lowlight={reflection.lowlight}
                            isDarkMode={isDarkMode}
                            energyLevel={reflection.energyLevel}
                        />
                    ) : (
                        <div className={`p-6 rounded-[1.5rem] text-center border min-h-[140px] flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10 text-white/80' : 'bg-sage/5 border-sage/10 text-sage/80'
                            }`}>
                            <p className="text-base font-body leading-relaxed max-w-xs">{text}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-sm">
                    {(quote || reflection) && onGenerateImage && (
                        <>
                            <button
                                onClick={onGenerateImage}
                                disabled={isGeneratingImage}
                                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${isDarkMode
                                    ? 'bg-pale-gold text-sage-dark shadow-lg'
                                    : 'bg-[#4E5C4C] text-white shadow-md' // Olive green for light mode
                                    } ${isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isGeneratingImage ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                                        <span>Creating Card...</span>
                                    </>
                                ) : (
                                    <>
                                        <Instagram size={18} />
                                        <Facebook size={18} />
                                        <Share2 size={18} className="ml-1" />
                                        <span className="ml-2">Share directly to Social Media</span>
                                    </>
                                )}
                            </button>
                            <p className={`text-center mt-4 text-xs ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                Works with Instagram, TikTok, Facebook, and more
                            </p>
                        </>
                    )}
                </div>
            </div>
        </SlideUpModal>
    );
};
