import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import type { PracticeData } from '../types';

// Stable random values for ambient particles
const PARTICLE_RANDOMS = Array.from({ length: 20 }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    animY: (Math.random() - 0.5) * 50,
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 5,
}));

// ── Practice type definitions ─────────────────────────────────────────────────

type PracticeSlot = {
    key: string;         // matches values in PracticeActivity.practices[]
    label: string;
    color: { light: string; dark: string };
    glowColor: string;
};

const PRACTICE_SLOTS: PracticeSlot[] = [
    { key: 'meditation',       label: 'Meditation',   color: { light: '#7B9EA3', dark: '#A8C5CA' }, glowColor: '#7B9EA3' },
    { key: 'morning_practice', label: 'Morning',      color: { light: '#C96A3A', dark: '#E8956A' }, glowColor: '#C96A3A' },
    { key: 'breathwork',       label: 'Breathwork',   color: { light: '#6F7B6D', dark: '#A0B09E' }, glowColor: '#6F7B6D' },
    { key: 'reflection',       label: 'Journal',      color: { light: '#B8A080', dark: '#D4BF9E' }, glowColor: '#B8A080' },
];

// ── Plant SVGs ────────────────────────────────────────────────────────────────
// Each practice type gets its own distinct plant silhouette.

const LotusPlant: React.FC<{ color: string; health: number }> = ({ color, health }) => {
    const opacity = 0.35 + health * 0.65;
    const size = 0.6 + health * 0.4;
    return (
        <g transform={`scale(${size})`} style={{ opacity }}>
            {/* Stem */}
            <path d="M0 28 Q-2 18 -1 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Left petal */}
            <path d="M-1 8 Q-12 2 -8 -8 Q-2 -2 -1 8" fill={color} opacity="0.7" />
            {/* Right petal */}
            <path d="M-1 8 Q10 2 6 -8 Q0 -2 -1 8" fill={color} opacity="0.7" />
            {/* Center petal */}
            <path d="M-1 8 Q-3 -4 -1 -12 Q1 -4 -1 8" fill={color} opacity="0.9" />
            {/* Center dot */}
            <circle cx="-1" cy="8" r="2" fill={color} />
        </g>
    );
};

const FernPlant: React.FC<{ color: string; health: number }> = ({ color, health }) => {
    const opacity = 0.35 + health * 0.65;
    const size = 0.5 + health * 0.5;
    return (
        <g transform={`scale(${size})`} style={{ opacity }}>
            {/* Main stem */}
            <path d="M0 30 Q0 15 0 0" stroke={color} strokeWidth="1.5" fill="none" />
            {/* Left fronds */}
            <path d="M0 22 Q-10 16 -12 8" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M0 14 Q-8 8 -10 2" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Right fronds */}
            <path d="M0 22 Q10 16 12 8" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M0 14 Q8 8 10 2" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Top curl */}
            <path d="M0 0 Q3 -6 0 -10 Q-2 -6 0 0" stroke={color} strokeWidth="1" fill="none" />
        </g>
    );
};

const FlowerPlant: React.FC<{ color: string; health: number }> = ({ color, health }) => {
    const opacity = 0.35 + health * 0.65;
    const size = 0.55 + health * 0.45;
    const petalsOpen = health > 0.5;
    return (
        <g transform={`scale(${size})`} style={{ opacity }}>
            {/* Stem */}
            <path d="M0 30 Q1 18 0 10" stroke={color} strokeWidth="1.5" fill="none" />
            {/* Leaf */}
            <path d="M0 20 Q-8 15 -6 10 Q-2 14 0 20" fill={color} opacity="0.5" />
            {/* Petals */}
            {petalsOpen ? (
                <>
                    {[0, 60, 120, 180, 240, 300].map(a => (
                        <ellipse
                            key={a}
                            cx={Math.cos(a * Math.PI / 180) * 7}
                            cy={Math.sin(a * Math.PI / 180) * 7 + 10}
                            rx="3.5" ry="5"
                            transform={`rotate(${a} ${Math.cos(a * Math.PI / 180) * 7} ${Math.sin(a * Math.PI / 180) * 7 + 10})`}
                            fill={color} opacity="0.75"
                        />
                    ))}
                </>
            ) : (
                /* Bud when health is low */
                <ellipse cx="0" cy="7" rx="3" ry="5" fill={color} opacity="0.6" />
            )}
            {/* Center */}
            <circle cx="0" cy="10" r="3" fill="#F5EBD8" opacity="0.9" />
        </g>
    );
};

