// export type Tier = 1 | 2 | 3; // REMOVED
export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type QuoteIntensity = 1 | 2 | 3; // 1: Gentle, 2: Direct, 3: Bold

export type ActivityType = 'quote' | 'breath' | 'reflect' | 'meditate';
export type ContentType = 'quotes' | 'affirmations' | 'mix';
export type QuoteSource = 'human' | 'ai' | 'mix';

export interface ActivityLog {
    date: string; // ISO date string (YYYY-MM-DD)
    type: ActivityType;
    count: number; // Number of times performed that day (or minutes, depending on metric)
    duration?: number; // Total duration in minutes (useful for meditation/breathing)
    details?: string; // Optional context (e.g., "Box Breathing", "Theta Waves")
}

export interface StreakActivity {
    date: string; // YYYY-MM-DD
    practices: string[]; // ['meditation', 'morning_practice', 'breathwork', 'reflection', 'goal']
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string; // ISO date (YYYY-MM-DD)
    isGracePeriod: boolean;
    gracePeriodEndsAt: string | null; // ISO timestamp
    milestones: {
        week: boolean;      // 7 days
        month: boolean;     // 30 days
        century: boolean;   // 100 days
        year: boolean;      // 365 days
    };
    activityHistory: StreakActivity[];
}

// NEW: Practice-based tracking (replaces streak pressure)
export interface PracticeActivity {
    date: string; // YYYY-MM-DD
    practices: string[]; // ['meditation', 'morning_practice', 'breathwork', 'reflection', 'goal']
}

export interface PracticeData {
    totalPractices: number; // Total number of practices completed (all time)
    lastActivityDate: string; // ISO date (YYYY-MM-DD)
    milestones: {
        practices_7: boolean;      // 7 total practices
        practices_30: boolean;     // 30 total practices
        practices_100: boolean;    // 100 total practices
        practices_365: boolean;    // 365 total practices
    };
    activityHistory: PracticeActivity[];
}

export interface UserProfile {
    id: string; // Authentication ID
    name: string;
    age?: number;
    coachName?: string; // Personal AI Coach Name
    career: string;
    profession: string;
    interests: string[];
    // tier: Tier; // REMOVED
    quoteIntensity: QuoteIntensity; // 1: Gentle, 2: Direct, 3: Bold
    subscriptionTier: SubscriptionTier;
    streak: number;
    points: number;
    sourcePreference: QuoteSource;
    contentTypePreference: ContentType;
    currentMood?: 'Happy' | 'Anxious' | 'Tired' | 'Energetic' | 'Calm' | 'Stressed';

    notificationFrequency: number;
    quietHoursStart: string;
    quietHoursEnd: string;
    hapticsEnabled?: boolean;
    gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
    ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
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
    currentEnergy?: 1 | 2 | 3 | 4 | 5;
    energyHistory?: EnergyLog[];
    accountabilityPartners?: AccountabilityPartner[];
    partnerInviteCode?: string;
    level?: number;
    xp?: number;
    unlockedBadges?: string[];
    noiseEntries?: NoiseEntry[];
    dailyMorningPractice?: DailyMorningPractice[];
    dailyEveningPractice?: DailyEveningPractice[]; // NEW: Evening GLAD method
    dashboardOrder?: string[];
    exploreOrder?: string[];
    homeEssentialTools?: string[];
    savedMixes?: SoundMix[];
    streakData?: StreakData; // DEPRECATED: Use practiceData instead
    practiceData?: PracticeData; // NEW: Pressure-free practice tracking
    weeklyReports?: WeeklyReport[];
    behaviorPattern?: UserBehaviorPattern;
    coachInterventions?: CoachIntervention[];
    sharedGoals?: SharedGoal[];
    routines?: RoutineStack[];
    activeRoutineId?: string;
    dailyPriming?: DailyMorningPractice[]; // Legacy alias for compatibility
    dateOfBirth?: string; // ISO date string for age verification
    ageVerified?: boolean; // Has user provided DOB
    journalPromptsEnabled?: boolean; // Show prompts in daily reflection (default: true)
    aiDisabled?: boolean; // Master switch to disable all AI features (default: false)
    focusAreas?: ('stress' | 'focus' | 'sleep' | 'confidence' | 'relationships' | 'productivity')[]; // What user is working on
    restDays?: string[]; // ISO date strings of intentional rest days (preserves streak)
    futureLetters?: FutureLetter[]; // Letters written to future self for tough days
    weightGoal?: number; // Target weight in lbs
    weightHistory?: { date: string; weight: number }[]; // History of weight logs
    userNarrative?: {
        text: string;        // 4-5 sentence synthesized growth memoir
        generatedAt: string; // ISO timestamp — refreshed weekly
    };
    monthlyPattern?: {
        insight: string;     // The warm discovery sentence
        dataPoint: string;   // The specific number or fact that grounds it
        generatedAt: string; // ISO timestamp — refreshed monthly
        dismissed: boolean;  // User has acknowledged it
    };
}

