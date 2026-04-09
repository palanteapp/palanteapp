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

    // SVG Blob Paths - recycled from generator
    const blob1 = "M45.7,-76.3C58.9,-69.3,69.1,-55.9,76.5,-41.8C83.9,-27.7,88.5,-12.9,86.6,1C84.7,14.9,76.3,27.9,67.1,39.6C57.9,51.3,47.9,61.7,35.9,68.5C23.9,75.3,10,78.5,-3.1,77.4C-16.2,76.3,-28.4,70.9,-40.5,63.9C-52.6,56.9,-64.6,48.3,-74.1,36.7C-83.6,25.1,-90.6,10.5,-89.2,-3.4C-87.8,-17.3,-78,-30.5,-67.2,-41.6C-56.4,-52.7,-44.6,-61.7,-32.1,-69.1C-19.6,-76.5,-6.4,-82.3,6.2,-81.4C18.8,-80.5,32.5,-83.3,45.7,-76.3Z";
    const blob2 = "M41.8,-73.4C54.6,-65.1,65.9,-54.6,74.7,-42.2C83.5,-29.8,89.9,-15.5,88.9,-1.4C88,12.7,79.7,26.6,70.1,38.6C60.5,50.6,49.6,60.7,37.3,67C25,73.3,11.3,75.8,-2.1,79.5C-15.5,83.1,-28.6,88,-40.4,84.7C-52.2,81.4,-62.7,69.9,-71.3,57.1C-79.9,44.3,-86.6,30.2,-87.3,15.6C-88,1,-82.7,-14.1,-74.9,-27.3C-67.1,-40.5,-56.8,-51.8,-45.3,-60.7C-33.8,-69.6,-21.1,-76.1,-7.2,-78.9C6.7,-81.7,13.4,-80.8,29,-81.7C44.6,-82.6,29,-81.7,41.8,-73.4Z";
    const blob3 = "M39.6,-66.3C52.1,-58.5,63.6,-50.1,72.4,-39.3C81.2,-28.5,87.3,-15.3,86.6,-1.9C85.9,11.5,78.5,25.1,69.4,37.4C60.3,49.7,49.5,60.7,37.2,68.4C24.9,76.1,11.1,80.5,-2.2,84.3C-15.5,88.1,-28.3,91.3,-40.5,86.8C-52.7,82.3,-64.3,70.1,-73.1,56.5C-81.9,42.9,-87.9,27.9,-87.4,12.5C-86.9,-2.9,-79.9,-18.7,-70.6,-31.8C-61.3,-44.9,-49.7,-55.3,-37.5,-63.3C-25.3,-71.3,-12.7,-76.9,0.5,-77.8C13.7,-78.7,27.1,-74.1,39.6,-66.3Z";

    return (
        <div
            className={`transition-shadow duration-300`}
            style={{
                aspectRatio: '9/16',
                maxHeight: 'min(356px, 60vh)', // Responsive height constraint
                width: 'min(200px, 80vw)',     // Restoring a compact preview width
                background: '#F5F0EB',
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
            {/* ORGANIC BLOBS (Original) */}
            <div style={{ position: 'absolute', top: '-30px', left: '-40px', width: '180px', height: '180px', opacity: 0.85, transform: 'rotate(15deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob1} fill="#8B9D83" />
                </svg>
            </div>

            <div style={{ position: 'absolute', top: '-25px', right: '-50px', width: '170px', height: '170px', opacity: 0.75, transform: 'rotate(-20deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob2} fill="#D4B896" />
                </svg>
            </div>

            <div style={{ position: 'absolute', top: '30%', right: '-60px', width: '160px', height: '160px', opacity: 0.7, transform: 'rotate(45deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob3} fill="#B89B9B" />
                </svg>
            </div>

            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '190px', height: '190px', opacity: 0.8, transform: 'rotate(120deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob2} fill="#6F7B6D" />
                </svg>
            </div>

            <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '160px', height: '160px', opacity: 0.7, transform: 'rotate(-45deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob1} fill="#C9A876" />
                </svg>
            </div>

            {/* Outline Accents */}
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: '50px', height: '50px', opacity: 0.3, transform: 'rotate(90deg)' }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <path d={blob3} fill="none" stroke="#8B4A4A" strokeWidth="1.5" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '15%', width: '33px', height: '33px', opacity: 0.3 }}>
                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                    <circle cx="0" cy="0" r="60" fill="none" stroke="#556054" strokeWidth="1.5" />
                </svg>
            </div>


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
                    backgroundColor: '#FFFFFF',
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
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        <Logo
                            style={{
                                height: '10px',
                                width: 'auto',
                                filter: 'brightness(0) saturate(100%) invert(46%) sepia(8%) saturate(1015%) hue-rotate(66deg) brightness(95%) contrast(88%)'
                            }}
                        />
                    </div>

                    {/* Quote */}
                    <p style={{
                        fontSize: quote.text.length > 100 ? '11px' : '14px',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color: '#8B4A4A',
                        marginBottom: isTierQuote ? '3px' : '8px',
                        letterSpacing: '-0.02em',
                        fontFamily: 'Georgia, serif'
                    }}>
                        {quote.text}
                    </p>

                    {/* Author */}
                    {!isTierQuote && (
                        <p style={{
                            fontSize: '8px',
                            fontWeight: 500,
                            color: '#8B4A4A',
                            letterSpacing: '0.02em',
                            opacity: 0.7,
                            fontStyle: 'italic',
                            fontFamily: 'Georgia, serif'
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
                        color: '#556054',
                        whiteSpace: 'nowrap'
                    }}>
                        PERSONALIZED MOTIVATION, DELIVERED DAILY
                    </p>
                    <p style={{
                        fontSize: '7px',
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

