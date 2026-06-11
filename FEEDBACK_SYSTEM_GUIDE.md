# Message Feedback System
## Capturing "Why" to Refine Personalization

### Overview

The feedback system extends Phase 2 with **qualitative feedback** — not just ratings, but understanding *why* a message landed or missed.

**Problem it solves:**
- User rates a message ⭐⭐⭐ but we don't know why
- Is it too generic? Wrong tone? Wrong timing? Missing the point?
- Without the "why," we can't adapt

**Solution:**
After users rate, ask 1-2 quick follow-up questions to capture context and reasoning.

---

## How It Works

### 1. User Rates a Message
Morning or evening practice card → User taps ⭐⭐⭐⭐⭐

### 2. Feedback Modal Appears
"What made this land for you?" with options:
- "Felt written for me"
- "Lifted my energy"
- "Felt truly seen"
- "Called me forward"
- "Grounded me"

### 3. Optional Follow-up
"What specifically resonated?" → User can add a comment

### 4. Context Snapshot
Stored for later analysis:
```json
{
    "rating": 5,
    "resonanceReason": "specific-to-me",
    "currentMood": "hopeful",
    "currentEnergy": 4,
    "comment": "The part about presence really hit"
}
```

### 5. Weekly Context Update
Every week (or after 7 days), ask:
- "What's the main thing you're working on right now?"
- "What do you want more of in messages?"
- "What's less helpful?"
- "Where are you in your journey?" (breakthrough/struggle/steady/recovering)

### 6. Analysis & Adaptation
System analyzes patterns:
- "Users with high energy prefer accountability tone"
- "When you're stressed, you rate nurturing messages higher"
- "You consistently respond to mentions of family"

---

## Files & Components

### Backend Logic
- **messageFeedbackCapture.ts** — Core feedback system
  - `recordMessageFeedback()` — Save feedback
  - `getContextCapture()` — Get weekly context questions
  - `saveContextSnapshot()` — Save context data
  - `analyzeFeedbackPatterns()` — Extract insights

### React Components
- **MessageFeedbackModal.tsx** — Post-rating feedback form
  - Shows after user rates
  - Asks "why" they rated it
  - Option for free-form comment
  - Different questions for high vs low ratings

- **WeeklyContextUpdate.tsx** — Weekly context refresh
  - "What matters to you right now?"
  - "Want more/less of?"
  - "Where are you in your journey?"
  - Progress bar, multi-step form

---

## Integration Checklist

### Step 1: Create Database Tables

Run these migrations in Supabase:

```sql
-- Message Feedback Table
CREATE TABLE message_feedback (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    practice_id TEXT NOT NULL,
    practice_type TEXT NOT NULL CHECK (practice_type IN ('morning', 'evening')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_feedback_user_date ON message_feedback(user_id, created_at DESC);
CREATE INDEX idx_message_feedback_practice ON message_feedback(practice_id);

-- User Context Snapshots Table
CREATE TABLE user_context_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    date DATE NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{}',
    context JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_context_snapshots_user_date ON user_context_snapshots(user_id, date DESC);
```

### Step 2: Wire Feedback Modal to Rating Components

In **EveningMessageCard.tsx** (or wherever message rating happens):

```typescript
import { MessageFeedbackModal } from './MessageFeedbackModal';

const [showFeedback, setShowFeedback] = useState(false);
const [ratedRating, setRatedRating] = useState<1|2|3|4|5 | null>(null);

const handleRateMessage = async (rating: 1|2|3|4|5) => {
    // Save the rating
    await supabase
        .from('daily_evening_practice')
        .update({ message_rating: rating })
        .eq('id', practice.id);

    // Record for learning system
    await recordMessageRating(userId, practice.id, 'evening', practice.reflectionMessage, rating);

    // Show feedback modal
    setRatedRating(rating);
    setShowFeedback(true);
};

// In render:
<MessageFeedbackModal
    isOpen={showFeedback}
    onClose={() => setShowFeedback(false)}
    rating={ratedRating!}
    practiceType="evening"
    practiceId={practice.id}
    userId={userId}
/>
```

