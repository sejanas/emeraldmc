# Sentry Roadmap

Purpose
- Capture uncaught exceptions, promise rejections and performance traces in production.
- Provide actionable stack traces and user/session context to speed debugging of real-world errors.

When to add
- Add when you have a live environment (staging/production) where users exercise features not covered by tests.
- Keep disabled during local development until you have a DSN and a privacy policy in place.

High-level plan
1. Add packages (only when ready):

   npm install --save @sentry/react @sentry/tracing

2. Expose two env vars in your deployment config (never commit secrets):

   VITE_ENABLE_TELEMETRY=true
   VITE_SENTRY_DSN=https://<public_key>@sentry.io/<project_id>

3. Initialize Sentry lazily from `src/lib/telemetry.ts` (already designed for lazy import):

   - Keep `VITE_ENABLE_TELEMETRY` default false.
   - When enabled and `VITE_SENTRY_DSN` is present, dynamically import `@sentry/react` and `@sentry/tracing` and call `Sentry.init({ dsn, integrations: [new Tracing.BrowserTracing()], environment })`.

4. Capture errors from helpers

   - Use the existing `src/lib/error.ts` `handleError()` helper to call `telemetry.reportError(err, { feature })` so server-side and client-side errors get uniform reporting.

5. Instrument key places

   - Global ErrorBoundary (already added at `src/components/ErrorBoundary.tsx`) for render-time errors.
   - Unhandled promise rejections and window.onerror (Sentry handles these when initialized).
   - Optional: wrap React router navigation to attach route info.

6. Performance (optional)

   - Use `@sentry/tracing` to capture Page Load and route-change transactions. Start with samples=0.05 (5%) then tune.

7. Rollout & testing

   - Enable in a private staging environment first.
   - Trigger known errors to verify they appear in Sentry with useful context (user id if available, query params, feature tag).
   - Keep telemetry off for public preview builds until you confirm filtering/PII removal.

8. Privacy & security

   - Do NOT send PII (email, tokens). Strip or hash user identifiers before reporting.
   - Add a short note in your privacy/security docs describing what telemetry you collect and how to opt-out.

9. CI / Deploy notes

   - Provide `VITE_ENABLE_TELEMETRY=true` and `VITE_SENTRY_DSN` only in staging/production env settings.
   - If using Sentry releases, set `SENTRY_RELEASE` or integrate in your CI to upload source maps (optional but recommended for readable stack traces).

10. Rollback

   - If you need to remove Sentry quickly: remove the two packages, unset env vars, and revert `src/lib/telemetry.ts` to a no-op.

Reference snippets

Initialize (example - dynamic import inside `telemetry.ts`):

```ts
const ENABLE = !!import.meta.env.VITE_ENABLE_TELEMETRY;
const DSN = import.meta.env.VITE_SENTRY_DSN;
if (ENABLE && DSN) {
  (async () => {
    const Sentry = await import('@sentry/react');
    const Tracing = await import('@sentry/tracing');
    Sentry.init({ dsn: DSN, integrations: [new Tracing.BrowserTracing()], environment: import.meta.env.MODE });
  })();
}
```

Local test checklist
- Install deps locally and run the app with `VITE_ENABLE_TELEMETRY=true` and `VITE_SENTRY_DSN` set to a Sentry DSN for a sandbox project.
- Trigger a UI error and confirm it appears in Sentry.

Why lazy/dynamic import
- Avoid bundling Sentry into dev/local builds and reduce production bundle size unless telemetry is actually enabled.
- Keeps developer experience fast while making it easy to enable telemetry in deployed environments.

Next steps (if you want me to):
- Add a short README entry at `/roadmap/README.md` describing env vars and rollout steps.
- Re-add Sentry deps and wire a commented example in `telemetry.ts` ready to enable via env.
