import React from 'react';
import { Logo } from './Logo';

interface SharedReflectionPreviewProps {
    date: string;
    highlight: string;
    midpoint: string;
    lowlight: string;
    isDarkMode: boolean;
    energyLevel?: number;
}

export const SharedReflectionPreview: React.FC<SharedReflectionPreviewProps> = ({
    date,
    highlight,
    midpoint,
    lowlight,
    isDarkMode,
    energyLevel
}) => {
    // SVG Blob Paths - recycled from SharedQuotePreview
    const blob1 = "M45.7,-76.3C58.9,-69.3,69.1,-55.9,76.5,-41.8C83.9,-27.7,88.5,-12.9,86.6,1C84.7,14.9,76.3,27.9,67.1,39.6C57.9,51.3,47.9,61.7,35.9,68.5C23.9,75.3,10,78.5,-3.1,77.4C-16.2,76.3,-28.4,70.9,-40.5,63.9C-52.6,56.9,-64.6,48.3,-74.1,36.7C-83.6,25.1,-90.6,10.5,-89.2,-3.4C-87.8,-17.3,-78,-30.5,-67.2,-41.6C-56.4,-52.7,-44.6,-61.7,-32.1,-69.1C-19.6,-76.5,-6.4,-82.3,6.2,-81.4C18.8,-80.5,32.5,-83.3,45.7,-76.3Z";
    const blob2 = "M41.8,-73.4C54.6,-65.1,65.9,-54.6,74.7,-42.2C83.5,-29.8,89.9,-15.5,88.9,-1.4C88,12.7,79.7,26.6,70.1,38.6C60.5,50.6,49.6,60.7,37.3,67C25,73.3,11.3,75.8,-2.1,79.5C-15.5,83.1,-28.6,88,-40.4,84.7C-52.2,81.4,-62.7,69.9,-71.3,57.1C-79.9,44.3,-86.6,30.2,-87.3,15.6C-88,1,-82.7,-14.1,-74.9,-27.3C-67.1,-40.5,-56.8,-51.8,-45.3,-60.7C-33.8,-69.6,-21.1,-76.1,-7.2,-78.9C6.7,-81.7,13.4,-80.8,29,-81.7C44.6,-82.6,29,-81.7,41.8,-73.4Z";


    const formattedDate = new Date(date).toLocaleDateString();

    return (
        <div
            className={`transition-shadow duration-300 ${isDarkMode ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]' : 'shadow-xl'}`}
            style={{
                aspectRatio: '9/16',
                maxHeight: '320px',
                width: '180px',
                background: '#F5F0EB',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                margin: '0 auto 16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {/* Organic Background Blobs */}
            <div style={{ position: 'absolute', top: '-25px', left: '-33px', width: '150px', height: '150px', opacity: 0.85, transform: 'rotate(15deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob1} fill="#8B9D83" />
                </svg>
            </div>
            <div style={{ position: 'absolute', top: '-16px', right: '-41px', width: '141px', height: '141px', opacity: 0.75, transform: 'rotate(-20deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob2} fill="#D4B896" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '-33px', left: '-33px', width: '158px', height: '158px', opacity: 0.8, transform: 'rotate(120deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob2} fill="#6F7B6D" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '-25px', right: '-25px', width: '133px', height: '133px', opacity: 0.7, transform: 'rotate(-45deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob1} fill="#C9A876" />
                </svg>
            </div>

            {/* CARD CONTAINER */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '142px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}>
                {/* White Card */}
                <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '12px 10px 10px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative',
                    border: '1px solid rgba(0,0,0,0.02)'
                }}>
                    {/* Badge at Top */}
                    <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <Logo
                            style={{
                                height: '8px',
                                width: 'auto',
                                opacity: 0.8,
                                color: '#E5D6A7'
                            }}
                            color="#E5D6A7"
                        />
                    </div>

                    <h4 style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8B4A4A', opacity: 0.5, marginBottom: '6px', paddingTop: '4px' }}>
                        Daily Reflection — {formattedDate}
                    </h4>

                    {energyLevel && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            marginBottom: '6px'
                        }}>
                            <span style={{ fontSize: '6px' }}>⚡️</span>
                            <span style={{ fontSize: '5px', fontWeight: 700, textTransform: 'uppercase', color: '#556054', opacity: 0.6 }}>
                                Energy: {energyLevel}/5
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <div>
                            <p style={{ fontSize: '5px', fontWeight: 800, textTransform: 'uppercase', color: '#8B9D83', letterSpacing: '0.1em', marginBottom: '1px' }}>Win</p>
                            <p style={{ fontSize: '7px', fontWeight: 600, color: '#8B4A4A', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>{highlight}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '5px', fontWeight: 800, textTransform: 'uppercase', color: '#D4B896', letterSpacing: '0.1em', marginBottom: '1px' }}>Growth</p>
                            <p style={{ fontSize: '7px', fontWeight: 600, color: '#8B4A4A', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>{midpoint}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '5px', fontWeight: 800, textTransform: 'uppercase', color: '#B89B9B', letterSpacing: '0.1em', marginBottom: '1px' }}>Focus</p>
                            <p style={{ fontSize: '7px', fontWeight: 600, color: '#8B4A4A', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>{lowlight}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Branding */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                }}>
                    <p style={{
                        fontSize: '3px',
                        fontWeight: 700,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#556054',
                        whiteSpace: 'nowrap'
                    }}>
                        PERSONALIZED MOTIVATION, DELIVERED DAILY
                    </p>
                    <p style={{
                        fontSize: '5px',
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#556054'
                    }}>
                        @PALANTE.APP
                    </p>
                </div>
            </div>
        </div>
    );
};
