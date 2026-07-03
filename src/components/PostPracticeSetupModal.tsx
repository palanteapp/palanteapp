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
    existingContentType?: ContentType;
    existingSourcePreference?: QuoteSource;
}

const INTEREST_TAGS = [
    'Mindset', 'Health', 'Career', 'Relationships', 'Creativity', 'Spirituality',
];

export const PostPracticeSetupModal: React.FC<PostPracticeSetupModalProps> = ({
    isOpen,
    userName,
    onComplete,
    onSkip,
    existingContentType = 'mix',
    existingSourcePreference = 'mix',
}) => {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    React.useEffect(() => {
        if (!isOpen) setSelectedInterests([]);
    }, [isOpen]);

    const toggleInterest = (tag: string) => {
        setSelectedInterests(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleFinish = () => {
        onComplete({
            interests: selectedInterests,
            contentType: existingContentType,
            sourcePreference: existingSourcePreference,
        });
    };

    const gold = '#E5D6A7';
    const goldDim = 'rgba(229,214,167,0.75)';
    const goldFaint = 'rgba(229,214,167,0.45)';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[90]"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-[95] rounded-t-[2rem] overflow-hidden"
                        style={{ background: '#415D43', maxHeight: '90vh' }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    >
                        {/* Seed of Life — subtle sacred geometry */}
                        <svg
                            aria-hidden
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            viewBox="0 0 390 600"
                            preserveAspectRatio="xMidYMid slice"
                        >
                            <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.09">
                                <circle cx="195" cy="300" r="148" strokeWidth="0.9" />
                                <circle cx="343" cy="300" r="148" />
                                <circle cx="269" cy="428" r="148" />
                                <circle cx="121" cy="428" r="148" />
                                <circle cx="47"  cy="300" r="148" />
                                <circle cx="121" cy="172" r="148" />
                                <circle cx="269" cy="172" r="148" />
                            </g>
                        </svg>

                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 relative z-10">
                            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(229,214,167,0.25)' }} />
                        </div>

                        <div className="overflow-y-auto relative z-10" style={{ maxHeight: 'calc(90vh - 20px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}>
                            <div className="px-6 pt-4">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={16} style={{ color: gold }} />
                                    <span className="text-sm font-bold uppercase tracking-widest" style={{ color: gold }}>
                                        Practice complete
                                    </span>
                                </div>
                                <h2 className="text-3xl font-display font-bold tracking-tight mb-1 text-white">
                                    What matters to you, {userName.split(' ')[0]}?
                                </h2>
                                <p className="text-sm mb-7 text-white/70">
                                    Your picks shape the daily affirmations, quotes, and partner prompts you see.
                                </p>

                                {/* Interest chips */}
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {INTEREST_TAGS.map(tag => {
                                        const selected = selectedInterests.includes(tag);
                                        return (
                                            <motion.button
                                                key={tag}
                                                onClick={() => toggleInterest(tag)}
                                                whileTap={{ scale: 0.94 }}
                                                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                                                style={{
                                                    background: selected ? gold : 'rgba(255,255,255,0.10)',
                                                    border: `1px solid ${selected ? gold : 'rgba(255,255,255,0.25)'}`,
                                                    color: selected ? '#2D3E33' : 'rgba(255,255,255,0.85)',
                                                    boxShadow: selected ? '0 4px 14px rgba(229,214,167,0.25)' : 'none',
                                                }}
                                            >
                                                {tag}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* CTA */}
                                <motion.button
                                    onClick={handleFinish}
                                    className="w-full py-4 rounded-2xl font-bold text-base tracking-wide mb-3"
                                    style={{
                                        background: selectedInterests.length > 0 ? gold : 'rgba(229,214,167,0.25)',
                                        color: selectedInterests.length > 0 ? '#2D3E33' : 'rgba(229,214,167,0.50)',
                                        boxShadow: selectedInterests.length > 0 ? '0 8px 28px rgba(229,214,167,0.25)' : 'none',
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Let's grow →
                                </motion.button>
                                <button
                                    onClick={onSkip}
                                    className="w-full py-2 text-sm font-medium"
                                    style={{ color: 'rgba(229,214,167,0.30)' }}
                                >
                                    Skip for now
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
