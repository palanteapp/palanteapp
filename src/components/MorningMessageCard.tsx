import { useState } from 'react';
import { Sun, Share2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { ShareModal } from './ShareModal';
import type { Quote } from '../types';
import { generateShareImage } from '../utils/shareUtils';

interface MorningMessageCardProps {
    intention?: string;
    message?: string;
    isDarkMode: boolean;
    onRefresh: () => void;
}

export const MorningMessageCard: React.FC<MorningMessageCardProps> = ({
    intention,
    message,
    isDarkMode,
    onRefresh
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const bgPrimary = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    // Mock Quote for the ShareModal
    const mockQuote: Quote = {
        id: `morning_msg_${Date.now()}`,
        text: message || "Rise and shine.",
        author: "Palante Coach",
        category: "Morning Message",
        intensity: 1,
        isAI: true
    };

    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            const image = await generateShareImage(mockQuote, mockQuote.id);

            try {
                const { Share } = await import('@capacitor/share');
                const { Directory, Filesystem } = await import('@capacitor/filesystem');

                const fileName = `palante_morning_${Date.now()}.png`;
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: image.split(',')[1],
                    directory: Directory.Cache,
                });

                await Share.share({
                    title: 'Morning Message from Palante',
                    text: `"${message}"\n\n- @palante.app`,
                    url: savedFile.uri,
                });
            } catch {
                const link = document.createElement('a');
                link.href = image;
                link.download = `palante_morning_${Date.now()}.png`;
                link.click();
            }
        } catch (error) {
            console.error('Error sharing morning message:', error);
            try {
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Morning Message from Palante',
                    text: `"${message}"\n\n- @palante.app`,
                });
            } catch (fallbackError) {
                console.error('Share failed completely', fallbackError);
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`w-full p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${bgPrimary} shadow-lg group`}
        >

            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

            {/* Header (Always Visible) */}
            <div
                className="flex items-center justify-between cursor-pointer relative z-10"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                        <Sun size={20} />
                    </div>
                    <div>
                        <h3 className={`text-base font-display font-medium ${textPrimary}`}>Morning Practice Complete</h3>
                        {intention && (
                            <p className={`text-xs uppercase tracking-widest mt-1 ${textSecondary}`}>
                                Intention: <span className="font-bold border-b border-dashed opacity-80">{intention}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/50' : 'hover:bg-sage/10 text-sage/50'}`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>

                {/* Horizontal Divider */}
                <div className={`w-full h-px mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />

                {message ? (
                    <div className="text-center px-4 mb-8">
                        <h4 className={`text-xs font-bold uppercase tracking-[0.15em] mb-4 ${textSecondary}`}>Your Message of the Day</h4>
                        <p className={`text-xl font-display font-medium italic leading-relaxed ${textPrimary}`}>"{message}"</p>
                    </div>
                ) : (
                    <div className="text-center px-4 mb-8">
                        <p className={`text-sm italic ${textSecondary}`}>Take this peace with you into the day.</p>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100/10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowShareModal(true);
                        }}
                        disabled={isGeneratingImage}
                        className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'text-pale-gold hover:text-white hover:bg-white/10' : 'text-sage hover:text-sage-dark hover:bg-sage/10'} ${isGeneratingImage ? 'opacity-50 animate-pulse' : ''}`}
                        aria-label="Share"
                    >
                        <Share2 size={20} strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());
                            onRefresh();
                        }}
                        className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'text-pale-gold hover:text-white hover:bg-white/10' : 'text-sage hover:text-sage-dark hover:bg-sage/10'}`}
                        aria-label="Restart Practice"
                        title="Restart Practice"
                    >
                        <RefreshCw size={20} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {showShareModal && message && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    quote={mockQuote}
                    isDarkMode={isDarkMode}
                    onGenerateImage={handleShare}
                    isGeneratingImage={isGeneratingImage}
                />
            )}
        </motion.div>
    );
};
