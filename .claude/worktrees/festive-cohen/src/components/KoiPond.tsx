import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, X, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { haptics } from '../utils/haptics';
import { RippleLayer, type RippleLayerRef } from './RippleLayer';
import { STORAGE_KEYS } from '../constants/storageKeys';
// Fish removed per user request
// KoiFishSprite logic removed, using Processed Static Assets

interface KoiPondProps {
    isDarkMode: boolean;
    onClose: () => void;
}

// FishState Interface Removed

// Ripple Interface moved to RippleLayer



interface Lotus {
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    type: 'lotus' | 'lilypad';
    // Drift properties
    driftDirection: number;
    speed: number;
}

interface DriftingLotus {
    id: number;
    x: number;
    y: number;
    rotation: number;
    speed: number;
    delay: number;
    color: string;
    scale: number;
    opacity: number;
    driftDirection?: number;
}

interface Fish {
    id: number;
    x: number;
    y: number;
    angle: number;
    targetAngle: number;
    speed: number;
    variant: 'blackGold' | 'redOrange' | 'yellowOrange' | 'blackRed' | 'purpleGalaxy' | 'midnightBlue' | 'jadeDragon' | 'volcanic' | 'sunset' | 'royalAmethyst';
    scale: number;
    spawnTime?: number;
    isActive?: boolean;
    isEating?: boolean;
    eatTimer?: number;
    targetFoodId?: number | null;
}

interface FoodPellet {
    id: number;
    x: number;
    y: number;
    size: number;
    isClaimed?: boolean;
}



const KoiFishSVG: React.FC<{ variant: Fish['variant'] }> = React.memo(({ variant }) => {
    // Colors based on variant
    const getColors = () => {
        switch (variant) {
            // DARK & RICH VARIANTS (No White)
            case 'blackGold': return { body: '#111', accent: '#FFD700', pattern: 'grad' }; // Metallic Gold on Black
            case 'blackRed': return { body: '#0F0F0F', accent: '#D50000', pattern: 'spots' }; // Showa Style
            case 'midnightBlue': return { body: '#0D274D', accent: '#82B1FF', pattern: 'spots' }; // Deep Navy & Sky Blue
            case 'jadeDragon': return { body: '#004D40', accent: '#69F0AE', pattern: 'striped' }; // Dark Green & Mint
            case 'volcanic': return { body: '#212121', accent: '#FF3D00', pattern: 'striped' }; // Charcoal & Magma
            case 'royalAmethyst': return { body: '#311B92', accent: '#E040FB', pattern: 'grad' }; // Deep Purple & Neon Pink

            // VIBRANT VARIANTS
            case 'redOrange': return { body: '#DD2C00', accent: '#FFAB00', pattern: 'kohaku' }; // Deep Orange Base
            case 'yellowOrange': return { body: '#FF6F00', accent: '#FFD600', pattern: 'grad' }; // Amber Base
            case 'sunset': return { body: '#BF360C', accent: '#FF9E80', pattern: 'grad' }; // Burnt Sienna & Peach
            case 'purpleGalaxy': return { body: '#1A237E', accent: '#00E5FF', pattern: 'spots' }; // Indigo & Cyan

            default: return { body: '#111', accent: '#D50000', pattern: 'spots' };
        }
    };
    const { body, accent, pattern } = getColors();

    return (
        <svg width="60" height="90" viewBox="0 0 60 90" className="overflow-visible opacity-90">
            <g transform="translate(30, 45)">
                {/* Tail - CSS Animation */}
                <g style={{ animation: 'swimTail 2s ease-in-out infinite alternate', transformOrigin: '0 25px' }}>
                    <path d="M0,25 Q10,35 12,50 L0,45 L-12,50 Q-10,35 0,25" fill={body} opacity="0.9" />
                </g>

                {/* Left Fin - Independent Flutter */}
                <g style={{ animation: 'finFlutterLeft 3s ease-in-out infinite alternate', transformOrigin: '-12px 5px' }}>
                    <path d="M-12,0 Q-22,5 -25,15 Q-15,10 -12,5" fill={body} opacity="0.8" />
                </g>

                {/* Right Fin - Independent Flutter */}
                <g style={{ animation: 'finFlutterRight 3s ease-in-out infinite alternate', transformOrigin: '12px 5px', animationDelay: '0.2s' }}>
                    <path d="M12,0 Q22,5 25,15 Q15,10 12,5" fill={body} opacity="0.8" />
                </g>

                {/* Subtle Fin Ripples (Rings) */}
                <circle cx="-15" cy="8" r="8" fill="none" stroke="white" opacity="0.05" style={{ animation: 'finRingRipple 3s ease-out infinite' }} />
                <circle cx="15" cy="8" r="8" fill="none" stroke="white" opacity="0.05" style={{ animation: 'finRingRipple 3s ease-out infinite', animationDelay: '0.2s' }} />

                {/* Body */}
                <ellipse cx="0" cy="0" rx="12" ry="30" fill={body} />

                {/* Patterns */}
                {pattern === 'kohaku' && (
                    <g fill={accent} opacity="0.85">
                        {/* Large head patch */}
                        <path d="M-6,-25 Q0,-32 6,-25 Q8,-15 0,-12 Q-8,-15 -6,-25" />
                        {/* Body patches - more organic */}
                        <path d="M-8,0 Q0,-5 8,0 Q10,15 0,18 Q-10,15 -8,0" />
                        <circle cx="0" cy="8" r="4" />
                    </g>
                )}
                {pattern === 'tancho' && (
                    <circle cx="0" cy="-15" r="5" fill={accent} opacity="0.9" />
                )}
                {pattern === 'spots' && (
                    <g fill={accent} opacity="0.8">
                        <circle cx="-5" cy="-10" r="3" />
                        <circle cx="6" cy="5" r="4" />
                        <circle cx="-3" cy="18" r="2" />
                    </g>
                )}
                {pattern === 'striped' && (
                    <g stroke={accent} strokeWidth="3" opacity="0.8" strokeLinecap="round">
                        <path d="M-6,-15 L6,-15" />
                        <path d="M-9,0 L9,0" />
                        <path d="M-7,15 L7,15" />
                    </g>
                )}
                {pattern === 'grad' && (
                    <>
                        <circle cx="0" cy="-15" r="8" fill={accent} opacity="0.6" filter="blur(2px)" />
                        <circle cx="0" cy="10" r="6" fill={accent} opacity="0.4" filter="blur(2px)" />
                    </>
                )}
                {pattern === 'tux' && (
                    <g fill={accent} opacity="0.9">
                        <path d="M-4,-28 L4,-28 L0,-15 Z" />
                        <path d="M-2,20 L2,20 L0,30 Z" />
                    </g>
                )}


                {/* Eyes */}
                <circle cx="-6" cy="-22" r="1.5" fill="black" opacity="0.6" />
                <circle cx="6" cy="-22" r="1.5" fill="black" opacity="0.6" />
            </g>
        </svg>
    );
});



