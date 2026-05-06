/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { Plus, Mic, Settings, TrendingUp, Zap, Goal as GoalIcon, Lightbulb, Flame, Sparkles, Fish } from 'lucide-react';
import { CoachCard } from './CoachCard';
import { FocusItem } from './FocusItem';
import { ProgressDashboard } from './ProgressDashboard';
import { CelebrationModal } from './CelebrationModal';
import { CoachSettingsModal } from './CoachSettingsModal';
import { WeeklyInsightsCard } from './WeeklyInsightsCard';
import type { UserProfile, DailyFocus, CoachSettings, EnergyLog, JournalEntry, RoutineStack } from '../types';
import { triggerConfetti, triggerHaptic } from '../utils/CelebrationEffects';
import {
    checkMilestones
} from '../utils/GamificationEngine';
import { haptics } from '../utils/haptics';
import { MilestoneCelebration } from './MilestoneCelebration';

import { SlideUpModal } from './SlideUpModal';
import { CoachGuidanceModal } from './CoachGuidanceModal';
import { ContributionHeatmap } from './ContributionHeatmap';
import { AchievementGallery } from './AchievementGallery';
import { useTheme } from '../contexts/ThemeContext';

interface MomentumProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onShowTip?: () => void;
    onLaunchRoutine?: (routine: RoutineStack) => void;
    onCreateRoutine: () => void;
    onToggleTheme?: () => void;
}

const BELL_URL = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3?filename=tibetan-singing-bowl-reverberation-1-14782.mp3";

