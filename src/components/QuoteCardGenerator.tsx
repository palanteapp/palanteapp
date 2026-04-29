import type { Quote } from '../types';
import { Logo } from './Logo';

interface QuoteCardGeneratorProps {
    id: string;
    quote: Quote;
    isDarkMode: boolean;
    seed?: string;
}

// Adaptive font size for 1080px card inner box
function getShareFontSize(len: number): string {
    if (len > 200) return '42px';
    if (len > 160) return '48px';
    if (len > 120) return '54px';
    if (len > 80)  return '64px';
    if (len > 50)  return '76px';
    return '84px';
}

export const QuoteCardGenerator = ({ id, quote, seed }: QuoteCardGeneratorProps) => {
    const isTierQuote =
        quote.author === 'Muse' ||
        quote.author === 'Focus' ||
        quote.author === 'Fire' ||
        quote.author === 'Palante Coach' ||
        quote.isAI;

    // Use a very premium deep sage as the absolute base color
    const baseColor = '#5A6351';
    
    const fontSize   = getShareFontSize(quote.text.length);
    const lineHeight = quote.text.length > 120 ? 1.45 : 1.35;

    const DynamicArtBackground = ({ seed: internalSeed }: { seed: string }) => {
        // Deterministic random from string seed
        const getRand = (s: string, i: number) => {
            let hash = 0;
            for (let j = 0; j < s.length; j++) hash = ((hash << 5) - hash) + s.charCodeAt(j);
            const x = Math.sin(hash + i) * 10000;
            return x - Math.floor(x);
        };

        const colors = ['#F59E0B', '#FCD34D', '#FF8A65', '#4FD1C5', '#F472B6'];
        
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <rect width="1080" height="1920" fill={colors[Math.floor(getRand(internalSeed, 0) * colors.length)]} opacity="0.8" />
                
                {/* Organic Artistic Blobs */}
                {[1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const cx = 100 + getRand(internalSeed, i * 10) * 880;
                    const cy = 100 + getRand(internalSeed, i * 20) * 1720;
                    const r = 400 + getRand(internalSeed, i * 30) * 600;
                    const color = colors[Math.floor(getRand(internalSeed, i * 40) * colors.length)];
                    const opacity = 0.3 + getRand(internalSeed, i * 50) * 0.4;
                    
                    return (
                        <circle 
                            key={i} 
                            cx={cx} cy={cy} r={r} 
                            fill={color} 
                            opacity={opacity} 
                            style={{ mixBlendMode: 'multiply' }}
                        />
                    );
                })}
            </svg>
        );
    };

    const finalSeed = seed || `${quote.id}-${new Date().toLocaleDateString()}`;

    return (
        <div
            id={id}
            style={{
                width: '1080px',
                height: '1920px',
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                zIndex: -1,
                overflow: 'hidden',
                backgroundColor: baseColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Background art */}
            <DynamicArtBackground seed={finalSeed} />

            {/* Noise grain overlay for texture */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
            }} />

            {/* ── Foreground Content ── */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                
                {/* Spacer to push content down to center visually */}
                <div style={{ flex: 1 }} />

                {/* The central off-white quote box */}
                <div style={{
                    position: 'relative',
                    margin: '0 100px',
                    backgroundColor: '#FDFBF7',
                    borderRadius: '48px',
                    padding: '120px 80px',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}>
                    {/* Top Logo Badge (overlapping the box) */}
                    <div style={{
                        position: 'absolute',
                        top: '-36px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '72px',
                        height: '72px',
                        borderRadius: '36px',
                        backgroundColor: '#FDFBF7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                    }}>
                        <Logo style={{ width: '32px', height: '32px', objectFit: 'contain', display: 'block' }} variant="sage" color="#879582" />
                    </div>

                    {/* Quote text — modern font to match bold new look */}
                    <p style={{
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        fontSize,
                        lineHeight,
                        color: '#2D3E33', /* Deep Forest Green */
                        letterSpacing: '-0.02em',
                        marginBottom: isTierQuote ? '0px' : '48px',
                    }}>
                        {quote.text}
                    </p>

                    {/* Attribution */}
                    {!isTierQuote && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                            <div style={{ width: '40px', height: '2px', backgroundColor: '#879582', opacity: 0.4, borderRadius: '1px' }} />
                            <p style={{
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 500,
                                fontSize: '26px',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: '#879582', /* Soft Sage */
                            }}>
                                {quote.author}
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {/* ── Share footer ── */}
                    <div style={{
                        padding: '0 80px 80px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'center'
                    }}>
                        <span style={{
                            fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '18px',
                            letterSpacing: '0.15em', color: 'rgba(40,50,40,0.6)',
                            textTransform: 'uppercase'
                        }}>
                            Personalized Motivation, Delivered Daily
                        </span>
                        <span style={{
                            fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: '24px',
                            letterSpacing: '0.15em', color: 'rgba(40,50,40,0.8)',
                            textTransform: 'uppercase'
                        }}>
                            @palante.app
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};
