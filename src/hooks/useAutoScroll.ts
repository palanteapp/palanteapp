import { useRef, useEffect } from 'react';

/**
 * Hook that auto-centers scrollable content when container is larger than viewport
 * Useful for modals and pages that should show their content centered instead of top-aligned
 */
export const useAutoScroll = (trigger?: unknown) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Small delay to allow content to render
        const timeout = setTimeout(() => {
            if (containerRef.current && containerRef.current.scrollHeight > containerRef.current.clientHeight) {
                // Scroll to center the content if it's larger than viewport
                containerRef.current.scrollTop = Math.max(0, (containerRef.current.scrollHeight - containerRef.current.clientHeight) / 2);
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [trigger]);

    return containerRef;
};
