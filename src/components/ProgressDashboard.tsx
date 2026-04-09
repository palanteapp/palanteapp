/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { Sparkles, Target } from 'lucide-react';
import type { UserProfile } from '../types';

interface ProgressDashboardProps {
    user: UserProfile;
    isDarkMode: boolean;
    onShowTip?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, isDarkMode, onShowTip }) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

    // --- Data Processing Helpers ---

    // 1. Calculate practice stats (non-consecutive, supportive)
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

    // 2. Aggregate activity data
    const activityStats = useMemo(() => {
        const history = user.activityHistory || [];
        const now = new Date();
        const daysToShow = timeRange === 'week' ? 7 : 30;

        // Initialize daily buckets
        const dailyData = Array.from({ length: daysToShow }).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (daysToShow - 1 - i));
            const dateStr = d.toISOString().split('T')[0];
            return {
                date: dateStr,
                dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
                fullDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
                meditationMinutes: 0,
                journalCount: 0,
                totalActivity: 0
            };
        });

        // Fill buckets
        history.forEach(log => {
            const entry = dailyData.find(d => d.date === log.date);
            if (entry) {
                if (log.type === 'meditate') entry.meditationMinutes += log.count;
                if (log.type === 'reflect') entry.journalCount += log.count;
                entry.totalActivity += 1;
            }
        });

        return dailyData;
    }, [user.activityHistory, timeRange]);

    // --- Render Helpers ---

    const getMaxVal = (data: any[], key: string) => Math.max(...data.map(d => d[key]), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Streak Card */}
            <div className={`p-6 rounded-3xl relative overflow-hidden ${isDarkMode
                ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10'
                : 'bg-gradient-to-br from-sage/10 to-pale-gold/20 border border-sage/10'}`}>

                <div className="relative z-10">
                    {/* Total Practices - Main Stat */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles className={isDarkMode ? 'text-pale-gold' : 'text-sage'} size={20} />
                            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                Total Practices
                            </h3>
                        </div>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className={`text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {practiceStats.total}
                            </span>
                            <span className={`text-lg font-body ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                                {practiceStats.total === 1 ? 'practice' : 'practices'}
                            </span>
                        </div>
                    </div>

                    {/* This Week / This Month - Side by Side */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'} backdrop-blur-sm text-center`}>
                            <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>This Week</p>
                            <p className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {practiceStats.thisWeek}
                            </p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                {practiceStats.thisWeek === 1 ? 'practice' : 'practices'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'} backdrop-blur-sm text-center`}>
                            <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>This Month</p>
                            <p className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {practiceStats.thisMonth}
                            </p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                {practiceStats.thisMonth === 1 ? 'practice' : 'practices'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center mt-8 mb-6 gap-3">
                        <div className="flex items-center gap-3">
                            <h3 className={`font-display font-medium text-lg ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                Activity Overview
                            </h3>
                            {onShowTip && (
                                <button
                                    onClick={onShowTip}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isDarkMode
                                        ? 'text-pale-gold hover:opacity-80'
                                        : 'text-sage hover:opacity-80'
                                        }`}
                                >
                                    <Target size={10} strokeWidth={2.5} />
                                    <span>Optimization Tip</span>
                                </button>
                            )}
                        </div>
                        <div className={`flex rounded-full p-1 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                            <button
                                onClick={() => setTimeRange('week')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${timeRange === 'week'
                                    ? (isDarkMode ? 'bg-white text-black' : 'bg-sage text-white shadow-sm')
                                    : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setTimeRange('month')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${timeRange === 'month'
                                    ? (isDarkMode ? 'bg-white text-black' : 'bg-sage text-white shadow-sm')
                                    : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                Month
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meditation Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-2">
                    {activityStats.map((day, i) => {
                        const maxMins = getMaxVal(activityStats, 'meditationMinutes');
                        const heightPct = (day.meditationMinutes / maxMins) * 100;
                        const isToday = i === activityStats.length - 1;

                        return (
                            <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative">
                                <div className={`absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-xs whitespace-nowrap z-10 pointer-events-none ${isDarkMode ? 'bg-white text-black' : 'bg-sage text-white'
                                    }`}>
                                    {day.meditationMinutes} mins • {day.fullDay}
                                </div>

                                <div
                                    className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 ease-out hover:opacity-80 ${isDarkMode
                                        ? (isToday ? 'bg-pale-gold' : 'bg-indigo-400/60')
                                        : (isToday ? 'bg-sage' : 'bg-sage/40')
                                        }`}
                                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                                />
                                <span className={`text-[10px] mt-2 font-medium ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                    {day.dayLabel}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <p className={`text-center text-xs mt-4 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>
                    Practice minutes per day
                </p>
            </div>
        </div >
    );
};
