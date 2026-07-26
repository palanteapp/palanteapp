import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { SlideUpModal } from './SlideUpModal';
import { haptics } from '../utils/haptics';
import { calculateAge } from '../types';

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

    const handleVerify = () => {
        setError('');

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
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

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
                        className={`flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 ${isDarkMode
                                ? 'bg-pale-gold text-sage-dark'
                                : 'bg-terracotta-500 text-white'
                            }`}
                    >
                        Verify Age
                    </button>
                </div>
            </div>
        </SlideUpModal>
    );
};
