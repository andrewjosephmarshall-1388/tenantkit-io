import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable debugging to see console output
  debug: process.env.NODE_ENV === "development",

  // Replay settings (only in production)
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,

  // Ignore common non-errors
  ignoreErrors: [
    /Loading chunk \d+ failed/,
    /Network request failed/,
  ],
});