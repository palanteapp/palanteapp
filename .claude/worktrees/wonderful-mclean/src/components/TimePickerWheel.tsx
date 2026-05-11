import React from 'react';
import { ChevronDown } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface TimePickerWheelProps {
    value: string; // "HH:MM" 24h format
    onChange: (newValue: string) => void;
    isDarkMode: boolean;
}

export const TimePickerWheel: React.FC<TimePickerWheelProps> = ({ value, onChange, isDarkMode }) => {
    const [hStr, mStr] = value.split(':');
    const h = parseInt(hStr || '0');
    const m = parseInt(mStr || '0');

    const updateTime = (newH: number, newM: number) => {
        haptics.selection();
        onChange(`${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`);
    };

    return (
        <div className="flex justify-center items-center gap-4 mb-8">
            {/* Hours */}
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={() => updateTime((h + 1) % 24, m)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'}`}
                >
                    <ChevronDown size={24} className="rotate-180" />
                </button>
                <div className={`text-3xl font-display font-bold w-12 text-center ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                    {(h % 12 || 12).toString()}
                </div>
                <button
                    onClick={() => updateTime((h - 1 + 24) % 24, m)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'}`}
                >
                    <ChevronDown size={24} />
                </button>
            </div>

            <div className={`text-3xl font-bold pb-2 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={() => updateTime(h, (m + 1) % 60)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'}`}
                >
                    <ChevronDown size={24} className="rotate-180" />
                </button>
                <div className={`text-3xl font-display font-bold w-12 text-center ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                    {m.toString().padStart(2, '0')}
                </div>
                <button
                    onClick={() => updateTime(h, (m - 1 + 60) % 60)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'}`}
                >
                    <ChevronDown size={24} />
                </button>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col items-center gap-2 ml-2">
                <button
                    onClick={() => updateTime((h + 12) % 24, m)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'}`}
                >
                    <ChevronDown size={24} className="rotate-180" />
                </button>
                <div className={`text-xl font-bold w-10 text-center ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                    {h >= 12 ? 'PM' : 'AM'}
                </div>
                <button
                    onClick={() => updateTime((h + 12) % 24, m)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-sage/10 text-sage/60'}`}
                >
                    <ChevronDown size={24} />
                </button>
            </div>
        </div>
    );
};
