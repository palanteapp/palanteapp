import { useEffect, useState } from 'react';
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
    "Amazing work! You completed everything today!",
    "Look at you go! All goals completed!",
    "You're unstoppable! Keep this momentum going!",
    "Proud of you! That's how it's done!",
    "Incredible! You're on fire today!",
    "Yes! You did it! Keep up the great work!",
    "Outstanding! You're making it happen!",
    "Boom! All goals completed! You're amazing!"
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
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; colorIndex: number }>>([]);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        // Defer state updates out of the synchronous effect body
        const initTimer = setTimeout(() => {
            if (cancelled) return;
            // Generate confetti pieces with pre-computed colors
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 1,
                colorIndex: Math.floor(Math.random() * 4)
            }));
            setConfettiPieces(pieces);
            // Use custom message or pick random encouraging message
            setMessage(customMessage || ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]);
        }, 0);

        // Auto-dismiss after 4 seconds
        const dismissTimer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => {
            cancelled = true;
            clearTimeout(initTimer);
            clearTimeout(dismissTimer);
        };
    }, [isOpen, onClose, customMessage]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#3A1700]/50 backdrop-blur-xl transition-all duration-500"
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
                            backgroundColor: ['#B5C2A3', '#E8DCC4', '#D4A574', '#F4E4C1'][piece.colorIndex],
                            animationDelay: `${piece.delay}s`,
                            animationDuration: `${piece.duration}s`
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            <div
                className={`relative max-w-md w-full p-8 rounded-[2.5rem] shadow-spa-lg animate -scale-in transition-all duration-500 ${isDarkMode ? 'bg-sage-mid/95 border border-white/10' : 'bg-white/95 border border-sage/20'}`}
                style={{
                    boxShadow: isDarkMode
                        ? '0 0 80px 20px rgba(0, 0, 0, 0.4), 0 0 150px 40px rgba(111, 123, 109, 0.2), 0 0 250px 60px rgba(111, 123, 109, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.02)'
                        : '0 0 80px 20px rgba(0, 0, 0, 0.1), 0 0 150px 40px rgba(111, 123, 109, 0.15), 0 0 250px 60px rgba(111, 123, 109, 0.08), inset 0 0 60px rgba(255, 255, 255, 0.6)'
                }}
            >
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

                    <p className={`text-xl font-body mb-6 ${isDarkMode ? 'text-white/80' : 'text-sage-dark'
                        }`}>
                        {message}
                    </p>

                    <div className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                        You completed {completedCount} {completedCount === 1 ? 'goal' : 'goals'} today
                    </div>
                </div>
            </div>
        </div>
    );
};
