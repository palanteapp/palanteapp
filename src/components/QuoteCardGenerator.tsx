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
            className="relative overflow-hidden flex flex-col justify-between p-12"
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
                className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3"
                style={{
                    backgroundColor: isDarkMode ? colors.white : colors.sage,
                    opacity: 0.2
                }}
            />
            <div
                className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"
                style={{
                    backgroundColor: colors.paleGold,
                    opacity: 0.2
                }}
            />

            {/* Top Branding */}
            <div className="relative z-10 flex justify-center pt-24">
                <div className="flex flex-col items-center gap-4">
                    {/* Logo */}
                    <img
                        src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                        alt="Palante"
                        style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                    />
                    <div className="flex flex-col items-center gap-2">
                        <span
                            className="text-4xl font-display font-medium tracking-tight"
                            style={{ color: textPrimaryColor }}
                        >
                            Palante
                        </span>
                        <span
                            className="text-xl font-body tracking-widest uppercase"
                            style={{ color: finalTextSecondary }}
                        >
                            Personalized Progress, Delivered Daily
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-24">

                {/* Decorative Element */}
                <div
                    className="text-9xl font-display opacity-20 mb-16"
                    style={{ color: accentColor }}
                >
                    "
                </div>

                {/* Quote - Check length to adjust size if needed */}
                <h1
                    className={`${quote.text.length > 100 ? 'text-6xl' : 'text-7xl'} font-display font-medium leading-tight mb-20`}
                    style={{ color: textPrimaryColor }}
                >
                    {quote.text}
                </h1>

                {/* Author */}
                <div className="flex flex-col items-center gap-8">
                    <div
                        className="w-32 h-1 rounded-full"
                        style={{ backgroundColor: isDarkMode ? colors.white20 : colors.sage20 }}
                    />
                    <p
                        className="text-4xl font-body font-light"
                        style={{ color: textPrimaryColor }}
                    >
                        {quote.author}
                    </p>
                </div>

                {/* Category Tag */}
                <div
                    className="mt-24 px-10 py-5 rounded-full border"
                    style={{
                        borderColor: isDarkMode ? colors.white20 : colors.sage20,
                        color: isDarkMode ? colors.white60 : 'rgba(181, 194, 163, 0.8)' // Sage text for tag
                    }}
                >
                    <span className="text-2xl font-bold uppercase tracking-widest">
                        {quote.category}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 pb-24 text-center">
                <p
                    className="text-2xl font-body tracking-wider opacity-80"
                    style={{ color: finalTextSecondary }}
                >
                    Sharing is caring, don't forget to tag us.
                </p>
            </div>

            {/* Border Frame */}
            <div
                className="absolute inset-12 border rounded-[60px] pointer-events-none"
                style={{ borderColor: isDarkMode ? colors.white10 : colors.sage10 }}
            />
        </div>
    );
};
