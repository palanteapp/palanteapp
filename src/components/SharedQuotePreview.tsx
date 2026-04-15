import React from 'react';
import { Logo } from './Logo';
import type { Quote } from '../types';

interface SharedQuotePreviewProps {
    quote: Quote;
}

export const SharedQuotePreview: React.FC<SharedQuotePreviewProps> = ({ quote }) => {
    // Check if quote is from a tier
    // Check if quote is from a tier or is AI/Palante Coach
    const isTierQuote = quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire' || quote.author === 'Palante Coach' || quote.isAI;

    const ModernArtBackground = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="520" fill="#879582" />
            <circle cx="80" cy="100" r="220" fill="#9BAC98" opacity="0.9" />
            <circle cx="360" cy="140" r="200" fill="#E8DEC9" opacity="0.9" />
            <circle cx="320" cy="380" r="240" fill="#D6B8A0" opacity="0.8" />
            <circle cx="120" cy="460" r="260" fill="#C5AE91" opacity="0.9" />
            <circle cx="200" cy="260" r="180" fill="#E5D6C5" opacity="0.4" mixBlendMode="overlay" />
        </svg>
    );

    return (
        <div
            className={`transition-shadow duration-300`}
            style={{
                aspectRatio: '9/16',
                maxHeight: 'min(356px, 60vh)', // Responsive height constraint
                width: 'min(200px, 80vw)',     // Restoring a compact preview width
                background: '#5A6351',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                margin: '0 auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 0' // Added some vertical breathing room inside the preview
            }}
        >
            <ModernArtBackground />

            {/* Noise grain overlay for texture */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
            }} />


            {/* CARD CONTAINER */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '175px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
            }}>
                {/* White Card */}
                <div style={{
                    backgroundColor: '#FDFBF7',
                    borderRadius: '12px',
                    padding: '20px 14px 18px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative',
                    border: '1px solid rgba(0,0,0,0.02)'
                }}>
                    {/* Badge at Top */}
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#FDFBF7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        <Logo
                            color="#5A6351"
                            style={{
                                height: '10px',
                                width: '10px'
                            }}
                        />
                    </div>

                    {/* Quote */}
                    <p style={{
                        fontSize: quote.text.length > 100 ? '11px' : '14px',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: '#6F4E37',
                        marginBottom: isTierQuote ? '3px' : '8px',
                        letterSpacing: '-0.02em',
                        fontFamily: '"Poppins", sans-serif'
                    }}>
                        {quote.text}
                    </p>

                    {/* Author */}
                    {!isTierQuote && (
                        <p style={{
                            fontSize: '7px',
                            fontWeight: 500,
                            color: '#A0806B',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            opacity: 0.9,
                            fontFamily: '"Inter", sans-serif'
                        }}>
                            — {quote.author}
                        </p>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px'
                }}>
                    <p style={{
                        fontSize: '4px',
                        fontWeight: 700,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#FDFBF7',
                        whiteSpace: 'nowrap'
                    }}>
                        PERSONALIZED MOTIVATION, DELIVERED DAILY
                    </p>
                    <p style={{
                        fontSize: '7px',
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#E8DEC9'
                    }}>
                        @PALANTE.APP
                    </p>
                </div>
            </div>
        </div>
    );
};

