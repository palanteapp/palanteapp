// Lightweight sound id → file path map.
//
// This is a standalone, dependency-free mirror of the file-backed entries in
// SoundMixer's SOUNDS array. It exists so components like KoiPond can resolve a
// saved mix's sound ids to audio files WITHOUT importing the heavy SoundMixer
// module (icons, synth engine, etc.) into their chunk.
//
// SYNTH sounds (white/pink/brown/violet noise + the binaural beats) are NOT here:
// their mp3s were removed and they're generated procedurally — resolve those via
// isSynthSound()/getSynthLoopBlobUrl() in utils/synthSounds.ts instead.
//
// KEEP IN SYNC with SOUNDS in src/components/SoundMixer.tsx if file ids change.
export const SOUND_SOURCES: Record<string, string> = {
    // Nature
    beach: '/sounds/beach-and-birds.mp3',
    rain: '/sounds/gentle-rain.mp3',
    thunder: '/sounds/distant-rain-and-thunder.mp3',
    river: '/sounds/flowing-river.mp3',
    ocean: '/sounds/ocean-waves.mp3',
    shoreline: '/sounds/shoreline.mp3',
    waterfall: '/sounds/waterfall.mp3',
    wind: '/sounds/calm-wind.mp3',
    forest: '/sounds/forest.mp3',
    autumn: '/Autumn%20Wind.mp3',
    birds: '/sounds/birdsong.mp3',
    fire: '/sounds/camp-fire.mp3',
    whale: '/sounds/whale-sounds.mp3',
    // Ambient
    cafe1: '/sounds/busy-cafe-1.mp3',
    cafe2: '/sounds/busy-cafe-2.mp3',
    cafe3: '/sounds/busy-cafe-3.mp3',
    cafe4: '/busy-cafe-4.mp3',
    // Heritage
    coqui: '/sounds/boriquen-coqui.mp3',
    '1970': '/sounds/1970-pr.mp3',
    kalimba: '/sounds/kalimba-africa.mp3',
    colombia: '/colombia-eas.mp3',
    omgum: '/sounds/om-gum-shreem-maha-lakshmiyei-namaha.mp3',
    // Zen
    zen: '/sounds/zen-out.mp3',
    adrift: '/sounds/set-adrift.mp3',
    gong: '/sounds/gong-sfx.mp3',
    chill1: '/sounds/chillax-uno.mp3',
    chill2: '/sounds/chillax-dos.mp3',
    chill3: '/sounds/chillax-tres.mp3',
    chill4: '/sounds/chillax-quatro.mp3',
    chill5: '/Chill%20Cinco.mp3',
    // Bilateral
    'bilateral-eternal': '/sounds/bilateral-eternal-reflection.mp3',
    'bilateral-replenished': '/sounds/bilateral-replenished.mp3',
    'bilateral-tranquility': '/sounds/bilateral-tranquility.mp3',
    'bilateral-tuneup': '/sounds/bilateral-tune-up.mp3',
};
