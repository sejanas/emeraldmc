import telemetry from './telemetry';

export function userMessageFromError(err: any) {
  if (!err) return 'An unknown error occurred.';
  // Supabase errors often have message property
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.error) return String(err.error);
  return 'An unexpected error occurred.';
}

export function handleError(err: any, context?: { feature?: string }) {
  const message = userMessageFromError(err);
  // Send to telemetry for later inspection (no-op unless configured)
  try {
    telemetry.reportError(err, { feature: context?.feature });
  } catch (e) {
    // swallow telemetry errors
  }
  return message;
}

export default { userMessageFromError, handleError };
