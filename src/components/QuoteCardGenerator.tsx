import React from 'react';
import type { Quote } from '../types';

interface QuoteCardGeneratorProps {
    id: string;
    quote: Quote;
    isDarkMode: boolean;
}

export const QuoteCardGenerator: React.FC<QuoteCardGeneratorProps> = ({ id, quote, isDarkMode }) => {
    // 9:16 aspect ratio equivalent
    // 1080 x 1920 is standard for Stories

    // Explicit color definitions to avoid html2canvas issues with CSS variables or modern color functions
    const colors = {
        white: '#FFFFFF',
        ivory: '#F8F5F2',
        sage: '#B5C2A3',
        paleGold: '#E5D6A7',
        warmGrayGreen: '#6F7B6D',
        sandBeige: '#EDE4DA',

        // RGBA helpers for opacities
        sage20: 'rgba(181, 194, 163, 0.2)',
        sage60: 'rgba(181, 194, 163, 0.6)',
        sage05: 'rgba(181, 194, 163, 0.05)', // 5% opacity
        sage10: 'rgba(181, 194, 163, 0.1)',

        white20: 'rgba(255, 255, 255, 0.2)',
        white60: 'rgba(255, 255, 255, 0.6)',
        white05: 'rgba(255, 255, 255, 0.05)',
        white10: 'rgba(255, 255, 255, 0.1)',
    };

    const backgroundStyle = isDarkMode
        ? { backgroundColor: colors.warmGrayGreen }
        : { background: `linear-gradient(135deg, ${colors.ivory}, ${colors.sandBeige}, ${colors.sage20})` };

    const textPrimaryColor = isDarkMode ? colors.white : colors.warmGrayGreen;
    // The original used warm-gray-green/60 for light mode textSecondary. 
    // #6F7B6D is 111, 123, 109. 60% opacity -> rgba(111, 123, 109, 0.6)
    const textSecondaryColorLight = 'rgba(111, 123, 109, 0.6)';
    const finalTextSecondary = isDarkMode ? colors.white60 : textSecondaryColorLight;

    const accentColor = isDarkMode ? colors.paleGold : colors.sage;

    return (
        <div
            id={id}
            className="relative overflow-hidden flex flex-col items-center p-0 bg-white"
            style={{
                width: '1080px',
                height: '1920px',
                position: 'fixed',
                top: 0,
                left: '-9999px',
                zIndex: -1,
                ...backgroundStyle
            }}
        >
            {/* Background Ambience */}
            <div
                className="absolute top-0 right-0 w-[900px] h-[900px] rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3"
                style={{
                    backgroundColor: isDarkMode ? colors.white : colors.sage,
                    opacity: 0.2
                }}
            />
            <div
                className="absolute bottom-0 left-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3"
                style={{
                    backgroundColor: colors.paleGold,
                    opacity: 0.2
                }}
            />

            {/* Inner Safer Container to enforce padding */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between p-24">

                {/* Top Branding */}
                <div className="flex flex-col items-center gap-6 pt-16">
                    {/* Tagline First */}
                    <span
                        className="text-xl font-body tracking-[0.2em] uppercase opacity-80"
                        style={{ color: finalTextSecondary }}
                    >
                        Personalized Progress, Delivered Daily
                    </span>

                    {/* Logo Second */}
                    <img
                        src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                        alt="Palante"
                        style={{ height: '140px', width: 'auto', objectFit: 'contain' }}
                    />

                    {/* Palante Text Third */}
                    <span
                        className="text-5xl font-display font-medium tracking-tight"
                        style={{ color: textPrimaryColor }}
                    >
                        Palante
                    </span>
                </div>

                {/* Main Quote Content */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-16">
                    {/* Decorative Element */}
                    <div
                        className="text-[12rem] font-display opacity-20 mb-12 leading-none font-serif"
                        style={{ color: accentColor }}
                    >
                        "
                    </div>

                    {/* Tagline */}
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: finalTextSecondary, marginBottom: '1.5rem' }}>
                        Personalized Motivation, Delivered Daily
                    </p>

                    {/* Quote Text - Dynamic Sizing */}
                    <h1
                        className={`font-display font-medium leading-tight mb-16 ${quote.text.length > 150 ? 'text-5xl' :
                            quote.text.length > 80 ? 'text-6xl' : 'text-7xl'
                            }`}
                        style={{ color: textPrimaryColor }}
                    >
                        {quote.text}
                    </h1>

                    {/* Author Section */}
                    <div className="flex flex-col items-center gap-8">
                        <div
                            className="w-24 h-1.5 rounded-full opacity-60"
                            style={{ backgroundColor: isDarkMode ? colors.white20 : colors.sage20 }}
                        />
                        <p
                            className="text-4xl font-body font-light tracking-wide"
                            style={{ color: textPrimaryColor }}
                        >
                            {quote.author}
                        </p>
                    </div>

                    {/* Category Tag */}
                    <div
                        className="mt-20 px-12 py-4 rounded-full border-2"
                        style={{
                            borderColor: isDarkMode ? colors.white20 : colors.sage20,
                            color: isDarkMode ? colors.white60 : 'rgba(181, 194, 163, 0.9)'
                        }}
                    >
                        <span className="text-2xl font-bold uppercase tracking-widest">
                            {quote.category}
                        </span>
                    </div>
                </div>

                {/* Footer - Explicitly Pinned */}
                <div className="pb-16 flex flex-col items-center gap-4">
                    <p
                        className="text-2xl font-body font-medium tracking-wide uppercase opacity-70"
                        style={{ color: finalTextSecondary }}
                    >
                        Sharing is caring, don't forget to tag us
                    </p>
                    <div
                        className="w-16 h-1 rounded-full opacity-40"
                        style={{ backgroundColor: isDarkMode ? colors.white20 : colors.sage20 }}
                    />
                </div>
            </div>

            {/* Aesthetic Border Frame */}
            <div
                className="absolute inset-10 border-[3px] rounded-[50px] pointer-events-none opacity-40"
                style={{ borderColor: isDarkMode ? colors.white10 : colors.sage10 }}
            />
        </div>
    );
};
