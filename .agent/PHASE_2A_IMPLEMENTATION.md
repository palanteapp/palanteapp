# Phase 2A Implementation Plan

## Current State Analysis

### **Onboarding Components:**
1. **`CinematicIntro.tsx`** - NOT FOUND (might be in different location)
2. **`WelcomeCarousel.tsx`** - 625 lines, complex multi-step form
3. **`WelcomeOrientationModal.tsx`** - 238 lines, feature tour modal

### **App.tsx State:**
- `showWelcome` - Controls WelcomeCarousel
- `showWelcomeOrientation` - Controls WelcomeOrientationModal  
- `showIntroSequence` - Controls cinematic intro (not found yet)
- `showVibeCheck` - Tier selection modal

### **Onboarding Flow:**
```
showIntroSequence (cinematic) 
  → showWelcome (WelcomeCarousel)
  → showWelcomeOrientation (feature tour)
  → showVibeCheck (tier selection)
```

---

## Implementation Steps

### **Step 1: Locate CinematicIntro** ✅
- Search for the actual intro component
- Understand its current structure

### **Step 2: Simplify WelcomeCarousel** 🔄
- Reduce from ~10 screens to 3 screens:
  1. Name
  2. Interests (tags)
  3. Content preference
- Remove: profession, age, gender, tier selection
- Auto-assign tier based on content preference

### **Step 3: Delete WelcomeOrientationModal** ⏳
- Remove component file
- Remove from App.tsx imports
- Remove state management

### **Step 4: Update App.tsx** ⏳
- Remove deleted component imports
- Simplify onboarding state
- Update handleWelcomeComplete logic

### **Step 5: Test** ⏳
- Clear localStorage
- Test fresh onboarding flow
- Verify <60 second completion

---

## Next Action
Search for CinematicIntro component location
