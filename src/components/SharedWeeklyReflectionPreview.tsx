import React from 'react';
import { Logo } from './Logo';

interface SharedWeeklyReflectionPreviewProps {
    text: string;        // The AI-generated "Your week, reflected" paragraph
    dateRange: string;   // e.g. "Apr 28 – May 4"
    seed?: string;       // For deterministic blob layout
}

const getRand = (s: string, i: number): number => {
    let hash = 0;
    for (let j = 0; j < s.length; j++) hash = ((hash << 5) - hash) + s.charCodeAt(j);
    const x = Math.sin(hash + i) * 10000;
    return x - Math.floor(x);
};

// Same earthy palette as DashboardQuoteCard / SharedQuotePreview
const COLORS = ['#F59E0B', '#E5D6A7', '#C96A3A', '#355E3B', '#879582'];

// Same 9:16 card dimensions as SharedQuotePreview
const W = 200;
const H = 356;

export const SharedWeeklyReflectionPreview: React.FC<SharedWeeklyReflectionPreviewProps> = ({
    text,
    dateRange,
    seed,
}) => {
    const finalSeed = seed || `weekly-${dateRange}`;
    const baseColor = COLORS[Math.floor(getRand(finalSeed, 0) * COLORS.length)];

    const blobs = [1, 2, 3, 4, 5].map(i => ({
        cx:      25 + getRand(finalSeed, i * 10) * 150,
        cy:      34 + getRand(finalSeed, i * 20) * 288,
        r:       75 + getRand(finalSeed, i * 30) * 75,
        color:   COLORS[Math.floor(getRand(finalSeed, i * 40) * COLORS.length)],
        opacity: 0.18 + getRand(finalSeed, i * 50) * 0.22,
    }));

    return (
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
            {/* Base colour tint */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: baseColor, opacity: 0.85,
                pointerEvents: 'none',
            }} />

            {/* Art blobs */}
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

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '175px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
            }}>
                {/* Parchment inner card */}
                <div style={{
                    backgroundColor: '#FDFBF7',
                    borderRadius: '12px',
                    padding: '22px 14px 16px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}>
                    {/* Logo badge: same as SharedQuotePreview */}
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

                    {/* "YOUR WEEK, REFLECTED" label */}
                    <p style={{
                        fontSize: '5px',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#C96A3A',
                        marginBottom: '8px',
                        fontFamily: '"Inter", sans-serif',
                    }}>
                        Your week, reflected
                    </p>

                    {/* Reflection text */}
                    <p style={{
                        fontSize: text.length > 160 ? '8px' : '9px',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        color: '#1A3320',
                        marginBottom: '10px',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Poppins", sans-serif',
                        fontStyle: '',
                        textAlign: 'left',
                    }}>
                        {text}
                    </p>

                    {/* Terracotta divider + date */}
                    <div style={{
                        width: '24px',
                        height: '2px',
                        backgroundColor: '#C96A3A',
                        borderRadius: '1px',
                        margin: '0 auto 6px',
                    }} />
                    <p style={{
                        fontSize: '5.5px',
                        fontWeight: 600,
                        color: '#4A7A52',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontFamily: '"Inter", sans-serif',
                    }}>
                        {dateRange}
                    </p>
                </div>

                {/* Footer branding: identical to SharedQuotePreview */}
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
                        Move forward with intention.
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