export const Momentum: React.FC<MomentumProps> = ({
    user,
    onUpdateUser,
    onShowTip,
    onLaunchRoutine: _onLaunchRoutine,
    onCreateRoutine,
    onToggleTheme
}) => {
    const { isDarkMode } = useTheme();
    const bellRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Pre-load the bell sound
        // bellRef.current = new Audio(BELL_URL);
        // bellRef.current.volume = 0.6;
        // bellRef.current.load();
    }, []);

    const [newFocusText, setNewFocusText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isListeningFocus, setIsListeningFocus] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [hasShownCelebration, setHasShownCelebration] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    // Removed levelUpData state - no more gamification
    const [showInsightsExplainer, setShowInsightsExplainer] = useState(false);
    const [showCoachGuidance, setShowCoachGuidance] = useState(false);
    const [showStreakMilestone, setShowStreakMilestone] = useState<{ isOpen: boolean; days: number }>({ isOpen: false, days: 0 });

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

    const recognitionRef = useRef<any>(null);

    const startFocusDictation = () => {
        if (isListeningFocus) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListeningFocus(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.continuous = true; // Enable long dictation
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListeningFocus(true);

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalTranscript) {
                    setNewFocusText(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListeningFocus(false);
            };
            recognition.onend = () => setIsListeningFocus(false);
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setIsListeningFocus(false);
        }
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
            // Removed XP/Level calculation - focusing on intrinsic motivation

            const allCompleted = updatedFocuses.length > 0 && updatedFocuses.every(f => f.isCompleted);
            if (allCompleted) {
                const today = new Date().toISOString().split('T')[0];
                const lastCompletion = user.lastGoalCompletionDate;
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                let newStreak = user.goalStreak || 0;
                if (lastCompletion === yesterday) {
                    newStreak += 1;
                } else if (lastCompletion !== today) {
                    newStreak = 1;
                }

                updatedUser.goalStreak = newStreak;
                updatedUser.lastGoalCompletionDate = today;

                const milestone = checkMilestones(newStreak, user.unlockedBadges);
                if (milestone) {
                    updatedUser.unlockedBadges = [...(user.unlockedBadges || []), milestone.badge];
                    updatedUser.points = (user.points || 0) + milestone.bonusPoints;
                    
                    // Show Streak Milestone Celebration
                    setShowStreakMilestone({ isOpen: true, days: newStreak });
                }

                if (lastCompletion !== today && !milestone) {
                    setShowCelebration(true);
                }
            } else if (updatedUser.coachSettings?.tipsEnabled !== false) {
                // Show Productivity Tip on completion IF tips are enabled (default true)
                // Show Productivity Tip on completion IF tips are enabled (default true)
                // Use a small delay to ensure it feels responsive but not jarring
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
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
    const cardBg = isDarkMode ? 'glass-surface' : 'bg-white/60 border-sage/20 shadow-spa';
    const roundedClass = 'rounded-card-premium';

    return (
        <div className="w-full flex flex-col px-6 pt-6 pb-32 animate-fade-in max-w-md mx-auto">
            {/* 0. Header Area - Matching Fasting Vibe */}
            <div className="w-full flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className={`text-3xl font-display font-medium ${textPrimary}`}>Journey</h2>
                    <p className={`text-[10px] uppercase tracking-[0.3em] font-black ${isDarkMode ? 'text-white/50' : 'text-sage-dark/50'}`}>Progress & Growth</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { haptics.light(); setShowCoachGuidance(true); }}
                        className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'glass-surface text-white/80 hover:bg-white/10' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                    >
                        <Lightbulb size={20} />
                    </button>
                    <button
                        onClick={() => { haptics.light(); setShowSettings(true); }}
                        className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'glass-surface text-white/80 hover:bg-white/10' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* ── Streak & Points Hero ── */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Streak */}
                <div className={`relative rounded-2xl p-4 overflow-hidden ${isDarkMode ? 'glass-surface' : 'bg-white/70 border border-sage/15 shadow-sm'}`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#E5D6A7]/15' : 'bg-[#E5D6A7]/35'}`}>
                            <Flame size={18} color={isDarkMode ? '#E5D6A7' : '#8B6914'} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>Streak</span>
                    </div>
                    <p className={`text-4xl font-display font-bold leading-none mb-0.5 ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                        {user.streak || 0}
                    </p>
                    <p className={`text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-sage-dark/50'}`}>
                        {(user.streak || 0) === 1 ? 'day' : 'days in a row'}
                    </p>
                </div>

                {/* Points */}
                <div className={`relative rounded-2xl p-4 overflow-hidden ${isDarkMode ? 'glass-surface' : 'bg-white/70 border border-sage/15 shadow-sm'}`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#E5D6A7]/15' : 'bg-[#E5D6A7]/40'}`}>
                            <Sparkles size={18} color={isDarkMode ? '#E5D6A7' : '#8B6914'} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>Points</span>
                    </div>
                    <p className={`text-4xl font-display font-bold leading-none mb-0.5 ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                        {(user.points || 0).toLocaleString()}
                    </p>
                    <p className={`text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-sage-dark/50'}`}>
                        total earned
                    </p>
                </div>
            </div>

            {/* ── Koi Pond Progress Teaser ── */}
            {(user.streak || 0) < 30 && (
                <div className={`rounded-2xl px-4 py-3 mb-6 flex items-center gap-3 ${isDarkMode ? 'glass-surface' : 'bg-white/60 border border-sage/15 shadow-sm'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#4A7050]/40' : 'bg-[#4A7050]/15'}`}>
                        <Fish size={16} color={isDarkMode ? '#7AAD80' : '#4A7050'} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className={`text-[11px] font-semibold ${isDarkMode ? 'text-white/70' : 'text-sage-dark/70'}`}>
                                First koi unlocks at 30 days
                            </p>
                            <p className={`text-[10px] font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                {user.streak || 0}/30
                            </p>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min(100, ((user.streak || 0) / 30) * 100)}%`,
                                    background: 'linear-gradient(90deg, #4A7050, #E5D6A7)',
                                    transition: 'width 0.6s ease',
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Coach Card - Premium Glass */}
            <div className="mb-10">
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

            {/* 1. Active Goals Management */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-sage-dark/50'}`}>
                        Active Targets
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${isDarkMode ? 'text-pale-gold bg-white/5' : 'text-sage bg-sage/10'}`}>
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
                                isDarkMode={isDarkMode}
                                onToggle={handleToggleFocus}
                                onDelete={handleDeleteFocus}
                            />
                        ))
                    ) : (
                        <div className={`text-center py-8 px-6 rounded-2xl border border-dashed ${isDarkMode ? 'border-white/20 text-white/60' : 'border-sage/20 text-sage/40'}`}>
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
                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors ${isDarkMode ? 'text-white/70 group-hover:text-white' : 'text-sage/70 group-hover:text-sage'}`}>Add New Goal</span>
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
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-pale-gold/50'
                                        : 'bg-white border-sage/20 text-rich-black placeholder-sage/40 focus:border-sage'
                                        }`}
                                />
                            </div>
                            <button
                                onClick={startFocusDictation}
                                className={`p-3 rounded-xl transition-all ${isListeningFocus
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                    }`}
                            >
                                <Mic size={14} />
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAdding(false)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
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

            {/* 3. Progress Dashboard */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className={`text-xl font-display font-medium ${textPrimary}`}>
                            Momentum Tracker
                        </h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-pale-gold mt-1">Consistency Analysis</p>
                    </div>
                    <button
                        onClick={onCreateRoutine}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${isDarkMode ? 'glass-surface text-white/60 hover:text-white' : 'bg-sage/10 text-sage/70 hover:text-sage hover:bg-sage/20'}`}
                    >
                        + Create Routine
                    </button>
                </div>
                <div className={`w-full p-8 rounded-[2rem] ${cardBg}`}>
                    <ProgressDashboard
                        user={user}
                        isDarkMode={isDarkMode}
                        onShowTip={onShowTip}
                    />
                </div>
            </div>

            {/* 4. Weekly Insights (Last - reflection) */}
            <div className="mb-10">
                <h3 className={`text-lg font-display font-medium mb-4 ${textPrimary}`}>
                    Weekly Insights
                </h3>
                <WeeklyInsightsCard
                    user={user}
                    isDarkMode={isDarkMode}
                    onClick={() => setShowInsightsExplainer(true)}
                />
            </div>

            {/* 5. Your Journey (Heatmap + Achievements) */}
            <div className="mb-10">
                <h3 className={`text-lg font-display font-medium mb-4 ${textPrimary}`}>
                    Your Journey
                </h3>
                <div className="space-y-4">
                    <ContributionHeatmap
                        activityHistory={user.practiceData?.activityHistory || []}
                        isDarkMode={isDarkMode}
                    />
                    <AchievementGallery
                        unlockedBadges={user.unlockedBadges || []}
                        totalPractices={user.practiceData?.totalPractices || 0}
                        isDarkMode={isDarkMode}
                    />
                </div>
            </div>

            {/* ... other modals ... */}


            <SlideUpModal
                isOpen={showInsightsExplainer}
                onClose={() => setShowInsightsExplainer(false)}
                isDarkMode={isDarkMode}
            >
                <div className={`p-6 w-full max-w-sm mx-auto ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'}`}>
                            <TrendingUp size={24} />
                        </div>
                        <h2 className="text-2xl font-display font-medium mb-2">Unlock Your Insights</h2>
                        <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                            Once you track your focus for a few days, your Coach will start spotting patterns to help you optimize your flow.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: Lightbulb, title: "Productivity Patterns", desc: "Discover when you do your best work." },
                            { icon: Zap, title: "Energy Correlation", desc: "See how your mood affects your output." },
                            { icon: GoalIcon, title: "Consistency Score", desc: "Track your streak and reliability." }
                        ].map((item, i) => (
                            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                <item.icon size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                <div>
                                    <h3 className="font-medium text-sm mb-0.5">{item.title}</h3>
                                    <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-sage-dark/50'}`}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowInsightsExplainer(false)}
                        className={`w-full py-4 mt-8 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isDarkMode
                            ? 'bg-pale-gold text-sage-dark hover:bg-white'
                            : 'bg-[#1B4332] text-white hover:bg-sage-600'}`}
                    >
                        Got it, thanks Coach
                    </button>
                </div>
            </SlideUpModal>

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
                settings={user.coachSettings || { tipsEnabled: true, nudgeEnabled: true, nudgeFrequency: 'every-4-hours' }}
                onSave={handleSaveSettings}
                isDarkMode={isDarkMode}
                onToggleTheme={onToggleTheme || (() => { })}
            />

            {/* Celebration Modal */}
            <CelebrationModal
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                isDarkMode={isDarkMode}
            />

            <MilestoneCelebration
                isOpen={showStreakMilestone.isOpen}
                streakDays={showStreakMilestone.days}
                onClose={() => setShowStreakMilestone({ isOpen: false, days: 0 })}
            />


        </div>
    );
};
