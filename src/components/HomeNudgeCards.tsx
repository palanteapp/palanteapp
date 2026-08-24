import React from 'react';

// Shared presentational shells for Home's dismissible promo/setup cards.
//
// These used to be five to seven near-identical blocks of JSX pasted around
// App.tsx (title, subtitle, terracotta CTA, small "✕" dismiss). Only one of
// them is ever visible at a time now (see `activeHomeNudge` in App.tsx), but
// the duplication itself was still real: any copy or style tweak had to be
// repeated in every callsite. Extracted here as two small variants; the
// motion/AnimatePresence wrapper (timing differs slightly per card) stays at
// each callsite rather than inside these, so per-card animation tuning isn't
// flattened away.

interface HomeNudgeCardProps {
    isDarkMode: boolean;
    title: string;
    subtitle: string;
    ctaLabel: string;
    onCta: () => void;
    onDismiss: () => void;
    /** 'muted' (default) dims subtitle/dismiss to ~40-60% opacity; 'full' keeps them at the
     *  theme's base text color. Matches the two treatments already in use across these cards. */
    variant?: 'muted' | 'full';
    /** Light-mode border opacity against the terracotta accent, as a Tailwind opacity suffix. */
    lightBorderOpacity?: '10' | '12';
}

/** The plain title/subtitle/CTA/dismiss row shared by Share Day 1, Quick Tour,
 *  the profile nudge, and the interests/personalize card. */
export const HomeNudgeCard: React.FC<HomeNudgeCardProps> = ({
    isDarkMode,
    title,
    subtitle,
    ctaLabel,
    onCta,
    onDismiss,
    variant = 'muted',
    lightBorderOpacity = '10',
}) => {
    const subtitleColor = variant === 'muted'
        ? (isDarkMode ? 'text-white/60' : 'text-sage/60')
        : (isDarkMode ? 'text-white' : 'text-sage');
    const dismissColor = variant === 'muted'
        ? (isDarkMode ? 'text-white/40' : 'text-sage/40')
        : (isDarkMode ? 'text-white' : 'text-sage');

    return (
        <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isDarkMode ? 'bg-white/[0.06] border border-white/[0.10]' : `bg-white border border-[#C96A3A]/${lightBorderOpacity} shadow-sm`}`}>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    {title}
                </p>
                <p className={`text-xs leading-snug ${subtitleColor}`}>
                    {subtitle}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={onCta}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-pale-gold text-sage-dark"
                >
                    {ctaLabel}
                </button>
                <button
                    onClick={onDismiss}
                    className={`text-xs p-1 ${dismissColor}`}
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

interface GradientNudgeCardProps {
    isDarkMode: boolean;
    eyebrow: string;
    title: React.ReactNode;
    /** Optional supporting paragraph below the title (Partner Discovery has one, Memory Callback doesn't). */
    body?: React.ReactNode;
    ctaLabel: React.ReactNode;
    onCta: () => void;
    onDismiss: () => void;
}

/** The terracotta-gradient "your partner" row shared by Partner Discovery and
 *  the Memory Callback card. */
export const GradientNudgeCard: React.FC<GradientNudgeCardProps> = ({
    isDarkMode,
    eyebrow,
    title,
    body,
    ctaLabel,
    onCta,
    onDismiss,
}) => (
    <div
        className="rounded-2xl px-5 py-4"
        style={{
            background: isDarkMode
                ? 'linear-gradient(135deg, rgba(201,106,58,0.18) 0%, rgba(65,93,67,0.40) 100%)'
                : 'linear-gradient(135deg, rgba(201,106,58,0.08) 0%, rgba(250,247,243,1) 100%)',
            border: isDarkMode ? '1px solid rgba(201,106,58,0.30)' : '1px solid rgba(201,106,58,0.20)',
        }}
    >
        <p className={`text-xs font-black uppercase tracking-[0.18em] ${body ? 'mb-1' : 'mb-1.5'}`} style={{ color: isDarkMode ? '#FFFFFF' : '#C96A3A' }}>
            {eyebrow}
        </p>
        <p className={`text-sm font-bold leading-snug ${body ? 'mb-1' : 'mb-3'} ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
            {title}
        </p>
        {body && (
            <p className={`text-xs leading-relaxed mb-3 ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                {body}
            </p>
        )}
        <div className="flex items-center gap-2">
            <button
                onClick={onCta}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#C96A3A' }}
            >
                {ctaLabel}
            </button>
            <button
                onClick={onDismiss}
                className={`text-xs p-1 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    </div>
);
