import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DailyMorningPracticeWidget } from './DailyMorningPracticeWidget';
import { haptics } from '../utils/haptics';
import { triggerConfetti } from '../utils/CelebrationEffects';
import type { UserProfile, DailyMorningPractice } from '../types';
import { logPractice, migrateStreakToPractice } from '../utils/practiceUtils';
import { useAutoScroll } from '../hooks/useAutoScroll';

interface MorningPracticeProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
}

export const MorningPractice: React.FC<MorningPracticeProps> = ({
    isOpen,
    onClose,
    user,
    onUpdateUser
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('intro');
    const contentRef = useAutoScroll(isOpen);

    useEffect(() => {
        if (isOpen) {
            Promise.resolve().then(() => {
                setIsExiting(false);
                setCurrentStep('intro');
            });
        } else {
            // When the modal closes while mid-exit-animation, reset isExiting so
            // the !isOpen && !isExiting guard can unmount the component.
            setIsExiting(false);
        }
    }, [isOpen]);

    const handleMorningPracticeComplete = (data: DailyMorningPractice) => {
        const today = new Date();
        const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const existingEntries = user.dailyMorningPractice || [];
        const otherEntries = existingEntries.filter(p => p.date !== todayDate);

        const currentPracticeData = user.practiceData || migrateStreakToPractice(user);
        const updatedPracticeData = logPractice(currentPracticeData, 'morning_practice');

        onUpdateUser({
            dailyMorningPractice: [...otherEntries, data],
            practiceData: updatedPracticeData
        });

        haptics.success();
        triggerConfetti();
    };

    const handleRefresh = () => {
        if (!user) return;
        const today = new Date();
        const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const existing = (user.dailyMorningPractice || []).find(p => p.date === todayDate);
        const otherEntries = (user.dailyMorningPractice || []).filter(p => p.date !== todayDate);

        if (existing) {
            onUpdateUser({
                dailyMorningPractice: [...otherEntries, {
                    ...existing,
                    gratitudes: [],
                    affirmations: [],
                    dailyIntention: existing.dailyIntention || ''
                }]
            });
        }
        haptics.light();
    };


    if (!isOpen && !isExiting) return null;

    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todaysPractice = (user.dailyMorningPractice || []).find(p => p.date === todayDate);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Morning practice"
            className={`fixed inset-0 z-[60] flex flex-col pb-[env(safe-area-inset-bottom)] transition-all duration-500 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            style={{ background: '#415D43' }}
        >
            {/* Central luminosity bloom */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(105,145,90,0.45) 0%, transparent 62%)',
                }}
            />
            {/* Edge vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 38%, rgba(18,32,16,0.55) 100%)',
                }}
            />
            {/* Bottom warmth */}
            <div
                className="absolute bottom-0 inset-x-0 pointer-events-none"
                style={{
                    height: '40%',
                    background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.12) 0%, transparent 70%)',
                }}
            />
            {/* Seed of Life — sacred geometry */}
            <svg
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 390 844"
                preserveAspectRatio="xMidYMid slice"
            >
                <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.14">
                    <circle cx="195" cy="413" r="148" strokeWidth="0.9" />
                    <circle cx="343" cy="413" r="148" />
                    <circle cx="269" cy="541" r="148" />
                    <circle cx="121" cy="541" r="148" />
                    <circle cx="47"  cy="413" r="148" />
                    <circle cx="121" cy="285" r="148" />
                    <circle cx="269" cy="285" r="148" />
                </g>
            </svg>

            {/* Safe Area Top Spacer */}
            <div className="w-full h-[env(safe-area-inset-top)] bg-transparent" />

            {/* Close button — intro step only */}
            {currentStep === 'intro' && !isExiting && (
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute z-20 right-6 flex items-center justify-center w-9 h-9 rounded-full"
                    style={{
                        top: 'calc(env(safe-area-inset-top) + 16px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.5)',
                    }}
                >
                    <X size={18} />
                </button>
            )}

            {/* Content Area — input steps (gratitude/affirmation/intention) align to top so
                 5-row lists don't push title off screen; all other steps stay centered. */}
            <div ref={contentRef} className={`flex-1 flex flex-col items-center px-6 pb-8 overflow-y-auto relative z-10 ${['gratitude', 'affirmation', 'intention'].includes(currentStep) ? 'justify-start pt-10' : 'justify-center pt-4'}`}>
                <div className="w-full max-w-lg">
                    <DailyMorningPracticeWidget
                        userName={user.name?.split(' ')[0] || 'Friend'}
                        onComplete={handleMorningPracticeComplete}
                        onRefresh={handleRefresh}
                        isDarkMode={true}
                        existingPriming={todaysPractice || null}
                        isFirstEver={!user.practiceData || user.practiceData.totalPractices === 0}
                        user={user}
                        onStepChange={setCurrentStep}
                        onFinish={() => {
                            setIsExiting(true);
                            setTimeout(onClose, 500);
                        }}
                        onSkip={() => {
                            setIsExiting(true);
                            setTimeout(onClose, 300);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
