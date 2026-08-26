import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, Wind, Waves, Trees, Droplets, Zap, Radio, Moon, Sun, Music, Speaker, Bird, Save, Plus, X, Coffee, Sparkles, HelpCircle, Target, Heart, Bug, Cat, Play, Trash2, LayoutGrid } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { PalanteAudioBridge } from '../plugins/PalanteAudioBridge';
import { haptics } from '../utils/haptics';
import { SYNTH_SOUNDS, SynthVoice, getSynthLoopBlobUrl } from '../utils/synthSounds';
import { getAudioContext, getMasterLimiter } from '../utils/audioGraph';
import { startLoop, acquireFileLoopBlob, releaseFileLoopBlob, type LoopHandle } from '../utils/loopEngine';
import type { UserProfile, SoundMix } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { SlideUpModal } from './SlideUpModal';
import { PageHeader } from './PageHeader';

interface SoundMixerProps {
    isDarkMode: boolean; // Kept for interface compatibility
    isVisible: boolean;
    onClose: () => void;
    user?: UserProfile;
    onSaveMix?: (mix: SoundMix) => void;
    onDeleteMix?: (mixId: string) => void;
    source?: 'meditation' | 'dashboard';
    /**
     * This panel is a fixed overlay with its own internal scroll container, so scrolling
     * inside it never fires a `window` scroll event. Without this, the app's scroll-aware
     * bottom nav (hide on scroll down, show on scroll up, same as Home/Meditation) never
     * reacts here. Wired to the internal container's scrollTop.
     */
    onContentScroll?: (scrollTop: number) => void;
}

interface SoundTrack {
    id: string;
    label: string;
    category: 'Nature' | 'Focus' | 'Noise' | 'Heritage' | 'Zen' | 'Ambient' | 'Bilateral' | 'Sleep';
    src: string;
    icon: React.ElementType;
}
const SOUNDS: SoundTrack[] = [
    // Nature
    { id: 'beach', label: 'Beach & Birds', category: 'Nature', src: '/sounds/beach-and-birds.m4a', icon: Bird },
    { id: 'rain', label: 'Gentle Rain', category: 'Nature', src: '/sounds/gentle-rain.m4a', icon: Droplets },
    { id: 'thunder', label: 'Distant Thunder', category: 'Nature', src: '/sounds/distant-rain-and-thunder.m4a', icon: Cloud },
    { id: 'river', label: 'Flowing River', category: 'Nature', src: '/sounds/flowing-river.m4a', icon: Waves },
    { id: 'ocean', label: 'Ocean Waves', category: 'Nature', src: '/sounds/ocean-waves.m4a', icon: Waves },
    { id: 'shoreline', label: 'Shoreline', category: 'Nature', src: '/sounds/shoreline.m4a', icon: Waves },
    { id: 'waterfall', label: 'Waterfall', category: 'Nature', src: '/sounds/waterfall.m4a', icon: Droplets },
    { id: 'wind', label: 'Calm Wind', category: 'Nature', src: '/sounds/calm-wind.m4a', icon: Wind },
    { id: 'forest', label: 'Deep Forest', category: 'Nature', src: '/sounds/forest.m4a', icon: Trees },
    { id: 'autumn', label: 'Autumn Wind', category: 'Nature', src: '/Autumn%20Wind.m4a', icon: Wind },
    { id: 'birds', label: 'Birdsong', category: 'Nature', src: '/sounds/birdsong.m4a', icon: Bird },
    { id: 'fire', label: 'Camp Fire', category: 'Nature', src: '/sounds/camp-fire.m4a', icon: Zap },
    { id: 'whale', label: 'Whale Sounds', category: 'Nature', src: '/sounds/whale-sounds.m4a', icon: Waves },
    { id: 'cat-purring', label: 'Cat Purring', category: 'Nature', src: '/sounds/cat-purring.m4a', icon: Cat },

    // Ambient
    { id: 'cafe1', label: 'Busy Cafe 1', category: 'Ambient', src: '/sounds/busy-cafe-1.m4a', icon: Coffee },
    { id: 'cafe2', label: 'Busy Cafe 2', category: 'Ambient', src: '/sounds/busy-cafe-2.m4a', icon: Coffee },
    { id: 'cafe3', label: 'Busy Cafe 3', category: 'Ambient', src: '/sounds/busy-cafe-3.m4a', icon: Coffee },
    { id: 'cafe4', label: 'Busy Cafe 4', category: 'Ambient', src: '/busy-cafe-4.m4a', icon: Coffee },

    // Heritage
    { id: 'coqui', label: 'Boriquen Coqui', category: 'Heritage', src: '/sounds/boriquen-coqui.m4a', icon: Moon },
    { id: 'singing-bowl', label: 'Singing Bowl', category: 'Heritage', src: '/sounds/singing-bowl.m4a', icon: Music },
    { id: '1970', label: '1970 PR', category: 'Heritage', src: '/sounds/1970-pr.m4a', icon: Radio },
    { id: 'kalimba', label: 'Kalimba Africa', category: 'Heritage', src: '/sounds/kalimba-africa.m4a', icon: Music },
    { id: 'colombia', label: 'Colombia EAS', category: 'Heritage', src: '/colombia-eas.m4a', icon: Music },
    { id: 'omgum', label: 'Om Gum Shreem Chant', category: 'Heritage', src: '/sounds/om-gum-shreem-maha-lakshmiyei-namaha.m4a', icon: Sun },

    // Focus
    { id: '40hz', label: 'Binaural Gamma 40Hz', category: 'Focus', src: '/sounds/binaural-gamma-40-hz-focus.mp3', icon: Zap },
    { id: '528hz', label: 'Binaural 528Hz', category: 'Focus', src: '/sounds/binaural-528-hz-love.mp3', icon: Sun },
    { id: '8hz', label: 'Binaural Alpha 8Hz', category: 'Focus', src: '/sounds/binaural-alpha-8-hz-creativity.mp3', icon: Moon },
    { id: '4hz', label: 'Binaural Theta 4Hz', category: 'Focus', src: '/sounds/binaural-theta-4-hz-healing.mp3', icon: Waves },

    // Noise
    { id: 'white', label: 'White Noise', category: 'Noise', src: '/sounds/white-noise.mp3', icon: Speaker },
    { id: 'brown', label: 'Brown Noise', category: 'Noise', src: '/sounds/brown-noise.mp3', icon: Speaker },
    { id: 'pink', label: 'Pink Noise', category: 'Noise', src: '/sounds/pink-noise.mp3', icon: Speaker },
    { id: 'violet', label: 'Violet Noise', category: 'Noise', src: '/sounds/violet-noise.mp3', icon: Speaker },

    // Zen
    { id: 'zen', label: 'Zen Out', category: 'Zen', src: '/sounds/zen-out.m4a', icon: Music },
    { id: 'adrift', label: 'Set Adrift', category: 'Zen', src: '/sounds/set-adrift.m4a', icon: Waves },
    { id: 'gong', label: 'Gong Bath', category: 'Zen', src: '/sounds/gong-sfx.m4a', icon: Moon },
    { id: 'chill1', label: 'Chill Uno', category: 'Zen', src: '/sounds/chillax-uno.m4a', icon: Music },
    { id: 'chill2', label: 'Chill Dos', category: 'Zen', src: '/sounds/chillax-dos.m4a', icon: Music },
    { id: 'chill3', label: 'Chill Tres', category: 'Zen', src: '/sounds/chillax-tres.m4a', icon: Music },
    { id: 'chill4', label: 'Chill Cuatro', category: 'Zen', src: '/sounds/chillax-quatro.m4a', icon: Music },
    { id: 'chill5', label: 'Chill Cinco', category: 'Zen', src: '/Chill%20Cinco.m4a', icon: Music },

    // Bilateral
    { id: 'bilateral-eternal', label: 'Eternal Reflection', category: 'Bilateral', src: '/sounds/bilateral-eternal-reflection.m4a', icon: Waves },
    { id: 'bilateral-replenished', label: 'Replenished', category: 'Bilateral', src: '/sounds/bilateral-replenished.m4a', icon: Waves },
    { id: 'bilateral-tranquility', label: 'Tranquility', category: 'Bilateral', src: '/sounds/bilateral-tranquility.m4a', icon: Waves },
    { id: 'bilateral-tuneup', label: 'Tune Up', category: 'Bilateral', src: '/sounds/bilateral-tune-up.m4a', icon: Waves },

    // Sleep
    { id: 'box-fan', label: 'Box Fan', category: 'Sleep', src: '/sounds/box-fan.m4a', icon: Wind },
    { id: 'sleep-drone', label: 'Sleepy Time Tea', category: 'Sleep', src: '/sounds/evolving-deep-sleep-drone.m4a', icon: Moon },
    { id: 'sleep-rain', label: 'Rainfall for Sleep', category: 'Sleep', src: '/sounds/gentle-rain-for-relaxation.m4a', icon: Droplets },
    { id: 'heartbeat', label: 'Heartbeat', category: 'Sleep', src: '/sounds/heartbeat.m4a', icon: Heart },
    { id: 'night-crickets', label: 'Night Crickets', category: 'Sleep', src: '/sounds/night-crickets.m4a', icon: Bug },
    { id: 'sleep-piano', label: 'Soft Atmospheric Piano', category: 'Sleep', src: '/sounds/soft-atmospheric-piano.m4a', icon: Music },
];