const SaplingPlant: React.FC<{ color: string; health: number }> = ({ color, health }) => {
    const opacity = 0.35 + health * 0.65;
    const size = 0.5 + health * 0.5;
    const canopyH = 8 + health * 12;
    return (
        <g transform={`scale(${size})`} style={{ opacity }}>
            {/* Trunk */}
            <rect x="-2" y={30 - canopyH} width="4" height={canopyH} rx="2" fill={color} opacity="0.8" />
            {/* Canopy layers */}
            <path
                d={`M0 ${10 - canopyH * 0.5} L${-6 - health * 4} ${20 - canopyH * 0.5} L${6 + health * 4} ${20 - canopyH * 0.5} Z`}
                fill={color} opacity="0.7"
            />
            <path
                d={`M0 ${4 - canopyH * 0.5} L${-4 - health * 3} ${14 - canopyH * 0.5} L${4 + health * 3} ${14 - canopyH * 0.5} Z`}
                fill={color} opacity="0.85"
            />
        </g>
    );
};

// ── Helper: count practice sessions in last N days ────────────────────────────

function countRecentPractices(
    history: { date: string; practices: string[] }[] | undefined,
    key: string,
    days: number
): number {
    if (!history?.length) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return history.filter(a => a.date >= cutoffStr && a.practices.includes(key)).length;
}

