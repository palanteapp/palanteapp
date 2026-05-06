import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import {
  STREAK_MILESTONES,
  POINTS_MILESTONES,
  getNextStreakMilestone,
  getNextPointsMilestone,
} from '../data/gardenMilestones';

interface GardenLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  points: number;
  isDarkMode: boolean;
}

// Small plant preview dots for each milestone
const MILESTONE_COLORS: Record<string, string> = {
  sprout:           '#65A30D',
  fern:             '#4D7C0F',
  wildflower:       '#D4A3C5',
  lotus:            '#C96A3A',
  butterfly:        '#A3B5D4',
  koi:              '#60A5FA',
  bird_of_paradise: '#F97316',
  cherry_blossom:   '#F9A8D4',
  fireflies:        '#E5D6A7',
  terracotta_blooms:'#C96A3A',
  stone_path:       '#9CA3AF',
  golden_hour:      '#FCD34D',
  named_koi:        '#60A5FA',
  sacred_rings:     '#E5D6A7',
};

export const GardenLegendModal: React.FC<GardenLegendModalProps> = ({
  isOpen, onClose, streak, points, isDarkMode,
}) => {
  const nextStreak = getNextStreakMilestone(streak);
  const nextPoints = getNextPointsMilestone(points);

  const cardBg   = isDarkMode ? 'bg-[#1C1410]' : 'bg-[#FAF7F3]';
  const shellBg  = isDarkMode ? 'bg-[#3A3D2E]' : 'bg-[#F0EBE3]';
  const border   = isDarkMode ? 'border-white/10' : 'border-[rgba(212,184,130,0.35)]';
  const text     = isDarkMode ? 'text-white'     : 'text-[#2D2016]';
  const textMid  = isDarkMode ? 'text-white/55'  : 'text-[#6B4C3B]/70';
  const textDim  = isDarkMode ? 'text-white/30'  : 'text-[#6B4C3B]/40';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className={`fixed inset-x-0 bottom-0 z-[85] rounded-t-[2rem] overflow-hidden ${shellBg} border-t ${border}`}
            style={{ maxHeight: '90vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-[#C96A3A]/25'}`} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-2 pb-4">
              <div>
                <h2 className={`text-2xl font-display font-bold tracking-tight ${text}`}>
                  Mandala Guide
                </h2>
                <p className={`text-sm mt-0.5 ${textMid}`}>
                  What you can grow. What you've earned.
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all mt-1 ${isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-black/8 text-[#6B4C3B] hover:bg-black/14'}`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto pb-12" style={{ maxHeight: 'calc(90vh - 100px)' }}>

              {/* Current status bar */}
              <div className={`mx-6 mb-6 p-4 rounded-2xl flex items-center gap-6 border ${border} ${cardBg}`}>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Flame size={16} className="text-orange-400" />
                    <span className={`text-2xl font-display font-bold tabular-nums ${text}`}>{streak}</span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${textDim}`}>Day Streak</span>
                </div>
                <div className={`w-px h-10 ${isDarkMode ? 'bg-white/10' : 'bg-[#C96A3A]/15'}`} />
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={16} className="text-pale-gold" />
                    <span className={`text-2xl font-display font-bold tabular-nums ${text}`}>{points.toLocaleString()}</span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${textDim}`}>Total Points</span>
                </div>
                <div className={`w-px h-10 ${isDarkMode ? 'bg-white/10' : 'bg-[#C96A3A]/15'}`} />
                <div className="flex-1">
                  {nextStreak && (
                    <div className="mb-1">
                      <div className="flex justify-between mb-1">
                        <span className={`text-[9px] uppercase tracking-widest font-bold ${textDim}`}>Next: {nextStreak.label}</span>
                        <span className={`text-[9px] font-bold ${textDim}`}>{nextStreak.threshold - streak}d left</span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-[#C96A3A]/12'}`}>
                        <motion.div
                          className="h-full rounded-full bg-[#C96A3A]"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((streak / nextStreak.threshold) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
                  {nextPoints && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className={`text-[9px] uppercase tracking-widest font-bold ${textDim}`}>{nextPoints.label}</span>
                        <span className={`text-[9px] font-bold ${textDim}`}>{(nextPoints.threshold - points).toLocaleString()} pts</span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-[#E5D6A7]/30'}`}>
                        <motion.div
                          className="h-full rounded-full bg-pale-gold"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((points / nextPoints.threshold) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Streak Milestones ────────────────── */}
              <div className="px-6 mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={14} className="text-orange-400" />
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${textMid}`}>
                    Streak Milestones — Living Things
                  </h3>
                </div>
                <div className="space-y-2">
                  {STREAK_MILESTONES.map((m, i) => {
                    const unlocked = streak >= m.threshold;
                    const isNext = nextStreak?.id === m.id;
                    return (
                      <motion.div
                        key={m.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          unlocked
                            ? `${cardBg} ${border}`
                            : isNext
                              ? (isDarkMode ? 'bg-[#C96A3A]/10 border-[#C96A3A]/30' : 'bg-[#C96A3A]/6 border-[#C96A3A]/25')
                              : (isDarkMode ? 'bg-white/3 border-white/6' : 'bg-black/3 border-black/5')
                        }`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        {/* Color dot */}
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: unlocked
                              ? MILESTONE_COLORS[m.id] + '33'
                              : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              background: unlocked ? MILESTONE_COLORS[m.id] : 'transparent',
                              border: unlocked ? 'none' : '1.5px dashed ' + (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                            }}
                          />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-bold ${unlocked ? text : textMid} ${!unlocked && 'opacity-50'}`}>
                              {m.label}
                            </p>
                            {isNext && !unlocked && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#C96A3A] bg-[#C96A3A]/12 px-2 py-0.5 rounded-full">
                                Next
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-relaxed ${unlocked ? textMid : textDim} ${!unlocked && 'opacity-60'}`}>
                            {unlocked ? m.detail : m.description}
                          </p>
                        </div>

                        {/* Status icon */}
                        <div className="flex-shrink-0">
                          {unlocked
                            ? <CheckCircle2 size={18} className="text-[#C96A3A]" />
                            : <Lock size={14} className={textDim + ' opacity-50'} />
                          }
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ── Points Milestones ────────────────── */}
              <div className="px-6 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-pale-gold" />
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${textMid}`}>
                    Points Milestones — Atmosphere &amp; Color
                  </h3>
                </div>
                <p className={`text-xs mb-4 leading-relaxed ${textDim}`}>
                  Points never expire and are never spent — they're a permanent record of everything you've put in. Morning practice: +5. Journal: +10. Goals: +2 each.
                </p>
                <div className="space-y-2">
                  {POINTS_MILESTONES.map((m, i) => {
                    const unlocked = points >= m.threshold;
                    const isNext = nextPoints?.id === m.id;
                    return (
                      <motion.div
                        key={m.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          unlocked
                            ? `${cardBg} ${border}`
                            : isNext
                              ? (isDarkMode ? 'bg-pale-gold/8 border-pale-gold/20' : 'bg-[#E5D6A7]/15 border-[#E5D6A7]/40')
                              : (isDarkMode ? 'bg-white/3 border-white/6' : 'bg-black/3 border-black/5')
                        }`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 + 0.2 }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: unlocked
                              ? MILESTONE_COLORS[m.id] + '33'
                              : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              background: unlocked ? MILESTONE_COLORS[m.id] : 'transparent',
                              border: unlocked ? 'none' : '1.5px dashed ' + (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-bold ${unlocked ? text : textMid} ${!unlocked && 'opacity-50'}`}>
                              {m.label}
                            </p>
                            {isNext && !unlocked && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-pale-gold bg-pale-gold/15 px-2 py-0.5 rounded-full">
                                Next
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-relaxed ${unlocked ? textMid : textDim} ${!unlocked && 'opacity-60'}`}>
                            {unlocked ? m.detail : m.description}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          {unlocked
                            ? <CheckCircle2 size={18} className="text-pale-gold" />
                            : <Lock size={14} className={textDim + ' opacity-50'} />
                          }
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Grace day note */}
              <div className={`mx-6 mt-6 p-4 rounded-2xl border ${border} ${isDarkMode ? 'bg-white/3' : 'bg-[#FAF7F3]'}`}>
                <p className={`text-xs leading-relaxed text-center ${textDim}`}>
                  Life happens. You have one grace day per month — your streak is protected if you miss a day. Your garden never forgets who you are.
                </p>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
