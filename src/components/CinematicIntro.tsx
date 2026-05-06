import React, { useState, memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import type { ContentType, QuoteSource } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicIntroProps {
    onComplete: (userData: {
        name: string;
        profession: string;
        focusGoal: string;
        interests: string;
        quoteIntensity: number;
        contentType: ContentType;
        sourcePreference: QuoteSource;
        ageRange?: string;
    }) => void;
    onOpenSettings?: () => void;
}

// Slow breathing animation for the center rings
const breathe = {
    animate: {
        scale: [1, 1.06, 1],
        opacity: [0.8, 1, 0.8],
    },
    transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut' as const,
    },
};

export const CinematicIntro = memo(({ onComplete }: CinematicIntroProps) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [nameError, setNameError] = useState('');

    const handleComplete = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setNameError('Tell us your name so we can make this yours.');
            return;
        }
        setNameError('');
        setIsSubmitting(true);
        try {
            localStorage.setItem('disclaimerAccepted', JSON.stringify({
                accepted: true,
                timestamp: new Date().toISOString(),
                version: LEGAL_DISCLAIMER.lastUpdated,
            }));
            await onComplete({
                name: trimmed,
                profession: 'Other',
                focusGoal: '',
                interests: '',
                quoteIntensity: 2,
                contentType: 'mix',
                sourcePreference: 'mix',
                ageRange: undefined,
            });
        } catch (err) {
            console.error('CinematicIntro error:', err);
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-hidden"
            style={{ background: '#415D43' }}
        >
            {/* ── Background depth layers ── */}

            {/* Central luminosity bloom — forest light from above */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 75% 60% at 50% 32%, rgba(105,145,90,0.55) 0%, transparent 65%)',
                }}
            />
            {/* Edge vignette — depth at the sides */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 42%, rgba(18,32,16,0.62) 100%)',
                }}
            />
            {/* Bottom terracotta warmth */}
            <div
                className="absolute bottom-0 inset-x-0 pointer-events-none"
                style={{
                    height: '45%',
                    background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.20) 0%, transparent 70%)',
                }}
            />

            {/* ── Bold structural ring arcs (full-screen SVG) ── */}
            <svg
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 390 844"
                preserveAspectRatio="xMidYMid slice"
            >
                {/* Upper-right thick arc — deep forest green */}
                <circle cx="480" cy="-30" r="310" fill="none" stroke="#2A4A2A" strokeWidth="72" opacity="0.55" />
                {/* Upper-right thin gold accent ring */}
                <circle cx="480" cy="-30" r="228" fill="none" stroke="#E5D6A7" strokeWidth="1.5" opacity="0.28" strokeDasharray="6 10" />

                {/* Upper-left thick arc — mirrors upper-right, keeps bottom clean */}
                <circle cx="-90" cy="-30" r="320" fill="none" stroke="#1E3820" strokeWidth="68" opacity="0.50" />
                {/* Upper-left thin terracotta accent ring */}
                <circle cx="-90" cy="-30" r="238" fill="none" stroke="#C96A3A" strokeWidth="1.5" opacity="0.22" strokeDasharray="5 9" />

                {/* Wide centered background ring — very subtle, ties both sides */}
                <circle cx="195" cy="422" r="340" fill="none" stroke="#E5D6A7" strokeWidth="0.8" opacity="0.08" />
                <circle cx="195" cy="422" r="270" fill="none" stroke="#E5D6A7" strokeWidth="0.6" opacity="0.06" strokeDasharray="4 8" />
            </svg>

            {/* ── Animated breathing rings — centered on logo ── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '12%' }}>
                <motion.div
                    className="relative"
                    animate={breathe.animate}
                    transition={breathe.transition}
                >
                    <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
                        <circle cx="170" cy="170" r="155" stroke="#E5D6A7" strokeWidth="1.8" opacity="0.18" />
                        <circle cx="170" cy="170" r="118" stroke="#E5D6A7" strokeWidth="1.4" opacity="0.14" strokeDasharray="5 8" />
                        <circle cx="170" cy="170" r="82"  stroke="#E5D6A7" strokeWidth="1.8" opacity="0.20" />
                        <circle cx="170" cy="170" r="50"  stroke="#E5D6A7" strokeWidth="1.2" opacity="0.12" strokeDasharray="3 6" />
                    </svg>
                </motion.div>
            </div>

            {/* ── STEP 0 · SPLASH ── */}
            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="splash"
                        className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -24 }}
                        transition={{ duration: 0.55 }}
                    >
                        {/* Logo with warm halo */}
                        <motion.div
                            className="mb-7 relative"
                            initial={{ opacity: 0, scale: 0.82 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <motion.div
                                className="absolute inset-0 m-auto rounded-full"
                                style={{
                                    width: 160, height: 160,
                                    background: 'radial-gradient(circle, rgba(229,214,167,0.30) 0%, transparent 70%)',
                                    filter: 'blur(20px)',
                                    top: '50%', left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <Logo className="w-20 h-20 relative z-10 drop-shadow-lg" color="#E5D6A7" />
                        </motion.div>

                        {/* Wordmark */}
                        <motion.h1
                            className="text-5xl font-display font-bold text-white tracking-tight mb-5"
                            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.28 }}
                        >
                            Palante
                        </motion.h1>

                        {/* Three-line descriptor */}
                        <motion.div className="flex flex-col items-center gap-2 mb-14">
                            {[
                                'Start every morning with intention.',
                                'End every evening with clarity.',
                                'A coach who holds you accountable.',
                            ].map((line, i) => (
                                <motion.p
                                    key={i}
                                    className="text-lg font-display font-medium tracking-wide"
                                    style={{ color: 'rgba(229,214,167,0.92)' }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.48 + i * 0.13 }}
                                >
                                    {line}
                                </motion.p>
                            ))}
                        </motion.div>

                        {/* CTA */}
                        <motion.button
                            onClick={() => setStep(1)}
                            className="px-12 py-4 rounded-full font-bold text-white text-base tracking-wide transition-all hover:brightness-110"
                            style={{
                                background: '#C96A3A',
                                boxShadow: '0 10px 36px rgba(201,106,58,0.55)',
                            }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.88 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Begin
                        </motion.button>

                        {/* Terms */}
                        <motion.button
                            onClick={() => setShowDisclaimer(true)}
                            className="mt-6 text-[10px] uppercase tracking-widest font-medium"
                            style={{ color: 'rgba(229,214,167,0.32)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                        >
                            Terms &amp; Wellness Disclaimer
                        </motion.button>
                    </motion.div>
                )}

                {/* ── STEP 1 · NAME ── */}
                {step === 1 && (
                    <motion.div
                        key="name"
                        className="absolute inset-0 flex flex-col items-center justify-center px-8"
                        initial={{ opacity: 0, x: 44 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -44 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <div className="w-full max-w-sm">
                            <div className="flex justify-center mb-10">
                                <Logo className="w-10 h-10" color="rgba(229,214,167,0.55)" />
                            </div>

                            <motion.h2
                                className="text-3xl font-display font-bold text-white text-center mb-2 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                            >
                                What is your name?
                            </motion.h2>
                            <motion.p
                                className="text-center text-sm mb-10"
                                style={{ color: 'rgba(229,214,167,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.18 }}
                            >
                                Just your first name is perfect.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.22 }}
                            >
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => { setName(e.target.value); setNameError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleComplete()}
                                    placeholder="Your name"
                                    autoFocus
                                    className="w-full px-5 py-4 rounded-2xl text-white text-xl text-center font-display outline-none transition-all mb-2"
                                    style={{
                                        background: 'rgba(255,255,255,0.16)',
                                        border: nameError ? '1.5px solid #C96A3A' : '1.5px solid rgba(255,255,255,0.35)',
                                        caretColor: '#E5D6A7',
                                    }}
                                />
                                {nameError && (
                                    <p className="text-xs text-center mb-4" style={{ color: '#C96A3A' }}>{nameError}</p>
                                )}
                            </motion.div>

                            <motion.button
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="w-full mt-4 py-4 rounded-2xl font-bold text-white text-base tracking-wide transition-all active:scale-[0.98]"
                                style={{
                                    background: name.trim() ? '#C96A3A' : 'rgba(201,106,58,0.50)',
                                    boxShadow: name.trim() ? '0 8px 28px rgba(201,106,58,0.48)' : 'none',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.30 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? 'Setting up your practice…' : "Let's go →"}
                            </motion.button>

                            <motion.button
                                onClick={() => setStep(0)}
                                className="w-full mt-4 py-2 text-sm font-medium"
                                style={{ color: 'rgba(229,214,167,0.32)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.48 }}
                            >
                                ← Back
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress dots */}
            <div className="absolute bottom-10 inset-x-0 flex justify-center gap-2 pointer-events-none">
                {[0, 1].map(i => (
                    <div
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                            width: i === step ? 28 : 6,
                            background: i === step ? '#E5D6A7' : 'rgba(229,214,167,0.20)',
                        }}
                    />
                ))}
            </div>

            {/* Disclaimer overlay */}
            <AnimatePresence>
                {showDisclaimer && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(20,36,18,0.97)', backdropFilter: 'blur(14px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="w-full max-w-sm rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck size={18} style={{ color: '#E5D6A7' }} />
                                <h3 className="font-bold text-white text-base">Mindful Disclaimer</h3>
                            </div>
                            <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                {LEGAL_DISCLAIMER.sections.map((s, i) => (
                                    <div key={i}>
                                        <strong className="block mb-1" style={{ color: '#E5D6A7' }}>{s.heading}</strong>
                                        {s.content}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowDisclaimer(false)}
                                className="mt-6 w-full py-3 rounded-xl font-bold text-sm"
                                style={{ background: '#E5D6A7', color: '#1A2410' }}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

CinematicIntro.displayName = 'CinematicIntro';
