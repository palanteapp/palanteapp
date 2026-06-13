import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, Sparkles, ChevronLeft, Clock, Search, X, MessageCircle,
    Zap, Flame, Mountain, Wind, Home, TrendingUp, Wrench, MessageSquare, History, User, Star, Trash2, Brain
} from 'lucide-react';
import { PartnerMemoryPanel } from './PartnerMemoryPanel';
import { chatWithCoach, chatWithCoachPillar, getMomentumState } from '../utils/aiService';
import { getHealthContext } from '../utils/healthService';
import type { HealthContext } from '../utils/healthService';
import type { CoachPillarKey } from '../utils/aiService';
import type { UserProfile, ChatMessage, CoachSession, CoachPillar } from '../types';
import { canUseAI } from '../types';
import { haptics } from '../utils/haptics';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useTheme } from '../contexts/ThemeContext';
import { analyzeBehaviorPatterns } from '../utils/practiceUtils';
import { loadConversationMemories, extractAndSaveMemories } from '../utils/memoryService';
import { Capacitor } from '@capacitor/core';

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
    const [showMemoryPanel, setShowMemoryPanel] = useState(false);
    const [sessions, setSessions] = useState<CoachSession[]>(() => loadSessions());
    const [activeSession, setActiveSession] = useState<CoachSession | null>(null);
    const [historySearch, setHistorySearch] = useState('');
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [persistedMemories, setPersistedMemories] = useState<string[]>([]);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [viewportTop, setViewportTop] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const healthCtxRef = useRef<HealthContext | undefined>(undefined);

    // Fetch Apple Health context once on mount — silently ignored if unavailable
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            getHealthContext().then(ctx => {
                if (ctx && (ctx.sleepHours !== undefined || ctx.restingHR !== undefined)) {
                    healthCtxRef.current = ctx;
                }
            }).catch(() => {});
        }
    }, []);

    // Load cross-session memories so Palante remembers the user across conversations
    useEffect(() => {
        if (user.id) {
            loadConversationMemories(user.id).then(setPersistedMemories).catch(() => {});
        }
    }, [user.id]);

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

    // Path B: the pillar picker is gone. New sessions always start as 'open' and Palante figures
    // out the right tone from what the user says. startPillarSession is kept for callers, but we
    // no longer persist the session at creation time — only when the user actually sends a message.
    // This prevents the Archive from filling up with empty single-greeting sessions every time
    // the user taps "Palante" without saying anything.
    const startPillarSession = useCallback((pillar: CoachPillar) => {
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

        // Do NOT persist yet — wait for the first user message. The existing message-send flow
        // calls upsertSession when a message lands, which is when the session becomes worth saving.
        setActiveSession(newSession);
        setView('chat');
    }, [user.name, upsertSession]);

    const resumeSession = useCallback((session: CoachSession) => {
        haptics.light();
        setActiveSession(session);
        setView('chat');
    }, []);

    // Path B: skip the pillar picker entirely. When the user lands on the Coach home view
    // and there's no active session, immediately start a fresh open conversation. Archive
    // is still reachable via the icon in the chat header.
    useEffect(() => {
        if (view === 'home' && !activeSession) {
            startPillarSession('open');
        }
    }, [view, activeSession, startPillarSession]);

    // Two-step delete: tap once to arm, tap again within 3s to commit. Auto-disarms.
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const armDelete = useCallback((sessionId: string) => {
        haptics.medium();
        setPendingDeleteId(sessionId);
        if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = setTimeout(() => setPendingDeleteId(null), 3000);
    }, []);

    const deleteSession = useCallback((sessionId: string) => {
        haptics.heavy();
        setPendingDeleteId(null);
        if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
        setSessions(prev => {
            const next = prev.filter(s => s.id !== sessionId);
            saveSessions(next);
            return next;
        });
        // If the deleted session is the currently active one, clear it
        setActiveSession(prev => prev?.id === sessionId ? null : prev);
    }, []);

    useEffect(() => () => {
        if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
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
        persistedMemories,
        bio: user.bio,
        healthContext: healthCtxRef.current,
    }), [user, persistedMemories]);

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

        } catch (error) {
            console.error('Chat error:', error);
            const errMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting right now. Check your connection and try again — I'm here when you're ready.",
                timestamp: Date.now(),
                role: 'assistant',
            };
            if (activeSession) {
                const errSession = { ...updatedSession, messages: [...updatedSession.messages, errMsg], updatedAt: Date.now() };
                setActiveSession(errSession);
                upsertSession(errSession);
            }
        } finally {
            setIsTyping(false);
        }
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
    const textSecondary = 'text-white';
    const cardBg = 'rgba(255, 255, 255, 0.05)';
    const borderColor = 'rgba(229, 214, 167, 0.15)';

    if (!canUseAI(user)) {
        const isDisabledInSettings = user.aiDisabled;
        return (
            <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 ${textPrimary}`}>
                <div className="p-8 rounded-full bg-white/5">
                    <Bot size={48} className="opacity-20 text-[#E5D6A7]" />
                </div>
                <h2 className="text-3xl font-display font-medium text-[#E5D6A7]">
                    {isDisabledInSettings ? 'Partner Disabled' : 'Coming Soon'}
                </h2>
                <p className="text-sm opacity-60 max-w-xs text-[#E5D6A7]/60">
                    {isDisabledInSettings
                        ? 'AI features are turned off in your settings. Go to Settings → toggle AI on to access your partner.'
                        : 'Your partner is getting ready for your journey.'}
                </p>
            </div>
        );
    }

    return (
        <>
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
            {/* ── Background depth — matches home page visual language exactly ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Central luminosity bloom */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(105,145,90,0.45) 0%, transparent 62%)',
                }} />
                {/* Edge vignette */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 38%, rgba(18,32,16,0.55) 100%)',
                }} />
                {/* Bottom terracotta warmth */}
                <div className="absolute bottom-0 inset-x-0" style={{
                    height: '40%',
                    background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.13) 0%, transparent 70%)',
                }} />
                {/* Seed of Life — matches home page sacred geometry exactly */}
                <svg aria-hidden className="absolute inset-0 w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
                    <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.14">
                        <circle cx="195" cy="413" r="148" strokeWidth="0.9" />
                        <circle cx="343" cy="413" r="148" />
                        <circle cx="269" cy="541" r="148" />
                        <circle cx="121" cy="541" r="148" />
                        <circle cx="47"  cy="413" r="148" />
                        <circle cx="121" cy="285" r="148" />
                        <circle cx="269" cy="285" r="148" />
                    </g>
                </svg>
            </div>

            {/* ── HOME VIEW ──────────────────────────────────────────────── */}
            {/* Path B: the pillar picker is gone. When view === 'home' is briefly active,
                an effect immediately starts an open conversation, transitioning to view === 'chat'.
                This minimal loader prevents a flash of empty content during that handoff. */}
            {view === 'home' && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 opacity-40 text-[#E5D6A7]">
                        <Sparkles size={14} className="animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">
                            Opening Palante…
                        </p>
                    </div>
                </div>
            )}

            {/* ── CHAT VIEW ──────────────────────────────────────────────── */}
            {view === 'chat' && activeSession && (
                <>
                    <header className="relative z-20 px-6 pt-14 pb-4">
                        <div className="flex items-center justify-between mb-5">
                            {/* Back button now exits Coach entirely (no more pillar-picker home to return to). */}
                            <button
                                onClick={() => {
                                    if (activeSession && user.id) {
                                        extractAndSaveMemories(activeSession.messages, user.id, user.name || 'Friend').catch(() => {});
                                    }
                                    onBack?.();
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-white/5 hover:bg-white/10 text-[#E5D6A7]"
                                aria-label="Back to Palante"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                {/* Archive icon */}
                                <button
                                    onClick={() => { haptics.light(); setView('history'); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-white/5 hover:bg-white/10 text-[#E5D6A7]"
                                    aria-label="Archive"
                                >
                                    <Clock size={17} />
                                </button>
                                {/* Memory panel */}
                                <button
                                    onClick={() => { haptics.light(); setShowMemoryPanel(true); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-white/5 hover:bg-white/10 text-[#E5D6A7]"
                                    aria-label="What your partner knows"
                                >
                                    <Brain size={17} />
                                </button>
                                <div className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-white/5 text-[#E5D6A7] border border-[#E5D6A7]/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl font-display font-medium tracking-tight text-white">
                                {user.coachName || 'Palante'}
                            </h2>
                            {/* Path B: always show one consistent identity. No more "ANXIETY SESSION" / "FOCUS SESSION" labels. */}
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-white mt-1">
                                HERE FOR YOU
                            </p>
                        </div>
                    </header>

                    <div role="log" aria-label="Conversation" className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-10 relative z-10 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '9rem' }}>
                        {activeSession.messages.map((msg: ChatMessage, idx: number) => (
                            <div key={msg.id} className={`flex flex-col min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.role === 'assistant' && idx > 0 && (
                                    <div className="flex items-center gap-2 mb-3 opacity-30 text-xs font-black uppercase tracking-widest text-[#E5D6A7]">
                                        <Sparkles size={10} />
                                        {user.coachName || 'Palante'}
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

                        {/* Fresh-chat affordances. Only show when the conversation is brand new
                            (greeting only, no user replies yet). Adds life to the empty state and
                            reduces blank-page paralysis without re-introducing the pillar picker. */}
                        {activeSession.messages.length <= 1 && !isTyping && (() => {
                            const today = new Date().toISOString().split('T')[0];
                            const todayPractice = (user.dailyMorningPractice || [])
                                .find(p => p.date === today);
                            const todayIntention = todayPractice?.dailyIntention?.trim();
                            const todayCommitment = todayPractice?.commitment?.trim();

                            // Rotate 3 prompts from a pool using time-of-day + day-of-year
                            // so they feel fresh each morning/afternoon/evening without randomness.
                            const hour = new Date().getHours();
                            const dayOfYear = Math.floor(
                                (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
                            );
                            const timeBucket = hour < 12 ? 0 : hour < 17 ? 1 : 2;
                            const rotateSeed = dayOfYear * 3 + timeBucket;

                            const promptPool: string[] = [
                                "Something's been on my mind",
                                "I want to think out loud",
                                "Tell me what you see in me lately",
                                hour < 12
                                    ? "Help me set the right tone today"
                                    : hour < 17
                                    ? "I need a midday reset"
                                    : "I want to make sense of today",
                                "I've been avoiding something",
                                "I feel stuck and I'm not sure why",
                                hour < 17
                                    ? "I want to talk about where I'm headed"
                                    : "I'm carrying something into tomorrow",
                                "Check in with me",
                                "I need to hear something true",
                                "What do you notice about me?",
                                todayIntention
                                    ? `Help me live into "${todayIntention}" today`
                                    : "I want to move with more intention",
                            ];
                            const n = promptPool.length;
                            const stride = Math.floor(n / 3);
                            const seedPrompts = [
                                promptPool[rotateSeed % n],
                                promptPool[(rotateSeed + stride) % n],
                                promptPool[(rotateSeed + stride * 2) % n],
                            ];

                            return (
                                <div className="space-y-5 animate-fade-in">
                                    {(todayIntention || todayCommitment) && (
                                        <div className="flex items-start gap-3 pl-1">
                                            <div className="w-1 self-stretch rounded-full bg-[#C96A3A]/60 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E5D6A7]/40 mb-1">
                                                    Today
                                                </p>
                                                <p className="text-sm text-[#E5D6A7]/75 font-medium leading-snug">
                                                    {todayCommitment
                                                        ? <>You said today would look like <span className="italic text-[#E5D6A7]">{todayCommitment}</span></>
                                                        : <>Your intention is <span className="italic text-[#E5D6A7]">{todayIntention}</span></>}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E5D6A7]/30 pl-1">
                                            Try one
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {seedPrompts.map((prompt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        haptics.light();
                                                        setInputText(prompt);
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="text-left px-5 py-3 rounded-2xl text-[15px] font-semibold text-[#1F3824] bg-[#E5D6A7] hover:bg-[#D4C28F] active:scale-[0.98] shadow-md transition-all"
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {isTyping && (
                            <div role="status" aria-label="Your partner is thinking" className="flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-3 opacity-30 text-xs font-black uppercase tracking-widest text-[#E5D6A7]">
                                    Thinking...
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#E5D6A7] animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-36" />
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 z-[220] px-6 pt-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                        <form onSubmit={handleSend} className="max-w-xl mx-auto">
                            <div className="flex items-center gap-4 px-6 py-4 rounded-[3rem] bg-white/10 border-2 border-[#E5D6A7]/20 focus-within:border-[#E5D6A7]/50 backdrop-blur-3xl shadow-2xl transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Speak your truth..."
                                    aria-label="Message your partner"
                                    className="flex-1 bg-transparent py-2 outline-none text-white placeholder:text-white/20"
                                    style={{ fontSize: '16px' }}
                                />
                                <button
                                    type="submit"
                                    aria-label="Send message"
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


            {/* ── HISTORY VIEW ───────────────────────────────────────────── */}
            {view === 'history' && (
                <>
                    <header className="relative z-20 px-8 pt-16 pb-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-4xl font-display font-medium ${textPrimary}`}>Archive</h2>
                            <button
                                onClick={() => {
                                    setHistorySearch('');
                                    // Return to chat if we have one; otherwise exit Coach entirely.
                                    // (We never return to 'home' anymore — that view is a transient redirect.)
                                    if (activeSession) {
                                        setView('chat');
                                    } else {
                                        onBack?.();
                                    }
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-[#E5D6A7]"
                                aria-label="Close archive"
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
                                aria-label="Search sessions"
                                className="flex-1 bg-transparent outline-none text-[#E5D6A7] placeholder:opacity-30"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10 space-y-3" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '7rem' }}>
                        {filteredSessions.map(s => {
                            const isPending = pendingDeleteId === s.id;
                            return (
                                <div
                                    key={s.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { if (!isPending) resumeSession(s); }}
                                    onKeyDown={(e) => { if (!isPending && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); resumeSession(s); } }}
                                    className={`w-full flex items-center gap-5 px-6 py-5 rounded-[2.5rem] bg-white/5 border-2 text-left transition-all active:scale-[0.98] hover:bg-white/10 cursor-pointer ${isPending ? 'border-red-400/60 bg-red-400/5' : 'border-[#E5D6A7]/10'}`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-[#E5D6A7] flex items-center justify-center text-[#1B4332] flex-shrink-0">
                                        {pillarIcon(s.pillar, 20)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display font-medium text-lg text-[#E5D6A7] truncate">
                                            {isPending ? 'Tap trash again to delete' : s.title}
                                        </p>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E5D6A7]/40 mt-1">
                                            {pillarLabel(s.pillar)} · {formatDate(s.updatedAt)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={isPending ? `Confirm delete ${s.title}` : `Delete ${s.title}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPending) {
                                                deleteSession(s.id);
                                            } else {
                                                armDelete(s.id);
                                            }
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all ${isPending ? 'bg-red-400/20 text-red-300' : 'bg-white/0 hover:bg-white/10 text-[#E5D6A7]/40 hover:text-[#E5D6A7]/70'}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>

        <PartnerMemoryPanel
            isOpen={showMemoryPanel}
            onClose={() => setShowMemoryPanel(false)}
            user={user}
        />
        </>
    );
};
