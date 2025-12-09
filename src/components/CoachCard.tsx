import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface CoachCardProps {
    userName: string;
    focusCount: number;
    completedCount: number;
    isDarkMode: boolean;
    streak?: number;
}

export const CoachCard: React.FC<CoachCardProps> = ({
    userName,
    focusCount,
    completedCount,
    isDarkMode,
    streak = 0
}) => {
    const [message, setMessage] = useState('');
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();

        // Set Greeting
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        // Set Message based on context
        if (focusCount === 0) {
            setMessage("What are your goals for today?");
        } else if (focusCount < 3 && completedCount < focusCount) {
            setMessage("You've got this! Keep going.");
        } else if (completedCount === focusCount && focusCount > 0) {
            setMessage("All done! You crushed it today.");
        } else {
            setMessage("Take a breath. You're exactly where you need to be.");
        }
    }, [focusCount, completedCount]);

    const bgClass = isDarkMode
        ? 'bg-gradient-to-br from-warm-gray-green to-stone-900 border-white/10'
        : 'bg-gradient-to-br from-sage/80 to-sage border-sage/30';

    const textPrimary = isDarkMode ? 'text-white' : 'text-white';
    const textSecondary = isDarkMode ? 'text-white/80' : 'text-white/90';

    return (
        <div className={`w-full p-8 rounded-3xl border shadow-spa-lg relative overflow-hidden transition-all duration-500 ${bgClass}`}>
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-glow"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Sparkles size={16} className="text-pale-gold" />
                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Accountability Coach</span>
                </div>

                <h2 className={`text-3xl md:text-4xl font-display font-medium mb-3 ${textPrimary}`}>
                    {greeting}, {userName}.
                </h2>

                <p className={`text-xl font-body leading-relaxed ${textSecondary}`}>
                    {message}
                </p>

                {/* Streak Display */}
                {streak > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <span className={`text-lg font-display font-medium ${textPrimary}`}>
                            {streak} day streak!
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
