# Palante – Claude Code Working Directory

**ALWAYS work from `/Users/michaelvargas/Developer/Palante/`.**

This is the only active codebase. Never read from or write to:
- `/Users/michaelvargas/Documents/AntiG/Palante App – CURRENT (TestFlight Apr 2026)/`
- Any other Palante folder under Documents or AntiG

Build commands:
```bash
cd /Users/michaelvargas/Developer/Palante
npm run build && npm run sync:ios && npx cap open ios
```

**Use `npm run sync:ios`, never a bare `npx cap sync ios`.** The three app-local native
bridges (`PalanteHealthBridgePlugin`, `PalanteAudioBridgePlugin`, `PalanteWidgetBridgePlugin`)
are Swift classes in the app target rather than npm packages, so `cap sync` strips them out
of `ios/App/App/capacitor.config.json` every time it runs. `sync:ios` re-adds them via
`scripts/patch-capacitor-config.cjs`. Skip it and HealthKit reads, the audio bridge, and the
home-screen widget all fail silently at runtime with no build error.

## Design System (locked)
- **Dark mode only.** `isDarkMode` is hardcoded true in `ThemeContext.tsx`; light mode is
  unreachable dead code (no toggle, no persistence, no system-preference read). Every
  `isDarkMode ? … : …` light-mode branch in the codebase never executes — don't design
  against it, and don't "fix" it into terracotta without checking whether it's actually reachable.
- Primary CTA: **pale-gold** (`bg-pale-gold` / `text-sage-dark` on it) — this is what every
  screen's real dominant action renders as. Terracotta `#C96A3A` is a secondary/utility
  accent (icons, badges, small highlights) — not the primary action color in practice, even
  though it was originally spec'd that way for a light mode that never shipped.
- Dark surface: `sage-mid` (`#415D43`) is the actual background in use, not olive.
- NO emojis anywhere
- Fonts: Poppins 700 headings / Inter 400 body
- See memory file for full spec
