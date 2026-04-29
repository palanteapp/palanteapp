import React, { useState } from 'react';
import { Users, UserPlus, Calendar, X, Flame, Zap, Sparkles as SparklesIcon, AlertTriangle, ShieldOff } from 'lucide-react';
import { haptics } from '../utils/haptics';
import type { AccountabilityPartner } from '../types';

interface AccountabilityPartnersProps {
    partners: AccountabilityPartner[];
    onAddPartner: () => void;
    onRemovePartner: (id: string) => void;
    onReportPartner: (id: string, name: string) => void;
    onBlockPartner: (id: string, name: string) => void;
    isDarkMode: boolean;
}

const getStreakIcon = (streak: number, size = 20) => {
    if (streak >= 7) return <Flame size={size} className="text-orange-500" />;
    if (streak >= 3) return <Zap size={size} className="text-yellow-500" />;
    return <SparklesIcon size={size} className="text-sage" />;
};

const getDaysSinceActivity = (lastActivityDate: string): number => {
    const now = new Date();
    const lastActivity = new Date(lastActivityDate);
    const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const AccountabilityPartners: React.FC<AccountabilityPartnersProps> = ({
    partners,
    onAddPartner,
    onRemovePartner,
    onReportPartner,
    onBlockPartner,
    isDarkMode,
}) => {
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';

    const activePartners = partners.filter(p => p.inviteStatus === 'accepted');
    const pendingPartners = partners.filter(p => p.inviteStatus === 'pending');

    const [toast, setToast] = useState<string | null>(null);

    const handleNudge = (name: string) => {
        haptics.medium();
        setToast(`Sent Fire to ${name}! 🔥`);
        setTimeout(() => setToast(null), 2500);
    };

    return (
        <div className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'
            } relative`}>
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-black/20 backdrop-blur text-white text-xs font-bold shadow-xl animate-fade-in-up flex items-center gap-2 pointer-events-none">
                    <Flame size={12} className="text-orange-500" fill="currentColor" />
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Users size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    <h3 className={`text-lg font-display font-medium ${textPrimary}`}>
                        Accountability Partners
                    </h3>
                </div>
                {activePartners.length < 3 && (
                    <button
                        onClick={() => {
                            haptics.selection();
                            onAddPartner();
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isDarkMode
                            ? 'bg-pale-gold/20 text-pale-gold hover:bg-pale-gold/30'
                            : 'bg-sage/20 text-sage hover:bg-sage/30'
                            }`}
                    >
                        <UserPlus size={14} />
                        <span>Add</span>
                    </button>
                )}
            </div>

            {/* Empty State */}
            {activePartners.length === 0 && pendingPartners.length === 0 && (
                <div className="text-center py-8">
                    <Users size={48} className={`mx-auto mb-3 ${textSecondary}`} />
                    <p className={`text-sm mb-4 ${textSecondary}`}>
                        Add up to 3 accountability partners to stay motivated together!
                    </p>
                    <button
                        onClick={onAddPartner}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${isDarkMode
                            ? 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90'
                            : 'bg-terracotta-500 text-white hover:bg-sage-600'
                            }`}
                    >
                        Invite Your First Partner
                    </button>
                </div>
            )}

            {/* Active Partners */}
            {activePartners.length > 0 && (
                <div className="space-y-3 mb-4">
                    {activePartners.map((partner) => {
                        const daysSince = getDaysSinceActivity(partner.lastActivityDate);
                        const isActive = daysSince <= 1;

                        return (
                            <div
                                key={partner.id}
                                className={`p-3 rounded-xl border transition-all ${isDarkMode
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                    : 'bg-white border-sage/10 hover:bg-white/60'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-display font-medium ${textPrimary}`}>
                                                {partner.name}
                                            </h4>
                                            {isActive && (
                                                <span className="w-2 h-2 rounded-full bg-sage animate-pulse" title="Active today" />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <div className="flex items-center gap-1">
                                                {getStreakIcon(partner.currentStreak, 16)}
                                                <span className={`text-xs font-medium ${textPrimary}`}>
                                                    {partner.currentStreak}d
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} className={textSecondary} />
                                                <span className={`text-[10px] ${textSecondary}`}>
                                                    {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            onClick={() => handleNudge(partner.name)}
                                            className={`p-1.5 rounded-full transition-all ${isDarkMode
                                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                }`}
                                            title="Send Fire"
                                        >
                                            <Flame size={14} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                haptics.selection();
                                                onReportPartner(partner.id, partner.name);
                                            }}
                                            className={`p-1.5 rounded-full transition-all ${isDarkMode
                                                ? 'text-white/20 hover:text-red-400'
                                                : 'text-sage/20 hover:text-red-500'
                                                }`}
                                            title="Report"
                                        >
                                            <AlertTriangle size={14} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                haptics.selection();
                                                onBlockPartner(partner.id, partner.name);
                                            }}
                                            className={`p-1.5 rounded-full transition-all ${isDarkMode
                                                ? 'text-white/20 hover:text-red-400'
                                                : 'text-sage/20 hover:text-red-500'
                                                }`}
                                            title="Block"
                                        >
                                            <ShieldOff size={14} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                haptics.medium();
                                                onRemovePartner(partner.id);
                                            }}
                                            className={`p-1.5 rounded-full transition-all ${isDarkMode
                                                ? 'text-white/20 hover:text-white'
                                                : 'text-sage/20 hover:text-sage'
                                                }`}
                                            title="Remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pending Invites */}
            {pendingPartners.length > 0 && (
                <div className="space-y-2">
                    <p className={`text-xs uppercase tracking-wider font-bold ${textSecondary} mb-2`}>
                        Pending Invites
                    </p>
                    {pendingPartners.map((partner) => (
                        <div
                            key={partner.id}
                            className={`p-3 rounded-lg border border-dashed ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-sage/20 bg-sage/5'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${textSecondary}`}>
                                    Invite sent to {partner.name}
                                </span>
                                <button
                                    onClick={() => onRemovePartner(partner.id)}
                                    className={`text-xs ${textSecondary} hover:${textPrimary}`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Group Stats */}
            {activePartners.length >= 2 && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-sm ${textSecondary}`}>
                            Group average streak:
                        </span>
                        <span className={`text-sm font-medium ${textPrimary}`}>
                            {Math.round(activePartners.reduce((sum, p) => sum + p.currentStreak, 0) / activePartners.length)} days
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
