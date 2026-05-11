import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { QuoteIntensity, QuoteSource, ContentType } from '../types';

interface QuoteToneModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    quoteIntensity: QuoteIntensity;
    sourcePreference: QuoteSource;
    contentTypePreference: ContentType;
    onSave: (prefs: {
        quoteIntensity: QuoteIntensity;
        sourcePreference: QuoteSource;
        contentTypePreference: ContentType;
    }) => void;
}

type OptionItem<T> = { value: T; label: string; sub: string };

const INTENSITY_OPTIONS: OptionItem<QuoteIntensity>[] = [
    { value: 1, label: 'Gentle',  sub: 'Soft, reflective, grounding'   },
    { value: 2, label: 'Direct',  sub: 'Clear, purposeful, energising' },
    { value: 3, label: 'Bold',    sub: 'Fierce, expansive, challenging' },
];

const SOURCE_OPTIONS: OptionItem<QuoteSource>[] = [
    { value: 'human', label: 'Human Voices', sub: 'Curated thinkers & traditions' },
    { value: 'ai',    label: 'AI-Generated', sub: 'Personalised to your journey'  },
    { value: 'mix',   label: 'Mix Both',     sub: 'Variety across both sources'   },
];

const CONTENT_OPTIONS: OptionItem<ContentType>[] = [
    { value: 'quotes',       label: 'Quotes',       sub: 'Words from others'          },
    { value: 'affirmations', label: 'Affirmations', sub: 'Declarations in your voice' },
    { value: 'mix',          label: 'Mix Both',     sub: 'Alternate between the two'  },
];

function OptionRow<T extends string | number>({
    options, selected, onSelect, isDarkMode,
}: {
    options: OptionItem<T>[];
    selected: T;
    onSelect: (v: T) => void;
    isDarkMode: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            {options.map(opt => {
                const active = opt.value === selected;
                return (
                    <button
                        key={String(opt.value)}
                        onClick={() => onSelect(opt.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            active
                                ? 'border-[#C96A3A] bg-[#C96A3A]/10'
                                : isDarkMode
                                    ? 'border-white/10 bg-white/5 hover:bg-white/8'
                                    : 'border-sage/15 bg-white/50 hover:bg-white/80'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                    {opt.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-sage/55'}`}>
                                    {opt.sub}
                                </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                active ? 'border-[#C96A3A]' : isDarkMode ? 'border-white/30' : 'border-sage/30'
                            }`}>
                                {active && <div className="w-2 h-2 rounded-full bg-[#C96A3A]" />}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

export const QuoteToneModal: React.FC<QuoteToneModalProps> = ({
    isOpen, onClose, isDarkMode,
    quoteIntensity, sourcePreference, contentTypePreference, onSave,
}) => {
    const [intensity, setIntensity]       = React.useState<QuoteIntensity>(quoteIntensity);
    const [source, setSource]             = React.useState<QuoteSource>(sourcePreference);
    const [contentType, setContentType]   = React.useState<ContentType>(contentTypePreference);

    // Sync when opened
    React.useEffect(() => {
        if (isOpen) {
            setIntensity(quoteIntensity);
            setSource(sourcePreference);
            setContentType(contentTypePreference);
        }
    }, [isOpen, quoteIntensity, sourcePreference, contentTypePreference]);

    const handleSave = () => {
        onSave({ quoteIntensity: intensity, sourcePreference: source, contentTypePreference: contentType });
        onClose();
    };

    const sectionLabel = `text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white/35' : 'text-sage/45'}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    {/* Sheet */}
                    <motion.div
                        className={`fixed bottom-0 left-0 right-0 z-[301] rounded-t-3xl px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto ${
                            isDarkMode ? 'bg-[#243B23]' : 'bg-[#F2EBE0]'
                        }`}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    >
                        {/* Handle */}
                        <div className={`w-10 h-1 rounded-full mx-auto mb-5 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className={`text-lg font-display font-semibold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                    Quote Style
                                </h2>
                                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/45' : 'text-sage/50'}`}>
                                    Tune what lands in your feed
                                </p>
                            </div>
                            <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/8 text-white/60' : 'bg-sage/10 text-sage/60'}`}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Intensity */}
                        <p className={sectionLabel}>Energy Level</p>
                        <div className="mb-6">
                            <OptionRow options={INTENSITY_OPTIONS} selected={intensity} onSelect={setIntensity} isDarkMode={isDarkMode} />
                        </div>

                        {/* Content type */}
                        <p className={sectionLabel}>Content Type</p>
                        <div className="mb-6">
                            <OptionRow options={CONTENT_OPTIONS} selected={contentType} onSelect={setContentType} isDarkMode={isDarkMode} />
                        </div>

                        {/* Source */}
                        <p className={sectionLabel}>Source</p>
                        <div className="mb-8">
                            <OptionRow options={SOURCE_OPTIONS} selected={source} onSelect={setSource} isDarkMode={isDarkMode} />
                        </div>

                        {/* Save */}
                        <button
                            onClick={handleSave}
                            className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide"
                            style={{ background: '#C96A3A' }}
                        >
                            Save Preferences
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
