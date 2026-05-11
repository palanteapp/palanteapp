import React from 'react';

interface SkeletonQuoteCardProps {
    isDarkMode: boolean;
}

export const SkeletonQuoteCard: React.FC<SkeletonQuoteCardProps> = ({ isDarkMode }) => {
    const outerBg = isDarkMode
        ? 'radial-gradient(ellipse at 20% 15%, rgba(87,99,85,0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(201,106,58,0.2) 0%, transparent 55%), #3A3D2E'
        : 'radial-gradient(ellipse at 20% 15%, rgba(139,157,131,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(201,106,58,0.18) 0%, transparent 55%), #FAF7F3';

    const cardBg = isDarkMode ? '#241A12' : 'rgba(255, 253, 250, 0.97)';
    const cardBorder = isDarkMode ? 'rgba(180, 160, 100, 0.2)' : 'rgba(212, 184, 130, 0.5)';
    const lineColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const dividerColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    return (
        <div className="w-full">
            <div
                className="relative w-full overflow-hidden rounded-3xl"
                style={{ background: outerBg, padding: '32px 16px' }}
            >
                {/* Grain overlay */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />

                <div
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        backgroundColor: cardBg,
                        borderRadius: '20px',
                        border: `1px solid ${cardBorder}`,
                        boxShadow: `0 0 0 1px rgba(255,255,255,0.6) inset, 0 24px 60px -12px rgba(80, 40, 10, 0.18)`,
                        padding: '36px 28px 22px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Skeleton quote lines */}
                    <div className="flex flex-col gap-3 mb-6 animate-pulse">
                        <div style={{ height: '20px', borderRadius: '6px', backgroundColor: lineColor, width: '90%' }} />
                        <div style={{ height: '20px', borderRadius: '6px', backgroundColor: lineColor, width: '100%' }} />
                        <div style={{ height: '20px', borderRadius: '6px', backgroundColor: lineColor, width: '75%' }} />
                    </div>

                    {/* Skeleton author */}
                    <div className="mb-5 animate-pulse">
                        <div style={{ width: '32px', height: '2px', backgroundColor: 'rgba(201,106,58,0.25)', marginBottom: '10px', borderRadius: '1px' }} />
                        <div style={{ height: '14px', borderRadius: '6px', backgroundColor: lineColor, width: '30%' }} />
                    </div>

                    {/* Skeleton buttons */}
                    <div
                        style={{ borderTop: `1px solid ${dividerColor}`, paddingTop: '16px' }}
                        className="flex items-center justify-center gap-4 animate-pulse"
                    >
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: lineColor }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
