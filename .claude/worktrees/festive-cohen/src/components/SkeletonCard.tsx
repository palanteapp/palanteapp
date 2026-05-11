import React from 'react';

interface SkeletonCardProps {
    type?: 'quote' | 'coach' | 'dashboard';
    isDarkMode?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    type = 'quote',
    isDarkMode = false
}) => {
    const shimmerClass = `
        relative overflow-hidden
        before:absolute before:inset-0
        before:-translate-x-full
        before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r
        before:from-transparent
        ${isDarkMode
            ? 'before:via-white/10 before:to-transparent'
            : 'before:via-sage/10 before:to-transparent'
        }
    `;

    const bgClass = isDarkMode ? 'bg-white/5' : 'bg-sage/5';
    const borderClass = isDarkMode ? 'border-white/10' : 'border-sage/10';

    if (type === 'quote') {
        return (
            <div className={`rounded-3xl border p-8 ${bgClass} ${borderClass} animate-fade-in`}>
                {/* Quote text skeleton */}
                <div className="space-y-3 mb-6">
                    <div className={`h-6 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '90%' }} />
                    <div className={`h-6 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '95%' }} />
                    <div className={`h-6 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '85%' }} />
                </div>

                {/* Author skeleton */}
                <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '40%' }} />
            </div>
        );
    }

    if (type === 'coach') {
        return (
            <div className={`rounded-2xl border p-6 ${bgClass} ${borderClass} animate-fade-in`}>
                {/* Header skeleton */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full ${bgClass} ${shimmerClass}`} />
                    <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '120px' }} />
                </div>

                {/* Message skeleton */}
                <div className="space-y-2">
                    <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '100%' }} />
                    <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '95%' }} />
                    <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '88%' }} />
                </div>
            </div>
        );
    }

    // Dashboard card skeleton
    return (
        <div className={`rounded-2xl border p-6 ${bgClass} ${borderClass} animate-fade-in`}>
            {/* Title skeleton */}
            <div className={`h-5 rounded-lg mb-4 ${bgClass} ${shimmerClass}`} style={{ width: '60%' }} />

            {/* Content skeleton */}
            <div className="space-y-3">
                <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '100%' }} />
                <div className={`h-4 rounded-lg ${bgClass} ${shimmerClass}`} style={{ width: '90%' }} />
            </div>
        </div>
    );
};
