/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // ── Core Palette (Palante v7 — locked Apr 2026) ──────────────
                ivory:        '#F2EBE0', // warm parchment — primary light bg
                'ivory-warm': '#EDE3D4', // slightly deeper parchment for cards
                sage:         '#415D43', // forest sage — richer than olive, softer than hunter
                'sage-mid':   '#415D43', // forest sage — modal overlays
                'sage-dark':  '#1F3824', // deepest hunter green — body text on light
                'pale-gold':  '#E5D6A7', // Soft pale gold
                amber:        '#F59E0B', // rich amber — hover states, active gold
                'sand-beige': '#EDE4DA', // legacy alias → ivory-warm
                // ── Earthy Terracotta for Primary CTAs ────────────────────────────
                terracotta: {
                    DEFAULT: '#C96A3A', // Burnt orange
                    300:     '#D4895A', // light terra / hover
                    500:     '#C96A3A', // main terra CTA buttons
                    600:     '#A8521F', // deep terra
                },
                // ── Tier accent colors ────────────────────────────────────────
                'zen-accent':   '#415D43', // Gentle  → forest sage
                'stoic-accent': '#415D43', // Balanced → forest sage
                'grit-accent':  '#C96A3A', // Intense  → terracotta
                // ── Legacy aliases (keep for backwards compat) ────────────────
                'luxe-gold':       '#E5D6A7',
                'warm-gray-green': '#415D43',
                'terra-deep':      '#415D43',
            },
            fontFamily: {
                display: ['Poppins', 'sans-serif'],
                body:    ['Inter', 'sans-serif'],
                serif:   ['Playfair Display', 'serif'], // quote cards, gentle mode
            },
            fontSize: {
                // ── Display scale (quote cards & hero moments) ────────────────
                'display-xl': ['2.25rem',  { lineHeight: '1.0',  letterSpacing: '-0.035em', fontWeight: '800' }], // 36px
                'display-lg': ['1.75rem',  { lineHeight: '1.05', letterSpacing: '-0.03em',  fontWeight: '700' }], // 28px
                'display-md': ['1.25rem',  { lineHeight: '1.15', letterSpacing: '-0.02em',  fontWeight: '600' }], // 20px
                'display-sm': ['1.0625rem',{ lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '400' }], // 17px — serif italic
                // ── Label scale ───────────────────────────────────────────────
                'label-xs':   ['0.5625rem',{ lineHeight: '1.4',  letterSpacing: '0.2em',    fontWeight: '600' }], // 9px — attribution / eyebrow
                'label-sm':   ['0.6875rem',{ lineHeight: '1.4',  letterSpacing: '0.16em',   fontWeight: '500' }], // 11px — section labels
            },
            letterSpacing: {
                'display':  '-0.03em',
                'display-xl': '-0.035em',
                'caps':     '0.18em',
                'caps-lg':  '0.22em',
            },
            boxShadow: {
                'spa':     '0 4px 12px rgba(0, 0, 0, 0.08)',
                'spa-lg':  '0 8px 24px rgba(0, 0, 0, 0.12)',
                'terra':   '0 8px 30px rgba(65, 93, 67, 0.35)', // Forest sage glow
                'terra-lg':'0 12px 40px rgba(65, 93, 67, 0.45)',
                'sage':    '0 4px 16px rgba(65, 93, 67, 0.25)',
                'popup':   '0 20px 60px -15px rgba(0,0,0,0.6)', // Nice subtle dropshadow for all popups
            },
            keyframes: {
                shimmer: {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                // Terracotta CTA pulse — used on primary buttons (now Olive Green)
                'pulse-terra': {
                    '0%, 100%': { boxShadow: '0 4px 20px rgba(65, 93, 67, 0.35)' },
                    '50%':      { boxShadow: '0 8px 36px rgba(65, 93, 67, 0.60)' },
                },
                // Sage glow — used on focused/active sage elements
                'pulse-sage': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(65, 93, 67, 0.25)' },
                    '50%':      { boxShadow: '0 0 40px rgba(65, 93, 67, 0.50)' },
                },
            },
            animation: {
                shimmer:      'shimmer 2s ease-in-out infinite',
                'pulse-terra':'pulse-terra 2s ease-in-out infinite',
                'pulse-sage': 'pulse-sage 2s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
