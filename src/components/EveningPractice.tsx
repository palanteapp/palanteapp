import { useState, useEffect, Suspense, lazy } from 'react';
import { Moon, ChevronRight, Heart, BookOpen, Award, Smile, Target } from 'lucide-react';
import type { DailyEveningPractice, Quote } from '../types';
import { haptics } from '../utils/haptics';
import { generateEveningPracticeMessage } from '../utils/aiService';
import { Loader2 } from 'lucide-react';
import { useAutoScroll } from '../hooks/useAutoScroll';

const DashboardQuoteCard = lazy(() => import('./DashboardQuoteCard').then(m => ({ default: m.DashboardQuoteCard })));

interface EveningPracticeProps {
    onComplete: (data: DailyEveningPractice) => void;
    isDarkMode: boolean;
    existingPractice?: DailyEveningPractice | null;
    userName?: string;
    /**
     * If the user set a commitment in this morning's practice, pass it here.
     * When present, the evening flow opens with a brief check-in beat before GLAD.
     */
    todayMorningCommitment?: string;
    /**
     * Fallback: if no commitment was set this morning, pass the one-word intention here.
     * The evening flow will still open with a check-in beat, framed against the intention.
     * When both are undefined/empty, the check-in step is skipped entirely.
     */
    todayMorningIntention?: string;
    userVoiceProfile?: import('../types').UserVoiceProfile;
    onStepChange?: (step: string) => void;
    coachName?: string;
}

