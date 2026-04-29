import { useState, useEffect, memo, useMemo } from 'react';
import {
    Utensils, Droplet, Edit2, ChevronDown, Clock, X,
    Calendar, HelpCircle, Target, TrendingUp,
    Scale, Shield, Zap, Brain, Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight, Minus,
    BookOpen, Plus
} from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';
import { TimePickerWheel } from './TimePickerWheel';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import { LocalNotifications } from '@capacitor/local-notifications';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface FastingProps {
    user: UserProfile;
    isDarkMode: boolean;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onOpenCoach?: (initialMessage?: string) => void;
}

type FastingState = 'idle' | 'active' | 'completed';

interface WeightEntry {
    date: string;
    weight: number;
}

interface FastRecord {
    id: string;
    startTime: string;
    endTime: string;
    targetHours: number;
    actualHours: number;
    completed: boolean;
}

interface FoodEntry {
    id: string;
    time: string;
    foods: string;
    mood: string;
    notes?: string;
}

const MOODS = [
    { id: 'hungry', label: 'Hungry' },
    { id: 'stressed', label: 'Stressed' },
    { id: 'bored', label: 'Bored' },
    { id: 'social', label: 'Social' },
    { id: 'joy', label: 'Joy' },
    { id: 'sad', label: 'Sad' },
    { id: 'tired', label: 'Tired' },
    { id: 'anxious', label: 'Anxious' },
];

const MOOD_COLORS: Record<string, string> = {
    hungry: 'bg-emerald-900/40 text-emerald-300',
    stressed: 'bg-red-900/30 text-red-300',
    bored: 'bg-blue-900/30 text-blue-300',
    social: 'bg-amber-900/30 text-amber-300',
    joy: 'bg-yellow-900/30 text-yellow-300',
    sad: 'bg-indigo-900/30 text-indigo-300',
    tired: 'bg-zinc-700/50 text-zinc-400',
    anxious: 'bg-orange-900/30 text-orange-300',
};

const PRESETS = [
    { label: '13h', hours: 13, name: 'Circadian Rhythm' },
    { label: '16h', hours: 16, name: '16:8 Intermittent' },
    { label: '18h', hours: 18, name: '18:6 Deep' },
    { label: '20h', hours: 20, name: 'Deep Fast' },
    { label: '24h', hours: 24, name: 'OMAD' },
    { label: '36h', hours: 36, name: 'Monk Fast' },
];

const SCIENCE_TIPS = [
    {
        icon: '🔥',
        milestone: 'Hour 1–4',
        headline: 'Digestion in Progress',
        body: "Your body is actively processing your last meal. Insulin rises as nutrients are absorbed — this is exactly why we fast. Every hour you hold is building metabolic flexibility.",
        encouragement: "Stay the course. The first few hours are the hardest — and the most important."
    },
    {
        icon: '⚡',
        milestone: 'Hour 8–12',
        headline: 'Fat Burning Begins',
        body: "Glycogen stores are depleting. Your body is switching to fat as fuel. Growth hormone is increasing up to 5×, protecting your muscle while burning stored energy.",
        encouragement: "You're past the halfway mark of a 16:8. Your body has shifted gears."
    },
    {
        icon: '🧠',
        milestone: 'Hour 12–18',
        headline: 'Ketosis & Mental Clarity',
        body: "Your liver is producing ketones — a clean, efficient fuel for your brain. Mental clarity often peaks here. Insulin is at its lowest, maximizing fat oxidation.",
        encouragement: "This is what peak fasting feels like. Your focus and energy are your reward."
    },
    {
        icon: '✨',
        milestone: 'Hour 18–24',
        headline: 'Autophagy Activated',
        body: "Cells are now recycling damaged proteins and organelles. Autophagy — the body's deep cleaning process — is in full swing. Anti-aging and immune regeneration benefits are peaking.",
        encouragement: "You've unlocked one of the most powerful healing states the body can enter. Elite."
    },
    {
        icon: '🌟',
        milestone: 'Hour 24+',
        headline: 'Deep Cellular Repair',
        body: "Maximum autophagy is active. Stem cell production increases significantly. Anti-inflammatory cascades are reducing systemic inflammation throughout the body.",
        encouragement: "You're doing something extraordinary. Every hour from here is pure renewal."
    }
];

const HEALTH_TIPS = {
    gain: [
        "Weight gain can often be temporary water retention caused by high sodium or intense exercise.",
        "Ensure you're getting 7+ hours of quality sleep; lack of rest can spike cortisol and cause weight fluctuations.",
        "Check your 'hidden' calories in sauces, oils, and creamers during your feeding window."
    ],
    plateau: [
        "A plateau is a normal sign your body is adapting. Try shifting your fasting window by 2 hours.",
        "Incorporate a 15-minute walk immediately after your last meal of the day.",
        "Focus on protein intake! Higher protein needs more energy to digest and keeps you full longer."
    ],
    steady: [
        "You're in a great rhythm. Consistency is the secret to long-term metabolic health.",
        "Now is a great time to focus on strength training to preserve muscle mass.",
        "Keep hydrating! Water intake is key to maintaining this steady progress."
    ]
};

