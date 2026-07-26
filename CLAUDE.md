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
- Primary CTA: terracotta `#C96A3A` — ONE dominant action per screen
- Dark mode bg: olive `#3A3D2E`
- Parchment card: `#FAF7F3`, gold border `rgba(212,184,130,0.5)`
- NO emojis anywhere
- Fonts: Poppins 700 headings / Inter 400 body
- See memory file for full spec
