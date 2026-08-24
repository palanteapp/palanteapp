import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { haptics } from '../utils/haptics';
import { generateGrowthStory, type GrowthStoryData } from '../utils/aiService';

interface GrowthStoryModalProps {
    isOpen: boolean;
    data: GrowthStoryData | null;
    isDarkMode: boolean;
    onClose: () => void;
    onShare?: (memoir: string) => void;
}

const ACCENT = '#C96A3A';
const GOLD = '#E5D6A7';

export const GrowthStoryModal: React.FC<GrowthStoryModalProps> = ({
    isOpen, data, isDarkMode: _isDarkMode, onClose, onShare,
}) => {
    const [memoir, setMemoir] = useState<string | null>(null);
    const [stats, setStats] = useState<{ gratitudesWritten: number; eveningsReflected: number; totalPractices: number } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !data) return;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resets and kicks off the async memoir generation each time the modal opens with new data
        setMemoir(null);
        setStats(null);
        setLoading(true);

        haptics.success();
        setTimeout(() => triggerConfetti(), 800);

        generateGrowthStory(data).then(result => {
            // Guards against a reopen-with-new-data racing ahead of an in-flight
            // generation: without this, the stale call's result could land after
            // the newer one and silently overwrite it.
            if (cancelled) return;
            setMemoir(result.memoir);
            setStats(result.stats);
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [isOpen, data]);

    const firstName = data?.firstName || 'you';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[350] flex flex-col overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(30,55,35,1) 0%, rgba(6,14,10,1) 100%)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    {/* Background bloom */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse 70% 55% at 50% 35%, rgba(201,106,58,0.22) 0%, transparent 70%)`,
                        }}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                    />

                    {/* Sacred geometry hairlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 50% 50%, transparent 30%, rgba(229,214,167,0.8) 30.5%, transparent 31%),
                                radial-gradient(circle at 50% 50%, transparent 55%, rgba(229,214,167,0.8) 55.5%, transparent 56%),
                                radial-gradient(circle at 50% 50%, transparent 78%, rgba(229,214,167,0.8) 78.5%, transparent 79%)
                            `,
                        }}
                    />

                    {/* Scrollable content */}
                    <div className="relative z-10 flex-1 overflow-y-auto">
                        <div className="flex flex-col items-center px-8 py-16 max-w-sm mx-auto w-full text-center">

                            {/* Header label */}
                            <motion.p
                                className="text-xs font-black uppercase tracking-[0.35em] text-white mb-6"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                            >
                                Palante · 90-Day Story
                            </motion.p>

                            {/* Bloom glyph */}
                            <motion.div
                                className="mb-8"
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <svg viewBox="0 0 80 80" width="80" height="80">
                                    <defs>
                                        <radialGradient id="gsGlow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.9" />
                                            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                                        </radialGradient>
                                    </defs>
                                    {/* Full 4 rings: completed */}
                                    {[14, 22, 30, 38].map((r, i) => (
                                        <motion.circle
                                            key={r}
                                            cx={40} cy={40} r={r}
                                            fill="none"
                                            stroke={i === 3 ? ACCENT : 'rgba(255,255,255,0.18)'}
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * r}`}
                                            strokeDashoffset="0"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                                        />
                                    ))}
                                    {/* Petals on outer ring */}
                                    {[...Array(20)].map((_, i) => {
                                        const angle = (i / 20) * 2 * Math.PI - Math.PI / 2;
                                        return (
                                            <motion.circle
                                                key={`p-${i}`}
                                                cx={40 + 38 * Math.cos(angle)}
                                                cy={40 + 38 * Math.sin(angle)}
                                                r={2.5}
                                                fill={ACCENT}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 0.9 }}
                                                transition={{ duration: 0.35, delay: 0.7 + i * 0.03, ease: 'backOut' }}
                                            />
                                        );
                                    })}
                                    <circle cx={40} cy={40} r={10} fill="url(#gsGlow)" />
                                    <circle cx={40} cy={40} r={4} fill={ACCENT} opacity={0.95} />
                                </svg>
                            </motion.div>

                            {/* Title */}
                            <motion.div
                                className="mb-8"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                            >
                                <p className="text-xs font-black uppercase tracking-[0.28em] mb-2"
                                    style={{ color: ACCENT }}>
                                    Full Bloom · Day 90
                                </p>
                                <h1 className="text-4xl font-display font-medium text-white leading-tight">
                                    Your Growth Story
                                </h1>
                                <p className="text-sm font-medium text-white mt-1 tracking-wide">
                                    {firstName}'s Mandala
                                </p>
                            </motion.div>

                            {/* Memoir text */}
                            <motion.div
                                className="w-full mb-8"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0, duration: 0.8 }}
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center gap-4 py-8">
                                        <motion.div
                                            className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <p className="text-sm text-white tracking-wider uppercase">
                                            Reading your story...
                                        </p>
                                    </div>
                                ) : (
                                    <div
                                        className="rounded-2xl px-6 py-6 text-left"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <p className="text-base font-serif leading-relaxed"
                                            style={{ color: 'rgba(255,255,255,0.82)', lineHeight: '1.75' }}>
                                            {memoir}
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            {/* Stats row */}
                            {stats && !loading && (
                                <motion.div
                                    className="flex justify-center gap-6 w-full mb-10"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.3, duration: 0.6 }}
                                >
                                    {[
                                        { value: stats.totalPractices, label: 'Practices' },
                                        { value: stats.gratitudesWritten, label: 'Gratitudes' },
                                        { value: stats.eveningsReflected, label: 'Evenings' },
                                    ].map(({ value, label }) => (
                                        <div key={label} className="flex flex-col items-center gap-1">
                                            <span className="text-3xl font-display font-medium"
                                                style={{ color: GOLD }}>
                                                {value}
                                            </span>
                                            <span className="text-xs font-medium uppercase tracking-wider text-white">
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Divider */}
                            {!loading && (
                                <motion.div
                                    className="w-16 h-px mb-10"
                                    style={{ background: `${ACCENT}50` }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 1.4, duration: 0.5 }}
                                />
                            )}

                            {/* CTAs */}
                            {!loading && (
                                <motion.div
                                    className="flex flex-col w-full gap-3"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5, duration: 0.6 }}
                                >
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 rounded-full font-bold text-white text-sm tracking-wider uppercase transition-all active:scale-95"
                                        style={{ background: ACCENT }}
                                    >
                                        Continue the Story
                                    </button>

                                    {onShare && memoir && (
                                        <button
                                            onClick={() => onShare(memoir)}
                                            className="w-full py-3 text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
                                            style={{ color: `${ACCENT}90` }}
                                        >
                                            Share My Story
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            <div className="h-8" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
