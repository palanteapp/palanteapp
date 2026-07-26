import { useState, useEffect } from 'react';
import { Moon, Share2, RefreshCw, ChevronDown, ChevronUp, Heart, BookOpen, Award, Smile, Star } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { MessageFeedbackModal } from './MessageFeedbackModal';
import type { Quote, DailyEveningPractice } from '../types';
import { generateShareImage } from '../utils/shareUtils';
import { recordMessageRating } from '../utils/ratingHandler';
import { supabase } from '../lib/supabase';

interface EveningMessageCardProps {
    practice: DailyEveningPractice;
    isDarkMode: boolean;
    onRefresh: () => void;
    onRateMessage?: (rating: 1 | 2 | 3 | 4 | 5) => void;
}

export const EveningMessageCard: React.FC<EveningMessageCardProps> = ({
    practice,
    isDarkMode,
    onRefresh,
    onRateMessage
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [ratedRating, setRatedRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
    const [isSavingRating, setIsSavingRating] = useState(false);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
    }, []);

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white' : 'text-sage-dark/60';
    const bgPrimary = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';

    // Create a mock quote for the share modal based on the reflection
    const mockQuote: Quote = {
        id: `evening_msg_${practice.id}`,
        text: practice.reflectionMessage || "A day well-lived ends in gratitude.",
        author: "Palante",
        category: "Evening Reflection",
        intensity: 1,
        isAI: true
    };

    const handleRateMessage = async (rating: 1 | 2 | 3 | 4 | 5) => {
        setIsSavingRating(true);

        try {
            // 1. Save rating to database
            const { error: updateError } = await supabase
                .from('daily_evening_practice')
                .update({ message_rating: rating })
                .eq('id', practice.id);

            if (!updateError && practice.reflectionMessage) {
                // 2. Trigger learning system
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await recordMessageRating(
                        user.id,
                        practice.id,
                        'evening',
                        practice.reflectionMessage,
                        rating
                    );
                }
            }

            // 3. Show feedback modal
            setRatedRating(rating);
            setShowFeedback(true);

            // 4. Call parent handler if exists
            onRateMessage?.(rating);
        } catch (error) {
            console.error('Error rating message:', error);
        } finally {
            setIsSavingRating(false);
        }
    };

    const handleShare = async () => {
        setIsGeneratingImage(true);
        try {
            const image = await generateShareImage(mockQuote, mockQuote.id);

            try {
                const { Share } = await import('@capacitor/share');
                const { Directory, Filesystem } = await import('@capacitor/filesystem');

                const fileName = `palante_evening_${Date.now()}.png`;
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: image.split(',')[1],
                    directory: Directory.Cache,
                });

                await Share.share({
                    title: 'Evening Reflection from Palante',
                    text: `"${practice.reflectionMessage}"\n\n- @palante.app`,
                    url: savedFile.uri,
                });
            } catch {
                // Web fallback only: iOS ignores link.download
                const { Capacitor } = await import('@capacitor/core');
                if (!Capacitor.isNativePlatform()) {
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = `palante_evening_${Date.now()}.png`;
                    link.click();
                }
            }
        } catch (error) {
            console.error('Error sharing evening message:', error);
            try {
                const { Share } = await import('@capacitor/share');
                await Share.share({
                    title: 'Evening Reflection from Palante',
                    text: `"${practice.reflectionMessage}"\n\n- @palante.app`,
                });
            } catch (fallbackError) {
                console.error('Share failed completely', fallbackError);
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className={`w-full p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${bgPrimary} shadow-lg group`}>
            {/* Background Decor: unified with morning's pale-gold/sage palette. */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />

            {/* Header (Always Visible) */}
            <div
                className="flex items-center justify-between cursor-pointer relative z-10"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                        <Moon size={20} />
                    </div>
                    <div>
                        <h3 className={`text-base font-display font-medium ${textPrimary}`}>Evening Practice Complete</h3>
                        <p className={`text-xs uppercase tracking-widest mt-1 ${textSecondary}`}>
                            Reflection: <span className="font-bold border-b border-dashed opacity-80">Evening Reflection</span>
                        </p>
                    </div>
                </div>

                <div className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-sage/10 text-sage/50'}`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                {/* Horizontal Divider */}
                <div className={`w-full h-px mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />

                {practice.reflectionMessage ? (
                    <div className="text-center px-4 mb-8">
                        <h4 className={`text-xs font-bold uppercase tracking-[0.15em] mb-4 ${textSecondary}`}>Your Evening Summary</h4>
                        <p className={`text-xl font-display font-medium leading-relaxed ${textPrimary}`}>"{practice.reflectionMessage}"</p>
                    </div>
                ) : (
                    <div className="text-center px-4 mb-8">
                        <p className={`text-sm ${textSecondary}`}>Rest well and reflect on your highlights.</p>
                    </div>
                )}

                {/* GLAD Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                        { label: 'Grateful', icon: Heart, text: practice.gratitude, color: 'text-rose-400' },
                        { label: 'Learned', icon: BookOpen, text: practice.learning, color: 'text-blue-400' },
                        { label: 'Achieved', icon: Award, text: practice.accomplishment, color: 'text-pale-gold-400' },
                        { label: 'Delighted', icon: Smile, text: practice.delight, color: 'text-green-400' }
                    ].map((item, i) => (
                        <div key={i} className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white/40'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <item.icon size={12} className={item.color} />
                                <span className={`text-xs font-bold ${textSecondary}`}>{item.label}</span>
                            </div>
                            <p className={`text-xs line-clamp-2 ${textPrimary}`}>{item.text}</p>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowShareModal(true);
                        }}
                        disabled={isGeneratingImage}
                        className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'text-pale-gold hover:text-white hover:bg-white/10' : 'text-sage hover:text-sage-dark hover:bg-sage/10'} ${isGeneratingImage ? 'opacity-50 animate-pulse' : ''}`}
                        aria-label="Share"
                    >
                        <Share2 size={20} strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRefresh();
                        }}
                        className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'text-pale-gold hover:text-white hover:bg-white/10' : 'text-sage hover:text-sage-dark hover:bg-sage/10'}`}
                        aria-label="Restart Practice"
                        title="Restart Practice"
                    >
                        <RefreshCw size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Message rating */}
                {practice.reflectionMessage && onRateMessage && (
                    <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                        <p className={`text-xs font-bold uppercase tracking-[0.08em] mb-2 ${textSecondary}`}>
                            How well did this land?
                        </p>
                        <div className="flex gap-1 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRateMessage(star as 1 | 2 | 3 | 4 | 5);
                                    }}
                                    disabled={isSavingRating}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(null)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                        opacity: (hoveredStar ?? practice.messageRating ?? 0) >= star ? 1 : 0.25,
                                        transition: 'opacity 0.15s',
                                    }}
                                    aria-label={`Rate ${star}`}
                                >
                                    <Star
                                        size={16}
                                        fill={(hoveredStar ?? practice.messageRating ?? 0) >= star ? '#C96A3A' : 'none'}
                                        stroke={(hoveredStar ?? practice.messageRating ?? 0) >= star ? '#C96A3A' : isDarkMode ? 'rgba(229,214,167,0.3)' : 'rgba(65,93,67,0.3)'}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showFeedback && ratedRating && userId && (
                <MessageFeedbackModal
                    isOpen={showFeedback}
                    onClose={() => setShowFeedback(false)}
                    rating={ratedRating}
                    practiceType="evening"
                    practiceId={practice.id}
                    userId={userId}
                />
            )}

            {showShareModal && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    quote={mockQuote}
                    isDarkMode={isDarkMode}
                    onGenerateImage={handleShare}
                    isGeneratingImage={isGeneratingImage}
                />
            )}
        </div>
    );
};
