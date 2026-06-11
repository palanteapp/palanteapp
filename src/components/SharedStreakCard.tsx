import React from 'react';
import { MandalaOnlySVG } from './GardenDemoFinal';

interface SharedStreakCardProps {
    streak: number;
    totalPractices: number;
    colorCycle?: number;
    firstName?: string;
}

// Palette bg colors per cycle — matches GardenDemoFinal
const BG_COLORS = [
    { bg0: '#1A3320', bg1: '#243D2A', T: '#C96A3A', G: '#E5D6A7', S: '#415D43' },
    { bg0: '#12103A', bg1: '#1A1B42', T: '#6B4FBB', G: '#C5C0F0', S: '#2D3E6B' },
    { bg0: '#2A1E04', bg1: '#2C220A', T: '#C89030', G: '#F5E8B0', S: '#5C4A10' },
    { bg0: '#2A0A14', bg1: '#2C101A', T: '#C95080', G: '#F0C8D8', S: '#6B2A3A' },
] as const;

export const SharedStreakCard: React.FC<SharedStreakCardProps> = ({
    streak,
    totalPractices,
    colorCycle = 0,
    firstName,
}) => {
    const pal = BG_COLORS[colorCycle % BG_COLORS.length];
    const cycle = Math.floor(totalPractices / 90);
    const petalsEarned = totalPractices > 0 && totalPractices % 90 === 0 ? 90 : totalPractices % 90;
    const remaining = 90 - petalsEarned;

    const streakLabel = streak === 1 ? '1 day' : `${streak} days`;
    const progressLine = `${petalsEarned} petal${petalsEarned !== 1 ? 's' : ''} earned · ${remaining} to full bloom${cycle > 0 ? ` · cycle ${cycle + 1}` : ''}`;

    return (
        // NOTE: explicit px dimensions — html2canvas requires fixed sizes
        <div id="streak-share-card" style={{
            width: '200px',
            height: '356px',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            backgroundColor: pal.bg0,
        }}>
            {/* Ambient glow behind mandala */}
            <div style={{
                position: 'absolute',
                top: 62, left: 0, right: 0, height: 196,
                background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${pal.T}28 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* ── Streak badge ──────────────────────────── */}
            <div style={{
                position: 'absolute',
                top: 10, left: 24, right: 24,
                height: 48,
                backgroundColor: pal.T,
                borderRadius: 11,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
            }}>
                <span style={{
                    fontSize: 7,
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    color: 'rgba(253,251,247,0.82)',
                    letterSpacing: '1.8px',
                    textTransform: 'uppercase',
                }}>Current Streak</span>
                <span style={{
                    fontSize: 20,
                    fontWeight: 800,
                    fontFamily: 'Poppins, sans-serif',
                    color: '#FDFBF7',
                    lineHeight: 1,
                }}>{streakLabel}</span>
            </div>

            {/* ── Real mandala SVG ─────────────────────── */}
            <div style={{
                position: 'absolute',
                top: 62, left: 0, right: 0, height: 196,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <MandalaOnlySVG
                    isDarkMode={true}
                    completedDays={petalsEarned}
                    colorCycle={colorCycle}
                />
            </div>

            {/* ── Info panel ────────────────────────────── */}
            <div style={{
                position: 'absolute',
                bottom: 10, left: 14, right: 14,
                backgroundColor: pal.bg1,
                borderRadius: 10,
                padding: '9px 12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
            }}>
                <span style={{
                    fontSize: 6,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    color: pal.G,
                    opacity: 0.88,
                    textAlign: 'center',
                    lineHeight: 1.3,
                }}>{progressLine}</span>

                {firstName && (
                    <span style={{
                        fontSize: 5.5,
                        fontFamily: 'Inter, sans-serif',
                        color: pal.G,
                        opacity: 0.5,
                    }}>{firstName}'s garden</span>
                )}

                <div style={{ width: '80%', height: 0.5, backgroundColor: pal.G, opacity: 0.2 }} />

                <span style={{
                    fontSize: 7,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    color: pal.T,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                }}>Palante.app</span>

                <span style={{
                    fontSize: 4.5,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    color: pal.S,
                    opacity: 0.7,
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                }}>Forward, Together — Every Single Day</span>
            </div>
        </div>
    );
};
