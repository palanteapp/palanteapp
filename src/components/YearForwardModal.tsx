import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, ArrowDown, Loader2 } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { generateYearForwardLetter, type YearForwardData } from '../utils/yearForward';

interface YearForwardModalProps {
    isOpen: boolean;
    data: YearForwardData | null;
    onClose: () => void;
    onShare?: (letter: string) => void;
}

const GOLD = '#E5D6A7';
const ACCENT = '#C96A3A';
const INK = 'rgba(250,247,243,0.92)';
const INK_SOFT = 'rgba(250,247,243,0.58)';

// One full-height movement with scroll-snap. Kept local, purely presentational.
const Movement: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <section
        className={`min-h-[100dvh] w-full flex flex-col justify-center px-7 ${className}`}
        style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
    >
        <div className="w-full max-w-md mx-auto">{children}</div>
    </section>
);

const Stat: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
    <div
        className="rounded-2xl px-4 py-5 flex flex-col"
        style={{ background: 'rgba(250,247,243,0.05)', border: '1px solid rgba(229,214,167,0.16)' }}
    >
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: GOLD, fontSize: '30px', lineHeight: 1 }}>
            {value}
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: INK_SOFT, fontSize: '12px', marginTop: 8, letterSpacing: '0.02em' }}>
            {label}
        </span>
    </div>
);

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'rgba(229,214,167,0.65)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 18 }}>
        {children}
    </p>
);

