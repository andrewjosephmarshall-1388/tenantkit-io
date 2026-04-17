'use client'
import { useEffect } from 'react'

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Import and init Sentry on client side
    import('@sentry/nextjs').then((Sentry) => {
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          replaysOnErrorSampleRate: 0.1,
          replaysSessionSampleRate: 0.01,
          ignoreErrors: [
            /Loading chunk \d+ failed/,
            /Network request failed/,
          ],
        })
      }
    }).catch(() => {
      // Sentry not configured, ignore
    })
  }, [])

  return <>{children}</>
}