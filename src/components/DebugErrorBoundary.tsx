import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class DebugErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30">
                    <h3 className="text-red-600 dark:text-red-400 font-medium mb-1">Something went wrong</h3>
                    <p className="text-xs text-red-500/80 break-words font-mono">
                        {this.state.error?.message}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
