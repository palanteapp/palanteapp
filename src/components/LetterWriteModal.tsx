import { X, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { haptics } from '../utils/haptics';

interface LetterWriteModalProps {
    isDarkMode: boolean;
    context: 'meditation' | 'goal_achievement' | 'streak_milestone' | 'manual';
    contextDetails?: string;
    onSave: (content: string) => void;
    onClose: () => void;
}

export const LetterWriteModal: React.FC<LetterWriteModalProps> = ({
    isDarkMode,
    context,
    contextDetails,
    onSave,
    onClose
}) => {
    const [content, setContent] = useState('');

    const getPrompt = () => {
        switch (context) {
            case 'meditation':
                return "You just completed a meditation. How are you feeling right now? Write a note to yourself for a tougher day.";
            case 'goal_achievement':
                return `You just achieved: ${contextDetails}. Capture this moment of success for when you need it most.`;
            case 'streak_milestone':
                return `You've reached ${contextDetails}! What would you tell yourself on a day when you're struggling?`;
            case 'manual':
                return "You're doing great right now. Write an encouraging note to your future self.";
        }
    };

    const handleSave = () => {
        if (content.trim().length === 0) return;
        haptics.success();
        onSave(content);
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
                <h3 className={`text-2xl font-display font-medium text-center mb-3 ${isDarkMode ? 'text-white' : 'text-sage'
                    }`}>
                    Letter to Future You
                </h3>

                {/* Prompt */}
                <p className={`text-center mb-6 text-sm ${isDarkMode ? 'text-white/70' : 'text-warm-gray-green/70'
                    }`}>
                    {getPrompt()}
                </p>

                {/* Textarea */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Dear future me..."
                    className={`w-full h-40 p-4 rounded-2xl font-display resize-none focus:outline-none focus:ring-2 transition-all ${isDarkMode
                        ? 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-pale-gold/50'
                        : 'bg-white border border-sage/20 text-warm-gray-green placeholder-warm-gray-green/40 focus:ring-sage/50'
                        }`}
                    autoFocus
                />

                {/* Character Count */}
                <p className={`text-xs text-right mt-2 ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'
                    }`}>
                    {content.length} characters
                </p>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    {/* Skip Button */}
                    <button
                        onClick={() => {
                            haptics.light();
                            onClose();
                        }}
                        className={`flex-1 py-4 rounded-full font-display font-medium transition-all ${isDarkMode
                            ? 'bg-white/10 text-white/80 hover:bg-white/20'
                            : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                    >
                        Skip for Now
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={content.trim().length === 0}
                        className={`flex-1 py-4 rounded-full font-display font-medium transition-all flex items-center justify-center gap-2 ${content.trim().length === 0
                            ? 'bg-sage/30 text-white/50 cursor-not-allowed'
                            : isDarkMode
                                ? 'bg-pale-gold text-warm-gray-green hover:bg-white shadow-spa'
                                : 'bg-sage text-white hover:shadow-spa'
                            }`}
                    >
                        <Sparkles size={18} />
                        Save Letter
                    </button>
                </div>

                {/* Reassurance */}
                <p className={`text-center mt-6 text-xs italic ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'
                    }`}>
                    This letter will be delivered when you need it most 💛
                </p>
            </div>
        </div>
    );
};
