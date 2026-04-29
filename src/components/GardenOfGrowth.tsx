import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame, Sparkles } from 'lucide-react';

// Module-level constants for stable random values (avoid Math.random in render)
const GARDEN_PLANT_RANDOMS = Array.from({ length: 12 }).map(() => ({
    rx: Math.random(),
    ry: Math.random(),
    rs: Math.random(),
}));

const GARDEN_FIREFLY_RANDOMS = Array.from({ length: 25 }).map(() => ({
    initialX: Math.random() * 100 + '%',
    initialY: Math.random() * 90 + '%',
    animY: [(Math.random() - 0.5) * 40 + '%', (Math.random() - 0.5) * 40 + '%'],
    animX: [(Math.random() - 0.5) * 20 + '%', (Math.random() - 0.5) * 20 + '%'],
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 10,
}));

// --- BEAUTIFUL PLANT COMPONENTS ---

const LotusPlant = ({ isDarkMode, color }: { isDarkMode: boolean, color: string }) => (
    <svg width="60" height="45" viewBox="0 0 60 45" fill="none" className="drop-shadow-sm">
        {/* Outer Petals */}
        <path d="M30 40C20 40 10 32 10 20C10 8 20 0 30 0C40 0 50 8 50 20C50 32 40 40 30 40Z" fill={color} fillOpacity="0.2" />
        <path d="M30 40C15 40 5 30 5 18C5 6 15 0 30 0" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
        <path d="M30 40C45 40 55 30 55 18C55 6 45 0 30 0" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
        {/* Inner Petals */}
        <path d="M30 35C24 35 18 28 18 18C18 8 24 2 30 2C36 2 42 8 42 18C42 28 36 35 30 35Z" fill={color} fillOpacity="0.4" />
        <path d="M30 35C26 35 22 30 22 22C22 14 26 8 30 8C34 8 38 14 38 22C38 30 34 35 30 35Z" fill={color} fillOpacity="0.6" />
        {/* Core */}
        <circle cx="30" cy="18" r="3" fill="#E5D6A7" className="animate-pulse" />
    </svg>
);

const Wildflower = ({ color }: { color: string }) => (
    <svg width="30" height="50" viewBox="0 0 30 50" fill="none">
        {/* Stem */}
        <path d="M15 50C15 50 12 35 15 20" stroke="#355E3B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Leaves */}
        <path d="M15 40C15 40 8 38 7 35C6 32 10 30 15 35" fill="#355E3B" fillOpacity="0.4" />
        <path d="M15 32C15 32 22 30 23 27C24 24 20 22 15 27" fill="#355E3B" fillOpacity="0.4" />
        {/* Flower Head */}
        <g transform="translate(15, 20)">
            {[0, 72, 144, 216, 288].map(a => (
                <ellipse key={a} rx="4" ry="7" fill={color} transform={`rotate(${a}) translate(0, -6)`} />
            ))}
            <circle r="3" fill="#E5D6A7" />
        </g>
    </svg>
);

const FernPlant = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <svg width="40" height="70" viewBox="0 0 40 70" fill="none">
        <path d="M20 70C20 70 15 40 20 10" stroke="#355E3B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        {[5, 15, 25, 35, 45, 55].map(y => (
            <g key={y}>
                <path d={`M20 ${y+10} C20 ${y+10} 35 ${y} 38 ${y-5}`} stroke="#355E3B" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />
                <path d={`M20 ${y+10} C20 ${y+10} 5 ${y} 2 ${y-5}`} stroke="#355E3B" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />
            </g>
        ))}
    </svg>
);

const TallGrass = () => (
    <svg width="15" height="40" viewBox="0 0 15 40" fill="none">
        <path d="M7 40C7 40 4 25 7 0" stroke="#355E3B" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
        <path d="M9 40C9 40 12 20 8 5" stroke="#355E3B" strokeWidth="0.8" strokeOpacity="0.2" strokeLinecap="round" />
    </svg>
);


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
        const types = ['lotus', 'fern', 'wildflower', 'grass'];
        const colors = [
            '#E5D6A7', // Amber
            '#C96A3A', // Terracotta
            '#D4A3C5', // soft pink
            '#A3B5D4', // soft blue
            '#B5C2A3', // sage
        ];
        return Array.from({ length: count }).map((_, i) => {
            const r = GARDEN_PLANT_RANDOMS[i] ?? GARDEN_PLANT_RANDOMS[0];
            return {
                id: i,
                x: 10 + (i / count) * 80 + (r.rx - 0.5) * 10, // Distributed with some jitter
                y: 60 + r.ry * 30, // 60% to 90%
                scale: 0.6 + r.rs * 0.6,
                delay: i * 0.1,
                type: types[i % types.length],
                color: colors[i % colors.length]
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
            ? 'bg-gradient-to-br from-[#1B4332] to-[#081C15] border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-b from-[#95D5B2] to-[#40916C] border-sage/30 shadow-2xl'
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
                        className="absolute bottom-0 pointer-events-none origin-bottom"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                            scale: plant.scale, 
                            opacity: 1,
                            rotate: [0, 2, -2, 0] 
                        }}
                        transition={{ 
                            scale: { delay: plant.delay, duration: 1.5, type: 'spring' },
                            rotate: { duration: 5 + Math.random() * 5, repeat: Infinity, ease: 'easeInOut' }
                        }}
                        style={{ left: `${plant.x}%`, zIndex: Math.floor(plant.y) }}
                    >
                        {plant.type === 'lotus' && <LotusPlant isDarkMode={isDarkMode} color={plant.color} />}
                        {plant.type === 'fern' && <FernPlant isDarkMode={isDarkMode} />}
                        {plant.type === 'wildflower' && <Wildflower color={plant.color} />}
                        {plant.type === 'grass' && <TallGrass />}
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
                            className="px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 inline-flex items-center gap-3 mb-2"
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
                                <span className={`text-[8px] uppercase tracking-widest font-bold ${isDarkMode ? 'text-white/30' : 'text-sage-dark/40'}`}>Points</span>
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
