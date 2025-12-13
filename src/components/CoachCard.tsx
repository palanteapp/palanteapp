import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Target, Sunrise, Moon, Coffee, Zap } from 'lucide-react';

interface CoachCardProps {
    userName: string;
    focusCount: number;
    completedCount: number;
    isDarkMode: boolean;
    streak?: number;
    lastActivityDate?: string; // ISO date of last activity
    activityHistory?: { date: string; type: string }[];
}

// Message templates for different contexts
const MESSAGES = {
    morningStart: [
        "Fresh day, fresh start. What's your one priority?",
        "The morning is yours. Set your intention.",
        "A new day to move forward. Let's go.",
    ],
    morningMidway: [
        "Morning's flying by. How are you tracking?",
        "Time check: still on target?",
    ],
    afternoonPush: [
        "Afternoon slump? Take a breath, then crush it.",
        "The day isn't over. You've still got this.",
    ],
    eveningReflect: [
        "Wind down well. What went right today?",
        "Day's ending. Reflect on your wins.",
    ],
    noGoals: [
        "What are you working towards today?",
        "Set your focus. Everything starts with one goal.",
    ],
    inProgress: [
        "You've got this. Keep the momentum.",
        "One step at a time. You're doing great.",
        "Stay focused. Progress over perfection.",
    ],
    allComplete: [
        "All goals complete. You crushed it today! 🎯",
        "Done and done. That's how it's done.",
        "100% complete. Rest up, you earned it.",
    ],
    streakCelebration: [
        "{{streak}} days strong. You're on fire! 🔥",
        "{{streak}}-day streak! The chain continues.",
        "Day {{streak}}. Consistency is your superpower.",
    ],
    streakRecovery: [
        "Fresh start today. Just one goal.",
        "Clean slate. Let's build a new streak.",
        "Back at it. One day at a time.",
    ],
    longAbsence: [
        "Welcome back! We missed you.",
        "You're here. That's what matters. Let's go.",
        "Every comeback starts with showing up.",
    ],
};

const getRandomMessage = (category: keyof typeof MESSAGES, replacements?: Record<string, string>): string => {
    const messages = MESSAGES[category];
    let msg = messages[Math.floor(Math.random() * messages.length)];

    if (replacements) {
        Object.entries(replacements).forEach(([key, value]) => {
            msg = msg.replace(`{{${key}}}`, value);
        });
    }

    return msg;
};

const getTimeOfDay = (): 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 9) return 'earlyMorning';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
};

const getGreeting = (): string => {
    const timeOfDay = getTimeOfDay();
    switch (timeOfDay) {
        case 'earlyMorning':
        case 'morning':
            return 'Good morning';
        case 'afternoon':
            return 'Good afternoon';
        case 'evening':
            return 'Good evening';
        case 'night':
            return 'Hey there';
        default:
            return 'Hello';
    }
};

const getTimeIcon = () => {
    const timeOfDay = getTimeOfDay();
    switch (timeOfDay) {
        case 'earlyMorning':
            return <Coffee size={16} className="text-amber-400" />;
        case 'morning':
            return <Sunrise size={16} className="text-amber-500" />;
        case 'afternoon':
            return <Zap size={16} className="text-yellow-400" />;
        case 'evening':
            return <Moon size={16} className="text-indigo-300" />;
        case 'night':
            return <Moon size={16} className="text-indigo-400" />;
        default:
            return <Sparkles size={16} className="text-pale-gold" />;
    }
};

export const CoachCard: React.FC<CoachCardProps> = ({
    userName,
    focusCount,
    completedCount,
    isDarkMode,
    streak = 0,
    lastActivityDate,
}) => {
    const [message, setMessage] = useState('');
    const [greeting, setGreeting] = useState('');
    const [actionIcon, setActionIcon] = useState<React.ReactNode>(null);

    useEffect(() => {
        setGreeting(getGreeting());

        const timeOfDay = getTimeOfDay();
        const daysSinceActivity = lastActivityDate
            ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // Priority 1: Long absence (3+ days)
        if (daysSinceActivity >= 3) {
            setMessage(getRandomMessage('longAbsence'));
            setActionIcon(<Target size={16} className="text-emerald-400" />);
            return;
        }

        // Priority 2: Streak recovery (had streak but lost it)
        if (streak === 0 && daysSinceActivity >= 1 && daysSinceActivity < 3) {
            setMessage(getRandomMessage('streakRecovery'));
            setActionIcon(<Target size={16} className="text-amber-400" />);
            return;
        }

        // Priority 3: All goals complete - celebrate!
        if (focusCount > 0 && completedCount === focusCount) {
            setMessage(getRandomMessage('allComplete'));
            setActionIcon(<Flame size={16} className="text-orange-400" />);
            return;
        }

        // Priority 4: Active streak celebration
        if (streak >= 3) {
            setMessage(getRandomMessage('streakCelebration', { streak: streak.toString() }));
            setActionIcon(<Flame size={16} className="text-orange-500" />);
            return;
        }

        // Priority 5: Goals in progress
        if (focusCount > 0 && completedCount < focusCount) {
            setMessage(getRandomMessage('inProgress'));
            setActionIcon(<Target size={16} className="text-emerald-400" />);
            return;
        }

        // Priority 6: No goals set - time-based nudge
        if (focusCount === 0) {
            switch (timeOfDay) {
                case 'earlyMorning':
                case 'morning':
                    setMessage(getRandomMessage('morningStart'));
                    break;
                case 'afternoon':
                    setMessage(getRandomMessage('afternoonPush'));
                    break;
                case 'evening':
                    setMessage(getRandomMessage('eveningReflect'));
                    break;
                default:
                    setMessage(getRandomMessage('noGoals'));
            }
            setActionIcon(getTimeIcon());
            return;
        }

        // Default fallback
        setMessage("Take a breath. You're exactly where you need to be.");
        setActionIcon(<Sparkles size={16} className="text-pale-gold" />);

    }, [focusCount, completedCount, streak, lastActivityDate]);

    const bgClass = isDarkMode
        ? 'bg-gradient-to-br from-warm-gray-green to-stone-900 border-white/10'
        : 'bg-gradient-to-br from-sage/80 to-sage border-sage/30';

    const textPrimary = 'text-white';
    const textSecondary = isDarkMode ? 'text-white/80' : 'text-white/90';

    return (
        <div className={`w-full p-8 rounded-3xl border shadow-spa-lg relative overflow-hidden transition-all duration-500 ${bgClass}`}>
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-glow"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pale-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    {actionIcon || <Sparkles size={16} className="text-pale-gold" />}
                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>
                        Your Accountability Coach
                    </span>
                </div>

                <h2 className={`text-3xl md:text-4xl font-display font-medium mb-3 ${textPrimary}`}>
                    {greeting}, {userName}.
                </h2>

                <p className={`text-xl font-body leading-relaxed ${textSecondary}`}>
                    {message}
                </p>

                {/* Streak Display */}
                {streak > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <span className={`text-lg font-display font-medium ${textPrimary}`}>
                            {streak} day streak!
                        </span>
                    </div>
                )}

                {/* Progress indicator */}
                {focusCount > 0 && (
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-pale-gold rounded-full transition-all duration-500"
                                style={{ width: `${(completedCount / focusCount) * 100}%` }}
                            />
                        </div>
                        <span className={`text-sm font-bold ${textSecondary}`}>
                            {completedCount}/{focusCount}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
