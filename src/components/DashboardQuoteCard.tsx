import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Heart, Clock, Settings, RefreshCw } from 'lucide-react';
import type { Quote } from '../types';
import { QuoteCardGenerator } from './QuoteCardGenerator';
import { ShareModal } from './ShareModal';
import html2canvas from 'html2canvas';

interface DashboardQuoteCardProps {
    quote: Quote;
    isDarkMode: boolean;
    isFavorited?: boolean;
    onToggleFavorite?: () => void;
    onOpenHistory?: () => void;
    onOpenSettings?: () => void;
    onRefresh?: () => void;
}

// Adaptive font size based on quote length (adjusted for new box layout)
function getQuoteFontSize(len: number): string {
    if (len > 180) return '16px';
    if (len > 140) return '18px';
    if (len > 100) return '20px';
    if (len > 65)  return '22px';
    if (len > 40)  return '26px';
    return '28px';
}

const ModernArtBackground = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice">
        {/* Soft mist green base */}
        <rect width="400" height="520" fill="#879582" />
        <circle cx="80" cy="100" r="220" fill="#9BAC98" opacity="0.9" />
        <circle cx="360" cy="140" r="200" fill="#E8DEC9" opacity="0.9" />
        <circle cx="320" cy="380" r="240" fill="#D6B8A0" opacity="0.8" />
        <circle cx="120" cy="460" r="260" fill="#C5AE91" opacity="0.9" />
        <circle cx="200" cy="260" r="180" fill="#E5D6C5" opacity="0.4" mixBlendMode="overlay" />
    </svg>
);

