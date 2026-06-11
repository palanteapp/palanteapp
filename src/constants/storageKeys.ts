/**
 * Central registry of all localStorage keys used in Palante.
 * Import from here instead of using string literals directly.
 */

/**
 * Bump this string with each TestFlight / App Store release to re-surface
 * the welcome letter and profile nudge for returning users who install the
 * new build. Format: 'MAJOR.MINOR' — no patch needed.
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
  GARDEN_AFFIRMATION: 'palante_garden_affirmation',
  GARDEN_AFFIRMATION_DATE: 'palante_garden_affirmation_date',

  // Midday Check-in
  CHECKIN_LAST_SHOWN: 'palante_checkin_last_shown', // ISO date string e.g. "2026-04-29"

  // Day-3 letter prompt (shown once after 3rd practice)
  LETTER_PROMPT_SHOWN: 'palante_letter_prompt_shown',

  // Notification permission ask — shown once after first practice
  NOTIF_ASK_SEEN: 'palante_notif_ask_seen',

  // Share Day 1 card — shown once after first practice is completed
  SHARE_DAY1_DISMISSED: 'palante_share_day1_dismissed',

  // Sign-in nudge — shown after user accumulates real data but hasn't created an account
  SIGNIN_NUDGE_DISMISSED: 'palante_signin_nudge_dismissed',

  // Age gate — COPPA compliance (must pass before intro sequence)
  AGE_GATE_PASSED: 'palante_age_gate_passed',

  // Ring ceremony flags (shown once per ring completion)
  RING1_CEREMONY_SHOWN: 'palante_ring1_ceremony_shown',
  RING2_CEREMONY_SHOWN: 'palante_ring2_ceremony_shown',
  RING3_CEREMONY_SHOWN: 'palante_ring3_ceremony_shown',
  FULLBLOOM_CEREMONY_SHOWN: 'palante_fullbloom_ceremony_shown',
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
