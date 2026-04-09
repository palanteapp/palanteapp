import { useState, useEffect, useCallback, memo } from 'react';
import { Utensils, Droplet, Edit2, ChevronDown, MessageCircle, Clock, X, Calendar, HelpCircle, Microscope } from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';
import { TimePickerWheel } from './TimePickerWheel';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FeatureInfoModal } from './FeatureInfoModal';
import { FEATURE_INFO } from '../data/featureInfo';

interface FastingProps {
    isDarkMode: boolean;
    onOpenCoach?: (initialMessage?: string) => void;
}

type FastingState = 'idle' | 'active' | 'completed';

const PRESETS = [
    { label: '13h', hours: 13, name: 'Circadian Rhythm' },
    { label: '16h', hours: 16, name: '16:8 Intermittent' },
    { label: '18h', hours: 18, name: '18:6 Deep' },
    { label: '20h', hours: 20, name: 'Deep Fast' },
    { label: '24h', hours: 24, name: 'OMAD' },
    { label: '36h', hours: 36, name: 'Monk Fast' },
];

export const Fasting = memo<FastingProps>(({ isDarkMode, onOpenCoach }) => {

    // State
    const [status, setStatus] = useState<FastingState>(() => {
        return (localStorage.getItem('palante_fasting_status') as FastingState) || 'idle';
    });
    const [startTime, setStartTime] = useState<string | null>(() => {
        return localStorage.getItem('palante_fasting_start_time');
    });
    const [targetDuration, setTargetDuration] = useState<number>(() => {
        const saved = localStorage.getItem('palante_fasting_target');
        return saved ? parseFloat(saved) : 16;
    });
    const [hydrationCount, setHydrationCount] = useState<number>(() => {
        const saved = localStorage.getItem('palante_fasting_hydration');
        return saved ? parseInt(saved) : 0;
    });

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showPresets, setShowPresets] = useState(false);
    const [isEditingStart, setIsEditingStart] = useState(false);

    // Unified Info Modal State
    const [showFeatureInfo, setShowFeatureInfo] = useState(false);

    // Start time editing
    const [showStartTimeEdit, setShowStartTimeEdit] = useState(false);
    const [editStartTime, setEditStartTime] = useState('');
    const [editStartDate, setEditStartDate] = useState(''); // YYYY-MM-DD

    // History Editing
    const [editingHistoryItem, setEditingHistoryItem] = useState<{ date: string, completed: boolean, targetHours: number, actualHours: number } | null>(null);
    const [showEndTimeEdit, setShowEndTimeEdit] = useState(false);
    const [editEndTime, setEditEndTime] = useState('');
    const [editEndDate, setEditEndDate] = useState(''); // YYYY-MM-DD

    // Weight tracking
    const [showWeightLog, setShowWeightLog] = useState(false);
    const [currentWeight, setCurrentWeight] = useState<string>('');
    const [showGoalWeightModal, setShowGoalWeightModal] = useState(false);
    const [goalWeight, setGoalWeight] = useState<string>(() => {
        return localStorage.getItem('palante_fasting_goal_weight') || '';
    });
    const [tempGoalWeight, setTempGoalWeight] = useState<string>('');

    // Weekly stats - now tracking completion details
    const [fastingHistory, setFastingHistory] = useState<Array<{ date: string, completed: boolean, targetHours: number, actualHours: number }>>(() => {
        const saved = localStorage.getItem('palante_fasting_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Fasting streak
    const [fastingStreak, setFastingStreak] = useState<{ current: number, longest: number }>(() => {
        const saved = localStorage.getItem('palante_fasting_streak');
        return saved ? JSON.parse(saved) : { current: 0, longest: 0 };
    });

    // UI state
    const [manualStartTime, setManualStartTime] = useState<Date | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showMonthlyStats, setShowMonthlyStats] = useState(false);
    const [showAutophagyModal, setShowAutophagyModal] = useState(false);
    const [hasSeenAutophagy, setHasSeenAutophagy] = useState(() => {
        return localStorage.getItem('palante_seen_autophagy') === 'true';
    });

    // Initial Load / Timer Sync
    useEffect(() => {
        if (status === 'active' && startTime) {
            const interval = setInterval(() => {
                const now = Date.now();
                const start = new Date(startTime).getTime();
                const elapsed = Math.floor((now - start) / 1000);
                setElapsedSeconds(elapsed);

                // Check for autophagy milestone (16 hours)
                const hours = elapsed / 3600;
                if (hours >= 16 && !hasSeenAutophagy) {
                    setShowAutophagyModal(true);
                    setHasSeenAutophagy(true);
                    localStorage.setItem('palante_seen_autophagy', 'true');
                    triggerConfetti();
                    haptics.success();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [status, startTime, hasSeenAutophagy]);

    // Persistence
    useEffect(() => {
        localStorage.setItem('palante_fasting_status', status);
        if (startTime) localStorage.setItem('palante_fasting_start_time', startTime);
        else localStorage.removeItem('palante_fasting_start_time');
        localStorage.setItem('palante_fasting_target', targetDuration.toString());
        localStorage.setItem('palante_fasting_hydration', hydrationCount.toString());
    }, [status, startTime, targetDuration, hydrationCount]);

    // Actions
    const handleStartFast = () => {
        const start = manualStartTime ? manualStartTime.toISOString() : new Date().toISOString();
        setStartTime(start);
        setStatus('active');
        setManualStartTime(null); // Reset manual start time
        haptics.success();

        // Schedule notification
        scheduleCompletionNotification(start, targetDuration);
    };

    const handleEndFast = () => {
        const actualHours = elapsedSeconds / 3600;
        const completed = actualHours >= targetDuration;

        // Add to fasting history
        const newFast = {
            date: new Date().toISOString(),
            completed,
            targetHours: targetDuration,
            actualHours
        };

        // Keep last 90 days of history
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const updatedHistory = [...fastingHistory, newFast].filter(f => new Date(f.date) > ninetyDaysAgo);

        setFastingHistory(updatedHistory);
        localStorage.setItem('palante_fasting_history', JSON.stringify(updatedHistory));

        haptics.success();

        // Update streak
        if (completed) {
            const newStreak = {
                current: fastingStreak.current + 1,
                longest: Math.max(fastingStreak.longest, fastingStreak.current + 1)
            };
            setFastingStreak(newStreak);
            localStorage.setItem('palante_fasting_streak', JSON.stringify(newStreak));
        }

        setStatus('idle');
        setStartTime(null);
        setHydrationCount(0);

        haptics.success();
        triggerConfetti();
        setShowWeightLog(true);
    };

    const handleDeleteFast = (dateToDelete: string) => {
        const updatedHistory = fastingHistory.filter(f => f.date !== dateToDelete);
        setFastingHistory(updatedHistory);
        localStorage.setItem('palante_fasting_history', JSON.stringify(updatedHistory));
        haptics.selection();
    };

    const handleSaveHistoryEdit = () => {
        if (!editingHistoryItem || !editStartDate || !editEndDate) return;

        // Parse Start Date/Time
        const [sY, sM, sD] = editStartDate.split('-').map(Number);
        const [sH, sMin] = editStartTime.split(':').map(Number);
        const startDate = new Date(sY, sM - 1, sD, sH, sMin, 0, 0);

        // Parse End Date/Time
        const [eY, eM, eD] = editEndDate.split('-').map(Number);
        const [eH, eMin] = editEndTime.split(':').map(Number);
        const endDate = new Date(eY, eM - 1, eD, eH, eMin, 0, 0);

        // Basic Validation
        if (endDate <= startDate) {
            haptics.error();
            alert("End time must be after start time");
            return;
        }

        const newActualHours = (endDate.getTime() - startDate.getTime()) / 3600000;
        const newCompleted = newActualHours >= editingHistoryItem.targetHours;

        const updatedFast = {
            ...editingHistoryItem,
            date: startDate.toISOString(),
            actualHours: newActualHours,
            completed: newCompleted
        };

        const otherFasts = fastingHistory.filter(f => f.date !== editingHistoryItem.date);
        const updatedHistory = [...otherFasts, updatedFast].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setFastingHistory(updatedHistory);
        localStorage.setItem('palante_fasting_history', JSON.stringify(updatedHistory));

        setEditingHistoryItem(null);
        haptics.success();
    };

    const handleSaveEndTime = () => {
        if (!startTime || !editEndDate || !editEndTime) return;

        const [y, m, d] = editEndDate.split('-').map(Number);
        const [h, min] = editEndTime.split(':').map(Number);
        const newEndDate = new Date(y, m - 1, d, h, min, 0, 0);
        const start = new Date(startTime);

        if (newEndDate <= start) {
            haptics.error();
            alert("End time must be after start time");
            return;
        }

        const newDuration = (newEndDate.getTime() - start.getTime()) / 3600000;
        setTargetDuration(parseFloat(newDuration.toFixed(1)));
        setShowEndTimeEdit(false);
        haptics.success();
    };

    const scheduleCompletionNotification = async (start: string, durationHours: number) => {
        try {
            const endDate = new Date(new Date(start).getTime() + durationHours * 60 * 60 * 1000);
            await LocalNotifications.schedule({
                notifications: [{
                    title: "Fasting Goal Reached! 🎉",
                    body: `You've completed your ${durationHours}h fast. Time to nourish!`,
                    id: 8888,
                    schedule: { at: endDate },
                    sound: 'beep.caf',
                    smallIcon: 'ic_stat_icon_config_sample',
                }]
            });
        } catch (e) {
            console.error('Failed to schedule fasting notification', e);
        }
    };

    const adjustStartTime = (minutes: number) => {
        if (!startTime) return;
        const currentStartMs = new Date(startTime).getTime();
        const newStartMs = currentStartMs + minutes * 60000;

        // Prevent start time in future
        if (newStartMs > Date.now()) {
            haptics.error();
            return;
        }

        const newStartISO = new Date(newStartMs).toISOString();
        setStartTime(newStartISO);

        // Immediate update of elapsed time to prevent "stuck" feeling
        const now = Date.now();
        const elapsed = Math.floor((now - newStartMs) / 1000);
        setElapsedSeconds(elapsed);
        haptics.selection();
    };

    const getProgress = () => {
        const totalSeconds = targetDuration * 3600;
        const progress = Math.min(100, (elapsedSeconds / totalSeconds) * 100);
        return progress;
    };

    const getEndTime = () => {
        if (!startTime) return null;
        const end = new Date(new Date(startTime).getTime() + targetDuration * 60 * 60 * 1000);
        return end;
    };

    const formatDateTime = (date: Date) => {
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

        const isTomorrow = new Date(now.getTime() + 86400000).getDate() === date.getDate();

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

        if (isToday) return `Today, ${timeStr}`;
        if (isYesterday) return `Yesterday, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    };

    const handleWeightSubmit = () => {
        if (currentWeight) {
            const weights = JSON.parse(localStorage.getItem('palante_fasting_weights') || '[]');
            const newWeight = parseFloat(currentWeight);
            weights.push({ date: new Date().toISOString(), weight: newWeight });
            localStorage.setItem('palante_fasting_weights', JSON.stringify(weights));

            // Check if goal weight reached!
            const goal = goalWeight ? parseFloat(goalWeight) : null;
            if (goal && newWeight <= goal) {
                triggerConfetti();
                haptics.success();
                // Optional: Could show a special modal here
            }

            setCurrentWeight('');
            setShowWeightLog(false);
            haptics.success();
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getBodyStatus = (hours: number) => {
        if (hours < 4) return {
            stage: 'Digestion',
            desc: 'Your body is processing your last meal',
            detail: 'Blood sugar rises and falls as insulin works to store nutrients. Digestive enzymes break down food into usable energy.',
            color: isDarkMode ? 'text-white/60' : 'text-sage/60'
        };
        if (hours < 8) return {
            stage: 'Baseline',
            desc: 'Entering metabolic balance',
            detail: 'Blood sugar stabilizes as your body transitions from fed to fasted state. Insulin levels begin to drop.',
            color: isDarkMode ? 'text-white/80' : 'text-sage/80'
        };
        if (hours < 12) return {
            stage: 'Fat Burning',
            desc: 'Switching to stored energy',
            detail: 'Growth hormone increases up to 5x. Your body starts breaking down fat cells for fuel as glycogen stores deplete.',
            color: isDarkMode ? 'text-pale-gold' : 'text-sage'
        };
        if (hours < 18) return {
            stage: 'Ketosis',
            desc: 'Fat is your primary fuel source',
            detail: 'Liver produces ketones from fat. Mental clarity often peaks. Insulin at lowest levels, maximizing fat oxidation.',
            color: isDarkMode ? 'text-pale-gold' : 'text-sage'
        };
        if (hours < 24) return {
            stage: 'Autophagy',
            desc: 'Deep cellular cleanup begins',
            detail: 'Cells start recycling damaged proteins and organelles. Immune system regeneration accelerates. Anti-aging benefits activate.',
            color: isDarkMode ? 'text-white' : 'text-sage'
        };
        return {
            stage: 'Deep Repair',
            desc: 'Peak regeneration mode',
            detail: 'Maximum autophagy and stem cell production. Significant anti-inflammatory effects. Cellular rejuvenation at its peak.',
            color: isDarkMode ? 'text-pale-gold' : 'text-sage'
        };
    };

    const elapsedHours = elapsedSeconds / 3600;
    const currentStage = getBodyStatus(elapsedHours);

    // Colors - CONSISTENT WITH APP AESTHETIC
    const bgClass = 'bg-warm-gray-green/5 border-white/10'; // Consistent sage background
    const textPrimary = isDarkMode ? 'text-white' : 'text-white';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-white/70';
    const ringColor = isDarkMode ? '#E5D6A7' : '#E5D6A7'; // pale-gold for both modes
    const ringTrack = 'rgba(255,255,255,0.1)';

    return (
        <div className="w-full flex flex-col items-center px-6 pt-6 pb-32 animate-fade-in">
            {/* Header */}
            {/* Header */}
            {/* Header */}
            {/* Header */}
            {/* Header - VERTICAL STACK TO PREVENT OVERLAP */}
            <div className="w-full flex flex-col items-center justify-center mb-8 gap-4 text-center z-10 relative">
                <div className="flex flex-col items-center">
                    <h2 className={`text-3xl font-display font-medium mb-1 ${textPrimary}`}>Fasting Timer</h2>
                    <p className={`text-sm opacity-80 ${textSecondary}`}>Track your metabolic health</p>
                </div>

                {/* Buttons Row - Centered below text */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => {
                            haptics.light();
                            setShowFeatureInfo(true);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                        title="How to use"
                    >
                        <HelpCircle size={12} />
                        <span>How to Use</span>
                    </button>
                    <button
                        onClick={() => {
                            haptics.light();
                            setShowFeatureInfo(true);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${isDarkMode ? 'bg-white/10 text-pale-gold hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                    >
                        <Microscope size={12} />
                        <span>The Science</span>
                    </button>
                </div>
            </div>

            {/* Start/End Time Display */}
            {status === 'active' && startTime && (
                <div className={`w-full max-w-sm mb-6 p-4 rounded-xl ${bgClass} text-sm`}>
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className={`text-xs uppercase tracking-wider mb-1 ${textSecondary}`}>Started</div>
                            <button
                                onClick={() => {
                                    setEditStartTime(new Date(startTime).toTimeString().slice(0, 5));
                                    setShowStartTimeEdit(true);
                                }}
                                className={`font-medium truncate ${textPrimary} hover:underline cursor-pointer`}
                            >
                                {formatDateTime(new Date(startTime))}
                            </button>
                        </div>
                        <div className="text-right flex-1 min-w-0">
                            <div className={`text-xs uppercase tracking-wider mb-1 ${textSecondary}`}>Ends</div>
                            <button
                                onClick={() => {
                                    const endTime = getEndTime() || new Date();
                                    setEditEndTime(endTime.toTimeString().slice(0, 5));
                                    const year = endTime.getFullYear();
                                    const month = String(endTime.getMonth() + 1).padStart(2, '0');
                                    const day = String(endTime.getDate()).padStart(2, '0');
                                    setEditEndDate(`${year}-${month}-${day}`);
                                    setShowEndTimeEdit(true);
                                }}
                                className={`font-medium truncate ${textPrimary} hover:underline cursor-pointer`}
                            >
                                {getEndTime() ? formatDateTime(getEndTime()!) : '--'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Timer Display */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-10">
                {/* SVG Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="144" cy="144" r="130"
                        fill="none" stroke={ringTrack} strokeWidth="12"
                    />
                    <circle
                        cx="144" cy="144" r="130"
                        fill="none" stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 130}
                        strokeDashoffset={2 * Math.PI * 130 * (1 - getProgress() / 100)}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center Content */}
                <div className="flex flex-col items-center z-10 px-6 text-center">
                    {status === 'active' ? (
                        <>
                            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${currentStage.color}`}>
                                {currentStage.stage}
                            </div>
                            <div className={`text-5xl font-display font-medium tabular-nums mb-2 ${textPrimary}`}>
                                {formatTime(elapsedSeconds)}
                            </div>
                            <div className={`text-sm ${textSecondary}`}>
                                Target: {targetDuration}h
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`text-sm font-bold uppercase tracking-widest mb-4 opacity-50 ${textSecondary}`}>
                                Set Duration
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => setShowPresets(!showPresets)}
                                    className={`text-4xl font-display font-medium px-4 py-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'} ${textPrimary}`}
                                >
                                    {targetDuration}h
                                    <ChevronDown size={20} className="inline-block ml-2 opacity-50" />
                                </button>
                            </div>
                            {showPresets && (
                                <div className="absolute top-full mt-2 w-48 py-2 rounded-xl shadow-xl backdrop-blur-xl z-50 flex flex-col gap-1 overflow-hidden animate-slide-in-up bg-black/80 border border-white/10">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.hours}
                                            onClick={() => {
                                                haptics.selection();
                                                setTargetDuration(p.hours);
                                                setShowPresets(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex justify-between items-center group"
                                        >
                                            <span className="text-white font-medium">{p.label}</span>
                                            <span className="text-xs text-white/50 group-hover:text-white/70">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className={`text-xs opacity-60 ${textSecondary}`}>
                                Select duration
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Timeline / Body Status (Only when active) */}
            {status === 'active' && (
                <div className={`w-full max-w-sm p-6 rounded-2xl mb-10 transition-all ${bgClass}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-white/5 ${currentStage.color}`}>
                                <Utensils size={20} />
                            </div>
                            <div>
                                <div className={`text-base font-bold ${textPrimary}`}>{currentStage.stage}</div>
                                <div className={`text-xs ${textSecondary}`}>{currentStage.desc}</div>
                            </div>
                        </div>
                        <div className={`text-xl font-display font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                            {Math.floor(getProgress())}%
                        </div>
                    </div>

                    <div className={`text-sm leading-relaxed ${textSecondary} mb-6`}>
                        {currentStage.detail}
                    </div>

                    {/* Total Fast Progress Bar */}
                    <div className="mb-6">
                        <div className="relative w-full h-4 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className={`absolute left-0 top-0 h-full transition-all duration-1000 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                                style={{ width: `${Math.min(100, getProgress())}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${textSecondary}`}>Started</div>
                            <div className={`text-sm font-medium mb-1 ${textPrimary}`}>
                                {startTime ? formatDateTime(new Date(startTime)).split(', ')[1] || formatDateTime(new Date(startTime)) : '--'}
                            </div>
                            <div className={`text-[10px] opacity-60 ${textSecondary}`}>
                                {startTime ? formatDateTime(new Date(startTime)).split(', ')[0] : ''}
                            </div>
                            <div className={`text-[10px] mt-1 ${isDarkMode ? 'text-pale-gold/80' : 'text-sage/80'}`}>
                                {formatTime(elapsedSeconds)} elapsed
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${textSecondary}`}>Goal</div>
                            <div className={`text-sm font-medium mb-1 ${textPrimary}`}>
                                {getEndTime() ? formatDateTime(getEndTime()!).split(', ')[1] || formatDateTime(getEndTime()!) : '--'}
                            </div>
                            <div className={`text-[10px] opacity-60 ${textSecondary}`}>
                                {getEndTime() ? formatDateTime(getEndTime()!).split(', ')[0] : ''}
                            </div>
                            <div className={`text-[10px] mt-1 ${isDarkMode ? 'text-pale-gold/80' : 'text-sage/80'}`}>
                                {(() => {
                                    const totalSeconds = targetDuration * 3600;
                                    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
                                    return formatTime(remaining) + ' left';
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hydration Tracker */}
            <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 transition-all ${bgClass}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Droplet size={18} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} fill="currentColor" />
                        <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Hydration</span>
                    </div>
                    <span className={`text-2xl font-display font-medium ${textPrimary}`}>{hydrationCount}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (hydrationCount > 0) {
                                setHydrationCount(prev => prev - 1);
                                haptics.light();
                            }
                        }}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-sage/5 hover:bg-sage/10 text-sage/60'}`}
                    >
                        -
                    </button>
                    <button
                        onClick={() => {
                            const newCount = hydrationCount + 1;
                            setHydrationCount(newCount);
                            haptics.medium();

                            // Celebrate hitting 8 cups!
                            if (newCount === 8) {
                                triggerConfetti();
                                haptics.success();
                            }
                        }}
                        className={`flex-[2] py-3 rounded-xl font-medium transition-all active:scale-95 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:bg-pale-gold/90' : 'bg-sage text-white hover:bg-sage/90'}`}
                    >
                        Add Glass
                    </button>
                </div>
            </div>

            {/* Start/End Actions */}
            <div className="w-full max-w-sm flex flex-col gap-4 mb-6">
                {status === 'idle' && (
                    <div className="grid grid-cols-2 gap-3">
                        {/* Start Time Picker */}
                        <div className={`flex flex-col items-start p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-sage/5 hover:bg-sage/10'}`}
                            onClick={() => {
                                const timeToEdit = manualStartTime || new Date();
                                setEditStartTime(timeToEdit.toTimeString().slice(0, 5));

                                const year = timeToEdit.getFullYear();
                                const month = String(timeToEdit.getMonth() + 1).padStart(2, '0');
                                const day = String(timeToEdit.getDate()).padStart(2, '0');
                                setEditStartDate(`${year}-${month}-${day}`);

                                setShowStartTimeEdit(true);
                                haptics.selection();
                            }}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>Start</span>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                <span className={`text-sm font-medium ${textPrimary}`}>
                                    {manualStartTime ? formatDateTime(manualStartTime).split(', ')[1] || formatDateTime(manualStartTime) : 'Now'}
                                </span>
                            </div>
                        </div>

                        {/* End Time Picker (Calculated or Set) */}
                        <div className={`flex flex-col items-start p-4 rounded-xl transition-all cursor-pointer active:scale-[0.98] ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-sage/5 hover:bg-sage/10'}`}
                            onClick={() => {
                                const start = manualStartTime || new Date();
                                const end = new Date(start.getTime() + targetDuration * 3600000);
                                setEditEndTime(end.toTimeString().slice(0, 5));
                                const year = end.getFullYear();
                                const month = String(end.getMonth() + 1).padStart(2, '0');
                                const day = String(end.getDate()).padStart(2, '0');
                                setEditEndDate(`${year}-${month}-${day}`);
                                setShowEndTimeEdit(true);
                                haptics.selection();
                            }}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>End (approx)</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                <span className={`text-sm font-medium ${textPrimary}`}>
                                    {(() => {
                                        const start = manualStartTime || new Date();
                                        const end = new Date(start.getTime() + targetDuration * 3600000);
                                        return formatDateTime(end).split(', ')[1] || formatDateTime(end);
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'idle' ? (
                    <button
                        onClick={handleStartFast}
                        className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                    >
                        {manualStartTime ? 'Start Fasting from Selected Time' : 'Start Fasting Now'}
                    </button>
                ) : (
                    <button
                        onClick={handleEndFast}
                        className="w-full py-3 rounded-xl font-bold text-lg tracking-wide bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 border-2 border-white/20"
                    >
                        End Fast
                    </button>
                )}

                {status === 'active' && (
                    <button
                        onClick={() => setIsEditingStart(!isEditingStart)}
                        className={`flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity ${textSecondary}`}
                    >
                        <Edit2 size={12} />
                        Edit Start Time
                    </button>
                )}

                {isEditingStart && status === 'active' && (
                    <div className="flex justify-center gap-4 animate-fade-in-up">
                        <button onClick={() => adjustStartTime(-15)} className="px-3 py-1 bg-white/10 rounded-lg text-xs">-15m</button>
                        <button onClick={() => adjustStartTime(15)} className="px-3 py-1 bg-white/10 rounded-lg text-xs">+15m</button>
                        <button onClick={() => adjustStartTime(-60)} className="px-3 py-1 bg-white/10 rounded-lg text-xs">-1h</button>
                    </div>
                )}
            </div>

            {/* Weekly Progress */}
            <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 ${bgClass}`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>This Week</span>
                    <span className={`text-2xl font-display font-medium ${textPrimary}`}>{(() => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return fastingHistory.filter(f => new Date(f.date) > weekAgo).length;
                    })()} fasts</span>
                </div>
                <div className="mb-2">
                    <div className="flex gap-1 mb-1">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            const weeklyFasts = fastingHistory.filter(f => new Date(f.date) > weekAgo);
                            const fast = weeklyFasts[i];
                            let barColor = 'bg-white/10'; // Empty/no fast

                            if (fast) {
                                barColor = fast.completed
                                    ? (isDarkMode ? 'bg-pale-gold' : 'bg-sage') // Hit target
                                    : 'bg-white/20'; // Missed target - UPDATED to neutral
                            }

                            return (
                                <div
                                    key={i}
                                    className={`flex-1 h-2 rounded-full transition-all ${barColor}`}
                                    title={fast ? `${fast.actualHours.toFixed(1)}h / ${fast.targetHours}h` : 'No fast'}
                                />
                            );
                        })}
                    </div>
                    <div className="flex gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className={`flex-1 text-center text-[10px] ${textSecondary}`}>
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs mb-3">
                    <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
                        <span className={textSecondary}>Hit target</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/20" />
                        <span className={textSecondary}>Missed</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        haptics.selection();
                        setShowWeightLog(true);
                    }}
                    className={`w-full mt-2 py-2 rounded-xl text-xs font-medium transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-sage/5 hover:bg-sage/10 text-sage'}`}
                >
                    Log Weight
                </button>
            </div>

            {/* Weight Tracker Graph Area */}
            {(() => {
                const weights = JSON.parse(localStorage.getItem('palante_fasting_weights') || '[]');
                if (weights.length === 0) return null;

                const recentWeights = weights.slice(-7);
                const minWeight = Math.min(...recentWeights.map((w: any) => w.weight));
                const maxWeight = Math.max(...recentWeights.map((w: any) => w.weight));
                const latestWeight = recentWeights[recentWeights.length - 1];
                const firstWeight = recentWeights[0];
                const change = latestWeight.weight - firstWeight.weight;
                const goal = goalWeight ? parseFloat(goalWeight) : null;
                const progressToGoal = goal ? ((firstWeight.weight - latestWeight.weight) / (firstWeight.weight - goal)) * 100 : 0;

                return (
                    <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 ${bgClass}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Weight Tracker</span>
                            <div className="text-right">
                                <div className={`text-2xl font-display font-medium ${textPrimary}`}>{latestWeight.weight} lbs</div>
                                <div className={`text-xs ${textSecondary}`}>
                                    {change !== 0 && (change > 0 ? '+' : '')}{change.toFixed(1)} lbs
                                </div>
                            </div>
                        </div>

                        {/* Goal Weight Progress */}
                        {goal && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs ${textSecondary}`}>Goal: {goal} lbs</span>
                                    <span className={`text-xs font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                        {Math.abs(latestWeight.weight - goal).toFixed(1)} lbs to go
                                    </span>
                                </div>
                                <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                                        style={{ width: `${Math.min(100, Math.max(0, progressToGoal))}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-end gap-1 h-20 mb-3">
                            {recentWeights.map((w: any, i: number) => {
                                const heightPercent = maxWeight === minWeight ? 50 : ((w.weight - minWeight) / (maxWeight - minWeight)) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="text-[8px] text-white/40">{w.weight}</div>
                                        <div
                                            className={`w-full rounded-t transition-all ${isDarkMode ? 'bg-pale-gold/60' : 'bg-sage/60'}`}
                                            style={{ height: `${Math.max(20, heightPercent)}%` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => {
                                setTempGoalWeight(goalWeight);
                                setShowGoalWeightModal(true);
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-sage/5 hover:bg-sage/10 text-sage'}`}
                        >
                            {goal ? 'Update Goal Weight' : 'Set Goal Weight'}
                        </button>
                    </div>
                );
            })()}

            {/* Fasting Streak replaced with cleaner version to remove pulse/fire if needed, but keeping for now with correct Text */}
            {fastingStreak.current > 0 && (
                <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 ${bgClass}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`text-4xl ${fastingStreak.current >= 7 ? 'animate-pulse' : ''}`}>
                                🔥
                            </div>
                            <div>
                                <div className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Fasting Streak</div>
                                <div className={`text-xs ${textSecondary}`}>Keep it going!</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-3xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>{fastingStreak.current}</div>
                            <div className={`text-xs ${textSecondary}`}>Best: {fastingStreak.longest}</div>
                        </div>
                    </div>
                </div>
            )}


            {/* Fasting History */}
            {fastingHistory.length > 0 && (
                <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 ${bgClass}`}>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between mb-3"
                    >
                        <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Fasting History</span>
                        <ChevronDown size={16} className={`transition-transform ${showHistory ? 'rotate-180' : ''} ${textSecondary}`} />
                    </button>

                    {showHistory && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {fastingHistory.slice(-30).reverse().map((fast, i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <div>
                                        <div className={`text-xs font-medium ${textPrimary}`}>
                                            {new Date(fast.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className={`text-[10px] ${textSecondary}`}>
                                            {fast.actualHours.toFixed(1)}h / {fast.targetHours}h
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-xs font-bold ${fast.completed ? (isDarkMode ? 'text-pale-gold' : 'text-sage') : (isDarkMode ? 'text-white/40' : 'text-sage/40')}`}>
                                            {fast.completed ? '✓ Completed' : '⚠️ Early'}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const startDate = new Date(fast.date);
                                                const endDate = new Date(startDate.getTime() + fast.actualHours * 3600000);

                                                // Format Date for Input (YYYY-MM-DD) - Local Time
                                                const formatDate = (d: Date) => {
                                                    const year = d.getFullYear();
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    return `${year}-${month}-${day}`;
                                                };

                                                setEditStartTime(startDate.toTimeString().slice(0, 5));
                                                setEditStartDate(formatDate(startDate));

                                                setEditEndTime(endDate.toTimeString().slice(0, 5));
                                                setEditEndDate(formatDate(endDate));

                                                setEditingHistoryItem(fast);
                                                haptics.selection();
                                            }}
                                            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors mr-2 ${textSecondary}`}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFast(fast.date);
                                            }}
                                            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${textSecondary}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Monthly Summary */}
            {fastingHistory.length > 0 && (() => {
                const now = new Date();
                const thisMonth = fastingHistory.filter(f => {
                    const fastDate = new Date(f.date);
                    return fastDate.getMonth() === now.getMonth() && fastDate.getFullYear() === now.getFullYear();
                });

                if (thisMonth.length === 0) return null;

                const totalHours = thisMonth.reduce((sum, f) => sum + f.actualHours, 0);
                const avgDuration = totalHours / thisMonth.length;
                const completionRate = (thisMonth.filter(f => f.completed).length / thisMonth.length) * 100;

                return (
                    <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 ${bgClass}`}>
                        <button
                            onClick={() => setShowMonthlyStats(!showMonthlyStats)}
                            className="w-full flex items-center justify-between mb-3"
                        >
                            <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>This Month</span>
                            <ChevronDown size={16} className={`transition-transform ${showMonthlyStats ? 'rotate-180' : ''} ${textSecondary}`} />
                        </button>

                        {showMonthlyStats && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <div className={`text-2xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                        {totalHours.toFixed(0)}h
                                    </div>
                                    <div className={`text-xs ${textSecondary}`}>Total Hours</div>
                                </div>
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <div className={`text-2xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                        {avgDuration.toFixed(1)}h
                                    </div>
                                    <div className={`text-xs ${textSecondary}`}>Avg Duration</div>
                                </div>
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <div className={`text-2xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                        {completionRate.toFixed(0)}%
                                    </div>
                                    <div className={`text-xs ${textSecondary}`}>Completion Rate</div>
                                </div>
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <div className={`text-2xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                        {thisMonth.length}
                                    </div>
                                    <div className={`text-xs ${textSecondary}`}>Total Fasts</div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}


            {/* Ask Coach About Fasting */}
            {onOpenCoach && (
                <div className={`w-full max-w-sm p-5 rounded-2xl mb-6 ${bgClass}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <MessageCircle size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Ask Coach</span>
                    </div>
                    <div className="space-y-2">
                        <button
                            onClick={() => onOpenCoach('What are the best ways to break my fast?')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-sage/5 hover:bg-sage/10 text-sage'}`}
                        >
                            💡 Best ways to break my fast?
                        </button>
                        <button
                            onClick={() => onOpenCoach('What should I eat during my eating window?')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-sage/5 hover:bg-sage/10 text-sage'}`}
                        >
                            🍽️ What should I eat during my window?
                        </button>
                        <button
                            onClick={() => onOpenCoach('How can I manage hunger during fasting?')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-sage/5 hover:bg-sage/10 text-sage'}`}
                        >
                            🧘 Managing hunger tips?
                        </button>
                        <button
                            onClick={() => onOpenCoach('Is it normal to feel [describe symptom] while fasting?')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-sage/5 hover:bg-sage/10 text-sage'}`}
                        >
                            ❓ Ask about fasting symptoms
                        </button>
                    </div>
                </div>
            )}

            {/* Unified Feature Info Modal */}
            <FeatureInfoModal
                isOpen={showFeatureInfo}
                onClose={() => setShowFeatureInfo(false)}
                isDarkMode={isDarkMode}
                featureName="Fasting Timer"
                howToUse={FEATURE_INFO.fasting.howToUse}
                theScience={FEATURE_INFO.fasting.theScience}
            />

            {/* Weight Log Modal */}
            {showWeightLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setShowWeightLog(false)} />
                    <div className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-warm-gray-green/90 backdrop-blur-xl border border-white/10' : 'bg-white/90 backdrop-blur-xl border border-sage/20'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>Log Your Weight</h3>
                        <input
                            type="number"
                            step="0.1"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder="Enter weight (lbs)"
                            className={`w-full px-4 py-3 rounded-xl mb-4 ${isDarkMode ? 'bg-white/10 text-white placeholder-white/40' : 'bg-sage/10 text-sage placeholder-sage/40'}`}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWeightLog(false)}
                                className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-white/10 text-white/80' : 'bg-sage/10 text-sage'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWeightSubmit}
                                className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Weight Modal */}
            {showGoalWeightModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setShowGoalWeightModal(false)} />
                    <div className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-warm-gray-green/90 backdrop-blur-xl border border-white/10' : 'bg-white/90 backdrop-blur-xl border border-sage/20'}`}>
                        <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Set Goal Weight</h3>
                        <p className={`text-xs mb-4 ${textSecondary}`}>Track your progress toward your target weight</p>
                        <input
                            type="number"
                            step="0.1"
                            value={tempGoalWeight}
                            onChange={(e) => setTempGoalWeight(e.target.value)}
                            placeholder="Enter goal weight (lbs)"
                            className={`w-full px-4 py-3 rounded-xl mb-4 ${isDarkMode ? 'bg-white/10 text-white placeholder-white/40' : 'bg-sage/10 text-sage placeholder-sage/40'}`}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGoalWeightModal(false)}
                                className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-white/10 text-white/80' : 'bg-sage/10 text-sage'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (tempGoalWeight) {
                                        setGoalWeight(tempGoalWeight);
                                        localStorage.setItem('palante_fasting_goal_weight', tempGoalWeight);
                                        setShowGoalWeightModal(false);
                                        haptics.success();
                                    }
                                }}
                                className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Save Goal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Autophagy Milestone Modal */}
            {showAutophagyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setShowAutophagyModal(false)} />
                    <div className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-warm-gray-green/90 backdrop-blur-xl border border-white/10' : 'bg-white/90 backdrop-blur-xl border border-sage/20'}`}>
                        <div className="text-center">
                            <div className="text-6xl mb-4">✨</div>
                            <h3 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Autophagy Activated!</h3>
                            <p className={`text-sm mb-4 ${textSecondary}`}>
                                You've reached 16+ hours of fasting. Your body has entered autophagy - a powerful cellular renewal process where your cells clean out damaged components and regenerate.
                            </p>
                            <div className={`p-4 rounded-xl mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                <p className={`text-xs ${textSecondary}`}>
                                    <strong>Benefits:</strong> Enhanced cellular repair, improved brain function, reduced inflammation, and increased longevity markers.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAutophagyModal(false)}
                                className={`w-full py-3 rounded-xl font-medium ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Amazing! 🎉
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* End Time Edit Modal */}
            {showEndTimeEdit && (
                <SlideUpModal
                    isOpen={showEndTimeEdit}
                    onClose={() => setShowEndTimeEdit(false)}
                    isDarkMode={isDarkMode}
                >
                    <div className="p-6">
                        <h3 className={`text-xl font-bold mb-6 text-center ${textPrimary}`}>Edit End Time</h3>

                        {/* Date Picker */}
                        <div className="mb-6 flex justify-center">
                            <input
                                type="date"
                                value={editEndDate}
                                onChange={(e) => setEditEndDate(e.target.value)}
                                className={`px-4 py-3 rounded-xl font-medium text-center outline-none focus:ring-2 focus:ring-pale-gold/50 ${isDarkMode
                                    ? 'bg-white/10 text-white color-scheme-dark'
                                    : 'bg-sage/10 text-sage color-scheme-light'
                                    }`}
                                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                            />
                        </div>

                        <TimePickerWheel
                            value={editEndTime}
                            onChange={(val) => setEditEndTime(val)}
                            isDarkMode={isDarkMode}
                        />
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowEndTimeEdit(false)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEndTime}
                                className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </SlideUpModal>
            )}

            {/* Start Time Edit Modal */}
            {showStartTimeEdit && (
                <SlideUpModal
                    isOpen={showStartTimeEdit}
                    onClose={() => setShowStartTimeEdit(false)}
                    isDarkMode={isDarkMode}
                >
                    <div className="p-6">
                        <h3 className={`text-xl font-bold mb-6 text-center ${textPrimary}`}>Edit Start Time</h3>

                        {/* Date Picker */}
                        <div className="mb-6 flex justify-center">
                            <input
                                type="date"
                                value={editStartDate}
                                onChange={(e) => setEditStartDate(e.target.value)}
                                className={`px-4 py-3 rounded-xl font-medium text-center outline-none focus:ring-2 focus:ring-pale-gold/50 ${isDarkMode
                                    ? 'bg-white/10 text-white color-scheme-dark'
                                    : 'bg-sage/10 text-sage color-scheme-light'
                                    }`}
                                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                            />
                        </div>

                        <TimePickerWheel
                            value={editStartTime}
                            onChange={(val) => setEditStartTime(val)}
                            isDarkMode={isDarkMode}
                        />
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowStartTimeEdit(false)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (editStartTime && editStartDate) {
                                        const [year, month, day] = editStartDate.split('-').map(Number);
                                        const [hours, minutes] = editStartTime.split(':').map(Number);

                                        const newStart = new Date();
                                        newStart.setFullYear(year);
                                        newStart.setMonth(month - 1);
                                        newStart.setDate(day);
                                        newStart.setHours(hours, minutes, 0, 0);

                                        const now = new Date();
                                        if (status === 'active') {
                                            setStartTime(newStart.toISOString());
                                            const elapsed = Math.floor((now.getTime() - newStart.getTime()) / 1000);
                                            setElapsedSeconds(elapsed);
                                        } else {
                                            setManualStartTime(newStart);
                                        }

                                        setShowStartTimeEdit(false);
                                        haptics.success();
                                        if (status === 'active') triggerConfetti();
                                    }
                                }}
                                className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </SlideUpModal>
            )}

            {/* History Edit Modal (Start & End Time) */}
            {editingHistoryItem && (
                <SlideUpModal
                    isOpen={!!editingHistoryItem}
                    onClose={() => setEditingHistoryItem(null)}
                    isDarkMode={isDarkMode}
                >
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h3 className={`text-xl font-bold mb-2 text-center ${textPrimary}`}>Edit Fast</h3>
                        <p className={`text-xs text-center mb-6 ${textSecondary}`}>
                            Adjusting details for history
                        </p>

                        <div className="space-y-8">
                            {/* Start Time Section */}
                            <div className="space-y-3">
                                <div className={`text-xs font-bold uppercase tracking-wider text-center ${textSecondary}`}>Started</div>
                                <div className="flex justify-center">
                                    <input
                                        type="date"
                                        value={editStartDate}
                                        onChange={(e) => setEditStartDate(e.target.value)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium text-center outline-none focus:ring-2 focus:ring-pale-gold/50 ${isDarkMode
                                            ? 'bg-white/10 text-white'
                                            : 'bg-sage/10 text-sage'
                                            }`}
                                        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                                    />
                                </div>
                                <TimePickerWheel
                                    value={editStartTime}
                                    onChange={(val) => setEditStartTime(val)}
                                    isDarkMode={isDarkMode}
                                />
                            </div>

                            {/* Divider */}
                            <div className={`w-full h-px ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />

                            {/* End Time Section */}
                            <div className="space-y-3">
                                <div className={`text-xs font-bold uppercase tracking-wider text-center ${textSecondary}`}>Ended</div>
                                <div className="flex justify-center">
                                    <input
                                        type="date"
                                        value={editEndDate}
                                        onChange={(e) => setEditEndDate(e.target.value)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium text-center outline-none focus:ring-2 focus:ring-pale-gold/50 ${isDarkMode
                                            ? 'bg-white/10 text-white'
                                            : 'bg-sage/10 text-sage'
                                            }`}
                                        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                                    />
                                </div>
                                <TimePickerWheel
                                    value={editEndTime}
                                    onChange={(val) => setEditEndTime(val)}
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        </div>

                        {/* Calculated Duration Preview */}
                        <div className={`mt-6 p-4 rounded-xl text-center ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                            <div className={`text-xs uppercase tracking-wider ${textSecondary}`}>New Duration</div>
                            <div className={`text-2xl font-display font-medium ${textPrimary}`}>
                                {(() => {
                                    if (!editStartDate || !editEndDate) return '--';

                                    const [sY, sM, sD] = editStartDate.split('-').map(Number);
                                    const [sH, sMin] = editStartTime.split(':').map(Number);
                                    const start = new Date(sY, sM - 1, sD, sH, sMin);

                                    const [eY, eM, eD] = editEndDate.split('-').map(Number);
                                    const [eH, eMin] = editEndTime.split(':').map(Number);
                                    const end = new Date(eY, eM - 1, eD, eH, eMin);

                                    const diffMs = end.getTime() - start.getTime();
                                    if (diffMs < 0) return 'Invalid Range';

                                    const totalMinutes = Math.floor(diffMs / 60000);
                                    const h = Math.floor(totalMinutes / 60);
                                    const m = totalMinutes % 60;
                                    return `${h}h ${m}m`;
                                })()}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingHistoryItem(null)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveHistoryEdit}
                                className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                            >
                                Update Fast
                            </button>
                        </div>
                    </div>
                </SlideUpModal>
            )}
        </div>
    );
});
