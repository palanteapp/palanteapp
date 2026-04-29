import React, { useState } from 'react';
import { X, Heart, Sparkles, Lock } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { SlideUpModal } from './SlideUpModal';

interface LetterWriteModalProps {
    isDarkMode: boolean;
    context: 'meditation' | 'goal_achievement' | 'streak_milestone' | 'manual';
    contextDetails?: string;
    onSave: (content: string, sealedUntil: string) => void;
    onClose: () => void;
}

const SEAL_PRESETS = [
    { label: '30 days', days: 30 },
    { label: '60 days', days: 60 },
    { label: '90 days', days: 90 },
    { label: '6 months', days: 180 },
];

const addDays = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

export const LetterWriteModal: React.FC<LetterWriteModalProps> = ({
    isDarkMode,
    context,
    contextDetails,
    onSave,
    onClose
}) => {
    const [content, setContent] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<number>(90);
    const [customDate, setCustomDate] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    const sealedUntil = useCustom && customDate ? customDate : addDays(selectedPreset);

    const getPrompt = () => {
        switch (context) {
            case 'meditation':
                return "You just completed a meditation. How are you feeling right now? Write a note to yourself for a tougher day.";
            case 'goal_achievement':
                return `You just achieved: ${contextDetails}. Capture this moment of success for when you need it most.`;
            case 'streak_milestone':
                return `You've reached ${contextDetails}! What would you tell yourself on a day when you're struggling?`;
            case 'manual':
                return "You're doing great right now. Write an encouraging note to your future self.";
        }
    };

    const handleSave = () => {
        if (content.trim().length === 0) return;
        haptics.success();
        onSave(content, sealedUntil);
    };

    const minDate = addDays(7);

    const formatUnlockDate = () => {
        const d = new Date(sealedUntil + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <SlideUpModal
            isOpen={true}
            onClose={onClose}
            isDarkMode={isDarkMode}
            showCloseButton={false}
        >
            <div className="p-8 pb-12">
                {/* Close Button */}
                <button
                    onClick={() => { haptics.light(); onClose(); }}
                    className="absolute top-6 right-6 p-2 rounded-full transition-all bg-white/[0.12] hover:bg-white/[0.18] shadow-sm text-white"
                >
                    <X size={24} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-white/[0.12] flex items-center justify-center shadow-md rotate-3">
                        <Heart size={48} className="text-white" fill="currentColor" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h3 className="text-3xl font-display font-medium text-white mb-2">
                        Letter to Future You
                    </h3>
                    <p className="text-white/60 font-black text-[12px] uppercase tracking-widest">
                        A legacy of intention
                    </p>
                </div>

                {/* Prompt */}
                <div className="p-5 rounded-3xl bg-white/[0.08] border border-white/10 mb-8">
                    <p className="text-center text-sm font-medium leading-relaxed text-white">
                        {getPrompt()}
                    </p>
                </div>

                {/* Textarea */}
                <div className="relative group">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Dear future me..."
                        className="w-full h-48 p-6 rounded-[2.5rem] font-display text-lg resize-none focus:outline-none transition-all shadow-inner bg-white/[0.08] border-2 border-white/10 focus:border-[#E5D6A7] text-white placeholder-white/40"
                        autoFocus
                    />
                    <div className="absolute bottom-6 right-6 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
                        {content.length} characters
                    </div>
                </div>

                {/* Seal Until */}
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Lock size={13} className="text-white/50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Seal until</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {SEAL_PRESETS.map((p) => (
                            <button
                                key={p.days}
                                onClick={() => { setSelectedPreset(p.days); setUseCustom(false); haptics.selection(); }}
                                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                                    !useCustom && selectedPreset === p.days
                                        ? 'bg-white/20 text-white border border-white/30'
                                        : 'bg-white/[0.08] text-white/50 border border-white/10 hover:bg-white/[0.12]'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { setUseCustom(true); haptics.selection(); }}
                            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                                useCustom
                                    ? 'bg-white/20 text-white border border-white/30'
                                    : 'bg-white/[0.08] text-white/50 border border-white/10 hover:bg-white/[0.12]'
                            }`}
                        >
                            Custom
                        </button>
                    </div>
                    {useCustom && (
                        <input
                            type="date"
                            min={minDate}
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="mt-3 w-full px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/10 text-white text-sm focus:outline-none focus:border-[#E5D6A7] [color-scheme:dark]"
                        />
                    )}
                    {(!useCustom || customDate) && (
                        <p className="mt-3 text-center text-[11px] text-white/40">
                            This letter unlocks on <span className="text-white/70 font-semibold">{formatUnlockDate()}</span>
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4 mt-8">
                    <button
                        onClick={handleSave}
                        disabled={content.trim().length === 0 || (useCustom && !customDate)}
                        className={`w-full py-5 rounded-[2.5rem] font-display font-medium text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                            content.trim().length === 0 || (useCustom && !customDate)
                                ? 'bg-white/[0.08] text-white/30 cursor-not-allowed shadow-none'
                                : 'bg-white/[0.15] text-white hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        <Sparkles size={20} className={content.trim().length === 0 ? 'opacity-20' : 'animate-pulse'} />
                        <span>Seal &amp; Send to the Future</span>
                    </button>
                    <button
                        onClick={() => { haptics.light(); onClose(); }}
                        className="w-full py-4 rounded-[2.5rem] font-display font-medium text-xs uppercase tracking-[0.2em] transition-all bg-white/[0.08] text-white hover:bg-white/[0.15]"
                    >
                        Skip for Now
                    </button>
                </div>

                {/* Reassurance */}
                <div className="mt-10 flex items-center justify-center gap-2">
                    <Heart size={14} className="text-white/60" fill="currentColor" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        Sealed. Private. Yours alone.
                    </p>
                </div>
            </div>
        </SlideUpModal>
    );
};
