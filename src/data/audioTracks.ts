
export interface SoundTrack {
    id: string;
    name: string;
    url: string;
    color: string;
    activeColor: string;
}

export const TRACKS: SoundTrack[] = [
    // Using local sound files - add MP3 files to /public/sounds/ folder
    {
        id: 'ocean',
        name: 'Ocean Waves',
        url: '/sounds/ocean.mp3',
        color: 'text-blue-500',
        activeColor: 'bg-blue-600 text-white border-blue-600'
    },
    {
        id: 'rain',
        name: 'Rain',
        url: '/sounds/rain.mp3',
        color: 'text-indigo-400',
        activeColor: 'bg-indigo-500 text-white border-indigo-500'
    },
    {
        id: 'forest',
        name: 'Forest',
        url: '/sounds/forest.mp3',
        color: 'text-emerald-600',
        activeColor: 'bg-emerald-700 text-white border-emerald-700'
    },
    {
        id: 'fire',
        name: 'Fireplace',
        url: '/sounds/fire.mp3',
        color: 'text-orange-600',
        activeColor: 'bg-orange-700 text-white border-orange-700'
    },
    {
        id: 'stream',
        name: 'Brook',
        url: '/sounds/stream.mp3',
        color: 'text-cyan-500',
        activeColor: 'bg-cyan-600 text-white border-cyan-600'
    },
    {
        id: 'night',
        name: 'Night Cricket',
        url: '/sounds/cricket.mp3',
        color: 'text-indigo-800',
        activeColor: 'bg-indigo-900 text-white border-indigo-900'
    },
    {
        id: 'wind',
        name: 'Wind',
        url: '/sounds/wind.mp3',
        color: 'text-slate-400',
        activeColor: 'bg-slate-500 text-white border-slate-500'
    },
    {
        id: 'cafe',
        name: 'Coffee Shop',
        url: '/sounds/cafe.mp3',
        color: 'text-amber-700',
        activeColor: 'bg-amber-700 text-white border-amber-700'
    },
    {
        id: 'thunder',
        name: 'Thunderstorm',
        url: '/sounds/thunder.mp3',
        color: 'text-zinc-400',
        activeColor: 'bg-zinc-500 text-white border-zinc-500'
    },
];
