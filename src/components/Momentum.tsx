/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Settings, TrendingUp, Goal as GoalIcon, Lightbulb, Sparkles, Fish, ChevronRight, RotateCcw } from 'lucide-react';
import { buildYearForwardData, hasEnoughForYearForward } from '../utils/yearForward';
import { CoachCard } from './CoachCard';
import { PageHeader } from './PageHeader';
import { FocusItem } from './FocusItem';
import { CelebrationModal } from './CelebrationModal';
import { CoachSettingsModal } from './CoachSettingsModal';
import type { UserProfile, DailyFocus, CoachSettings, EnergyLog } from '../types';
import { triggerConfetti, triggerHaptic } from '../utils/CelebrationEffects';
import { haptics } from '../utils/haptics';
import { getTodayDate, findMorningEntryForDate } from '../utils/practiceUtils';

import { CoachGuidanceModal } from './CoachGuidanceModal';
import { useTheme } from '../contexts/ThemeContext';

interface MomentumProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onShowTip?: () => void;
    onToggleTheme?: () => void;
    onOpenKoiPond?: () => void;
    onOpenYearForward?: () => void;
    /** Reopens the morning practice flow so today's intention can be redone. Hidden entirely when not provided. */
    onRedoMorningPractice?: () => void;
}

const BELL_URL = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3?filename=tibetan-singing-bowl-reverberation-1-14782.mp3";

