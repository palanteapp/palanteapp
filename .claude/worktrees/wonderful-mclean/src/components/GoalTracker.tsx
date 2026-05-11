import { useState } from 'react';
import { haptics } from '../utils/haptics';
import type { Goal } from '../types';
import { Goal as GoalIcon, Plus, CheckCircle2 } from 'lucide-react';

interface GoalTrackerProps {
    goals: Goal[];
    onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentValue' | 'checkIns'>) => void;
    onCheckIn: (goalId: string, progress: number, note?: string) => void;
    isDarkMode: boolean;
    subscriptionTier: 'free' | 'premium' | 'pro';
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
    goals,
    onAddGoal,
    onCheckIn,
    isDarkMode,
    subscriptionTier
}) => {
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('');

    const activeGoals = goals.filter(g => !g.completedAt);
    const canAddMore = subscriptionTier === 'free' ? activeGoals.length < 1 :
        subscriptionTier === 'premium' ? activeGoals.length < 3 : true;

    const handleAddGoal = () => {
        if (newGoalTitle.trim()) {
            onAddGoal({
                title: newGoalTitle,
                category: newGoalCategory || 'general',
            });
            setNewGoalTitle('');
            setNewGoalCategory('');
            setShowAddGoal(false);
        }
    };

    const getProgressPercentage = (goal: Goal) => {
        if (!goal.targetValue) return 0;
        return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
    };

    const getTodayCheckIn = (goal: Goal) => {
        const today = new Date().toISOString().split('T')[0];
        return goal.checkIns.find(c => c.date.startsWith(today));
    };

    const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/50' : 'text-sage-dark/60';

    return (
        <div className={`p-8 rounded-card border mb-8 transition-colors ${cardBg}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                        <GoalIcon size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                    </div>
                    <h3 className={`text-xl font-display font-medium ${textPrimary}`}>
                        Today's Goals
                    </h3>
                </div>
                {canAddMore && (
                    <button
                        onClick={() => setShowAddGoal(!showAddGoal)}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage-dark/60'}`}
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {showAddGoal && (
                <div className="mb-8 space-y-4 animate-fade-in">
                    <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="What is your intention?"
                        className={`w-full px-6 py-4 rounded-xl font-body outline-none border transition-all ${isDarkMode
                            ? 'bg-[#3A1700]/20 border-white/10 focus:border-pale-gold text-white placeholder-white/30'
                            : 'bg-white border-sage/20 focus:border-sage text-sage-dark placeholder-sage-dark/30'
                            }`}
                    />
                    <button
                        onClick={handleAddGoal}
                        className={`w-full py-3 rounded-full font-body font-medium transition-all ${isDarkMode
                            ? 'bg-pale-gold text-sage-dark hover:bg-white'
                            : 'bg-sage text-white hover:shadow-spa'
                            }`}
                    >
                        Set Intention
                    </button>
                </div>
            )}

            {activeGoals.length === 0 ? (
                <div className={`text-center py-8 ${textSecondary}`}>
                    <p className="font-body">Set an intention to begin your journey.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeGoals.map((goal) => {
                        const todayCheckIn = getTodayCheckIn(goal);
                        const progress = getProgressPercentage(goal);

                        return (
                            <div
                                key={goal.id}
                                className={`p-6 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/40 border-sage/10'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h4 className={`font-display font-medium text-lg mb-1 ${textPrimary}`}>
                                            {goal.title}
                                        </h4>
                                        {goal.targetValue && (
                                            <p className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>
                                                {goal.currentValue} / {goal.targetValue} {goal.unit || 'steps'}
                                            </p>
                                        )}
                                    </div>
                                    {todayCheckIn ? (
                                        <div className={`p-2 rounded-full ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                            <CheckCircle2 size={24} fill="currentColor" className="opacity-20" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                haptics.medium();
                                                onCheckIn(goal.id, 1);
                                            }}
                                            className={`p-2 rounded-full transition-all hover:scale-110 ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage-dark/40'
                                                }`}
                                        >
                                            <CheckCircle2 size={24} />
                                        </button>
                                    )}
                                </div>

                                {
                                    goal.targetValue && (
                                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                                            <div
                                                className={`h-full transition-all duration-1000 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        );
                    })}
                </div>
            )
            }

            {
                !canAddMore && (
                    <p className={`text-xs text-center mt-6 font-bold uppercase tracking-widest opacity-40 ${textSecondary}`}>
                        Focus on one intention at a time
                    </p>
                )
            }
        </div >
    );
};
