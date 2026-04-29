import { useState } from 'react';
import { Sparkles, Share2, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quote } from '../types';
import { generateShareImage } from '../utils/shareUtils';
import { haptics } from '../utils/haptics';

interface MonthlyPatternCardProps {
    insight: string;
    dataPoint: string;
    generatedAt: string;
    onDismiss: () => void;
    isDarkMode: boolean;
}

export const MonthlyPatternCard: React.FC<MonthlyPatternCardProps> = ({
    insight,
    dataPoint,
    generatedAt,
    onDismiss,
    isDarkMode: _isDarkMode,
}) => {
    const [isSharing, setIsSharing] = useState(false);

    const monthLabel = new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleShare = async () => {
        setIsSharing(true);
        haptics.light();
        try {
            const shareQuote: Quote = {
                id: `pattern_${generatedAt}`,
                text: insight,
                author: 'My Palante Pattern',
                category: 'Self-Discovery',
                intensity: 2,
            };
            const image = await generateShareImage(shareQuote, shareQuote.id);

            try {
                const { Share } = await import('@capacitor/share');
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const file = await Filesystem.writeFile({
                    path: `palante_pattern_${Date.now()}.png`,
                    data: image.split(',')[1],
                    directory: Directory.Cache,
                });
                await Share.share({ title: 'My Palante Pattern', text: `"${insight}"\n\n- @palante.app`, url: file.uri });
            } catch {
                const a = document.createElement('a');
                a.href = image;
                a.download = `palante_pattern_${Date.now()}.png`;
                a.click();
            }
        } catch (e) {
            console.error('Share failed', e);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-full mb-6 overflow-hidden rounded-3xl"
            >
                {/* Rich dark background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#1F3824] to-[#0f2419]" />

                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-pale-gold/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-pale-gold/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative z-10 p-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-pale-gold/15 flex items-center justify-center">
                                <TrendingUp size={15} className="text-pale-gold" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pale-gold/60">Your Pattern</p>
                                <p className="text-[9px] text-white/30 uppercase tracking-widest">{monthLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { haptics.light(); onDismiss(); }}
                            className="p-1.5 rounded-full text-white/20 hover:text-white/60 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* The data point — large and ornamental */}
                    <div className="mb-4 text-center">
                        <span className="text-5xl font-display font-medium text-pale-gold tracking-tight leading-none">
                            {dataPoint}
                        </span>
                    </div>

                    {/* The insight */}
                    <p className="text-base font-display font-medium text-white/90 text-center leading-snug mb-6 px-2">
                        {insight}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <p className="text-[9px] text-white/20 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={9} className="text-pale-gold/30" />
                            From your last 30 days
                        </p>
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className={`p-2 rounded-full transition-all ${isSharing ? 'opacity-40 animate-pulse' : 'text-white/30 hover:text-pale-gold'}`}
                        >
                            <Share2 size={15} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
