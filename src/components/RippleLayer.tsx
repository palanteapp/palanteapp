import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';

interface Ripple {
    id: number;
    x: number;
    y: number;
}

interface RippleLayerProps {
    isDarkMode: boolean;
}

export interface RippleLayerRef {
    addRipple: (x: number, y: number) => void;
}

export const RippleLayer = forwardRef<RippleLayerRef, RippleLayerProps>(({ isDarkMode }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    // Use a ref for ripples to avoid stale closures in timeouts if needed, 
    // though strict React state is fine here since we just append.
    // However, fast tapping might benefit from functional updates which we use.

    const addRipple = useCallback((x: number, y: number) => {
        const id = Date.now() + Math.random();
        setRipples(prev => [...prev, { id, x, y }]);

        // Auto-cleanup after animation duration (2s)
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 2000);
    }, []);

    useImperativeHandle(ref, () => ({
        addRipple
    }));

    return (
        <>
            {ripples.map(r => (
                <div
                    key={r.id}
                    className={`absolute w-12 h-12 rounded-full border-2 pointer-events-none ${isDarkMode ? 'border-white/30' : 'border-sage/30'}`}
                    style={{
                        left: r.x - 24,
                        top: r.y - 24,
                        animation: 'ripple 2s ease-out forwards',
                        zIndex: 20 // Above everything
                    }}
                />
            ))}
        </>
    );
});

RippleLayer.displayName = "RippleLayer";
