import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, Loader } from 'lucide-react';

interface AuthScreenProps {
    isDarkMode: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isDarkMode }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const { signInWithEmail } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await signInWithEmail(email);

        if (error) {
            setMessage('Error: ' + error.message);
        } else {
            setMessage('Check your email for the login link!');
        }
        setLoading(false);
    };

    const bgClass = isDarkMode ? 'bg-warm-gray-green text-white' : 'bg-ivory text-warm-gray-green';

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${bgClass}`}>
            <div className="w-full max-w-md text-center">
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    Personalized Motivation, Delivered Daily
                </p>
                <img
                    src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                    alt="Palante"
                    className="w-20 h-20 object-contain mx-auto mb-6 drop-shadow-xl"
                />
                <h1 className="text-4xl font-display font-medium mb-2">Welcome Back</h1>
                <p className={`text-lg mb-8 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                    Sign in to sync your progress
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

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode
                            ? 'bg-pale-gold text-warm-gray-green hover:bg-white'
                            : 'bg-sage text-white hover:bg-sage/90'
                            }`}
                    >
                        {loading ? <Loader className="animate-spin" /> : 'Send Magic Link'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
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
