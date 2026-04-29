import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    name?: string; // To identify which boundary caught the error
    onReset?: () => void; // Callback to reset state/recover
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] animate-fade-in bg-red-500/5 rounded-2xl border border-red-500/20 m-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm opacity-70 mb-4 max-w-xs mx-auto">
                        {this.props.name ? `The ${this.props.name} encountered an error.` : 'We encountered an unexpected issue.'}
                    </p>
                    {this.state.error && (
                        <div className="mb-6 p-4 bg-black/5 dark:bg-white/5 rounded-xl text-left overflow-auto max-w-md mx-auto">
                            <p className="text-xs font-mono text-red-500 mb-2 break-words">
                                ERROR: {this.state.error.message}
                            </p>
                            <details className="cursor-pointer">
                                <summary className="text-[10px] uppercase tracking-widest opacity-50">View Details</summary>
                                <pre className="text-[10px] opacity-40 mt-2 font-mono whitespace-pre-wrap">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {this.props.onReset && (
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    this.props.onReset?.();
                                }}
                                className="px-6 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-transparent border border-red-500/30 text-red-500 rounded-full text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                            <Home size={16} />
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
