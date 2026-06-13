import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { STORAGE_KEYS, SESSION_KEYS } from './constants/storageKeys';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { InAppReview } from '@capacitor-community/in-app-review';

import { PageTransition } from './components/PageTransition';
import { UserProvider, useUser } from './contexts/UserContext';


import { getAIQuote, pickAndMarkQuote } from './utils/quoteMatcher';
import { generateUserNarrative, generateWeeklyReflection, generatePalanteQuote } from './utils/aiService';
import { analytics, identifyUser } from './utils/analytics';
import { AFFIRMATIONS } from './data/affirmations';
import type { UserProfile, Quote, DailyFocus, JournalEntry, ActivityType, ContentType, QuoteSource, SoundMix, PrimaryIntent } from './types';
import { haptics } from './utils/haptics';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { useNotifications } from './hooks/useNotifications';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAppProcess } from './hooks/useAppProcess';
import { triggerConfetti } from './utils/CelebrationEffects';
import { WidgetDataSync } from './utils/widgetDataSync';
import { DebugErrorBoundary } from './components/DebugErrorBoundary';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Settings2, RotateCcw } from 'lucide-react';
import { computeWeeklyHighlights } from './utils/weeklyHighlights';
import { generateWeeklyLetter, isSunday, letterIsStale, getISOWeekNumber } from './utils/weeklyLetter';
import type { EssentialToolId } from './components/HomeEssentialTools';
import type { RingCeremonyType } from './components/RingCeremony';
import type { GrowthStoryData } from './utils/aiService';
import type { YearForwardData } from './utils/yearForward';
import { Logo } from './components/Logo';
import {
  Home, TrendingUp, User as UserIcon, Moon, Sun,
  Music, MessageCircle, Bell, ChevronDown, Check,
  Target, Sparkles, ChevronRight, Fish, Mic, Layers, Heart,
  CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CoachSettings, WeeklyReport, CoachIntervention, DailyPriming, CoachSession, CoachPillar } from './types';
import { SCIENCE_FACTS, type ScienceFact } from './data/scienceFacts';
import { generateDailyDispatch, generateRecoveryDispatch, intentToTone } from './utils/dailyDispatch';
import { isReviewerEmail, REVIEWER_DISPATCH_OFFSETS_MIN } from './constants/reviewer';
import { getMomentumState } from './utils/aiService';
import { api } from './lib/api';
import { logPractice, checkMilestone, migrateStreakToPractice } from './utils/practiceUtils';
import { useModalState } from './hooks/useModalState';
import { getTodayDate, getDaysDifference } from './utils/practiceUtils';
import { useTimeOfDay } from './hooks/useTimeOfDay';

