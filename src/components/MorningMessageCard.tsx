import { useState } from 'react';
import { Share2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareModal } from './ShareModal';
import type { Quote } from '../types';
import { generateShareImage } from '../utils/shareUtils';

interface MorningMessageCardProps {
    intention?: string;
    message?: string;
    isDarkMode: boolean;
    onRefresh: () => void;
    userName?: string;
    coachTone?: 'nurturing' | 'direct' | 'accountability';
    onOpenToneSettings?: () => void;
}

export const MorningMessageCard: React.FC<MorningMessageCardProps> = ({
    intention,
    message,
    isDarkMode,
    onRefresh,
    userName,
    coachTone = 'nurturing',
    onOpenToneSettings,
}) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const mockQuote: Quote = {
        id: `morning_msg_${Date.now()}`,
        text: message || 'Rise and shine.',
        author: 'Palante Coach',
        category: 'Morning Message',
        intensity: 1,
        isAI: true,
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
            } catch { /* share cancelled */ }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const firstName = userName?.split(' ')[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full relative overflow-hidden rounded-3xl"
            style={{
                background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(65,93,67,0.55) 0%, rgba(30,50,35,0.80) 100%)'
                    : 'linear-gradient(135deg, rgba(253,251,247,0.95) 0%, rgba(240,234,220,0.90) 100%)',
                border: isDarkMode ? '1px solid rgba(229,214,167,0.14)' : '1px solid rgba(65,93,67,0.12)',
                boxShadow: isDarkMode
                    ? '0 8px 32px rgba(0,0,0,0.28)'
                    : '0 4px 20px rgba(65,93,67,0.10)',
            }}
        >
            {/* Warm glow blob */}
            <div
                aria-hidden
                style={{
                    position: 'absolute', top: '-30%', right: '-10%',
                    width: '55%', height: '120%',
                    borderRadius: '50%',
                    background: isDarkMode
                        ? 'radial-gradient(circle, rgba(201,106,58,0.12) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(201,106,58,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div className="relative z-10 p-6">
                {/* Coach label */}
                <div className="flex items-center gap-2 mb-4">
                    {/* Coach sigil */}
                    <div
                        style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: isDarkMode ? 'rgba(201,106,58,0.18)' : 'rgba(201,106,58,0.12)',
                            border: '1px solid rgba(201,106,58,0.30)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                fill="#C96A3A" opacity="0.85" />
                        </svg>
                    </div>
                    <div>
                        <p style={{
                            fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: isDarkMode ? '#E5D6A7' : '#415D43',
                            lineHeight: 1,
                        }}>
                            Your Coach
                        </p>
                        <p style={{
                            fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em',
                            color: isDarkMode ? 'rgba(229,214,167,0.50)' : 'rgba(65,93,67,0.50)',
                            lineHeight: 1, marginTop: 2,
                        }}>
                            for today
                        </p>
                    </div>
                </div>

                {/* The message — the hero */}
                <AnimatePresence mode="wait">
                    {message ? (
                        <motion.p
                            key={message}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            style={{
                                fontFamily: '"Poppins", sans-serif',
                                fontWeight: 500,
                                fontSize: '17px',
                                lineHeight: 1.65,
                                color: isDarkMode ? 'rgba(253,251,247,0.92)' : '#2D3E33',
                                letterSpacing: '-0.01em',
                                marginBottom: intention ? 16 : 20,
                            }}
                        >
                            {message}
                        </motion.p>
                    ) : (
                        <motion.p
                            key="empty"
                            style={{
                                fontFamily: '"Poppins", sans-serif',
                                fontStyle: 'italic',
                                fontSize: '16px',
                                lineHeight: 1.6,
                                color: isDarkMode ? 'rgba(229,214,167,0.4)' : 'rgba(65,93,67,0.4)',
                                marginBottom: 20,
                            }}
                        >
                            {firstName ? `${firstName}, you showed up today.` : 'You showed up today.'} That's the whole thing.
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Intention callout */}
                {intention && (
                    <div
                        style={{
                            padding: '10px 14px',
                            borderRadius: 14,
                            background: isDarkMode ? 'rgba(229,214,167,0.07)' : 'rgba(65,93,67,0.06)',
                            borderLeft: '2.5px solid rgba(201,106,58,0.45)',
                            marginBottom: 18,
                        }}
                    >
                        <p style={{
                            fontSize: '10px', fontWeight: 800,
                            letterSpacing: '0.13em', textTransform: 'uppercase',
                            color: isDarkMode ? 'rgba(229,214,167,0.45)' : 'rgba(65,93,67,0.45)',
                            marginBottom: 3,
                        }}>
                            Today's intention
                        </p>
                        <p style={{
                            fontSize: '13px', fontWeight: 600,
                            color: isDarkMode ? 'rgba(253,251,247,0.75)' : '#415D43',
                            lineHeight: 1.4,
                        }}>
                            {intention}
                        </p>
                    </div>
                )}

                {/* Action row */}
                <div className="flex items-center gap-2">
                    {onOpenToneSettings && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenToneSettings(); }}
                            style={{
                                padding: '8px 14px', borderRadius: 12,
                                background: isDarkMode ? 'rgba(229,214,167,0.08)' : 'rgba(65,93,67,0.06)',
                                border: `1px solid ${isDarkMode ? 'rgba(229,214,167,0.18)' : 'rgba(65,93,67,0.15)'}`,
                                cursor: 'pointer',
                                color: isDarkMode ? 'rgba(229,214,167,0.7)' : '#415D43',
                                display: 'flex', alignItems: 'center', gap: 5,
                                fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
                            }}
                            aria-label="Change coach tone"
                        >
                            <span style={{ opacity: 0.6, fontSize: '10px' }}>Tone:</span>
                            <span style={{ textTransform: 'capitalize' }}>{coachTone}</span>
                            <span style={{ opacity: 0.4, fontSize: '10px' }}>·</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
                        disabled={isGeneratingImage}
                        style={{
                            padding: '8px 14px', borderRadius: 12,
                            background: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(65,93,67,0.07)',
                            border: 'none', cursor: isGeneratingImage ? 'default' : 'pointer',
                            color: isDarkMode ? 'rgba(229,214,167,0.6)' : '#415D43',
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
                            opacity: isGeneratingImage ? 0.5 : 1,
                            transition: 'opacity 0.2s',
                        }}
                        aria-label="Share"
                    >
                        <Share2 size={14} strokeWidth={2} />
                        Share
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());
                            onRefresh();
                        }}
                        style={{
                            padding: '8px 14px', borderRadius: 12,
                            background: 'none',
                            border: 'none', cursor: 'pointer',
                            color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(65,93,67,0.35)',
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
                        }}
                        aria-label="New practice"
                        title="Start a new practice session"
                    >
                        <RefreshCw size={13} strokeWidth={2} />
                        New practice
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
