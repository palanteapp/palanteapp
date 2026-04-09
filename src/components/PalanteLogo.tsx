import React from 'react';

interface PalanteLogoProps {
    className?: string;
    fill?: string;
}

export const PalanteLogo: React.FC<PalanteLogoProps> = ({ className = "h-10 w-auto", fill }) => {
    return (
        <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* P Path */}
            <path
                d="M 60 180 L 60 60 Q 60 40 80 40 L 140 40 Q 160 40 160 60 L 160 100 Q 160 120 140 120 L 100 120 L 100 180 L 60 180 Z M 100 80 L 140 80 Q 145 80 145 85 L 145 95 Q 145 100 140 100 L 100 100 L 100 80 Z"
                fill={fill || "#E5D6A7"}
            />
            {/* Arrow Path */}
            <path
                d="M 120 140 L 160 100 L 140 100 L 140 60 L 120 60 L 120 100 L 100 100 Z"
                fill={fill || "#E5D6A7"}
                opacity="0.8"
            />
        </svg>
    );
};
