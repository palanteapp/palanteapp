import { useState, useEffect } from 'react';
import { Sun, Sparkles, Check, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DailyMorningPractice } from '../types';
import { generateMorningPracticeMessage, getMomentumState } from '../utils/aiService';
import type { UserProfile } from '../types';
import { MORNING_PROMPTS } from '../data/smartPrompts';
import { getDailyRotatedItems } from '../utils/dailyRotation';

interface DailyMorningPracticeProps {
    onComplete: (data: DailyMorningPractice) => void;
    onRefresh?: () => void;
    isDarkMode: boolean;
    existingPriming?: DailyMorningPractice | null;
    userName?: string;
    hideEnergyCheckIn?: boolean;
    onFinish: () => void;
    user?: UserProfile;
}

export const DailyMorningPracticeWidget: React.FC<DailyMorningPracticeProps> = ({ onComplete, onRefresh, isDarkMode, existingPriming, userName, hideEnergyCheckIn: _hideEnergyCheckIn, onFinish, user }) => {
    const [step, setStep] = useState<'intro' | 'gratitude' | 'affirmation' | 'intention' | 'message' | 'summary'>('intro');
    const [gratitudes, setGratitudes] = useState<string[]>(['', '', '', '', '']);
    const [affirmations, setAffirmations] = useState<string[]>(['', '', '', '', '']);
    const [intention, setIntention] = useState<string>('');
    const [generatedMessage, setGeneratedMessage] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showSpecialEffect, setShowSpecialEffect] = useState(false);
    const [hasRefreshed, setHasRefreshed] = useState(false);

    useEffect(() => {
        if (existingPriming && !hasRefreshed) {
            // Ensure we have 5 slots even if data is empty (e.g. after refresh)
            const loadedGratitudes = (existingPriming.gratitudes && existingPriming.gratitudes.length > 0)
                ? existingPriming.gratitudes
                : ['', '', '', '', ''];

            const loadedAffirmations = (existingPriming.affirmations && existingPriming.affirmations.length > 0)
                ? existingPriming.affirmations
                : ['', '', '', '', ''];

            setGratitudes(loadedGratitudes);
            setAffirmations(loadedAffirmations);
            setIntention(existingPriming.dailyIntention || '');

            // Only jump to summary if we ACTUALLY have practice data (gratitudes)
            if (existingPriming.gratitudes && existingPriming.gratitudes.length > 0) {
                setStep('summary');
            }
        }
    }, [existingPriming, hasRefreshed]);

    // ... (keep handleInputChange, handleNext, etc.)

    // ... inside renderSummary button ...


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
        setIsAnimating(true);
        setTimeout(() => {
            if (step === 'intro') setStep('gratitude');
            else if (step === 'gratitude') setStep('affirmation');
            else if (step === 'affirmation') setStep('intention');
            else if (step === 'intention') {
                setShowSpecialEffect(true);
                // Start generating message early
                setIsGenerating(true);
                const activeGratitudes = gratitudes.filter(g => g.trim().length > 0);
                const activeAffirmations = affirmations.filter(a => a.trim().length > 0);

                generateMorningPracticeMessage(userName || "Friend", {
                    gratitudes: activeGratitudes,
                    affirmations: activeAffirmations,
                    intention: intention,
                    narrative: user?.userNarrative?.text,
                    momentumState: user ? getMomentumState(user) : undefined,
                }).then(msg => {
                    setGeneratedMessage(msg);
                    setIsGenerating(false);
                });

                // Trigger Dopamine Pop Haptic
                import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());

                setTimeout(() => {
                    setStep('message');
                    setShowSpecialEffect(false);
                }, 2000); // Duration of the special effect
            } else if (step === 'message') {
                setStep('summary');
                handleFinish();
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
        onComplete(primingData);
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const inputBg = isDarkMode ? 'bg-white/5 border-white/10 focus:border-pale-gold' : 'bg-white/60 border-sage/20 focus:border-sage';

    const isStepValid = () => {
        if (step === 'gratitude') return gratitudes.some(g => g.trim().length > 0);
        if (step === 'affirmation') return affirmations.some(a => a.trim().length > 0);
        if (step === 'intention') return intention.trim().length > 0;
        return true;
    };

    // --- RENDER HELPERS ---

    const renderIntro = () => (
        <div className="flex flex-col items-center text-center py-8 animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 animate-pulse-slow ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                <Sun size={32} />
            </div>
            <h3 className={`text-2xl font-display font-medium mb-3 ${textPrimary}`}>Morning Practice</h3>
            <p className={`text-base max-w-xs mb-8 ${textSecondary}`}>
                Gratitude. Affirmations. Intention. Three practices to own your day before it starts.
            </p>
            <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-3 bg-pale-gold text-sage-dark rounded-full font-bold shadow-lg active:scale-95 transition-all"
            >
                Start Practice
            </motion.button>
        </div>
    );

    const renderInputs = (
        title: string,
        subtitle: string,
        icon: React.ReactNode,
        values: string[],
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        placeholderPrefix: string
    ) => {
        // Determine prompt type based on title
        const promptType = title.toLowerCase().includes('gratitude') ? 'gratitude' :
            title.toLowerCase().includes('affirmation') ? 'affirmation' : null;

        // Get daily rotated prompts
        const allPrompts = promptType === 'gratitude' ? MORNING_PROMPTS.gratitude :
            promptType === 'affirmation' ? MORNING_PROMPTS.affirmation : [];
        const prompts = getDailyRotatedItems(allPrompts, 5);

        const handlePromptClick = (prompt: string) => {
            // Find first empty slot
            const emptyIndex = values.findIndex(v => v.trim() === '');
            if (emptyIndex !== -1) {
                handleInputChange(emptyIndex, prompt, setter);
            } else {
                // If full, overwrite the last one or do nothing? Let's overwrite last for now or just shake.
                // Better: Just overwrite the *current* focused one if we had focus tracking, 
                // but since we don't, filling the first empty is the "Smart" behavior. 
                // If all full, maybe overwrite the last one?
                handleInputChange(values.length - 1, prompt, setter);
            }
        };

        return (
            <div className="w-full animate-fade-in">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {icon}
                        <h3 className={`text-xl font-display font-medium ${textPrimary}`}>{title}</h3>
                    </div>
                    <p className={`text-sm ${textSecondary}`}>{subtitle}</p>
                </div>

                <div className="space-y-3 mb-6">
                    {values.map((val, idx) => (
                        <div key={idx} className="relative group">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ${textSecondary} opacity-50`}>
                                {idx + 1}.
                            </span>
                            <input
                                type="text"
                                value={val}
                                onChange={(e) => handleInputChange(idx, e.target.value, setter)}
                                placeholder={`${placeholderPrefix}...`}
                                className={`w-full py-3 pl-10 pr-4 rounded-xl border outline-none transition-all ${inputBg}`}
                                autoFocus={idx === 0}
                            />
                        </div>
                    ))}
                </div>

                {/* SMART PROMPTS CAROUSEL */}
                {prompts.length > 0 && (
                    <>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50 ${textSecondary}`}>
                            Tap a prompt to spark your entry
                        </p>
                        <div className="mb-8 -mx-6 px-6 overflow-x-auto flex gap-2 no-scrollbar pb-2 snap-x">
                        {prompts.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handlePromptClick(prompt)}
                                className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium border transition-all snap-start
                                    hover:scale-105 active:scale-95
                                    ${isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-pale-gold/30'
                                        : 'bg-white border-sage/10 text-sage/70 hover:bg-sage/5 hover:border-sage/30 hover:text-sage'
                                    }
                                `}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                    </>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-sage/10 hover:bg-sage/20 text-sage'}`}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className={`flex-[2] py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${!isStepValid()
                            ? 'opacity-50 cursor-not-allowed bg-gray-500/20'
                            : isDarkMode ? 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90' : 'bg-terracotta-500 text-white hover:bg-sage-600'
                            }`}
                    >
                        Next Step <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    const renderIntention = () => (
        <div className="w-full flex flex-col py-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                    <Sun size={20} />
                </div>
                <h3 className={`text-xl font-display font-medium ${textPrimary}`}>Your Intention</h3>
            </div>
            <p className={`text-sm mb-6 ${textSecondary}`}>
                Choose one word to guide your energy today. This will be your North Star.
            </p>

            <div className="bg-transparent border-none">
                <input
                    type="text"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="e.g. Courage, Peace, Focus, Joy..."
                    className={`w-full text-center text-3xl font-display font-bold bg-transparent border-b-2 outline-none transition-all py-4 placeholder:font-normal placeholder:opacity-30 ${isDarkMode
                        ? 'border-white/20 focus:border-pale-gold text-white placeholder-white'
                        : 'border-sage/20 focus:border-sage text-sage placeholder-sage'
                        }`}
                    autoFocus
                />
            </div>

            <div className={`mt-8 flex gap-3 ${isDarkMode ? 'text-white/40' : 'text-sage/40'} text-xs justify-center uppercase tracking-widest`}>
                Examples: Presence • Flow • Strength • Ease
            </div>

            <div className="flex gap-3 mt-10">
                <button
                    onClick={handleBack}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-sage'
                        }`}
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className={`flex-[2] py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${!isStepValid()
                        ? 'opacity-50 cursor-not-allowed bg-gray-500/20'
                        : isDarkMode ? 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90' : 'bg-terracotta-500 text-white hover:bg-sage-600'
                        }`}
                >
                    Complete Practice <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    const renderMessage = () => {
        return (
            <div className="w-full py-8 text-center animate-fade-in min-h-[300px] flex flex-col justify-center">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className={`animate-spin ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />
                        <p className={`text-sm font-medium ${textSecondary}`}>Crafting your morning boost...</p>
                    </div>
                ) : (
                    <>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg ${'bg-terracotta-500 text-white hover:scale-105'}`}>
                            <Sun size={40} className="animate-spin-slow" />
                        </div>
                        <h3 className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 ${textSecondary}`}>
                            Your message for the day
                        </h3>
                        <div className={`text-2xl font-display font-medium leading-[1.6] italic px-4 ${textPrimary}`}>
                            "{generatedMessage}"
                        </div>

                        <button
                            onClick={handleNext}
                            className="mt-12 px-10 py-3 bg-pale-gold text-sage-dark rounded-full font-bold shadow-lg active:scale-95 transition-all"
                        >
                            Embrace This
                        </button>
                    </>
                )}
            </div>
        );
    };

    // Summary Rendering with Intention
    const renderSummary = () => (
        <div className="w-full py-4 animate-fade-in text-center">
            <div className="mb-8">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    <Check size={24} />
                </div>
                <h3 className={`text-xl font-display font-medium ${textPrimary}`}>Practice Complete.</h3>
                {intention && (
                    <div className={`mt-4 inline-block px-6 py-2 rounded-full border ${isDarkMode ? 'border-pale-gold/30 bg-pale-gold/10 text-pale-gold' : 'border-sage/30 bg-sage/10 text-sage'}`}>
                        <span className="text-xs uppercase tracking-widest mr-2 opacity-70">Today's Intention</span>
                        <span className="font-bold font-display uppercase">{intention}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Gratitude</h4>
                    <ul className={`text-sm space-y-2 ${textSecondary}`}>
                        {gratitudes.filter(g => g).slice(0, 3).map((g, i) => (
                            <li key={i} className="line-clamp-1 truncate">• {g}</li>
                        ))}
                        {gratitudes.filter(g => g).length > 3 && <li>+ {gratitudes.filter(g => g).length - 3} more</li>}
                    </ul>
                </div>
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Affirmations</h4>
                    <ul className={`text-sm space-y-2 ${textSecondary}`}>
                        {affirmations.filter(a => a).slice(0, 3).map((a, i) => (
                            <li key={i} className="line-clamp-1 truncate">• {a}</li>
                        ))}
                        {affirmations.filter(a => a).length > 3 && <li>+ {affirmations.filter(a => a).length - 3} more</li>}
                    </ul>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <motion.button
                    onClick={onFinish}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 bg-pale-gold text-sage-dark rounded-xl text-lg font-bold tracking-wide shadow-lg active:scale-95 transition-all"
                >
                    Return to Dashboard
                </motion.button>
                <button
                    onClick={() => {
                        setHasRefreshed(true); // Block useEffect from re-populating
                        setGratitudes(['', '', '', '', '']);
                        setAffirmations(['', '', '', '', '']);
                        setGeneratedMessage('');
                        setStep('intro');
                        if (onRefresh) onRefresh();
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-medium border border-dashed transition-all ${isDarkMode ? 'border-white/20 text-white/40 hover:text-white hover:border-white/40' : 'border-sage/20 text-sage/40 hover:text-sage hover:border-sage/40'}`}
                >
                    Refresh Practice
                </button>
            </div>
        </div>
    );

    return (
        <div className={`w-full p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-gradient-to-br from-white to-sage/5 border-sage/20 shadow-sm'
            }`}>

            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-20 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

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
                        <Sun size={20} className="text-pale-gold-400" fill="currentColor" />,
                        gratitudes,
                        setGratitudes,
                        "I am grateful for"
                    )}
                    {step === 'affirmation' && renderInputs(
                        "Affirmations",
                        "List 5 truths about your highest self.",
                        <Sparkles size={20} className="text-pale-gold" fill="currentColor" />,
                        affirmations,
                        setAffirmations,
                        "I am"
                    )}
                    {step === 'intention' && renderIntention()}
                    {step === 'message' && renderMessage()}
                    {step === 'summary' && renderSummary()}
                </motion.div>
            </AnimatePresence>

            {/* Special Completion Effect (Sun Rise + Rays) */}
            {showSpecialEffect && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md animate-fade-in">
                    <div className="relative flex flex-col items-center">
                        {/* Sun Rays */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
                            <div className="absolute inset-0 border-[20px] border-pale-gold/30 rounded-full animate-sun-rays" stroke-dasharray="10 20" />
                            <div className="absolute inset-0 border-[40px] border-pale-gold/20 rounded-full animate-sun-rays delay-700" />
                        </div>

                        <div className={`w-32 h-32 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-60 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
                        <Sun size={88} className={`relative z-10 animate-rise-up ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`} />

                        <div className="mt-12 text-center animate-fade-in delay-700">
                            <p className="text-white font-display text-lg font-bold tracking-wide px-6">Rising to meet the day...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step Indicator dots (only during active flow) */}
            {(step === 'gratitude' || step === 'affirmation' || step === 'intention' || step === 'message') && (
                <div className="flex justify-center gap-2 mt-6">
                    <div className={`w-2 h-2 rounded-full transition-all ${step === 'gratitude' ? (isDarkMode ? 'bg-pale-gold w-6' : 'bg-sage w-6') : (isDarkMode ? 'bg-white/20' : 'bg-sage/20')}`} />
                    <div className={`w-2 h-2 rounded-full transition-all ${step === 'affirmation' ? (isDarkMode ? 'bg-pale-gold w-6' : 'bg-sage w-6') : (isDarkMode ? 'bg-white/20' : 'bg-sage/20')}`} />
                    <div className={`w-2 h-2 rounded-full transition-all ${step === 'intention' ? (isDarkMode ? 'bg-pale-gold w-6' : 'bg-sage w-6') : (isDarkMode ? 'bg-white/20' : 'bg-sage/20')}`} />
                    <div className={`w-2 h-2 rounded-full transition-all ${step === 'message' ? (isDarkMode ? 'bg-pale-gold w-6' : 'bg-sage w-6') : (isDarkMode ? 'bg-white/20' : 'bg-sage/20')}`} />
                </div>
            )}
        </div>
    );
};
