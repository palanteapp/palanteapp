import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { haptics } from '../utils/haptics';
import { ENTRANCE_EASE, STAGGER } from '../constants/motion';

export type RingCeremonyType = 'ring1' | 'ring2' | 'ring3' | 'fullbloom';

interface RingCeremonyProps {
    type: RingCeremonyType;
    isOpen: boolean;
    userName?: string;
    isDarkMode: boolean;
    onClose: () => void;
    onShare?: () => void;
    onSave?: () => void;
}

const CEREMONIES: Record<RingCeremonyType, {
    ringsComplete: number;
    totalRings: number;
    phase: string;
    title: string;
    subtitle: string;
    coachMessage: string;
    koi?: string;
    accentColor: string;
    glowColor: string;
}> = {
    ring1: {
        ringsComplete: 1,
        totalRings: 4,
        phase: 'THE SEED HAS TAKEN ROOT',
        title: 'Ring One',
        subtitle: 'Ten Practices',
        coachMessage: 'Ten practices. Your roots are in the ground. Most people never make it here, but you did. The garden is beginning to wake.',
        koi: 'Your first koi joins the pond.',
        accentColor: '#C96A3A',
        glowColor: 'rgba(201,106,58,0.35)',
    },
    ring2: {
        ringsComplete: 2,
        totalRings: 4,
        phase: 'THE BLOOM BEGINS',
        title: 'Ring Two',
        subtitle: 'Twenty-Eight Practices',
        coachMessage: 'Twenty-eight practices. Something has shifted. You may not be able to name it yet, but your body knows it. This is the feeling of becoming.',
        koi: 'A second koi joins your pond.',
        accentColor: '#E5D6A7',
        glowColor: 'rgba(229,214,167,0.30)',
    },
    ring3: {
        ringsComplete: 3,
        totalRings: 4,
        phase: 'YOUR CANOPY IS FORMING',
        title: 'Ring Three',
        subtitle: 'Fifty-Five Practices',
        coachMessage: 'Fifty-five practices in. What started as intention has become instinct. Most habits are just now forming for others. Yours are already roots.',
        koi: 'A third koi enters the water.',
        accentColor: '#415D43',
        glowColor: 'rgba(65,93,67,0.45)',
    },
    fullbloom: {
        ringsComplete: 4,
        totalRings: 4,
        phase: 'THE MANDALA IS COMPLETE',
        title: 'Full Bloom',
        subtitle: '90 Days',
        coachMessage: '90 days. You came back every time it was hard. Every time it would have been easier not to. Your mandala is complete, and so is this chapter. A letter is waiting for you.',
        accentColor: '#C96A3A',
        glowColor: 'rgba(201,106,58,0.40)',
    },
};

