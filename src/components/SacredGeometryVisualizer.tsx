import React, { useEffect, useState } from 'react';

interface SacredGeometryProps {
    isActive: boolean;
    className?: string;
}

type GeometryShape = 'seed' | 'merkabah' | 'flower';

export const SacredGeometryVisualizer: React.FC<SacredGeometryProps> = ({ isActive, className = '' }) => {
    const [shapes, setShapes] = useState<{ primary: GeometryShape, secondary: GeometryShape }>({
        primary: 'seed',
        secondary: 'flower'
    });

    // Complex multi-speed rotations
    const [rotations, setRotations] = useState({
        primary: 0,
        secondary: 0,
        tertiary: 0,
        quaternary: 0
    });

    useEffect(() => {
        let animationFrame: number;
        const animate = () => {
            setRotations(prev => ({
                primary: (prev.primary + (isActive ? 0.05 : 0.015)) % 360,
                secondary: (prev.secondary - (isActive ? 0.08 : 0.02)) % 360,
                tertiary: (prev.tertiary + (isActive ? 0.03 : 0.01)) % 360,
                quaternary: (prev.quaternary - (isActive ? 0.12 : 0.04)) % 360
            }));
            animationFrame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [isActive]);

    // Shape cycling every 30 seconds - overlapping two shapes
    useEffect(() => {
        const availableShapes: GeometryShape[] = ['seed', 'flower'];
        let currentIndex = 0;

        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % availableShapes.length;
            const nextIndex = (currentIndex + 1) % availableShapes.length;
            setShapes({
                primary: availableShapes[currentIndex],
                secondary: availableShapes[nextIndex]
            });
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const colorClass = isActive ? "text-pale-gold" : "text-white/20";
    const strokeClass = isActive ? "stroke-pale-gold" : "stroke-white/20";

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Container for all shapes - BIGGER */}
            <div
                className={`relative transition-all duration-1000 ease-in-out transform ${isActive ? 'scale-100 opacity-[0.28]' : 'scale-75 opacity-[0.12]'
                    }`}
                style={{
                    width: '420px', // Further reduced: 560 * 0.75 = 420px
                    height: '420px',
                    filter: isActive
                        ? 'drop-shadow(0 0 40px rgba(229, 214, 167, 0.2)) drop-shadow(0 0 80px rgba(111, 123, 109, 0.15)) blur(0.2px)'
                        : 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.08))'
                }}
            >

                {/* Subtle Glow Layer */}
                <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-1000 ${isActive
                    ? 'bg-gradient-to-br from-pale-gold/20 to-sage/15 scale-110 opacity-40'
                    : 'bg-white/5 scale-90 opacity-10'
                    }`} />

                {/* Seed of Life - Always rendered, fades in/out */}
                <div
                    className={`absolute inset-0 flex items-center justify-center animate-breathe transition-opacity duration-[10000ms] ${shapes.primary === 'seed' || shapes.secondary === 'seed' ? 'opacity-100' : 'opacity-0'
                        } ${isActive ? 'duration-[4s]' : 'duration-[8s]'}`}
                >
                    <svg viewBox="0 0 200 200" className={`w-full h-full ${strokeClass} fill-none opacity-60`} style={{ transform: `rotate(${rotations.primary}deg)`, filter: 'url(#motionBlur)' }}>
                        <defs>
                            <filter id="motionBlur">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5,0" />
                            </filter>
                        </defs>
                        {/* Center Circle */}
                        <circle cx="100" cy="100" r="30" strokeWidth="1" />
                        {/* 6 Surrounding Circles */}
                        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                            const rad = angle * (Math.PI / 180);
                            const x = 100 + 30 * Math.cos(rad);
                            const y = 100 + 30 * Math.sin(rad);
                            return <circle key={i} cx={x} cy={y} r="30" strokeWidth="1" />;
                        })}
                    </svg>
                </div>



                {/* Flower of Life Expansion - Always rendered, fades in/out */}
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[10000ms] ${shapes.primary === 'flower' || shapes.secondary === 'flower' ? (isActive ? 'opacity-50' : 'opacity-25') : 'opacity-0'
                        }`}
                >
                    <svg viewBox="0 0 300 300" className={`w-full h-full ${strokeClass} fill-none`} style={{ transform: `rotate(${rotations.tertiary}deg)`, filter: 'url(#motionBlur3)' }}>
                        <defs>
                            <filter id="motionBlur3">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5,0" />
                            </filter>
                        </defs>
                        {/* Outer Ring of Flower of Life */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                            const rad = angle * (Math.PI / 180);
                            const R = 60;
                            const x = 150 + R * Math.cos(rad);
                            const y = 150 + R * Math.sin(rad);
                            return <circle key={i} cx={x} cy={y} r="30" strokeWidth="0.5" />;
                        })}
                    </svg>
                </div>

                {/* Overlapping Abstract Layers - Subtle secondary geometry */}
                <div className={`absolute inset-0 flex items-center justify-center mix-blend-soft-light transition-opacity duration-[15000ms] ${isActive ? 'opacity-40' : 'opacity-20'
                    }`}>
                    <svg viewBox="0 0 200 200" className={`w-full h-full ${strokeClass} fill-none`} style={{ transform: `rotate(${rotations.primary * 0.5}deg)` }}>
                        {/* Vesica Piscis - overlapping circles */}
                        <circle cx="80" cy="100" r="45" strokeWidth="0.4" opacity="0.6" />
                        <circle cx="120" cy="100" r="45" strokeWidth="0.4" opacity="0.6" />
                        <circle cx="100" cy="80" r="45" strokeWidth="0.4" opacity="0.6" />
                        <circle cx="100" cy="120" r="45" strokeWidth="0.4" opacity="0.6" />
                        {/* Smaller connection rings */}
                        <circle cx="100" cy="100" r="20" strokeWidth="0.3" opacity="0.8" />
                        <circle cx="100" cy="100" r="10" strokeWidth="0.2" opacity="1" />
                    </svg>
                </div>

                {/* Second overlapping layer for depth */}
                <div className={`absolute inset-0 flex items-center justify-center mix-blend-overlay transition-opacity duration-[12000ms] ${isActive ? 'opacity-15' : 'opacity-0'
                    }`}>
                    <svg viewBox="0 0 200 200" className={`w-2/3 h-2/3 ${strokeClass} fill-none`} style={{ transform: `rotate(${rotations.quaternary}deg)` }}>
                        <rect x="50" y="50" width="100" height="100" strokeWidth="0.5" opacity="0.5" transform="rotate(45 100 100)" />
                        <rect x="50" y="50" width="100" height="100" strokeWidth="0.5" opacity="0.5" />
                        <circle cx="100" cy="100" r="70" strokeWidth="0.3" opacity="0.3" />
                    </svg>
                </div>

                {/* Hypnotic Outer Layer */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[18000ms] ${isActive ? 'opacity-10' : 'opacity-0'}`}>
                    <svg viewBox="0 0 200 200" className={`w-[120%] h-[120%] ${strokeClass} fill-none stroke-[0.2]`} style={{ transform: `rotate(${rotations.secondary * 0.3}deg)` }}>
                        <circle cx="100" cy="100" r="90" opacity="0.4" strokeDasharray="1 4" />
                        <circle cx="100" cy="100" r="85" opacity="0.3" strokeDasharray="2 2" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
