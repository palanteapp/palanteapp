
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface FocusTimerProps {
    duration: number; // in seconds
    onComplete: () => void;
    isDarkMode: boolean;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ duration, onComplete, isDarkMode }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(true);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && !isFinished) {
            setIsFinished(true);
            setIsActive(false);
            haptics.success();
            // Optional: short delay before auto-completing
            setTimeout(onComplete, 2000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isFinished, onComplete]);

    const toggleTimer = () => {
        haptics.light();
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        haptics.medium();
        setTimeLeft(duration);
        setIsActive(false);
        setIsFinished(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (timeLeft / duration) * 100;

    return (
        <div className="flex flex-col items-center justify-center space-y-12">
            {/* Timer Ring */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="128" cy="128" r="120"
                        stroke="currentColor" strokeWidth="8" fill="none"
                        className={`opacity-10 ${isDarkMode ? 'text-white' : 'text-sage'}`}
                    />
                    <motion.circle
                        cx="128" cy="128" r="120"
                        stroke="currentColor" strokeWidth="8" fill="none"
                        strokeDasharray={754}
                        initial={{ strokeDashoffset: 754 }}
                        animate={{ strokeDashoffset: 754 - (754 * progress / 100) }}
                        transition={{ duration: 1, ease: "linear" }}
                        className={isDarkMode ? 'text-pale-gold' : 'text-sage'}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {isFinished ? (
                            <motion.div
                                key="finished"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-green-500"
                            >
                                <CheckCircle2 size={80} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="timer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-6xl font-display font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-sage'}`}
                            >
                                {formatTime(timeLeft)}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8">
                {!isFinished && (
                    <>
                        <button
                            onClick={resetTimer}
                            className={`p-4 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-white/10 text-white/60 hover:text-white' : 'bg-sage/10 text-sage/60 hover:text-sage'
                                }`}
                        >
                            <RotateCcw size={24} />
                        </button>

                        <button
                            onClick={toggleTimer}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl ${isDarkMode ? 'bg-white text-warm-gray-green' : 'bg-sage text-white'
                                }`}
                        >
                            {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                        </button>
                    </>
                )}
            </div>

            <p className={`text-xs font-bold uppercase tracking-[0.3em] opacity-40 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                {isFinished ? 'Session Complete' : isActive ? 'Stay in the Flow' : 'Timer Paused'}
            </p>
        </div>
    );
};
