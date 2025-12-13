import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { CelebrationModal } from './components/CelebrationModal';
import { Onboarding } from './components/Onboarding';
import { TierSelector } from './components/TierSelector';
import { QuoteDisplay } from './components/QuoteDisplay';
import { CoachCard } from './components/CoachCard'; // New Import
import { getRelevantQuotes, getAIQuote } from './utils/quoteMatcher';
import type { UserProfile, Quote, Tier, JournalEntry, ActivityType, DailyFocus } from './types';
import { Profile } from './components/Profile';
import { SoundMixer } from './components/SoundMixer';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';

// Lazy load heavy components for performance
const Reflections = lazy(() => import('./components/Reflections').then(module => ({ default: module.Reflections })));
const Library = lazy(() => import('./components/Library').then(module => ({ default: module.Library })));
const Momentum = lazy(() => import('./components/Momentum').then(module => ({ default: module.Momentum })));
const Breathing = lazy(() => import('./components/Breathing').then(module => ({ default: module.Breathing })));
const Meditation = lazy(() => import('./components/Meditation').then(module => ({ default: module.Meditation })));

import { Home, Wind, TrendingUp, BookOpen, User as UserIcon, Sun, Moon, Flower, BookHeart, Music } from 'lucide-react';
import { MorningBriefing } from './components/MorningBriefing';

import { TRACKS } from './data/audioTracks';
import { useNotifications } from './hooks/useNotifications';

import { api } from './lib/api';

