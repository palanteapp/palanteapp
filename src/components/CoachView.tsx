import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, Mic, Sparkles, ChevronLeft, Clock, Search, X, MessageCircle,
    Zap, Flame, Mountain, Wind, Home, TrendingUp, Wrench, MessageSquare, History, User, Star
} from 'lucide-react';
import { chatWithCoach, chatWithCoachPillar, getMomentumState } from '../utils/aiService';
import type { CoachPillarKey } from '../utils/aiService';
import type { UserProfile, ChatMessage, CoachSession, CoachPillar } from '../types';
import { canUseAI } from '../types';
import { haptics } from '../utils/haptics';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useTheme } from '../contexts/ThemeContext';
import { analyzeBehaviorPatterns } from '../utils/practiceUtils';

// ── Speech recognition type ──────────────────────────────────────────────────
interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

interface CoachViewProps {
    user: UserProfile;
    onBack?: () => void;
    onNavigate?: (tab: string) => void;
}

// ── Pillar config ─────────────────────────────────────────────────────────────
type PillarConfig = {
    key: CoachPillar;
    label: string;
    hint: string;
    icon: React.ReactNode;
    bg: (isDark: boolean) => string;
    border: (isDark: boolean) => string;
    iconBg: (isDark: boolean) => string;
    glowColor: string;
    textColor: string;
    greeting: string;
};

const PILLAR_CONFIGS: PillarConfig[] = [
    {
        key: 'anxiety',
        label: 'Anxiety',
        hint: 'Ground yourself & find calm',
        icon: <Wind size={22} />,
        bg: (d) => d ? 'rgba(255, 255, 255, 0.05)' : '#F2EBE0',
        border: (d) => d ? 'rgba(229, 214, 167, 0.2)' : 'rgba(31, 56, 36, 0.1)',
        iconBg: (d) => d ? '#E5D6A7' : '#E5D6A7',
        glowColor: '#E5D6A7',
        textColor: '#1F3824',
        greeting: "I'm here with you. Take a breath — let's slow down together. What's weighing on you right now?",
    },
    {
        key: 'focus',
        label: 'Focus',
        hint: 'Lock in & cut the noise',
        icon: <Zap size={22} />,
        bg: (d) => d ? 'rgba(255, 255, 255, 0.05)' : '#F2EBE0',
        border: (d) => d ? 'rgba(229, 214, 167, 0.2)' : 'rgba(31, 56, 36, 0.1)',
        iconBg: (d) => d ? '#E5D6A7' : '#E5D6A7',
        glowColor: '#E5D6A7',
        textColor: '#1F3824',
        greeting: "Let's sharpen that focus. What's the one thing you need to nail right now — and what's getting in the way?",
    },
    {
        key: 'motivation',
        label: 'Motivation',
        hint: 'Reignite your drive',
        icon: <Flame size={22} />,
        bg: (d) => d ? 'rgba(255, 255, 255, 0.05)' : '#F2EBE0',
        border: (d) => d ? 'rgba(229, 214, 167, 0.2)' : 'rgba(31, 56, 36, 0.1)',
        iconBg: (d) => d ? '#E5D6A7' : '#E5D6A7',
        glowColor: '#E5D6A7',
        textColor: '#1F3824',
        greeting: "The drive will come back — I promise. But first, tell me: when did you last feel truly fired up? What was different then?",
    },
    {
        key: 'setbacks',
        label: 'Setbacks',
        hint: 'Rise through the friction',
        icon: <Mountain size={22} />,
        bg: (d) => d ? 'rgba(255, 255, 255, 0.05)' : '#F2EBE0',
        border: (d) => d ? 'rgba(229, 214, 167, 0.2)' : 'rgba(31, 56, 36, 0.1)',
        iconBg: (d) => d ? '#E5D6A7' : '#E5D6A7',
        glowColor: '#E5D6A7',
        textColor: '#1F3824',
        greeting: "I'm glad you came here. Whatever happened — it doesn't define you. Tell me what's going on. I'm listening.",
    },
];

const loadSessions = (): CoachSession[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.COACH_SESSIONS);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveSessions = (sessions: CoachSession[]) => {
    const trimmed = sessions.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.COACH_SESSIONS, JSON.stringify(trimmed));
};

