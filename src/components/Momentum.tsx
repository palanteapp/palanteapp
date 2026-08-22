/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Settings, TrendingUp, Goal as GoalIcon, Lightbulb, Sparkles, Fish, ChevronRight } from 'lucide-react';
import { buildYearForwardData, hasEnoughForYearForward } from '../utils/yearForward';
import { CoachCard } from './CoachCard';
import { FocusItem } from './FocusItem';
import { CelebrationModal } from './CelebrationModal';
import { CoachSettingsModal } from './CoachSettingsModal';
import type { UserProfile, DailyFocus, CoachSettings, EnergyLog } from '../types';
import { triggerConfetti, triggerHaptic } from '../utils/CelebrationEffects';
import { haptics } from '../utils/haptics';
import { getTodayDate } from '../utils/practiceUtils';

import { CoachGuidanceModal } from './CoachGuidanceModal';
import { useTheme } from '../contexts/ThemeContext';

interface MomentumProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onShowTip?: () => void;
    onToggleTheme?: () => void;
    onOpenKoiPond?: () => void;
    onOpenYearForward?: () => void;
}

const BELL_URL = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3?filename=tibetan-singing-bowl-reverberation-1-14782.mp3";

export const Momentum: React.FC<MomentumProps> = ({
    user,
    onUpdateUser,
    onShowTip,
    onToggleTheme,
    onOpenKoiPond,
    onOpenYearForward,
}) => {
    const { isDarkMode } = useTheme();
    const bellRef = useRef<HTMLAudioElement | null>(null);

    // Today's intention, set during the morning practice
    const todaysIntention = useMemo(() => {
        const today = getTodayDate();
        const todaysPriming = (user.dailyMorningPractice || user.dailyPriming || []).find(p => p.date === today);
        return todaysPriming?.dailyIntention;
    }, [user.dailyMorningPractice, user.dailyPriming]);

    // Your Year, Forward, only surfaces once a year has enough lived data.
    const yearForwardReady = useMemo(() => {
        const data = buildYearForwardData(user);
        return hasEnoughForYearForward(data);
    }, [user]);

    useEffect(() => {
        // Pre-load the bell sound
        // bellRef.current = new Audio(BELL_URL);
        // bellRef.current.volume = 0.6;
        // bellRef.current.load();
    }, []);

    const [newFocusText, setNewFocusText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [hasShownCelebration, setHasShownCelebration] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    // Removed levelUpData state - no more gamification
    const [showCoachGuidance, setShowCoachGuidance] = useState(false);

    const dailyFocuses = user.dailyFocuses || [];
    const completedCount = dailyFocuses.filter(f => f.isCompleted).length;



    const handleAddFocus = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newFocusText.trim()) return;

        const newFocus: DailyFocus = {
            id: Date.now().toString(),
            text: newFocusText.trim(),
            isCompleted: false,
            createdAt: new Date().toISOString(),
            energyLevelWhenCreated: user.currentEnergy
        };

        const updatedUser = {
            ...user,
            dailyFocuses: [...dailyFocuses, newFocus]
        };
        onUpdateUser(updatedUser);
        setNewFocusText('');
        setIsAdding(false);
    };


    const handleToggleFocus = (id: string) => {
        const focusToToggle = dailyFocuses.find(f => f.id === id);
        if (!focusToToggle) return;

        const isCompleting = !focusToToggle.isCompleted;

        if (isCompleting) {
            triggerHaptic();
            triggerConfetti();

            if (bellRef.current) {
                bellRef.current.currentTime = 0;
                bellRef.current.play().catch(e => console.error(e));
            }
        }

        const updatedFocuses = dailyFocuses.map(f =>
            f.id === id ? { ...f, isCompleted: isCompleting } : f
        );

        const updatedUser = { ...user, dailyFocuses: updatedFocuses };

        if (isCompleting) {
            const allCompleted = updatedFocuses.length > 0 && updatedFocuses.every(f => f.isCompleted);
            if (allCompleted) {
                // A gentle "you lived your intention today" moment, once per day, no streaks or badges.
                const today = new Date().toISOString().split('T')[0];
                if (user.lastGoalCompletionDate !== today) {
                    updatedUser.lastGoalCompletionDate = today;
                    setShowCelebration(true);
                }
            } else if (updatedUser.coachSettings?.tipsEnabled !== false) {
                // Gentle tip on a single completion, if tips are enabled (default true).
                setTimeout(() => {
                    onShowTip?.();
                }, 500);
            }
        }

        onUpdateUser(updatedUser);
    };

    const handleDeleteFocus = (id: string) => {
        const updatedFocuses = dailyFocuses.filter(f => f.id !== id);
        onUpdateUser({ ...user, dailyFocuses: updatedFocuses });
    };

    const handleSaveSettings = (settings: CoachSettings) => {
        onUpdateUser({ ...user, coachSettings: settings });
    };

    const handleEnergySelect = (level: 1 | 2 | 3 | 4 | 5) => {
        const energyLog: EnergyLog = {
            timestamp: new Date().toISOString(),
            level
        };

        const updatedHistory = [...(user.energyHistory || []), energyLog];
        onUpdateUser({
            ...user,
            currentEnergy: level,
            energyHistory: updatedHistory
        });

        // Haptic feedback for energy selection
        import('../utils/CelebrationEffects').then(({ triggerHaptic }) => triggerHaptic());
    };

    // handleSaveStack moved to App.tsx - routines managed    // Styles
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage';
    const textSecondary = isDarkMode ? 'text-white' : 'text-sage-dark/60';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
    const cardBg = isDarkMode ? 'glass-surface' : 'bg-white/60 border-sage/20 shadow-spa';
    const roundedClass = 'rounded-card-premium';

    return (
        <div className="w-full flex flex-col px-6 pt-6 pb-32 animate-fade-in max-w-md mx-auto">
            {/* 0. Header Area */}
            <div className="w-full mb-8">
                <h2 className={`text-3xl font-display font-medium ${textPrimary}`}>Progress</h2>
                <p className={`text-xs uppercase tracking-[0.18em] font-black mt-2 mb-3 ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>Progress & Growth</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => { haptics.light(); setShowCoachGuidance(true); }}
                        className={`p-2.5 rounded-2xl transition-all ${isDarkMode ? 'glass-surface text-white/80 hover:bg-white/10' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                    >
                        <Lightbulb size={17} />
                    </button>
                    <button
                        onClick={() => { haptics.light(); setShowSettings(true); }}
                        className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl transition-all active:scale-95 ${isDarkMode ? 'text-white hover:brightness-110' : 'text-white hover:brightness-110'}`}
                        style={{ background: isDarkMode ? '#C96A3A' : '#C96A3A' }}
                    >
                        <Settings size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Palante Settings</span>
                    </button>
                </div>
            </div>

            {/* Coach Card - Premium Glass */}
            <div className="mb-5">
                <CoachCard
                    userName={user.name}
                    focusCount={dailyFocuses.length}
                    completedCount={completedCount}
                    isDarkMode={isDarkMode}
                    totalPractices={user.practiceData?.totalPractices || 0}
                    lastActivityDate={user.practiceData?.lastActivityDate || user.lastGoalCompletionDate}
                    onShowTip={onShowTip}
                />
            </div>

            {/* ── Today's Intention + Total Practices (merged card) ── */}
            <div className={`relative rounded-2xl p-5 mb-5 overflow-hidden flex items-stretch gap-4 ${isDarkMode ? 'glass-surface' : 'bg-white/70 border border-sage/15 shadow-sm'}`}>
                {/* Intention */}
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#E5D6A7]/15' : 'bg-[#E5D6A7]/35'}`}>
                            <GoalIcon size={14} color={isDarkMode ? '#E5D6A7' : '#8B6914'} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-sage-dark/40'}`}>Intention</span>
                    </div>
                    <p
                        className={`font-display font-bold leading-tight break-words ${(todaysIntention?.length ?? 0) > 20 ? 'text-base' : 'text-xl'} ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}
                    >
                        {todaysIntention || 'Not set'}
                    </p>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>
                        today's word
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px flex-shrink-0" style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(53,94,59,0.12)' }} />

                {/* Practices */}
                <div className="flex-shrink-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#E5D6A7]/15' : 'bg-[#E5D6A7]/40'}`}>
                            <TrendingUp size={14} color={isDarkMode ? '#E5D6A7' : '#8B6914'} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-sage-dark/40'}`}>Practices</span>
                    </div>
                    <p className={`text-xl font-display font-bold leading-tight ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                        {(user.practiceData?.totalPractices || 0).toLocaleString()}
                    </p>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>
                        completed
                    </span>
                </div>
            </div>

            {/* ── Your Year, Forward ── */}
            {yearForwardReady && onOpenYearForward && (
                <button
                    onClick={() => { haptics.medium(); onOpenYearForward(); }}
                    className="w-full rounded-2xl px-5 py-4 mb-5 flex items-center gap-4 text-left transition-all active:scale-[0.98] relative overflow-hidden"
                    style={{
                        background: isDarkMode
                            ? 'linear-gradient(135deg, rgba(201,106,58,0.18), rgba(229,214,167,0.06))'
                            : 'linear-gradient(135deg, rgba(201,106,58,0.12), rgba(229,214,167,0.18))',
                        border: '1px solid rgba(201,106,58,0.3)',
                    }}
                >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,106,58,0.85)' }}>
                        <Sparkles size={20} color="#FAF7F3" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-[15px] font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                            Your Year, Forward
                        </p>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-sage-dark/55'}`}>
                            {new Date().getFullYear()}, told back to you
                        </p>
                    </div>
                    <ChevronRight size={18} className={isDarkMode ? 'text-white/40' : 'text-sage-dark/40'} />
                </button>
            )}

            {/* ── Koi Pond Progress Teaser ── */}
            {(user.practiceData?.totalPractices || 0) < 30 && (
                <button
                    onClick={() => onOpenKoiPond?.()}
                    className={`w-full rounded-2xl px-5 py-3 mb-5 flex items-center gap-3 text-left transition-all active:scale-[0.98] ${isDarkMode ? 'glass-surface' : 'bg-white/60 border border-sage/15 shadow-sm'}`}
                >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#4A7050]/40' : 'bg-[#4A7050]/15'}`}>
                        <Fish size={16} color={isDarkMode ? '#7AAD80' : '#4A7050'} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className={`text-xs font-semibold ${isDarkMode ? 'text-white/70' : 'text-sage-dark/70'}`}>
                                First koi unlocks at 30 practices
                            </p>
                            <p className={`text-xs font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                {user.practiceData?.totalPractices || 0}/30
                            </p>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min(100, ((user.practiceData?.totalPractices || 0) / 30) * 100)}%`,
                                    background: 'linear-gradient(90deg, #4A7050, #E5D6A7)',
                                    transition: 'width 0.6s ease',
                                }}
                            />
                        </div>
                    </div>
                </button>
            )}

            {/* 1. Active Goals Management */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>
                        Active Targets
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${isDarkMode ? 'text-pale-gold bg-white/5' : 'text-sage bg-sage/10'}`}>
                            {completedCount}/{dailyFocuses.length} Done
                        </span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {dailyFocuses.length > 0 ? (
                        dailyFocuses.map((focus) => (
                            <FocusItem
                                key={focus.id}
                                focus={focus}
                                onToggle={handleToggleFocus}
                                onDelete={handleDeleteFocus}
                            />
                        ))
                    ) : (
                        <div className={`text-center py-8 px-6 rounded-2xl border border-dashed ${isDarkMode ? 'border-white/20 text-white' : 'border-sage/20 text-sage/40'}`}>
                            <p className="text-sm">No active focus goals.</p>
                        </div>
                    )}
                </div>

                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className={`w-full py-8 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all group active:scale-[0.98] border border-dashed ${isDarkMode ? 'glass-surface border-white/20 hover:border-pale-gold/40' : 'bg-sage/5 border-sage/30 hover:border-sage/60'}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5 group-hover:bg-white/10' : 'bg-sage/10 group-hover:bg-sage/20'}`}>
                            <Plus size={24} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-[0.4em] transition-colors ${isDarkMode ? 'text-white/70 group-hover:text-white' : 'text-sage/70 group-hover:text-sage'}`}>Add New Goal</span>
                    </button>
                ) : (
                    <div className={`p-6 rounded-[2rem] animate-slide-up-fade ${cardBg}`}>

                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFocusText}
                                    onChange={(e) => setNewFocusText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddFocus()}
                                    placeholder="What's your primary focus today?"
                                    className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-pale-gold/50'
                                        : 'bg-white border-sage/20 text-rich-black placeholder-sage/40 focus:border-sage'
                                        }`}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAdding(false)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAddFocus()}
                                className={`flex-1 py-3 rounded-xl font-medium transition-all ${isDarkMode
                                    ? 'bg-pale-gold text-sage-dark hover:bg-white'
                                    : 'bg-[#1B4332] text-white hover:bg-sage-600 shadow-lg'}`}
                            >
                                Create Focus
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* ... other modals ... */}

            <CoachGuidanceModal
                isOpen={showCoachGuidance}
                onClose={() => setShowCoachGuidance(false)}
                user={user}
                isDarkMode={isDarkMode}
                onAdjustGoals={() => {
                    setShowCoachGuidance(false);
                    // Goals are on the main page, so just closing brings them there usually.
                    // Or we could scroll to them if needed. For now just closing is effectively "going to goals".
                }}
                onUpdateSettings={() => {
                    setShowCoachGuidance(false);
                    setTimeout(() => setShowSettings(true), 300);
                }}
            />

            {/* Coach Settings Modal */}
            <CoachSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={user.coachSettings || { tipsEnabled: true, nudgeEnabled: true, nudgeFrequency: 'morning-evening' }}
                onSave={handleSaveSettings}
                onToggleTheme={onToggleTheme || (() => { })}
            />

            {/* Celebration Modal */}
            <CelebrationModal
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                isDarkMode={isDarkMode}
            />

        </div>
    );
};
