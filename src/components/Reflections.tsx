/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import type { JournalEntry, UserProfile } from '../types';
import { Save, Mic, Target, TrendingUp, AlertCircle, CheckCircle2, MessageCircle, Brain, Sparkles, Loader2, HelpCircle, Microscope } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { generateReflectionAnalysis, isAIAvailable } from '../utils/aiService';
import type { ReflectionAnalysis } from '../utils/aiService';
import { FeatureInfoModal } from './FeatureInfoModal';
import { FEATURE_INFO } from '../data/featureInfo';
import { EVENING_PROMPTS } from '../data/smartPrompts';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface ReflectionsProps {
    onSave: (entry: JournalEntry) => void;
    isDarkMode: boolean;
    tipsEnabled?: boolean;
    onShowTip?: () => void;
    onStrategize?: () => void;
    user?: UserProfile; // Add user prop for settings
}

// --- DYNAMIC PROMPT SETS ---
const PROMPT_SETS = [
    {
        id: 'alignment',
        theme: 'Nurturing Alignment',
        description: 'Sync with your inner flow. Align actions with your values.',
        q1: { label: 'Moments of Flow', question: 'What moments today felt effortless and aligned with my intentions?' },
        q2: { label: 'Gentle Release', question: 'What energy or frustration am I ready to release with kindness?' },
        q3: { label: 'Peaceful Shift', question: 'What small, gentle change would bring more harmony to tomorrow?' },
        openJournalPrompt: "What thoughts are surfacing today that deserve a moment of focused reflection?"
    },
    {
        id: 'resilience',
        theme: 'Inner Peace & Resilience',
        description: 'Cultivate a calm center. See growth in every experience.',
        q1: { label: 'Finding My Light', question: 'In what moment today did I show up as my kindest, strongest self?' },
        q2: { label: 'Gifts of Growth', question: 'What was a challenging moment today, and what gentle lesson did it offer?' },
        q3: { label: 'Embracing Tomorrow', question: 'How can I support my future self when I wake up tomorrow?' },
    },
    {
        id: 'growth',
        theme: 'Gentle Growth',
        description: 'Celebrate small steps. Bloom at your own pace.',
        q1: { label: 'Small Joys', question: 'What is one small success or moment of joy I am grateful for today?' },
        q2: { label: 'Gentle Obstacles', question: 'What felt heavy today, and how can I approach it with more ease tomorrow?' },
        q3: { label: 'Morning Seeds', question: 'What is one supportive habit I want to nurture in the morning?' },
        openJournalPrompt: "If today was a chapter in your favorite book, what story would you tell about your blooming?"
    }
];

interface ReflectionsProps {
    onSave: (entry: JournalEntry) => void;
    isDarkMode: boolean;
    tipsEnabled?: boolean;
    onShowTip?: () => void;
    onStrategize?: () => void;
    user?: UserProfile;
    initialText?: string;
    initialTheme?: string;
}

