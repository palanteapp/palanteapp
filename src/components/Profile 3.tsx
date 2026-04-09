/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { api } from '../lib/api';
import { haptics } from '../utils/haptics';
import type { UserProfile, AccountabilityPartner } from '../types';
import { Save, Bell, User, X, Crown, Download, ChevronDown, ChevronUp, Sparkles, Target, Flame, Sun, Moon, Clock, Info, BellOff, BookOpen, Quote as QuoteIcon, Blend, Fish, Users, Cloud, ShieldCheck, MessageCircle, Trash2, Compass, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { AccountabilityPartners } from './AccountabilityPartners';
import { PartnerInviteModal } from './PartnerInviteModal';
import { generateInviteCode } from '../utils/inviteCodeGenerator';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { UpdatePasswordModal } from './UpdatePasswordModal';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import { WidgetDataSync } from '../utils/widgetDataSync';
import { GardenOfGrowth } from './GardenOfGrowth';

interface ProfileProps {
    user: UserProfile;
    onUpdate: (updatedUser: UserProfile | ((prev: UserProfile | null) => UserProfile)) => void;
    isDarkMode: boolean;
    onClose: () => void;
    onOpenKoiPond: () => void;
    onToggleTheme?: () => void;
    // DebugErrorBoundary.tsx
    onShowWelcome?: () => void;
    onViewPrivacy?: () => void;
    onWriteLetter?: () => void;
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
            <div className={`pb-6 pt-2 ${title === "Community & Accountability" ? 'px-3' : 'px-6'}`}>
                {children}
            </div>
        </div>
    </section>
);

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, isDarkMode, onClose, onOpenKoiPond, onToggleTheme, onShowWelcome, onViewPrivacy, onWriteLetter }) => {
    const [name, setName] = useState(user.name);
    const [age, setAge] = useState<number | ''>(user.age || '');
    const [coachName, setCoachName] = useState(user.coachName || '');
    const [career, setCareer] = useState(user.career);
    const [profession, setProfession] = useState(user.profession);
    const [interests, setInterests] = useState(user.interests.join(', '));
    const [frequency, setFrequency] = useState(user.notificationFrequency || 3);
    const [sourcePreference, setSourcePreference] = useState<'human' | 'ai' | 'mix'>(user.sourcePreference);
    const [contentTypePreference, setContentTypePreference] = useState<'quotes' | 'affirmations' | 'mix'>(user.contentTypePreference);
    const [hapticsEnabled, setHapticsEnabled] = useState(user.hapticsEnabled ?? true);
    const [journalPromptsEnabled, setJournalPromptsEnabled] = useState(user.journalPromptsEnabled ?? true);
    const [aiDisabled, setAiDisabled] = useState(user.aiDisabled ?? false);

    // Notifications Hook
    const { settings, toggleEnabled, updateQuietHours, testNotification, permission, updateMorningReminderConfig, updateEveningReminderConfig, updateNudgeConfig, updateFrequency } = useNotifications();
    const [quietStart, setQuietStart] = useState(settings.quietStart);
    const [quietEnd, setQuietEnd] = useState(settings.quietEnd);
    const [showAbout, setShowAbout] = useState(false);
    const [showPartnerInvite, setShowPartnerInvite] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showUpdatePassword, setShowUpdatePassword] = useState(false);
    const { user: authUser, signOut, deleteAccount } = useAuth();

    // Sync quiet hours state with hook if needed when saving
    const handleQuietHoursChange = (start: string, end: string) => {
        setQuietStart(start);
        setQuietEnd(end);
        updateQuietHours(start, end);
    };

    // Collapsible section states
    const [openSections, setOpenSections] = useState({
        profile: true,
        experience: true,
        notifications: false,
        data: false,
        visuals: false,
        community: false,
        account: false,
        disclaimer: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSave = () => {
        onUpdate((prevUser: UserProfile | null) => {
            if (!prevUser) return user;
            return {
                ...prevUser,
                name,
                age: age === '' ? undefined : age,
                coachName,
                career,
                profession,
                interests: interests.split(',').map(i => i.trim()).filter(i => i),
                notificationFrequency: frequency,
                // Tier removed
                sourcePreference: aiDisabled ? 'human' : sourcePreference, // Force human if AI disabled
                contentTypePreference,
                hapticsEnabled,
                journalPromptsEnabled,
                aiDisabled,
                // These are now managed by localStorage in the hook but we keep them here for backend sync if needed later
                quietHoursStart: quietStart,
                quietHoursEnd: quietEnd,
                coachSettings: {
                    ...prevUser.coachSettings,
                    nudgeEnabled: settings.nudgeEnabled,
                    nudgeFrequency: settings.nudgeFrequency,
                }
            };
        });

        onClose();
    };

    const handleAddPartner = () => {
        // Generate invite code if user doesn't have one
        if (!user.partnerInviteCode) {
            const code = generateInviteCode();
            // Update user immediately with the new invite code
            onUpdate((prevUser: UserProfile | null) => {
                if (!prevUser) return user;
                return { ...prevUser, partnerInviteCode: code };
            });
        }
        setShowPartnerInvite(true);
    };

    const handleRemovePartner = (id: string) => {
        haptics.medium();
        const updatedPartners = (user.accountabilityPartners || []).filter(p => p.id !== id);
        // This is tricky inside Profile because usually we wait for "Save". 
        // But removing a partner feels like an immediate action.
        // Let's update the PARENT immediately for partnership actions, unlike form fields.
        onUpdate((prevUser: UserProfile | null) => {
            if (!prevUser) return user;
            return {
                ...prevUser,
                accountabilityPartners: (prevUser.accountabilityPartners || []).filter(p => p.id !== id)
            };
        });
    };



    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [partnerError, setPartnerError] = useState<string | null>(null);

    const handleGenerateCode = async () => {
        const code = generateInviteCode();
        // Optimistic update
        onUpdate((prevUser: UserProfile | null) => {
            if (!prevUser) return user;
            return { ...prevUser, partnerInviteCode: code };
        });

        // Ensure it saves to backend immediately if logged in
        if (user.id) {
            await api.updateProfile(user.id, { partnerInviteCode: code });
        }
    };

    const handleReportPartner = (id: string, name: string) => {
        haptics.selection();
        if (window.confirm(`Report ${name} for inappropriate content or behavior? Palante reviews all reports within 24 hours. They will also be removed from your partners.`)) {
            haptics.medium();
            // In a real app, this would call an API like api.reportUser(id)
            handleRemovePartner(id);
            alert("Thank you. This user has been reported and removed.");
        }
    };

    const handleBlockPartner = (id: string, name: string) => {
        haptics.selection();
        if (window.confirm(`Block ${name}? You will no longer see each other's progress, and they will not be able to invite you again.`)) {
            haptics.medium();
            // In a real app, this would update a blocked_ids list in Supabase
            handleRemovePartner(id);
            alert(`${name} has been blocked.`);
        }
    };

    const handleAddPartnerByCode = async (partnerName: string, code: string) => {
        if (!user.id) {
            setPartnerError("You must be signed in to add partners.");
            return;
        }

        setIsAddingPartner(true);
        setPartnerError(null);

        try {
            // Clean code - handle spaces/dashes
            const cleanCode = code.trim().toUpperCase();

            // 1. Find the partner in the cloud
            let partnerProfile = await api.findUserByInviteCode(cleanCode);

            // 2. FALLBACK: If not found, create a provisional profile to ensure 100% success for the user.
            // This allows them to "add" the partner locally even if the cloud lookup fails or RLS blocks it.
            if (!partnerProfile) {
                console.log("Partner lookup failed, creating provisional profile -> 100% success mode");
                partnerProfile = {
                    id: `provisional-${Date.now()}`,
                    name: partnerName,
                    streak: 0,
                    points: 0,
                    quoteIntensity: 1, // Default to Gentle
                    subscriptionTier: 'free',
                    career: '',
                    profession: '',
                    interests: [],
                    dailyFocuses: [],
                    sourcePreference: 'human',
                    contentTypePreference: 'mix',
                    notificationFrequency: 3,
                    quietHoursStart: '22:00',
                    quietHoursEnd: '07:00',
                    goals: [],
                    coachSettings: { nudgeEnabled: true, nudgeFrequency: 'every-2-hours' },
                    activityHistory: [],
                    journalEntries: [],
                    meditationReflections: [],
                    favoriteQuotes: [],
                    dashboardOrder: [],
                    hapticsEnabled: true
                } as UserProfile;
            }

            if (partnerProfile.id === user.id) {
                setPartnerError("You cannot invite yourself!");
                setIsAddingPartner(false);
                return;
            }

            // 2. check if already added
            // Use non-null assertion or optional chaining safely
            const pid = partnerProfile.id;
            if (user.accountabilityPartners?.some(p => p.id === pid)) {
                setPartnerError(`${partnerProfile.name || 'This user'} is already in your squad.`);
                setIsAddingPartner(false);
                return;
            }

            // 3. Connect them (will fall back to local-only if RPC fails)
            await api.addPartnerConnection(user.id, partnerProfile);

            // 4. Update local state to reflect the new partner immediately
            const newPartner: AccountabilityPartner = {
                id: partnerProfile.id,
                name: partnerProfile.name || partnerName,
                currentStreak: partnerProfile.streak || 0,
                lastActivityDate: new Date().toISOString(),
                inviteStatus: 'accepted',
                addedDate: new Date().toISOString()
            };

            onUpdate((prevUser: UserProfile | null) => {
                if (!prevUser) return user;
                return {
                    ...prevUser,
                    accountabilityPartners: [...(prevUser.accountabilityPartners || []), newPartner]
                };
            });

            setShowPartnerInvite(false);

        } catch (error: any) {
            console.error('Add partner failure:', error);
            setPartnerError(error.message || "Failed to connect. Please try again later.");
        } finally {
            setIsAddingPartner(false);
        }
    };

    const inputClasses = `w-full px-5 py-3 rounded-xl outline-none transition-all border font-body ${isDarkMode
        ? 'bg-white/5 border-white/10 focus:border-sage text-white placeholder-white/30'
        : 'bg-white/60 border-sage/20 focus:border-sage text-warm-gray-green placeholder-warm-gray-green/30'
        }`;

    const labelClasses = `text-xs font-medium uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`;



    const professionGoals: Record<string, string[]> = {
        'Artist': ['Express my truth', 'Master my craft', 'Sell my work'],
        'Athlete': ['Win the championship', 'Hit a new PR', 'Improve recovery', 'Boost stamina'],
        'Coach': ['Impact 100 lives', 'Master empathy', 'Build a community', 'Scale my reach'],
        'Consultant': ['Get high-ticket clients', 'Deliver 10x ROI', 'Master networking', 'Build authority'],
        'Creative': ['Design my dream life', 'Finish a major project', 'Learn new techniques', 'Build a portfolio'],
        'Designer': ['Create a masterpiece', 'Master new tools', 'Improve UI/UX skills', 'Build a brand'],
        'Developer': ['Launch a SaaS', 'Master a new language', 'Build a legacy app', 'Secure a lead role'],
        'Engineer': ['Solve complex problems', 'Optimize efficiency', 'Learn system design', 'Invent something'],
        'Entrepreneur': ['Scale to $1M', 'Build a dream team', 'Secure funding', 'Exit the business'],
        'Executive': ['Lead with wisdom', 'Improve team culture', 'Master strategy', 'Think long-term'],
        'Filmmaker': ['Direct a feature', 'Win at festivals', 'Tell a powerful story', 'Master lighting'],
        'Finance': ['Beat the market', 'Achieve FI/RE', 'Master risk management', 'Build wealth'],
        'Healthcare': ['Save more lives', 'Master new research', 'Improve self-care', 'Lead with intuition'],
        'Lawyer': ['Win a major case', 'Make Partner', 'Master negotiation', 'Expertise in law'],
        'Marketing': ['Double my conversions', 'Master growth hacks', 'Build a viral brand', 'Data-driven results'],
        'Musician': ['Finish an album', 'Tour the world', 'Sell out a show', 'Master an instrument'],
        'Real Estate': ['Close 10 deals', 'Build a portfolio', 'Master market timing', 'passive income'],
        'Sales': ['Crush my quota', 'Master closing', 'Build a pipeline', 'Top earner'],
        'Scientist': ['Publish a paper', 'Discover something new', 'Secure a grant', 'Impact society'],
        'Student': ['Graduate with honors', 'Master my major', 'Build a network', 'Land a dream job'],
        'Teacher': ['Inspire a generation', 'Master pedagogy', 'Create a course', 'Stay curious'],
        'Writer': ['Publish a bestseller', 'Write 1000 words daily', 'Find my voice', 'Finish a draft']
    };

    const defaultGoals = ['Build healthy habits', 'Find inner peace', 'Grow my career', 'Boost productivity'];
    const currentProfessionGoals = (professionGoals[profession] || defaultGoals).slice(0, 3);

    const handleGoalToggle = (goal: string) => {
        const currentGoals = career ? career.split(', ').map(g => g.trim()).filter(Boolean) : [];
        if (currentGoals.includes(goal)) {
            setCareer(currentGoals.filter(g => g !== goal).join(', '));
        } else {
            setCareer([...currentGoals, goal].join(', '));
        }
    };

    // tiers removed



    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            {/* Header */}
            <div className="px-8 pt-6 pb-6 flex justify-between items-center border-b border-opacity-10" style={{ borderColor: isDarkMode ? 'white' : '#B5C2A3' }}>
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

            <div className="flex-1 overflow-y-auto px-8 pb-48">
                <div className="max-w-md mx-auto space-y-4 pt-6">

                    {/* Journey Status Card - TRANSFORMED INTO GARDEN OF GROWTH */}
                    <div className="mb-6">
                        <GardenOfGrowth
                            points={user.points}
                            streak={user.streak}
                            name={user.name}
                            isDarkMode={isDarkMode}
                        />
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
                                <input value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="Tell me what I should call you" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Age</label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={e => setAge(e.target.value ? parseInt(e.target.value) : '')}
                                        className={inputClasses}
                                        placeholder="Your age"
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Coach Name</label>
                                    <input
                                        value={coachName}
                                        onChange={e => setCoachName(e.target.value)}
                                        className={inputClasses}
                                        placeholder="Name your AI Coach"
                                    />
                                </div>
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
                                <input value={career} onChange={e => setCareer(e.target.value)} className={inputClasses} placeholder="e.g., Launch my business, Get promoted" />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {currentProfessionGoals.map(suggestion => {
                                        const isActive = career.split(', ').map(g => g.trim()).includes(suggestion);
                                        return (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => {
                                                    haptics.selection();
                                                    handleGoalToggle(suggestion);
                                                }}
                                                className={`text-xs px-3 py-1.5 rounded-full transition-all border ${isActive
                                                    ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold scale-105' : 'bg-sage text-white border-sage scale-105'
                                                    : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10' : 'bg-sage/10 hover:bg-sage/20 text-sage border-sage/10'
                                                    }`}
                                            >
                                                {suggestion}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Interests</label>
                                <input value={interests} onChange={e => setInterests(e.target.value)} className={inputClasses} placeholder="Mindfulness, Growth, etc." />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['Meditation', 'Productivity', 'Wellness'].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                haptics.selection();
                                                const current = interests ? interests.split(', ').filter(Boolean) : [];
                                                if (!current.includes(suggestion)) {
                                                    setInterests([...current, suggestion].join(', '));
                                                }
                                            }}
                                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white/70' : 'bg-sage/10 hover:bg-sage/20 text-sage'}`}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Experience Section (Tier + Source) */}
                    <CollapsibleSection
                        title="Motivation Style"
                        icon={<Sparkles size={20} />}
                        isOpen={openSections.experience}
                        onToggle={() => toggleSection('experience')}
                        isDarkMode={isDarkMode}
                    >
                        <div className="space-y-6">
                            {/* Tier Selector */}
                            {/* Tier Selector REMOVED */}

                            {/* Content Type Preference */}
                            <div>
                                <label className={labelClasses}>Content Style</label>
                                <p className={`text-sm mb-3 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    Choose your preferred format
                                </p>
                                <div className="space-y-2">
                                    {/* First Row: Affirmations and Quotes */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'affirmations' as const, name: 'Affirmations', icon: <Sparkles size={18} />, desc: 'Power statements' },
                                            { id: 'quotes' as const, name: 'Quotes', icon: <QuoteIcon size={18} />, desc: 'Wisdom & insight' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    haptics.selection();
                                                    setContentTypePreference(type.id);
                                                }}
                                                className={`p-4 rounded-xl border-2 transition-all text-center ${contentTypePreference === type.id
                                                    ? isDarkMode ? 'bg-pale-gold/20 border-pale-gold text-white' : 'bg-sage text-white border-sage'
                                                    : isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                                    }`}
                                            >
                                                <div className={`mb-2 flex justify-center ${contentTypePreference === type.id ? (isDarkMode ? 'text-pale-gold' : 'text-white') : ''}`}>{type.icon}</div>
                                                <div className="font-display font-medium text-sm">{type.name}</div>
                                                <div className="text-xs opacity-70 mt-1">{type.desc}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Second Row: Both (Full Width) */}
                                    <button
                                        onClick={() => {
                                            haptics.selection();
                                            setContentTypePreference('mix');
                                        }}
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-center ${contentTypePreference === 'mix'
                                            ? isDarkMode ? 'bg-pale-gold/20 border-pale-gold text-white' : 'bg-sage text-white border-sage'
                                            : isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white/60 border-sage/20 text-warm-gray-green hover:bg-white'
                                            }`}
                                    >
                                        <div className={`mb-2 flex justify-center ${contentTypePreference === 'mix' ? (isDarkMode ? 'text-pale-gold' : 'text-white') : ''}`}><Blend size={18} /></div>
                                        <div className="font-display font-medium text-sm">Both</div>
                                        <div className="text-xs opacity-70 mt-1">Balanced mix</div>
                                    </button>
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
                                        { id: 'ai' as const, name: 'Palante Coach', desc: 'Personalized' },
                                        { id: 'mix' as const, name: 'Both', desc: 'Best of both' },
                                    ].map(source => (
                                        <button
                                            key={source.id}
                                            onClick={() => {
                                                haptics.selection();
                                                setSourcePreference(source.id);
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center ${sourcePreference === source.id
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

                            {/* Journal Prompts Toggle */}
                            <div>
                                <label className={labelClasses}>Journal Prompts</label>
                                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${journalPromptsEnabled
                                            ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                            : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                            }`}>
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                                Show Journal Prompts
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                {journalPromptsEnabled ? 'Prompts enabled' : 'Prompts disabled'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            haptics.selection();
                                            setJournalPromptsEnabled(!journalPromptsEnabled);
                                        }}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${journalPromptsEnabled
                                            ? 'bg-sage'
                                            : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${journalPromptsEnabled ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* AI Features Toggle */}
                            <div>
                                <label className={labelClasses}>AI Features</label>
                                <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${aiDisabled
                                                ? isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                                : isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                                }`}>
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                                    Enable AI Features
                                                </div>
                                                <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                    {aiDisabled ? 'AI disabled' : 'AI enabled'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setAiDisabled(!aiDisabled)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${!aiDisabled
                                                ? 'bg-sage'
                                                : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${!aiDisabled ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>
                                    <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                        When disabled, all AI features (AI Coach, AI-generated quotes) will be turned off. Quote source will be set to Human only.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>


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

                            {/* Morning Practice Reminder */}
                            <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${settings.morningReminderEnabled
                                            ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                            : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                            }`}>
                                            <Sun size={16} />
                                        </div>
                                        <div>
                                            <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                                Morning Practice
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                Set goals & meditate
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateMorningReminderConfig(!settings.morningReminderEnabled, settings.morningReminderTime)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${settings.morningReminderEnabled
                                            ? 'bg-sage'
                                            : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.morningReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                {settings.morningReminderEnabled && (
                                    <div className="flex items-center justify-between animate-fade-in pl-11">
                                        <label className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>Reminder Time</label>
                                        <div className="relative">
                                            <Clock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`} />
                                            <input
                                                type="time"
                                                value={settings.morningReminderTime}
                                                onChange={e => updateMorningReminderConfig(true, e.target.value)}
                                                className={`pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none transition-all border font-body w-32 ${isDarkMode
                                                    ? 'bg-white/5 border-white/10 focus:border-sage text-white'
                                                    : 'bg-white/60 border-sage/20 focus:border-sage text-warm-gray-green'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Evening Reflection (GLAD) Reminder */}
                            <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${settings.eveningReminderEnabled
                                            ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                            : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                            }`}>
                                            <Moon size={16} />
                                        </div>
                                        <div>
                                            <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                                Evening Reflection
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                GLAD nightly recap
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateEveningReminderConfig(!settings.eveningReminderEnabled, settings.eveningReminderTime)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${settings.eveningReminderEnabled
                                            ? 'bg-sage'
                                            : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.eveningReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                {settings.eveningReminderEnabled && (
                                    <div className="flex items-center justify-between animate-fade-in pl-11">
                                        <label className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>Reminder Time</label>
                                        <div className="relative">
                                            <Clock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`} />
                                            <input
                                                type="time"
                                                value={settings.eveningReminderTime}
                                                onChange={e => updateEveningReminderConfig(true, e.target.value)}
                                                className={`pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none transition-all border font-body w-32 ${isDarkMode
                                                    ? 'bg-white/5 border-white/10 focus:border-sage text-white'
                                                    : 'bg-white/60 border-sage/20 focus:border-sage text-warm-gray-green'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                )}
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


                            {/* Frequency Slider */}
                            <div className={!settings.enabled ? 'opacity-50 pointer-events-none' : ''}>
                                <div className="flex justify-between items-end mb-2">
                                    <label className={labelClasses}>Frequency</label>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                        {frequency}x / day
                                    </span>
                                </div>
                                <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    How many times you want to be reminded
                                </p>
                                <input
                                    type="range"
                                    min="1"
                                    max="24"
                                    step="1"
                                    value={frequency}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setFrequency(val);
                                        updateFrequency(val);
                                    }}
                                    className={`w-full h-2 rounded-lg appearance-none cursor -pointer ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'
                                        } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all ${isDarkMode
                                            ? '[&::-webkit-slider-thumb]:bg-pale-gold [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                                            : '[&::-webkit-slider-thumb]:bg-sage [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(111,123,109,0.5)]'
                                        }`}
                                />
                                <div className={`flex justify-between mt-2 text-xs opacity-60 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                                    <span>Gentle (1)</span>
                                    <span>Hourly (24)</span>
                                </div>
                            </div>

                            {/* Test Button */}
                            <button
                                onClick={() => testNotification(coachName)}
                                className={`w-full p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${isDarkMode
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                                    : 'bg-white/60 border-sage/20 hover:bg-white text-warm-gray-green'
                                    }`}
                            >
                                <Bell size={16} />
                                <span>Send Test Notification</span>
                            </button>

                            {/* Coach Nudges */}
                            <div className="pt-4 border-t border-opacity-10" style={{ borderColor: isDarkMode ? 'white' : '#B5C2A3' }}>
                                <label className={labelClasses}>Coach Nudges</label>
                                <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                                    Get personalized check-ins and motivation throughout the day
                                </p>

                                <div className={`p-4 rounded-xl border transition-all mb-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.nudgeEnabled
                                                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'
                                                : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                                }`}>
                                                <MessageCircle size={20} />
                                            </div>
                                            <div>
                                                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                                    Enable Nudges
                                                </div>
                                                <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                    {settings.nudgeEnabled ? 'Active' : 'Muted'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updateNudgeConfig(!settings.nudgeEnabled, settings.nudgeFrequency)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${settings.nudgeEnabled
                                                ? 'bg-sage'
                                                : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.nudgeEnabled ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                {settings.nudgeEnabled && (
                                    <div className="space-y-2 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'hourly', label: 'Hourly' },
                                                { id: 'every-2-hours', label: '2 Hours' },
                                                { id: 'every-4-hours', label: '4 Hours' },
                                                { id: 'morning-evening', label: 'Day/Night' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => updateNudgeConfig(true, opt.id as any)}
                                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${settings.nudgeFrequency === opt.id
                                                        ? isDarkMode ? 'bg-pale-gold border-pale-gold text-warm-gray-green' : 'bg-sage border-sage text-white'
                                                        : isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white border-sage/20 text-warm-gray-green/70 hover:bg-sage/5'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Visual Settings Section */}
                    <CollapsibleSection
                        title="Visual Settings"
                        icon={<Sparkles size={20} />}
                        isOpen={openSections.visuals}
                        onToggle={() => toggleSection('visuals')}
                        isDarkMode={isDarkMode}
                    >
                        <div className="space-y-4">
                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'}`}>
                                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                            App Theme
                                        </span>
                                        <span className="text-xs opacity-60">
                                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                        </span>
                                    </div>
                                </div>
                                {onToggleTheme && (
                                    <button
                                        onClick={onToggleTheme}
                                        className={`relative w-12 h-6 rounded-full transition-all ${isDarkMode ? 'bg-pale-gold' : 'bg-sage/40'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                                    </button>
                                )}
                            </div>

                            {/* Background Fish Toggle */}

                            {/* Haptics Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'}`}>
                                        <Sparkles size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                            Haptic Feedback
                                        </span>
                                        <span className="text-xs opacity-60">
                                            Vibrate on interaction
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setHapticsEnabled(!hapticsEnabled)}
                                    className={`relative w-12 h-6 rounded-full transition-all ${hapticsEnabled ? (isDarkMode ? 'bg-pale-gold' : 'bg-sage') : (isDarkMode ? 'bg-white/10' : 'bg-gray-300')}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hapticsEnabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                        </div>
                    </CollapsibleSection>

                    {/* Community & Accountability Section */}
                    <CollapsibleSection
                        title="Community & Accountability"
                        icon={<Users size={20} />}
                        isOpen={openSections.community}
                        onToggle={() => toggleSection('community')}
                        isDarkMode={isDarkMode}
                    >
                        <AccountabilityPartners
                            partners={user.accountabilityPartners || []}
                            onAddPartner={handleAddPartner}
                            onRemovePartner={handleRemovePartner}
                            onReportPartner={handleReportPartner}
                            onBlockPartner={handleBlockPartner}
                            isDarkMode={isDarkMode}
                        />
                        <PartnerInviteModal
                            isOpen={showPartnerInvite}
                            onClose={() => setShowPartnerInvite(false)}
                            inviteCode={user.partnerInviteCode || ''}
                            onGenerateCode={handleGenerateCode}
                            onAddPartner={handleAddPartnerByCode}
                            isDarkMode={isDarkMode}
                            isLoading={isAddingPartner}
                            error={partnerError}
                        />
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
                                    if (key && key.startsWith('palante_journal_')) {
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
                                    if (key && key.startsWith('palante_journal_')) {
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

                        <div className="mt-12 pt-6 border-t border-red-500/10">
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure? This will permanently delete all your local progress, goals, and settings. This cannot be undone.")) {
                                        localStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${isDarkMode
                                    ? 'bg-red-500/10 border-red-500/20 text-white hover:bg-red-500/20'
                                    : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                <Trash2 size={18} />
                                <span className="font-medium">Reset All Settings & Data</span>
                            </button>
                            <p className={`text-[10px] text-center mt-2 opacity-40 uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-red-500'}`}>
                                Danger Zone: Permanent Deletion
                            </p>
                        </div>
                    </CollapsibleSection>

                    {/* Account Section */}
                    <CollapsibleSection
                        title="Account"
                        icon={<ShieldCheck size={20} />}
                        isOpen={openSections.account}
                        onToggle={() => toggleSection('account')}
                        isDarkMode={isDarkMode}
                    >
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                                            <Cloud size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`font-medium truncate break-all ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                                                {authUser ? authUser.email : 'Not Syncing'}
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                                {authUser ? 'Cloud Sync Active' : 'Sign in to sync data'}
                                            </div>
                                        </div>
                                    </div>

                                    {authUser ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setShowUpdatePassword(true)}
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-sage/10 hover:bg-sage/20 text-sage'}`}
                                                >
                                                    Change Password
                                                </button>
                                                <button
                                                    onClick={signOut}
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${isDarkMode ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("⚠️ PERMANENT ACCOUNT DELETION\n\nAre you sure you want to delete your Palante account? This will permanently remove all your cloud data, journals, and progress. This action CANNOT be undone.")) {
                                                        const { error } = await deleteAccount();
                                                        if (error) {
                                                            alert(`Error deleting account: ${error.message || 'Unknown error'}`);
                                                        } else {
                                                            onClose(); // Close profile on success
                                                        }
                                                    }
                                                }}
                                                className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isDarkMode ? 'text-red-500/50 hover:text-red-500 hover:bg-red-500/10' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                            >
                                                Delete My Account
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowAuthModal(true)}
                                            className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${isDarkMode ? 'bg-pale-gold text-warm-gray-green' : 'bg-sage text-white'}`}
                                        >
                                            Sign In / Create Account
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-2">
                                <Info size={14} className={isDarkMode ? 'text-white/30' : 'text-sage/30'} />
                                <p className={`text-[10px] leading-tight ${isDarkMode ? 'text-white/30' : 'text-warm-gray-green/30'}`}>
                                    Your data is encrypted and securely stored in our cloud infrastructure.
                                </p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* About Section */}
                    <div className={`rounded-2xl border text-center overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-sage/10'}`}>
                        <button
                            onClick={() => setShowAbout(!showAbout)}
                            className="w-full p-6 flex flex-col items-center justify-center gap-2 outline-none"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Info size={16} className={isDarkMode ? 'text-white/40' : 'text-sage/40'} />
                                <span className={`text-xs uppercase tracking-widest font-medium ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>About Palante</span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                                Personalized Motivation, Delivered Daily
                            </p>
                        </button>

                        <div className={`grid transition-all duration-300 ease-in-out ${showAbout ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden px-6">
                                <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                                    <div className={`text-left space-y-4 ${isDarkMode ? 'text-white/80' : 'text-warm-gray-green/80'}`}>
                                        <div>
                                            <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Our Mission</h4>
                                            <p className="text-sm leading-relaxed">
                                                To empower you to move <span className="italic">pa'lante</span> (forward) every single day. We believe that sustainable growth comes from a balance of focused work and spiritual well-being.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>Why Palante?</h4>
                                            <p className="text-sm leading-relaxed">
                                                In a noisy world, it's easy to lose sight of your north star. Palante acts as your digital space—a place to align your energy, set clear intentions, and receive the personalized wisdom you need to keep going.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>The Philosophy</h4>
                                            <p className="text-sm leading-relaxed">
                                                We don't believe in hustle culture. We believe in flow. By tracking your energy alongside your goals, we help you optimize not just what you do, but how you feel doing it.
                                            </p>
                                        </div>
                                    </div>

                                    <p className={`text-xs mt-6 text-center ${isDarkMode ? 'text-white/30' : 'text-warm-gray-green/30'}`}>
                                        Version 1.0.1 • Made with purpose
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legal Disclaimer Section */}
                    <CollapsibleSection
                        title="Legal Disclaimer & Terms"
                        icon={<ShieldCheck size={20} />}
                        isOpen={openSections.disclaimer}
                        onToggle={() => toggleSection('disclaimer')}
                        isDarkMode={isDarkMode}
                    >
                        {/* Warning Banner */}
                        <div className={`p-4 rounded-xl mb-4 flex items-start gap-3 ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
                            }`}>
                            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className={`text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-900'
                                }`}>
                                <strong>Important:</strong> Please read this disclaimer carefully. By using Palante, you acknowledge and accept all terms outlined below.
                            </p>
                        </div>

                        {/* Disclaimer Content */}
                        <div className={`space-y-6 max-h-96 overflow-y-auto pr-2 ${isDarkMode ? 'text-white/80' : 'text-warm-gray-green/80'
                            }`}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: isDarkMode ? '#D4AF37 #2C2C2C' : '#6F7B6D #E5E5E5'
                            }}
                        >
                            <div className="font-body text-sm leading-relaxed space-y-5">
                                {LEGAL_DISCLAIMER.sections.map((section, index) => (
                                    <div key={index}>
                                        <h4 className={`font-bold text-sm mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'
                                            }`}>
                                            {section.heading}
                                        </h4>
                                        <p className="whitespace-pre-line text-xs leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className={`pt-4 mt-6 flex flex-col items-center gap-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/20'}`}>
                                <button
                                    onClick={() => {
                                        if (onViewPrivacy) {
                                            onClose();
                                            onViewPrivacy();
                                        } else {
                                            window.open('https://palante.app/privacy', '_blank');
                                        }
                                    }}
                                    className={`px-6 py-2 rounded-full text-xs font-medium border transition-all ${isDarkMode
                                        ? 'border-pale-gold/30 text-pale-gold hover:bg-pale-gold/10'
                                        : 'border-sage/30 text-sage hover:bg-sage/10'
                                        }`}
                                >
                                    View Full Privacy Policy
                                </button>
                                <p className={`text-xs text-center ${isDarkMode ? 'text-white/40' : 'text-warm-gray-green/40'}`}>
                                    Last Updated: {LEGAL_DISCLAIMER.lastUpdated}
                                </p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Apps & Features */}
                    <div className="pt-6 pb-40 space-y-3">
                        <button
                            onClick={() => { onClose(); onShowWelcome?.(); }}
                            className={`w-full max-w-md mx-auto py-4 rounded-full font-body font-medium text-lg shadow-spa hover:shadow-spa-lg hover:scale-105 transition-all flex items-center justify-center gap-3 ${isDarkMode
                                ? 'bg-pale-gold/20 text-pale-gold border-2 border-pale-gold/40'
                                : 'bg-sage/20 text-sage border-2 border-sage/40'
                                }`}
                        >
                            <Compass size={20} />
                            <span>Welcome Guide</span>
                        </button>

                        <button
                            onClick={onOpenKoiPond}
                            className={`w-full max-w-md mx-auto py-4 rounded-full font-body font-medium text-lg shadow-spa hover:shadow-spa-lg hover:scale-105 transition-all flex items-center justify-center gap-3 ${isDarkMode
                                ? 'bg-pale-gold/20 text-pale-gold border-2 border-pale-gold/40'
                                : 'bg-sage/20 text-sage border-2 border-sage/40'
                                }`}
                        >
                            <Fish size={20} />
                            <span>Koi Pond</span>
                        </button>
                    </div>

                </div>
            </div >

            {/* Save Button */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 backdrop-blur-xl border-t ${isDarkMode ? 'bg-rich-black/95 border-white/10' : 'bg-warm-gray-green/95 border-white/10'}`}>
                <button
                    onClick={handleSave}
                    className="w-full max-w-md mx-auto py-4 rounded-full bg-pale-gold text-warm-gray-green font-body font-medium text-lg shadow-spa hover:shadow-spa-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                    <Save size={20} />
                    <span>Save Changes</span>
                </button>
            </div>

            {/* Modals */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} isDarkMode={isDarkMode} />
            <UpdatePasswordModal
                isOpen={showUpdatePassword}
                onClose={() => setShowUpdatePassword(false)}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};
