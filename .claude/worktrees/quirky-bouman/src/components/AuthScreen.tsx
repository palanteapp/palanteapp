import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, Loader, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from './Logo';

interface AuthScreenProps {
    isDarkMode: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isDarkMode }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordView, setIsPasswordView] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const { signInWithEmail } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await signInWithEmail(email, isPasswordView ? password : undefined);

        if (error) {
            setMessage('Error: ' + error.message);
        } else {
            setMessage(isPasswordView ? 'Successfully logged in!' : 'Check your email for the login link!');
        }
        setLoading(false);
    };

    const bgClass = isDarkMode ? 'bg-sage-mid text-white' : 'bg-ivory text-sage-dark';

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${bgClass}`}>
            <div className="w-full max-w-md text-center">
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    Personalized Motivation, Delivered Daily
                </p>
                <Logo
                    className="h-8 w-auto mx-auto mb-6 drop-shadow-xl text-pale-gold"
                    color="#E5D6A7"
                />
                <h1 className="text-4xl font-display font-medium mb-2">Welcome</h1>
                <p className={`text-lg mb-8 ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                    Sign in to start your journey
                </p>

                <form onSubmit={handleLogin} className="space-y-4 text-left">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 pl-4">
                            Email
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className={`w-full px-6 py-4 rounded-xl outline-none border-2 transition-all ${isDarkMode
                                    ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/20'
                                    : 'bg-white/50 border-sage/20 focus:border-sage text-sage placeholder-sage/30'
                                    }`}
                                required
                            />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={20} />
                        </div>
                    </div>

                    {isPasswordView && (
                        <div className="animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2 pl-4">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full px-6 py-4 rounded-xl outline-none border-2 transition-all ${isDarkMode
                                        ? 'bg-white/5 border-white/10 focus:border-pale-gold text-white placeholder-white/20'
                                        : 'bg-white/50 border-sage/20 focus:border-sage text-sage placeholder-sage/30'
                                        }`}
                                    required={isPasswordView}
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode
                                ? 'bg-pale-gold text-sage-dark hover:bg-white'
                                : 'bg-terracotta-500 text-white hover:bg-sage-600'
                                }`}
                        >
                            {loading ? <Loader className="animate-spin" /> : (isPasswordView ? 'Login' : 'Send Magic Link')}
                            {!loading && <ArrowRight size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsPasswordView(!isPasswordView)}
                            className={`py-2 text-sm font-medium opacity-50 hover:opacity-100 transition-all ${isDarkMode ? 'text-white' : 'text-sage'}`}
                        >
                            {isPasswordView ? 'Use Magic Link instead' : 'Login with Password'}
                        </button>
                    </div>
                </form>

                {message && (
                    <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${message.includes('Error')
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-green-500/10 text-green-500'
                        }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};
