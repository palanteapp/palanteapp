import React, { useState } from 'react';
import type { UserProfile, Tier } from '../types';
import { Save, Bell, User, X, Crown, Volume2, Download, ChevronDown, ChevronUp, Sparkles, Target, Flame, Sun, Moon, Clock, Info, BellOff, BookOpen } from 'lucide-react';
import { OPENAI_VOICES, previewVoice, stop as stopTTS, type OpenAIVoice } from '../utils/ttsService';
import { useNotifications } from '../hooks/useNotifications';

interface ProfileProps {
    user: UserProfile;
    onUpdate: (updatedUser: UserProfile) => void;
    isDarkMode: boolean;
    onClose: () => void;
    onToggleTheme?: () => void;
}

// Collapsible Section Component
const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    isDarkMode: boolean;
    children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, isDarkMode, children }) => (
    <section className={`rounded-2xl border overflow-hidden transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-sage/10'}`}>
        <button
            onClick={onToggle}
            className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/60'}`}
        >
            <div className="flex items-center gap-3">
                <span className={isDarkMode ? 'text-sage' : 'text-sage'}>{icon}</span>
                <h3 className={`text-lg font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>{title}</h3>
            </div>
            {isOpen ? <ChevronUp size={20} className={isDarkMode ? 'text-white/40' : 'text-sage/40'} /> : <ChevronDown size={20} className={isDarkMode ? 'text-white/40' : 'text-sage/40'} />}
        </button>
        <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="px-6 pb-6 pt-2">
                {children}
            </div>
        </div>
    </section>
);

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, isDarkMode, onClose, onToggleTheme }) => {
    const [name, setName] = useState(user.name);
    const [career, setCareer] = useState(user.career);
    const [profession, setProfession] = useState(user.profession);
    const [interests, setInterests] = useState(user.interests.join(', '));
    const [frequency] = useState(user.notificationFrequency || 3);
    const [voicePreference, setVoicePreference] = useState<OpenAIVoice>((user.voicePreference as OpenAIVoice) || 'nova');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [tier, setTier] = useState<Tier>(user.tier);
    const [sourcePreference, setSourcePreference] = useState<'human' | 'ai' | 'mix'>(user.sourcePreference);

    // Notifications Hook
    const { settings, toggleEnabled, updateQuietHours, testNotification, permission } = useNotifications();
    const [quietStart, setQuietStart] = useState(settings.quietStart);
    const [quietEnd, setQuietEnd] = useState(settings.quietEnd);

    // Sync quiet hours state with hook if needed when saving
    const handleQuietHoursChange = (start: string, end: string) => {
        setQuietStart(start);
        setQuietEnd(end);
        updateQuietHours(start, end);
    };

    // Collapsible section states
    const [openSections, setOpenSections] = useState({
        profile: true,
        experience: false,
        voice: false,
        notifications: false,
        data: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSave = () => {
        const updatedUser: UserProfile = {
            ...user,
            name,
            career,
            profession,
            interests: interests.split(',').map(i => i.trim()).filter(i => i),
            notificationFrequency: frequency,
            voicePreference,
            tier,
            sourcePreference,
            // These are now managed by localStorage in the hook but we keep them here for backend sync if needed later
            quietHoursStart: quietStart,
            quietHoursEnd: quietEnd,
        };
        onUpdate(updatedUser);
        onClose();
    };

    const inputClasses = `w-full px-5 py-3 rounded-xl outline-none transition-all border font-body ${isDarkMode
        ? 'bg-white/5 border-white/10 focus:border-sage text-white placeholder-white/30'
        : 'bg-white/60 border-sage/20 focus:border-sage text-warm-gray-green placeholder-warm-gray-green/30'
        }`;

    const labelClasses = `text-xs font-medium uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`;

    // Use all 6 OpenAI voices from the TTS service
    const voices = OPENAI_VOICES;

    const tiers = [
        { id: 1 as Tier, name: 'Muse', icon: <Sparkles size={18} />, description: 'Gentle & poetic' },
        { id: 2 as Tier, name: 'Focus', icon: <Target size={18} />, description: 'Direct & clear' },
        { id: 3 as Tier, name: 'Firestarter', icon: <Flame size={18} />, description: 'Bold & intense' },
    ];

    const handlePreviewVoice = async (voiceId: OpenAIVoice) => {
        if (previewingVoice === voiceId) {
            stopTTS();
            setPreviewingVoice(null);
        } else {
            stopTTS();
            setPreviewingVoice(voiceId);
            await previewVoice(
                voiceId,
                () => { }, // onStart
                () => setPreviewingVoice(null) // onEnd
            );
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col animate-fade-in ${isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory'}`}>
            {/* Header */}
            <div className="px-6 py-6 flex justify-between items-center border-b border-opacity-10" style={{ borderColor: isDarkMode ? 'white' : '#B5C2A3' }}>
                <h2 className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>Settings</h2>
                <div className="flex items-center gap-3">
                    {/* Dark Mode Toggle */}
                    {onToggleTheme && (
                        <button
                            onClick={onToggleTheme}
                            className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-pale-gold' : 'bg-sage/10 hover:bg-sage/20 text-sage'}`}
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-sage/10 text-warm-gray-green'}`}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32">
                <div className="max-w-2xl mx-auto space-y-4 pt-6">

                    {/* Journey Status Card (Always Visible) */}
                    <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gradient-to-br from-white/5 to-white/0 border-white/10' : 'bg-gradient-to-br from-white/60 to-white/40 border-sage/10'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                                    <Crown size={28} className={isDarkMode ? 'text-pale-gold' : 'text-sage'} />
                                </div>
                                <div>
                                    <div className="px-2 py-0.5 rounded-full bg-pale-gold text-warm-gray-green text-xs font-bold uppercase tracking-widest inline-block mb-1">
                                        {user.points >= 5000 ? 'Master' :
                                            user.points >= 1000 ? 'Guide' :
                                                user.points >= 500 ? 'Seeker' : 'Beginner'}
                                    </div>
                                    <div className={`text-lg font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>{user.name}</div>
                                </div>
                            </div>
                            <div className="flex gap-6 text-center">
                                <div>
                                    <div className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>{user.streak}</div>
                                    <div className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>Streak</div>
                                </div>
                                <div>
                                    <div className={`text-2xl font-display font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>{user.points}</div>
                                    <div className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>Points</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Profile Section */}
                    <CollapsibleSection
                        title="Personal Profile"
                        icon={<User size={20} />}
                        isOpen={openSections.profile}
                        onToggle={() => toggleSection('profile')}
                        isDarkMode={isDarkMode}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="Your name" />
                            </div>
                            <div>
                                <label className={labelClasses}>Profession</label>
                                <select value={profession} onChange={e => setProfession(e.target.value)} className={inputClasses}>
                                    <option value="">Select your profession...</option>
                                    <option value="Artist">Artist</option>
                                    <option value="Athlete">Athlete</option>
                                    <option value="Coach">Coach / Mentor</option>
                                    <option value="Consultant">Consultant</option>
                                    <option value="Creative">Creative Professional</option>
                                    <option value="Designer">Designer</option>
                                    <option value="Developer">Software Developer</option>
                                    <option value="Engineer">Engineer</option>
                                    <option value="Entrepreneur">Entrepreneur</option>
                                    <option value="Executive">Executive / Leader</option>
                                    <option value="Filmmaker">Filmmaker / Director</option>
                                    <option value="Finance">Finance Professional</option>
                                    <option value="Healthcare">Healthcare Professional</option>
                                    <option value="Lawyer">Lawyer / Legal</option>
                                    <option value="Marketing">Marketing Professional</option>
                                    <option value="Musician">Musician / Composer</option>
                                    <option value="Real Estate">Real Estate Professional</option>
                                    <option value="Sales">Sales Professional</option>
                                    <option value="Scientist">Scientist / Researcher</option>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher / Educator</option>
                                    <option value="Writer">Writer / Author</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Focus Goal</label>
                                <input value={career} onChange={e => setCareer(e.target.value)} className={inputClasses} placeholder="e.g., Launch my business, Get promoted, Build healthy habits, Write a book" />
                            </div>
                            <div>
                                <label className={labelClasses}>Interests</label>
                                <input value={interests} onChange={e => setInterests(e.target.value)} className={inputClasses} placeholder="Mindfulness, Growth, etc." />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Experience Section (Tier + Source) */}
                    <CollapsibleSection
                        title="Experience"
                        icon={<Sparkles size={20} />}
                        isOpen={openSections.experience}
                        onToggle={() => toggleSection('experience')}
                        isDarkMode={isDarkMode}
                    >
                        <div className="space-y-6">
                            {/* Tier Selector */}
                            <div>
                                <label className={labelClasses}>Quote Intensity</label>
                                <p className={`text-sm mb-3 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    Choose how you want to be motivated
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {tiers.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTier(t.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${tier === t.id
                                                ? isDarkMode ? 'bg-pale-gold/20 border-pale-gold text-white' : 'bg-sage text-white border-sage'
                                                : isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                                }`}
                                        >
                                            <div className={`mb-2 flex justify-center ${tier === t.id ? (isDarkMode ? 'text-pale-gold' : 'text-white') : ''}`}>{t.icon}</div>
                                            <div className="font-display font-medium text-sm">{t.name}</div>
                                            <div className="text-xs opacity-70 mt-1">{t.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Source Preference */}
                            <div>
                                <label className={labelClasses}>Quote Source</label>
                                <p className={`text-sm mb-3 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    Choose where your quotes come from
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'human' as const, name: 'Human', desc: 'Classic wisdom' },
                                        { id: 'ai' as const, name: 'AI Coach', desc: 'Personalized' },
                                        { id: 'mix' as const, name: 'Both', desc: 'Best of both' },
                                    ].map(source => (
                                        <button
                                            key={source.id}
                                            onClick={() => setSourcePreference(source.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${sourcePreference === source.id
                                                ? isDarkMode ? 'bg-pale-gold/20 border-pale-gold text-white' : 'bg-sage text-white border-sage'
                                                : isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                                }`}
                                        >
                                            <div className="font-display font-medium text-sm">{source.name}</div>
                                            <div className="text-xs opacity-70 mt-1">{source.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Voice Coach Section */}
                    <CollapsibleSection
                        title="Voice Coach"
                        icon={<Volume2 size={20} />}
                        isOpen={openSections.voice}
                        onToggle={() => toggleSection('voice')}
                        isDarkMode={isDarkMode}
                    >
                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                            Choose your preferred voice for read-aloud affirmations
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {voices.map(voice => (
                                <div key={voice.id} className="relative">
                                    <button
                                        onClick={() => setVoicePreference(voice.id)}
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
                                            handlePreviewVoice(voice.id);
                                        }}
                                        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${previewingVoice === voice.id
                                            ? 'bg-pale-gold text-warm-gray-green animate-pulse'
                                            : 'bg-sage text-white hover:bg-pale-gold hover:text-warm-gray-green'
                                            }`}
                                        title="Preview voice"
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                    {/* Notifications Section */}
                    <CollapsibleSection
                        title="Notifications"
                        icon={<Bell size={20} />}
                        isOpen={openSections.notifications}
                        onToggle={() => toggleSection('notifications')}
                        isDarkMode={isDarkMode}
                    >
                        <div className="space-y-6">
                            {/* Enable Toggle */}
                            <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.enabled
                                        ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                        : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                        }`}>
                                        {settings.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                                    </div>
                                    <div>
                                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                            Daily Reminders
                                        </div>
                                        <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                            {settings.enabled ? 'On' : 'Off'} • {permission === 'granted' ? 'Permitted' : 'Permission Required'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleEnabled}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.enabled
                                        ? 'bg-sage'
                                        : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                        }`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            {/* Quiet Hours */}
                            <div className={!settings.enabled ? 'opacity-50 pointer-events-none' : ''}>
                                <label className={labelClasses}>Quiet Hours</label>
                                <p className={`text-sm mb-3 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    No notifications during these hours
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className={`text-xs mb-1 ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>From</div>
                                        <div className="relative">
                                            <Clock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`} />
                                            <input
                                                type="time"
                                                value={quietStart}
                                                onChange={e => handleQuietHoursChange(e.target.value, quietEnd)}
                                                className={`${inputClasses} pl-10`}
                                            />
                                        </div>
                                    </div>
                                    <div className={`mt-4 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>→</div>
                                    <div className="flex-1">
                                        <div className={`text-xs mb-1 ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>To</div>
                                        <div className="relative">
                                            <Clock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`} />
                                            <input
                                                type="time"
                                                value={quietEnd}
                                                onChange={e => handleQuietHoursChange(quietStart, e.target.value)}
                                                className={`${inputClasses} pl-10`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Test Button */}
                            <button
                                onClick={testNotification}
                                className={`w-full p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${isDarkMode
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                                    : 'bg-white/60 border-sage/20 hover:bg-white text-warm-gray-green'
                                    }`}
                            >
                                <Bell size={16} />
                                <span>Send Test Notification</span>
                            </button>
                        </div>
                    </CollapsibleSection>

                    {/* Data & Privacy Section */}
                    <CollapsibleSection
                        title="Data & Privacy"
                        icon={<Download size={20} />}
                        isOpen={openSections.data}
                        onToggle={() => toggleSection('data')}
                        isDarkMode={isDarkMode}
                    >
                        <button
                            onClick={() => {
                                const allData: any = {
                                    profile: user,
                                    journalEntries: [],
                                    exportedAt: new Date().toISOString(),
                                };
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
                            <span>Download Data (JSON)</span>
                        </button>

                        <button
                            onClick={async () => {
                                // Dynamically import to keep bundle small if possible, or just standard import
                                const { generatePDF } = await import('../utils/exportService');
                                // Need to ensure user object has all journal entries populated or fetch them
                                // Current user object in App.tsx might only have some? 
                                // Actually App.tsx seems to keep journalEntries in state.
                                // But let's act safe and re-fetch from local storage to be sure we have everything for the PDF
                                const fullUser = { ...user };
                                const entries = [];
                                for (let i = 0; i < localStorage.length; i++) {
                                    const key = localStorage.key(i);
                                    if (key && key.startsWith('motiv8_journal_')) {
                                        try {
                                            const item = localStorage.getItem(key);
                                            if (item) entries.push(JSON.parse(item));
                                        } catch (e) { console.error(e); }
                                    }
                                }
                                fullUser.journalEntries = entries;
                                generatePDF(fullUser);
                            }}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 mt-3 ${isDarkMode
                                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                }`}
                        >
                            <BookOpen size={20} />
                            <span>Export Journal (PDF)</span>
                        </button>

                        <p className={`text-xs text-center mt-3 ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>
                            Export your data for backup or printing.
                        </p>
                    </CollapsibleSection>

                    {/* About Section */}
                    <div className={`rounded-2xl p-6 border text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-sage/10'}`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Info size={16} className={isDarkMode ? 'text-white/40' : 'text-sage/40'} />
                            <span className={`text-xs uppercase tracking-widest font-medium ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>About Palante</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                            Personalized Progress, Delivered Daily
                        </p>
                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-white/30' : 'text-warm-gray-green/30'}`}>
                            Version 1.0.0 • Made with ♥
                        </p>
                    </div>

                </div>
            </div>

            {/* Save Button */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDarkMode ? 'bg-warm-gray-green/95 backdrop-blur-xl border-t border-white/10' : 'bg-ivory/95 backdrop-blur-xl border-t border-sage/10'}`}>
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
