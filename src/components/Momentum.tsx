import React, { useState, useEffect, useRef } from 'react';
import { Plus, Mic, Settings, Target } from 'lucide-react';
import { CoachCard } from './CoachCard';
import { FocusItem } from './FocusItem';
import { ProgressDashboard } from './ProgressDashboard';
import { CelebrationModal } from './CelebrationModal';
import { CoachSettingsModal } from './CoachSettingsModal';
import type { UserProfile, DailyFocus, CoachSettings } from '../types';

interface MomentumProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    isDarkMode: boolean;
}

const BELL_URL = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3?filename=tibetan-singing-bowl-reverberation-1-14782.mp3";

export const Momentum: React.FC<MomentumProps> = ({
    user,
    onUpdateUser,
    isDarkMode,
}) => {
    const bellRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Pre-load the bell sound
        bellRef.current = new Audio(BELL_URL);
        bellRef.current.volume = 0.6;
        bellRef.current.load();
    }, []);
    const [newFocusText, setNewFocusText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isListeningFocus, setIsListeningFocus] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [hasShownCelebration, setHasShownCelebration] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const dailyFocuses = user.dailyFocuses || [];
    const completedCount = dailyFocuses.filter(f => f.isCompleted).length;

    const handleAddFocus = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFocusText.trim()) return;

        const newFocus: DailyFocus = {
            id: Date.now().toString(),
            text: newFocusText.trim(),
            isCompleted: false,
            createdAt: new Date().toISOString()
        };

        const updatedUser = {
            ...user,
            dailyFocuses: [...dailyFocuses, newFocus]
        };
        onUpdateUser(updatedUser);
        setNewFocusText('');
        setIsAdding(false);
    };

    const startFocusDictation = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setIsListeningFocus(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                console.log('Transcript:', transcript);
                setNewFocusText(prev => prev ? `${prev} ${transcript}` : transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                alert(`Speech recognition error: ${event.error}`);
                setIsListeningFocus(false);
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                setIsListeningFocus(false);
            };

            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            alert('Failed to start speech recognition. Please try again.');
            setIsListeningFocus(false);
        }
    };

    const handleToggleFocus = (id: string) => {
        const updatedFocuses = dailyFocuses.map(f => {
            if (f.id === id) {
                const isCompleted = !f.isCompleted;
                // Play sound if completing
                if (isCompleted && bellRef.current) {
                    bellRef.current.currentTime = 0;
                    bellRef.current.play()
                        .then(() => console.log('✓ Bell played'))
                        .catch(e => console.error('Bell play failed:', e));
                }
                return { ...f, isCompleted };
            }
            return f;
        });

        onUpdateUser({ ...user, dailyFocuses: updatedFocuses });

        // Check if all goals are now completed
        const allCompleted = updatedFocuses.length > 0 && updatedFocuses.every(f => f.isCompleted);
        if (allCompleted && !hasShownCelebration) {
            setShowCelebration(true);
            setHasShownCelebration(true);

            // Update streak
            const today = new Date().toISOString().split('T')[0];
            const lastCompletion = user.lastGoalCompletionDate;
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            let newStreak = 1;
            if (lastCompletion === yesterday) {
                // Consecutive day
                newStreak = (user.goalStreak || 0) + 1;
            } else if (lastCompletion === today) {
                // Already completed today
                newStreak = user.goalStreak || 1;
            }

            onUpdateUser({
                ...user,
                dailyFocuses: updatedFocuses,
                goalStreak: newStreak,
                lastGoalCompletionDate: today
            });
            return;
        }
    };

    const handleDeleteFocus = (id: string) => {
        const updatedFocuses = dailyFocuses.filter(f => f.id !== id);
        onUpdateUser({ ...user, dailyFocuses: updatedFocuses });
    };

    const handleSaveSettings = (settings: CoachSettings) => {
        onUpdateUser({ ...user, coachSettings: settings });
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-warm-gray-green';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';

    return (
        <div className="w-full max-w-2xl mx-auto px-4 pb-40 pt-8 animate-fade-in">
            {/* Coach Card (Hero) */}
            <div className="mb-8">
                <CoachCard
                    userName={user.name.split(' ')[0]}
                    focusCount={dailyFocuses.length}
                    completedCount={completedCount}
                    isDarkMode={isDarkMode}
                    streak={user.goalStreak || 0}
                />
            </div>

            {/* Coach Settings Card */}
            <button
                onClick={() => setShowSettings(true)}
                className={`w-full p-5 rounded-2xl border mb-8 transition-all group relative overflow-hidden ${isDarkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-pale-gold'
                    : 'bg-white/60 border-sage/20 hover:bg-white hover:border-sage'
                    }`}
            >
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${!user.coachSettings?.nudgeEnabled
                            ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                            : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                            }`}>
                            {!user.coachSettings?.nudgeEnabled ? '1' : '✓'}
                        </div>
                        <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'}`}>
                            <Settings size={20} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                        </div>
                        <div className="text-left">
                            <div className={`font-display font-medium flex items-center gap-2 ${textPrimary}`}>
                                <Target size={18} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                Accountability Coach
                            </div>
                            <div className={`text-sm ${textSecondary}`}>
                                {user.coachSettings?.nudgeEnabled
                                    ? `Check-ins: ${user.coachSettings.nudgeFrequency.replace('-', ' ')}`
                                    : 'Set your check-in preferences'
                                }
                            </div>
                        </div>
                    </div>
                    <div className={`transition-transform group-hover:translate-x-1 ${textSecondary}`}>
                        →
                    </div>
                </div>
            </button>

            {/* Today's Goals */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-display font-medium ${textPrimary}`}>
                        Today's Goals
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm ${textSecondary}`}>
                            {dailyFocuses.length}/4 set
                        </span>
                        {dailyFocuses.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className={`text-sm font-medium ${completedCount === dailyFocuses.length ? isDarkMode ? 'text-pale-gold' : 'text-sage' : textSecondary}`}>
                                    {Math.round((completedCount / dailyFocuses.length) * 100)}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dailyFocuses.map(focus => (
                        <FocusItem
                            key={focus.id}
                            focus={focus}
                            onToggle={handleToggleFocus}
                            onDelete={handleDeleteFocus}
                            isDarkMode={isDarkMode}
                        />
                    ))}

                    {/* Add Focus Input */}
                    {dailyFocuses.length < 4 && (
                        isAdding ? (
                            <form onSubmit={handleAddFocus} className="animate-fade-in h-full">
                                <div className="relative h-full">
                                    {/* Step Indicator */}
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${!user.coachSettings?.nudgeEnabled
                                            ? isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                            : isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                            }`}>
                                            {!user.coachSettings?.nudgeEnabled ? '1' : '✓'}
                                        </span>
                                        <span className={`text-xs font-bold uppercase tracking-widest ${!user.coachSettings?.nudgeEnabled
                                            ? isDarkMode ? 'text-pale-gold' : 'text-sage'
                                            : textSecondary
                                            }`}>
                                            {!user.coachSettings?.nudgeEnabled ? 'Set Nudge Settings First' : 'Add Your Goal'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <textarea
                                                value={newFocusText}
                                                onChange={(e) => setNewFocusText(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddFocus(e); } }}
                                                onBlur={() => !newFocusText && setIsListeningFocus(false)}
                                                placeholder={
                                                    !user.coachSettings?.nudgeEnabled
                                                        ? "Set your nudge settings first →"
                                                        : "What's your focus today?"
                                                }
                                                disabled={!user.coachSettings?.nudgeEnabled}
                                                rows={3}
                                                className={`w-full px-4 py-3 rounded-xl font-body transition-all resize-none ${!user.coachSettings?.nudgeEnabled
                                                    ? isDarkMode
                                                        ? 'bg-white/5 border-2 border-white/10 text-white/40 cursor-not-allowed'
                                                        : 'bg-sage/5 border-2 border-sage/20 text-warm-gray-green/40 cursor-not-allowed'
                                                    : isDarkMode
                                                        ? 'bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-pale-gold focus:bg-white/20'
                                                        : 'bg-white/60 border-2 border-sage/20 text-warm-gray-green placeholder-warm-gray-green/40 focus:border-sage focus:bg-white'
                                                    }`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startFocusDictation}
                                            disabled={!user.coachSettings?.nudgeEnabled}
                                            className={`p-2 rounded-full transition-all ${!user.coachSettings?.nudgeEnabled
                                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                                : isListeningFocus
                                                    ? 'bg-red-500 text-white animate-pulse'
                                                    : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                                }`}
                                            title="Voice Dictation"
                                        >
                                            <Mic size={16} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsAdding(false)}
                                            className={`text-xs uppercase tracking-wider font-bold ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-sage/40 hover:text-sage'}`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!user.coachSettings?.nudgeEnabled}
                                            className={`text-xs uppercase tracking-wider font-bold ${!user.coachSettings?.nudgeEnabled
                                                ? 'text-white/20 cursor-not-allowed'
                                                : isDarkMode ? 'text-pale-gold hover:text-white' : 'text-sage hover:text-warm-gray-green'
                                                }`}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="relative group w-full">
                                <button
                                    onClick={() => user.coachSettings?.nudgeEnabled && setIsAdding(true)}
                                    disabled={!user.coachSettings?.nudgeEnabled}
                                    className={`w-full min-h-[100px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${!user.coachSettings?.nudgeEnabled
                                        ? isDarkMode
                                            ? 'border-white/5 text-white/20 cursor-not-allowed bg-white/5'
                                            : 'border-sage/10 text-sage/20 cursor-not-allowed bg-sage/5'
                                        : isDarkMode
                                            ? 'border-white/10 text-white/40 hover:border-pale-gold hover:text-pale-gold hover:bg-white/5'
                                            : 'border-sage/20 text-warm-gray-green/40 hover:border-sage hover:text-sage hover:bg-sage/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${!user.coachSettings?.nudgeEnabled
                                            ? isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                            : isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                            }`}>
                                            2
                                        </span>
                                        <Plus size={24} />
                                    </div>
                                    <span className="font-medium">Add Goal</span>
                                </button>

                                {/* Tooltip for disabled state */}
                                {!user.coachSettings?.nudgeEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className={`px-4 py-2 rounded-lg shadow-xl text-sm font-medium transform translate-y-2 ${isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white'
                                            }`}>
                                            Please set nudge settings first
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Progress Dashboard (Unified) */}
            <ProgressDashboard
                user={user}
                isDarkMode={isDarkMode}
            />

            {/* Celebration Modal */}
            <CelebrationModal
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                completedCount={completedCount}
                isDarkMode={isDarkMode}
            />

            {/* Settings Modal */}
            <CoachSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={user.coachSettings || { nudgeFrequency: 'every-2-hours', nudgeEnabled: false }}
                onSave={handleSaveSettings}
                isDarkMode={isDarkMode}
            />
        </div >
    );
};
