import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, Wind, Waves, Trees, Droplets, Zap, Radio, Moon, Sun, Music, Speaker, Bird, Save, Plus, X, Coffee, Sparkles, HelpCircle, Info, Target } from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { haptics } from '../utils/haptics';
import type { UserProfile, SoundMix } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface SoundMixerProps {
    isDarkMode: boolean; // Kept for interface compatibility
    isVisible: boolean;
    onClose: () => void;
    user?: UserProfile;
    onSaveMix?: (mix: SoundMix) => void;
    onDeleteMix?: (mixId: string) => void;
    source?: 'meditation' | 'dashboard';
}

interface SoundTrack {
    id: string;
    label: string;
    category: 'Nature' | 'Focus' | 'Noise' | 'Heritage' | 'Zen' | 'Ambient' | 'Bilateral';
    src: string;
    icon: React.ElementType;
}
const SOUNDS: SoundTrack[] = [
    // Nature
    { id: 'beach', label: 'Beach & Birds', category: 'Nature', src: '/sounds/beach-and-birds.mp3', icon: Bird },
    { id: 'rain', label: 'Gentle Rain', category: 'Nature', src: '/sounds/gentle-rain.mp3', icon: Droplets },
    { id: 'thunder', label: 'Distant Thunder', category: 'Nature', src: '/sounds/distant-rain-and-thunder.mp3', icon: Cloud },
    { id: 'river', label: 'Flowing River', category: 'Nature', src: '/sounds/flowing-river.mp3', icon: Waves },
    { id: 'ocean', label: 'Ocean Waves', category: 'Nature', src: '/sounds/ocean-waves.mp3', icon: Waves },
    { id: 'shoreline', label: 'Shoreline', category: 'Nature', src: '/sounds/shoreline.mp3', icon: Waves },
    { id: 'waterfall', label: 'Waterfall', category: 'Nature', src: '/sounds/waterfall.mp3', icon: Droplets },
    { id: 'wind', label: 'Calm Wind', category: 'Nature', src: '/sounds/calm-wind.mp3', icon: Wind },
    { id: 'forest', label: 'Deep Forest', category: 'Nature', src: '/sounds/forest.mp3', icon: Trees },
    { id: 'autumn', label: 'Autumn Wind', category: 'Nature', src: '/Autumn%20Wind.mp3', icon: Wind },
    { id: 'birds', label: 'Birdsong', category: 'Nature', src: '/sounds/birdsong.mp3', icon: Bird },
    { id: 'fire', label: 'Camp Fire', category: 'Nature', src: '/sounds/camp-fire.mp3', icon: Zap },
    { id: 'whale', label: 'Whale Sounds', category: 'Nature', src: '/sounds/whale-sounds.wav', icon: Waves },

    // Ambient
    { id: 'cafe1', label: 'Busy Cafe 1', category: 'Ambient', src: '/sounds/busy-cafe-1.mp3', icon: Coffee },
    { id: 'cafe2', label: 'Busy Cafe 2', category: 'Ambient', src: '/sounds/busy-cafe-2.mp3', icon: Coffee },
    { id: 'cafe3', label: 'Busy Cafe 3', category: 'Ambient', src: '/sounds/busy-cafe-3.mp3', icon: Coffee },
    { id: 'cafe4', label: 'Busy Cafe 4', category: 'Ambient', src: '/busy-cafe-4.mp3', icon: Coffee },

    // Heritage
    { id: 'coqui', label: 'Boriquen Coqui', category: 'Heritage', src: '/sounds/boriquen-coqui.mp3', icon: Moon },
    { id: '1970', label: '1970 PR', category: 'Heritage', src: '/sounds/1970-pr.mp3', icon: Radio },
    { id: 'kalimba', label: 'Kalimba Africa', category: 'Heritage', src: '/sounds/kalimba-africa.mp3', icon: Music },
    { id: 'colombia', label: 'Colombia EAS', category: 'Heritage', src: '/colombia-eas.mp3', icon: Music },
    { id: 'omgum', label: 'Om Gum Shreem Chant', category: 'Heritage', src: '/sounds/om-gum-shreem-maha-lakshmiyei-namaha.mp3', icon: Sun },

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
    { id: 'zen', label: 'Zen Out', category: 'Zen', src: '/sounds/zen-out.mp3', icon: Music },
    { id: 'adrift', label: 'Set Adrift', category: 'Zen', src: '/sounds/set-adrift.mp3', icon: Waves },
    { id: 'gong', label: 'Gong Bath', category: 'Zen', src: '/sounds/gong-sfx.mp3', icon: Moon },
    { id: 'chill1', label: 'Chill Uno', category: 'Zen', src: '/sounds/chillax-uno.mp3', icon: Music },
    { id: 'chill2', label: 'Chill Dos', category: 'Zen', src: '/sounds/chillax-dos.mp3', icon: Music },
    { id: 'chill3', label: 'Chill Tres', category: 'Zen', src: '/sounds/chillax-tres.mp3', icon: Music },
    { id: 'chill4', label: 'Chill Quatro', category: 'Zen', src: '/sounds/chillax-quatro.mp3', icon: Music },
    { id: 'chill5', label: 'Chill Cinco', category: 'Zen', src: '/Chill%20Cinco.mp3', icon: Music },

    // Bilateral
    { id: 'bilateral-eternal', label: 'Eternal Reflection', category: 'Bilateral', src: '/sounds/bilateral-eternal-reflection.mp3', icon: Waves },
    { id: 'bilateral-replenished', label: 'Replenished', category: 'Bilateral', src: '/sounds/bilateral-replenished.mp3', icon: Waves },
    { id: 'bilateral-tranquility', label: 'Tranquility', category: 'Bilateral', src: '/sounds/bilateral-tranquility.mp3', icon: Waves },
    { id: 'bilateral-tuneup', label: 'Tune Up', category: 'Bilateral', src: '/sounds/bilateral-tune-up.mp3', icon: Waves },
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

// Shared Audio Context
const getAudioContext = () => {
    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    // Create lazily or return existing global instance
    const win = window as { _palanteAudioContext?: AudioContext };
    if (!win._palanteAudioContext) {
        win._palanteAudioContext = new AudioContextClass();
    }
    return win._palanteAudioContext as AudioContext;
};

// NEW: Use HTMLAudioElement for streaming large files and better stability
// NEW: Use Web Audio API for precise mixing and iOS volume control
class CrossfadingSound {
    private audio1: HTMLAudioElement | null = null;
    private audio2: HTMLAudioElement | null = null;
    private sourceNode1: MediaElementAudioSourceNode | null = null;
    private sourceNode2: MediaElementAudioSourceNode | null = null;
    private gainNode1: GainNode | null = null;
    private gainNode2: GainNode | null = null;
    private loopInterval: ReturnType<typeof setTimeout> | null = null;
    private src: string;
    public volume: number = 0.5;
    public isPlaying: boolean = false;
    private activeIndex: 1 | 2 = 1;
    private isCrossfading: boolean = false;

    constructor(src: string) {
        this.src = src;
    }

    private init() {
        if (this.audio1) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        // Initialize first buffer
        this.audio1 = new Audio(this.src);
        this.audio1.loop = false; // Manual looping
        this.audio1.preload = 'auto';
        this.gainNode1 = ctx.createGain();
        this.gainNode1.gain.value = 0;
        this.sourceNode1 = ctx.createMediaElementSource(this.audio1);
        this.sourceNode1.connect(this.gainNode1);
        this.gainNode1.connect(ctx.destination);

        // Initialize second buffer for seamless crossfade
        this.audio2 = new Audio(this.src);
        this.audio2.loop = false;
        this.audio2.preload = 'auto';
        this.gainNode2 = ctx.createGain();
        this.gainNode2.gain.value = 0;
        this.sourceNode2 = ctx.createMediaElementSource(this.audio2);
        this.sourceNode2.connect(this.gainNode2);
        this.gainNode2.connect(ctx.destination);
    }

    async play(startVol = 0.5) {
        this.volume = startVol;
        this.init();
        const ctx = getAudioContext();
        if (!this.audio1 || !this.audio2 || !this.gainNode1 || !this.gainNode2 || !ctx) return;

        if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => { });
        }

        try {
            this.isPlaying = true;
            this.isCrossfading = false;
            this.activeIndex = 1;

            this.audio1.currentTime = 0;
            await this.audio1.play();

            const now = ctx.currentTime;
            this.gainNode1.gain.cancelScheduledValues(now);
            this.gainNode1.gain.setValueAtTime(0, now);
            this.gainNode1.gain.linearRampToValueAtTime(this.volume, now + 1.5);

            // Ultra-precision polling (50ms) for high-end cinematic cross-fading
            if (this.loopInterval) clearInterval(this.loopInterval);
            this.loopInterval = setInterval(() => {
                const activeAudio = this.activeIndex === 1 ? this.audio1 : this.audio2;
                const nextAudio = this.activeIndex === 1 ? this.audio2 : this.audio1;
                const activeGain = this.activeIndex === 1 ? this.gainNode1 : this.gainNode2;
                const nextGain = this.activeIndex === 1 ? this.gainNode2 : this.gainNode1;

                if (!activeAudio || !nextAudio || !activeGain || !nextGain || !ctx) return;

                // Threshold Check: Start crossfade 3.5 seconds before the end to hide any latency
                // Using 3.5s is safer for 10-15s clips to ensure zero gaps
                if (!this.isCrossfading && activeAudio.duration > 0 &&
                    activeAudio.currentTime > activeAudio.duration - 3.5) {

                    this.isCrossfading = true;
                    this.activeIndex = this.activeIndex === 1 ? 2 : 1;

                    // Pre-warm and play next buffer
                    nextAudio.currentTime = 0;
                    nextAudio.play().then(() => {
                        const cNow = ctx.currentTime;

                        // Precise Cross-fade: 2.5s duration for a lush handover
                        nextGain.gain.cancelScheduledValues(cNow);
                        nextGain.gain.setValueAtTime(0, cNow);
                        nextGain.gain.linearRampToValueAtTime(this.volume, cNow + 2.5);

                        activeGain.gain.cancelScheduledValues(cNow);
                        activeGain.gain.linearRampToValueAtTime(0, cNow + 2.5);

                        // Flag reset timed to overlap duration
                        setTimeout(() => {
                            this.isCrossfading = false;
                        }, 3000);
                    }).catch(e => {
                        console.error('❌ Buffer crossfade play error:', e);
                        this.isCrossfading = false;
                    });
                }
            }, 50); // 50ms for near-instant detection

        } catch (e) {
            console.error(`❌ Audio play failed for ${this.src}:`, e);
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }

        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        if (this.gainNode1) {
            this.gainNode1.gain.cancelScheduledValues(now);
            this.gainNode1.gain.linearRampToValueAtTime(0, now + 1.0);
        }
        if (this.gainNode2) {
            this.gainNode2.gain.cancelScheduledValues(now);
            this.gainNode2.gain.linearRampToValueAtTime(0, now + 1.0);
        }

        setTimeout(() => {
            if (!this.isPlaying) {
                if (this.audio1) { this.audio1.pause(); this.audio1.currentTime = 0; }
                if (this.audio2) { this.audio2.pause(); this.audio2.currentTime = 0; }
            }
        }, 1100);
    }

    setVolume(vol: number, instant: boolean = false) {
        this.volume = vol;
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        [this.gainNode1, this.gainNode2].forEach((node, i) => {
            if (node) {
                // Only update the gain of the currently active "buffer" (or both if fading)
                const isActive = (i + 1) === this.activeIndex;
                if (isActive) {
                    node.gain.cancelScheduledValues(now);
                    if (instant) {
                        node.gain.setValueAtTime(vol, now);
                    } else {
                        node.gain.linearRampToValueAtTime(vol, now + 0.3);
                    }
                }
            }
        });
    }
}