export const Fasting = memo<FastingProps>(({ user, isDarkMode, onUpdateProfile, onOpenCoach }) => {
    // 1. STATE & PERSISTENCE
    const [status, setStatus] = useState<FastingState>(() => {
        return (localStorage.getItem(STORAGE_KEYS.FASTING_STATUS) as FastingState) || 'idle';
    });
    const [startTime, setStartTime] = useState<string | null>(() => {
        return localStorage.getItem(STORAGE_KEYS.FASTING_START_TIME);
    });
    const [targetHours, setTargetHours] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.FASTING_TARGET);
        return saved ? parseFloat(saved) : 16;
    });
    const [hydrationCount, setHydrationCount] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.FASTING_HYDRATION);
        return saved ? parseInt(saved) : 0;
    });
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => {
        return user.weightHistory || JSON.parse(localStorage.getItem(STORAGE_KEYS.FASTING_WEIGHTS) || '[]');
    });
    const [goalWeight, setGoalWeight] = useState<number | null>(() => {
        return user.weightGoal || null;
    });
    
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Modals
    const [showPresets, setShowPresets] = useState(false);
    const [showStartTimeEdit, setShowStartTimeEdit] = useState(false);
    const [showEndTimeEdit, setShowEndTimeEdit] = useState(false);
    const [showEndFastAdjust, setShowEndFastAdjust] = useState(false);
    const [endFastAdjustTime, setEndFastAdjustTime] = useState('');
    const [endFastAdjustDate, setEndFastAdjustDate] = useState('');
    const [showSciencePopup, setShowSciencePopup] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [currentScienceTip, setCurrentScienceTip] = useState(0);
    const [showConfirmStart, setShowConfirmStart] = useState(false);
    const [manualStartTime, setManualStartTime] = useState<string>(new Date().toISOString());
    const [showWeightLogger, setShowWeightLogger] = useState(false);
    const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);
    
    // Edit Fields
    const [editStartTime, setEditStartTime] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [newWeight, setNewWeight] = useState('');
    const [wantsCoachDeepDive, setWantsCoachDeepDive] = useState(false);

    const [hasSeenAutophagy, setHasSeenAutophagy] = useState(() => {
        return localStorage.getItem(STORAGE_KEYS.SEEN_AUTOPHAGY) === 'true';
    });
    const [hasRungGoalBell, setHasRungGoalBell] = useState(false);

    const [isAutoSync, setIsAutoSync] = useState(true);

    const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(() => {
        return (localStorage.getItem(STORAGE_KEYS.WEIGHT_UNIT) as 'lbs' | 'kg') || 'lbs';
    });

    const toDisplay = (lbs: number) => weightUnit === 'kg' ? +(lbs * 0.453592).toFixed(1) : lbs;
    const toLbs = (val: number) => weightUnit === 'kg' ? +(val / 0.453592).toFixed(1) : val;

    const [fastHistory, setFastHistory] = useState<FastRecord[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.FASTING_HISTORY) || '[]');
        } catch { return []; }
    });

    // Food Journal
    const [activeMode, setActiveMode] = useState<'fast' | 'food-journal'>('fast');
    const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_JOURNAL_ENTRIES) || '[]');
        } catch { return []; }
    });
    const [showFoodLogger, setShowFoodLogger] = useState(false);
    const [newFoodText, setNewFoodText] = useState('');
    const [selectedMood, setSelectedMood] = useState('');
    const [newFoodNotes, setNewFoodNotes] = useState('');

    // 2. TIMERS & EFFECTS

    // Auto-expire stale fasts: if active fast is >36h old, silently end it
    useEffect(() => {
        if (status === 'active' && startTime) {
            const hoursElapsed = (Date.now() - new Date(startTime).getTime()) / 3600000;
            if (hoursElapsed > 36) {
                setStatus('idle');
                setStartTime(null);
                setHydrationCount(0);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount — catches carries-over from previous sessions

    useEffect(() => {
        if (status === 'active' && startTime) {
            const interval = setInterval(() => {
                const now = Date.now();
                const start = new Date(startTime).getTime();
                const elapsed = Math.floor((now - start) / 1000);
                setElapsedSeconds(elapsed);

                // Goal reached — ring bell once (bypasses silent switch via AVAudioSession .playback)
                if (elapsed >= targetHours * 3600 && !hasRungGoalBell) {
                    setHasRungGoalBell(true);
                    ringGoalBell();
                    haptics.success();
                }

                // Autophagy check
                if (elapsed / 3600 >= 16 && !hasSeenAutophagy) {
                    setHasSeenAutophagy(true);
                    localStorage.setItem(STORAGE_KEYS.SEEN_AUTOPHAGY, 'true');
                    triggerConfetti();
                    haptics.success();
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [status, startTime, targetHours, hasSeenAutophagy, hasRungGoalBell]);

    // Update manual start time live while setting up
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (showConfirmStart && !status.includes('active') && isAutoSync) {
            interval = setInterval(() => {
                setManualStartTime(new Date().toISOString());
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [showConfirmStart, status, isAutoSync]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FASTING_STATUS, status);
        if (startTime) localStorage.setItem(STORAGE_KEYS.FASTING_START_TIME, startTime);
        else localStorage.removeItem(STORAGE_KEYS.FASTING_START_TIME);
        localStorage.setItem(STORAGE_KEYS.FASTING_TARGET, targetHours.toString());
        localStorage.setItem(STORAGE_KEYS.FASTING_HYDRATION, hydrationCount.toString());
    }, [status, startTime, targetHours, hydrationCount]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FASTING_WEIGHTS, JSON.stringify(weightHistory));
        onUpdateProfile({ weightHistory });
    }, [weightHistory, onUpdateProfile]);

    useEffect(() => {
        if (goalWeight) {
            localStorage.setItem(STORAGE_KEYS.FASTING_GOAL_WEIGHT, goalWeight.toString());
            onUpdateProfile({ weightGoal: goalWeight });
        }
    }, [goalWeight, onUpdateProfile]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FOOD_JOURNAL_ENTRIES, JSON.stringify(foodEntries));
    }, [foodEntries]);

    // Plays a bell tone via Web Audio API — bypasses iOS silent switch because
    // AppDelegate sets AVAudioSession category to .playback.
    const ringGoalBell = () => {
        try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
            frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = ctx.currentTime + i * 0.28;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.35, start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 1.1);
                osc.start(start);
                osc.stop(start + 1.1);
            });
        } catch { /* audio not available */ }
    };

    // 3. CORE ACTIONS
    const handleStartFast = () => {
        const start = new Date().toISOString();
        setStartTime(start);
        setStatus('active');
        setHasRungGoalBell(false);
        haptics.success();
        scheduleNotification(start, targetHours);
    };


    const confirmEndFast = (adjustedEndISO?: string) => {
        const endMs = adjustedEndISO ? new Date(adjustedEndISO).getTime() : Date.now();
        const startMs = startTime ? new Date(startTime).getTime() : Date.now();
        const actualHours = (endMs - startMs) / 3600000;
        const completed = actualHours >= targetHours;
        if (completed) triggerConfetti();
        haptics.success();

        if (startTime) {
            const record: FastRecord = {
                id: `fast_${Date.now()}`,
                startTime,
                endTime: adjustedEndISO || new Date().toISOString(),
                targetHours,
                actualHours: Math.round(actualHours * 10) / 10,
                completed,
            };
            const updated = [record, ...fastHistory].slice(0, 30);
            setFastHistory(updated);
            localStorage.setItem(STORAGE_KEYS.FASTING_HISTORY, JSON.stringify(updated));
        }

        setStatus('idle');
        setStartTime(null);
        setHydrationCount(0);
        setHasRungGoalBell(false);
        setShowEndFastAdjust(false);
    };

    const handleEndFast = () => {
        // Open adjustment modal so user can backdate if they forgot to end earlier
        const now = new Date();
        setEndFastAdjustTime(now.toTimeString().slice(0, 5));
        setEndFastAdjustDate(now.toISOString().split('T')[0]);
        setShowEndFastAdjust(true);
        haptics.light();
    };

    const scheduleNotification = async (start: string, hours: number) => {
        try {
            const end = new Date(new Date(start).getTime() + hours * 3600000);
            await LocalNotifications.schedule({
                notifications: [{
                    title: "Fasting Goal Reached! 🎉",
                    body: `You've completed your ${hours}h fast. You're unstoppable.`,
                    id: 8888,
                    schedule: { at: end },
                    sound: 'beep.caf'
                }]
            });
        } catch (e) { console.error(e); }
    };

    const handleToggleWeightUnit = () => {
        const next = weightUnit === 'lbs' ? 'kg' : 'lbs';
        setWeightUnit(next);
        localStorage.setItem(STORAGE_KEYS.WEIGHT_UNIT, next);
    };

    const handleLogWeight = () => {
        if (!newWeight || isNaN(parseFloat(newWeight))) return;

        const weightValue = toLbs(parseFloat(newWeight)); // always store in lbs
        const updatedHistory = [...weightHistory, { date: new Date().toISOString(), weight: weightValue }];
        setWeightHistory(updatedHistory);
        setNewWeight('');
        setShowWeightLogger(false);
        haptics.success();
        
        // Check if goal reached
        if (goalWeight && weightValue <= goalWeight) {
            triggerConfetti();
            haptics.success();
            onOpenCoach?.(`I just reached my weight goal of ${goalWeight && toDisplay(goalWeight)}${weightUnit}! I'm feeling incredible and want to celebrate this milestone and discuss how to pivot into maintenance mode.`);
        }

        // Analyze for trend popup
        if (updatedHistory.length >= 2) {
            setShowTrendAnalysis(true);
        }

        if (wantsCoachDeepDive) {
            setTimeout(() => {
                onOpenCoach?.(`I've been logging my weight and I'm interested in a deeper analysis of my metabolic progress. My current goal is ${goalWeight || 'not set yet'}. Let's look at how I'm tracking towards it.`);
            }, 1000);
        }
    };

    const handleAddFoodEntry = () => {
        if (!newFoodText.trim()) return;
        const entry: FoodEntry = {
            id: `food_${Date.now()}`,
            time: new Date().toISOString(),
            foods: newFoodText.trim(),
            mood: selectedMood,
            notes: newFoodNotes.trim() || undefined,
        };
        setFoodEntries(prev => [entry, ...prev]);
        setNewFoodText('');
        setSelectedMood('');
        setNewFoodNotes('');
        setShowFoodLogger(false);
        haptics.success();
    };

    // 4. TREND ANALYSIS & GRAPH
    const trendData = useMemo(() => {
        if (weightHistory.length < 2) return { type: 'steady' as const, tip: HEALTH_TIPS.steady[0], diff: 0 };
        
        const last = weightHistory[weightHistory.length - 1].weight;
        const prev = weightHistory[weightHistory.length - 2].weight;
        const diff = last - prev;

        // Plateau logic (simple): last 3 weights within 0.5% of each other
        const isPlateau = weightHistory.length >= 3 && 
            Math.abs(last - prev) < 0.2 && 
            Math.abs(prev - weightHistory[weightHistory.length - 3].weight) < 0.2;

        if (diff > 0.5) return { type: 'gain' as const, tip: HEALTH_TIPS.gain[Math.floor(Math.random() * 3)], diff };
        if (isPlateau) return { type: 'plateau' as const, tip: HEALTH_TIPS.plateau[Math.floor(Math.random() * 3)], diff };
        
        // Add goal-specific insight if applicable
        if (goalWeight) {
            const remaining = last - goalWeight;
            if (remaining > 0 && remaining < 5) {
                return { type: 'steady' as const, tip: `You're within ${toDisplay(remaining).toFixed(1)}${weightUnit} of your goal! This is where the most significant hormonal shifts happen. Stay focused.`, diff };
            }
        }

        return { type: 'steady' as const, tip: HEALTH_TIPS.steady[Math.floor(Math.random() * 3)], diff };
    }, [weightHistory, goalWeight]);

    // Simple SVG Sparkline component
    // Expanded SVG Graph component
    const WeightHistoryGraph = () => {
        if (weightHistory.length < 2) return (
            <div className="h-40 flex items-center justify-center text-white/20 italic text-sm">
                Log at least two weights to see your journey...
            </div>
        );
        
        const padding = 20;
        const width = 340;
        const height = 140;
        
        const weights = weightHistory.map(h => h.weight);
        const minWeight = Math.min(...weights, goalWeight || Math.min(...weights)) - 2;
        const maxWeight = Math.max(...weights, goalWeight || Math.max(...weights)) + 2;
        const weightRange = maxWeight - minWeight;

        const points = weightHistory.map((h, i, arr) => {
            const x = (i / (arr.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((h.weight - minWeight) / weightRange) * (height - 2 * padding) - padding;
            return `${x},${y}`;
        }).join(' ');

        // Goal line
        let goalY = -100;
        if (goalWeight) {
            goalY = height - ((goalWeight - minWeight) / weightRange) * (height - 2 * padding) - padding;
        }

        return (
            <div className="relative w-full h-40 mt-4 flex items-center justify-center">
                <svg width={width} height={height} className="overflow-visible">
                    {/* Grid lines */}
                    <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                    <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                    
                    {/* Goal Line */}
                    {goalWeight && (
                        <g>
                            <line 
                                x1={padding} y1={goalY} x2={width-padding} y2={goalY} 
                                stroke="#E5D6A7" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 4" 
                            />
                            <text x={width-padding} y={goalY - 6} textAnchor="end" fill="#E5D6A7" fillOpacity="0.5" className="text-[8px] font-black uppercase">Goal</text>
                        </g>
                    )}

                    {/* Gradient fill */}
                    <defs>
                        <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E5D6A7" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#E5D6A7" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    <polyline
                        fill="none"
                        stroke="#E5D6A7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                    />

                    {/* Circles for points */}
                    {weightHistory.map((h, i, arr) => {
                        const x = (i / (arr.length - 1)) * (width - 2 * padding) + padding;
                        const y = height - ((h.weight - minWeight) / weightRange) * (height - 2 * padding) - padding;
                        return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#1B4332" stroke="#E5D6A7" strokeWidth="2" />
                        );
                    })}
                </svg>
            </div>
        );
    };

    const WeightSparkline = () => {
        if (weightHistory.length < 2) return null;
        
        const padding = 10;
        const width = 160;
        const height = 40;
        
        const weights = weightHistory.map(h => h.weight);
        const minWeight = Math.min(...weights) - 2;
        const maxWeight = Math.max(...weights) + 2;
        const weightRange = maxWeight - minWeight;

        const points = weightHistory.slice(-7).map((h, i, arr) => {
            const x = (i / (arr.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((h.weight - minWeight) / weightRange) * (height - 2 * padding) - padding;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width={width} height={height} className="opacity-80">
                <polyline
                    fill="none"
                    stroke={trendData.diff < 0 ? '#E5D6A7' : trendData.diff > 0.5 ? '#f87171' : '#CBD5E1'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        );
    };

    // 5. HELPERS
    const getProgress = () => Math.min(100, (elapsedSeconds / (targetHours * 3600)) * 100);
    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const getBodyStatus = (h: number) => {
        if (h < 4) return { stage: 'Digestion', color: 'text-white/60', desc: 'Processing your last meal' };
        if (h < 8) return { stage: 'Baseline', color: 'text-white/80', desc: 'Metabolic transition' };
        if (h < 12) return { stage: 'Fat Burning', color: 'text-pale-gold', desc: 'Growth hormone surging' };
        if (h < 18) return { stage: 'Ketosis', color: 'text-pale-gold', desc: 'Ketones fueling brain' };
        if (h < 24) return { stage: 'Autophagy', color: 'text-white', desc: 'Cellular cleanup active' };
        return { stage: 'Deep Repair', color: 'text-pale-gold', desc: 'Peak stem cell production' };
    };

    const currentStage = getBodyStatus(elapsedSeconds / 3600);
    const bgCard = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20 shadow-spa';

    return (
        <div className="w-full flex flex-col items-center px-6 pt-6 pb-32 animate-fade-in max-w-lg mx-auto">
            
            {/* A. HEADER */}
            <div className="w-full flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-display font-medium text-white">Palante Fasting</h2>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Metabolic Freedom</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { haptics.light(); setShowHowItWorks(true); }}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all font-display"
                    >
                        How it Works
                    </button>
                    <button 
                        onClick={() => { haptics.light(); setShowSciencePopup(true); }}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all font-display"
                    >
                        The Science
                    </button>
                </div>
            </div>

            {/* MODE TOGGLE */}
            <div className="w-full flex mb-8 p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                    onClick={() => { setActiveMode('fast'); haptics.light(); }}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeMode === 'fast' ? 'bg-pale-gold text-sage-dark shadow-sm' : 'text-white/40'}`}
                >
                    Fast
                </button>
                <button
                    onClick={() => { setActiveMode('food-journal'); haptics.light(); }}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeMode === 'food-journal' ? 'bg-pale-gold text-sage-dark shadow-sm' : 'text-white/40'}`}
                >
                    Food Journal
                </button>
            </div>

            {activeMode === 'fast' && <>

            {/* B. MAIN TIMER RING */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-10">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="144" cy="144" r="130" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle
                        cx="144" cy="144" r="130"
                        fill="none" stroke="#E5D6A7" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 130}
                        strokeDashoffset={2 * Math.PI * 130 * (1 - getProgress() / 100)}
                        className="transition-all duration-1000"
                    />
                </svg>

                <div className="flex flex-col items-center z-10 text-center animate-fade-in">
                    {status === 'active' ? (
                        <>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${currentStage.color}`}>
                                {currentStage.stage}
                            </div>
                            <div className="text-6xl font-display font-medium tabular-nums mb-1 text-white">
                                {formatTime(elapsedSeconds)}
                            </div>
                            <div className="text-xs text-white/40 font-bold uppercase tracking-widest">
                                Goal: {targetHours}h
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center animate-float">
                            <Utensils size={48} className="text-white/10 mb-4" />
                            <button
                                onClick={() => setShowPresets(true)}
                                className="flex flex-col items-center group active:scale-95 transition-all"
                            >
                                <span className="text-5xl font-display font-medium text-white">{targetHours}h</span>
                                <span className="text-xs text-pale-gold font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                                    Change Goal <ChevronDown size={12} />
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* C. DYNAMIC ACTIONS */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
                {status === 'active' ? (
                    <>
                        <button
                            onClick={() => {
                                const start = new Date(startTime!);
                                setEditStartTime(start.toTimeString().slice(0, 5));
                                setEditStartDate(start.toISOString().split('T')[0]);
                                setShowStartTimeEdit(true);
                                haptics.light();
                            }}
                            className={`p-4 rounded-[2rem] text-left transition-all active:scale-95 ${bgCard}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Started</span>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-pale-gold" />
                                <span className="font-bold text-white">
                                    {new Date(startTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                const end = new Date(new Date(startTime!).getTime() + targetHours * 3600000);
                                setEditEndTime(end.toTimeString().slice(0, 5));
                                setEditEndDate(end.toISOString().split('T')[0]);
                                setShowEndTimeEdit(true);
                                haptics.light();
                            }}
                            className={`p-4 rounded-[2rem] text-left transition-all active:scale-95 ${bgCard}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-1">Ends</span>
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-pale-gold" />
                                <span className="font-bold text-white">
                                    {(new Date(new Date(startTime!).getTime() + targetHours * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={handleEndFast}
                            className="col-span-2 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all active:scale-[0.98]"
                        >
                            End Fast Early
                        </button>
                    </>
                ) : (
                    <div className="col-span-2 flex flex-col gap-4">
                        <button
                            onClick={() => {
                                setIsAutoSync(true); // Default to live updating for "Let's Go"
                                setManualStartTime(new Date().toISOString());
                                setShowConfirmStart(true);
                                haptics.light();
                            }}
                                className={`w-full py-6 rounded-[2.5rem] font-black text-xl uppercase tracking-tighter transition-all active:scale-95 shadow-spa-lg bg-[#E5D6A7] text-[#1B4332] group overflow-hidden relative`}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Zap size={24} fill="currentColor" /> Let's Go
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setIsAutoSync(false); // Disable live update if they want to enter a manual start
                                setManualStartTime(new Date().toISOString());
                                setShowConfirmStart(true);
                                haptics.light();
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-pale-gold transition-colors text-center"
                        >
                            I started earlier
                        </button>
                    </div>
                )}
            </div>

            {/* C2. GOAL REACHED BANNER */}
            {status === 'active' && elapsedSeconds >= targetHours * 3600 && (
                <div className="w-full mb-6 p-5 rounded-[2rem] bg-pale-gold/10 border border-pale-gold/30 flex items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-pale-gold flex items-center justify-center shrink-0">
                        <Zap size={22} fill="currentColor" className="text-sage-dark" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-black uppercase tracking-widest text-pale-gold mb-0.5">Goal Reached!</div>
                        <div className="text-sm text-white/80">You hit {targetHours}h. End your fast when ready.</div>
                    </div>
                    <button
                        onClick={handleEndFast}
                        className="px-4 py-2 rounded-xl bg-pale-gold text-sage-dark font-black text-[10px] uppercase tracking-widest shrink-0 active:scale-95 transition-all"
                    >
                        End Fast
                    </button>
                </div>
            )}

            {/* D. SCIENCE INSIGHT CARD */}
            {status === 'active' && (
                <button
                    onClick={() => {
                        let idx = 0;
                        const h = elapsedSeconds / 3600;
                        if (h >= 24) idx = 4; else if (h >= 18) idx = 3; else if (h >= 12) idx = 2; else if (h >= 8) idx = 1;
                        setCurrentScienceTip(idx);
                        setShowSciencePopup(true);
                        haptics.light();
                    }}
                    className={`w-full p-6 rounded-[2.5rem] mb-6 flex items-center gap-5 transition-all active:scale-[0.98] border border-white/10 bg-white/5 group`}
                >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {currentStage.stage === 'Ketosis' ? '🧠' : currentStage.stage === 'Autophagy' ? '✨' : '🔥'}
                    </div>
                    <div className="text-left flex-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-pale-gold mb-1">Coach Insight</div>
                        <h4 className="text-lg font-display font-medium text-white">{currentStage.stage} Phase</h4>
                        <p className="text-xs text-white/70">{currentStage.desc} · Tap for Science</p>
                    </div>
                    <ChevronDown size={20} className="text-white/20 -rotate-90" />
                </button>
            )}

            {/* E. HYDRATION & WEIGHT TRACKING (NEW) */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
                 {/* Hydration Card */}
                 <div className={`p-5 rounded-[2rem] ${bgCard}`}>
                    <div className="flex items-center justify-between mb-4">
                        <Droplet size={20} className="text-pale-gold" />
                        <span className="text-2xl font-display font-medium text-white">{hydrationCount}</span>
                    </div>
                    <div className="flex gap-2">
                        <button aria-label="Remove glass of water" onClick={() => hydrationCount > 0 && setHydrationCount(h => h-1)} className="flex-1 py-1 bg-white/5 rounded-xl text-white/40">-</button>
                        <button aria-label="Add glass of water" onClick={() => { setHydrationCount(h => h+1); haptics.medium(); if(hydrationCount+1===8) triggerConfetti(); }} className="flex-[2] py-1 bg-pale-gold text-sage-dark rounded-xl font-bold">+</button>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-3 block text-center">Glasses Today</span>
                 </div>
                 
                 {/* Weight Card with Sparkline */}
                 <button 
                    onClick={() => { haptics.light(); setShowWeightLogger(true); }}
                    className={`p-5 rounded-[2rem] flex flex-col items-center justify-between text-center transition-all active:scale-95 ${bgCard}`}
                 >
                    <div className="w-full flex items-center justify-between mb-2">
                        <Scale size={18} className="text-pale-gold" />
                        <span className="text-[10px] font-black text-white/60">Weight</span>
                    </div>
                    
                    {weightHistory.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-display font-medium text-white">{toDisplay(weightHistory[weightHistory.length - 1].weight)}</span>
                                <span className="text-[10px] font-bold text-white/30 uppercase">{weightUnit}</span>
                            </div>

                            {goalWeight && (
                                <div className="mt-1 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[8px] font-black text-pale-gold uppercase tracking-widest whitespace-nowrap">
                                    {Math.abs(toDisplay(weightHistory[weightHistory.length-1].weight) - toDisplay(goalWeight)).toFixed(1)} {weightUnit} to goal
                                </div>
                            )}

                            <div className="mt-2 h-8 flex items-center"><WeightSparkline /></div>
                        </div>
                    ) : (
                        <p className="text-[10px] text-white/40 leading-tight">No data logged yet.</p>
                    )}
                    
                  </button>
            </div>

            {/* G. FULL WEIGHT JOURNEY (NEW) */}
            <div className={`w-full p-6 rounded-[2.5rem] mb-6 ${bgCard}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-pale-gold/10 flex items-center justify-center text-pale-gold">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-display font-medium text-white">Weight Journey</h4>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Visual Progress</p>
                        </div>
                    </div>
                    {weightHistory.length > 0 && (
                        <div className="text-right">
                            <div className="text-xl font-display font-medium text-white">{toDisplay(weightHistory[weightHistory.length-1].weight)} <span className="text-[10px] text-white/40 font-bold uppercase">{weightUnit}</span></div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-pale-gold">Current</div>
                        </div>
                    )}
                </div>

                <WeightHistoryGraph />

                {goalWeight && weightHistory.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/60 font-medium">Goal Progress</span>
                            <span className="text-xs text-pale-gold font-bold">{Math.abs(toDisplay(weightHistory[weightHistory.length-1].weight) - toDisplay(goalWeight)).toFixed(1)} {weightUnit} to go</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-pale-gold" 
                                style={{ 
                                    width: `${Math.min(100, Math.abs((weightHistory[0].weight - weightHistory[weightHistory.length-1].weight) / (weightHistory[0].weight - (goalWeight || 0)) * 100))}%` 
                                }} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* H. FAST HISTORY */}
            {fastHistory.length > 0 && (
                <div className={`w-full p-6 rounded-[2.5rem] mb-6 ${bgCard}`}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-pale-gold/10 flex items-center justify-center text-pale-gold">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-display font-medium text-white">Fast History</h4>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                                {fastHistory.filter(f => f.completed).length} of {fastHistory.length} completed
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {fastHistory.map((record) => {
                            const date = new Date(record.endTime);
                            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            const pct = Math.min(100, (record.actualHours / record.targetHours) * 100);
                            const hh = Math.floor(record.actualHours);
                            const mm = Math.round((record.actualHours - hh) * 60);
                            const durationStr = mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;

                            return (
                                <div key={record.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    {/* Status icon */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${record.completed ? 'bg-pale-gold/15 text-pale-gold' : 'bg-white/5 text-white/30'}`}>
                                        {record.completed
                                            ? <Zap size={16} fill="currentColor" />
                                            : <Clock size={16} />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{dateStr}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${record.completed ? 'text-pale-gold' : 'text-white/30'}`}>
                                                {record.completed ? 'Complete' : 'Partial'}
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${record.completed ? 'bg-pale-gold' : 'bg-white/20'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[10px] text-white/40">{durationStr} of {record.targetHours}h goal</span>
                                            <span className="text-[10px] text-white/30">{Math.round(pct)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            </>}

            {/* FOOD JOURNAL VIEW */}
            {activeMode === 'food-journal' && (() => {
                const todayStr = new Date().toDateString();
                const todayEntries = foodEntries.filter(e => new Date(e.time).toDateString() === todayStr);
                const pastEntries = foodEntries.filter(e => new Date(e.time).toDateString() !== todayStr);

                return (
                    <div className="w-full animate-fade-in">
                        {/* Today header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-display font-medium text-white">
                                    {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">
                                    {todayEntries.length} {todayEntries.length === 1 ? 'Entry' : 'Entries'} Today
                                </p>
                            </div>
                            <button
                                onClick={() => { haptics.light(); setShowFoodLogger(true); }}
                                className="w-12 h-12 rounded-2xl bg-pale-gold flex items-center justify-center text-sage-dark active:scale-90 transition-all shadow-spa"
                            >
                                <Plus size={22} />
                            </button>
                        </div>

                        {/* Today's entries */}
                        {todayEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                    <BookOpen size={36} className="text-white/20" />
                                </div>
                                <h4 className="text-xl font-display font-medium text-white/40 mb-2">Nothing logged yet</h4>
                                <p className="text-sm text-white/30 mb-8 max-w-xs leading-relaxed">
                                    Log what you eat and how you felt — the insight comes from the pattern.
                                </p>
                                <button
                                    onClick={() => { haptics.light(); setShowFoodLogger(true); }}
                                    className="px-8 py-4 rounded-2xl bg-pale-gold/10 border border-pale-gold/20 text-pale-gold font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Log Your First Meal
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {todayEntries.map(entry => (
                                    <div key={entry.id} className={`p-5 rounded-[2rem] ${bgCard}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm leading-relaxed">{entry.foods}</p>
                                                {entry.notes && (
                                                    <p className="text-white/40 text-xs mt-2 italic">"{entry.notes}"</p>
                                                )}
                                                {entry.mood && (
                                                    <div className="mt-3">
                                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${MOOD_COLORS[entry.mood] || 'bg-white/10 text-white/60'}`}>
                                                            {entry.mood}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-white/30 font-bold shrink-0 mt-0.5">
                                                {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Past entries */}
                        {pastEntries.length > 0 && (
                            <div className="mt-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Earlier</p>
                                <div className="flex flex-col gap-3">
                                    {pastEntries.slice(0, 10).map(entry => (
                                        <div key={entry.id} className={`p-5 rounded-[2rem] opacity-70 ${bgCard}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                                                        {new Date(entry.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-white/70 text-sm leading-relaxed">{entry.foods}</p>
                                                    {entry.mood && (
                                                        <div className="mt-2">
                                                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${MOOD_COLORS[entry.mood] || 'bg-white/10 text-white/60'}`}>
                                                                {entry.mood}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-white/20 font-bold shrink-0 mt-0.5">
                                                    {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* F. MODALS */}
            
            {/* Presets Slide-up */}
            <SlideUpModal isOpen={showPresets} onClose={() => setShowPresets(false)} isDarkMode={isDarkMode}>
                <div className="p-8">
                    <h3 className="text-2xl font-display font-medium text-white mb-6">Choose Your Path</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {PRESETS.map(p => (
                            <button
                                key={p.hours}
                                onClick={() => { setTargetHours(p.hours); setShowPresets(false); haptics.success(); }}
                                className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${targetHours === p.hours ? 'bg-pale-gold border-pale-gold text-sage-dark' : 'bg-white/5 border-white/10 text-white'}`}
                            >
                                <div className="text-left">
                                    <div className="font-bold">{p.label}</div>
                                    <div className="text-xs opacity-60">{p.name}</div>
                                </div>
                                {targetHours === p.hours && <Zap size={20} fill="currentColor" />}
                            </button>
                        ))}
                    </div>
                </div>
            </SlideUpModal>

            {/* Weight Logger Modal */}
            <SlideUpModal isOpen={showWeightLogger} onClose={() => setShowWeightLogger(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-16 h-16 rounded-3xl bg-pale-gold/10 flex items-center justify-center mb-4">
                            <Scale size={32} className="text-pale-gold" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-2">Weight Journey</h3>
                        <p className="text-sm text-white/40">Log your morning weight for tracking.</p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="relative">
                            <input
                                autoFocus
                                type="number"
                                step="0.1"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                placeholder="0.0"
                                className="w-full text-6xl font-display text-center bg-transparent border-none outline-none text-white placeholder-white/10"
                            />
                            <div className="flex items-center justify-center gap-3 mt-2">
                                <span className="font-black text-pale-gold/30 uppercase tracking-[0.3em] text-xs">{weightUnit === 'lbs' ? 'Pounds (LBS)' : 'Kilograms (KG)'}</span>
                                <button
                                    onClick={handleToggleWeightUnit}
                                    className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-pale-gold transition-colors"
                                >
                                    {weightUnit === 'lbs' ? '→ kg' : '→ lbs'}
                                </button>
                            </div>
                        </div>

                        {/* Goal Weight Setting */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                                <div className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Current Range</div>
                                <div className="text-sm font-bold text-white">{weightHistory.length > 0 ? toDisplay(weightHistory[weightHistory.length-1].weight) : '--'} {weightUnit}</div>
                            </div>
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                                <div className="text-[8px] font-black uppercase tracking-widest text-pale-gold/60 mb-1">Set Goal ({weightUnit})</div>
                                <input
                                    type="number"
                                    value={goalWeight ? toDisplay(goalWeight) : ''}
                                    onChange={(e) => setGoalWeight(e.target.value ? toLbs(parseFloat(e.target.value)) : null)}
                                    placeholder="0.0"
                                    className="w-full bg-transparent border-none outline-none text-white text-sm font-bold"
                                />
                            </div>
                        </div>

                        {/* Coach Deep Dive Toggle */}
                        <label className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/10 cursor-pointer group active:bg-white/10 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-pale-gold/10 text-pale-gold"><Sparkles size={18} /></div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-white">Coach Deep Analysis</div>
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Discuss trends with Palante Coach</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={wantsCoachDeepDive}
                                onChange={() => setWantsCoachDeepDive(!wantsCoachDeepDive)}
                            />
                            <div className={`w-12 h-6 rounded-full transition-all relative ${wantsCoachDeepDive ? 'bg-pale-gold' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${wantsCoachDeepDive ? 'left-7' : 'left-1'}`} />
                            </div>
                        </label>

                        <button
                            onClick={handleLogWeight}
                            className="w-full py-5 rounded-[2rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                        >
                            Confirm Entry
                        </button>
                    </div>
                </div>
            </SlideUpModal>

            {/* Trend Analysis Popup */}
            {showTrendAnalysis && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowTrendAnalysis(false)} />
                    <div className="relative w-full max-w-sm p-8 rounded-[2.5rem] shadow-spa-lg bg-[#1B4332] border border-white/10 overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pale-gold/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                            {trendData.type === 'gain' ? <ArrowUpRight className="text-red-400" size={32} /> : 
                             trendData.type === 'plateau' ? <Minus className="text-blue-400" size={32} /> :
                             <ArrowDownRight className="text-pale-gold" size={32} />}
                        </div>

                        <h3 className="text-2xl font-display font-medium text-white mb-2">
                            {trendData.type === 'gain' ? 'Metabolic Shift' : 
                             trendData.type === 'plateau' ? 'Plateau Detected' : 'Steady Progress'}
                        </h3>
                        
                        <div className="px-4 py-2 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-pale-gold mb-8 inline-block">
                            Health Insight
                        </div>

                        <p className="text-white/80 leading-relaxed mb-8 text-sm italic">
                            "{trendData.tip}"
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => { setShowTrendAnalysis(false); onOpenCoach?.(`I noticed a ${trendData.type} in my weight journey. Can we discuss some strategies to optimize my metabolic health?`); }}
                                className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20"
                            >
                                Discuss with Coach
                            </button>
                            <button onClick={() => setShowTrendAnalysis(false)} className="w-full py-4 rounded-2xl bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase">
                                Got it, Thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Science Insight Modal */}
            <SlideUpModal isOpen={showSciencePopup} onClose={() => setShowSciencePopup(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pale-gold/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-[#E5D6A7] flex items-center justify-center mb-6 text-3xl shadow-lg">
                            {SCIENCE_TIPS[currentScienceTip]?.icon}
                        </div>
                        <h3 className="text-3xl font-display font-medium text-white mb-2">{SCIENCE_TIPS[currentScienceTip]?.headline}</h3>
                        <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 mb-8">
                            {SCIENCE_TIPS[currentScienceTip]?.milestone}
                        </div>
                        <p className="text-white/80 leading-relaxed mb-8 text-lg font-light italic">
                            "{SCIENCE_TIPS[currentScienceTip]?.body}"
                        </p>
                        <div className="border-t border-white/10 pt-6 w-full mb-10">
                            <p className="text-sm font-medium text-white tracking-wide">&ldquo;{SCIENCE_TIPS[currentScienceTip]?.encouragement}&rdquo;</p>
                        </div>
                        <button 
                            onClick={() => setShowSciencePopup(false)} 
                            className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                        >
                            Got it, Coach
                        </button>
                    </div>
                </div>
            </SlideUpModal>

            {/* How it Works Modal */}
            <SlideUpModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.12] flex items-center justify-center mb-4 shadow-lg">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h3 className="text-3xl font-display font-medium text-white mb-2">Metabolic Freedom</h3>
                        <p className="text-sm text-white/40 uppercase tracking-[0.2em] font-black">How Palante Fasting Works</p>
                    </div>

                    <div className="space-y-4 mb-10">
                        {[
                            { title: 'Metabolic Flexibility', desc: 'Training your body to efficiently switch between burning glucose and stored body fat for energy.', icon: <Zap size={18} /> },
                            { title: 'Cellular Autophagy', desc: "Triggering the body's natural 'cleanup' phase where damaged cells are repaired or recycled.", icon: <Brain size={18} /> },
                            { title: 'Insulin Sensitivity', desc: 'Lowering blood sugar levels to reduce inflammation and stabilize long-term energy.', icon: <Target size={18} /> },
                            { title: 'Mental Longevity', desc: 'Replacing the brain fog of sugar-crashes with the sustained focus of ketone-burning.', icon: <Sparkles size={18} /> }
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-[1.8rem] bg-white/[0.06] border border-white/[0.06] flex gap-4 items-start">
                                <div className="p-3 rounded-2xl bg-white/[0.12] text-white mt-1 shadow-md">
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-display font-medium text-white text-lg mb-1">{item.title}</h4>
                                    <p className="text-sm text-white leading-relaxed font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowHowItWorks(false)}
                        className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                    >
                        Ready to Grow
                    </button>
                </div>
            </SlideUpModal>

            {/* Edit Start Time (active fast) */}
            <SlideUpModal isOpen={showStartTimeEdit} onClose={() => setShowStartTimeEdit(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.12] flex items-center justify-center mb-4 shadow-lg">
                            <Clock size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-1">Adjust Start Time</h3>
                        <p className="text-sm text-white/40">Correct when your fast actually began.</p>
                    </div>

                    {/* Date selector */}
                    <div className="flex gap-2 mb-4 justify-center">
                        {[
                            { label: 'Today', daysAgo: 0 },
                            { label: 'Yesterday', daysAgo: 1 },
                        ].map(({ label, daysAgo }) => {
                            const ref = new Date();
                            ref.setDate(ref.getDate() - daysAgo);
                            const editDateStr = editStartDate || new Date().toISOString().split('T')[0];
                            const selected = editDateStr === ref.toISOString().split('T')[0];
                            return (
                                <button
                                    key={label}
                                    onClick={() => {
                                        setEditStartDate(ref.toISOString().split('T')[0]);
                                        haptics.light();
                                    }}
                                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${selected ? 'bg-pale-gold text-sage-dark' : 'bg-white/[0.06] border border-white/10 text-white/60'}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time wheel picker */}
                    <div className="bg-white/[0.06] rounded-3xl p-4 mb-4 border border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 text-center">Start Time</div>
                        <TimePickerWheel
                            value={editStartTime || '08:00'}
                            isDarkMode={true}
                            onChange={(hhmm) => setEditStartTime(hhmm)}
                        />
                        <div className="text-center text-white/40 text-xs font-medium mt-1">
                            {editStartTime ? (() => { const [h, m] = editStartTime.split(':').map(Number); const d = new Date(); d.setHours(h, m); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); })() : ''}
                        </div>
                    </div>

                    {/* Quick chips */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {[
                            { label: '15 min', offset: 15 },
                            { label: '30 min', offset: 30 },
                            { label: '1 hour', offset: 60 },
                            { label: '2 hours', offset: 120 },
                            { label: '4 hours', offset: 240 },
                            { label: '6 hours', offset: 360 },
                        ].map(({ label, offset }) => (
                            <button
                                key={label}
                                onClick={() => {
                                    const d = new Date(Date.now() - offset * 60000);
                                    setEditStartDate(d.toISOString().split('T')[0]);
                                    setEditStartTime(d.toTimeString().slice(0, 5));
                                    haptics.light();
                                }}
                                className="py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                {label} ago
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            if (editStartDate && editStartTime) {
                                const newStart = new Date(`${editStartDate}T${editStartTime}`).toISOString();
                                setStartTime(newStart);
                            }
                            setShowStartTimeEdit(false);
                            haptics.success();
                        }}
                        className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                    >
                        Update Start Time
                    </button>
                </div>
            </SlideUpModal>

            {/* Edit Goal Duration (shows as "Ends") */}
            <SlideUpModal isOpen={showEndTimeEdit} onClose={() => setShowEndTimeEdit(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.12] flex items-center justify-center mb-4 shadow-lg">
                            <Target size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-2">Change Goal</h3>
                        <p className="text-sm text-white/40">Adjust how long you want to fast.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mb-8">
                        {PRESETS.map(p => (
                            <button
                                key={p.hours}
                                onClick={() => { setTargetHours(p.hours); setShowEndTimeEdit(false); haptics.success(); }}
                                className={`flex items-center justify-between p-5 rounded-3xl border transition-all active:scale-95 ${targetHours === p.hours ? 'bg-pale-gold border-pale-gold text-sage-dark' : 'bg-white/[0.06] border-white/10 text-white'}`}
                            >
                                <div className="text-left">
                                    <div className="font-bold">{p.label}</div>
                                    <div className="text-xs opacity-60">{p.name}</div>
                                </div>
                                {targetHours === p.hours && <Zap size={20} fill="currentColor" />}
                            </button>
                        ))}
                    </div>
                </div>
            </SlideUpModal>

            {/* End Fast — Adjust Actual End Time */}
            <SlideUpModal isOpen={showEndFastAdjust} onClose={() => setShowEndFastAdjust(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.12] flex items-center justify-center mb-4 shadow-lg">
                            <Utensils size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-1">When Did You Break Fast?</h3>
                        <p className="text-sm text-white/40">Adjust the time if you ate earlier and forgot to log it.</p>
                    </div>

                    {/* Date selector */}
                    <div className="flex gap-2 mb-4 justify-center">
                        {[
                            { label: 'Today', daysAgo: 0 },
                            { label: 'Yesterday', daysAgo: 1 },
                        ].map(({ label, daysAgo }) => {
                            const ref = new Date();
                            ref.setDate(ref.getDate() - daysAgo);
                            const selected = endFastAdjustDate === ref.toISOString().split('T')[0];
                            return (
                                <button
                                    key={label}
                                    onClick={() => { setEndFastAdjustDate(ref.toISOString().split('T')[0]); haptics.light(); }}
                                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${selected ? 'bg-pale-gold text-sage-dark' : 'bg-white/[0.06] border border-white/10 text-white/60'}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-white/[0.06] rounded-3xl p-4 mb-4 border border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 text-center">Actual End Time</div>
                        <TimePickerWheel
                            value={endFastAdjustTime || new Date().toTimeString().slice(0, 5)}
                            isDarkMode={true}
                            onChange={(hhmm) => setEndFastAdjustTime(hhmm)}
                        />
                    </div>

                    {/* Quick offset chips */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {[
                            { label: '15 min', offset: 15 },
                            { label: '30 min', offset: 30 },
                            { label: '1 hour', offset: 60 },
                            { label: '2 hours', offset: 120 },
                            { label: '3 hours', offset: 180 },
                            { label: '6 hours', offset: 360 },
                        ].map(({ label, offset }) => (
                            <button
                                key={label}
                                onClick={() => {
                                    const d = new Date(Date.now() - offset * 60000);
                                    setEndFastAdjustDate(d.toISOString().split('T')[0]);
                                    setEndFastAdjustTime(d.toTimeString().slice(0, 5));
                                    haptics.light();
                                }}
                                className="py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                {label} ago
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                if (endFastAdjustDate && endFastAdjustTime) {
                                    confirmEndFast(new Date(`${endFastAdjustDate}T${endFastAdjustTime}`).toISOString());
                                } else {
                                    confirmEndFast();
                                }
                            }}
                            className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                        >
                            Confirm & End Fast
                        </button>
                        <button
                            onClick={() => confirmEndFast()}
                            className="w-full py-3 rounded-[2.5rem] bg-white/[0.06] border border-white/10 text-white/60 font-black text-xs tracking-widest uppercase"
                        >
                            End Now (Current Time)
                        </button>
                    </div>
                </div>
            </SlideUpModal>

            {/* Confirm Start Flow */}
            <SlideUpModal isOpen={showConfirmStart} onClose={() => setShowConfirmStart(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.12] flex items-center justify-center mb-4 shadow-lg">
                            <Clock size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-1">Set Start Time</h3>
                        <p className="text-sm text-white/40">When did your fast begin?</p>
                    </div>

                    {/* Date selector */}
                    <div className="flex gap-2 mb-4 justify-center">
                        {[
                            { label: 'Today', daysAgo: 0 },
                            { label: 'Yesterday', daysAgo: 1 },
                        ].map(({ label, daysAgo }) => {
                            const d = new Date(manualStartTime);
                            const today = new Date();
                            const selected = d.getDate() === new Date(today.getTime() - daysAgo * 86400000).getDate();
                            return (
                                <button
                                    key={label}
                                    onClick={() => {
                                        setIsAutoSync(false);
                                        const base = new Date(manualStartTime);
                                        const ref = new Date();
                                        ref.setDate(ref.getDate() - daysAgo);
                                        base.setFullYear(ref.getFullYear(), ref.getMonth(), ref.getDate());
                                        setManualStartTime(base.toISOString());
                                        haptics.light();
                                    }}
                                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${selected ? 'bg-pale-gold text-sage-dark' : 'bg-white/[0.06] border border-white/10 text-white/60'}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time wheel picker */}
                    <div className="bg-white/[0.06] rounded-3xl p-4 mb-4 border border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 text-center">Start Time</div>
                        <TimePickerWheel
                            value={new Date(manualStartTime).toTimeString().slice(0, 5)}
                            isDarkMode={true}
                            onChange={(hhmm) => {
                                setIsAutoSync(false);
                                const [h, m] = hhmm.split(':').map(Number);
                                const d = new Date(manualStartTime);
                                d.setHours(h, m, 0, 0);
                                setManualStartTime(d.toISOString());
                            }}
                        />
                        <div className="text-center text-white/40 text-xs font-medium mt-1">
                            {new Date(manualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    {/* Quick chips */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {[
                            { label: 'Just Now', offset: 0 },
                            { label: '15 min', offset: 15 },
                            { label: '30 min', offset: 30 },
                            { label: '1 hour', offset: 60 },
                            { label: '2 hours', offset: 120 },
                            { label: '4 hours', offset: 240 },
                            { label: '6 hours', offset: 360 },
                            { label: '8 hours', offset: 480 },
                            { label: 'Last night', offset: 720 },
                        ].map(({ label, offset }) => (
                            <button
                                key={label}
                                onClick={() => {
                                    setIsAutoSync(offset === 0);
                                    setManualStartTime(new Date(Date.now() - offset * 60000).toISOString());
                                    haptics.light();
                                }}
                                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                    manualStartTime && Math.abs((Date.now() - new Date(manualStartTime).getTime()) - offset * 60000) < 30000
                                        ? 'bg-pale-gold text-sage-dark'
                                        : 'bg-white/[0.06] border border-white/10 text-white/60'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setStartTime(manualStartTime);
                            setStatus('active');
                            setShowConfirmStart(false);
                            haptics.success();
                            scheduleNotification(manualStartTime, targetHours);
                        }}
                        className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                    >
                        Begin Fast
                    </button>
                </div>
            </SlideUpModal>

            {/* Food Logger Modal */}
            <SlideUpModal isOpen={showFoodLogger} onClose={() => setShowFoodLogger(false)} isDarkMode={isDarkMode}>
                <div className="p-8 pb-12">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-3xl bg-pale-gold/10 flex items-center justify-center mb-4">
                            <BookOpen size={32} className="text-pale-gold" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-2">Log a Meal</h3>
                        <p className="text-sm text-white/40">What did you eat, and what brought you to it?</p>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* What did you eat */}
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-2">What did you eat?</div>
                            <textarea
                                autoFocus
                                value={newFoodText}
                                onChange={(e) => setNewFoodText(e.target.value)}
                                placeholder="Describe your meal..."
                                rows={3}
                                className="w-full p-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-sm resize-none outline-none focus:border-pale-gold/40 transition-colors"
                            />
                        </div>

                        {/* How were you feeling */}
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-3">How were you feeling before eating?</div>
                            <div className="grid grid-cols-2 gap-2">
                                {MOODS.map(({ id, label }) => (
                                    <button
                                        key={id}
                                        onClick={() => { setSelectedMood(id); haptics.light(); }}
                                        className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-center ${selectedMood === id ? 'bg-pale-gold text-sage-dark' : 'bg-white/[0.14] border border-white/20 text-white/80'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional notes */}
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-2">
                                Any reflection? <span className="normal-case font-normal opacity-60">(optional)</span>
                            </div>
                            <input
                                type="text"
                                value={newFoodNotes}
                                onChange={(e) => setNewFoodNotes(e.target.value)}
                                placeholder="What did you notice?"
                                className="w-full p-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-sm outline-none focus:border-pale-gold/40 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleAddFoodEntry}
                            disabled={!newFoodText.trim()}
                            className="w-full py-5 rounded-[2rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Log Entry
                        </button>

                        {/* Coach chat prompt */}
                        {onOpenCoach && (
                            <button
                                onClick={() => {
                                    setShowFoodLogger(false);
                                    onOpenCoach('I just logged a meal and want to reflect on my eating habits. Can we talk about what I ate and what might have driven it?');
                                }}
                                className="w-full py-3 rounded-[2rem] bg-white/[0.06] border border-white/10 text-white/70 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Your coach is here — want to talk through it?
                            </button>
                        )}

                        {/* Medical disclaimer */}
                        <p className="text-center text-[10px] text-white/25 leading-relaxed px-2">
                            This journal is for personal reflection only and is not medical or nutritional advice. Consult a licensed professional before making changes to your diet.
                        </p>
                    </div>
                </div>
            </SlideUpModal>

        </div>
    );
});
