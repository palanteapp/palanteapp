
export interface SoundTrack {
    id: string;
    name: string;
    url: string;
    color: string;
    activeColor: string;
}

export const TRACKS: SoundTrack[] = [
    // Only verified working sounds from Google Actions
    { id: 'cafe', name: 'Coffee Shop', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', color: 'text-amber-700', activeColor: 'bg-amber-700 text-white border-amber-700' },
    { id: 'ocean', name: 'Ocean Waves', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg', color: 'text-blue-500', activeColor: 'bg-blue-600 text-white border-blue-600' },
    { id: 'rain', name: 'Rain', url: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg', color: 'text-indigo-400', activeColor: 'bg-indigo-500 text-white border-indigo-500' },
    { id: 'thunder', name: 'Thunderstorm', url: 'https://actions.google.com/sounds/v1/weather/thunderstorm.ogg', color: 'text-zinc-400', activeColor: 'bg-zinc-500 text-white border-zinc-500' },
];
