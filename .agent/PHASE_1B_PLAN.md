# Phase 1B: Hide Tier Names from UI

**Goal:** Remove "Muse/Focus/Fire" labels from the UI while keeping the tier system (1, 2, 3) functional for content personalization.

---

## Strategy

**Keep:**
- ✅ Tier system (1, 2, 3) in backend
- ✅ Content filtering by tier
- ✅ Personalization logic

**Remove:**
- ❌ "Muse" label
- ❌ "Focus" label  
- ❌ "Fire" label
- ❌ Tier descriptions ("Gentle & nurturing", "Balanced motivation", etc.)

**Replace With:**
- ✅ Simple, supportive language
- ✅ "What type of motivation would you like today?"
- ✅ Descriptive options without tier names

---

## Files to Update

### 1. **VibeCheck.tsx** (Settings Modal)
**Current:**
```tsx
{ label: 'Muse', desc: 'Gentle & nurturing' }
{ label: 'Focus', desc: 'Balanced motivation' }
{ label: 'Fire', desc: 'No-nonsense intensity' }
```

**New:**
```tsx
{ label: 'Gentle & Nurturing', desc: 'Calm, poetic inspiration' }
{ label: 'Balanced & Clear', desc: 'Direct, focused motivation' }
{ label: 'Intense & Direct', desc: 'No-nonsense energy' }
```

### 2. **WelcomeCarousel.tsx** (Onboarding)
**Current:**
```tsx
{ id: 1, label: 'Muse', desc: 'Gentle & poetic' }
{ id: 2, label: 'Focus', desc: 'Direct & clear' }
{ id: 3, label: 'Flame', desc: 'Intense & bold' }
```

**New:**
```tsx
{ id: 1, label: 'Gentle & Poetic', desc: 'Calm inspiration' }
{ id: 2, label: 'Direct & Clear', desc: 'Focused motivation' }
{ id: 3, label: 'Intense & Bold', desc: 'High energy' }
```

### 3. **EnergyCheckIn.tsx** (If it shows tier selection)
- Update any tier name references
- Use descriptive language instead

### 4. **QuoteCardGenerator.tsx**
**Current:**
```tsx
quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire'
```

**Keep as is** - This is backend logic, not user-facing

### 5. **Data Files** (affirmations.ts, quotes.ts, etc.)
**Keep as is** - These are backend data structures

---

## Implementation Steps

1. ✅ Update VibeCheck.tsx labels and descriptions
2. ✅ Update WelcomeCarousel.tsx tier selection
3. ✅ Update EnergyCheckIn.tsx (if needed)
4. ✅ Search for any other tier name displays
5. ✅ Test that tier system still works for content filtering
6. ✅ Verify personalization still functions

---

## Success Criteria

- [ ] No "Muse/Focus/Fire" labels visible to users
- [ ] Tier selection still works (1, 2, 3 in backend)
- [ ] Content filtering by tier still functions
- [ ] Onboarding flow still allows tier selection
- [ ] Settings modal still allows tier changes
- [ ] Language is supportive and descriptive

---

## Philosophy

**Before:**
- "Choose your tier: Muse, Focus, or Fire"
- Feels like a hierarchy or judgment

**After:**
- "What type of motivation would you like today?"
- Feels like a personal preference, not a level

---

**This removes the second guilt trigger: the feeling of being "judged" by tier names.**
