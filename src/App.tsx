import { useState, useEffect, useRef } from 'react';
import { Onboarding } from './components/Onboarding';
import { TierSelector } from './components/TierSelector';
import { QuoteDisplay } from './components/QuoteDisplay';
import { Reflections } from './components/Reflections';
import { Library } from './components/Library';
import { Momentum } from './components/Momentum';
import { getRelevantQuotes } from './utils/quoteMatcher';
import type { UserProfile, Quote, Tier, JournalEntry, Goal, ActivityType, DailyFocus } from './types';
import { Profile } from './components/Profile';
import { Breathing } from './components/Breathing';
import { Meditation } from './components/Meditation';
import { SoundMixer } from './components/SoundMixer';

import { Home, Wind, TrendingUp, BookOpen, User as UserIcon, Sun, Moon, Flower, BookHeart, Music } from 'lucide-react';
import { MorningBriefing } from './components/MorningBriefing';

import { TRACKS, type SoundTrack } from './data/audioTracks';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'momentum' | 'breath' | 'reflect' | 'meditate' | 'library'>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showSoundMixer, setShowSoundMixer] = useState(false);

  useEffect(() => {
    // Morning Briefing Logic
    const lastBriefingDate = localStorage.getItem('palante_last_briefing');
    const today = new Date().toISOString().split('T')[0];

    if (lastBriefingDate !== today) {
      setShowBriefing(true);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('motiv8_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);

      // Daily Reset Logic: Clear focuses from previous days
      const today = new Date().toISOString().split('T')[0];
      if (parsedUser.dailyFocuses) {
        const activeFocuses = parsedUser.dailyFocuses.filter((f: any) => f.createdAt.startsWith(today));

        // If we filtered out old focuses, update storage immediately
        if (activeFocuses.length !== parsedUser.dailyFocuses.length) {
          parsedUser.dailyFocuses = activeFocuses;
          localStorage.setItem('motiv8_user', JSON.stringify(parsedUser));
        }
      }

      setUser(parsedUser);
      loadNewQuote(parsedUser);
    }
  }, []);

  const togglePlay = (trackId: string) => {
    if (currentTrackId === trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentTrackId !== trackId) {
        const track = TRACKS.find(t => t.id === trackId);
        if (track && audioRef.current) {
          audioRef.current.src = track.url;
          setCurrentTrackId(trackId);
          audioRef.current.play().catch(e => console.error("Audio play failed", e));
          setIsPlaying(true);
          return;
        }
      }
      audioRef.current?.play().catch(e => console.error("Audio play failed", e));
      setIsPlaying(true);
    }
  };

  const loadNewQuote = (userProfile: UserProfile, sourceOverride?: 'human' | 'ai') => {
    const profileToUse = sourceOverride
      ? { ...userProfile, sourcePreference: sourceOverride }
      : userProfile;
    const quotes = getRelevantQuotes(profileToUse);
    setAllQuotes(quotes); // Store all quotes for Library
    if (quotes.length > 0) {
      setCurrentQuote(quotes[0]);
    }
  };

  const saveUserProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    localStorage.setItem('motiv8_user', JSON.stringify(profile));
    setUser(profile);
    loadNewQuote(profile);
  };

  const handleBriefingComplete = (focusText: string) => {
    if (!user) return;

    const newFocus: DailyFocus = {
      id: Date.now().toString(),
      text: focusText,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    // Add to user's daily focuses
    const updatedUser = {
      ...user,
      dailyFocuses: [...(user.dailyFocuses || []), newFocus]
    };

    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));

    // Mark briefing as done for today
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('palante_last_briefing', today);

    setShowBriefing(false);
  };

  const handleTierSelect = (tier: Tier) => {
    if (user) {
      const updatedUser = { ...user, tier: tier };
      setUser(updatedUser);
      saveUserProfile(updatedUser);
      loadNewQuote(updatedUser);
    }
  };

  const handleActivity = (type: ActivityType, providedUser?: UserProfile) => {
    // Use provided user or fall back to state (providedUser prevents race conditions)
    const currentUser = providedUser || user;
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const existingLog = currentUser.activityHistory?.find(log => log.date === today && log.type === type);

    // Create a mutable copy of user to modify
    const updatedUser = { ...currentUser };
    updatedUser.activityHistory = updatedUser.activityHistory || [];

    if (existingLog) {
      // Find and update the existing log in the copied array
      updatedUser.activityHistory = updatedUser.activityHistory.map(log =>
        (log.date === today && log.type === type) ? { ...log, count: log.count + 1 } : log
      );
    } else {
      updatedUser.activityHistory.push({ date: today, type, count: 1 });
    }

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const hasActivityToday = updatedUser.activityHistory.some(log => log.date === today);
    const hadActivityYesterday = updatedUser.activityHistory.some(log => log.date === yesterdayStr);

    if (hasActivityToday && hadActivityYesterday) {
      updatedUser.streak = (updatedUser.streak || 0) + 1;
    } else if (hasActivityToday && !hadActivityYesterday) {
      // If there's activity today but not yesterday, reset streak to 1
      updatedUser.streak = 1;
    } else if (!hasActivityToday) {
      // If no activity today, streak is broken
      updatedUser.streak = 0;
    }

    saveUserProfile(updatedUser);
  };

  const handleSaveMeditationReflection = (reflectionData: { intention: string; duration: number; reflection: string; mantra: string }) => {
    if (!user) return;
    const newReflection = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...reflectionData
    };

    const updatedUser = { ...user };
    updatedUser.meditationReflections = updatedUser.meditationReflections || [];
    updatedUser.meditationReflections.unshift(newReflection); // Add to beginning
    saveUserProfile(updatedUser);
    console.log('Meditation reflection saved:', newReflection);
  };

  const getActivityDatasets = () => {
    if (!user || !user.activityHistory) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const activityTypes: { type: ActivityType; label: string; color: string }[] = [
      { type: 'quote', label: 'Quotes', color: 'text-sage' },
      { type: 'breath', label: 'Breath', color: 'text-teal-500' },
      { type: 'meditate', label: 'Meditate', color: 'text-warm-gray-green' },
      { type: 'reflect', label: 'Reflect', color: 'text-pale-gold' },
    ];

    return activityTypes.map(({ type, label, color }) => ({
      label,
      color,
      data: last7Days.map(date => {
        const entry = user.activityHistory?.find(h => h.date === date && h.type === type);
        return entry ? entry.count : 0;
      })
    }));
  };


  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
    loadNewQuote(updatedUser);
  };

  const handleToggleFavorite = () => {
    if (!user || !currentQuote) return;

    const favorites = user.favoriteQuotes || [];
    const isFavorited = favorites.some(fav => fav.quoteId === currentQuote.id);

    let updatedFavorites;
    if (isFavorited) {
      updatedFavorites = favorites.filter(fav => fav.quoteId !== currentQuote.id);
    } else {
      updatedFavorites = [...favorites, { quoteId: currentQuote.id, savedAt: new Date().toISOString() }];
      // Track quote save as activity
      handleActivity('quote');
    }

    const updatedUser = { ...user, favoriteQuotes: updatedFavorites };
    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
  };

  const handleRemoveFavorite = (quoteId: string) => {
    if (!user) return;
    const updatedFavorites = user.favoriteQuotes?.filter(fav => fav.quoteId !== quoteId) || [];
    const updatedUser = { ...user, favoriteQuotes: updatedFavorites };
    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
  };


  const handleRemoveJournalEntry = (entryId: string) => {
    if (!user) return;
    const updatedUser = { ...user };
    if (updatedUser.journalEntries) {
      updatedUser.journalEntries = updatedUser.journalEntries.filter(e => e.id !== entryId);
      // Remove from individual localStorage if exists
      const entryToRemove = user.journalEntries?.find(e => e.id === entryId);
      if (entryToRemove) {
        localStorage.removeItem(`motiv8_journal_${entryToRemove.date}`);
      }
      setUser(updatedUser);
      localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
    }
  };

  if (!user) {
    return <Onboarding onComplete={handleOnboardingComplete} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
  }

  // Theme Classes
  const bgClass = isDarkMode ? 'bg-warm-gray-green text-white' : 'bg-ivory text-warm-gray-green';
  const headerBtnClass = isDarkMode
    ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
    : 'bg-white/60 border-sage/20 hover:bg-sage/10 text-sage';
  const navClass = isDarkMode
    ? 'bg-warm-gray-green/90 border-white/10 shadow-lg'
    : 'bg-white/80 border-sage/20 shadow-spa-lg';

  return (
    <div className={`min-h-screen font-body overflow-hidden transition-colors duration-500 ${bgClass}`}>
      {/* Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-30 px-8 py-6 flex items-center justify-between backdrop-blur-xl ${isDarkMode ? 'bg-warm-gray-green/80' : 'bg-ivory/80'}`}>
        <button
          onClick={() => setShowProfile(true)}
          className={`tap-zone p-4 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${headerBtnClass}`}
        >
          <UserIcon size={20} />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <img
            src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
            alt="Palante"
            className="w-8 h-8 object-contain mb-1"
          />
          <h1 className={`text-2xl font-display font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>Palante</h1>
          <p className={`text-xs font-body tracking-widest uppercase mt-1 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
            Personalized Progress, Delivered Daily
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className={`tap-zone p-4 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${headerBtnClass}`}
        >
          {isDarkMode ? <Sun size={20} className="text-pale-gold" /> : <Moon size={20} className="text-sage" />}
        </button>
      </header>

      {/* Main Content - Full Screen Sections */}
      <main className="pt-28 pb-40">
        {activeTab === 'home' && (
          <div className="min-h-screen px-6 pb-8 animate-fade-in max-w-5xl mx-auto">
            {/* Greeting Header */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-display font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.name}! {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤️' : '🌙'}
              </h2>
              <p className={`text-sm font-body ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Tone Selector - Minimal */}
            <div className="mb-8">
              <TierSelector
                currentTier={user.tier}
                onSelect={handleTierSelect}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Quote of the Day */}
            <div className="w-full mb-8 mt-16">
              {currentQuote && (
                <QuoteDisplay
                  quote={currentQuote}
                  onNewQuote={(source) => { loadNewQuote(user, source); handleActivity('quote'); }}
                  isDarkMode={isDarkMode}
                  voicePreference={user.voicePreference}
                  isFavorited={user.favoriteQuotes?.some(fav => fav.quoteId === currentQuote.id) || false}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>

            {/* Today's Goals */}
            <div className={`p-6 rounded-2xl border mb-8 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                  Today's Goals
                </h3>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                  {user.dailyFocuses?.filter(f => f.isCompleted).length || 0}/{user.dailyFocuses?.length || 0} ✓
                </span>
              </div>

              {user.dailyFocuses && user.dailyFocuses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {user.dailyFocuses.slice(0, 4).map(focus => (
                      <button
                        key={focus.id}
                        onClick={() => {
                          const updatedFocuses = user.dailyFocuses!.map(f =>
                            f.id === focus.id ? { ...f, isCompleted: !f.isCompleted } : f
                          );
                          const updatedUser = { ...user, dailyFocuses: updatedFocuses };
                          setUser(updatedUser);
                          localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
                        }}
                        className={`text-left p-4 rounded-xl border transition-all ${focus.isCompleted
                          ? isDarkMode ? 'bg-sage/20 border-sage/30' : 'bg-sage/10 border-sage/20'
                          : isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/50 border-sage/10 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${focus.isCompleted
                            ? 'bg-sage border-sage'
                            : isDarkMode ? 'border-white/30' : 'border-sage/30'
                            }`}>
                            {focus.isCompleted && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${focus.isCompleted
                            ? isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'
                            : isDarkMode ? 'text-white' : 'text-warm-gray-green'
                            }`}>
                            {focus.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('momentum')}
                    className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-pale-gold hover:text-white' : 'text-sage hover:text-warm-gray-green'}`}
                  >
                    Manage Goals →
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                    No goals set for today
                  </p>
                  <button
                    onClick={() => setActiveTab('momentum')}
                    className={`px-6 py-3 rounded-full font-medium transition-all ${isDarkMode
                      ? 'bg-sage text-white hover:bg-sage/90'
                      : 'bg-sage text-white hover:bg-sage/90'
                      }`}
                  >
                    Set Your First Goal
                  </button>
                </div>
              )}
            </div>

            {/* Momentum Summary */}
            <div className={`p-6 rounded-2xl border mb-8 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
              <h3 className={`text-lg font-display font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                Your Momentum
              </h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                      {user.goalStreak || 0}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                      day streak
                    </p>
                  </div>
                </div>
                <div className={`w-px h-12 ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`} />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className={`text-2xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                      {user.points || 0}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                      points
                    </p>
                  </div>
                </div>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                <div
                  className={`h-full rounded-full transition-all ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}
                  style={{ width: `${Math.min(((user.activityHistory?.length || 0) / 10) * 100, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                {user.activityHistory?.length || 0}/10 activities this week
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('breath')}
                className={`p-6 rounded-2xl border transition-all hover:scale-105 ${isDarkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <Wind size={32} className={isDarkMode ? 'text-white/60' : 'text-sage/60'} />
                  <p className={`text-sm font-medium mt-2 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                    Breathe
                  </p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reflect')}
                className={`p-6 rounded-2xl border transition-all hover:scale-105 ${isDarkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <BookOpen size={32} className={isDarkMode ? 'text-white/60' : 'text-sage/60'} />
                  <p className={`text-sm font-medium mt-2 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                    Reflect
                  </p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('meditate')}
                className={`p-6 rounded-2xl border transition-all hover:scale-105 ${isDarkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <Flower size={32} className={isDarkMode ? 'text-white/60' : 'text-sage/60'} />
                  <p className={`text-sm font-medium mt-2 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                    Meditate
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'momentum' && (
          <Momentum
            user={user}
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));
            }}
            isDarkMode={isDarkMode}
            activityDatasets={getActivityDatasets()}
          />
        )}

        {activeTab === 'breath' && (
          <div className="min-h-screen flex items-center justify-center px-6 pb-8 animate-fade-in">
            <Breathing isDarkMode={isDarkMode} accentColor={isDarkMode ? 'text-pale-gold' : 'text-sage'} onComplete={() => handleActivity('breath')} />
          </div>
        )}

        {activeTab === 'meditate' && (
          <div className="min-h-screen px-6 pb-8 animate-fade-in">
            <Meditation
              isDarkMode={isDarkMode}
              onComplete={() => handleActivity('meditate')}
              voicePreference={user.voicePreference}
              onSaveReflection={handleSaveMeditationReflection}
            />
          </div>
        )}

        {activeTab === 'reflect' && (
          <div className="min-h-screen px-6 pb-8 animate-fade-in">
            <Reflections
              onSave={(entry: JournalEntry) => {
                console.log('=== SAVING DAILY REFLECTION ===');
                console.log('Entry:', entry);
                if (!user) return;

                // CRITICAL: Create completely new array and object references
                const existingEntries = user.journalEntries || [];
                const filteredEntries = existingEntries.filter(e => e.date !== entry.date);
                const newJournalEntries = [...filteredEntries, entry]; // NEW array reference

                // Create completely new user object
                const updatedUser: UserProfile = {
                  ...user,
                  journalEntries: newJournalEntries, // NEW array
                  points: (user.points || 0) + 10
                };

                console.log('New journalEntries array:', newJournalEntries);
                console.log('Updated user object:', updatedUser);

                // Save to localStorage
                localStorage.setItem(`motiv8_journal_${entry.date}`, JSON.stringify(entry));
                localStorage.setItem('motiv8_user', JSON.stringify(updatedUser));

                // Update React state with NEW object
                setUser(updatedUser);
                console.log('=== setUser called with new object ===');

                // CRITICAL: Pass updatedUser to handleActivity to prevent race condition
                handleActivity('reflect', updatedUser);
              }}
              isDarkMode={isDarkMode}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              tracks={TRACKS}
            />
          </div>
        )}

        {activeTab === 'library' && (
          <div className="min-h-screen px-6 pb-8 animate-fade-in">
            <Library
              key={`library-${user.journalEntries?.length || 0}-${user.favoriteQuotes?.length || 0}`}
              favoriteQuotes={user.favoriteQuotes || []}
              allQuotes={allQuotes}
              journalEntries={user.journalEntries || []}
              meditationReflections={user.meditationReflections || []}
              isDarkMode={isDarkMode}
              onRemoveFavorite={handleRemoveFavorite}
              onRemoveJournalEntry={handleRemoveJournalEntry}
              voicePreference={user.voicePreference || 'nova'}
            />
          </div>
        )}
      </main>

      {/* Premium Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className={`flex items-center gap-3 px-6 py-4 rounded-full backdrop-blur-xl border transition-all duration-500 ${navClass}`}>
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'momentum', icon: TrendingUp, label: 'Coach' },
            { id: 'breath', icon: Wind, label: 'Breath' },
            { id: 'meditate', icon: Flower, label: 'Meditate' },
            { id: 'reflect', icon: BookOpen, label: 'Reflect' },
            { id: 'library', icon: BookHeart, label: 'Library' },
          ].map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`tap-zone flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all duration-300 ${activeTab === tab.id
                  ? isDarkMode
                    ? 'bg-white/10 text-white'
                    : 'bg-sage/20 text-sage'
                  : isDarkMode
                    ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    : 'text-sage/60 hover:text-sage hover:bg-sage/10'
                  }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <Profile
          user={user}
          onUpdate={handleProfileUpdate}
          isDarkMode={isDarkMode}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Morning Briefing Overlay */}
      {showBriefing && user && currentQuote && (
        <MorningBriefing
          quote={currentQuote}
          username={user.name}
          onComplete={handleBriefingComplete}
          onDismiss={() => setShowBriefing(false)}
        />
      )}

      {/* Soundscape Mixer - Global */}
      <SoundMixer
        isVisible={showSoundMixer}
        onClose={() => setShowSoundMixer(false)}
        isDarkMode={isDarkMode}
      />

      {/* Floating Mixer Toggle (Bottom Right) */}
      <button
        onClick={() => setShowSoundMixer(!showSoundMixer)}
        className={`fixed bottom-24 right-6 z-40 p-3 rounded-full shadow-2xl border transition-all hover:scale-110 ${showSoundMixer
          ? isDarkMode ? 'bg-pale-gold text-warm-gray-green border-pale-gold' : 'bg-sage text-white border-sage'
          : isDarkMode ? 'bg-warm-gray-green/80 text-white/60 border-white/10 backdrop-blur-md' : 'bg-white/80 text-sage/60 border-sage/20 backdrop-blur-md'
          }`}
      >
        <Music size={24} />
      </button>

      <audio ref={audioRef} loop className="hidden" />
    </div>
  );
}

export default App;