// All non-startup components lazy-loaded to reduce initial memory footprint
const Momentum = lazy(() => import('./components/Momentum').then(m => ({ default: m.Momentum })));
const Breathing = lazy(() => import('./components/Breathing').then(m => ({ default: m.Breathing })));
const Meditation = lazy(() => import('./components/Meditation').then(m => ({ default: m.Meditation })));
const Profile = lazy(() => import('./components/Profile').then(m => ({ default: m.Profile })));
const WeeklyReportModal = lazy(() => import('./components/WeeklyReportModal').then(m => ({ default: m.WeeklyReportModal })));
const WelcomeOrientationModal = lazy(() => import('./components/WelcomeOrientationModal').then(m => ({ default: m.WelcomeOrientationModal })));
const MorningPractice = lazy(() => import('./components/MorningPractice').then(m => ({ default: m.MorningPractice })));
const KoiPond = lazy(() => import('./components/KoiPond').then(m => ({ default: m.KoiPond })));
const DidYouKnowModal = lazy(() => import('./components/DidYouKnowModal').then(m => ({ default: m.DidYouKnowModal })));
const CinematicIntro = lazy(() => import('./components/CinematicIntro').then(m => ({ default: m.CinematicIntro })));
const MorningMessageCard = lazy(() => import('./components/MorningMessageCard').then(m => ({ default: m.MorningMessageCard })));
const EveningMessageCard = lazy(() => import('./components/EveningMessageCard').then(m => ({ default: m.EveningMessageCard })));
const GardenLegendModal = lazy(() => import('./components/GardenLegendModal').then(m => ({ default: m.GardenLegendModal })));
const DashboardQuoteCard = lazy(() => import('./components/DashboardQuoteCard').then(m => ({ default: m.DashboardQuoteCard })));
const PostPracticeSetupModal = lazy(() => import('./components/PostPracticeSetupModal').then(m => ({ default: m.PostPracticeSetupModal })));
const NotificationAskModal = lazy(() => import('./components/NotificationAskModal').then(m => ({ default: m.NotificationAskModal })));
const AgeVerificationModal = lazy(() => import('./components/AgeVerificationModal').then(m => ({ default: m.AgeVerificationModal })));
const CelebrationModal = lazy(() => import('./components/CelebrationModal').then(m => ({ default: m.CelebrationModal })));
const DisclaimerModal = lazy(() => import('./components/DisclaimerModal').then(m => ({ default: m.DisclaimerModal })));
const HistoryModal = lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const SoundMixer = lazy(() => import('./components/SoundMixer'));
const EveningPractice = lazy(() => import('./components/EveningPractice').then(m => ({ default: m.EveningPractice })));
const PaywallScreen = lazy(() => import('./components/PaywallScreen').then(m => ({ default: m.PaywallScreen })));
const GardenMandala = lazy(() => import('./components/GardenDemoFinal').then(m => ({ default: m.GardenDemoFinal })));
const FocusTimer = lazy(() => import('./components/FocusTimer').then(m => ({ default: m.FocusTimer })));
const HomeEssentialTools = lazy(() => import('./components/HomeEssentialTools').then(m => ({ default: m.HomeEssentialTools })));
const CoachView = lazy(() => import('./components/CoachView').then(m => ({ default: m.CoachView })));
const WeeklyHighlightsModal = lazy(() => import('./components/WeeklyHighlightsModal').then(m => ({ default: m.WeeklyHighlightsModal })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const PracticeView = lazy(() => import('./components/PracticeView').then(m => ({ default: m.PracticeView })));
const FocusItem = lazy(() => import('./components/FocusItem').then(m => ({ default: m.FocusItem })));
const DailyMorningPracticeWidget = lazy(() => import('./components/DailyMorningPracticeWidget').then(m => ({ default: m.DailyMorningPracticeWidget })));
const CoachSettingsModal = lazy(() => import('./components/CoachSettingsModal').then(m => ({ default: m.CoachSettingsModal })));
const MilestoneCelebration = lazy(() => import('./components/MilestoneCelebration').then(m => ({ default: m.MilestoneCelebration })));
const RingCeremony = lazy(() => import('./components/RingCeremony').then(m => ({ default: m.RingCeremony })));
const GrowthStoryModal = lazy(() => import('./components/GrowthStoryModal').then(m => ({ default: m.GrowthStoryModal })));
const YearForwardModal = lazy(() => import('./components/YearForwardModal').then(m => ({ default: m.YearForwardModal })));
const CoachInterventionCard = lazy(() => import('./components/CoachInterventionCard').then(m => ({ default: m.CoachInterventionCard })));
const SlideUpModal = lazy(() => import('./components/SlideUpModal').then(m => ({ default: m.SlideUpModal })));
const ProfileCompletionCard = lazy(() => import('./components/ProfileCompletionCard').then(m => ({ default: m.ProfileCompletionCard })));
const RestDayModal = lazy(() => import('./components/RestDayModal').then(m => ({ default: m.RestDayModal })));
const MorningModeOverlay = lazy(() => import('./components/MorningModeOverlay').then(m => ({ default: m.MorningModeOverlay })));
const CoachGuidanceModal = lazy(() => import('./components/CoachGuidanceModal').then(m => ({ default: m.CoachGuidanceModal })));
const LetterWriteModal = lazy(() => import('./components/LetterWriteModal').then(m => ({ default: m.LetterWriteModal })));
const LetterReadModal = lazy(() => import('./components/LetterReadModal').then(m => ({ default: m.LetterReadModal })));
const ShareModal = lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
import type { FutureLetter } from './types';
import { useTheme } from './contexts/ThemeContext';


function AppContent() {

  const { loading: authLoading, user: authUser } = useAuth();
  const { user, loading: userLoading, updateProfile, logActivity, saveReflection, toggleFavorite } = useUser();
  const { isPro, isLoading: subLoading, isTrialing, trialDaysRemaining } = useSubscription();
  // const [user, setUser] = useState<UserProfile | null>(null); -> Removed

  const [activeTab, setActiveTab] = useState<'home' | 'momentum' | 'toolkit' | 'breath' | 'meditate' | 'coach' | 'focus' | 'soundscapes'>('home');
  // Tracks where the user was before entering a full-screen practice overlay, so onExit returns them there
  const practiceOriginRef = useRef<typeof activeTab>('home');


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
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const {
    showProfile, setShowProfile, showKoiPond, setShowKoiPond,
    showHistory, setShowHistory,
    showWelcome, setShowWelcome,
    showSoundMixer, setShowSoundMixer, mixerSource, setMixerSource,
    showMorningPractice, setShowMorningPractice,
    showStackWizard, setShowStackWizard,
    showMorningMode, setShowMorningMode,
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

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  // Weekly Highlights: badge signal vs. modal open are separate
  const [showWeeklyHighlights, setShowWeeklyHighlights] = useState(false); // Journey tab badge
  const [showWeeklyHighlightsModal, setShowWeeklyHighlightsModal] = useState(false); // modal (user-triggered via Journey tab)
  const [weeklyLetterText, setWeeklyLetterText] = useState<string>('');
  const [weeklyAccomplishments, setWeeklyAccomplishments] = useState<{ text: string; date: string }[]>([]);
  const [weeklyReflectionMessage, setWeeklyReflectionMessage] = useState('');

  // Time-based UI modes
  const { shouldShowMorningMode, shouldShowEveningMode, hour, timeOfDay } = useTimeOfDay();

  // Transient Success States for Practices
  const [showMorningSuccess, setShowMorningSuccess] = useState(false);
  const [showEveningSuccess, setShowEveningSuccess] = useState(false);
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState(false);
  const dismissFirstTimeWelcome = () => {
    localStorage.setItem(STORAGE_KEYS.WELCOME_SHOWN, 'true');
    setShowFirstTimeWelcome(false);
    // The first-run tail is now just the welcome letter. Interests setup moved to a dismissible
    // home card; the notification ask waits until a return session. Returning users who already
    // finished interests still get the lightweight profile nudge.
    if (localStorage.getItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN)
        && !localStorage.getItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED)) {
      setTimeout(() => setShowProfileNudge(true), 800);
    }
  };
  const [eveningSkipped, setEveningSkipped] = useState(false);
  const [showEveningPracticeInline, setShowEveningPracticeInline] = useState(false);

  // Dev unlock: triple-tap the greeting on the home screen to force evening mode any hour.
  // Resets on app launch so there's nothing to clean up before shipping.
  const [forcedEvening, setForcedEvening] = useState(false);
  const greetingTapsRef = useRef<{ count: number; firstTapAt: number }>({ count: 0, firstTapAt: 0 });
  const lastSeenDateRef = useRef(getTodayDate());
  const handleGreetingTap = useCallback(() => {
    const now = Date.now();
    const TRIPLE_TAP_WINDOW_MS = 700;
    if (now - greetingTapsRef.current.firstTapAt > TRIPLE_TAP_WINDOW_MS) {
      greetingTapsRef.current = { count: 1, firstTapAt: now };
    } else {
      greetingTapsRef.current.count += 1;
    }
    if (greetingTapsRef.current.count >= 3) {
      greetingTapsRef.current = { count: 0, firstTapAt: 0 };
      haptics.heavy();
      setForcedEvening(prev => !prev);
    }
  }, []);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [gardenAffirmation, setGardenAffirmation] = useState<string | null>(null);
  const [gardenAffirmationLoading, setGardenAffirmationLoading] = useState(false);
  const [gardenAffirmationRefreshCount, setGardenAffirmationRefreshCount] = useState(0);
  const [showTodayStory, setShowTodayStory] = useState(false);
  const [showGardenLegend, setShowGardenLegend] = useState(false);
  const [showPostPracticeSetup, setShowPostPracticeSetup] = useState(false);
  const [showNotifAsk, setShowNotifAsk] = useState(false);
  // Interests/content setup — was a blocking first-run modal, now a dismissible home card (opt-in).
  const [showInterestsCard, setShowInterestsCard] = useState(() => !localStorage.getItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN));
  const dismissInterestsCard = () => {
    localStorage.setItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN, 'true');
    setShowInterestsCard(false);
  };
  const [restDayMissedDate, setRestDayMissedDate] = useState<string | null>(null);

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
  const refreshDailyQuote = useCallback((force = false, userOverride?: typeof user) => {
    const activeUser = userOverride ?? user;
    if (!activeUser) return;
    const excludeId = force && dailyQuote ? dailyQuote.id : undefined;

    const saveQuote = (q: ReturnType<typeof pickAndMarkQuote>) => {
      if (!q) return;
      setDailyQuote(q);
      localStorage.setItem(STORAGE_KEYS.DAILY_QUOTE, JSON.stringify(q));
      localStorage.setItem(STORAGE_KEYS.QUOTE_DATE, new Date().toISOString().split('T')[0]);
      if (force) haptics.light();
    };

    // When the user has an active daily intention and prefers AI or mix, generate a
    // personalized affirmation instead of pulling from the static pool.
    const hasDailyIntention = (activeUser.dailyPriming || [])
      .some(p => p.date === new Date().toISOString().split('T')[0] && p.dailyIntention?.trim());
    const wantsAI = activeUser.sourcePreference === 'ai' || activeUser.sourcePreference === 'mix';

    if (force && hasDailyIntention && wantsAI) {
      getAIQuote(activeUser)
        .then(saveQuote)
        .catch((err) => {
          console.warn('[Palante] AI quote failed, using static fallback:', err);
          saveQuote(pickAndMarkQuote(activeUser, excludeId));
        });
      return;
    }

    saveQuote(pickAndMarkQuote(activeUser, excludeId));
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

  // Garden affirmation — generate once per day, anchored in today's actual morning practice content
  const generateGardenAffirmation = useCallback((force = false, practiceOverride?: {
    gratitudes: string[];
    affirmations: string[];
    intention: string;
    commitment?: string;
  }) => {
    if (!user) return;
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
    if (!force) {
      const cachedDate = localStorage.getItem(STORAGE_KEYS.GARDEN_AFFIRMATION_DATE);
      const cached = localStorage.getItem(STORAGE_KEYS.GARDEN_AFFIRMATION);
      if (cachedDate === today && cached) {
        setGardenAffirmation(cached);
        return;
      }
    }
    const todayPriming = ([...(user.dailyMorningPractice || []), ...(user.dailyPriming || [])])
      .find(p => p.date === today);
    const gratitudes = practiceOverride?.gratitudes ?? (todayPriming?.gratitudes || []).filter(Boolean);
    const affirmations = practiceOverride?.affirmations ?? (todayPriming?.affirmations || []).filter(Boolean);
    const intention = practiceOverride?.intention ?? (todayPriming?.dailyIntention?.trim() || '');
    const commitment = practiceOverride?.commitment ?? (todayPriming?.commitment?.trim() || '');

    // Only generate if there's real practice content to anchor to
    if (!gratitudes.length && !affirmations.length && !intention) {
      setGardenAffirmation(null);
      return;
    }

    setGardenAffirmationLoading(true);
    generatePalanteQuote({
      gratitudes,
      affirmations,
      intention,
      commitment: commitment || undefined,
      coachTone: user.coachSettings?.coachTone,
      streak: user.streak || 0,
    })
      .then(text => {
        if (!text) { setGardenAffirmation(null); return; }
        setGardenAffirmation(text);
        localStorage.setItem(STORAGE_KEYS.GARDEN_AFFIRMATION, text);
        localStorage.setItem(STORAGE_KEYS.GARDEN_AFFIRMATION_DATE, today);
      })
      .catch(() => setGardenAffirmation(null))
      .finally(() => setGardenAffirmationLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    generateGardenAffirmation();
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

  // Weekly Highlights — badge on Journey tab, modal shown when user navigates there
  useEffect(() => {
    if (!user) return;
    const trigger = computeWeeklyHighlights(
      user.dailyEveningPractice || [],
      STORAGE_KEYS.WEEKLY_HIGHLIGHTS_SHOWN
    );
    if (trigger.shouldShow) {
      setWeeklyAccomplishments(trigger.accomplishments);
      trigger.markShown();
      setShowWeeklyHighlights(true); // lights up the Journey tab badge
      const firstName = user.name?.split(' ')[0] || 'Friend';
      generateWeeklyReflection(
        trigger.accomplishments.map(a => a.text),
        firstName
      ).then(msg => setWeeklyReflectionMessage(msg)).catch(() => {});
    }

    // Weekly partner letter — generate once per week on Sunday (or first open if stale)
    if (isSunday() && letterIsStale(user)) {
      generateWeeklyLetter(user).then(letter => {
        setWeeklyLetterText(letter);
        updateProfile({ weeklyPartnerLetter: { text: letter, generatedAt: new Date().toISOString(), weekNumber: getISOWeekNumber() } });
      }).catch(() => {});
    } else if (user.weeklyPartnerLetter?.text) {
      setWeeklyLetterText(user.weeklyPartnerLetter.text);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When user taps Journey tab and highlights are waiting, open the modal there
  useEffect(() => {
    if (activeTab !== 'momentum' || !showWeeklyHighlights) return;
    const t = setTimeout(() => setShowWeeklyHighlightsModal(true), 600);
    return () => clearTimeout(t);
  }, [activeTab, showWeeklyHighlights]);

  useEffect(() => {
    if (user?.id) identifyUser(user.id, { name: user.name, profession: user.profession });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // One-time cleanup: earlier onboarding saved the orienting answer as a raw id
  // ("purpose") instead of a label. Relabel any such goals in place. Idempotent —
  // once relabeled the text no longer matches an id, so it won't run again.
  useEffect(() => {
    if (!user?.dailyFocuses?.length) return;
    const ID_TO_LABEL: Record<string, string> = {
      consistency: 'Build consistency',
      clarity: 'Find clarity & focus',
      stress: 'Manage stress',
      purpose: 'Connect to purpose',
    };
    let changed = false;
    const fixed = user.dailyFocuses.map(f => {
      const label = ID_TO_LABEL[(f.text || '').trim()];
      if (label) { changed = true; return { ...f, text: label }; }
      return f;
    });
    if (changed) updateProfile({ ...user, dailyFocuses: fixed });
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
  // Age gate. New users confirm age inside the cinematic intro (after the brand splash),
  // so the standalone modal only covers legacy users who finished the intro before age
  // gating existed (INTRO_SEEN set, AGE_GATE_PASSED missing).
  const [showAgeGate, setShowAgeGate] = useState(() =>
    !!localStorage.getItem(STORAGE_KEYS.INTRO_SEEN) && !localStorage.getItem(STORAGE_KEYS.AGE_GATE_PASSED)
  );

  const handleAgeVerified = (dateOfBirth: string) => {
    localStorage.setItem(STORAGE_KEYS.AGE_GATE_PASSED, dateOfBirth);
    setShowAgeGate(false);
  };

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
    dateOfBirth?: string;
    primaryIntent?: PrimaryIntent;
  }) => {
    analytics.onboardingCompleted({ profession: userData.profession, quoteIntensity: userData.quoteIntensity });

    // 0. Record the age gate from the intro's age step (COPPA — happens before any practice)
    if (userData.dateOfBirth) {
      localStorage.setItem(STORAGE_KEYS.AGE_GATE_PASSED, userData.dateOfBirth);
    }

    // 1. Mark intro as seen FIRST
    localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');
    // 2. Mark vibe as checked (so the legacy modal doesn't pop up)
    localStorage.setItem(STORAGE_KEYS.VIBE_CHECKED, 'true');

    // 3. Hide Intro IMMEDIATELY to prevent re-render loops
    setShowIntroSequence(false);

    // 4. Ensure legacy modals don't show
    setShowDisclaimer(false);

    // 5. Provide immediate feedback
    haptics.success();

    // 6. Create/Update User Profile with all data (AFTER dismissing intro)
    if (user) {
      // Their onboarding answer sets the partner's default voice — unless they've already
      // chosen one explicitly. (intentToTone returns undefined when no intent was picked.)
      const defaultedTone = user.coachSettings?.coachTone ?? intentToTone(userData.primaryIntent) ?? 'nurturing';
      const updatedUser = {
        ...user,
        name: userData.name,
        profession: userData.profession,
        quoteIntensity: userData.quoteIntensity as 1 | 2 | 3,
        contentTypePreference: userData.contentType,
        sourcePreference: userData.sourcePreference,
        ageRange: userData.ageRange as UserProfile['ageRange'],
        dateOfBirth: userData.dateOfBirth ?? user.dateOfBirth,
        ageVerified: userData.dateOfBirth ? true : user.ageVerified,
        primaryIntent: userData.primaryIntent ?? user.primaryIntent,
        coachSettings: {
          nudgeFrequency: user.coachSettings?.nudgeFrequency ?? 'morning-evening',
          nudgeEnabled: user.coachSettings?.nudgeEnabled ?? false,
          tipsEnabled: user.coachSettings?.tipsEnabled,
          partnerTipsEnabled: user.coachSettings?.partnerTipsEnabled,
          waterRemindersEnabled: user.coachSettings?.waterRemindersEnabled,
          lastNudgeTime: user.coachSettings?.lastNudgeTime,
          coachTone: defaultedTone,
        },
        // Add focus goal as first daily focus if provided (already a human label, not a raw id)
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

      try {
        await updateProfile(updatedUser);
      } catch (err) {
        console.error('[Palante] Failed to save onboarding profile:', err);
      }
    }

    // Drop the user directly into their first practice.
    // If they signed up at night, route to the evening practice so the first
    // experience matches the time of day instead of asking them to "set the
    // tone for the day" at 10 PM.
    if (shouldShowEveningMode) {
      setForcedEvening(true);
    } else {
      setShowMorningPractice(true);
    }
  };

  const handlePostPracticeSetupComplete = async (prefs: {
    interests: string[];
    contentType: ContentType;
    sourcePreference: QuoteSource;
  }) => {
    localStorage.setItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN, 'true');
    setShowPostPracticeSetup(false);
    setShowInterestsCard(false);
    if (user) {
      const updatedUser = {
        ...user,
        interests: prefs.interests.length > 0 ? prefs.interests : (user.interests || []),
        contentTypePreference: prefs.contentType,
        sourcePreference: prefs.sourcePreference,
      };
      try {
        await updateProfile(updatedUser);
      } catch (err) {
        console.error('[Palante] Failed to save post-practice preferences:', err);
      }
    }
  };

  const handlePostPracticeSetupSkip = () => {
    localStorage.setItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN, 'true');
    setShowPostPracticeSetup(false);
    setShowInterestsCard(false);
  };

  const handleNotifAskAllow = async () => {
    localStorage.setItem(STORAGE_KEYS.NOTIF_ASK_SEEN, 'true');
    setShowNotifAsk(false);
    try {
      await notifications.updateNudgeConfig({ enabled: true, nudgeFrequency: 'morning-evening' });
    } catch (e) {
      console.error('Notification permission request failed:', e);
    }
  };

  const handleNotifAskSkip = () => {
    localStorage.setItem(STORAGE_KEYS.NOTIF_ASK_SEEN, 'true');
    setShowNotifAsk(false);
  };

  const handleRestDayMarkAsRest = async () => {
    if (!user || !restDayMissedDate) return;
    const updatedRestDays = [...(user.restDays ?? []), restDayMissedDate];
    await updateProfile({ ...user, restDays: updatedRestDays });
    setRestDayMissedDate(null);
  };

  const handleRestDayAcknowledge = () => {
    setRestDayMissedDate(null);
  };

  // Legal Disclaimer Modal - First Launch (Legacy fallback, suppressed by Intro Logic)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (!localStorage.getItem(STORAGE_KEYS.INTRO_SEEN)) return false; // Don't show if Intro is showing
    const acceptance = localStorage.getItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED);
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

  // Ring Ceremony
  const [ringCeremony, setRingCeremony] = useState<{ isOpen: boolean; type: RingCeremonyType }>({
    isOpen: false,
    type: 'ring1',
  });

  // Growth Story (Day 90)
  const [growthStory, setGrowthStory] = useState<{ isOpen: boolean; data: GrowthStoryData | null }>({
    isOpen: false,
    data: null,
  });

  // Your Year, Forward (annual memoir)
  const [yearForward, setYearForward] = useState<{ isOpen: boolean; data: YearForwardData | null }>({
    isOpen: false,
    data: null,
  });

  // Garden streak share modal
  const [gardenShareOpen, setGardenShareOpen] = useState(false);
  const [isGeneratingStreakCard, setIsGeneratingStreakCard] = useState(false);

  // Day 1 share modal — shows beautiful quote card instead of plain text
  const [showDay1ShareModal, setShowDay1ShareModal] = useState(false);
  const [isGeneratingDay1Card, setIsGeneratingDay1Card] = useState(false);

  // Routine Stack Runner

  // Weekly Report
  const [currentWeeklyReport, setCurrentWeeklyReport] = useState<WeeklyReport | null>(null);




  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
    }
  }, [user, showLetterRead, setShowLetterRead]);


  // Request an App Store review at emotionally high moments (ring ceremony, streak milestones).
  // iOS throttles this to ~3 prompts per year, so calling it more often is harmless.
  const requestAppReview = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      InAppReview.requestReview().catch((err) => {
        console.warn('[Palante] In-app review request failed (iOS throttle or unsupported):', err);
      });
    }
  }, []);

  // Ring ceremony — fires once per ring threshold crossing
  useEffect(() => {
    if (!user || ringCeremony.isOpen) return;
    const total = user.practiceData?.totalPractices ?? 0;
    // Use cycle-relative count so ring ceremonies re-fire each 90-day cycle
    const cycleTotal = total > 0 && total % 90 === 0 ? 90 : total % 90;

    const rings: Array<{ threshold: number; type: RingCeremonyType; key: keyof typeof STORAGE_KEYS }> = [
      { threshold: 90, type: 'fullbloom',  key: 'FULLBLOOM_CEREMONY_SHOWN' },
      { threshold: 55, type: 'ring3',      key: 'RING3_CEREMONY_SHOWN' },
      { threshold: 28, type: 'ring2',      key: 'RING2_CEREMONY_SHOWN' },
      { threshold: 10, type: 'ring1',      key: 'RING1_CEREMONY_SHOWN' },
    ];

    for (const ring of rings) {
      if (cycleTotal >= ring.threshold && !localStorage.getItem(STORAGE_KEYS[ring.key])) {
        // Slight delay so the practice completion animation finishes first
        const timer = setTimeout(() => {
          localStorage.setItem(STORAGE_KEYS[ring.key], 'true');
          setRingCeremony({ isOpen: true, type: ring.type });
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.practiceData?.totalPractices]);

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

  // loadNewQuote stub — kept for useAppProcess compatibility (daily quote uses refreshDailyQuote instead)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadNewQuote = useCallback(async (_userProfile: UserProfile) => {
    // no-op: daily quote refresh handled by refreshDailyQuote
  }, []);

  // Notifications Integration
  const notifications = useNotifications();
  const { updateNudgeConfig, cancelEveningLastCall } = notifications;

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





  // PRO-ACTIVE COACH SESSION INITIALIZATION Logic Moved to Line 1082 Area to ensure initialization order



  // Initialize notifications
  useEffect(() => {
    // Only request if user has enabled them in settings (or logic to ask once)
    // requestPermissions();
  }, []);


  // Recovery check — grace day modal (1 missed day) or background nudge (3+ days)
  useEffect(() => {
    if (!user || !user.practiceData?.lastActivityDate) return;
    const checkedToday = sessionStorage.getItem(SESSION_KEYS.REST_DAY_CHECKED);
    if (checkedToday) return;
    sessionStorage.setItem(SESSION_KEYS.REST_DAY_CHECKED, 'true');

    const lastActivity = user.practiceData.lastActivityDate;
    const daysSince = getDaysDifference(lastActivity, getTodayDate());

    if (daysSince === 1 && (user.streak ?? 0) >= 2) {
      // Missed exactly yesterday and has a real streak worth protecting — show grace day modal
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setTimeout(() => setRestDayMissedDate(yesterdayStr), 1200);
    } else if (daysSince >= 3) {
      const lastRecoveryKey = 'palante_last_recovery_nudge';
      if (localStorage.getItem(lastRecoveryKey) !== lastActivity) {
        const firstName = user.name?.split(' ')[0] || 'friend';
        const coachTone = user.coachSettings?.coachTone ?? 'nurturing';
        const recoveryMsg = generateRecoveryDispatch({ firstName, daysMissed: daysSince, tone: coachTone });
        notifications.sendRecoveryNudge(recoveryMsg.body, user.coachName);
        localStorage.setItem(lastRecoveryKey, lastActivity);
      }
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps



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
    }

    setShowWelcome(false);
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
      const name = milestoneMap[milestone] || 'week';
      const earlyToasts: Partial<Record<typeof name, string>> = {
        first: "First practice. Pa'lante.",
        three: "3 practices — you're building something.",
        week:  "7 practices. One week in.",
      };
      if (earlyToasts[name]) {
        triggerConfetti();
        setToastMessage(earlyToasts[name]!);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setShowMilestone({ isOpen: true, milestone: name });
      }
    }

    // After the 3rd practice — invite to write a letter to your future self (earned, once-only)
    if (updatedCount === 3 && (user.futureLetters ?? []).length === 0 && !localStorage.getItem(STORAGE_KEYS.LETTER_PROMPT_SHOWN)) {
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.LETTER_PROMPT_SHOWN, 'true');
        setLetterContext('manual');
        setLetterContextDetails('3 practices in — you\'ve earned this moment');
        setShowLetterWrite(true);
      }, 3500); // after the milestone toast fades
    }

    // Note: PostPracticeSetupModal (interests picker) is now triggered inside
    // dismissFirstTimeWelcome — keeping it sequential with the welcome letter.
    // For users who already saw the welcome letter (returning users), it fires there too.

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

  const handleToggleFavorite = async (quote?: Quote | null) => {
    if (!user || !quote) {
      console.error('Cannot toggle favorite: missing user or quote');
      return;
    }

    const quoteIdStr = String(quote.id);

    const isFavorited = user.favoriteQuotes?.some(fav => String(fav.quoteId) === quoteIdStr) || false;

    // Haptic feedback
    if (!isFavorited) {
      haptics.medium();
      analytics.quoteFavorited({ quoteId: quoteIdStr, author: quote.author });
    } else {
      haptics.light();
    }

    toggleFavorite(quoteIdStr, !isFavorited);
  };

  const handleRemoveFavorite = async (quoteId: string) => {
    toggleFavorite(quoteId, false);
  };

  const handleQuickAction = (id: string) => {
    haptics.selection();
    switch (id) {
      case 'breathe':
      case 'breath':
        practiceOriginRef.current = activeTab;
        setActiveTab('breath');
        break;
      case 'meditate':
      case 'meditation':
        practiceOriginRef.current = activeTab;
        setActiveTab('meditate');
        setToastMessage('Mindfulness Space');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'coach':
        setActiveTab('coach');
        setToastMessage('Palante');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        break;
      case 'focus':
      case 'focus-timer':
      case 'timer':
        practiceOriginRef.current = activeTab;
        setActiveTab('focus');
        setToastMessage('Focus Timer');
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

    // After the very first goal, invite them to set practice partner tone + nudge cadence
    const wasFirstGoal = (user.dailyFocuses || []).length === 0;
    if (wasFirstGoal && !localStorage.getItem('firstGoalCoachSetupSeen')) {
      setTimeout(() => {
        localStorage.setItem('firstGoalCoachSetupSeen', 'true');
        setShowHomeCoachSettings(true);
      }, 1200);
    }

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
        const name = milestoneMap[milestone] || 'week';
        const earlyToasts: Partial<Record<typeof name, string>> = {
          first: "First practice. Pa'lante.",
          three: "3 practices — you're building something.",
          week:  "7 practices. One week in.",
        };
        if (earlyToasts[name]) {
          triggerConfetti();
          setToastMessage(earlyToasts[name]!);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          setShowMilestone({ isOpen: true, milestone: name });
        }
      }
    }

    updateProfile(updatedUser);
  };

  const handlePrimingComplete = (data: DailyPriming) => {
    if (!user) return;

    // Mark that the user has genuinely completed a practice (gates the paywall on next open).
    // Intentionally here — on completion — not on modal close, so abandoners don't get locked out.
    localStorage.setItem(STORAGE_KEYS.APP_USED, 'true');
    setAppUsed(true);
    // Record date of very first practice so the evening prompt is suppressed on Day 1.
    if (!localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE)) {
      localStorage.setItem(STORAGE_KEYS.FIRST_PRACTICE_DATE, new Date().toISOString().split('T')[0]);
    }
    // Guard against the morning ritual re-appearing if the user context is momentarily stale
    // (e.g. React re-render before updateProfile propagates). Cleared automatically each session.
    sessionStorage.setItem(SESSION_KEYS.MORNING_DONE, 'true');

    const today = data.date;
    const existingEntryIndex = (user.dailyPriming || []).findIndex(p => p.date === today);

    const updatedPriming = [...(user.dailyPriming || [])];

    if (existingEntryIndex >= 0) {
      updatedPriming[existingEntryIndex] = {
        ...updatedPriming[existingEntryIndex],
        ...data,
        dailyIntention: data.dailyIntention || updatedPriming[existingEntryIndex].dailyIntention
      };
    } else {
      updatedPriming.push(data);
    }

    // Calculate streak the same way logActivity does — morning priming is the primary
    // daily practice so it must update user.streak, not just practiceData.
    const todayStr = getTodayDate();
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const yesterdayStr = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
    const hadActivityTodayBefore = (user.activityHistory || []).some(log => log.date === todayStr)
        || (user.practiceData?.activityHistory || []).some(a => a.date === todayStr);
    const hadActivityYesterday = (user.activityHistory || []).some(log => log.date === yesterdayStr)
        || (user.practiceData?.activityHistory || []).some(a => a.date === yesterdayStr);
    let newStreak = user.streak || 0;
    if (!hadActivityTodayBefore) {
        newStreak = hadActivityYesterday ? newStreak + 1 : 1;
    }

    const updatedUser: UserProfile = {
      ...user,
      dailyPriming: updatedPriming,
      points: (user.points || 0) + 5,
      streak: newStreak,
      practiceData: logPractice(user.practiceData || migrateStreakToPractice(user), 'morning_priming')
    };
    updateProfile(updatedUser);
    setCompletionIntention(data.dailyIntention?.trim() || '');
    analytics.morningRitualCompleted({ hasIntention: !!data.dailyIntention, mood: data.mood });

    // Queue welcome screen to appear once the success overlay auto-dismisses.
    // Using a ref avoids racing against the auto-dismiss useEffect.
    if (!localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN)) {
      pendingWelcome.current = true;
    } else if (localStorage.getItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN)
        && !localStorage.getItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED)) {
      // Interests setup is now a home card, not a modal — only the lightweight profile nudge remains.
      setTimeout(() => setShowProfileNudge(true), 3200);
    }

    // Fire personalized daily dispatch after morning practice completes.
    // App Store reviewers (matched by auth email) get compressed 1/2/3 minute
    // offsets so the feature can actually be verified during review.
    const firstName = user.name?.split(' ')[0] || 'friend';
    const coachTone = user.coachSettings?.coachTone ?? intentToTone(user.primaryIntent) ?? 'nurturing';
    const momentumState = getMomentumState(user);
    const dispatchMessages = generateDailyDispatch({
      intention: data.dailyIntention,
      gratitudes: data.gratitudes ?? [],
      firstName,
      tone: coachTone,
      momentumState,
      intent: user.primaryIntent,
    });
    const finalDispatch = isReviewerEmail(authUser?.email)
      ? dispatchMessages.map((m, i) => ({
          ...m,
          minutesFromNow: REVIEWER_DISPATCH_OFFSETS_MIN[i] ?? m.minutesFromNow,
        }))
      : dispatchMessages;
    notifications.scheduleDailyDispatch(finalDispatch, user.coachName);

    // Regenerate garden affirmation with fresh practice content — don't use stale cache
    localStorage.removeItem(STORAGE_KEYS.GARDEN_AFFIRMATION);
    localStorage.removeItem(STORAGE_KEYS.GARDEN_AFFIRMATION_DATE);
    setGardenAffirmation(null);
    generateGardenAffirmation(true, {
      gratitudes: (data.gratitudes || []).filter(Boolean),
      affirmations: (data.affirmations || []).filter(Boolean),
      intention: data.dailyIntention?.trim() || '',
      commitment: data.commitment?.trim(),
    });
  };

  // Removed handleSmartRollover - goals now persist until manually deleted

  // Removed handleClearStaleGoals - goals now persist until manually deleted

  // Use LOCAL date to ensure consistency with user's perspective
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todaysPriming = user?.dailyPriming?.find(p => p.date === todayDate);
  // Intention may land in either dailyPriming OR dailyMorningPractice depending on code path
  const todaysIntention =
    todaysPriming?.dailyIntention ||
    (user?.dailyMorningPractice || []).find(p => p.date === todayDate)?.dailyIntention;

  // Suppress the automatic evening prompt on the same day as the user's very first practice
  // so they get time to explore before being pushed into a second session.
  // forcedEvening (night-signup onboarding path) is intentional and still goes through.
  const isFirstPracticeDay = localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE) === todayDate;

  // Morning practice flow: hide header + nav during the full morning ritual
  const [beat1Step, setBeat1Step] = useState<string>('intro');
  const ritualDoneToday = !!todaysIntention || !!sessionStorage.getItem(SESSION_KEYS.MORNING_DONE);
  const isInMorningFlow = !ritualDoneToday && !shouldShowEveningMode && !forcedEvening && !!user && activeTab === 'home';

  // Evening practice flow: hide nav once the user leaves the intro step
  const [eveningStep, setEveningStep] = useState<string>('intro');
  const isInEveningInputFlow = (shouldShowEveningMode || forcedEvening)
    && !!user && activeTab === 'home'
    && eveningStep !== 'intro';

  // Completion moment: captures the intention word right as practice finishes
  const [completionIntention, setCompletionIntention] = useState<string>('');

  // Tracks whether the user has completed at least one practice (gates the paywall)
  const [appUsed, setAppUsed] = useState(() => !!localStorage.getItem(STORAGE_KEYS.APP_USED));

  // Day 1 share card — dismissed via X or after sharing
  const [shareDayOneDismissed, setShareDayOneDismissed] = useState(
    () => !!localStorage.getItem(STORAGE_KEYS.SHARE_DAY1_DISMISSED)
  );
  const dismissShareDayOne = () => {
    localStorage.setItem(STORAGE_KEYS.SHARE_DAY1_DISMISSED, 'true');
    setShareDayOneDismissed(true);
  };

  // Profile nudge — shown once after first practice completes
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const dismissProfileNudge = () => {
    setShowProfileNudge(false);
    localStorage.setItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED, 'true');
  };

  // Sign-in nudge — shown to guest users after 2+ practices so they know their data isn't backed up
  const [showSignInNudge, setShowSignInNudge] = useState(false);
  const dismissSignInNudge = () => {
    setShowSignInNudge(false);
    localStorage.setItem(STORAGE_KEYS.SIGNIN_NUDGE_DISMISSED, 'true');
  };

  // pendingWelcome: set to true in handlePrimingComplete when the welcome screen
  // should appear after the morning success overlay auto-dismisses.
  const pendingWelcome = useRef(false);

  // Auto-dismiss the morning completion overlay after 2.5 s.
  // When it goes away, fire the welcome screen if one is pending.
  useEffect(() => {
    if (showMorningSuccess) {
      const t = setTimeout(() => setShowMorningSuccess(false), 2500);
      return () => clearTimeout(t);
    } else {
      // Overlay just closed — show welcome if queued
      if (pendingWelcome.current) {
        pendingWelcome.current = false;
        setShowFirstTimeWelcome(true);
      }
    }
  }, [showMorningSuccess]);

  // Welcome screen is triggered only from practice completion handlers
  // (handlePrimingComplete / evening onComplete) — never on app open,
  // which caused the welcome overlay to block the morning practice flow.

  // Sign-in nudge: fires once the guest user has 2+ practices and hasn't dismissed it
  useEffect(() => {
    if (authUser) return; // Already signed in — never show
    if (localStorage.getItem(STORAGE_KEYS.SIGNIN_NUDGE_DISMISSED)) return;
    const totalPractices = user?.practiceData?.totalPractices ?? 0;
    const streak = user?.streak ?? 0;
    if (totalPractices >= 2 || streak >= 2) {
      // Delay slightly so it doesn't fight with other nudges on the same render
      const t = setTimeout(() => setShowSignInNudge(true), 2000);
      return () => clearTimeout(t);
    }
  }, [authUser, user?.practiceData?.totalPractices, user?.streak]);

  // Notification permission ask — deferred off the first-practice day to a return session, after
  // the user has had a chance to feel a daily dispatch's value. (Day 1 ends on the welcome letter.)
  const notifAskCheckedRef = useRef(false);
  useEffect(() => {
    if (notifAskCheckedRef.current) return;
    if (!user) return;
    if (localStorage.getItem(STORAGE_KEYS.NOTIF_ASK_SEEN)) return;
    if (notifications.permission === 'granted') return;
    if ((user.practiceData?.totalPractices ?? 0) < 1) return;
    const firstPracticeDate = localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE);
    if (!firstPracticeDate || firstPracticeDate === getTodayDate()) return; // still day 1 — wait
    notifAskCheckedRef.current = true;
    const t = setTimeout(() => setShowNotifAsk(true), 2500);
    return () => clearTimeout(t);
  }, [user?.id, user?.practiceData?.totalPractices]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (user) WidgetDataSync.refreshQuotes(user);
      // Detect day rollover — refresh date-sensitive content when the user returns on a new day
      const today = getTodayDate();
      if (today !== lastSeenDateRef.current) {
        lastSeenDateRef.current = today;
        refreshDailyQuote(false);
        generateGardenAffirmation(false);
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, [user, refreshDailyQuote, generateGardenAffirmation]);



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

  // PAYWALL — show when user has no active subscription AND has already experienced the app.
  // New users get through to their first morning practice before we ask for money.
  if (!isPro && appUsed) {
    const gratitudeCount = (user?.dailyMorningPractice || user?.dailyPriming || [])
      .reduce((n, p) => n + (p.gratitudes?.filter(g => g.trim()).length || 0), 0);
    return (
      <Suspense fallback={null}>
        <PaywallScreen
          firstName={user?.name?.split(' ')[0]}
          practiceCount={user?.practiceData?.totalPractices ?? 0}
          gratitudeCount={gratitudeCount}
          onShowPrivacy={() => navigate('/privacy#privacy')}
          onShowTerms={() => navigate('/privacy')}
        />
      </Suspense>
    );
  }

  // LOGGED IN AND HAS PROFILE -> MAIN APP
  const bgClass = isDarkMode ? 'bg-elevated-dark text-white' : 'bg-ivory text-sage-dark';
  const headerBtnClass = isDarkMode
    ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white backdrop-blur-md'
    : 'bg-white/30 border-sage/10 hover:bg-sage/5 text-sage backdrop-blur-md';
  const navClass = isDarkMode
    ? 'bg-[#415D43]/95 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.30)] backdrop-blur-md'
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
              ? 'Your free trial ends tomorrow — subscribe to keep your practice.'
              : `${trialDaysRemaining} days left in your free trial. Keep going.`}
          </span>
        </div>
      )}

      {/* Evening Wind-Down Overlay (Deep blue dimming) */}
      {shouldShowEveningMode && (
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/10 to-[#0f172a]/30 pointer-events-none z-[45] transition-opacity duration-1000 animate-fade-in backdrop-brightness-90" />
      )}


      {/* ── Background depth system ── */}
      {(() => {
        const isToolTab = ['focus', 'toolkit', 'meditate'].includes(activeTab);
        if (isToolTab) {
          return (
            <>
              {/* Tool pages: same Target rings as Sonic Canvas */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <Target
                  className="absolute top-0 right-0 w-[110vmin] h-[110vmin] translate-x-1/2 -translate-y-1/2 text-[#E8E2D9] opacity-[0.075]"
                />
                <Target
                  className="absolute bottom-0 left-0 w-[90vmin] h-[90vmin] -translate-x-1/2 translate-y-1/2 text-pale-gold opacity-[0.075]"
                />
              </div>
            </>
          );
        }
        return isDarkMode ? (
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
              background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,106,58,0.12) 0%, transparent 70%)',
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
        );
      })()}


