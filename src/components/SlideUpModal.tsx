
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
}

export const SlideUpModal: React.FC<SlideUpModalProps> = ({
    isOpen,
    onClose,
    children,
    isDarkMode,
    showCloseButton = true,
    fullScreen = false,
    position = 'top',
    fixedHeight = false,
    className = ''
}) => {
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

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] overflow-y-auto animate-fade-in font-sans">
            {/* Backdrop - soft dark scrim, no blur */}
            <div
                className="absolute inset-0 z-0 transition-all duration-500 bg-black/30"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`relative z-10 min-h-[100dvh] flex ${position === 'center' ? 'items-center px-4' : position === 'top' ? 'items-start pt-16 px-4' : 'items-end sm:items-center'} justify-center p-0 ${fullScreen ? '' : 'sm:p-4'} pointer-events-none`}>
                <div
                    className={`
                        pointer-events-auto
                        relative w-full overflow-hidden
                        flex flex-col
                        animate-in fade-in slide-in-from-bottom-8 duration-500
                        ${fullScreen
                            ? 'h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
                            : `sm:max-w-xl sm:rounded-[3rem] rounded-t-[3rem] shadow-[0_-4px_60px_rgba(0,0,0,0.15),0_30px_80px_rgba(0,0,0,0.3)] ${fixedHeight ? 'h-[85dvh] sm:h-[90dvh]' : 'max-h-[85dvh] sm:max-h-[80dvh]'} ${position === 'center' || position === 'top' ? 'rounded-b-[3rem]' : ''}`
                        }
                        ${className || 'bg-[#1E3A2B]'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Art background — flat earthy circles, no glow */}
                    {!className && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 400 800"
                            aria-hidden="true"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
                            preserveAspectRatio="xMidYMid slice"
                        >
                            <circle cx="340" cy="90"  r="210" fill="#415D43" opacity="0.32" />
                            <circle cx="60"  cy="680" r="190" fill="#C96A3A" opacity="0.13" />
                            <circle cx="190" cy="400" r="260" fill="#F59E0B" opacity="0.06" />
                            <circle cx="360" cy="520" r="160" fill="#E5D6A7" opacity="0.05" />
                        </svg>
                    )}

                    {/* Close Button */}
                    {showCloseButton && (
                        <div className={`absolute top-4 right-4 z-50 pointer-events-auto ${fullScreen ? 'mt-[env(safe-area-inset-top)]' : ''}`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isDarkMode
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-black/5 hover:bg-black/10 text-sage-dark'
                                    }`}
                            >
                                <X size={20} />
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
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
