import React from 'react';
import { Logo } from './Logo';

interface ReflectionCardGeneratorProps {
    id: string;
    date: string;
    highlight: string;
    midpoint: string;
    lowlight: string;
    energyLevel?: number;
}

export const ReflectionCardGenerator: React.FC<ReflectionCardGeneratorProps> = ({
    id,
    date,
    highlight,
    midpoint,
    lowlight,
    energyLevel
}) => {
    // SVG Blob Paths (Identical to QuoteCardGenerator for brand consistency)
    const blob1 = "M45.7,-76.3C58.9,-69.3,69.1,-55.9,76.5,-41.8C83.9,-27.7,88.5,-12.9,86.6,1C84.7,14.9,76.3,27.9,67.1,39.6C57.9,51.3,47.9,61.7,35.9,68.5C23.9,75.3,10,78.5,-3.1,77.4C-16.2,76.3,-28.4,70.9,-40.5,63.9C-52.6,56.9,-64.6,48.3,-74.1,36.7C-83.6,25.1,-90.6,10.5,-89.2,-3.4C-87.8,-17.3,-78,-30.5,-67.2,-41.6C-56.4,-52.7,-44.6,-61.7,-32.1,-69.1C-19.6,-76.5,-6.4,-82.3,6.2,-81.4C18.8,-80.5,32.5,-83.3,45.7,-76.3Z";
    const blob2 = "M41.8,-73.4C54.6,-65.1,65.9,-54.6,74.7,-42.2C83.5,-29.8,89.9,-15.5,88.9,-1.4C88,12.7,79.7,26.6,70.1,38.6C60.5,50.6,49.6,60.7,37.3,67C25,73.3,11.3,75.8,-2.1,79.5C-15.5,83.1,-28.6,88,-40.4,84.7C-52.2,81.4,-62.7,69.9,-71.3,57.1C-79.9,44.3,-86.6,30.2,-87.3,15.6C-88,1,-82.7,-14.1,-74.9,-27.3C-67.1,-40.5,-56.8,-51.8,-45.3,-60.7C-33.8,-69.6,-21.1,-76.1,-7.2,-78.9C6.7,-81.7,13.4,-80.8,29,-81.7C44.6,-82.6,29,-81.7,41.8,-73.4Z";
    const blob3 = "M39.6,-66.3C52.1,-58.5,63.6,-50.1,72.4,-39.3C81.2,-28.5,87.3,-15.3,86.6,-1.9C85.9,11.5,78.5,25.1,69.4,37.4C60.3,49.7,49.5,60.7,37.2,68.4C24.9,76.1,11.1,80.5,-2.2,84.3C-15.5,88.1,-28.3,91.3,-40.5,86.8C-52.7,82.3,-64.3,70.1,-73.1,56.5C-81.9,42.9,-87.9,27.9,-87.4,12.5C-86.9,-2.9,-79.9,-18.7,-70.6,-31.8C-61.3,-44.9,-49.7,-55.3,-37.5,-63.3C-25.3,-71.3,-12.7,-76.9,0.5,-77.8C13.7,-78.7,27.1,-74.1,39.6,-66.3Z";

    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
                background: '#F5F0EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
        >
            {/* Background Blobs - Scaled up for 1080x1920 */}
            <div style={{ position: 'absolute', top: '-150px', left: '-200px', width: '900px', height: '900px', opacity: 0.85, transform: 'rotate(15deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob1} fill="#8B9D83" />
                </svg>
            </div>
            <div style={{ position: 'absolute', top: '-100px', right: '-250px', width: '850px', height: '850px', opacity: 0.75, transform: 'rotate(-20deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob2} fill="#D4B896" />
                </svg>
            </div>
            <div style={{ position: 'absolute', top: '30%', right: '-300px', width: '800px', height: '800px', opacity: 0.7, transform: 'rotate(45deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob3} fill="#B89B9B" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '-200px', left: '-200px', width: '950px', height: '950px', opacity: 0.8, transform: 'rotate(120deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob2} fill="#6F7B6D" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '800px', height: '800px', opacity: 0.7, transform: 'rotate(-45deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob1} fill="#C9A876" />
                </svg>
            </div>

            {/* Reflection Content Container */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '850px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '60px'
            }}>
                {/* Brand Logo Accent */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    marginBottom: '-30px',
                    zIndex: 20
                }}>
                    <Logo
                        style={{ height: '50px', width: 'auto' }}
                        color="#E5D6A7"
                    />
                </div>

                {/* Main Content Card */}
                <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '60px',
                    padding: '80px 60px 60px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.08)',
                    border: '2px solid rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px'
                }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8B4A4A', opacity: 0.4 }}>
                        - DAILY REFLECTION -
                    </h2>

                    {energyLevel && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '-20px',
                            marginTop: '-20px'
                        }}>
                            <span style={{ fontSize: '24px' }}>⚡️</span>
                            <span style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                color: '#556054',
                                opacity: 0.6
                            }}>
                                Energy: {energyLevel}/5
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
                        <div>
                            <p style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', color: '#8B9D83', letterSpacing: '0.15em', marginBottom: '10px' }}>Win</p>
                            <p style={{ fontSize: '48px', fontWeight: 600, color: '#8B4A4A', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{highlight}</p>
                        </div>
                        <div style={{ height: '2px', background: 'rgba(139, 74, 74, 0.05)' }} />
                        <div>
                            <p style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', color: '#D4B896', letterSpacing: '0.15em', marginBottom: '10px' }}>Growth</p>
                            <p style={{ fontSize: '48px', fontWeight: 600, color: '#8B4A4A', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{midpoint}</p>
                        </div>
                        <div style={{ height: '2px', background: 'rgba(139, 74, 74, 0.05)' }} />
                        <div>
                            <p style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', color: '#B89B9B', letterSpacing: '0.15em', marginBottom: '10px' }}>Focus</p>
                            <p style={{ fontSize: '48px', fontWeight: 600, color: '#8B4A4A', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{lowlight}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#8B4A4A', opacity: 0.6, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                            {formattedDate}
                        </p>
                    </div>
                </div>

                {/* Footer Branding */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', color: '#556054' }}>
                    <p style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                        PERSONALIZED MOTIVATION, DELIVERED DAILY
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '0.2em' }}>
                        @PALANTE.APP
                    </p>
                </div>
            </div>
        </div>
    );
};
