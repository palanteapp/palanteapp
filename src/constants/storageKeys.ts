/**
 * Central registry of all localStorage keys used in Palante.
 * Import from here instead of using string literals directly.
 */

/**
 * Bump this string with each TestFlight / App Store release to re-surface
 * the welcome letter and profile nudge for returning users who install the
 * new build. Format: 'MAJOR.MINOR', no patch needed.
 */
export const WELCOME_VERSION = '1.1';

export const STORAGE_KEYS = {
  // User / Auth
  USER: 'palante_user',
  INTRO_SEEN: 'palante_intro_seen',
  ONBOARDING_COMPLETED: 'palante_onboarding_completed',
  VIBE_CHECKED: 'palante_vibe_checked',

  // Onboarding / Welcome
  // Version-stamped so returning users see the welcome letter after each release.
  // Change WELCOME_VERSION above to reset these flags for all users.
  WELCOME_SHOWN: `palante_welcome_shown_v${WELCOME_VERSION}`,
  PROFILE_NUDGE_DISMISSED: `palante_profile_nudge_dismissed_v${WELCOME_VERSION}`,
  POST_PRACTICE_SETUP_SEEN: 'palante_post_practice_setup_seen',
  APP_USED: 'palante_app_used',
  DISCLAIMER_ACCEPTED: 'palante_disclaimer_accepted',

  // Quotes
  DAILY_QUOTE: 'palante_daily_quote',
  QUOTE_DATE: 'palante_quote_date',
  LAST_QUOTE: 'palante_last_quote',
  SEEN_QUOTES: 'palante_seen_quotes',
  RECENT_QUOTES: 'palante_recent_quotes',
  SEEN_AUTHORS: 'palante_seen_authors',
  FAVORITE_QUOTES: 'palante_favorite_quotes',
  PINNED_QUOTE: 'palante_pinned_quote',
  PENDING_QUOTE_CARD: 'palante_pending_quote_card',

  // Goals / Focus
  GOALS_EXPANDED: 'palante_goals_expanded',

  // Fasting & Food Journal
  FOOD_JOURNAL_ENTRIES: 'palante_food_journal_entries',
  FASTING_STATUS: 'palante_fasting_status',
  FASTING_START_TIME: 'palante_fasting_start_time',
  FASTING_TARGET: 'palante_fasting_target',
  FASTING_STREAK: 'palante_fasting_streak',
  FASTING_HISTORY: 'palante_fasting_history',
  FASTING_HYDRATION: 'palante_fasting_hydration',
  FASTING_GOAL_WEIGHT: 'palante_fasting_goal_weight',
  FASTING_WEIGHTS: 'palante_fasting_weights',
  WEIGHT_UNIT: 'palante_weight_unit',
  SEEN_AUTOPHAGY: 'palante_seen_autophagy',

  // Notifications
  NOTIFICATIONS: 'palante_notifications',
  HAPTICS_ENABLED: 'palante_haptics_enabled',

  // Features
  ENHANCEMENTS: 'palante_enhancements',
  FOCUS_SETTINGS: 'palante_focus_settings',
  FOCUS_SESSION: 'palante_focus_session',
  SOUNDMIXER_HELP_SEEN: 'palante_soundmixer_help_seen',

  // Misc
  LAST_RESET_DATE: 'palante_last_reset_date',

  // Cloud sync: the profiles.updated_at value from our last successful
  // read/write. If the cloud stamp differs, another device wrote in between
  // and we merge instead of overwriting.
  CLOUD_SYNC_STAMP: 'palante_cloud_sync_stamp',

  // Coach Sessions
  COACH_SESSIONS: 'palante_coach_sessions',

  // Weekly Highlights popup
  WEEKLY_HIGHLIGHTS_SHOWN: 'palante_weekly_highlights_shown', // ISO week string e.g. "2026-W15"

  // Profile card dismissal
  PROFILE_CARD_DISMISSED: 'palante_profile_card_dismissed',
  PROFILE_CARD_DISMISS_COUNT: 'palante_profile_card_dismiss_count',

  // Journal / Reflections
  JOURNAL_ENTRY: 'palante_journal', // Suffix with date string
  EVENING_PRACTICE: 'palante_evening_practice', // Suffix with date string

  // Garden affirmation (AI-generated, aligned with daily intention)

  // Midday Check-in
  CHECKIN_LAST_SHOWN: 'palante_checkin_last_shown', // ISO date string e.g. "2026-04-29"

  // Day-3 letter prompt (shown once after 3rd practice)
  LETTER_PROMPT_SHOWN: 'palante_letter_prompt_shown',

  // Notification permission ask: shown once after first practice
  NOTIF_ASK_SEEN: 'palante_notif_ask_seen',

  // Share Day 1 card: shown once after first practice is completed
  SHARE_DAY1_DISMISSED: 'palante_share_day1_dismissed',

  // Date of the user's very first completed practice (ISO date, e.g. "2026-06-11").
  // Used to suppress the automatic evening prompt on Day 1 so new users can explore first.
  FIRST_PRACTICE_DATE: 'palante_first_practice_date',

  // Sign-in nudge, stores ISO date last dismissed (re-surfaces after 3 days)
  SIGNIN_NUDGE_DISMISSED: 'palante_signin_nudge_dismissed',

  // Partner/chat discovery card: shown once after first practice to surface the Coach tab
  PARTNER_CHAT_DISCOVERY_SHOWN: 'palante_partner_chat_discovery_shown',

  // Age gate: COPPA compliance (must pass before intro sequence)
  AGE_GATE_PASSED: 'palante_age_gate_passed',

  // Quick Tour card: shown on home after practice 1, dismissed by user
  QUICK_TOUR_DISMISSED: 'palante_quick_tour_dismissed',

  // Ring ceremony flags (shown once per ring completion)
  RING1_CEREMONY_SHOWN: 'palante_ring1_ceremony_shown',
  RING2_CEREMONY_SHOWN: 'palante_ring2_ceremony_shown',
  RING3_CEREMONY_SHOWN: 'palante_ring3_ceremony_shown',
  FULLBLOOM_CEREMONY_SHOWN: 'palante_fullbloom_ceremony_shown',

  // Apple Health: tracks whether the one-time connect prompt has been shown
  HEALTH_ASKED: 'palante_health_asked',

  // Cold start: seed memories written from onboarding data, loaded into partner chat
  SEED_MEMORIES: 'palante_seed_memories',

  // Continuity opener: the memory-aware greeting the partner opens a new session
  // with. Cached per local day { date, text } so it costs at most one AI call/day;
  // empty text means "computed today, nothing worth recalling" (don't regenerate).
  CONTINUITY_OPENER: 'palante_continuity_opener',

  // Home memory-callback card. ISO date the user last dismissed it, so the card
  // stays hidden for the rest of that day instead of nagging on every home visit.
  MEMORY_CALLBACK_DISMISSED: 'palante_memory_callback_dismissed',

  // AI usage budget: per-user daily partner-chat call count { date, count }.
  // Caps the only unbounded AI cost vector so a single heavy user can't run
  // their yearly API cost past what they pay. See utils/aiUsageBudget.ts.
  AI_USAGE: 'palante_ai_usage',

  // Last morning-message fallback text actually shown, so getFallbackMorningMessage
  // (aiService.ts) can avoid literally repeating it — its pick is otherwise fully
  // deterministic on the day's entered content, which reads as "nothing is actually
  // writing this" the moment two mornings' entries are similar. Now the only path,
  // not an occasional one, since AI_FEATURES_ENABLED is off.
  LAST_MORNING_FALLBACK: 'palante_last_morning_fallback',

  // AI disclosure: record of the user acknowledging how Palante uses AI, stored as
  // { acknowledged, timestamp, version }. Version is AI_DISCLOSURE_VERSION; bumping it
  // re-shows the screen so a material change to what we send or who we send it to is
  // surfaced rather than buried in a policy update. See data/aiDisclosure.ts.
  AI_DISCLOSURE_ACKNOWLEDGED: 'palante_ai_disclosure_acknowledged',
} as const;

/** sessionStorage keys (not persisted across sessions) */
export const SESSION_KEYS = {
  MORNING_MODE_SHOWN: 'palante_morning_mode_shown',
  MORNING_DONE: 'palante_morning_done',
  LETTER_SHOWN_TODAY: 'palante_letter_shown_today',
  LAST_HOUR: 'palante_last_hour',
  REST_DAY_CHECKED: 'palante_rest_day_checked',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