export const Reflections: React.FC<ReflectionsProps> = ({
    onSave,
    isDarkMode,
    tipsEnabled = true,
    onShowTip,
    onStrategize,
    user,
    initialText,
    initialTheme,
}) => {
    // State
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [q3, setQ3] = useState('');
    const [freeform, setFreeform] = useState(initialText || '');

    // Config State
    const [promptSetIndex, setPromptSetIndex] = useState(0);
    const [wantsAssessment, setWantsAssessment] = useState(false);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ReflectionAnalysis | null>(null);
    const [savedToday, setSavedToday] = useState(false);
    const [showFeatureInfo, setShowFeatureInfo] = useState(false);

    // Voice
    const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported: speechSupported } = useSpeechRecognition();
    const [activeField, setActiveField] = useState<'q1' | 'q2' | 'q3' | 'free' | null>(null);

    // Derived
    const currentSet = PROMPT_SETS[promptSetIndex];
    const aiAvailable = isAIAvailable();

    // Load Data & Select Prompt Set
    useEffect(() => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // 1. Select Prompt Set based on day of year to ensure rotation
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const diff = today.getTime() - startOfYear.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        setPromptSetIndex(dayOfYear % PROMPT_SETS.length);

        // 2. Load Saved Data
        const saved = localStorage.getItem(`${STORAGE_KEYS.JOURNAL_ENTRY}_${dateString}`);
        if (saved) {
            const entry = JSON.parse(saved);
            setQ1(entry.highlight || '');
            setQ2(entry.midpoint || '');
            setQ3(entry.lowlight || '');
            if ('freeform' in entry) setFreeform(entry.freeform);
            setSavedToday(true);

            // If they saved previously with analysis, we don't persist analysis text yet locally, 
            // but we could. For now, just show saved state.
        }
    }, []);

    // Handle Voice Input
    useEffect(() => {
        if (transcript && activeField) {
            const append = (prev: string) => prev + (prev ? ' ' : '') + transcript;
            if (activeField === 'q1') setQ1(append);
            if (activeField === 'q2') setQ2(append);
            if (activeField === 'q3') setQ3(append);
            if (activeField === 'free') setFreeform(append);
            resetTranscript();
        }
    }, [transcript, activeField, resetTranscript]);

    // Handle incoming reflection text from external triggers (like Wisdom)
    useEffect(() => {
        if (initialText) {
            setFreeform(prev => {
                const normalizedPrev = prev.trim();
                const normalizedInitial = initialText.trim();
                if (normalizedPrev.includes(normalizedInitial)) return prev;
                return prev ? `${normalizedPrev}\n\n${normalizedInitial}` : normalizedInitial;
            });
        }
    }, [initialText]);

    const toggleDictation = (field: 'q1' | 'q2' | 'q3' | 'free') => {
        if (isListening && activeField === field) {
            stopListening();
            setActiveField(null);
        } else {
            setActiveField(field);
            startListening();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const today = new Date().toISOString().split('T')[0];

        // Save Local
        const entry: any = {
            id: today,
            date: today,
            highlight: q1,
            midpoint: q2,
            lowlight: q3,
            freeform
        };
        localStorage.setItem(`${STORAGE_KEYS.JOURNAL_ENTRY}_${today}`, JSON.stringify(entry));
        onSave(entry);
        setSavedToday(true);

        // Analysis Flow
        if (wantsAssessment && aiAvailable && !analysisResult) {
            setIsAnalyzing(true);
            try {
                const analysis = await generateReflectionAnalysis({
                    q1: `${currentSet.q1.question}: ${q1}`,
                    q2: `${currentSet.q2.question}: ${q2}`,
                    q3: `${currentSet.q3.question}: ${q3}`,
                    freeform
                });
                setAnalysisResult(analysis);
            } catch (err) {
                console.error("Analysis failed", err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    // Styles
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const borderClass = isDarkMode ? 'border-white/10' : 'border-sage/20';
    const cardBg = isDarkMode ? 'glass-surface' : 'bg-white/50';

    // Component for calibration inputs
    const CalibrationInput = ({
        label,
        icon: Icon,
        question,
        value,
        setValue,
        fieldId,
    }: {
        label: string,
        icon: any,
        question: string,
        value: string,
        setValue: (s: string) => void,
        fieldId: 'q1' | 'q2' | 'q3'
    }) => (
        <div className={`p-8 rounded-[2rem] ${cardBg} border border-transparent focus-within:border-sage/30 transition-all group`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'} ${textPrimary}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h3 className={`font-display font-medium text-lg leading-tight ${textPrimary} uppercase tracking-wide`}>{label}</h3>
                        <p className={`text-sm font-medium ${textSecondary}`}>{question}</p>
                    </div>
                </div>
                {speechSupported && (
                <button
                    type="button"
                    onClick={() => toggleDictation(fieldId)}
                    className={`
                        p-1.5 rounded-full transition-all flex-shrink-0 opacity-70 hover:opacity-100
                        ${isListening && activeField === fieldId
                            ? 'bg-red-500 text-white animate-pulse'
                            : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage/60 hover:bg-sage/20'
                        }
                    `}
                >
                    <Mic size={13} />
                </button>
                )}
            </div>
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={user?.journalPromptsEnabled !== false ? "Log your thoughts..." : ""}
                rows={3}
                className={`w-full bg-transparent outline-none resize-none text-lg ${textPrimary} placeholder:opacity-30`}
            />
        </div>
    );

    // --- VIEW: ANALYZING ---
    if (isAnalyzing) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${'bg-terracotta-500 text-white hover:scale-105'}`}>
                    <Brain size={48} className="animate-pulse" />
                </div>
                <h2 className={`text-2xl font-display font-bold mb-4 ${textPrimary}`}>Palante Coach is analyzing your day...</h2>
                <div className="flex items-center gap-2 opacity-60">
                    <Loader2 size={20} className="animate-spin" />
                    <p className={textSecondary}>Connecting dots. Finding leverage points.</p>
                </div>
            </div>
        );
    }

    // --- VIEW: ANALYSIS RESULT (Insight Card) ---
    if (savedToday && analysisResult) {
        return (
            <div className="w-full min-h-screen p-6 md:p-8 animate-fade-in pb-32 max-w-md mx-auto flex flex-col justify-center">
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className={`text-3xl font-display font-medium ${textPrimary}`}>Day Complete</h2>
                </div>

                {/* INSIGHT CARD */}
                <div className={`relative p-8 rounded-3xl border shadow-2xl mb-8 overflow-hidden ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-sage/20'}`}>
                    {/* Glow Effect */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-40 -mr-10 -mt-10 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                            <h3 className={`font-bold uppercase tracking-widest text-xs ${textSecondary}`}>Palante Coach Insight</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className={`text-lg font-bold mb-2 ${textPrimary}`}>Win</h4>
                                <p className={`text-lg leading-relaxed italic ${textSecondary}`}>"{analysisResult.praise}"</p>
                            </div>
                            <div className={`h-px w-full ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />
                            <div>
                                <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Power Move</h4>
                                <p className={`text-lg leading-relaxed font-medium ${textPrimary}`}>{analysisResult.powerMove}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => onStrategize?.()}
                        className={`w-full py-4 rounded-full font-display font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] ${isDarkMode
                            ? 'bg-pale-gold text-sage-dark'
                            : 'bg-terracotta-500 text-white'
                            }`}
                    >
                        <MessageCircle size={18} /> Discuss Strategy
                    </button>
                    <button
                        onClick={() => {
                            // Reset to edit mode, keep data
                            setAnalysisResult(null);
                        }}
                        className={`py-4 text-sm font-medium opacity-50 hover:opacity-100 transition-opacity ${textPrimary}`}
                    >
                        Edit Reflection
                    </button>
                </div>
            </div>
        );
    }

    // --- VIEW: STANDARD FORM ---
    return (
        <div className="w-full px-6 md:px-8 pt-6 animate-fade-in pb-32 max-w-md mx-auto">

            {/* Header Area - Matching Fasting Vibe */}
            <div className="w-full flex flex-col items-center text-center mb-10">
                <h2 className="text-4xl font-display font-medium text-white mb-2">Reflect</h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.4em] font-black">Sync with Your Source</p>

                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={() => setShowFeatureInfo(true)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isDarkMode
                            ? 'bg-white/10 text-white/80 hover:bg-white/20'
                            : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                    >
                        <HelpCircle size={12} strokeWidth={2.5} />
                        <span>How to Use</span>
                    </button>
                    <button
                        onClick={() => setShowFeatureInfo(true)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isDarkMode
                            ? 'bg-pale-gold/10 text-pale-gold/80 hover:bg-pale-gold/20 hover:text-pale-gold'
                            : 'bg-pale-gold/10 text-pale-gold/80 hover:bg-pale-gold/20 hover:text-pale-gold'
                            }`}
                    >
                        <Microscope size={12} strokeWidth={2.5} />
                        <span>The Science</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">

                {/* STACKED CALIBRATION BOXES */}
                <div className="space-y-4">
                    <CalibrationInput
                        label={currentSet.q1.label}
                        icon={TrendingUp}
                        question={currentSet.q1.question}
                        value={q1}
                        setValue={setQ1}
                        fieldId="q1"
                    />

                    <CalibrationInput
                        label={currentSet.q2.label}
                        icon={CheckCircle2}
                        question={currentSet.q2.question}
                        value={q2}
                        setValue={setQ2}
                        fieldId="q2"
                    />

                    <CalibrationInput
                        label={currentSet.q3.label}
                        icon={AlertCircle}
                        question={currentSet.q3.question}
                        value={q3}
                        setValue={setQ3}
                        fieldId="q3"
                    />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 py-4 opacity-30">
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-white' : 'bg-sage'}`} />
                    <span className="font-display italic text-sm">Open Journal</span>
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-white' : 'bg-sage'}`} />
                </div>

                {/* OPEN JOURNAL */}
                <div className="relative">
                    {/* SMART PROMPTS CAROUSEL */}
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50 ${textSecondary}`}>
                        Tap a prompt to spark your entry
                    </p>
                    <div className="mb-4 -mx-6 px-6 overflow-x-auto flex gap-2 no-scrollbar pb-1 snap-x">
                        {EVENING_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => {
                                    const newText = freeform ? freeform + "\n\n" + prompt : prompt;
                                    setFreeform(newText);
                                }}
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

                    <div className="relative">
                        <textarea
                            value={freeform}
                            onChange={(e) => setFreeform(e.target.value)}
                            placeholder={user?.journalPromptsEnabled !== false ? (currentSet as any).openJournalPrompt : ""}
                            className={`
                                w-full p-10 rounded-[2.5rem] outline-none min-h-[400px] transition-all resize-none 
                                text-lg leading-relaxed border-2 journal-input-area
                                ${cardBg} ${textPrimary}
                                ${isDarkMode
                                    ? 'border-transparent focus:border-pale-gold/30'
                                    : 'border-transparent focus:border-sage/30'
                                }
                            `}
                        />
                        {speechSupported && (
                        <button
                            type="button"
                            onClick={() => toggleDictation('free')}
                            className={`
                                absolute top-3 right-3 p-1.5 rounded-full transition-all
                                ${isListening && activeField === 'free'
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : isDarkMode ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-sage/5 text-sage/40 hover:text-sage'
                                }
                            `}
                        >
                            <Mic size={13} />
                        </button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center gap-6 pt-4">

                    {/* COACH ASSESSMENT TOGGLE (Only if not saved yet) */}
                    {!savedToday && aiAvailable && (
                        <div
                            className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-sage/5'}`}
                            onClick={() => setWantsAssessment(!wantsAssessment)}
                        >
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${wantsAssessment
                                ? (isDarkMode ? 'bg-pale-gold' : 'bg-sage')
                                : (isDarkMode ? 'bg-white/20' : 'bg-black/20')
                                }`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${wantsAssessment ? 'left-5' : 'left-1'}`} />
                            </div>
                            <span className={`text-sm font-medium ${wantsAssessment ? textPrimary : textSecondary}`}>
                                Get Palante Coach Assessment
                            </span>
                        </div>
                    )}

                    {!savedToday ? (
                        <button
                            type="submit"
                            className={`
                                w-full md:w-auto px-12 py-4 rounded-full font-display font-bold text-lg tracking-wide
                                transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3
                                ${isDarkMode
                                    ? 'bg-pale-gold text-sage-dark'
                                    : 'bg-terracotta-500 text-white'
                                }
                            `}
                        >
                            <Save size={20} /> {wantsAssessment ? 'COMPLETE & ANALYZE' : 'COMPLETE REFLECTION'}
                        </button>
                    ) : (
                        <div className="flex flex-col items-center w-full gap-6">
                            <div className="flex gap-4 w-full md:w-auto">
                                <button
                                    type="submit"
                                    className={`
                                        flex-1 md:flex-none px-8 py-4 rounded-full font-display font-medium text-lg 
                                        transition-all hover:scale-[1.02] shadow-lg
                                        ${isDarkMode
                                            ? 'bg-pale-gold text-sage-dark'
                                            : 'bg-terracotta-500 text-white'
                                        }
                                    `}
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQ1('');
                                        setQ2('');
                                        setQ3('');
                                        setFreeform('');
                                        setSavedToday(false);
                                        setAnalysisResult(null);
                                    }}
                                    className={`
                                        flex-1 md:flex-none px-8 py-4 rounded-full font-medium text-lg transition-colors
                                        ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-sage/10 hover:bg-sage/20'}
                                    `}
                                >
                                    New Entry
                                </button>
                            </div>

                            {/* Strategize with Coach Card (Standard View) */}
                            <div className={`w-full max-w-sm p-6 rounded-3xl border flex flex-col items-center gap-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-sage/5 border-sage/10'}`}>
                                <p className={`text-center italic font-medium opacity-80 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                    "Need help turning these reflections<br />into a game plan?"
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onStrategize?.()}
                                    className="flex items-center gap-4 group"
                                    disabled={!onStrategize}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${'bg-terracotta-500 text-white hover:scale-105'}`}>
                                        <MessageCircle size={20} fill="currentColor" />
                                    </div>
                                    <span className={`font-bold text-xs tracking-[0.2em] uppercase transition-colors ${isDarkMode ? 'text-pale-gold group-hover:text-white' : 'text-sage group-hover:text-sage/70'}`}>
                                        Strategize with Palante Coach
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Science Text */}

            </form>

            {/* Feature Info Modal */}
            <FeatureInfoModal
                isOpen={showFeatureInfo}
                onClose={() => setShowFeatureInfo(false)}
                isDarkMode={isDarkMode}
                featureName="Daily Reflections"
                howToUse={FEATURE_INFO.reflections.howToUse}
                theScience={FEATURE_INFO.reflections.theScience}
            />
        </div>
    );
};
