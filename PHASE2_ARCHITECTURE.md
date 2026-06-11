# Phase 2: The Learning System
## How Palante Becomes Personal

### The Core Problem We're Solving
Phase 1 gives the system *structure* (voice profile, rating UI, behavior patterns). Phase 2 gives it *meaning* — the AI learns what actually lands with the user by analyzing the connection between rated messages and the user's input data.

---

## System Overview: Three Engines

### 1. **The Rating Analyzer Engine**
Runs when a user rates a message (1-5 stars). Extracts:
- What words/phrases appeared in the rated message
- What the user was experiencing (mood, energy, context)
- Whether this rating is consistent with their history (outlier detection)

**Output:**
- Add highly-rated phrases to `resonantPhrases`
- Add low-rated phrases to `avoidPhrases`
- Track which `coreThemes` appear in 4-5 star messages
- Update `lastUpdated` timestamp

**Trigger:** When `onRateMessage(rating)` is called on morning or evening practice card

---

### 2. **The Value Extractor Engine**
Runs every 7 days after at least 3-5 rated messages. Analyzes what matters to the user by examining:
- Words/concepts appearing in 5-star gratitudes
- Recurring themes across high-rated morning practices
- Values implicit in evening reflections (GLAD method)

**Algorithm:**
1. Collect all gratitudes/affirmations from past 7 days with ratings >= 4
2. Extract 1-2 word concepts (e.g., "family" → "presence", "work stress" → "boundaries")
3. Look for repeating themes across entries
4. Rank by frequency in high-rated messages
5. Return top 3-5 as `coreThemes` and `extractedValues`

**Output:**
- Update `extractedValues` in `UserVoiceProfile`
- Update `coreThemes`
- Set `messagesSinceUpdate: 0`

**Trigger:** After 7+ messages rated, runs nightly at 11 PM

---

### 3. **The Message Generator Engine (Redesigned)**
Generates messages using learned patterns instead of generic prompts.

**New Logic:**
```
If user has no ratings yet (Phase 1):
  → Use fallback generic messages (current system)
  → Encourage the user to rate messages

If user has 3-5 ratings:
  → Use their voice tone + message length (from voice profile)
  → Incorporate their top extracted values naturally
  → Avoid any phrases from avoidPhrases
  → Use prompt injection: "This person deeply values [extracted_values]. Messages mentioning these land 5x better."

If user has 50+ ratings:
  → Use a hybrid approach:
    - 60% personalized (their values + tone + length + resonant phrases)
    - 40% fresh content (new angles, new quotes, preventing repetition)
  → A/B test: alternate between variant A (heavy personalization) and variant B (light personalization)
    - Track which variant gets higher ratings
    - Adjust ratio accordingly
```

**Inputs to the generator:**
- `userVoiceProfile` (tone, length, extracted values, resonant phrases, avoid phrases)
- User's current mood/energy (if available)
- Recent practice data (last 3 days of gratitudes, etc.)
- Behavioral patterns (preferred time, frequency, etc.)

---

## New Types Required

### Added to `UserVoiceProfile`:
```typescript
export interface UserVoiceProfile {
    // ... existing fields ...
    
    // NEW: Learning metadata
    ratedMessageCount: number;           // Total messages rated
    totalMessagesGenerated: number;       // Total messages shown
    engagementRate: number;              // ratedMessageCount / totalMessagesGenerated
    averageRating: number;               // Mean of all ratings (1-5)
    
    // NEW: A/B Testing
    activeVariant?: 'personalized' | 'control';  // Which version this user is seeing
    variantHistory?: {
        variant: string;
        testingFrom: string;  // ISO date
        testingTo?: string;
        averageRating: number;
        sampleSize: number;
    }[];
    
    // NEW: Message quality tracking
    messageQualityLog?: {
        date: string;
        averageRatingThatDay: number;
        theme?: string;
    }[];
    
    // Metadata improvements
    analysisHistory?: {
        date: string;
        extractedValuesSnapshot: string[];
        coreThemesSnapshot: string[];
    }[];
}
```

