import React, { useState, useEffect, useRef } from 'react';

interface KoiAnimationProps {
    isDarkMode: boolean;
}

interface FishState {
    id: number;
    x: number;
    y: number;
    rotation: number;
    targetX: number;
    targetY: number;
    velocity: { x: number, y: number };
    size: number;
    filter: string;
}

export const KoiAnimation: React.FC<KoiAnimationProps> = () => {
    const [fish, setFish] = useState<FishState[]>([]);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);

    // Initial random spawn loop for ambient fish
    useEffect(() => {
        const spawnAmbientFish = () => {
            setFish(prev => {
                if (prev.length >= 2) return prev; // Limit to exactly 2 fish

                const sides = ['left', 'right', 'top', 'bottom'];
                const startSide = sides[Math.floor(Math.random() * sides.length)];

                // Varied filters for the two fish
                const filters = [
                    'saturate(1.5) brightness(1.1)', // Orange
                    'hue-rotate(90deg) saturate(2.0) brightness(1.2)', // Greenish
                    'hue-rotate(-45deg) saturate(2.0) brightness(1.1)', // Deep Orange/Red
                    'hue-rotate(180deg) saturate(1.5) brightness(1.2)', // Blue
                    'grayscale(100%) brightness(0.6) contrast(1.5)', // Black/Sumi
                ];

                // Try to pick a filter that isn't currently used if possible
                const usedFilters = prev.map(p => p.filter);
                const availableFilters = filters.filter(f => !usedFilters.includes(f));
                const pool = availableFilters.length > 0 ? availableFilters : filters;

                const randomFilter = pool[Math.floor(Math.random() * pool.length)];
                const randomSize = 0.6 + Math.random() * 0.7; // 0.6x to 1.3x

                let startX, startY, targetX, targetY;
                const buffer = 300;
                const width = window.innerWidth;
                const height = window.innerHeight;

                // Always spawn off-screen so they "swim into frame"
                if (startSide === 'left') { startX = -buffer; startY = Math.random() * height; targetX = width + buffer; targetY = Math.random() * height; }
                else if (startSide === 'right') { startX = width + buffer; startY = Math.random() * height; targetX = -buffer; targetY = Math.random() * height; }
                else if (startSide === 'top') { startX = Math.random() * width; startY = -buffer; targetX = Math.random() * width; targetY = height + buffer; }
                else { startX = Math.random() * width; startY = height + buffer; targetX = Math.random() * width; targetY = -buffer; }

                const dx = targetX - startX;
                const dy = targetY - startY;
                const angle = Math.atan2(dy, dx);
                const rotation = (angle * (180 / Math.PI)) + 90;

                const speed = 0.15;
                const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };

                return [...prev, {
                    id: Date.now() + Math.random(),
                    x: startX,
                    y: startY,
                    rotation: rotation,
                    targetX: targetX,
                    targetY: targetY,
                    velocity: velocity,
                    size: randomSize,
                    filter: randomFilter,
                }];
            });
        };

        // Initial Start: Wait 5-10 seconds before the first fish swims in
        const initialDelay = Math.random() * 5000 + 5000;
        setTimeout(() => spawnAmbientFish(), initialDelay);
        setTimeout(() => spawnAmbientFish(), initialDelay + 8000);

        let timeoutId: number;
        const scheduleNextSpawn = () => {
            const randomDelay = Math.random() * 20000 + 20000;
            timeoutId = setTimeout(() => {
                spawnAmbientFish();
                scheduleNextSpawn();
            }, randomDelay);
        };

        timeoutId = setTimeout(() => {
            scheduleNextSpawn();
        }, initialDelay + 10000);

        return () => clearTimeout(timeoutId);
    }, []);

    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined) {
            setFish(prevFish => prevFish.map(f => {
                const nextX = f.x + f.velocity.x;
                const nextY = f.y + f.velocity.y;

                const buffer = 400;
                if (nextX < -buffer || nextX > window.innerWidth + buffer || nextY < -buffer || nextY > window.innerHeight + buffer) {
                    return null;
                }
                return { ...f, x: nextX, y: nextY };
            }).filter(Boolean) as FishState[]);
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <style>{`
                @keyframes swimFlex {
                    0% { transform: skewY(0deg); }
                    25% { transform: skewY(2deg); }
                    75% { transform: skewY(-2deg); }
                    100% { transform: skewY(0deg); }
                }
            `}</style>

            {fish.map(f => (
                <div
                    key={f.id}
                    style={{
                        position: 'absolute',
                        left: f.x,
                        top: f.y,
                        width: `${250 * f.size}px`,
                        height: 'auto',
                        transform: `translate(-50%, -50%) rotate(${f.rotation}deg)`,
                        pointerEvents: 'none',
                        opacity: 0.85,
                    }}
                >
                    <img
                        src="/assets/koi-fish.png"
                        alt="Koi Fish"
                        style={{
                            width: '100%',
                            height: 'auto',
                            filter: f.filter,
                            animation: 'swimFlex 3s ease-in-out infinite'
                        }}
                    />
                </div>
            ))}
        </div>
    );
};
