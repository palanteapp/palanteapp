# Phase 2: Simplify Onboarding & Feature Discovery

**Goal:** Reduce friction in onboarding and prevent feature overwhelm  
**Timeline:** Week 1-2 (After Phase 1 completion)  
**Status:** 🔄 **READY TO START**

---

## 🎯 Core Objectives

1. **Consolidate onboarding** - One simple flow, not multiple modals
2. **Progressive disclosure** - Show 3 core features first, unlock more later
3. **Fast time-to-value** - User sees personalized content in <60 seconds

---

## 📋 Phase 2A: Single, Fast Onboarding Flow

### **Current Problem:**
Multiple onboarding experiences create friction and confusion:
- `CinematicIntro.tsx` - Initial welcome
- `WelcomeCarousel.tsx` - Feature tour
- `WelcomeOrientationModal.tsx` - Another welcome screen
- `VibeCheck.tsx` - Tier selection (now in settings)
- `AgeVerificationModal.tsx` - Age gate

**Result:** Users see 5+ screens before getting value.

---

### **Proposed Solution:**

#### **New Onboarding Flow (3 Screens):**

**Screen 1: Welcome**
```
Welcome to Palante
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your daily toolkit for feeling better 
and doing what you love.

[What should we call you?]
_________________________________

                              [Continue →]
```

**Screen 2: Personalization**
```
What are you interested in?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Select a few topics that resonate:

[Wellness]  [Productivity]  [Creativity]
[Growth]    [Mindfulness]   [Leadership]
[Focus]     [Balance]       [Purpose]

                              [Continue →]
```

**Screen 3: Content Preference**
```
How would you like your motivation?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Affirmations
   Power statements for confidence

💬 Quotes
   Wisdom & insight from thinkers

🌀 Both
   Balanced mix

                              [Let's Go! →]
```

**Result:** User immediately sees their first personalized quote.

---

### **What to Remove/Consolidate:**

| Component | Action | Reason |
|-----------|--------|--------|
| `CinematicIntro.tsx` | ✅ Keep & Simplify | Main onboarding entry |
| `WelcomeCarousel.tsx` | ❌ Delete | Redundant feature tour |
| `WelcomeOrientationModal.tsx` | ❌ Delete | Redundant welcome |
| `VibeCheck.tsx` | ⚪ Move to Settings | Not needed in onboarding |
| `AgeVerificationModal.tsx` | ⚪ Move to Settings | Not critical for first use |

---

### **Implementation Plan:**

#### **Step 1: Simplify CinematicIntro.tsx**
- Remove tier selection (auto-assign based on content preference)
- Remove profession field (move to settings)
- Reduce to 3 screens max
- Focus on: Name → Interests → Content Type

#### **Step 2: Delete Redundant Components**
- Delete `WelcomeCarousel.tsx`
- Delete `WelcomeOrientationModal.tsx`
- Remove their imports from `App.tsx`

#### **Step 3: Move Non-Essential to Settings**
- Move `VibeCheck` to Profile settings (already there)
- Move `AgeVerificationModal` to Profile settings
- Make these opt-in, not required

#### **Step 4: Auto-Assign Tier**
Instead of asking users to pick "Gentle/Direct/Intense":
```typescript
// Auto-assign based on content preference
if (contentType === 'affirmations') tier = 1; // Gentle
if (contentType === 'quotes') tier = 2; // Balanced
if (contentType === 'mix') tier = 2; // Balanced
```

Users can change this later in settings if needed.

---

## 📋 Phase 2B: Progressive Feature Disclosure

### **Current Problem:**
Users see **all 25+ features** at once on the dashboard:
- Morning Practice
- Momentum
- Breathwork
- Meditation
- Reflections
- Fasting
- Koi Pond
- Clear the Noise
- Routine Stacks
- Accountability Partners
- AI Coach
- Library
- Soundscapes
- etc.

**Result:** Overwhelm, analysis paralysis, abandonment.

---

### **Proposed Solution:**

#### **Day 1-3: Core Features Only**
Show only these 3 features:
1. **Daily Quote/Affirmation** (Dashboard)
2. **Morning Practice** (Gratitude + Affirmations)
3. **Today's Goals** (Momentum page)

Hide everything else behind a "Explore More" button.

#### **Day 4+: Unlock Secondary Features**
After 3 days of use, show:
4. **Breathwork Station**
5. **Meditation**
6. **Reflections/Journaling**

#### **Always in Settings: Advanced Features**
Keep these opt-in:
7. Fasting Timer
8. Routine Stacks
9. Accountability Partners
10. Koi Pond
11. Clear the Noise
12. Soundscapes

