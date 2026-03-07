const ENABLE_TELEMETRY = !!import.meta.env.VITE_ENABLE_TELEMETRY;

export function reportError(err: any, ctx?: Record<string, any>) {
  if (!ENABLE_TELEMETRY) return;
  try {
    // Placeholder: wire to Sentry/LogRocket/any service here
    // e.g., Sentry.captureException(err, { extra: ctx });
    // For now, console.info so devs can enable if desired
    console.info('[telemetry] reportError', { err, ctx });
  } catch (e) {
    // noop
  }
}

export default { reportError };
