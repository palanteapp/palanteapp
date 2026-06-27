
import React, { useState } from 'react';
import { Heart, Map, Compass, User, Maximize2, Sun, Sparkles, TrendingUp, Timer, Wind, Headphones, Flower2, Fish, Moon, MessageCircle, Mail, Users } from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';

interface WelcomeOrientationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onNavigate: (section: string) => void;
    partnerName?: string;
}

export const WelcomeOrientationModal: React.FC<WelcomeOrientationModalProps> = ({
    isOpen,
    onClose,
    isDarkMode,
    onNavigate,
    partnerName = 'Palante',
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
                    <div className="flex items-center mb-4">
                        <h2 className={`text-2xl font-display font-medium ${textPrimary}`}>
                            Welcome to Palante
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('philosophy')}
                            className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border-2 ${activeTab === 'philosophy' ? tabActiveBg : tabInactiveBg
                                }`}
                        >
                            <Heart size={16} />
                            <span>Philosophy</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('tour')}
                            className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border-2 ${activeTab === 'tour' ? tabActiveBg : tabInactiveBg
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
                                    Your partner in forward motion.
                                </h3>
                                <p className={`text-base leading-relaxed ${textSecondary}`}>
                                    Palante is built around one idea: consistent, grounded effort compounds into something real. Not hustle. Not pressure. Just showing up — and being met where you are.
                                </p>
                            </div>

                            {/* Core Beliefs */}
                            <div className="space-y-4">
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                            <Sun size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Morning sets the tone</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                A few minutes of gratitude, affirmation, and intention in the morning isn't a ritual for its own sake — it literally shapes how your brain processes the rest of the day.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                            <TrendingUp size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Progress over perfection</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                There is no "falling behind" here. Your 90-day Mandala grows one practice at a time. Every day you show up counts — regardless of what else happened.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <div className="flex gap-4">
                                        <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                            <Compass size={20} className={accentColor} />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>You already have what it takes</h4>
                                            <p className={`text-sm ${textSecondary}`}>
                                                Palante doesn't add pressure. It helps you hear what you already know — and stay close to it.
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
                                See what's inside →
                            </button>
                        </div>
                    )}

                    {activeTab === 'tour' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Partner — lead with the differentiator */}
                            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-pale-gold/10 border-pale-gold/20' : 'bg-sage/10 border-sage/20'}`}>
                                <div className="flex gap-4">
                                    <div className={`p-2 rounded-full h-fit ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'}`}>
                                        <Sparkles size={20} className={accentColor} />
                                    </div>
                                    <div>
                                        <h4 className={`text-base font-semibold mb-1 ${textPrimary}`}>Meet {partnerName}, your partner</h4>
                                        <p className={`text-sm ${textSecondary}`}>
                                            After every morning practice, {partnerName} writes you a personal message. Tap the chat icon anytime to talk — it knows your intentions, sees your patterns, and meets you exactly where you are.
                                        </p>
                                        <button
                                            onClick={() => { onNavigate('ai-coach'); onClose(); }}
                                            className={`mt-3 text-xs font-bold uppercase tracking-wider ${accentColor}`}
                                        >
                                            Open {partnerName} →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div>
                                <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    Navigation
                                </h3>
                                <div className={`p-4 rounded-2xl mb-3 ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${textPrimary}`}>
                                        <Map size={18} className={accentColor} />
                                        Three tabs, one home
                                    </h4>
                                    <p className={`text-sm ${textSecondary}`}>
                                        <strong>Home</strong> — your daily dashboard. <strong>Progress</strong> — your growth and mandala. <strong>Explore</strong> — tools for focus, breath, and sound.
                                    </p>
                                </div>
                                <button
                                    onClick={() => { onNavigate('settings'); onClose(); }}
                                    className={`text-left w-full p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-sage-mid/5 hover:bg-sage-mid/10'}`}
                                >
                                    <h4 className={`font-semibold mb-1 flex items-center gap-2 ${textPrimary}`}>
                                        <User size={18} className={accentColor} />
                                        Settings (gear icon, top left)
                                    </h4>
                                    <p className={`text-sm ${textSecondary}`}>
                                        Set your name, profession, focus goal, partner name, notifications, and more. Tap to open now.
                                    </p>
                                </button>
                            </div>

                            {/* Daily Practice */}
                            <div>
                                <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    Daily Practice
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { onNavigate('morning-ritual'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Sun size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Morning Practice</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Gratitude · affirmation · intention</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('evening-routine'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Moon size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Evening Reflection</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Gratitude · reflection · delight</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('garden'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Flower2 size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Mandala of Growth</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>90-day practice tracker</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('ai-coach'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <MessageCircle size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Palante Partner</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Your AI partner</p>
                                    </button>
                                </div>
                            </div>

                            {/* Tools */}
                            <div>
                                <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    Essential Tools
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { onNavigate('breathing'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Wind size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Breathwork</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Energy · relax · balance</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('focus'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Timer size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Focus Timer</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Pomodoro deep work</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('meditate'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Maximize2 size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Meditation</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Guided with soundscapes</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('soundscapes'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Headphones size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Sonic Canvas</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Immersive sound mixer</p>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('koi-pond'); onClose(); }}
                                        className={`text-left p-3 rounded-xl border col-span-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-sage/10 hover:bg-sage/5'}`}
                                    >
                                        <Fish size={24} className={`mb-2 ${accentColor}`} />
                                        <h4 className={`font-medium text-sm ${textPrimary}`}>Koi Pond</h4>
                                        <p className={`text-xs ${textSecondary} mt-1`}>Your living zen space — grows as you practice</p>
                                    </button>
                                </div>
                            </div>

                            {/* Coming up */}
                            <div>
                                <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${accentColor}`}>
                                    Coming Up
                                </h3>
                                <div className="space-y-3">
                                    <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                        <div className="flex gap-3 items-start">
                                            <div className={`p-1.5 rounded-full h-fit mt-0.5 ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                                <Mail size={16} className={accentColor} />
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-semibold mb-0.5 ${textPrimary}`}>Day 3 — Letter to your future self</h4>
                                                <p className={`text-xs leading-relaxed ${textSecondary}`}>
                                                    After your third practice, you'll be invited to write a letter to who you'll be 30 days from now. It's one of the most powerful things you can do on this journey.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-sage-mid/5'}`}>
                                        <div className="flex gap-3 items-start">
                                            <div className={`p-1.5 rounded-full h-fit mt-0.5 ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                                <Users size={16} className={accentColor} />
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-semibold mb-0.5 ${textPrimary}`}>Add an accountability partner</h4>
                                                <p className={`text-xs leading-relaxed ${textSecondary}`}>
                                                    People who practice with a partner stick with it 3× longer. Find yours in Settings → Accountability Partner.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final CTA */}
                            <div className={`mt-2 p-4 rounded-xl text-center ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/10'}`}>
                                <p className={`text-sm ${textPrimary} mb-3`}>
                                    Ready to begin?
                                </p>
                                <button
                                    onClick={onClose}
                                    className={`w-full py-3 rounded-full font-display font-medium text-lg transition-all shadow-lg ${isDarkMode
                                        ? 'bg-pale-gold text-sage-dark hover:bg-white'
                                        : 'bg-sage text-white hover:bg-sage/90'
                                        }`}
                                >
                                    Let's go
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SlideUpModal>
    );
};
