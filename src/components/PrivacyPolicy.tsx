import React, { useEffect } from 'react';
import { Logo } from './Logo';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import { ChevronLeft, Shield } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
    isDarkMode: boolean;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, isDarkMode }) => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const textPrimary = isDarkMode ? 'text-white' : 'text-white';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-white/70';
    const bgClass = isDarkMode ? 'bg-[#1a1c1a]' : 'bg-[#6F7B6D]';
    const cardClass = isDarkMode ? 'bg-white/[0.03]' : 'bg-white/10 backdrop-blur-md';

    return (
        <div className={`min-h-screen font-body ${bgClass} ${textPrimary}`}>
            <nav className={`sticky top-0 z-10 p-6 flex items-center justify-between backdrop-blur-xl border-b ${isDarkMode ? 'border-white/5 bg-[#1a1c1a]/80' : 'border-white/10 bg-[#6F7B6D]/80'}`}>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 font-medium hover:text-pale-gold transition-colors"
                >
                    <ChevronLeft size={20} />
                    Back
                </button>
                <div className="flex items-center gap-2">
                    <Logo />
                    <span className="font-display font-bold">Palante</span>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-12 lg:py-24">
                <header className="mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pale-gold/10 border border-pale-gold/20 text-pale-gold text-sm font-medium">
                        <Shield size={14} />
                        <span>Legal Document</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-display font-bold">{LEGAL_DISCLAIMER.title}</h1>
                    <p className={textSecondary}>Last Updated: {LEGAL_DISCLAIMER.lastUpdated}</p>
                </header>

                <div className="space-y-12">
                    {LEGAL_DISCLAIMER.sections.map((section, idx) => (
                        <section key={idx} className={`p-8 rounded-3xl ${cardClass} space-y-4 border ${isDarkMode ? 'border-white/5' : 'border-white/10'}`}>
                            <h2 className="text-xl font-bold font-display text-pale-gold border-b border-pale-gold/20 pb-2">
                                {section.heading}
                            </h2>
                            <div className={`leading-relaxed whitespace-pre-line text-sm lg:text-base ${textSecondary}`}>
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>

                <footer className="mt-24 pt-12 border-t border-white/5 text-center space-y-4">
                    <p className={textSecondary}>
                        Questions regarding these terms?
                        <br />
                        <a href="mailto:legal@palante.app" className="text-pale-gold hover:underline">legal@palante.app</a>
                    </p>
                    <button
                        onClick={onBack}
                        className={`mt-6 px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 ${isDarkMode
                            ? 'bg-pale-gold text-warm-gray-green'
                            : 'bg-sage text-white'
                            }`}
                    >
                        Return Home
                    </button>
                </footer>
            </main>
        </div>
    );
};
