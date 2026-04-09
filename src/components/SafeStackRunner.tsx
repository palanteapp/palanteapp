import React from 'react';
import { StackRunner } from './StackRunner';
import { ErrorBoundary } from './ErrorBoundary';
import type { RoutineStack, UserProfile } from '../types';

interface SafeStackRunnerProps {
    routine: RoutineStack;
    onComplete: () => void;
    onClose: () => void;
    isDarkMode: boolean;
    user: UserProfile;
    onUpdateUser: (u: Partial<UserProfile>) => void;
}

/**
 * A wrapper around StackRunner that provides a safety net against crashes.
 * It ensures that if the routine execution fails, the user can still exit gracefully.
 */
export const SafeStackRunner: React.FC<SafeStackRunnerProps> = (props) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm">
            <ErrorBoundary
                name="Routine Runner"
                onReset={props.onClose}
                fallback={null} // We'll let the ErrorBoundary default UI handle it, or we could pass a custom one
            >
                <div className="absolute inset-0 z-[60]">
                    <StackRunner {...props} />
                </div>
            </ErrorBoundary>
        </div>
    );
};
