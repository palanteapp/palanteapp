import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame, Sparkles } from 'lucide-react';

// Module-level constants for stable random values (avoid Math.random in render)
const GARDEN_PLANT_RANDOMS = Array.from({ length: 12 }).map(() => ({
    rx: Math.random(),
    ry: Math.random(),
    rs: Math.random(),
}));

const GARDEN_FIREFLY_RANDOMS = Array.from({ length: 20 }).map(() => ({
    initialX: Math.random() * 100 + '%',
    initialY: Math.random() * 100 + '%',
    animY: (Math.random() - 0.5) * 50 + '%',
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 5,
}));

interface GardenOfGrowthProps {
    points: number;
    streak: number;
    name: string;
    isDarkMode: boolean;
}

export const GardenOfGrowth: React.FC<GardenOfGrowthProps> = ({ points, streak, name, isDarkMode }) => {
    // Determine level based on points
    const level = useMemo(() => {
        if (points >= 5000) return { title: 'Master', color: 'from-amber to-white', scale: 1.2, plants: 12 };
        if (points >= 1000) return { title: 'Guide', color: 'from-sage to-amber', scale: 1.1, plants: 8 };
        if (points >= 500) return { title: 'Seeker', color: 'from-sage-dark to-sage', scale: 1.0, plants: 5 };
        return { title: 'Beginner', color: 'from-warm-gray-green to-sage', scale: 0.9, plants: 3 };
    }, [points]);

    // Generate plant positions based on points (more points = more visual density)
    const plants = useMemo(() => {
        const count = level.plants;
        return Array.from({ length: count }).map((_, i) => {
            const r = GARDEN_PLANT_RANDOMS[i] ?? GARDEN_PLANT_RANDOMS[0];
            return {
                id: i,
                x: 20 + r.rx * 60, // 20% to 80%
                y: 40 + r.ry * 40, // 40% to 80%
                scale: 0.5 + r.rs * 0.8,
                delay: i * 0.2,
                type: i % 3 === 0 ? 'lotus' : i % 3 === 1 ? 'fern' : 'flower'
            };
        });
    }, [level]);

    // Generate firefly animation data in a stable way
    const fireflies = useMemo(() => {
        const count = Math.min(streak, 20);
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            ...GARDEN_FIREFLY_RANDOMS[i],
        }));
    }, [streak]);

    return (
        <div className={`relative w-full h-64 rounded-[2.5rem] overflow-hidden border transition-all duration-1000 ${isDarkMode
            ? 'bg-gradient-to-br from-[#5A7061] to-[#3D4D41] border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)]'
            : 'bg-gradient-to-b from-[#E8EDDE] to-[#F7F9F2] border-sage/20 shadow-xl'
            }`}>
        {/* Soft Ambient Glow */}
            <div className={`absolute inset-0 opacity-40 blur-[100px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-[#C5D9CB]/20' : 'bg-sage/20'
                }`} />

            {/* Streaks as Fireflies/Lights */}
            <div className="absolute inset-0 pointer-events-none">
                {fireflies.map((ff) => (
                    <motion.div
                        key={ff.id}
                        className={`absolute w-1 h-1 rounded-full ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                        initial={{
                            x: ff.initialX,
                            y: ff.initialY,
                            opacity: 0
                        }}
                        animate={{
                            y: [null, ff.animY],
                            opacity: [0, 0.6, 0],
                            scale: [0, 1.5, 0]
                        }}
                        transition={{
                            duration: ff.duration,
                            repeat: Infinity,
                            delay: ff.delay
                        }}
                        style={{ filter: 'blur(1px)' }}
                    />
                ))}
            </div>

            {/* Visual Milestones: Floating Sacred Shapes */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <motion.svg
                    width="320"
                    height="320"
                    viewBox="0 0 100 100"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
                    className={isDarkMode ? 'text-pale-gold' : 'text-sage'}
                >
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 2" />
                    {points >= 5000 && (
                        <g>
                            {[0, 60, 120, 180, 240, 300].map(angle => (
                                <circle
                                    key={angle}
                                    cx={50 + 20 * Math.cos(angle * Math.PI / 180)}
                                    cy={50 + 20 * Math.sin(angle * Math.PI / 180)}
                                    r="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="0.1"
                                />
                            ))}
                        </g>
                    )}
                </motion.svg>
            </div>

            {/* THE GARDEN */}
            <div className="absolute inset-0 flex items-end justify-center pb-8 p-6">
                {/* Background Plants */}
                {plants.map((plant) => (
                    <motion.div
                        key={plant.id}
                        className="absolute bottom-0 pointer-events-none"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: plant.scale, opacity: 0.7 }}
                        transition={{ delay: plant.delay, duration: 1.5, type: 'spring' }}
                        style={{ left: `${plant.x}%`, bottom: `${100 - plant.y}%` }}
                    >
                        {plant.type === 'lotus' && (
                            <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
                                <path d="M20 5C15 5 10 12 10 20C10 25 15 28 20 28C25 28 30 25 30 20C30 12 25 5 20 5Z" className={isDarkMode ? 'fill-sage/40' : 'fill-sage/20'} />
                                <path d="M20 8C17 8 14 13 14 18C14 22 17 24 20 24C23 24 26 22 26 18C26 13 23 8 20 8Z" className={isDarkMode ? 'fill-amber/30' : 'fill-amber/40'} />
                            </svg>
                        )}
                        {plant.type === 'fern' && (
                            <svg width="20" height="40" viewBox="0 0 20 40">
                                <path d="M10 40C10 40 18 25 18 15C18 5 10 0 10 0C10 0 2 5 2 15C2 25 10 40 10 40Z" className={isDarkMode ? 'fill-sage/30' : 'fill-sage/10'} />
                            </svg>
                        )}
                        {plant.type === 'flower' && (
                            <circle cx="2" cy="2" r="2" className={isDarkMode ? 'fill-amber/40' : 'fill-amber/60'} />
                        )}
                    </motion.div>
                ))}

                {/* CENTRAL TREE OF GROWTH */}
                <motion.div
                    className="relative z-10 flex flex-col items-center"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    {/* Visual Growth Milestones: Architectures */}
                    {points >= 1000 && (
                        <motion.div
                            className="absolute -top-12 flex gap-20 pointer-events-none"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 2 }}
                        >
                            {/* Stone Lanterns for Guides */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
                                <rect x="8" y="16" width="8" height="6" rx="1" fill="currentColor" className={isDarkMode ? 'text-white' : 'text-sage'} />
                                <rect x="10" y="8" width="4" height="8" fill="currentColor" className={isDarkMode ? 'text-white' : 'text-sage'} />
                                <path d="M6 8L12 2L18 8H6Z" fill="currentColor" className={isDarkMode ? 'text-pale-gold' : 'text-sage-dark'} />
                            </svg>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
                                <rect x="8" y="16" width="8" height="6" rx="1" fill="currentColor" className={isDarkMode ? 'text-white' : 'text-sage'} />
                                <rect x="10" y="8" width="4" height="8" fill="currentColor" className={isDarkMode ? 'text-white' : 'text-sage'} />
                                <path d="M6 8L12 2L18 8H6Z" fill="currentColor" className={isDarkMode ? 'text-pale-gold' : 'text-sage-dark'} />
                            </svg>
                        </motion.div>
                    )}

                    {points >= 5000 && (
                        <motion.div
                            className="absolute -top-24 pointer-events-none"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 0.2, scale: 1.2 }}
                            transition={{ delay: 2.5 }}
                        >
                            {/* Golden Arch for Masters */}
                            <svg width="120" height="60" viewBox="0 0 120 60">
                                <path d="M10 60V20C10 8.9543 18.9543 0 30 0H90C101.046 0 110 8.9543 110 20V60" stroke="#E5D6A7" strokeWidth="2" fill="none" />
                                <path d="M0 60H120" stroke="#E5D6A7" strokeWidth="1" />
                            </svg>
                        </motion.div>
                    )}

                    {/* The Tree/Lotus Shape */}
                    <div className="relative mb-4">
                        <motion.div
                            animate={{
                                scale: [level.scale, level.scale * 1.05, level.scale],
                                rotate: [0, 2, -2, 0]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="relative"
                        >
                            <div className={`w-32 h-32 rounded-full blur-[40px] opacity-60 absolute inset-0 bg-gradient-to-tr ${level.color}`} />
                            <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center backdrop-blur-md relative z-10 ${isDarkMode ? 'border-white/10 bg-white/5 shadow-2xl' : 'border-sage/20 bg-white shadow-xl'
                                }`}>
                                {points >= 1000 ? <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-pale-gold' : 'text-sage'}><path d="M12 22v-6"/><path d="M7 16V9a5 5 0 0 1 10 0v7"/><path d="M7 22H3v-8a2 2 0 0 1 2-2h2"/><path d="M17 22h4v-8a2 2 0 0 0-2-2h-2"/><path d="M12 2V8"/><path d="m8 5 4-3 4 3"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-pale-gold' : 'text-sage'}><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.8 3.3-.6 4.3.1 1 .6 2 1.8 2.5 4-2.8.6-4.5.1-5.6-.7"/></svg>}
                            </div>
                        </motion.div>

                        {/* Radial Status Bars */}
                        <svg className="absolute inset-0 -m-4 w-32 h-32 rotate-[-90deg]">
                            <motion.circle
                                cx="64" cy="64" r="60"
                                fill="none"
                                stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(111,123,109,0.05)'}
                                strokeWidth="4"
                            />
                            <motion.circle
                                cx="64" cy="64" r="60"
                                fill="none"
                                stroke={isDarkMode ? '#E5D6A7' : '#6F7B6D'}
                                strokeWidth="4"
                                strokeDasharray="377"
                                initial={{ strokeDashoffset: 377 }}
                                animate={{ strokeDashoffset: 377 - (Math.min(points / 5000, 1) * 377) }}
                                transition={{ duration: 2, delay: 1 }}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    {/* Stats HUD */}
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="px-4 py-1.5 rounded-full bg-[#3A1700]/20 backdrop-blur-xl border border-white/10 inline-flex items-center gap-3 mb-2"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pale-gold">{level.title}</span>
                            <div className="w-px h-3 bg-white/20" />
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/60' : 'text-white'}`}>{name}</span>
                        </motion.div>

                        <div className="flex gap-8 justify-center mt-2">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Flame size={14} className="text-orange-400" />
                                    <span className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>{streak}</span>
                                </div>
                                <span className={`text-[8px] uppercase tracking-widest font-bold ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>Streak</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Sparkles size={14} className="text-pale-gold" />
                                    <span className={`text-xl font-display font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>{points}</span>
                                </div>
                                <span className={`text-[8px] uppercase tracking-widest font-bold ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>Essence</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Horizon */}
            <div className={`absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t pointer-events-none ${isDarkMode ? 'from-black/60 to-transparent' : 'from-sage/10 to-transparent'
                }`} />
        </div>
    );
};
