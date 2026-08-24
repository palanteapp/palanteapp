
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SHEET_SPRING } from '../constants/motion';

interface SlideUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    isDarkMode: boolean;
    title?: string;
    showCloseButton?: boolean;
    fullScreen?: boolean;
    position?: 'bottom' | 'center' | 'top';
    fixedHeight?: boolean;
    className?: string;
    /**
     * How present the seed-of-life watermark reads. The same fixed 0.14 opacity
     * everywhere made a genuinely distinctive brand mark read as one static
     * background texture rather than a living emblem with range. 'present' is
     * for the rare, meaningful sheets (a letter to your future self, the first
     * welcome) — everyday settings/utility sheets keep the quiet default.
     */
    emphasis?: 'quiet' | 'present';
}

export const SlideUpModal: React.FC<SlideUpModalProps> = ({
    isOpen,
    onClose,
    children,
    isDarkMode,
    title,
    showCloseButton = true,
    fullScreen = false,
    position = 'top',
    fixedHeight = false,
    className = '',
    emphasis = 'quiet'
}) => {
    const motifOpacity = emphasis === 'present' ? 0.32 : 0.14;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
    }, []);

    // Keyboard handler: Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    // Additional safety: Always cleanup on unmount, regardless of isOpen state
    useEffect(() => {
        return () => {
            // Force reset body overflow when component unmounts
            document.body.style.overflow = '';
        };
    }, []);

    // Safety timeout: If modal is stuck open for too long, auto-reset overflow
    useEffect(() => {
        if (isOpen) {
            const safetyTimeout = setTimeout(() => {
                // After 30 seconds, if modal is still open, ensure body can scroll
                if (document.body.style.overflow === 'hidden') {
                    console.warn('SlideUpModal: Safety timeout triggered');
                }
            }, 30000); // 30 seconds

            return () => clearTimeout(safetyTimeout);
        }
    }, [isOpen]);

    if (!mounted) return null;

    // Entrance and exit now share one AnimatePresence-driven transition instead of
    // the old `animate-in ... duration-500` Tailwind utility, which only ever ran
    // on the way in: `if (!isOpen) return null` unmounted everything on the very
    // next paint with no exit transition at all. The sheet's spring matches the
    // one HomeEssentialTools already built for its own bottom sheet, so every
    // sheet in the app now opens and closes with the same hand.
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] overflow-y-auto font-sans"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                    {/* Backdrop - soft dark scrim, no blur */}
                    <div
                        className="absolute inset-0 z-0 bg-black/30"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div className={`relative z-10 min-h-[100dvh] flex ${position === 'center' ? 'items-center px-4' : position === 'top' ? 'items-start pt-16 px-4' : 'items-end sm:items-center'} justify-center p-0 ${fullScreen ? '' : 'sm:p-4'} pointer-events-none`}>
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label={title}
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 32 }}
                            transition={SHEET_SPRING}
                            className={`
                                pointer-events-auto
                                relative w-full overflow-hidden
                                flex flex-col
                                ${fullScreen
                                    ? 'h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
                                    : `sm:max-w-xl sm:rounded-[3rem] rounded-t-[3rem] shadow-[0_-4px_60px_rgba(0,0,0,0.15),0_30px_80px_rgba(0,0,0,0.3)] ${fixedHeight ? 'h-[85dvh] sm:h-[90dvh]' : 'max-h-[85dvh] sm:max-h-[80dvh]'} ${position === 'center' || position === 'top' ? 'rounded-b-[3rem]' : ''}`
                                }
                                ${className || 'bg-[#415D43]'}
                            `}
                            onClick={(e) => e.stopPropagation()}
                        >
                    {/* Art background: seed-of-life sacred geometry */}
                    {!className && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 400 800"
                            aria-hidden="true"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
                            preserveAspectRatio="xMidYMid slice"
                        >
                            <defs>
                                <radialGradient id="sol-bloom" cx="50%" cy="28%" r="55%">
                                    <stop offset="0%" stopColor="#69915A" stopOpacity="0.45" />
                                    <stop offset="100%" stopColor="#69915A" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="sol-vignette" cx="50%" cy="50%" r="60%">
                                    <stop offset="38%" stopColor="#121810" stopOpacity="0" />
                                    <stop offset="100%" stopColor="#121810" stopOpacity="0.55" />
                                </radialGradient>
                                <radialGradient id="sol-terra" cx="50%" cy="100%" r="45%">
                                    <stop offset="0%" stopColor="#C96A3A" stopOpacity="0.16" />
                                    <stop offset="100%" stopColor="#C96A3A" stopOpacity="0" />
                                </radialGradient>
                            </defs>
                            <rect width="400" height="800" fill="url(#sol-bloom)" />
                            <rect width="400" height="800" fill="url(#sol-vignette)" />
                            <rect y="480" width="400" height="320" fill="url(#sol-terra)" />
                            <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity={motifOpacity}>
                                <circle cx="200" cy="400" r="148" strokeWidth="0.9" />
                                <circle cx="348" cy="400" r="148" />
                                <circle cx="274" cy="528" r="148" />
                                <circle cx="126" cy="528" r="148" />
                                <circle cx="52"  cy="400" r="148" />
                                <circle cx="126" cy="272" r="148" />
                                <circle cx="274" cy="272" r="148" />
                            </g>
                        </svg>
                    )}

                    {/* Close Button */}
                    {showCloseButton && (
                        <div className={`absolute top-4 right-4 z-50 pointer-events-auto ${fullScreen ? 'mt-[env(safe-area-inset-top)]' : ''}`}>
                            <button
                                aria-label="Close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isDarkMode
                                    ? 'bg-white/15 hover:bg-white/25 text-white/70'
                                    : 'bg-black/5 hover:bg-black/10 text-sage-dark'
                                    }`}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Content Scroll Area */}
                    <div
                        className="overflow-y-auto flex-1 overscroll-contain relative z-10 text-white antialiased"
                        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                    >
                        {children}
                    </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
