import React from 'react';
import { Flame, Trophy, TrendingUp, Calendar, Target } from 'lucide-react';
import { TrendChart } from './TrendChart';
import type { UserProfile } from '../types';

interface ProgressDashboardProps {
    user: UserProfile;
    activityDatasets: any[];
    isDarkMode: boolean;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, activityDatasets, isDarkMode }) => {
    const bgClass = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';
    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
    const iconBg = isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage';

    // Calculate some derived stats (mock logic for now if history isn't full)
    const weeklyGoals = user.activityHistory?.filter(a => {
        const date = new Date(a.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && a.type === 'reflect'; // Using reflect as proxy for activity
    }).length || 0;

    return (
        <div className="w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                    <TrendingUp size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                </div>
                <h3 className={`text-xl font-display font-medium ${textPrimary}`}>
                    Progress Dashboard
                </h3>
            </div>

            <div className={`p-6 rounded-3xl border shadow-spa ${bgClass}`}>
                {/* Top Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Streak */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/50 border-sage/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${iconBg}`}>
                                <Flame size={16} fill="currentColor" className="opacity-80" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Streak</span>
                        </div>
                        <div className={`text-2xl font-display font-medium ${textPrimary}`}>
                            {user.goalStreak || 0} <span className="text-sm opacity-60">days</span>
                        </div>
                    </div>

                    {/* Points */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/50 border-sage/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${iconBg}`}>
                                <Trophy size={16} fill="currentColor" className="opacity-80" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Points</span>
                        </div>
                        <div className={`text-2xl font-display font-medium ${textPrimary}`}>
                            {user.points || 0}
                        </div>
                    </div>

                    {/* Weekly Activity (Mock/Derived) */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/50 border-sage/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${iconBg}`}>
                                <Calendar size={16} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>This Week</span>
                        </div>
                        <div className={`text-2xl font-display font-medium ${textPrimary}`}>
                            {weeklyGoals > 0 ? weeklyGoals : '-'} <span className="text-sm opacity-60">activities</span>
                        </div>
                    </div>

                    {/* Completion Rate (Mock) */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/50 border-sage/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${iconBg}`}>
                                <Target size={16} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Completion</span>
                        </div>
                        <div className={`text-2xl font-display font-medium ${textPrimary}`}>
                            92%
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Activity Trends</h4>
                        <select className={`text-xs font-medium bg-transparent border-none outline-none cursor-pointer ${textSecondary}`}>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-64">
                        <TrendChart
                            datasets={activityDatasets}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
