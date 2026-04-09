import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
    content: string;
    isDarkMode?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, isDarkMode = true }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className={`p-1 rounded-full transition-colors ${isDarkMode
                        ? 'text-white/40 hover:text-white/60 hover:bg-white/10'
                        : 'text-sage/40 hover:text-sage/60 hover:bg-sage/10'
                    }`}
                aria-label="Help"
            >
                <HelpCircle size={14} />
            </button>

            {isVisible && (
                <div
                    className={`absolute z-50 w-64 p-3 rounded-lg shadow-lg text-sm leading-relaxed -top-2 left-6 ${isDarkMode
                            ? 'bg-warm-gray-green border border-white/20 text-white'
                            : 'bg-white border border-sage/20 text-sage'
                        }`}
                >
                    <div className="absolute -left-1 top-3 w-2 h-2 rotate-45 bg-inherit border-l border-b border-inherit" />
                    {content}
                </div>
            )}
        </div>
    );
};
