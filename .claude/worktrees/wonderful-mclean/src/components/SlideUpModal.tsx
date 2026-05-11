
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
}

export const SlideUpModal: React.FC<SlideUpModalProps> = ({
    isOpen,
    onClose,
    children,
    isDarkMode,
    showCloseButton = true,
    fullScreen = false,
    position = 'top',
    fixedHeight = false
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
            {/* Backdrop */}
            <div
                className={`absolute inset-0 z-0 transition-all duration-700 ${fullScreen
                    ? (isDarkMode ? 'bg-sage-mid/95' : 'bg-white/95') + ' backdrop-blur-xl'
                    : 'bg-sage-dark/60 backdrop-blur-sm'
                    }`}
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`relative z-10 min-h-[100dvh] flex ${position === 'center' ? 'items-center px-4' : position === 'top' ? 'items-start pt-16 px-4' : 'items-end sm:items-center'} justify-center p-0 ${fullScreen ? '' : 'sm:p-4'} pointer-events-none`}>
                <div
                    className={`
                        pointer-events-auto
                        relative w-full overflow-hidden
                        flex flex-col
                        animate-in fade-in zoom-in duration-500
                        ${fullScreen
                            ? 'h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
                            : `sm:max-w-xl sm:rounded-[2.5rem] rounded-t-[3rem] shadow-popup border ${fixedHeight ? 'h-[85dvh] sm:h-[90dvh]' : 'max-h-[85dvh] sm:max-h-[80dvh]'} ${position === 'center' || position === 'top' ? 'rounded-b-[3rem]' : ''}`
                        }
                        ${isDarkMode
                            ? 'bg-[#4E5C4C]/80 border-white/5 backdrop-blur-2xl'
                            : 'bg-[#4E5C4C]/80 border-sage/10 backdrop-blur-2xl' /* olive green background at 80% opacity */
                        }
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    {showCloseButton && (
                        <div className={`absolute top-4 right-4 z-50 pointer-events-auto ${fullScreen ? 'mt-[env(safe-area-inset-top)]' : ''}`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isDarkMode
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-sage/10 hover:bg-sage/20 text-sage'
                                    }`}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}

                    {/* Content Scroll Area */}
                    <div className="overflow-y-auto flex-1 overscroll-contain relative z-10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
