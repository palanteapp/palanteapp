import { X, Heart, Calendar } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface RestDayModalProps {
    isDarkMode: boolean;
    missedDate: string; // ISO date string (yesterday)
    onMarkAsRest: () => void;
    onAcknowledge: () => void;
    onClose: () => void;
}

export const RestDayModal: React.FC<RestDayModalProps> = ({
    isDarkMode,
    missedDate,
    onMarkAsRest,
    onAcknowledge,
    onClose
}) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-warm-gray-green border border-white/10' : 'bg-ivory border border-sage/10'
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
                        <Heart size={36} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    </div>
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-display font-medium text-center mb-3 ${isDarkMode ? 'text-white' : 'text-sage'
                    }`}>
                    We Missed You
                </h3>

                {/* Message */}
                <p className={`text-center mb-2 ${isDarkMode ? 'text-white/70' : 'text-warm-gray-green/70'
                    }`}>
                    You didn't check in on <span className="font-medium">{formatDate(missedDate)}</span>.
                </p>

                <p className={`text-center mb-8 text-sm ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'
                    }`}>
                    Did you take a well-deserved rest day?
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    {/* Rest Day Button */}
                    <button
                        onClick={() => {
                            haptics.medium();
                            onMarkAsRest();
                        }}
                        className={`w-full py-4 rounded-full font-display font-medium text-lg transition-all flex items-center justify-center gap-2 ${isDarkMode
                                ? 'bg-pale-gold text-warm-gray-green hover:bg-white'
                                : 'bg-sage text-white hover:shadow-spa'
                            }`}
                    >
                        <Calendar size={20} />
                        Yes, I Rested
                    </button>

                    {/* Acknowledge Button */}
                    <button
                        onClick={() => {
                            haptics.light();
                            onAcknowledge();
                        }}
                        className={`w-full py-4 rounded-full font-display font-medium transition-all ${isDarkMode
                                ? 'bg-white/10 text-white/80 hover:bg-white/20'
                                : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                    >
                        I Just Forgot
                    </button>
                </div>

                {/* Reassurance */}
                <p className={`text-center mt-6 text-xs italic ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'
                    }`}>
                    Rest is part of growth. Your streak is safe. 🌱
                </p>
            </div>
        </div>
    );
};