---

### **Implementation Plan:**

#### **Step 1: Add Feature Gating Logic**
```typescript
// In types.ts
interface UserProfile {
  // ... existing fields
  daysActive: number; // Track days since signup
  unlockedFeatures: string[]; // ['breathwork', 'meditation', etc.]
}

// In App.tsx
const showBreathwork = user.daysActive >= 3 || user.unlockedFeatures.includes('breathwork');
const showMeditation = user.daysActive >= 3 || user.unlockedFeatures.includes('meditation');
```

#### **Step 2: Create "Explore More" Section**
```tsx
{user.daysActive < 3 && (
  <div className="explore-more">
    <h3>More features unlock in {3 - user.daysActive} days!</h3>
    <p>Focus on the basics first. We'll introduce more tools when you're ready.</p>
  </div>
)}
```

#### **Step 3: Update Dashboard Layout**
- **Day 1-3:** Show only Quote + Morning Practice + Goals
- **Day 4+:** Show Breathwork + Meditation + Reflections
- **Always:** Settings button for advanced features

---

## 📊 Files to Modify

### **Phase 2A (Onboarding):**
| File | Action | Complexity |
|------|--------|------------|
| `src/components/CinematicIntro.tsx` | Simplify to 3 screens | Medium |
| `src/components/WelcomeCarousel.tsx` | Delete | Low |
| `src/components/WelcomeOrientationModal.tsx` | Delete | Low |
| `src/App.tsx` | Remove deleted component imports | Low |
| `src/types.ts` | Update onboarding state | Low |

### **Phase 2B (Feature Gating):**
| File | Action | Complexity |
|------|--------|------------|
| `src/types.ts` | Add `daysActive`, `unlockedFeatures` | Low |
| `src/App.tsx` | Add feature gating logic | Medium |
| `src/components/Profile.tsx` | Add "Explore More" section | Medium |
| `src/utils/featureGating.ts` | Create helper functions | Low |

---

## ✅ Success Metrics

### **Onboarding (Phase 2A):**
- ✅ User completes onboarding in **<60 seconds**
- ✅ **90%+ completion rate** (down from current ~70%)
- ✅ User sees **first personalized quote immediately**
- ✅ **Zero confusion** about what to do next

### **Feature Discovery (Phase 2B):**
- ✅ New users focus on **3 core features** first
- ✅ **80%+ engagement** with core features (quote, gratitude, goals)
- ✅ **<20% overwhelm** (measured by feature abandonment)
- ✅ Users **discover features progressively**, not all at once

---

## 🚀 Implementation Order

### **Week 1:**
1. ✅ Simplify `CinematicIntro.tsx` (3 screens max)
2. ✅ Delete `WelcomeCarousel.tsx`
3. ✅ Delete `WelcomeOrientationModal.tsx`
4. ✅ Test onboarding flow

### **Week 2:**
5. ✅ Add `daysActive` tracking to `UserProfile`
6. ✅ Implement feature gating in `App.tsx`
7. ✅ Create "Explore More" section
8. ✅ Test progressive disclosure

---

## 🎯 User Experience Goals

### **Before Phase 2:**
```
User opens app
  → Sees 5 onboarding screens
  → Confused by 25+ features
  → Overwhelmed, abandons app
```

### **After Phase 2:**
```
User opens app
  → 3 simple onboarding screens (<60s)
  → Sees first personalized quote
  → Focuses on 3 core features
  → Discovers more features when ready
  → Feels supported, not overwhelmed
```

---

## 🤔 Questions to Consider

1. **Auto-assign tier or let user choose?**
   - Recommendation: Auto-assign, let them change in settings later

2. **3 days or 7 days to unlock features?**
   - Recommendation: 3 days (faster engagement)

3. **Which features are "core" vs "secondary"?**
   - Core: Quote, Morning Practice, Goals
   - Secondary: Breathwork, Meditation, Reflections
   - Advanced: Everything else

4. **Should we delete WelcomeCarousel or just hide it?**
   - Recommendation: Delete (reduces code complexity)

---

## 📝 Next Steps

**Ready to proceed with Phase 2?**

1. **Phase 2A:** Simplify onboarding (1-2 days)
2. **Phase 2B:** Progressive feature disclosure (2-3 days)
3. **Testing:** Verify flow with fresh user state

**Estimated Time:** 3-5 days total

---

**Status:** ⏳ **AWAITING USER APPROVAL**  
**Blockers:** None  
**Dependencies:** Phase 1 complete ✅
