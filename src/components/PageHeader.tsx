import React from 'react';

/**
 * PageHeader — the one title/eyebrow stack every top-level screen uses.
 *
 * Before this existed, four screens each rolled their own header type:
 * Progress used `text-xs uppercase tracking-[0.18em] font-black`, Explore used
 * `tracking-[0.25em]`, Soundscapes used `text-[11px] tracking-[0.2em] font-bold
 * text-white/70`, and Settings used `tracking-widest font-black`. Same role,
 * four specs. Soundscapes' was the best-tuned of the four (the eyebrow reads as
 * subordinate to the title instead of competing with it), so it is the one this
 * component standardizes on.
 *
 * Deliberately NOT unified here: the chrome *around* the header. Tab screens
 * (Progress, Explore) sit inside the scroll content under the persistent global
 * header, while full-screen panels (Settings, Soundscapes) own their top edge
 * and need a safe-area offset plus a dismiss control. Forcing those through one
 * component would mean a pile of layout props for no gain, so each caller keeps
 * its own wrapper and drops this in the title slot.
 *
 * Dark-mode only, like the rest of the app (`isDarkMode` is hardcoded true in
 * ThemeContext; the light branches elsewhere in the codebase are unreachable).
 */
export interface PageHeaderProps {
    /** The screen's name. Kept short and specific. */
    title: string;
    /**
     * The line under the title, rendered as an uppercase tracked eyebrow.
     * Accepts a node so panels can put a live status indicator in it (a pulsing
     * dot, level bars). It must say something the title does not — a restatement
     * of the title is worse than no eyebrow at all.
     */
    eyebrow?: React.ReactNode;
    /** Optional control row rendered below the eyebrow (icon buttons, CTAs). */
    actions?: React.ReactNode;
    /**
     * `tab` — a scrolling tab page (Progress, Explore): larger title, bottom margin.
     * `panel` — a full-screen panel (Settings, Soundscapes): smaller title, no
     * margin, since the panel's own header bar owns the spacing.
     */
    variant?: 'tab' | 'panel';
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    eyebrow,
    actions,
    variant = 'tab',
    className = '',
}) => {
    const isTab = variant === 'tab';

    return (
        <div className={`${isTab ? 'w-full mb-8' : ''} ${className}`}>
            <h2
                className={`font-display font-medium tracking-tight text-white ${isTab ? 'text-3xl' : 'text-2xl'}`}
            >
                {title}
            </h2>

            {eyebrow && (
                <div className="flex items-center gap-2 mt-1 text-[11px] uppercase tracking-[0.2em] font-bold text-white/70">
                    {eyebrow}
                </div>
            )}

            {actions && (
                <div className="flex items-center gap-2 mt-3">
                    {actions}
                </div>
            )}
        </div>
    );
};