### Step 3: Show Weekly Context Update

In a dashboard or settings component:

```typescript
import { WeeklyContextUpdate } from './WeeklyContextUpdate';

const [showWeeklyUpdate, setShowWeeklyUpdate] = useState(false);

// Check if user needs weekly update
const shouldShowWeeklyUpdate = () => {
    const lastSnapshot = getLatestContext(userId); // from messageFeedbackCapture
    const lastDate = lastSnapshot?.date;
    const today = new Date().toISOString().split('T')[0];
    
    return !lastDate || lastDate !== today;
};

// In render:
{shouldShowWeeklyUpdate() && (
    <WeeklyContextUpdate
        userId={userId}
        onClose={() => setShowWeeklyUpdate(false)}
    />
)}
```

### Step 4: Add Feedback Analysis to Dashboard

```typescript
import { analyzeFeedbackPatterns, buildFeedbackSummary } from '../utils/messageFeedbackCapture';

function FeedbackInsights({ userId }: { userId: string }) {
    const [insight, setInsight] = useState(null);

    useEffect(() => {
        analyzeFeedbackPatterns(userId, 'week').then(setInsight);
    }, [userId]);

    if (!insight) return null;

    return (
        <div className="p-4 rounded-lg bg-sage/5 border border-sage/20">
            <h3 className="font-bold mb-3">What I've Learned This Week</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {buildFeedbackSummary(insight)}
            </pre>
        </div>
    );
}
```

---

## How This Refines Personalization

### Example Flow

**Day 1:**
- User rates morning message ⭐⭐⭐⭐⭐
- Feedback: "Felt written for me" + comment: "The part about presence"
- System learns: Mentions of "presence" score high

**Day 3:**
- User rates morning message ⭐
- Feedback: "Too generic"
- System learns: Generic language doesn't land

**Day 7:**
- Weekly context update: "Working on stress management, want more grounding"
- System notes: User's focus has shifted to stress/grounding

**Day 8:**
- Next message generation gets context:
  ```
  voiceProfile.wantMore = ["grounding"]
  voiceProfile.currentFocus = "stress management"
  feedbackInsight.topResonanceReasons = [
    { reason: "specific-to-me", frequency: 2 }
  ]
  ```
- Message is more grounded, specific to stress work → likely rates higher

**Day 14:**
- System has 10+ ratings with clear patterns
- Analysis shows:
  - "Messages about presence consistently rate 4-5 stars"
  - "User prefers 'grounding' language over 'growth'"
  - "Afternoon messages rate higher than morning"
- Next messages adapt based on these patterns

---

## Database Schema

### message_feedback Table
```
id                  TEXT PRIMARY KEY
user_id             UUID (references profiles)
practice_id         TEXT (morning/evening practice ID)
practice_type       TEXT ('morning' or 'evening')
rating              INTEGER (1-5)
feedback            JSONB {
    resonanceReason?    'specific-to-me' | 'lifted-me-up' | 'saw-me' | 'called-me-out' | 'grounded-me'
    missReason?         'too-generic' | 'too-cheerful' | 'missed-the-point' | 'wrong-timing'
    currentMood?        string
    currentEnergy?      1-5
    comment?            string
}
timestamp           TIMESTAMP
```

### user_context_snapshots Table
```
id                  SERIAL PRIMARY KEY
user_id             UUID (references profiles)
date                DATE (when snapshot was created)
preferences         JSONB {
    wantMore        string[] (["humor", "directness", ...])
    wantLess        string[] (["platitudes", "rushing", ...])
    currentFocus?   string
}
context             JSONB {
    lifePhase?      'breakthrough' | 'struggle' | 'steady' | 'recovering' | 'new'
    recentHappening? string
    energyLevel?    1-5
}
last_updated        TIMESTAMP
```

---

## Analysis & Insights

### What Gets Analyzed