### New Utility Service:

```typescript
// services/VoiceProfileLearner.ts
export class VoiceProfileLearner {
    /**
     * Called when a message is rated (1-5)
     */
    async recordMessageRating(
        userId: string,
        messageId: string,
        message: string,
        rating: 1 | 2 | 3 | 4 | 5,
        context: {
            type: 'morning' | 'evening';
            userInputs?: {
                gratitudes?: string[];
                affirmations?: string[];
                energy?: number;
                mood?: string;
            };
        }
    ): Promise<void>;
    
    /**
     * Extracts values from high-rated messages
     * Runs weekly after minimum 3-5 ratings
     */
    async updateExtractedValues(userId: string): Promise<UserVoiceProfile>;
    
    /**
     * Identifies phrases that appear frequently in high/low rated messages
     */
    private extractPhrases(
        messages: Array<{ text: string; rating: 1 | 2 | 3 | 4 | 5 }>,
        threshold: 'high' | 'low'
    ): string[];
    
    /**
     * Returns a personalized prompt for the message generator
     * Uses learned patterns to inject context about what matters
     */
    getPersonalizationContext(voiceProfile: UserVoiceProfile): {
        prompt: string;
        constraints: string[];
        exemplars?: string[];  // Examples of 5-star messages
    };
}
```

---

## Implementation Timeline

### Week 1: Rating Analyzer
- [ ] Create `VoiceProfileLearner` service with rating recording
- [ ] Add phrase extraction logic (simple: split by spaces, filter stopwords)
- [ ] Wire up `onRateMessage` handlers on both morning and evening cards
- [ ] Test: Rate 5 messages, verify `resonantPhrases` and `avoidPhrases` update

### Week 2: Value Extractor
- [ ] Implement `updateExtractedValues()` algorithm
- [ ] Create nightly job to run analysis on users with 7+ rated messages
- [ ] Add `coreThemes` extraction from gratitude patterns
- [ ] Test: After 7 rated messages, verify extracted values appear

### Week 3: Message Generator v2
- [ ] Refactor message generation to accept `voiceProfile`
- [ ] Implement fallback → personalized → hybrid logic
- [ ] Add resonant phrase injection to prompts
- [ ] Test: Generate message, verify it includes extracted values + avoids bad phrases

### Week 4: A/B Testing + Analytics
- [ ] Add variant tracking to voice profile
- [ ] Implement message quality logging
- [ ] Create dashboard to show: ratings over time, top themes, engagement rate
- [ ] Test: Verify variants alternate and ratings are tracked

---

## Success Metrics

By **Week 4**, the system should:
- ✅ Record every rating and extract phrases within seconds
- ✅ Auto-update extracted values every 7 days
- ✅ Generate messages that mention user's actual values
- ✅ Track which message variants perform better
- ✅ Show measurable improvement in average rating over time

**Target:** Users with 30+ rated messages see +40% average rating improvement vs. messages generated with Phase 1 logic alone.

---

## Critical Unknowns (To Be Tested)

1. **How specific should extracted values be?**
   - "family" or "presence with family"?
   - Test with different abstraction levels

2. **How much personalization is too much?**
   - Does hybrid (60% personalized, 40% fresh) work better than 100% personalized?
   - A/B test to find the sweet spot

3. **What time window matters for patterns?**
   - Last 7 days? 14 days? 30 days?
   - Does it change seasonally?

4. **Do resonant phrases generalize?**
   - If "courage" works, does "courageous" also work?
   - Or is exact phrase matching necessary?

---

## Architectural Notes

- **Storage:** All learning happens on user's device (Supabase) → no external AI calls to analyze user data
- **Privacy:** Extracted values stay in user's voice profile → AI generator only sees the *patterns*, not raw inputs
- **Resilience:** If learning fails, fallback to generic messages (graceful degradation)
- **Cold Start:** New users get Phase 1 generic messages until they rate 3+ messages
