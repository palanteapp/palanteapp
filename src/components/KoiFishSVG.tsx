import React from 'react';

interface KoiFishSVGProps {
    variant: 'black' | 'calico' | 'gold' | 'white' | 'standard';
    customColor?: string; // Hex or HSL for unique coloration
    tailPhase?: number;
}

const KoiFishSVG: React.FC<KoiFishSVGProps> = ({ variant, customColor }) => {
    // Defines standard palette but we'll use gradients/patterns mostly
    const isCalico = variant === 'calico';
    const isGold = variant === 'gold';
    const isBlack = variant === 'black';

    return (
        <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible">
            <defs>
                {/* 1. Scale Pattern (Subtle overlay) */}
                <pattern id="scales" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M5,0 Q10,5 5,10 Q0,5 5,0" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                </pattern>

                {/* 2. Body Gradients */}
                <linearGradient id="grad-standard" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={customColor || "#FF7043"} />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
                </linearGradient>

                <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="40%" stopColor="#FFA000" />
                    <stop offset="80%" stopColor="#FFECB3" />
                    <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>

                <linearGradient id="grad-white" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E0E0E0" />
                </linearGradient>

                <linearGradient id="grad-black" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#212121" />
                    <stop offset="50%" stopColor="#000000" />
                    <stop offset="100%" stopColor="#424242" />
                </linearGradient>

                {/* 3. Fin Gradients */}
                <linearGradient id="fin-translucent" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
            </defs>

            {/* Container Group centered at origin */}
            <g transform="translate(50, 100)">

                {/* --- TAIL (Elongated) --- */}
                {/* Pivot at (0, -45). We use a group to isolate the rotation. */}
                <g style={{ transformOrigin: '0px -45px' }}>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="-15; 15; -15"
                        dur="1.5s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    />
                    <path
                        d="M0,-45 Q20,-15 0,35 Q-20,-15 0,-45"
                        fill={isBlack ? "#111" : (isGold ? "#FFB300" : "#FFF")}
                        opacity="0.8"
                        stroke={isBlack ? "none" : "rgba(0,0,0,0.1)"}
                        strokeWidth="0.5"
                    />
                    {/* Tail detail lines */}
                    <path d="M0,-35 L0,25" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                    <path d="M0,-35 L8,15" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                    <path d="M0,-35 L-8,15" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                </g>

                {/* --- RIGHT FIN --- */}
                <g style={{ transformOrigin: '22px -65px' }}>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0; 25; 0"
                        dur="2s"
                        begin="0s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    />
                    <path
                        d="M22,-65 Q45,-55 40,-30 Q22,-45 22,-65"
                        fill={isBlack ? "#111" : (isGold ? "#FFB300" : "rgba(255,255,255,0.8)")}
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="0.5"
                    />
                </g>

                {/* --- LEFT FIN (Staggered) --- */}
                <g style={{ transformOrigin: '-22px -65px' }}>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0; -25; 0"
                        dur="2s"
                        begin="1s" /* Staggered by 1s (half cycle) */
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    />
                    <path
                        d="M-22,-65 Q-45,-55 -40,-30 Q-22,-45 -22,-65"
                        fill={isBlack ? "#111" : (isGold ? "#FFB300" : "rgba(255,255,255,0.8)")}
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="0.5"
                    />
                </g>

                {/* --- BODY (Elongated Torpedo Shape) --- */}
                <g>
                    {/* Base Shape: Longer body (y: -110 to 15) */}
                    <path
                        d="M0,-110 C35,-90 30,0 0,15 C-30,0 -35,-90 0,-110"
                        fill={
                            variant === 'standard' ? "url(#grad-standard)" :
                                variant === 'black' ? "url(#grad-black)" :
                                    variant === 'gold' ? "url(#grad-gold)" :
                                        variant === 'white' ? "url(#grad-white)" :
                                            "#FFFFFF" // Calico base
                        }
                    />

                    {/* Scale Overlay (for all except black which is too dark) */}
                    {(isGold || variant === 'white' || isCalico || variant === 'standard') && (
                        <path
                            d="M0,-110 C35,-90 30,0 0,15 C-30,0 -35,-90 0,-110"
                            fill="url(#scales)"
                            opacity="0.2"
                        />
                    )}

                    {/* CALICO SPOTS (Adjusted positions for new shape) */}
                    {isCalico && (
                        <g opacity="0.9" style={{ mixBlendMode: 'multiply' }}>
                            {/* Organic blots */}
                            <path d="M-10,-95 Q5,-100 15,-85 Q20,-70 10,-65 Q-5,-70 -10,-95" fill="#D32F2F" /> {/* Head Red */}
                            <path d="M15,-50 Q25,-40 20,-20 Q5,-30 15,-50" fill="#212121" /> {/* Side Black */}
                            <path d="M-5,-40 Q-20,-30 -15,-10 Q0,-20 -5,-40" fill="#FF5722" /> {/* Tail Orange */}
                            <circle cx="-12" cy="-70" r="4" fill="#212121" /> {/* Small spot */}
                        </g>
                    )}

                    {/* Eyes */}
                    <circle cx="-12" cy="-90" r="2.5" fill="#000" />
                    <circle cx="12" cy="-90" r="2.5" fill="#000" />

                    {/* Whiskers */}
                    <path d="M-6,-110 Q-15,-120 -18,-115" stroke="#DDD" fill="none" strokeWidth="1" opacity="0.8" />
                    <path d="M6,-110 Q15,-120 18,-115" stroke="#DDD" fill="none" strokeWidth="1" opacity="0.8" />
                </g>
            </g>
        </svg>
    );
};

export default KoiFishSVG;
