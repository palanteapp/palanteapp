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

    // Color palette
    const bgClass = isDarkMode ? 'bg-sage-mid' : 'bg-ivory';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/70' : 'text-sage-dark/70';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
    const accentBg = isDarkMode ? 'bg-pale-gold' : 'bg-sage';
    const tabActiveBg = isDarkMode ? 'bg-pale-gold/20 border-pale-gold' : 'bg-sage/20 border-sage';
    const tabInactiveBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-sage-mid/5 border-sage-dark/10';

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode} showCloseButton={false}>
            <div className={`${bgClass} ${textPrimary} rounded-t-3xl max-h-[85vh] overflow-y-auto`}>
                {/* Header */}
                <div className="sticky top-0 z-10 backdrop-blur-xl bg-inherit/95 border-b border-white/10 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-2xl font-display font-medium ${textPrimary}`}>
                            {featureName}
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage-mid/10'}`}
                        >
                            <X size={24} className={textSecondary} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('how')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 ${activeTab === 'how' ? tabActiveBg : tabInactiveBg
                                }`}
                        >
                            <HelpCircle size={16} />
                            <span>How to Use</span>
                        </button>
                        {theScience && (
                            <button
                                onClick={() => setActiveTab('science')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 ${activeTab === 'science' ? tabActiveBg : tabInactiveBg
                                    }`}
                            >
                                <Microscope size={16} />
                                <span>The Science</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-8 pt-6">
                    {activeTab === 'how' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Description */}
                            <div>
                                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                    {howToUse.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${textSecondary}`}>
                                    {howToUse.description}
                                </p>
                            </div>

                            {/* Steps */}
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${accentColor}`}>
                                    Steps
                                </h4>
                                <div className="space-y-3">
                                    {howToUse.steps.map((step, index) => (
                                        <div key={index} className="flex gap-3">
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full ${accentBg} flex items-center justify-center text-xs font-bold ${isDarkMode ? 'text-sage-dark' : 'text-white'}`}>
                                                {index + 1}
                                            </div>
                                            <p className={`text-sm leading-relaxed pt-0.5 ${textSecondary}`}>
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tips */}
                            {howToUse.tips && howToUse.tips.length > 0 && (
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-pale-gold/10 border border-pale-gold/20' : 'bg-sage/10 border border-sage/20'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${accentColor}`}>
                                        💡 Pro Tips
                                    </h4>
                                    <ul className="space-y-2">
                                        {howToUse.tips.map((tip, index) => (
                                            <li key={index} className={`text-sm ${textSecondary} flex gap-2`}>
                                                <span className={accentColor}>•</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'science' && theScience && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Overview */}
                            <div>
                                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                    {theScience.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${textSecondary}`}>
                                    {theScience.overview}
                                </p>
                            </div>

                            {/* Benefits */}
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${accentColor}`}>
                                    Research-Backed Benefits
                                </h4>
                                <div className="space-y-2">
                                    {theScience.benefits.map((benefit, index) => (
                                        <div key={index} className={`flex gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                            <span className={`${accentColor} text-lg`}>✓</span>
                                            <p className={`text-sm ${textSecondary}`}>
                                                {benefit}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Research Note */}
                            {theScience.research && (
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-pale-gold/10 border border-pale-gold/20' : 'bg-sage/10 border border-sage/20'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${accentColor}`}>
                                        🔬 Research Note
                                    </h4>
                                    <p className={`text-xs leading-relaxed ${textSecondary}`}>
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