const KOI_VARIANTS: Fish['variant'][] = ['blackGold', 'redOrange', 'yellowOrange', 'blackRed', 'purpleGalaxy', 'midnightBlue', 'jadeDragon', 'volcanic', 'sunset', 'royalAmethyst'];

export const KoiPond: React.FC<KoiPondProps> = ({ isDarkMode, onClose }) => {


    // Fish State (Required for Mounting DOM Elements)
    const [fish, setFish] = useState<Fish[]>([]);
    // Removed showFish state usage in JSX if redundant, or keep if togglable
    const [showFish, setShowFish] = useState(true);

    // const [ripples, setRipples] = useState<Ripple[]>([]); // MOVED TO RIPPLE LAYER

    const [lotuses, setLotuses] = useState<Lotus[]>([]);
    const [driftingLotuses, setDriftingLotuses] = useState<DriftingLotus[]>([]);

    // PHYSICS REFS (Direct DOM Manipulation for 60fps)
    const fishRef = useRef<Fish[]>([]);
    const lotusesRef = useRef<Lotus[]>([]);
    const driftingLotusesRef = useRef<DriftingLotus[]>([]);
    // Ripples don't need physics refs usually, they just play css animation, but we use ref for timing

    // DOM NODE REFS
    const fishElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
    const lotusElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
    const driftingElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

    const rippleLayerRef = useRef<RippleLayerRef>(null);
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false); // Track mute state for async audio loops
    const [isLoaded, setIsLoaded] = useState(false); // For fade-in transition
    const lastTimeRef = useRef<number | undefined>(undefined);
    const requestRef = useRef<number | undefined>(undefined);
    const windowSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
    const tapsRef = useRef<{ x: number, y: number, time: number }[]>([]);
    const foodRef = useRef<FoodPellet[]>([]);
    const nextFoodIdRef = useRef(0);

    // Cache window size on resize
    useEffect(() => {
        const handleResize = () => {
            windowSizeRef.current = { width: window.innerWidth, height: window.innerHeight };
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Customization State
    const [showLilyPads, setShowLilyPads] = useState(true);
    const [showLotus, setShowLotus] = useState(true);
    const [showBabyLotus, setShowBabyLotus] = useState(true);
    const [showRain, setShowRain] = useState(false); // Rain Toggle
    const [showParticles, setShowParticles] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.ENHANCEMENTS);
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.natureParticles ?? false;
        }
        return false;
    });
    const [showFeeding, setShowFeeding] = useState(true);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Particle System Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Record<string, unknown>[]>([]);
    const gravityRef = useRef({ x: 0, y: 1 }); // Default gravity (down)

    // Listen for orientation changes to simulate gravity
    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null && e.beta !== null) {
                // gamma is left/right tilt [-90, 90]
                // beta is front/back tilt [-180, 180]
                const gx = e.gamma / 45; // Normalize to approx [-2, 2]
                const gy = Math.max(0.5, e.beta / 45); // Normalize to approx [0.5, 4], ensure always falls down
                gravityRef.current = { x: gx, y: gy };
            }
        };

        if (window.DeviceOrientationEvent && (window as Record<string, unknown>).DeviceMotionEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    // Ripple Helper
    const addRipple = useCallback((x: number, y: number) => {
        rippleLayerRef.current?.addRipple(x, y);
    }, []);

    const bgClass = 'bg-sage-mid'; // Consistent with app aesthetic

    // Sync ripples to ref for animation loop - REMOVED (Handled in layer)
    /*
    useEffect(() => {
        ripplesRef.current = ripples;
    }, [ripples]);
    */

    // Transition Effect: Fade in after mount (3 seconds)
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        // Keep screen awake while pond is active
        KeepAwake.keepAwake().catch(console.error);

        return () => {
            clearTimeout(timer);
        };
    }, []);


    // Initialize Static Elements (Lotus & Petals)
    useEffect(() => {
        // Spawn 8 Lotus Flowers/Pads (Foreground) - Spread out
        const lotusCount = 8;
        const newLotuses: Lotus[] = [];

        // Define quadrants to ensure spread
        const quadrants = [
            { x: 0, y: 0 }, { x: window.innerWidth / 2, y: 0 },
            { x: 0, y: window.innerHeight / 2 }, { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        ];

        for (let i = 0; i < lotusCount; i++) {
            const quad = quadrants[i % 4];
            const qW = window.innerWidth / 2;
            const qH = window.innerHeight / 2;

            newLotuses.push({
                id: i,
                // Random pos within quadrant with padding
                x: quad.x + (Math.random() * (qW - 100) + 50),
                y: quad.y + (Math.random() * (qH - 100) + 50),
                scale: 0.8 + Math.random() * 0.4,
                rotation: Math.random() * 360,
                type: i % 2 === 0 ? 'lotus' : 'lilypad', // Force 50/50 split
                // Drift props
                driftDirection: Math.random() * Math.PI * 2,
                speed: (0.1 + Math.random() * 0.2) * 0.3 // Reduced by 70% per request
            });
        }

        setLotuses(newLotuses);
        lotusesRef.current = newLotuses; // Sync Ref
    }, []);

    useEffect(() => {
        const count = 12;
        const colors = ['#EF5350', '#E57373', '#FF7043', '#FF8A65']; // Red and Orange shades

        const newDrifting: DriftingLotus[] = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight, // Initial random position
            rotation: Math.random() * 360,
            speed: (0.2 + Math.random() * 0.3) * 0.3, // Reduced by 70%
            delay: Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            scale: 0.6 + Math.random() * 0.3, // Larger scale for visibility (0.6 - 0.9)
            opacity: 0.8 + Math.random() * 0.2,
            driftDirection: Math.random() * Math.PI * 2 // Random direction
        }));
        setDriftingLotuses(newDrifting);
        driftingLotusesRef.current = newDrifting; // Sync Ref
    }, []);

    // Initialize Particles
    useEffect(() => {
        if (!showParticles) {
            particlesRef.current = [];
            return;
        }

        const count = 40;
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * -window.innerHeight,
            size: 5 + Math.random() * 8,
            speed: 0.2 + Math.random() * 0.4, // Reduced speed further for ethereal feel
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 1.0, // Slower rotation
            wiggle: Math.random() * Math.PI,
            wiggleSpeed: 0.005 + Math.random() * 0.01, // Slower wiggle
            color: `rgba(255, ${180 + Math.random() * 40}, ${190 + Math.random() * 40}, ${0.6 + Math.random() * 0.3})`
        }));
    }, [showParticles]);


    // 1. Spawning Logic REMOVED (No Fish)
    /*
    useEffect(() => {
        const spawnFish = (forceOnScreen = false) => {
            setFish(prev => {
                // ... logic removed ...
                return prev;
            });
        };
        // ...
    }, []); 
    */


    // Initialize Specific Koi Fish - STAGGERED SPAWN
    // Initialize Specific Koi Fish - STAGGERED SPAWN
    // Initialize Specific Koi Fish - STAGGERED SPAWN
    // Initialize Specific Koi Fish - STAGGERED SPAWN
    useEffect(() => {
        setFish([]); // Start empty

        // Select 7 random variants
        const selectedVariants: Fish['variant'][] = Array.from({ length: 7 }, () => KOI_VARIANTS[Math.floor(Math.random() * KOI_VARIANTS.length)]);

        // Create all fish immediately but set their 'active' status or spawn time
        const newFish = selectedVariants.map((variant, i) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.max(window.innerWidth, window.innerHeight) * 0.8;
            const startX = (window.innerWidth / 2) - Math.cos(angle) * radius;
            const startY = (window.innerHeight / 2) - Math.sin(angle) * radius;

            // Point towards center
            const angleToCenter = Math.atan2((window.innerHeight / 2) - startY, (window.innerWidth / 2) - startX);

            return {
                id: i,
                x: startX,
                y: startY,
                angle: angleToCenter,
                targetAngle: angleToCenter,
                // SPEED: Reduced by another ~20% (Range 0.8 - 2.0)
                speed: 0.8 + Math.random() * 1.2,
                variant: variant,
                // SCALE: Reduced by 15% (Range ~1.28 - 2.3)
                scale: 1.275 + Math.random() * 1.02,
                spawnTime: i * 2000, // Stagger 2s
                isActive: false
            };
        });

        setFish(newFish);
        fishRef.current = newFish;

    }, []);

    // Animation Loop
    const lastRippleTimeRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    const animate = (time: number) => {
        if (startTimeRef.current === null) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;

        if (lastTimeRef.current !== undefined) {
            const delta = time - lastTimeRef.current;
            // Cap delta to prevent huge jumps if tab was inactive (e.g. max 50ms)
            const dt = Math.min(delta, 50) / 16.67;

            // 1. Update Fish (Direct Manipulation)
            fishRef.current.forEach(f => {
                // Check Spawn Activation
                if (!f.isActive && f.spawnTime !== undefined) {
                    if (elapsed > f.spawnTime) {
                        f.isActive = true;
                    } else {
                        return; // Don't process or show yet
                    }
                }

                let { x, y, angle, targetAngle } = f;
                const speed = f.speed;

                // Move
                const moveSpeed = speed * dt;

                // --- Repulsion Logic ---
                // Clean up old taps (older than 1 second)
                const now_time = performance.now();
                tapsRef.current = tapsRef.current.filter(t => now_time - t.time < 1000);

                let repulsionAngle = 0;
                let repulsionStrength = 0;
                const REPULSION_RADIUS = 200;

                tapsRef.current.forEach(tap => {
                    const dx = x - tap.x;
                    const dy = y - tap.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < REPULSION_RADIUS * REPULSION_RADIUS) {
                        const dist = Math.sqrt(distSq);
                        const force = (1 - dist / REPULSION_RADIUS) * 0.1; // Gentle force
                        const angleToTap = Math.atan2(dy, dx);

                        // Add steering away from tap
                        repulsionAngle = angleToTap;
                        repulsionStrength = Math.max(repulsionStrength, force);
                    }
                });

                if (repulsionStrength > 0) {
                    // Gently rotate towards the repulsion angle
                    let angleDiff = repulsionAngle - angle;
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    angle += angleDiff * repulsionStrength * dt;

                    // Slight speed boost when repelled
                    x += Math.cos(angle) * (moveSpeed + repulsionStrength * 5 * dt);
                    y += Math.sin(angle) * (moveSpeed + repulsionStrength * 5 * dt);
                } else {
                    // --- Food Attraction Logic (Calm & Natural) ---
                    // Reset target if it no longer exists
                    if (f.targetFoodId !== null && f.targetFoodId !== undefined) {
                        if (!foodRef.current.some(p => p.id === f.targetFoodId)) {
                            f.targetFoodId = null;
                        }
                    }

                    // Find a target if we don't have one
                    if (f.targetFoodId === null || f.targetFoodId === undefined) {
                        let closestAvailableFood: FoodPellet | null = null;
                        let minDist = 300; // Scent range

                        (foodRef.current as FoodPellet[]).forEach(pellet => {
                            if (pellet.isClaimed) return; // No fighting!
                            const dx = pellet.x - x;
                            const dy = pellet.y - y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < minDist) {
                                minDist = dist;
                                closestAvailableFood = pellet;
                            }
                        });

                        if (closestAvailableFood) {
                            f.targetFoodId = (closestAvailableFood as FoodPellet).id;
                            (closestAvailableFood as FoodPellet).isClaimed = true;
                        }
                    }

                    // Move towards target if we have one
                    if (f.targetFoodId !== null && f.targetFoodId !== undefined) {
                        const targetFood = (foodRef.current as FoodPellet[]).find(p => p.id === f.targetFoodId);
                        if (targetFood) {
                            const dx = targetFood.x - x;
                            const dy = targetFood.y - y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const angleToFood = Math.atan2(dy, dx);

                            let angleDiff = angleToFood - angle;
                            while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                            // 1. Smooth Steering: Use a smaller factor (0.05 instead of 0.1) for graceful turns
                            angle += angleDiff * 0.05 * dt;

                            // 2. Gentle Approach: Slow down as we get closer (Tranquil, not rushed)
                            // Ease in speed from 100% at distance 150 to ~30% at distance 20
                            const approachFactor = Math.max(0.3, Math.min(1.0, dist / 150));
                            const finalMoveSpeed = moveSpeed * approachFactor;

                            x += Math.cos(angle) * finalMoveSpeed;
                            y += Math.sin(angle) * finalMoveSpeed;

                            // "Eating" detection
                            if (dist < 15) {
                                f.isEating = true;
                                f.eatTimer = 12; // Shorter, more immediate wiggle
                                f.targetFoodId = null;
                                foodRef.current = (foodRef.current as FoodPellet[]).filter(p => p.id !== targetFood.id);
                                haptics.light();

                                // Reset momentum slightly during eating for a "pause" feel
                                f.speed = Math.max(0.5, f.speed * 0.8);
                            }
                        } else {
                            f.targetFoodId = null;
                            x += Math.cos(angle) * moveSpeed;
                            y += Math.sin(angle) * moveSpeed;
                        }
                    } else {
                        // Normal wandering
                        x += Math.cos(angle) * moveSpeed;
                        y += Math.sin(angle) * moveSpeed;
                    }

                    if (f.isEating && f.eatTimer && f.eatTimer > 0) {
                        // Much more subtle wiggle, no delay
                        angle += Math.sin(time * 0.15) * 0.04;
                        f.eatTimer -= 1;
                        if (f.eatTimer <= 0) {
                            f.isEating = false;
                            // Restore speed gradually after wiggle
                            f.speed = f.speed + (1.2 - f.speed) * 0.1;
                        }
                    }
                }

                // --- Normal Wall/Straight Logic ---
                // Reduced margin to keep them closer to screen
                const margin = 200;
                const { width, height } = windowSizeRef.current;
                const isOffScreen = x < -margin || x > width + margin || y < -margin || y > height + margin;

                if (isOffScreen) {
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const angleToCenter = Math.atan2(centerY - y, centerX - x);
                    targetAngle = angleToCenter + (Math.sin(time * 0.001 + f.id) * 0.5);
                    let angleDiff = targetAngle - angle;
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    angle += angleDiff * 0.05 * dt;
                }

                // Update Data Object
                f.x = x;
                f.y = y;
                f.angle = angle;
                f.targetAngle = targetAngle;

                // Update DOM Direct
                const el = fishElementsRef.current.get(f.id);
                if (el) {
                    // Start visible only if active
                    el.style.opacity = '1';
                    el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotate(${angle * (180 / Math.PI) + 90}deg) scale(${f.scale})`;
                }
            });

            // 2. Update Drifting Baby Lotuses - FLOW DOWN
            driftingLotusesRef.current.forEach(l => {
                // Flow down (Positive Y) with slight sine wave on X
                let nx = l.x + Math.sin(time * 0.0005 + l.id) * 0.2 * dt;
                let ny = l.y + (l.speed * 0.8) * dt; // Consistent down flow

                // Wrap
                if (ny > windowSizeRef.current.height + 50) {
                    ny = -50;
                    nx = Math.random() * windowSizeRef.current.width;
                }

                l.x = nx;
                l.y = ny;

                const el = driftingElementsRef.current.get(l.id);
                if (el) {
                    el.style.transform = `translate3d(${nx}px, ${ny}px, 0) rotate(${l.rotation}deg) scale(${l.scale})`;
                }
            });

            // 3. Update MAIN Foreground Lotuses & Lily Pads - FLOW DOWN
            lotusesRef.current.forEach(l => {
                // Flow down but VERY slow with a gentle side-to-side sway
                let nx = l.x + Math.sin(time * 0.0003 + l.id) * 0.15 * dt;
                let ny = l.y + (l.speed * 0.4) * dt;

                // Wrap
                if (ny > windowSizeRef.current.height + 60) {
                    ny = -60;
                    nx = Math.random() * windowSizeRef.current.width;
                }
                if (nx > windowSizeRef.current.width + 60) nx = -60;
                if (nx < -60) nx = windowSizeRef.current.width + 60;

                l.x = nx;
                l.y = ny;

                const el = lotusElementsRef.current.get(l.id);
                if (el) {
                    el.style.transform = `translate3d(${nx}px, ${ny}px, 0) rotate(${l.rotation + Math.sin(time * 0.0001 + l.id) * 5}deg) scale(${l.scale})`;
                }
            });

            // 4. Update Sakura Particles (Canvas)
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    // Draw Food Pellets (Pale Gold)
                    foodRef.current.forEach(p => {
                        ctx.save();
                        // Glow effect
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = 'rgba(229, 214, 167, 0.6)';
                        ctx.fillStyle = '#E5D6A7'; // Pale Gold
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();

                        // Core shine
                        ctx.fillStyle = '#FFFFFF';
                        ctx.globalAlpha = 0.4;
                        ctx.beginPath();
                        ctx.arc(p.x - p.size * 0.2, p.y - p.size * 0.2, p.size * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    });

                    if (showParticles) {
                        const gx = gravityRef.current.x;
                        const gy = gravityRef.current.y;
                        const { width: winW, height: winH } = windowSizeRef.current;

                        particlesRef.current.forEach(p => {
                            p.wiggle += p.wiggleSpeed;
                            p.x += (Math.sin(p.wiggle) * 0.5 + gx) * dt;
                            p.y += (p.speed * gy) * dt;
                            p.rotation += p.rotSpeed * dt;

                            if (p.y > winH + 20) {
                                p.y = -20;
                                p.x = Math.random() * winW;
                            }
                            if (p.x > winW + 20) p.x = -20;
                            if (p.x < -20) p.x = winW + 20;

                            ctx.save();
                            ctx.translate(p.x, p.y);
                            ctx.rotate(p.rotation * Math.PI / 180);

                            // Draw Sakura Petal
                            ctx.beginPath();
                            ctx.fillStyle = p.color;
                            ctx.moveTo(0, 0);
                            ctx.bezierCurveTo(p.size, -p.size, p.size * 2, p.size, 0, p.size * 1.5);
                            ctx.bezierCurveTo(-p.size * 2, p.size, -p.size, -p.size, 0, 0);
                            ctx.fill();

                            ctx.restore();
                        });
                    }
                }
            }

            // Ripple Spawning logic (Rain)
            if (showRain && time - lastRippleTimeRef.current > 400) {
                addRipple(Math.random() * windowSizeRef.current.width, Math.random() * windowSizeRef.current.height);
                lastRippleTimeRef.current = time; // Ensure update
            }
        }

        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showRain]); // Depend on showRain to restart if toggled, or keep Ref updated

    // 3. Dual-Audio Crossfade Logic
    const audio1Ref = useRef<HTMLAudioElement | null>(null);
    const audio2Ref = useRef<HTMLAudioElement | null>(null);
    const activeAudioRef = useRef<1 | 2>(1);
    const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const CROSSFADE_DURATION = 5000; // 5 seconds
    const TARGET_VOLUME = 0.12; // Reduced by half again (subtle)

    type AudioWithFade = HTMLAudioElement & { _fadeInterval?: ReturnType<typeof setInterval> | null };

    const fadeAudio = (audio: HTMLAudioElement, startVol: number, endVol: number, duration: number) => {
        // Clear any existing fade intervals on this audio object to prevent overlap
        const audioEx = audio as AudioWithFade;
        if (audioEx._fadeInterval) {
            clearInterval(audioEx._fadeInterval);
        }

        const steps = 20;
        const stepTime = duration / steps;
        const volStep = (endVol - startVol) / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVol = startVol + (volStep * currentStep);

            // Sync muted state from Ref in every step
            audio.muted = isMutedRef.current;

            // Clamp volume between 0 and 1
            // FORCE ZERO if muted - user reports "lower but still there" which suggests
            // some tracks might not be respecting the muted property alone.
            audio.volume = isMutedRef.current ? 0 : Math.max(0, Math.min(1, newVol));

            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                audioEx._fadeInterval = null;
                if (endVol === 0) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        }, stepTime);

        audioEx._fadeInterval = fadeInterval;
    };

    const startCrossfadeLoop = () => {
        if (!audio1Ref.current || !audio2Ref.current) return;

        const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
        const nextAudio = activeAudioRef.current === 1 ? audio2Ref.current : audio1Ref.current;

        // Ensure next audio is ready and reset
        nextAudio.currentTime = 0;
        nextAudio.volume = 0; // Start silent

        // Play next audio (fade in)
        nextAudio.muted = isMutedRef.current; // Sync mute state
        nextAudio.play().catch(e => console.error("Audio play failed", e));
        fadeAudio(nextAudio, 0, TARGET_VOLUME, CROSSFADE_DURATION); // Fade IN

        // Fade OUT current audio
        fadeAudio(currentAudio, TARGET_VOLUME, 0, CROSSFADE_DURATION);

        // Swap active reference
        activeAudioRef.current = activeAudioRef.current === 1 ? 2 : 1;

        // Schedule NEXT crossfade
        // We know the duration from metadata. Using 30s as fallback if undefined, but ideally dynamic.
        const duration = nextAudio.duration || 30; // seconds
        const nextCrossfadeDelay = (duration * 1000) - CROSSFADE_DURATION;

        crossfadeTimerRef.current = setTimeout(startCrossfadeLoop, nextCrossfadeDelay);
    };

    useEffect(() => {
        // Initialize Audio Objects
        audio1Ref.current = new Audio('/sounds/sounds-of-zen.mp3');
        audio2Ref.current = new Audio('/sounds/sounds-of-zen.mp3');

        // Initial Play (Audio 1)
        const audio1 = audio1Ref.current;
        if (audio1) {
            audio1.volume = 0; // Start silent
            const playPromise = audio1.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Initial Fade In
                    audio1.muted = isMutedRef.current;
                    fadeAudio(audio1, 0, TARGET_VOLUME, 3000);

                    // Schedule first crossfade
                    // Wait for metadata to ensure we have duration
                    if (audio1.duration) {
                        const duration = audio1.duration;
                        const delay = (duration * 1000) - CROSSFADE_DURATION;
                        crossfadeTimerRef.current = setTimeout(startCrossfadeLoop, delay);
                    } else {
                        audio1.onloadedmetadata = () => {
                            const duration = audio1.duration;
                            const delay = (duration * 1000) - CROSSFADE_DURATION;
                            crossfadeTimerRef.current = setTimeout(startCrossfadeLoop, delay);
                        };
                    }
                }).catch(() => {
                });
            }
        }

        return () => {
            if (audio1Ref.current) { audio1Ref.current.pause(); audio1Ref.current = null; }
            if (audio2Ref.current) { audio2Ref.current.pause(); audio2Ref.current = null; }
            if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleMute = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !isMutedRef.current;
        setIsMuted(newState);
        isMutedRef.current = newState;
        haptics.selection(); // Visual/Tactile feedback for toggle

        type AudioWithFadeRef = HTMLAudioElement & { _fadeInterval?: ReturnType<typeof setInterval> | null };
        // Mute/Unmute BOTH tracks directly
        if (audio1Ref.current) {
            audio1Ref.current.muted = newState;
            if (newState) audio1Ref.current.volume = 0;
            else if (!(audio1Ref.current as AudioWithFadeRef)._fadeInterval) {
                // If not currently fading, restore target volume
                audio1Ref.current.volume = TARGET_VOLUME;
            }
        }
        if (audio2Ref.current) {
            audio2Ref.current.muted = newState;
            if (newState) audio2Ref.current.volume = 0;
            else if (!(audio2Ref.current as AudioWithFadeRef)._fadeInterval) {
                // If not currently fading, restore target volume
                audio2Ref.current.volume = TARGET_VOLUME;
            }
        }
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        haptics.light();
        const touches = e.touches;

        if (showFeeding && touches.length === 1) {
            // Drop food
            const x = touches[0].clientX;
            const y = touches[0].clientY;
            foodRef.current.push({
                id: nextFoodIdRef.current++,
                x,
                y,
                size: 3 + Math.random() * 2
            });
            // Also add a small ripple for visual feedback
            addRipple(x, y);
        } else {
            // Repel fish (Classic interaction)
            // Add ripples for all active fingers
            const now = performance.now();
            for (let i = 0; i < touches.length; i++) {
                const x = touches[i].clientX;
                const y = touches[i].clientY;
                addRipple(x, y);
                tapsRef.current.push({ x, y, time: now });
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click

        const x = e.clientX;
        const y = e.clientY;

        if (showFeeding) {
            // Drop food
            foodRef.current.push({
                id: nextFoodIdRef.current++,
                x,
                y,
                size: 3 + Math.random() * 2
            });
        }

        // Always add ripple and repulsion for mouse/single-tap feedback
        addRipple(x, y);
        tapsRef.current.push({ x, y, time: performance.now() });
    };

    // Rain Logic
    useEffect(() => {
        if (!showRain) return;

        const interval = setInterval(() => {
            // Random chance for rain drop (sporadic)
            if (Math.random() < 0.3) {
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                addRipple(x, y);
            }
        }, 100); // Check every 100ms

        return () => clearInterval(interval);
    }, [showRain, addRipple]);



    return (
        // Wrapper starts Black, transitions content opacity
        <div
            className="fixed inset-0 z-50 bg-[#3A1700] transition-colors duration-[3000ms] overflow-hidden cursor-pointer"
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
        >

            {/* Main Content Container - Fades In (3 seconds) */}
            <div className={`absolute inset-0 transition-opacity duration-[3000ms] ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${bgClass}`}>

                {/* Animation Styles */}
                <style>{`
                    @keyframes swimFlex {
                        0% { transform: rotate(0deg) skewY(0deg); }
                        25% { transform: rotate(3deg) skewY(2deg); } 
                        75% { transform: rotate(-3deg) skewY(-2deg); }
                        100% { transform: rotate(0deg) skewY(0deg); }
                    }
                    @keyframes swimTail {
                         0% { transform: rotate(15deg); }
                         100% { transform: rotate(-15deg); }
                    }
                    @keyframes paddleFins {
                         0% { transform: rotate(5deg); }
                         100% { transform: rotate(-5deg); }
                    }
                    @keyframes finFlutterLeft {
                        0% { transform: rotate(0deg); } /* Flat against body */
                        100% { transform: rotate(35deg); } /* Extended out */
                    }
                    @keyframes finFlutterRight {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(-35deg); }
                    }
                    @keyframes finRingRipple {
                        0% { transform: scale(0.5); opacity: 0.08; stroke-width: 2; }
                        100% { transform: scale(2.5); opacity: 0; stroke-width: 0; }
                    }
                    @keyframes ripple {
                        0% { transform: scale(0); opacity: 0.5; }
                        100% { transform: scale(4); opacity: 0; }
                    }
                    @keyframes floatLilyPad {
                        0% { transform: translate(0, 0) rotate(0deg) scale(1); }
                        33% { transform: translate(5px, -10px) rotate(2deg) scale(1.02); }
                        66% { transform: translate(-8px, 5px) rotate(-2deg) scale(0.98); }
                        100% { transform: translate(0, 0) rotate(0deg) scale(1); }
                    }
                `}</style>

                {/* 0. Background Circles Layer (Logo ONLY) */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-100 z-0 flex items-center justify-center">
                    {/* Logo */}
                    {/* Logo */}
                    <div
                        className="absolute w-[8vmin] h-[8vmin] opacity-25 z-10 text-pale-gold animate-pulse-slow"
                    >
                        <div className="w-full h-full bg-pale-gold" style={{ maskImage: `url(/logo-gold.png)`, WebkitMaskImage: `url(/logo-gold.png)`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
                    </div>
                </div>

                {/* 0.5 AMBIENT RIPPLES - Gentle current from top to bottom (Z-2) */}
                <div className="absolute inset-0 pointer-events-none z-[2] opacity-30 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-white/20"
                            style={{
                                left: `${20 + i * 30}%`,
                                top: '-20%',
                                width: '60vw',
                                height: '20vh',
                                animation: `ambientRippleDrift ${15 + i * 5}s linear infinite`,
                                animationDelay: `${i * 3}s`
                            }}
                        />
                    ))}
                    <style>{`
                        @keyframes ambientRippleDrift {
                            0% { transform: translateY(0) scale(1); opacity: 0; }
                            10% { opacity: 0.3; }
                            90% { opacity: 0.3; }
                            100% { transform: translateY(120vh) scale(1.5); opacity: 0; }
                        }
                    `}</style>
                </div>

                {/* 1. Fish Layer (Z-5) - Moved OUT of Background Layer context */}
                {showFish && fish.map(f => (
                    <div
                        key={f.id}
                        ref={el => {
                            if (el) fishElementsRef.current.set(f.id, el);
                            else fishElementsRef.current.delete(f.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            // Use transform for initial positioning (offscreen) to match Physics loop
                            transform: `translate(-50%, -50%) translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.angle * (180 / Math.PI) + 90}deg) scale(${f.scale})`,
                            opacity: 0, // Start invisible, fade in via loop or transition
                            zIndex: 5,
                            pointerEvents: 'none',
                            // remove transition to prevent fighting with JS loop
                            transition: 'opacity 0.5s ease-in-out',
                            filter: 'drop-shadow(8px 16px 16px rgba(0,0,0,0.5))'
                        }}
                    >
                        <KoiFishSVG variant={f.variant} />
                    </div>
                ))}

                {/* 2. Lily Pads Layer (Background Images) - NOW SIBLING Z-10 */}
                {/* This fixes the stacking context issue. Now Z-10 > Z-5 definitively. */}
                {showLilyPads && (
                    <div className="absolute inset-0 opacity-80 z-[10] pointer-events-none transition-opacity duration-1000" style={{ filter: 'drop-shadow(15px 15px 10px rgba(0,0,0,0.4))' }}>
                        {/* Top Right */}
                        <div className={`absolute top-0 right-0 w-[80vmin] h-[80vmin] translate-x-1/3 -translate-y-1/3 rotate-12`}>
                            <img src="/assets/lily-pads.png" alt="" className="w-full h-full object-contain" style={{ animation: 'floatLilyPad 25s ease-in-out infinite' }} />
                        </div>
                        {/* Bottom Left */}
                        <div className={`absolute bottom-0 left-0 w-[65vmin] h-[65vmin]-translate-x-1/3 translate-y-1/3 -rotate-45`}>
                            <img src="/assets/lily-pads.png" alt="" className="w-full h-full object-contain" style={{ animation: 'floatLilyPad 30s ease-in-out infinite reverse' }} />
                        </div>
                        {/* Center */}
                        <div className={`absolute top-1/2 left-1/2 w-[50vmin] h-[50vmin]-translate-x-1/2 -translate-y-1/2 rotate-180`}>
                            <img src="/assets/lily-pads.png" alt="" className="w-full h-full object-contain" style={{ animation: 'floatLilyPad 35s ease-in-out infinite' }} />
                        </div>
                    </div>
                )}


                {/* 3. Ripples (Surface - Z-20) */}
                <RippleLayer ref={rippleLayerRef} isDarkMode={isDarkMode} />

                {/* 4. Drifting Baby Lotus (Z-15) */}
                {showBabyLotus && driftingLotuses.map(l => (
                    <div
                        key={l.id}
                        ref={el => {
                            if (el) driftingElementsRef.current.set(l.id, el);
                            else driftingElementsRef.current.delete(l.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: l.x,
                            top: l.y,
                            transform: `translate(-50%, -50%) rotate(${l.rotation}deg) scale(${l.scale})`,
                            opacity: l.opacity * 0.9,
                            pointerEvents: 'none',
                            zIndex: 15,
                            transition: 'opacity 1s ease-in-out',
                            // Enhanced Shadow
                            filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))'
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 100 100" className="opacity-90 overflow-visible">
                            <g transform="translate(50,50)">
                                {/* Petals */}
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                    <g key={deg} transform={`rotate(${deg})`}>
                                        <path d="M0,0 Q15,-20 0,-40 Q-15,-20 0,0" fill={l.color} />
                                        <path d="M0,0 Q10,-15 0,-30 Q-10,-15 0,0" fill={l.color} style={{ filter: 'brightness(1.1)' }} />
                                    </g>
                                ))}
                                <circle cx="0" cy="0" r="12" fill="#FFEB3B" />
                                <circle cx="0" cy="0" r="8" fill="#FBC02D" />
                            </g>
                        </svg>
                    </div>
                ))}

                {/* 5. Generated Lily Pads (Z-10) */}
                {showLilyPads && lotuses.filter(l => l.type === 'lilypad').map(l => (
                    <div
                        key={l.id}
                        style={{
                            position: 'absolute',
                            left: l.x,
                            top: l.y,
                            transform: `translate(-50%, -50%) rotate(${l.rotation}deg) scale(${l.scale})`,
                            opacity: 0.85,
                            zIndex: 10,
                            // Enhanced Shadow
                            filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))'
                        }}
                    >
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M30 5C30 5 55 5 55 30C55 55 30 55 30 55C30 55 5 55 5 30C5 20 10 10 18 8L30 30L30 5Z" fill="#8BA888" />
                        </svg>
                    </div>
                ))}

                {/* 3. Lotus Layer (Foreground) */}
                {showLotus && lotuses.filter(l => l.type === 'lotus').map(l => (
                    <div
                        key={l.id}
                        ref={el => {
                            if (el) lotusElementsRef.current.set(l.id, el);
                            else lotusElementsRef.current.delete(l.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: l.x,
                            top: l.y,
                            transform: `translate(-50%, -50%) rotate(${l.rotation}deg) scale(${l.scale})`,
                            opacity: 0.95,
                            zIndex: 20,
                            filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.08))'
                        }}
                    >
                        <svg width="80" height="80" viewBox="0 0 100 100" className="overflow-visible">
                            <g transform="translate(50,50)">
                                {/* Petals */}
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                    <g key={deg} transform={`rotate(${deg})`}>
                                        <path d="M0,0 Q20,-25 0,-45 Q-20,-25 0,0" fill={isDarkMode ? "#E8D5B5" : "#F48FB1"} fillOpacity="0.95" />
                                        <path d="M0,0 Q12,-18 0,-35 Q-12,-18 0,0" fill={isDarkMode ? "#D4B896" : "#F06292"} fillOpacity="0.85" />
                                    </g>
                                ))}
                                <circle cx="0" cy="0" r="14" fill="#FFE082" />
                                <circle cx="0" cy="0" r="10" fill="#FFC107" />
                            </g>
                        </svg>
                    </div>
                ))}

                {/* 6. Sakura Particles & Food Canvas (Z-4) */}
                {/* Moved Z-index below fish (Z-5) and lotuses (Z-10) */}
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className={`absolute inset-0 pointer-events-none z-[4] transition-opacity duration-1000 ${showParticles ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            {/* Controls */}
            {/* Zen Mode Toggle (Always Visible but Discrete) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowControls(!showControls);
                    haptics.light();
                }}
                className={`fixed bottom-8 left-8 z-50 p-2 rounded-full transition-all duration-500 pointer-events-auto ${showControls
                    ? 'opacity-0 pointer-events-none'
                    : isDarkMode ? 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10' : 'bg-sage/5 text-sage/40 hover:text-sage hover:bg-sage/10'
                    }`}
            >
                <Eye size={20} />
            </button>

            {/* Top Control Bar */}
            <div
                className={`fixed bottom-12 left-1/2 -translate-x-1/2 p-2 px-4 rounded-full bg-[#3A1700]/20 backdrop-blur-md z-50 flex gap-4 transition-all duration-500 transform pointer-events-auto ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
                        className={`p-1.5 rounded-full transition-all duration-300 ${isSettingsOpen
                            ? isDarkMode ? 'bg-white/20 text-white' : 'bg-sage/20 text-sage'
                            : isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                            }`}
                        aria-label="Customize Pond"
                    >
                        <Settings size={14} />
                    </button>
                    {/* Centered Dropdown - Opens Upwards */}
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 rounded-2xl border backdrop-blur-xl transition-all duration-300 origin-bottom overflow-hidden ${isSettingsOpen
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95 pointer-events-none'
                        } ${isDarkMode ? 'bg-sage-mid/90 border-white/10' : 'bg-white/90 border-sage/10'}`}>
                        <div className="p-2 space-y-1 text-left">
                            {[
                                { label: 'Fish', state: showFish, setter: setShowFish },
                                { label: 'Lily Pads', state: showLilyPads, setter: setShowLilyPads },
                                { label: 'Lotus', state: showLotus, setter: setShowLotus },
                                { label: 'Baby Lotus', state: showBabyLotus, setter: setShowBabyLotus },
                                {
                                    label: 'Nature Particles', state: showParticles, setter: (val: boolean) => {
                                        setShowParticles(val);
                                        // Also sync to global enhancements
                                        const saved = localStorage.getItem(STORAGE_KEYS.ENHANCEMENTS);
                                        if (saved) {
                                            const parsed = JSON.parse(saved);
                                            parsed.natureParticles = val;
                                            localStorage.setItem(STORAGE_KEYS.ENHANCEMENTS, JSON.stringify(parsed));
                                            window.dispatchEvent(new Event('storage'));
                                        }
                                    }
                                },
                                { label: 'Gentle Rain', state: showRain, setter: setShowRain },
                                { label: 'Feed your fish', state: showFeeding, setter: setShowFeeding },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={(e) => { e.stopPropagation(); item.setter(!item.state); }}
                                    className={`w-full px-4 py-2 rounded-xl flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'
                                        }`}
                                >
                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                        {item.label}
                                    </span>
                                    <div className={`w-6 h-4 rounded-full relative transition-colors ${item.state
                                        ? isDarkMode ? 'bg-pale-gold' : 'bg-sage'
                                        : isDarkMode ? 'bg-white/20' : 'bg-[#3A1700]/10'
                                        }`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${item.state ? 'translate-x-2' : 'translate-x-0'
                                            }`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={toggleMute}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowControls(false); // Hide controls instead of close
                        haptics.light();
                    }}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    title="Hide UI (Zen Mode)"
                >
                    <EyeOff size={14} />
                </button>

                <button
                    onClick={onClose}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }`}
                    aria-label="Close Koi Pond"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Controls Text Only */}
            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className={`text-2xl font-display font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    Koi Pond
                </h1>
                <p className={`text-sm mt-1 mb-3 ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                    Observe and relax
                </p>
            </div>
        </div>
    );
};
