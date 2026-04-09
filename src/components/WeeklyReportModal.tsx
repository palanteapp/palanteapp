import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, Award, Target, Activity, Flame, Calendar, Flower, Wind, Sunrise, PenLine } from 'lucide-react';
import type { WeeklyReport } from '../types';
import { haptics } from '../utils/haptics';

interface WeeklyReportModalProps {
    report: WeeklyReport;
    isOpen: boolean;
    onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
    report,
    isOpen,
    onClose
}) => {
    if (!isOpen) return null;

    const formatDateRange = () => {
        const start = new Date(report.weekStartDate);
        const end = new Date(report.weekEndDate);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const totalPractices = report.practices.meditation.count +
        report.practices.breathwork.count +
        report.practices.morningPractice.count +
        report.practices.reflections.count;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-lg bg-gradient-to-br from-warm-gray-green to-sage rounded-[2.5rem] max-h-[90vh] overflow-hidden flex flex-col transition-all duration-500"
                style={{
                    boxShadow: '0 0 80px 20px rgba(0, 0, 0, 0.4), 0 0 150px 40px rgba(111, 123, 109, 0.2), 0 0 250px 60px rgba(111, 123, 109, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={() => {
                            haptics.light();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-pale-gold/20">
                            <Calendar size={24} className="text-pale-gold" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">
                                Your Week in Review
                            </h2>
                            <p className="text-white/60 text-sm">{formatDateRange()}</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    {/* Practice Summary */}
                    <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Target size={18} className="text-pale-gold" />
                            Practice Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                label="Meditations"
                                value={report.practices.meditation.count}
                                subtitle={`${report.practices.meditation.totalMinutes} min`}
                                icon={<Flower size={24} className="text-pale-gold" />}
                            />
                            <StatCard
                                label="Breathwork"
                                value={report.practices.breathwork.count}
                                subtitle={`${report.practices.breathwork.totalMinutes} min`}
                                icon={<Wind size={24} className="text-pale-gold" />}
                            />
                            <StatCard
                                label="Morning Practice"
                                value={report.practices.morningPractice.count}
                                subtitle="sessions"
                                icon={<Sunrise size={24} className="text-pale-gold" />}
                            />
                            <StatCard
                                label="Reflections"
                                value={report.practices.reflections.count}
                                subtitle="entries"
                                icon={<PenLine size={24} className="text-pale-gold" />}
                            />
                        </div>

                        {/* Total practices with comparison */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Total Practices</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-pale-gold">{totalPractices}</span>
                                    {report.comparisonToPreviousWeek && (
                                        <ComparisonBadge change={report.comparisonToPreviousWeek.practiceChange} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Goals Achievement */}
                    <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Award size={18} className="text-pale-gold" />
                            Goals Achievement
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-3xl font-bold text-white">
                                    {report.goals.completionRate}%
                                </div>
                                <div className="text-white/60 text-sm">
                                    {report.goals.completed} of {report.goals.set} completed
                                </div>
                            </div>
                            <div className="relative w-20 h-20">
                                <ProgressRing percentage={report.goals.completionRate} />
                            </div>
                        </div>
                    </div>

                    {/* Mood & Energy */}
                    <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-pale-gold" />
                            Mood & Energy
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Average Energy</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <div
                                                key={level}
                                                className={`w-2 h-6 rounded-full ${level <= Math.round(report.moodTrends.energyAverage)
                                                    ? 'bg-pale-gold'
                                                    : 'bg-white/20'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-white font-bold">{report.moodTrends.energyAverage}/5</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Most Common Mood</span>
                                <span className="text-white font-medium">{report.moodTrends.mostCommonMood}</span>
                            </div>
                        </div>
                    </div>

                    {/* Streak Info */}
                    {report.streakInfo.maintained && (
                        <div className="bg-gradient-to-br from-pale-gold/20 to-amber-500/20 rounded-2xl p-5 border-2 border-pale-gold/40">
                            <div className="flex items-center gap-3">
                                <Flame size={32} className="text-pale-gold" fill="currentColor" />
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {report.streakInfo.currentStreak} Day Streak!
                                    </div>
                                    <div className="text-white/80 text-sm">
                                        You maintained your streak this week
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personalized Insights */}
                    {report.insights.length > 0 && (
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-white mb-4">Insights</h3>
                            <div className="space-y-3">
                                {report.insights.map((insight, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/5 rounded-xl p-3 text-white/90 text-sm leading-relaxed"
                                    >
                                        {insight}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Quotes */}
                    {report.topQuotes.length > 0 && (
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-white mb-4">Your Favorite Moments</h3>
                            <div className="space-y-3">
                                {report.topQuotes.map((quote, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/5 rounded-xl p-4"
                                    >
                                        <p className="text-white/90 text-sm italic leading-relaxed mb-2">
                                            "{quote.text}"
                                        </p>
                                        <p className="text-white/60 text-xs">— {quote.author}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-4 bg-black/20 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-pale-gold text-sage font-bold text-lg hover:bg-pale-gold/90 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Keep Going!
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components

const StatCard: React.FC<{ label: string; value: number; subtitle: string; icon: React.ReactNode }> = ({
    label, value, subtitle, icon
}) => (
    <div className="bg-white/5 rounded-xl p-3">
        <div className="mb-2">{icon}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-white/60 text-xs">{label}</div>
        <div className="text-white/40 text-xs">{subtitle}</div>
    </div>
);

const ComparisonBadge: React.FC<{ change: number }> = ({ change }) => {
    if (change === 0) {
        return (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
                <Minus size={12} className="text-white/60" />
                <span className="text-xs text-white/60">Same</span>
            </div>
        );
    }

    const isPositive = change > 0;
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-orange-500/20'
            }`}>
            {isPositive ? (
                <TrendingUp size={12} className="text-green-400" />
            ) : (
                <TrendingDown size={12} className="text-orange-400" />
            )}
            <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-orange-400'
                }`}>
                {isPositive ? '+' : ''}{change}
            </span>
        </div>
    );
};

const ProgressRing: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="6"
                fill="none"
            />
            {/* Progress circle */}
            <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#E5D6A7"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
            />
        </svg>
    );
};
