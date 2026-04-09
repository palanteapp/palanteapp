import { useState } from 'react';
import { Share2, Heart, Clock, Settings, RefreshCw } from 'lucide-react';
import type { Quote } from '../types';
import { QuoteCardGenerator } from './QuoteCardGenerator';
import { ShareModal } from './ShareModal';
import html2canvas from 'html2canvas';

interface DashboardQuoteCardProps {
    quote: Quote;
    isDarkMode: boolean;
    isFavorited?: boolean;
    onToggleFavorite?: () => void;
    onOpenHistory?: () => void;
    onOpenSettings?: () => void;
    onRefresh?: () => void;
}

export const DashboardQuoteCard: React.FC<DashboardQuoteCardProps> = ({
    quote,
    isDarkMode,
    isFavorited,
    onToggleFavorite,
    onOpenHistory,
    onOpenSettings,
    onRefresh
}) => {
    console.log(`[DashboardQuoteCard Render] isFavorited prop: ${isFavorited}, Quote ID: ${quote.id}`);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const MAX_REFRESHES = 3;

    // Get today's date key for localStorage
    const getTodayKey = () => {
        const today = new Date();
        return `quote_refresh_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    };

    // Initialize refresh count from localStorage
    const getRefreshCount = (): number => {
        try {
            const stored = localStorage.getItem(getTodayKey());
            return stored ? parseInt(stored, 10) : 0;
        } catch {
            return 0;
        }
    };

    const [refreshCount, setRefreshCount] = useState(getRefreshCount());

    // Update localStorage when count changes
    const incrementRefreshCount = () => {
        const newCount = refreshCount + 1;
        setRefreshCount(newCount);
        try {
            localStorage.setItem(getTodayKey(), newCount.toString());
        } catch (e) {
            console.error('Failed to save refresh count:', e);
        }
    };



    // Check if quote is from a tier
    // Check if quote is from a tier or is AI/Palante Coach
    const isTierQuote = quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire' || quote.author === 'Palante Coach' || quote.isAI;


    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            // Small delay to let React render the hidden generator if needed
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = document.getElementById('dashboard-quote-share-generator');

            if (element) {
                // Ensure usage of CORS and logging
                const canvas = await html2canvas(element, {
                    scale: 2, // Higher quality
                    backgroundColor: null,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    // Fix for some iOS rendering issues
                    onclone: (doc) => {
                        const el = doc.getElementById('dashboard-quote-share-generator');
                        if (el) {
                            el.style.opacity = '1';
                            el.style.visibility = 'visible';
                        }
                    }
                });

                const image = canvas.toDataURL('image/png');

                // Use Capacitor Share
                try {
                    // Dynamic import to avoid SSR issues if any (though this is SPA)
                    const { Share } = await import('@capacitor/share');
                    const { Directory, Filesystem } = await import('@capacitor/filesystem');

                    // Write file to cache
                    const fileName = `palante_quote_${Date.now()}.png`;

                    try {
                        const savedFile = await Filesystem.writeFile({
                            path: fileName,
                            data: image.split(',')[1],
                            directory: Directory.Cache
                        });

                        await Share.share({
                            title: 'Inspiration from Palante',
                            text: isTierQuote ? `"${quote.text}"\n\n- @palante.app` : `"${quote.text}" - ${quote.author}\n\n- @palante.app`,
                            url: savedFile.uri, // Share the local file URI
                        });

                    } catch (fsError) {
                        alert('Filesystem/Share Error: ' + JSON.stringify(fsError));
                        console.error('FS Error', fsError);
                        throw fsError;
                    }

                    setIsGeneratingImage(false);
                    return;

                } catch (capacitorError) {
                    alert('Plugin Error: ' + capacitorError);
                    console.log('Capacitor share failed, trying fallback...', capacitorError);
                }

                // Fallback for Web
                if ('share' in navigator) {
                    // ... existing fallback code ...
                    // alert('Falling back to Web Share (might fail on images)');
                }

                // Final Fallback
                const link = document.createElement('a');
                link.href = image;
                link.download = `palante_quote_${Date.now()}.png`;
                link.click();

            } else {
                console.error('Error: Generator element not found in DOM');
            }
        } catch (error) {
            console.error('Error generating image:', error);

            // FALLBACK TO TEXT SHARE (Silent Auto-Fallback)
            try {
                // Determine text based on type
                const isTierQuote = quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire';
                const shareText = isTierQuote
                    ? `"${quote.text}"\n\n- @palante.app`
                    : `"${quote.text}" - ${quote.author}\n\n- @palante.app`;

                // Try Capacitor Share with text only
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Inspiration from Palante',
                    text: shareText
                });
            } catch (fallbackError) {
                // Silent fail or minimal log
                console.error('Share Failed Completely', fallbackError);
            }

        } finally {
            setIsGeneratingImage(false);
        }
    };

    // SVG Blob Paths - matching QuoteCardGenerator
    const blob1 = "M45.7,-76.3C58.9,-69.3,69.1,-55.9,76.5,-41.8C83.9,-27.7,88.5,-12.9,86.6,1C84.7,14.9,76.3,27.9,67.1,39.6C57.9,51.3,47.9,61.7,35.9,68.5C23.9,75.3,10,78.5,-3.1,77.4C-16.2,76.3,-28.4,70.9,-40.5,63.9C-52.6,56.9,-64.6,48.3,-74.1,36.7C-83.6,25.1,-90.6,10.5,-89.2,-3.4C-87.8,-17.3,-78,-30.5,-67.2,-41.6C-56.4,-52.7,-44.6,-61.7,-32.1,-69.1C-19.6,-76.5,-6.4,-82.3,6.2,-81.4C18.8,-80.5,32.5,-83.3,45.7,-76.3Z";
    const blob2 = "M41.8,-73.4C54.6,-65.1,65.9,-54.6,74.7,-42.2C83.5,-29.8,89.9,-15.5,88.9,-1.4C88,12.7,79.7,26.6,70.1,38.6C60.5,50.6,49.6,60.7,37.3,67C25,73.3,11.3,75.8,-2.1,79.5C-15.5,83.1,-28.6,88,-40.4,84.7C-52.2,81.4,-62.7,69.9,-71.3,57.1C-79.9,44.3,-86.6,30.2,-87.3,15.6C-88,1,-82.7,-14.1,-74.9,-27.3C-67.1,-40.5,-56.8,-51.8,-45.3,-60.7C-33.8,-69.6,-21.1,-76.1,-7.2,-78.9C6.7,-81.7,13.4,-80.8,29,-81.7C44.6,-82.6,29,-81.7,41.8,-73.4Z";
    const blob3 = "M39.6,-66.3C52.1,-58.5,63.6,-50.1,72.4,-39.3C81.2,-28.5,87.3,-15.3,86.6,-1.9C85.9,11.5,78.5,25.1,69.4,37.4C60.3,49.7,49.5,60.7,37.2,68.4C24.9,76.1,11.1,80.5,-2.2,84.3C-15.5,88.1,-28.3,91.3,-40.5,86.8C-52.7,82.3,-64.3,70.1,-73.1,56.5C-81.9,42.9,-87.9,27.9,-87.4,12.5C-86.9,-2.9,-79.9,-18.7,-70.6,-31.8C-61.3,-44.9,-49.7,-55.3,-37.5,-63.3C-25.3,-71.3,-12.7,-76.9,0.5,-77.8C13.7,-78.7,27.1,-74.1,39.6,-66.3Z";

    return (
        <>
            {/* 1. HIDDEN GENERATOR FOR PRESERVING LEGACY SHARE CARD */}
            {/* Kept in viewport but hidden via opacity/z-index to ensure html2canvas can render it */}
            {/* 1. HIDDEN GENERATOR FOR PRESERVING LEGACY SHARE CARD */}
            {/* Render ONLY when sharing to prevent GPU crashes */}
            {isGeneratingImage && (
                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <QuoteCardGenerator id="dashboard-quote-share-generator" quote={quote} isDarkMode={isDarkMode} />
                </div>
            )}

            {/* 2. VISIBLE DASHBOARD CARD - Instagram Style with Organic Blobs */}
            <div className="w-full">
                {/* Blob Background Card */}
                <div
                    className="relative w-full overflow-hidden rounded-3xl"
                    style={{
                        background: '#F5F0EB',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        padding: '60px 20px',
                        boxShadow: '0 25px 70px -15px rgba(0,0,0,0.2), 0 15px 40px -10px rgba(0,0,0,0.15)'
                    }}
                >
                    {/* Organic Background Shapes (SVG Blobs) - ANIMATED */}
                    {true && (
                        <>
                            {/* Top Left - Sage */}
                            <div style={{ position: 'absolute', top: '-50px', left: '-80px', width: '300px', height: '300px', opacity: 0.85, transform: 'rotate(15deg)' }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <path d={blob1} fill="#8B9D83" />
                                </svg>
                            </div>

                            {/* Top Right - Gold */}
                            <div style={{ position: 'absolute', top: '-35px', right: '-85px', width: '280px', height: '280px', opacity: 0.75, transform: 'rotate(-20deg)' }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <path d={blob2} fill="#D4B896" />
                                </svg>
                            </div>

                            {/* Middle Right - Dusty Rose */}
                            <div style={{ position: 'absolute', top: '30%', right: '-100px', width: '265px', height: '265px', opacity: 0.7, transform: 'rotate(45deg)' }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <path d={blob3} fill="#B89B9B" />
                                </svg>
                            </div>

                            {/* Bottom Left - Deep Sage */}
                            <div style={{ position: 'absolute', bottom: '-70px', left: '-70px', width: '315px', height: '315px', opacity: 0.8, transform: 'rotate(120deg)' }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <path d={blob2} fill="#6F7B6D" />
                                </svg>
                            </div>

                            {/* Bottom Right - Warm Tan */}
                            <div style={{ position: 'absolute', bottom: '-70px', right: '-70px', width: '300px', height: '300px', opacity: 0.7, transform: 'rotate(-45deg)' }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <path d={blob1} fill="#C9A876" />
                                </svg>
                            </div>

                            {/* Outline Accents */}
                            <div style={{ position: 'absolute', top: '20%', left: '15%', width: '100px', height: '100px', opacity: 0.3, transform: 'rotate(90deg)' }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <path d={blob3} fill="none" stroke="#8B4A4A" strokeWidth="1.5" />
                                </svg>
                            </div>
                            <div style={{ position: 'absolute', bottom: '25%', right: '15%', width: '65px', height: '65px', opacity: 0.3 }}>
                                <svg viewBox="-100 -100 200 200" width="100%" height="100%">
                                    <circle cx="0" cy="0" r="60" fill="none" stroke="#556054" strokeWidth="1.5" />
                                </svg>
                            </div>
                        </>
                    )}

                    {/* Centered White Quote Card */}
                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* White Quote Card with Buttons Inside */}
                        <div style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '30px',
                            padding: '40px 35px 25px',
                            width: '100%',
                            textAlign: 'center',
                            position: 'relative',
                            border: '1px solid rgba(0,0,0,0.02)',
                            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15), 0 10px 30px -5px rgba(0,0,0,0.1)'
                        }}>
                            {/* Quote Text */}
                            <p style={{
                                fontSize: quote.text.length > 100 ? '22px' : '26px',
                                fontWeight: 700,
                                lineHeight: 1.3,
                                color: '#8B4A4A',
                                marginBottom: isTierQuote ? '5px' : '20px',
                                letterSpacing: '-0.02em',
                                fontFamily: 'Georgia, serif'
                            }}>
                                {quote.text}
                            </p>

                            {/* Author */}
                            {!isTierQuote && (
                                <p style={{
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    color: '#8B4A4A',
                                    letterSpacing: '0.02em',
                                    opacity: 0.7,
                                    fontStyle: 'italic',
                                    fontFamily: 'Georgia, serif',
                                    marginBottom: '25px'
                                }}>
                                    — {quote.author}
                                </p>
                            )}

                            {/* Action Buttons - Inside Card with Golden Accent */}
                            <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
                                {/* Heart */}
                                {onToggleFavorite && (
                                    <button
                                        onClick={() => {
                                            console.log('Heart button clicked');
                                            if (onToggleFavorite) {
                                                console.log('Calling onToggleFavorite');
                                                onToggleFavorite();
                                            } else {
                                                console.error('onToggleFavorite is undefined');
                                            }
                                        }}
                                        className={`p-3 rounded-full transition-all duration-300 ${isFavorited
                                            ? 'text-rose-500 bg-rose-500/10 shadow-inner'
                                            : 'text-[#D4B896] hover:text-[#C9A876] hover:bg-[#D4B896]/10'
                                            }`}
                                        aria-label={isFavorited ? "Unfavorite" : "Favorite"}
                                    >
                                        <Heart size={20} fill={isFavorited ? "currentColor" : "none"} strokeWidth={1.5} />
                                    </button>
                                )}

                                {/* History / Clock */}
                                {onOpenHistory && (
                                    <button
                                        onClick={onOpenHistory}
                                        className="p-3 rounded-full transition-all duration-300 text-[#D4B896] hover:text-[#C9A876] hover:bg-[#D4B896]/10"
                                        aria-label="View History"
                                    >
                                        <Clock size={20} strokeWidth={1.5} />
                                    </button>
                                )}

                                {/* Share */}
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    disabled={isGeneratingImage}
                                    className={`p-3 rounded-full transition-all duration-300 text-[#D4B896] hover:text-[#C9A876] hover:bg-[#D4B896]/10 ${isGeneratingImage ? 'opacity-50 animate-pulse' : ''}`}
                                    aria-label="Share"
                                >
                                    <Share2 size={20} strokeWidth={1.5} />
                                </button>

                                {/* Refresh / New Card */}
                                {onRefresh && (
                                    <button
                                        onClick={() => {
                                            if (refreshCount < MAX_REFRESHES) {
                                                // Haptic feedback
                                                import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());
                                                incrementRefreshCount();
                                                onRefresh();
                                            }
                                        }}
                                        disabled={refreshCount >= MAX_REFRESHES}
                                        className={`p-3 rounded-full transition-all duration-300 relative ${refreshCount >= MAX_REFRESHES
                                            ? 'text-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                                            : 'text-[#D4B896] hover:text-[#C9A876] hover:bg-[#D4B896]/10'
                                            }`}
                                        aria-label={refreshCount >= MAX_REFRESHES ? "Refresh limit reached" : "New Quote"}
                                        title={refreshCount >= MAX_REFRESHES ? "Refresh limit reached for this session" : `${MAX_REFRESHES - refreshCount} refreshes remaining`}
                                    >
                                        <RefreshCw size={20} strokeWidth={1.5} />
                                        {refreshCount > 0 && refreshCount < MAX_REFRESHES && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4B896] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {refreshCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {/* Settings (Configure Vibe) */}
                                {onOpenSettings && (
                                    <button
                                        onClick={onOpenSettings}
                                        className="p-3 rounded-full transition-all duration-300 text-[#D4B896] hover:text-[#C9A876] hover:bg-[#D4B896]/10"
                                        aria-label="Motivation Style"
                                    >
                                        <Settings size={20} strokeWidth={1.5} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                quote={quote}
                isDarkMode={isDarkMode}
                onGenerateImage={handleShare}
                isGeneratingImage={isGeneratingImage}
            />
        </>
    );
};
