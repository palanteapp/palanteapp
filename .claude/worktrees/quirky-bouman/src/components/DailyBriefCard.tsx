import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { generatePersonalizedDailyBrief } from '../utils/aiService';
import { buildDailyBriefContext } from '../utils/coachMemory';
import { cacheDailyBrief, getCachedDailyBrief } from '../utils/offline';
import type { UserProfile } from '../types';

const BRIEF_DISMISSED_KEY = 'palante_daily_brief_dismissed'; // stores ISO date

interface DailyBriefCardProps {
    user: UserProfile;
    isDarkMode: boolean;
    /** Called when the user taps "Talk to coach" */
    onOpenCoach?: () => void;
}

export const DailyBriefCard: React.FC<DailyBriefCardProps> = ({ user, isDarkMode, onOpenCoach }) => {
    const [brief, setBrief] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const isMorning = new Date().getHours() < 13; // Show until 1 pm

    const shouldShow = useCallback((): boolean => {
        if (!isMorning) return false;
        const dismissed = localStorage.getItem(BRIEF_DISMISSED_KEY);
        return dismissed !== todayStr;
    }, [isMorning, todayStr]);

    useEffect(() => {
        if (!shouldShow()) {
            setLoading(false);
            return;
        }

        const ctx = buildDailyBriefContext(user);
        if (!ctx) {
            setLoading(false);
            return;
        }

        // Check cache first
        const cached = getCachedDailyBrief();
        if (cached) {
            setBrief(cached);
            setLoading(false);
            setVisible(true);
            return;
        }

        // Generate fresh
        generatePersonalizedDailyBrief(user.name, user.coachName, ctx)
            .then(text => {
                setBrief(text);
                cacheDailyBrief(text);
                setVisible(true);
            })
            .catch(() => {
                // Silently fail — don't show empty card
            })
            .finally(() => setLoading(false));
    }, [user, shouldShow]);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem(BRIEF_DISMISSED_KEY, todayStr);
    };

    if (loading || !visible || !brief) return null;

    const coachLabel = user.coachName ? `Coach ${user.coachName}` : 'Your Coach';

    return (
        <AnimatePresence>
            <motion.div
                key="daily-brief"
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`relative mx-4 mb-3 rounded-[1.75rem] overflow-hidden border ${
                    isDarkMode
                        ? 'bg-[#2A3A2E] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                        : 'bg-gradient-to-br from-[#FDF6EE] to-[#F5EBD8] border-[#C96A3A]/15 shadow-[0_6px_24px_rgba(201,106,58,0.12)]'
                }`}
            >
                {/* Ambient glow */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                        background: isDarkMode
                            ? 'radial-gradient(ellipse at 20% 50%, rgba(197,217,203,0.15) 0%, transparent 70%)'
                            : 'radial-gradient(ellipse at 20% 50%, rgba(201,106,58,0.08) 0%, transparent 70%)',
                    }}
                />

                <div className="relative z-10 p-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                isDarkMode ? 'bg-[#C5D9CB]/15' : 'bg-[#C96A3A]/10'
                            }`}>
                                <Sparkles
                                    size={14}
                                    className={isDarkMode ? 'text-[#C5D9CB]' : 'text-[#C96A3A]'}
                                />
                            </div>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
                                    isDarkMode ? 'text-white/40' : 'text-[#C96A3A]/60'
                                }`}>
                                    Daily Brief
                                </p>
                                <p className={`text-[11px] font-medium ${
                                    isDarkMode ? 'text-white/50' : 'text-sage-dark/50'
                                }`}>
                                    {coachLabel}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={dismiss}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                isDarkMode
                                    ? 'bg-white/5 hover:bg-white/10 text-white/30'
                                    : 'bg-black/5 hover:bg-black/10 text-black/30'
                            }`}
                            aria-label="Dismiss daily brief"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Brief text */}
                    <p className={`text-[15px] leading-[1.65] font-body ${
                        isDarkMode ? 'text-white/85' : 'text-[#3A2A1A]'
                    }`}>
                        {brief}
                    </p>

                    {/* CTA */}
                    {onOpenCoach && (
                        <button
                            onClick={() => { dismiss(); onOpenCoach(); }}
                            className={`mt-4 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide transition-opacity hover:opacity-70 ${
                                isDarkMode ? 'text-[#C5D9CB]' : 'text-[#C96A3A]'
                            }`}
                        >
                            Talk to {coachLabel}
                            <ChevronRight size={13} />
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
