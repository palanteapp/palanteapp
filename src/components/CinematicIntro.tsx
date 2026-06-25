import React, { useState, memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import { calculateAge } from '../types';
import type { ContentType, QuoteSource, PrimaryIntent } from '../types';
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
        dateOfBirth?: string;
        primaryIntent?: PrimaryIntent;
        bio?: string;
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

const ORIENTING_OPTIONS: { id: PrimaryIntent; label: string; sub: string }[] = [
    { id: 'consistency', label: 'Build consistency', sub: 'Show up every day, no matter what' },
    { id: 'clarity',     label: 'Find clarity & focus', sub: 'Cut through the noise' },
    { id: 'stress',      label: 'Manage stress', sub: 'Stay grounded when life gets heavy' },
    { id: 'purpose',     label: 'Connect to purpose', sub: 'Make my days mean something' },
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// Steps: 0 splash · 1 age · 2 name · 3 orienting question · 4 bio
export const CinematicIntro = memo(({ onComplete }: CinematicIntroProps) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [orientingChoice, setOrientingChoice] = useState<PrimaryIntent | ''>('');
    const [bio, setBio] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [nameError, setNameError] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [ageError, setAgeError] = useState('');

    const currentYear = new Date().getFullYear();
    const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);

    const handleAgeNext = () => {
        if (!birthMonth || !birthYear) {
            setAgeError('Please choose your birth month and year.');
            return;
        }
        const dateOfBirth = `${birthYear}-${birthMonth.padStart(2, '0')}-01`;
        if (calculateAge(dateOfBirth) < 13) {
            setAgeError("You need to be at least 13 to use Palante.");
            return;
        }
        setAgeError('');
        setStep(2);
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            localStorage.setItem('disclaimerAccepted', JSON.stringify({
                accepted: true,
                timestamp: new Date().toISOString(),
                version: LEGAL_DISCLAIMER.lastUpdated,
            }));
            const selected = ORIENTING_OPTIONS.find(o => o.id === orientingChoice);
            const dateOfBirth = birthMonth && birthYear
                ? `${birthYear}-${birthMonth.padStart(2, '0')}-01`
                : undefined;
            await onComplete({
                name: name.trim(),
                profession: 'Other',
                focusGoal: selected?.label ?? '',   // human label, not the raw id
                interests: '',
                quoteIntensity: 2,
                contentType: 'mix',
                sourcePreference: 'mix',
                ageRange: undefined,
                dateOfBirth,
                primaryIntent: selected?.id,
                bio: bio.trim() || undefined,
            });
        } catch (err) {
            console.error('[Palante] CinematicIntro completion error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNameNext = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setNameError('Tell us your name so we can make this yours.');
            return;
        }
        setNameError('');
        setStep(3);
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-hidden bg-[#415D43]"
        >
            {/* ── Background — matches app seed-of-life system exactly ── */}

            {/* Central luminosity bloom */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(105,145,90,0.45) 0%, transparent 62%)',
                }}
            />
            {/* Edge vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 38%, rgba(18,32,16,0.55) 100%)',
                }}
            />
            {/* Bottom terracotta warmth */}
            <div
                className="absolute bottom-0 inset-x-0 pointer-events-none"
                style={{
                    height: '40%',
                    background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.16) 0%, transparent 70%)',
                }}
            />
            {/* Seed of Life — sacred geometry */}
            <svg
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 390 844"
                preserveAspectRatio="xMidYMid slice"
            >
                <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.14">
                    <circle cx="195" cy="413" r="148" strokeWidth="0.9" />
                    <circle cx="343" cy="413" r="148" />
                    <circle cx="269" cy="541" r="148" />
                    <circle cx="121" cy="541" r="148" />
                    <circle cx="47"  cy="413" r="148" />
                    <circle cx="121" cy="285" r="148" />
                    <circle cx="269" cy="285" r="148" />
                </g>
            </svg>

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
                            className="text-7xl font-display font-bold text-white tracking-tight mb-4"
                            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.28 }}
                        >
                            Palante
                        </motion.h1>

                        {/* Positioning line */}
                        <motion.p
                            className="font-serif italic text-center mb-14 px-6"
                            style={{
                                color: 'rgba(229,214,167,0.62)',
                                fontSize: '1rem',
                                lineHeight: '1.55',
                                maxWidth: '22rem',
                            }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.52 }}
                        >
                            Your personal growth partner.
                        </motion.p>

                        {/* CTA */}
                        <motion.button
                            onClick={() => setStep(1)}
                            className="px-12 py-4 rounded-full font-bold text-base tracking-wide transition-all hover:brightness-110"
                            style={{
                                background: '#E5D6A7',
                                color: '#2D3E33',
                                boxShadow: '0 10px 36px rgba(229,214,167,0.40)',
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
                            className="mt-6 text-xs uppercase tracking-widest font-medium"
                            style={{ color: 'rgba(229,214,167,0.32)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                        >
                            Terms &amp; Wellness Disclaimer
                        </motion.button>
                    </motion.div>
                )}

                {/* ── STEP 1 · AGE ── */}
                {step === 1 && (
                    <motion.div
                        key="age"
                        className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-y-auto"
                        style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
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
                                className="text-4xl font-display font-bold text-white text-center mb-3 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                            >
                                Before we begin
                            </motion.h2>
                            <motion.p
                                className="text-center text-base mb-10"
                                style={{ color: 'rgba(229,214,167,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.18 }}
                            >
                                Just your birth month and year — that's all we keep.
                            </motion.p>

                            <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.22 }}
                            >
                                <select
                                    value={birthMonth}
                                    onChange={e => { setBirthMonth(e.target.value); setAgeError(''); }}
                                    className="w-full px-5 py-4 rounded-2xl text-lg font-display outline-none appearance-none"
                                    style={{
                                        background: '#FDFBF7',
                                        color: birthMonth ? '#2D3E33' : 'rgba(45,62,51,0.5)',
                                        border: ageError ? '1.5px solid #C96A3A' : '1.5px solid rgba(255,255,255,0.9)',
                                    }}
                                >
                                    <option value="">Birth month</option>
                                    {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                                </select>
                                <select
                                    value={birthYear}
                                    onChange={e => { setBirthYear(e.target.value); setAgeError(''); }}
                                    className="w-full px-5 py-4 rounded-2xl text-lg font-display outline-none appearance-none"
                                    style={{
                                        background: '#FDFBF7',
                                        color: birthYear ? '#2D3E33' : 'rgba(45,62,51,0.5)',
                                        border: ageError ? '1.5px solid #C96A3A' : '1.5px solid rgba(255,255,255,0.9)',
                                    }}
                                >
                                    <option value="">Birth year</option>
                                    {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                            </motion.div>

                            {ageError && (
                                <p className="text-sm text-center mt-3" style={{ color: '#C96A3A' }}>{ageError}</p>
                            )}

                            <motion.button
                                onClick={handleAgeNext}
                                className="w-full mt-6 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98]"
                                style={{
                                    background: '#E5D6A7',
                                    color: '#2D3E33',
                                    boxShadow: '0 8px 28px rgba(229,214,167,0.40)',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.30 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Continue →
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

                            <p className="text-center text-xs mt-6 px-4" style={{ color: 'rgba(229,214,167,0.30)' }}>
                                Stored securely. Never shared with third parties.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 2 · NAME ── */}
                {step === 2 && (
                    <motion.div
                        key="name"
                        className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-y-auto"
                        style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
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
                                className="text-5xl font-display font-bold text-white text-center mb-3 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                            >
                                What is your name?
                            </motion.h2>
                            <motion.p
                                className="text-center text-base mb-10"
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
                                    onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                                    placeholder="Your name"
                                    className="w-full px-5 py-4 rounded-2xl text-xl text-center font-display outline-none transition-all mb-2"
                                    style={{
                                        background: '#FDFBF7',
                                        color: '#2D3E33',
                                        border: nameError ? '1.5px solid #C96A3A' : '1.5px solid rgba(255,255,255,0.9)',
                                        caretColor: '#C96A3A',
                                    }}
                                />
                                {nameError && (
                                    <p className="text-sm text-center mb-4" style={{ color: '#C96A3A' }}>{nameError}</p>
                                )}
                            </motion.div>

                            <motion.button
                                onClick={handleNameNext}
                                className="w-full mt-4 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98]"
                                style={{
                                    background: '#E5D6A7',
                                    color: '#2D3E33',
                                    boxShadow: '0 8px 28px rgba(229,214,167,0.40)',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.30 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Continue →
                            </motion.button>

                            <motion.button
                                onClick={() => setStep(1)}
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
                {/* ── STEP 3 · ORIENTING QUESTION ── */}
                {step === 3 && (
                    <motion.div
                        key="orient"
                        className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-y-auto"
                        style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
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
                                className="text-4xl font-display font-bold text-white text-center mb-2 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                            >
                                What's bringing you here?
                            </motion.h2>
                            <motion.p
                                className="text-center text-sm mb-8"
                                style={{ color: 'rgba(229,214,167,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.18 }}
                            >
                                Your answer shapes how Palante shows up for you.
                            </motion.p>

                            <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.22 }}
                            >
                                {ORIENTING_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setOrientingChoice(opt.id)}
                                        className="w-full text-left px-5 py-4 rounded-2xl transition-all"
                                        style={{
                                            background: orientingChoice === opt.id ? 'rgba(229,214,167,0.22)' : 'rgba(255,255,255,0.12)',
                                            border: orientingChoice === opt.id ? '1.5px solid rgba(229,214,167,0.75)' : '1.5px solid rgba(255,255,255,0.18)',
                                        }}
                                    >
                                        <p className="text-white font-semibold text-sm leading-tight">{opt.label}</p>
                                        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.70)' }}>{opt.sub}</p>
                                    </button>
                                ))}
                            </motion.div>

                            <motion.button
                                onClick={() => setStep(4)}
                                className="w-full mt-6 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98]"
                                style={{
                                    background: orientingChoice ? '#E5D6A7' : 'rgba(229,214,167,0.25)',
                                    color: orientingChoice ? '#2D3E33' : 'rgba(229,214,167,0.40)',
                                    boxShadow: orientingChoice ? '0 8px 28px rgba(229,214,167,0.40)' : 'none',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.38 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Continue →
                            </motion.button>

                            {!orientingChoice && (
                                <motion.button
                                    onClick={() => setStep(4)}
                                    className="w-full mt-3 py-2 text-sm font-medium"
                                    style={{ color: 'rgba(229,214,167,0.25)' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.55 }}
                                >
                                    Skip
                                </motion.button>
                            )}

                            <motion.button
                                onClick={() => setStep(2)}
                                className="w-full mt-2 py-2 text-sm font-medium"
                                style={{ color: 'rgba(229,214,167,0.25)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.60 }}
                            >
                                ← Back
                            </motion.button>
                        </div>
                    </motion.div>
                )}
                {/* ── STEP 4 · BIO ── */}
                {step === 4 && (
                    <motion.div
                        key="bio"
                        className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-y-auto"
                        style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
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
                                className="text-4xl font-display font-bold text-white text-center mb-3 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                            >
                                What's going on for you right now?
                            </motion.h2>
                            <motion.p
                                className="text-center text-sm mb-8"
                                style={{ color: 'rgba(229,214,167,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.18 }}
                            >
                                Your partner will hold onto this. Share as much or as little as you want.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.22 }}
                            >
                                <textarea
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="A few sentences is plenty. What's on your mind, what you're working through, where you want to go…"
                                    rows={5}
                                    maxLength={500}
                                    className="w-full px-5 py-4 rounded-2xl text-base font-body outline-none transition-all resize-none"
                                    style={{
                                        background: '#FDFBF7',
                                        color: '#2D3E33',
                                        border: '1.5px solid rgba(255,255,255,0.9)',
                                        caretColor: '#C96A3A',
                                        lineHeight: '1.6',
                                    }}
                                />
                                <p className="text-right text-xs mt-1" style={{ color: 'rgba(229,214,167,0.30)' }}>
                                    {bio.length}/500
                                </p>
                            </motion.div>

                            <motion.button
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="w-full mt-4 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98]"
                                style={{
                                    background: '#E5D6A7',
                                    color: '#2D3E33',
                                    boxShadow: '0 8px 28px rgba(229,214,167,0.40)',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.30 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? 'Setting up your practice…' : "Let's begin →"}
                            </motion.button>

                            {!bio.trim() && (
                                <motion.button
                                    onClick={handleComplete}
                                    disabled={isSubmitting}
                                    className="w-full mt-3 py-2 text-sm font-medium"
                                    style={{ color: 'rgba(229,214,167,0.28)' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.48 }}
                                >
                                    Skip for now
                                </motion.button>
                            )}

                            <motion.button
                                onClick={() => setStep(3)}
                                className="w-full mt-2 py-2 text-sm font-medium"
                                style={{ color: 'rgba(229,214,167,0.25)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.55 }}
                            >
                                ← Back
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress dots — 5 steps: 0 splash · 1 age · 2 name · 3 intent · 4 bio */}
            <div className="absolute bottom-10 inset-x-0 flex justify-center gap-2 pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
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
