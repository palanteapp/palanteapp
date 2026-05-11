import React from 'react';
import { SkeletonBox, SkeletonText, SkeletonCircle } from './SkeletonLoader';

interface SkeletonCoachMessageProps {
    isDarkMode?: boolean;
}

export const SkeletonCoachMessage: React.FC<SkeletonCoachMessageProps> = ({ isDarkMode = false }) => {
    return (
        <div className={`w-full p-6 rounded-3xl border ${isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white/60 border-sage/20'
            }`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <SkeletonCircle size={24} />
                <div className="flex-1">
                    <SkeletonBox width="w-32" height="h-4" />
                </div>
                <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
            </div>

            {/* Greeting */}
            <div className="mb-3">
                <SkeletonBox width="w-48" height="h-6" />
            </div>

            {/* Message */}
            <div className="mb-4">
                <SkeletonText lines={2} />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                    <SkeletonBox width="w-16" height="h-8" className="rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                    <SkeletonBox width="w-20" height="h-8" className="rounded-full" />
                </div>
            </div>
        </div>
    );
};
