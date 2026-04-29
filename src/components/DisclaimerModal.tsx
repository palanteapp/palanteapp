import { useState } from 'react';
import { ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';

interface DisclaimerModalProps {
    isOpen: boolean;
    onAccept: () => void;
    isDarkMode: boolean;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept, isDarkMode }) => {
    const [showFullText, setShowFullText] = useState(false);

    const handleAccept = () => {
        // Save acceptance to localStorage with timestamp
        const acceptance = {
            accepted: true,
            timestamp: new Date().toISOString(),
            version: LEGAL_DISCLAIMER.lastUpdated
        };
        localStorage.setItem('disclaimerAccepted', JSON.stringify(acceptance));
        onAccept();
    };

    if (!isOpen) return null;

    // Soothing Sage Palette Styles
    const modalBaseStyles = isDarkMode
        ? 'bg-sage-mid/90 border-sage/30 text-white shadow-spa-lg shadow-black/20'
        : 'bg-white/90 border-sage/20 text-sage-dark shadow-spa-lg shadow-sage/10';

    // Softer accents
    const iconColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
    const mutedColor = isDarkMode ? 'text-white/70' : 'text-sage-dark/70';
    const cardBg = isDarkMode ? 'bg-black/20 border-white/5' : 'bg-sage/5 border-sage/10';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-sage-mid/40 backdrop-blur-md animate-fade-in duration-700">
            <div className={`relative w-full max-w-md flex flex-col items-center text-center p-8 rounded-[40px] border backdrop-blur-xl transition-all duration-500 ease-out ${modalBaseStyles} ${showFullText ? 'max-h-[85vh] max-w-xl' : 'h-auto'}`}>

                {/* Decorative Icon */}
                <div className={`mb-6 p-4 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/10'} animate-float-slow`}>
                    <Sparkles size={32} className={iconColor} strokeWidth={1.5} />
                </div>

                {/* Header */}
                <h2 className="text-3xl font-display font-medium mb-3 tracking-wide">
                    Welcome to Palante
                </h2>

                <p className={`text-sm mb-8 leading-relaxed max-w-xs mx-auto ${mutedColor}`}>
                    Your personal space for growth and wellness.
                </p>

                {/* Core Message Card */}
                <div className={`w-full p-6 rounded-3xl mb-6 text-left transition-all ${cardBg}`}>
                    <div className="flex items-start gap-4">
                        <ShieldCheck size={24} className={`mt-0.5 shrink-0 ${iconColor}`} />
                        <div>
                            <h3 className="font-display font-medium text-lg mb-1">Mindful Disclaimer</h3>
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-sage-dark/80'}`}>
                                Palante is a tool for coaching and wellness. It is <strong>not</strong> a substitute for professional medical or mental health advice.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toggle Full Text */}
                {!showFullText ? (
                    <button
                        onClick={() => setShowFullText(true)}
                        className={`text-xs uppercase tracking-widest font-bold mb-8 transition-colors ${mutedColor} hover:${isDarkMode ? 'text-white' : 'text-sage-dark'}`}
                    >
                        Read Full Legal Terms
                    </button>
                ) : (
                    <div className="w-full flex-1 overflow-y-auto mb-6 pr-2 text-left animate-fade-in custom-scrollbar">
                        <div className={`h-px w-full mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />
                        <div className={`space-y-6 ${mutedColor}`}>
                            {LEGAL_DISCLAIMER.sections.map((section, index) => (
                                <div key={index}>
                                    <h4 className={`font-bold text-sm mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                        {section.heading}
                                    </h4>
                                    <p className="text-xs leading-relaxed opacity-90">
                                        {section.content}
                                    </p>
                                </div>
                            ))}
                            <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                                <p className="text-[10px] text-center opacity-50">
                                    Last Updated: {LEGAL_DISCLAIMER.lastUpdated}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFullText(false)}
                            className={`w-full py-4 mt-4 text-xs font-medium flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity`}
                        >
                            <ChevronDown size={14} className="rotate-180" /> Collapse Terms
                        </button>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleAccept}
                    className={`w-full py-4 rounded-full font-body font-bold text-lg tracking-wide transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${isDarkMode
                        ? 'bg-pale-gold text-rich-black hover:bg-white hover:text-black shadow-pale-gold/10'
                        : 'bg-terracotta-500 text-white hover:bg-sage-600 shadow-terracotta-500/20'}`}
                >
                    Enter Palante
                </button>

            </div>
        </div>
    );
};
