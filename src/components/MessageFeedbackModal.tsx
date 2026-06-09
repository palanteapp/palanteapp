import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import { recordMessageFeedback, getFeedbackQuestion } from '../utils/messageFeedbackCapture';
import type { MessageFeedback } from '../utils/messageFeedbackCapture';

interface MessageFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    rating: 1 | 2 | 3 | 4 | 5;
    practiceType: 'morning' | 'evening';
    practiceId: string;
    userId: string;
}

/**
 * Modal that appears after user rates a message
 * Asks qualitative questions to understand WHY it landed or missed
 */
export const MessageFeedbackModal: React.FC<MessageFeedbackModalProps> = ({
    isOpen,
    onClose,
    rating,
    practiceType,
    practiceId,
    userId,
}) => {
    const [step, setStep] = useState<'question' | 'followup' | 'comment'>('question');
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const questionData = getFeedbackQuestion(rating);
    const selectedOption = questionData.options.find(o => o.id === selectedReason);

    const handleSelectReason = async (reasonId: string) => {
        setSelectedReason(reasonId);

        // If they selected "other", skip to comment
        if (reasonId === 'other') {
            setStep('comment');
            return;
        }

        // If there's a followup question, show it
        if (questionData.followUp) {
            setStep('followup');
        } else {
            // Otherwise, save and close
            await handleSubmit(reasonId, '');
        }
    };

    const handleSubmit = async (reason: string, finalComment: string) => {
        setIsSubmitting(true);

        const feedback: MessageFeedback['feedback'] = {
            comment: finalComment,
        };

        // Map reason to appropriate field based on rating
        if (rating >= 4) {
            feedback.resonanceReason = reason as MessageFeedback['feedback']['resonanceReason'];
        } else {
            feedback.missReason = reason as MessageFeedback['feedback']['missReason'];
        }

        await recordMessageFeedback(userId, practiceId, practiceType, rating, feedback);

        setIsSubmitting(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(20, 36, 18, 0.85)', backdropFilter: 'blur(12px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="relative w-full max-w-md rounded-3xl p-8"
                        style={{
                            background: 'linear-gradient(135deg, rgba(253,251,247,0.98) 0%, rgba(240,234,220,0.95) 100%)',
                            border: '1px solid rgba(65,93,67,0.15)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-1 rounded-full hover:bg-sage/10 transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} color="#415D43" strokeWidth={2} />
                        </button>

                        {/* Main question step */}
                        {step === 'question' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6">
                                    <h2
                                        style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#2D3E33',
                                            marginBottom: '8px',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {questionData.title}
                                    </h2>
                                    <p style={{ fontSize: '13px', color: 'rgba(65,93,67,0.65)', lineHeight: 1.5 }}>
                                        This helps me understand what works for you.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {questionData.options.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelectReason(option.id)}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '14px',
                                                border: `1.5px solid ${
                                                    selectedReason === option.id
                                                        ? '#C96A3A'
                                                        : 'rgba(65,93,67,0.15)'
                                                }`,
                                                background:
                                                    selectedReason === option.id
                                                        ? 'rgba(201,106,58,0.08)'
                                                        : 'rgba(65,93,67,0.03)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'left',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (
                                                    e.currentTarget.style.background !==
                                                    'rgba(201,106,58,0.08)'
                                                ) {
                                                    e.currentTarget.style.background =
                                                        'rgba(65,93,67,0.06)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedReason !== option.id) {
                                                    e.currentTarget.style.background =
                                                        'rgba(65,93,67,0.03)';
                                                }
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: '#2D3E33',
                                                    marginBottom: '3px',
                                                }}
                                            >
                                                {option.label}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: '12px',
                                                    color: 'rgba(65,93,67,0.65)',
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {option.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Followup step */}
                        {step === 'followup' && selectedOption && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6">
                                    <h2
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#2D3E33',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        {questionData.followUp}
                                    </h2>
                                    <div
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            background: 'rgba(201,106,58,0.08)',
                                            border: '1px solid rgba(201,106,58,0.2)',
                                            marginBottom: '16px',
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: '13px',
                                                color: '#C96A3A',
                                                fontWeight: 500,
                                            }}
                                        >
                                            You said: {selectedOption.label}
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What specifically? (optional)"
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1.5px solid rgba(65,93,67,0.15)',
                                        fontFamily: 'inherit',
                                        fontSize: '14px',
                                        color: '#2D3E33',
                                        resize: 'none',
                                    }}
                                />

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setComment('');
                                            setStep('question');
                                            setSelectedReason(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(65,93,67,0.20)',
                                            background: 'transparent',
                                            color: '#415D43',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background = 'rgba(65,93,67,0.06)')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background = 'transparent')
                                        }
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleSubmit(selectedReason || '', comment)
                                        }
                                        disabled={isSubmitting}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: '#C96A3A',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s',
                                            opacity: isSubmitting ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSubmitting) e.currentTarget.style.background = '#b55e32';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSubmitting) e.currentTarget.style.background = '#C96A3A';
                                        }}
                                    >
                                        {isSubmitting ? 'Saving...' : 'Got it'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Comment step (for "other") */}
                        {step === 'comment' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6">
                                    <h2
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#2D3E33',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        Tell me more
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: '13px',
                                            color: 'rgba(65,93,67,0.65)',
                                        }}
                                    >
                                        Your words help me understand you better.
                                    </p>
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What didn't quite work? What would help instead?"
                                    style={{
                                        width: '100%',
                                        minHeight: '120px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1.5px solid rgba(65,93,67,0.15)',
                                        fontFamily: 'inherit',
                                        fontSize: '14px',
                                        color: '#2D3E33',
                                        resize: 'none',
                                    }}
                                />

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setComment('');
                                            setStep('question');
                                            setSelectedReason(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(65,93,67,0.20)',
                                            background: 'transparent',
                                            color: '#415D43',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => handleSubmit('other', comment)}
                                        disabled={isSubmitting || !comment.trim()}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background:
                                                comment.trim() && !isSubmitting ? '#C96A3A' : '#ccc',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor:
                                                comment.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                                        }}
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save feedback'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
