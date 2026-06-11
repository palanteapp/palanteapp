import { useState, useEffect, useRef } from 'react';
import { X, Send, Lock, Sparkles } from 'lucide-react';
import { chatWithCoach } from '../utils/aiService';
import { loadConversationMemories, extractAndSaveMemories } from '../utils/memoryService';
import { getHealthAuthStatus, requestHealthPermissions, getHealthContext } from '../utils/healthService';
import type { HealthContext } from '../utils/healthService';
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
    const [persistedMemories, setPersistedMemories] = useState<string[]>([]);
    const [healthContext, setHealthContext] = useState<HealthContext | null>(null);
    const [showHealthOffer, setShowHealthOffer] = useState(false);
    const [healthConnecting, setHealthConnecting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Visual Viewport Handling for Mobile Keyboard
    useEffect(() => {
        const handleVisualViewportResize = () => {
            if (window.visualViewport) {
                const vv = window.visualViewport;
                const diff = (window.innerHeight - vv.height);
                setKeyboardHeight(diff > 50 ? diff : 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewportResize);
            window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
            handleVisualViewportResize();

            return () => {
                window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
                window.visualViewport?.removeEventListener('scroll', handleVisualViewportResize);
            };
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            extractAndSaveMemories(messages, user.id, user.name || 'Friend').catch(() => {});
            return;
        }

        loadConversationMemories(user.id).then(setPersistedMemories).catch(() => {});

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

        // Check health auth and either load context or surface the offer
        getHealthAuthStatus().then(async ({ status }) => {
            if (status === 'authorized') {
                const ctx = await getHealthContext();
                setHealthContext(Object.keys(ctx).length > 0 ? ctx : null);
            } else if (status === 'notDetermined') {
                // Surface the offer after a brief delay so the greeting settles first
                setTimeout(() => setShowHealthOffer(true), 1800);
            }
        });
    }, [isOpen, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, showHealthOffer]);

    const handleConnectHealth = async () => {
        setHealthConnecting(true);
        const { status } = await requestHealthPermissions();
        setShowHealthOffer(false);
        setHealthConnecting(false);
        if (status === 'authorized') {
            const ctx = await getHealthContext();
            setHealthContext(Object.keys(ctx).length > 0 ? ctx : null);
        }
    };

    const MESSAGE_LIMIT = 50;
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    const isAtLimit = userMessageCount >= MESSAGE_LIMIT;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isTyping || isAtLimit) return;

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
            profession: user.profession,
            persistedMemories,
            healthContext: healthContext ?? undefined,
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
            fullScreen={true}
        >
            <div
                className={`w-full h-full flex flex-col font-sans transition-all duration-300 ${isDarkMode ? 'bg-sage-mid' : 'bg-white'}`}
                style={{
                    paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 'env(safe-area-inset-bottom)',
                    height: '100%'
                }}
            >
                {!canUseAI(user) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <div className={`p-8 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-sage/10'}`}>
                            <Lock size={40} className={isDarkMode ? 'text-white' : 'text-sage/40'} />
                        </div>
                        <div className="space-y-2">
                            <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                AI Partner Unavailable
                            </h3>
                            <p className={`text-xs leading-relaxed opacity-40 px-4 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                The AI Partner feature is available for users 13 years and older. You can still enjoy all other aspects of Palante.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5' : 'border-sage/5'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-pale-gold/10' : 'bg-sage/5'}`}>
                                    <Sparkles size={16} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className={`text-base font-display font-medium leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-rich-black'}`}>
                                        {user.coachName || 'Palante'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 opacity-40">
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`} />
                                        <span className="text-xs font-black uppercase tracking-[0.2em]">Minimal Ethereal Presence</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onToggle}
                                className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-white hover:text-white hover:bg-white/10' : 'text-sage-dark/30 hover:text-sage-dark hover:bg-sage/5'}`}
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
                                        max-w-[88%] px-5 py-4 text-base leading-relaxed font-body tracking-wide
                                        ${msg.role === 'user'
                                            ? `rounded-[1.5rem] rounded-tr-none shadow-sm ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`
                                            : `rounded-[1.5rem] rounded-tl-none ${isDarkMode ? 'bg-white/[0.03] text-white/90 border border-white/10' : 'bg-sage/[0.03] text-sage-dark border border-sage/10'}`
                                        }
                                    `}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {/* Health connect offer — surfaced naturally after greeting */}
                            {showHealthOffer && (
                                <div className="flex justify-start">
                                    <div className={`max-w-[88%] px-5 py-4 rounded-[1.5rem] rounded-tl-none space-y-4 ${isDarkMode ? 'bg-white/[0.03] text-white/90 border border-white/10' : 'bg-sage/[0.03] text-sage-dark border border-sage/10'}`}>
                                        <p className="text-base leading-relaxed font-body tracking-wide">
                                            One thing that helps me support you better is knowing how you're resting. Would you like to connect your Apple Health so I can see your sleep and energy patterns?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleConnectHealth}
                                                disabled={healthConnecting}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold hover:bg-pale-gold/30' : 'bg-sage/10 text-sage-dark hover:bg-sage/20'} disabled:opacity-50`}
                                            >
                                                {healthConnecting ? 'Connecting...' : 'Connect Health'}
                                            </button>
                                            <button
                                                onClick={() => setShowHealthOffer(false)}
                                                className="px-4 py-2 rounded-xl text-sm opacity-40 hover:opacity-60 transition-opacity"
                                            >
                                                Maybe later
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

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

                        {/* Input Area */}
                        <div className={`p-6 border-t ${isDarkMode ? 'border-white/5' : 'border-sage/5'}`}>
                            <form onSubmit={handleSend} className="relative flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Speak your truth..."
                                        className={`w-full bg-transparent px-5 py-3.5 rounded-2xl text-sm font-body outline-none transition-all ${isDarkMode
                                            ? 'text-white placeholder-white/20 border border-white/10 focus:border-pale-gold/40'
                                            : 'text-sage-dark placeholder-sage-dark/30 border border-sage/10 focus:border-sage'
                                            }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() || isTyping || isAtLimit}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${!inputText.trim() || isTyping || isAtLimit
                                            ? 'opacity-0 scale-75'
                                            : `opacity-100 scale-100 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`
                                            }`}
                                    >
                                        <Send size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </form>
                            {isAtLimit && (
                                <p className="mt-2 text-xs text-center opacity-50 text-pale-gold-500">
                                    Session limit reached. Restart the app to continue.
                                </p>
                            )}
                            {!isAtLimit && userMessageCount >= MESSAGE_LIMIT - 5 && (
                                <p className="mt-2 text-xs text-center opacity-40">
                                    {MESSAGE_LIMIT - userMessageCount} messages remaining this session
                                </p>
                            )}
                            <p className="mt-4 text-xs text-center font-black uppercase tracking-[0.25em] opacity-20">
                                Powered by Palante Intelligence
                            </p>
                        </div>
                    </>
                )}
            </div>
        </SlideUpModal>
    );
};
