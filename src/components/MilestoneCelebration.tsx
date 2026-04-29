import React, { useEffect } from 'react';
import { X, Flame, Trophy, Award, PartyPopper, Compass } from 'lucide-react';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { haptics } from '../utils/haptics';
import { getMilestoneDetails, getStreakMilestoneDetails } from '../utils/practiceUtils';

const getMilestoneIcon = (iconName: string, size = 96) => {
    switch (iconName) {
        case 'Flame': return <Flame size={size} className="text-orange-500" />;
        case 'Trophy': return <Trophy size={size} className="text-pale-gold" />;
        case 'Award': return <Award size={size} className="text-blue-500" />;
        case 'PartyPopper': return <PartyPopper size={size} className="text-purple-500" />;
        default: return <Trophy size={size} className="text-pale-gold" />;
    }
};

interface MilestoneCelebrationProps {
    milestone?: 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'century' | 'twohundred' | 'year';
    streakDays?: number;
    isOpen: boolean;
    onClose: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
    milestone,
    streakDays,
    isOpen,
    onClose
}) => {
    // Return early if not open
    if (!isOpen) return null;

    const finalDetails = streakDays 
        ? getStreakMilestoneDetails(streakDays)
        : getMilestoneDetails(milestone!);
        
    const displayDays = streakDays || finalDetails.days;

    useEffect(() => {
        if (isOpen) {
            triggerConfetti();
            haptics.success();
            // Optional: Play success sound
            const audio = new Audio('/success.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        }
    }, [isOpen]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-[#1B4332] to-[#2a3025] rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up border border-white/10">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
                >
                    <X size={20} className="text-white/60" />
                </button>

                {/* VISUAL SHARE CARD - This part is captured */}
                <div id="milestone-card" className="p-10 text-center relative pt-16">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-pale-gold/5 rounded-full blur-3xl -z-10" />
                    
                    {/* Icon */}
                    <div className="flex justify-center mb-8 animate-bounce-in">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-lg">
                            {getMilestoneIcon(finalDetails.icon)}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">
                        {finalDetails.title}
                    </h2>

                    {/* Milestone Type Tag */}
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-pale-gold/60 mb-8">
                        Palante Milestone
                    </div>

                    {/* Count Display */}
                    <div className="inline-flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-white/5 border border-white/10 mb-8 shadow-inner">
                        <span className="text-6xl font-display font-medium text-pale-gold tabular-nums">
                            {displayDays}
                        </span>
                        <div className="text-left">
                            <div className="text-sm font-bold text-white uppercase tracking-widest">{finalDetails.label}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Achieved</div>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-white/80 text-lg font-body leading-relaxed mb-4 italic">
                        "{finalDetails.message}"
                    </p>
                    
                    {/* App Logo/Branding for the share card */}
                    <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
                         <div className="w-6 h-6 rounded-full bg-pale-gold flex items-center justify-center">
                            <span className="text-[10px] font-black text-sage-dark">P</span>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-white">Palante</span>
                    </div>
                </div>

                {/* UI ACTIONS - Not captured in the image share */}
                <div className="p-8 pt-0 flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-5 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all active:scale-95"
                    >
                        Keep Going
                    </button>

                    <button
                        onClick={async () => {
                            const { shareElementAsImage } = await import('../utils/shareUtils');
                            await shareElementAsImage(
                                'milestone-card',
                                'palante_milestone',
                                `${displayDays} ${finalDetails.label} Achieved!`,
                                `I just hit a new milestone on Palante! ${displayDays} ${finalDetails.label} and still moving forward. pa'lante! 🚀 #PalanteApp`
                            );
                        }}
                        className="flex items-center justify-center gap-2 w-full text-pale-gold text-xs font-black uppercase tracking-widest hover:text-white transition-colors py-4 active:scale-95"
                    >
                        <Compass size={16} />
                        <span>Share Visual Card</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
