import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { STORAGE_KEYS, SESSION_KEYS } from './constants/storageKeys';
import { COACH_CHAT_ENABLED } from './constants/featureFlags';
import { hasAcknowledgedAIDisclosure, recordAIDisclosureAcknowledgment } from './data/aiDisclosure';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { InAppReview } from '@capacitor-community/in-app-review';

import { PageTransition } from './components/PageTransition';
import { UserProvider, useUser } from './contexts/UserContext';


import { getAIQuote, pickAndMarkQuote } from './utils/quoteMatcher';
import { generateUserNarrative, generateWeeklyReflection } from './utils/aiService';
import { analytics, identifyUser } from './utils/analytics';
import { AFFIRMATIONS } from './data/affirmations';
import type { UserProfile, Quote, DailyFocus, ActivityType, ContentType, QuoteSource, SoundMix, PrimaryIntent } from './types';
import { haptics } from './utils/haptics';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { useNotifications } from './hooks/useNotifications';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAppProcess } from './hooks/useAppProcess';
import { triggerConfetti } from './utils/CelebrationEffects';
import { WidgetDataSync } from './utils/widgetDataSync';
import { DebugErrorBoundary } from './components/DebugErrorBoundary';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RotateCcw } from 'lucide-react';
import { computeWeeklyHighlights } from './utils/weeklyHighlights';
import { generateWeeklyLetter, isSunday, letterIsStale, getISOWeekNumber } from './utils/weeklyLetter';
import type { EssentialToolId } from './components/HomeEssentialTools';
import type { RingCeremonyType } from './components/RingCeremony';
import type { GrowthStoryData } from './utils/aiService';
import type { YearForwardData } from './utils/yearForward';
import { Logo } from './components/Logo';
import { HomeNudgeCard, GradientNudgeCard } from './components/HomeNudgeCards';
import {
  Home, TrendingUp, User as UserIcon,
  Music,
  Target, Fish, Layers,
  CheckCircle2, Clock, Moon, ShieldCheck
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CoachSettings, WeeklyReport, DailyPriming } from './types';
import { SCIENCE_FACTS, type ScienceFact } from './data/scienceFacts';
import { generateDailyDispatch, generateRecoveryDispatch, intentToTone } from './utils/dailyDispatch';
import { isReviewerEmail, REVIEWER_DISPATCH_OFFSETS_MIN } from './constants/reviewer';
import { getMomentumState } from './utils/aiService';
import { api } from './lib/api';
import { logPractice, migrateStreakToPractice, type MilestoneName } from './utils/practiceUtils';
import { useModalState } from './hooks/useModalState';
import { useContinuityOpener } from './hooks/useContinuityOpener';
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
const EveningMessageCard = lazy(() => import('./components/EveningMessageCard').then(m => ({ default: m.EveningMessageCard })));
const GardenLegendModal = lazy(() => import('./components/GardenLegendModal').then(m => ({ default: m.GardenLegendModal })));
const DashboardQuoteCard = lazy(() => import('./components/DashboardQuoteCard').then(m => ({ default: m.DashboardQuoteCard })));
const PostPracticeSetupModal = lazy(() => import('./components/PostPracticeSetupModal').then(m => ({ default: m.PostPracticeSetupModal })));
const NotificationAskModal = lazy(() => import('./components/NotificationAskModal').then(m => ({ default: m.NotificationAskModal })));
const AgeVerificationModal = lazy(() => import('./components/AgeVerificationModal').then(m => ({ default: m.AgeVerificationModal })));
const CelebrationModal = lazy(() => import('./components/CelebrationModal').then(m => ({ default: m.CelebrationModal })));
const DisclaimerModal = lazy(() => import('./components/DisclaimerModal').then(m => ({ default: m.DisclaimerModal })));
const AIDisclosureModal = lazy(() => import('./components/AIDisclosureModal').then(m => ({ default: m.AIDisclosureModal })));
const HistoryModal = lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const SoundMixer = lazy(() => import('./components/SoundMixer'));
const EveningPractice = lazy(() => import('./components/EveningPractice').then(m => ({ default: m.EveningPractice })));
const PaywallScreen = lazy(() => import('./components/PaywallScreen').then(m => ({ default: m.PaywallScreen })));
const GardenMandala = lazy(() => import('./components/GardenDemoFinal').then(m => ({ default: m.GardenDemoFinal })));
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
const SlideUpModal = lazy(() => import('./components/SlideUpModal').then(m => ({ default: m.SlideUpModal })));
const ProfileCompletionCard = lazy(() => import('./components/ProfileCompletionCard').then(m => ({ default: m.ProfileCompletionCard })));
const RestDayModal = lazy(() => import('./components/RestDayModal').then(m => ({ default: m.RestDayModal })));
const MorningModeOverlay = lazy(() => import('./components/MorningModeOverlay').then(m => ({ default: m.MorningModeOverlay })));
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

  // Coach/partner chat shelved behind COACH_CHAT_ENABLED (see featureFlags.ts) for
  // the Oct 2026 release. The single kill-switch lives inside useContinuityOpener
  // itself (it no-ops entirely when the flag is off, so no daily AI call is spent
  // generating a greeting nothing can surface) rather than being duplicated here
  // and at the JSX gate below, so re-enabling the feature is a one-flag flip.
  const { continuityOpener } = useContinuityOpener(user);
  const [memoryCallbackDismissed, setMemoryCallbackDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.MEMORY_CALLBACK_DISMISSED) === new Date().toISOString().slice(0, 10); }
    catch { return false; }
  });
  const dismissMemoryCallback = () => {
    try { localStorage.setItem(STORAGE_KEYS.MEMORY_CALLBACK_DISMISSED, new Date().toISOString().slice(0, 10)); }
    catch { /* best-effort */ }
    setMemoryCallbackDismissed(true);
  };

  const [activeTab, setActiveTab] = useState<'home' | 'momentum' | 'toolkit' | 'breath' | 'meditate' | 'coach' | 'soundscapes'>('home');
  // Tracks where the user was before entering a full-screen practice overlay, so onExit returns them there
  const practiceOriginRef = useRef<typeof activeTab>('home');


  const { isDarkMode } = useTheme();
  const [newFocusText, setNewFocusText] = useState('');
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const {
    showProfile, setShowProfile, showKoiPond, setShowKoiPond,
    showHistory, setShowHistory,
    setShowWelcome,
    showSoundMixer, setShowSoundMixer, mixerSource, setMixerSource,
    showMorningPractice, setShowMorningPractice,
    showMorningMode, setShowMorningMode,
    showLetterWrite, setShowLetterWrite,
    showLetterRead, setShowLetterRead,
    showHomeCoachSettings, setShowHomeCoachSettings,
    showWelcomeOrientation, setShowWelcomeOrientation,
    showCelebration, setShowCelebration,
    showWeeklyReport, setShowWeeklyReport,
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
  const { shouldShowEveningMode, hour } = useTimeOfDay();

  // Transient Success States for Practices
  const [showMorningSuccess, setShowMorningSuccess] = useState(false);
  const [_showEveningSuccess, setShowEveningSuccess] = useState(false);
  const [_showFirstTimeWelcome, setShowFirstTimeWelcome] = useState(false);
  const [eveningSkipped, setEveningSkipped] = useState(false);
  const [morningSkipped, setMorningSkipped] = useState(false);
  const [_morningSkipReminderSent, setMorningSkipReminderSent] = useState(false);

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
  const [showGardenLegend, setShowGardenLegend] = useState(false);
  const [showPostPracticeSetup, setShowPostPracticeSetup] = useState(false);
  const [showNotifAsk, setShowNotifAsk] = useState(false);
  // Interests/content setup: was a blocking first-run modal, now a dismissible home card (opt-in).
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

  // Load daily quote on mount: restore cached quote from today or pick a fresh one
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const cachedDate = localStorage.getItem(STORAGE_KEYS.QUOTE_DATE);
    const cachedQuote = localStorage.getItem(STORAGE_KEYS.DAILY_QUOTE);
    if (cachedDate === today && cachedQuote) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring cached state from localStorage on mount/user-change, the standard "sync with an external system" effect
        setDailyQuote(JSON.parse(cachedQuote));
        return;
      } catch { /* fall through to fresh pick */ }
    }
    refreshDailyQuote();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Removed July 2026: the garden affirmation generator. It called Anthropic on mount and
  // again, cache-busted, after every practice completion, then stored the result in
  // localStorage where nothing read it. The render site had been removed at some point and
  // left the generator behind, so it was billing on the same event you most want users
  // repeating. Restoring the line means choosing where it renders first; the generation
  // itself is one revert away (utils/aiService generatePalanteQuote went with it).

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

  // Weekly Highlights: badge on Journey tab, modal shown when user navigates there
  useEffect(() => {
    if (!user) return;
    const trigger = computeWeeklyHighlights(
      user.dailyEveningPractice || [],
      STORAGE_KEYS.WEEKLY_HIGHLIGHTS_SHOWN
    );
    if (trigger.shouldShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time badge/modal trigger computed from storage on mount/user-change, not derivable from props during render
      setWeeklyAccomplishments(trigger.accomplishments);
      trigger.markShown();
      setShowWeeklyHighlights(true); // lights up the Journey tab badge
      const firstName = user.name?.split(' ')[0] || 'Friend';
      generateWeeklyReflection(
        trigger.accomplishments.map(a => a.text),
        firstName,
        user.language ?? 'en'
      ).then(msg => setWeeklyReflectionMessage(msg)).catch(() => {});
    }

    // Weekly partner letter: generate on Sunday, OR on day 7 of the trial for new users
    // who may never reach a Sunday before the paywall (e.g. installs Monday → paywall day 8).
    const firstPracticeDate = localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE);
    const daysSinceFirst = firstPracticeDate
      ? Math.floor((Date.now() - new Date(firstPracticeDate).getTime()) / (1000 * 60 * 60 * 24))
      : -1;
    const isDay7ForNewUser = daysSinceFirst === 6 && !isPro; // day 7 (0-indexed from first practice)

    if ((isSunday() || isDay7ForNewUser) && letterIsStale(user)) {
      generateWeeklyLetter(user).then(letter => {
        setWeeklyLetterText(letter);
        updateProfile((prev: UserProfile | null) => {
          if (!prev) return user;
          return { ...prev, weeklyPartnerLetter: { text: letter, generatedAt: new Date().toISOString(), weekNumber: getISOWeekNumber() } };
        });
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
  // ("purpose") instead of a label. Relabel any such goals in place. Idempotent
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

  // AI disclosure: shown once, and again whenever AI_DISCLOSURE_VERSION changes, so a
  // material change to what we send or who receives it is surfaced rather than buried.
  const [showAIDisclosure, setShowAIDisclosure] = useState(() => !hasAcknowledgedAIDisclosure());

  const handleAIDisclosureAcknowledged = (aiEnabled: boolean) => {
    recordAIDisclosureAcknowledgment();
    setShowAIDisclosure(false);
    // Write the profile only when the choice differs from what's already stored. The
    // default is aiDisabled: false, so acknowledging without touching the toggle should
    // not churn the profile: but a user re-enabling AI on a later version bump must
    // still be persisted, which a one-way "only on opt-out" check would miss.
    const wantsDisabled = !aiEnabled;
    if (user && (user.aiDisabled ?? false) !== wantsDisabled) {
      updateProfile({ ...user, aiDisabled: wantsDisabled });
    }
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
    bio?: string;
  }) => {
    analytics.onboardingCompleted({
      profession: userData.profession,
      quoteIntensity: userData.quoteIntensity,
      interests: userData.interests ? userData.interests.split(',').map(i => i.trim()) : [],
      contentType: userData.contentType,
      sourcePreference: userData.sourcePreference,
    });

    // 0. Record the age gate from the intro's age step (COPPA, happens before any practice)
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
      // Their onboarding answer sets the partner's default voice, unless they've already
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
        // Parse and add interests if provided
        interests: userData.interests ? userData.interests.split(',').map(i => i.trim()) : user.interests,
        // Bio written in onboarding gives the partner real context from the very first chat
        bio: userData.bio ?? user.bio,
      };

      // Write seed memories so the partner has real context from the very first chat,
      // even before Supabase conversation memories exist (available pre-auth too).
      const seedMemories: string[] = [];
      const firstName = userData.name.trim().split(/\s+/)[0] || userData.name.trim();
      const INTENT_MEMORY: Partial<Record<string, string>> = {
        consistency: `${firstName} came to Palante because they want to build more consistency, returning to the practice every day, regardless of how they feel.`,
        clarity: `${firstName} is looking for clarity and focus. They feel scattered and want to know what truly matters so they can cut through the noise.`,
        stress: `${firstName} is dealing with real stress and came to Palante to stay grounded. Life has felt heavy and they need support managing it.`,
        purpose: `${firstName} wants their days to feel meaningful. They came to Palante to reconnect with purpose and make their life more intentional.`,
      };
      if (userData.primaryIntent && INTENT_MEMORY[userData.primaryIntent]) {
        seedMemories.push(INTENT_MEMORY[userData.primaryIntent]!);
      }
      if (userData.bio?.trim()) {
        seedMemories.push(`${firstName} shared this about themselves when they joined: "${userData.bio.trim()}"`);
      }
      if (seedMemories.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SEED_MEMORIES, JSON.stringify(seedMemories));
      }

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
      await notifications.updateNudgeConfig(true, 'morning-evening');
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
    milestone: 'first' | 'three' | 'week' | 'fortnight' | 'month' | 'fifty' | 'quarter' | 'century' | 'halfyear' | 'twohundred' | 'year' | null;
    streakDays?: number;
  }>({
    isOpen: false,
    milestone: null,
    streakDays: undefined
  });

  // Single source of truth for showing a practice-count milestone celebration.
  // Used by every call site that logs a practice (handleActivity, handleToggleGoal,
  // handlePrimingComplete, the evening GLAD practice, and MorningPractice.tsx via its
  // onMilestone callback) instead of each one re-deriving its own copy of this logic.
  // Early milestones (first/three/week) get a lightweight
  // toast instead of the full modal, since they land in quick succession for a new user.
  const triggerMilestoneCelebration = (milestoneName: MilestoneName) => {
    const earlyToasts: Partial<Record<MilestoneName, string>> = {
      first: "First practice. Pa'lante.",
      three: "Three in. You came back.",
      week: "Seven practices. You're not stopping.",
    };
    if (earlyToasts[milestoneName]) {
      triggerConfetti();
      setToastMessage(earlyToasts[milestoneName]!);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setShowMilestone({ isOpen: true, milestone: milestoneName });
    }
  };

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

  // Day 1 share modal: shows beautiful quote card instead of plain text
  const [showDay1ShareModal, setShowDay1ShareModal] = useState(false);
  const [isGeneratingDay1Card, setIsGeneratingDay1Card] = useState(false);

  // Routine Stack Runner

  // Weekly Report
  const [currentWeeklyReport, setCurrentWeeklyReport] = useState<WeeklyReport | null>(null);




  const getGreeting = () => {
    const hour = new Date().getHours();
    // Sentence case, matching every other greeting in the app (the morning gate
    // immediately before this one, CoachCard, EveningPractice). Title Case here
    // meant the user saw "Good morning, Michael." and then "Good Morning,
    // Michael." on consecutive screens.
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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

  // Check for letter delivery: scheduled (90-day) or on low-energy days
  useEffect(() => {
    if (!user || !user.futureLetters || user.futureLetters.length === 0) return;
    if (showLetterRead) return; // Don't show multiple letters at once

    const letterShownToday = sessionStorage.getItem(SESSION_KEYS.LETTER_SHOWN_TODAY);
    if (letterShownToday) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Priority 1: Scheduled delivery (90-day letters), show regardless of energy
    const scheduledDue = user.futureLetters
      .filter(l => !l.hasBeenDelivered && l.scheduledDeliveryDate && new Date(l.scheduledDeliveryDate) <= today)
      .sort((a, b) => new Date(a.scheduledDeliveryDate!).getTime() - new Date(b.scheduledDeliveryDate!).getTime());

    if (scheduledDue.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- checks a scheduled-delivery date against "now" on mount/user-change, can't be computed during render
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

  // Ring ceremony: fires once per ring threshold crossing
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

  // loadNewQuote stub: kept for useAppProcess compatibility (daily quote uses refreshDailyQuote instead)
   
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
    notifications
  });





  // PRO-ACTIVE COACH SESSION INITIALIZATION Logic Moved to Line 1082 Area to ensure initialization order



  // Initialize notifications
  useEffect(() => {
    // Only request if user has enabled them in settings (or logic to ask once)
    // requestPermissions();
  }, []);


  // Recovery check: grace day modal (1 missed day) or background nudge (3+ days)
  useEffect(() => {
    if (!user || !user.practiceData?.lastActivityDate) return;
    const checkedToday = sessionStorage.getItem(SESSION_KEYS.REST_DAY_CHECKED);
    if (checkedToday) return;
    sessionStorage.setItem(SESSION_KEYS.REST_DAY_CHECKED, 'true');

    const lastActivity = user.practiceData.lastActivityDate;
    const daysSince = getDaysDifference(lastActivity, getTodayDate());

    // daysSince === 1 means the last practice was YESTERDAY: the user is on track and
    // simply hasn't practiced yet today, so nothing should fire. The grace-day modal is
    // for returning after a real gap: daysSince === 2 means exactly yesterday was missed.
    if (daysSince === 2 && (user.streak ?? 0) >= 2) {
      // Missed exactly yesterday and has a real streak worth protecting, show grace day modal.
      // Build the date with LOCAL parts (not toISOString, which is UTC and can be off by one).
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterdayStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
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



  // 5. Scroll-aware navigation: hide on scroll down, show on scroll up.
  // Shared by both the window scroll listener below (Home/Momentum/Meditation/etc,
  // which scroll the document itself) and any fixed-overlay page with its own internal
  // scroll container (e.g. SoundMixer, which is `fixed` and scrolls internally, so it
  // never generates a `window` scroll event) via the onContentScroll callback passed
  // down to it. Both call sites are mutually exclusive in practice (the window doesn't
  // scroll while a fixed overlay's internal container has focus), so sharing the same
  // lastScrollY ref and setter is safe.
  const updateNavVisibilityForScroll = (currentScrollY: number) => {
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

  useEffect(() => {
    const handleScroll = () => updateNavVisibilityForScroll(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always restore nav + scroll to top when switching tabs so the nav bar is never
  // stranded hidden from a previous page's scroll position.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs nav visibility with the external scroll position on tab change
    setIsNavVisible(true);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // Same guard for the Soundscapes overlay: it's a full-screen modal over whatever page
  // was scrolled underneath it, so opening it shouldn't inherit that page's hidden-nav
  // state — the header/nav are meant to stay visible for the entire time it's open.
  useEffect(() => {
    if (showSoundMixer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs nav visibility when the overlay opens
      setIsNavVisible(true);
    }
  }, [showSoundMixer]);








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
    const oldStreak = user.streak || 0;

    const result = await logActivity(type);
    if (type === 'breath' || type === 'meditate' || type === 'reflect') {
      analytics.practiceCompleted({ type, streak: user.streak });
    }

    if (result?.milestone && result.isNew && result.milestoneName) {
      triggerMilestoneCelebration(result.milestoneName);
    }

    // After the 3rd practice: invite to write a letter to your future self (earned, once-only)
    if (result?.totalPractices === 3 && (user.futureLetters ?? []).length === 0 && !localStorage.getItem(STORAGE_KEYS.LETTER_PROMPT_SHOWN)) {
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.LETTER_PROMPT_SHOWN, 'true');
        setLetterContext('manual');
        setLetterContextDetails('Three practices in. Something is starting.');
        setShowLetterWrite(true);
      }, 3500); // after the milestone toast fades
    }

    // Note: PostPracticeSetupModal (interests picker) is deferred to practice 3 via useEffect.
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
      analytics.quoteFavorited({ isAI: !!quote.isAI, category: quote.category, quoteId: quoteIdStr, author: quote.author });
    } else {
      haptics.light();
    }

    toggleFavorite(quoteIdStr, !isFavorited, { text: quote.text, author: quote.author });
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
        setToastMessage('Practice Space');
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


  const handleSaveCoachSettings = (settings: CoachSettings) => {
    if (!user) return;
    const updatedUser = { ...user, coachSettings: settings };
    updateProfile(updatedUser);

    // Also sync with notification background process
    updateNudgeConfig(settings.nudgeEnabled, settings.nudgeFrequency, user.quoteIntensity, user.contentTypePreference);
  };



  // Dictation for the focus field. useSpeechRecognition is a stub in this build
  // (isSupported is hard-coded false and startListening is a no-op), so transcript never
  // arrives and nothing here can fire. Kept as the single seam to re-enable it: the UI
  // that called it is already gone, so wiring dictation back up means adding a control,
  // not rebuilding this.
  const { transcript } = useSpeechRecognition();
  const [baseFocusText] = useState('');

  useEffect(() => {
    if (transcript) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local text with the external speech-recognition transcript
      setNewFocusText((baseFocusText ? baseFocusText + ' ' : '') + transcript);
    }
  }, [transcript, baseFocusText]);

  const handleQuickAddFocus = async () => {
    if (!user || !newFocusText.trim()) return;
    if ((user.dailyFocuses || []).length >= 5) {
      setToastMessage("5 goals set. Focus on what matters most");
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
      const { data: updatedPracticeData, milestone, isNew, milestoneName } = logPractice(currentPracticeData, 'goal');
      updatedUser = { ...updatedUser, practiceData: updatedPracticeData };

      if (milestone && isNew && milestoneName) {
        triggerMilestoneCelebration(milestoneName);
      }
    }

    updateProfile(updatedUser);
  };

  const handlePrimingComplete = (data: DailyPriming) => {
    if (!user) return;

    // Mark that the user has genuinely completed a practice (gates the paywall on next open).
    // Intentionally here (on completion) not on modal close, so abandoners don't get locked out.
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

    // Calculate streak the same way logActivity does, morning priming is the primary
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

    const primingPracticeResult = logPractice(user.practiceData || migrateStreakToPractice(user), 'morning_priming');
    const updatedUser: UserProfile = {
      ...user,
      dailyPriming: updatedPriming,
      points: (user.points || 0) + 5,
      streak: newStreak,
      practiceData: primingPracticeResult.data
    };
    updateProfile(updatedUser);
    if (primingPracticeResult.milestone && primingPracticeResult.isNew && primingPracticeResult.milestoneName) {
      triggerMilestoneCelebration(primingPracticeResult.milestoneName);
    }
    setCompletionIntention(data.dailyIntention?.trim() || '');
    analytics.morningRitualCompleted({
      hadIntention: !!data.dailyIntention,
      gratitudeCount: data.gratitudes?.length ?? 0,
      affirmationCount: data.affirmations?.length ?? 0,
    });

    // Mark welcome as seen immediately: no modal chain after first practice.
    // PostPracticeSetup and ProfileNudge are deferred to practice 3+ via useEffect below.
    if (!localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN)) {
      pendingWelcome.current = true;
    } else if (localStorage.getItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN)
        && !localStorage.getItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED)) {
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
  const isInMorningFlow = !ritualDoneToday && !morningSkipped && !shouldShowEveningMode && !forcedEvening && !!user && activeTab === 'home';

  // Evening practice flow: header + nav stay visible throughout, unlike morning.
  const [_eveningStep, setEveningStep] = useState<string>('intro');

  // Completion moment: captures the intention word right as practice finishes
  const [completionIntention, setCompletionIntention] = useState<string>('');

  // Tracks whether the user has completed at least one practice (gates the paywall)
  const [appUsed, setAppUsed] = useState(() => !!localStorage.getItem(STORAGE_KEYS.APP_USED));

  // Free-trial window: users get 7 days from their first practice before the paywall hard-gates.
  // Uses FIRST_PRACTICE_DATE (set in the same handler as APP_USED) as the clock.
  // If APP_USED is set but FIRST_PRACTICE_DATE is absent (shouldn't happen post-launch) → expired.
  const trialDaysLeft = (() => {
    if (isPro || !appUsed) return 7;
    const firstDate = localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE);
    if (!firstDate) return 0;
    // eslint-disable-next-line react-hooks/purity -- trial countdown must read the real current time; intentionally recomputed fresh every render
    const daysSince = Math.floor((Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysSince);
  })();
  const trialExpired = !isPro && appUsed && trialDaysLeft === 0;

  // Early paywall: user taps the trial ribbon to subscribe before their trial expires.
  const [showPaywallEarly, setShowPaywallEarly] = useState(false);

  // Coach/partner chat is shelved (COACH_CHAT_ENABLED in featureFlags.ts). This
  // state initializes normally from localStorage; the card that reads it is
  // gated behind the flag at its JSX usage site below, so there's nothing extra
  // to restore here when the feature returns.
  const [showPartnerDiscovery, setShowPartnerDiscovery] = useState(
    () => !localStorage.getItem(STORAGE_KEYS.PARTNER_CHAT_DISCOVERY_SHOWN)
  );
  const dismissPartnerDiscovery = () => {
    localStorage.setItem(STORAGE_KEYS.PARTNER_CHAT_DISCOVERY_SHOWN, 'true');
    setShowPartnerDiscovery(false);
  };

  // Day 1 share card: dismissed via X or after sharing
  const [shareDayOneDismissed, setShareDayOneDismissed] = useState(
    () => !!localStorage.getItem(STORAGE_KEYS.SHARE_DAY1_DISMISSED)
  );
  const dismissShareDayOne = () => {
    localStorage.setItem(STORAGE_KEYS.SHARE_DAY1_DISMISSED, 'true');
    setShareDayOneDismissed(true);
  };

  // Quick Tour card: shown after first practice, dismissed forever on tap or X
  const [quickTourDismissed, setQuickTourDismissed] = useState(
    () => !!localStorage.getItem(STORAGE_KEYS.QUICK_TOUR_DISMISSED)
  );
  const dismissQuickTour = () => {
    localStorage.setItem(STORAGE_KEYS.QUICK_TOUR_DISMISSED, 'true');
    setQuickTourDismissed(true);
  };

  // Profile nudge: shown once after first practice completes
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const dismissProfileNudge = () => {
    setShowProfileNudge(false);
    localStorage.setItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED, 'true');
  };

  // Sign-in nudge, shown to guest users after 2+ practices so they know their data isn't backed up
  const [showSignInNudge, setShowSignInNudge] = useState(false);
  const dismissSignInNudge = () => {
    setShowSignInNudge(false);
    localStorage.setItem(STORAGE_KEYS.SIGNIN_NUDGE_DISMISSED, getTodayDate());
  };

  // pendingWelcome: set to true in handlePrimingComplete when the welcome screen
  // should appear after the morning success overlay auto-dismisses.
  const pendingWelcome = useRef(false);

  // Auto-dismiss the morning completion overlay after 2.5 s.
  useEffect(() => {
    if (showMorningSuccess) {
      const t = setTimeout(() => setShowMorningSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showMorningSuccess]);

  // After practice 3, surface PostPracticeSetup and ProfileNudge, one at a time.
  useEffect(() => {
    if (!user) return;
    const totalPractices = user.practiceData?.totalPractices ?? 0;
    if (totalPractices < 3) return;
    if (!localStorage.getItem(STORAGE_KEYS.POST_PRACTICE_SETUP_SEEN)) {
      const t = setTimeout(() => setShowPostPracticeSetup(true), 1500);
      return () => clearTimeout(t);
    } else if (!localStorage.getItem(STORAGE_KEYS.PROFILE_NUDGE_DISMISSED)) {
      const t = setTimeout(() => setShowProfileNudge(true), 1500);
      return () => clearTimeout(t);
    }
  }, [user?.practiceData?.totalPractices]);

  // Welcome screen is triggered only from practice completion handlers
  // (handlePrimingComplete / evening onComplete): never on app open,
  // which caused the welcome overlay to block the morning practice flow.

  // Sign-in nudge: fires for guest users with 2+ practices.
  // Dismissal stores the date: re-surfaces after 3 days so data-loss risk stays visible
  // through the trial window without being permanently ignorable.
  useEffect(() => {
    if (authLoading) return; // wait for Supabase auth to resolve before showing nudge
    if (authUser) return;
    const totalPractices = user?.practiceData?.totalPractices ?? 0;
    const streak = user?.streak ?? 0;
    if (totalPractices < 2 && streak < 2) return;
    const dismissedDate = localStorage.getItem(STORAGE_KEYS.SIGNIN_NUDGE_DISMISSED);
    if (dismissedDate) {
      const daysSince = getDaysDifference(dismissedDate, getTodayDate());
      if (daysSince < 3) return; // suppressed for 3 days, then re-shows
    }
    const t = setTimeout(() => setShowSignInNudge(true), 2000);
    return () => clearTimeout(t);
  }, [authLoading, authUser, user?.practiceData?.totalPractices, user?.streak]);

  // Notification permission ask: deferred off the first-practice day to a return session, after
  // the user has had a chance to feel a daily dispatch's value. (Day 1 ends on the welcome letter.)
  const notifAskCheckedRef = useRef(false);
  useEffect(() => {
    if (notifAskCheckedRef.current) return;
    if (!user) return;
    if (localStorage.getItem(STORAGE_KEYS.NOTIF_ASK_SEEN)) return;
    if (notifications.permission === 'granted') return;
    if ((user.practiceData?.totalPractices ?? 0) < 1) return;
    const firstPracticeDate = localStorage.getItem(STORAGE_KEYS.FIRST_PRACTICE_DATE);
    if (!firstPracticeDate || firstPracticeDate === getTodayDate()) return; // still day 1, wait
    notifAskCheckedRef.current = true;
    const t = setTimeout(() => setShowNotifAsk(true), 2500);
    return () => clearTimeout(t);
  }, [user?.id, user?.practiceData?.totalPractices]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Detect day rollover: refresh date-sensitive content when the user returns on a new day
      const today = getTodayDate();
      if (today !== lastSeenDateRef.current) {
        lastSeenDateRef.current = today;
        refreshDailyQuote(false);
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, [user, refreshDailyQuote]);

  // Deep-link handler, captures palante://auth-callback URLs from Supabase email links on device
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.includes('auth-callback') && !url.includes('access_token') && !url.includes('code=')) return;
      const hashParams = new URLSearchParams(url.split('#')[1] ?? '');
      const queryParams = new URLSearchParams((url.split('?')[1] ?? '').split('#')[0]);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = queryParams.get('code');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, []);

  // LOADING STATE
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-sage-mid' : 'bg-ivory'} `}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-sage"></div>
      </div>
    );
  }

  // Safety check
  if (userLoading || subLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-sage-mid' : 'bg-ivory'} `}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-sage"></div>
      </div>
    );
  }

  // PAYWALL: show when the 7-day free trial has expired and the user hasn't subscribed.
  // New users get through their first morning practice and 7 free days before we ask for money.
  if (trialExpired) {
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

      {/* Free-trial ribbon, shown on days 5, 6, 7 of the 7-day app trial (pre-subscription).
          Tappable, opens the paywall so users can subscribe early without waiting for the hard gate. */}
      {appUsed && !isPro && trialDaysLeft > 0 && trialDaysLeft <= 3 && (
        <button
          onClick={() => setShowPaywallEarly(true)}
          className="fixed top-0 left-0 right-0 z-[60] py-2 px-4 text-center w-full"
          style={{ background: '#C96A3A', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#FAF7F3', fontSize: '13px' }}>
            {trialDaysLeft === 1
              ? 'Your free trial ends tomorrow. Tap to subscribe.'
              : `${trialDaysLeft} days left in your free trial. Tap to subscribe.`}
          </span>
        </button>
      )}

      {/* Trial banner: shown days 5, 6, 7 of an active Apple IAP trial */}
      {isTrialing && trialDaysRemaining <= 3 && (
        <div className="fixed top-0 left-0 right-0 z-[60] py-2 px-4 text-center" style={{ background: '#C96A3A' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#FAF7F3', fontSize: '13px' }}>
            {trialDaysRemaining === 1
              ? 'Your free trial ends tomorrow. Subscribe to keep your practice.'
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
        const isToolTab = ['toolkit', 'meditate'].includes(activeTab);
        if (isToolTab) {
          return (
            <>
              {/* Tool pages: same Target rings as Soundscapes */}
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
            {/* Seed of Life: sacred geometry background */}
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
            {/* Seed of Life: sacred geometry background */}
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
        className={`fixed left-0 right-0 z-50 px-8 pb-3 flex flex-col items-center gap-2 transition-all duration-300 ${isNavVisible && !isInMorningFlow && activeTab !== 'coach' ? 'top-0 opacity-100' : '-top-40 opacity-0'} `}
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
            if (!ritualDoneToday && !morningSkipped && !shouldShowEveningMode && !forcedEvening && user) {
              const timeGreeting = hour < 12 ? `Good morning, ${firstName}.` : `Good afternoon, ${firstName}.`;
              const earlyStreak = user.streak ?? 0;
              const timeSub = (() => {
                if (earlyStreak === 2) return 'Day 2. You came back.';
                if (earlyStreak === 3) return 'Three days. The habit is forming.';
                if (earlyStreak >= 4 && earlyStreak <= 6) return `Day ${earlyStreak}. You are worth this much attention.`;
                if (earlyStreak >= 7 && earlyStreak <= 9) return "One week in. Don't stop now.";
                return hour < 12 ? "Keep moving forward." : 'A moment for yourself.';
              })();
              const isIntroStep = beat1Step === 'intro';
              const isMessageStep = beat1Step === 'message';

              // ── Single container, widget never unmounts ──────────────────────────
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
                    // flex-start for scroll steps, content stacks from top.
                    justifyContent: isCentered ? 'center' : 'flex-start',
                    paddingTop: isCentered
                      ? 'calc(env(safe-area-inset-top) + 1.5rem)'
                      : 'calc(env(safe-area-inset-top) + 3.5rem)',
                    paddingBottom: isCentered
                      ? 'calc(4.5rem + env(safe-area-inset-bottom))'
                      : 'calc(6rem + env(safe-area-inset-bottom))',
                  }}
                >
                  {/* Greeting: false-renders when not intro, keeping widget at stable DOM position */}
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

                  {/* Widget: always position 1. React never unmounts it across step transitions. */}
                  <div className="w-full">
                    <DailyMorningPracticeWidget
                      userName={user.name || "Friend"}
                      onComplete={handlePrimingComplete}
                      onFinish={() => setShowMorningSuccess(true)}
                      isFirstEver={!(user.practiceData && user.practiceData.totalPractices > 0)}
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
                      onSkip={async () => {
                        haptics.light();
                        // Try to schedule a nudge ~2 hours from now (cap at 10 PM).
                        try {
                          const { LocalNotifications } = await import('@capacitor/local-notifications');
                          const status = await LocalNotifications.checkPermissions();
                          const permitted = status.display === 'granted'
                            || (status.display === 'prompt' && await notifications.requestPermission());
                          if (permitted) {
                            const remind = new Date();
                            remind.setHours(Math.min(remind.getHours() + 2, 22), 0, 0, 0);
                            await LocalNotifications.schedule({
                              notifications: [{
                                id: 9001,
                                title: 'Your morning practice is waiting',
                                body: 'Take a moment to set your intention. It only takes 2 minutes.',
                                schedule: { at: remind },
                                smallIcon: 'ic_stat_icon',
                              }],
                            });
                            setMorningSkipReminderSent(true);
                          }
                        } catch {
                          // Notifications unavailable on web or denied: skip silently
                        }
                        setMorningSkipped(true);
                      }}
                    />
                  </div>

                  {/* Evening shortcut: false-renders when not applicable */}
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
            // forcedEvening (night-signup onboarding) bypasses this, it's intentional.
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
                      language={user.language}
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
                        // Register the evening GLAD practice as a REAL practice: log it into
                        // activityHistory + practiceData (totalPractices, lastActivityDate) AND
                        // advance the streak: mirroring the morning path. Previously it only set
                        // lastActivityDate, so evening-only days never counted toward practices,
                        // milestones, or streak, and the recovery nudge kept false-firing.
                        const yd = new Date(); yd.setDate(yd.getDate() - 1);
                        const yesterdayStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
                        const hadActivityTodayBefore = (user.activityHistory || []).some(log => log.date === todayDate)
                            || (user.practiceData?.activityHistory || []).some(a => a.date === todayDate);
                        const hadActivityYesterday = (user.activityHistory || []).some(log => log.date === yesterdayStr)
                            || (user.practiceData?.activityHistory || []).some(a => a.date === yesterdayStr);
                        let newStreak = user.streak || 0;
                        if (!hadActivityTodayBefore) {
                          newStreak = hadActivityYesterday ? newStreak + 1 : 1;
                        }
                        const eveningPracticeResult = logPractice(user.practiceData || migrateStreakToPractice(user), 'evening_glad');
                        updateProfile({ ...user, dailyEveningPractice: [...otherEntries, data], practiceData: eveningPracticeResult.data, streak: newStreak });
                        analytics.eveningPracticeCompleted({ gratitudeCount: data.gratitude?.length ?? 0 });
                        // Cancel tonight's last-call notification: they finished the practice
                        cancelEveningLastCall();
                        triggerConfetti();
                        setShowEveningSuccess(true);
                        setTimeout(() => setShowEveningSuccess(false), 3000);
                        // Queue the milestone celebration (if any) to fire after the evening
                        // success overlay fades, so the two don't visually collide.
                        if (eveningPracticeResult.milestone && eveningPracticeResult.isNew && eveningPracticeResult.milestoneName) {
                          const milestoneName = eveningPracticeResult.milestoneName;
                          setTimeout(() => triggerMilestoneCelebration(milestoneName), 3200);
                        }
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

            // ── Nudge priority queue ─────────────────────────────────────────────
            // These promo/setup cards used to render independently of each other, so a
            // few days into using the app it was possible to see up to 6 of them
            // stacked back to back before reaching any real content (Mandala, Message
            // of the Day, Goals). Resolving to a single winner keeps the same relative
            // priority order they already rendered in, but shows at most one at a time.
            const canShareDay1 = (user?.practiceData?.totalPractices ?? 0) === 1 && !shareDayOneDismissed;
            const canQuickTour = (user?.practiceData?.totalPractices ?? 0) >= 1 && !quickTourDismissed;
            const canProfileNudge = showProfileNudge;
            const canInterests = showInterestsCard && !!user && (user.practiceData?.totalPractices ?? 0) >= 1;
            const canPartnerDiscovery = COACH_CHAT_ENABLED && showPartnerDiscovery && !!user && (user.practiceData?.totalPractices ?? 0) >= 1;
            const canMemoryCallback = !!continuityOpener && !!user && (user.practiceData?.totalPractices ?? 0) >= 1 && !memoryCallbackDismissed;
            const canSignInNudge = showSignInNudge && !!user;
            const activeHomeNudge = canShareDay1 ? 'shareDay1'
              : canQuickTour ? 'quickTour'
              : canProfileNudge ? 'profileNudge'
              : canInterests ? 'interests'
              : canPartnerDiscovery ? 'partnerDiscovery'
              : canMemoryCallback ? 'memoryCallback'
              : canSignInNudge ? 'signInNudge'
              : null;

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
                          : morningSkipped
                            ? 'Your practice is here whenever you\'re ready.'
                            : hour < 12 ? 'Ready to rise?' : hour < 18 ? 'Ready to flourish?' : 'Ready to unwind?'}
                  </p>
                </motion.div>

                {/* ── Morning practice nudge when user skipped ─── */}
                {morningSkipped && !ritualDoneToday && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <button
                      onClick={() => {
                        haptics.light();
                        setMorningSkipped(false);
                      }}
                      className={`w-full rounded-2xl px-5 py-4 flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${isDarkMode ? 'bg-white/[0.07] border border-white/[0.10] hover:bg-white/[0.10]' : 'bg-white border border-[#C96A3A]/20 shadow-sm hover:border-[#C96A3A]/40'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-pale-gold/15 text-pale-gold' : 'bg-[#C96A3A]/10 text-[#C96A3A]'}`}>
                          <Clock size={14} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                          <p className={`text-xs font-black uppercase tracking-[0.15em] mb-0.5 ${isDarkMode ? 'text-white/50' : 'text-[#C96A3A]/70'}`}>Morning Practice</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>Ready when you are</p>
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-white/30' : 'text-sage/30'}><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </motion.div>
                )}

                {/* ── Today's Intention ────────────────────── */}
                {ritualDoneToday && todaysIntention && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                  >
                    {/* Intention pill: wraps to 2 lines for longer phrases */}
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

                {/* ── Day 1 evening nudge, morning done, evening not yet unlocked ── */}
                {shouldShowEveningMode && isFirstPracticeDay && ritualDoneToday && !eveningDoneToday && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isDarkMode ? 'bg-white/[0.07] border border-white/[0.10]' : 'bg-white border border-sage/20 shadow-sm'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-pale-gold/15' : 'bg-sage/10'}`}>
                        <Moon size={16} color={isDarkMode ? '#E5D6A7' : '#5A7A5C'} strokeWidth={2} />
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-[0.15em] mb-0.5 ${isDarkMode ? 'text-white/50' : 'text-sage/50'}`}>Evening Practice</p>
                        <p className={`text-sm font-medium leading-snug ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                          Opens tomorrow night. Tonight, rest in today's practice.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Evening message card, shown after evening practice completes ── */}
                {eveningDoneToday && (() => {
                  const todayEveningPractice = (user?.dailyEveningPractice || []).find(p => p.date === todayDate);
                  if (!todayEveningPractice?.reflectionMessage) return null;
                  return (
                    <motion.div
                      key="evening-message"
                      className="mb-5"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <Suspense fallback={null}>
                        <EveningMessageCard
                          practice={todayEveningPractice}
                          isDarkMode={isDarkMode}
                          onRefresh={() => {}}
                        />
                      </Suspense>
                    </motion.div>
                  );
                })()}

                {/* ── Day 1 warm state, only for brand new users ── */}
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
                      <p className="text-xs font-black uppercase tracking-[0.18em] mb-1" style={{ color: isDarkMode ? '#FFFFFF' : '#C96A3A' }}>
                        Day 1
                      </p>
                      <p className={`text-base font-bold mb-1 leading-snug ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                        Your garden is ready to grow.
                      </p>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-sage/60'}`}>
                        Start your first morning practice. Everything begins there.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Share Day 1 card, shown once after first practice ── */}
                <AnimatePresence>
                  {activeHomeNudge === 'shareDay1' && (
                    <motion.div
                      key="share-day1"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <HomeNudgeCard
                        isDarkMode={isDarkMode}
                        title="Day 1 done."
                        subtitle="Someone you know might need this too."
                        ctaLabel="Share →"
                        onCta={() => { haptics.light(); setShowDay1ShareModal(true); }}
                        onDismiss={() => { dismissShareDayOne(); haptics.light(); }}
                        lightBorderOpacity="12"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Quick Tour card, shown after practice 1 until dismissed ── */}
                <AnimatePresence>
                  {activeHomeNudge === 'quickTour' && (
                    <motion.div
                      key="quick-tour"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                    >
                      <HomeNudgeCard
                        isDarkMode={isDarkMode}
                        title="Here's what's inside"
                        subtitle="Daily messages, garden, dispatch, and more. A quick look at everything available to you."
                        ctaLabel="Take a look →"
                        onCta={() => { dismissQuickTour(); setShowWelcomeOrientation(true); }}
                        onDismiss={dismissQuickTour}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Profile completion nudge (after first practice) ── */}
                <AnimatePresence>
                  {activeHomeNudge === 'profileNudge' && (
                    <motion.div
                      key="profile-nudge"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <HomeNudgeCard
                        isDarkMode={isDarkMode}
                        variant="full"
                        title="Make it yours"
                        subtitle="Tell Palante about yourself so every message fits exactly where you are."
                        ctaLabel="Set up →"
                        onCta={() => { dismissProfileNudge(); setShowProfile(true); }}
                        onDismiss={dismissProfileNudge}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Personalize-your-content card, replaces the old first-run interests modal.
                    Deferred until partner discovery card is dismissed to avoid setup-card pile-up. ── */}
                <AnimatePresence>
                  {activeHomeNudge === 'interests' && (
                    <motion.div
                      key="interests-card"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <HomeNudgeCard
                        isDarkMode={isDarkMode}
                        variant="full"
                        title="Make your content fit"
                        subtitle="Tell Palante what you're into and your daily words will follow."
                        ctaLabel="Personalize →"
                        onCta={() => { haptics.light(); setShowPostPracticeSetup(true); }}
                        onDismiss={dismissInterestsCard}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Partner chat discovery, shown once after first practice to surface the Coach tab.
                    Gated behind COACH_CHAT_ENABLED (shelved for the Oct 2026 release) — the card is
                    kept intact, not deleted, so it's a clean re-enable later. ── */}
                <AnimatePresence>
                  {user && activeHomeNudge === 'partnerDiscovery' && (
                    <motion.div
                      key="partner-discovery"
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <GradientNudgeCard
                        isDarkMode={isDarkMode}
                        eyebrow="Your Partner"
                        title={`${user.coachName || 'Your partner'} remembers everything you just shared.`}
                        body="Ask a question, go deeper on your intention, or just talk. They're here between practices too."
                        ctaLabel={`Talk to ${user.coachName || 'your partner'} →`}
                        onCta={() => { haptics.light(); dismissPartnerDiscovery(); setActiveTab('coach'); }}
                        onDismiss={() => { haptics.light(); dismissPartnerDiscovery(); }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Memory callback card, surfaces the partner's continuity opener
                    (the same memory-aware line it greets you with in chat) right on
                    home, so the remembering is visible in the daily loop instead of
                    being locked in the chat tab. Only appears when there's a real
                    callback for today, so users without history never see clutter.
                    Shelved for the Oct 2026 release via the single COACH_CHAT_ENABLED
                    check inside useContinuityOpener itself (continuityOpener is always
                    null while the flag is off), so no separate gate is needed here. ── */}
                {user && activeHomeNudge === 'memoryCallback' && (
                  <motion.div
                    key="memory-callback"
                    className="mb-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <GradientNudgeCard
                      isDarkMode={isDarkMode}
                      eyebrow={user.coachName || 'Your partner'}
                      title={continuityOpener}
                      ctaLabel={`Continue with ${user.coachName || 'your partner'} →`}
                      onCta={() => { haptics.light(); dismissMemoryCallback(); practiceOriginRef.current = activeTab; setActiveTab('coach'); }}
                      onDismiss={() => { haptics.light(); dismissMemoryCallback(); }}
                    />
                  </motion.div>
                )}

                {/* ── Profile completion card, persistent until 90% complete or dismissed 3x.
                    Suppressed while any other Home nudge is active, so it never stacks
                    with the "Make it yours" prompt or the other promo cards above. ── */}
                {user && (user.practiceData?.totalPractices ?? 0) >= 1 && activeHomeNudge === null && (
                  <Suspense fallback={null}>
                    <ProfileCompletionCard
                      user={user}
                      isDarkMode={isDarkMode}
                      onOpenProfile={() => { haptics.light(); setShowProfile(true); }}
                    />
                  </Suspense>
                )}

                {/* ── Sign-in nudge, shown after 2+ sessions with no account ── */}
                <AnimatePresence>
                  {user && activeHomeNudge === 'signInNudge' && (
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
                            <ShieldCheck size={18} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-sage-dark'}`}>
                              Your progress isn't backed up yet
                            </p>
                            <p className={`text-xs leading-snug mb-3 ${isDarkMode ? 'text-white/70' : 'text-sage/70'}`}>
                              You've logged {user.practiceData?.totalPractices ?? 0} practice{(user.practiceData?.totalPractices ?? 0) !== 1 ? 's' : ''}. Create a free account to keep it safe across devices. Your settings and history come with you.
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
                        {(() => { const t = user.practiceData?.totalPractices || 0; if (t === 0) return 'Your mandala grows with each practice.'; return `${t > 0 && t % 90 === 0 ? 90 : t % 90} of 90 practices completed`; })()}
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
                    {/* First-time tooltip, shown until 3rd practice */}
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
                  // Hoisted so the same object reaches both the card and the favorite
                  // handler. DashboardQuoteCard only renders its heart when it is handed
                  // an onToggleFavorite, and nothing used to pass one, so favoriting was
                  // unreachable app-wide and the Favorites list in HistoryModal could
                  // never fill up.
                  const todayQuote: Quote = {
                    id: `message-of-day-${todayDate}`,
                    text: todayMessage ?? '',
                    author: user?.coachName || 'Palante',
                    intensity: (user?.quoteIntensity as 1 | 2 | 3) || 2,
                    category: 'morning-practice',
                    isAI: true,
                    isAffirmation: true,
                  };
                  const todayQuoteFavorited = (user?.favoriteQuotes || [])
                    .some(fav => String(fav.quoteId) === todayQuote.id);
                  return todayMessage ? (
                  <motion.div
                    className="mb-5 relative"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Suspense fallback={<div className={`rounded-[2rem] h-20 animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-sage/8'}`} />}>
                      <DashboardQuoteCard
                        quote={todayQuote}
                        isDarkMode={isDarkMode}
                        isFavorited={todayQuoteFavorited}
                        onToggleFavorite={() => handleToggleFavorite(todayQuote)}
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

                    {/* Goal list: capped at 3 */}
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

          {activeTab === 'toolkit' && (
            <ErrorBoundary name="Explore">
            <PageTransition>
              <div className="min-h-screen max-w-md mx-auto">
                <PracticeView
                  isDarkMode={isDarkMode}
                  user={user ?? undefined}
                  onNavigate={(section) => {
                    if (section === 'soundscapes') {
                      setShowSoundMixer(true);
                    } else {
                      practiceOriginRef.current = activeTab;
                      setActiveTab(section);
                    }
                  }}
                  onWriteLetter={() => {
                    setLetterContext('manual');
                    setLetterContextDetails('');
                    setShowLetterWrite(true);
                  }}
                  onOpenHighlights={() => setShowWeeklyHighlightsModal(true)}
                  highlightsBadge={showWeeklyHighlights}
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
              {(user?.practiceData?.totalPractices ?? 0) === 1 && (
                <p
                  className="text-sm font-body mb-3"
                  style={{ color: 'rgba(229,214,167,0.55)' }}
                >
                  Your first one is done. The rest get easier.
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


      {/* Full-screen Overlays */}
      {activeTab === 'breath' && (
        <ErrorBoundary name="Breathing">
          <div className="fixed inset-0 z-[45] flex flex-col" style={{ background: '#415D43' }}>
            {/* Rings: same pattern as all other practice pages */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <Target className="absolute top-0 right-0 w-[110vmin] h-[110vmin] translate-x-1/2 -translate-y-1/2 text-white opacity-[0.06]" />
              <Target className="absolute bottom-0 left-0 w-[90vmin] h-[90vmin] -translate-x-1/2 translate-y-1/2 text-white opacity-[0.06]" />
            </div>
            {/* Spacer: clears the persistent global header (Profile/Koi Pond/Soundscapes icons),
                which now stays visible on the Breathwork screen same as it does on Meditation. */}
            <div style={{ height: 'calc(env(safe-area-inset-top) + 8.5rem)' }} />
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
        {/* Defensive guard: even if a stray state transition sets activeTab to 'coach'
            (e.g. a leftover deep link or restored nav state), COACH_CHAT_ENABLED keeps
            the shelved chat screen from surfacing until the feature is re-enabled. */}
        {COACH_CHAT_ENABLED && activeTab === 'coach' && user && (
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
              onFirstAIResponse={requestAppReview}
              onToast={(message) => {
                setToastMessage(message);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2500);
              }}
            />
          </motion.div>
          </ErrorBoundary>
        )}
      </AnimatePresence>






      {/* Premium Bottom Navigation - Scroll Aware */}
      {/* z-[55]: above page content (z-20) but BELOW every modal/sheet layer (z-60+).
          Overlays must cover the nav, a nav floating above an open modal accepts taps
          that switch the tab underneath while the modal stays put, which reads as a
          dead nav bar. pointer-events-none while hidden keeps the offscreen nav from
          swallowing taps mid-transition. */}
      < nav className={`fixed left-1/2 -translate-x-1/2 z-[55] transition-all duration-300 ${isNavVisible && !showKoiPond ? 'bottom-4 md:bottom-8 opacity-100' : '-bottom-24 opacity-0 pointer-events-none'} `}>
        <div className={`flex items-center gap-1 md:gap-3 px-3 md:px-6 py-3 md:py-4 rounded-full backdrop-blur-xl border transition-all duration-500 ${navClass} `}>
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'momentum', icon: TrendingUp, label: 'Progress' },
            { id: 'toolkit', icon: Layers, label: 'Explore' },
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
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
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
                  <Icon size={20} className="md:w-5 md:h-5 w-5 h-5" aria-hidden="true" />
                  {tab.id === 'momentum' && showWeeklyHighlights && (
                    <span aria-label="New highlights" className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#C96A3A] animate-pulse" />
                  )}
                  {tab.id === 'momentum' && !showWeeklyHighlights && (user?.streak ?? 0) > 0 && (
                    <span
                      aria-label="Active streak"
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)' }}
                    />
                  )}
                </div>
                <span className="text-xs md:text-xs font-medium" aria-hidden="true">{tab.label}</span>
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

      {/* Weekly Highlights modal: opened only when user taps the home card */}
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
        title="You're in."
        message="Practice 1 is done. That's how it starts."
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
          // High-emotion moment, ask for an App Store review after a short delay.
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
                language: user.language,
              },
            });
          }
        }}
        onShare={async () => {
          const { shareMilestoneAsImage } = await import('./utils/shareUtils');
          const labels: Record<RingCeremonyType, string> = {
            ring1: '10 Practices: Ring One Complete',
            ring2: '28 Practices: Ring Two Complete',
            ring3: '55 Practices: Ring Three Complete',
            fullbloom: '90 Days: Full Bloom',
          };
          await shareMilestoneAsImage({
            title: labels[ringCeremony.type],
            label: 'Mandala of Growth',
            count: user?.practiceData?.totalPractices ?? 0,
            message: "My garden is growing. Pa'lante.",
            iconName: 'Trophy',
            shareText: `${labels[ringCeremony.type]}. Pa'lante. #PalanteApp`,
          });
        }}
        onSave={async () => {
          const { saveMilestoneToPhotos } = await import('./utils/shareUtils');
          await saveMilestoneToPhotos({
            title: '90 Days: Full Bloom',
            label: 'Mandala of Growth',
            count: user?.practiceData?.totalPractices ?? 90,
            message: "My garden is in full bloom. Pa'lante.",
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
            title: 'Full Bloom: 90 Days',
            label: 'My Growth Story',
            count: user?.practiceData?.totalPractices ?? 90,
            message: memoir.slice(0, 120) + (memoir.length > 120 ? '...' : ''),
            iconName: 'Trophy',
            shareText: `90 days with Palante. My story: ${memoir.slice(0, 100)}... Pa'lante! #PalanteApp`,
          });
        }}
      />

      {/* Your Year, Forward, annual memoir */}
      <Suspense fallback={null}>
        <YearForwardModal
          isOpen={yearForward.isOpen}
          data={yearForward.data}
          onClose={() => setYearForward(prev => ({ ...prev, isOpen: false }))}
          onShare={async (letter) => {
            const { shareMilestoneAsImage } = await import('./utils/shareUtils');
            await shareMilestoneAsImage({
              title: `My Year, Forward: ${yearForward.data?.year ?? new Date().getFullYear()}`,
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
          existingContentType={user?.contentTypePreference}
          existingSourcePreference={user?.sourcePreference}
        />
      </Suspense>

      {/* Notification permission ask: deferred to a return session (not the first-practice day) */}
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






      {/* Rest day grace modal: shown when user missed exactly yesterday with a real streak */}
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
            streak: user.streak ?? 0,
            totalPractices: user.practiceData?.totalPractices ?? 0,
            colorCycle: user.mandalaColorCycle ?? 0,
            firstName: user.name?.split(' ')[0] || undefined,
          }}
          onGenerateImage={async () => {
            setIsGeneratingStreakCard(true);
            try {
              const { shareStreakCard } = await import('./utils/shareUtils');
              await shareStreakCard({
                streak:         user.streak ?? 0,
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

      {/* Day 1 share modal: uses the existing beautiful quote card */}
      {showDay1ShareModal && user && (
        <ShareModal
          isOpen={showDay1ShareModal}
          onClose={() => { setShowDay1ShareModal(false); dismissShareDayOne(); }}
          isDarkMode={isDarkMode}
          streakData={{
            streak: user.streak ?? 0,
            totalPractices: user.practiceData?.totalPractices ?? 0,
            colorCycle: user.mandalaColorCycle ?? 0,
            firstName: user.name?.split(' ')[0] || undefined,
          }}
          onGenerateImage={async () => {
            setIsGeneratingDay1Card(true);
            try {
              const { shareStreakCard } = await import('./utils/shareUtils');
              await shareStreakCard({
                streak:         user.streak ?? 0,
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
              const s: Partial<CoachSettings> = user.coachSettings || {};
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
              }}
              onMilestone={triggerMilestoneCelebration}
            />
          )
        }
      </Suspense>

      {/* CheckIn is now a home card via HomeNudgeCards: no modal */}


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
          {showKoiPond && user && (
            <KoiPond
              isDarkMode={isDarkMode}
              onClose={() => setShowKoiPond(false)}
              streak={user.streak || 0}
              points={user.points || 0}
              totalPractices={user.practiceData?.totalPractices || 0}
              savedMixes={user.savedMixes || []}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* Early paywall: user tapped the trial ribbon to subscribe before the trial expires */}
      {showPaywallEarly && (
        <Suspense fallback={null}>
          <PaywallScreen
            source="trial_ribbon"
            firstName={user?.name?.split(' ')[0]}
            practiceCount={user?.practiceData?.totalPractices ?? 0}
            gratitudeCount={(user?.dailyMorningPractice || user?.dailyPriming || [])
              .reduce((n, p) => n + (p.gratitudes?.filter((g: string) => g.trim()).length || 0), 0)}
            onDismiss={() => setShowPaywallEarly(false)}
            onShowPrivacy={() => { setShowPaywallEarly(false); navigate('/privacy#privacy'); }}
            onShowTerms={() => { setShowPaywallEarly(false); navigate('/privacy'); }}
          />
        </Suspense>
      )}

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
            // This instance (the Soundscapes overlay opened from the global header,
            // i.e. the one nearly every user reaches) was never given a delete
            // handler, so a saved mix could be created but never removed. The
            // Meditation instance above has always had one.
            onDeleteMix={(mixId) => {
              if (user) {
                updateProfile({ ...user, savedMixes: (user.savedMixes || []).filter(m => m.id !== mixId) });
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
          {/* Age gate overlays the splash so users see the brand before bureaucracy */}
          {showAgeGate && (
            <Suspense fallback={null}>
              <AgeVerificationModal
                isOpen={true}
                onClose={() => {}}
                onVerify={handleAgeVerified}
                isDarkMode={true}
                required={true}
              />
            </Suspense>
          )}
        </Suspense>
      </DebugErrorBoundary>
    );
  }

  // AI disclosure gates the app itself rather than the intro, so it covers both a fresh
  // install and everyone already past onboarding when this shipped. It comes after the
  // age gate on purpose: we tell someone what we send to a model only once we know
  // they're old enough to be sending anything.
  return (
    <Suspense fallback={null}>
      {appJsx}
      {/* Wait for the profile before showing it: the screen reads the current AI setting
          for its toggle, and acknowledging writes back to that same profile. */}
      {showAIDisclosure && user && (
        <Suspense fallback={null}>
          <AIDisclosureModal
            isOpen={true}
            isDarkMode={isDarkMode}
            required={true}
            initialAIEnabled={!user.aiDisabled}
            onAcknowledge={handleAIDisclosureAcknowledged}
          />
        </Suspense>
      )}
    </Suspense>
  );
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