export const EveningPractice: React.FC<EveningPracticeProps> = ({ onComplete, isDarkMode, existingPractice, userName, todayMorningCommitment, todayMorningIntention, userVoiceProfile, onStepChange, coachName }) => {
    const contentRef = useAutoScroll();

    const commitmentText = todayMorningCommitment?.trim() || '';
    const intentionText = todayMorningIntention?.trim() || '';
    // Commitment check-in step is intentionally disabled — evening flows straight to GLAD.
    // morningCommitment is still forwarded to the AI for message context (line 88).
    const hasCommitment = false;
    void commitmentText; void intentionText; // suppress unused-var warnings

    const [step, setStep] = useState<'intro' | 'commitment' | 'gratitude' | 'learning' | 'accomplishment' | 'delight' | 'message'>('intro');

    const [commitmentReflection, setCommitmentReflection] = useState('');
    const [gratitude, setGratitude] = useState('');
    const [learning, setLearning] = useState('');
    const [accomplishment, setAccomplishment] = useState('');
    const [delight, setDelight] = useState('');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        onStepChange?.(step);
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (existingPractice) {
            setTimeout(() => {
                setGratitude(existingPractice.gratitude || '');
                setLearning(existingPractice.learning || '');
                setAccomplishment(existingPractice.accomplishment || '');
                setDelight(existingPractice.delight || '');
                setCommitmentReflection(existingPractice.commitmentReflection || '');
                setGeneratedMessage(existingPractice.reflectionMessage || '');
            }, 0);
            // If we have an existing practice, we don't show the widget anymore in the parent
        }
    }, [existingPractice]);

    const handleNext = () => {
        setIsAnimating(true);
        setTimeout(() => {
            if (step === 'intro') setStep(hasCommitment ? 'commitment' : 'gratitude');
            else if (step === 'commitment') setStep('gratitude');
            else if (step === 'gratitude') setStep('learning');
            else if (step === 'learning') setStep('accomplishment');
            else if (step === 'accomplishment') setStep('delight');
            else if (step === 'delight') {
                setStep('message');
                setIsGenerating(true);
                generateEveningPracticeMessage(userName || 'Friend', {
                    gratitude,
                    learning,
                    accomplishment,
                    delight,
                    morningCommitment: todayMorningCommitment?.trim() || undefined,
                    commitmentReflection: commitmentReflection.trim() || undefined,
                    userVoiceProfile,
                }).then(msg => {
                    setGeneratedMessage(msg);
                    setIsGenerating(false);
                });
            }
            setIsAnimating(false);
        }, 300);
        haptics.light();
    };

    const handleBack = () => {
        setIsAnimating(true);
        setTimeout(() => {
            if (step === 'commitment') setStep('intro');
            else if (step === 'gratitude') setStep(hasCommitment ? 'commitment' : 'intro');
            else if (step === 'learning') setStep('gratitude');
            else if (step === 'accomplishment') setStep('learning');
            else if (step === 'delight') setStep('accomplishment');
            else if (step === 'message') setStep('delight');
            setIsAnimating(false);
        }, 300);
        haptics.light();
    };

    const handleFinish = () => {
        const trimmedReflection = commitmentReflection.trim();
        const practiceData: DailyEveningPractice = {
            id: Date.now().toString(),
            date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
            gratitude: gratitude.trim(),
            learning: learning.trim(),
            accomplishment: accomplishment.trim(),
            delight: delight.trim(),
            ...(trimmedReflection ? { commitmentReflection: trimmedReflection } : {}),
            reflectionMessage: generatedMessage
        };
        onComplete(practiceData);
        haptics.success();
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white' : 'text-sage-dark/60';
    const inputBg = isDarkMode ? 'bg-white/5 border-white/10 focus:border-pale-gold' : 'bg-white/60 border-sage/20 focus:border-sage';

    const isStepValid = () => {
        if (step === 'gratitude') return gratitude.trim().length > 0;
        if (step === 'learning') return learning.trim().length > 0;
        if (step === 'accomplishment') return accomplishment.trim().length > 0;
        if (step === 'delight') return delight.trim().length > 0;
        return true;
    };

    const renderIntro = () => {
        const firstName = userName ? userName.split(' ')[0] : null;
        return (
        <div className="flex flex-col items-center text-center py-6 animate-fade-in">
            {firstName && (
                <p className={`text-2xl font-display font-medium mb-1 ${textPrimary}`}>
                    Good evening, {firstName}.
                </p>
            )}
            <p className={`text-sm mb-6 ${textSecondary}`}>Let's close the day right.</p>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 animate-pulse-slow ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                <Moon size={26} />
            </div>
            <h3 className={`text-xl font-display font-medium mb-2 ${textPrimary}`}>Evening Reflection</h3>
            <p className={`text-sm max-w-xs mb-8 ${textSecondary}`}>
                Gratitude. Learning. Accomplishment. Delight. Four questions to close your day strong.
            </p>
            <button
                onClick={handleNext}
                className="w-full py-4 bg-[#E5D6A7] text-[#2D3E33] rounded-full font-bold shadow-lg active:scale-95 transition-all hover:bg-[#EDE3B8]"
            >
                Begin Reflection
            </button>
        </div>
        );
    };

    const renderCommitmentReflection = () => {
        // Prefer the concrete commitment. Fall back to the intention if commitment wasn't set this morning.
        const usingCommitment = !!commitmentText;
        const anchorText = usingCommitment ? commitmentText : intentionText;
        const subLabel = usingCommitment
            ? 'You said today would look like:'
            : 'You set out to focus on:';
        const checkInPrompt = usingCommitment ? 'How did it go?' : 'How did that show up today?';

        return (
        <div className="w-full flex flex-col py-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                    <Target size={20} />
                </div>
                <h3 className={`text-xl font-display font-medium ${textPrimary}`}>This morning</h3>
            </div>
            <p className={`text-sm mb-4 ${textSecondary}`}>
                {subLabel}
            </p>

            <div className={`mb-6 rounded-2xl px-5 py-4 border ${isDarkMode ? 'bg-pale-gold/5 border-pale-gold/20 text-white' : 'bg-sage/5 border-sage/20 text-sage-dark'}`}>
                <p className="text-base font-display italic leading-relaxed">
                    "{anchorText}"
                </p>
            </div>

            <p className={`text-sm mb-3 ${textSecondary}`}>{checkInPrompt}</p>

            <div className="bg-transparent border-none">
                <textarea
                    value={commitmentReflection}
                    onChange={(e) => setCommitmentReflection(e.target.value)}
                    aria-label={checkInPrompt}
                    placeholder="Whatever's true. No score, no judgment."
                    className={`w-full text-lg bg-transparent border rounded-xl p-4 outline-none transition-all min-h-[100px] resize-none ${inputBg} ${textPrimary} placeholder:opacity-40`}
                    autoFocus
                />
            </div>

            <p className={`mt-3 text-xs uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-sage/40'}`}>
                Optional — share as much or as little as you want
            </p>

            <div className="flex gap-3 mt-8">
                <button
                    onClick={handleBack}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-sage'}`}
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="flex-[2] py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 bg-[#E5D6A7] text-[#2D3E33] hover:bg-[#EDE3B8]"
                >
                    Continue <ChevronRight size={18} />
                </button>
            </div>
        </div>
        );
    };

    const renderInputStep = (
        title: string,
        subtitle: string,
        icon: React.ReactNode,
        value: string,
        setValue: (val: string) => void,
        placeholder: string,
        _label: string
    ) => (
        <div className="w-full flex flex-col py-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                    {icon}
                </div>
                <h3 className={`text-xl font-display font-medium ${textPrimary}`}>{title}</h3>
            </div>
            <p className={`text-sm mb-6 ${textSecondary}`}>{subtitle}</p>

            <div className="bg-transparent border-none">
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    aria-label={subtitle}
                    placeholder={placeholder}
                    className={`w-full text-lg bg-transparent border rounded-xl p-4 outline-none transition-all min-h-[120px] resize-none ${inputBg} ${textPrimary} placeholder:opacity-40`}
                    autoFocus
                />
            </div>

            <div className="flex gap-3 mt-8">
                <button
                    onClick={handleBack}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-sage'}`}
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className={`flex-[2] py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${!isStepValid()
                        ? 'opacity-50 cursor-not-allowed bg-gray-500/20'
                        : 'bg-[#E5D6A7] text-[#2D3E33] hover:bg-[#EDE3B8]'
                        }`}
                >
                    {step === 'delight' ? 'Finish' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    const renderMessage = () => {
        const messageQuote: Quote = {
            id: 'evening-message',
            text: generatedMessage || '...',
            author: coachName || 'Palante',
            intensity: 2,
            category: 'evening-reflection',
            isAI: true,
        };

        return (
            <div className="w-full flex flex-col items-center animate-fade-in">
                {isGenerating ? (
                    <div role="status" className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 size={36} aria-hidden className={`animate-spin ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />
                        <p className={`text-sm font-medium ${textSecondary}`}>Crafting your evening summary...</p>
                    </div>
                ) : (
                    <>
                        <p className={`text-xs font-black uppercase tracking-[0.22em] mb-5 ${textSecondary}`}>
                            Your reflection for the day
                        </p>
                        <div className="w-full mb-6">
                            <Suspense fallback={<div className={`rounded-[2rem] h-48 animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/8'}`} />}>
                                <DashboardQuoteCard
                                    quote={messageQuote}
                                    isDarkMode={isDarkMode}
                                />
                            </Suspense>
                        </div>
                        <button
                            onClick={handleFinish}
                            className="w-full py-4 bg-[#E5D6A7] text-[#2D3E33] rounded-2xl font-bold shadow-lg active:scale-95 transition-all hover:bg-[#EDE3B8]"
                        >
                            Complete Reflection
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className={`w-full p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-gradient-to-br from-white to-sage/5 border-sage/20 shadow-sm'
            }`}>

            {/* Background Decor — unified with morning's pale-gold/sage palette (not purple/indigo). */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-20 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

            <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {step === 'intro' && renderIntro()}
                {step === 'commitment' && renderCommitmentReflection()}
                {step === 'gratitude' && renderInputStep(
                    "Gratitude",
                    "What is one thing I am grateful for on this day?",
                    <Heart size={20} />,
                    gratitude,
                    setGratitude,
                    "I am grateful for...",
                    "G"
                )}
                {step === 'learning' && renderInputStep(
                    "Learning",
                    "What is one thing that I learned today? Wire your brain for positivity.",
                    <BookOpen size={20} />,
                    learning,
                    setLearning,
                    "I learned that...",
                    "L"
                )}
                {step === 'accomplishment' && renderInputStep(
                    "Accomplishment",
                    "What is one thing that I accomplished today? Big or small.",
                    <Award size={20} />,
                    accomplishment,
                    setAccomplishment,
                    "I accomplished...",
                    "A"
                )}
                {step === 'delight' && renderInputStep(
                    "Delight",
                    "What is one thing that delighted me today? Note a moment of joy.",
                    <Smile size={20} />,
                    delight,
                    setDelight,
                    "I was delighted by...",
                    "D"
                )}
                {step === 'message' && renderMessage()}
            </div>

            {/* Progress Dots */}
            {step !== 'intro' && step !== 'message' && (() => {
                const steps = hasCommitment
                    ? ['commitment', 'gratitude', 'learning', 'accomplishment', 'delight']
                    : ['gratitude', 'learning', 'accomplishment', 'delight'];
                const stepIndex = steps.indexOf(step) + 1;
                return (
                    <div
                        className="flex justify-center gap-2 mt-6"
                        role="progressbar"
                        aria-label="Reflection progress"
                        aria-valuemin={1}
                        aria-valuemax={steps.length}
                        aria-valuenow={stepIndex}
                        aria-valuetext={`Step ${stepIndex} of ${steps.length}`}
                    >
                        {steps.map((s) => (
                            <div key={s} className={`w-2 h-2 rounded-full transition-all ${step === s ? (isDarkMode ? 'bg-pale-gold w-6' : 'bg-sage w-6') : (isDarkMode ? 'bg-white/20' : 'bg-sage/20')}`} />
                        ))}
                    </div>
                );
            })()}
        </div>
    );
};
