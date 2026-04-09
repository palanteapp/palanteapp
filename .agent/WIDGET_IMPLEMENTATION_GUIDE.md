# Feature 4: Interactive Widgets - Implementation Guide

## Overview
iOS Home Screen widgets for quick energy check-ins and deep linking to app features.

## Files Created

### Swift Widget Files (iOS Native)
1. **`ios/App/PalanteWidget/EnergyCheckInWidget.swift`**
   - Main energy check-in widget
   - Small and Medium widget sizes
   - Sage green and pale gold branding
   - Battery icons for energy levels (1-5)
   - Interactive buttons for quick updates (iOS 17+)

2. **`ios/App/PalanteWidget/WidgetIntents.swift`**
   - `UpdateEnergyIntent`: Updates energy level via widget
   - `OpenPalanteAppIntent`: Deep links to app sections
   - `WidgetIntentsProvider`: Helper methods

3. **`ios/App/PalanteWidget/PalanteWidgetBundle.swift`**
   - Main widget bundle entry point
   - Registers all available widgets

### TypeScript Integration Files
4. **`src/utils/widgetDataSync.ts`**
   - `WidgetDataSync.updateEnergy()`: Syncs energy to shared storage
   - `WidgetDataSync.updateStreak()`: Syncs streak count
   - `WidgetDataSync.updateQuote()`: Syncs daily quote
   - Uses Capacitor Preferences for data sharing

## Xcode Configuration Required

### Step 1: Create Widget Extension Target
1. Open `ios/App/App.xcworkspace` in Xcode
2. File → New → Target
3. Select "Widget Extension"
4. Name: `PalanteWidget`
5. Language: Swift
6. Include Configuration Intent: ✅ (for iOS 17+ interactive widgets)

### Step 2: Add Widget Files to Target
1. Drag the following files into the `PalanteWidget` folder in Xcode:
   - `EnergyCheckInWidget.swift`
   - `WidgetIntents.swift`
   - `PalanteWidgetBundle.swift`
2. Ensure they're added to the `PalanteWidget` target (not the main App target)

### Step 3: Configure App Groups
Widgets need shared data access via App Groups.

**In Main App Target:**
1. Select `App` target → Signing & Capabilities
2. Click `+ Capability` → App Groups
3. Add: `group.com.palante.app`

**In Widget Target:**
1. Select `PalanteWidget` target → Signing & Capabilities
2. Click `+ Capability` → App Groups
3. Add: `group.com.palante.app` (same as main app)

### Step 4: Update Info.plist (Widget Target)
Add to `PalanteWidget/Info.plist`:
```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
</dict>
```

### Step 5: Configure Deep Linking (Main App) (✅ COMPLETED)
(Already configured in `App/Info.plist`)

### Step 6: Handle Deep Links in AppDelegate (✅ COMPLETED)
(Already configured in `ios/App/App/AppDelegate.swift`)

## Web App Integration

### Update Energy Handler
Wherever energy is updated in the app, add widget sync:

```typescript
import { WidgetDataSync } from '../utils/widgetDataSync';

// When user updates energy
const handleEnergyUpdate = async (level: 1 | 2 | 3 | 4 | 5) => {
    // Update user profile
    updateProfile({
        ...user,
        currentEnergy: level
    });
    
    // Sync to widget
    await WidgetDataSync.updateEnergy(level);
};
```

### Listen for Deep Links
Add to `App.tsx`:

```typescript
import { App as CapacitorApp } from '@capacitor/app';

useEffect(() => {
    // Listen for deep links from widgets
    CapacitorApp.addListener('appUrlOpen', (event) => {
        const url = new URL(event.url);
        const path = url.host;
        
        // Handle deep link navigation
        switch (path) {
            case 'home':
                setActiveTab('home');
                break;
            case 'meditate':
                setActiveTab('meditate');
                break;
            case 'progress':
                setActiveTab('momentum');
                break;
            // Add more cases as needed
        }
    });

    return () => {
        CapacitorApp.removeAllListeners();
    };
}, []);
```

## Widget Features

### Energy Check-In Widget

**Small Widget:**
- Shows current energy level with battery icon
- Displays energy label (Low, Steady, Strong, Peak)
- Tap to open app

**Medium Widget:**
- Shows current energy level
- 4 quick-action buttons (levels 2-5)
- Tap button to instantly update energy
- Opens app for full experience

### Design Specifications

**Colors:**
- Background: Sage green gradient (`#6B8E6F` with opacity)
- Accent: Pale gold (`#D4AF37`)
- Text: System colors for accessibility

**Icons:**
- Energy levels use SF Symbols battery icons
- Consistent with app's visual language

## Testing

### In Simulator
1. Build and run the widget extension target
2. Long-press on home screen → Add Widget
3. Search for "Palante"
4. Add Energy Check-In widget
5. Test interactions

### On Device
1. Connect iOS device
2. Select device in Xcode
3. Build and run
4. Add widget to home screen
5. Test energy updates sync between app and widget

## Future Enhancements

### Quote Widget (Not Yet Implemented)
- Display daily motivational quote
- Medium/Large sizes
- Tap to open app and see full quote

### Streak Widget (Not Yet Implemented)
- Show current streak count
- Flame icon animation
- Tap to open Progress page

### Implementation Pattern:
1. Create new widget file (e.g., `QuoteWidget.swift`)
2. Add to `PalanteWidgetBundle.swift`
3. Create corresponding data sync methods in `widgetDataSync.ts`
4. Update app to sync data when quote/streak changes

## Troubleshooting

### Widget Not Appearing
- Ensure widget target is properly configured in Xcode
- Check App Groups are identical in both targets
- Verify widget is added to bundle in `PalanteWidgetBundle.swift`

### Data Not Syncing
- Confirm App Groups capability is enabled
- Check UserDefaults suite name matches: `group.com.palante.app`
- Verify data is being written in web app via `widgetDataSync.ts`

### Deep Links Not Working
- Check URL scheme is registered in Info.plist
- Verify AppDelegate is handling URLs
- Test with: `xcrun simctl openurl booted palante://home`

## Build Commands

```bash
# Build for iOS (includes widgets)
npm run build
npx cap sync ios
npx cap open ios

# In Xcode:
# 1. Select "App" scheme
# 2. Build and run (Cmd+R)
# 3. Widgets will be available on device/simulator
```

## Notes

- Widgets require iOS 14+
- Interactive widgets require iOS 17+
- Widgets refresh based on timeline policy (every 30 min for energy widget)
- Widget data is read-only from shared storage
- App must be running to handle deep links
