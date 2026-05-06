import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { STORAGE_KEYS, SESSION_KEYS } from './constants/storageKeys';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';

import { PageTransition } from './components/PageTransition';
import { UserProvider, useUser } from './contexts/UserContext';


// Initial essential UI
import { CelebrationModal } from './components/CelebrationModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { getRelevantQuotes, getAIQuote, pickAndMarkQuote, markQuoteSeen } from './utils/quoteMatcher';
import { generateUserNarrative } from './utils/aiService';
import { analytics, identifyUser } from './utils/analytics';
import { QUOTES } from './data/quotes';
import { AFFIRMATIONS } from './data/affirmations';
import type { UserProfile, Quote, DailyFocus, JournalEntry, ActivityType, RoutineStack, ContentType, QuoteSource, SoundMix } from './types';
import { HistoryModal } from './components/HistoryModal';
import { SkeletonQuoteCard } from './components/SkeletonQuoteCard';

import { haptics } from './utils/haptics';

import SoundMixer from './components/SoundMixer';
import { EveningPractice } from './components/EveningPractice';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { PaywallScreen } from './components/PaywallScreen';
import { useNotifications } from './hooks/useNotifications';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

import { useAppProcess } from './hooks/useAppProcess';
import { triggerConfetti } from './utils/CelebrationEffects';
import { WidgetDataSync } from './utils/widgetDataSync';

import { ReorderModal } from './components/ReorderModal';

import { DebugErrorBoundary } from './components/DebugErrorBoundary';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Settings2 } from 'lucide-react';

// Lazy load heavy components for performance
const Reflections = lazy(() => import('./components/Reflections').then(module => ({ default: module.Reflections })));
const Library = lazy(() => import('./components/Library').then(module => ({ default: module.Library })));
const Momentum = lazy(() => import('./components/Momentum').then(module => ({ default: module.Momentum })));
const Breathing = lazy(() => import('./components/Breathing').then(module => ({ default: module.Breathing })));
const Meditation = lazy(() => import('./components/Meditation').then(module => ({ default: module.Meditation })));
const Fasting = lazy(() => import('./components/Fasting').then(module => ({ default: module.Fasting })));
const SafeStackRunner = lazy(() => import('./components/SafeStackRunner').then(module => ({ default: module.SafeStackRunner })));
const Profile = lazy(() => import('./components/Profile').then(module => ({ default: module.Profile })));
const WeeklyReportModal = lazy(() => import('./components/WeeklyReportModal').then(module => ({ default: module.WeeklyReportModal })));
const WelcomeOrientationModal = lazy(() => import('./components/WelcomeOrientationModal').then(module => ({ default: module.WelcomeOrientationModal })));

const ClearTheNoise = lazy(() => import('./components/ClearTheNoise').then(module => ({ default: module.ClearTheNoise })));
const StackWizardModal = lazy(() => import('./components/StackWizardModal').then(module => ({ default: module.StackWizardModal })));
const StackEditorModal = lazy(() => import('./components/StackEditorModal').then(module => ({ default: module.StackEditorModal })));
const MorningPractice = lazy(() => import('./components/MorningPractice').then(module => ({ default: module.MorningPractice })));
const VibeCheck = lazy(() => import('./components/VibeCheck').then(module => ({ default: module.VibeCheck })));
const DashboardQuoteCard = lazy(() => import('./components/DashboardQuoteCard').then(module => ({ default: module.DashboardQuoteCard })));
const KoiPond = lazy(() => import('./components/KoiPond').then(module => ({ default: module.KoiPond })));
const DidYouKnowModal = lazy(() => import('./components/DidYouKnowModal').then(module => ({ default: module.DidYouKnowModal })));
const CinematicIntro = lazy(() => import('./components/CinematicIntro').then(module => ({ default: module.CinematicIntro })));
const MorningMessageCard = lazy(() => import('./components/MorningMessageCard').then(module => ({ default: module.MorningMessageCard })));
const EveningMessageCard = lazy(() => import('./components/EveningMessageCard').then(module => ({ default: module.EveningMessageCard })));
const JapaneseWisdomView = lazy(() => import('./components/JapaneseWisdomView').then(m => ({ default: m.JapaneseWisdomView })));
import { GardenDemoFinal as GardenMandala } from './components/GardenDemoFinal';
const GardenLegendModal = lazy(() => import('./components/GardenLegendModal').then(m => ({ default: m.GardenLegendModal })));
const PostPracticeSetupModal = lazy(() => import('./components/PostPracticeSetupModal').then(m => ({ default: m.PostPracticeSetupModal })));
import { FocusTimer } from './components/FocusTimer';
import { HomeEssentialTools } from './components/HomeEssentialTools';
import type { EssentialToolId } from './components/HomeEssentialTools';
/// const FocusTimer = lazy(() => import('./components/FocusTimer').then(m => ({ default: m.FocusTimer })));

import { CoachView } from './components/CoachView';
import { WeeklyHighlightsModal, computeWeeklyHighlights } from './components/WeeklyHighlightsModal';
import { CheckInModal } from './components/CheckInModal';
import type { CheckInDestination } from './components/CheckInModal';




import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Logo } from './components/Logo';
import {
  Home, TrendingUp, User as UserIcon, Moon, Sun,
  BookMarked, Music, MessageCircle, Bell, ChevronDown, Check,
  Target, Sparkles, ChevronRight, ChevronLeft, Fish, Mic, Layers, Heart,
  CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExploreView } from './components/ExploreView';
import { PracticeView } from './components/PracticeView';


import type { CoachSettings, WeeklyReport, CoachIntervention, DailyPriming } from './types';
import { SCIENCE_FACTS, type ScienceFact } from './data/scienceFacts';

// Shared core components (non-lazy or strictly required for initial render)
import { FocusItem } from './components/FocusItem';
import { DailyMorningPracticeWidget } from './components/DailyMorningPracticeWidget';
import { CoachSettingsModal } from './components/CoachSettingsModal';

import { MilestoneCelebration } from './components/MilestoneCelebration';
import { CoachInterventionCard } from './components/CoachInterventionCard';
import { SlideUpModal } from './components/SlideUpModal';
import { api } from './lib/api';
import { logPractice, checkMilestone, migrateStreakToPractice } from './utils/practiceUtils';
import { QuickRoutines } from './components/QuickRoutines';
import { useSmartSuggestions } from './hooks/useSmartSuggestions';
import { useModalState } from './hooks/useModalState';
import { ProfileCompletionCard } from './components/ProfileCompletionCard';
import { RestDayModal } from './components/RestDayModal';
import { getTodayDate, getDaysDifference } from './utils/practiceUtils';
import { useTimeOfDay } from './hooks/useTimeOfDay';
import { MorningModeOverlay } from './components/MorningModeOverlay';
import { LetterWriteModal } from './components/LetterWriteModal';
import { LetterReadModal } from './components/LetterReadModal';
import type { FutureLetter } from './types';
import { useTheme } from './contexts/ThemeContext';


