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
                return <Zap size={24} className="text-amber-400" />;
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
                button: 'bg-terracotta-500 hover:bg-terracotta-600'
            };
        }
        if (intervention.priority === 'medium') {
            return {
                bg: 'bg-gradient-to-br from-pale-gold/20 to-amber-500/20',
                border: 'border-pale-gold/40',
                button: 'bg-pale-gold hover:bg-pale-gold/90 text-sage'
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
        <div className={`relative rounded-2xl p-5 border-2 ${colors.bg} ${colors.border} backdrop-blur-sm animate-slide-in-up`}>
            {/* Coach ID Badge - DIFFERENTIATOR FROM QUOTES */}
            <div className="flex items-center gap-2 mb-3 tracking-widest uppercase text-[10px] font-bold opacity-70">
                <Sparkles size={10} />
                <span>Palante Coach Insight</span>
            </div>

            {/* Close button */}
            <button
                onClick={() => {
                    haptics.light();
                    onDismiss();
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
                <X size={16} className="text-white/80" />
            </button>

            {/* Content */}
            <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 p-3 rounded-xl bg-white/10">
                    {getIcon()}
                </div>

                {/* Message */}
                <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                            Palante Coach
                        </span>
                        {intervention.priority === 'high' && (
                            <span className="px-2 py-0.5 rounded-full bg-terracotta-500/20 text-terracotta-300 text-[10px] font-bold">
                                WELCOME BACK
                            </span>
                        )}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed mb-4">
                        {intervention.message}
                    </p>

                    {/* Actions */}
                    {intervention.action && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    haptics.success();
                                    onAccept();
                                }}
                                className={`flex-1 py-2.5 px-4 rounded-xl ${colors.button} text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-95`}
                            >
                                {getActionText(intervention.action.type)}
                            </button>
                            <button
                                onClick={() => {
                                    haptics.light();
                                    onDismiss();
                                }}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium transition-colors"
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
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-up {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    .animate-slide-in-up {
        animation: slide-in-up 0.3s ease-out;
    }
`;
document.head.appendChild(style);