**Resonance Reasons (for 4-5 star ratings):**
- How many times did "specific-to-me" appear?
- How many times did "lifted-me-up" appear?
- What themes appear most in high-rated messages?

**Miss Reasons (for 1-2 star ratings):**
- Is "too-generic" the #1 miss reason?
- Or is it "wrong-tone" / "wrong-timing"?
- This guides what to change

**Context Patterns:**
- "When user energy is <2, nurturing tone rates higher"
- "When user says 'stress', grounding messages outperform"
- "Afternoon messages average 0.3 stars higher than morning"

### Recommendations to User

System suggests:
```
"You respond best to personalized messages (seen in 80% of 5-star ratings).
Keep rating so we capture more of what works. After 30 ratings, I'll have
your patterns locked in."

"I notice generic language doesn't land for you. I'm focusing on specificity now."

"Your energy dips on Thursdays. We could shift tone for that day if you'd like."
```

---

## Usage Tips

### For Maximum Feedback
1. Make rating frictionless (inline stars, no modal delay)
2. Ask 1 follow-up question max (don't overwhelm)
3. Show them learning is working ("You rated highest when we mentioned presence")
4. Weekly context capture helps system understand *context shifts*

### For Accurate Analysis
1. Need minimum 10 feedback entries before patterns emerge
2. Need diversity (high ratings + low ratings) to see contrasts
3. Free-form comments are gold — read them and manually adjust if needed
4. Track over 4 weeks minimum to smooth out weekly noise

### Red Flags
- If all feedback is generic ("Too generic"), extraction is failing
- If "wrong-timing" is top miss reason, suggest time-of-day tuning
- If user energy consistently correlates with ratings, focus on mood-aware generation
- If engagement drops after feedback modal, make it lighter/faster

---

## Privacy & Data

All feedback stays on-device (in Supabase):
- Feedback is never sent to external AI (it's analyzed locally)
- Comments are stored but not analyzed for content (just pattern-matched)
- User can delete feedback history anytime
- Context snapshots are one per day (no continuous tracking)

---

## Future: Adaptive Prompting

Once this feedback system has ~30 ratings per user, you can:

1. **Inject context into message prompts:**
   ```
   "User typically rates 5 stars when: specific to them (seen in 70% of ratings),
   mentions of presence (theme appears in 10 of their high-rated messages),
   grounding language (appears in all 5-star evening messages)"
   ```

2. **A/B test different approaches:**
   - Variant A: Heavy personalization (use all learned patterns)
   - Variant B: Light personalization (use top 2 patterns only)
   - Track which variant gets higher ratings

3. **Context-aware generation:**
   - "User said they want more 'grounding' this week"
   - "User energy is low today"
   - "User usually rates accountability tone high on Mondays"
   - Adjust prompt accordingly

4. **Mood-triggered coaching:**
   - "You just rated a message low. What would have helped?"
   - Show recommended themes in next message
   - Track if recommendation improves rating

---

## Timeline

### Week 1: Setup
- Create database tables
- Wire feedback modal to components
- Integration complete

### Week 2: Testing
- Test with 5-10 users
- Verify feedback is saving correctly
- Check that analysis works

### Week 3: Iteration
- Users have 5-10 ratings each
- Read feedback comments
- Make manual adjustments if patterns are off
- Tweak theme keywords if needed

### Week 4: Launch
- Deploy to full user base
- Monitor feedback quality
- Start A/B testing variants
- Begin context-aware message generation

---

## Success Criteria

By end of Phase 2 + Feedback System:
- ✅ 70%+ of users rating messages
- ✅ 50%+ providing feedback reasons
- ✅ Clear patterns in resonance reasons (80% say "specific-to-me")
- ✅ User average rating trending up (3.5 → 4.0+)
- ✅ Comments showing system is learning ("You know me")

At this point: **The system is not just learning, it's adapting to what users tell it they need.**

That's the goal. User says "I need more grounding" → System delivers grounding → User rates it higher → System learns → Next message is even better.

**Feedback is the bridge from generic to genuinely personal.**
