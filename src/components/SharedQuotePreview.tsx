import React from 'react';
import { Logo } from './Logo';
import type { Quote } from '../types';

interface SharedQuotePreviewProps {
    quote: Quote;
    seed?: string;
}

const getRand = (s: string, i: number): number => {
    let hash = 0;
    for (let j = 0; j < s.length; j++) hash = ((hash << 5) - hash) + s.charCodeAt(j);
    const x = Math.sin(hash + i) * 10000;
    return x - Math.floor(x);
};

// Earthy palette — identical to DashboardQuoteCard so home card = share card
const COLORS = ['#F59E0B', '#E5D6A7', '#C96A3A', '#355E3B', '#879582'];

// Card dimensions (9:16)
const W = 200;
const H = 356;

export const SharedQuotePreview: React.FC<SharedQuotePreviewProps> = ({ quote, seed }) => {
    const isTierQuote =
        quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire' ||
        quote.author === 'Palante Coach' || quote.isAI;

    const finalSeed = seed || `${quote.id}-${new Date().toLocaleDateString()}`;

    // Base colour picked by seed (matches DashboardQuoteCard SVG rect)
    const baseColor = COLORS[Math.floor(getRand(finalSeed, 0) * COLORS.length)];

    // Blobs scaled from SVG viewBox 400×520 → div 200×356
    const blobs = [1, 2, 3, 4, 5].map(i => ({
        cx:    25 + getRand(finalSeed, i * 10) * 150,
        cy:    34 + getRand(finalSeed, i * 20) * 288,
        r:     75 + getRand(finalSeed, i * 30) * 75,
        color: COLORS[Math.floor(getRand(finalSeed, i * 40) * COLORS.length)],
        opacity: 0.18 + getRand(finalSeed, i * 50) * 0.22,
    }));

    return (
        // NOTE: explicit px dimensions — html2canvas/WKWebView cannot resolve
        // `aspectRatio`, `min()`, or CSS `inset` shorthand correctly.
        <div style={{
            width: `${W}px`,
            height: `${H}px`,
            backgroundColor: '#355E3B',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* Base colour rect */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: baseColor, opacity: 0.85,
                pointerEvents: 'none',
            }} />

            {/* Art blobs — plain divs, no SVG, no mixBlendMode → html2canvas safe */}
            {blobs.map((b, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${b.cx}px`,
                    top: `${b.cy}px`,
                    width: `${b.r * 2}px`,
                    height: `${b.r * 2}px`,
                    borderRadius: '50%',
                    backgroundColor: b.color,
                    opacity: b.opacity,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }} />
            ))}

            {/* Content — relative so it sits above the absolute blobs */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '175px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
            }}>
                {/* White quote card */}
                <div style={{
                    backgroundColor: '#FDFBF7',
                    borderRadius: '12px',
                    padding: '20px 14px 18px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}>
                    {/* Logo badge — always dark bg so it's never light-on-light */}
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#355E3B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    }}>
                        <Logo color="#E5D6A7" style={{ height: '10px', width: '10px' }} />
                    </div>

                    {/* Quote text */}
                    <p style={{
                        fontSize: quote.text.length > 100 ? '11px' : '14px',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: '#1A3320',
                        marginBottom: isTierQuote ? '3px' : '8px',
                        letterSpacing: '-0.02em',
                        fontFamily: '"Poppins", sans-serif',
                    }}>
                        {quote.text}
                    </p>

                    {/* Author */}
                    {!isTierQuote && (
                        <p style={{
                            fontSize: '7px',
                            fontWeight: 500,
                            color: '#4A7A52',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            opacity: 0.9,
                            fontFamily: '"Inter", sans-serif',
                        }}>
                            — {quote.author}
                        </p>
                    )}
                </div>

                {/* Footer branding */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                }}>
                    <p style={{
                        fontSize: '4px',
                        fontWeight: 700,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#FDFBF7',
                        whiteSpace: 'nowrap',
                    }}>
                        PERSONALIZED MOTIVATION, DELIVERED DAILY
                    </p>
                    <p style={{
                        fontSize: '7px',
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#E8DEC9',
                    }}>
                        @PALANTE.APP
                    </p>
                </div>
            </div>
        </div>
    );
};
