# Phase 2A: Onboarding Simplification - Ready to Implement

## Current State

### **CinematicIntro.tsx** (507 lines)
**Screen 1:** Logo reveal + "Tap to begin"  
**Screen 2:** Long form with:
- ✅ Name (keep)
- ❌ Profession (remove)
- ❌ Focus Goal (remove)
- ❌ Vibe/Tier selection (remove - auto-assign)
- ✅ Style (quotes/affirmations/mix) (keep)
- ✅ Quote Source (human/AI/mix) (keep)
- ❌ Age Range (move to settings)

**Issues:**
- Still shows "Muse/Focus/Fire" tier names (Phase 1B missed this!)
- Too many fields (8 fields total)
- Takes >60 seconds to complete

---

## Proposed Changes

### **Simplify CinematicIntro to 3 Screens:**

**Screen 1: Welcome**
```
[Logo]
Palante
Your daily toolkit for feeling better

[Tap to begin]
```

**Screen 2: Name + Interests**
```
Let's personalize your experience

Name: [_____________]

What are you interested in?
[Wellness] [Productivity] [Creativity]
[Growth] [Mindfulness] [Leadership]

[Continue →]
```

**Screen 3: Content Preference**
```
How would you like your motivation?

[Quotes - Wisdom & insight]
[Affirmations - Power statements]
[Both - Balanced mix]

Quote Source:
[Human - Classic] [Coach - Personal] [Both]

[Let's Go! →]
```

---

### **Auto-Assign Tier Logic:**
```typescript
// Based on content preference
if (contentType === 'affirmations') tier = 1; // Gentle
if (contentType === 'quotes') tier = 2; // Balanced  
if (contentType === 'mix') tier = 2; // Balanced
```

Users can change this later in Settings.

---

### **Delete Redundant Components:**

1. **WelcomeCarousel.tsx** (625 lines) - DELETE
   - Redundant with CinematicIntro
   - Remove from App.tsx imports
   - Remove `showWelcome` state

2. **WelcomeOrientationModal.tsx** (238 lines) - DELETE
   - Feature tour not needed
   - Remove from App.tsx imports
   - Remove `showWelcomeOrientation` state

---

## Implementation Steps

### **Step 1: Update CinematicIntro.tsx** ⏳
- Remove profession field
- Remove focus goal field
- Remove tier selection UI (auto-assign)
- Remove age range field
- Simplify to 3 screens
- Update tier names if any remain visible

### **Step 2: Delete WelcomeCarousel.tsx** ⏳
- Delete file
- Remove import from App.tsx
- Remove `showWelcome` state
- Remove `handleWelcomeComplete` logic

### **Step 3: Delete WelcomeOrientationModal.tsx** ⏳
- Delete file
- Remove import from App.tsx
- Remove `showWelcomeOrientation` state

### **Step 4: Update App.tsx** ⏳
- Remove deleted component imports
- Simplify onboarding state management
- Update `handleIntroComplete` to handle auto-tier assignment

### **Step 5: Test** ⏳
- Clear `localStorage.removeItem('palante_intro_seen')`
- Test fresh onboarding flow
- Verify <60 second completion
- Verify tier auto-assignment works

---

## Expected Impact

### **Before:**
- 3 separate onboarding flows
- 8+ form fields
- 5+ screens total
- ~2-3 minutes to complete
- Tier names visible ("Muse/Focus/Fire")

### **After:**
- 1 streamlined onboarding
- 3 essential fields (name, interests, content type)
- 3 screens total
- <60 seconds to complete
- No tier names visible

---

## Files to Modify

| File | Action | Lines Changed |
|------|--------|---------------|
| `CinematicIntro.tsx` | Simplify | ~200 lines removed |
| `WelcomeCarousel.tsx` | Delete | 625 lines removed |
| `WelcomeOrientationModal.tsx` | Delete | 238 lines removed |
| `App.tsx` | Update | ~50 lines modified |

**Total:** ~1,100 lines of code removed! 🎉

---

## Ready to Proceed?

This is a significant change. Should I:
1. ✅ Proceed with all changes
2. ⏸️ Do Step 1 first (simplify CinematicIntro), then review
3. ❌ Revise the plan

**Recommendation:** Proceed with Step 1 first, test it, then continue with deletions.
