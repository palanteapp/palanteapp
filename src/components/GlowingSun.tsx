import React from 'react';

interface GlowingSunProps {
    isActive: boolean;
    className?: string;
}

export const GlowingSun: React.FC<GlowingSunProps> = ({ isActive, className = '' }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <div
                className={`relative transition-all duration-[2000ms] ease-in-out transform ${isActive ? 'scale-100' : 'scale-50 opacity-0'}`}
                style={{
                    width: '300px',
                    height: '300px',
                }}
            >
                {/* Core Sun */}
                <div className={`absolute inset-0 rounded-full bg-pale-gold shadow-[0_0_100px_rgba(229,214,167,0.8)] transition-all duration-1000 ${isActive ? 'opacity-80' : 'opacity-0'}`} />

                {/* Primary Radial Glow */}
                <div className={`absolute -inset-20 rounded-full bg-gradient-radial from-amber/40 via-amber/10 to-transparent blur-3xl animate-pulse-slow transition-opacity duration-1000 ${isActive ? 'opacity-60' : 'opacity-0'}`} />

                {/* Secondary Large Aura */}
                <div className={`absolute -inset-40 rounded-full bg-gradient-radial from-amber/20 via-transparent to-transparent blur-[120px] transition-opacity duration-[3000ms] ${isActive ? 'opacity-40' : 'opacity-0'}`} />

                {/* Animated Rays (Pseudo) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-1 h-[400px] bg-gradient-to-b from-transparent via-amber/20 to-transparent transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                                transform: `rotate(${i * 45}deg)`,
                                animation: `pulse-light 4s ease-in-out infinite ${i * 0.5}s`
                            }}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};
