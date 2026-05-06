import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { ContentType, QuoteSource } from '../types';

interface PostPracticeSetupModalProps {
    isOpen: boolean;
    userName: string;
    isDarkMode: boolean;
    onComplete: (prefs: {
        interests: string[];
        contentType: ContentType;
        sourcePreference: QuoteSource;
    }) => void;
    onSkip: () => void;
}

const INTEREST_TAGS = [
    'Mindset', 'Wellness', 'Discipline', 'Career',
    'Relationships', 'Creativity', 'Leadership', 'Fitness',
    'Spirituality', 'Growth', 'Resilience', 'Balance',
];

const CONTENT_OPTIONS: { value: ContentType; label: string; desc: string }[] = [
    { value: 'affirmations', label: 'Affirmations', desc: 'I-centered, present-tense power statements' },
    { value: 'quotes',       label: 'Quotes',       desc: 'Words of thinkers, leaders & doers' },
    { value: 'mix',          label: 'Both',          desc: 'A blend — let Palante decide each day' },
];

export const PostPracticeSetupModal: React.FC<PostPracticeSetupModalProps> = ({
    isOpen,
    userName,
    isDarkMode,
    onComplete,
    onSkip,
}) => {
    const [step, setStep] = useState<0 | 1>(0);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [contentType, setContentType] = useState<ContentType>('mix');

    const toggleInterest = (tag: string) => {
        setSelectedInterests(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleFinish = () => {
        onComplete({
            interests: selectedInterests,
            contentType,
            sourcePreference: 'mix',
        });
    };

    // Theme tokens
    const bg      = isDarkMode ? '#1C2814' : '#FAF7F3';
    const card    = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)';
    const border  = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(212,184,130,0.3)';
    const text    = isDarkMode ? '#FFFFFF' : '#2D2016';
    const textMid = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(109,76,59,0.75)';
    const textDim = isDarkMode ? 'rgba(255,255,255,0.28)' : 'rgba(109,76,59,0.40)';
    const orange  = '#C96A3A';
    const gold    = '#E5D6A7';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[90]"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-[95] rounded-t-[2rem] overflow-hidden"
                        style={{ background: bg, maxHeight: '90vh' }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div
                                className="w-10 h-1 rounded-full"
                                style={{ background: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(201,106,58,0.22)' }}
                            />
                        </div>

                        <div className="overflow-y-auto pb-10" style={{ maxHeight: 'calc(90vh - 20px)' }}>
                            <div className="px-6 pt-4">

                                {/* Step 0 — Interests */}
                                <AnimatePresence mode="wait">
                                    {step === 0 && (
                                        <motion.div
                                            key="interests"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {/* Header */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={16} style={{ color: gold }} />
                                                <span
                                                    className="text-xs font-bold uppercase tracking-widest"
                                                    style={{ color: gold }}
                                                >
                                                    First practice done
                                                </span>
                                            </div>
                                            <h2
                                                className="text-2xl font-display font-bold tracking-tight mb-1"
                                                style={{ color: text }}
                                            >
                                                What matters to you, {userName.split(' ')[0]}?
                                            </h2>
                                            <p className="text-sm mb-6" style={{ color: textMid }}>
                                                Pick what resonates. Palante uses this to choose your daily words.
                                            </p>

                                            {/* Chips */}
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {INTEREST_TAGS.map(tag => {
                                                    const selected = selectedInterests.includes(tag);
                                                    return (
                                                        <motion.button
                                                            key={tag}
                                                            onClick={() => toggleInterest(tag)}
                                                            whileTap={{ scale: 0.94 }}
                                                            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                                                            style={{
                                                                background: selected ? orange : card,
                                                                border: `1px solid ${selected ? orange : border}`,
                                                                color: selected ? '#FFFFFF' : textMid,
                                                                boxShadow: selected ? '0 4px 14px rgba(201,106,58,0.3)' : 'none',
                                                            }}
                                                        >
                                                            {tag}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* CTA */}
                                            <motion.button
                                                onClick={() => setStep(1)}
                                                className="w-full py-4 rounded-2xl font-bold text-white text-base tracking-wide shadow-xl mb-3"
                                                style={{
                                                    background: selectedInterests.length > 0 ? orange : 'rgba(201,106,58,0.3)',
                                                    boxShadow: selectedInterests.length > 0 ? '0 8px 28px rgba(201,106,58,0.35)' : 'none',
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                Next →
                                            </motion.button>
                                            <button
                                                onClick={() => setStep(1)}
                                                className="w-full py-2 text-sm font-medium"
                                                style={{ color: textDim }}
                                            >
                                                Skip for now
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Step 1 — Content style */}
                                    {step === 1 && (
                                        <motion.div
                                            key="content"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <h2
                                                className="text-2xl font-display font-bold tracking-tight mb-1"
                                                style={{ color: text }}
                                            >
                                                What should your daily words sound like?
                                            </h2>
                                            <p className="text-sm mb-6" style={{ color: textMid }}>
                                                You can always change this in settings.
                                            </p>

                                            <div className="space-y-3 mb-8">
                                                {CONTENT_OPTIONS.map(opt => {
                                                    const selected = contentType === opt.value;
                                                    return (
                                                        <motion.button
                                                            key={opt.value}
                                                            onClick={() => setContentType(opt.value)}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="w-full p-4 rounded-2xl text-left transition-all"
                                                            style={{
                                                                background: selected ? `${orange}18` : card,
                                                                border: `1.5px solid ${selected ? orange : border}`,
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p
                                                                        className="font-bold text-sm mb-0.5"
                                                                        style={{ color: selected ? orange : text }}
                                                                    >
                                                                        {opt.label}
                                                                    </p>
                                                                    <p className="text-xs" style={{ color: textMid }}>
                                                                        {opt.desc}
                                                                    </p>
                                                                </div>
                                                                <div
                                                                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 ml-4 flex items-center justify-center"
                                                                    style={{
                                                                        borderColor: selected ? orange : border,
                                                                        background: selected ? orange : 'transparent',
                                                                    }}
                                                                >
                                                                    {selected && (
                                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* CTAs */}
                                            <motion.button
                                                onClick={handleFinish}
                                                className="w-full py-4 rounded-2xl font-bold text-white text-base tracking-wide shadow-xl mb-3"
                                                style={{
                                                    background: orange,
                                                    boxShadow: '0 8px 28px rgba(201,106,58,0.35)',
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                Let's grow →
                                            </motion.button>
                                            <button
                                                onClick={() => setStep(0)}
                                                className="w-full py-2 text-sm font-medium"
                                                style={{ color: textDim }}
                                            >
                                                ← Back
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Step dots */}
                        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 pointer-events-none">
                            {[0, 1].map(i => (
                                <div
                                    key={i}
                                    className="h-1 rounded-full transition-all duration-400"
                                    style={{
                                        width: i === step ? 24 : 6,
                                        background: i === step ? orange : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(201,106,58,0.2)'),
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
