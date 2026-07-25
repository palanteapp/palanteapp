import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart, TrendingUp, BookOpen, Star } from 'lucide-react';
import type { UserProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
}

const TONE_LABELS: Record<string, string> = {
    nurturing: 'Warm & patient',
    direct: 'Straight & clear',
    accountability: 'High-standard & honest',
};

export const PartnerMemoryPanel: React.FC<Props> = ({ isOpen, onClose, user }) => {
    const { isDarkMode } = useTheme();

    const vp = user.userVoiceProfile;
    const mp = user.monthlyPattern;
    const narrative = user.userNarrative;

    const hasValues = vp && vp.extractedValues.length > 0;
    const hasThemes = vp && vp.coreThemes.length > 0;
    const hasNarrative = narrative?.text;
    const hasMonthly = mp && !mp.dismissed && mp.insight;
    const streak = user.streak ?? 0;
    const totalDays = user.practiceData?.totalPractices ?? 0;

    const hasAnyMemory = hasValues || hasThemes || hasNarrative || hasMonthly || streak > 0;

    const partnerName = user.coachName || 'Your partner';

    const bg = isDarkMode
        ? 'rgba(18,32,16,0.97)'
        : 'rgba(248,244,236,0.97)';
    const textPrimary = isDarkMode ? 'text-[#E5D6A7]' : 'text-sage-dark';
    const textMuted = isDarkMode ? 'text-[#E5D6A7]/50' : 'text-sage/50';
    const cardBg = isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-sage/10';
    const pillBg = isDarkMode ? 'bg-[#E5D6A7]/10 text-[#E5D6A7]' : 'bg-sage/10 text-sage-dark';
    const accentBg = isDarkMode ? 'bg-[#C96A3A]/15 text-[#D4943A]' : 'bg-terracotta/10 text-[#B05530]';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[300] flex flex-col"
                    style={{ background: bg, backdropFilter: 'blur(20px)' }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-16 pb-5">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className={isDarkMode ? 'text-[#E5D6A7]/60' : 'text-sage/50'} />
                                <span className={`text-xs font-black uppercase tracking-[0.22em] ${textMuted}`}>
                                    Memory
                                </span>
                            </div>
                            <h2 className={`text-3xl font-display font-medium ${textPrimary}`}>
                                What {partnerName} knows
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/8 text-[#E5D6A7] hover:bg-white/14' : 'bg-sage/8 text-sage-dark hover:bg-sage/14'}`}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-6 space-y-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 3rem)' }}>

                        {!hasAnyMemory && (
                            <div className={`rounded-3xl border p-6 text-center ${cardBg}`}>
                                <p className={`text-sm leading-relaxed ${textMuted}`}>
                                    {partnerName} is still getting to know you. Keep talking — after a few sessions this will come alive.
                                </p>
                            </div>
                        )}

                        {/* Streak / presence */}
                        {(streak > 0 || totalDays > 0) && (
                            <div className={`rounded-3xl border p-5 ${cardBg}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp size={14} className={isDarkMode ? 'text-[#D4943A]' : 'text-[#B05530]'} />
                                    <span className={`text-xs font-black uppercase tracking-[0.18em] ${textMuted}`}>Your presence</span>
                                </div>
                                <div className="flex gap-4">
                                    {streak > 0 && (
                                        <div>
                                            <p className={`text-3xl font-display font-bold ${textPrimary}`}>{streak}</p>
                                            <p className={`text-xs ${textMuted}`}>day streak</p>
                                        </div>
                                    )}
                                    {totalDays > 0 && (
                                        <div>
                                            <p className={`text-3xl font-display font-bold ${textPrimary}`}>{totalDays}</p>
                                            <p className={`text-xs ${textMuted}`}>total practices</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Monthly insight */}
                        {hasMonthly && (
                            <div className={`rounded-3xl border p-5 ${cardBg}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Star size={14} className={isDarkMode ? 'text-[#D4943A]' : 'text-[#B05530]'} />
                                    <span className={`text-xs font-black uppercase tracking-[0.18em] ${textMuted}`}>This month</span>
                                </div>
                                <p className={`text-base leading-relaxed font-medium ${textPrimary}`}>{mp!.insight}</p>
                                {mp!.dataPoint && (
                                    <p className={`text-sm mt-1 ${textMuted}`}>{mp!.dataPoint}</p>
                                )}
                            </div>
                        )}

                        {/* Values & themes */}
                        {(hasValues || hasThemes) && (
                            <div className={`rounded-3xl border p-5 ${cardBg}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Heart size={14} className={isDarkMode ? 'text-[#D4943A]' : 'text-[#B05530]'} />
                                    <span className={`text-xs font-black uppercase tracking-[0.18em] ${textMuted}`}>What matters to you</span>
                                </div>
                                {hasValues && (
                                    <div className="mb-3">
                                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Core values</p>
                                        <div className="flex flex-wrap gap-2">
                                            {vp!.extractedValues.map(v => (
                                                <span key={v} className={`px-3 py-1 rounded-full text-xs font-semibold ${accentBg}`}>{v}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {hasThemes && (
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Recurring themes</p>
                                        <div className="flex flex-wrap gap-2">
                                            {vp!.coreThemes.map(t => (
                                                <span key={t} className={`px-3 py-1 rounded-full text-xs font-semibold ${pillBg}`}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {vp?.voiceTone && (
                                    <div className="mt-4 pt-4" style={{ borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(74,93,78,0.08)' }}>
                                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${textMuted}`}>How you like to be spoken to</p>
                                        <p className={`text-sm font-medium ${textPrimary}`}>{TONE_LABELS[vp.voiceTone] ?? vp.voiceTone}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Narrative */}
                        {hasNarrative && (
                            <div className={`rounded-3xl border p-5 ${cardBg}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen size={14} className={isDarkMode ? 'text-[#D4943A]' : 'text-[#B05530]'} />
                                    <span className={`text-xs font-black uppercase tracking-[0.18em] ${textMuted}`}>Your story so far</span>
                                </div>
                                <p className={`text-sm leading-relaxed ${textPrimary} opacity-80`}>{narrative!.text}</p>
                            </div>
                        )}

                        {/* Footer note */}
                        {hasAnyMemory && (
                            <p className={`text-xs text-center leading-relaxed px-4 ${textMuted}`}>
                                This grows with every session. The longer you stay, the more {partnerName} understands you.
                            </p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
