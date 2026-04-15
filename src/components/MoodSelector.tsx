import React from 'react';
import { Smile, Frown, Battery, Zap, Cloud, Sun } from 'lucide-react';
import { haptics } from '../utils/haptics';

export type Mood = 'Happy' | 'Anxious' | 'Tired' | 'Energetic' | 'Calm' | 'Stressed';

interface MoodSelectorProps {
    currentMood: Mood | null;
    onSelect: (mood: Mood) => void;
    isDarkMode: boolean;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ currentMood, onSelect, isDarkMode }) => {


    const moods: { id: Mood; icon: React.FC<{ size?: number; className?: string }>; label: string; color: string }[] = [
        { id: 'Happy', icon: Smile, label: 'Happy', color: 'bg-yellow-400' },
        { id: 'Energetic', icon: Zap, label: 'Energetic', color: 'bg-orange-400' },
        { id: 'Calm', icon: Sun, label: 'Calm', color: 'bg-blue-300' },
        { id: 'Tired', icon: Battery, label: 'Tired', color: 'bg-purple-300' },
        { id: 'Anxious', icon: Cloud, label: 'Anxious', color: 'bg-gray-400' },
        { id: 'Stressed', icon: Frown, label: 'Stressed', color: 'bg-red-400' },
    ];

    return (
        <div className="w-full">
            <div className="text-center mb-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                    How are you feeling right now?
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl mx-auto px-4">
                {moods.map((mood) => {
                    const Icon = mood.icon;
                    const isSelected = currentMood === mood.id;

                    return (
                        <button
                            key={mood.id}
                            onClick={() => {
                                haptics.light();
                                onSelect(mood.id);
                            }}
                            className={`flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex-shrink-0 ${isSelected
                                ? isDarkMode
                                    ? 'bg-pale-gold text-rich-black shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-105'
                                    : 'bg-sage text-white shadow-spa scale-105'
                                : isDarkMode
                                    ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    : 'bg-white/40 text-sage/70 hover:bg-white/60 hover:text-sage'
                                }`}
                        >
                            <Icon size={14} />
                            <span>{mood.label}</span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
};
