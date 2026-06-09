import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CountdownProps {
    onComplete: () => void;
    isActive: boolean;
}

export const Countdown: React.FC<CountdownProps> = ({ onComplete, isActive }) => {
    const [count, setCount] = useState(5);
    const [prevIsActive, setPrevIsActive] = useState(isActive);

    if (isActive && !prevIsActive) {
        setPrevIsActive(true);
        setCount(5);
    } else if (!isActive && prevIsActive) {
        setPrevIsActive(false);
    }

    useEffect(() => {
        if (!isActive) return;

        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => { onComplete(); }, 500);
            return () => clearTimeout(timer);
        }
    }, [count, isActive, onComplete]);

    if (!isActive) return null;

    // Portal renders directly into document.body, escaping any parent
    // transform/overflow that would break fixed positioning on iOS.
    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-sage-mid/90 backdrop-blur-sm transition-opacity duration-700 ${count === 0 ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div key={count} className="text-9xl font-display font-medium text-white animate-scale-pulse">
                {count > 0 ? count : ''}
            </div>
        </div>,
        document.body
    );
};
