import React, { useState, useEffect } from 'react';
import { Award, CalendarCheck, ChevronRight, X, Star, Upload, Moon, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getISOWeek } from '../utils/weeklyHighlights';
import { ShareModal } from './ShareModal';
import { generateWeeklyReflectionShareImage } from '../utils/shareUtils';

interface WeeklyHighlightsModalProps {
    isOpen: boolean;
    accomplishments: { text: string; date: string }[];
    reflectionMessage: string;
    userName: string;
    isDarkMode: boolean;
    onClose: () => void;
    weeklyLetter?: string;
    partnerName?: string;
}

// Formats "YYYY-MM-DD" → "Mon Apr 7"
const formatDay = (iso: string): string => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Palante-authored, like every other line in the app. This block previously held twelve
 * quotes from named third parties (Aristotle, Twain, Clear, and others). It survived the
 * July 2026 quote purge because it lived in a component rather than in src/data, which is
 * where the sweep and its tests were pointed. See src/data/affirmations.ts for the rules
 * these follow: original, no em dashes, no emojis, specific over inspirational.
 */
const WEEKLY_QUOTES = [
    { text: "Systems are just promises you made easy to keep.", author: "Palante" },
    { text: "A week is long enough to show you a pattern and short enough to change one.", author: "Palante" },
    { text: "You did not need a perfect week. You needed a week you showed up for.", author: "Palante" },
    { text: "Consistency is not intensity repeated. It is intensity you can survive.", author: "Palante" },
    { text: "Repetition is quiet. That is why it works.", author: "Palante" },
    { text: "The days that felt like nothing are the ones holding this up.", author: "Palante" },
    { text: "Progress hides in the middle of the week, where nobody looks.", author: "Palante" },
    { text: "Starting again is a skill, and you practiced it this week.", author: "Palante" },
    { text: "Nothing here is late. You are seven days further in than you were.", author: "Palante" },
    { text: "Small work done badly still beats big work not done.", author: "Palante" },
    { text: "The week you almost skipped is the one that proves it.", author: "Palante" },
    { text: "Look back once a week so you can stop looking back every day.", author: "Palante" },
];