export interface DailyEveningPractice {
    id: string;
    date: string; // ISO date string (YYYY-MM-DD)
    gratitude: string;
    learning: string;
    accomplishment: string;
    delight: string;
    reflectionMessage?: string;
}

// Future Letter (Emotional Time Capsule)
export interface FutureLetter {
    id: string;
    content: string; // The encouraging message
    writtenDate: string; // ISO date string when letter was written
    context: 'meditation' | 'goal_achievement' | 'streak_milestone' | 'manual' | 'onboarding'; // What triggered the letter
    contextDetails?: string; // e.g., "7-day streak", "Completed morning meditation"
    hasBeenDelivered: boolean; // Has this letter been shown to the user yet?
    deliveredDate?: string; // ISO date string when letter was delivered
    scheduledDeliveryDate?: string; // ISO date — deliver on/after this date regardless of energy level
}


// Palante Coach Types
export interface UserBehaviorPattern {
    userId: string;
    patterns: {
        preferredPracticeTime: {
            meditation: 'morning' | 'afternoon' | 'evening' | 'unknown';
            breathwork: 'morning' | 'afternoon' | 'evening' | 'unknown';
            morningPractice: 'early' | 'late_morning' | 'unknown';
        };
        practiceFrequency: {
            meditation: number; // per week
            breathwork: number;
            reflections: number;
        };
        skipPatterns: {
            daysOfWeek: number[]; // 0-6, which days user typically skips
            consecutiveSkips: number;
        };
        moodPatterns: {
            lowEnergyDays: number[]; // days of week
            averageEnergy: number;
        };
        goalCompletionRate: number;
        responseToNudges: {
            morning: number; // engagement rate 0-1
            afternoon: number;
            evening: number;
        };
    };
    lastAnalyzed: string;
}

export interface CoachIntervention {
    id: string;
    type: 'suggestion' | 'encouragement' | 'alternative' | 'check_in' | 'streak_warning';
    trigger: {
        condition: string;
        confidence: number;
    };
    message: string;
    action?: {
        type: 'open_practice' | 'show_breathing' | 'suggest_goal' | 'show_meditation';
        data?: Record<string, unknown>;
    };
    priority: 'low' | 'medium' | 'high';
    timestamp: string;
    dismissed?: boolean;
    accepted?: boolean;
}

// Social Accountability Types
export interface SharedGoal {
    id: string;
    title: string;
    description?: string;
    createdBy: string;
    participants: string[];
    targetDate: string;
    category: string;
    progress: Record<string, number>; // userId -> progress %
    checkIns: GoalCheckIn[];
    createdAt: string;
}

export interface WeeklyCheckIn {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    userId: string;
    practicesCompleted: number;
    goalsAchieved: number;
    mood: string;
    message?: string;
    timestamp: string;
}

export interface GroupChallenge {
    id: string;
    title: string;
    description: string;
    type: 'meditation' | 'breathwork' | 'morning_practice' | 'streak' | 'custom';
    duration: number; // days
    startDate: string;
    endDate: string;
    goal: {
        metric: 'count' | 'minutes' | 'days';
        target: number;
    };
    participants: ChallengeParticipant[];
    isActive: boolean;
}

export interface ChallengeParticipant {
    userId: string;
    userName: string;
    joinedDate: string;
    progress: number;
    lastUpdate: string;
}

export interface WeeklyReport {
    weekStartDate: string; // ISO date (Monday)
    weekEndDate: string; // ISO date (Sunday)
    practices: {
        meditation: { count: number; totalMinutes: number };
        breathwork: { count: number; totalMinutes: number };
        morningPractice: { count: number };
        reflections: { count: number };
    };
    moodTrends: {
        mostCommonMood: string;
        energyAverage: number;
        moodDistribution: Record<string, number>;
    };
    goals: {
        set: number;
        completed: number;
        completionRate: number;
    };
    streakInfo: {
        maintained: boolean;
        currentStreak: number;
        longestThisWeek: number;
    };
    topQuotes: Quote[]; // Top 3 most impactful
    insights: string[]; // Personalized messages
    comparisonToPreviousWeek?: {
        practiceChange: number; // +2 or -1
        moodChange: 'improved' | 'declined' | 'stable';
    };
}

export interface SoundMix {
    id: string;
    name: string;
    volumes: Record<string, number>; // { 'rain': 0.5, 'white': 0.2 }
    createdAt: string;
}

export interface DailyMorningPractice {
    id: string;
    date: string; // ISO date string (YYYY-MM-DD)
    gratitudes: string[]; // List of 5 gratitudes
    affirmations: string[]; // List of 5 affirmations
    dailyIntention?: string; // One word intention
    messageOfTheDay?: string; // Generated AI message
}

export type DailyPriming = DailyMorningPractice; // Legacy alias

