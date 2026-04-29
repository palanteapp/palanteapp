import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Mic, Sparkles, ChevronLeft, MessageSquare, ArrowRight, Lightbulb, Zap, Moon, Sun, Wind } from 'lucide-react';
import { chatWithCoach } from '../utils/aiService';
import type { UserProfile, ChatMessage } from '../types';
import { canUseAI } from '../types';
import { haptics } from '../utils/haptics';

interface CoachViewProps {
    user: UserProfile;
    isDarkMode: boolean;
    onBack?: () => void;
}

export const CoachView: React.FC<CoachViewProps> = ({ user, isDarkMode, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [viewportTop, setViewportTop] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

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

        // Initial call
        handleResize();

        // Lock window scroll on mount
        document.body.style.overflow = 'hidden';

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const firstName = user.name ? user.name.split(' ')[0] : 'Friend';
        let greetingText = `Hey ${firstName}! `;
        const hour = new Date().getHours();

        if (hour < 11) greetingText += "I'm so glad you're starting your morning with me. ";
        else if (hour < 17) greetingText += "I'm here for you, no matter how your afternoon is flowing. ";
        else greetingText += "I'm right here as you unwind and prepare to rest. ";

        if (messages.length === 0) {
            setMessages([{
                id: 'init-1',
                text: `${greetingText} I'm here for you every step of the way. What's on your mind right now?`,
                timestamp: Date.now(),
                role: 'assistant'
            }]);
        }
    }, [user]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    };

    useEffect(() => {
        // Short delay to ensure keyboard animation has settled
        const timeout = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeout);
    }, [messages, isTyping, viewportHeight]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputText,
            timestamp: Date.now(),
            role: 'user'
        };

        setMessages((prev: ChatMessage[]) => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        haptics.light();

        const context = {
            name: user.name,
            quoteIntensity: user.quoteIntensity,
            energyLevel: user.currentEnergy,
            currentStreak: user.streak || 0,
            completedGoals: user.dailyFocuses?.filter(f => f.isCompleted).length || 0,
            totalGoals: user.dailyFocuses?.length || 0,
            profession: user.profession,
            // Enhanced Memory Context
            recentJournalEntries: user.journalEntries?.slice(-3).map(e => ({
                date: e.date,
                highlight: e.highlight,
                lowlight: e.lowlight
            })),
            recentReflections: user.meditationReflections?.slice(-3).map(r => ({
                date: r.date,
                intention: r.intention,
                reflection: r.reflection
            })),
            energyTrends: user.energyHistory?.slice(-10)
        };

        try {
            const responseText = await chatWithCoach(userMsg.text, messages, context);
            const coachMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                timestamp: Date.now(),
                role: 'assistant'
            };
            setMessages((prev: ChatMessage[]) => [...prev, coachMsg]);
            haptics.medium();
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const startDictation = () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            haptics.light();
        };
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setInputText((prev: string) => prev + finalTranscript);
            }
        };
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const suggestions = [
        { icon: <Zap size={14} />, text: "Help me focus" },
        { icon: <Moon size={14} />, text: "Evening review" },
        { icon: <Sun size={14} />, text: "Plan my day" },
        { icon: <Wind size={14} />, text: "Calm my mind" },
        { icon: <Lightbulb size={14} />, text: "New perspective" }
    ];

    if (!canUseAI(user)) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                <div className={`p-8 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/10'}`}>
                    <Bot size={48} className="opacity-20" />
                </div>
                <h2 className="text-2xl font-display font-medium">Coming Soon</h2>
                <p className="text-sm opacity-60 max-w-xs">Your AI Coach is currently calibrating for your journey.</p>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-[200] flex flex-col font-sans overflow-hidden ${isDarkMode ? 'bg-[#3A453C] text-white' : 'bg-white text-[#4A5D4E]'}`}
            style={{
                height: `${viewportHeight}px`,
                top: `${viewportTop}px`,
                left: 0,
                right: 0,
                position: 'fixed'
            }}
        >
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'}`} />
                <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10 ${isDarkMode ? 'bg-[#4A5D4E]' : 'bg-[#E2CF9F]'}`} />
            </div>

            {/* Immersive Header */}
            <header className="relative z-20 px-8 pt-16 pb-6">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-[#4A5D4E]/5 hover:bg-[#4A5D4E]/10'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'bg-white/5 text-[#E2CF9F] border border-white/5' : 'bg-[#4A5D4E]/5 text-[#4A5D4E] border border-[#4A5D4E]/5'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        Live
                    </div>
                </div>

                <div className="space-y-1">
                    <h2 className="text-4xl font-display font-medium tracking-tight">
                        {user.coachName ? (user.coachName.includes('Coach') ? user.coachName : `Coach ${user.coachName}`) : 'Coach Palante'}
                    </h2>
                    <p className="text-lg opacity-40 font-display italic">
                        Guidance for your journey.
                    </p>
                </div>
            </header>

            {/* Suggestions Chips - Horizontal Scroll */}
            <div className="relative z-20 px-8 mb-4">
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setInputText(s.text);
                                haptics.selection();
                            }}
                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-medium transition-all active:scale-95 ${isDarkMode
                                ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                : 'bg-[#4A5D4E]/5 border-[#4A5D4E]/10 text-[#4A5D4E]/60 hover:text-[#4A5D4E] hover:bg-[#4A5D4E]/10'
                                }`}
                        >
                            {s.icon}
                            {s.text}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-10 relative z-10 scroll-smooth">
                {messages.map((msg: ChatMessage) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-3 opacity-30 text-[10px] uppercase tracking-widest font-bold ml-1">
                                <Sparkles size={10} />
                                {user.coachName || 'Coach'}
                            </div>
                        )}
                        <div className={`
                            max-w-[90%] text-lg leading-relaxed font-body
                            ${msg.role === 'user'
                                ? `px-6 py-4 rounded-[2rem] shadow-2xl ${isDarkMode ? 'bg-[#E2CF9F] text-[#3A453C] font-medium' : 'bg-[#4A5D4E] text-white font-medium'}`
                                : `${isDarkMode ? 'text-white/90' : 'text-[#4A5D4E]'}`
                            }
                        `}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex flex-col items-start min-h-[60px]">
                        <div className="flex items-center gap-2 mb-3 opacity-30 text-[10px] uppercase tracking-widest font-bold ml-1">
                            Thinking...
                        </div>
                        <div className="flex gap-2 p-2">
                            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'} animate-ping opacity-40`} />
                            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'} animate-ping delay-75 opacity-20`} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-20" />
            </div>

            {/* Input Area */}
            <div className="relative z-30 px-4 pb-12 pt-4">
                <form onSubmit={handleSend} className="relative group max-w-2xl mx-auto">
                    <div className={`
                        flex items-center gap-2 px-5 py-3 rounded-[3rem] border transition-all duration-500
                        ${isDarkMode
                            ? 'bg-[#1a1c1a]/60 border-white/5 focus-within:border-[#E2CF9F]/40 focus-within:bg-[#1a1c1a] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)]'
                            : 'bg-white/80 border-[#4A5D4E]/10 focus-within:border-[#4A5D4E]/30 shadow-2xl backdrop-blur-xl'
                        }
                    `}>
                        <button
                            type="button"
                            onClick={startDictation}
                            className={`p-2 rounded-full transition-all ${isListening ? 'text-red-500 scale-125' : 'opacity-30 hover:opacity-100 hover:scale-110'}`}
                        >
                            <Mic size={20} />
                        </button>

                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onFocus={scrollToBottom}
                            placeholder="Speak your truth..."
                            className="flex-1 bg-transparent py-2 outline-none text-[16px] md:text-lg font-body placeholder:opacity-20"
                        />

                        <div className="flex items-center">
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isTyping}
                                className={`
                                    w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300
                                    ${!inputText.trim() || isTyping
                                        ? 'opacity-0 scale-50 rotate-90 pointer-events-none'
                                        : `${isDarkMode
                                            ? 'bg-[#E2CF9F] text-[#3A453C] shadow-[0_0_20px_rgba(226,207,159,0.3)]'
                                            : 'bg-[#4A5D4E] text-white shadow-lg'} scale-100 rotate-0 hover:scale-105 active:scale-95`
                                    }
                                `}
                            >
                                <Send size={18} strokeWidth={2.5} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
