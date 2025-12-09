import React, { useState } from 'react';
import type { Quote, FavoriteQuote, JournalEntry, MeditationReflection } from '../types';
import { Heart, Share2, Volume2, BookHeart, BookOpen, Flower2, X, Facebook, Twitter, Linkedin, Instagram, MessageCircle, Mail } from 'lucide-react';
import { getVoiceForId } from '../utils/voiceUtils';

interface LibraryProps {
    favoriteQuotes: FavoriteQuote[];
    allQuotes: Quote[];
    journalEntries?: JournalEntry[];
    meditationReflections?: MeditationReflection[];
    isDarkMode: boolean;
    onRemoveFavorite: (quoteId: string) => void;
    onRemoveJournalEntry?: (entryId: string) => void;
    voicePreference: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
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
    voicePreference = 'shimmer'
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('quotes');
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareContent, setShareContent] = useState<{ title: string; text: string } | null>(null);

    // Debug logging
    console.log('Library received journalEntries:', journalEntries);
    console.log('Journal entries count:', journalEntries.length);

    // Get full quote objects from IDs
    const favoriteQuoteObjects = favoriteQuotes
        .map(fav => ({
            ...allQuotes.find(q => q.id === fav.quoteId),
            savedAt: fav.savedAt
        }))
        .filter(q => q.id)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    const handleSpeakText = (text: string, id: string) => {
        if (speakingId === id) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
        } else {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;



            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = getVoiceForId(voicePreference || 'shimmer', voices);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                // Slight pitch adjustments for specific known voices to enhance distinctness
                if (selectedVoice.name.includes('Google')) {
                    const isFemale = voicePreference === 'shimmer';
                    utterance.pitch = isFemale ? 1.0 : 0.9;
                }
            }

            utterance.onend = () => setSpeakingId(null);
            window.speechSynthesis.speak(utterance);
            setSpeakingId(id);
        }
    };

    const handleOpenShareModal = (title: string, text: string) => {
        setShareContent({ title, text });
        setShowShareMenu(true);
    };

    const shareToSMS = () => {
        if (!shareContent) return;
        window.open(`sms:?&body=${encodeURIComponent(shareContent.text)}`, '_self');
        setShowShareMenu(false);
    };

    const shareToEmail = () => {
        if (!shareContent) return;
        const subject = shareContent.title;
        const body = `${shareContent.text}\n\nShared from Palante`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
        setShowShareMenu(false);
    };

    const shareToSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok') => {
        if (!shareContent) return;
        const text = shareContent.text;
        const url = window.location.href;

        let shareUrl = '';
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'instagram':
                navigator.clipboard.writeText(text);
                alert('Quote copied to clipboard! Open Instagram and paste to share.');
                setShowShareMenu(false);
                return;
            case 'tiktok':
                navigator.clipboard.writeText(text);
                alert('Quote copied to clipboard! Open TikTok and paste to share.');
                setShowShareMenu(false);
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
        setShowShareMenu(false);
    };

    const bgClass = isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    const tabs = [
        { id: 'quotes' as TabType, label: 'Quotes', icon: BookHeart, count: favoriteQuoteObjects.length },
        { id: 'journal' as TabType, label: 'Daily Reflections', icon: BookOpen, count: journalEntries.length },
        { id: 'meditations' as TabType, label: 'Meditations', icon: Flower2, count: meditationReflections.length }
    ];

    // Debug logging
    console.log('Library component - journalEntries:', journalEntries);
    console.log('Library component - journalEntries.length:', journalEntries.length);

    return (
        <div className={`w-full min-h-screen p-8 pt-24 pb-32 transition-colors duration-500 ${bgClass}`}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <BookHeart size={40} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    </div>
                    <h1 className={`text-5xl font-display font-medium mb-4 ${textPrimary}`}>
                        Your Library
                    </h1>
                    <p className={`text-lg ${textSecondary}`}>
                        All your saved wisdom in one place
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 justify-center">
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
                            favoriteQuoteObjects.map((quote: any) => (
                                <div
                                    key={quote.id}
                                    className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${cardBg}`}
                                >
                                    <blockquote className="mb-6">
                                        <p className={`text-2xl md:text-3xl font-display font-medium leading-relaxed mb-4 ${textPrimary}`}>
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
                                            onClick={() => handleSpeakText(`${quote.text} ... by ${quote.author}`, quote.id)}
                                            className={`flex-1 py-3 px-4 rounded-xl font-body font-medium transition-all ${speakingId === quote.id
                                                ? isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white'
                                                : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-sage/10 text-sage/60 hover:bg-sage/20 hover:text-sage'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Volume2 size={16} className={speakingId === quote.id ? 'animate-pulse' : ''} />
                                                <span>{speakingId === quote.id ? 'Stop' : 'Listen'}</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleOpenShareModal(
                                                `Quote by ${quote.author}`,
                                                `"${quote.text}" — ${quote.author}`
                                            )}
                                            className={`flex-1 py-3 px-4 rounded-xl font-body font-medium transition-all ${isDarkMode ? 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20' : 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Share2 size={16} />
                                                <span>Share</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => onRemoveFavorite(quote.id)}
                                            className={`py-3 px-4 rounded-xl font-body font-medium transition-all ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-sage/10 text-sage/60 hover:bg-sage/20 hover:text-sage'
                                                }`}
                                        >
                                            <X size={16} />
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
                                    className={`p-8 rounded-2xl border ${cardBg}`}
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className={`text-2xl font-display font-medium ${textPrimary}`}>
                                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSpeakText(
                                                    `Daily Reflection for ${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. High: ${entry.highlight}. Mid: ${entry.midpoint}. Low: ${entry.lowlight}`,
                                                    entry.id
                                                )}
                                                className={`py-2 px-3 rounded-xl font-body font-medium transition-all ${speakingId === entry.id
                                                    ? isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white'
                                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-sage/10 text-sage/60 hover:bg-sage/20 hover:text-sage'
                                                    }`}
                                            >
                                                <Volume2 size={16} className={speakingId === entry.id ? 'animate-pulse' : ''} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenShareModal(
                                                    `Daily Reflection - ${new Date(entry.date).toLocaleDateString()}`,
                                                    `High: ${entry.highlight}\nMid: ${entry.midpoint}\nLow: ${entry.lowlight}`
                                                )}
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
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-sage' : 'text-sage'}`}>High</p>
                                            <p className={textPrimary}>{entry.highlight}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-pale-gold'}`}>Mid</p>
                                            <p className={textPrimary}>{entry.midpoint}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>Low</p>
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
                                    className={`p-8 rounded-2xl border ${cardBg}`}
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
                                                    onClick={() => handleSpeakText(`Meditation Reflection: ${meditation.reflection}`, meditation.id)}
                                                    className={`py-2 px-3 rounded-xl font-body font-medium transition-all ${speakingId === meditation.id ? isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white' : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-sage/10 text-sage/60 hover:bg-sage/20 hover:text-sage'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Volume2 size={16} className={speakingId === meditation.id ? 'animate-pulse' : ''} />
                                                        <span>{speakingId === meditation.id ? 'Stop' : 'Listen'}</span>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenShareModal(
                                                        'Meditation Reflection',
                                                        meditation.reflection
                                                    )}
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

            {/* Share Modal */}
            {showShareMenu && shareContent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowShareMenu(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Modal */}
                    <div
                        className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-warm-gray-green' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowShareMenu(false)}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                        >
                            <X size={20} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                        </button>

                        {/* Header */}
                        <h3 className={`text-xl font-display font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                            Share
                        </h3>

                        {/* Content Preview with Branding */}
                        <div className={`mb-6 p-8 rounded-xl border-2 ${isDarkMode ? 'bg-white/5 border-sage/20' : 'bg-gradient-to-br from-sage/5 to-pale-gold/5 border-sage/20'}`}>
                            {/* Logo and Branding */}
                            <div className="flex flex-col items-center mb-6">
                                <img
                                    src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                                    alt="Palante"
                                    className="w-12 h-12 object-contain mb-3"
                                />
                                <h4 className={`text-2xl font-display font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                    Palante
                                </h4>
                                <p className={`text-xs font-body tracking-widest uppercase mt-1 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    Personalized Progress, Delivered Daily
                                </p>
                            </div>

                            {/* Content */}
                            <p className={`text-sm font-body leading-relaxed text-center ${isDarkMode ? 'text-white/80' : 'text-warm-gray-green'}`}>
                                {shareContent.text}
                            </p>
                        </div>

                        {/* Share Options */}
                        <div className="space-y-3">
                            {/* SMS */}
                            <button
                                onClick={shareToSMS}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isDarkMode
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                    : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-sage/20' : 'bg-sage/10'}`}>
                                    <MessageCircle size={20} className={isDarkMode ? 'text-sage' : 'text-sage'} />
                                </div>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                    Text Message
                                </span>
                            </button>

                            {/* Email */}
                            <button
                                onClick={shareToEmail}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isDarkMode
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                    : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20' : 'bg-pale-gold/10'}`}>
                                    <Mail size={20} className={isDarkMode ? 'text-pale-gold' : 'text-pale-gold'} />
                                </div>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                    Email
                                </span>
                            </button>

                            {/* Social Media Grid */}
                            <div className="grid grid-cols-5 gap-2 pt-2">
                                <button
                                    onClick={() => shareToSocial('instagram')}
                                    className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                        }`}
                                    title="Instagram"
                                >
                                    <Instagram size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                                </button>
                                <button
                                    onClick={() => shareToSocial('tiktok')}
                                    className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                        }`}
                                    title="TikTok"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}>
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="currentColor" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => shareToSocial('twitter')}
                                    className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                        }`}
                                    title="Twitter / X"
                                >
                                    <Twitter size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                                </button>
                                <button
                                    onClick={() => shareToSocial('facebook')}
                                    className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                        }`}
                                    title="Facebook"
                                >
                                    <Facebook size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                                </button>
                                <button
                                    onClick={() => shareToSocial('linkedin')}
                                    className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                                        }`}
                                    title="LinkedIn"
                                >
                                    <Linkedin size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
