import { useState, useEffect } from 'react';
import { Moon, ChevronRight, Heart, BookOpen, Award, Smile } from 'lucide-react';
import type { DailyEveningPractice } from '../types';
import { haptics } from '../utils/haptics';
import { generateEveningPracticeMessage } from '../utils/aiService';
import { Loader2 } from 'lucide-react';

interface EveningPracticeProps {
    onComplete: (data: DailyEveningPractice) => void;
    isDarkMode: boolean;
    existingPractice?: DailyEveningPractice | null;
    userName?: string;
}

export const EveningPractice: React.FC<EveningPracticeProps> = ({ onComplete, isDarkMode, existingPractice, userName }) => {
    const [step, setStep] = useState<'intro' | 'gratitude' | 'learning' | 'accomplishment' | 'delight' | 'message'>('intro');

    const [gratitude, setGratitude] = useState('');
    const [learning, setLearning] = useState('');
    const [accomplishment, setAccomplishment] = useState('');
    const [delight, setDelight] = useState('');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (existingPractice) {
            setTimeout(() => {
                setGratitude(existingPractice.gratitude || '');
                setLearning(existingPractice.learning || '');
                setAccomplishment(existingPractice.accomplishment || '');
                setDelight(existingPractice.delight || '');
                setGeneratedMessage(existingPractice.reflectionMessage || '');
            }, 0);
            // If we have an existing practice, we don't show the widget anymore in the parent
        }
    }, [existingPractice]);

    const handleNext = () => {
        setIsAnimating(true);
        setTimeout(() => {
            if (step === 'intro') setStep('gratitude');
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
                    delight
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
            if (step === 'gratitude') setStep('intro');
            else if (step === 'learning') setStep('gratitude');
            else if (step === 'accomplishment') setStep('learning');
            else if (step === 'delight') setStep('accomplishment');
            else if (step === 'message') setStep('delight');
            setIsAnimating(false);
        }, 300);
        haptics.light();
    };

    const handleFinish = () => {
        const practiceData: DailyEveningPractice = {
            id: Date.now().toString(),
            date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
            gratitude: gratitude.trim(),
            learning: learning.trim(),
            accomplishment: accomplishment.trim(),
            delight: delight.trim(),
            reflectionMessage: generatedMessage
        };
        onComplete(practiceData);
        haptics.success();
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const inputBg = isDarkMode ? 'bg-white/5 border-white/10 focus:border-pale-gold' : 'bg-white/60 border-sage/20 focus:border-sage';

    const isStepValid = () => {
        if (step === 'gratitude') return gratitude.trim().length > 0;
        if (step === 'learning') return learning.trim().length > 0;
        if (step === 'accomplishment') return accomplishment.trim().length > 0;
        if (step === 'delight') return delight.trim().length > 0;
        return true;
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center text-center py-8 animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 animate-pulse-slow ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                <Moon size={32} />
            </div>
            <h3 className={`text-2xl font-display font-medium mb-3 ${textPrimary}`}>Evening Reflection</h3>
            <p className={`text-base max-w-xs mb-8 ${textSecondary}`}>
                Gratitude. Learning. Accomplishment. Delight. Four questions to close your day strong.
            </p>
            <button
                onClick={handleNext}
                className="px-8 py-3 bg-[#C96A3A] text-white rounded-full font-bold shadow-lg active:scale-95 transition-all hover:bg-[#b55e32]"
            >
                Begin Reflection
            </button>
        </div>
    );

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
                        : 'bg-[#C96A3A] text-white hover:bg-[#b55e32]'
                        }`}
                >
                    {step === 'delight' ? 'Finish' : 'Next'} <ChevronRight size={18} />
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
                        <p className={`text-sm font-medium ${textSecondary}`}>Crafting your evening summary...</p>
                    </div>
                ) : (
                    <>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Moon size={40} className="animate-pulse-slow" />
                        </div>
                        <h3 className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 ${textSecondary}`}>
                            Your reflection for the day
                        </h3>
                        <div className={`text-2xl font-display font-medium leading-[1.6] italic px-4 ${textPrimary}`}>
                            "{generatedMessage}"
                        </div>

                        <button
                            onClick={handleFinish}
                            className="mt-12 px-10 py-3 bg-[#C96A3A] text-white rounded-full font-bold shadow-lg active:scale-95 transition-all hover:bg-[#b55e32]"
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

            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-20 ${isDarkMode ? 'bg-purple-500' : 'bg-indigo-300'}`} />

            <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {step === 'intro' && renderIntro()}
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
            {step !== 'intro' && step !== 'message' && (
                <div className="flex justify-center gap-2 mt-6">
                    {['gratitude', 'learning', 'accomplishment', 'delight'].map((s) => (
                        <div key={s} className={`w-2 h-2 rounded-full transition-all ${step === s ? (isDarkMode ? 'bg-pale-gold w-6' : 'bg-sage w-6') : (isDarkMode ? 'bg-white/20' : 'bg-sage/20')}`} />
                    ))}
                </div>
            )}
        </div>
    );
};
