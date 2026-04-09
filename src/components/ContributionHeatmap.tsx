import React, { useMemo } from 'react';
import type { PracticeActivity } from '../types';

interface ContributionHeatmapProps {
    activityHistory: PracticeActivity[];
    isDarkMode: boolean;
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
    activityHistory,
    isDarkMode
}) => {
    // Build 12-week grid (84 days)
    const heatmapData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days: { date: string; count: number; dayOfWeek: number }[] = [];

        // Build activity lookup map
        const activityMap = new Map<string, number>();
        activityHistory.forEach(activity => {
            const current = activityMap.get(activity.date) || 0;
            activityMap.set(activity.date, current + activity.practices.length);
        });

        // Generate last 84 days (12 weeks)
        for (let i = 83; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                count: activityMap.get(dateStr) || 0,
                dayOfWeek: date.getDay()
            });
        }

        return days;
    }, [activityHistory]);

    // Organize into weeks (columns)
    const weeks = useMemo(() => {
        const result: typeof heatmapData[] = [];
        let currentWeek: typeof heatmapData = [];

        // Pad the first week if needed
        if (heatmapData.length > 0) {
            const firstDayOfWeek = heatmapData[0].dayOfWeek;
            for (let i = 0; i < firstDayOfWeek; i++) {
                currentWeek.push({ date: '', count: -1, dayOfWeek: i }); // -1 = empty
            }
        }

        heatmapData.forEach(day => {
            currentWeek.push(day);
            if (day.dayOfWeek === 6) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        // Push remaining days
        if (currentWeek.length > 0) {
            result.push(currentWeek);
        }

        return result;
    }, [heatmapData]);

    // Color intensity based on count
    const getColor = (count: number) => {
        if (count === -1) return 'transparent';
        if (count === 0) return isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(111,123,109,0.1)';
        if (count === 1) return isDarkMode ? 'rgba(111,123,109,0.4)' : 'rgba(111,123,109,0.3)';
        if (count === 2) return isDarkMode ? 'rgba(111,123,109,0.6)' : 'rgba(111,123,109,0.5)';
        if (count >= 3) return isDarkMode ? '#6F7B6D' : '#6F7B6D';
        return isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(111,123,109,0.1)';
    };

    const totalActiveDays = heatmapData.filter(d => d.count > 0).length;
    const totalPractices = heatmapData.reduce((sum, d) => sum + Math.max(0, d.count), 0);

    const dayLabels = ['', 'M', '', 'W', '', 'F', ''];

    return (
        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/60'}`}>
            {/* Header Stats */}
            <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                    {totalActiveDays} active days
                </span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                    {totalPractices} practices
                </span>
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
                {/* Day labels column */}
                <div className="flex flex-col gap-0.5 mr-1">
                    {dayLabels.map((label, i) => (
                        <div
                            key={i}
                            className={`w-4 h-[14px] flex items-center justify-center text-[8px] ${isDarkMode ? 'text-white/30' : 'text-sage/40'
                                }`}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5">
                        {week.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className="w-[14px] h-[14px] rounded-sm transition-all hover:scale-125 cursor-default group relative"
                                style={{ backgroundColor: getColor(day.count) }}
                            >
                                {day.count >= 0 && (
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 ${isDarkMode ? 'bg-white text-black' : 'bg-sage text-white'
                                        }`}>
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {day.count > 0 && ` • ${day.count} practice${day.count > 1 ? 's' : ''}`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3">
                <span className={`text-[10px] mr-1 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>Less</span>
                {[0, 1, 2, 3].map(level => (
                    <div
                        key={level}
                        className="w-[10px] h-[10px] rounded-sm"
                        style={{ backgroundColor: getColor(level) }}
                    />
                ))}
                <span className={`text-[10px] ml-1 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>More</span>
            </div>
        </div>
    );
};
