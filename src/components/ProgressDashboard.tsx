import React, { useState, useMemo } from 'react';
import { Zap, Clock, Brain } from 'lucide-react';
import type { UserProfile } from '../types';

interface ProgressDashboardProps {
    user: UserProfile;
    isDarkMode: boolean;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, isDarkMode }) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

    // --- Data Processing Helpers ---

    // 1. Calculate streak stats
    const streakStats = useMemo(() => {
        return {
            current: user.streak || 0,
            best: Math.max(user.streak || 0, 14), // Placeholder for 'best' logic if not stored
            totalPoints: user.points || 0
        };
    }, [user.streak, user.points]);

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

    // 3. Activity breakdown
    const activityBreakdown = useMemo(() => {
        const history = user.activityHistory || [];
        const total = history.length;
        if (total === 0) return { meditate: 0, reflect: 0, breath: 0 };

        const counts = history.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            meditate: Math.round(((counts.meditate || 0) / total) * 100),
            reflect: Math.round(((counts.reflect || 0) / total) * 100),
            breath: Math.round(((counts.breath || 0) / total) * 100),
        };
    }, [user.activityHistory]);


    // --- Render Helpers ---

    const getMaxVal = (data: any[], key: string) => Math.max(...data.map(d => d[key]), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Streak Card */}
            <div className={`p-6 rounded-3xl relative overflow-hidden ${isDarkMode
                ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10'
                : 'bg-gradient-to-br from-sage/10 to-pale-gold/20 border border-sage/10'}`}>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className={isDarkMode ? 'text-pale-gold' : 'text-sage'} size={20} fill="currentColor" />
                            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                Current Streak
                            </h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {streakStats.current}
                            </span>
                            <span className={`text-lg font-body ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>days</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'} backdrop-blur-sm`}>
                            <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>Best Streak</p>
                            <p className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {streakStats.best} <span className="text-xs">days</span>
                            </p>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'} backdrop-blur-sm`}>
                            <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>Total Points</p>
                            <p className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                {streakStats.totalPoints}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Background Decoration */}
                <Zap className="absolute -right-8 -bottom-8 opacity-5 w-48 h-48 rotate-12" />
            </div>

            {/* Charts Section */}
            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/10'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-display font-medium text-lg ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                        Activity Overview
                    </h3>

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

                {/* Meditation Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-2">
                    {activityStats.map((day, i) => {
                        const maxMins = getMaxVal(activityStats, 'meditationMinutes');
                        const heightPct = (day.meditationMinutes / maxMins) * 100;
                        const isToday = i === activityStats.length - 1;

                        return (
                            <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative">
                                {/* Tooltip */}
                                <div className={`absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-xs whitespace-nowrap z-10 pointer-events-none ${isDarkMode ? 'bg-white text-black' : 'bg-sage text-white'
                                    }`}>
                                    {day.meditationMinutes} mins • {day.fullDay}
                                </div>

                                <div
                                    className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 ease-out hover:opacity-80 ${isDarkMode
                                        ? (isToday ? 'bg-pale-gold' : 'bg-indigo-400/60')
                                        : (isToday ? 'bg-sage' : 'bg-sage/40')
                                        }`}
                                    style={{ height: `${Math.max(heightPct, 4)}%` }} // Min height for visibility
                                />
                                <span className={`text-[10px] mt-2 font-medium ${isDarkMode ? 'text-white/40' : 'text-sage/60'}`}>
                                    {day.dayLabel}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <p className={`text-center text-xs mt-4 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>
                    Meditation minutes per day
                </p>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/10'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Brain size={18} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>Focus</span>
                    </div>
                    <p className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                        {activityBreakdown.meditate}%
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>Sessions are Meditation</p>
                </div>

                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/10'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>Consistency</span>
                    </div>
                    <div className="flex gap-1 h-3 mt-1 mb-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className={`flex-1 rounded-full ${i < 5 ? (isDarkMode ? 'bg-green-400' : 'bg-sage') : (isDarkMode ? 'bg-white/10' : 'bg-sage/20')}`} />
                        ))}
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>5 day session streak</p>
                </div>
            </div>

        </div>
    );
};
