// Lightweight sound id → file path map.
//
// This is a standalone, dependency-free mirror of the file-backed entries in
// SoundMixer's SOUNDS array. It exists so components like KoiPond can resolve a
// saved mix's sound ids to audio files WITHOUT importing the heavy SoundMixer
// module (icons, synth engine, etc.) into their chunk.
//
// SYNTH sounds (white/pink/brown/violet noise + the binaural beats) are NOT here:
// their mp3s were removed and they're generated procedurally, resolve those via
// isSynthSound()/getSynthLoopBlobUrl() in utils/synthSounds.ts instead.
//
// KEEP IN SYNC with SOUNDS in src/components/SoundMixer.tsx if file ids change.
export const SOUND_SOURCES: Record<string, string> = {
    // Nature
    beach: '/sounds/beach-and-birds.m4a',
    rain: '/sounds/gentle-rain.m4a',
    thunder: '/sounds/distant-rain-and-thunder.m4a',
    river: '/sounds/flowing-river.m4a',
    ocean: '/sounds/ocean-waves.m4a',
    shoreline: '/sounds/shoreline.m4a',
    waterfall: '/sounds/waterfall.m4a',
    wind: '/sounds/calm-wind.m4a',
    forest: '/sounds/forest.m4a',
    autumn: '/Autumn%20Wind.m4a',
    birds: '/sounds/birdsong.m4a',
    fire: '/sounds/camp-fire.m4a',
    whale: '/sounds/whale-sounds.m4a',
    // Ambient
    cafe1: '/sounds/busy-cafe-1.m4a',
    cafe2: '/sounds/busy-cafe-2.m4a',
    cafe3: '/sounds/busy-cafe-3.m4a',
    cafe4: '/busy-cafe-4.m4a',
    // Heritage
    coqui: '/sounds/boriquen-coqui.m4a',
    '1970': '/sounds/1970-pr.m4a',
    kalimba: '/sounds/kalimba-africa.m4a',
    colombia: '/colombia-eas.m4a',
    omgum: '/sounds/om-gum-shreem-maha-lakshmiyei-namaha.m4a',
    // Zen
    zen: '/sounds/zen-out.m4a',
    adrift: '/sounds/set-adrift.m4a',
    gong: '/sounds/gong-sfx.m4a',
    chill1: '/sounds/chillax-uno.m4a',
    chill2: '/sounds/chillax-dos.m4a',
    chill3: '/sounds/chillax-tres.m4a',
    chill4: '/sounds/chillax-quatro.m4a',
    chill5: '/Chill%20Cinco.m4a',
    // Bilateral
    'bilateral-eternal': '/sounds/bilateral-eternal-reflection.m4a',
    'bilateral-replenished': '/sounds/bilateral-replenished.m4a',
    'bilateral-tranquility': '/sounds/bilateral-tranquility.m4a',
    'bilateral-tuneup': '/sounds/bilateral-tune-up.m4a',
};
