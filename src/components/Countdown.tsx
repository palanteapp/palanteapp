import React, { useEffect, useState } from 'react';

interface CountdownProps {
    onComplete: () => void;
    isActive: boolean;
}

export const Countdown: React.FC<CountdownProps> = ({ onComplete, isActive }) => {
    const [count, setCount] = useState(5);

    // Reset count to 5 when countdown becomes active
    useEffect(() => {
        if (isActive) {
            setCount(5);
        }
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                onComplete();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [count, isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-warm-gray-green/90 backdrop-blur-sm animate-fade-in">
            <div key={count} className="text-9xl font-display font-medium text-white animate-scale-pulse">
                {count > 0 ? count : ''}
            </div>
        </div>
    );
};
