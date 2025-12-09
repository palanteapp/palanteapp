import React from 'react';
import { Flame, Trophy } from 'lucide-react';

interface GamificationProps {
    streak: number;
    points: number;
    isDarkMode: boolean;
}

export const Gamification: React.FC<GamificationProps> = ({ streak, points, isDarkMode }) => {
    const cardClasses = `p-6 rounded-card border flex items-center gap-4 transition-all duration-300 hover:scale-105 ${isDarkMode
            ? 'bg-white/5 border-white/10 hover:bg-white/10'
            : 'bg-white/60 border-sage/20 shadow-spa hover:shadow-spa-lg'
        }`;

    const iconBg = isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage';
    const labelColor = isDarkMode ? 'text-white/40' : 'text-sage';
    const valueColor = isDarkMode ? 'text-white' : 'text-warm-gray-green';

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Streak Card */}
            <div className={cardClasses}>
                <div className={`p-3 rounded-full ${iconBg}`}>
                    <Flame size={24} fill="currentColor" className="opacity-80" />
                </div>
                <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${labelColor}`}>Streak</p>
                    <p className={`text-3xl font-display font-medium ${valueColor}`}>{streak}</p>
                </div>
            </div>

            {/* Points Card */}
            <div className={cardClasses}>
                <div className={`p-3 rounded-full ${iconBg}`}>
                    <Trophy size={24} fill="currentColor" className="opacity-80" />
                </div>
                <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${labelColor}`}>Points</p>
                    <p className={`text-3xl font-display font-medium ${valueColor}`}>{points}</p>
                </div>
            </div>
        </div>
    );
};