// Concentric ring SVG: shows which rings are filled
const MandalaRings: React.FC<{ ringsComplete: number; totalRings: number; accentColor: string; glowColor: string }> = ({
    ringsComplete, totalRings, accentColor, glowColor: _glowColor
}) => {
    const cx = 110;
    const cy = 110;
    const radii = [22, 42, 62, 82, 102];
    const petalCounts = [0, 8, 12, 16, 20];

    return (
        <svg viewBox="0 0 220 220" width="220" height="220" style={{ overflow: 'visible' }}>
            <defs>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                </radialGradient>
                <filter id="ringGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Outer ghost rings */}
            {[...Array(totalRings)].map((_, i) => (
                <circle
                    key={`ghost-${i}`}
                    cx={cx} cy={cy}
                    r={radii[i + 1]}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="18"
                />
            ))}

            {/* Filled rings up to ringsComplete */}
            {[...Array(ringsComplete)].map((_, i) => (
                <motion.circle
                    key={`ring-${i}`}
                    cx={cx} cy={cy}
                    r={radii[i + 1]}
                    fill="none"
                    stroke={i === ringsComplete - 1 ? accentColor : 'rgba(255,255,255,0.18)'}
                    strokeWidth="18"
                    filter={i === ringsComplete - 1 ? 'url(#ringGlow)' : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.4, delay: i * STAGGER.ceremony, ease: 'easeOut' }}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * radii[i + 1]}`}
                    strokeDashoffset="0"
                />
            ))}

            {/* Petals on the newest ring */}
            {[...Array(petalCounts[ringsComplete])].map((_, i) => {
                const angle = (i / petalCounts[ringsComplete]) * 2 * Math.PI - Math.PI / 2;
                const r = radii[ringsComplete];
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                return (
                    <motion.circle
                        key={`petal-${i}`}
                        cx={px} cy={py} r={5}
                        fill={accentColor}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.9 }}
                        transition={{ duration: 0.4, delay: 1.2 + i * STAGGER.tight, ease: 'backOut' }}
                    />
                );
            })}

            {/* Center seed glow */}
            <motion.circle
                cx={cx} cy={cy} r={radii[0]}
                fill="url(#centerGlow)"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />
            <circle cx={cx} cy={cy} r={6} fill={accentColor} opacity={0.95} />
        </svg>
    );
};

export const RingCeremony: React.FC<RingCeremonyProps> = ({
    type, isOpen, userName, isDarkMode: _isDarkMode, onClose, onShare, onSave
}) => {
    const ceremony = CEREMONIES[type];
    const firstName = userName?.split(' ')[0] || 'you';

    useEffect(() => {
        if (!isOpen) return;
        haptics.success();
        if (type === 'fullbloom') {
            setTimeout(() => triggerConfetti(), 600);
        }
    }, [isOpen, type]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(30,55,35,1) 0%, rgba(8,18,12,1) 100%)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: ENTRANCE_EASE }}
                >
                    {/* Background glow bloom */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${ceremony.glowColor} 0%, transparent 70%)`,
                        }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                    />

                    {/* Sacred geometry hairlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 50% 50%, transparent 30%, rgba(229,214,167,0.8) 30.5%, transparent 31%),
                                radial-gradient(circle at 50% 50%, transparent 50%, rgba(229,214,167,0.8) 50.5%, transparent 51%),
                                radial-gradient(circle at 50% 50%, transparent 70%, rgba(229,214,167,0.8) 70.5%, transparent 71%)
                            `,
                        }}
                    />

                    <div className="relative z-10 flex flex-col items-center px-8 max-w-sm w-full text-center">

                        {/* Phase label */}
                        <motion.p
                            className="text-xs font-black uppercase tracking-[0.35em] text-white mb-8"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            Palante · 90-Day Practice
                        </motion.p>

                        {/* Mandala visualization */}
                        <motion.div
                            className="mb-8"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.9, ease: ENTRANCE_EASE }}
                        >
                            <MandalaRings
                                ringsComplete={ceremony.ringsComplete}
                                totalRings={ceremony.totalRings}
                                accentColor={ceremony.accentColor}
                                glowColor={ceremony.glowColor}
                            />
                        </motion.div>

                        {/* Ring name + subtitle */}
                        <motion.div
                            className="mb-2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                        >
                            <p className="text-xs font-black uppercase tracking-[0.28em] mb-2"
                                style={{ color: ceremony.accentColor }}>
                                {ceremony.phase}
                            </p>
                            <h1 className="text-4xl font-display font-medium text-white leading-tight">
                                {ceremony.title}
                            </h1>
                            <p className="text-sm font-medium text-white mt-1 tracking-wide">
                                {ceremony.subtitle}
                            </p>
                        </motion.div>

                        {/* Coach message */}
                        <motion.p
                            className="text-base font-body text-white/75 leading-relaxed mt-6 mb-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0, duration: 0.7 }}
                        >
                            "{ceremony.coachMessage}"
                        </motion.p>

                        {/* Koi unlock note */}
                        {ceremony.koi && (
                            <motion.p
                                className="text-xs font-medium tracking-wide mt-4 px-5 py-2 rounded-full border"
                                style={{
                                    color: ceremony.accentColor,
                                    borderColor: `${ceremony.accentColor}40`,
                                    background: `${ceremony.accentColor}10`,
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.3, duration: 0.5 }}
                            >
                                {ceremony.koi}
                            </motion.p>
                        )}

                        {/* Actions */}
                        <motion.div
                            className="flex flex-col w-full gap-3 mt-10"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                        >
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-full font-bold text-white text-sm tracking-wider uppercase transition-all active:scale-95"
                                style={{ background: ceremony.accentColor }}
                            >
                                Keep Growing
                            </button>

                            {onSave && type === 'fullbloom' && (
                                <button
                                    onClick={onSave}
                                    className="w-full py-3 text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
                                    style={{ color: `${ceremony.accentColor}` }}
                                >
                                    Save to Camera Roll
                                </button>
                            )}

                            {onShare && (
                                <button
                                    onClick={onShare}
                                    className="w-full py-3 text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
                                    style={{ color: `${ceremony.accentColor}90` }}
                                >
                                    Share This Moment
                                </button>
                            )}
                        </motion.div>

                        {/* Progress dots */}
                        <motion.div
                            className="flex gap-2 mt-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.6 }}
                        >
                            {[1, 2, 3, 4].map(ring => (
                                <div
                                    key={ring}
                                    className="rounded-full transition-all"
                                    style={{
                                        width: ring <= ceremony.ringsComplete ? 24 : 6,
                                        height: 6,
                                        background: ring <= ceremony.ringsComplete
                                            ? ceremony.accentColor
                                            : 'rgba(255,255,255,0.15)',
                                    }}
                                />
                            ))}
                        </motion.div>

                        <motion.p
                            className="text-xs text-white tracking-widest uppercase mt-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.7 }}
                        >
                            {ceremony.ringsComplete} of 4 rings · {firstName}'s Mandala
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
