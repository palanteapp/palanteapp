import React from 'react';
import { Quote, Sparkles, Blend } from 'lucide-react';

export type ContentType = 'quotes' | 'affirmations' | 'mix';

interface ContentTypeSelectorProps {
    currentType: ContentType;
    onSelect: (type: ContentType) => void;
    isDarkMode: boolean;
}

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ currentType, onSelect, isDarkMode }) => {
    const types = [
        { id: 'quotes', name: 'Quotes', icon: Quote, description: "Wisdom from history's greatest minds" },
        { id: 'affirmations', name: 'Affirmations', icon: Sparkles, description: "Personal power statements" },
        { id: 'mix', name: 'Mix', icon: Blend, description: "Both quotes and affirmations" },
    ];

    return (
        <div className="w-full mt-4">
            {/* Explanatory Text */}
            <p className={`text-center text-sm mb-3 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                Choose your content type
            </p>

            <div className="w-full space-y-2">
                {/* First Row: Quotes and Affirmations */}
                <div className="grid grid-cols-2 gap-2">
                    {types.slice(0, 2).map((type) => {
                        const Icon = type.icon;
                        const isActive = currentType === type.id;

                        return (
                            <button
                                key={type.id}
                                onClick={() => onSelect(type.id as ContentType)}
                                className={`tap -zone group relative px-3 py-3 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border w-full ${isActive
                                    ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold shadow-spa' : 'bg-sage text-white border-sage shadow-spa'
                                    : isDarkMode
                                        ? 'bg-transparent border-white/10 text-white/60 hover:bg-white/5'
                                        : 'bg-white/30 border-sage/10 text-warm-gray-green/60 hover:bg-white/50'
                                    }`}
                                title={type.description}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span className="text-xs font-medium leading-tight text-center">{type.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Second Row: Both (Full Width) */}
                {(() => {
                    const type = types[2]; // "Both"
                    const Icon = type.icon;
                    const isActive = currentType === type.id;

                    return (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id as ContentType)}
                            className={`tap -zone group relative px-3 py-3 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border w-full ${isActive
                                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold shadow-spa' : 'bg-sage text-white border-sage shadow-spa'
                                : isDarkMode
                                    ? 'bg-transparent border-white/10 text-white/60 hover:bg-white/5'
                                    : 'bg-white/30 border-sage/10 text-warm-gray-green/60 hover:bg-white/50'
                                }`}
                            title={type.description}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span className="text-xs font-medium leading-tight text-center">{type.name}</span>
                        </button>
                    );
                })()}
            </div>
        </div>
    );
};
