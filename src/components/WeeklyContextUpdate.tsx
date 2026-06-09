import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getContextCapture, saveContextSnapshot } from '../utils/messageFeedbackCapture';
import type { UserContextSnapshot } from '../utils/messageFeedbackCapture';

interface WeeklyContextUpdateProps {
    userId: string;
    onClose: () => void;
}

/**
 * Weekly modal that asks users about their context
 * "What matters to you right now? What do you want more/less of?"
 *
 * This is shown:
 * - First time after user completes 7 days of practices
 * - Then weekly if user engagement is high
 * - Can be manually triggered anytime
 */
export const WeeklyContextUpdate: React.FC<WeeklyContextUpdateProps> = ({
    userId,
    onClose,
}) => {
    const contextCapture = getContextCapture();
    const [currentSection, setCurrentSection] = useState(0);

    // Form state
    const [currentFocus, setCurrentFocus] = useState('');
    const [wantMore, setWantMore] = useState<string[]>([]);
    const [wantLess, setWantLess] = useState<string[]>([]);
    const [lifePhase, setLifePhase] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const section = contextCapture.sections[currentSection];
    const isLastSection = currentSection === contextCapture.sections.length - 1;
    const progress = ((currentSection + 1) / contextCapture.sections.length) * 100;

    const handleNext = async () => {
        if (isLastSection) {
            // Save and close
            await handleSave();
        } else {
            setCurrentSection(currentSection + 1);
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            setCurrentSection(currentSection - 1);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        const context: Omit<UserContextSnapshot, 'userId' | 'date' | 'lastUpdated'> = {
            preferences: {
                wantMore,
                wantLess,
                currentFocus: currentFocus || undefined,
            },
            context: {
                currentFocus: currentFocus || undefined,
                lifePhase: (lifePhase.split(' — ')[0] || undefined) as any,
            },
        };

        await saveContextSnapshot(userId, context);
        setIsSaving(false);
        onClose();
    };

    const toggleTag = (tag: string, list: string[], setList: (list: string[]) => void) => {
        if (list.includes(tag)) {
            setList(list.filter(t => t !== tag));
        } else {
            setList([...list, tag]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(20, 36, 18, 0.85)', backdropFilter: 'blur(12px)' }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md rounded-3xl p-8"
                style={{
                    background: 'linear-gradient(135deg, rgba(253,251,247,0.98) 0%, rgba(240,234,220,0.95) 100%)',
                    border: '1px solid rgba(65,93,67,0.15)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
            >
                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'rgba(65,93,67,0.6)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Weekly Check-in
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(65,93,67,0.5)' }}>
                            {currentSection + 1} of {contextCapture.sections.length}
                        </span>
                    </div>
                    <div
                        style={{
                            height: '4px',
                            background: 'rgba(65,93,67,0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                            style={{
                                height: '100%',
                                background: '#C96A3A',
                            }}
                        />
                    </div>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <h2
                        style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#2D3E33',
                            marginBottom: '6px',
                        }}
                    >
                        {section.question}
                    </h2>
                    {currentSection === 0 && (
                        <p style={{ fontSize: '13px', color: 'rgba(65,93,67,0.65)' }}>
                            This helps me understand what to focus on.
                        </p>
                    )}
                </div>

                {/* Content based on section type */}
                <div className="mb-8">
                    {section.type === 'text' && (
                        <input
                            type="text"
                            value={currentFocus}
                            onChange={(e) => setCurrentFocus(e.target.value)}
                            placeholder="e.g., Managing a big project at work"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1.5px solid rgba(65,93,67,0.15)',
                                fontSize: '14px',
                                color: '#2D3E33',
                            }}
                        />
                    )}

                    {section.type === 'tags' && section.options && (
                        <div className="space-y-2">
                            {section.options.map((option) => {
                                const list =
                                    section.name === 'wantMore' ? wantMore : wantLess;
                                const setList =
                                    section.name === 'wantMore' ? setWantMore : setWantLess;
                                const isSelected = list.includes(option);

                                return (
                                    <button
                                        key={option}
                                        onClick={() => toggleTag(option, list, setList)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: `1.5px solid ${
                                                isSelected
                                                    ? '#C96A3A'
                                                    : 'rgba(65,93,67,0.15)'
                                            }`,
                                            background: isSelected
                                                ? 'rgba(201,106,58,0.08)'
                                                : 'rgba(65,93,67,0.03)',
                                            color: '#2D3E33',
                                            fontSize: '14px',
                                            fontWeight: isSelected ? 600 : 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background =
                                                    'rgba(65,93,67,0.06)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background =
                                                    'rgba(65,93,67,0.03)';
                                            }
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '4px',
                                                    border: `2px solid ${
                                                        isSelected
                                                            ? '#C96A3A'
                                                            : 'rgba(65,93,67,0.3)'
                                                    }`,
                                                    background: isSelected
                                                        ? '#C96A3A'
                                                        : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {isSelected && (
                                                    <span style={{ color: 'white', fontSize: '12px' }}>
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                            {option}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {section.type === 'select' && section.options && (
                        <div className="space-y-2">
                            {section.options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setLifePhase(option)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: `1.5px solid ${
                                            lifePhase === option
                                                ? '#C96A3A'
                                                : 'rgba(65,93,67,0.15)'
                                        }`,
                                        background: lifePhase === option
                                            ? 'rgba(201,106,58,0.08)'
                                            : 'rgba(65,93,67,0.03)',
                                        color: '#2D3E33',
                                        fontSize: '14px',
                                        fontWeight: lifePhase === option ? 600 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (lifePhase !== option) {
                                            e.currentTarget.style.background =
                                                'rgba(65,93,67,0.06)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (lifePhase !== option) {
                                            e.currentTarget.style.background =
                                                'rgba(65,93,67,0.03)';
                                        }
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                border: `2px solid ${
                                                    lifePhase === option
                                                        ? '#C96A3A'
                                                        : 'rgba(65,93,67,0.3)'
                                                }`,
                                                background: lifePhase === option
                                                    ? '#C96A3A'
                                                    : 'transparent',
                                            }}
                                        />
                                        {option}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        disabled={currentSection === 0}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(65,93,67,0.20)',
                            background: 'transparent',
                            color: '#415D43',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: currentSection === 0 ? 'not-allowed' : 'pointer',
                            opacity: currentSection === 0 ? 0.5 : 1,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            if (currentSection > 0) {
                                e.currentTarget.style.background = 'rgba(65,93,67,0.06)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={isSaving}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: '#C96A3A',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: isSaving ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isSaving) e.currentTarget.style.background = '#b55e32';
                        }}
                        onMouseLeave={(e) => {
                            if (!isSaving) e.currentTarget.style.background = '#C96A3A';
                        }}
                    >
                        {isSaving ? 'Saving...' : isLastSection ? 'Complete' : 'Next'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
