import React from 'react';
import type { Milestone } from '../types';
import { Trophy, X, Flame, Award, PartyPopper } from 'lucide-react';

const getMilestoneIcon = (iconName: string, size = 64) => {
    switch (iconName) {
        case 'Flame': return <Flame size={size} className="text-orange-500" />;
        case 'Trophy': return <Trophy size={size} className="text-pale-gold-500" />;
        case 'Award': return <Award size={size} className="text-blue-500" />;
        case 'PartyPopper': return <PartyPopper size={size} className="text-purple-500" />;
        default: return <Trophy size={size} className="text-pale-gold" />;
    }
};

interface MilestoneModalProps {
    milestone: Milestone;
    onClose: () => void;
    isDarkMode: boolean;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({ milestone, onClose, isDarkMode }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeIn">
            <div className={`relative max-w-md w-full max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl animate-scale-in-up bg-[#1B4332] border border-white/10`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-white/10 text-white/40"
                >
                    <X size={20} />
                </button>

                <div className="text-center">
                    <div className="flex justify-center mb-6 animate-bounce">
                        {getMilestoneIcon(milestone.icon)}
                    </div>

                    <h2 className="text-3xl font-black mb-2 text-white">
                        {milestone.title}!
                    </h2>

                    <p className="text-lg mb-6 text-white/70">
                        {milestone.message}
                    </p>

                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 bg-pale-gold/15 text-pale-gold">
                        <Trophy size={20} fill="currentColor" />
                        <span className="font-bold">+{milestone.bonusPoints} Points</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-full font-bold transition-all transform hover:scale-[1.02] bg-[#C96A3A] text-white hover:opacity-90"
                    >
                        Keep Going!
                    </button>
                </div>
            </div>
        </div>
    );
};
