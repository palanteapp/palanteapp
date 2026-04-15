import React from 'react';
import { Sunrise, ChevronRight } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface QuickActionsProps {
    onJumpToGoals: () => void;
    onJumpToRitual: () => void;
    showRitual: boolean; // Only show ritual button if not completed
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onJumpToGoals: _onJumpToGoals,
    onJumpToRitual,
    showRitual
}) => {
    return (
        <div className="w-full mb-6 flex gap-3">
            {showRitual && (
                <button
                    onClick={() => {
                        haptics.light();
                        onJumpToRitual();
                    }}
                    className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-amber/20 to-amber-500/20 border border-pale-gold/30 hover:border-pale-gold/50 transition-all hover:scale-[1.02] active:scale-95"
                >
                    <div className="flex items-center gap-2">
                        <Sunrise size={18} className="text-pale-gold" />
                        <span className="text-white font-medium text-sm">Morning Practice</span>
                    </div>
                    <ChevronRight size={16} className="text-pale-gold/60" />
                </button>
            )}
        </div>
    );
};
