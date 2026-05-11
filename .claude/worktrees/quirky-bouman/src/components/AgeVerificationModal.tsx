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
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
    isOpen,
    onClose,
    onVerify,
    isDarkMode
}) => {
    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [error, setError] = useState('');

    const handleVerify = () => {
        setError('');

        // Validation
        if (!birthYear || !birthMonth) {
            setError('Please enter your birth month and year');
            haptics.error();
            return;
        }

        const year = parseInt(birthYear);
        const month = parseInt(birthMonth);

        if (year < 1900 || year > new Date().getFullYear()) {
            setError('Please enter a valid year');
            haptics.error();
            return;
        }

        if (month < 1 || month > 12) {
            setError('Please enter a valid month (1-12)');
            haptics.error();
            return;
        }

        // Create date string (use 1st of month for privacy)
        const dateOfBirth = `${year}-${month.toString().padStart(2, '0')}-01`;

        // Check age
        const age = calculateAge(dateOfBirth);

        if (age < 13) {
            setError('You must be at least 13 years old to use Palante');
            haptics.error();
            return;
        }

        // Success
        haptics.success();
        onVerify(dateOfBirth);
        onClose();
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    return (
        <SlideUpModal isOpen={isOpen} onClose={onClose} isDarkMode={isDarkMode}>
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
                                Required for AI features
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                    >
                        <X size={20} className={isDarkMode ? 'text-white/60' : 'text-sage-dark/60'} />
                    </button>
                </div>

                {/* Info */}
                <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-sage/5 border border-sage/10'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-sage-dark/80'}`}>
                        To comply with privacy laws and ensure age-appropriate content, we need to verify your age.
                        We only collect your birth month and year for privacy.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-6">
                    {/* Month */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Birth Month
                        </label>
                        <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-colors ${isDarkMode
                                    ? 'bg-white/5 border-white/10 text-white focus:border-pale-gold'
                                    : 'bg-white border-sage/20 text-sage-dark focus:border-sage'
                                }`}
                        >
                            <option value="">Select month...</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Birth Year
                        </label>
                        <select
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-colors ${isDarkMode
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
                    <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                        🔒 Your age information is stored securely and never shared with third parties.
                        We only use it to ensure age-appropriate features.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode
                                ? 'bg-white/5 hover:bg-white/10 text-white/80'
                                : 'bg-sage/5 hover:bg-sage/10 text-sage'
                            }`}
                    >
                        Cancel
                    </button>
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
