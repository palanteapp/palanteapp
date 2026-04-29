import React from 'react';
import { X, Lightbulb, Zap, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import type { CoachIntervention } from '../types';
import { haptics } from '../utils/haptics';

interface CoachInterventionCardProps {
    intervention: CoachIntervention;
    onAccept: () => void;
    onDismiss: () => void;
}

export const CoachInterventionCard: React.FC<CoachInterventionCardProps> = ({
    intervention,
    onAccept,
    onDismiss
}) => {
    const getIcon = () => {
        switch (intervention.type) {
            case 'suggestion':
                return <Lightbulb size={24} className="text-pale-gold" />;
            case 'encouragement':
                return <Zap size={24} className="text-pale-gold-400" />;
            case 'alternative':
                return <TrendingUp size={24} className="text-blue-400" />;
            case 'streak_warning':
                return <AlertCircle size={24} className="text-orange-400" />;
            case 'check_in':
                return <Sparkles size={24} className="text-purple-400" />;
            default:
                return <Lightbulb size={24} className="text-pale-gold" />;
        }
    };

    const getColorScheme = () => {
        if (intervention.priority === 'high') {
            return {
                bg: 'bg-gradient-to-br from-terracotta-500/20 to-rose-500/20', // Distinctly NOT orange
                border: 'border-terracotta-500/40',
                button: 'bg-terracotta-500 hover:bg-sage-600'
            };
        }
        if (intervention.priority === 'medium') {
            return {
                bg: 'bg-gradient-to-br from-amber/20 to-amber-500/20',
                border: 'border-pale-gold/40',
                button: 'bg-pale-gold hover:bg-pale-gold/90 text-sage-dark'
            };
        }
        return {
            bg: 'bg-gradient-to-br from-sage/20 to-warm-gray-green/20',
            border: 'border-sage/40',
            button: 'bg-sage hover:bg-sage/90'
        };
    };

    const colors = getColorScheme();

    return (
        <div className={`relative rounded-3xl p-6 border-l-4 border-pale-gold border-r-0 border-t-0 border-b-0 bg-white/10 dark:bg-white/15 backdrop-blur-md shadow-xl animate-fade-in-up`}>
            {/* Coach ID Badge */}
            <div className="flex items-center gap-2 mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-pale-gold/20 backdrop-blur-md`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-pale-gold shadow-[0_0_8px_rgba(232,201,155,1)]" />
                    <span className="tracking-[0.2em] uppercase text-[10px] font-bold text-pale-gold">
                        Palante Coach Insight
                    </span>
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={() => {
                    haptics.light();
                    onDismiss();
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
                <X size={16} className={isDarkMode ? 'text-white/60' : 'text-sage/60'} />
            </button>

            {/* Content */}
            <div className="flex gap-5">
                {/* Icon */}
                <div className="flex-shrink-0 p-4 rounded-2xl bg-white/5">
                    {getIcon()}
                </div>

                {/* Message */}
                <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>
                            Intelligent Guide
                        </span>
                    </div>
                    <p className={`text-base font-medium leading-relaxed mb-6 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                        {intervention.message}
                    </p>

                    {/* Actions */}
                    {intervention.action && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    haptics.success();
                                    onAccept();
                                }}
                                className={`flex-1 py-3 px-5 rounded-2xl bg-pale-gold text-sage-dark font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-pale-gold/10`}
                            >
                                {getActionText(intervention.action.type)}
                            </button>
                            <button
                                onClick={() => {
                                    haptics.light();
                                    onDismiss();
                                }}
                                className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-sage/5 text-sage/60 hover:bg-sage/10'}`}
                            >
                                Later
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function getActionText(actionType: string): string {
    switch (actionType) {
        case 'show_breathing':
            return 'Start Breathing';
        case 'show_meditation':
            return 'Meditate Now';
        case 'suggest_goal':
            return 'Set Goal';
        case 'open_practice':
            return 'Choose Practice';
        default:
            return 'Let\'s Go!';
    }
}

// Add slide-in animation