/** Map session count → health score 0–1 */
function toHealth(count: number): number {
    // 0 sessions = 0, 1 = 0.3, 2 = 0.55, 3 = 0.75, 4+ = 1.0
    if (count <= 0) return 0;
    if (count === 1) return 0.3;
    if (count === 2) return 0.55;
    if (count === 3) return 0.75;
    return 1.0;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface GardenOfGrowthProps {
    points: number;
    streak: number;
    name: string;
    isDarkMode: boolean;
    practiceData?: PracticeData;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const GardenOfGrowth: React.FC<GardenOfGrowthProps> = ({
    points,
    streak,
    name,
    isDarkMode,
    practiceData,
}) => {
    const level = useMemo(() => {
        if (points >= 5000) return { title: 'Master',   scale: 1.2 };
        if (points >= 1000) return { title: 'Guide',    scale: 1.1 };
        if (points >= 500)  return { title: 'Seeker',   scale: 1.0 };
        return                     { title: 'Beginner', scale: 0.9 };
    }, [points]);

    // Per-practice health scores (last 7 days)
    const plantHealthMap = useMemo(() => {
        const history = practiceData?.activityHistory;
        return Object.fromEntries(
            PRACTICE_SLOTS.map(slot => [slot.key, toHealth(countRecentPractices(history, slot.key, 7))])
        );
    }, [practiceData]);

    // Ambient firefly particles (based on streak)
    const particles = useMemo(() => {
        const count = Math.min(streak, 20);
        return PARTICLE_RANDOMS.slice(0, count);
    }, [streak]);

    const totalHealth = useMemo(() => {
        const vals = Object.values(plantHealthMap);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }, [plantHealthMap]);

    return (
        <div className={`relative w-full rounded-[2.5rem] overflow-hidden border transition-all duration-1000 ${
            isDarkMode
                ? 'bg-gradient-to-br from-[#2A3A2E] to-[#1E2D22] border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)]'
                : 'bg-gradient-to-b from-[#EFF6E8] to-[#F7F9F2] border-sage/20 shadow-xl'
        }`}>

            {/* Soft ambient glow — intensity tracks overall garden health */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
                style={{
                    opacity: 0.15 + totalHealth * 0.25,
                    background: isDarkMode
                        ? 'radial-gradient(ellipse at 50% 80%, rgba(160,192,160,0.3) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse at 50% 80%, rgba(111,123,109,0.15) 0%, transparent 70%)',
                }}
            />

            {/* Firefly particles (streak count) */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full ${isDarkMode ? 'bg-[#E5D6A7]' : 'bg-[#6F7B6D]'}`}
                        initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0 }}
                        animate={{ y: [`${p.y}%`, `${p.y + p.animY}%`], opacity: [0, 0.6, 0], scale: [0, 1.5, 0] }}
                        transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
                        style={{ filter: 'blur(1px)' }}
                    />
                ))}
            </div>

            {/* ── Plant grid ──────────────────────────────────────────────── */}
            <div className="relative z-10 px-5 pt-5 pb-2">
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {PRACTICE_SLOTS.map((slot, idx) => {
                        const health = plantHealthMap[slot.key] ?? 0;
                        const color = isDarkMode ? slot.color.dark : slot.color.light;
                        const isActive = health > 0;

                        return (
                            <motion.div
                                key={slot.key}
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.12, duration: 0.6, type: 'spring' }}
                            >
                                {/* Plant container */}
                                <div
                                    className={`relative w-full aspect-square rounded-2xl flex items-end justify-center overflow-hidden transition-all duration-700 ${
                                        isDarkMode ? 'bg-white/4' : 'bg-white/60'
                                    }`}
                                    style={{
                                        border: isActive
                                            ? `1.5px solid ${color}40`
                                            : `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                        boxShadow: isActive
                                            ? `0 4px 16px ${slot.glowColor}20`
                                            : 'none',
                                    }}
                                >
                                    {/* Health glow on floor */}
                                    {isActive && (
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
                                            style={{
                                                background: `radial-gradient(ellipse at 50% 100%, ${color}30 0%, transparent 70%)`,
                                            }}
                                        />
                                    )}

                                    {/* SVG plant */}
                                    <motion.div
                                        animate={isActive ? {
                                            y: [0, -2, 0],
                                        } : {}}
                                        transition={{ duration: 4 + idx, repeat: Infinity, ease: 'easeInOut' }}
                                        className="mb-1"
                                    >
                                        <svg width="48" height="48" viewBox="-16 -16 32 36" overflow="visible">
                                            {idx === 0 && <LotusPlant color={color} health={health} />}
                                            {idx === 1 && <FlowerPlant color={color} health={health} />}
                                            {idx === 2 && <FernPlant color={color} health={health} />}
                                            {idx === 3 && <SaplingPlant color={color} health={health} />}
                                        </svg>
                                    </motion.div>

                                    {/* Dormant indicator */}
                                    {!isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-white/15' : 'bg-black/10'}`} />
                                        </div>
                                    )}
                                </div>

                                {/* Label + health dots */}
                                <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mt-1.5 ${
                                    isActive
                                        ? isDarkMode ? 'text-white/60' : 'text-sage-dark/60'
                                        : isDarkMode ? 'text-white/20' : 'text-black/20'
                                }`}>
                                    {slot.label}
                                </p>
                                {/* Activity dots (last 7 days) */}
                                <div className="flex gap-0.5 mt-1">
                                    {Array.from({ length: 4 }).map((_, di) => {
                                        const filled = di < Math.round(health * 4);
                                        return (
                                            <div
                                                key={di}
                                                className="w-1 h-1 rounded-full transition-colors duration-500"
                                                style={{
                                                    background: filled
                                                        ? color
                                                        : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Stats bar ──────────────────────────────────────────── */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-1 ${
                    isDarkMode ? 'bg-white/5 border border-white/8' : 'bg-white/70 border border-sage/10'
                }`}>
                    <div className="flex items-center gap-1.5">
                        <Flame size={13} className="text-orange-400" />
                        <span className={`text-lg font-display font-medium leading-none ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            {streak}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>
                            Streak
                        </span>
                    </div>

                    {/* Level badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                        isDarkMode ? 'bg-[#E5D6A7]/10 border border-[#E5D6A7]/20' : 'bg-[#C96A3A]/8 border border-[#C96A3A]/15'
                    }`}>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${
                            isDarkMode ? 'text-[#E5D6A7]' : 'text-[#C96A3A]'
                        }`}>
                            {level.title}
                        </span>
                        <div className={`w-px h-3 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${isDarkMode ? 'text-white/40' : 'text-sage-dark/40'}`}>
                            {name}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>
                            Essence
                        </span>
                        <span className={`text-lg font-display font-medium leading-none ${isDarkMode ? 'text-[#E5D6A7]' : 'text-[#6F7B6D]'}`}>
                            {points}
                        </span>
                        <Sparkles size={13} className={isDarkMode ? 'text-[#E5D6A7]' : 'text-[#6F7B6D]'} />
                    </div>
                </div>

                {/* Progress ring (overall health → visual ring around stats bar) */}
                <div className="relative flex justify-center mt-2 mb-1">
                    <svg width="160" height="8" viewBox="0 0 160 8">
                        <rect x="0" y="2" width="160" height="4" rx="2"
                            fill={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                        <motion.rect
                            x="0" y="2" height="4" rx="2"
                            fill={isDarkMode ? '#C5D9CB' : '#6F7B6D'}
                            initial={{ width: 0 }}
                            animate={{ width: Math.min(points / 5000, 1) * 160 }}
                            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                        />
                    </svg>
                </div>
                <p className={`text-center text-[9px] font-bold uppercase tracking-[0.15em] mb-3 ${
                    isDarkMode ? 'text-white/20' : 'text-sage-dark/30'
                }`}>
                    {Math.round((points / 5000) * 100)}% to Master
                </p>
            </div>

            {/* Bottom horizon fade */}
            <div className={`absolute bottom-0 inset-x-0 h-8 pointer-events-none ${
                isDarkMode ? 'bg-gradient-to-t from-[#1E2D22]/60 to-transparent' : 'bg-gradient-to-t from-sage/8 to-transparent'
            }`} />
        </div>
    );
};
