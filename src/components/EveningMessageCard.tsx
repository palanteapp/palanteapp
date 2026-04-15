import { useState } from 'react';
import { Moon, Share2, RefreshCw, ChevronDown, ChevronUp, Heart, BookOpen, Award, Smile } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { QuoteCardGenerator } from './QuoteCardGenerator';
import type { Quote, DailyEveningPractice } from '../types';
import html2canvas from 'html2canvas';

interface EveningMessageCardProps {
    practice: DailyEveningPractice;
    isDarkMode: boolean;
    onRefresh: () => void;
}

export const EveningMessageCard: React.FC<EveningMessageCardProps> = ({
    practice,
    isDarkMode,
    onRefresh
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const bgPrimary = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    // Create a mock quote for the share modal based on the reflection
    const mockQuote: Quote = {
        id: `evening_msg_${practice.id}`,
        text: practice.reflectionMessage || "A day well-lived ends in gratitude.",
        author: "Palante Coach",
        category: "Evening Reflection",
        intensity: 1,
        isAI: true
    };

    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // allow render

            const element = document.getElementById('evening-msg-share-generator');
            if (element) {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: null,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    onclone: (doc) => {
                        const el = doc.getElementById('evening-msg-share-generator');
                        if (el) {
                            el.style.opacity = '1';
                            el.style.visibility = 'visible';
                        }
                    }
                });

                const image = canvas.toDataURL('image/png');

                try {
                    const { Share } = await import('@capacitor/share');
                    const { Directory, Filesystem } = await import('@capacitor/filesystem');

                    const fileName = `palante_evening_${Date.now()}.png`;

                    const savedFile = await Filesystem.writeFile({
                        path: fileName,
                        data: image.split(',')[1],
                        directory: Directory.Cache
                    });

                    await Share.share({
                        title: 'Evening Reflection from Palante',
                        text: `"${practice.reflectionMessage}"\n\n- @palante.app`,
                        url: savedFile.uri,
                    });

                } catch {

                    // Fallback for Web
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = `palante_evening_${Date.now()}.png`;
                    link.click();
                }
            }
        } catch (error) {
            console.error('Error sharing evening message:', error);
            try {
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Evening Reflection from Palante',
                    text: `"${practice.reflectionMessage}"\n\n- @palante.app`
                });
            } catch (fallbackError) {
                console.error('Share Failed completely', fallbackError);
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className={`w-full p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${bgPrimary} shadow-lg group`}>
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10 ${isDarkMode ? 'bg-indigo-400' : 'bg-sage'}`} />

            {/* Header (Always Visible) */}
            <div
                className="flex items-center justify-between cursor-pointer relative z-10"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-500'}`}>
                        <Moon size={20} />
                    </div>
                    <div>
                        <h3 className={`text-base font-display font-medium ${textPrimary}`}>Evening Practice Complete</h3>
                        <p className={`text-xs uppercase tracking-widest mt-1 ${textSecondary}`}>
                            Reflection: <span className="font-bold border-b border-dashed opacity-80">G.L.A.D. Method</span>
                        </p>
                    </div>
                </div>

                <div className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/50' : 'hover:bg-sage/10 text-sage/50'}`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                {/* Horizontal Divider */}
                <div className={`w-full h-px mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />

                {practice.reflectionMessage ? (
                    <div className="text-center px-4 mb-8">
                        <h4 className={`text-xs font-bold uppercase tracking-[0.15em] mb-4 ${textSecondary}`}>Your Evening Summary</h4>
                        <p className={`text-xl font-display font-medium italic leading-relaxed ${textPrimary}`}>"{practice.reflectionMessage}"</p>
                    </div>
                ) : (
                    <div className="text-center px-4 mb-8">
                        <p className={`text-sm italic ${textSecondary}`}>Rest well and reflect on your highlights.</p>
                    </div>
                )}

                {/* GLAD Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                        { label: 'G', icon: Heart, text: practice.gratitude, color: 'text-rose-400' },
                        { label: 'L', icon: BookOpen, text: practice.learning, color: 'text-blue-400' },
                        { label: 'A', icon: Award, text: practice.accomplishment, color: 'text-pale-gold-400' },
                        { label: 'D', icon: Smile, text: practice.delight, color: 'text-green-400' }
                    ].map((item, i) => (
                        <div key={i} className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white/40'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <item.icon size={12} className={item.color} />
                                <span className={`text-[10px] font-bold ${textSecondary}`}>{item.label}</span>
                            </div>
                            <p className={`text-xs line-clamp-2 ${textPrimary}`}>{item.text}</p>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowShareModal(true);
                        }}
                        disabled={isGeneratingImage}
                        className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'text-indigo-300 hover:text-white hover:bg-white/10' : 'text-sage hover:text-sage-dark hover:bg-sage/10'} ${isGeneratingImage ? 'opacity-50 animate-pulse' : ''}`}
                        aria-label="Share"
                    >
                        <Share2 size={20} strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRefresh();
                        }}
                        className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'text-indigo-300 hover:text-white hover:bg-white/10' : 'text-sage hover:text-sage-dark hover:bg-sage/10'}`}
                        aria-label="Restart Practice"
                        title="Restart Practice"
                    >
                        <RefreshCw size={20} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* Hidden Generator for Sharing */}
            {isGeneratingImage && (
                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <QuoteCardGenerator id="evening-msg-share-generator" quote={mockQuote} isDarkMode={isDarkMode} />
                </div>
            )}

            {showShareModal && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    quote={mockQuote}
                    isDarkMode={isDarkMode}
                    onGenerateImage={handleShare}
                    isGeneratingImage={isGeneratingImage}
                />
            )}
        </div>
    );
};
