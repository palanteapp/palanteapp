import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    completedCount?: number;
    title?: string;
    message?: string;
    isDarkMode: boolean;
}

const ENCOURAGING_MESSAGES = [
    "Amazing work! You crushed it today! 🎉",
    "Look at you go! All goals completed! 💪",
    "You're unstoppable! Keep this momentum going! 🔥",
    "Proud of you! That's how it's done! ⭐",
    "Incredible! You're on fire today! ✨",
    "Yes! You did it! Keep up the great work! 🌟",
    "Outstanding! You're making it happen! 🚀",
    "Boom! All goals crushed! You're amazing! 💥"
];

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
    isOpen,
    onClose,
    completedCount,
    title,
    message: customMessage,
    isDarkMode
}) => {
    const [message, setMessage] = useState('');
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

    useEffect(() => {
        if (isOpen) {
            // Use custom message or pick random encouraging message
            setMessage(customMessage || ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]);

            // Generate confetti pieces
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 1
            }));
            setConfettiPieces(pieces);

            // Auto-dismiss after 4 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confettiPieces.map((piece) => (
                    <div
                        key={piece.id}
                        className="absolute top-0 w-2 h-2 rounded-full animate-confetti"
                        style={{
                            left: `${piece.left}%`,
                            backgroundColor: ['#B5C2A3', '#E8DCC4', '#D4A574', '#F4E4C1'][Math.floor(Math.random() * 4)],
                            animationDelay: `${piece.delay}s`,
                            animationDuration: `${piece.duration}s`
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            <div className={`relative max-w-md w-full p-8 rounded-3xl shadow-spa-lg animate-scale-in ${isDarkMode ? 'bg-warm-gray-green border border-white/10' : 'bg-white border border-sage/20'
                }`}>
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'
                        }`}
                >
                    <X size={20} />
                </button>

                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <div className={`p-4 rounded-full ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'}`}>
                            <Sparkles size={48} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        </div>
                    </div>

                    <h2 className={`text-3xl font-display font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-sage'
                        }`}>
                        {title || "All Goals Complete!"}
                    </h2>

                    <p className={`text-xl font-body mb-6 ${isDarkMode ? 'text-white/80' : 'text-warm-gray-green'
                        }`}>
                        {message}
                    </p>

                    <div className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                        You completed {completedCount} {completedCount === 1 ? 'goal' : 'goals'} today
                    </div>
                </div>
            </div>
        </div>
    );
};
