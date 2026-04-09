import React from 'react';
import { Flame, Check, Target, Trophy } from 'lucide-react';
import type { PartnerActivity } from '../types';

interface ActivityFeedProps {
    activities: PartnerActivity[];
    isDarkMode: boolean;
}

const getActivityIcon = (type: PartnerActivity['type']) => {
    switch (type) {
        case 'practice_complete':
            return Check;
        case 'goal_achieved':
            return Target;
        case 'streak_milestone':
            return Trophy;
        case 'nudge_sent':
            return Flame;
        default:
            return Check;
    }
};

const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isDarkMode }) => {
    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';

    if (activities.length === 0) {
        return (
            <div className={`text-center py-6 ${textSecondary}`}>
                <p className="text-sm">No activity yet. Add a partner to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>
                Recent Activity
            </h4>
            {activities.slice(0, 5).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                    <div
                        key={activity.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isDarkMode ? 'bg-white/5' : 'bg-white/40'
                            }`}
                    >
                        <div
                            className={`p-2 rounded-full ${activity.type === 'nudge_sent'
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : isDarkMode
                                        ? 'bg-pale-gold/20 text-pale-gold'
                                        : 'bg-sage/10 text-sage'
                                }`}
                        >
                            <Icon size={14} fill={activity.type === 'nudge_sent' ? 'currentColor' : 'none'} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${textPrimary}`}>
                                {activity.message}
                            </p>
                        </div>
                        <span className={`text-xs ${textSecondary}`}>
                            {formatTime(activity.timestamp)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