const RECIPES = [
    {
        id: 'caribbean-nights',
        name: 'Caribbean Nights',
        volumes: { 'ocean': 0.5, 'thunder': 0.3, 'coqui': 0.5 },
        color: 'from-[#6F7B6D] to-[#E5D6A7]' // Sage to Pale Gold
    },
    {
        id: 'deep-focus',
        name: 'Deep Work',
        volumes: { 'brown': 0.6, 'rain': 0.4 },
        color: 'from-[#5C665A] to-[#6F7B6D]' // Darker Sage to Sage
    },
    {
        id: 'zen-garden',
        name: 'Zen Garden',
        volumes: { 'wind': 0.3, 'birds': 0.3, 'river': 0.5 },
        color: 'from-[#E5D6A7] to-[#6F7B6D]' // Pale Gold to Sage
    }
];

// Explicit per-category icons. Deriving these from "the first sound in the
// category" handed Sleep a wind icon and Heritage a moon, so the two most
// distinct categories on the screen looked like each other's neighbours.
const CATEGORY_ICONS: Record<SoundTrack['category'], React.ElementType> = {
    Nature: Trees,
    Ambient: Coffee,
    Heritage: Radio,
    Focus: Zap,
    Noise: Speaker,
    Zen: Music,
    Bilateral: Waves,
    Sleep: Moon,
};

// A preset card that only shows its name asks the user to gamble on a word.
// These two helpers let every mix (built-in or saved) show what is actually
// inside it, which is the whole reason someone would tap one.
const mixSoundIds = (volumes: Record<string, number | undefined>) =>
    Object.keys(volumes).filter(id => SOUNDS.some(s => s.id === id));

const mixSummary = (volumes: Record<string, number | undefined>) =>
    mixSoundIds(volumes)
        .map(id => SOUNDS.find(s => s.id === id)?.label)
        .filter(Boolean)
        .join(' · ');

// Meditation-specific quick presets
const MEDITATION_PRESETS: Record<string, { volumes: Record<string, number> }> = {
    'ocean': { volumes: { 'ocean': 0.5 } },
    'rain': { volumes: { 'rain': 0.5 } },
    // Zen category sounds
    'zen': { volumes: { 'zen': 0.5 } },
    'zenout': { volumes: { 'zen': 0.5 } },
    'adrift': { volumes: { 'adrift': 0.5 } },
    'chill1': { volumes: { 'chill1': 0.5 } },
    'chill2': { volumes: { 'chill2': 0.5 } },
    // Bilateral sounds
    'bilateral-eternal': { volumes: { 'bilateral-eternal': 0.5 } },
    'bilateral-replenished': { volumes: { 'bilateral-replenished': 0.5 } },
    'bilateral-tranquility': { volumes: { 'bilateral-tranquility': 0.5 } },
    'bilateral-tuneup': { volumes: { 'bilateral-tuneup': 0.5 } }
};

// What every background player has to offer the mixer, so enterBackground can
// pick a strategy per sound without the caller caring which it got.
interface BackgroundPlayer {
    setVolume(vol: number): void;
    stop(): void;
}

// The good case, used for every sound we can hand a PCM WAV blob: ONE element,
// native `loop = true`, nothing else. No polling timer, no crossfade, no second
// element. WAV carries no encoder padding, so the OS decoder wraps exactly at
// the baked seam — see acquireFileLoopBlob() in src/utils/loopEngine.ts.
//
// This replaces BackgroundCrossfade for these sounds, and it is worth being
// explicit about why that class could never have worked here: it starts BOTH
// of its elements at once with `loop = true`, so they run permanently in
// phase. Crossfading between two copies of the same stream at the same
// position does not hide a seam — both elements reach it at the same instant,
// and the fade just swaps which one you hear the gap from.
class BackgroundLoop implements BackgroundPlayer {
    private audio: HTMLAudioElement;
    /** Runs on stop, so a refcounted blob URL is released rather than pinned for the session. */
    private onStop: (() => void) | null;

    constructor(src: string, vol: number, onStop?: () => void) {
        this.audio = new Audio(src);
        this.audio.loop = true;
        this.audio.volume = Math.min(1, Math.max(0, vol));
        this.onStop = onStop ?? null;
    }

    async start() {
        await this.audio.play().catch(() => {});
    }

    setVolume(vol: number) {
        this.audio.volume = Math.min(1, Math.max(0, vol));
    }

    stop() {
        try { this.audio.pause(); this.audio.src = ''; } catch { /* already gone */ }
        // Release AFTER the element has let go of the URL, so eviction can
        // never revoke a blob that is still being read.
        this.onStop?.();
        this.onStop = null;
    }
}

