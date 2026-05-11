import React, { useEffect } from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    // Ensure page starts at top so animation looks correct
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="animate-slide-up-fade w-full h-full">
            {children}
        </div>
    );
};
