import React, { useMemo, useState } from 'react';
import { Sparkles, Target, Sunrise, Moon, Coffee, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface CoachCardProps {
    userName: string;
    focusCount: number;
    completedCount: number;
    isDarkMode: boolean;
    totalPractices?: number; // Total practices completed (not consecutive)
    level?: number;
    xp?: number;
    lastActivityDate?: string; // ISO date of last activity
    activityHistory?: { date: string; type: string }[];
    isCompactMode?: boolean; // Show slimmer version
    onClick?: () => void;
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
        "Afternoon slump? Take a breath, then keep going.",
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
        "All goals complete. You did it today!",
        "Done and done. That's how it's done.",
        "100% complete. Rest up, you earned it.",
    ],
    practiceCelebration: [
        "{{practices}} practices completed! You're building momentum.",
        "{{practices}} practices strong. Keep going!",
        "{{practices}} practices down. Consistency is your superpower.",
    ],
    welcomeBack: [
        "Welcome back! Ready to continue your journey?",
        "Good to see you. Let's pick up where we left off.",
        "You're here. That's what matters. Let's go.",
    ],
    longAbsence: [
        "Welcome back! We missed you.",
        "You're here. That's what matters. Let's go.",
        "Every comeback starts with showing up.",
    ],
    morningMotivation: [
        "Good morning! Let's make today count.",
        "Rise and shine. Your goals are waiting.",
    ],
    eveningReflection: [
        "Reflecting on the day. What's your biggest takeaway?",
        "Peaceful thoughts as you end your day.",
    ],
    pointsMilestone: [
        "Milestone reached! Keep exploring.",
        "You're making great progress. Stay the course.",
    ],
    generalCoaching: [
        "Take a breath. You're exactly where you need to be.",
        "Small steps lead to big changes.",
    ]
};

const getRandomMessage = (category: keyof typeof MESSAGES, replacements?: Record<string, string>): string => {
    const messages = MESSAGES[category] || MESSAGES.generalCoaching;
    let msg = messages[Math.floor(Math.random() * messages.length)];

    if (replacements) {
        Object.entries(replacements).forEach(([key, value]) => {
            msg = msg.replace(`{{${key}}}`, value);
        });
    }

    return msg;
};

const getTimeOfDay = (now: number): 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date(now).getHours();
    if (hour < 6) return 'night';
    if (hour < 9) return 'earlyMorning';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
};

const getGreeting = (now: number): string => {
    const timeOfDay = getTimeOfDay(now);
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

const getTimeIcon = (now: number) => {
    const timeOfDay = getTimeOfDay(now);
    switch (timeOfDay) {
        case 'earlyMorning':
            return <Coffee size={16} className="text-pale-gold-400" />;
        case 'morning':
            return <Sunrise size={16} className="text-pale-gold-500" />;
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
    totalPractices = 0,
    level: _level = 1,
    xp: _xp = 0,
    lastActivityDate,
    isCompactMode = false,
    onClick
}) => {
    const [now] = useState(() => Date.now());
    const greeting = getGreeting(now);

    const coachContent = useMemo(() => {
        const timeOfDay = getTimeOfDay(now);
        const daysSinceActivity = lastActivityDate
            ? Math.floor((now - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // Priority 1: Long absence (3+ days)
        if (daysSinceActivity >= 3) {
            return {
                message: getRandomMessage('longAbsence'),
                icon: <Target size={16} className="text-sage" />
            };
        }

        // Priority 2: Welcome back after short break
        if (daysSinceActivity >= 1 && daysSinceActivity < 3) {
            return {
                message: getRandomMessage('welcomeBack'),
                icon: <Target size={16} className="text-sage" />
            };
        }

        // Priority 3: All goals complete - celebrate!
        if (focusCount > 0 && completedCount === focusCount) {
            return {
                message: getRandomMessage('allComplete'),
                icon: <Star size={16} className="text-pale-gold-400" />
            };
        }

        // Priority 4: Practice milestone celebration
        if (totalPractices >= 7) {
            return {
                message: getRandomMessage('practiceCelebration', { practices: totalPractices.toString() }),
                icon: <Sparkles size={16} className="text-pale-gold" />
            };
        }

        // Priority 5: Goals in progress
        if (focusCount > 0 && completedCount < focusCount) {
            return {
                message: getRandomMessage('inProgress'),
                icon: <Target size={16} className="text-sage" />
            };
        }

        // Priority 6: Specific time-based coaching
        if (timeOfDay === 'morning') {
            return {
                message: getRandomMessage('morningMotivation'),
                icon: <Sunrise size={16} className="text-sage" />
            };
        }

        if (timeOfDay === 'night') {
            return {
                message: getRandomMessage('eveningReflection'),
                icon: <Moon size={16} className="text-sage" />
            };
        }

        // Default: General coaching or time-based nudge
        if (focusCount === 0) {
            return {
                message: getRandomMessage('noGoals'),
                icon: getTimeIcon(now)
            };
        }

        return {
            message: getRandomMessage('generalCoaching'),
            icon: <Coffee size={16} className="text-sage" />
        };
    }, [lastActivityDate, totalPractices, focusCount, completedCount, now]);

    const { message, icon: actionIcon } = coachContent;

    // --- Visual Styling - Ethereal & Minimal ---
    const bgClass = isDarkMode
        ? 'bg-white/[0.03] border-white/10 backdrop-blur-2xl'
        : 'bg-sage/[0.03] border-sage/10 backdrop-blur-2xl';

    // Typography
    const textPrimary = isDarkMode ? 'text-white' : 'text-rich-black';
    const textSecondary = isDarkMode ? 'text-white/50' : 'text-sage-dark/60';
    const textLabel = isDarkMode ? 'text-pale-gold/40' : 'text-sage/40';

    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`w-full ${isCompactMode ? 'p-5' : 'p-7'} rounded-[2.5rem] relative overflow-hidden transition-all duration-700 border shadow-lg ${bgClass} ${onClick ? 'cursor-pointer hover:bg-white/[0.05] active:scale-[0.99]' : ''}`}
        >
            {/* Minimal Ambient Glow */}
            {!isCompactMode && (
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
            )}

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/5'}`}>
                            {actionIcon || <Sparkles size={14} className={isDarkMode ? "text-pale-gold" : "text-sage"} />}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-[0.25em] ${textLabel}`}>
                            Palante Coach
                        </span>
                    </div>
                    {/* Active Presence */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5">
                        <div className={`w-1 h-1 rounded-full animate-pulse ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${textPrimary}`}>Presence</span>
                    </div>
                </div>

                <h2 className={`${isCompactMode ? 'text-xl' : 'text-2xl'} font-display font-medium mb-2 tracking-tight ${textPrimary}`}>
                    {greeting}, {userName}.
                </h2>

                <p className={`${isCompactMode ? 'text-sm' : 'text-base'} font-body leading-relaxed max-w-md mb-6 ${textSecondary}`}>
                    {message}
                </p>

                <div className="flex items-center gap-3">
                    {totalPractices > 0 && (
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-bold tracking-wider ${isDarkMode
                            ? 'bg-white/5 border-white/10 text-white/60'
                            : 'bg-sage/5 border-sage/10 text-sage/70'
                            }`}>
                            <Sparkles size={12} className={isDarkMode ? "text-pale-gold" : "text-sage"} />
                            <span>{totalPractices} {totalPractices === 1 ? 'Moment' : 'Moments'} of Zen</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
