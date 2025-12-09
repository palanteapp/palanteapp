export type Tier = 1 | 2 | 3;
export type SubscriptionTier = 'free' | 'premium' | 'pro';

export type ActivityType = 'quote' | 'breath' | 'reflect' | 'meditate';

export interface ActivityLog {
    date: string; // ISO date string (YYYY-MM-DD)
    type: ActivityType;
    count: number; // Number of times performed that day (or minutes, depending on metric)
}

export interface UserProfile {
    name: string;
    career: string;
    profession: string;
    interests: string[];
    tier: Tier;
    subscriptionTier: SubscriptionTier;
    streak: number;
    points: number;
    sourcePreference: 'human' | 'ai' | 'mix';
    voicePreference?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    notificationFrequency: number;
    quietHoursStart: string;
    quietHoursEnd: string;
    goals: Goal[];
    activityHistory?: ActivityLog[];
    favoriteQuotes?: FavoriteQuote[];
    dailyFocuses?: DailyFocus[];
    lastCoachInteraction?: string;
    meditationReflections?: MeditationReflection[];
    journalEntries?: JournalEntry[];
    coachSettings?: CoachSettings;
    goalStreak?: number;
    lastGoalCompletionDate?: string;
}

export interface CoachSettings {
    nudgeFrequency: 'hourly' | 'every-2-hours' | 'every-4-hours' | 'morning-evening' | 'off';
    nudgeEnabled: boolean;
    lastNudgeTime?: string;
}

export interface DailyFocus {
    id: string;
    text: string;
    isCompleted: boolean;
    createdAt: string;
}

export interface JournalEntry {
    id: string;
    date: string;
    highlight: string;
    midpoint: string;
    lowlight: string;
}

export interface MeditationReflection {
    id: string;
    date: string; // ISO date string
    intention: string;
    duration: number; // minutes
    reflection: string;
    mantra: string;
}

export interface Quote {
    id: string;
    text: string;
    author: string;
    tier: Tier;
    tags?: string[];
    category: string;
    profession?: string;
    isAI?: boolean;
}

export interface Milestone {
    day: number;
    title: string;
    emoji: string;
    bonusPoints: number;
    badge: string;
    message: string;
}

export interface FavoriteQuote {
    quoteId: string;
    savedAt: string;
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    category: string;
    targetValue?: number;
    currentValue: number;
    unit?: string;
    deadline?: string;
    createdAt: string;
    completedAt?: string;
    checkIns: GoalCheckIn[];
}

export interface GoalCheckIn {
    date: string;
    progress: number;
    note?: string;
}
