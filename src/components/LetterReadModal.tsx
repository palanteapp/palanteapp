import { X, Heart, Calendar } from 'lucide-react';
import { haptics } from '../utils/haptics';
import type { FutureLetter } from '../types';

interface LetterReadModalProps {
    isDarkMode: boolean;
    letter: FutureLetter;
    onClose: () => void;
}

export const LetterReadModal: React.FC<LetterReadModalProps> = ({
    isDarkMode,
    letter,
    onClose
}) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getContextMessage = () => {
        switch (letter.context) {
            case 'meditation':
                return 'after a meditation session';
            case 'goal_achievement':
                return `when you achieved: ${letter.contextDetails}`;
            case 'streak_milestone':
                return `when you reached ${letter.contextDetails}`;
            case 'manual':
                return 'during a moment of strength';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/40 backdrop-blur-md animate-fade-in">
            <div className={`relative w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300 ${isDarkMode ? 'bg-warm-gray-green border border-white/10' : 'bg-white border border-sage/10'
                }`}>
                {/* Close Button */}
                <button
                    onClick={() => {
                        haptics.light();
                        onClose();
                    }}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'
                        }`}
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'
                        }`}>
                        <Heart size={36} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} fill="currentColor" />
                    </div>
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-display font-medium text-center mb-2 ${isDarkMode ? 'text-white' : 'text-sage'
                    }`}>
                    A Letter from Your Past Self
                </h3>

                {/* Context */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Calendar size={14} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'
                        }`}>
                        Written on {formatDate(letter.writtenDate)} {getContextMessage()}
                    </p>
                </div>

                {/* Letter Content */}
                <div className={`p-6 rounded-2xl mb-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-sage/10'
                    }`}>
                    <p className={`font-display text-lg leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-white' : 'text-warm-gray-green'
                        }`}>
                        {letter.content}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => {
                        haptics.medium();
                        onClose();
                    }}
                    className={`w-full py-4 rounded-full font-display font-medium text-lg transition-all ${isDarkMode
                        ? 'bg-pale-gold text-warm-gray-green hover:bg-white shadow-spa'
                        : 'bg-sage text-white hover:shadow-spa'
                        }`}
                >
                    Thank You, Past Me
                </button>

                {/* Message */}
                <p className={`text-center mt-6 text-xs italic ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'
                    }`}>
                    You wrote this for yourself. You've got this. 💛
                </p>
            </div>
        </div>
    );
};
