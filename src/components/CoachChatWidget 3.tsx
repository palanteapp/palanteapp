/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Mic, Lock, Sparkles } from 'lucide-react';
import { chatWithCoach } from '../utils/aiService';
import type { UserProfile, ChatMessage } from '../types';
import { canUseAI } from '../types';
import { SlideUpModal } from './SlideUpModal';

interface CoachChatWidgetProps {
    user: UserProfile;
    isDarkMode: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const CoachChatWidget: React.FC<CoachChatWidgetProps> = ({ user, isDarkMode, isOpen, onToggle }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Visual Viewport Handling for Mobile Keyboard
    useEffect(() => {
        const handleVisualViewportResize = () => {
            if (window.visualViewport) {
                const vv = window.visualViewport;
                // Total height minus the visible height, plus offset from top
                const diff = (window.innerHeight - vv.height);
                setKeyboardHeight(diff > 50 ? diff : 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewportResize);
            window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
            handleVisualViewportResize(); // Call immediately

            return () => {
                window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
                window.visualViewport?.removeEventListener('scroll', handleVisualViewportResize);
            };
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            const firstName = user.name ? user.name.split(' ')[0] : 'Friend';
            let greetingText = `Hey ${firstName}! `;
            const hour = new Date().getHours();

            if (hour < 11) greetingText += "I'm so glad you're starting your morning with me. ";
            else if (hour < 17) greetingText += "I'm here for you, no matter how your afternoon is flowing. ";
            else greetingText += "I'm right here as you unwind and prepare to rest. ";

            setMessages(prev => {
                if (prev.length === 0) {
                    return [{
                        id: 'init-1',
                        text: `${greetingText} I'm here for you every step of the way. What's on your mind right now?`,
                        timestamp: Date.now(),
                        role: 'assistant'
                    }];
                }
                return prev;
            });
        }
    }, [isOpen, user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
        recognition.continuous = true; // Allow long dictation
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setInputText(prev => prev + finalTranscript);
            }
        };
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputText,
            timestamp: Date.now(),
            role: 'user'
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        const context = {
            name: user.name,
            quoteIntensity: user.quoteIntensity,
            energyLevel: user.currentEnergy,
            currentStreak: user.streak || 0,
            completedGoals: user.dailyFocuses?.filter(f => f.isCompleted).length || 0,
            totalGoals: user.dailyFocuses?.length || 0,
            profession: user.profession
        };

        try {
            const responseText = await chatWithCoach(userMsg.text, messages, context);
            const coachMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                timestamp: Date.now(),
                role: 'assistant'
            };
            setMessages(prev => [...prev, coachMsg]);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <SlideUpModal
            isOpen={isOpen}
            onClose={onToggle}
            isDarkMode={isDarkMode}
            showCloseButton={false}
            fullScreen={true} // Full screen on mobile is safer for keyboard
        >
            <div
                className={`w-full h-full flex flex-col font-sans transition-all duration-300 ${isDarkMode ? 'bg-warm-gray-green' : 'bg-white'}`}
                style={{
                    paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 'env(safe-area-inset-bottom)',
                    height: '100%'
                }}
            >
                {!canUseAI(user) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <div className={`p-8 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/10'}`}>
                            <Lock size={40} className={isDarkMode ? 'text-white/20' : 'text-sage/40'} />
                        </div>
                        <div className="space-y-2">
                            <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                AI Coach Unavailable
                            </h3>
                            <p className={`text-xs leading-relaxed opacity-40 px-4 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                The AI Coach feature is available for users 13 years and older. You can still enjoy all other aspects of Palante.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header - Ethereal & Minimal */}
                        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5' : 'border-sage/5'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/5'}`}>
                                    <Sparkles size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className={`text-base font-display font-medium leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-rich-black'}`}>
                                        {user.coachName ? (user.coachName.startsWith('Coach') ? user.coachName : 'Coach ' + user.coachName) : 'Palante Coach'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 opacity-40">
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Minimal Ethereal Presence</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onToggle}
                                className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-white/20 hover:text-white hover:bg-white/10' : 'text-warm-gray-green/30 hover:text-warm-gray-green hover:bg-sage/5'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide overscroll-contain">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[88%] px-5 py-4 text-sm leading-relaxed font-body tracking-wide
                                        ${msg.role === 'user'
                                            ? `rounded-[1.5rem] rounded-tr-none shadow-sm ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`
                                            : `rounded-[1.5rem] rounded-tl-none ${isDarkMode ? 'bg-white/[0.03] text-white/90 border border-white/10' : 'bg-sage/[0.03] text-warm-gray-green border border-sage/10'}`
                                        }
                                    `}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className={`px-5 py-4 rounded-[1.5rem] rounded-tl-none border ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-sage/[0.03] border-sage/5'}`}>
                                        <div className="flex gap-2">
                                            <span className="w-1 h-1 rounded-full bg-current opacity-20 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1 h-1 rounded-full bg-current opacity-20 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1 h-1 rounded-full bg-current opacity-20 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Floats elegantly */}
                        <div className={`p-6 border-t ${isDarkMode ? 'border-white/5' : 'border-sage/5'}`}>
                            <form onSubmit={handleSend} className="relative flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={startDictation}
                                    className={`p-3.5 rounded-2xl transition-all ${isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : isDarkMode ? 'bg-white/5 text-white/40 hover:text-white/60' : 'bg-sage/5 text-sage/40 hover:text-sage/60'
                                        }`}
                                >
                                    <Mic size={18} />
                                </button>

                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Speak your truth..."
                                        className={`w-full bg-transparent px-5 py-3.5 rounded-2xl text-sm font-body outline-none transition-all ${isDarkMode
                                            ? 'text-white placeholder-white/20 border border-white/10 focus:border-pale-gold/40'
                                            : 'text-warm-gray-green placeholder-warm-gray-green/30 border border-sage/10 focus:border-sage'
                                            }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() || isTyping}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${!inputText.trim() || isTyping
                                            ? 'opacity-0 scale-75'
                                            : `opacity-100 scale-100 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`
                                            }`}
                                    >
                                        <Send size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </form>
                            <p className="mt-4 text-[8px] text-center font-black uppercase tracking-[0.25em] opacity-20">
                                Powered by Palante Intelligence
                            </p>
                        </div>
                    </>
                )}
            </div>
        </SlideUpModal>
    );
};

