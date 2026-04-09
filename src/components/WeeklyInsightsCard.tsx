import React from 'react';
import { TrendingUp, Lightbulb, Award, Zap, ChevronRight } from 'lucide-react';
import { generateWeeklyInsights, type Insight } from '../utils/insightsAnalyzer';
import type { UserProfile } from '../types';

interface WeeklyInsightsCardProps {
    user: UserProfile;
    isDarkMode: boolean;
    onClick?: () => void;
}

const getInsightIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        'target': <Award size={20} className="text-sage" />,
        'lightbulb': <Lightbulb size={20} className="text-amber-400" />,
        'trending': <TrendingUp size={20} className="text-blue-400" />,
        'zap': <Zap size={20} className="text-yellow-400" />,
        'flame': <Zap size={20} className="text-orange-500" />,
        'scale': <Award size={20} className="text-purple-400" />,
        'battery': <Lightbulb size={20} className="text-cyan-400" />,
        'scissors': <Lightbulb size={20} className="text-pink-400" />,
    };
    return iconMap[icon] || <Lightbulb size={20} className="text-pale-gold" />;
};

const getInsightColor = (type: Insight['type'], isDarkMode: boolean) => {
    const colors = {
        achievement: isDarkMode ? 'border-sage/30 bg-sage/10' : 'border-sage/40 bg-sage/10',
        pattern: isDarkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-500/40 bg-blue-50',
        recommendation: isDarkMode ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-500/40 bg-amber-50',
        energy: isDarkMode ? 'border-purple-500/30 bg-purple-500/10' : 'border-purple-500/40 bg-purple-50',
    };
    return colors[type];
};

export const WeeklyInsightsCard: React.FC<WeeklyInsightsCardProps> = ({ user, isDarkMode, onClick }) => {
    const insights = generateWeeklyInsights(user);
    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';

    if (insights.length === 0) {
        return (
            <div
                onClick={onClick}
                className={`w-full p-6 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'} ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:bg-white/10' : ''}`}
            >
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    <h3 className={`text-lg font-display font-medium ${textPrimary}`}>
                        Weekly Insights
                    </h3>
                </div>
                <p className={`text-sm ${textSecondary}`}>
                    Keep using Palante to unlock personalized insights about your productivity patterns!
                </p>
                {onClick && (
                    <div className={`mt-3 text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                        <span>See What's Coming</span>
                        <ChevronRight size={12} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`w-full p-6 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'} ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <TrendingUp size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    <h3 className={`text-lg font-display font-medium ${textPrimary}`}>
                        Weekly Insights
                    </h3>
                </div>
                <span className={`text-xs uppercase tracking-wider font-bold ${textSecondary}`}>
                    Last 30 Days
                </span>
            </div>

            {/* Insights Grid */}
            <div className="space-y-3">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`p-4 rounded-xl border transition-all ${getInsightColor(insight.type, isDarkMode)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {getInsightIcon(insight.icon)}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-display font-medium mb-1 ${textPrimary}`}>
                                    {insight.title}
                                </h4>
                                <p className={`text-sm mb-2 ${textSecondary}`}>
                                    {insight.description}
                                </p>
                                {insight.actionable && (
                                    <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'
                                        }`}>
                                        <ChevronRight size={14} />
                                        <span>{insight.actionable}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Confidence Indicator */}
            {insights.length > 0 && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                    <p className={`text-xs text-center ${textSecondary}`}>
                        Insights based on your last {user.dailyFocuses?.length || 0} goals and activity patterns
                    </p>
                </div>
            )}
        </div>
    );
};