export const WeeklyHighlightsModal: React.FC<WeeklyHighlightsModalProps> = ({
    isOpen,
    accomplishments,
    reflectionMessage,
    userName,
    isDarkMode,
    onClose,
    weeklyLetter,
    partnerName,
}) => {
    const [visibleIndex, setVisibleIndex] = useState(-1);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedTexts, setEditedTexts] = useState<string[]>([]);
    const [scienceExpanded, setScienceExpanded] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
    const firstName = userName?.split(' ')[0] || 'Friend';

    // Derive the weekly quote by ISO week number
    const isoWeek = getISOWeek(new Date());
    const weekNum = parseInt(isoWeek.split('-W')[1], 10) || 0;
    const weeklyQuote = WEEKLY_QUOTES[weekNum % WEEKLY_QUOTES.length];

    // Initialize edited texts from accomplishments
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the editable copy from freshly computed accomplishments, then the user mutates it independently
        setEditedTexts(accomplishments.map(a => a.text));
    }, [accomplishments]);

    // Stagger-reveal cards after modal mounts
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the stagger-reveal sequence each time the modal opens
        if (!isOpen) { setVisibleIndex(-1); return; }
        let i = 0;
        const interval = setInterval(() => {
            setVisibleIndex(i);
            i++;
            if (i >= accomplishments.length) clearInterval(interval);
        }, 180);
        return () => clearInterval(interval);
    }, [isOpen, accomplishments.length]);

    // Compute date range string for the share card
    const getDateRange = () => {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${fmt(weekAgo)} – ${fmt(now)}`;
    };

    const handleShareReflection = () => setShowShareModal(true);

    const handleGenerateShareImage = async () => {
        setIsGeneratingShareImage(true);
        try {
            const dateRange = getDateRange();
            const seed = `weekly-${isoWeek}`;
            const dataUrl = await generateWeeklyReflectionShareImage(
                reflectionMessage || 'You showed up this week. That\'s what counts.',
                dateRange,
                seed,
            );
            const base64 = dataUrl.split(',')[1];
            const saved = await Filesystem.writeFile({
                path: `palante_reflection_${Date.now()}.jpg`,
                data: base64,
                directory: Directory.Cache,
            });
            await Share.share({
                title: 'My Week, Reflected, Palante',
                files: [saved.uri],
                dialogTitle: 'Share your reflection',
            });
        } catch {
            try {
                await Share.share({
                    title: 'My Week, Reflected, Palante',
                    text: reflectionMessage,
                });
            } catch { /* silence */ }
        } finally {
            setIsGeneratingShareImage(false);
        }
    };

    return (
        <>
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
                    {/* Seed of Life SVG: full-height background */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ opacity: 0.06, zIndex: 0 }}
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid slice"
                    >
                        <defs>
                            <g id="sol">
                                {/* center */}
                                <circle cx="100" cy="100" r="34" fill="none" stroke="white" strokeWidth="1" />
                                {/* 6 surrounding petals */}
                                <circle cx="134" cy="100" r="34" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="117" cy="70.6" r="34" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="83" cy="70.6" r="34" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="66" cy="100" r="34" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="83" cy="129.4" r="34" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="117" cy="129.4" r="34" fill="none" stroke="white" strokeWidth="1" />
                            </g>
                        </defs>
                        <use href="#sol" transform="translate(50, 0)" />
                        <use href="#sol" transform="translate(50, 200)" />
                        <use href="#sol" transform="translate(50, 400)" />
                        <use href="#sol" transform="translate(50, 600)" />
                        <use href="#sol" transform="translate(50, 800)" />
                    </svg>

                    {/* Dismiss X */}
                    <button
                        onClick={onClose}
                        className="absolute top-14 right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full transition-all"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <X size={16} strokeWidth={2.5} className="text-white" />
                    </button>

                    {/* Content scroll area */}
                    <div className="flex-1 overflow-y-auto px-6 pt-16 relative" style={{ WebkitOverflowScrolling: 'touch', zIndex: 1, paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}>

                        {/* Header */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05, duration: 0.5, ease: 'easeOut' }}
                            className="mb-6"
                        >
                            {/* Badge */}
                            <div
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                                style={{
                                    background: 'rgba(226,207,159,0.12)',
                                    border: '1px solid rgba(226,207,159,0.25)',
                                }}
                            >
                                <CalendarCheck size={10} style={{ color: '#E2CF9F' }} />
                                <span
                                    className="text-xs font-bold uppercase tracking-[0.2em]"
                                    style={{ color: '#E2CF9F' }}
                                >
                                    Weekly Wins
                                </span>
                            </div>

                            <h2
                                className="font-display font-bold tracking-tight leading-tight mb-2"
                                style={{ color: '#FFFFFF', fontSize: 32 }}
                            >
                                Look what you accomplished, {firstName}.
                            </h2>
                            <p
                                className="text-sm font-body"
                                style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                                {accomplishments.length} win{accomplishments.length !== 1 ? 's' : ''} this week. Every one matters.
                            </p>
                        </motion.div>

                        {/* Weekly partner letter */}
                        {weeklyLetter && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                                className="mb-6 p-5 rounded-3xl"
                                style={{
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(226,207,159,0.18)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Moon size={11} style={{ color: 'rgba(226,207,159,0.7)' }} />
                                    <span
                                        className="text-xs font-bold uppercase tracking-[0.2em]"
                                        style={{ color: 'rgba(226,207,159,0.7)' }}
                                    >
                                        A note from {partnerName || 'Palante'}
                                    </span>
                                </div>
                                <p
                                    className="text-base font-body leading-relaxed whitespace-pre-line"
                                    style={{ color: 'rgba(255,255,255,0.88)' }}
                                >
                                    {weeklyLetter}
                                </p>
                            </motion.div>
                        )}

                        {/* THE SCIENCE pill */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="mb-5"
                        >
                            <button
                                onClick={() => setScienceExpanded(e => !e)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(226,207,159,0.2)',
                                }}
                            >
                                <FlaskConical size={10} style={{ color: 'rgba(226,207,159,0.9)' }} />
                                <span
                                    className="text-xs font-bold uppercase tracking-[0.18em]"
                                    style={{ color: 'rgba(226,207,159,0.9)' }}
                                >
                                    The Science
                                </span>
                                <ChevronRight
                                    size={10}
                                    style={{
                                        color: 'rgba(226,207,159,0.7)',
                                        transform: scienceExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                    }}
                                />
                            </button>

                            <AnimatePresence>
                                {scienceExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div
                                            className="mt-3 p-4 rounded-[18px]"
                                            style={{
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                            }}
                                        >
                                            <p
                                                className="font-display font-bold mb-3"
                                                style={{ color: '#E2CF9F', fontSize: 12 }}
                                            >
                                                Why this works
                                            </p>
                                            <ul className="space-y-2.5">
                                                {[
                                                    { title: 'The Progress Principle', src: 'Amabile, Harvard', body: 'Small wins are among the strongest drivers of intrinsic motivation and daily mood researchers have found, often outweighing praise or incentives.' },
                                                    { title: 'Self-Determination Theory', src: 'Deci & Ryan', body: 'Recognizing your own competence tends to build motivation that lasts longer than external rewards, which fade faster.' },
                                                    { title: 'Positive recall loops', src: '', body: 'Deliberately revisiting wins is linked to a stronger sense of self-efficacy, which can make the next win easier to reach for.' },
                                                ].map((item, idx) => (
                                                    <li key={idx} className="flex gap-2.5">
                                                        <span
                                                            className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                                                            style={{ background: '#E2CF9F' }}
                                                        />
                                                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, lineHeight: 1.55 }}>
                                                            <span style={{ color: '#E2CF9F', fontWeight: 700 }}>{item.title}</span>
                                                            {item.src ? ` (${item.src})` : ''}: {item.body}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Your Week, Reflected card */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="mb-6 rounded-[20px] overflow-hidden"
                            style={{
                                background: 'rgba(0,0,0,0.18)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <div className="p-5 relative">
                                {/* Decorative quote mark */}
                                <span
                                    className="absolute top-2 left-4 select-none pointer-events-none font-serif"
                                    style={{ fontSize: 72, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}
                                >
                                    &ldquo;
                                </span>

                                {/* Label row */}
                                <div className="flex items-center gap-2 mb-3">
                                    <Moon size={10} style={{ color: '#E2CF9F' }} />
                                    <span
                                        className="uppercase font-bold tracking-[0.18em]"
                                        style={{ color: '#E2CF9F', fontSize: 9 }}
                                    >
                                        Your Week, Reflected
                                    </span>
                                </div>

                                {/* Reflection text */}
                                <p
                                    className="relative font-body leading-relaxed"
                                    style={{ fontStyle: '', fontSize: 13.5, color: 'rgba(255,255,255,0.88)', zIndex: 1 }}
                                >
                                    {reflectionMessage || 'You showed up this week. That\'s what counts.'}
                                </p>

                                {/* Share button */}
                                <button
                                    onClick={handleShareReflection}
                                    className="mt-4 flex items-center gap-2 active:opacity-70 transition-opacity"
                                >
                                    <Upload size={11} style={{ color: '#E2CF9F' }} />
                                    <span
                                        className="font-body"
                                        style={{ color: '#E2CF9F', fontSize: 11.5 }}
                                    >
                                        Share your reflection
                                    </span>
                                </button>
                            </div>
                        </motion.div>

                        {/* This Week's Wins section label */}
                        <p
                            className="mb-3 uppercase font-bold tracking-[0.2em]"
                            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                        >
                            This Week's Wins
                        </p>

                        {/* Win Cards */}
                        <div className="space-y-3 mb-8">
                            {accomplishments.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={visibleIndex >= i ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                >
                                    <div
                                        className="relative rounded-[20px] p-5 overflow-hidden"
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                    >
                                        {/* Left accent bar */}
                                        <div
                                            className="absolute left-0 rounded-r-full"
                                            style={{
                                                top: 14,
                                                bottom: 14,
                                                width: 3,
                                                background: 'rgba(255,255,255,0.08)',
                                            }}
                                        />

                                        {/* Meta row */}
                                        <div className="flex items-center justify-between mb-2 ml-2">
                                            <div className="flex items-center gap-2">
                                                <Award size={11} style={{ color: 'rgba(255,255,255,0.85)' }} />
                                                <span
                                                    className="uppercase font-bold tracking-[0.18em]"
                                                    style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9.5 }}
                                                >
                                                    {formatDay(item.date)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                                                className="px-2 py-0.5 rounded-full border transition-all active:scale-95"
                                                style={{
                                                    borderColor: 'rgba(255,255,255,0.06)',
                                                    color: 'rgba(255,255,255,0.85)',
                                                    fontSize: 9,
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </div>

                                        {/* Win text or edit textarea */}
                                        {editingIndex === i ? (
                                            <textarea
                                                autoFocus
                                                value={editedTexts[i] ?? item.text}
                                                onChange={e => {
                                                    const next = [...editedTexts];
                                                    next[i] = e.target.value;
                                                    setEditedTexts(next);
                                                }}
                                                onBlur={() => setEditingIndex(null)}
                                                className="w-full ml-2 bg-transparent resize-none outline-none font-display font-medium leading-snug"
                                                style={{
                                                    color: 'rgba(255,255,255,0.93)',
                                                    fontSize: 14,
                                                    minHeight: 64,
                                                }}
                                                rows={3}
                                            />
                                        ) : (
                                            <p
                                                className="ml-2 font-display font-medium leading-snug"
                                                style={{ color: 'rgba(255,255,255,0.93)', fontSize: 14 }}
                                            >
                                                {editedTexts[i] ?? item.text}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Rotating closing quote */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: accomplishments.length * 0.18 + 0.3, duration: 0.5 }}
                            className="text-center mb-8 px-4"
                        >
                            <p
                                className="font-body leading-relaxed mb-1"
                                style={{ color: 'rgba(255,255,255,1)', fontSize: 12.5 }}
                            >
                                &ldquo;{weeklyQuote.text}&rdquo;
                            </p>
                            <p
                                className="font-body"
                                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                            >
                                {weeklyQuote.author}
                            </p>
                        </motion.div>

                        {/* Keep going CTA */}
                        <motion.button
                            onClick={onClose}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: accomplishments.length * 0.18 + 0.45, duration: 0.4 }}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-[18px] transition-all active:scale-[0.98]"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        >
                            <Star size={15} className="text-white" />
                            <span className="font-display font-bold text-white" style={{ fontSize: 15 }}>
                                Keep going, {firstName} &rarr;
                            </span>
                        </motion.button>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Share Modal: same component used by the quote card */}
        <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            weeklyReflection={{
                text: reflectionMessage || 'You showed up this week. That\'s the whole game.',
                dateRange: getDateRange(),
                seed: `weekly-${isoWeek}`,
            }}
            isDarkMode={isDarkMode}
            onGenerateImage={handleGenerateShareImage}
            onDownloadImage={handleGenerateShareImage}
            isGeneratingImage={isGeneratingShareImage}
        />
        </>
    );
};

export type { WeeklyHighlightsTrigger } from '../utils/weeklyHighlights';
export { computeWeeklyHighlights } from '../utils/weeklyHighlights';
