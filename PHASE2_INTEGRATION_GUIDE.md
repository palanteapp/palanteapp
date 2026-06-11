# Phase 2 Integration Guide
## Wiring the Learning System Into Existing Components

### Quick Summary
You now have:
- ✅ **VoiceProfileLearner** (voiceProfileLearner.ts) — The learning engine
- ✅ **RatingHandler** (ratingHandler.ts) — Saves ratings to database and updates profile
- ✅ **PersonalizedMessageGenerator** (personalizedMessageGenerator.ts) — Uses learned patterns
- ⬜ **Component Integration** (this guide)

The missing piece is connecting the rating UI to the learning system. This guide shows exactly where and how.

---

## Step 1: Wire Rating Handlers to EveningMessageCard

**File:** `/Users/michaelvargas/Developer/Palante/src/components/EveningMessageCard.tsx`

Currently, `onRateMessage` is called but doesn't save anything. Replace it:

```typescript
// BEFORE (current code):
const handleRateMessage = (rating: 1 | 2 | 3 | 4 | 5) => {
    if (onRateMessage) {
        onRateMessage(rating);
    }
};

// AFTER (with learning):
import { recordMessageRating } from '../utils/ratingHandler';

const handleRateMessage = async (rating: 1 | 2 | 3 | 4 | 5) => {
    // Update the practice in the database with the rating
    const { error } = await supabase
        .from('daily_evening_practice')
        .update({ message_rating: rating })
        .eq('id', practice.id);

    if (!error) {
        // Trigger the learning system
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId && practice.reflectionMessage) {
            await recordMessageRating(
                userId,
                practice.id,
                'evening',
                practice.reflectionMessage,
                rating
            );
        }
    }

    // Call parent handler
    if (onRateMessage) {
        onRateMessage(rating);
    }
};
```

Then update the star buttons to use this handler:
```typescript
// In the star rating section (around line 177):
{[1, 2, 3, 4, 5].map((star) => (
    <button
        key={star}
        onClick={(e) => {
            e.stopPropagation();
            handleRateMessage(star as 1 | 2 | 3 | 4 | 5);
        }}
        // ... rest of button props
    >
```

---

## Step 2: Wire Rating Handlers to DailyMorningPracticeWidget

**File:** `/Users/michaelvargas/Developer/Palante/src/components/DailyMorningPracticeWidget.tsx`

The morning practice likely renders the message card. Find where the message rating UI is and add:

```typescript
import { recordMessageRating } from '../utils/ratingHandler';

// In the rating handler:
const handleRateMessage = async (rating: 1 | 2 | 3 | 4 | 5) => {
    const { error } = await supabase
        .from('daily_morning_practice')
        .update({ message_rating: rating })
        .eq('id', morningPracticeId);

    if (!error) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId && morningMessage) {
            await recordMessageRating(
                userId,
                morningPracticeId,
                'morning',
                morningMessage,
                rating
            );
        }
    }

    // Trigger any parent callbacks
    onRateMessage?.(rating);
};
```

---

## Step 3: Update Message Generation to Use Personalized Generator

**File:** Any file that calls `generateMorningPracticeMessage` or `generateEveningPracticeMessage`

Find the call and update it:

```typescript
// BEFORE:
import { generateMorningPracticeMessage } from '../utils/aiService';

const message = await generateMorningPracticeMessage(userName, {
    gratitudes,
    affirmations,
    intention,
    coachTone: user.userVoiceProfile?.voiceTone
});

// AFTER:
import { generatePersonalizedMorningMessage } from '../utils/personalizedMessageGenerator';
import { getUserVoiceProfile } from '../utils/ratingHandler';

const voiceProfile = await getUserVoiceProfile(userId);
const message = await generatePersonalizedMorningMessage(userName, {
    gratitudes,
    affirmations,
    intention,
    userVoiceProfile: voiceProfile, // Pass the learned profile
    coachTone: voiceProfile?.voiceTone
});
```

Same pattern for evening:
```typescript
import { generatePersonalizedEveningMessage } from '../utils/personalizedMessageGenerator';

const voiceProfile = await getUserVoiceProfile(userId);
const message = await generatePersonalizedEveningMessage(userName, {
    gratitude,
    learning,
    accomplishment,
    delight,
    userVoiceProfile: voiceProfile,
});
```

---

## Step 4: Add Learning Progress Indicator (Optional)

Show users how much the system has learned about them. Add this to the dashboard:

