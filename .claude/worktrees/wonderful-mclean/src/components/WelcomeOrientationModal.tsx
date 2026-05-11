
import React, { useState } from 'react';
import { X, Heart, Map, Compass, BookOpen, User, Maximize2, Sun, Zap, Sparkles, TrendingUp, Timer, Wind, Headphones, Flower2, Mail, Activity, Flame, Fish, Layers, Users } from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';

interface WelcomeOrientationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onNavigate: (section: string) => void;
}

export const WelcomeOrientationModal: React.FC<WelcomeOrientationModalProps> = ({
    isOpen,
    onClose,
    isDarkMode,
    onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<'philosophy' | 'tour'>('philosophy');

    // Color palette
    const bgClass = isDarkMode ? 'bg-sage-mid' : 'bg-ivory';
    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/70' : 'text-sage-dark/70';
    const accentColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
    const tabActiveBg = isDarkMode ? 'bg-pale-gold/20 border-pale-gold' : 'bg-sage/20 border-sage';
    const tabInactiveBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-sage-mid/5 border-sage-dark/10';

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode} showCloseButton={false}>
            <div className={`flex flex-col h-full ${bgClass} ${textPrimary}`}>
                {/* Header */}
                <div className="sticky top-0 z-10 backdrop-blur-xl bg-inherit/95 border-b border-white/10 px-6 pt-4 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className={`text-2xl font-display font-medium ${textPrimary}`}>
                                Welcome to Palante
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage-mid/10'}`}
                        >
                            <X size={24} className={textSecondary} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('philosophy')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border-2 ${activeTab === 'philosophy' ? tabActiveBg : tabInactiveBg
                                }`}
                        >
                            <Heart size={16} />
                            <span>Philosophy</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('tour')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border-2 ${activeTab === 'tour' ? tabActiveBg : tabInactiveBg
                                }`}
                        >
                            <Map size={16} />
                            <span>Quick Tour</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-12 pt-6 overflow-y-auto">
                    {activeTab === 'philosophy' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Intro */}
                            <div className="text-center">
                                <h3 className={`text-xl font-display font-medium mb-3 ${textPrimary}`}>
                                    An App That Grows With You
                                </h3>
                                <p className={`text-sm leading-relaxed ${textSecondary}`}>
                                    Palante isn't just a to-do list. It's a home for your mind and goals.
                                    We believe that productivity should be precise, not pressurized.
                                </p>
                            </div>

                            {/* Core Beliefs */}
                            <div className="space-y-4">
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                            <Maximize2 size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Use What You Need</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                Some days call for deep breathwork and reflection. Others just need a quick focus timer.
                                                You can use as many or as few features as you like.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { onNavigate('settings'); onClose(); }}
                                    className={`text-left w-full p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-sage-mid/5 hover:bg-sage-mid/10'}`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                            <TrendingUp size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Your Own Pace</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                There is no "falling behind" here. We offer tools to support you, not demands to stress you.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                            <Compass size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Inner Wealth</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                Everything you need is already within you. Our goal is simply to help you reflect on it and amplify it.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveTab('tour')}
                                className={`w-full py-3 rounded-xl font-medium text-sm transition-all border ${isDarkMode
                                    ? 'bg-pale-gold text-sage-dark border-pale-gold hover:bg-white'
                                    : 'bg-sage text-white border-sage hover:bg-sage/90'
                                    }`}
                            >
                                Exploring the App →
                            </button>
                        </div>
                    )}

                    {activeTab === 'tour' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Navigation Section */}
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    Navigation
                                </h3>
                                <div className={`p-4 rounded-2xl mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${textPrimary}`}>
                                        <Map size={18} className={accentColor} />
                                        The Dock
                                    </h4>
                                    <p className={`text-sm ${textSecondary} mb-0`}>
                                        Located at the bottom of your screen, this is your central hub for all tools (Home, Momentum, Reflections, etc).
                                    </p>
                                </div>
                                <button
                                    onClick={() => { onNavigate('settings'); onClose(); }}
                                    className={`text-left w-full p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-sage-mid/5 hover:bg-sage-mid/10'}`}
                                >
                                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${textPrimary}`}>
                                        <User size={18} className={accentColor} />
                                        Settings & Profile
                                    </h4>
                                    <p className={`text-sm ${textSecondary} mb-0`}>
                                        Tap your profile icon (top right) to customize your motivation style, update your goals, or adjust preferences.
                                    </p>
                                </button>
                            </div>

                            {/* Features Section */}
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    Key Features
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { onNavigate('morning-ritual'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Sun size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Morning Ritual</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Start with intention</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('momentum'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Zap size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Momentum</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Focus timers</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('reflections'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <BookOpen size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Reflections</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Journaling & Mood</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('ai-coach'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Sparkles size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>AI Coach</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Personal guidance</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('fasting'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Activity size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Fasting</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Track cellular repair</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('breathing'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Wind size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Breathwork</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Box breathing</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('routines'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Layers size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Routines</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Build habit stacks</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('koi-pond'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Fish size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Zen Pond</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Visual meditation</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('garden'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Flower2 size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Garden</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Visualize growth</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('future-letters'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Mail size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Future Letters</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Past & future self</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('partners'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Users size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Squad</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Accountability</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('evening-routine'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Flame size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Check-in</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Evening reflection</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('pomodoro'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Timer size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Pomodoro</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Time-boxed focus</p>
                                    </button>
                                </div>
                            </div>

                            {/* New: The Personal Mentor Section */}
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    The "Coach" Upgrade
                                </h3>
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'}`}>
                                            <Sparkles size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Predictive Mentorship</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                Your Palante Coach now studies your patterns. She might notice if you struggle to focus on Tuesday afternoons or if your energy dips after fasting, and offer tailored guidance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final CTA */}
                            <div className={`mt-6 p-4 rounded-xl text-center ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                <p className={`text-sm ${textPrimary} mb-3`}>
                                    Ready to begin?
                                </p>
                                <button
                                    onClick={onClose}
                                    className={`w-full py-3 rounded-full font-display font-medium text-lg transition-all shadow-lg ${isDarkMode
                                        ? 'bg-pale-gold text-sage-dark hover:bg-white'
                                        : 'bg-terracotta-500 text-white hover:bg-sage-600'
                                        }`}
                                >
                                    Let's Go
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SlideUpModal>
    );
};
