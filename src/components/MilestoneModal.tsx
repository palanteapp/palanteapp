import React from 'react';
import type { Milestone } from '../types';
import { Trophy, X, Flame, Award, PartyPopper } from 'lucide-react';

const getMilestoneIcon = (iconName: string, size = 64) => {
    switch (iconName) {
        case 'Flame': return <Flame size={size} className="text-orange-500" />;
        case 'Trophy': return <Trophy size={size} className="text-amber-500" />;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className={`relative max-w-md w-full max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl animate -scaleIn ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'
                }`}>
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                >
                    <X size={20} />
                </button>

                <div className="text-center">
                    <div className="flex justify-center mb-6 animate-bounce">
                        {getMilestoneIcon(milestone.icon)}
                    </div>

                    <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {milestone.title}!
                    </h2>

                    <p className={`text-lg mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                        {milestone.message}
                    </p>

                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 ${isDarkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        <Trophy size={20} fill="currentColor" />
                        <span className="font-bold">+{milestone.bonusPoints} Points</span>
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-full font-bold transition-all transform hover:scale-[1.02] ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                            }`}
                    >
                        Keep Going!
                    </button>
                </div>
            </div>
        </div>
    );
};
