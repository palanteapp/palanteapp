# Daily Companion Features - Implementation Plan

## Goal
Transform Palante from a utility into a nurturing daily companion that earns connection rather than demands attention.

---

## Feature 1: Grace Days & Rest (Streak Reframing)

### Backend Changes
- **UserProfile Type**: Add `restDays: string[]` (ISO date strings)
- **Streak Logic**: Modify streak calculation to preserve streaks when rest days are marked
- **Grace Period**: Allow 1 missed day before showing "Rest Day" prompt

### UI Components
- **RestDayModal**: Appears when user returns after missing a day
  - Warm message: "We missed you yesterday. Did you take a well-deserved rest day?"
  - Two options: "Yes, I rested" (preserves streak) | "I just forgot" (gentle acknowledgment)
- **Progress Page**: Show rest days as special markers (different icon) in streak calendar

### Files to Modify
- `src/types.ts` - Add restDays field
- `src/utils/streakCalculator.ts` - Update logic
- `src/components/RestDayModal.tsx` - [NEW]
- `src/App.tsx` - Add rest day detection logic

---

## Feature 2: Context-Aware Golden Hours

### Morning Mode
**Trigger**: First app open before 12 PM
**UI**: Simplified "Morning Mode" overlay
- Large quote card (no history/settings buttons)
- Single CTA: "5-Minute Meditation"
- Tapping meditation opens directly to 5-min session with intention pre-set to "Morning Clarity"

### Evening Wind-Down
**Trigger**: App open after 9 PM
**UI Changes**:
- Darker theme variant (deeper blacks, muted golds)
- Reduced options (hide goals, hide coach)
- Prominent sleep sounds / meditation access
- Banner: "Wind down for the night 🌙"

### Implementation
- **MorningModeOverlay.tsx** - [NEW] Full-screen morning experience
- **useTimeOfDay.ts** - [NEW] Hook to detect time context
- **App.tsx** - Conditional rendering based on time
- **Theme system** - Add "sleep mode" variant

---

## Feature 3: Letters to Future You

### Core Mechanic
- **Trigger Points**:
  - After completing meditation (reflection modal)
  - After achieving a goal
  - After 7-day streak milestone
- **Prompt**: "You're doing great. Write a note to yourself for a tougher day."
- **Storage**: Letters stored with timestamp, tagged with context (meditation/goal/streak)
- **Delivery**: On low-energy check-in days, show a random past letter

### UI Components
- **LetterWriteModal.tsx** - [NEW] Warm, journal-style input
- **LetterReadModal.tsx** - [NEW] Display past letter with context
- **Integration**: Hook into EnergyCheckIn, Meditation reflection, Goal completion

### Files
- `src/types.ts` - Add `FutureLetters` type
- `src/components/LetterWriteModal.tsx` - [NEW]
- `src/components/LetterReadModal.tsx` - [NEW]
- `src/components/EnergyCheckIn.tsx` - Trigger letter on low energy
- `src/components/Meditation.tsx` - Add letter prompt to reflection

---

## Feature 4: Interactive Widgets (iOS)

### Home Screen Widget
**Type**: Small widget (2x2 grid)
**Content**:
- Current streak number
- Quick energy check-in buttons (3 states: 😊 😐 😟)
- Tapping opens app to relevant flow

**Deep Links**:
- Tap emoji → Opens to breathwork (anxious) or meditation (calm)
- Tap streak → Opens to Progress page

### Implementation
- **iOS Native**: Use Capacitor + Swift WidgetKit
- **Deep Linking**: Configure URL schemes for widget actions
- **Widget Extension**: Create in `ios/App/` directory
- **Data Sync**: Use App Groups to share streak/energy data

### Files
- `ios/App/PalanteWidget/` - [NEW] Widget extension
- `capacitor.config.ts` - Add URL scheme
- `src/App.tsx` - Handle deep link routing

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ Grace Days backend + RestDayModal
2. ✅ Time-of-day detection hook
3. ✅ Morning Mode overlay

### Phase 2: Emotional Connection (Week 2)
4. ✅ Letters to Future You (write + read)
5. ✅ Evening Wind-Down mode
6. ✅ Integration with existing flows

### Phase 3: Zero-Friction Access (Week 3)
7. ✅ iOS Widget setup
8. ✅ Deep linking
9. ✅ Widget UI polish

---

## Success Metrics
- **Daily Active Users**: Target 40% increase
- **Avg Session Length**: Maintain or increase (quality > quantity)
- **7-Day Retention**: Target 60%+
- **User Sentiment**: Qualitative feedback on "nurturing" feel