export const YearForwardModal: React.FC<YearForwardModalProps> = ({ isOpen, data, onClose, onShare }) => {
    const [letter, setLetter] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !data) return;
        setLetter(null);
        setLoading(true);
        haptics.success();
        generateYearForwardLetter(data)
            .then(text => setLetter(text))
            .finally(() => setLoading(false));
    }, [isOpen, data]);

    if (!data) return null;

    const firstName = data.firstName;
    const hasThemes = data.topThemes.length >= 2;
    const hasWords = !!(data.standoutGratitude || data.standoutDelight || data.standoutAccomplishment);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[350] overflow-y-auto overscroll-contain"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 18%, rgba(30,55,35,1) 0%, rgba(6,14,10,1) 100%)',
                        scrollSnapType: 'y mandatory',
                        WebkitOverflowScrolling: 'touch',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Your Year, Forward"
                >
                    {/* Grain + bloom */}
                    <div
                        className="fixed inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,106,58,0.14) 0%, transparent 70%)' }}
                    />

                    {/* Close: fixed so it's always reachable */}
                    <button
                        onClick={() => { haptics.light(); onClose(); }}
                        aria-label="Close"
                        className="fixed z-10 flex items-center justify-center w-9 h-9 rounded-full"
                        style={{
                            top: 'calc(env(safe-area-inset-top) + 14px)', right: 18,
                            background: 'rgba(250,247,243,0.08)', border: '1px solid rgba(250,247,243,0.14)',
                        }}
                    >
                        <X size={17} color={INK} />
                    </button>

                    {/* ── Cover ── */}
                    <Movement className="text-center items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                        >
                            <Eyebrow>Your Year, Forward</Eyebrow>
                            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: ACCENT, fontSize: '72px', lineHeight: 1, letterSpacing: '-0.03em' }}>
                                {data.year}
                            </p>
                            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: INK, fontSize: '26px', marginTop: 18, lineHeight: 1.25, letterSpacing: '-0.02em', whiteSpace: 'pre-line' }}>
                                {firstName}, here is your year,{'\n'}told back to you.
                            </h1>
                            <div className="flex flex-col items-center gap-1.5 mt-12 opacity-60">
                                <span style={{ fontFamily: 'Inter, sans-serif', color: INK_SOFT, fontSize: '12px', letterSpacing: '0.05em' }}>Scroll</span>
                                <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                                    <ArrowDown size={16} color={GOLD} />
                                </motion.div>
                            </div>
                        </motion.div>
                    </Movement>

                    {/* ── The Numbers ── */}
                    <Movement>
                        <Eyebrow>The Year in Numbers</Eyebrow>
                        <div className="grid grid-cols-2 gap-3">
                            <Stat value={data.daysPracticed} label={data.daysPracticed === 1 ? 'day you showed up' : 'days you showed up'} />
                            <Stat value={data.longestStreak} label="longest run, in days" />
                            <Stat value={data.morningsCount} label="mornings opened" />
                            <Stat value={data.eveningsCount} label="evenings closed" />
                            <Stat value={data.gratitudesWritten} label="gratitudes named" />
                            <Stat value={data.wordsWritten.toLocaleString()} label="words written" />
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', color: INK_SOFT, fontSize: '13.5px', lineHeight: 1.6, marginTop: 22 }}>
                            Every one of those was a quiet choice nobody else saw you make.
                        </p>
                    </Movement>

                    {/* ── Your Themes ── */}
                    {hasThemes && (
                        <Movement>
                            <Eyebrow>The Words You Returned To</Eyebrow>
                            <div className="flex flex-wrap gap-2.5">
                                {data.topThemes.map((theme, i) => (
                                    <motion.span
                                        key={theme}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.08 }}
                                        className="px-5 py-3 rounded-full"
                                        style={{
                                            fontFamily: 'Poppins, sans-serif', fontWeight: 600,
                                            fontSize: `${Math.max(15, 26 - i * 2)}px`,
                                            color: i === 0 ? '#1F3824' : GOLD,
                                            background: i === 0 ? GOLD : 'rgba(229,214,167,0.08)',
                                            border: '1px solid rgba(229,214,167,0.2)',
                                        }}
                                    >
                                        {theme}
                                    </motion.span>
                                ))}
                            </div>
                            <p style={{ fontFamily: 'Inter, sans-serif', color: INK_SOFT, fontSize: '13.5px', lineHeight: 1.6, marginTop: 24 }}>
                                These rose to the top of what you were grateful for, over and over.
                            </p>
                        </Movement>
                    )}

                    {/* ── Your Words ── */}
                    {hasWords && (
                        <Movement>
                            <Eyebrow>Moments You Named</Eyebrow>
                            <div className="space-y-5">
                                {data.standoutGratitude && (
                                    <Quote kicker="Grateful for" text={data.standoutGratitude} />
                                )}
                                {data.standoutAccomplishment && (
                                    <Quote kicker="You accomplished" text={data.standoutAccomplishment} />
                                )}
                                {data.standoutDelight && (
                                    <Quote kicker="A delight" text={data.standoutDelight} />
                                )}
                            </div>
                        </Movement>
                    )}

                    {/* ── The Letter ── */}
                    <Movement>
                        <Eyebrow>A Letter, For The Year Ahead</Eyebrow>
                        {loading && !letter ? (
                            <div role="status" className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 size={30} className="animate-spin" color={GOLD} />
                                <p style={{ fontFamily: 'Inter, sans-serif', color: INK_SOFT, fontSize: '13px' }}>
                                    Reading your year back…
                                </p>
                            </div>
                        ) : (
                            <>
                                <p style={{ fontFamily: '"Poppins", Georgia, serif', fontWeight: 400, color: INK, fontSize: '17px', lineHeight: 1.75, whiteSpace: 'pre-line', letterSpacing: '0.005em' }}>
                                    {letter}
                                </p>
                                <div className="flex flex-col gap-3 mt-9">
                                    {onShare && letter && (
                                        <button
                                            onClick={() => { haptics.medium(); onShare(letter); }}
                                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
                                            style={{ background: ACCENT }}
                                        >
                                            <Share2 size={17} color="#FAF7F3" />
                                            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#FAF7F3', fontSize: '15px' }}>
                                                Share your year
                                            </span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { haptics.light(); onClose(); }}
                                        className="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
                                        style={{ background: 'transparent', border: '1.5px solid rgba(250,247,243,0.14)' }}
                                    >
                                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, color: INK_SOFT, fontSize: '15px' }}>
                                            Close
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </Movement>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Quote: React.FC<{ kicker: string; text: string }> = ({ kicker, text }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-start gap-3.5"
    >
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: 'rgba(201,106,58,0.65)' }} />
        <div className="min-w-0">
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'rgba(229,214,167,0.5)', fontSize: '10.5px', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>
                {kicker}
            </p>
            <p style={{ fontFamily: '"Poppins", Georgia, serif', fontStyle: '', fontWeight: 400, color: INK, fontSize: '19px', lineHeight: 1.4 }}>
                “{text}”
            </p>
        </div>
    </motion.div>
);