class MixerSound {
    private mode: 'undecided' | 'synth' | 'file' = 'undecided';
    private synthSound: SynthVoice | null = null;
    private fileLoop: LoopHandle | null = null;
    private playToken = 0;
    private src: string;
    private id: string;
    public volume = 0.5;
    public isPlaying = false;

    constructor(src: string, id: string) {
        this.src = src;
        this.id = id;
    }

    async play(startVol = 0.5) {
        this.volume = startVol;
        this.isPlaying = true;
        const token = ++this.playToken;
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => { });
        }

        if (this.mode === 'undecided') {
            const synthSpec = SYNTH_SOUNDS[this.id];
            if (synthSpec) {
                this.mode = 'synth';
                this.synthSound = new SynthVoice(synthSpec);
            } else {
                this.mode = 'file';
            }
        }
        // Toggled off (or re-played) while deciding the mode, don't start a stale voice.
        if (token !== this.playToken) return;

        if (this.mode === 'synth' && this.synthSound) {
            this.synthSound.play(ctx, this.volume, getMasterLimiter(ctx));
            // Pre-render the background loop blob so it's ready if the app backgrounds.
            const spec = SYNTH_SOUNDS[this.id];
            if (spec) getSynthLoopBlobUrl(this.id, spec, ctx.sampleRate).catch(() => {});
        } else if (this.mode === 'file') {
            // Replaces any handle from a previous play() of this same voice, so
            // a fast off/on can't leave two loops of one sound running.
            this.fileLoop?.stop();
            this.fileLoop = null;
            const handle = await startLoop({
                src: this.src,
                volume: this.volume,
                // Quiet in normal operation — only surfaces the events that
                // matter for diagnosing a real on-device dropout report,
                // via Safari Web Inspector, without the full per-cycle trace.
                onLog: (event) => {
                    if (event.type === 'error' || event.type === 'underrun') {
                        console.warn(`[soundmixer:${this.id}]`, event);
                    }
                },
            });
            // Toggled off while the file was decoding: don't leave it playing.
            if (token !== this.playToken) {
                handle?.stop();
                return;
            }
            this.fileLoop = handle;
        }
    }

    stop() {
        this.playToken++;
        this.isPlaying = false;
        this.synthSound?.stop(getAudioContext());
        this.fileLoop?.stop();
    }

    setVolume(vol?: number, instant: boolean = false) {
        if (typeof vol !== 'number' || Number.isNaN(vol)) return;
        this.volume = vol;
        this.synthSound?.setVolume(getAudioContext(), vol, instant);
        this.fileLoop?.setVolume(vol, instant);
        this.bgCrossfade?.setVolume(vol);
    }

    // ── Background-safe playback ─────────────────────────────────────────────
    // Web Audio API is suspended by iOS when the app backgrounds, but plain
    // HTMLAudioElement with loop=true continues when AVAudioSession is .playback.
    // Looped from a PCM WAV blob where possible so the wrap stays seamless
    // even though the audio graph itself is asleep — see BackgroundLoop above.
    private bgCrossfade: BackgroundPlayer | null = null;

    enterBackground(vol: number) {
        this.leaveBackground();
        if (!this.isPlaying) return;
        const clamped = Math.min(1, Math.max(0, vol));

        // Bail if we returned to the foreground or stopped while preparing.
        const stillBackgrounded = () => this.isPlaying && document.visibilityState !== 'visible';

        // Synth sounds have no file: render/reuse a seamless loop blob instead.
        const spec = SYNTH_SOUNDS[this.id];
        if (spec) {
            const sr = getAudioContext()?.sampleRate || 48000;
            getSynthLoopBlobUrl(this.id, spec, sr).then(url => {
                if (!stillBackgrounded()) return;
                const player = new BackgroundLoop(url, clamped);
                this.bgCrossfade = player;
                player.start();
            }).catch(() => {});
            return;
        }

        // Library files: prefer the PCM blob, whose native loop is sample-exact.
        acquireFileLoopBlob(this.src).then(url => {
            if (!url) {
                if (!stillBackgrounded()) return;
            } else if (!stillBackgrounded()) {
                // Returned to the foreground mid-decode: hand the reference back
                // rather than pinning it until the session ends.
                releaseFileLoopBlob(this.src);
                return;
            }
            if (url) {
                const player = new BackgroundLoop(url, clamped, () => releaseFileLoopBlob(this.src));
                this.bgCrossfade = player;
                player.start();
                return;
            }
            // Only the long-form streamed pieces land here — too large to hold
            // as a blob. They loop the compressed file directly and keep that
            // file's residual encoder padding at the wrap, which they reach
            // once every 8-18 minutes.
            const player = new BackgroundLoop(this.src, clamped);
            this.bgCrossfade = player;
            player.start();
        }).catch(() => {});
    }

    leaveBackground() {
        if (this.bgCrossfade) {
            this.bgCrossfade.stop();
            this.bgCrossfade = null;
        }
    }
}

// One rule for every section divider on this screen, so the eyebrow labels stay
// the only uppercase-tracked type here and every other string can be read as
// language rather than as a label.
const SectionLabel: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-3 mb-4">
        <Icon size={13} className="text-pale-gold/70 flex-shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60 whitespace-nowrap">{children}</span>
        <div className="flex-1 h-px bg-white/10" />
    </div>
);