export const DashboardQuoteCard: React.FC<DashboardQuoteCardProps> = ({
    quote,
    isDarkMode,
    isFavorited,
    onToggleFavorite,
    onOpenHistory,
    onOpenSettings,
    onRefresh,
}) => {
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const MAX_REFRESHES = 3;

    const getTodayKey = () => {
        const today = new Date();
        return `quote_refresh_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    };

    const getRefreshCount = (): number => {
        try {
            const stored = localStorage.getItem(getTodayKey());
            return stored ? parseInt(stored, 10) : 0;
        } catch { return 0; }
    };

    const [refreshCount, setRefreshCount] = useState(getRefreshCount());

    const incrementRefreshCount = () => {
        const newCount = refreshCount + 1;
        setRefreshCount(newCount);
        try { localStorage.setItem(getTodayKey(), newCount.toString()); } catch { /* ignore */ }
    };

    const isTierQuote = quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire' || quote.author === 'Palante Coach' || quote.isAI;

    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const element = document.getElementById('dashboard-quote-share-generator');
            if (element) {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: null,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    onclone: (doc) => {
                        const el = doc.getElementById('dashboard-quote-share-generator');
                        if (el) { el.style.opacity = '1'; el.style.visibility = 'visible'; }
                    }
                });
                const image = canvas.toDataURL('image/png');
                try {
                    const { Share } = await import('@capacitor/share');
                    const { Directory, Filesystem } = await import('@capacitor/filesystem');
                    const fileName = `palante_quote_${Date.now()}.png`;
                    const savedFile = await Filesystem.writeFile({ path: fileName, data: image.split(',')[1], directory: Directory.Cache });
                    await Share.share({
                        title: 'Inspiration from Palante',
                        text: isTierQuote ? `"${quote.text}"\n\n- @palante.app` : `"${quote.text}" - ${quote.author}\n\n- @palante.app`,
                        url: savedFile.uri,
                    });
                    setIsGeneratingImage(false);
                    return;
                } catch { /* fall through */ }
                const link = document.createElement('a');
                link.href = image;
                link.download = `palante_quote_${Date.now()}.png`;
                link.click();
            }
        } catch (error) {
            console.error('Error generating image:', error);
            try {
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Inspiration from Palante',
                    text: isTierQuote ? `"${quote.text}"\n\n- @palante.app` : `"${quote.text}" - ${quote.author}\n\n- @palante.app`,
                });
            } catch { /* ignore */ }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const fontSize   = getQuoteFontSize(quote.text.length);
    const lineHeight = quote.text.length > 120 ? 1.48 : 1.38;

    // Action button colors over the art background
    const btnColor = "rgba(40,50,40,0.6)";
    const btnHoverColor = "rgba(40,50,40,0.9)";

    return (
        <>
            {/* Hidden share generator — off-screen, only rendered during share */}
            {isGeneratingImage && (
                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <QuoteCardGenerator id="dashboard-quote-share-generator" quote={quote} isDarkMode={isDarkMode} />
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 18, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full"
                >
                    {/* ── Card shell ── */}
                    <div style={{
                        position: 'relative',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        backgroundColor: '#5A6351', // Base color behind SVG
                        boxShadow: '0 20px 40px -8px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>

                        {/* ── Background SVG art ── */}
                        <ModernArtBackground />

                        {/* ── Subtle noise grain overlay ── */}
                        <div aria-hidden="true" style={{
                            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
                        }} />

                        {/* ── Inner White Quote Box ── */}
                        <div style={{
                            position: 'relative',
                            zIndex: 4,
                            margin: '40px 32px 24px 32px',
                            backgroundColor: '#FDFBF7',
                            borderRadius: '24px',
                            padding: '40px 24px 32px 24px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={quote.text}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{
                                        fontFamily: '"Poppins", sans-serif',
                                        fontWeight: 600,
                                        fontSize,
                                        lineHeight,
                                        color: '#6F4E37',
                                        letterSpacing: '-0.02em',
                                        marginBottom: isTierQuote ? '0px' : '24px',
                                    }}
                                >
                                    {quote.text}
                                </motion.p>
                            </AnimatePresence>

                            {!isTierQuote && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div style={{ width: '20px', height: '1px', backgroundColor: '#B68D73' }} />
                                    <p style={{
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 500,
                                        fontSize: '13px',
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        color: '#A0806B',
                                    }}>
                                        {quote.author}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* ── Action bar (no logo/branding) ── */}
                        <div style={{
                            position: 'relative', zIndex: 4,
                            padding: '0 16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}>
                            {onToggleFavorite && (
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={onToggleFavorite}
                                    aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: isFavorited ? 'rgba(224,90,90,0.15)' : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        color: isFavorited ? '#E05A5A' : btnColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} strokeWidth={2} />
                                </motion.button>
                            )}

                            {onOpenHistory && (
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={onOpenHistory}
                                    style={{ padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)', cursor: 'pointer', color: btnColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}
                                >
                                    <Clock size={18} strokeWidth={2} />
                                </motion.button>
                            )}

                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => setShowShareModal(true)}
                                disabled={isGeneratingImage}
                                style={{
                                    padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)',
                                    cursor: isGeneratingImage ? 'default' : 'pointer', color: btnColor, opacity: isGeneratingImage ? 0.6 : 1,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)'
                                }}
                            >
                                {isGeneratingImage
                                    ? <div style={{ width: 18, height: 18, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    : <Share2 size={18} strokeWidth={2} />
                                }
                            </motion.button>

                            {onRefresh && (
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => {
                                        if (refreshCount < MAX_REFRESHES) {
                                            import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());
                                            incrementRefreshCount();
                                            onRefresh();
                                        }
                                    }}
                                    disabled={refreshCount >= MAX_REFRESHES}
                                    style={{
                                        position: 'relative', padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)',
                                        cursor: refreshCount >= MAX_REFRESHES ? 'not-allowed' : 'pointer',
                                        color: refreshCount >= MAX_REFRESHES ? 'rgba(40,50,40,0.3)' : btnColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <RefreshCw size={18} strokeWidth={2} />
                                    {refreshCount > 0 && refreshCount < MAX_REFRESHES && (
                                        <span style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            width: '16px', height: '16px', borderRadius: '50%',
                                            backgroundColor: '#FDFBF7', color: '#6F4E37',
                                            fontSize: '9px', fontWeight: 800,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {refreshCount}
                                        </span>
                                    )}
                                </motion.button>
                            )}

                            {onOpenSettings && (
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={onOpenSettings}
                                    style={{ padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)', cursor: 'pointer', color: btnColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}
                                >
                                    <Settings size={18} strokeWidth={2} />
                                </motion.button>
                            )}
                        </div>

                    </div>
                </motion.div>
            </AnimatePresence>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                quote={quote}
                isDarkMode={isDarkMode}
                onGenerateImage={handleShare}
                isGeneratingImage={isGeneratingImage}
            />
        </>
    );
};
