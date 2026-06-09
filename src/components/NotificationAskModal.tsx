import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

interface NotificationAskModalProps {
    isOpen: boolean;
    userName: string;
    onAllow: () => void;
    onSkip: () => void;
}

export const NotificationAskModal: React.FC<NotificationAskModalProps> = ({
    isOpen,
    userName,
    onAllow,
    onSkip,
}) => {
    const firstName = userName.split(' ')[0] || 'friend';
    const gold = '#E5D6A7';
    const goldDim = 'rgba(229,214,167,0.50)';
    const goldFaint = 'rgba(229,214,167,0.15)';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 z-[90]"
                        style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-[95] rounded-t-[2rem] overflow-hidden"
                        style={{ background: '#415D43', maxHeight: '80vh' }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    >
                        {/* Seed of Life background */}
                        <svg
                            aria-hidden
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            viewBox="0 0 390 500"
                            preserveAspectRatio="xMidYMid slice"
                        >
                            <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.07">
                                <circle cx="195" cy="250" r="148" strokeWidth="0.9" />
                                <circle cx="343" cy="250" r="148" />
                                <circle cx="269" cy="378" r="148" />
                                <circle cx="121" cy="378" r="148" />
                                <circle cx="47"  cy="250" r="148" />
                                <circle cx="121" cy="122" r="148" />
                                <circle cx="269" cy="122" r="148" />
                            </g>
                        </svg>

                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 relative z-10">
                            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(229,214,167,0.20)' }} />
                        </div>

                        <div className="px-6 pt-6 pb-10 relative z-10">
                            {/* Icon */}
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto"
                                style={{ background: goldFaint, border: `1px solid rgba(229,214,167,0.25)` }}
                            >
                                <Bell size={28} style={{ color: gold }} />
                            </div>

                            {/* Copy */}
                            <div className="flex items-center gap-2 mb-2 justify-center">
                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: gold }}>
                                    Stay on track
                                </span>
                            </div>
                            <h2 className="text-3xl font-display font-bold tracking-tight mb-2 text-white text-center">
                                Wake you up tomorrow?
                            </h2>
                            <p className="text-sm text-center mb-8 leading-relaxed" style={{ color: goldDim }}>
                                {firstName}, people who get a morning reminder are 3× more likely to still be here 30 days from now. One tap — that's it.
                            </p>

                            {/* CTAs */}
                            <motion.button
                                onClick={onAllow}
                                className="w-full py-4 rounded-2xl font-bold text-base tracking-wide mb-3"
                                style={{
                                    background: gold,
                                    color: '#2D3E33',
                                    boxShadow: '0 8px 28px rgba(229,214,167,0.30)',
                                }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Yes, remind me tomorrow →
                            </motion.button>
                            <button
                                onClick={onSkip}
                                className="w-full py-2 text-sm font-medium"
                                style={{ color: 'rgba(229,214,167,0.28)' }}
                            >
                                Not now
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
