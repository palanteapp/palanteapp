import React, { useState } from 'react';
import { Users, UserPlus, Flame } from 'lucide-react';
import { useAccountability } from '../contexts/AccountabilityContext';
import { ActivityFeed } from './ActivityFeed';
import { haptics } from '../utils/haptics';

interface VillageCardProps {
    isDarkMode: boolean;
    onOpenInvite: () => void;
}

export const VillageCard: React.FC<VillageCardProps> = ({ isDarkMode, onOpenInvite }) => {
    const { partners, activityFeed, sendNudge } = useAccountability();
    const [toast, setToast] = useState<string | null>(null);

    const activePartners = partners.filter(p => p.inviteStatus === 'accepted');
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';

    const handleNudge = (partnerId: string, name: string) => {
        haptics.medium();
        sendNudge(partnerId, name);
        setToast(`Sent Fire to ${name}! 🔥`);
        setTimeout(() => setToast(null), 2500);
    };

    return (
        <div className={`w-full p-6 rounded-2xl border relative ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'
            }`}>
            {/* Toast */}
            {toast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#3A1700]/80 backdrop-blur text-white text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
                    <Flame size={12} className="text-orange-500" fill="currentColor" />
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    <h3 className={`text-lg font-display font-medium ${textPrimary}`}>
                        The Village
                    </h3>
                </div>
                <button
                    onClick={() => {
                        haptics.selection();
                        onOpenInvite();
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isDarkMode
                            ? 'bg-pale-gold/20 text-pale-gold hover:bg-pale-gold/30'
                            : 'bg-sage/20 text-sage hover:bg-sage/30'
                        }`}
                >
                    <UserPlus size={14} />
                    <span>Add</span>
                </button>
            </div>

            {/* Content */}
            {activePartners.length === 0 ? (
                <div className={`text-center py-6 ${textSecondary}`}>
                    <p className="text-sm mb-3">Build your accountability tribe</p>
                    <button
                        onClick={onOpenInvite}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isDarkMode
                                ? 'bg-pale-gold/10 text-pale-gold hover:bg-pale-gold/20'
                                : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                    >
                        <UserPlus size={14} />
                        Invite Your First Partner
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Partner Pills */}
                    <div className="flex flex-wrap gap-2">
                        {activePartners.slice(0, 3).map((partner) => (
                            <button
                                key={partner.id}
                                onClick={() => handleNudge(partner.id, partner.name)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isDarkMode
                                        ? 'bg-white/10 hover:bg-white/20'
                                        : 'bg-sage/10 hover:bg-sage/20'
                                    }`}
                            >
                                <span className={`text-sm font-medium ${textPrimary}`}>
                                    {partner.name.split(' ')[0]}
                                </span>
                                <Flame size={14} className="text-orange-400" />
                            </button>
                        ))}
                    </div>

                    {/* Activity Feed */}
                    {activityFeed.length > 0 && (
                        <ActivityFeed activities={activityFeed} isDarkMode={isDarkMode} />
                    )}
                </div>
            )}
        </div>
    );
};