export const Momentum: React.FC<MomentumProps> = ({
    user,
    onUpdateUser,
    onShowTip,
    onToggleTheme,
    onOpenKoiPond,
    onOpenYearForward,
    onRedoMorningPractice,
}) => {
    const { isDarkMode } = useTheme();
    const bellRef = useRef<HTMLAudioElement | null>(null);

    // Today's intention, set during the morning practice
    const todaysIntention = useMemo(() => {
        const today = getTodayDate();
        return findMorningEntryForDate(user, today)?.dailyIntention;
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

        const updatedFocuses = dailyFocuses.map(f =>
            f.id === id ? { ...f, isCompleted: isCompleting } : f
        );

        const updatedUser = { ...user, dailyFocuses: updatedFocuses };

        if (isCompleting) {
            const allCompleted = updatedFocuses.length > 0 && updatedFocuses.every(f => f.isCompleted);
            let celebratingAllDone = false;
            if (allCompleted) {
                // A gentle "you lived your intention today" moment, once per day, no streaks or badges.
                const today = getTodayDate();
                if (user.lastGoalCompletionDate !== today) {
                    updatedUser.lastGoalCompletionDate = today;
                    celebratingAllDone = true;
                }
            }

            if (celebratingAllDone) {
                // CelebrationModal fires its own independent confetti for "all goals
                // done" — firing the plain burst below too meant two different
                // confetti systems running on top of each other for the same event.
                setShowCelebration(true);
            } else {
                triggerHaptic();
                triggerConfetti();

                if (bellRef.current) {
                    bellRef.current.currentTime = 0;
                    bellRef.current.play().catch(e => console.error(e));
                }

                if (!allCompleted && updatedUser.coachSettings?.tipsEnabled !== false) {
                    // Gentle tip on a single completion, if tips are enabled (default true).
                    setTimeout(() => {
                        onShowTip?.();
                    }, 500);
                }
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
            {/* 0. Header Area — shared PageHeader pattern (see PageHeader.tsx).
                The eyebrow used to read "Progress & Growth", which just restated the
                title above it. */}
            <PageHeader
                title="Progress"
                eyebrow={<span>Everything you&apos;ve built</span>}
                actions={
                    <>
                        <button
                            onClick={() => { haptics.light(); setShowCoachGuidance(true); }}
                            className="p-2.5 rounded-2xl transition-all glass-surface text-white/80 hover:bg-white/10"
                            aria-label="How Progress works"
                        >
                            <Lightbulb size={17} />
                        </button>
                        <button
                            onClick={() => { haptics.light(); setShowSettings(true); }}
                            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl transition-all active:scale-95 bg-pale-gold text-sage-dark hover:brightness-105"
                        >
                            <Settings size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Palante Settings</span>
                        </button>
                    </>
                }
            />

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

            {/* ── Active Targets ── The one actionable thing on this screen,
                so it leads right after the Coach greeting instead of sitting
                after several read-only stat cards a user had to scroll past
                to reach anything they could actually tap. Everything below
                here is look-don't-touch: today's intention, then how far
                you've come overall. */}
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
                                    : 'bg-sage-dark text-white hover:bg-sage shadow-lg'}`}
                            >
                                Create Focus
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Today's Intention ──────────────────────────────────────
                Its own full-width card, not sharing a row with Practices. A
                merged two-column layout gave a longer word or phrase maybe
                half the card's width, so anything past ~20 characters had to
                be shrunk and still often broke ugly. Full width + wrapping
                (no forced single line, no shrink-to-fit) is the actual fix —
                see PRACTICES below for why it moved to its own card instead. */}
            <div className={`relative rounded-2xl p-5 mb-3 overflow-hidden ${isDarkMode ? 'glass-surface' : 'bg-white/70 border border-sage/15 shadow-sm'}`}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#E5D6A7]/15' : 'bg-[#E5D6A7]/35'}`}>
                            <GoalIcon size={14} color={isDarkMode ? '#E5D6A7' : '#8B6914'} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-sage-dark/40'}`}>Intention</span>
                    </div>
                    {/* Quiet redo, only once there's something set today to redo. Same
                        pattern (icon, weight, hover) as the Home tab's own redo row,
                        so this doesn't introduce a second visual language for it. */}
                    {todaysIntention && onRedoMorningPractice && (
                        <button
                            onClick={onRedoMorningPractice}
                            aria-label="Redo morning practice"
                            className={`flex-shrink-0 p-1.5 -m-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-sage-dark/25 hover:text-sage-dark/50 hover:bg-sage/5'}`}
                        >
                            <RotateCcw size={13} />
                        </button>
                    )}
                </div>
                <p className={`font-display font-bold leading-snug break-words text-2xl ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                    {todaysIntention || 'Not set'}
                </p>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>
                    today's word
                </span>
            </div>

            {/* ── Practices ── Merged with the koi-pond unlock progress: these
                used to be two separate, stacked cards both showing the exact
                same total-practices number — once as a bare count, once as
                "X/30" a few dozen pixels below it — which read as a display
                bug more than two features. One card now: the count always up
                top, the koi progress bar underneath only while there's still
                a milestone to chase. Once the first koi arrives that row
                would just be nagging over nothing, so it drops away and this
                quietly becomes the plain stat it always was underneath. */}
            {(user.practiceData?.totalPractices || 0) < 30 ? (
                <button
                    onClick={() => onOpenKoiPond?.()}
                    className={`w-full rounded-2xl px-5 py-4 mb-5 text-left transition-all active:scale-[0.98] ${isDarkMode ? 'glass-surface' : 'bg-white/70 border border-sage/15 shadow-sm'}`}
                >
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#4A7050]/30' : 'bg-[#4A7050]/15'}`}>
                            <Fish size={14} color={isDarkMode ? '#7AAD80' : '#4A7050'} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest flex-1 min-w-0 ${isDarkMode ? 'text-white' : 'text-sage-dark/40'}`}>Practices</span>
                        <p className={`text-2xl font-display font-bold leading-none tabular-nums ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                            {(user.practiceData?.totalPractices || 0).toLocaleString()}
                        </p>
                    </div>
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
                </button>
            ) : (
                <div className={`rounded-2xl px-5 py-4 mb-5 flex items-center gap-3 ${isDarkMode ? 'glass-surface' : 'bg-white/70 border border-sage/15 shadow-sm'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#E5D6A7]/15' : 'bg-[#E5D6A7]/40'}`}>
                        <TrendingUp size={14} color={isDarkMode ? '#E5D6A7' : '#8B6914'} />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest flex-1 min-w-0 ${isDarkMode ? 'text-white' : 'text-sage-dark/40'}`}>Practices</span>
                    <p className={`text-2xl font-display font-bold leading-none tabular-nums ${isDarkMode ? 'text-pale-gold' : 'text-sage-dark'}`}>
                        {(user.practiceData?.totalPractices || 0).toLocaleString()}
                    </p>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark/50'}`}>
                        completed
                    </span>
                </div>
            )}

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
