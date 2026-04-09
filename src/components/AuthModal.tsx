/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, Sparkles, ShieldCheck, Cloud, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isDarkMode }) => {
    const { signInWithEmail, signUpWithEmail, resendVerification, resetPasswordForEmail } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resending, setResending] = useState(false);
    const [linkResent, setLinkResent] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = isLogin
                ? await signInWithEmail(email, password)
                : await signUpWithEmail(email, password);

            if (authError) {
                setError(authError.message || 'An error occurred during authentication');
            } else {
                if (!isLogin) {
                    setSuccess(true);
                    // For sign up, show success message (email confirm might be needed)
                } else {
                    onClose();
                }
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] overflow-hidden transition-all border animate-in zoom-in-95 duration-500 ${isDarkMode ? 'bg-warm-gray-green/95 border-white/10' : 'bg-ivory/95 border-sage/20'}`}
                style={{
                    boxShadow: isDarkMode
                        ? '0 0 80px 20px rgba(0, 0, 0, 0.4), 0 0 150px 40px rgba(111, 123, 109, 0.2), 0 0 250px 60px rgba(111, 123, 109, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.02)'
                        : '0 0 80px 20px rgba(0, 0, 0, 0.1), 0 0 150px 40px rgba(111, 123, 109, 0.15), 0 0 250px 60px rgba(111, 123, 109, 0.08), inset 0 0 60px rgba(255, 255, 255, 0.6)'
                }}
            >
                {/* Header Pattern */}
                <div className={`${success ? 'h-24' : 'h-32'} relative overflow-hidden flex items-center justify-center transition-all duration-500 ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-pale-gold/30 -translate-x-12 -translate-y-12 blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-sage/30 translate-x-16 translate-y-16 blur-3xl" />
                    </div>
                    <div className="relative text-center">
                        <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-lg ${isDarkMode ? 'bg-white/10 text-pale-gold' : 'bg-sage text-white'}`}>
                            <Cloud size={24} />
                        </div>
                        <h2 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                            {success ? 'Verify your email' : (isLogin ? 'Welcome Back' : 'Create Cloud Account')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-2 animate-fade-in">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-sage/20 text-sage' : 'bg-sage/10 text-sage'}`}>
                                <Mail size={32} />
                            </div>
                            <p className={`text-base font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                Check your inbox
                            </p>
                            <p className={`text-sm mb-8 leading-relaxed px-2 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                We've sent a link to <span className={`font-bold ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>{email}</span>. Please click the link to activate your cloud sync.
                            </p>

                            <div className={`mb-8 p-3 rounded-xl border flex items-center gap-3 text-left ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-sage/5 border-sage/5 text-warm-gray-green/50'}`}>
                                <AlertCircle size={16} className="shrink-0" />
                                <p className="text-[11px] leading-tight">
                                    Don't see it? Check your <span className="font-bold">Spam folder</span> or try resending. Emails can take up to 2 minutes.
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    setResending(true);
                                    const { error } = await resendVerification(email);
                                    if (error) setError(error.message);
                                    else {
                                        setLinkResent(true);
                                        setTimeout(() => setLinkResent(false), 3000);
                                    }
                                    setResending(false);
                                }}
                                disabled={resending || linkResent}
                                className={`w-full py-3 mb-3 rounded-xl border-2 transition-all text-sm font-medium ${linkResent
                                    ? isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600'
                                    : isDarkMode
                                        ? 'bg-transparent border-white/10 text-white/60 hover:bg-white/5'
                                        : 'bg-transparent border-sage/20 text-warm-gray-green/60 hover:bg-sage/5'
                                    }`}
                            >
                                {resending ? <Loader2 size={16} className="animate-spin mx-auto" /> : (linkResent ? "Link Sent!" : "Didn't receive email? Resend")}
                            </button>

                            <button
                                onClick={onClose}
                                className={`w-full py-4 rounded-xl font-display font-medium transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-sage text-white hover:bg-sage/90 shadow-lg shadow-sage/20'}`}
                            >
                                Got it
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50/10 text-red-600 border border-red-100'}`}>
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div>
                                <label className={`text-xs font-medium uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/20' : 'text-sage/30'}`} />
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all border ${isDarkMode
                                            ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/20'
                                            : 'bg-white border-sage/10 focus:border-sage text-warm-gray-green placeholder-sage/30'}`}
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`text-xs font-medium uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/20' : 'text-sage/30'}`} />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full pl-12 pr-12 py-4 rounded-xl outline-none transition-all border ${isDarkMode
                                            ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/20'
                                            : 'bg-white border-sage/10 focus:border-sage text-warm-gray-green placeholder-sage/30'}`}
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/20 hover:text-white/40' : 'text-sage/30 hover:text-sage/50'}`}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className={`w-full py-4 rounded-xl font-display font-medium transition-all flex items-center justify-center gap-2 group ${loading
                                    ? 'opacity-70 cursor-not-allowed'
                                    : isDarkMode ? 'bg-pale-gold text-warm-gray-green hover:bg-white' : 'bg-sage text-white hover:bg-sage/90 shadow-lg shadow-sage/20'}`}
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>{isLogin ? 'Login' : 'Create Account'}</span>
                                        <ShieldCheck size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="pt-4 text-center space-y-3">
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!email) {
                                                setError("Please enter your email address first.");
                                                return;
                                            }
                                            setLoading(true);
                                            const { error } = await resetPasswordForEmail(email);
                                            setLoading(false);
                                            if (error) setError(error.message);
                                            else {
                                                setSuccess(true);
                                                // We reuse the success state to show "Check your email"
                                                // But arguably we should have a specific message for reset.
                                                // For MVP reusing the existing success UI is fine as it says "Check your inbox".
                                            }
                                        }}
                                        className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-white/30 hover:text-white/60' : 'text-warm-gray-green/40 hover:text-warm-gray-green/60'}`}
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                    className={`block w-full text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-warm-gray-green/40 hover:text-warm-gray-green'}`}
                                >
                                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className={`mt-8 pt-6 border-t flex items-center gap-3 ${isDarkMode ? 'border-white/5' : 'border-sage/5'}`}>
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5 text-pale-gold' : 'bg-sage/5 text-sage'}`}>
                            <Sparkles size={16} />
                        </div>
                        <p className={`text-[11px] leading-relaxed italic ${isDarkMode ? 'text-white/30' : 'text-warm-gray-green/40'}`}>
                            Cloud accounts enable cross-device synchronization and ensure your settings, goals, and reflections are never lost.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