function AppContent() {

  const { loading: authLoading } = useAuth();
  const { user, loading: userLoading, updateProfile, logActivity, saveReflection, toggleFavorite } = useUser();
  const { isPro, isLoading: subLoading, isTrialing, trialDaysRemaining } = useSubscription();
  // const [user, setUser] = useState<UserProfile | null>(null); -> Removed

  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [allQuotes, setAllQuotes] = useState<Quote[]>(() => [...QUOTES, ...AFFIRMATIONS]);
  const [activeTab, setActiveTab] = useState<'home' | 'momentum' | 'toolkit' | 'fasting' | 'reflect' | 'breath' | 'meditate' | 'wisdom' | 'coach' | 'focus' | 'soundscapes' | 'routines'>('home');


  const { isDarkMode } = useTheme();
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS_EXPANDED);
      return saved === null ? true : JSON.parse(saved);
    } catch {
      return true;
    }
  });
  const [newFocusText, setNewFocusText] = useState('');
  const {
    showProfile, setShowProfile, showKoiPond, setShowKoiPond,
    showLibrary, setShowLibrary, showHistory, setShowHistory,
    showWelcome, setShowWelcome, showClearNoise, setShowClearNoise,
    showSoundMixer, setShowSoundMixer, mixerSource, setMixerSource,
    showMorningPractice, setShowMorningPractice,
    showStackWizard, setShowStackWizard,
    showRestDayModal, setShowRestDayModal,
    showMorningMode, setShowMorningMode,
    showReorderModal, setShowReorderModal,
    showLetterWrite, setShowLetterWrite,
    showLetterRead, setShowLetterRead,
    showHomeCoachSettings, setShowHomeCoachSettings,
    showWelcomeOrientation, setShowWelcomeOrientation,
    showCelebration, setShowCelebration,
    showWeeklyReport, setShowWeeklyReport,
    showStackRunner, setShowStackRunner,
  } = useModalState();
  const lastScrollY = useRef(0);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Smart Suggestions Logic
  useSmartSuggestions(user, isDarkMode);
  const [initialReflectionText, setInitialReflectionText] = useState('');
  const [showReturnToWisdom, setShowReturnToWisdom] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  const [showVibeCheck, setShowVibeCheck] = useState(() => !localStorage.getItem(STORAGE_KEYS.VIBE_CHECKED));
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<import('./types').RoutineStack | null>(null);

  // Weekly Highlights modal
  const [showWeeklyHighlights, setShowWeeklyHighlights] = useState(false);
  const [weeklyAccomplishments, setWeeklyAccomplishments] = useState<{ text: string; date: string }[]>([]);

  // Rest Day Modal State
  const [missedDate, setMissedDate] = useState<string>('');

  // Time-based UI modes
  const { shouldShowMorningMode, shouldShowEveningMode, hour, timeOfDay } = useTimeOfDay();

  // Transient Success States for Practices
  const [showMorningSuccess, setShowMorningSuccess] = useState(false);
  const [showEveningSuccess, setShowEveningSuccess] = useState(false);
  const [eveningSkipped, setEveningSkipped] = useState(false);
  const [showEveningPracticeInline, setShowEveningPracticeInline] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [showTodayStory, setShowTodayStory] = useState(false);
  const [showGardenLegend, setShowGardenLegend] = useState(false);
  const [showPostPracticeSetup, setShowPostPracticeSetup] = useState(false);

  // Synchronize browser overscroll color with Palante theme
  useEffect(() => {
    const color = isDarkMode ? '#415D43' : '#F2EBE0'; // Forest Sage or Ivory
    document.body.style.backgroundColor = color;
    document.documentElement.style.backgroundColor = color;
    
    // Also update meta theme-color for mobile status bars
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
  }, [isDarkMode]);

  // Refresh Daily Quote logic
  const refreshDailyQuote = useCallback((force = false) => {
    if (!user) return;
    // pickAndMarkQuote selects + records the quote in one atomic step,
    // preventing the phantom-marking bug in getRelevantQuotes.
    const excludeId = force && dailyQuote ? dailyQuote.id : undefined;
    const selected = pickAndMarkQuote(user, excludeId);
    if (selected) {
      setDailyQuote(selected);
      localStorage.setItem(STORAGE_KEYS.DAILY_QUOTE, JSON.stringify(selected));
      localStorage.setItem(STORAGE_KEYS.QUOTE_DATE, new Date().toISOString().split('T')[0]);
      if (force) haptics.light();
    }
  }, [user, dailyQuote]);

  // Load daily quote on mount — restore cached quote from today or pick a fresh one
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const cachedDate = localStorage.getItem(STORAGE_KEYS.QUOTE_DATE);
    const cachedQuote = localStorage.getItem(STORAGE_KEYS.DAILY_QUOTE);
    if (cachedDate === today && cachedQuote) {
      try {
        setDailyQuote(JSON.parse(cachedQuote));
        return;
      } catch { /* fall through to fresh pick */ }
    }
    refreshDailyQuote();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep screen awake globally per user request
  useEffect(() => {
    const enableKeepAwake = async () => {
      try {
        await KeepAwake.keepAwake();
      } catch (err) {
        console.warn('Failed to enable screen wake lock:', err);
      }
    };

    enableKeepAwake();

    // Cleanup on unmount
    return () => {
      KeepAwake.allowSleep().catch(console.error);
    };
  }, []);


  // Future Letters State
  const [letterContext, setLetterContext] = useState<'meditation' | 'goal_achievement' | 'streak_milestone' | 'manual'>('manual');
  const [letterContextDetails, setLetterContextDetails] = useState<string>('');
  const [currentLetter, setCurrentLetter] = useState<FutureLetter | null>(null);

  // Weekly Highlights — trigger on Monday mornings once per week
  useEffect(() => {
    if (!user) return;
    const trigger = computeWeeklyHighlights(
      user.dailyEveningPractice || [],
      STORAGE_KEYS.WEEKLY_HIGHLIGHTS_SHOWN
    );
    if (trigger.shouldShow) {
      setWeeklyAccomplishments(trigger.accomplishments);
      // Small delay so the app finishes loading before the modal appears
      setTimeout(() => {
        setShowWeeklyHighlights(true);
        trigger.markShown();
      }, 1800);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.id) identifyUser(user.id, { name: user.name, profession: user.profession });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  // Routing State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };


  // Welcome Orientation for new users

  // CINEMATIC INTRO STATE (New Onboarding Flow)
  // Defaults to true if 'palante_intro_seen' is missing
  const [showIntroSequence, setShowIntroSequence] = useState(() => !localStorage.getItem(STORAGE_KEYS.INTRO_SEEN));

  const handleIntroComplete = async (userData: {
    name: string;
    profession: string;
    focusGoal: string;
    interests: string;
    quoteIntensity: number;
    contentType: ContentType;
    sourcePreference: QuoteSource;
    ageRange?: string;
  }) => {
    analytics.onboardingCompleted({ profession: userData.profession, quoteIntensity: userData.quoteIntensity });

    // 1. Mark intro as seen FIRST
    localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');
    // 2. Mark vibe as checked (so the legacy modal doesn't pop up)
    localStorage.setItem(STORAGE_KEYS.VIBE_CHECKED, 'true');

    // 3. Hide Intro IMMEDIATELY to prevent re-render loops
    setShowIntroSequence(false);

    // 4. Ensure legacy modals don't show
    setShowDisclaimer(false);
    setShowVibeCheck(false);

    // 5. Provide immediate feedback
    haptics.success();

    // 6. Create/Update User Profile with all data (AFTER dismissing intro)
    if (user) {
      const updatedUser = {
        ...user,
        name: userData.name,
        profession: userData.profession,
        quoteIntensity: userData.quoteIntensity as 1 | 2 | 3,
        contentTypePreference: userData.contentType,
        sourcePreference: userData.sourcePreference,
        ageRange: userData.ageRange,
        // Add focus goal as first daily focus if provided
        dailyFocuses: userData.focusGoal ? [{
          id: `focus-${Date.now()}`,
          text: userData.focusGoal,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          order: 0
        }] : user.dailyFocuses,
        // Parse and add interests if provided
        interests: userData.interests ? userData.interests.split(',').map(i => i.trim()) : user.interests
      };

      await updateProfile(updatedUser);

      // 7. Load initial quote with new preferences (after profile is updated)
      await loadNewQuote(updatedUser);
    }
  };

  const handlePostPracticeSetupComplete = async (prefs: {
    interests: string[];
    contentType: ContentType;
    sourcePreference: QuoteSource;
  }) => {
    localStorage.setItem('postPracticeSetupSeen', 'true');
    setShowPostPracticeSetup(false);
    if (user) {
      const updatedUser = {
        ...user,
        interests: prefs.interests.length > 0 ? prefs.interests : (user.interests || []),
        contentTypePreference: prefs.contentType,
        sourcePreference: prefs.sourcePreference,
      };
      await updateProfile(updatedUser);
      await loadNewQuote(updatedUser);
    }
  };

  const handlePostPracticeSetupSkip = () => {
    localStorage.setItem('postPracticeSetupSeen', 'true');
    setShowPostPracticeSetup(false);
  };

  // Legal Disclaimer Modal - First Launch (Legacy fallback, suppressed by Intro Logic)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (!localStorage.getItem(STORAGE_KEYS.INTRO_SEEN)) return false; // Don't show if Intro is showing
    const acceptance = localStorage.getItem('disclaimerAccepted');
    if (!acceptance) return true;
    try {
      const parsed = JSON.parse(acceptance);
      return !parsed.accepted;
    } catch {
      return true;
    }
  });

  // Global Tip Handler
  const [globalTip, setGlobalTip] = useState<{ isOpen: boolean; fact: ScienceFact | null }>({
    isOpen: false,
    fact: null
  });

  // Milestone Celebration
  const [showMilestone, setShowMilestone] = useState<{
    isOpen: boolean;
    milestone: 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'century' | 'twohundred' | 'year' | null;
    streakDays?: number;
  }>({
    isOpen: false,
    milestone: null,
    streakDays: undefined
  });

  // Routine Stack Runner
  const [activeRoutine, setActiveRoutine] = useState<RoutineStack | null>(null);

  // Weekly Report
  const [currentWeeklyReport, setCurrentWeeklyReport] = useState<WeeklyReport | null>(null);

  // Routine Stack Handlers
  const handleLaunchRoutine = (routine: import('./types').RoutineStack) => {
    setActiveRoutine(routine);
    setShowStackRunner(true);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!user) return;
    const updatedRoutines = (user.routines || []).filter(r => r.id !== routineId);
    await updateProfile({ ...user, routines: updatedRoutines });
  };

  const handleUpdateRoutine = async (updatedRoutine: import('./types').RoutineStack) => {
    if (!user) return;
    const updatedRoutines = (user.routines || []).map(r =>
      r.id === updatedRoutine.id ? updatedRoutine : r
    );
    await updateProfile({ ...user, routines: updatedRoutines });
    setEditingRoutine(null);
  };



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleRoutineComplete = () => {
    setShowStackRunner(false);
    setActiveRoutine(null);
  };

  // Rest Day Handlers
  const handleMarkAsRestDay = () => {
    if (!user || !missedDate) return;

    // Add missed date to restDays array
    const updatedRestDays = [...(user.restDays || []), missedDate];

    const currentPracticeData = user.practiceData || migrateStreakToPractice(user);
    updateProfile({
      ...user,
      restDays: updatedRestDays,
      practiceData: {
        ...currentPracticeData,
        lastActivityDate: missedDate
      }
    });

    haptics.success();
    setShowRestDayModal(false);
  };

  const handleAcknowledgeMissedDay = () => {
    if (!user || !missedDate) return;
    const currentPracticeData = user.practiceData || migrateStreakToPractice(user);
    // User acknowledges they forgot - update last activity to the missed date so we don't nag again
    updateProfile({
      ...user,
      practiceData: {
        ...currentPracticeData,
        lastActivityDate: missedDate
      }
    });
    haptics.light();
    setShowRestDayModal(false);
  };

  // Future Letters Handlers
  const handleSaveLetter = (content: string, sealedUntil: string) => {
    if (!user) return;

    const newLetter: FutureLetter = {
      id: `letter_${Date.now()}`,
      content,
      writtenDate: new Date().toISOString(),
      context: letterContext,
      contextDetails: letterContextDetails,
      hasBeenDelivered: false,
      scheduledDeliveryDate: sealedUntil,
    };

    const updatedLetters = [...(user.futureLetters || []), newLetter];

    updateProfile({
      ...user,
      futureLetters: updatedLetters
    });

    haptics.success();
    setShowLetterWrite(false);
  };

  const handleDeliverLetter = () => {
    if (!user || !currentLetter) return;

    // Mark letter as delivered
    const updatedLetters = (user.futureLetters || []).map(letter =>
      letter.id === currentLetter.id
        ? { ...letter, hasBeenDelivered: true, deliveredDate: new Date().toISOString() }
        : letter
    );

    updateProfile({
      ...user,
      futureLetters: updatedLetters
    });

    setShowLetterRead(false);
    setCurrentLetter(null);
  };

  // Check for letter delivery — scheduled (90-day) or on low-energy days
  useEffect(() => {
    if (!user || !user.futureLetters || user.futureLetters.length === 0) return;
    if (showLetterRead) return; // Don't show multiple letters at once

    const letterShownToday = sessionStorage.getItem(SESSION_KEYS.LETTER_SHOWN_TODAY);
    if (letterShownToday) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Priority 1: Scheduled delivery (90-day letters) — show regardless of energy
    const scheduledDue = user.futureLetters
      .filter(l => !l.hasBeenDelivered && l.scheduledDeliveryDate && new Date(l.scheduledDeliveryDate) <= today)
      .sort((a, b) => new Date(a.scheduledDeliveryDate!).getTime() - new Date(b.scheduledDeliveryDate!).getTime());

    if (scheduledDue.length > 0) {
      setCurrentLetter(scheduledDue[0]);
      setShowLetterRead(true);
      sessionStorage.setItem(SESSION_KEYS.LETTER_SHOWN_TODAY, 'true');
      return;
    }

    // Priority 2: Low-energy delivery for non-scheduled letters
    const hasLowEnergy = user.currentEnergy && user.currentEnergy <= 2;
    if (hasLowEnergy) {
      const undelivered = user.futureLetters.filter(l => !l.hasBeenDelivered && !l.scheduledDeliveryDate);
      if (undelivered.length > 0) {
        const oldestLetter = undelivered.sort((a, b) =>
          new Date(a.writtenDate).getTime() - new Date(b.writtenDate).getTime()
        )[0];
        setCurrentLetter(oldestLetter);
        setShowLetterRead(true);
        sessionStorage.setItem(SESSION_KEYS.LETTER_SHOWN_TODAY, 'true');
      }
    }
  }, [user, showLetterRead, setShowLetterRead]);

  // AI Coach Interventions
  const [activeInterventions, setActiveInterventions] = useState<CoachIntervention[]>([]);


  const handleShowTip = (category: string) => {
    // Check user settings - safely nested
    if (user?.coachSettings?.tipsEnabled === false) return;

    const relevantFacts = SCIENCE_FACTS.filter(f => f.category === category || f.category === 'Coach');
    const fact = relevantFacts.length > 0
      ? relevantFacts[Math.floor(Math.random() * relevantFacts.length)]
      : SCIENCE_FACTS[Math.floor(Math.random() * SCIENCE_FACTS.length)]; // Fallback

    setGlobalTip({ isOpen: true, fact });
  };

  const handleCloseTip = () => {
    setGlobalTip(prev => ({ ...prev, isOpen: false }));
  };

  const lastQuoteLoadTimeRef = useRef<number>(0);

  const loadNewQuote = useCallback(async (userProfile: UserProfile, sourceOverride?: QuoteSource) => {
    // Guard: Don't load if user is null or undefined
    if (!userProfile) {
      console.warn('loadNewQuote called with null user, skipping');
      return;
    }

    // Safety Throttle: Prevent rapid reloading (loop protection)
    const now = Date.now();
    if (now - lastQuoteLoadTimeRef.current < 2000) {
      console.warn('loadNewQuote throttled - preventing loop');
      setIsQuoteLoading(false);
      return;
    }
    lastQuoteLoadTimeRef.current = now;

    setIsQuoteLoading(true);
    // Determine source to use: override -> state -> profile -> default

    // Determine source to use: override -> profile -> default
    const effectiveSource = sourceOverride || userProfile.sourcePreference || 'human';


    // If AI is requested, generate a fresh personalized quote
    if (effectiveSource === 'ai') {
      try {
        const aiQuote = await getAIQuote(userProfile);
        setCurrentQuote(aiQuote);
        setAllQuotes(prev => {
          if (prev.some(q => q.id === aiQuote.id)) return prev;
          return [aiQuote, ...prev];
        });
        setIsQuoteLoading(false);
        return;
      } catch (error) {
        console.error('Error generating AI quote:', error);
        // Fall through to regular quotes
      }
    }

    // For 'human' or 'both', get human quotes
    const profileToUse = effectiveSource === 'human'
      ? { ...userProfile, sourcePreference: 'human' as const }
      : userProfile;
    // pickAndMarkQuote scores, selects, AND marks the quote seen in one step —
    // this is the single source of truth that prevents stuck/repeating quotes.
    const selectedQuote = pickAndMarkQuote(profileToUse) ?? {
      id: 'emergency_fallback',
      text: "Keep moving forward.",
      author: "Palante Coach",
      category: "Motivation",
      intensity: 2,
      isAI: false
    };

    setCurrentQuote(selectedQuote);
    analytics.quoteViewed({ quoteId: String(selectedQuote.id), isAI: !!selectedQuote.isAI, author: selectedQuote.author });
    localStorage.setItem(STORAGE_KEYS.LAST_QUOTE, JSON.stringify(selectedQuote));
    localStorage.setItem('palante_last_quote_ts', Date.now().toString());

    setIsQuoteLoading(false);
  }, []); // No dependencies - loadNewQuote only uses its parameters

  // Notifications Integration
  const notifications = useNotifications();
  const { updateNudgeConfig } = notifications;

  // Background Processes & Logic Hook
  useAppProcess({
    user,
    updateProfile,
    toggleFavorite,
    loadNewQuote,
    setCurrentWeeklyReport,
    setShowWeeklyReport,
    setActiveInterventions,
    notifications
  });


  // Midday check-in trigger — once per day, 9am–9pm, 3s delay (TEST MODE — change to 90_000 for production)
  useEffect(() => {
    if (!user || userLoading || showIntroSequence || showVibeCheck) return;
    const hour = new Date().getHours();
    if (hour < 9 || hour >= 21) return;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(STORAGE_KEYS.CHECKIN_LAST_SHOWN) === today) return;
    const timer = setTimeout(() => {
      setShowCheckIn(true);
      localStorage.setItem(STORAGE_KEYS.CHECKIN_LAST_SHOWN, today);
    }, 3_000);
    return () => clearTimeout(timer);
  }, [user, userLoading, showIntroSequence, showVibeCheck]);

  // AUTOMATIC REFRESH throughout the day
  // Triggers when hour changes significantly (e.g. morning -> afternoon -> evening)
  useEffect(() => {
    if (user && !userLoading) {
      // Load a new quote on significant time changes if app is open
      const lastHour = parseInt(sessionStorage.getItem(SESSION_KEYS.LAST_HOUR) || '-1');
      const currentHour = new Date().getHours();

      // Define boundaries: 5am, 12pm, 6pm, 9pm
      const isTimeBoundary =
        (lastHour < 5 && currentHour >= 5) ||
        (lastHour < 12 && currentHour >= 12) ||
        (lastHour < 18 && currentHour >= 18) ||
        (lastHour < 21 && currentHour >= 21);

      if (isTimeBoundary) {
        loadNewQuote(user);
        sessionStorage.setItem(SESSION_KEYS.LAST_HOUR, currentHour.toString());
      } else if (lastHour === -1) {
        sessionStorage.setItem(SESSION_KEYS.LAST_HOUR, currentHour.toString());
      }
    }
  }, [hour, user, userLoading, loadNewQuote]);


  // PRO-ACTIVE COACH SESSION INITIALIZATION Logic Moved to Line 1082 Area to ensure initialization order



  // Initialize notifications
  useEffect(() => {
    // Only request if user has enabled them in settings (or logic to ask once)
    // requestPermissions();
  }, []);

  // Initial Quote Load
  useEffect(() => {
    // Don't load quotes during intro sequence
    if (showIntroSequence) return;

    // Don't load if user context is still loading
    if (userLoading) return;

    // Only load if we have a user and no current quote
    if (user && !currentQuote) {
      loadNewQuote(user);
    }
  }, [user, currentQuote, loadNewQuote, showIntroSequence, userLoading]);

  // Rest Day Detection - Check if user missed yesterday
  useEffect(() => {
    if (!user || !user.practiceData?.lastActivityDate) return;

    // Only check once per session for high-level gate
    const checkedToday = sessionStorage.getItem(SESSION_KEYS.REST_DAY_CHECKED);
    if (checkedToday) return;

    const today = getTodayDate();
    const lastActivity = user.practiceData.lastActivityDate;
    const daysSince = getDaysDifference(lastActivity, today);

    // If exactly 1 day missed (yesterday, meaning difference is 2 days), show rest day prompt
    if (daysSince === 2) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // PERSISTENT MITIGATION: Don't prompt for the same date twice
      const lastPromptedDate = localStorage.getItem('palante_last_rest_prompt_date');
      if (lastPromptedDate !== yesterdayStr) {
        setMissedDate(yesterdayStr);
        setShowRestDayModal(true);
        localStorage.setItem('palante_last_rest_prompt_date', yesterdayStr);
      }
    }

    // Mark as checked for this session
    sessionStorage.setItem(SESSION_KEYS.REST_DAY_CHECKED, 'true');
  }, [user, setShowRestDayModal]);

  // Morning Mode Detection - Show on first open before noon
  // Morning Mode Detection - Auto-trigger disabled per user request
  useEffect(() => {
    if (!user || !currentQuote) return;

    // if (shouldShowMorningMode) {
    //   setShowMorningMode(true);
    // }
  }, [user, currentQuote, shouldShowMorningMode]);


  // 5. Scroll-aware navigation: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Only trigger if scrolled more than 40px to avoid jitter
      if (Math.abs(scrollDelta) > 40) {
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);








  const _handleWelcomeComplete = (userData: { name: string; profession: string; focusGoal: string; interests: string; gender?: string; ageRange?: string; tier: number; contentType: 'affirmations' | 'quotes' | 'mix'; sourcePreference: 'human' | 'ai' | 'mix' }) => {
    // Mark onboarding as completed
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    // Prevent immediate Vibe Check after onboarding
    localStorage.setItem(STORAGE_KEYS.VIBE_CHECKED, 'true');

    // Update user profile with welcome data
    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        name: userData.name,
        quoteIntensity: userData.tier as 1 | 2 | 3,
        contentTypePreference: userData.contentType,
        sourcePreference: userData.sourcePreference
      };

      updateProfile(updatedUser);

      // Load a fresh quote with new preferences
      loadNewQuote(updatedUser);
    }

    setShowWelcome(false);
    setShowVibeCheck(false); // Ensure Vibe Check doesn't pop up immediately
    setShowWelcomeOrientation(true); // Show the new orientation modal
  };

  const handleActivity = async (type: ActivityType) => {
    if (!user) return;
    const currentPracticeData = user.practiceData || migrateStreakToPractice(user);
    const oldStreak = user.streak || 0;

    await logActivity(type);
    analytics.practiceCompleted({ type, streak: user.streak });
    
    // We need the updated user state, but since logActivity just fired, 
    // we can calculate what happened.
    const updatedCount = currentPracticeData.totalPractices + 1;
    const { milestone, isNew } = checkMilestone(updatedCount, currentPracticeData.milestones);
    
    if (milestone && isNew) {
      const milestoneMap: Record<string, 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'century' | 'twohundred' | 'year'> = {
        'practices_1': 'first', 'practices_3': 'three', 'practices_7': 'week',
        'practices_14': 'fortnight', 'practices_30': 'month', 'practices_50': 'fifty',
        'practices_100': 'century', 'practices_200': 'twohundred', 'practices_365': 'year'
      };
      setShowMilestone({ isOpen: true, milestone: milestoneMap[milestone] || 'week' });
    }

    // After the very first practice, show the personalization setup (interests + content style)
    if (updatedCount === 1 && !localStorage.getItem('postPracticeSetupSeen')) {
      setTimeout(() => setShowPostPracticeSetup(true), 1200);
    }

    // Also check for STREAK milestones (7, 30, 100 days)
    // Note: UserContext updates streak during logActivity
    // If it was their first activity today, streak incremented.
    const today = new Date().toISOString().split('T')[0];
    const hadActivityTodayBefore = (user.activityHistory || []).some(log => log.date === today);
    if (!hadActivityTodayBefore) {
      const newStreak = oldStreak + 1;
      if (newStreak === 7 || newStreak === 30 || newStreak === 100 || newStreak === 365) {
        setShowMilestone({ isOpen: true, milestone: null, streakDays: newStreak });
      }
    }
  };

  const handleSaveMeditationReflection = async (reflectionData: { intention: string; duration: number; reflection: string; mantra: string }) => {
    saveReflection(reflectionData);
  };






  const handleProfileUpdate = (updateInput: UserProfile | ((prev: UserProfile | null) => UserProfile)) => {
    updateProfile(updateInput);
  };

  const handleToggleFavorite = async () => {
    if (!user || !currentQuote) {
      console.error('Cannot toggle favorite: missing user or quote');
      return;
    }

    const quoteIdStr = String(currentQuote.id);

    const isFavorited = user.favoriteQuotes?.some(fav => String(fav.quoteId) === quoteIdStr) || false;

    // Haptic feedback
    if (!isFavorited) {
      haptics.medium();
      analytics.quoteFavorited({ quoteId: quoteIdStr, author: currentQuote.author });
    } else {
      haptics.light();
    }

    toggleFavorite(quoteIdStr, !isFavorited);
  };

  const handleRemoveFavorite = async (quoteId: string) => {
    toggleFavorite(quoteId, false);
  };

  const handleQuickAction = (id: string) => {
    console.log('Quick Action Triggered:', id);
    haptics.selection();
    switch (id) {
      case 'fast':
      case 'fasting':
        setActiveTab('fasting');
        setToastMessage('Fasting Tracker');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'breathe':
      case 'breath':
        setActiveTab('breath');
        break;
      case 'meditate':
      case 'meditation':
        setActiveTab('meditate');
        setToastMessage('Mindfulness Space');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'coach':
        setActiveTab('coach');
        setToastMessage('Palante Coach');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'wisdom':
        setActiveTab('wisdom');
        setToastMessage('Library of Wisdom');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'focus':
      case 'focus-timer':
      case 'timer':
        setActiveTab('focus');
        setToastMessage('Focus Timer');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'reflect':
      case 'journal':
        setActiveTab('reflect');
        setToastMessage('Daily Journal');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'toolkit':
      case 'explore':
        setActiveTab('toolkit');
        setToastMessage('Explore Toolkit');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'momentum':
        setActiveTab('momentum');
        setToastMessage('Daily Momentum');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'soundscapes':
        setMixerSource('dashboard');
        setShowSoundMixer(true);
        break;
      case 'routines':
        setShowStackWizard(true);
        break;
      default:
        console.warn('Unknown quick action ID:', id);
    }
  };

  // Handle practice updates when a practice is completed (NO STREAK PRESSURE)
  const _handlePracticeUpdate = (practiceType: string) => {
    if (!user) return;

    // Migrate old streak data to practice data if needed
    const currentPracticeData = user.practiceData || migrateStreakToPractice(user);

    // Log the practice (no consecutive day requirement)
    const updatedPracticeData = logPractice(currentPracticeData, practiceType);

    // Check for new milestone
    const { milestone, isNew } = checkMilestone(updatedPracticeData.totalPractices, currentPracticeData.milestones);

    // Update user with new practice data
    const updatedUser = { ...user, practiceData: updatedPracticeData };
    updateProfile(updatedUser);

    // Trigger milestone celebration if new milestone reached
    if (milestone && isNew) {
      // Map practice milestones to old milestone names for celebration modal
      const milestoneMap: Record<string, 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'century' | 'twohundred' | 'year'> = {
        'practices_1': 'first',
        'practices_3': 'three',
        'practices_7': 'week',
        'practices_14': 'fortnight',
        'practices_30': 'month',
        'practices_50': 'fifty',
        'practices_100': 'century',
        'practices_200': 'twohundred',
        'practices_365': 'year'
      };

      setShowMilestone({
        isOpen: true,
        milestone: milestoneMap[milestone] || 'week'
      });
    }
  };


  const handleSaveCoachSettings = (settings: CoachSettings) => {
    if (!user) return;
    const updatedUser = { ...user, coachSettings: settings };
    updateProfile(updatedUser);

    // Also sync with notification background process
    updateNudgeConfig(settings.nudgeEnabled, settings.nudgeFrequency, user.quoteIntensity, user.contentTypePreference);
  };



  // Speech Recognition Hook
  const {
    isListening: isWebSpeechListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Combine listening states if you have other logic, or just use the hook's
  const isListeningFocus = isWebSpeechListening; // Remap for existing UI compatibility

  // Manage text updates from dictation
  const [baseFocusText, setBaseFocusText] = useState('');

  // Update focus text when transcript changes
  useEffect(() => {
    if (transcript) {
      setNewFocusText((baseFocusText ? baseFocusText + ' ' : '') + transcript);
    }
  }, [transcript, baseFocusText]);

  const toggleFocusDictation = () => {
    if (isListeningFocus) {
      stopListening();
    } else {
      setBaseFocusText(newFocusText);
      resetTranscript();
      startListening();
    }
  };

  const handleQuickAddFocus = async () => {
    if (!user || !newFocusText.trim()) return;
    if ((user.dailyFocuses || []).length >= 5) {
      setToastMessage("5 goals set — focus on what matters most");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }
    haptics.medium();

    const newFocus: DailyFocus = {
      id: Date.now().toString(), // Simple unique ID for mock
      text: newFocusText.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const updatedUser = {
      ...user,
      dailyFocuses: [newFocus, ...(user.dailyFocuses || [])]
    };
    updateProfile(updatedUser);
    setNewFocusText(''); // Clear input

    try {
      await api.createGoal(user.id, newFocus.text);
    } catch (error) {
      console.error('Failed to add goal to API:', error);
      // Optionally revert local state or show error
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user || !user.dailyFocuses) return;
    haptics.light();

    const updatedFocuses = user.dailyFocuses.filter(f => f.id !== id);
    const updatedUser = { ...user, dailyFocuses: updatedFocuses };
    updateProfile(updatedUser);

    try {
      await api.deleteGoal(user.id, id);
    } catch (error) {
      console.error('Failed to delete goal from API:', error);
    }
  };

  const handleToggleGoal = async (focusId: string) => {
    if (!user || !user.dailyFocuses) return;

    // Trigger haptics & confetti
    const goal = user.dailyFocuses.find(f => f.id === focusId);
    if (goal) {
      if (!goal.isCompleted) {
        triggerConfetti(); // Confetti + Haptics
      } else {
        haptics.light(); // Un-check
      }
    }

    // Toggle Goal
    const updatedFocuses = user.dailyFocuses.map(f =>
      f.id === focusId ? { ...f, isCompleted: !f.isCompleted } : f
    );

    let updatedUser = { ...user, dailyFocuses: updatedFocuses };

    // Update practice count if goal was just completed (not uncompleted)
    if (goal && !goal.isCompleted) {
      // Handle practice update manually to ensure atomic update with goal completion
      const currentPracticeData = updatedUser.practiceData || migrateStreakToPractice(updatedUser);
      const updatedPracticeData = logPractice(currentPracticeData, 'goal');
      updatedUser = { ...updatedUser, practiceData: updatedPracticeData };

      const { milestone, isNew } = checkMilestone(updatedPracticeData.totalPractices, currentPracticeData.milestones);
      if (milestone && isNew) {
        const milestoneMap: Record<string, 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'century' | 'twohundred' | 'year'> = {
          'practices_1': 'first',
          'practices_3': 'three',
          'practices_7': 'week',
          'practices_14': 'fortnight',
          'practices_30': 'month',
          'practices_50': 'fifty',
          'practices_100': 'century',
          'practices_200': 'twohundred',
          'practices_365': 'year'
        };
        setShowMilestone({ isOpen: true, milestone: milestoneMap[milestone] || 'week' });
      }
    }

    updateProfile(updatedUser);
  };

  const handlePrimingComplete = (data: DailyPriming) => {
    if (!user) return;

    const today = data.date;
    const existingEntryIndex = (user.dailyPriming || []).findIndex(p => p.date === today);

    const updatedPriming = [...(user.dailyPriming || [])];

    if (existingEntryIndex >= 0) {
      // Update existing entry (preserving intention if it exists)
      updatedPriming[existingEntryIndex] = {
        ...updatedPriming[existingEntryIndex],
        ...data,
        // Ensure we don't accidentally overwrite intention if the new data has it empty but old had it
        dailyIntention: data.dailyIntention || updatedPriming[existingEntryIndex].dailyIntention
      };
    } else {
      // Add new entry
      updatedPriming.push(data);
    }

    const updatedUser: UserProfile = {
      ...user,
      dailyPriming: updatedPriming,
      points: (user.points || 0) + 5,
      // Update practice count inline to avoid race condition
      practiceData: logPractice(user.practiceData || migrateStreakToPractice(user), 'morning_priming')
    };
    updateProfile(updatedUser);
    analytics.morningRitualCompleted({ hasIntention: !!data.dailyIntention, mood: data.mood });
  };

  // Removed handleSmartRollover - goals now persist until manually deleted

  // Removed handleClearStaleGoals - goals now persist until manually deleted

  // Use LOCAL date to ensure consistency with user's perspective
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todaysPriming = user?.dailyPriming?.find(p => p.date === todayDate);

  // PRO-ACTIVE COACH SESSION INITIALIZATION
  const sessionInitialized = useRef(false);
  useEffect(() => {
    if (user && !userLoading && !sessionInitialized.current && !showIntroSequence) {
      sessionInitialized.current = true;

      // Check for meaningful check-in opportunities
      const coachInterventions: CoachIntervention[] = [];
      const today = new Date().toISOString().split('T')[0];
      const goalsCompletedToday = (user.dailyFocuses || []).filter(f => f.isCompleted && f.createdAt?.startsWith(today));
      const goalsPendingToday = (user.dailyFocuses || []).filter(f => !f.isCompleted);
      const dailyIntention = todaysPriming?.dailyIntention;

      if (goalsCompletedToday.length > 0) {
        coachInterventions.push({
          id: `compliment-${Date.now()}`,
          type: 'encouragement',
          priority: 'medium',
          message: `Good job finishing "${goalsCompletedToday[goalsCompletedToday.length - 1].text}"! You're making real progress today.`,
          dismissed: false,
          accepted: false
        });
      } else if (goalsPendingToday.length > 0) {
        coachInterventions.push({
          id: `nudge-${Date.now()}`,
          type: 'suggestion',
          priority: 'medium',
          message: `How's it going with "${goalsPendingToday[0].text}"? I'm here if you need a quick reset or strategy boost.`,
          action: { type: 'suggest_goal', label: 'View Goal' },
          dismissed: false,
          accepted: false
        });
      }

      if (dailyIntention && goalsCompletedToday.length === 0) {
        coachInterventions.push({
          id: `intention-${Date.now()}`,
          type: 'check_in',
          priority: 'high',
          message: `Checking in: Are you still feeling aligned with your intention to "${dailyIntention}"?`,
          dismissed: false,
          accepted: false
        });
      }

      if (coachInterventions.length > 0) {
        // Add to user's active interventions
        const existing = user.coachInterventions || [];
        const updated = [...coachInterventions, ...existing].slice(0, 5); // Keep recent 5
        updateProfile({ ...user, coachInterventions: updated });
      }
    }
  }, [user, userLoading, showIntroSequence, todaysPriming?.dailyIntention, updateProfile]);

  const handleRemoveJournalEntry = (entryId: string) => {
    if (!user) return;
    const updatedUser = { ...user };
    if (updatedUser.journalEntries) {
      updatedUser.journalEntries = updatedUser.journalEntries.filter(e => e.id !== entryId);
      // Remove from individual localStorage if exists
      const entryToRemove = user.journalEntries?.find(e => e.id === entryId);
      if (entryToRemove) {
        localStorage.removeItem(`${STORAGE_KEYS.JOURNAL_ENTRY}_${entryToRemove.date}`);
      }
      updateProfile(updatedUser);
    }
  };

  // Force Widget Bootstrap on Mount + reload quote on every foreground
  useEffect(() => {
    const bootstrapWidget = async () => {
      if (Capacitor.getPlatform() === 'ios') {
        try {
          const dummyGoals = [{ id: 'init', text: 'Open App to Sync Goals', isCompleted: false, order: 0 }];
          await WidgetDataSync.updateGoals(dummyGoals, 0);
        } catch (e) {
          console.error('[App] Failed to bootstrap widget:', e);
        }
      }
    };
    bootstrapWidget();

    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      // Refresh widget quotes
      if (user) WidgetDataSync.refreshQuotes(user);
      // Force new quote if last load was more than 6 hours ago
      const lastLoad = parseInt(localStorage.getItem('palante_last_quote_ts') || '0', 10);
      const SIX_HOURS = 6 * 60 * 60 * 1000;
      if (user && Date.now() - lastLoad > SIX_HOURS) {
        localStorage.setItem('palante_last_quote_ts', Date.now().toString());
        loadNewQuote(user);
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, [user, loadNewQuote]);



  // LOADING STATE
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-sage-mid' : 'bg-ivory'} `}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-sage"></div>
      </div>
    );
  }

  // NOT LOGGED IN - DISABLED FOR TESTING
  // if (!session) {
  //   return <AuthScreen isDarkMode={isDarkMode} />;
  // }

  // LOGGED IN BUT NO PROFILE (New User) - DISABLED FOR TESTING
  // if (!user) {
  //   return <Onboarding onComplete={handleOnboardingComplete} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />;
  // }

  // Safety check - should never happen in testing mode
  if (userLoading || subLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-sage-mid' : 'bg-ivory'} `}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-sage"></div>
      </div>
    );
  }

  // PAYWALL — show when user has no active subscription
  if (!isPro) {
    return <PaywallScreen />;
  }

  // LOGGED IN AND HAS PROFILE -> MAIN APP
  const bgClass = isDarkMode ? 'bg-elevated-dark text-white' : 'bg-ivory text-sage-dark';
  const headerBtnClass = isDarkMode
    ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white backdrop-blur-md'
    : 'bg-white/30 border-sage/10 hover:bg-sage/5 text-sage backdrop-blur-md';
  const navClass = isDarkMode
    ? 'bg-[#2D6A4F]/20 border-[#52B788]/30 shadow-[0_0_30px_rgba(45,106,79,0.2)] backdrop-blur-2xl'
    : 'bg-white/40 border-sage/5 shadow-spa-lg backdrop-blur-2xl';

  const appJsx = (
    <div
      className={`min-h-screen font-body overflow-hidden transition-colors duration-500 relative ${bgClass} `}
    >

      {/* Koi Fish Animation - REMOVED */}

      {/* Global Koi Trigger (Appears after 60s) */}

      {/* Trial banner — shown days 5, 6, 7 */}
      {isTrialing && trialDaysRemaining <= 3 && (
        <div className="fixed top-0 left-0 right-0 z-[60] py-2 px-4 text-center" style={{ background: '#C96A3A' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#FAF7F3', fontSize: '13px' }}>
            {trialDaysRemaining === 1
              ? 'Your free trial ends tomorrow — subscribe to keep your streak.'
              : `${trialDaysRemaining} days left in your free trial.`}
          </span>
        </div>
      )}

      {/* Evening Wind-Down Overlay (Deep blue dimming) */}
      {shouldShowEveningMode && (
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/10 to-[#0f172a]/30 pointer-events-none z-[45] transition-opacity duration-1000 animate-fade-in backdrop-brightness-90" />
      )}


      {/* ── Background depth system — matches CinematicIntro visual language ── */}
      {isDarkMode ? (
        <>
          {/* Central luminosity bloom */}
          <div className="fixed inset-0 pointer-events-none z-0" style={{
            background: 'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(105,145,90,0.45) 0%, transparent 62%)',
          }} />
          {/* Edge vignette */}
          <div className="fixed inset-0 pointer-events-none z-0" style={{
            background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 38%, rgba(18,32,16,0.55) 100%)',
          }} />
          {/* Bottom terracotta warmth */}
          <div className="fixed bottom-0 inset-x-0 pointer-events-none z-0" style={{
            height: '40%',
            background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.16) 0%, transparent 70%)',
          }} />
          {/* Seed of Life — sacred geometry background */}
          <svg aria-hidden className="fixed inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.14">
              <circle cx="195" cy="413" r="148" strokeWidth="0.9" />
              <circle cx="343" cy="413" r="148" />
              <circle cx="269" cy="541" r="148" />
              <circle cx="121" cy="541" r="148" />
              <circle cx="47"  cy="413" r="148" />
              <circle cx="121" cy="285" r="148" />
              <circle cx="269" cy="285" r="148" />
            </g>
          </svg>
        </>
      ) : (
        <>
          {/* Light mode: parchment with warm top bloom */}
          <div className="fixed inset-0 pointer-events-none z-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(180,155,110,0.18) 0%, transparent 65%)',
          }} />
          {/* Seed of Life — sacred geometry background */}
          <svg aria-hidden className="fixed inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#415D43" strokeWidth="0.65" opacity="0.10">
              <circle cx="195" cy="413" r="148" strokeWidth="0.9" />
              <circle cx="343" cy="413" r="148" />
              <circle cx="269" cy="541" r="148" />
              <circle cx="121" cy="541" r="148" />
              <circle cx="47"  cy="413" r="148" />
              <circle cx="121" cy="285" r="148" />
              <circle cx="269" cy="285" r="148" />
            </g>
          </svg>
        </>
      )}