function AppContent() { // Renamed from App to AppContent
  const { session, loading: authLoading } = useAuth(); // New: useAuth hook
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false); // New state

  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'momentum' | 'breath' | 'reflect' | 'meditate' | 'library'>('home');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showSoundMixer, setShowSoundMixer] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Load Profile from API
  useEffect(() => {
    async function loadUser() {
      if (session?.user) {
        setLoadingProfile(true);
        const userProfile = await api.getFullUserProfile(session.user.id);

        if (userProfile) {
          setUser(userProfile);
          loadNewQuote(userProfile);
        } else {
          // New user without profile
          setUser(null);
        }
        setLoadingProfile(false);
      } else {
        setUser(null);
      }
    }
    loadUser();
  }, [session]);

  // Notification Logic
  const { settings: notificationSettings, sendNotification, isInQuietHours } = useNotifications();
  const nextNotificationTime = useRef<number>(Date.now() + 1000 * 60 * 60 * 2); // Start 2 hours from load

  useEffect(() => {
    // Check every minute for notification checks
    const interval = setInterval(() => {
      if (!notificationSettings.enabled) return;

      const now = Date.now();
      if (now >= nextNotificationTime.current) {
        if (!isInQuietHours()) {
          const messages = [
            "Take a deep breath. You've got this.",
            "Time for a mindful moment?",
            "Remember your daily intention.",
            "Pause. Breathe. Proceed.",
            "How are you feeling right now?"
          ];
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];

          sendNotification("Palante Mindfulness", {
            body: randomMsg,
            icon: '/pwa-192x192.png'
          });

          // Schedule next: 3-5 hours from now
          const hours = 3 + Math.random() * 2;
          nextNotificationTime.current = now + hours * 60 * 60 * 1000;
        } else {
          // In quiet hours, check again in 1 hour
          nextNotificationTime.current = now + 60 * 60 * 1000;
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [notificationSettings.enabled, isInQuietHours, sendNotification]);

  useEffect(() => {
    // Morning Briefing Logic
    const lastBriefingDate = localStorage.getItem('palante_last_briefing');
    const today = new Date().toISOString().split('T')[0];

    if (lastBriefingDate !== today) {
      setShowBriefing(true);
    }
  }, []);

  // Scroll-aware navigation: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Only trigger if scrolled more than 10px to avoid jitter
      if (Math.abs(scrollDelta) > 10) {
        if (scrollDelta > 0 && currentScrollY > 100) {
          // Scrolling down and past threshold - hide nav
          setIsNavVisible(false);
        } else if (scrollDelta < 0) {
          // Scrolling up - show nav
          setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }

      // Always show nav at top of page
      if (currentScrollY < 50) {
        setIsNavVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const loadNewQuote = async (userProfile: UserProfile, sourceOverride?: 'human' | 'ai') => {
    // If AI is requested, generate a fresh personalized quote
    if (sourceOverride === 'ai') {
      try {
        const aiQuote = await getAIQuote(userProfile);
        setCurrentQuote(aiQuote);
        return;
      } catch (error) {
        console.error('Error generating AI quote:', error);
        // Fall through to regular quotes
      }
    }

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
    // Optimistic update
    setUser(updatedUser);
    // We don't save the WHOLE profile object to DB anymore. 
    // We save specific parts via specific API calls.
    // Ideally, specific handlers call specific API endpoints.
    // This function is kept for local state consistency.
  };

  const [showCelebration, setShowCelebration] = useState(false);

  // ... (previous code)

  const handleOnboardingComplete = async (profileData: Omit<UserProfile, 'id'>) => { // Modified to async
    // When onboarding is done, we now Save to Supabase
    if (session?.user) {
      // Construct full profile with ID
      const profile: UserProfile = { ...profileData, id: session.user.id };

      // 1. Update Profile
      await supabase.from('profiles').upsert({
        id: session.user.id,
        full_name: profile.name,
        tier: profile.tier,
        voice_preference: profile.voicePreference
        // Add preferences if we added columns for them
      });

      // Reload full profile to be safe
      const fullProfile = await api.getFullUserProfile(session.user.id);
      if (fullProfile) {
        setUser(fullProfile);
        loadNewQuote(fullProfile);
        setTimeout(() => setShowCelebration(true), 500);
      }
    }
  };

  const handleBriefingComplete = async (focusText: string) => {
    if (!user || !session?.user) return;

    // API Call
    const { data: newGoal } = await api.createGoal(user.id, focusText);

    if (newGoal) {
      // Optimistic Update
      const newFocus: DailyFocus = {
        id: newGoal.id.toString(),
        text: newGoal.text,
        isCompleted: newGoal.is_completed,
        createdAt: newGoal.created_at
      };

      const updatedUser = {
        ...user,
        dailyFocuses: [newFocus, ...(user.dailyFocuses || [])]
      };
      setUser(updatedUser);

      // Mark briefing done locally for today (UI state)
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('palante_last_briefing', today);
      setShowBriefing(false);
    }
  };

  const handleTierSelect = async (tier: Tier) => {
    if (user) {
      const updatedUser = { ...user, tier: tier };
      setUser(updatedUser); // Optimistic
      loadNewQuote(updatedUser);
      await api.updateTier(user.id, tier);
    }
  };

  const handleActivity = async (type: ActivityType, providedUser?: UserProfile) => {
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

    // API Call
    await api.logActivity(currentUser.id, {
      date: today,
      type: type,
      count: 1, // Default increment
    });

    // Ideally we re-fetch stats, but for now we assume optimistic is enough or we rely on page refresh for strict count accuracy
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




  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser)); // Keep for now, will update to DB
    loadNewQuote(updatedUser);
  };

  const handleToggleFavorite = async () => {
    if (!user || !currentQuote) return;

    const favorites = user.favoriteQuotes || [];
    const isFavorited = favorites.some(fav => fav.quoteId === currentQuote.id);

    let updatedFavorites;
    if (isFavorited) {
      updatedFavorites = favorites.filter(fav => fav.quoteId !== currentQuote.id);
      try {
        await api.toggleFavorite(user.id, currentQuote.id, false);
        console.log('✓ Removed from favorites');
      } catch (error) {
        console.error('Failed to remove favorite:', error);
      }
    } else {
      updatedFavorites = [...favorites, { quoteId: currentQuote.id, savedAt: new Date().toISOString() }];
      try {
        await api.toggleFavorite(user.id, currentQuote.id, true);
        console.log('✓ Added to favorites');
        handleActivity('quote');
      } catch (error) {
        console.error('Failed to add favorite:', error);
      }
    }

    const updatedUser = { ...user, favoriteQuotes: updatedFavorites };
    setUser(updatedUser);
  };

  const handleRemoveFavorite = (quoteId: string) => {
    if (!user) return;
    const updatedFavorites = user.favoriteQuotes?.filter(fav => fav.quoteId !== quoteId) || [];
    const updatedUser = { ...user, favoriteQuotes: updatedFavorites };
    setUser(updatedUser);
    localStorage.setItem('motiv8_user', JSON.stringify(updatedUser)); // Keep for now, will update to DB
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
      localStorage.setItem('motiv8_user', JSON.stringify(updatedUser)); // Keep for now, will update to DB
    }
  };

  // LOADING STATE
  if (authLoading || loadingProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-sage"></div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!session) {
    return <AuthScreen isDarkMode={isDarkMode} />;
  }

  // LOGGED IN BUT NO PROFILE (New User)
  if (!user) {
    return <Onboarding onComplete={handleOnboardingComplete} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />;
  }

  // LOGGED IN AND HAS PROFILE -> MAIN APP
  const bgClass = isDarkMode ? 'bg-warm-gray-green text-white' : 'bg-ivory text-warm-gray-green';
  const headerBtnClass = isDarkMode
    ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
    : 'bg-white/60 border-sage/20 hover:bg-sage/10 text-sage';
  const navClass = isDarkMode
    ? 'bg-warm-gray-green/90 border-white/10 shadow-lg'
    : 'bg-white/80 border-sage/20 shadow-spa-lg';

  return (
    <div className={`min-h-screen font-body overflow-hidden transition-colors duration-500 relative ${bgClass}`}>

      {/* Global Ambient Background (The "Circles") */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top Right Blob - Explicitly SOLID, NO BLUR */}
        <div
          className={`absolute top-0 right-0 w-[80vmin] h-[80vmin] rounded-full translate-x-1/3 -translate-y-1/3 transition-colors duration-500 opacity-20 ${isDarkMode ? 'bg-white' : 'bg-sage'
            }`}
        />

        {/* Bottom Left Blob - Explicitly SOLID, NO BLUR */}
        <div
          className="absolute bottom-0 left-0 w-[65vmin] h-[65vmin] rounded-full -translate-x-1/3 translate-y-1/3 bg-pale-gold opacity-20"
        />
      </div>

      {/* Floating Header - Scroll Aware */}
      <header className={`fixed left-0 right-0 z-30 px-4 md:px-8 py-3 md:py-6 flex items-center justify-between transition-all duration-300 ${isNavVisible ? 'top-0 opacity-100' : '-top-24 opacity-0'}`}>
        <button
          onClick={() => setShowProfile(true)}
          className={`tap-zone p-3 md:p-4 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${headerBtnClass}`}
        >
          <UserIcon size={20} />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
            Personalized Motivation, Delivered Daily
          </p>
          <img
            src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
            alt="Palante"
            className="w-10 h-10 object-contain drop-shadow-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSoundMixer(!showSoundMixer)}
            className={`tap-zone p-3 md:p-4 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${showSoundMixer
              ? isDarkMode ? 'bg-pale-gold border-pale-gold text-warm-gray-green' : 'bg-sage border-sage text-white'
              : headerBtnClass
              }`}
          >
            <Music size={20} />
          </button>

          <button
            onClick={toggleTheme}
            className={`tap-zone p-3 md:p-4 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${headerBtnClass}`}
          >
            {isDarkMode ? <Sun size={20} className="text-pale-gold" /> : <Moon size={20} className="text-sage" />}
          </button>
        </div>
      </header>

      {/* Main Content - Full Screen Sections */}
      <main className="pt-20 pb-28">
        {activeTab === 'home' && (
          <div className="min-h-screen px-6 pb-8 animate-fade-in max-w-5xl mx-auto">
            {/* 1. HERO: Quote of the Day */}
            <div className="w-full mb-8 mt-4">
              {currentQuote && (
                <QuoteDisplay
                  quote={currentQuote}
                  onNewQuote={(source) => { loadNewQuote(user, source); handleActivity('quote'); }}
                  isDarkMode={isDarkMode}
                  voicePreference={user.voicePreference || 'nova'}
                  isFavorited={user.favoriteQuotes?.some(fav => fav.quoteId === currentQuote.id) || false}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>

            {/* 2. CONTROL: Tone Selector */}
            <div className="mb-10">
              <TierSelector
                currentTier={user.tier}
                onSelect={handleTierSelect}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* 3. HUB: Accountability Coach Card */}
            <div className="mb-10 clickable-card" onClick={() => setActiveTab('momentum')}>
              <CoachCard
                userName={user.name}
                focusCount={user.dailyFocuses?.length || 0}
                completedCount={user.dailyFocuses?.filter(f => f.isCompleted).length || 0}
                isDarkMode={isDarkMode}
                streak={user.streak || 0}
                lastActivityDate={user.activityHistory?.[0]?.date}
              />
            </div>

            {/* 4. ACTION: Today's Goals (Secondary) */}
            <div className={`p-6 rounded-2xl border mb-8 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                  Today's Focus
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
                          // Toggle Goal Logic (Optimistic + API)
                          const updatedFocuses = user.dailyFocuses!.map(f =>
                            f.id === focus.id ? { ...f, isCompleted: !f.isCompleted } : f
                onClick = {() => setActiveTab('reflect')}
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

            <Suspense fallback={
              <div className="flex justify-center items-center min-h-[60vh]">
                <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${isDarkMode ? 'border-white' : 'border-sage'}`}></div>
              </div>
            }>
              {activeTab === 'momentum' && (
                <Momentum
                  user={user}
                  onUpdateUser={async (updatedUser) => {
                    setUser(updatedUser);
                    // Save to API database
                    await api.updateUserProfile(updatedUser.id, updatedUser);
                  }}
                  isDarkMode={isDarkMode}
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
                    onSave={async (entry: JournalEntry) => {
                      console.log('=== SAVING DAILY REFLECTION ===');
                      if (!user) return;

                      // 1. API Call
                      await api.createJournalEntry(user.id, entry);

                      // 2. Prepare Local Update
                      const existingEntries = user.journalEntries || [];
                      const filteredEntries = existingEntries.filter(e => e.date !== entry.date);
                      const newJournalEntries = [...filteredEntries, entry];

                      const updatedUser: UserProfile = {
                        ...user,
                        journalEntries: newJournalEntries,
                        points: (user.points || 0) + 10
                      };

                      // 3. Chain to Activity Log (Log activity allows passing the "current" user state to build upon)
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
                    onRemoveFavorite={handleRemoveFavorite}
                    onRemoveJournalEntry={handleRemoveJournalEntry}
                    isDarkMode={isDarkMode}
                    voicePreference={user.voicePreference || 'nova'}
                  />
                </div>
              )}
            </Suspense>
          </main>

      {/* Premium Bottom Navigation - Scroll Aware */}
        <nav className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${isNavVisible ? 'bottom-4 md:bottom-8 opacity-100' : '-bottom-24 opacity-0'}`}>
          <div className={`flex items-center gap-1 md:gap-3 px-3 md:px-6 py-3 md:py-4 rounded-full backdrop-blur-xl border transition-all duration-500 ${navClass}`}>
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
                  className={`tap-zone flex flex-col items-center gap-0.5 md:gap-1 px-2 md:px-4 py-2 rounded-full transition-all duration-300 ${activeTab === tab.id
                    ? isDarkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-sage/20 text-sage'
                    : isDarkMode
                      ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      : 'text-sage/60 hover:text-sage hover:bg-sage/10'
                    }`}
                >
                  <Icon size={20} className="md:w-5 md:h-5 w-5 h-5" />
                  <span className="text-[10px] md:text-xs font-medium hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav >

        {/* Profile Modal */}
        {
          showProfile && (
            <Profile
              user={user}
              onUpdate={handleProfileUpdate}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              onClose={() => setShowProfile(false)}
            />
          )
        }

        {/* Morning Briefing Overlay */}
        {
          showBriefing && user && currentQuote && (
            <MorningBriefing
              quote={currentQuote}
              username={user.name}
              onComplete={handleBriefingComplete}
              onDismiss={() => setShowBriefing(false)}
            />
          )
        }

        {/* Soundscape Mixer - Global */}
        <SoundMixer
          isVisible={showSoundMixer}
          onClose={() => setShowSoundMixer(false)}
          isDarkMode={isDarkMode}
        />



        <audio ref={audioRef} loop className="hidden" />
        {/* Onboarding Celebration */}
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          title="Welcome, Friend!"
          message="Your daily journey begins now. Let's make today count!"
          isDarkMode={isDarkMode}
        />
    </div >
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
