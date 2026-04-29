import React from 'react';
import { Share2, Instagram, Facebook, Music, Download } from 'lucide-react';
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
    onDownloadImage?: () => Promise<void>;
    isGeneratingImage?: boolean;
    seed?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    quote,
    reflection,
    text,
    isDarkMode,
    onGenerateImage,
    onDownloadImage,
    isGeneratingImage = false,
    seed
}) => {
    if (!isOpen) return null;

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode}>
            <div className="p-6 flex flex-col items-center w-full">
                {/* Content Preview — ID used as html2canvas capture target */}
                <div id="share-preview-container" 
                     className="mb-8 flex justify-center rounded-3xl overflow-hidden animate-slide-up shadow-2xl"
                >
                    {quote ? (
                        <SharedQuotePreview quote={quote} seed={seed} />
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
                                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mb-6 shadow-xl ${isDarkMode
                                    ? 'bg-[#C96A3A] text-white'
                                    : 'bg-[#C96A3A] text-white'
                                    } ${isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isGeneratingImage ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                                        <span>Designing Card...</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 size={18} />
                                        <span>Share Card to Social Media</span>
                                    </>
                                )}
                            </button>

                            {/* Direct Social Row — Now with TikTok and deep shadows */}
                            <div className="flex justify-between gap-4 mb-4">
                                <button 
                                    onClick={onGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#E5D6A7] hover:bg-white transition-all active:scale-95 text-[#C96A3A]"
                                    style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                >
                                   <Instagram size={22} color="#C96A3A" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Stories</span>
                                </button>
                                <button 
                                    onClick={onGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#E5D6A7] hover:bg-white transition-all active:scale-95 text-[#C96A3A]"
                                    style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                >
                                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C96A3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                   </svg>
                                   <span className="text-[10px] font-bold uppercase tracking-widest">TikTok</span>
                                </button>
                                <button 
                                    onClick={onGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#E5D6A7] hover:bg-white transition-all active:scale-95 text-[#C96A3A]"
                                    style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                >
                                   <Facebook size={22} color="#C96A3A" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Feed</span>
                                </button>
                                <button 
                                    onClick={onDownloadImage}
                                    disabled={isGeneratingImage}
                                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#E5D6A7] hover:bg-white transition-all active:scale-95 text-[#C96A3A]"
                                    style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                >
                                   <Download size={22} color="#C96A3A" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Save</span>
                                </button>
                            </div>

                            <p className={`text-center mt-6 text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                                Works with Instagram, TikTok, & Facebook
                            </p>
                        </>
                    )}
                </div>
            </div>
        </SlideUpModal>
    );
};
