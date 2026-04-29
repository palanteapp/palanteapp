import React, { useState } from 'react';
import { X, Lock, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UpdatePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({ isOpen, onClose, isDarkMode }) => {
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const { error } = await updatePassword(password);
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                }, 2000);
            }
        } catch {
            setError("Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';
    const inputBg = isDarkMode ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white' : 'bg-white border-sage/10 focus:border-sage text-sage-dark';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl animate-slide-up border ${isDarkMode ? 'bg-sage-mid border-white/10' : 'bg-white border-sage/20'}`}>
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-1.5 rounded-full transition-all ${isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-sage/60 hover:text-sage hover:bg-sage/10'}`}
                >
                    <X size={18} />
                </button>

                <h2 className={`text-xl font-display font-medium mb-1 ${textPrimary}`}>Update Password</h2>
                <p className={`text-sm mb-6 ${textSecondary}`}>Set a new password for your account.</p>

                {success ? (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                        <Check size={20} />
                        <span className="font-medium">Password updated successfully!</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className={`p-3 rounded-xl flex items-start gap-2 text-sm ${isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label className={`text-xs font-medium uppercase tracking-widest mb-1.5 block ${textSecondary}`}>New Password</label>
                            <div className="relative">
                                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50 ${textPrimary}`} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all border ${inputBg}`}
                                    placeholder="Min. 6 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity ${textPrimary}`}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`text-xs font-medium uppercase tracking-widest mb-1.5 block ${textSecondary}`}>Confirm Password</label>
                            <div className="relative">
                                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50 ${textPrimary}`} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all border ${inputBg}`}
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${loading || !password || !confirmPassword
                                ? 'opacity-50 cursor-not-allowed bg-gray-500/20 text-gray-500'
                                : isDarkMode ? 'bg-pale-gold text-sage-dark hover:bg-white' : 'bg-terracotta-500 text-white hover:bg-sage-600'
                                }`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