export const SoundMixer: React.FC<SoundMixerProps> = ({ isDarkMode: _isDarkMode, isVisible, onClose, user, onSaveMix, onDeleteMix, source }) => {
    const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set());
    const [volumes, setVolumes] = useState<Record<string, number>>({});
    const lastHapticLevel = useRef<Record<string, number>>({});
    const audioRefs = useRef<Record<string, CrossfadingSound>>({});

    const [isSavingMix, setIsSavingMix] = useState(false);
    const [newMixName, setNewMixName] = useState('');
    const [view, setView] = useState<'mixer' | 'library'>('mixer');
    const [scrollTarget, setScrollTarget] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(() => {
        const hasSeenHelp = localStorage.getItem(STORAGE_KEYS.SOUNDMIXER_HELP_SEEN);
        return !hasSeenHelp;
    });

    // Wake Lock Logic
    useEffect(() => {
        const updateWakeLock = async () => {
            if (activeSounds.size > 0) {
                try {
                    await KeepAwake.keepAwake();
                } catch (e) {
                    console.error('Failed to acquire wake lock', e);
                }
            }
        };
        updateWakeLock();
    }, [activeSounds.size]);

    // Initialize Audio Refs lazily
    const getAudioRef = (id: string, src: string) => {
        if (!audioRefs.current[id]) {
            audioRefs.current[id] = new CrossfadingSound(src);
        }
        return audioRefs.current[id];
    };

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

                // Stop ALL sounds first
                Object.values(audioRefs.current).forEach(audio => {
                    if (audio.isPlaying) {
                        audio.stop();
                    }
                });

                // Start new preset sounds after brief delay
                setTimeout(() => {
                    const newActive = new Set<string>();
                    const newVols: Record<string, number> = {};

                    Object.entries(preset.volumes).forEach(([id, vol]) => {
                        const soundData = SOUNDS.find(s => s.id === id);
                        if (soundData) {
                            const audio = getAudioRef(id, soundData.src);
                            newActive.add(id);
                            newVols[id] = vol;
                            audio.play(vol);
                        } else {
                            console.error(`  ❌ Audio not found in SOUNDS mapping: ${id}`);
                        }
                    });

                    setActiveSounds(newActive);
                    setVolumes(newVols);
                }, 100);
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

        window.addEventListener('palante-restart-sounds', handleRestartSounds);
        window.addEventListener('palante-load-preset', handleLoadPreset as EventListener);
        window.addEventListener('palante-toggle-sound', handleToggleSound as EventListener);
        window.addEventListener('palante-set-volume', handleSetVolume as EventListener);

        return () => {
            Object.values(audioRefs.current).forEach(audio => audio.stop());
            window.removeEventListener('palante-restart-sounds', handleRestartSounds);
            window.removeEventListener('palante-load-preset', handleLoadPreset as EventListener);
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

    const loadRecipe = useCallback((recipe: typeof RECIPES[0]) => {
        stopAll();
        // Small delay to let fades happen
        setTimeout(() => {
            const newActive = new Set<string>();
            const newVols: Record<string, number> = {};
            Object.entries(recipe.volumes).forEach(([id, vol]) => {
                const soundData = SOUNDS.find(s => s.id === id);
                if (soundData) {
                    newActive.add(id);
                    newVols[id] = vol;
                    getAudioRef(id, soundData.src).play(vol);
                }
            });
            setActiveSounds(newActive);
            setVolumes(newVols);
        }, 100);
    }, [stopAll]);

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
            className="fixed inset-0 z-[60] flex flex-col pt-6 animate-fade-in backdrop-blur-xl text-white overflow-hidden bg-sage-mid"
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <Target
                    className="absolute top-0 right-0 w-[110vmin] h-[110vmin] translate-x-1/2 -translate-y-1/2 text-[#E8E2D9] opacity-[0.075]"
                />
                <Target
                    className="absolute bottom-0 left-0 w-[90vmin] h-[90vmin] -translate-x-1/2 translate-y-1/2 text-pale-gold opacity-[0.075]"
                />
            </div>

            {/* TOP BAR: Header & Global Controls */}
            <div className={`px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between z-10 border-b border-white/5 bg-white/5 backdrop-blur-md gap-4`}>
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight">Sonic Canvas</h2>
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                aria-label="Show help"
                                className="p-1.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all duration-300"
                                title="Show Help"
                            >
                                <HelpCircle size={14} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5">
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`w-0.5 h-2 rounded-full transition-all duration-500 ${activeSounds.size > 0 ? 'bg-green-400/80 animate-pulse' : 'bg-white/10'}`} style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>
                            <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                                {activeSounds.size > 0 ? `${activeSounds.size} ACTIVE` : 'READY'}
                            </p>
                        </div>
                    </div>

                    <div className="flex md:hidden items-center gap-2">
                        {source === 'meditation' && (
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-[0.1em] transition-all bg-white/10 text-white border border-white/10`}
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-2.5 rounded-xl bg-white/5 text-white/40"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* TABBED NAVIGATION - CONSOLIDATED FOR PORTRAIT */}
                <div className="flex bg-sage/40 rounded-2xl p-1 border border-white/10 items-center shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setView('mixer')}
                        className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 relative overflow-hidden ${view === 'mixer'
                            ? 'bg-white text-sage shadow-[0_4px_15px_rgba(255,255,255,0.2)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Mixer
                    </button>
                    <button
                        onClick={() => setView('library')}
                        className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden ${view === 'library'
                            ? 'bg-white text-sage shadow-[0_4px_15px_rgba(255,255,255,0.2)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Library
                        {activeSounds.size > 0 && <span className="w-1 h-1 rounded-full bg-green-400" />}
                    </button>
                    {activeSounds.size > 0 && (
                        <button
                            onClick={() => {
                                haptics.medium();
                                stopAll();
                            }}
                            className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] text-red-400/60 hover:text-red-400 transition-all"
                        >
                            Stop
                        </button>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {source === 'meditation' && (
                        <button
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all bg-white/10 text-white hover:bg-white/20 border border-white/10`}
                        >
                            Back to Meditation
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/40 hover:text-white transition-all duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* HELP OVERLAY */}
            {showHelp && (
                <div className="absolute inset-0 z-50 bg-sage-mid/95 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                    <div className="max-w-2xl bg-sage/95 rounded-3xl p-8 relative border border-white/20 shadow-2xl">
                        <button
                            onClick={() => {
                                setShowHelp(false);
                                localStorage.setItem(STORAGE_KEYS.SOUNDMIXER_HELP_SEEN, 'true');
                            }}
                            aria-label="Close help"
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-full bg-pale-gold/20">
                                <Info size={24} className="text-pale-gold" />
                            </div>
                            <h3 className="text-2xl font-display font-medium text-white">How to Use Soundscape Mixer</h3>
                        </div>

                        <div className="space-y-4 text-white/90">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pale-gold/20 flex items-center justify-center text-pale-gold font-bold text-sm">1</div>
                                <div>
                                    <h4 className="font-bold mb-1">Choose Your Sounds</h4>
                                    <p className="text-sm text-white/70">Start with an <strong>Instant Mood</strong> preset, or explore <strong>Sonic Horizons</strong> to browse by category (Nature, Focus, Zen, etc.)</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pale-gold/20 flex items-center justify-center text-pale-gold font-bold text-sm">2</div>
                                <div>
                                    <h4 className="font-bold mb-1">Mix Your Atmosphere</h4>
                                    <p className="text-sm text-white/70"><strong>Tap or drag</strong> on the vertical faders to adjust volume. Each sound blends seamlessly to create your perfect environment.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pale-gold/20 flex items-center justify-center text-pale-gold font-bold text-sm">3</div>
                                <div>
                                    <h4 className="font-bold mb-1">Save Your Mix</h4>
                                    <p className="text-sm text-white/70">Love your creation? Tap <strong>"+ Save Mix"</strong> at the bottom, name it, and access it anytime from Instant Moods.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pale-gold/20 flex items-center justify-center text-pale-gold font-bold text-sm">💡</div>
                                <div>
                                    <h4 className="font-bold mb-1">Pro Tips</h4>
                                    <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                                        <li>Layer 2-4 sounds for rich, immersive atmospheres</li>
                                        <li>Try binaural beats (Focus category) for deep concentration</li>
                                        <li>Heritage sounds connect you to cultural roots</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowHelp(false);
                                localStorage.setItem(STORAGE_KEYS.SOUNDMIXER_HELP_SEEN, 'true');
                            }}
                            className="mt-6 w-full py-3 rounded-xl bg-pale-gold text-sage-dark font-bold uppercase tracking-widest hover:bg-white transition-colors"
                        >
                            Got It!
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative">



                {/* VIEW: MIXER (Active Faders) */}
                {view === 'mixer' && (
                    <div className={`h-full no-scrollbar relative z-10 pb-32 transition-all duration-500 ${activeSoundList.length === 0 ? 'overflow-y-auto p-4 md:p-8' : 'overflow-x-auto flex items-center justify-center min-w-full px-2 md:px-16 gap-1 md:gap-8'}`}>
                        {activeSoundList.length === 0 ? (
                            <div className="w-full flex flex-col items-center justify-start animate-fade-in py-8 md:py-16">
                                <h3 className="text-2xl md:text-4xl font-display font-medium text-white mb-2 text-center tracking-tight">Atmospheric Control</h3>
                                <p className="text-white/40 text-center mb-8 md:mb-16 max-w-xs leading-relaxed font-light uppercase tracking-widest text-[8px] md:text-[10px] font-bold">
                                    Select a foundation to begin your auditory journey.
                                </p>

                                {/* 1. Instant Atmospheres */}
                                <div className="w-full max-w-5xl px-0 md:px-8 mb-12 md:mb-16">
                                    <div className="flex items-center gap-4 mb-6 md:mb-8 px-4">
                                        <div className="flex-1 h-px bg-white/5" />
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={12} className="text-pale-gold/60" />
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 text-center">Instant Atmospheres</span>
                                        </div>
                                        <div className="flex-1 h-px bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-4">
                                        {/* User's Saved Mixes */}
                                        {user?.savedMixes?.map(mix => (
                                            <div key={mix.id} className="group relative h-48 rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/5 transition-all duration-700 hover:scale-[1.02] active:scale-98 shadow-2xl">
                                                <button
                                                    onClick={() => loadRecipe({ id: mix.id, name: mix.name, volumes: mix.volumes as Record<string, number>, color: 'from-amber/20 to-sage/20' })}
                                                    className="absolute inset-0 w-full h-full text-left p-8 flex flex-col justify-end z-10"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-amber/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                                    <div className="relative z-10">
                                                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-pale-gold mb-3 opacity-60">Personal Mix</div>
                                                        <div className="font-display font-medium text-2xl leading-tight text-white mb-1">{mix.name}</div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onDeleteMix) onDeleteMix(mix.id);
                                                    }}
                                                    aria-label={`Delete ${mix.name}`}
                                                    className="absolute top-6 right-6 z-20 p-2.5 rounded-2xl bg-sage/40 hover:bg-red-500/40 text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/5"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}

                                        {RECIPES.map(recipe => (
                                            <button
                                                key={recipe.id}
                                                onClick={() => loadRecipe(recipe)}
                                                className="group relative h-40 md:h-48 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 bg-sage/20 transition-all duration-700 hover:scale-[1.02] active:scale-98 text-left p-6 md:p-8 flex flex-col justify-end shadow-2xl"
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br ${recipe.color} opacity-10 group-hover:opacity-30 transition-all duration-1000`} />
                                                <div className="relative z-10">
                                                    <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 mb-2 md:mb-3">Professional Preset</div>
                                                    <div className="font-display font-medium text-xl md:text-2xl leading-tight text-white">{recipe.name}</div>
                                                </div>
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setView('library')}
                                            className="group relative h-40 md:h-48 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-700 flex flex-col items-center justify-center gap-3 md:gap-4"
                                        >
                                            <div className="p-4 md:p-5 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500 text-white/20 group-hover:text-white">
                                                <Plus size={26} strokeWidth={1} />
                                            </div>
                                            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-colors text-center">Custom Build</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Sonic Horizons */}
                                <div className="w-full max-w-5xl px-8 mb-24">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="flex-1 h-px bg-white/5" />
                                        <div className="flex items-center gap-2">
                                            <Radio size={12} className="text-white/30" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Sonic Horizons</span>
                                        </div>
                                        <div className="flex-1 h-px bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 px-4">
                                        {categories.map(cat => {
                                            const repSound = SOUNDS.find(s => s.category === cat);
                                            const Icon = repSound?.icon || Music;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setScrollTarget(cat);
                                                        setView('library');
                                                    }}
                                                    className="group flex flex-col items-center gap-4 md:gap-6 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-sage/20 border border-white/5 hover:bg-white/5 hover:border-white/10 hover:scale-[1.05] active:scale-95 transition-all duration-500 shadow-xl"
                                                >
                                                    <div className="p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/5 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 text-white/40 group-hover:text-white">
                                                        <Icon size={26} strokeWidth={1} />
                                                    </div>
                                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] md:tracking-[0.25em] text-white/30 group-hover:text-white transition-all">{cat}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Render Active Faders with High Contrast
                            activeSoundList.map(sound => (
                                <div key={sound.id} className="flex-shrink-0 w-20 md:w-32 h-[55vh] flex flex-col items-center justify-end group relative animate-slide-up-fade">
                                    {/* Glassmorphic Fader Container */}
                                    <div className="relative w-12 md:w-20 h-full bg-sage/40 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col justify-end group-hover:bg-sage/50 transition-all duration-500 backdrop-blur-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                                        {/* Precision Tick Marks */}
                                        <div className="absolute inset-y-8 left-1.5 md:left-4 flex flex-col justify-between opacity-20 pointer-events-none">
                                            {[...Array(11)].map((_, i) => (
                                                <div key={i} className={`h-[1px] bg-white transition-all duration-300 ${i % 5 === 0 ? 'w-1.5 md:w-3' : 'w-1'}`} />
                                            ))}
                                        </div>

                                        {/* Fill Level */}
                                        <div
                                            className="w-full bg-gradient-to-t from-white/20 to-white/40 border-t border-white/30 relative"
                                            style={{ height: `${(volumes[sound.id] ?? 0) * 100}%` }}
                                        />

                                        {/* GLOWING INDICATOR */}
                                        <div
                                            className="absolute left-0 right-0 h-1 z-30 pointer-events-none"
                                            style={{ bottom: `calc(${(volumes[sound.id] ?? 0) * 100}%)` }}
                                        >
                                            <div className="w-full h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-80" />
                                        </div>

                                        {/* Touch-Friendly Drag Overlay */}
                                        <div
                                            className="absolute inset-0 w-full h-full cursor-ns-resize z-40 touch-none"
                                            onTouchStart={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const y = e.touches[0].clientY - rect.top;
                                                const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
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
                                                handleMove(e);
                                            }}
                                        />

                                        {/* Icon Floating */}
                                        <div className="absolute left-0 right-0 pointer-events-none flex justify-center z-20" style={{ bottom: `${Math.max(10, (volumes[sound.id] ?? 0) * 82)}%` }}>
                                            <div className="p-1.5 md:p-4 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md text-white shadow-2xl border border-white/20">
                                                <sound.icon size={14} md:size={22} strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Label & Level */}
                                    <div className="mt-3 md:mt-8 text-center select-none relative z-10 w-full px-1">
                                        <div className="font-display font-medium text-[8px] md:text-[12px] uppercase tracking-[0.1em] text-white/90 truncate">{sound.label}</div>
                                        <div className="flex items-center justify-center gap-1 mt-1 md:mt-2">
                                            <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-green-400" />
                                            <div className="text-[8px] md:text-[10px] text-white/50 font-mono">{Math.round((volumes[sound.id] ?? 0) * 100)}%</div>
                                        </div>
                                    </div>

                                    {/* Remove Button - Subtle glassmorphism */}
                                    <button
                                        onClick={() => toggleSound(sound.id)}
                                        aria-label={`Remove ${sound.label}`}
                                        className="mt-6 p-2 rounded-full bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW: LIBRARY (Grid) */}
                {view === 'library' && (
                    <div className="h-full overflow-y-auto p-8 pb-32">
                        <div className="max-w-4xl mx-auto space-y-12">
                            {categories.map(cat => (
                                <div key={cat} id={`category-${cat}`} className="scroll-mt-24">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-6 sticky top-0 py-4 z-10 backdrop-blur-xl border-b border-white/10 font-display">{cat}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {SOUNDS.filter(s => s.category === cat).map(sound => {
                                            const isActive = activeSounds.has(sound.id);
                                            return (
                                                <div
                                                    key={sound.id}
                                                    className={`
                                                        group relative p-6 rounded-[2rem] border text-left transition-all duration-500 overflow-hidden
                                                        ${isActive
                                                            ? 'bg-white border-white text-sage shadow-[0_10px_30px_rgba(255,255,255,0.2)] scale-[1.02]'
                                                            : 'bg-sage/20 border-white/5 hover:bg-white/5 hover:border-white/10 text-white'}
                                                    `}
                                                >
                                                    <button
                                                        onClick={() => toggleSound(sound.id)}
                                                        aria-label={isActive ? `Stop ${sound.label}` : `Play ${sound.label}`}
                                                        className="absolute inset-0 w-full h-full z-10"
                                                    />

                                                    <div className="flex items-start justify-between mb-6 pointer-events-none">
                                                        <div className={`p-3.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-sage/10 text-sage' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'}`}>
                                                            <sound.icon size={22} strokeWidth={1.2} />
                                                        </div>
                                                        {isActive && (
                                                            <div className="flex gap-1">
                                                                {[...Array(3)].map((_, i) => (
                                                                    <div key={i} className="w-1 h-3 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pointer-events-none relative z-10">
                                                        <h4 className={`font-display font-medium text-lg tracking-tight mb-1 transition-all duration-500 ${isActive ? 'text-sage' : 'text-white/90 group-hover:text-white'}`}>{sound.label}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-sage/40' : 'bg-white/20'}`} />
                                                            <p className={`text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 transition-all duration-500 ${isActive ? 'text-sage' : 'text-white'}`}>{sound.category}</p>
                                                        </div>
                                                    </div>

                                                    {/* Hardware-style bottom gradient on hover */}
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* BOTTOM BAR: Save & Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
                    <div className="max-w-3xl mx-auto flex gap-4 pointer-events-auto">
                        {isSavingMix ? (
                            <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20 flex gap-2 animate-fade-in shadow-2xl">
                                <input
                                    type="text"
                                    value={newMixName}
                                    onChange={(e) => setNewMixName(e.target.value)}
                                    placeholder="Name your mix..."
                                    className="flex-1 bg-transparent border-none text-white focus:ring-0 px-4 placeholder:text-white/40 font-medium"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveMix}
                                    className="px-6 py-3 rounded-xl bg-pale-gold text-sage-dark font-bold uppercase tracking-widest hover:bg-white transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsSavingMix(false)}
                                    className="p-3 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : activeSounds.size > 0 && (
                            <button
                                onClick={() => setIsSavingMix(true)}
                                className="flex-1 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                            >
                                <Save size={18} />
                                Save This Mix
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SoundMixer;
