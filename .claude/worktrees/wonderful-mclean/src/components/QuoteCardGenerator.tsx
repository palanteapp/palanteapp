import type { Quote } from '../types';
import { Logo } from './Logo';

interface QuoteCardGeneratorProps {
    id: string;
    quote: Quote;
    isDarkMode: boolean;
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

export const QuoteCardGenerator = ({ id, quote }: QuoteCardGeneratorProps) => {
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

    // Modern art organic overlapping circles background
    const ModernArtBackground = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {/* Soft sage / mist green base */}
            <rect width="1080" height="1920" fill="#879582" />
            {/* Top left sage blob */}
            <circle cx="200" cy="300" r="550" fill="#9BAC98" opacity="0.9" />
            {/* Top right pale sand blob */}
            <circle cx="950" cy="400" r="500" fill="#E8DEC9" opacity="0.9" />
            {/* Middle right soft sage / tan blob */}
            <circle cx="850" cy="1100" r="600" fill="#D6B8A0" opacity="0.8" />
            {/* Bottom left deep warm sand blob */}
            <circle cx="300" cy="1500" r="650" fill="#C5AE91" opacity="0.9" />
            {/* Center soft fusion blob */}
            <circle cx="540" cy="960" r="450" fill="#E5D6C5" opacity="0.4" mixBlendMode="overlay" />
        </svg>
    );

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
            <ModernArtBackground />

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
                        <Logo style={{ width: '32px', height: '32px' }} variant="sage" color="#5A6351" />
                    </div>

                    {/* Quote text — modern font to match bold new look */}
                    <p style={{
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        fontSize,
                        lineHeight,
                        color: '#6F4E37', /* Coffee / deep sage color */
                        letterSpacing: '-0.02em',
                        marginBottom: isTierQuote ? '0px' : '48px',
                    }}>
                        {quote.text}
                    </p>

                    {/* Attribution */}
                    {!isTierQuote && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                            <div style={{ width: '40px', height: '2px', backgroundColor: '#B68D73', borderRadius: '1px' }} />
                            <p style={{
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 500,
                                fontSize: '26px',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: '#A0806B',
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
