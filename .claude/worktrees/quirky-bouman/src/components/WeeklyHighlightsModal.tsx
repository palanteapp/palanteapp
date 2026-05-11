import React, { useState, useEffect } from 'react';
import { Award, ChevronRight, X, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DailyEveningPractice } from '../types';

interface WeeklyHighlightsModalProps {
    isOpen: boolean;
    accomplishments: { text: string; date: string }[];
    userName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

// Formats "YYYY-MM-DD" → "Mon Apr 7"
const formatDay = (iso: string): string => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const WeeklyHighlightsModal: React.FC<WeeklyHighlightsModalProps> = ({
    isOpen,
    accomplishments,
    userName,
    isDarkMode,
    onClose,
}) => {
    const [visibleIndex, setVisibleIndex] = useState(-1);
    const firstName = userName?.split(' ')[0] || 'Friend';

    // Stagger-reveal cards after modal mounts
    useEffect(() => {
        if (!isOpen) { setVisibleIndex(-1); return; }
        let i = 0;
        const interval = setInterval(() => {
            setVisibleIndex(i);
            i++;
            if (i >= accomplishments.length) clearInterval(interval);
        }, 180);
        return () => clearInterval(interval);
    }, [isOpen, accomplishments.length]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="weekly-highlights"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[300] flex flex-col overflow-hidden"
                    style={{
                        background: 'linear-gradient(160deg, #C96A3A 0%, #B05530 45%, #8C3E1E 100%)',
                    }}
                >
                    {/* Background ambient orbs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-20"
                            style={{ background: isDarkMode ? '#E2CF9F' : '#4A5D4E' }}
                        />
                        <div
                            className="absolute bottom-0 -left-24 w-72 h-72 rounded-full blur-[80px] opacity-10"
                            style={{ background: isDarkMode ? '#C96A3A' : '#C96A3A' }}
                        />
                    </div>

                    {/* Dismiss X */}
                    <button
                        onClick={onClose}
                        className="absolute top-14 right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full transition-all"
                        style={{ background: 'rgba(255,255,255,0.12)' }}
                    >
                        <X size={16} strokeWidth={2.5} className="text-white/60" />
                    </button>

                    {/* Content scroll area */}
                    <div className="flex-1 overflow-y-auto px-6 pt-16 pb-10" style={{ WebkitOverflowScrolling: 'touch' }}>

                        {/* Header */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05, duration: 0.5, ease: 'easeOut' }}
                            className="mb-8"
                        >
                            {/* Badge */}
                            <div
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                                style={{
                                    background: isDarkMode ? 'rgba(226,207,159,0.12)' : 'rgba(74,93,78,0.08)',
                                    border: `1px solid ${isDarkMode ? 'rgba(226,207,159,0.2)' : 'rgba(74,93,78,0.12)'}`,
                                }}
                            >
                                <Star size={11} className={isDarkMode ? 'text-[#E2CF9F]' : 'text-[#4A5D4E]'} />
                                <span
                                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                                    style={{ color: isDarkMode ? '#E2CF9F' : '#4A5D4E' }}
                                >
                                    Weekly Wins
                                </span>
                            </div>

                            <h2
                                className="text-4xl font-display font-bold tracking-tight leading-tight mb-2"
                                style={{ color: isDarkMode ? '#FFFFFF' : '#1a2b1c' }}
                            >
                                Look what you built,<br />{firstName}.
                            </h2>
                            <p
                                className="text-sm font-body"
                                style={{ color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(30,50,30,0.45)' }}
                            >
                                {accomplishments.length} accomplishment{accomplishments.length !== 1 ? 's' : ''} this week — every single one counts.
                            </p>
                        </motion.div>

                        {/* Win Cards */}
                        <div className="space-y-3 mb-10">
                            {accomplishments.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={visibleIndex >= i ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                >
                                    <div
                                        className="relative rounded-[22px] p-5 overflow-hidden"
                                        style={{
                                            background: 'rgba(255,255,255,0.12)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                                        }}
                                    >
                                        {/* Gold left accent */}
                                        <div
                                            className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                                            style={{ background: 'rgba(255,255,255,0.5)' }}
                                        />

                                        {/* Icon */}
                                        <div
                                            className="flex items-center gap-2 mb-2 ml-2"
                                        >
                                            <Award
                                                size={13}
                                                style={{ color: 'rgba(255,255,255,0.8)' }}
                                            />
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                                                style={{ color: 'rgba(255,255,255,0.55)' }}
                                            >
                                                {formatDay(item.date)}
                                            </span>
                                        </div>

                                        <p
                                            className="text-[15px] font-display font-medium leading-snug ml-2"
                                            style={{ color: 'rgba(255,255,255,0.95)' }}
                                        >
                                            {item.text}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Closing message */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: accomplishments.length * 0.18 + 0.3, duration: 0.5 }}
                            className="text-center mb-8"
                        >
                            <p
                                className="text-sm font-body italic"
                                style={{ color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(30,50,30,0.4)' }}
                            >
                                "Progress is built one win at a time."
                            </p>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            onClick={onClose}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: accomplishments.length * 0.18 + 0.45, duration: 0.4 }}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-[18px] transition-all active:scale-[0.98]"
                            style={{
                                background: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 6px 28px rgba(0,0,0,0.15)',
                            }}
                        >
                            <Sparkles size={16} className="text-white" />
                            <span className="font-display font-bold text-[15px] text-white tracking-tight">
                                Palante — Keep Building
                            </span>
                            <ChevronRight size={16} className="text-white/70" />
                        </motion.button>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ── Utility: compute whether to show the modal ─────────────────────────────────

/** Returns ISO week string like "2026-W15" */
const getISOWeek = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

/** Returns the ISO date string for 7 days ago */
const sevenDaysAgo = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
};

export interface WeeklyHighlightsTrigger {
    shouldShow: boolean;
    accomplishments: { text: string; date: string }[];
    markShown: () => void;
}

/**
 * Call this on app load (Monday mornings) to determine if the
 * weekly highlights popup should fire.
 */
export const computeWeeklyHighlights = (
    practices: DailyEveningPractice[],
    shownKey: string
): WeeklyHighlightsTrigger => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const thisWeek = getISOWeek(today);
    const alreadyShown = localStorage.getItem(shownKey) === thisWeek;
    const cutoff = sevenDaysAgo();

    // Gather accomplishments from last 7 days
    const accomplishments = (practices || [])
        .filter(p => p.date >= cutoff && p.accomplishment?.trim())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(p => ({ text: p.accomplishment.trim(), date: p.date }));

    const shouldShow = isMonday && !alreadyShown && accomplishments.length >= 2;

    return {
        shouldShow,
        accomplishments,
        markShown: () => localStorage.setItem(shownKey, thisWeek),
    };
};
