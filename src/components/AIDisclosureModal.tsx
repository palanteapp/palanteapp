import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Check, ArrowDown } from 'lucide-react';
import { AI_DISCLOSURE } from '../data/aiDisclosure';

interface AIDisclosureModalProps {
    isOpen: boolean;
    /** Called with the user's AI choice. `true` keeps AI on, `false` opts out. */
    onAcknowledge: (aiEnabled: boolean) => void;
    isDarkMode: boolean;
    /**
     * First-launch mode blocks the app until acknowledged. When false the screen is
     * being read from Settings, so it gets a plain "Done" and no consent is rewritten.
     */
    required?: boolean;
    /** Current setting, so opening from Settings reflects reality instead of the default. */
    initialAIEnabled?: boolean;
}

export const AIDisclosureModal: React.FC<AIDisclosureModalProps> = ({
    isOpen,
    onAcknowledge,
    isDarkMode,
    required = true,
    initialAIEnabled = true,
}) => {
    const [aiEnabled, setAiEnabled] = useState(initialAIEnabled);

    // On a phone this screen shows about two of its five sections at rest, which puts
    // the opt-out toggle (and the warning that AI gets things wrong) below the fold.
    // A consent button reachable without scrolling past those is consent to something
    // the user never read, so on first launch the button waits until they get there.
    // Re-reads from Settings are not consent and are not gated.
    const scrollRef = useRef<HTMLDivElement>(null);
    // Whether the text is currently cut off below: drives the fade, so it tracks live
    // scroll position in both modes rather than the one-way consent gate.
    const [atBottom, setAtBottom] = useState(true);
    // Whether they have reached the end at least once, one-way, and only gates the
    // button on first launch. A re-read from Settings is not consent.
    const [hasReadToEnd, setHasReadToEnd] = useState(!required);

    const measureScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        // 8px of slack: sub-pixel layout and rubber-band scrolling rarely land exactly.
        const reachedEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        setAtBottom(reachedEnd);
        if (reachedEnd) setHasReadToEnd(true);
    }, []);

    // Short viewports scroll; tall ones may show everything at once. Measure rather than
    // assume, or the button would never unlock on a large screen.
    useEffect(() => {
        if (!isOpen) return;
        measureScroll();
        const el = scrollRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measureScroll);
        observer.observe(el);
        return () => observer.disconnect();
    }, [isOpen, measureScroll]);

    if (!isOpen) return null;

    // Forest sage (#415D43, the `sage-mid` token) is the panel fill every other popup
    // uses: SlideUpModal, which the age gate renders through immediately before this
    // screen, and DisclaimerModal. The olive #3A3D2E is the app's page background, not a
    // surface color, so a panel filled with it reads muddy against the sage behind it.
    // Opaque, matching SlideUpModal's panel exactly. A translucent fill would be sage
    // over a sage-blurred backdrop, which flattens the panel into the page and leaves
    // the gold border doing all the work of separating them.
    const panel = isDarkMode
        ? 'bg-sage-mid border-[rgba(212,184,130,0.5)] text-white'
        : 'bg-[#FAF7F3] border-[rgba(212,184,130,0.5)] text-sage-dark';
    const muted = isDarkMode ? 'text-white/70' : 'text-sage-dark/70';
    const headingColor = isDarkMode ? 'text-pale-gold' : 'text-sage-dark';
    const cardBg = isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white/70 border-sage/10';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/40 backdrop-blur-md animate-fade-in">
            <div className={`relative w-full max-w-md max-h-[88vh] flex flex-col rounded-[32px] border backdrop-blur-xl ${panel}`}>

                {/* Header: stays put while the body scrolls */}
                <div className="px-7 pt-8 pb-5 shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isDarkMode ? 'bg-white/5' : 'bg-sage/10'}`}>
                        <Sparkles size={26} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} strokeWidth={1.5} />
                    </div>
                    <h2 className={`text-3xl font-display font-bold leading-tight mb-2 ${headingColor}`}>
                        {AI_DISCLOSURE.title}
                    </h2>
                    <p className={`text-sm font-body leading-relaxed ${muted}`}>
                        {AI_DISCLOSURE.intro}
                    </p>
                </div>

                {/* Body */}
                <div
                    ref={scrollRef}
                    onScroll={measureScroll}
                    className="flex-1 overflow-y-auto px-7 custom-scrollbar"
                >
                    <div className="space-y-5 pb-5">
                        {AI_DISCLOSURE.sections.map((section) => (
                            <div key={section.heading}>
                                <h3 className={`font-display font-bold text-sm mb-1.5 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                    {section.heading}
                                </h3>
                                <p className={`text-sm font-body leading-relaxed ${muted}`}>
                                    {section.body}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* The opt-out lives inside the disclosure, not one screen away
                        a choice the user has to scroll past is a choice they were given. */}
                    <div className={`p-4 rounded-2xl border mb-5 ${cardBg}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className={`font-body font-medium text-sm ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                                    Use AI features
                                </div>
                                <div className={`text-xs font-body mt-0.5 ${muted}`}>
                                    {aiEnabled
                                        ? 'Your partner, daily messages, and reflections are generated'
                                        : 'Nothing you write will be sent anywhere'}
                                </div>
                            </div>
                            <button
                                onClick={() => setAiEnabled(!aiEnabled)}
                                role="switch"
                                aria-checked={aiEnabled}
                                aria-label="Use AI features"
                                className={`relative w-12 h-6 rounded-full shrink-0 transition-colors ${aiEnabled
                                    ? 'bg-[#C96A3A]'
                                    : isDarkMode ? 'bg-white/20' : 'bg-sage/20'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative px-7 pb-7 pt-4 shrink-0">
                    {/* Fade tells the eye there's more above the button, so "scroll to read"
                        is a visible affordance rather than an instruction people resent. */}
                    {!atBottom && (
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute left-0 right-0 bottom-full h-12 bg-gradient-to-t to-transparent ${isDarkMode ? 'from-sage-mid' : 'from-[#FAF7F3]'}`}
                        />
                    )}
                    <button
                        onClick={() => onAcknowledge(aiEnabled)}
                        disabled={!hasReadToEnd}
                        className={`w-full py-4 rounded-full font-body font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2 ${hasReadToEnd
                            ? 'bg-[#C96A3A] text-white hover:bg-[#A8521F] active:scale-[0.98]'
                            : isDarkMode
                                ? 'bg-white/10 text-white/40 cursor-default'
                                : 'bg-sage/10 text-sage-dark/40 cursor-default'
                            }`}
                    >
                        {!hasReadToEnd
                            ? (<><ArrowDown size={18} /> Scroll to read it all</>)
                            : required
                                ? (<><Check size={18} /> I understand</>)
                                : 'Done'}
                    </button>
                    {required && (
                        <p className={`text-[11px] font-body text-center mt-3 ${isDarkMode ? 'text-white/40' : 'text-sage-dark/40'}`}>
                            You can change this any time in Settings.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
