import React from 'react';
import { X, Heart, Calendar } from 'lucide-react';
import type { Quote, FavoriteQuote } from '../types';
import { SlideUpModal } from './SlideUpModal';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    favorites: FavoriteQuote[];
    allQuotes: Quote[];
    isDarkMode: boolean;
    onRemoveFavorite: (quoteId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    favorites,
    allQuotes,
    isDarkMode,
    onRemoveFavorite
}) => {
    if (!isOpen) return null;

    // Enhance favorite objects with actual quote data
    const favoriteQuotes = favorites
        .map(fav => {
            const quote = allQuotes.find(q => q.id === fav.quoteId);
            return quote ? { ...quote, savedAt: fav.savedAt } : null;
        })
        .filter((q): q is Quote & { savedAt: string } => q !== null)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode} fullScreen={true}>
            <div className={`p-6 border-b flex items-center gap-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-sage/10 bg-sage/5'
                }`}
            >
                <Heart className={isDarkMode ? 'text-rose-400' : 'text-rose-500'} size={24} fill="currentColor" />
                <h2 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                    Your Favorites
                </h2>
            </div>

            <div className="p-4 space-y-4 pb-12">
                {favoriteQuotes.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Heart size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No favorites yet. <br />Save quotes you love!</p>
                    </div>
                ) : (
                    favoriteQuotes.map((quote) => (
                        <div
                            key={quote.id}
                            className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] group relative ${isDarkMode
                                ? 'bg-white/5 border-white/5 hover:bg-white/10'
                                : 'bg-white border-sage/10 hover:shadow-md'
                                }`}
                        >
                            <p className={`text-lg font-display font-medium mb-3 leading-snug ${isDarkMode ? 'text-white/90' : 'text-sage'
                                }`}>
                                "{quote.text}"
                            </p>

                            <div className="flex items-center justify-between">
                                <p className={`text-sm font-body italic ${isDarkMode ? 'text-white/50' : 'text-sage/60'
                                    }`}>
                                    — {quote.author}
                                </p>

                                <div className="flex items-center gap-3">
                                    <span className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-white/30' : 'text-sage/40'
                                        }`}>
                                        <Calendar size={10} />
                                        {new Date(quote.savedAt).toLocaleDateString()}
                                    </span>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveFavorite(quote.id);
                                        }}
                                        className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                            ? 'text-white/40 hover:text-rose-400 hover:bg-rose-400/10'
                                            : 'text-sage/40 hover:text-rose-500 hover:bg-rose-500/10'
                                            }`}
                                        title="Remove from favorites"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </SlideUpModal>
    );
};
