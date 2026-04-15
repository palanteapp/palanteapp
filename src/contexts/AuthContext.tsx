import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthErrorResult {
    error: AuthError | { message: string } | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithEmail: (email: string, password?: string) => Promise<AuthErrorResult>;
    signUpWithEmail: (email: string, password?: string) => Promise<AuthErrorResult>;
    signOut: () => Promise<AuthErrorResult>;
    resendVerification: (email: string) => Promise<AuthErrorResult>;
    resetPasswordForEmail: (email: string) => Promise<AuthErrorResult>;
    updatePassword: (password: string) => Promise<AuthErrorResult>;
    deleteAccount: () => Promise<AuthErrorResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, password?: string) => {
        try {
            if (!password) {
                // If no password, use magic link (OTP)
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: window.location.origin,
                    }
                });
                return { error };
            }
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error?.status === 429) {
                return { error: { message: 'Too many requests. Please wait a bit or check your Supabase rate limits.' } };
            }
            return { error };
        } catch (error: unknown) {
            console.error('Sign in error:', error);
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    const signUpWithEmail = async (email: string, password?: string) => {
        try {
            if (!password) throw new Error("Password required");

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error?.status === 429) {
                return { error: { message: 'Rate limit exceeded. Supabase free tier allows only a few emails per hour.' } };
            }
            return { error };
        } catch (error: unknown) {
            console.error('Sign up unexpected error:', error);
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            return { error };
        } catch (error: unknown) {
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    const resendVerification = async (email: string) => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            if (error?.status === 429) {
                return { error: { message: 'Resend limit reached. Please wait an hour or check your Supabase dashboard.' } };
            }
            return { error };
        } catch (error: unknown) {
            console.error('Resend error:', error);
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    const resetPasswordForEmail = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error?.status === 429) {
                return { error: { message: 'Too many requests. Please wait a bit.' } };
            }
            return { error };
        } catch (error: unknown) {
            console.error('Reset password error:', error);
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    const updatePassword = async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({ password });
            return { error };
        } catch (error: unknown) {
            console.error('Update password error:', error);
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    const deleteAccount = async () => {
        try {
            if (!user) throw new Error("No user logged in");

            // 1. Delete data via API
            const { error: apiError } = await api.deleteUserAccount(user.id);
            if (apiError) return { error: apiError };

            // 2. Sign out (this will clear session state)
            const { error: authError } = await supabase.auth.signOut();
            return { error: authError };
        } catch (error: unknown) {
            console.error('Delete account error:', error);
            return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signInWithEmail,
            signUpWithEmail,
            signOut,
            resendVerification,
            resetPasswordForEmail,
            updatePassword,
            deleteAccount
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