{/* Floating Header - Centered & Compact */}
      <header
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        className={`fixed left-0 right-0 z-50 px-8 pb-3 flex flex-col items-center gap-2 transition-all duration-300 ${isNavVisible ? 'top-0 opacity-100' : '-top-40 opacity-0'} `}
      >

        {/* Top: Tagline & Logo */}
        <div className="w-full max-w-md flex flex-col items-center">

          {/* LOGO ONLY */}
          <div className="mb-3">
            <Logo
              className="h-7 w-auto drop-shadow-md text-pale-gold"
              color="#E5D6A7"
            />
          </div>
        </div>

        {/* Bottom: Action Buttons Row (Profile, Theme, Noise, Sounds, Chat, Momentum) */}
        <div className="flex items-center gap-3">
          {/* 1. Settings (Profile) */}
          <button
            onClick={() => setShowProfile(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 ${headerBtnClass} `}
            title="Settings"
          >
            <UserIcon size={16} />
          </button>

          {/* 2. Library */}
          <button
            onClick={() => setShowLibrary(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 ${headerBtnClass} `}
            title="Library"
          >
            <BookMarked size={16} />
          </button>

          {/* 3. Koi Pond (Was Theme) */}
          <button
            onClick={() => {
              setShowKoiPond(true);
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 ${headerBtnClass} `}
            title="Open Koi Pond"
          >
            <Fish size={16} />
          </button>


          {/* 4. Soundscapes */}
          <button
            onClick={() => {
              setMixerSource('dashboard');
              setShowSoundMixer(!showSoundMixer);
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border-[1.5px] transition-all duration-300 hover:scale-110 ${showSoundMixer
              ? isDarkMode ? 'bg-white/10 border-pale-gold text-pale-gold shadow-[0_0_15px_rgba(229,214,167,0.3)]' : 'bg-sage border-sage text-white'
              : headerBtnClass
              } `}
            title="Soundscapes"
          >
            <Music size={16} />
          </button>


          {/* 5. Coach Chat (Lush Green Anchor) */}
          <button
            onClick={() => { setActiveTab('coach'); analytics.coachChatOpened(); }}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 shadow-[0_0_20px_rgba(64,145,108,0.3)] ${activeTab === 'coach'
              ? 'bg-[#40916C] text-white border-2 border-[#D4E09B]'
              : 'bg-[#40916C]/60 text-white border border-white/20 hover:bg-[#40916C] hover:scale-105'
              } `}
            title="Palante Coach Chat"
          >
            <MessageCircle size={16} />
          </button>



        </div>
      </header>


      {/* Main Content - Full Screen Sections */}
      <main className="relative z-20 pt-44 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >

        {activeTab === 'home' && (
          <ErrorBoundary name="Home" onReset={() => window.location.reload()}>
          <PageTransition>
          {(() => {
            const ritualDoneToday = !!todaysPriming?.dailyIntention;
            const eveningDoneToday = !!(user?.dailyEveningPractice || []).find(p => p.date === todayDate);
            const rawFirst = (user?.name || 'Friend').split(' ')[0];
            const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

            // ── BEAT 1 · MORNING ARRIVAL ────────────────────────────────────────
            if (!ritualDoneToday && !shouldShowEveningMode && user) {
              const timeGreeting = hour < 12 ? `Good morning, ${firstName}.` : `Good afternoon, ${firstName}.`;
              const timeSub = hour < 12 ? "Let's set the tone." : 'Take a moment.';
              return (
                <div className="min-h-screen flex flex-col px-8 pb-8 max-w-md mx-auto">
                  <div className="w-full mt-16 mb-10 text-center animate-fade-in-slow">
                    <h1 className={`text-4xl font-display font-medium tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                      {timeGreeting}
                    </h1>
                    <p className={`text-base font-sans font-medium ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>{timeSub}</p>
                  </div>
                  <div className="w-full">
                    <DailyMorningPracticeWidget
                      userName={user.name || "Friend"}
                      onComplete={handlePrimingComplete}
                      onFinish={() => setShowMorningSuccess(true)}
                      onRefresh={() => {
                        const updatedPriming = (user.dailyPriming || []).filter(p => p.date !== todayDate);
                        updateProfile({ ...user, dailyPriming: updatedPriming });
                        haptics.light();
                      }}
                      isDarkMode={isDarkMode}
                      existingPriming={todaysPriming || null}
                      hideEnergyCheckIn={true}
                      user={user}
                    />
                  </div>
                </div>
              );
            }

            // ── BEAT 1 · EVENING ARRIVAL ────────────────────────────────────────
            if (shouldShowEveningMode && !eveningDoneToday && !eveningSkipped && user) {
              return (
                <div className="min-h-screen flex flex-col px-8 pb-8 max-w-md mx-auto">
                  <div className="w-full mt-16 mb-10 text-center animate-fade-in-slow">
                    <h1 className={`text-4xl font-display font-medium tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                      Good evening, {firstName}.
                    </h1>
                    <p className={`text-base font-sans font-medium ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>Let's close the day right.</p>
                  </div>
                  <div className="w-full">
                    <EveningPractice
                      userName={user.name}
                      isDarkMode={isDarkMode}
                      existingPractice={null}
                      onComplete={(data) => {
                        const existingEntries = user.dailyEveningPractice || [];
                        const otherEntries = existingEntries.filter(p => p.date !== todayDate);
                        updateProfile({ ...user, dailyEveningPractice: [...otherEntries, data] });
                        analytics.eveningPracticeCompleted({ gratitudeCount: data.gratitude?.length ?? 0 });
                        triggerConfetti();
                        setShowEveningSuccess(true);
                        setTimeout(() => setShowEveningSuccess(false), 3000);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setEveningSkipped(true)}
                    className={`w-full py-4 text-center text-sm font-medium transition-colors mt-4 ${isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-sage/30 hover:text-sage/60'}`}
                  >
                    Skip for tonight
                  </button>
                </div>
              );
            }

            // ── BEAT 3 · THE REWARD ──────────────────────────────────────────────
            {/* Derived helpers for Beat 3 */}
            const hasPendingGoals = (user?.dailyFocuses || []).some(f => !f.isCompleted);
            const hasAnyGoals = (user?.dailyFocuses || []).length > 0;
            const coachLine = activeInterventions[0]?.message
              ?? (todaysPriming?.dailyIntention ? `Your intention: "${todaysPriming.dailyIntention}"` : null)
              ?? (ritualDoneToday ? 'Your coach is here when you need them.' : 'Your coach is ready when you are.');

            return (
              <div className="min-h-screen px-6 pb-12 max-w-md mx-auto">

                {/* ── Greeting ─────────────────────────────── */}
                <motion.div
                  className="w-full mt-10 mb-7 text-center"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className={`text-3xl font-display font-medium tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    {getGreeting()}, {firstName}.
                  </h1>
                  <p className={`text-sm font-sans ${isDarkMode ? 'text-white/45' : 'text-sage/50'}`}>
                    {ritualDoneToday
                      ? 'Practice complete. Well done.'
                      : eveningDoneToday
                        ? 'Evening reflection complete.'
                        : hour < 12 ? 'Ready to rise?' : hour < 18 ? 'Ready to flourish?' : 'Ready to unwind?'}
                  </p>
                </motion.div>

                {/* ── Mandala of Growth ─────────────────────── */}
                {user && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="flex flex-col items-center px-1 mb-2 gap-0.5">
                      <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-sage/50'}`}>
                        Mandala of Growth
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-white/30' : 'text-sage/40'}`}>
                        {(user.streak || 0)} day streak · {(user.points || 0).toLocaleString()} pts
                      </p>
                    </div>
                    <GardenMandala
                      isDarkMode={isDarkMode}
                      completedDays={Math.min(user.practiceData?.totalPractices || 0, 90)}
                    />
                  </motion.div>
                )}

                {/* ── Quote ────────────────────────────────── */}
                {dailyQuote && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {ritualDoneToday && todaysPriming?.dailyIntention && (
                      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1 ${isDarkMode ? 'text-white/25' : 'text-sage/35'}`}>
                        Tuned to your intention
                      </p>
                    )}
                    <Suspense fallback={null}>
                      <DashboardQuoteCard
                        quote={dailyQuote}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorited={dailyQuote ? (user?.favoriteQuotes || []).some(q => q.quoteId === dailyQuote.id) : false}
                        isDarkMode={isDarkMode}
                        onRefresh={() => refreshDailyQuote(true)}
                        onOpenSettings={() => setShowReorderModal(true)}
                      />
                    </Suspense>
                  </motion.div>
                )}

                {/* ── Coach strip ──────────────────────────── */}
                <motion.button
                  onClick={() => setActiveTab('coach')}
                  className={`w-full mb-5 px-5 py-4 rounded-2xl flex items-center gap-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 hover:bg-white/8'
                      : 'bg-white/70 border border-sage/15 hover:bg-white/90 shadow-sm'
                  }`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.28 }}
                >
                  <div className="w-9 h-9 rounded-full bg-[#40916C] flex items-center justify-center flex-shrink-0 shadow-md">
                    <MessageCircle size={16} className="text-white" fill="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-white/35' : 'text-sage/45'}`}>
                      Palante Coach
                    </p>
                    <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white/80' : 'text-sage-dark'}`}>
                      {coachLine}
                    </p>
                  </div>
                  <ChevronRight size={16} className={isDarkMode ? 'text-white/25 flex-shrink-0' : 'text-sage/30 flex-shrink-0'} />
                </motion.button>

                {/* ── Today's Goals ────────────────────────── */}
                {user && hasAnyGoals && (
                  <motion.div
                    className={`mb-5 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-sage/15 shadow-sm'}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.35 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-3">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                        Today's Goals
                      </h3>
                      <span className={`text-xs font-semibold tabular-nums ${
                        hasPendingGoals
                          ? (isDarkMode ? 'text-pale-gold/70' : 'text-[#C96A3A]')
                          : (isDarkMode ? 'text-green-400/70' : 'text-green-600/70')
                      }`}>
                        {user.dailyFocuses?.filter(f => f.isCompleted).length || 0} / {user.dailyFocuses?.length || 0} done
                      </span>
                    </div>

                    {/* Goal list */}
                    <div className="px-5 pb-3 space-y-2">
                      {(user.dailyFocuses || []).map((focus) => (
                        <FocusItem
                          key={focus.id}
                          focus={focus}
                          onToggle={handleToggleGoal}
                          onDelete={handleDeleteGoal}
                        />
                      ))}
                    </div>

                    {/* Quick add */}
                    <div className={`flex gap-2 px-5 pb-4 pt-1 border-t ${isDarkMode ? 'border-white/5' : 'border-sage/8'}`}>
                      <input
                        type="text"
                        value={newFocusText}
                        onChange={(e) => setNewFocusText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddFocus()}
                        placeholder="Add another goal…"
                        className={`flex-1 py-2 px-3 rounded-xl text-sm outline-none transition-all ${
                          isDarkMode
                            ? 'bg-white/5 text-white placeholder-white/25 focus:bg-white/10'
                            : 'bg-sage/5 text-sage-dark placeholder-sage/30 focus:bg-sage/10'
                        }`}
                      />
                      <button
                        onClick={handleQuickAddFocus}
                        disabled={!newFocusText.trim()}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium transition-all ${
                          !newFocusText.trim()
                            ? 'opacity-30 cursor-not-allowed ' + (isDarkMode ? 'bg-white/5 text-white' : 'bg-sage/5 text-sage')
                            : 'bg-[#C96A3A] text-white hover:bg-[#b55e32]'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* If no goals yet — soft invite, not an empty state box */}
                {user && !hasAnyGoals && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div className={`flex gap-2 px-5 py-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white/70 border-sage/12 shadow-sm'}`}>
                      <input
                        type="text"
                        value={newFocusText}
                        onChange={(e) => setNewFocusText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddFocus()}
                        placeholder="What's one thing you want to move forward today?"
                        className={`flex-1 py-1 text-sm outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-white/30' : 'text-sage-dark placeholder-sage/40'}`}
                      />
                      <button
                        onClick={handleQuickAddFocus}
                        disabled={!newFocusText.trim()}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium transition-all flex-shrink-0 ${
                          !newFocusText.trim()
                            ? 'opacity-30 cursor-not-allowed ' + (isDarkMode ? 'bg-white/5 text-white' : 'bg-sage/5 text-sage')
                            : 'bg-[#C96A3A] text-white hover:bg-[#b55e32]'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Today's Story accordion ───────────────── */}
                {(ritualDoneToday || eveningDoneToday) && user && (
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.42 }}
                  >
                    <button
                      onClick={() => { setShowTodayStory(p => !p); haptics.light(); }}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                        isDarkMode
                          ? 'bg-white/5 border-white/8 hover:bg-white/8'
                          : 'bg-white/60 border-sage/12 hover:bg-white/80 shadow-sm'
                      }`}
                    >
                      <span className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/50' : 'text-sage/55'}`}>
                        Today's Story
                      </span>
                      <div className={`transition-transform duration-300 ${showTodayStory ? 'rotate-180' : 'rotate-0'} ${isDarkMode ? 'text-white/30' : 'text-sage/35'}`}>
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {showTodayStory && (
                        <motion.div
                          key="today-story"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-4">
                            {ritualDoneToday && (
                              <Suspense fallback={<div className={`w-full h-24 rounded-3xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`} />}>
                                <MorningMessageCard
                                  intention={todaysPriming?.dailyIntention || ''}
                                  message={todaysPriming?.messageOfTheDay || ''}
                                  isDarkMode={isDarkMode}
                                  userName={user.name || ''}
                                  coachTone={user.coachSettings?.coachTone ?? 'nurturing'}
                                  onOpenToneSettings={() => setShowHomeCoachSettings(true)}
                                  onRefresh={() => {
                                    const updatedPriming = (user.dailyPriming || []).filter(p => p.date !== todayDate);
                                    updateProfile({ ...user, dailyPriming: updatedPriming });
                                    haptics.light();
                                  }}
                                />
                              </Suspense>
                            )}
                            {eveningDoneToday && (
                              <Suspense fallback={<div className={`w-full h-24 rounded-3xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`} />}>
                                <EveningMessageCard
                                  practice={user.dailyEveningPractice?.find(p => p.date === todayDate) || {
                                    id: 'temp', date: todayDate, gratitude: '', learning: '', accomplishment: '', delight: ''
                                  }}
                                  isDarkMode={isDarkMode}
                                  onRefresh={() => {
                                    updateProfile({ ...user, dailyEveningPractice: (user.dailyEveningPractice || []).filter(p => p.date !== todayDate) });
                                    haptics.light();
                                  }}
                                />
                              </Suspense>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── Settings access (quiet, bottom) ─────── */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={() => setShowProfile(true)}
                    className={`text-xs font-medium transition-opacity opacity-30 hover:opacity-60 ${isDarkMode ? 'text-white' : 'text-sage'}`}
                  >
                    Settings &amp; Layout
                  </button>
                </div>

                <ReorderModal
                  isOpen={showReorderModal}
                  onClose={() => setShowReorderModal(false)}
                  isDarkMode={isDarkMode}
                  title="Arrange Dashboard"
                  items={[
                    { id: 'morning_practice', label: 'Morning Practice' },
                    { id: 'daily_quote', label: 'Daily Inspiration' },
                    { id: 'todays_goals', label: 'Goals' },
                  ]}
                  currentOrder={['morning_practice', 'daily_quote', 'todays_goals']}
                  onSave={(newOrder) => {
                    if (user) {
                      updateProfile({ ...user, dashboardOrder: ['start_ritual', ...newOrder] });
                    }
                  }}
                />

              </div>
            );
          })()}
          </PageTransition>
          </ErrorBoundary>
        )}

        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${isDarkMode ? 'border-white' : 'border-sage'} `}></div>
          </div>
        }>
          {activeTab === 'momentum' && user && (
            <ErrorBoundary name="Momentum">
            <PageTransition>

              <div className="min-h-screen px-8 pb-8 max-w-md mx-auto">
                <Momentum
                  user={user}
                  onUpdateUser={async (updatedUser) => {
                    await updateProfile(updatedUser);
                  }}
                  onShowTip={() => handleShowTip('Productivity')}
                  onLaunchRoutine={handleLaunchRoutine}
                  onCreateRoutine={() => setShowStackWizard(true)}
                />
              </div>
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'focus' && (
            <ErrorBoundary name="Focus Timer">
            <PageTransition>
              <div className="min-h-screen max-w-md mx-auto h-full pt-6">
                <Suspense fallback={
                  <div className="flex justify-center items-center min-h-[60vh]">
                    <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${isDarkMode ? 'border-white' : 'border-sage'} `}></div>
                  </div>
                }>
                  <FocusTimer
                    onAddHydration={() => {
                      // Link hydration to fasting state if active
                      const savedHydration = localStorage.getItem(STORAGE_KEYS.FASTING_HYDRATION);
                      const current = savedHydration ? parseInt(savedHydration) : 0;
                      localStorage.setItem(STORAGE_KEYS.FASTING_HYDRATION, (current + 1).toString());

                      setToastMessage('Hydration Tracked');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                  />
                </Suspense>
              </div>
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'toolkit' && (
            <ErrorBoundary name="Practice">
            <PageTransition>
              <div className="min-h-screen max-w-md mx-auto">
                <PracticeView
                  isDarkMode={isDarkMode}
                  user={user}
                  updateProfile={updateProfile}
                  onNavigate={(section) => {
                    if (section === 'routines') {
                      setShowStackWizard(true);
                    } else if (section === 'soundscapes') {
                      setShowSoundMixer(true);
                    } else {
                      setActiveTab(section);
                    }
                  }}
                />
              </div>
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'fasting' && user && (
            <ErrorBoundary name="Fasting">
            <PageTransition>
              <div className="min-h-screen max-w-md mx-auto">
                <Fasting 
                  user={user} 
                  isDarkMode={isDarkMode} 
                  onUpdateProfile={(updates) => handleProfileUpdate((prev) => prev ? ({ ...prev, ...updates }) : prev!)}
                  onOpenCoach={(msg) => {
                    handleQuickAction('coach');
                    // We might need a small delay or a state to pass the initial message
                    // but usually coach has a way to receive message
                  }}
                />
              </div>
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'breath' && (
            <ErrorBoundary name="Breathing">
            <PageTransition>
              <Breathing
                isDarkMode={isDarkMode}
                accentColor={isDarkMode ? 'text-pale-gold' : 'text-sage'}
                onComplete={() => handleActivity('breath')}
                onShowTip={() => handleShowTip('Breath')}
              />
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'meditate' && (
            <ErrorBoundary name="Meditation">
            <PageTransition>
              <Meditation
                isDarkMode={isDarkMode}
                onComplete={() => {
                  handleActivity('meditate');

                  // Prompt letter writing after meditation (25% chance)
                  if (Math.random() < 0.25) {
                    setTimeout(() => {
                      setLetterContext('meditation');
                      setLetterContextDetails('meditation session');
                      setShowLetterWrite(true);
                    }, 1000);
                  }
                }}
                onSaveReflection={handleSaveMeditationReflection}
                onShowTip={() => handleShowTip('Meditation')}
                onStrategize={() => {
                  haptics.medium();
                  setActiveTab('coach');
                }}

                user={user || undefined}
                onOpenSoundMixer={() => {
                  setMixerSource('meditation');
                  setShowSoundMixer(true);
                }}
                onSaveMix={(newMix) => {
                  handleProfileUpdate(prev => {
                    if (!prev) return prev!;
                    if ((prev.savedMixes || []).length >= 8) return prev;
                    return {
                      ...prev,
                      savedMixes: [newMix, ...(prev.savedMixes || [])]
                    };
                  });
                }}
                onDeleteMix={(mixId) => {
                  handleProfileUpdate(prev => {
                    if (!prev) return prev!;
                    return {
                      ...prev,
                      savedMixes: (prev.savedMixes || []).filter(m => m.id !== mixId)
                    };
                  });
                }}
              />
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'reflect' && (
            <ErrorBoundary name="Reflections">
            <PageTransition>
              <Reflections
                onSave={async (entry: JournalEntry) => {

                  if (!user) return;

                  // 1. API Call
                  await api.saveJournalEntry(user.id, entry);

                  // 2. Prepare Local Update
                  const existingEntries = user.journalEntries || [];
                  const filteredEntries = existingEntries.filter(e => e.date !== entry.date);
                  const newJournalEntries = [...filteredEntries, entry];

                  // 3. Chain to Activity Log
                  handleProfileUpdate(prev => {
                    if (!prev) return prev!;
                    return {
                      ...prev,
                      journalEntries: newJournalEntries,
                      points: (prev.points || 0) + 10
                    };
                  });

                  setTimeout(() => handleActivity('reflect'), 100);

                  // Trigger Tip
                  handleShowTip('Reflect');
                }}
                isDarkMode={isDarkMode}
                user={user || undefined}
                onShowTip={() => handleShowTip('Reflect')}
                onStrategize={() => {
                  setActiveTab('coach');
                }}
                initialText={initialReflectionText}
              />
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'wisdom' && (
            <ErrorBoundary name="Wisdom">
            <PageTransition>
              <div className="min-h-screen max-w-md mx-auto h-full">
                <JapaneseWisdomView
                  isDarkMode={isDarkMode}
                  onNavigate={(tab: string) => {
                    setActiveTab(tab as typeof activeTab);
                    haptics.selection();
                    setShowReturnToWisdom(true);
                  }}
                  onAddGoal={(text: string) => {
                    if (!user) return;
                    haptics.medium();
                    const newFocus: DailyFocus = {
                      id: Date.now().toString(),
                      text: text.trim(),
                      isCompleted: false,
                      createdAt: new Date().toISOString()
                    };
                    const updatedUser: UserProfile = {
                      ...user,
                      dailyFocuses: [newFocus, ...(user.dailyFocuses || [])]
                    };
                    updateProfile(updatedUser);
                    api.createGoal(user.id, newFocus.text).catch(console.error);

                    setShowReturnToWisdom(true);
                    setToastMessage('Added to Focus Goals');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  onStartFocus={(minutes: number, objective?: string) => {
                    haptics.medium();
                    setShowReturnToWisdom(true);
                    // Create a one-off focus routine
                    const objLower = objective?.toLowerCase() || '';
                    const requiresInput = objLower.includes('sentence') ||
                      objLower.includes('answer') ||
                      objLower.includes('?') ||
                      objLower.includes('who') ||
                      objLower.includes('why') ||
                      objLower.includes('what');

                    const focusRoutine: RoutineStack = {
                      id: `focus-${Date.now()}`,
                      name: objective || (minutes === 1 ? 'Kaizen Focus' : 'Anchored Focus'),
                      description: objective || 'Stay Focused',
                      icon: 'Target',
                      steps: [
                        {
                          id: `step-${Date.now()}`,
                          type: 'focus',
                          label: objective || 'Stay Focused',
                          duration: minutes * 60,
                          title: objective || 'Stay Focused',
                          text: minutes === 1 ? 'One minute of absolute focus beats hours of procrastination.' : 'Deep focus works best when anchored to a single ritual.',
                          requiresInput: !!requiresInput
                        }
                      ]
                    };
                    handleLaunchRoutine(focusRoutine);
                  }}
                  onStartReflection={(theme: string, initialText?: string) => {
                    haptics.medium();
                    setInitialReflectionText(initialText || '');
                    setActiveTab('reflect');
                    setShowReturnToWisdom(true);

                    // Simple "scroll to prompt" flag hack
                    setTimeout(() => {
                      const journalArea = document.querySelector('.journal-input-area');
                      if (journalArea) {
                        journalArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } else {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }
                    }, 500);
                  }}

                />
              </div>
            </PageTransition>
            </ErrorBoundary>
          )}



        </Suspense>

          </motion.div>
        </AnimatePresence>

      </main >

      {/* Full-screen Overlays */}
      <AnimatePresence mode="wait">
        {activeTab === 'coach' && user && (
          <ErrorBoundary name="Coach" onReset={() => setActiveTab('home')}>
          <motion.div
            key="coach-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/20 overflow-hidden"
          >
            <CoachView
              user={user}
              onBack={() => {
                setActiveTab('home');
                haptics.selection();
              }}
              onNavigate={(tab) => {
                setActiveTab(tab as typeof activeTab);
                haptics.selection();
              }}
            />
          </motion.div>
          </ErrorBoundary>
        )}
      </AnimatePresence>





      {/* Return to Wisdom Floating Button */}
      <AnimatePresence>
        {showReturnToWisdom && activeTab !== 'wisdom' && activeTab !== 'coach' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60]"
          >
            <button
              onClick={() => {
                setActiveTab('wisdom');
                setShowReturnToWisdom(false);
                haptics.medium();
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-display font-medium transition-all active:scale-95 ${'bg-[#1B4332] text-white hover:scale-105'}`}
            >
              <ChevronLeft size={18} />
              Return to Wisdom
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Library Modal */}
      {
        showLibrary && user && (
          <ErrorBoundary name="Library" onReset={() => setShowLibrary(false)}>
          <SlideUpModal
            isOpen={showLibrary}
            onClose={() => setShowLibrary(false)}
            isDarkMode={isDarkMode}
          >
            <div className="bg-transparent">
              <Suspense fallback={
                <div className="flex justify-center items-center min-h-[60vh]">
                  <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${isDarkMode ? 'border-white' : 'border-sage'} `}></div>
                </div>
              }>
                <Library
                  key={`library-${user.journalEntries?.length || 0}-${user.favoriteQuotes?.length || 0}`}
                  favoriteQuotes={user.favoriteQuotes || []}
                  allQuotes={allQuotes}
                  journalEntries={user.journalEntries || []}
                  meditationReflections={user.meditationReflections || []}
                  onRemoveFavorite={handleRemoveFavorite}
                  onRemoveJournalEntry={handleRemoveJournalEntry}
                  isDarkMode={isDarkMode}

                  onShowTip={() => handleShowTip('Coach')}
                />
              </Suspense>
            </div>
          </SlideUpModal>
          </ErrorBoundary>
        )
      }

      {/* Premium Bottom Navigation - Scroll Aware */}
      < nav className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${isNavVisible && activeTab !== 'coach' ? 'bottom-4 md:bottom-8 opacity-100' : '-bottom-24 opacity-0'} `}>
        <div className={`flex items-center gap-1 md:gap-3 px-3 md:px-6 py-3 md:py-4 rounded-full backdrop-blur-xl border transition-all duration-500 ${navClass} `}>
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'momentum', icon: TrendingUp, label: 'Journey' },
            { id: 'toolkit', icon: Layers, label: 'Tool Kit' },
          ].map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  haptics.selection();
                  analytics.screenViewed(tab.id);
                }}
                className={`tap-zone flex flex-col items-center gap-0.5 md:gap-1 px-4 md:px-5 py-2 rounded-full transition-all duration-300 ${activeTab === tab.id
                  ? isDarkMode
                    ? 'bg-white/20 text-white border border-white/20'
                    : 'bg-sage/20 text-sage'
                  : isDarkMode
                    ? 'text-white/60 hover:text-white hover:bg-white/5'
                    : 'text-sage/60 hover:text-sage hover:bg-sage/10'
                  } `}
              >
                <div className="relative">
                  <Icon size={20} className="md:w-5 md:h-5 w-5 h-5" />
                  {tab.id === 'momentum' && (user?.streak ?? 0) > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)' }}
                    />
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav >




      {/* Stack Runner - Fullscreen Routine Execution */}
      {
        showStackRunner && activeRoutine && user && (
          <ErrorBoundary name="StackRunner" onReset={handleRoutineComplete}>
          <Suspense fallback={null}>
            <SafeStackRunner
              routine={activeRoutine}
              onComplete={handleRoutineComplete}
              onClose={handleRoutineComplete}
              isDarkMode={isDarkMode}
              user={user}

              onUpdateUser={(updates: Partial<UserProfile>) => {
                handleProfileUpdate((prev: UserProfile | null) => {
                  if (!prev) return prev!;
                  return { ...prev, ...updates };
                });
              }}
            />
          </Suspense>
          </ErrorBoundary>
        )
      }


      {/* Garden Legend */}
      {showGardenLegend && user && (
        <Suspense fallback={null}>
          <GardenLegendModal
            isOpen={showGardenLegend}
            onClose={() => setShowGardenLegend(false)}
            streak={user.streak || 0}
            points={user.points || 0}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {/* Weekly Accomplishments Highlight — fires Monday mornings */}
      <WeeklyHighlightsModal
        isOpen={showWeeklyHighlights}
        accomplishments={weeklyAccomplishments}
        userName={user?.name || 'Friend'}
        isDarkMode={isDarkMode}
        onClose={() => setShowWeeklyHighlights(false)}
      />

      {/* Legal Disclaimer Modal - First Launch (Blocks Everything) */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={() => setShowDisclaimer(false)}
        isDarkMode={isDarkMode}
      />



      {/* New Welcome Orientation Modal */}
      <Suspense fallback={null}>
        <WelcomeOrientationModal
          isOpen={showWelcomeOrientation}
          onClose={() => setShowWelcomeOrientation(false)}
          isDarkMode={isDarkMode}
          onNavigate={(section) => {
            if (section === 'settings') setShowProfile(true);
            if (section === 'morning-ritual') { setActiveTab('home'); setShowMorningPractice(true); }
            if (section === 'momentum') setActiveTab('momentum');
            if (section === 'reflections') setActiveTab('reflect');
            if (section === 'ai-coach') setActiveTab('coach');
          }}

        />
      </Suspense>

      {/* Celebration Modal */}
      {/* Removed SmartRolloverModal - goals now persist until manually deleted */}
      {
        /* Morning Briefing - DISABLED: User requested direct app access */
        /* {showBriefing && user && currentQuote && (
          <MorningBriefing
            quote={currentQuote}
            username={user.name}
            onComplete={handleBriefingComplete}
            onDismiss={() => setShowBriefing(false)}
            lastReflection={(() => {
              if (!user.journalEntries) return null;
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterDateStr = yesterday.toISOString().split('T')[0];
              return user.journalEntries.find(e => e.date === yesterDateStr);
            })()}
          />
        )} */
      }

      {/* History Modal */}
      {
        user && (
          <HistoryModal
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            favorites={user.favoriteQuotes || []}
            allQuotes={allQuotes}
            isDarkMode={isDarkMode}
            onRemoveFavorite={handleRemoveFavorite}
          />
        )
      }

      {/* SoundMixer Overlay - DISABLED */}
      {/* <SoundMixer
        isVisible={showSoundMixer}
        onClose={() => setShowSoundMixer(false)}
        isDarkMode={isDarkMode}
          });
        }}
      />




      {/* Onboarding Celebration */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="Welcome, Friend!"
        message="Your daily journey begins now. Let's make today count!"
        isDarkMode={isDarkMode}
      />

      {/* Milestone Celebration */}
      {
        showMilestone.isOpen && (
          <MilestoneCelebration
            milestone={showMilestone.milestone || undefined}
            streakDays={showMilestone.streakDays}
            isOpen={showMilestone.isOpen}
            onClose={() => setShowMilestone({ isOpen: false, milestone: null, streakDays: undefined })}
          />
        )
      }

      {/* Post-First-Practice Personalization Setup */}
      <Suspense fallback={null}>
        <PostPracticeSetupModal
          isOpen={showPostPracticeSetup}
          userName={user?.name || 'friend'}
          isDarkMode={isDarkMode}
          onComplete={handlePostPracticeSetupComplete}
          onSkip={handlePostPracticeSetupSkip}
        />
      </Suspense>

      {/* Weekly Report */}
      <Suspense fallback={null}>
        {
          currentWeeklyReport && (
            <WeeklyReportModal
              report={currentWeeklyReport}
              isOpen={showWeeklyReport}
              onClose={() => setShowWeeklyReport(false)}
            />
          )
        }
      </Suspense>





      {/* Clear the Noise Modal */}
      <Suspense fallback={null}>
        {
          user && showClearNoise && (
            <ClearTheNoise
              user={user}
              isDarkMode={isDarkMode}
              onClose={() => setShowClearNoise(false)}
              onComplete={(entries) => {
                handleProfileUpdate(prev => {
                  if (!prev) return prev!;
                  return {
                    ...prev,
                    noiseEntries: [...(prev.noiseEntries || []), ...entries]
                  };
                });
                setShowClearNoise(false);
              }}
            />
          )
        }
      </Suspense>

      {/* Rest Day Modal */}
      {
        showRestDayModal && missedDate && (
          <RestDayModal
            isDarkMode={isDarkMode}
            missedDate={missedDate}
            onMarkAsRest={handleMarkAsRestDay}
            onAcknowledge={handleAcknowledgeMissedDay}
            onClose={() => setShowRestDayModal(false)}
          />
        )
      }

      {/* Morning Mode Overlay */}
      {
        showMorningMode && user && currentQuote && (
          <MorningModeOverlay
            isDarkMode={isDarkMode}
            quote={currentQuote}
            userName={user.name}
            onStartMeditation={() => {
              setShowMorningMode(false);
              setActiveTab('meditate');
            }}
            onClose={() => setShowMorningMode(false)}
          />
        )
      }

      {/* Future Letters - Write Modal */}
      {
        showLetterWrite && (
          <LetterWriteModal
            isDarkMode={isDarkMode}
            context={letterContext}
            contextDetails={letterContextDetails}
            onSave={handleSaveLetter}
            onClose={() => setShowLetterWrite(false)}
          />
        )
      }

      {/* Future Letters - Read Modal */}
      {
        showLetterRead && currentLetter && (
          <LetterReadModal
            isDarkMode={isDarkMode}
            letter={currentLetter}
            onClose={handleDeliverLetter}
          />
        )
      }

      {/* Universal Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={`px-6 py-3 rounded-full shadow-popup flex items-center gap-3 backdrop-blur-xl border ${isDarkMode ? 'bg-pale-gold/90 text-[#2E362A] border-white/20' : 'bg-[#355E3B]/90 text-white border-[#355E3B]/20'}`}>
              <CheckCircle2 size={18} />
              <span className="text-sm font-display font-bold uppercase tracking-widest">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

{/* Nudge Settings Modal (Home Shortcut) */}
      {
        user && (
          <CoachSettingsModal
            isOpen={showHomeCoachSettings}
            onClose={() => setShowHomeCoachSettings(false)}
            settings={(() => {
              const s = user.coachSettings || {};
              const validFreqs = ['morning-only', 'morning-evening', 'off'] as const;
              return {
                ...s,
                nudgeFrequency: validFreqs.includes(s.nudgeFrequency as typeof validFreqs[number])
                  ? s.nudgeFrequency as typeof validFreqs[number]
                  : 'morning-evening',
                nudgeEnabled: s.nudgeEnabled ?? false,
              };
            })()}
            onSave={handleSaveCoachSettings}
          />
        )
      }
      {/* Profile Modal */}
      <Suspense fallback={null}>
        {
          showProfile && user && (
            <SlideUpModal
              isOpen={showProfile}
              onClose={() => setShowProfile(false)}
              showCloseButton={false}
              fixedHeight={true}
              isDarkMode={isDarkMode}
              position="bottom"
            >
              <div className="bg-transparent">
                <Profile
                  user={user}
                  onUpdate={handleProfileUpdate}
                  isDarkMode={isDarkMode}
                  onClose={() => setShowProfile(false)}
                  onOpenKoiPond={() => {
                    setShowProfile(false);
                    setShowKoiPond(true);
                  }}
                  onShowWelcome={() => setShowWelcomeOrientation(true)}
                  onViewPrivacy={() => navigate('/privacy')}
                  onWriteLetter={() => {
                    setLetterContext('manual');
                    setShowLetterWrite(true);
                  }}
                  onRefreshNarrative={async () => {
                    if (!user) return;
                    const text = await generateUserNarrative(user);
                    if (text) {
                      updateProfile({
                        ...user,
                        userNarrative: { text, generatedAt: new Date().toISOString() }
                      });
                    }
                  }}
                />
              </div>
            </SlideUpModal>
          )
        }
      </Suspense>

      {/* Daily Mosaic Modal */}


      {/* Morning Practice Modal */}
      <Suspense fallback={null}>
        {
          user && (
            <MorningPractice
              isOpen={showMorningPractice}
              onClose={() => setShowMorningPractice(false)}
              user={user}

              onUpdateUser={(updates: Partial<UserProfile>) => handleProfileUpdate((prev: UserProfile | null) => {
                if (!prev) return prev!;
                return { ...prev, ...updates };
              })}
            />
          )
        }
      </Suspense>

      {/* Midday Check-in */}
      {user && (
        <CheckInModal
          isOpen={showCheckIn}
          userName={user.name}
          onFeelingSaved={(mood, energy) => {
            handleProfileUpdate(prev => {
              if (!prev) return prev!;
              return { ...prev, currentMood: mood as UserProfile['currentMood'], currentEnergy: energy as UserProfile['currentEnergy'] };
            });
          }}
          onNavigate={(dest: CheckInDestination) => {
            setShowCheckIn(false);
            const tabMap: Record<CheckInDestination, typeof activeTab> = {
              focus: 'focus',
              reflect: 'reflect',
              breath: 'breath',
              soundscapes: 'soundscapes',
            };
            setActiveTab(tabMap[dest]);
          }}
          onDismiss={() => setShowCheckIn(false)}
        />
      )}

      {/* Vibe Check Overlay */}
      <Suspense fallback={null}>
        {
          user && (
            <VibeCheck
              isOpen={showVibeCheck}
              onSelect={(tier, source, content) => {
                handleProfileUpdate(prev => {
                  if (!prev) return prev!;
                  const updatedUser = {
                    ...prev,
                    tier: tier,
                    sourcePreference: source,
                    contentTypePreference: content
                  };
                  // Trigger reload with new settings immediately
                  loadNewQuote(updatedUser);
                  return updatedUser;
                });
                localStorage.setItem(STORAGE_KEYS.VIBE_CHECKED, 'true');
                setShowVibeCheck(false);
              }}
              onSkip={() => {
                localStorage.setItem(STORAGE_KEYS.VIBE_CHECKED, 'true');
                setShowVibeCheck(false);
              }}
              isDarkMode={isDarkMode}
              userName={user.name}
              currentSource={user.sourcePreference}
              currentContent={user.contentTypePreference}
            />
          )
        }
      </Suspense>

      {/* Global Did You Know Modal */}
      <Suspense fallback={null}>
        <DidYouKnowModal
          isOpen={globalTip.isOpen}
          onClose={handleCloseTip}
          fact={globalTip.fact}
          isDarkMode={isDarkMode}
        />
      </Suspense>

      {/* Stack Wizard - Create New Routine */}
      <Suspense fallback={null}>
        <StackWizardModal
          isOpen={showStackWizard}
          onClose={() => setShowStackWizard(false)}
          onSave={(stack, shouldLaunch, shouldEdit) => {
            handleProfileUpdate(prev => {
              if (!prev) return prev!;
              return {
                ...prev,
                routines: [...(prev.routines || []), stack],
                activeRoutineId: stack.id
              };
            });
            setShowStackWizard(false);

            if (shouldEdit) {
              // Open Editor immediately
              setEditingRoutine(stack);
            } else if (shouldLaunch) {
              // Small delay to allow modal close animation
              setTimeout(() => handleLaunchRoutine(stack), 300);
            }
          }}
          isDarkMode={isDarkMode}
        />
      </Suspense>

      <ErrorBoundary name="KoiPond" onReset={() => setShowKoiPond(false)}>
        <Suspense fallback={null}>
          {showKoiPond && (
            <KoiPond
              isDarkMode={isDarkMode}
              onClose={() => setShowKoiPond(false)}
              streak={user.streak || 0}
              points={user.points || 0}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary name="SoundMixer" onReset={() => setShowSoundMixer(false)}>
        <Suspense fallback={null}>
          <SoundMixer
            isVisible={showSoundMixer}
            onClose={() => setShowSoundMixer(false)}
            isDarkMode={isDarkMode}
            source={mixerSource}
            onSaveMix={(mix: Omit<SoundMix, 'id'>) => {
              if (user) {
                const updatedMixes = [...(user.savedMixes || []), { ...mix, id: `mix-${Date.now()}` }];
                updateProfile({ ...user, savedMixes: updatedMixes });
              }
            }}
            user={user || undefined}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Stack Editor - Edit Existing Routine */}
      <Suspense fallback={null}>
        <StackEditorModal
          isOpen={!!editingRoutine}
          onClose={() => setEditingRoutine(null)}
          routine={editingRoutine}
          onSave={handleUpdateRoutine}
          isDarkMode={isDarkMode}
        />
      </Suspense>
    </div >
  );

  // Render Logic
  if (currentPath === '/privacy') {
    return <PrivacyPolicy isDarkMode={isDarkMode} onBack={() => navigate('/')} />;
  }

  if (showIntroSequence) {
    return (
      <DebugErrorBoundary componentName="CinematicIntro">
        <Suspense fallback={<div className="bg-blue-900 w-screen h-screen flex items-center justify-center text-white">Loading Intro...</div>}>
          <CinematicIntro
            onComplete={handleIntroComplete}
            onOpenSettings={() => {
              setShowIntroSequence(false);
              setShowProfile(true);
            }}
          />
        </Suspense>
      </DebugErrorBoundary>
    );
  }

  // Go directly to app (marketing landing page removed)
  return appJsx;
}

function SubscriptionBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <SubscriptionProvider userId={user?.id}>{children}</SubscriptionProvider>;
}

function App() {
  return (
    <DebugErrorBoundary name="Root App">
      <AuthProvider>
        <SubscriptionBridge>
          <UserProvider>
            <AppContent />
          </UserProvider>
        </SubscriptionBridge>
      </AuthProvider>
    </DebugErrorBoundary>
  );
}

export default App;
