/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import type { Quote, FavoriteQuote, JournalEntry, MeditationReflection } from '../types';
import { Heart, Share2, BookMarked, BookOpen, Flower2, X, Flame } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ShareModal } from './ShareModal';
import { QuoteCardGenerator } from './QuoteCardGenerator';
import { ReflectionCardGenerator } from './ReflectionCardGenerator';

interface LibraryProps {
    favoriteQuotes: FavoriteQuote[];
    allQuotes: Quote[];
    journalEntries?: JournalEntry[];
    meditationReflections?: MeditationReflection[];
    isDarkMode: boolean;
    onRemoveFavorite: (quoteId: string) => void;
    onRemoveJournalEntry?: (entryId: string) => void;
    tipsEnabled?: boolean; // Added tipsEnabled prop
    onShowTip?: () => void;
}

type TabType = 'quotes' | 'journal' | 'meditations';

export const Library: React.FC<LibraryProps> = ({
    favoriteQuotes,
    allQuotes,
    journalEntries = [],
    meditationReflections = [],
    isDarkMode,
    onRemoveFavorite,
    onRemoveJournalEntry,
    onShowTip: _onShowTip,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('quotes');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareQuote, setShareQuote] = useState<Quote | null>(null);
    const [shareReflection, setShareReflection] = useState<JournalEntry | MeditationReflection | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Get full quote objects from IDs
    const favoriteQuoteObjects = favoriteQuotes
        .map(fav => ({
            ...allQuotes.find(q => q.id === fav.quoteId),
            savedAt: fav.savedAt
        }))
        .filter(q => q.id)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());



    const handleImageShare = async (image: string, text: string) => {
        if (navigator.share) {
            try {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], 'palante_share.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Palante App',
                        text: text,
                    });
                    setShowShareMenu(false);
                    return;
                }
            } catch (shareError) {
                console.log('Native share failed, falling back to download', shareError);
            }
        }

        const link = document.createElement('a');
        link.href = image;
        link.download = `palante_share_${Date.now()}.png`;
        link.click();
        alert('Image saved to your device!');
    };

    const handleGenerateImage = async () => {
        if (!shareQuote && !shareReflection) return;

        setIsGeneratingImage(true);
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const quoteElement = document.getElementById('library-quote-card-generator');
            const reflectionElement = document.getElementById('library-reflection-card-generator');

            if (quoteElement && shareQuote) {
                const canvas = await html2canvas(quoteElement, { scale: 1, backgroundColor: null, useCORS: true });
                const image = canvas.toDataURL('image/png');
                const isTierQuote = shareQuote.author === 'Muse' || shareQuote.author === 'Focus' || shareQuote.author === 'Fire';
                const shareText = isTierQuote
                    ? `"${shareQuote.text}"\n\n- @palante.app`
                    : `"${shareQuote.text}" - ${shareQuote.author}\n\n- @palante.app`;
                await handleImageShare(image, shareText);
            } else if (reflectionElement && shareReflection) {
                const canvas = await html2canvas(reflectionElement, { scale: 1, backgroundColor: null, useCORS: true });
                const image = canvas.toDataURL('image/png');
                const text = 'reflection' in shareReflection ? shareReflection.reflection : shareReflection.highlight;
                await handleImageShare(image, `${text}\n\n- @palante.app`);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Could not generate image. Please try again.');
        } finally {
            setIsGeneratingImage(false);
            setShowShareMenu(false);
        }
    };

    const handleOpenShareModal = (quote?: Quote, reflection?: JournalEntry | MeditationReflection) => {
        setShareQuote(quote || null);
        setShareReflection(reflection || null);
        setShowShareMenu(true);
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    const tabs = [
        { id: 'quotes' as TabType, label: 'Quotes', icon: BookMarked, count: favoriteQuoteObjects.length },
        { id: 'journal' as TabType, label: 'Daily Reflections', icon: BookOpen, count: journalEntries.length },
        { id: 'meditations' as TabType, label: 'Meditations', icon: Flower2, count: meditationReflections.length }
    ];

    return (
        <div className="min-h-screen transition-colors duration-500 mt-8">
            {/* Hidden Generators for Sharing */}
            {shareQuote && (
                <QuoteCardGenerator id="library-quote-card-generator" quote={shareQuote} isDarkMode={isDarkMode} />
            )}
            {shareReflection && (
                <ReflectionCardGenerator
                    id="library-reflection-card-generator"
                    date={shareReflection.date}
                    highlight={'highlight' in shareReflection ? shareReflection.highlight : 'Intention: ' + shareReflection.intention}
                    midpoint={'midpoint' in shareReflection ? shareReflection.midpoint : 'Mantra: ' + shareReflection.mantra}
                    lowlight={'lowlight' in shareReflection ? shareReflection.lowlight : 'Reflection: ' + shareReflection.reflection}
                    energyLevel={'energyLevel' in shareReflection ? shareReflection.energyLevel : undefined}
                />
            )}

            <div className="max-w-4xl mx-auto uppercase">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <BookMarked size={32} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    </div>
                    <h1 className={`text-3xl font-display font-medium mb-2 ${textPrimary}`}>
                        Library
                    </h1>
                    <p className={`text-base ${textSecondary}`}>
                        Your saved wisdom and journey
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-col gap-3 mb-8 w-full max-w-sm mx-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-medium transition-all ${activeTab === tab.id
                                    ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                    ? isDarkMode ? 'bg-warm-gray-green text-pale-gold' : 'bg-white text-sage'
                                    : isDarkMode ? 'bg-white/10' : 'bg-sage/20'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {activeTab === 'quotes' && (
                    <div className="space-y-6 animate-fade-in">
                        {favoriteQuoteObjects.length === 0 ? (
                            <div className="text-center py-20">
                                <Heart size={64} className={`mx-auto mb-6 ${textSecondary}`} />
                                <h3 className={`text-2xl font-display font-medium mb-2 ${textPrimary}`}>
                                    No favorites yet
                                </h3>
                                <p className={textSecondary}>
                                    Tap the heart icon on quotes you love to save them here
                                </p>
                            </div>
                        ) : (
                            favoriteQuoteObjects.map((quote) => (
                                <div
                                    key={quote.id}
                                    className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${cardBg}`}
                                >
                                    <blockquote className="mb-6">
                                        <p className={`text-xl md:text-2xl font-display font-medium leading-relaxed mb-4 ${textPrimary}`}>
                                            "{quote.text}"
                                        </p>
                                        <footer className="flex items-center gap-3">
                                            <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-sage/20'}`}></div>
                                            <cite className={`text-sm font-body uppercase tracking-widest not-italic ${isDarkMode ? 'text-pale-gold' : 'text-sage'
                                                }`}>
                                                {quote.author}
                                            </cite>
                                            <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-sage/20'}`}></div>
                                        </footer>
                                    </blockquote>

                                    <div className="flex items-center justify-between mb-6">
                                        <span className={`text-xs font-body px-4 py-2 rounded-full border ${isDarkMode ? 'bg-white/5 border-white/10 text-white/60' : 'bg-sage/10 border-sage/20 text-warm-gray-green/60'
                                            }`}>
                                            {quote.category}
                                        </span>
                                        <span className={`text-xs ${textSecondary}`}>
                                            Saved {new Date(quote.savedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleOpenShareModal(quote as Quote)}
                                            className={`flex-1 py-2.5 px-4 rounded-xl font-body font-medium text-sm transition-all ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20' : 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Share2 size={14} />
                                                <span>Share</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => onRemoveFavorite(quote.id!)}
                                            className={`py-2.5 px-3 rounded-xl font-body font-medium transition-all ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-sage/10 text-sage/60 hover:bg-sage/20 hover:text-sage'
                                                }`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-6 animate-fade-in">
                        {journalEntries.length === 0 ? (
                            <div className="text-center py-20">
                                <BookOpen size={64} className={`mx-auto mb-6 ${textSecondary}`} />
                                <h3 className={`text-2xl font-display font-medium mb-2 ${textPrimary}`}>
                                    No reflections yet
                                </h3>
                                <p className={textSecondary}>
                                    Visit the Reflect tab to start journaling your daily highs, mids, and lows
                                </p>
                            </div>
                        ) : (
                            journalEntries.slice().reverse().map((entry) => (
                                <div
                                    key={entry.id}
                                    className={`p-6 md:p-8 rounded-2xl border ${cardBg}`}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-sage/20'}`}></div>
                                        <h3 className={`text-xl font-display font-medium whitespace-nowrap ${textPrimary}`}>
                                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </h3>
                                        <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-sage/20'}`}></div>
                                    </div>

                                    <div className="flex justify-between items-center mb-6">
                                        {/* Energy Indicator */}
                                        <div className="flex items-center gap-2">
                                            <Flame size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                Energy: {entry.energyLevel || '-'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">

                                            <button
                                                onClick={() => handleOpenShareModal(undefined, entry)}
                                                className={`py-2 px-3 rounded-xl font-body font-medium transition-all ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20' : 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'
                                                    }`}
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            {onRemoveJournalEntry && (
                                                <button
                                                    onClick={() => onRemoveJournalEntry(entry.id)}
                                                    className={`py-2 px-3 rounded-xl font-body font-medium transition-all ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-sage/10 text-sage/60 hover:bg-sage/20 hover:text-sage'
                                                        }`}
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Win</p>
                                            <p className={textPrimary}>{entry.highlight}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Growth</p>
                                            <p className={textPrimary}>{entry.midpoint}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Focus</p>
                                            <p className={textPrimary}>{entry.lowlight}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'meditations' && (
                    <div className="space-y-6 animate-fade-in">
                        {meditationReflections.length === 0 ? (
                            <div className="text-center py-20">
                                <Flower2 size={64} className={`mx-auto mb-6 ${textSecondary}`} />
                                <h3 className={`text-2xl font-display font-medium mb-2 ${textPrimary}`}>
                                    No meditation reflections yet
                                </h3>
                                <p className={textSecondary}>
                                    Complete a meditation session and save your reflection to see it here
                                </p>
                            </div>
                        ) : (
                            meditationReflections.map((meditation) => (
                                <div
                                    key={meditation.id}
                                    className={`p-6 md:p-8 rounded-2xl border ${cardBg}`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className={`text-2xl font-display font-medium mb-2 ${textPrimary}`}>
                                                "{meditation.intention}"
                                            </h3>
                                            <p className={`text-sm ${textSecondary}`}>
                                                {new Date(meditation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'
                                            }`}>
                                            {meditation.duration} min
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Mantra</p>
                                            <p className={`text-lg font-display ${textPrimary}`}>{meditation.mantra}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${textSecondary}`}>Reflection</p>
                                            <p className={textPrimary}>{meditation.reflection}</p>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleOpenShareModal(undefined, meditation)}
                                                    className={`py-2 px-3 rounded-xl font-body font-medium transition-all ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20' : 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Share2 size={16} />
                                                        <span>Share</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <ShareModal
                isOpen={showShareMenu}
                onClose={() => setShowShareMenu(false)}
                quote={shareQuote || undefined}
                reflection={shareReflection ? {
                    date: shareReflection.date,
                    highlight: 'highlight' in shareReflection ? shareReflection.highlight : 'Intention: ' + shareReflection.intention,
                    midpoint: 'midpoint' in shareReflection ? shareReflection.midpoint : 'Mantra: ' + shareReflection.mantra,
                    lowlight: 'lowlight' in shareReflection ? shareReflection.lowlight : 'Reflection: ' + shareReflection.reflection,
                    energyLevel: 'energyLevel' in shareReflection ? shareReflection.energyLevel : undefined
                } : undefined}
                isDarkMode={isDarkMode}
                onGenerateImage={(shareQuote || shareReflection) ? handleGenerateImage : undefined}
                isGeneratingImage={isGeneratingImage}
            />
        </div >
    );
};
