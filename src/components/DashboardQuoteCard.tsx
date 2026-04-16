import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Share2, Heart, Clock, Settings, RefreshCw } from 'lucide-react';
import type { Quote } from '../types';
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

function getQuoteFontSize(len: number): string {
    if (len > 180) return '16px';
    if (len > 140) return '18px';
    if (len > 100) return '20px';
    if (len > 65)  return '22px';
    if (len > 40)  return '26px';
    return '28px';
}

const DynamicArtBackground = ({ seed }: { seed: string }) => {
    const getRand = (s: string, i: number) => {
        let hash = 0;
        for (let j = 0; j < s.length; j++) hash = ((hash << 5) - hash) + s.charCodeAt(j);
        const x = Math.sin(hash + i) * 10000;
        return x - Math.floor(x);
    };
    const colors = ['#F59E0B', '#FCD34D', '#FF8A65', '#4FD1C5', '#F472B6'];
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="520" fill={colors[Math.floor(getRand(seed, 0) * colors.length)]} opacity="0.8" />
            {[1, 2, 3, 4, 5].map((i) => (
                <circle key={i}
                    cx={50 + getRand(seed, i * 10) * 300}
                    cy={50 + getRand(seed, i * 20) * 420}
                    r={150 + getRand(seed, i * 30) * 150}
                    fill={colors[Math.floor(getRand(seed, i * 40) * colors.length)]}
                    opacity={0.4 + getRand(seed, i * 50) * 0.4}
                    style={{ mixBlendMode: 'multiply' }}
                />
            ))}
        </svg>
    );
};

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
        const t = new Date();
        return `quote_refresh_${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
    };
    const getRefreshCount = (): number => {
        try { const s = localStorage.getItem(getTodayKey()); return s ? parseInt(s, 10) : 0; }
        catch { return 0; }
    };
    const [refreshCount, setRefreshCount] = useState(getRefreshCount());
    const incrementRefreshCount = () => {
        const n = refreshCount + 1;
        setRefreshCount(n);
        try { localStorage.setItem(getTodayKey(), n.toString()); } catch { /* ignore */ }
    };

    const isTierQuote = quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire' || quote.author === 'Palante Coach' || quote.isAI;
    const quoteText   = quote?.text   || 'Keep moving forward.';
    const quoteAuthor = quote?.author || 'Palante Coach';
    const seed = `${quote.id}-${new Date().toLocaleDateString()}-${refreshCount}`;

    // ── Share ──────────────────────────────────────────────────────────────
    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            const element = document.getElementById('share-preview-container');
            if (!element) throw new Error('Preview element not found');
            const canvas = await html2canvas(element, {
                scale: 8, backgroundColor: null, useCORS: true, allowTaint: true, logging: false,
            });
            const base64Data = canvas.toDataURL('image/png').split(',')[1];
            const { Directory, Filesystem } = await import('@capacitor/filesystem');
            const savedFile = await Filesystem.writeFile({
                path: `palante_quote_${Date.now()}.png`, data: base64Data, directory: Directory.Cache,
            });
            const { Share } = await import('@capacitor/share');
            await Share.share({ title: 'Inspiration from Palante', files: [savedFile.uri], dialogTitle: 'Share your inspiration' });
        } catch (error) {
            console.error('[Palante] Share error:', error);
            try {
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Inspiration from Palante',
                    text: isTierQuote ? `"${quoteText}"\n\n— @palante.app` : `"${quoteText}" — ${quoteAuthor}\n\n@palante.app`,
                });
            } catch { /* share cancelled */ }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // ── Parallax ──────────────────────────────────────────────────────────
    // Raw input [-0.5, 0.5] on each axis
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);

    // Smooth physics — gentle stiffness for a weighty-card feel
    const springCfg = { stiffness: 70, damping: 18, mass: 1 };
    const springX = useSpring(rawX, springCfg);
    const springY = useSpring(rawY, springCfg);

    // 1. Card 3D tilt — perspective is on the wrapper div below
    const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);
    const rotateX = useTransform(springY, [-0.5, 0.5], [ 8, -8]);

    // 2. Background drifts WITH tilt (feels like it's on a far layer)
    const bgX = useTransform(springX, [-0.5, 0.5], ['-12%', '12%']);
    const bgY = useTransform(springY, [-0.5, 0.5], [ '-8%',  '8%']);

    // 3. Quote box counter-drifts AGAINST tilt (feels elevated / close)
    const boxX = useTransform(springX, [-0.5, 0.5], [ 8, -8]);
    const boxY = useTransform(springY, [-0.5, 0.5], [ 6, -6]);

    // 4. Dynamic shadow shifts opposite to tilt
    const shadowX = useTransform(springX, [-0.5, 0.5], [ 14, -14]);
    const shadowY = useTransform(springY, [-0.5, 0.5], [ 24,   6]);
    const boxShadow = useTransform(
        [shadowX, shadowY] as const,
        ([sx, sy]: number[]) =>
            `${sx}px ${sy}px 48px -8px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)`,
    );

    // 5. Specular gloss — a soft highlight that sweeps left→right as card tilts
    const glossLeft  = useTransform(springX, [-0.5, 0.5], ['-20%', '120%']);
    const glossOpacity = useTransform(springX, [-0.5, 0.5], [0.22, 0.06]);

    // Gyroscope (device) input
    useEffect(() => {
        const handle = (e: DeviceOrientationEvent) => {
            if (e.gamma === null || e.beta === null) return;
            // Natural hold ≈ 45° beta; normalize to [-0.5, 0.5]
            rawX.set(Math.max(-0.5, Math.min(0.5, e.gamma / 45)));
            rawY.set(Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 45)));
        };
        if (typeof DeviceOrientationEvent !== 'undefined') {
            window.addEventListener('deviceorientation', handle, true);
        }
        return () => window.removeEventListener('deviceorientation', handle, true);
    }, [rawX, rawY]);

    // Mouse input (desktop preview)
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        rawX.set((e.clientX - r.left) / r.width  - 0.5);
        rawY.set((e.clientY - r.top)  / r.height - 0.5);
    };
    const handleMouseLeave = () => {
        rawX.set(0);
        rawY.set(0);
    };

    const fontSize   = getQuoteFontSize(quoteText.length);
    const lineHeight = quoteText.length > 120 ? 1.48 : 1.38;
    const btnColor   = 'rgba(40,50,40,0.6)';

    return (
        <>
            <AnimatePresence mode="wait">
                <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 18, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full"
                    /* perspective on the WRAPPER — this is the camera */
                    style={{ perspective: '900px', perspectiveOrigin: '50% 50%' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* ── 3D tilting card ── */}
                    <motion.div
                        style={{
                            rotateX,
                            rotateY,
                            boxShadow,
                            position: 'relative',
                            borderRadius: '32px',
                            overflow: 'hidden',           // clips bg art to rounded corners
                            backgroundColor: '#B5C2B1',
                            display: 'flex',
                            flexDirection: 'column',
                            willChange: 'transform',
                        }}
                    >
                        {/* ── Background art — drifts WITH tilt ── */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                inset: '-12%',
                                x: bgX,
                                y: bgY,
                                pointerEvents: 'none',
                            }}
                        >
                            <DynamicArtBackground seed={seed} />
                        </motion.div>

                        {/* ── Grain overlay ── */}
                        <div aria-hidden="true" style={{
                            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
                        }} />

                        {/* ── Specular gloss sweep — moves with tilt ── */}
                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                                background: useTransform(glossLeft, (gl) =>
                                    `radial-gradient(ellipse 55% 80% at ${gl} 20%, rgba(255,255,255,0.55) 0%, transparent 65%)`
                                ),
                                opacity: glossOpacity,
                            }}
                        />

                        {/* ── Quote box — counter-drifts AGAINST tilt ── */}
                        <motion.div
                            style={{
                                position: 'relative',
                                zIndex: 4,
                                margin: '40px 32px 24px 32px',
                                x: boxX,
                                y: boxY,
                                backgroundColor: '#FDFBF7',
                                borderRadius: '24px',
                                padding: '40px 24px 32px 24px',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.13)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={quoteText}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{
                                        fontFamily: '"Poppins", sans-serif',
                                        fontWeight: 600,
                                        fontSize,
                                        lineHeight,
                                        color: '#2D3E33',
                                        letterSpacing: '-0.02em',
                                        marginBottom: isTierQuote ? '0px' : '24px',
                                    }}
                                >
                                    {quoteText}
                                </motion.p>
                            </AnimatePresence>

                            {!isTierQuote && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div style={{ width: '20px', height: '1px', backgroundColor: '#879582', opacity: 0.4 }} />
                                    <p style={{
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 500,
                                        fontSize: '13px',
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        color: '#879582',
                                    }}>
                                        {quoteAuthor}
                                    </p>
                                </div>
                            )}
                        </motion.div>

                        <div style={{ flex: 1 }} />

                        {/* ── Action bar ── */}
                        <div style={{
                            position: 'relative', zIndex: 4,
                            padding: '0 16px 24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            {onToggleFavorite && (
                                <motion.button whileTap={{ scale: 0.85 }} onClick={onToggleFavorite}
                                    aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
                                    style={{ padding: '12px', borderRadius: '50%', border: 'none',
                                        background: isFavorited ? 'rgba(224,90,90,0.15)' : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', color: isFavorited ? '#E05A5A' : btnColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} strokeWidth={2} />
                                </motion.button>
                            )}

                            {onOpenHistory && (
                                <motion.button whileTap={{ scale: 0.85 }} onClick={onOpenHistory}
                                    style={{ padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', color: btnColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                                    <Clock size={18} strokeWidth={2} />
                                </motion.button>
                            )}

                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowShareModal(true)} disabled={isGeneratingImage}
                                style={{ padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)',
                                    cursor: isGeneratingImage ? 'default' : 'pointer', color: btnColor,
                                    opacity: isGeneratingImage ? 0.6 : 1, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                                {isGeneratingImage
                                    ? <div style={{ width: 18, height: 18, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    : <Share2 size={18} strokeWidth={2} />}
                            </motion.button>

                            {onRefresh && (
                                <motion.button whileTap={{ scale: 0.85 }}
                                    onClick={() => {
                                        if (refreshCount < MAX_REFRESHES) {
                                            import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());
                                            incrementRefreshCount();
                                            onRefresh();
                                        }
                                    }}
                                    disabled={refreshCount >= MAX_REFRESHES}
                                    style={{ position: 'relative', padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)',
                                        cursor: refreshCount >= MAX_REFRESHES ? 'not-allowed' : 'pointer',
                                        color: refreshCount >= MAX_REFRESHES ? 'rgba(40,50,40,0.3)' : btnColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                                    <RefreshCw size={18} strokeWidth={2} />
                                    {refreshCount > 0 && refreshCount < MAX_REFRESHES && (
                                        <span style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px',
                                            borderRadius: '50%', backgroundColor: '#FDFBF7', color: '#2D3E33',
                                            fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            {refreshCount}
                                        </span>
                                    )}
                                </motion.button>
                            )}

                            {onOpenSettings && (
                                <motion.button whileTap={{ scale: 0.85 }} onClick={onOpenSettings}
                                    style={{ padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', color: btnColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                                    <Settings size={18} strokeWidth={2} />
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                quote={quote}
                isDarkMode={isDarkMode}
                onGenerateImage={handleShare}
                isGeneratingImage={isGeneratingImage}
                seed={seed}
            />
        </>
    );
};
