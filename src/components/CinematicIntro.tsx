import React, { useState, memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import type { ContentType, QuoteSource, PrimaryIntent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgeRangeGate } from '../hooks/useAgeRangeGate';
import { ENTRANCE_EASE } from '../constants/motion';

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

const ORIENTING_OPTIONS: { id: PrimaryIntent; label: string; sub: string }[] = [
    { id: 'consistency', label: 'Build consistency', sub: 'Show up every day, no matter what' },
    { id: 'clarity',     label: 'Find clarity & focus', sub: 'Cut through the noise' },
    { id: 'stress',      label: 'Manage stress', sub: 'Stay grounded when life gets heavy' },
    { id: 'purpose',     label: 'Connect to purpose', sub: 'Make my days mean something' },
];

// Steps: 0 splash · 1 age · 2 name · 3 orienting question
export const CinematicIntro = memo(({ onComplete }: CinematicIntroProps) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [orientingChoice, setOrientingChoice] = useState<PrimaryIntent | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [nameError, setNameError] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [ageError, setAgeError] = useState('');
    // Apple's Declared Age Range API (iOS 26+): an OS-verified/guardian-declared signal,
    // checked alongside the self-reported birth year below. It only ever makes this gate
    // MORE strict — a confirmed-under-13 signal blocks hard, since a self-report picker
    // alone can be beaten by just choosing an older year. Every other outcome (13+,
    // declined, or unavailable) leaves the picker as-is. Shared with AgeVerificationModal
    // via useAgeRangeGate so the gating behavior (including the recheck haptic) can't
    // drift between the two independently-styled screens again. The check is gated to
    // fire only once the user reaches step 1 (the age picker), not at mount/splash — on
    // iOS 26+ this can trigger Apple's system consent sheet, which shouldn't appear
    // before any onboarding context has been shown.
    const { osConfirmedUnder13, isChecking: isCheckingAge, isRechecking: isRecheckingAge, recheck: handleRecheckAge } = useAgeRangeGate({ active: step >= 1 });

    const currentYear = new Date().getFullYear();
    const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);

    const handleAgeNext = () => {
        // Defense in depth: the OS check hasn't resolved yet, or has already confirmed
        // under-13. The Continue button is disabled while `isCheckingAge` (and hidden
        // entirely once `osConfirmedUnder13`), but this guards against any click that
        // races ahead of that render — a self-reported year must never be able to sneak
        // past a pending or positive OS-confirmed-under-13 signal.
        if (isCheckingAge || osConfirmedUnder13) {
            return;
        }
        if (!birthYear) {
            setAgeError('Please choose your birth year.');
            return;
        }
        if (currentYear - parseInt(birthYear) < 13) {
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
            const dateOfBirth = birthYear ? `${birthYear}-01-01` : undefined;
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
            {/* ── Background, matches app seed-of-life system exactly ── */}

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
            {/* Seed of Life: sacred geometry */}
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
                            transition={{ duration: 0.9, ease: ENTRANCE_EASE }}
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

                        {/* Pronunciation */}
                        <motion.p
                            className="text-center font-body mb-2"
                            style={{
                                color: 'rgba(229,214,167,0.45)',
                                fontSize: '0.75rem',
                                letterSpacing: '0.18em',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.42 }}
                        >
                            pah · LAN · tay
                        </motion.p>

                        {/* Positioning line */}
                        <motion.p
                            className="text-center mb-14 px-6"
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
                            Move forward with intention.
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
                        transition={{ duration: 0.25, ease: ENTRANCE_EASE }}
                    >
                        <div className="w-full max-w-sm">
                            <div className="flex justify-center mb-10">
                                <Logo className="w-10 h-10" color="rgba(229,214,167,0.55)" />
                            </div>

                            <motion.h2
                                className="text-4xl font-display font-bold text-white text-center mb-3 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.04 }}
                            >
                                One quick thing
                            </motion.h2>
                            {osConfirmedUnder13 ? (
                                <>
                                    <motion.p
                                        className="text-center text-base mb-2"
                                        style={{ color: 'rgba(229,214,167,0.85)' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.09 }}
                                    >
                                        Palante isn't available for this account yet.
                                    </motion.p>
                                    <p className="text-center text-sm px-4 mb-8" style={{ color: 'rgba(229,214,167,0.5)' }}>
                                        Your device reports this account is under 13. Palante is built for ages 13 and up.
                                        If this was set up on a shared device or a family member's age range
                                        recently changed, you can check again.
                                    </p>

                                    <motion.button
                                        onClick={handleRecheckAge}
                                        disabled={isRecheckingAge}
                                        className="w-full py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
                                        style={{
                                            background: '#E5D6A7',
                                            color: '#2D3E33',
                                            boxShadow: '0 8px 28px rgba(229,214,167,0.40)',
                                        }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {isRecheckingAge ? 'Checking…' : 'Check Again'}
                                    </motion.button>

                                    <motion.button
                                        onClick={() => setStep(0)}
                                        className="w-full mt-4 py-2 text-sm font-medium"
                                        style={{ color: 'rgba(229,214,167,0.32)' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.24 }}
                                    >
                                        ← Back
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    <motion.p
                                        className="text-center text-base mb-10"
                                        style={{ color: 'rgba(229,214,167,0.55)' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.09 }}
                                    >
                                        Just your birth year. That's all we keep.
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.11 }}
                                    >
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
                                        disabled={isCheckingAge}
                                        className="w-full mt-6 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
                                        style={{
                                            background: '#E5D6A7',
                                            color: '#2D3E33',
                                            boxShadow: '0 8px 28px rgba(229,214,167,0.40)',
                                        }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {isCheckingAge ? 'Checking…' : 'Continue →'}
                                    </motion.button>

                                    <motion.button
                                        onClick={() => setStep(0)}
                                        className="w-full mt-4 py-2 text-sm font-medium"
                                        style={{ color: 'rgba(229,214,167,0.32)' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.24 }}
                                    >
                                        ← Back
                                    </motion.button>

                                    <p className="text-center text-xs mt-6 px-4" style={{ color: 'rgba(229,214,167,0.30)' }}>
                                        We only use this to keep Palante age-appropriate.
                                    </p>
                                </>
                            )}
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
                        transition={{ duration: 0.25, ease: ENTRANCE_EASE }}
                    >
                        <div className="w-full max-w-sm">
                            <div className="flex justify-center mb-10">
                                <Logo className="w-10 h-10" color="rgba(229,214,167,0.55)" />
                            </div>

                            <motion.h2
                                className="text-5xl font-display font-bold text-white text-center mb-3 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.04 }}
                            >
                                What is your name?
                            </motion.h2>
                            <motion.p
                                className="text-center text-base mb-10"
                                style={{ color: 'rgba(229,214,167,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.09 }}
                            >
                                Just your first name is perfect.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.11 }}
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
                                transition={{ delay: 0.15 }}
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
                                transition={{ delay: 0.24 }}
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
                        transition={{ duration: 0.25, ease: ENTRANCE_EASE }}
                    >
                        <div className="w-full max-w-sm">
                            <div className="flex justify-center mb-10">
                                <Logo className="w-10 h-10" color="rgba(229,214,167,0.55)" />
                            </div>

                            <motion.h2
                                className="text-4xl font-display font-bold text-white text-center mb-2 tracking-tight"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.04 }}
                            >
                                What's bringing you here?
                            </motion.h2>
                            <motion.p
                                className="text-center text-sm mb-8"
                                style={{ color: 'rgba(229,214,167,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.09 }}
                            >
                                Your answer shapes how Palante shows up for you.
                            </motion.p>

                            <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.11 }}
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
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="w-full mt-6 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98]"
                                style={{
                                    background: orientingChoice ? '#E5D6A7' : 'rgba(229,214,167,0.25)',
                                    color: orientingChoice ? '#2D3E33' : 'rgba(229,214,167,0.55)',
                                    boxShadow: orientingChoice ? '0 8px 28px rgba(229,214,167,0.40)' : 'none',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.19 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? 'Setting up your practice…' : orientingChoice ? 'Start my practice →' : 'Skip for now →'}
                            </motion.button>

                            <motion.button
                                onClick={() => setStep(2)}
                                className="w-full mt-3 py-2 text-sm font-medium"
                                style={{ color: 'rgba(229,214,167,0.25)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.28 }}
                            >
                                ← Back
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress dots: 4 steps: 0 splash · 1 age · 2 name · 3 intent */}
            <div className="absolute bottom-10 inset-x-0 flex justify-center gap-2 pointer-events-none">
                {[0, 1, 2, 3].map(i => (
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
