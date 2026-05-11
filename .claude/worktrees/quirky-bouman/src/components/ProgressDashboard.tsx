import { useState, useMemo } from 'react';
import { Sparkles, Activity, Target } from 'lucide-react';
import type { UserProfile } from '../types';

interface ProgressDashboardProps {
    user: UserProfile;
    isDarkMode: boolean;
    onShowTip?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, isDarkMode, onShowTip }) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

    // --- Data Processing Helpers ---
    const practiceStats = useMemo(() => {
        const activityHistory = user.practiceData?.activityHistory || [];
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return {
            total: user.practiceData?.totalPractices || 0,
            thisWeek: activityHistory.filter(activity => new Date(activity.date) >= weekAgo).length,
            thisMonth: activityHistory.filter(activity => new Date(activity.date) >= monthAgo).length
        };
    }, [user.practiceData]);

    const activityStats = useMemo(() => {
        const history = user.activityHistory || [];
        const now = new Date();
        const daysToShow = timeRange === 'week' ? 7 : 30;

        const dailyData = Array.from({ length: daysToShow }).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (daysToShow - 1 - i));
            return {
                date: d.toISOString().split('T')[0],
                dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
                fullDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
                count: 0
            };
        });

        history.forEach(log => {
            const entry = dailyData.find(d => d.date === log.date);
            if (entry) entry.count += log.count;
        });

        return dailyData;
    }, [user.activityHistory, timeRange]);

    const maxCount = Math.max(...activityStats.map(d => d.count), 1);

    return (
        <div className="animate-fade-in relative">
            <div className={`p-5 rounded-2xl relative overflow-hidden transition-all shadow-md ${isDarkMode
                ? 'bg-[#4E5C4C]/10 border border-pale-gold/20'
                : 'bg-white/80 border border-[#4E5C4C]/10 backdrop-blur-md'}`}>
                
                {/* Header elements */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className={isDarkMode ? 'text-pale-gold' : 'text-[#4E5C4C]'} size={18} />
                        <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#4E5C4C]'}`}>
                            Momentum Tracker
                        </h3>
                    </div>
                </div>

                {/* Main Stats Row */}
                <div className="flex items-center justify-between mb-5 px-1 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 ${isDarkMode ? 'text-pale-gold' : 'text-[#4E5C4C]'}`}>
                            Total Flow
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-[#4E5C4C]'}`}>
                                {practiceStats.total}
                            </span>
                            <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-[#4E5C4C]/60'}`}>sessions</span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-current opacity-10" />
                    <div className="flex flex-col items-center">
                        <span className={`text-[10px] uppercase tracking-widest opacity-60 mb-1 ${isDarkMode ? 'text-pale-gold' : 'text-[#4E5C4C]'}`}>
                            This Week
                        </span>
                        <span className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-[#4E5C4C]'}`}>
                            {practiceStats.thisWeek}
                        </span>
                    </div>
                    <div className="h-10 w-px bg-current opacity-10" />
                    <div className="flex flex-col items-end">
                        <span className={`text-[10px] uppercase tracking-widest opacity-60 mb-1 ${isDarkMode ? 'text-pale-gold' : 'text-[#4E5C4C]'}`}>
                            This Month
                        </span>
                        <span className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-[#4E5C4C]'}`}>
                            {practiceStats.thisMonth}
                        </span>
                    </div>
                </div>

                {/* Compact Bar Chart */}
                <div className={`p-4 rounded-xl flex flex-col justify-end h-32 relative ${isDarkMode ? 'bg-black/20' : 'bg-[#4E5C4C]/5'}`}>
                    {/* Range Toggles (Compact style absolute positioned) */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button
                            onClick={() => setTimeRange('week')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${timeRange === 'week'
                                ? (isDarkMode ? 'bg-pale-gold text-[#2E3B2B]' : 'bg-[#4E5C4C] text-white')
                                : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-[#4E5C4C]/40 hover:text-[#4E5C4C]')
                                }`}
                        >
                            WK
                        </button>
                        <button
                            onClick={() => setTimeRange('month')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${timeRange === 'month'
                                ? (isDarkMode ? 'bg-pale-gold text-[#2E3B2B]' : 'bg-[#4E5C4C] text-white')
                                : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-[#4E5C4C]/40 hover:text-[#4E5C4C]')
                                }`}
                        >
                            MO
                        </button>
                    </div>

                    <div className="flex items-end justify-between gap-1 w-full h-16 pt-4">
                        {activityStats.map((day, i) => {
                            const heightPct = Math.max((day.count / maxCount) * 100, 4);
                            const isToday = i === activityStats.length - 1;

                            return (
                                <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                    <div className={`absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded text-[10px] font-bold z-10 pointer-events-none whitespace-nowrap shadow-lg ${isDarkMode ? 'bg-white text-black' : 'bg-[#4E5C4C] text-white'}`}>
                                        {day.count} • {day.fullDay}
                                    </div>
                                    <div
                                        className={`w-full max-w-[8px] sm:max-w-[12px] rounded-t-sm transition-all duration-500 ease-out hover:opacity-80 ${isDarkMode
                                            ? (isToday ? 'bg-pale-gold' : 'bg-pale-gold/30')
                                            : (isToday ? 'bg-[#D4A853]' : 'bg-[#4E5C4C]/20') // Active amber vs passive sage
                                            }`}
                                        style={{ height: `${heightPct}%` }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                    {timeRange === 'week' && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-current border-opacity-10 w-full px-1">
                            {activityStats.map((day, i) => (
                                <span key={day.date} className={`text-[8px] font-bold uppercase ${i === activityStats.length - 1 ? (isDarkMode ? 'text-pale-gold' : 'text-[#D4A853]') : (isDarkMode ? 'text-white/40' : 'text-[#4E5C4C]/40')}`}>
                                    {day.dayLabel}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