// Shared shell for a one-tap mix (built in or saved): a stack of the icons it
// actually contains, its name, and the sounds it will start. Rows rather than
// squares because the contents line is the persuasive part and a 2-up square
// has nowhere to put it.
const MixRow: React.FC<{
    name: string;
    eyebrow?: string;
    volumes: Record<string, number | undefined>;
    onPlay: () => void;
    onDelete?: () => void;
}> = ({ name, eyebrow, volumes, onPlay, onDelete }) => {
    const icons = mixSoundIds(volumes).slice(0, 3).map(id => SOUNDS.find(s => s.id === id)!.icon);
    return (
        <div className="relative flex items-center gap-3">
            <button
                onClick={onPlay}
                className="group flex-1 min-w-0 flex items-center gap-4 p-3.5 rounded-3xl bg-sage/25 border border-white/10 text-left transition-[transform,background-color] duration-200 active:scale-[0.98] hover:bg-white/[0.07]"
            >
                {/* Fixed to the width of the full 3-icon row (3 * w-9 + 2 * gap-1.5) so a
                    mix with fewer sounds doesn't shrink this box and drag the title left —
                    every row's title now starts at the same x regardless of icon count. */}
                <div className="flex gap-1.5 flex-shrink-0 w-[120px]">
                    {icons.map((Icon, i) => (
                        <div
                            key={i}
                            className="w-9 h-9 rounded-xl bg-sage-dark/60 border border-white/15 flex items-center justify-center text-white/80"
                        >
                            <Icon size={15} strokeWidth={1.5} />
                        </div>
                    ))}
                </div>
                <div className="min-w-0 flex-1">
                    {eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-pale-gold/70 mb-0.5">{eyebrow}</div>}
                    {/* Wraps rather than truncates, same reasoning as the summary line below:
                        the name is the mix's whole identity, so "Caribbean Nig…" is exactly
                        what it must never render as. */}
                    <div className="font-display font-medium text-[17px] leading-tight text-white">{name}</div>
                    {/* Wraps rather than truncates: this line is the only thing that tells
                        you what tapping the row will actually start, so "Distant Thun…" is
                        the one thing it must not do. */}
                    <div className="text-[12px] text-white/50 leading-snug line-clamp-2 mt-0.5">{mixSummary(volumes)}</div>
                </div>
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors group-hover:bg-pale-gold group-hover:text-sage-dark">
                    <Play size={14} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />
                </div>
            </button>
            {onDelete && (
                // Always visible, never hover-gated: there is no hover on a phone, so
                // the previous opacity-0/group-hover treatment meant a saved mix could
                // never be deleted on the only device this ships to.
                <button
                    onClick={onDelete}
                    aria-label={`Delete ${name}`}
                    className="flex-shrink-0 p-2.5 rounded-2xl bg-white/5 text-white/40 hover:text-red-300 hover:bg-red-500/15 transition-colors active:scale-[0.95]"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
};

export const SoundMixer: React.FC<SoundMixerProps> = ({ isDarkMode: _isDarkMode, isVisible, onClose, user, onSaveMix, onDeleteMix, source, onContentScroll }) => {
    const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set());
    const [volumes, setVolumes] = useState<Record<string, number>>({});
    const lastHapticLevel = useRef<Record<string, number>>({});
    const audioRefs = useRef<Record<string, MixerSound>>({});

    const [isSavingMix, setIsSavingMix] = useState(false);
    const [newMixName, setNewMixName] = useState('');
    const [_activeTab, _setActiveTab] = useState<'mixer' | 'library' | 'presets'>('mixer');
    const [showHelp, setShowHelp] = useState(() => {
        const hasSeenHelp = localStorage.getItem(STORAGE_KEYS.SOUNDMIXER_HELP_SEEN);
        return !hasSeenHelp;
    });
    const [showSciencePopup, setShowSciencePopup] = useState(false);
    const [view, setView] = useState<'mixer' | 'library'>('mixer');
    const [scrollTarget, setScrollTarget] = useState<string | null>(null);

    // Wake Lock + Background Audio
    useEffect(() => {
        const isPlaying = activeSounds.size > 0;
        const updateWakeLock = async () => {
            if (isPlaying) {
                try { await KeepAwake.keepAwake(); } catch (e) {
                    console.error('Failed to acquire wake lock', e);
                }
            }
        };
        updateWakeLock();
        PalanteAudioBridge.setPlaying({ playing: isPlaying }).catch(() => {});
        if (isPlaying) {
            if (navigator.mediaSession) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'Soundscape',
                    artist: 'Palante',
                    album: 'Focus & Rest',
                });
            }
            if (navigator.mediaSession) navigator.mediaSession.playbackState = 'playing';
        } else {
            if (navigator.mediaSession) navigator.mediaSession.playbackState = 'none';
        }
    }, [activeSounds.size]);

    // Keep refs for stable closure access in visibilitychange handler
    const activeSoundsRef = useRef<Set<string>>(activeSounds);
    const volumesRef = useRef<Record<string, number>>(volumes);
    useEffect(() => { activeSoundsRef.current = activeSounds; }, [activeSounds]);
    useEffect(() => { volumesRef.current = volumes; }, [volumes]);

    // Background audio: switch to looping HTMLAudioElement when iOS suspends AudioContext
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                Object.entries(audioRefs.current).forEach(([id, sound]) => {
                    if (activeSoundsRef.current.has(id)) {
                        sound.enterBackground(volumesRef.current[id] ?? 0.5);
                    }
                });
            } else {
                Object.values(audioRefs.current).forEach(s => s.leaveBackground());
                // Wake AudioContext back up when app returns to foreground
                const ctx = (window as { _palanteAudioContext?: AudioContext })._palanteAudioContext;
                ctx?.resume().catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    // Initialize Audio Refs lazily
    const getAudioRef = (id: string, src: string) => {
        if (!audioRefs.current[id]) {
            audioRefs.current[id] = new MixerSound(src, id);
        }
        return audioRefs.current[id];
    };

    // Switch the whole active selection (a recipe, a saved mix, a meditation
    // preset) to `newVolumes` with a real overlapping crossfade instead of the
    // old stop-everything → wait 100ms → play-everything sequence. Each Sound
    // class already ramps its own gain out over ~1s on stop() and in over
    // ~1.5s on play() — the old code just never let those two ramps run at
    // the same time, so every switch had a dead-silent gap between them no
    // matter how good the individual ramps were. Sounds present in both the
    // old and new selection are left running and just glide to their new
    // volume, so switching between mixes that share a layer (e.g. both use
    // rain) never even touches that layer's audio.
    const applyMix = useCallback((newVolumes: Record<string, number>) => {
        const currentlyPlaying = new Set(
            Object.entries(audioRefs.current).filter(([, s]) => s.isPlaying).map(([id]) => id)
        );
        const nextIds = new Set(Object.keys(newVolumes));

        currentlyPlaying.forEach(id => {
            if (!nextIds.has(id)) audioRefs.current[id].stop();
        });

        nextIds.forEach(id => {
            const vol = newVolumes[id];
            const soundData = SOUNDS.find(s => s.id === id);
            if (!soundData) return;
            const audio = getAudioRef(id, soundData.src);
            if (currentlyPlaying.has(id)) {
                audio.setVolume(vol);
            } else {
                audio.play(vol);
            }
        });

        setActiveSounds(nextIds);
        setVolumes(newVolumes);
    }, []);

    useEffect(() => {
        // Eager loading removed for performance Optimization

        const handleRestartSounds = () => {
            Object.values(audioRefs.current).forEach(audio => {
                if (audio.isPlaying) {
                    audio.stop();
                    setTimeout(() => {
                        audio.play(audio.volume || 0.5);
                    }, 100);
                }
            });
        };

        // Listen for preset loading from Meditation inline chips
        const handleLoadPreset = (event: CustomEvent<{ preset?: string }>) => {
            const presetId = event.detail?.preset;
            if (presetId && MEDITATION_PRESETS[presetId]) {
                const preset = MEDITATION_PRESETS[presetId];
                const newVols: Record<string, number> = {};
                Object.entries(preset.volumes).forEach(([id, vol]) => {
                    if (SOUNDS.some(s => s.id === id)) {
                        newVols[id] = vol;
                    } else {
                        console.error(`  ❌ Audio not found in SOUNDS mapping: ${id}`);
                    }
                });
                applyMix(newVols);
            } else {
                console.error(`❌ Invalid preset: ${presetId}`);
            }
        };

        const handleToggleSound = (event: CustomEvent<{ soundId?: string }>) => {
            const soundId = event.detail?.soundId;
            if (!soundId) return;

            const soundData = SOUNDS.find(s => s.id === soundId);
            if (soundData) {
                const audio = getAudioRef(soundId, soundData.src);
                if (audio.isPlaying) {
                    audio.stop();
                } else {
                    audio.play(0.5);
                }
            }
        };

        // Listen for volume changes from inline builder
        const handleSetVolume = (event: CustomEvent<{ soundId?: string; volume?: number }>) => {
            const { soundId, volume } = event.detail || {};
            if (soundId && audioRefs.current[soundId]) {
                audioRefs.current[soundId].setVolume(volume, true); // Use instant for slider updates
            }
        };

        const handleLoadMix = (event: CustomEvent<{ volumes?: Record<string, number> }>) => {
            const volumes = event.detail?.volumes;
            if (!volumes || !Object.keys(volumes).length) return;
            const newVols: Record<string, number> = {};
            Object.entries(volumes).forEach(([id, vol]) => {
                if (SOUNDS.some(s => s.id === id)) newVols[id] = vol;
            });
            applyMix(newVols);
        };

        window.addEventListener('palante-restart-sounds', handleRestartSounds);
        window.addEventListener('palante-load-preset', handleLoadPreset as EventListener);
        window.addEventListener('palante-load-mix', handleLoadMix as EventListener);
        window.addEventListener('palante-toggle-sound', handleToggleSound as EventListener);
        window.addEventListener('palante-set-volume', handleSetVolume as EventListener);

        return () => {
            Object.values(audioRefs.current).forEach(audio => audio.stop());
            window.removeEventListener('palante-restart-sounds', handleRestartSounds);
            window.removeEventListener('palante-load-preset', handleLoadPreset as EventListener);
            window.removeEventListener('palante-load-mix', handleLoadMix as EventListener);
            window.removeEventListener('palante-toggle-sound', handleToggleSound as EventListener);
            window.removeEventListener('palante-set-volume', handleSetVolume as EventListener);
        };
    }, []); // Empty deps - handlers use refs which are always current

    // Initial load effect or view change effect to scroll
    useEffect(() => {
        if (view === 'library' && scrollTarget) {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                const element = document.getElementById(`category-${scrollTarget}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setScrollTarget(null);
            }, 100);
        }
    }, [view, scrollTarget]);

    // Broadcast sound state changes to Meditation component
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('palante-sounds-changed', {
            detail: {
                activeSounds: Array.from(activeSounds),
                volumes
            }
        }));
    }, [activeSounds, volumes]);


    const toggleSound = useCallback((id: string, initialVol = 0.5) => {
        const newActive = new Set(activeSounds);
        const soundData = SOUNDS.find(s => s.id === id);
        if (!soundData) return;

        const audio = getAudioRef(id, soundData.src);

        if (newActive.has(id)) {
            newActive.delete(id);
            audio.stop();
            const newVols = { ...volumes };
            delete newVols[id];
            setVolumes(newVols);
        } else {
            newActive.add(id);
            setVolumes(prev => ({ ...prev, [id]: initialVol }));
            audio.play(initialVol);
        }
        setActiveSounds(newActive);
    }, [activeSounds, volumes]);

    const updateVolume = useCallback((id: string, vol: number) => {
        const ctx = getAudioContext();
        if (ctx?.state === 'suspended') ctx.resume();

        // Essential: Clamp volume precisely for Safari/iOS
        const clampedVol = Math.max(0, Math.min(1, vol));
        setVolumes(prev => ({ ...prev, [id]: clampedVol }));

        if (audioRefs.current[id]) {
            audioRefs.current[id].setVolume(clampedVol, true);
        }

        // Haptic Detents
        const level = Math.round(clampedVol * 10);
        if (level !== lastHapticLevel.current[id]) {
            haptics.light();
            lastHapticLevel.current[id] = level;
        }
    }, []);

    const stopAll = useCallback(() => {
        activeSounds.forEach(id => audioRefs.current[id].stop());
        setActiveSounds(new Set());
        setVolumes({});
    }, [activeSounds]);

    const loadRecipe = useCallback((recipe: { id: string; name: string; volumes: Record<string, number | undefined>; color: string }) => {
        const newVols: Record<string, number> = {};
        Object.entries(recipe.volumes).forEach(([id, vol]) => {
            if (vol === undefined) return;
            if (SOUNDS.some(s => s.id === id)) newVols[id] = vol;
        });
        applyMix(newVols);
    }, [applyMix]);

    const handleSaveMix = useCallback(() => {
        if (!newMixName.trim() || !onSaveMix) return;

        const currentVolumes: Record<string, number> = {};
        activeSounds.forEach(id => currentVolumes[id] = volumes[id]);

        onSaveMix({
            id: Date.now().toString(),
            name: newMixName.trim(),
            volumes: currentVolumes,
            createdAt: new Date().toISOString()
        });
        setNewMixName('');
        setIsSavingMix(false);
    }, [newMixName, onSaveMix, activeSounds, volumes]);

    // Derived State
    const activeSoundList = Array.from(activeSounds).map(id => SOUNDS.find(s => s.id === id)).filter(Boolean) as SoundTrack[];
    const categories = Array.from(new Set(SOUNDS.map(s => s.category)));

    if (!isVisible) return null;

    return (
        <div
            // z-45, same as the Breathwork overlay: this puts the panel's background BELOW the
            // app's persistent global header (z-50, Profile/Koi Pond/Soundscapes icons), so the
            // header renders on top of it seamlessly instead of covering it. The background still
            // covers the full screen (inset-0) so nothing from the page underneath shows through;
            // only the actual CONTENT is pushed down below the header via the spacer below.
            // (A previous version moved the whole container's top edge down instead of just the
            // content, which left a gap where the background didn't reach and the Home page
            // underneath showed through — do not reintroduce that.)
            className="fixed inset-0 z-[45] flex flex-col animate-fade-in backdrop-blur-xl text-white overflow-hidden bg-sage-mid"
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <Target
                    className="absolute top-0 right-0 w-[110vmin] h-[110vmin] translate-x-1/2 -translate-y-1/2 text-[#E8E2D9] opacity-[0.075]"
                />
                <Target
                    className="absolute bottom-0 left-0 w-[90vmin] h-[90vmin] -translate-x-1/2 translate-y-1/2 text-pale-gold opacity-[0.075]"
                />
            </div>

            {/* Spacer: clears the persistent global header, matching Breathing.tsx's offset. */}
            <div style={{ height: 'calc(env(safe-area-inset-top) + 8.5rem)' }} />

            {/* TOP BAR: Header & Global Controls */}
            <div className={`px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between z-10 border-b border-white/5 bg-white/5 backdrop-blur-md gap-4`}>
                <div className="flex items-center justify-between w-full md:w-auto">
                    {/* Shared PageHeader pattern (see PageHeader.tsx) — this screen's
                        title/eyebrow treatment is the one the component standardized on. */}
                    <PageHeader
                        variant="panel"
                        className="relative"
                        title="Soundscapes"
                        eyebrow={
                            <>
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`w-0.5 h-2 rounded-full transition-all duration-500 ${activeSounds.size > 0 ? 'bg-pale-gold animate-pulse' : 'bg-white/10'}`} style={{ animationDelay: `${i * 0.2}s` }} />
                                    ))}
                                </div>
                                <span>
                                    {activeSounds.size > 0 ? `${activeSounds.size} playing` : 'Ready'}
                                </span>
                            </>
                        }
                    />

                    {/* Help moved out of its own stacked row and in beside Close: on a phone
                        that row cost ~40pt of the little vertical space this panel has, and
                        the same modal is already auto-shown on first open, so it does not
                        need a full text chip to be discoverable. */}
                    <div className="flex md:hidden items-center gap-2">
                        {source === 'meditation' && (
                            <button
                                onClick={onClose}
                                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all bg-white/10 text-white border border-white/10 active:scale-[0.97]`}
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={() => setShowHelp(true)}
                            aria-label="How it works"
                            className="p-2.5 rounded-xl bg-white/5 text-white/70 active:scale-[0.97] transition-transform"
                        >
                            <HelpCircle size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-2.5 rounded-xl bg-white/5 text-white active:scale-[0.97] transition-transform"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* TABBED NAVIGATION - CONSOLIDATED FOR PORTRAIT */}
                <div className="flex bg-sage/40 rounded-2xl p-1 border border-white/10 items-center shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setView('mixer')}
                        className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 relative overflow-hidden ${view === 'mixer'
                            ? 'bg-white text-sage shadow-[0_4px_15px_rgba(255,255,255,0.2)]'
                            : 'text-white hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Mixer
                    </button>
                    <button
                        onClick={() => setView('library')}
                        className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden ${view === 'library'
                            ? 'bg-white text-sage shadow-[0_4px_15px_rgba(255,255,255,0.2)]'
                            : 'text-white hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Library
                        {activeSounds.size > 0 && <span className={`w-1 h-1 rounded-full ${view === 'library' ? 'bg-sage' : 'bg-pale-gold'}`} />}
                    </button>
                    {activeSounds.size > 0 && (
                        <button
                            onClick={() => {
                                haptics.medium();
                                stopAll();
                            }}
                            className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] text-white hover:text-white transition-all"
                        >
                            Stop
                        </button>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {source === 'meditation' && (
                        <button
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all bg-white/10 text-white hover:bg-white/20 border border-white/10`}
                        >
                            Back to Meditation
                        </button>
                    )}
                    <button
                        onClick={() => setShowHelp(true)}
                        aria-label="How it works"
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/70 hover:text-white transition-all duration-300"
                    >
                        <HelpCircle size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white hover:text-white transition-all duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative">



                {/* VIEW: MIXER (Active Faders) */}
                {view === 'mixer' && (
                    <div
                        onScroll={(e) => onContentScroll?.(e.currentTarget.scrollTop)}
                        className={`h-full no-scrollbar relative z-10 pt-8 ${activeSoundList.length === 0 ? 'overflow-y-auto px-5 md:p-8' : 'overflow-x-auto flex items-center justify-center min-w-full px-2 md:px-16 gap-2 md:gap-8'}`}
                        // With faders up, bottom clearance matches the Save bar's own footprint
                        // (bottom: 6rem + safe-area, plus its own button height) so they sit fully
                        // between the header and that button. The empty state has no Save bar, so
                        // it only needs to clear the floating nav pill; reserving the taller value
                        // there just left a screenful of nothing under the category chips.
                        style={{ paddingBottom: activeSoundList.length === 0 ? 'calc(7rem + env(safe-area-inset-bottom))' : 'calc(11rem + env(safe-area-inset-bottom))' }}>
                        {activeSoundList.length === 0 ? (
                            // The empty state used to run four screens deep: two rows of 160pt
                            // preset squares that named a mix without saying what was in it,
                            // then eight more 160pt squares for what are really just filters.
                            // Rebuilt as one screen: mixes become rows that show their contents
                            // (the actual reason to tap one), categories become chips.
                            <div className="w-full max-w-2xl mx-auto flex flex-col animate-fade-in pt-2 pb-4">
                                <h3 className="text-[26px] md:text-4xl font-display font-medium text-white text-center tracking-tight leading-tight">Build your soundscape</h3>
                                <p className="mt-2.5 mb-9 text-center text-[14px] text-white/60 leading-relaxed max-w-[19rem] mx-auto">
                                    Start with a ready made mix, or layer your own from the library.
                                </p>

                                {!!user?.savedMixes?.length && (
                                    <div className="mb-9">
                                        <SectionLabel icon={Save}>Your mixes</SectionLabel>
                                        <div className="space-y-3">
                                            {user.savedMixes.map(mix => (
                                                <MixRow
                                                    key={mix.id}
                                                    name={mix.name}
                                                    volumes={mix.volumes as Record<string, number>}
                                                    onPlay={() => { haptics.light(); loadRecipe({ id: mix.id, name: mix.name, volumes: mix.volumes as Record<string, number>, color: '' }); }}
                                                    onDelete={onDeleteMix ? () => onDeleteMix(mix.id) : undefined}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mb-9">
                                    <SectionLabel icon={Sparkles}>Ready made</SectionLabel>
                                    <div className="space-y-3">
                                        {RECIPES.map(recipe => (
                                            <MixRow
                                                key={recipe.id}
                                                name={recipe.name}
                                                volumes={recipe.volumes}
                                                onPlay={() => { haptics.light(); loadRecipe(recipe); }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <SectionLabel icon={Radio}>Browse by category</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => {
                                            const Icon = CATEGORY_ICONS[cat] || Music;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        haptics.light();
                                                        setScrollTarget(cat);
                                                        setView('library');
                                                    }}
                                                    className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-sage/25 border border-white/10 hover:bg-white/[0.07] transition-[transform,background-color] duration-200 active:scale-[0.97]"
                                                >
                                                    <Icon size={15} strokeWidth={1.5} className="text-pale-gold/80" />
                                                    <span className="text-[13px] font-medium text-white/85">{cat}</span>
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => { haptics.light(); setView('library'); }}
                                            className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/[0.16] transition-[transform,background-color] duration-200 active:scale-[0.97]"
                                        >
                                            <LayoutGrid size={15} strokeWidth={1.5} className="text-white" />
                                            <span className="text-[13px] font-semibold text-white">All {SOUNDS.length} sounds</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-center">
                                    <button
                                        onClick={() => { haptics.light(); setShowSciencePopup(true); }}
                                        className="px-5 py-2.5 rounded-full border border-white/10 text-[12px] font-medium text-white/55 hover:text-white hover:bg-white/5 transition-colors active:scale-[0.97]"
                                    >
                                        Why sound helps
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Render Active Faders with High Contrast
                            activeSoundList.map(sound => (
                                <div key={sound.id} className="flex-shrink-0 w-[5.5rem] md:w-32 h-full flex flex-col items-center group relative animate-slide-up-fade">
                                    {/* Identity chip sits ABOVE the track and never moves. It used to ride
                                        the fill line, which meant the one element that tells you WHICH sound
                                        this is was fused with the one element that tells you HOW LOUD it is,
                                        and it sat exactly where the handle needs to be. */}
                                    <div className="relative flex-shrink-0 mb-2.5 w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90">
                                        <sound.icon size={17} strokeWidth={1.5} />
                                        {/* Remove lives on the identity chip rather than on its own
                                            row under the level readout: a full row down there
                                            collided with the floating Save bar and cost the fader
                                            track ~45pt of the little height this column has. The
                                            button's padding gives it a ~36pt hit box around a 20pt dot. */}
                                        <button
                                            onClick={() => { haptics.light(); toggleSound(sound.id); }}
                                            aria-label={`Remove ${sound.label}`}
                                            className="absolute -top-2 -right-3 p-2.5 group/rm"
                                        >
                                            <span className="w-[18px] h-[18px] rounded-full bg-sage-dark border border-white/25 flex items-center justify-center text-white/70 transition-transform group-hover/rm:text-white group-active/rm:scale-90">
                                                <X size={10} strokeWidth={3} />
                                            </span>
                                        </button>
                                    </div>

                                    {/* Glassmorphic Fader Container: flex-1 so it fills whatever room this
                                        column actually has above the label/remove-button, rather than a
                                        vh-based height guessed against the full device viewport — that
                                        guess ran taller than the space left after the header/tabs above and
                                        the safe-area padding below, so the fader overflowed both edges with
                                        no scroll to reach them (looked like the header was "blocking" it). */}
                                    <div className="relative w-16 md:w-20 flex-1 min-h-0 bg-sage/40 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col justify-end group-hover:bg-sage/50 transition-colors duration-300 backdrop-blur-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                                        {/* Precision Tick Marks */}
                                        <div className="absolute inset-y-8 left-2.5 md:left-4 flex flex-col justify-between opacity-20 pointer-events-none">
                                            {[...Array(11)].map((_, i) => (
                                                <div key={i} className={`h-[1px] bg-white ${i % 5 === 0 ? 'w-2.5 md:w-3' : 'w-1.5'}`} />
                                            ))}
                                        </div>

                                        {/* Fill Level */}
                                        <div
                                            className="w-full bg-gradient-to-t from-white/20 to-white/40 border-t border-white/30 relative"
                                            style={{ height: `${(volumes[sound.id] ?? 0) * 100}%` }}
                                        />

                                        {/* Handle. A 4px full-bleed hairline reads as a fill edge, not as
                                            something you can grab, so the fader looked like a thermometer.
                                            The hairline stays for precise reading; the pill on top of it is
                                            the grab affordance. */}
                                        <div
                                            className="absolute left-0 right-0 h-1 z-30 pointer-events-none flex items-center justify-center"
                                            style={{ bottom: `calc(${(volumes[sound.id] ?? 0) * 100}%)` }}
                                        >
                                            <div className="absolute inset-0 bg-white/70 shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
                                            <div className="relative w-7 md:w-9 h-[7px] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-transform duration-150 group-active:scale-110" />
                                        </div>

                                        {/* Touch-Friendly Drag Overlay */}
                                        <div
                                            className="absolute inset-0 w-full h-full cursor-ns-resize z-40 touch-none"
                                            onTouchStart={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const y = e.touches[0].clientY - rect.top;
                                                const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                                                // eslint-disable-next-line react-hooks/refs -- inside a touch event handler, not React render
                                                updateVolume(sound.id, percentage);
                                            }}
                                            onTouchMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const y = e.touches[0].clientY - rect.top;
                                                const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                                                updateVolume(sound.id, percentage);
                                            }}
                                            onMouseDown={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const handleMove = (ev: MouseEvent | TouchEvent) => {
                                                    const clientY = (ev as MouseEvent).clientY ?? (ev as TouchEvent).touches?.[0]?.clientY;
                                                    const y = clientY - rect.top;
                                                    const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                                                    updateVolume(sound.id, percentage);
                                                };
                                                const handleUp = () => {
                                                    window.removeEventListener('mousemove', handleMove);
                                                    window.removeEventListener('mouseup', handleUp);
                                                };
                                                window.addEventListener('mousemove', handleMove);
                                                window.addEventListener('mouseup', handleUp);
                                                handleMove(e.nativeEvent);
                                            }}
                                        />

                                    </div>

                                    {/* Label & Level. Sentence case, not tracked caps: at this column
                                        width "GENTLE R…" was truncating with only two sounds loaded, so
                                        the mixer could not tell you what it was mixing. */}
                                    <div className="flex-shrink-0 mt-2.5 text-center select-none relative z-10 w-full px-0.5">
                                        <div className="font-display font-medium text-[12px] md:text-[13px] leading-tight text-white/90 line-clamp-2">{sound.label}</div>
                                        <div className="text-[12px] text-pale-gold font-mono mt-1 tabular-nums">{Math.round((volumes[sound.id] ?? 0) * 100)}%</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW: LIBRARY (Grid) */}
                {view === 'library' && (
                    // Density rebuild. The old tiles were ~190pt tall for an icon and a name,
                    // so a 52-sound library showed TWO sounds per screenful and a name that
                    // wrapped made its row ragged against its neighbour. These rows are ~62pt
                    // and show around a dozen at a time, with a fixed height so the grid stays
                    // square whatever the name does. The per-tile category caption is gone: it
                    // repeated the section heading directly above it on every single tile.
                    <div
                        onScroll={(e) => onContentScroll?.(e.currentTarget.scrollTop)}
                        className="h-full overflow-y-auto px-5 md:px-8 pt-2"
                        style={{ paddingBottom: 'calc(10.5rem + env(safe-area-inset-bottom))' }}
                    >
                        <div className="max-w-4xl mx-auto">
                            {categories.map(cat => (
                                <div key={cat} id={`category-${cat}`} className="scroll-mt-4">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60 sticky top-0 py-3 z-20 bg-sage-mid font-display">{cat}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pb-7">
                                        {SOUNDS.filter(s => s.category === cat).map(sound => {
                                            const isActive = activeSounds.has(sound.id);
                                            return (
                                                <button
                                                    key={sound.id}
                                                    onClick={() => { haptics.light(); toggleSound(sound.id); }}
                                                    aria-pressed={isActive}
                                                    aria-label={isActive ? `Stop ${sound.label}` : `Play ${sound.label}`}
                                                    className={`
                                                        relative h-[62px] pl-2.5 pr-3 rounded-2xl border text-left flex items-center gap-2.5 overflow-hidden
                                                        transition-[transform,background-color,border-color] duration-200 active:scale-[0.97]
                                                        ${isActive
                                                            ? 'bg-pale-gold border-pale-gold text-sage-dark shadow-[0_6px_20px_rgba(229,214,167,0.25)]'
                                                            : 'bg-sage/25 border-white/10 hover:bg-white/[0.07] text-white'}
                                                    `}
                                                >
                                                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${isActive ? 'bg-sage-dark/15 text-sage-dark' : 'bg-white/[0.07] text-white/80'}`}>
                                                        <sound.icon size={17} strokeWidth={1.5} />
                                                    </div>
                                                    <span className={`min-w-0 flex-1 font-display font-medium text-[13px] leading-[1.15] line-clamp-2 ${isActive ? 'text-sage-dark' : 'text-white/90'}`}>
                                                        {sound.label}
                                                    </span>
                                                    {isActive && (
                                                        <div className="flex-shrink-0 flex items-end gap-[3px] h-3.5" aria-hidden>
                                                            {[3, 5, 4].map((h, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-[2.5px] rounded-full bg-sage-dark/70 animate-pulse"
                                                                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.18}s` }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* BOTTOM BAR: Save & Actions. Cleared above the persistent global nav (which
                    floats at bottom-4/8, z-[55], on top of this panel's z-[45]) rather than sitting
                    flush at bottom-0 — that used to put this bar directly underneath the nav pill,
                    so "Save This Mix" was there but unreachable/invisible behind it. */}
                <div
                    // Mixer-only. In the Library this bar floated over the middle of the sound
                    // grid, hiding two tiles to offer an action that belongs to the other tab:
                    // you pick sounds here and balance/save them there.
                    className={`absolute left-0 right-0 px-5 py-3 z-20 pointer-events-none ${view === 'mixer' ? '' : 'hidden'}`}
                    style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
                >
                    <div className="max-w-3xl mx-auto flex gap-4 pointer-events-auto">
                        {isSavingMix ? (
                            // min-w-0 on the input is load-bearing: a flex item's default
                            // min-width is auto (its own content size), not 0, so without this
                            // the input refused to shrink below its intrinsic width on a phone
                            // screen and pushed the Cancel button off the right edge instead of
                            // giving it room. Cancel is also now an icon button rather than a
                            // text label, freeing up real space for the name field and Save.
                            <div className="flex-1 min-w-0 bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20 flex items-center gap-2 animate-fade-in shadow-2xl">
                                <input
                                    type="text"
                                    value={newMixName}
                                    onChange={(e) => setNewMixName(e.target.value)}
                                    placeholder="Name your mix"
                                    // outline-none, not just focus:ring-0: WebKit draws its own bright
                                    // blue focus ring on iOS that Tailwind's ring utilities do not touch,
                                    // and it was the loudest thing on the screen.
                                    className="flex-1 min-w-0 bg-transparent border-none text-white outline-none focus:outline-none focus:ring-0 px-4 placeholder:text-white/40 font-medium"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveMix}
                                    disabled={!newMixName.trim()}
                                    className="flex-shrink-0 px-6 py-3 rounded-xl bg-pale-gold text-sage-dark font-bold uppercase tracking-widest hover:bg-white transition-[background-color,opacity,transform] active:scale-[0.97] disabled:opacity-40"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsSavingMix(false)}
                                    aria-label="Cancel"
                                    className="flex-shrink-0 p-3 rounded-xl hover:bg-white/10 text-white hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : activeSounds.size > 0 && (
                            // Filled in the panel's accent rather than another sheet of white/10
                            // glass: this is the one thing to do once a mix sounds right, and at
                            // the same weight as every other surface here it read as decoration.
                            <button
                                onClick={() => { haptics.light(); setIsSavingMix(true); }}
                                className="flex-1 py-4 rounded-2xl bg-pale-gold text-sage-dark font-bold uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex items-center justify-center gap-2 transition-transform duration-200 active:scale-[0.98]"
                            >
                                <Save size={18} />
                                Save this mix
                            </button>
                        )}
                    </div>
                </div>

                {/* Help/Popups */}
                <SlideUpModal isOpen={showHelp} onClose={() => { setShowHelp(false); localStorage.setItem(STORAGE_KEYS.SOUNDMIXER_HELP_SEEN, 'true'); }} isDarkMode={true} title="How to Use">
                    <div className="p-8 pb-12 text-white">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
                                <Music size={32} className="text-pale-gold" />
                            </div>
                            <h3 className="text-3xl font-display font-medium mb-2">Soundscapes</h3>
                            <p className="text-sm text-white uppercase tracking-widest font-bold">Mixing your environment</p>
                        </div>
                        <div className="space-y-4 mb-8 text-sm text-white/70 leading-relaxed font-body">
                            <p>Layer nature, frequencies and ambient textures until the room sounds the way you need it to.</p>
                            <ul className="space-y-3 list-none">
                                <li className="flex gap-3"><span className="text-pale-gold font-bold">01.</span> Tap sounds in the library to add them to your mix.</li>
                                <li className="flex gap-3"><span className="text-pale-gold font-bold">02.</span> Drag each fader in the mixer to set how loud that sound sits.</li>
                                <li className="flex gap-3"><span className="text-pale-gold font-bold">03.</span> Save a mix you like and it comes back with one tap.</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => { setShowHelp(false); localStorage.setItem(STORAGE_KEYS.SOUNDMIXER_HELP_SEEN, 'true'); }}
                            className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                        >
                            Explore Your Sounds
                        </button>
                    </div>
                </SlideUpModal>

                <SlideUpModal isOpen={showSciencePopup} onClose={() => setShowSciencePopup(false)} isDarkMode={true} title="The Science">
                    <div className="p-8 pb-12 text-white">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
                                <Zap size={32} className="text-pale-gold" />
                            </div>
                            <h3 className="text-3xl font-display font-medium mb-2">The Sound Science</h3>
                            <p className="text-sm text-white uppercase tracking-widest font-bold">Why it works</p>
                        </div>
                        <div className="space-y-6 mb-8 text-sm text-white/70 leading-relaxed font-body">
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                <h4 className="font-bold text-white mb-1">Binaural Beats</h4>
                                <p className="text-sm opacity-70">Playing slightly different frequencies in each ear is associated with what's sometimes called brainwave entrainment, a shift toward Alpha (focus) or Theta (meditation) that many people report feeling. Effects vary from person to person.</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                <h4 className="font-bold text-white mb-1">Pink & Brown Noise</h4>
                                <p className="text-sm opacity-70">These tailored noise profiles mask distracting sharp sounds and give your attention something steady to rest against, which many people find helps them settle into longer stretches of focus.</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                <h4 className="font-bold text-white mb-1">Environmental Priming</h4>
                                <p className="text-sm opacity-70">Nature sounds are linked to the body's rest-and-digest response for many people, which can make deep work feel calmer and more grounded.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSciencePopup(false)}
                            className="w-full py-5 rounded-[2.5rem] bg-pale-gold text-sage-dark font-black text-xs tracking-widest uppercase shadow-lg shadow-pale-gold/10"
                        >
                            Ready to Focus
                        </button>
                    </div>
                </SlideUpModal>
            </div>
            </div>
        );
};

export default SoundMixer;
