import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Share2, Heart, Clock, Settings, RefreshCw, Pin } from 'lucide-react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { Quote } from '../types';
import { ShareModal } from './ShareModal';
// html2canvas removed — image generation now uses Canvas 2D API via shareUtils

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
    // Earthy palette — matches SharedQuotePreview exactly so home card = share card
    const colors = ['#F59E0B', '#E5D6A7', '#C96A3A', '#415D43', '#879582'];
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="520" fill={colors[Math.floor(getRand(seed, 0) * colors.length)]} opacity="0.85" />
            {[1, 2, 3, 4, 5].map((i) => (
                <circle key={i}
                    cx={50 + getRand(seed, i * 10) * 300}
                    cy={50 + getRand(seed, i * 20) * 420}
                    r={150 + getRand(seed, i * 30) * 150}
                    fill={colors[Math.floor(getRand(seed, i * 40) * colors.length)]}
                    opacity={0.18 + getRand(seed, i * 50) * 0.22}
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
    // Optimistic local state — iOS preserve-3d containers can drop click events;
    // showing feedback instantly prevents the heart feeling "broken".
    const [localFavorited, setLocalFavorited] = useState<boolean | null>(null);
    const effectiveFavorited = localFavorited !== null ? localFavorited : (isFavorited ?? false);
    // Sync local back to prop whenever parent confirms the toggle
    useEffect(() => { setLocalFavorited(null); }, [isFavorited]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [gyroPermitted, setGyroPermitted] = useState(false);
    const [pinnedQuoteId, setPinnedQuoteId] = useState<string | null>(() => {
        try {
            const p = localStorage.getItem(STORAGE_KEYS.PINNED_QUOTE);
            return p ? JSON.parse(p)?.id ?? null : null;
        } catch { return null; }
    });
    const [pinConfirm, setPinConfirm] = useState(false);

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
    const getShareFileName = () => {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(/,/g, '');
        return `Palante Wisdom - ${quoteAuthor} - ${date}.jpg`;
    };

    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            const { generateShareImage } = await import('../utils/shareUtils');
            const dataUrl   = await generateShareImage(quote, seed);
            const base64    = dataUrl.split(',')[1];
            const fileName  = getShareFileName();

            const { Directory, Filesystem } = await import('@capacitor/filesystem');
            const saved = await Filesystem.writeFile({
                path: fileName, data: base64, directory: Directory.Cache,
            });

            const { Share } = await import('@capacitor/share');
            await Share.share({
                title: 'Inspiration from Palante',
                files: [saved.uri],
                dialogTitle: 'Share your inspiration',
            });
        } catch (error) {
            console.error('[Palante] Share error:', error);
            try {
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Inspiration from Palante',
                    text: isTierQuote
                        ? `"${quoteText}"\n\n— @palante.app`
                        : `"${quoteText}" — ${quoteAuthor}\n\n@palante.app`,
                });
            } catch { /* share cancelled */ }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleDownload = async () => {
        setIsGeneratingImage(true);
        try {
            const { generateShareImage } = await import('../utils/shareUtils');
            const dataUrl = await generateShareImage(quote, seed);
            
            // On desktop/Mac, standard anchor d/l works best
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = getShareFileName();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('[Palante] Download error:', error);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // ── Pin to widget ─────────────────────────────────────────────────────
    const isThisQuotePinned = pinnedQuoteId === quote.id;

    const handleTogglePin = () => {
        if (isThisQuotePinned) {
            localStorage.removeItem(STORAGE_KEYS.PINNED_QUOTE);
            setPinnedQuoteId(null);
        } else {
            const pinData = { id: quote.id, text: quoteText, author: quoteAuthor, pinnedAt: Date.now() };
            localStorage.setItem(STORAGE_KEYS.PINNED_QUOTE, JSON.stringify(pinData));
            setPinnedQuoteId(quote.id);
            setPinConfirm(true);
            setTimeout(() => setPinConfirm(false), 2200);
        }
        try { import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic()); } catch { /* */ }
    };

    // ── Parallax ──────────────────────────────────────────────────────────
    // Raw input [-0.5, 0.5] on each axis
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);

    // Fluid spring — low stiffness + high damping = heavy card that settles without bounce
    const springCfg = { stiffness: 50, damping: 22, mass: 0.85 };
    const springX = useSpring(rawX, springCfg);
    const springY = useSpring(rawY, springCfg);

    // 1. Card 3D tilt — perspective is on the wrapper div below
    //    Reduced to ±7° so the tilt reads as depth, not spinning
    const rotateY = useTransform(springX, [-0.5, 0.5], [-7,  7]);
    const rotateX = useTransform(springY, [-0.5, 0.5], [ 5, -5]);

    // 2. Background drifts WITH tilt and sits deeper in Z-space (scale covers the gap)
    const bgX = useTransform(springX, [-0.5, 0.5], ['-10%', '10%']);
    const bgY = useTransform(springY, [-0.5, 0.5], [ '-7%',  '7%']);

    // 3. Quote box counter-drifts AGAINST tilt — feels like it floats above the card
    const boxX = useTransform(springX, [-0.5, 0.5], [ 6, -6]);
    const boxY = useTransform(springY, [-0.5, 0.5], [ 4, -4]);

    // 4. Dynamic shadow shifts opposite to tilt
    const shadowX = useTransform(springX, [-0.5, 0.5], [ 12, -12]);
    const shadowY = useTransform(springY, [-0.5, 0.5], [ 28,   8]);
    const boxShadow = useTransform(
        [shadowX, shadowY] as const,
        ([sx, sy]: number[]) =>
            `${sx}px ${sy}px 56px -8px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.10)`,
    );

    // 5. Specular gloss — a soft highlight that sweeps left→right as card tilts
    const glossLeft  = useTransform(springX, [-0.5, 0.5], ['-20%', '120%']);
    const glossOpacity = useTransform(springX, [-0.5, 0.5], [0.20, 0.04]);

    // Gyroscope (device) input
    // iOS 13+ silently blocks deviceorientation until requestPermission() is called.
    // It MUST be invoked directly from a native (non-React) touchend handler — async
    // React synthetic events are outside the gesture boundary iOS enforces.
    useEffect(() => {
        const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };

        if (typeof DOE.requestPermission !== 'function') {
            // Android, desktop, or older iOS — events fire freely
            setGyroPermitted(true);
            return;
        }

        // Request on first native touchend anywhere on the page
        const requestOnFirstTouch = () => {
            DOE.requestPermission()
                .then((result: string) => { if (result === 'granted') setGyroPermitted(true); })
                .catch(() => { setGyroPermitted(true); });
        };

        window.addEventListener('touchend', requestOnFirstTouch, { once: true });
        return () => window.removeEventListener('touchend', requestOnFirstTouch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Idle breathing animation — slow sine oscillation until gyro takes over
    useEffect(() => {
        let raf: number;
        let gyroActive = false;
        const start = performance.now();

        const tick = (now: number) => {
            if (!gyroActive) {
                const t = (now - start) / 1000;
                // Slower, gentler breathing (0.22/0.16 Hz) — feels like the card is alive, not jittery
                rawX.set(Math.sin(t * 0.22) * 0.26);
                rawY.set(Math.sin(t * 0.16 + 1.2) * 0.18);
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        // Only stop idle when real motion data arrives (not null-value iOS permission-pending events)
        const stopIdle = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null && e.beta !== null && Math.abs(e.gamma) > 0.5) gyroActive = true;
        };
        window.addEventListener('deviceorientation', stopIdle);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('deviceorientation', stopIdle as EventListener);
        };
    }, [rawX, rawY]);

    useEffect(() => {
        if (!gyroPermitted) return;
        const handle = (e: DeviceOrientationEvent) => {
            if (e.gamma === null || e.beta === null) return;
            // Natural hold ≈ 45° beta; normalize to [-0.5, 0.5]
            rawX.set(Math.max(-0.5, Math.min(0.5, e.gamma / 45)));
            rawY.set(Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 45)));
        };
        window.addEventListener('deviceorientation', handle, true);
        return () => window.removeEventListener('deviceorientation', handle, true);
    }, [gyroPermitted, rawX, rawY]);

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
                    /* perspective on the WRAPPER — smaller value = more dramatic 3D */
                    style={{ perspective: '1100px', perspectiveOrigin: '50% 45%' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* ── 3D tilting card — preserve-3d lets children use translateZ for real depth ── */}
                    <motion.div
                        style={{
                            rotateX,
                            rotateY,
                            boxShadow,
                            position: 'relative',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            backgroundColor: '#415D43',
                            display: 'flex',
                            flexDirection: 'column',
                            willChange: 'transform',
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        {/* ── Background art — pushed back in Z so it reads as a distant layer ── */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                x: bgX,
                                y: bgY,
                                z: -16,            // recedes behind card surface
                                pointerEvents: 'none',
                                scale: 1.35,       // extra scale covers ±10% drift + z recession
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

                        {/* ── Quote box — counter-drifts AGAINST tilt, floats forward in Z ── */}
                        <motion.div
                            style={{
                                position: 'relative',
                                zIndex: 4,
                                margin: '40px 24px 24px 24px',
                                x: boxX,
                                y: boxY,
                                z: 28,             // floats in front of the card surface
                                backgroundColor: '#FDFBF7',
                                borderRadius: '24px',
                                padding: '40px 24px 32px 24px',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.10)',
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
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
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        setLocalFavorited(!effectiveFavorited);
                                        onToggleFavorite();
                                    }}
                                    aria-label={effectiveFavorited ? 'Unfavorite' : 'Favorite'}
                                    style={{
                                        padding: '12px', borderRadius: '50%', border: 'none',
                                        background: effectiveFavorited ? 'rgba(224,90,90,0.15)' : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', color: effectiveFavorited ? '#E05A5A' : btnColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)',
                                        pointerEvents: 'auto', touchAction: 'manipulation',
                                    }}>
                                    <Heart size={18} fill={effectiveFavorited ? 'currentColor' : 'none'} strokeWidth={2} />
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

                            {/* Pin to widget */}
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={handleTogglePin}
                                aria-label={isThisQuotePinned ? 'Unpin from widget' : 'Pin to widget'}
                                style={{
                                    padding: '12px', borderRadius: '50%', border: 'none',
                                    background: isThisQuotePinned ? 'rgba(201,106,58,0.18)' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    color: isThisQuotePinned ? '#C96A3A' : btnColor,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)',
                                }}
                            >
                                <Pin size={18} strokeWidth={2} fill={isThisQuotePinned ? 'currentColor' : 'none'} />
                            </motion.button>

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

            {/* Pin confirmation toast */}
            <AnimatePresence>
                {pinConfirm && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        style={{
                            position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)',
                            background: '#C96A3A', color: '#fff',
                            padding: '8px 20px', borderRadius: '999px',
                            fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em',
                            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(201,106,58,0.35)',
                            zIndex: 20,
                        }}
                    >
                        Pinned to your widget
                    </motion.div>
                )}
            </AnimatePresence>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                quote={quote}
                isDarkMode={isDarkMode}
                onGenerateImage={handleShare}
                onDownloadImage={handleDownload}
                isGeneratingImage={isGeneratingImage}
                seed={seed}
            />
        </>
    );
};
