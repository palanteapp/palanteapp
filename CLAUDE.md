# Palante – Claude Code Working Directory

**ALWAYS work from `/Users/michaelvargas/Developer/Palante/`.**

This is the only active codebase. Never read from or write to:
- `/Users/michaelvargas/Documents/AntiG/Palante App – CURRENT (TestFlight Apr 2026)/`
- Any other Palante folder under Documents or AntiG

Build commands:
```bash
cd /Users/michaelvargas/Developer/Palante
npm run build && npx cap sync ios && npx cap open ios
```

## Design System (locked)
- Primary CTA: terracotta `#C96A3A` — ONE dominant action per screen
- Dark mode bg: olive `#3A3D2E`
- Parchment card: `#FAF7F3`, gold border `rgba(212,184,130,0.5)`
- NO emojis anywhere
- Fonts: Poppins 700 headings / Inter 400 body
- See memory file for full spec
