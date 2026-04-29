import React, { useState } from 'react';
import type { Quote, FavoriteQuote, JournalEntry, MeditationReflection } from '../types';
import { Heart, Share2, BookMarked, BookOpen, Flower2, X, Flame } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ShareModal } from './ShareModal';
import { generateShareImage } from '../utils/shareUtils';
import { haptics } from '../utils/haptics';

interface LibraryProps {
    favoriteQuotes: FavoriteQuote[];
    allQuotes: Quote[];
    journalEntries?: JournalEntry[];
    meditationReflections?: MeditationReflection[];
    isDarkMode: boolean;
    onRemoveFavorite: (quoteId: string) => void;
    onRemoveJournalEntry?: (entryId: string) => void;
    tipsEnabled?: boolean;
    onShowTip?: () => void;
}

type TabType = 'quotes' | 'journal' | 'meditations';

export const Library: React.FC<LibraryProps> = ({
    favoriteQuotes,
    allQuotes,
    journalEntries = [],
    meditationReflections = [],
    onRemoveFavorite,
    onRemoveJournalEntry,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('quotes');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareQuote, setShareQuote] = useState<Quote | null>(null);
    const [shareReflection, setShareReflection] = useState<JournalEntry | MeditationReflection | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const favoriteQuoteObjects = favoriteQuotes
        .map(fav => ({
            ...allQuotes.find(q => q.id === fav.quoteId),
            savedAt: fav.savedAt
        }))
        .filter(q => q.id)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    const handleImageShare = async (image: string, text: string) => {
        try {
            const isNative = window.location.protocol.includes('capacitor');
            if (isNative) {
                const fileName = `palante_share_${Date.now()}.png`;
                const base64Data = image.split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });
                await Share.share({ title: 'Palante App', text, url: savedFile.uri });
                setShowShareMenu(false);
                return;
            }
            if (navigator.share) {
                const response = await fetch(image);
                const blob = await response.blob();
                const file = new File([blob], 'palante_share.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Palante App', text });
                    setShowShareMenu(false);
                    return;
                }
            }
        } catch (error) {
            console.error('Sharing failed:', error);
        }
        const link = document.createElement('a');
        link.href = image;
        link.download = `palante_share_${Date.now()}.png`;
        link.click();
    };

    const handleGenerateImage = async () => {
        if (!shareQuote && !shareReflection) return;
        setIsGeneratingImage(true);
        try {
            if (shareQuote) {
                const image = await generateShareImage(shareQuote, shareQuote.id);
                const isTierQuote = shareQuote.author === 'Muse' || shareQuote.author === 'Focus' || shareQuote.author === 'Fire';
                const shareText = isTierQuote
                    ? `"${shareQuote.text}"\n\n- @palante.app`
                    : `"${shareQuote.text}" - ${shareQuote.author}\n\n- @palante.app`;
                await handleImageShare(image, shareText);
            } else if (shareReflection) {
                const reflectionText = 'reflection' in shareReflection
                    ? shareReflection.reflection
                    : shareReflection.highlight;
                const mockQuote = {
                    id: `reflection_${shareReflection.date}`,
                    text: reflectionText || 'A moment of reflection.',
                    author: 'My Reflection',
                    category: 'Journal',
                    intensity: 1 as const,
                };
                const image = await generateShareImage(mockQuote, mockQuote.id);
                await handleImageShare(image, `${reflectionText}\n\n- @palante.app`);
            }
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsGeneratingImage(false);
            setShowShareMenu(false);
        }
    };

    const handleOpenShareModal = (quote?: Quote, reflection?: JournalEntry | MeditationReflection) => {
        haptics.light();
        setShareQuote(quote || null);
        setShareReflection(reflection || null);
        setShowShareMenu(true);
    };

    const tabs = [
        { id: 'quotes' as TabType, label: 'Quotes', icon: BookMarked, count: favoriteQuoteObjects.length },
        { id: 'journal' as TabType, label: 'Reflections', icon: BookOpen, count: journalEntries.length },
        { id: 'meditations' as TabType, label: 'Meditations', icon: Flower2, count: meditationReflections.length },
    ];

    return (
        <div className="min-h-screen pt-8 pb-32 px-5">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#FAF7F3', fontSize: '28px', letterSpacing: '-0.02em' }}>
                    Library
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgba(212,184,130,0.8)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
                    Your Archive of Growth
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-7">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { haptics.selection(); setActiveTab(tab.id); }}
                            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                            style={{
                                background: isActive ? 'rgba(201,106,58,0.15)' : 'rgba(250,247,243,0.05)',
                                border: isActive ? '1px solid rgba(201,106,58,0.35)' : '1px solid rgba(250,247,243,0.08)',
                            }}
                        >
                            <Icon
                                size={18}
                                color={isActive ? '#C96A3A' : 'rgba(250,247,243,0.4)'}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />
                            <span style={{
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: isActive ? 600 : 400,
                                fontSize: '10px',
                                letterSpacing: '0.05em',
                                color: isActive ? '#FAF7F3' : 'rgba(250,247,243,0.4)',
                            }}>
                                {tab.label}
                            </span>
                            <span style={{
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 700,
                                fontSize: '10px',
                                color: isActive ? '#C96A3A' : 'rgba(250,247,243,0.3)',
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'quotes' && (
                    <div className="space-y-4">
                        {favoriteQuoteObjects.length === 0 ? (
                            <EmptyState icon={<Heart size={28} color="#D4B882" />} title="No favorites yet" body="Tap the heart icon on quotes you love to save them here." />
                        ) : (
                            favoriteQuoteObjects.map((quote) => (
                                <div key={quote.id} className="rounded-2xl p-5" style={{ background: 'rgba(250,247,243,0.05)', border: '1px solid rgba(250,247,243,0.08)' }}>
                                    <blockquote className="mb-5">
                                        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: 1.6, color: '#FAF7F3', marginBottom: '12px' }}>
                                            "{quote.text}"
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <cite style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4B882', fontStyle: 'normal' }}>
                                                {quote.author}
                                            </cite>
                                            <div style={{ flex: 1, height: '1px', background: 'rgba(250,247,243,0.08)' }} />
                                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(250,247,243,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                {quote.category}
                                            </span>
                                        </div>
                                    </blockquote>
                                    <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(250,247,243,0.06)' }}>
                                        <button
                                            onClick={() => handleOpenShareModal(quote as Quote)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-95"
                                            style={{ background: '#C96A3A' }}
                                        >
                                            <Share2 size={14} color="#FAF7F3" />
                                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FAF7F3' }}>
                                                Share
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => onRemoveFavorite(quote.id!)}
                                            className="flex items-center justify-center p-3 rounded-xl transition-all active:scale-95"
                                            style={{ background: 'rgba(250,247,243,0.06)', border: '1px solid rgba(250,247,243,0.08)' }}
                                        >
                                            <X size={16} color="rgba(250,247,243,0.4)" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-4">
                        {journalEntries.length === 0 ? (
                            <EmptyState icon={<BookOpen size={28} color="#D4B882" />} title="No reflections yet" body="Visit the Reflect tab to start journaling your journey." />
                        ) : (
                            journalEntries.slice().reverse().map((entry) => (
                                <div key={entry.id} className="rounded-2xl p-5" style={{ background: 'rgba(250,247,243,0.05)', border: '1px solid rgba(250,247,243,0.08)' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '15px', color: '#FAF7F3' }}>
                                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(201,106,58,0.15)', border: '1px solid rgba(201,106,58,0.25)' }}>
                                            <Flame size={11} color="#C96A3A" fill="#C96A3A" />
                                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', color: '#C96A3A' }}>{entry.energyLevel}/5</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-4">
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(250,247,243,0.04)' }}>
                                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4B882', marginBottom: '6px' }}>The Win</p>
                                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(250,247,243,0.8)', lineHeight: 1.5 }}>{entry.highlight}</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(250,247,243,0.04)' }}>
                                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4B882', marginBottom: '6px' }}>The Lesson</p>
                                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(250,247,243,0.8)', lineHeight: 1.5 }}>{entry.midpoint}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenShareModal(undefined, entry)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-95"
                                            style={{ background: '#C96A3A' }}
                                        >
                                            <Share2 size={14} color="#FAF7F3" />
                                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FAF7F3' }}>Share</span>
                                        </button>
                                        {onRemoveJournalEntry && (
                                            <button
                                                onClick={() => onRemoveJournalEntry(entry.id)}
                                                className="flex items-center justify-center p-3 rounded-xl transition-all active:scale-95"
                                                style={{ background: 'rgba(250,247,243,0.06)', border: '1px solid rgba(250,247,243,0.08)' }}
                                            >
                                                <X size={16} color="rgba(250,247,243,0.4)" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'meditations' && (
                    <div className="space-y-4">
                        {meditationReflections.length === 0 ? (
                            <EmptyState icon={<Flower2 size={28} color="#D4B882" />} title="Silence is yet to be held" body="After your next session, your reflections will appear here." />
                        ) : (
                            meditationReflections.map((med) => (
                                <div key={med.id} className="rounded-2xl p-5" style={{ background: 'rgba(250,247,243,0.05)', border: '1px solid rgba(250,247,243,0.08)' }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 pr-3">
                                            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '15px', color: '#FAF7F3', marginBottom: '4px' }}>
                                                "{med.intention}"
                                            </p>
                                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(250,247,243,0.4)', letterSpacing: '0.04em' }}>
                                                {new Date(med.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} · {med.duration} min
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,184,130,0.1)', border: '1px solid rgba(212,184,130,0.2)' }}>
                                            <Flower2 size={18} color="#D4B882" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(250,247,243,0.04)' }}>
                                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4B882', marginBottom: '6px' }}>Mantra</p>
                                        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '15px', color: '#FAF7F3', lineHeight: 1.5 }}>{med.mantra}</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenShareModal(undefined, med)}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-95"
                                        style={{ background: '#C96A3A' }}
                                    >
                                        <Share2 size={14} color="#FAF7F3" />
                                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FAF7F3' }}>Share Mantra Card</span>
                                    </button>
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
                isDarkMode={true}
                onGenerateImage={(shareQuote || shareReflection) ? handleGenerateImage : undefined}
                isGeneratingImage={isGeneratingImage}
            />
        </div>
    );
};

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
    return (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(250,247,243,0.04)', border: '1px dashed rgba(250,247,243,0.12)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(212,184,130,0.1)', border: '1px solid rgba(212,184,130,0.2)' }}>
                {icon}
            </div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '17px', color: '#FAF7F3', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(250,247,243,0.45)', lineHeight: 1.5, maxWidth: '220px', margin: '0 auto' }}>{body}</p>
        </div>
    );
}
