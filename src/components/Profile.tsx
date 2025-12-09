import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { Save, Bell, User, X, Crown, Volume2, Download } from 'lucide-react';
import { getVoiceForId } from '../utils/voiceUtils';

interface ProfileProps {
    user: UserProfile;
    onUpdate: (updatedUser: UserProfile) => void;
    isDarkMode: boolean;
    onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, isDarkMode, onClose }) => {
    const [name, setName] = useState(user.name);
    const [career, setCareer] = useState(user.career);
    const [profession, setProfession] = useState(user.profession);
    const [interests, setInterests] = useState(user.interests.join(', '));
    const [frequency, setFrequency] = useState(user.notificationFrequency || 3);
    const [voicePreference, setVoicePreference] = useState<'shimmer' | 'fable'>(user.voicePreference || 'shimmer');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

    const handleSave = () => {
        const updatedUser: UserProfile = {
            ...user,
            name,
            career,
            profession,
            interests: interests.split(',').map(i => i.trim()).filter(i => i),
            notificationFrequency: frequency,
            voicePreference
        };
        onUpdate(updatedUser);
        onClose();
    };

    const inputClasses = `w-full px-6 py-4 rounded-xl outline-none transition-all border font-body text-lg ${isDarkMode
        ? 'bg-white/5 border-white/10 focus:border-sage text-white placeholder-white/30'
        : 'bg-white/60 border-sage/20 focus:border-sage text-warm-gray-green placeholder-warm-gray-green/30'
        }`;

    const labelClasses = `text-sm font-medium uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-sage' : 'text-warm-gray-green/60'}`;

    const voices = [
        { id: 'shimmer', name: 'Shimmer', gender: 'Female', description: 'Gentle & Calming' },
        { id: 'fable', name: 'Fable', gender: 'Male', description: 'Smooth & Confident' },
    ] as const;



    const handlePreviewVoice = (voiceId: string, voiceName: string, voiceDescription: string) => {
        if (previewingVoice === voiceId) {
            window.speechSynthesis.cancel();
            setPreviewingVoice(null);
        } else {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`Hi, my name is ${voiceName}, and my voice is ${voiceDescription.toLowerCase()}.`);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;

            const systemVoices = window.speechSynthesis.getVoices();
            const selectedVoice = getVoiceForId(voiceId, systemVoices);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                // Slight pitch adjustments for specific known voices to enhance distinctness
                if (selectedVoice.name.includes('Google')) {
                    const femaleVoices = ['nova', 'shimmer', 'alloy'];
                    utterance.pitch = femaleVoices.includes(voiceId) ? 1.0 : 0.9;
                }
            }

            utterance.onend = () => setPreviewingVoice(null);
            window.speechSynthesis.speak(utterance);
            setPreviewingVoice(voiceId);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col animate-fade-in ${isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory'}`}>
            {/* Header */}
            <div className="px-8 py-8 flex justify-between items-center">
                <h2 className={`text-3xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>Settings</h2>
                <button
                    onClick={onClose}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-sage/10 text-warm-gray-green'}`}
                >
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-32">
                <div className="max-w-2xl mx-auto space-y-12">

                    {/* Journey Status (Replaces Rank) */}
                    <section className="text-center py-8">
                        <div className="relative inline-block mb-6">
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-gradient-sage-subtle border border-sage/20'}`}>
                                <Crown size={40} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-pale-gold text-warm-gray-green text-xs font-bold uppercase tracking-widest shadow-spa">
                                {user.points >= 5000 ? 'Master' :
                                    user.points >= 1000 ? 'Guide' :
                                        user.points >= 500 ? 'Seeker' : 'Beginner'}
                            </div>
                        </div>

                        <div className="flex justify-center gap-12 text-center mt-4">
                            <div>
                                <div className={`text-3xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>{user.streak}</div>
                                <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>Day Streak</div>
                            </div>
                            <div>
                                <div className={`text-3xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>{user.points}</div>
                                <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>Points</div>
                            </div>
                        </div>
                    </section>

                    {/* Personal Details */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <User size={20} className={isDarkMode ? 'text-sage' : 'text-sage'} />
                            <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>Personal Profile</h3>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className={labelClasses}>Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="Your name" />
                            </div>
                            <div>
                                <label className={labelClasses}>Profession</label>
                                <input value={profession} onChange={e => setProfession(e.target.value)} className={inputClasses} placeholder="What do you do?" />
                            </div>
                            <div>
                                <label className={labelClasses}>Focus Goal</label>
                                <input value={career} onChange={e => setCareer(e.target.value)} className={inputClasses} placeholder="What are you working towards?" />
                            </div>
                            <div>
                                <label className={labelClasses}>Interests</label>
                                <input value={interests} onChange={e => setInterests(e.target.value)} className={inputClasses} placeholder="Mindfulness, Growth, etc." />
                            </div>
                        </div>
                    </section>

                    {/* Voice Preference */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Volume2 size={20} className={isDarkMode ? 'text-sage' : 'text-sage'} />
                            <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>Voice Coach</h3>
                        </div>

                        <div className="space-y-4">
                            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>Choose your preferred voice for affirmations and guidance</p>

                            <div className="grid grid-cols-2 gap-4">
                                {voices.map(voice => (
                                    <div key={voice.id} className="relative">
                                        <button
                                            onClick={() => setVoicePreference(voice.id as any)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-center ${voicePreference === voice.id
                                                ? isDarkMode ? 'bg-white/10 border-pale-gold text-white' : 'bg-sage text-white border-sage'
                                                : isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                                }`}
                                        >
                                            <div className="font-display font-medium text-sm mb-1">{voice.name}</div>
                                            <div className="text-xs opacity-80">{voice.description}</div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreviewVoice(voice.id, voice.name, voice.description);
                                            }}
                                            className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${previewingVoice === voice.id
                                                ? 'bg-pale-gold text-warm-gray-green animate-pulse'
                                                : isDarkMode ? 'bg-sage text-white hover:bg-pale-gold hover:text-warm-gray-green' : 'bg-sage text-white hover:bg-pale-gold hover:text-warm-gray-green'
                                                }`}
                                            title="Preview voice"
                                        >
                                            <Volume2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Notifications */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell size={20} className={isDarkMode ? 'text-sage' : 'text-sage'} />
                            <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>Daily Rhythm</h3>
                        </div>

                        <div className={`p-8 rounded-2xl border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <span className={`font-body font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>Daily Affirmations</span>
                                <span className={`text-2xl font-display font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>{frequency}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={frequency}
                                onChange={e => setFrequency(parseInt(e.target.value))}
                                className="w-full accent-sage h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className={`text-sm mt-6 text-center ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/60'}`}>
                                You will receive {frequency} moments of mindfulness throughout your day.
                            </p>
                        </div>
                    </section>

                    {/* Data & Privacy */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Download size={20} className={isDarkMode ? 'text-sage' : 'text-sage'} />
                            <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>Data & Privacy</h3>
                        </div>

                        <button
                            onClick={() => {
                                // Gather all data
                                const allData: any = {
                                    profile: user,
                                    journalEntries: [],
                                    exportedAt: new Date().toISOString(),
                                };

                                // Find all journal entries in localStorage
                                for (let i = 0; i < localStorage.length; i++) {
                                    const key = localStorage.key(i);
                                    if (key && key.startsWith('motiv8_journal_')) {
                                        try {
                                            const item = localStorage.getItem(key);
                                            if (item) allData.journalEntries.push(JSON.parse(item));
                                        } catch (e) {
                                            console.error('Error parsing journal entry', e);
                                        }
                                    }
                                }

                                // Create download
                                const dataStr = JSON.stringify(allData, null, 2);
                                const blob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `palante_data_${new Date().toISOString().split('T')[0]}.json`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${isDarkMode
                                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                }`}
                        >
                            <Download size={20} />
                            <span>Download My Data</span>
                        </button>
                        <p className={`text-xs text-center ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>
                            Export all your progress, journal entries, and settings.
                        </p>
                    </section>
                </div>
            </div>

            {/* Save Button */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 ${isDarkMode ? 'bg-warm-gray-green/95 backdrop-blur-xl border-t border-white/10' : 'bg-ivory/95 backdrop-blur-xl border-t border-sage/10'}`}>
                <button
                    onClick={handleSave}
                    className="w-full max-w-md mx-auto py-4 rounded-full bg-sage text-white font-body font-medium text-lg shadow-spa hover:shadow-spa-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                    <Save size={20} />
                    <span>Save Changes</span>
                </button>
            </div>
        </div>
    );
};