{/* Floating Header - Centered & Compact */}
      <header
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        className={`fixed left-0 right-0 z-50 px-8 pb-3 flex flex-col items-center gap-2 transition-all duration-300 ${isNavVisible && !isInMorningFlow && activeTab !== 'breath' ? 'top-0 opacity-100' : '-top-40 opacity-0'} `}
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
          <div className="relative">
            <button
              onClick={() => setShowProfile(true)}
              className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 ${headerBtnClass} `}
              title="Settings"
            >
              <UserIcon size={16} />
            </button>
            {user && (
              !user.profession ||
              (!user.name || user.name === 'Friend') ||
              (!user.interests?.length && !user.goals?.length && !user.dailyFocuses?.length)
            ) && !showProfile && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#C96A3A] border-2 border-white pointer-events-none" />
            )}
          </div>

          {/* 2. Koi Pond (Was Theme) */}
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





        </div>
      </header>


      {/* Main Content - Full Screen Sections */}
      <main
        className={`relative z-20 ${isInMorningFlow ? '' : 'pb-40'}`}
        style={{ paddingTop: isInMorningFlow ? 0 : 'calc(env(safe-area-inset-top) + 8.5rem)' }}
      >
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
            const eveningDoneToday = !!(user?.dailyEveningPractice || []).find(p => p.date === todayDate);
            const rawFirst = (user?.name || 'Friend').split(' ')[0];
            const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

            // ── BEAT 1 · MORNING ARRIVAL ────────────────────────────────────────
            if (!ritualDoneToday && !shouldShowEveningMode && !forcedEvening && user) {
              const timeGreeting = hour < 12 ? `Good morning, ${firstName}.` : `Good afternoon, ${firstName}.`;
              const timeSub = hour < 12 ? "Keep moving forward." : 'A moment for yourself.';
              const isIntroStep = beat1Step === 'intro';
              const isMessageStep = beat1Step === 'message';

              // ── Single container — widget never unmounts ──────────────────────────
              // Two-branch layouts caused React to unmount/remount the widget on every
              // step transition, resetting local state and snapping back to 'intro'.
              // One container with changing CSS properties avoids that entirely.
              // isCentered = intro or message step.
              // overflow:hidden on those steps lets justifyContent:center work
              // without the overflow-y:auto conflict that plagued earlier builds.
              const isCentered = isIntroStep || isMessageStep;
              return (
                <div
                  className="flex flex-col px-6 max-w-md mx-auto"
                  style={{
                    height: '100dvh',
                    overflowY: isCentered ? 'hidden' : 'auto',
                    // Center ALL children as a group on intro/message steps.
                    // flex-start for scroll steps — content stacks from top.
                    justifyContent: isCentered ? 'center' : 'flex-start',
                    paddingTop: isCentered
                      ? 'calc(env(safe-area-inset-top) + 1.5rem)'
                      : 'calc(env(safe-area-inset-top) + 3.5rem)',
                    paddingBottom: isCentered
                      ? 'calc(4.5rem + env(safe-area-inset-bottom))'
                      : 'calc(6rem + env(safe-area-inset-bottom))',
                  }}
                >
                  {/* Greeting — false-renders when not intro, keeping widget at stable DOM position */}
                  {isIntroStep && (
                    <div className="w-full mb-5 text-center animate-fade-in-slow">
                      <h1
                        onClick={handleGreetingTap}
                        className={`text-3xl font-display font-medium tracking-tight mb-1.5 cursor-default select-none ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}
                      >
                        {timeGreeting}
                      </h1>
                      <p className={`text-base font-sans ${isDarkMode ? 'text-white' : 'text-sage/55'}`}>{timeSub}</p>
                    </div>
                  )}

                  {/* Widget — always position 1. React never unmounts it across step transitions. */}
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
                      onStepChange={setBeat1Step}
                    />
                  </div>

                  {/* Evening shortcut — false-renders when not applicable */}
                  {hour >= 18 && !eveningDoneToday && isIntroStep && (
                    <button
                      onClick={() => { haptics.light(); setForcedEvening(true); }}
                      className={`mt-6 w-full py-3 text-center text-sm font-medium transition-colors ${isDarkMode ? 'text-white hover:text-white/50' : 'text-sage/35 hover:text-sage/60'}`}
                    >
                      Close the day instead →
                    </button>
                  )}
                </div>
              );
            }

            // ── BEAT 1 · EVENING ARRIVAL ────────────────────────────────────────
            // On Day 1, shouldShowEveningMode is suppressed so new users can explore.
            // forcedEvening (night-signup onboarding) bypasses this — it's intentional.
            if (((shouldShowEveningMode && !isFirstPracticeDay) || forcedEvening) && !eveningDoneToday && !eveningSkipped && user) {
              return (
                <div
                  className="flex flex-col px-6 max-w-md mx-auto overflow-y-auto"
                  style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
                >
                  <div className="w-full">
                    <EveningPractice
                      userName={user.name}
                      coachName={user.coachName}
                      isDarkMode={isDarkMode}
                      existingPractice={null}
                      userVoiceProfile={user.userVoiceProfile}
                      todayMorningCommitment={
                        (user.dailyMorningPractice || []).find(p => p.date === todayDate)?.commitment
                      }
                      todayMorningIntention={
                        (user.dailyMorningPractice || []).find(p => p.date === todayDate)?.dailyIntention
                      }
                      onStepChange={setEveningStep}
                      onComplete={(data) => {
                        if (!localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE)) {
                          localStorage.setItem(STORAGE_KEYS.FIRST_PRACTICE_DATE, new Date().toISOString().split('T')[0]);
                        }
                        const existingEntries = user.dailyEveningPractice || [];
                        const otherEntries = existingEntries.filter(p => p.date !== todayDate);
                        updateProfile({ ...user, dailyEveningPractice: [...otherEntries, data] });
                        analytics.eveningPracticeCompleted({ gratitudeCount: data.gratitude?.length ?? 0 });
                        // Cancel tonight's last-call notification — they finished the practice
                        cancelEveningLastCall();
                        triggerConfetti();
                        setShowEveningSuccess(true);
                        setTimeout(() => setShowEveningSuccess(false), 3000);
                        // Queue welcome to fire after the evening success overlay fades.
                        if (!localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN)) {
                          setTimeout(() => {
                            setShowEveningSuccess(false);
                            setShowFirstTimeWelcome(true);
                          }, 2500);
                        } else if (!localStorage.getItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED)) {
                          setTimeout(() => setShowProfileNudge(true), 3500);
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setEveningSkipped(true)}
                    className={`w-full py-4 text-center text-sm font-medium transition-colors mt-4 ${isDarkMode ? 'text-white hover:text-white/50' : 'text-sage/30 hover:text-sage/60'}`}
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
            const lastCoachData = (() => {
              try {
                const raw = localStorage.getItem(STORAGE_KEYS.COACH_SESSIONS);
                const sessions: CoachSession[] = raw ? JSON.parse(raw) : [];
                if (!sessions.length) return null;
                const latest = sessions.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
                const lastMsg = [...latest.messages].reverse().find(m => m.role === 'assistant');
                if (!lastMsg) return null;
                const sentence = lastMsg.text.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim() ?? lastMsg.text.slice(0, 90);
                const diff = Date.now() - latest.updatedAt;
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                const recency = hours < 1 ? 'Just now' : hours < 24 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? `${days} days ago` : `${Math.floor(days / 7)}w ago`;
                const pillarLabelMap: Record<CoachPillar, string> = { anxiety: 'Anxiety', focus: 'Focus', motivation: 'Motivation', setbacks: 'Setbacks', open: 'General' };
                const pillarLabel = pillarLabelMap[latest.pillar] ?? '';
                return { sentence, recency, pillarLabel };
              } catch {
                return null;
              }
            })();
            const coachLine = activeInterventions[0]?.message
              ?? lastCoachData?.sentence
              ?? (todaysPriming?.commitment?.trim() ? `"${todaysPriming.commitment.trim()}"` : null)
              ?? 'Ask me anything — I\'m here.';

            return (
              <div className="min-h-screen px-6 pb-12 max-w-md mx-auto">

                {/* ── Greeting ─────────────────────────────── */}
                <motion.div
                  className="w-full mt-6 mb-5 text-center"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className={`text-4xl font-display font-medium tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                    {getGreeting()}, {firstName}.
                  </h1>
                  <p className={`text-base font-sans ${isDarkMode ? 'text-white' : 'text-sage/50'}`}>
                    {ritualDoneToday && todaysIntention
                      ? hour < 17 ? 'Your intention is set. Go live it.' : 'Day almost done. How did your intention hold?'
                      : ritualDoneToday
                        ? 'Practice complete. The day is yours.'
                        : eveningDoneToday
                          ? 'Evening reflection complete.'
                          : hour < 12 ? 'Ready to rise?' : hour < 18 ? 'Ready to flourish?' : 'Ready to unwind?'}
                  </p>
                </motion.div>

                {/* ── Today's Intention ────────────────────── */}
                {ritualDoneToday && todaysIntention && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                  >
                    {/* Intention pill — wraps to 2 lines for longer phrases */}
                    <div className={`rounded-2xl px-5 py-3 flex flex-col gap-1 ${isDarkMode ? 'bg-white/[0.07] border border-white/[0.10]' : 'bg-white border border-[#C96A3A]/15 shadow-sm'}`}>
                      <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-white/60' : 'text-[#C96A3A]'}`}>
                        Today's Intention
                      </p>
                      <p className={`text-sm font-bold leading-snug ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                        {todaysIntention}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Day 1 warm state — only for brand new users ── */}
                {(user?.practiceData?.totalPractices ?? 0) === 0 && !ritualDoneToday && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12 }}
                  >
                    <div
                      className="rounded-2xl px-5 py-5"
                      style={{
                        background: isDarkMode
                          ? 'linear-gradient(135deg, rgba(201,106,58,0.22) 0%, rgba(65,93,67,0.55) 100%)'
                          : 'linear-gradient(135deg, #FAF7F3 0%, rgba(201,106,58,0.12) 100%)',
                        border: isDarkMode ? '1px solid rgba(201,106,58,0.35)' : '1px solid rgba(201,106,58,0.28)',
                        boxShadow: isDarkMode ? 'none' : '0 2px 12px rgba(201,106,58,0.08)',
                      }}
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] mb-1" style={{ color: '#C96A3A' }}>
                        Day 1
                      </p>
                      <p className={`text-base font-bold mb-1 leading-snug ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                        Your garden is ready to grow.
                      </p>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                        Start your first morning practice — everything begins there.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Share Day 1 card — shown once after first practice ── */}
                <AnimatePresence>
                  {(user?.practiceData?.totalPractices ?? 0) === 1
                    && !shareDayOneDismissed && (
                    <motion.div
                      key="share-day1"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isDarkMode ? 'bg-white/[0.06] border border-white/[0.10]' : 'bg-white border border-[#C96A3A]/12 shadow-sm'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Day 1 done.
                          </p>
                          <p className={`text-xs leading-snug ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                            Someone you know might need this too.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              haptics.light();
                              setShowDay1ShareModal(true);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                            style={{ background: '#C96A3A' }}
                          >
                            Share →
                          </button>
                          <button
                            onClick={() => {
                              dismissShareDayOne();
                              haptics.light();
                            }}
                            className={`text-xs p-1 ${isDarkMode ? 'text-white/40' : 'text-sage/40'}`}
                            aria-label="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Profile completion nudge (after first practice) ── */}
                <AnimatePresence>
                  {showProfileNudge && (
                    <motion.div
                      key="profile-nudge"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isDarkMode ? 'bg-white/[0.06] border border-white/[0.10]' : 'bg-white border border-[#C96A3A]/10 shadow-sm'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Make it yours
                          </p>
                          <p className={`text-xs leading-snug ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                            Tell Palante about yourself so every message fits exactly where you are.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { dismissProfileNudge(); setShowProfile(true); }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                            style={{ background: '#C96A3A' }}
                          >
                            Set up →
                          </button>
                          <button
                            onClick={dismissProfileNudge}
                            className={`text-xs p-1 ${isDarkMode ? 'text-white' : 'text-sage'}`}
                            aria-label="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Personalize-your-content card — replaces the old first-run interests modal ── */}
                <AnimatePresence>
                  {showInterestsCard && user && (user.practiceData?.totalPractices ?? 0) >= 1 && (
                    <motion.div
                      key="interests-card"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isDarkMode ? 'bg-white/[0.06] border border-white/[0.10]' : 'bg-white border border-[#C96A3A]/10 shadow-sm'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                            Make your content fit
                          </p>
                          <p className={`text-xs leading-snug ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                            Tell Palante what you're into and your daily words will follow.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { haptics.light(); setShowPostPracticeSetup(true); }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                            style={{ background: '#C96A3A' }}
                          >
                            Personalize →
                          </button>
                          <button
                            onClick={dismissInterestsCard}
                            className={`text-xs p-1 ${isDarkMode ? 'text-white' : 'text-sage'}`}
                            aria-label="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Profile completion card — persistent until 90% complete or dismissed 3x ── */}
                {user && (user.practiceData?.totalPractices ?? 0) >= 1 && (
                  <Suspense fallback={null}>
                    <ProfileCompletionCard
                      user={user}
                      isDarkMode={isDarkMode}
                      onOpenProfile={() => { haptics.light(); setShowProfile(true); }}
                    />
                  </Suspense>
                )}

                {/* ── Sign-in nudge — shown after 2+ sessions with no account ── */}
                <AnimatePresence>
                  {showSignInNudge && user && (
                    <motion.div
                      key="signin-nudge"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`rounded-2xl px-5 py-4 border ${isDarkMode ? 'bg-terracotta-500/15 border-terracotta-500/30' : 'bg-[#C96A3A]/8 border-[#C96A3A]/20 shadow-sm'}`}>
                        <div className="flex items-start gap-3">
                          <div className="text-[#C96A3A] mt-0.5 shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                              Your progress isn't backed up yet
                            </p>
                            <p className={`text-xs leading-snug mb-3 ${isDarkMode ? 'text-white/70' : 'text-sage/70'}`}>
                              You've built {user.practiceData?.totalPractices ?? 0} practice{(user.practiceData?.totalPractices ?? 0) !== 1 ? 's' : ''}{user.streak > 0 ? ` and a ${user.streak}-day streak` : ''}. Create a free account to keep it safe across devices — your settings and history come with you.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { dismissSignInNudge(); setShowProfile(true); }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                                style={{ background: '#C96A3A' }}
                              >
                                Protect my progress →
                              </button>
                              <button
                                onClick={dismissSignInNudge}
                                className={`text-xs px-3 py-2 rounded-xl ${isDarkMode ? 'text-white/50 hover:text-white/80' : 'text-sage/50 hover:text-sage/80'}`}
                              >
                                Maybe later
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Mandala of Growth ─────────────────────── */}
                {user && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="flex flex-col items-center px-1 mb-2 gap-0.5">
                      <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-sage/50'}`}>
                        Mandala of Growth
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-white' : 'text-sage/40'}`}>
                        {(() => { const t = user.practiceData?.totalPractices || 0; return t > 0 && t % 90 === 0 ? 90 : t % 90; })()} of 90 practices completed
                      </p>
                    </div>
                    <div id="garden-share-capture">
                      <GardenMandala
                        isDarkMode={isDarkMode}
                        completedDays={(() => { const t = user.practiceData?.totalPractices || 0; return t > 0 && t % 90 === 0 ? 90 : t % 90; })()}
                        colorCycle={user.mandalaColorCycle ?? 0}
                        onShare={(user.practiceData?.totalPractices ?? 0) >= 1
                          ? () => { haptics.light(); setGardenShareOpen(true); }
                          : undefined}
                      />
                    </div>
                    {/* First-time tooltip — shown until 3rd practice */}
                    {(user.practiceData?.totalPractices ?? 0) < 3 && (
                      <p className={`text-sm text-center mt-3 leading-relaxed px-4 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                        Each practice blooms a petal.<br />90 practices to full bloom.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* ── Message of the Day ────────────────────── */}
                {(() => {
                  const todayMessage =
                    (user?.dailyMorningPractice || []).find(p => p.date === todayDate)?.messageOfTheDay ||
                    (user?.dailyPriming || []).find(p => p.date === todayDate)?.messageOfTheDay;
                  return todayMessage ? (
                  <motion.div
                    className="mb-5 relative"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Suspense fallback={<div className={`rounded-[2rem] h-20 animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/8'}`} />}>
                      <DashboardQuoteCard
                        quote={{
                          id: `message-of-day-${todayDate}`,
                          text: todayMessage,
                          author: user?.coachName || 'Palante',
                          intensity: (user?.quoteIntensity as 1 | 2 | 3) || 2,
                          category: 'morning-practice',
                          isAI: true,
                          isAffirmation: true,
                        }}
                        isDarkMode={isDarkMode}
                      />
                    </Suspense>
                  </motion.div>
                  ) : null;
                })()}

                {/* ── Today's Goals ────────────────────────── */}
                {user && !hasAnyGoals && (
                  <motion.div
                    className={`mb-5 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-sage/15 shadow-sm'}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                  >
                    <div className="px-5 pt-5 pb-2">
                      <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-white' : 'text-sage/60'}`}>
                        Today's Goals
                      </h3>
                      <p className={`text-xs mb-4 ${isDarkMode ? 'text-white' : 'text-sage/40'}`}>
                        What's one thing you want to accomplish today?
                      </p>
                    </div>
                    <div className={`flex gap-2 px-5 pb-5 ${isDarkMode ? '' : ''}`}>
                      <input
                        type="text"
                        value={newFocusText}
                        onChange={(e) => setNewFocusText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddFocus()}
                        placeholder="Add your first goal…"
                        style={{ fontSize: '16px' }}
                        className={`flex-1 py-2.5 px-3 rounded-xl outline-none transition-all ${
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
                {user && hasAnyGoals && (
                  <motion.div
                    className={`mb-5 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-sage/15 shadow-sm'}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-3">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-sage/60'}`}>
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

                    {/* Goal list — capped at 3 */}
                    <div className="px-5 pb-3 space-y-2">
                      {(user.dailyFocuses || []).slice(0, goalsExpanded ? undefined : 3).map((focus) => (
                        <FocusItem
                          key={focus.id}
                          focus={focus}
                          onToggle={handleToggleGoal}
                          onDelete={handleDeleteGoal}
                        />
                      ))}
                      {(user.dailyFocuses || []).length > 3 && !goalsExpanded && (
                        <button
                          onClick={() => setGoalsExpanded(true)}
                          className={`w-full py-1.5 text-xs font-medium transition-colors ${isDarkMode ? 'text-white hover:text-white/50' : 'text-sage/40 hover:text-sage/60'}`}
                        >
                          {(user.dailyFocuses || []).length - 3} more…
                        </button>
                      )}
                    </div>

                    {/* Quick add */}
                    <div className={`flex gap-2 px-5 pb-4 pt-1 border-t ${isDarkMode ? 'border-white/5' : 'border-sage/8'}`}>
                      <input
                        type="text"
                        value={newFocusText}
                        onChange={(e) => setNewFocusText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddFocus()}
                        placeholder="Add another goal…"
                        style={{ fontSize: '16px' }}
                        className={`flex-1 py-2 px-3 rounded-xl outline-none transition-all ${
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


                {/* ── Essential Tools ───────────────────────── */}
                {user && (
                  <HomeEssentialTools
                    isDarkMode={isDarkMode}
                    selectedTools={user.homeEssentialTools}
                    onNavigate={(id: EssentialToolId) => handleQuickAction(id)}
                    onSave={(tools: EssentialToolId[]) => {
                      if (user) updateProfile({ ...user, homeEssentialTools: tools });
                    }}
                  />
                )}

                {/* CUT (Path B): "What's one thing you want to move forward today?" empty-state input.
                    Reason: the morning practice flow now captures this via the "Make it real" commitment
                    beat. Duplicate input on home was redundant and diluted the focus. */}

                {/* CUT (Path B): "Today's Message" collapsible accordion that re-rendered MorningMessageCard
                    and EveningMessageCard. The morning AI message is now elevated to the top affirmation
                    card on the home screen, so re-rendering it inside an accordion is redundant. */}

                {/* ── Redo practice row ─────────────────────── */}
                {(ritualDoneToday || eveningDoneToday) && (
                  <div className="flex gap-2 mb-5">
                    {ritualDoneToday && (
                      <button
                        onClick={() => setShowMorningPractice(true)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/8 text-white hover:text-white/55' : 'bg-sage/5 hover:bg-sage/10 text-sage/40 hover:text-sage/60'}`}
                      >
                        <RotateCcw size={11} />
                        Morning Practice
                      </button>
                    )}
                    {eveningDoneToday && (
                      <button
                        onClick={() => {
                          if (!user) return;
                          const updated = (user.dailyEveningPractice || []).filter(p => p.date !== todayDate);
                          updateProfile({ ...user, dailyEveningPractice: updated });
                          setEveningSkipped(false);
                          setForcedEvening(true);
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/8 text-white hover:text-white/55' : 'bg-sage/5 hover:bg-sage/10 text-sage/40 hover:text-sage/60'}`}
                      >
                        <RotateCcw size={11} />
                        Evening Practice
                      </button>
                    )}
                  </div>
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
                  onOpenKoiPond={() => setShowKoiPond(true)}
                  onWriteLetter={() => {
                    setLetterContext('manual');
                    setLetterContextDetails('');
                    setShowLetterWrite(true);
                  }}
                  onOpenHighlights={() => setShowWeeklyHighlightsModal(true)}
                  highlightsBadge={showWeeklyHighlights}
                  onOpenYearForward={async () => {
                    if (!user) return;
                    haptics.medium();
                    const { buildYearForwardData } = await import('./utils/yearForward');
                    setYearForward({ isOpen: true, data: buildYearForwardData(user) });
                  }}
                />
              </div>
            </PageTransition>
            </ErrorBoundary>
          )}

          {activeTab === 'focus' && (
            <ErrorBoundary name="Focus Timer">
            <PageTransition>
              <div className="min-h-screen max-w-md mx-auto h-full">
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
                  onNavigate={(section) => {
                    if (section === 'soundscapes') {
                      setShowSoundMixer(true);
                    } else {
                      practiceOriginRef.current = activeTab;
                      setActiveTab(section);
                    }
                  }}
                />
              </div>
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
                  setActiveTab(practiceOriginRef.current);
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
                onWriteLetter={() => {
                  setLetterContext('meditation');
                  setLetterContextDetails('meditation session');
                  setShowLetterWrite(true);
                }}
              />
            </PageTransition>
            </ErrorBoundary>
          )}




        </Suspense>

          </motion.div>
        </AnimatePresence>

      </main >

      {/* ── Morning Practice Completion Moment ──────────────────────── */}
      <AnimatePresence>
        {showMorningSuccess && (
          <motion.div
            key="morning-complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
            style={{ background: '#415D43' }}
            onClick={() => setShowMorningSuccess(false)}
          >
            {/* Sacred geometry background */}
            <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
              <g fill="none" stroke="#E5D6A7" strokeWidth="0.65" opacity="0.10">
                <circle cx="195" cy="413" r="148" strokeWidth="0.9" />
                <circle cx="343" cy="413" r="148" />
                <circle cx="269" cy="541" r="148" />
                <circle cx="121" cy="541" r="148" />
                <circle cx="47"  cy="413" r="148" />
                <circle cx="121" cy="285" r="148" />
                <circle cx="269" cy="285" r="148" />
              </g>
            </svg>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-center px-8 relative z-10"
            >
              <p
                className="text-xs font-black uppercase tracking-[0.22em] mb-6"
                style={{ color: 'rgba(229,214,167,0.90)' }}
              >
                Practice complete
              </p>
              {completionIntention && (
                <p
                  className="text-5xl font-display font-bold text-white mb-4 tracking-tight"
                  style={{ textShadow: '0 2px 24px rgba(0,0,0,0.30)' }}
                >
                  {completionIntention}
                </p>
              )}
              <p
                className="text-xl font-display"
                style={{ color: 'rgba(229,214,167,0.80)' }}
              >
                Pa'lante.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── First-Time Welcome Screen ───────────────────────────────────── */}
      <AnimatePresence>
        {showFirstTimeWelcome && (
          <motion.div
            key="first-time-welcome"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[80]"
            style={{ background: '#415D43', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {/* Ornate Flower of Life mandala — pale gold, low opacity, fixed behind content */}
            <svg aria-hidden className="fixed inset-0 w-full h-full pointer-events-none" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style={{ zIndex: 0 }}>
              <g transform="translate(195, 438)" fill="none" stroke="#E5D6A7">
                <g strokeWidth="0.7" opacity="0.10">
                  <circle cx="0"      cy="0"    r="130"/>
                  <circle cx="0"      cy="-130" r="130"/>
                  <circle cx="112.6"  cy="-65"  r="130"/>
                  <circle cx="112.6"  cy="65"   r="130"/>
                  <circle cx="0"      cy="130"  r="130"/>
                  <circle cx="-112.6" cy="65"   r="130"/>
                  <circle cx="-112.6" cy="-65"  r="130"/>
                </g>
                <g strokeWidth="0.5" opacity="0.07">
                  <circle cx="0"      cy="-260" r="130"/>
                  <circle cx="225.2"  cy="-130" r="130"/>
                  <circle cx="225.2"  cy="130"  r="130"/>
                  <circle cx="0"      cy="260"  r="130"/>
                  <circle cx="-225.2" cy="130"  r="130"/>
                  <circle cx="-225.2" cy="-130" r="130"/>
                </g>
                <circle cx="0" cy="0" r="226" strokeWidth="0.5" opacity="0.08"/>
                <circle cx="0" cy="0" r="285" strokeWidth="0.35" strokeDasharray="4 8" opacity="0.06"/>
                <circle cx="0" cy="0" r="345" strokeWidth="0.25" strokeDasharray="2 10" opacity="0.04"/>
                <circle cx="0" cy="0" r="9"  strokeWidth="0.5" opacity="0.12"/>
                <circle cx="0" cy="0" r="4"  fill="#E5D6A7" stroke="none" opacity="0.20"/>
              </g>
            </svg>

            {/* Scrollable content — min-h ensures the screen feels full even with short copy */}
            <div
              className="relative px-8 flex flex-col"
              style={{
                minHeight: '100vh',
                paddingTop: 'calc(env(safe-area-inset-top) + 3rem)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)',
                zIndex: 1,
              }}
            >
              <motion.div
                className="flex-1 flex flex-col justify-center"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Headline */}
                <h1
                  className="font-display font-bold text-white leading-tight mb-8"
                  style={{ fontSize: '2.5rem', letterSpacing: '-0.02em' }}
                >
                  Welcome to Palante.
                </h1>

                {/* Body — 3 tight paragraphs */}
                <div className="space-y-5" style={{ color: 'rgba(253,251,247,0.84)', fontSize: '17px', lineHeight: 1.70 }}>
                  <p>
                    You just did something quietly powerful. Most people never show up for themselves like this. You did.
                  </p>

                  <p>
                    This is how it begins. Not with a breakthrough, but with one honest practice and the choice to show up for another.
                  </p>

                  <p>
                    You also have a personal partner here. One that learns who you are, remembers what matters to you, and grows with you over time. Introduce yourself when you're ready, set a goal or two, and let them help you stay accountable.
                  </p>
                </div>

                {/* Closing */}
                <p className="mt-7" style={{ color: 'rgba(253,251,247,0.84)', fontSize: '17px', lineHeight: 1.70 }}>
                  We're glad you're here.
                </p>

                {/* Signature */}
                <div className="mt-5 mb-8">
                  <p style={{ color: 'rgba(229,214,167,0.50)', fontSize: '13px', fontStyle: 'italic' }}>With care,</p>
                  <p style={{ color: 'rgba(229,214,167,0.80)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.03em' }}>
                    The Palante Team
                  </p>
                </div>
              </motion.div>

              {/* CTA — always at the bottom of the content flow */}
              <motion.button
                onClick={dismissFirstTimeWelcome}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-semibold text-base"
                style={{
                  background: '#E5D6A7',
                  color: '#415D43',
                  boxShadow: '0 8px 32px rgba(229,214,167,0.18)',
                  letterSpacing: '0.01em',
                }}
              >
                Begin exploring
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Overlays */}
      {activeTab === 'breath' && (
        <ErrorBoundary name="Breathing">
          <div className="fixed inset-0 z-[45] flex flex-col" style={{ background: '#415D43' }}>
            {/* Rings — same pattern as all other practice pages */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <Target className="absolute top-0 right-0 w-[110vmin] h-[110vmin] translate-x-1/2 -translate-y-1/2 text-white opacity-[0.06]" />
              <Target className="absolute bottom-0 left-0 w-[90vmin] h-[90vmin] -translate-x-1/2 translate-y-1/2 text-white opacity-[0.06]" />
            </div>
            {/* Safe-area spacer — pushes idle header below status bar */}
            <div style={{ height: 'calc(env(safe-area-inset-top) + 1rem)' }} />
            <Breathing
              isDarkMode={isDarkMode}
              accentColor={isDarkMode ? 'text-pale-gold' : 'text-sage'}
              onComplete={() => {
                handleActivity('breath');
                setActiveTab(practiceOriginRef.current);
              }}
              onExit={() => setActiveTab(practiceOriginRef.current)}
              onShowTip={() => handleShowTip('Breath')}
            />
          </div>
        </ErrorBoundary>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'coach' && user && (
          <ErrorBoundary name="Coach" onReset={() => setActiveTab('home')}>
          <motion.div
            key="coach-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] overflow-hidden"
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






      {/* Premium Bottom Navigation - Scroll Aware */}
      < nav className={`fixed left-1/2 -translate-x-1/2 z-[210] transition-all duration-300 ${isNavVisible && activeTab !== 'breath' && !isInMorningFlow && !isInEveningInputFlow ? 'bottom-4 md:bottom-8 opacity-100' : '-bottom-24 opacity-0'} `}>
        <div className={`flex items-center gap-1 md:gap-3 px-3 md:px-6 py-3 md:py-4 rounded-full backdrop-blur-xl border transition-all duration-500 ${navClass} `}>
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'coach', icon: MessageCircle, label: 'Partner' },
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
                  analytics.screenViewed(tab.id);
                }}
                className={`tap-zone flex flex-col items-center gap-0.5 md:gap-1 px-4 md:px-5 py-2 rounded-full transition-all duration-300 ${activeTab === tab.id
                  ? isDarkMode
                    ? 'bg-white/20 text-white border border-white/20'
                    : 'bg-sage/20 text-sage'
                  : isDarkMode
                    ? 'text-white hover:text-white hover:bg-white/5'
                    : 'text-sage/60 hover:text-sage hover:bg-sage/10'
                  } `}
              >
                <div className="relative">
                  <Icon size={20} className="md:w-5 md:h-5 w-5 h-5" />
                  {tab.id === 'momentum' && showWeeklyHighlights && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#C96A3A] animate-pulse" />
                  )}
                  {tab.id === 'momentum' && !showWeeklyHighlights && (user?.streak ?? 0) > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)' }}
                    />
                  )}
                </div>
                <span className="text-xs md:text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav >






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

      {/* Weekly Highlights modal — opened only when user taps the home card */}
      <WeeklyHighlightsModal
        isOpen={showWeeklyHighlightsModal}
        accomplishments={weeklyAccomplishments}
        reflectionMessage={weeklyReflectionMessage}
        userName={user?.name || 'Friend'}
        isDarkMode={isDarkMode}
        onClose={() => { setShowWeeklyHighlightsModal(false); setShowWeeklyHighlights(false); }}
        weeklyLetter={weeklyLetterText || undefined}
        partnerName={user?.coachName || 'Palante'}
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
            if (section === 'reflections') setActiveTab('momentum');
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
            allQuotes={[...AFFIRMATIONS]}
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
            onClose={() => {
              setShowMilestone({ isOpen: false, milestone: null, streakDays: undefined });
              setTimeout(requestAppReview, 800);
            }}
          />
        )
      }

      {/* Ring Ceremony */}
      <RingCeremony
        type={ringCeremony.type}
        isOpen={ringCeremony.isOpen}
        userName={user?.name}
        isDarkMode={isDarkMode}
        onClose={() => {
          setRingCeremony(prev => ({ ...prev, isOpen: false }));
          // High-emotion moment — ask for an App Store review after a short delay.
          setTimeout(requestAppReview, 800);
          // After fullbloom: advance color cycle so the mandala refreshes next round,
          // and clear the shown flag so the ceremony can fire again at the next multiple of 90.
          if (ringCeremony.type === 'fullbloom' && user) {
            const nextCycle = (user.mandalaColorCycle ?? 0) + 1;
            updateProfile({ ...user, mandalaColorCycle: nextCycle });
            localStorage.removeItem(STORAGE_KEYS.FULLBLOOM_CEREMONY_SHOWN);
            localStorage.removeItem(STORAGE_KEYS.RING1_CEREMONY_SHOWN);
            localStorage.removeItem(STORAGE_KEYS.RING2_CEREMONY_SHOWN);
            localStorage.removeItem(STORAGE_KEYS.RING3_CEREMONY_SHOWN);
            const allMorning = (user.dailyMorningPractice || user.dailyPriming || []);
            const allEvening = (user.dailyEveningPractice || []);
            const futureLetter = (user.futureLetters || []).find(l => l.hasBeenDelivered || l.content);
            setGrowthStory({
              isOpen: true,
              data: {
                morningPractices: allMorning.map(p => ({
                  date: p.date,
                  gratitudes: p.gratitudes,
                  dailyIntention: p.dailyIntention,
                })),
                eveningPractices: allEvening.map(e => ({
                  date: e.date,
                  delight: e.delight,
                  accomplishment: e.accomplishment,
                  learning: e.learning,
                })),
                futureLetter: futureLetter?.content,
                totalPractices: user.practiceData?.totalPractices ?? 90,
                firstName: user.name?.split(' ')[0] || 'friend',
                coachTone: user.coachSettings?.coachTone,
                startDate: allMorning[0]?.date,
              },
            });
          }
        }}
        onShare={async () => {
          const { shareMilestoneAsImage } = await import('./utils/shareUtils');
          const labels: Record<RingCeremonyType, string> = {
            ring1: '10 Practices — Ring One Complete',
            ring2: '28 Practices — Ring Two Complete',
            ring3: '55 Practices — Ring Three Complete',
            fullbloom: '90 Days — Full Bloom',
          };
          await shareMilestoneAsImage({
            title: labels[ringCeremony.type],
            label: 'Mandala of Growth',
            count: user?.practiceData?.totalPractices ?? 0,
            message: 'My garden is growing. Pa\'lante. 🌸',
            iconName: 'Trophy',
            shareText: `${labels[ringCeremony.type]} on my Palante journey. Pa'lante! #PalanteApp`,
          });
        }}
        onSave={async () => {
          const { saveMilestoneToPhotos } = await import('./utils/shareUtils');
          await saveMilestoneToPhotos({
            title: '90 Days — Full Bloom',
            label: 'Mandala of Growth',
            count: user?.practiceData?.totalPractices ?? 90,
            message: 'My garden is in full bloom. Pa\'lante. 🌸',
            iconName: 'Trophy',
          });
        }}
      />

      {/* Day 90 Growth Story */}
      <GrowthStoryModal
        isOpen={growthStory.isOpen}
        data={growthStory.data}
        isDarkMode={isDarkMode}
        onClose={() => setGrowthStory(prev => ({ ...prev, isOpen: false }))}
        onShare={async (memoir) => {
          const { shareMilestoneAsImage } = await import('./utils/shareUtils');
          await shareMilestoneAsImage({
            title: 'Full Bloom — 90 Days',
            label: 'My Growth Story',
            count: user?.practiceData?.totalPractices ?? 90,
            message: memoir.slice(0, 120) + (memoir.length > 120 ? '...' : ''),
            iconName: 'Trophy',
            shareText: `90 days with Palante. My story: ${memoir.slice(0, 100)}... Pa'lante! #PalanteApp`,
          });
        }}
      />

      {/* Your Year, Forward — annual memoir */}
      <Suspense fallback={null}>
        <YearForwardModal
          isOpen={yearForward.isOpen}
          data={yearForward.data}
          onClose={() => setYearForward(prev => ({ ...prev, isOpen: false }))}
          onShare={async (letter) => {
            const { shareMilestoneAsImage } = await import('./utils/shareUtils');
            await shareMilestoneAsImage({
              title: `My Year, Forward — ${yearForward.data?.year ?? new Date().getFullYear()}`,
              label: 'Your Year, Forward',
              count: yearForward.data?.daysPracticed ?? 0,
              message: letter.slice(0, 120) + (letter.length > 120 ? '...' : ''),
              iconName: 'Sparkles',
              shareText: `My year with Palante: ${letter.slice(0, 100)}... Pa'lante! #PalanteApp`,
            });
          }}
        />
      </Suspense>

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

      {/* Notification permission ask — deferred to a return session (not the first-practice day) */}
      <Suspense fallback={null}>
        <NotificationAskModal
          isOpen={showNotifAsk}
          userName={user?.name || ''}
          onAllow={handleNotifAskAllow}
          onSkip={handleNotifAskSkip}
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






      {/* Rest day grace modal — shown when user missed exactly yesterday with a real streak */}
      <Suspense fallback={null}>
        {restDayMissedDate && (
          <RestDayModal
            isDarkMode={isDarkMode}
            missedDate={restDayMissedDate}
            onMarkAsRest={handleRestDayMarkAsRest}
            onAcknowledge={handleRestDayAcknowledge}
            onClose={handleRestDayAcknowledge}
          />
        )}
      </Suspense>

      {/* Morning Mode Overlay */}
      {
        showMorningMode && user && dailyQuote && (
          <MorningModeOverlay
            isDarkMode={isDarkMode}
            quote={dailyQuote}
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

      {/* Garden streak share modal */}
      {gardenShareOpen && user && (
        <ShareModal
          isOpen={gardenShareOpen}
          onClose={() => setGardenShareOpen(false)}
          isDarkMode={isDarkMode}
          streakData={{
            streak: user.practiceData?.currentStreak ?? user.streak ?? 0,
            totalPractices: user.practiceData?.totalPractices ?? 0,
            colorCycle: user.mandalaColorCycle ?? 0,
            firstName: user.name?.split(' ')[0] || undefined,
          }}
          onGenerateImage={async () => {
            setIsGeneratingStreakCard(true);
            try {
              const { shareStreakCard } = await import('./utils/shareUtils');
              await shareStreakCard({
                streak:         user.practiceData?.currentStreak ?? user.streak ?? 0,
                colorCycle:     user.mandalaColorCycle ?? 0,
                totalPractices: user.practiceData?.totalPractices ?? 0,
                firstName:      user.name?.split(' ')[0] || undefined,
              });
            } finally {
              setIsGeneratingStreakCard(false);
            }
          }}
          onDownloadImage={async () => {
            setIsGeneratingStreakCard(true);
            try {
              const { downloadStreakCard } = await import('./utils/shareUtils');
              await downloadStreakCard({
                colorCycle:     user.mandalaColorCycle ?? 0,
                totalPractices: user.practiceData?.totalPractices ?? 0,
                firstName:      user.name?.split(' ')[0] || undefined,
              });
            } finally {
              setIsGeneratingStreakCard(false);
            }
          }}
          isGeneratingImage={isGeneratingStreakCard}
        />
      )}

      {/* Day 1 share modal — uses the existing beautiful quote card */}
      {showDay1ShareModal && user && (
        <ShareModal
          isOpen={showDay1ShareModal}
          onClose={() => { setShowDay1ShareModal(false); dismissShareDayOne(); }}
          isDarkMode={isDarkMode}
          streakData={{
            streak: user.practiceData?.currentStreak ?? user.streak ?? 0,
            totalPractices: user.practiceData?.totalPractices ?? 0,
            colorCycle: user.mandalaColorCycle ?? 0,
            firstName: user.name?.split(' ')[0] || undefined,
          }}
          onGenerateImage={async () => {
            setIsGeneratingDay1Card(true);
            try {
              const { shareStreakCard } = await import('./utils/shareUtils');
              await shareStreakCard({
                streak:         user.practiceData?.currentStreak ?? user.streak ?? 0,
                colorCycle:     user.mandalaColorCycle ?? 0,
                totalPractices: user.practiceData?.totalPractices ?? 0,
                firstName:      user.name?.split(' ')[0] || undefined,
              });
              dismissShareDayOne();
            } catch (err) {
              console.error('[Palante] Day 1 share error:', err);
            } finally {
              setIsGeneratingDay1Card(false);
            }
          }}
          onDownloadImage={async () => {
            setIsGeneratingDay1Card(true);
            try {
              const { downloadStreakCard } = await import('./utils/shareUtils');
              await downloadStreakCard({
                colorCycle:     user.mandalaColorCycle ?? 0,
                totalPractices: user.practiceData?.totalPractices ?? 0,
                firstName:      user.name?.split(' ')[0] || undefined,
              });
            } catch (err) {
              console.error('[Palante] Day 1 download error:', err);
            } finally {
              setIsGeneratingDay1Card(false);
            }
          }}
          isGeneratingImage={isGeneratingDay1Card}
        />
      )}

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
                  onToast={(message) => {
                    setToastMessage(message);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2500);
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
              onClose={() => { setShowMorningPractice(false); }}
              user={user}

              onUpdateUser={(updates: Partial<UserProfile>) => {
                handleProfileUpdate((prev: UserProfile | null) => {
                  if (!prev) return prev!;
                  return { ...prev, ...updates };
                });
                // When morning practice saves, immediately generate the garden affirmation
                // with the fresh practice data — don't wait for the next user?.id re-mount
                if (updates.dailyMorningPractice) {
                  const _td = new Date();
                  const today = `${_td.getFullYear()}-${String(_td.getMonth() + 1).padStart(2, '0')}-${String(_td.getDate()).padStart(2, '0')}`;
                  const todayPractice = updates.dailyMorningPractice.find((p) => p.date === today);
                  if (todayPractice && (
                    (todayPractice.gratitudes || []).some(Boolean) ||
                    (todayPractice.affirmations || []).some(Boolean) ||
                    todayPractice.dailyIntention?.trim()
                  )) {
                    localStorage.removeItem(STORAGE_KEYS.GARDEN_AFFIRMATION);
                    localStorage.removeItem(STORAGE_KEYS.GARDEN_AFFIRMATION_DATE);
                    generateGardenAffirmation(true, {
                      gratitudes: (todayPractice.gratitudes || []).filter(Boolean),
                      affirmations: (todayPractice.affirmations || []).filter(Boolean),
                      intention: todayPractice.dailyIntention?.trim() || '',
                      commitment: todayPractice.commitment?.trim(),
                    });
                  }
                }
              }}
            />
          )
        }
      </Suspense>

      {/* CheckIn is now a home card via HomeNudgeCards — no modal */}


      {/* Global Did You Know Modal */}
      <Suspense fallback={null}>
        <DidYouKnowModal
          isOpen={globalTip.isOpen}
          onClose={handleCloseTip}
          fact={globalTip.fact}
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
              totalPractices={user.practiceData?.totalPractices || 0}
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

    </div >
  );

  // Render Logic
  if (currentPath.split('#')[0] === '/privacy') {
    // Read the hash from the live URL (not currentPath) so the deep-link survives reload and back/forward.
    const wantPrivacy = window.location.hash === '#privacy' || currentPath.includes('#privacy');
    return <Suspense fallback={null}><PrivacyPolicy isDarkMode={isDarkMode} onBack={() => navigate('/')} scrollToPrivacy={wantPrivacy} /></Suspense>;
  }

  if (showAgeGate) {
    return (
      <Suspense fallback={null}>
        <AgeVerificationModal
          isOpen={true}
          onClose={() => {}}
          onVerify={handleAgeVerified}
          isDarkMode={isDarkMode}
          required={true}
        />
      </Suspense>
    );
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
  return <Suspense fallback={null}>{appJsx}</Suspense>;
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
