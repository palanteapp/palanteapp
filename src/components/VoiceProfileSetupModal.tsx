import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { UserVoiceProfile } from '../types';

interface VoiceProfileSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: Partial<UserVoiceProfile>) => void;
    userName?: string;
}

export const VoiceProfileSetupModal: React.FC<VoiceProfileSetupModalProps> = ({
    isOpen,
    onClose,
    onSave,
    userName,
}) => {
    const [step, setStep] = useState(0);
    const [selectedTone, setSelectedTone] = useState<'nurturing' | 'direct' | 'accountability' | null>(null);
    const [selectedLength, setSelectedLength] = useState<'concise' | 'balanced' | 'detailed' | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const firstName = userName?.split(' ')[0] || 'there';

    const handleSave = async () => {
        if (!selectedTone || !selectedLength) return;

        setIsSaving(true);
        try {
            await onSave({
                voiceTone: selectedTone,
                messageLength: selectedLength,
                extractedValues: [],
                coreThemes: [],
                resonantPhrases: [],
                avoidPhrases: [],
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                messagesSinceUpdate: 0,
            });
            onClose();
        } catch (error) {
            console.error('Error saving voice profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toneOptions = [
        {
            id: 'nurturing',
            label: 'Nurturing',
            description: 'Warm, patient, acknowledging. Like a friend who checks in on you first.',
        },
        {
            id: 'direct',
            label: 'Direct',
            description: 'Clear and honest, no fluff. Tell me the truth plainly.',
        },
        {
            id: 'accountability',
            label: 'Accountability',
            description: 'High-standard, firm. Push me because you believe in me.',
        },
    ];

    const lengthOptions = [
        {
            id: 'concise',
            label: 'Concise',
            description: 'Short and punchy. Get to the point.',
        },
        {
            id: 'balanced',
            label: 'Balanced',
            description: 'Just right. Enough context, no excess.',
        },
        {
            id: 'detailed',
            label: 'Detailed',
            description: 'Thorough. I want the full picture.',
        },
    ];

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

                        <AnimatePresence mode="wait">
                            {step === 0 ? (
                                <motion.div
                                    key="step-0"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-8">
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2D3E33', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                                            How should we speak?
                                        </h2>
                                        <p style={{ fontSize: '14px', color: 'rgba(65,93,67,0.65)', lineHeight: 1.5 }}>
                                            {firstName}, let's calibrate how Palante shows up for you. This helps craft messages that actually land.
                                        </p>
                                    </div>

                                    <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(65,93,67,0.50)', marginBottom: '12px' }}>
                                        Choose your tone
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        {toneOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    setSelectedTone(option.id as typeof selectedTone);
                                                    setStep(1);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: '14px',
                                                    border: `1.5px solid ${selectedTone === option.id ? '#C96A3A' : 'rgba(65,93,67,0.15)'}`,
                                                    background: selectedTone === option.id ? 'rgba(201,106,58,0.08)' : 'rgba(65,93,67,0.03)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (e.currentTarget.style.background !== 'rgba(201,106,58,0.08)') {
                                                        e.currentTarget.style.background = 'rgba(65,93,67,0.06)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedTone !== option.id) {
                                                        e.currentTarget.style.background = 'rgba(65,93,67,0.03)';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <div style={{
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        border: `2px solid ${selectedTone === option.id ? '#C96A3A' : 'rgba(65,93,67,0.30)'}`,
                                                        background: selectedTone === option.id ? '#C96A3A' : 'transparent',
                                                        flexShrink: 0, marginTop: '2px',
                                                    }} />
                                                    <div>
                                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#2D3E33', marginBottom: '3px' }}>
                                                            {option.label}
                                                        </p>
                                                        <p style={{ fontSize: '12px', color: 'rgba(65,93,67,0.65)', lineHeight: 1.4 }}>
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step-1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-8">
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2D3E33', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                                            Message length?
                                        </h2>
                                        <p style={{ fontSize: '14px', color: 'rgba(65,93,67,0.65)', lineHeight: 1.5 }}>
                                            How much context do you want in each message?
                                        </p>
                                    </div>

                                    <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(65,93,67,0.50)', marginBottom: '12px' }}>
                                        Choose your preference
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        {lengthOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    setSelectedLength(option.id as typeof selectedLength);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: '14px',
                                                    border: `1.5px solid ${selectedLength === option.id ? '#C96A3A' : 'rgba(65,93,67,0.15)'}`,
                                                    background: selectedLength === option.id ? 'rgba(201,106,58,0.08)' : 'rgba(65,93,67,0.03)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (e.currentTarget.style.background !== 'rgba(201,106,58,0.08)') {
                                                        e.currentTarget.style.background = 'rgba(65,93,67,0.06)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedLength !== option.id) {
                                                        e.currentTarget.style.background = 'rgba(65,93,67,0.03)';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <div style={{
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        border: `2px solid ${selectedLength === option.id ? '#C96A3A' : 'rgba(65,93,67,0.30)'}`,
                                                        background: selectedLength === option.id ? '#C96A3A' : 'transparent',
                                                        flexShrink: 0, marginTop: '2px',
                                                    }} />
                                                    <div>
                                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#2D3E33', marginBottom: '3px' }}>
                                                            {option.label}
                                                        </p>
                                                        <p style={{ fontSize: '12px', color: 'rgba(65,93,67,0.65)', lineHeight: 1.4 }}>
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setStep(0)}
                                            style={{
                                                flex: 1, padding: '12px 16px', borderRadius: '12px',
                                                border: '1px solid rgba(65,93,67,0.20)', background: 'transparent',
                                                color: '#415D43', fontSize: '14px', fontWeight: 600,
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(65,93,67,0.06)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={!selectedLength || isSaving}
                                            style={{
                                                flex: 1, padding: '12px 16px', borderRadius: '12px',
                                                background: selectedLength ? '#C96A3A' : 'rgba(201,106,58,0.40)',
                                                color: 'white', fontSize: '14px', fontWeight: 600,
                                                cursor: selectedLength && !isSaving ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedLength && !isSaving) e.currentTarget.style.background = '#b55e32';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedLength && !isSaving) e.currentTarget.style.background = '#C96A3A';
                                            }}
                                        >
                                            {isSaving ? 'Saving...' : <>Save <Check size={16} /></>}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