const autoTitle = (firstUserMessage: string): string => {
    const clean = firstUserMessage.trim();
    if (clean.length <= 40) return clean;
    return clean.substring(0, 38) + '…';
};

const pillarLabel = (pillar: CoachPillar): string =>
    pillar === 'open' ? 'Open' : PILLAR_CONFIGS.find(p => p.key === pillar)?.label ?? 'Chat';

const pillarIcon = (pillar: CoachPillar, size = 16): React.ReactNode => {
    switch (pillar) {
        case 'anxiety':    return <Wind size={size} />;
        case 'focus':      return <Zap size={size} />;
        case 'motivation': return <Flame size={size} />;
        case 'setbacks':   return <Mountain size={size} />;
        default:           return <MessageCircle size={size} />;
    }
};

const formatDate = (ms: number): string => {
    const d = new Date(ms);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - ms) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const CoachView: React.FC<Omit<CoachViewProps, 'isDarkMode'>> = ({ user, onBack, onNavigate }) => {
    const { isDarkMode } = useTheme();
    type ViewMode = 'home' | 'chat' | 'history';
    const [view, setView] = useState<ViewMode>('home');
    const [sessions, setSessions] = useState<CoachSession[]>(() => loadSessions());
    const [activeSession, setActiveSession] = useState<CoachSession | null>(null);
    const [historySearch, setHistorySearch] = useState('');
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showCompletionMoment, setShowCompletionMoment] = useState(false);
    const completionShownRef = useRef(false);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [viewportTop, setViewportTop] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<{ stop: () => void } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
                setViewportTop(window.visualViewport.offsetTop);
            } else {
                setViewportHeight(window.innerHeight);
                setViewportTop(0);
            }
        };
        window.visualViewport?.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('scroll', handleResize);
        window.addEventListener('resize', handleResize);
        handleResize();
        document.body.style.overflow = 'hidden';
        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = '';
        };
    }, []);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, []);

    useEffect(() => {
        if (view === 'chat') {
            const t = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(t);
        }
    }, [activeSession?.messages, isTyping, viewportHeight, view, scrollToBottom]);

    const upsertSession = useCallback((session: CoachSession) => {
        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === session.id);
            let next: CoachSession[];
            if (idx >= 0) {
                next = [...prev];
                next[idx] = session;
            } else {
                next = [session, ...prev];
            }
            saveSessions(next);
            return next;
        });
    }, []);

    const startPillarSession = useCallback((pillar: CoachPillar) => {
        completionShownRef.current = false;
        haptics.medium();
        const config = PILLAR_CONFIGS.find(p => p.key === pillar);
        const greeting = config?.greeting ?? "What's on your mind?";
        const firstName = user.name ? user.name.split(' ')[0] : 'Friend';

        const greetingMsg: ChatMessage = {
            id: 'init-' + Date.now(),
            role: 'assistant',
            text: `Hey ${firstName}. ${greeting}`,
            timestamp: Date.now(),
        };

        const newSession: CoachSession = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
            pillar,
            title: pillarLabel(pillar),
            messages: [greetingMsg],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
        };

        upsertSession(newSession);
        setActiveSession(newSession);
        setView('chat');
    }, [user.name, upsertSession]);

    const resumeSession = useCallback((session: CoachSession) => {
        haptics.light();
        setActiveSession(session);
        setView('chat');
    }, []);

    const buildContext = useCallback(() => ({
        name: user.name,
        quoteIntensity: user.quoteIntensity,
        energyLevel: user.currentEnergy,
        currentStreak: user.streak || 0,
        completedGoals: user.dailyFocuses?.filter(f => f.isCompleted).length || 0,
        totalGoals: user.dailyFocuses?.length || 0,
        profession: user.profession,
        detectedPatterns: analyzeBehaviorPatterns(user),
        recentJournalEntries: user.journalEntries?.slice(-3).map(e => ({
            date: e.date,
            highlight: e.highlight,
            lowlight: e.lowlight,
        })),
        recentReflections: user.meditationReflections?.slice(-3).map(r => ({
            date: r.date,
            intention: r.intention,
            reflection: r.reflection,
        })),
        energyTrends: user.energyHistory?.slice(-10),
        userNarrative: user.userNarrative?.text,
        momentumState: getMomentumState(user),
        currentMood: user.currentMood,
        focusAreas: user.focusAreas,
        coachTone: user.coachSettings?.coachTone,
    }), [user]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeSession) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputText,
            timestamp: Date.now(),
            role: 'user',
        };

        const isFirstUserMsg = activeSession.messages.filter(m => m.role === 'user').length === 0;
        const updatedTitle = isFirstUserMsg ? autoTitle(inputText) : activeSession.title;

        const updatedSession: CoachSession = {
            ...activeSession,
            title: updatedTitle,
            messages: [...activeSession.messages, userMsg],
            updatedAt: Date.now(),
            messageCount: activeSession.messageCount + 1,
        };

        setActiveSession(updatedSession);
        upsertSession(updatedSession);
        setInputText('');
        setIsTyping(true);
        haptics.light();

        const context = buildContext();
        const pillar = activeSession.pillar as CoachPillarKey;

        try {
            const responseText = pillar === 'open'
                ? await chatWithCoach(userMsg.text, updatedSession.messages, context)
                : await chatWithCoachPillar(userMsg.text, updatedSession.messages, context, pillar);

            const coachMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                timestamp: Date.now(),
                role: 'assistant',
            };

            const finalSession: CoachSession = {
                ...updatedSession,
                messages: [...updatedSession.messages, coachMsg],
                updatedAt: Date.now(),
            };

            setActiveSession(finalSession);
            upsertSession(finalSession);
            haptics.medium();

            // After the 3rd coach reply in a session, surface a quiet completion moment
            const coachMsgCount = finalSession.messages.filter(m => m.role === 'assistant').length;
            if (coachMsgCount === 3 && !completionShownRef.current) {
                completionShownRef.current = true;
                setTimeout(() => {
                    setShowCompletionMoment(true);
                    haptics.success();
                    setTimeout(() => setShowCompletionMoment(false), 4000);
                }, 600);
            }
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const startDictation = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SpeechRecognitionCtor =
            (window as Record<string, unknown>).SpeechRecognition ||
            (window as Record<string, unknown>).webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }
        const recognition = new (SpeechRecognitionCtor as new () => SpeechRecognitionInstance)();
        recognitionRef.current = recognition as { stop: () => void };
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => { setIsListening(true); haptics.light(); };
        recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
            }
            if (final) setInputText(prev => prev + final);
        };
        recognition.onerror = (event: { error: string }) => { console.error(event.error); setIsListening(false); };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const filteredSessions = sessions.filter(s => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
            s.title.toLowerCase().includes(q) ||
            s.pillar.toLowerCase().includes(q)
        );
    });

    // ── Design Tokens ──────────────────────────────────────────────────────────
    const forestSage = '#415D43';
    const hunterGreen = '#1B4332';
    const deepestHunter = '#1F3824';
    const paleGold = '#E5D6A7';
    const ivory = '#F2EBE0';
    const terracotta = '#C96A3A';

    const bg = forestSage; // User requested "New Forest Sage" background
    const textPrimary = 'text-[#E5D6A7]'; // Pale Gold for premium titles
    const textSecondary = 'text-white/60';
    const cardBg = 'rgba(255, 255, 255, 0.05)';
    const borderColor = 'rgba(229, 214, 167, 0.15)';

    if (!canUseAI(user)) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 ${textPrimary}`}>
                <div className="p-8 rounded-full bg-white/5">
                    <Bot size={48} className="opacity-20 text-[#E5D6A7]" />
                </div>
                <h2 className="text-2xl font-display font-medium text-[#E5D6A7]">Coming Soon</h2>
                <p className="text-sm opacity-60 max-w-xs text-[#E5D6A7]/60">Your AI Coach is currently calibrating for your journey.</p>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex flex-col font-sans overflow-hidden"
            style={{
                background: bg,
                color: '#E5D6A7',
                height: `${viewportHeight}px`,
                top: `${viewportTop}px`,
                left: 0,
                right: 0,
                position: 'fixed',
            }}
        >
            {/* ── Background depth — matches app visual language ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Central luminosity bloom */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(105,145,90,0.38) 0%, transparent 62%)',
                }} />
                {/* Edge vignette */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 38%, rgba(18,32,16,0.50) 100%)',
                }} />
                {/* Bottom terracotta warmth */}
                <div className="absolute bottom-0 inset-x-0" style={{
                    height: '40%',
                    background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.13) 0%, transparent 70%)',
                }} />
                {/* Bold structural arcs — upper corners */}
                <svg aria-hidden className="absolute inset-0 w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
                    <circle cx="480" cy="-30" r="310" fill="none" stroke="#2A4A2A" strokeWidth="65" opacity="0.45" />
                    <circle cx="480" cy="-30" r="228" fill="none" stroke="#E5D6A7" strokeWidth="1.2" opacity="0.18" strokeDasharray="6 10" />
                    <circle cx="-90" cy="-30" r="320" fill="none" stroke="#1E3820" strokeWidth="60" opacity="0.40" />
                    <circle cx="-90" cy="-30" r="238" fill="none" stroke="#C96A3A" strokeWidth="1.2" opacity="0.16" strokeDasharray="5 9" />
                </svg>
            </div>

            {/* ── HOME VIEW ──────────────────────────────────────────────── */}
            {view === 'home' && (
                <>
                    <header className="relative z-20 px-8 pt-16 pb-4">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={onBack}
                                className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-white/5 hover:bg-white/10 text-[#E5D6A7]"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { haptics.light(); setView('history'); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-white/5 hover:bg-white/10 text-[#E5D6A7]"
                                >
                                    <Clock size={17} />
                                </button>
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-white/5 text-[#E5D6A7] border border-[#E5D6A7]/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                </div>
                            </div>
                        </div>
                        <h2 className="text-5xl font-display font-medium tracking-tight text-white mb-2">
                            {user.coachName || 'Palante Coach'}
                        </h2>
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${textSecondary}`}>
                            Guidance for your journey.
                        </p>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-2 relative z-10 space-y-4" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '7rem' }}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${textPrimary}`}>
                            Choose your focus
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {PILLAR_CONFIGS.map((pillar) => (
                                <button
                                    key={pillar.key}
                                    onClick={() => startPillarSession(pillar.key)}
                                    className="relative overflow-hidden rounded-[2.5rem] p-6 text-left transition-all duration-300 active:scale-95 group"
                                    style={{
                                        background: cardBg,
                                        border: `2px solid ${borderColor}`,
                                    }}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-[#E5D6A7] flex items-center justify-center mb-5 text-[#1B4332] shadow-sm transform group-hover:rotate-6 transition-transform">
                                        {pillar.icon}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="font-display font-medium text-[16px] tracking-tight text-[#E5D6A7]">
                                            {pillar.label}
                                        </p>
                                        <p className="text-[11px] mt-1 font-medium text-white/40 leading-snug">
                                            {pillar.hint}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 py-4">
                            <div className="flex-1 h-px bg-[#E5D6A7]/10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 text-[#E5D6A7]">
                                OR TALK FREELY
                            </span>
                            <div className="flex-1 h-px bg-[#E5D6A7]/10" />
                        </div>

                        <button
                            onClick={() => startPillarSession('open')}
                            className="w-full flex items-center gap-6 px-6 py-5 rounded-[2.5rem] transition-all bg-[#C96A3A] hover:bg-[#D4895A] active:scale-[0.98] shadow-xl group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                                <MessageCircle size={24} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-display font-medium text-lg text-white leading-tight">
                                    Open Conversation
                                </p>
                                <p className="text-[11px] text-white/60 font-medium">
                                    Let's talk about anything.
                                </p>
                            </div>
                            <span className="text-white opacity-40 font-light text-2xl group-hover:translate-x-1 transition-transform">›</span>
                        </button>

                        <div className="h-4" />
                    </div>
                </>
            )}

            {/* ── CHAT VIEW ──────────────────────────────────────────────── */}
            {view === 'chat' && activeSession && (
                <>
                    <header className="relative z-20 px-6 pt-14 pb-4">
                        <div className="flex items-center justify-between mb-5">
                            <button
                                onClick={() => { setView('home'); }}
                                className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-white/5 hover:bg-white/10 text-[#E5D6A7]"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-white/5 text-[#E5D6A7] border border-[#E5D6A7]/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-display font-medium tracking-tight text-white">
                                {user.coachName || 'Palante Coach'}
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                                {activeSession.pillar === 'open' ? 'HERE FOR YOU' : `${pillarLabel(activeSession.pillar)} SESSION`}
                            </p>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-10 relative z-10 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '9rem' }}>
                        {activeSession.messages.map((msg: ChatMessage) => (
                            <div key={msg.id} className={`flex flex-col min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-3 opacity-30 text-[10px] font-black uppercase tracking-widest text-[#E5D6A7]">
                                        <Sparkles size={10} />
                                        {user.coachName || 'Coach'}
                                    </div>
                                )}
                                <div className={`
                                    max-w-[82%] text-lg leading-relaxed font-body break-words min-w-0
                                    ${msg.role === 'user'
                                        ? 'px-7 py-4 rounded-[2rem] bg-[#E5D6A7] text-[#1B4332] font-semibold shadow-lg'
                                        : 'text-white font-medium opacity-90'
                                    }
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-3 opacity-30 text-[10px] font-black uppercase tracking-widest text-[#E5D6A7]">
                                    Thinking...
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-24" />
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 z-30 px-6 pb-12 pt-4">
                        <form onSubmit={handleSend} className="max-w-xl mx-auto">
                            <div className="flex items-center gap-4 px-6 py-4 rounded-[3rem] bg-white/10 border-2 border-[#E5D6A7]/20 focus-within:border-[#E5D6A7]/50 backdrop-blur-3xl shadow-2xl transition-all">
                                <button
                                    type="button"
                                    onClick={startDictation}
                                    className={`p-2 rounded-full transition-all ${isListening ? 'text-red-400 scale-125' : 'text-[#E5D6A7] opacity-60 hover:opacity-100'}`}
                                >
                                    <Mic size={20} />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Speak your truth..."
                                    className="flex-1 bg-transparent py-2 outline-none text-white placeholder:text-white/20"
                                    style={{ fontSize: '16px' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isTyping}
                                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all
                                        ${!inputText.trim() || isTyping
                                            ? 'opacity-0 scale-50'
                                            : 'bg-[#E5D6A7] text-[#1B4332] shadow-xl hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    <Send size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* ── COMPLETION MOMENT ──────────────────────────────────────── */}
            <AnimatePresence>
                {showCompletionMoment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        onClick={() => setShowCompletionMoment(false)}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto"
                        style={{ background: 'rgba(65, 93, 67, 0.72)', backdropFilter: 'blur(18px)' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="text-center px-10"
                        >
                            <div className="w-16 h-px bg-[#E5D6A7]/30 mx-auto mb-8" />
                            <p className="font-display text-4xl font-medium text-white leading-snug mb-4">
                                You showed up<br />for yourself.
                            </p>
                            <p className="text-[#E5D6A7]/60 text-sm font-medium tracking-wide">
                                That's the whole practice.
                            </p>
                            <div className="w-16 h-px bg-[#E5D6A7]/30 mx-auto mt-8" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HISTORY VIEW ───────────────────────────────────────────── */}
            {view === 'history' && (
                <>
                    <header className="relative z-20 px-8 pt-16 pb-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-4xl font-display font-medium ${textPrimary}`}>Archive</h2>
                            <button
                                onClick={() => { setHistorySearch(''); setView('home'); }}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-[#E5D6A7]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 px-6 py-4 rounded-[2rem] bg-white/5 border-2 border-[#E5D6A7]/10 focus-within:border-[#E5D6A7]/40 transition-all">
                            <Search size={18} className="text-[#E5D6A7] opacity-40" />
                            <input
                                type="text"
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                                placeholder="Search sessions..."
                                className="flex-1 bg-transparent outline-none text-[#E5D6A7] placeholder:opacity-30"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10 space-y-3" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '7rem' }}>
                        {filteredSessions.map(s => {
                            const pillarConf = PILLAR_CONFIGS.find(p => p.key === s.pillar);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => resumeSession(s)}
                                    className="w-full flex items-center gap-5 px-6 py-5 rounded-[2.5rem] bg-white/5 border-2 border-[#E5D6A7]/10 text-left transition-all active:scale-[0.98] hover:bg-white/10"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-[#E5D6A7] flex items-center justify-center text-[#1B4332] flex-shrink-0">
                                        {pillarIcon(s.pillar, 20)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display font-medium text-lg text-[#E5D6A7] truncate">{s.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D6A7]/40 mt-1">
                                            {pillarLabel(s.pillar)} · {formatDate(s.updatedAt)}
                                        </p>
                                    </div>
                                    <ChevronLeft size={20} className="rotate-180 opacity-20 text-[#E5D6A7]" />
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};
