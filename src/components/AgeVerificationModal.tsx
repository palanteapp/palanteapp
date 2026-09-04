import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';
import { calculateAge } from '../types';
import { useAgeRangeGate } from '../hooks/useAgeRangeGate';

interface AgeVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (dateOfBirth: string) => void;
    isDarkMode: boolean;
    /** When true, the close/cancel buttons are hidden, used as a hard COPPA gate on first launch. */
    required?: boolean;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
    isOpen,
    onClose,
    onVerify,
    isDarkMode,
    required = false,
}) => {
    const [birthYear, setBirthYear] = useState('');
    const [error, setError] = useState('');
    // Apple's Declared Age Range API (iOS 26+): an additional OS-verified/guardian-declared
    // signal, checked once alongside the self-reported birth year below. See CinematicIntro
    // for the same check on the primary new-user path — this covers the legacy fallback here.
    // Shared with CinematicIntro via useAgeRangeGate so the gating behavior (including the
    // recheck haptic) can't drift between the two independently-styled screens again.
    const { osConfirmedUnder13, isChecking, isRechecking, recheck: handleRecheckAge } = useAgeRangeGate({ active: isOpen });

    const handleVerify = () => {
        setError('');

        // Defense in depth: the OS check hasn't resolved yet, or has already confirmed
        // under-13. The Verify button is disabled while `isChecking` (and hidden entirely
        // once `osConfirmedUnder13`), but this guards against any click that races ahead
        // of that render — a self-reported year must never be able to sneak past a
        // pending or positive OS-confirmed-under-13 signal.
        if (isChecking || osConfirmedUnder13) {
            return;
        }

        if (!birthYear) {
            setError('Please select your birth year');
            haptics.error();
            return;
        }

        const year = parseInt(birthYear);

        if (year < 1900 || year > new Date().getFullYear()) {
            setError('Please enter a valid year');
            haptics.error();
            return;
        }

        // Use July 1 as a conservative mid-year default
        const dateOfBirth = `${year}-07-01`;
        const age = calculateAge(dateOfBirth);

        if (age < 13) {
            setError('You must be at least 13 years old to use Palante');
            haptics.error();
            return;
        }

        haptics.success();
        onVerify(dateOfBirth);
        onClose();
    };

    const currentYear = new Date().getFullYear();
    // Starts at currentYear - 13, not currentYear: a birth year more recent than that
    // makes the user under 13, which handleVerify rejects immediately above anyway —
    // there is no reason to offer an option that always errors the moment it's picked.
    const years = Array.from({ length: 100 }, (_, i) => (currentYear - 13) - i);

    return (
        <SlideUpModal isOpen={isOpen} onClose={required ? () => {} : onClose} isDarkMode={isDarkMode} showCloseButton={!required} position="center">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-pale-gold/20' : 'bg-sage/20'}`}>
                            <Calendar className={isDarkMode ? 'text-pale-gold' : 'text-sage'} size={24} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                Age Verification
                            </h2>
                            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                                Required before you continue
                            </p>
                        </div>
                    </div>
                    {!required && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                        >
                            <X size={20} className={isDarkMode ? 'text-white' : 'text-sage-dark/60'} />
                        </button>
                    )}
                </div>

                {osConfirmedUnder13 ? (
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-sage/5 border border-sage/10'}`}>
                        <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Palante isn't available for this account yet.
                        </p>
                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/70' : 'text-sage-dark/70'}`}>
                            Your device reports this account is under 13. Palante is built for ages 13 and up.
                            If this was set up on a shared device or a family member's age range
                            recently changed, you can check again.
                        </p>
                        <button
                            onClick={handleRecheckAge}
                            disabled={isRechecking}
                            className={`w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-60 ${isDarkMode
                                    ? 'bg-white/10 hover:bg-white/15 text-white'
                                    : 'bg-sage/10 hover:bg-sage/15 text-sage-dark'
                                }`}
                        >
                            {isRechecking ? 'Checking…' : 'Check Again'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Info */}
                        <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-sage/5 border border-sage/10'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-sage-dark/80'}`}>
                                To comply with privacy laws, we need to confirm you're 13 or older.
                                We only store your birth year.
                            </p>
                        </div>

                        {/* Form */}
                        <div className="mb-6">
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                Birth Year
                            </label>
                            <select
                                value={birthYear}
                                onChange={(e) => setBirthYear(e.target.value)}
                                className={`w-full px-5 py-3 rounded-xl border transition-colors ${isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white focus:border-pale-gold'
                                        : 'bg-white border-sage/20 text-sage-dark focus:border-sage'
                                    }`}
                            >
                                <option value="">Select year...</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        {/* Privacy Note */}
                        <div className={`p-3 rounded-lg mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                            <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-sage-dark/50'}`}>
                                Your birth year is stored securely and never shared with third parties.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {!required && (
                                <button
                                    onClick={onClose}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode
                                            ? 'bg-white/5 hover:bg-white/10 text-white/80'
                                            : 'bg-sage/5 hover:bg-sage/10 text-sage'
                                        }`}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleVerify}
                                disabled={isChecking}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 ${isDarkMode
                                        ? 'bg-pale-gold text-sage-dark'
                                        : 'bg-terracotta-500 text-white'
                                    }`}
                            >
                                {isChecking ? 'Checking…' : 'Verify Age'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </SlideUpModal>
    );
};
