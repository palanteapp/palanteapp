import React, { useState } from 'react';
import { X, HelpCircle, Microscope } from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';

interface FeatureInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    featureName: string;
    howToUse: {
        title: string;
        description: string;
        steps: string[];
        tips?: string[];
    };
    theScience?: {
        title: string;
        overview: string;
        benefits: string[];
        research?: string;
    };
    initialTab?: 'how' | 'science';
}

export const FeatureInfoModal: React.FC<FeatureInfoModalProps> = ({
    isOpen,
    onClose,
    isDarkMode,
    featureName,
    howToUse,
    theScience,
    initialTab = 'how'
}) => {
    const [activeTab, setActiveTab] = useState<'how' | 'science'>('how');

    // Effect to update tab when opened
    React.useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Color palette - Matching the new "Sanctuary" vibe
    const textPrimary = 'text-white';
    const textSecondary = 'text-white'; // Full opacity for readability
    const accentColor = 'text-white/60 font-black text-[12px]'; // Darker, bolder Terracotta
    const accentBg = 'bg-[#E5D6A7]'; // Solid Pale Gold
    const tabActiveBg = 'bg-[#E5D6A7] shadow-sm border-[#E5D6A7] text-[#1B4332]';
    const tabInactiveBg = 'bg-transparent border-white/10 text-white/50';

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode} showCloseButton={false}>
            <div className={`${textPrimary} rounded-t-3xl max-h-[85vh] overflow-y-auto`}>
                {/* Header */}
                <div className="sticky top-0 z-10 backdrop-blur-md bg-white/10 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-2xl font-display font-medium ${textPrimary}`}>
                            {featureName}
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors hover:bg-white/[0.06]`}
                        >
                            <X size={24} className={textSecondary} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-white/[0.06] rounded-2xl">
                        <button
                            onClick={() => setActiveTab('how')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${activeTab === 'how' ? tabActiveBg : tabInactiveBg
                                }`}
                        >
                            <HelpCircle size={14} />
                            <span>How to Use</span>
                        </button>
                        {theScience && (
                            <button
                                onClick={() => setActiveTab('science')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${activeTab === 'science' ? tabActiveBg : tabInactiveBg
                                    }`}
                            >
                                <Microscope size={14} />
                                <span>The Science</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-8 pt-6">
                    {activeTab === 'how' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Description */}
                            <div className="p-6 rounded-[2rem] bg-white/[0.06] border border-white/10">
                                <h3 className={`text-xl font-display font-medium mb-3 ${textPrimary}`}>
                                    {howToUse.title}
                                </h3>
                                <p className={`text-sm leading-relaxed text-white/70`}>
                                    {howToUse.description}
                                </p>
                            </div>

                            {/* Steps */}
                            <div>
                                <h4 className={`text-xs font-black uppercase tracking-[0.2em] mb-5 ${accentColor}`}>
                                    Mastery Steps
                                </h4>
                                <div className="space-y-3">
                                    {howToUse.steps.map((step, index) => (
                                        <div key={index} className="flex gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#E5D6A7] flex items-center justify-center text-sm font-black text-[#1B4332] shadow-sm">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm leading-relaxed pt-1.5 font-medium text-white/80">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tips */}
                            {howToUse.tips && howToUse.tips.length > 0 && (
                                <div className="p-6 rounded-[2rem] bg-white/[0.06] border border-white/10">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 text-white/60">
                                        Palante Pro Tips
                                    </h4>
                                    <ul className="space-y-3">
                                        {howToUse.tips.map((tip, index) => (
                                            <li key={index} className="text-sm text-white/80 font-medium flex gap-3 items-start">
                                                <span className="mt-1 text-[#E5D6A7] flex-shrink-0">·</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'science' && theScience && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Overview */}
                            <div className="p-6 rounded-[2rem] bg-white/[0.06] border border-white/10">
                                <h3 className={`text-xl font-display font-medium mb-3 ${textPrimary}`}>
                                    {theScience.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-white/70 italic">
                                    &ldquo;{theScience.overview}&rdquo;
                                </p>
                            </div>

                            {/* Benefits */}
                            <div>
                                <h4 className={`text-xs font-black uppercase tracking-[0.2em] mb-5 ${accentColor}`}>
                                    Informed Benefits
                                </h4>
                                <div className="space-y-3">
                                    {theScience.benefits.map((benefit, index) => (
                                        <div key={index} className="flex gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                                            <div className="w-8 h-8 rounded-xl bg-[#E5D6A7] flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[#1B4332] font-black text-sm">✓</span>
                                            </div>
                                            <p className="text-sm font-medium pt-1.5 text-white/80">
                                                {benefit}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Research Note */}
                            {theScience.research && (
                                <div className={`p-6 rounded-[2rem] bg-white/[0.12] border border-white/[0.12] shadow-xl`}>
                                    <h4 className={`text-xs font-black uppercase tracking-[0.2em] mb-3 text-[#E5D6A7]`}>
                                        🔬 The Research
                                    </h4>
                                    <p className={`text-xs leading-relaxed text-white/90 font-light`}>
                                        {theScience.research}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </SlideUpModal>
    );
};
