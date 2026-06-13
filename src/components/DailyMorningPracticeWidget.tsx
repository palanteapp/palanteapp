import { useState, useEffect, useRef } from 'react';
import { Sun, Sparkles, Check, ChevronRight, Sprout, Flame, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DailyMorningPractice, Quote } from '../types';
import type { UserProfile } from '../types';
import { DashboardQuoteCard } from './DashboardQuoteCard';
import { generateMorningPracticeMessage, getMomentumState } from '../utils/aiService';
import { supabase } from '../lib/supabase';
import { logMindfulSession, getHealthContext } from '../utils/healthService';

interface DailyMorningPracticeProps {
    onComplete: (data: DailyMorningPractice) => void;
    onRefresh?: () => void;
    isDarkMode: boolean;
    existingPriming?: DailyMorningPractice | null;
    userName?: string;
    hideEnergyCheckIn?: boolean;
    onFinish: () => void;
    onStepChange?: (step: 'intro' | 'gratitude' | 'affirmation' | 'intention' | 'message' | 'summary') => void;
    user?: UserProfile;
    isFirstEver?: boolean;
}

export const DailyMorningPracticeWidget: React.FC<DailyMorningPracticeProps> = ({ onComplete, onRefresh, isDarkMode: _isDarkMode, existingPriming, userName, hideEnergyCheckIn: _hideEnergyCheckIn, onFinish, onStepChange, user, isFirstEver }) => {
    const [step, setStep] = useState<'intro' | 'gratitude' | 'affirmation' | 'intention' | 'message' | 'summary'>('intro');
    const practiceStartTime = useRef(Date.now());
    const [gratitudes, setGratitudes] = useState<string[]>(['', '', '', '', '']);
    const [affirmations, setAffirmations] = useState<string[]>(['', '', '', '', '']);
    const [intention, setIntention] = useState<string>('');
    const [generatedMessage, setGeneratedMessage] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasRefreshed, setHasRefreshed] = useState(false);

    useEffect(() => {
        if (existingPriming && !hasRefreshed) {
            const loadedGratitudes = (existingPriming.gratitudes && existingPriming.gratitudes.length > 0)
                ? existingPriming.gratitudes
                : ['', '', '', '', ''];

            const loadedAffirmations = (existingPriming.affirmations && existingPriming.affirmations.length > 0)
                ? existingPriming.affirmations
                : ['', '', '', '', ''];

            setGratitudes(loadedGratitudes);
            setAffirmations(loadedAffirmations);
            setIntention(existingPriming.dailyIntention || '');

            if (existingPriming.gratitudes && existingPriming.gratitudes.length > 0) {
                setStep('summary');
            }
        }
    }, [existingPriming, hasRefreshed]);

    useEffect(() => {
        onStepChange?.(step);
        // resize:'body' (capacitor.config) causes iOS to scroll the body upward
        // when the keyboard appears on the intention step. Reset scroll the instant
        // we land on any centered step so the card doesn't appear glued to the top.
        if (step === 'message' || step === 'intro') {
            // resize:'body' causes iOS to scroll the body while the keyboard is up.
            // Double-rAF ensures we reset AFTER the keyboard dismiss animation lands.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                });
            });
        }
    }, [step, onStepChange]);

    const handleInputChange = (
        index: number,
        value: string,
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setter(prev => {
            const newArr = [...prev];
            newArr[index] = value;
            return newArr;
        });
    };

    const handleNext = () => {
        // Fire the API call BEFORE the animation delay so the request is in-flight
        // during the 300ms step transition — shaves ~300ms off perceived wait time.
        if (step === 'intention') {
            setIsGenerating(true);
            import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());

            // Hard 8-second timeout — on cold-start edge functions this prevents
            // the user from waiting indefinitely.
            const fallbackData = {
                gratitudes: gratitudes.filter(g => g.trim().length > 0),
                affirmations: affirmations.filter(a => a.trim().length > 0),
                intention,
                coachTone: user?.coachSettings?.coachTone,
            };
            const fallbackTimer = setTimeout(() => {
                setGeneratedMessage(
                    intention.trim()
                        ? `Today I carry what I named this morning. I move through ${intention.trim()} with everything I brought to this practice.`
                        : "Today I showed up. That's the whole thing. I carry this forward."
                );
                setIsGenerating(false);
            }, 8000);

            getHealthContext().then(healthContext => {
                return generateMorningPracticeMessage(userName || 'Friend', {
                    ...fallbackData,
                    narrative: user?.userNarrative?.text,
                    momentumState: user ? getMomentumState(user) : undefined,
                    userVoiceProfile: user?.userVoiceProfile,
                    healthContext: (healthContext?.sleepHours !== undefined || healthContext?.restingHR !== undefined)
                        ? healthContext
                        : undefined,
                });
            }).then(msg => {
                clearTimeout(fallbackTimer);
                setGeneratedMessage(msg);
                setIsGenerating(false);
            }).catch((err) => {
                console.error('[Palante] Morning message generation failed:', err);
                clearTimeout(fallbackTimer);
                setGeneratedMessage(
                    intention.trim()
                        ? `Today I carry what I named this morning. I move through ${intention.trim()} with everything I brought to this practice.`
                        : "Today I showed up. That's the whole thing. I carry this forward."
                );
                setIsGenerating(false);
            });
        }

        setIsAnimating(true);
        setTimeout(() => {
            if (step === 'intro') setStep('gratitude');
            else if (step === 'gratitude') setStep('affirmation');
            else if (step === 'affirmation') setStep('intention');
            else if (step === 'intention') {
                setStep('message');
            } else if (step === 'message') {
                handleFinish();
                onFinish();
            }
            setIsAnimating(false);
        }, 300);
    };

    const handleBack = () => {
        setIsAnimating(true);
        setTimeout(() => {
            if (step === 'gratitude') setStep('intro');
            else if (step === 'affirmation') setStep('gratitude');
            else if (step === 'intention') setStep('affirmation');
            else if (step === 'message') setStep('intention');
            setIsAnimating(false);
        }, 300);
    };

    const handleFinish = () => {
        const primingData: DailyMorningPractice = {
            id: Date.now().toString(),
            date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
            gratitudes: gratitudes.map(t => t.trim()).filter(Boolean),
            affirmations: affirmations.map(t => t.trim()).filter(Boolean),
            dailyIntention: intention.trim(),
            messageOfTheDay: generatedMessage
        };
        logMindfulSession(practiceStartTime.current, Date.now());
        onComplete(primingData);
    };

    const isStepValid = () => {
        if (step === 'gratitude') return gratitudes.some(g => g.trim().length > 0);
        if (step === 'affirmation') return affirmations.some(a => a.trim().length > 0);
        if (step === 'intention') return intention.trim().length > 0;
        return true;
    };

    // --- RENDER HELPERS ---

    const renderIntro = () => {
        const pts = user?.points || 0;
        const streak = user?.streak || 0;
        const hour = new Date().getHours();
        const timeLabel = hour < 12 ? 'Start your morning.' : hour < 18 ? 'Take a moment.' : 'Close the day right.';

        if (isFirstEver) {
            return (
                <motion.div
                    className="flex flex-col items-center text-center px-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
                        style={{ background: 'rgba(229,214,167,0.12)', border: '1px solid rgba(229,214,167,0.12)' }}
                    >
                        <Sprout size={36} style={{ color: '#E5D6A7' }} />
                    </div>

                    <h3
                        className="text-4xl font-display font-bold text-white mb-4 tracking-tight leading-tight"
                        style={{ textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
                    >
                        Your first practice.
                    </h3>
                    <p className="text-base mb-12" style={{ color: 'rgba(229,214,167,0.90)', maxWidth: '20rem' }}>
                        Gratitude, affirmation, intention, and a personal message written for exactly where you are today.
                    </p>

                    <div className="flex items-start gap-5 mb-14">
                        {[
                            { label: 'Gratitude', n: 1 },
                            { label: 'Affirm', n: 2 },
                            { label: 'Intention', n: 3 },
                            { label: 'Message', n: 4 },
                        ].map(({ label, n }) => (
                            <div key={n} className="flex flex-col items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{ background: 'rgba(229,214,167,0.12)', color: '#E5D6A7', border: '1px solid rgba(229,214,167,0.12)' }}
                                >
                                    {n}
                                </div>
                                <span
                                    className="text-xs font-black uppercase tracking-[0.14em] whitespace-nowrap"
                                    style={{ color: 'rgba(229,214,167,0.90)' }}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <motion.button
                        onClick={handleNext}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-5 rounded-full font-bold text-base tracking-wide"
                        style={{
                            background: '#E5D6A7',
                            color: '#2D3E33',
                            boxShadow: '0 10px 32px rgba(229,214,167,0.30)',
                        }}
                    >
                        Let's begin →
                    </motion.button>
                </motion.div>
            );
        }

        return (
            <motion.div
                className="flex flex-col items-center text-center px-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Icon with glow */}
                <div className="relative mb-6">
                    <div
                        style={{
                            position: 'absolute',
                            width: 100, height: 100,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(229,214,167,0.12) 0%, transparent 70%)',
                            filter: 'blur(16px)',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                        style={{ background: 'rgba(229,214,167,0.12)', border: '1px solid rgba(229,214,167,0.12)' }}
                    >
                        <Sprout size={28} style={{ color: '#E5D6A7' }} />
                    </div>
                </div>

                {(streak > 0 || pts > 0) && (
                    <div className="flex gap-5 mb-5">
                        {streak > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Flame size={13} style={{ color: '#E5D6A7' }} />
                                <span className="text-sm font-semibold text-white/70">{streak}-day streak</span>
                            </div>
                        )}
                        {pts > 0 && (
                            <div className="text-sm font-semibold text-white">{pts.toLocaleString()} pts</div>
                        )}
                    </div>
                )}

                <h3
                    className="text-4xl font-display font-bold text-white mb-2 tracking-tight leading-tight"
                    style={{ textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
                >
                    Let's set the tone.
                </h3>
                <p className="text-sm mb-1.5" style={{ color: 'rgba(229,214,167,0.85)' }}>
                    {timeLabel}
                </p>
                <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Gratitude · Affirmations · Intention
                </p>

                <motion.button
                    onClick={handleNext}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-full font-bold text-base tracking-wide"
                    style={{
                        background: '#E5D6A7',
                        color: '#2D3E33',
                        boxShadow: '0 8px 28px rgba(229,214,167,0.30)',
                    }}
                >
                    Begin Morning Practice
                </motion.button>
            </motion.div>
        );
    };

    const renderInputs = (
        title: string,
        subtitle: string,
        icon: React.ReactNode,
        values: string[],
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        placeholderPrefix: string,
        stepNum: number
    ) => {
        return (
            <div className="w-full animate-fade-in">
                {/* Step counter */}
                <div className="flex items-center justify-end mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(229,214,167,0.90)' }}>
                        {stepNum} / 3
                    </span>
                </div>

                {/* Title block */}
                <div className="mb-10">
                    <h2 className="text-[3.25rem] font-display font-bold text-white tracking-tight leading-[1.0] mb-3">
                        {title}
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
                        {subtitle}
                    </p>
                </div>

                {/* Journal-style inputs */}
                <div className="flex flex-col mb-8">
                    {values.map((val, idx) => (
                        <div
                            key={idx}
                            data-input-row=""
                            className="flex items-center gap-4 py-4 transition-all"
                            style={{ borderBottom: `1px solid ${val.trim() ? 'rgba(229,214,167,0.90)' : 'rgba(255,255,255,0.06)'}` }}
                        >
                            <span
                                className="text-sm font-black w-4 flex-shrink-0 tabular-nums"
                                style={{ color: val.trim() ? 'rgba(229,214,167,0.65)' : 'rgba(229,214,167,0.90)' }}
                            >
                                {idx + 1}
                            </span>
                            <input
                                type="text"
                                value={val}
                                onChange={(e) => handleInputChange(idx, e.target.value, setter)}
                                onFocus={(e) => {
                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    const row = e.currentTarget.parentElement!;
                                    row.style.borderBottomColor = 'rgba(229,214,167,0.65)';
                                }}
                                onBlur={(e) => {
                                    const row = e.currentTarget.parentElement!;
                                    row.style.borderBottomColor = e.currentTarget.value.trim()
                                        ? 'rgba(229,214,167,0.90)'
                                        : 'rgba(255,255,255,0.85)';
                                }}
                                placeholder={`${placeholderPrefix}...`}
                                aria-label={`${title} ${idx + 1} of ${values.length}`}
                                className="flex-1 bg-transparent outline-none text-[17px] text-white placeholder:text-white/20 py-1 font-medium"
                                autoFocus={idx === 0}
                            />
                            {val.trim() && (
                                <Check size={13} style={{ color: 'rgba(229,214,167,0.90)', flexShrink: 0 }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className="flex-1 py-4 rounded-xl font-medium text-base text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className="flex-[2] py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                            background: isStepValid() ? '#E5D6A7' : 'rgba(229,214,167,0.12)',
                            color: isStepValid() ? '#2D3E33' : 'rgba(229,214,167,0.90)',
                            boxShadow: isStepValid() ? '0 6px 20px rgba(229,214,167,0.30)' : 'none',
                            cursor: isStepValid() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Next Step <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    const renderIntention = () => (
        <div className="w-full animate-fade-in">
            {/* Step counter */}
            <div className="flex items-center justify-end mb-10">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(229,214,167,0.90)' }}>
                    3 / 3
                </span>
            </div>

            {/* Title block */}
            <div className="mb-10">
                <h2 className="text-[3.25rem] font-display font-bold text-white tracking-tight leading-[1.0] mb-3">
                    Set intention
                </h2>
                <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
                    One word to guide your energy today. Your North Star.
                </p>
            </div>

            {/* Large single input */}
            <input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="One word…"
                aria-label="Your one-word intention for today"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                className="w-full text-[17px] font-medium bg-transparent border-b-2 outline-none transition-all py-4 text-white placeholder:text-white/20 mb-6"
                style={{ borderColor: intention.trim() ? 'rgba(229,214,167,0.90)' : 'rgba(229,214,167,0.90)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(229,214,167,0.75)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = e.currentTarget.value.trim() ? 'rgba(229,214,167,0.90)' : 'rgba(229,214,167,0.90)'; }}
                autoFocus
            />

            <p className="text-xs uppercase tracking-[0.22em] mb-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Presence · Flow · Strength · Ease · Courage
            </p>

            <div className="flex gap-3">
                <button
                    onClick={handleBack}
                    className="flex-1 py-4 rounded-xl font-medium text-base text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    Back
                </button>
                <motion.button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    whileTap={{ scale: 0.97 }}
                    className="flex-[2] py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                        background: isStepValid() ? '#E5D6A7' : 'rgba(229,214,167,0.12)',
                        color: isStepValid() ? '#2D3E33' : 'rgba(229,214,167,0.90)',
                        boxShadow: isStepValid() ? '0 6px 20px rgba(229,214,167,0.30)' : 'none',
                        cursor: isStepValid() ? 'pointer' : 'not-allowed',
                    }}
                >
                    Next Step →
                </motion.button>
            </div>
        </div>
    );

    const renderMessage = () => {
        const messageQuote: Quote = {
            id: 'morning-message',
            text: generatedMessage || '...',
            author: user?.coachName || 'Palante',
            intensity: 2,
            category: 'morning-practice',
            isAI: true,
        };

        return (
            <div className="w-full flex flex-col animate-fade-in">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6">
                        <Loader2 size={36} className="animate-spin" style={{ color: 'rgba(229,214,167,0.90)' }} />
                        <p className="text-sm uppercase tracking-widest" style={{ color: 'rgba(229,214,167,0.90)' }}>
                            Writing your message...
                        </p>
                    </div>
                ) : (
                    <div className="w-full mb-8">
                        <p className="text-xs font-black uppercase tracking-[0.22em] mb-4 text-center" style={{ color: 'rgba(229,214,167,0.90)' }}>
                            Your message for today
                        </p>
                        <DashboardQuoteCard
                            quote={messageQuote}
                            isDarkMode={true}
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className="flex-1 py-4 rounded-xl font-medium text-base text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        Back
                    </button>
                    <motion.button
                        onClick={handleNext}
                        disabled={isGenerating}
                        whileTap={{ scale: 0.97 }}
                        className="flex-[2] py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                            background: isGenerating ? 'rgba(229,214,167,0.12)' : '#E5D6A7',
                            color: isGenerating ? 'rgba(229,214,167,0.90)' : '#2D3E33',
                            boxShadow: isGenerating ? 'none' : '0 6px 20px rgba(229,214,167,0.30)',
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Begin my day →
                    </motion.button>
                </div>
            </div>
        );
    };

    const renderSummary = () => (
        <div className="w-full py-4 animate-fade-in text-center">
            <div className="mb-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(64,145,108,0.25)', border: '1px solid rgba(64,145,108,0.40)' }}>
                    <Check size={26} style={{ color: '#6FCF97' }} />
                </div>
                <h3 className="text-3xl font-display font-bold text-white">Practice Complete.</h3>
                {intention && (
                    <div
                        className="mt-4 inline-block px-6 py-2 rounded-full"
                        style={{ border: '1px solid rgba(229,214,167,0.12)', background: 'rgba(229,214,167,0.12)' }}
                    >
                        <span className="text-sm uppercase tracking-widest mr-2" style={{ color: 'rgba(229,214,167,0.90)' }}>Today's Intention</span>
                        <span className="font-bold font-display" style={{ color: '#E5D6A7' }}>{intention}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#E5D6A7' }}>Gratitude</h4>
                    <ul className="text-base space-y-2 text-white">
                        {gratitudes.filter(g => g).slice(0, 3).map((g, i) => (
                            <li key={i} className="line-clamp-1 truncate">• {g}</li>
                        ))}
                        {gratitudes.filter(g => g).length > 3 && <li>+ {gratitudes.filter(g => g).length - 3} more</li>}
                    </ul>
                </div>
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#E5D6A7' }}>Affirmations</h4>
                    <ul className="text-base space-y-2 text-white">
                        {affirmations.filter(a => a).slice(0, 3).map((a, i) => (
                            <li key={i} className="line-clamp-1 truncate">• {a}</li>
                        ))}
                        {affirmations.filter(a => a).length > 3 && <li>+ {affirmations.filter(a => a).length - 3} more</li>}
                    </ul>
                </div>
            </div>

            {/* Breathing close */}
            <div className="mb-6 px-5 py-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-black uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(229,214,167,0.90)' }}>
                    Before you go
                </p>
                <p className="text-base leading-relaxed text-white/70">
                    Five slow belly breaths — in through your nose.{' '}
                    <span className="font-semibold text-white/90">Inhale:</span>{' '}
                    <span className="italic">I love you.</span>{' '}
                    <span className="font-semibold text-white/90">Exhale:</span>{' '}
                    <span className="italic">I am enough.</span>
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <motion.button
                    onClick={onFinish}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-xl text-base font-bold tracking-wide transition-all"
                    style={{
                        background: '#E5D6A7',
                        color: '#2D3E33',
                        boxShadow: '0 8px 28px rgba(229,214,167,0.30)',
                    }}
                >
                    Return to Dashboard
                </motion.button>
                <button
                    onClick={() => {
                        setHasRefreshed(true);
                        setGratitudes(['', '', '', '', '']);
                        setAffirmations(['', '', '', '', '']);
                        setGeneratedMessage('');
                        setStep('intro');
                        if (onRefresh) onRefresh();
                    }}
                    className="w-full py-3 rounded-xl text-base font-medium border border-dashed transition-all text-white hover:text-white/60"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    Refresh Practice
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {step === 'intro' && renderIntro()}
                    {step === 'gratitude' && renderInputs(
                        "Gratitude",
                        "List 5 things you're thankful for right now.",
                        <Sun size={22} style={{ color: '#E5D6A7' }} />,
                        gratitudes,
                        setGratitudes,
                        "I am grateful for",
                        1
                    )}
                    {step === 'affirmation' && renderInputs(
                        "Affirmations",
                        "List 5 truths about your highest self.",
                        <Sparkles size={22} style={{ color: '#E5D6A7' }} />,
                        affirmations,
                        setAffirmations,
                        "I am",
                        2
                    )}
                    {step === 'intention' && renderIntention()}
                    {step === 'message' && renderMessage()}
                    {step === 'summary' && renderSummary()}
                </motion.div>
            </AnimatePresence>

            {/* Step indicator dots */}
            {(step === 'gratitude' || step === 'affirmation' || step === 'intention') && (
                <div className="flex justify-center gap-2 mt-8">
                    {(['gratitude', 'affirmation', 'intention'] as const).map(s => (
                        <div
                            key={s}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                                width: step === s ? 24 : 6,
                                background: step === s ? '#E5D6A7' : 'rgba(229,214,167,0.12)',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