export interface NoiseEntry {
    id: string;
    text: string;
    timestamp: string; // ISO date string
    category?: 'fear' | 'guilt' | 'pressure' | 'insecurity' | 'other';
    wasCleared: boolean; // true after acknowledgment
}

export interface AccountabilityPartner {
    id: string;
    name: string;
    currentStreak: number;
    lastActivityDate: string;
    inviteStatus: 'pending' | 'accepted';
    addedDate: string;
}

// Activity Feed for Social Layer
export interface PartnerActivity {
    id: string;
    partnerId: string;
    partnerName: string;
    type: 'practice_complete' | 'goal_achieved' | 'streak_milestone' | 'nudge_sent';
    message: string;
    timestamp: string;
}

export type CoachTone = 'nurturing' | 'direct' | 'accountability';

export interface CoachSettings {
    nudgeFrequency: 'morning-only' | 'morning-evening' | 'off';
    nudgeEnabled: boolean;
    tipsEnabled?: boolean;
    waterRemindersEnabled?: boolean;
    lastNudgeTime?: string;
    coachTone?: CoachTone; // How the coach shows up — defaults to 'nurturing'
}

export interface DailyFocus {
    id: string;
    text: string;
    isCompleted: boolean;
    createdAt: string;
    energyLevelWhenCreated?: 1 | 2 | 3 | 4 | 5;
    estimatedDuration?: 'quick' | 'medium' | 'long';
    order?: number;
}

export interface EnergyLog {
    timestamp: string;
    level: 1 | 2 | 3 | 4 | 5;
}

export interface JournalEntry {
    id: string;
    date: string;
    highlight: string;
    midpoint: string;
    lowlight: string;
    freeform?: string;
    energyLevel?: 1 | 2 | 3 | 4 | 5;
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
    intensity: QuoteIntensity; // 1: Gentle, 2: Direct, 3: Bold
    // tier: Tier; // REMOVED
    tags?: string[];
    category: string;
    profession?: string;
    isAI?: boolean;
    isAffirmation?: boolean; // True for affirmations, undefined/false for quotes
}

export interface Milestone {
    day: number;
    title: string;
    icon: string;
    bonusPoints: number;
    badge: string;
    message: string;
}

export interface FavoriteQuote {
    quoteId: string;
    savedAt: string;
}

// Routine Stacks
export type StackStepType = 'breathwork' | 'journal' | 'checkin' | 'fasting' | 'quote' | 'meditation' | 'gratitude' | 'affirmation' | 'focus';

export interface StackStep {
    id: string;
    type: StackStepType;
    label: string;
    description?: string;
    title?: string;
    text?: string;
    requiresInput?: boolean;
    duration?: number; // Estimated duration in seconds
    config?: Record<string, unknown>; // Component specific config
}

export interface RoutineStack {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    steps: StackStep[];
    isDefault?: boolean;
    totalDuration?: number; // Total estimated time in minutes
    themeColor?: string; // e.g. 'sage', 'rose', 'sky'
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

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
    timestamp: number;
}

// ── Coach Sessions ───────────────────────────────────────────────────────────

export type CoachPillar = 'anxiety' | 'focus' | 'motivation' | 'setbacks' | 'open';

export interface CoachSession {
    id: string;
    pillar: CoachPillar;
    title: string;           // Auto-generated from first user message
    messages: ChatMessage[];
    createdAt: number;       // timestamp ms
    updatedAt: number;       // timestamp ms
    messageCount: number;
}

// Age Verification Helpers
export const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// Set to true when payment is live to enforce subscription gating on AI features.
const AI_REQUIRES_SUBSCRIPTION = false;

export const canUseAI = (user: UserProfile | null | undefined): boolean => {
    if (!user) return false;
    if (user.aiDisabled) return false;
    if (AI_REQUIRES_SUBSCRIPTION && user.subscriptionTier === 'free') return false;
    if (!user.dateOfBirth) return true; // backward compat — no DOB means adult assumed
    const age = calculateAge(user.dateOfBirth);
    return age >= 13; // COPPA compliance
};

// Ready-to-use premium check — wire into any feature that should be behind paywall.
export const isPremiumUser = (user: UserProfile | null | undefined): boolean => {
    if (!user) return false;
    return user.subscriptionTier === 'premium' || user.subscriptionTier === 'pro';
};

export const isMinor = (user: UserProfile | null | undefined): boolean => {
    if (!user || !user.dateOfBirth) return false;
    const age = calculateAge(user.dateOfBirth);
    return age >= 13 && age < 18; // Teen users (13-17)
};

export const getAgeGroup = (user: UserProfile | null | undefined): 'child' | 'teen' | 'adult' | 'unknown' => {
    if (!user || !user.dateOfBirth) return 'unknown';
    const age = calculateAge(user.dateOfBirth);
    if (age < 13) return 'child';
    if (age < 18) return 'teen';
    return 'adult';
};



