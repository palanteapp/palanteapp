import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'

import { ThemeProvider } from './contexts/ThemeContext'
import { initAnalytics } from './utils/analytics'
import * as Sentry from '@sentry/capacitor'
import * as SentryReact from '@sentry/react'

// Sentry is gated on DSN presence: dev builds without it run clean.
// Create a project at sentry.io, copy the DSN, and paste it into your env files.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init(
    {
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: 'palante@1.0.0',
      tracesSampleRate: 0.1,
    },
    SentryReact.init
  )
}

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" honors the OS Reduce Motion setting: transform/layout
        animations become instant while opacity transitions stay gentle. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
)
