import React, { useEffect } from 'react';
import { X, Flame, Trophy, Award, PartyPopper, Compass } from 'lucide-react';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { haptics } from '../utils/haptics';
import { getMilestoneDetails } from '../utils/streakUtils';

const getMilestoneIcon = (iconName: string, size = 96) => {
    switch (iconName) {
        case 'Flame': return <Flame size={size} className="text-orange-500" />;
        case 'Trophy': return <Trophy size={size} className="text-amber-500" />;
        case 'Award': return <Award size={size} className="text-blue-500" />;
        case 'PartyPopper': return <PartyPopper size={size} className="text-purple-500" />;
        default: return <Trophy size={size} className="text-pale-gold" />;
    }
};

interface MilestoneCelebrationProps {
    milestone: 'week' | 'month' | 'century' | 'year';
    isOpen: boolean;
    onClose: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
    milestone,
    isOpen,
    onClose
}) => {
    const details = getMilestoneDetails(milestone);

    useEffect(() => {
        if (isOpen) {
            // Trigger celebration effects
            triggerConfetti();
            haptics.success();

            // Play success sound if available
            const audio = new Audio('/success.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore if audio fails to play
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-warm-gray-green to-sage rounded-3xl p-8 shadow-2xl animate-slide-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={20} className="text-white" />
                </button>

                {/* Content */}
                <div className="text-center">
                    {/* Emoji */}
                    <div className="flex justify-center mb-6 animate-bounce-in">
                        {getMilestoneIcon(details.icon)}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-display font-bold text-white mb-3">
                        {details.title}
                    </h2>

                    {/* Streak count */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 mb-6">
                        <span className="text-5xl font-display font-bold text-pale-gold">
                            {details.days}
                        </span>
                        <span className="text-white/80 text-lg">
                            Day Streak!
                        </span>
                    </div>

                    {/* Message */}
                    <p className="text-white/90 text-lg leading-relaxed mb-8">
                        {details.message}
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-pale-gold text-sage font-bold text-lg hover:bg-pale-gold/90 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                    >
                        Keep Going!
                    </button>

                    {/* Share option */}
                    <button
                        onClick={async () => {
                            if (navigator.share) {
                                try {
                                    await navigator.share({
                                        title: `Palante Milestone: ${details.days} Days!`,
                                        text: `I just achieved a ${details.days} day streak on Palante! pa'lante (forward) every single day. 🚀`,
                                        url: 'https://palante.app'
                                    });
                                    haptics.success();
                                } catch (error) {
                                    console.log('Error sharing:', error);
                                }
                            } else {
                                // Fallback: Link to the website if share isn't supported
                                window.open('https://palante.app', '_blank');
                            }
                        }}
                        className="mt-3 flex items-center justify-center gap-2 w-full text-white/60 text-sm hover:text-white transition-colors"
                    >
                        <Compass size={16} />
                        <span>Share your achievement</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes scale-in {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    @keyframes bounce-in {
        0% {
            transform: scale(0);
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
        }
    }
    .animate-scale-in {
        animation: scale-in 0.3s ease-out;
    }
    .animate-bounce-in {
        animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
`;
document.head.appendChild(style);
