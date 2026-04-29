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
const GardenOfGrowth = lazy(() => import('./components/GardenOfGrowth').then(m => ({ default: m.GardenOfGrowth })));
import { FocusTimer } from './components/FocusTimer';
import { HomeEssentialTools } from './components/HomeEssentialTools';
import type { EssentialToolId } from './components/HomeEssentialTools';
/// const FocusTimer = lazy(() => import('./components/FocusTimer').then(m => ({ default: m.FocusTimer })));

import { CoachView } from './components/CoachView';
import { WeeklyHighlightsModal, computeWeeklyHighlights } from './components/WeeklyHighlightsModal';




import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Logo } from './components/Logo';
import {
  Home, TrendingUp, User as UserIcon, Moon, Sun,
  BookMarked, Music, MessageCircle, Bell, ChevronDown, Check,
  Target, Sparkles, ChevronRight, ChevronLeft, Waves, Mic, Layers, Heart,
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
  const [editingRoutine, setEditingRoutine] = useState<import('./types').RoutineStack | null>(null);

  // Weekly Highlights modal
  const [showWeeklyHighlights, setShowWeeklyHighlights] = useState(false);
  const [weeklyAccomplishments, setWeeklyAccomplishments] = useState<{ text: string; date: string }[]>([]);

  // Rest Day Modal State
  const [missedDate, setMissedDate] = useState<string>('');

  // Time-based UI modes
  const { shouldShowMorningMode, shouldShowEveningMode, hour } = useTimeOfDay();

  // Transient Success States for Practices
  const [showMorningSuccess, setShowMorningSuccess] = useState(false);
  const [showEveningSuccess, setShowEveningSuccess] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

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


      {/* Global Ambient Background (The "Circles" restored from earlier today) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top Right Concentric Circle */}
        <Target
          className={`absolute top-0 right-0 w-[110vmin] h-[110vmin] translate-x-1/2 -translate-y-1/2 transition-colors duration-500 opacity-[0.075] ${isDarkMode ? 'text-[#E8E2D9]' : 'text-sage'
            } `}
        />

        {/* Bottom Left Concentric Circle */}
        <Target
          className="absolute bottom-0 left-0 w-[90vmin] h-[90vmin] -translate-x-1/2 translate-y-1/2 text-pale-gold opacity-[0.075]"
        />
      </div>


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
            <Waves size={16} />
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
            onClick={() => setActiveTab('coach')}
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
            <div className="min-h-screen px-8 pb-8 max-w-md mx-auto">
              {/* 1. HERO: Cinematic Greeting + Quote */}
              <div className="w-full mb-8 mt-12 animate-fade-in-slow text-center relative z-10">
                <h1 className={`text-4xl font-display font-medium mb-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                  {getGreeting()}, {(user?.name || '').split(' ')[0] || 'Friend'}
                </h1>
                <p className={`text-base font-sans font-medium mb-12 ${isDarkMode ? 'text-white/80' : 'text-sage/80'}`}>
                  {new Date().getHours() < 12 ? 'Ready to rise?' : new Date().getHours() < 18 ? 'Ready to flourish?' : 'Ready to unwind?'}
                </p>

                {/* Evening Wind-Down Banner */}
                {shouldShowEveningMode && (
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1B4332]/40 via-[#2D6A4F]/20 to-[#1B4332]/40 border border-white/10 backdrop-blur-sm animate-fade-in shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Moon size={20} className="text-pale-gold" />
                      <h3 className={`font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'}`}>Wind Down for the Night</h3>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-sage-dark/70'}`}>
                      Your screen is dimmed for better sleep. Consider meditation or sleep sounds.
                    </p>
                  </div>
                )}

                {/* Quote Card */}
                <div className="mb-6">
                  <Suspense fallback={<SkeletonQuoteCard isDarkMode={isDarkMode} />}>
                    {isQuoteLoading || !currentQuote ? (
                      <SkeletonQuoteCard isDarkMode={isDarkMode} />
                    ) : (
                      <DashboardQuoteCard
                        quote={currentQuote}
                        isDarkMode={isDarkMode}
                        isFavorited={(() => {
                          if (!user || !user.favoriteQuotes) return false;
                          const result = user.favoriteQuotes.some(fav => String(fav.quoteId) === String(currentQuote.id));
                          return result;
                        })()}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenHistory={() => setShowHistory(true)}
                        onOpenSettings={() => {
                          haptics.medium();
                          setShowVibeCheck(true);
                        }}
                        onRefresh={() => {
                          haptics.medium();
                          if (user) loadNewQuote(user);
                        }}
                      />
                    )}
                  </Suspense>
                </div>

                {/* Essential Tools — single unified section, user-customizable */}
                {user && (
                  <HomeEssentialTools
                    isDarkMode={isDarkMode}
                    selectedTools={user.homeEssentialTools}
                    fastingActive={(() => {
                      try { return localStorage.getItem(STORAGE_KEYS.FASTING_STATUS) === 'active'; }
                      catch { return false; }
                    })()}
                    fastingTime={(() => {
                      try {
                        const startTime = localStorage.getItem(STORAGE_KEYS.FASTING_START_TIME);
                        if (!startTime) return '';
                        const elapsed = Date.now() - new Date(startTime).getTime();
                        if (isNaN(elapsed) || elapsed < 0) return '';
                        return `${Math.floor(elapsed / 3_600_000)}h ${Math.floor((elapsed % 3_600_000) / 60_000)}m`;
                      } catch { return ''; }
                    })()}
                    onNavigate={(id: EssentialToolId) => handleQuickAction(id)}
                    onSave={(tools: EssentialToolId[]) => {
                      if (user) updateProfile({ ...user, homeEssentialTools: tools });
                    }}
                  />
                )}
              </div>

              {/* Profile Completion Prompt */}
              {user && !showMorningMode && (
                <div className="w-full relative z-30 mb-6">
                  <ProfileCompletionCard
                    user={{
                      profession: user?.profession,
                      interests: user?.interests,
                      career: user?.career,
                      age: user?.age,
                      contentTypePreference: user?.contentTypePreference
                    }}
                    isDarkMode={isDarkMode}
                    onOpenProfile={() => setShowProfile(true)}
                  />
                </div>
              )}

              {/* 3. PALANTE COACH INTERVENTIONS */}
              {activeInterventions.length > 0 && (
                <div className="w-full mb-6 relative z-30">
                  {/* Show only the highest priority intervention */}
                  {activeInterventions.slice(0, 1).map(intervention => (
                    <CoachInterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      onAccept={() => {
                        // Handle intervention action
                        if (intervention.action) {
                          switch (intervention.action.type) {
                            case 'show_breathing':
                              setActiveTab('breath');
                              break;
                            case 'show_meditation':
                              setActiveTab('meditate');
                              break;
                            case 'suggest_goal':
                              // Open goals section
                              setIsGoalsExpanded(true);
                              break;
                            case 'open_practice':
                              // Show practice options
                              break;
                          }
                        }

                        // Mark as accepted
                        if (user) {
                          const updatedInterventions = user.coachInterventions || [];
                          updatedInterventions.push({ ...intervention, accepted: true });
                          const updatedUser = { ...user, coachInterventions: updatedInterventions };
                          updateProfile(updatedUser);
                        }

                        // Remove from active
                        setActiveInterventions(prev => prev.filter(i => i.id !== intervention.id));
                      }}
                      onDismiss={() => {
                        // Mark as dismissed
                        if (user) {
                          const updatedInterventions = user.coachInterventions || [];
                          updatedInterventions.push({ ...intervention, dismissed: true });
                          const updatedUser = { ...user, coachInterventions: updatedInterventions };
                          updateProfile(updatedUser);
                        }

                        // Remove from active
                        setActiveInterventions(prev => prev.filter(i => i.id !== intervention.id));
                      }}
                    />
                  ))}
                </div>
              )}







              {(() => {
                // --- STABILIZED DASHBOARD SORTING ---
                // We enforce a consistent order so users build muscle memory.

                // Static Order: 
                // 1. Morning Practice (start_ritual)
                // 2. Daily Check-in (morning_practice)
                // 3. Daily Inspiration (daily_quote)
                // 4. Today's Goals (todays_goals)
                // 5. Coach/Progress (accountability_coach)

                const defaultOrder = ['morning_practice', 'daily_quote', 'todays_goals'];
                let displayOrder = (user?.dashboardOrder && user.dashboardOrder.length > 0) ? [...user.dashboardOrder] : [...defaultOrder];
                // Remove legacy features that shouldn't live on Home full-time
                displayOrder = displayOrder.filter((id) => id !== 'daily_mosaic' && id !== 'quick_routines' && id !== 'future_letter' && id !== 'start_ritual');

                return (
                  <div className="flex flex-col gap-0">

                    {/* Customize Button moved to bottom */}
                    {displayOrder.map((sectionId) => (
                      <div key={sectionId} id={`${sectionId}-section`} className="relative">


                        {sectionId === 'morning_practice' && user && (
                          <div className="mb-6 relative group">
                            {!todaysPriming?.dailyIntention ? (
                              <DailyMorningPracticeWidget
                                userName={user?.name || "Friend"}
                                onComplete={(data) => {
                                  handlePrimingComplete(data);
                                }}
                                onFinish={() => setShowMorningSuccess(true)}
                                onRefresh={() => {
                                  if (!user) return;
                                  const today = new Date();
                                  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                                  const updatedPriming = (user.dailyPriming || []).filter(p => p.date !== todayDate);

                                  const updatedUser = { ...user, dailyPriming: updatedPriming };
                                  updateProfile(updatedUser);
                                  haptics.light();
                                }}
                                isDarkMode={isDarkMode}
                                existingPriming={todaysPriming || null}
                                hideEnergyCheckIn={true}
                                user={user}
                              />
                            ) : (
                              <Suspense fallback={<div className={`w-full h-24 rounded-3xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`} />}>
                                <MorningMessageCard
                                  intention={todaysPriming?.dailyIntention || ""}
                                  message={todaysPriming?.messageOfTheDay || ""}
                                  isDarkMode={isDarkMode}
                                  onRefresh={() => {
                                    if (!user) return;
                                    const today = new Date();
                                    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                                    const updatedPriming = (user.dailyPriming || []).filter(p => p.date !== todayDate);

                                    const updatedUser = { ...user, dailyPriming: updatedPriming };
                                    updateProfile(updatedUser);
                                    haptics.light();
                                  }}
                                />
                              </Suspense>
                            )}
                          </div>
                        )}

                        {/* Evening Practice Injection */}
                        {sectionId === 'daily_quote' && shouldShowEveningMode && user && (
                          <div className="mb-6 animate-fade-in">
                            {(user.dailyEveningPractice || []).find(p => p.date === todayDate) ? (
                              <Suspense fallback={<div className={`w-full h-24 rounded-3xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`} />}>
                                <EveningMessageCard
                                  practice={user.dailyEveningPractice?.find(p => p.date === todayDate) || {
                                    id: 'temp',
                                    date: todayDate,
                                    gratitude: '',
                                    learning: '',
                                    accomplishment: '',
                                    delight: ''
                                  }}
                                  isDarkMode={isDarkMode}
                                  onRefresh={() => {
                                    const updatedPractice = (user.dailyEveningPractice || []).filter(p => p.date !== todayDate);
                                    updateProfile({ ...user, dailyEveningPractice: updatedPractice });
                                    haptics.light();
                                  }}
                                />
                              </Suspense>
                            ) : (
                              <EveningPractice
                                userName={user.name}
                                isDarkMode={isDarkMode}
                                existingPractice={null}
                                onComplete={(data) => {
                                  const today = new Date();
                                  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                                  // Update User Profile
                                  const existingEntries = user.dailyEveningPractice || [];
                                  const otherEntries = existingEntries.filter(p => p.date !== todayDate);

                                  updateProfile({
                                    ...user,
                                    dailyEveningPractice: [...otherEntries, data]
                                  });
                                  triggerConfetti();

                                  // TRIGGER FADE OUT at top
                                  setShowEveningSuccess(true);
                                  setTimeout(() => setShowEveningSuccess(false), 3000);
                                }}
                              />
                            )}
                          </div>
                        )}

                        {sectionId === 'daily_quote' && dailyQuote && (
                          <div className="mb-6">
                            <DashboardQuoteCard
                              quote={dailyQuote}
                              onToggleFavorite={handleToggleFavorite}
                              isFavorited={dailyQuote ? (user?.favoriteQuotes || []).some(q => q.quoteId === dailyQuote.id) : false}
                              isDarkMode={isDarkMode}
                              onRefresh={() => refreshDailyQuote(true)}
                              onOpenSettings={() => setShowReorderModal(true)}
                            />
                          </div>
                        )}

                        {sectionId === 'todays_goals' && (
                          <div className={`p-6 rounded-2xl border mb-6 transition-all duration-500 ease-in-out shadow-lg ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-sage/20'} `}>
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    const newState = !isGoalsExpanded;
                                    setIsGoalsExpanded(newState);
                                    localStorage.setItem(STORAGE_KEYS.GOALS_EXPANDED, JSON.stringify(newState));
                                    haptics.light();
                                  }}
                                  className={`p-1 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-sage/10 text-sage/40'} `}
                                  aria-label={isGoalsExpanded ? "Collapse goals" : "Expand goals"}
                                >
                                  <div className={`transition-transform duration-300 ${isGoalsExpanded ? 'rotate-0' : '-rotate-90'} `}>
                                    <ChevronDown size={20} />
                                  </div>
                                </button>
                                <div>
                                  <h3 className={`text-xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-sage'} `}>
                                    Today's Goals
                                  </h3>
                                </div>
                              </div>
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-pale-gold/60' : 'text-sage/60'} `}>
                                {user?.dailyFocuses?.filter(f => f.isCompleted).length || 0}/{user?.dailyFocuses?.length || 0} <Check size={14} className="inline-block ml-1 opacity-70" />
                              </span>
                            </div>

                            {isGoalsExpanded && (
                              <div className="animate-fade-in">
                                {/* Quick Add Focus Input */}
                                <div className="flex gap-2 mb-6">
                                  <div className="relative flex-1">
                                    <input
                                      type="text"
                                      value={newFocusText}
                                      onChange={(e) => setNewFocusText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAddFocus()}
                                      placeholder="Add a Goal"
                                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-pale-gold/50'
                                        : 'bg-white/60 border-sage/20 text-rich-black placeholder-sage/40 focus:border-sage'
                                        } `}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={toggleFocusDictation}
                                      className={`p-3 rounded-xl transition-all ${isListeningFocus
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-sage/10 text-sage hover:bg-sage/20'
                                        } `}
                                      title="Voice Dictation"
                                    >
                                      <Mic size={14} />
                                    </button>

                                    <button
                                      onClick={handleQuickAddFocus}
                                      disabled={!newFocusText.trim()}
                                      className={`px-4 rounded-xl flex items-center justify-center transition-all ${!newFocusText.trim()
                                        ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400')
                                        : isDarkMode
                                          ? 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90'
                                          : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
                                        } `}
                                    >
                                      <span className="text-xl font-medium">+</span>
                                    </button>
                                  </div>
                                </div>


                                {user?.dailyFocuses && user.dailyFocuses.length > 0 ? (
                                  <>
                                    <div className="space-y-3 mb-6">
                                      {/* Virtual Goal for Morning Practice - REMOVED */}

                                      {(user?.dailyFocuses || []).map((focus) => (
                                        <FocusItem
                                          key={focus.id}
                                          focus={focus}
                                          onToggle={handleToggleGoal}
                                          onDelete={handleDeleteGoal}
                                        />
                                      ))}
                                    </div>

                                    <button
                                      onClick={() => setActiveTab('momentum')}
                                      className={`mt-4 w-full py-3 rounded-xl border border-dashed text-sm font-medium transition-all ${isDarkMode
                                        ? 'border-white/20 text-white/60 hover:bg-white/5 hover:text-white'
                                        : 'border-sage/30 text-sage/70 hover:bg-sage/5 hover:text-sage'
                                        } `}
                                    >
                                      Manage in Journey →
                                    </button>
                                  </>
                                ) : (
                                  <div className={`text-center py-8 px-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-sage/5'}`}>
                                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/20 text-sage'}`}>
                                      <Target size={24} />
                                    </div>
                                    <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                      No goals yet
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-sage-dark/60'}`}>
                                      Tap the + button above to add your first goal
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {sectionId === 'quick_routines' && (
                          <div className="mb-6">
                            <QuickRoutines
                              routines={user?.routines || []}
                              onLaunch={handleLaunchRoutine}
                              onCreate={() => setShowStackWizard(true)}
                              onEdit={setEditingRoutine}
                              onDelete={handleDeleteRoutine}
                              isDarkMode={isDarkMode}
                            />
                          </div>
                        )}

                        {sectionId === 'accountability_coach' && (
                          <div
                            className={`mb-6 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all backdrop-blur-xl ${isDarkMode
                              ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                              : 'bg-white hover:bg-white/80 border border-sage/10 shadow-sm'
                              }`}
                            onClick={() => setActiveTab('momentum')}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                                <Sparkles size={24} />
                              </div>
                              <div>
                                <h3 className={`font-display font-bold text-lg ${isDarkMode ? 'text-white' : 'text-sage'}`}>Track Your Progress</h3>
                                <div className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                                  Tap to see your progress
                                </div>
                              </div>
                            </div>
                            <div className={`p-2 rounded-full ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}>
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        )}


                      </div>
                    ))}


                    {/* Garden of Growth — scroll-reveal entrance, plants grow upward into frame */}
                    {user && (() => {
                      const pts = user.points || 0;
                      const gardenLevel = pts >= 5000 ? 'Master' : pts >= 1000 ? 'Guide' : pts >= 500 ? 'Seeker' : 'Beginner';
                      const streakText = (user.streak || 0) > 0 ? ` · ${user.streak}-day streak` : '';
                      return (
                        <motion.div
                          className="mt-6 mb-6"
                          initial={{ opacity: 0, y: 60, scale: 0.92 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, amount: 0.1 }}
                          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          {/* Caption header */}
                          <div className="px-1 mb-3 text-center">
                            <p className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-white/80' : 'text-sage-dark'}`}>
                              Your Garden of Growth
                            </p>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/35' : 'text-sage/55'}`}>
                              {gardenLevel} · {pts.toLocaleString()} pts{streakText}
                            </p>
                            <p className={`text-xs mt-2 italic ${isDarkMode ? 'text-white/30' : 'text-sage/40'}`}>
                              Every practice plants something new.
                            </p>
                          </div>
                          <Suspense fallback={null}>
                            <GardenOfGrowth
                              points={pts}
                              streak={user.streak || 0}
                              name={user.name || ''}
                              isDarkMode={isDarkMode}
                            />
                          </Suspense>
                        </motion.div>
                      );
                    })()}

                    {/* Customize Dashboard Button (Moved to bottom) */}
                    <div className="flex justify-center mt-8 mb-4 opacity-50 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShowReorderModal(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-sage/5 text-sage/40 hover:bg-sage/10 hover:text-sage'
                          }`}
                      >
                        <Settings2 size={14} />
                        <span>Customize Layout</span>
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
                      currentOrder={displayOrder}
                      onSave={(newOrder) => {
                        if (user) {
                          // start_ritual is pinned to top mostly, preserve it
                          // If it was in items, we wouldn't need this, but we hide it from reorder list
                          const finalOrder = ['start_ritual', ...newOrder];
                          updateProfile({ ...user, dashboardOrder: finalOrder });
                        }
                      }}
                    />

                  </div>
                );
              })()}

              {/* Future Letter Button removed from homepage scroll as per request */}




            </div>
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
            { id: 'toolkit', icon: Layers, label: 'Practice' },
          ].map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  haptics.selection();
                }}
                className={`tap-zone flex flex-col items-center gap-0.5 md:gap-1 px-2 md:px-4 py-2 rounded-full transition-all duration-300 ${activeTab === tab.id
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
            settings={user.coachSettings || { nudgeFrequency: 'every-2-hours', nudgeEnabled: false }}
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
