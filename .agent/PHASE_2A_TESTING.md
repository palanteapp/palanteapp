# Phase 2A Testing Guide

## 🧪 How to Test the New Onboarding

### **Step 1: Clear Onboarding Flag**

Open browser console (Chrome DevTools) and run:
```javascript
localStorage.removeItem('palante_intro_seen')
```

Then refresh the page.

---

### **Step 2: Test Onboarding Flow**

#### **Screen 1: Welcome**
- ✅ See Palante logo with glow effect
- ✅ See "Your daily toolkit for feeling better"
- ✅ See "Tap to begin" text
- ✅ Tap anywhere to continue

#### **Screen 2: Name + Interests**
- ✅ See "Let's personalize your experience"
- ✅ Enter your name
- ✅ Select 1-3 interests (try selecting 4, should max at 3)
- ✅ "Continue" button should be disabled until name + 1 interest
- ✅ Click "Continue →"

#### **Screen 3: Content + Intensity**
- ✅ See "How would you like your motivation?"
- ✅ Select content style (Affirmations/Quotes/Both)
- ✅ Select intensity (Gentle/Balanced/Intense)
- ✅ Verify new tier names (NOT "Muse/Focus/Fire")
- ✅ Click "Let's Go! →"

#### **Result:**
- ✅ Should enter app with personalized quote
- ✅ Total time: <60 seconds

---

### **Step 3: Verify Personalization**

After completing onboarding:

1. **Check greeting:**
   - Should say "Good morning, [Your Name]"

2. **Check quote relevance:**
   - Should relate to selected interests

3. **Check tone:**
   - Gentle: Calm, poetic language
   - Balanced: Clear, direct language
   - Intense: High-energy, no-nonsense language

4. **Check content type:**
   - Affirmations: "I am..." statements
   - Quotes: Wisdom from thinkers
   - Both: Mix of both

---

### **Step 4: Verify Settings**

Go to Settings (Profile) and check:

1. **Name:** Should be saved
2. **Interests:** Should be saved as comma-separated
3. **Content Type:** Should match selection
4. **Intensity:** Should match selection (tier 1/2/3)

---

### **Step 5: Verify Defaults**

Check that these were auto-filled:

```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('palante_user_profile') || '{}');
console.log({
  profession: user.profession, // Should be 'Other'
  focusGoal: user.focusGoal, // Should be ''
  sourcePreference: user.sourcePreference, // Should be 'mix'
  ageRange: user.ageRange // Should be undefined
});
```

---

## 🐛 Common Issues

### **Issue: Changes not showing**
**Solution:** Hard refresh (Cmd+Shift+R) or clear cache

### **Issue: Old onboarding still showing**
**Solution:** Make sure you cleared `palante_intro_seen` flag

### **Issue: Can't select interests**
**Solution:** Check console for errors, verify state management

### **Issue: Tier names still show "Muse/Focus/Fire"**
**Solution:** Check if file saved correctly, verify imports

---

## ✅ Success Criteria

- [ ] Onboarding completes in <60 seconds
- [ ] All 3 screens display correctly
- [ ] Interest selection works (max 3)
- [ ] Tier names are updated (Gentle/Balanced/Intense)
- [ ] Personalization is preserved
- [ ] No console errors
- [ ] Smooth transitions between screens
- [ ] Progress dots update correctly

---

## 📸 Screenshots to Verify

Take screenshots of:
1. Screen 1 (Welcome)
2. Screen 2 (Name + Interests with 3 selected)
3. Screen 3 (Content + Intensity selected)
4. First quote after onboarding

---

## 🔄 To Reset and Test Again

```javascript
// Clear all onboarding data
localStorage.removeItem('palante_intro_seen');
localStorage.removeItem('palante_user_profile');
localStorage.removeItem('disclaimerAccepted');

// Refresh page
location.reload();
```

---

**Ready to test!** 🚀
