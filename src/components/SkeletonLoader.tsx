import React from 'react';

interface SkeletonBoxProps {
    width?: string;
    height?: string;
    className?: string;
}

interface SkeletonTextProps {
    lines?: number;
    className?: string;
}

interface SkeletonCircleProps {
    size?: number;
    className?: string;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
    width = 'w-full',
    height = 'h-4',
    className = ''
}) => {
    return (
        <div
            className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%] ${className}`}
        />
    );
};

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    className = ''
}) => {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBox
                    key={i}
                    width={i === lines - 1 ? 'w-3/4' : 'w-full'}
                    height="h-3"
                />
            ))}
        </div>
    );
};

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
    size = 40,
    className = ''
}) => {
    return (
        <div
            className={`rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer bg-[length:200%_100%] ${className}`}
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    );
};