```typescript
import { getLearningProgress } from '../utils/voiceProfileLearner';
import { getLearningPhaseMessage } from '../utils/personalizedMessageGenerator';

function LearningProgressIndicator({ voiceProfile }: { voiceProfile?: UserVoiceProfile }) {
    if (!voiceProfile) return null;

    const progress = getLearningProgress(voiceProfile);
    const phaseMessage = getLearningPhaseMessage(voiceProfile);

    return (
        <div className="p-4 rounded-lg bg-sage/5 border border-sage/20">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-sage/70">
                    {progress.phase === 'starting' && 'Getting to know you'}
                    {progress.phase === 'learning' && 'Learning your patterns'}
                    {progress.phase === 'personalized' && 'Personalizing messages'}
                    {progress.phase === 'optimized' && 'Fully personalized'}
                </span>
                <span className="text-xs font-semibold text-sage">{progress.progress}%</span>
            </div>
            <div className="w-full h-2 bg-sage/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-sage transition-all duration-500"
                    style={{ width: `${progress.progress}%` }}
                />
            </div>
            <p className="text-xs text-sage/60 mt-2">{phaseMessage}</p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                    <p className="text-sage/50">Rated</p>
                    <p className="font-bold text-sage">{progress.stats.ratedMessages}</p>
                </div>
                <div>
                    <p className="text-sage/50">Avg Rating</p>
                    <p className="font-bold text-sage">{progress.stats.averageRating}/5</p>
                </div>
            </div>
        </div>
    );
}
```

---

## Step 5: Database Migrations (If Needed)

If `user_voice_profile` is not already a column on the `profiles` table, add it:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_voice_profile jsonb DEFAULT NULL;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_voice_profile ON profiles USING gin(user_voice_profile);
```

---

## Step 6: Testing the Learning System

### Quick Smoke Test
1. Generate a morning message
2. Rate it (1-5 stars)
3. Check Supabase: `profiles.user_voice_profile` should have `ratedMessageCount: 1`
4. Generate and rate 7+ more messages
5. Check the voice profile for `coreThemes` and `extractedValues`

### Full Test Scenario
1. Create a test user
2. Set up their voice profile (nurturing tone, balanced length)
3. Generate 10 morning messages
4. Rate them all (mix 5-star and 1-star ratings)
5. Check that:
   - `ratedMessageCount` = 10
   - `averageRating` is calculated
   - `resonantPhrases` contains phrases from 5-star messages
   - `avoidPhrases` contains phrases from 1-star messages
   - `engagementRate` is > 0

### Weekly Analysis Test
1. Have a test user rate 10+ messages
2. Wait for the weekly analysis to run (or call it manually)
3. Verify that `coreThemes` are extracted from GLAD data
4. Verify that `messagesSinceUpdate` resets to 0

---

## Step 7: Next: Hook Into Nightly Jobs

Once basic integration works, add a nightly job to analyze all users:

```typescript
// In your edge function or cron job handler:
export async function analyzeAllUserProfiles() {
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, user_voice_profile, daily_morning_practice, daily_evening_practice');

    for (const profile of allProfiles) {
        if (shouldRunWeeklyAnalysis(profile.user_voice_profile)) {
            const updates = VoiceProfileLearner.analyzeWeeklyPatterns(
                profile.user_voice_profile,
                profile.daily_morning_practice,
                profile.daily_evening_practice
            );

            await supabase
                .from('profiles')
                .update({
                    user_voice_profile: { ...profile.user_voice_profile, ...updates }
                })
                .eq('id', profile.id);
        }
    }
}

// Schedule this to run nightly at 11 PM in user's timezone
```

---

## Troubleshooting

### Issue: Ratings not being saved
- Check that `recordMessageRating` is being called after the database update
- Verify that `messageOfTheDay` / `reflectionMessage` is populated before rating
- Check browser console for errors

### Issue: Extracted values are empty after 7+ ratings
- Verify that gratitudes/affirmations are being saved to `daily_morning_practice`
- Check that evening practice GLAD entries are saved
- Review the theme extraction keywords in `voiceProfileLearner.ts`

### Issue: Resonant phrases look generic
- The phrase extraction needs a minimum frequency (set to 2 by default)
- With only 10 ratings, generic phrases will dominate
- After 30+ ratings with good diversity, you'll see more specific patterns

### Issue: Message still feels generic after personalization
- Check that `userVoiceProfile` is being passed to the message generator
- Verify that `_personalizationHint` is in the prompt (if you add it)
- Remember: Phase 2 improves gradually — huge shifts come around rating #30+

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `voiceProfileLearner.ts` | Core learning engine (extraction, analysis, scoring) |
| `ratingHandler.ts` | Database interaction for ratings and profile updates |
| `personalizedMessageGenerator.ts` | Wrapper that uses learned patterns |
| `types.ts` | Types for `UserVoiceProfile` (already has rating fields) |

---

## Phase 2 Success Criteria

By the end of integration, you should be able to:
- ✅ Rate a message and see the rating saved
- ✅ Rate 7+ messages and see extracted values appear
- ✅ See resonant/avoid phrases in the voice profile after 10+ ratings
- ✅ Generate a message and see personalization context applied
- ✅ Track learning progress on the dashboard

Once this works, you've completed **Phase 2 Core** and the system is actually learning.
