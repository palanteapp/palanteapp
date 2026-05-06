/**
 * Central registry of all localStorage keys used in Palante.
 * Import from here instead of using string literals directly.
 */
export const STORAGE_KEYS = {
  // User / Auth
  USER: 'palante_user',
  INTRO_SEEN: 'palante_intro_seen',
  ONBOARDING_COMPLETED: 'palante_onboarding_completed',
  VIBE_CHECKED: 'palante_vibe_checked',

  // Quotes
  DAILY_QUOTE: 'palante_daily_quote',
  QUOTE_DATE: 'palante_quote_date',
  LAST_QUOTE: 'palante_last_quote',
  SEEN_QUOTES: 'palante_seen_quotes',
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

  // Midday Check-in
  CHECKIN_LAST_SHOWN: 'palante_checkin_last_shown', // ISO date string e.g. "2026-04-29"
} as const;

/** sessionStorage keys (not persisted across sessions) */
export const SESSION_KEYS = {
  MORNING_MODE_SHOWN: 'palante_morning_mode_shown',
  LETTER_SHOWN_TODAY: 'palante_letter_shown_today',
  LAST_HOUR: 'palante_last_hour',
  REST_DAY_CHECKED: 'palante_rest_day_checked',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
